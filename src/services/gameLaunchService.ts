import { spawn, ChildProcess } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { Profile } from '../renderer/services/profileService';
import { minecraftDownloadService } from './minecraftDownloadService';
import { getLauncherDataPath } from '../utils/paths';
import { logProgressService } from './logProgressService';
import { InstanceConfig } from './enhancedInstanceCreationService';

export type LaunchOptions = {
  javaPath: string;
  mcVersion: string;
  instancePath: string;
  ramMb?: number;
  jvmArgs?: string[];
  gameArgs?: string[];
  userProfile?: Profile;
  windowSize?: {
    width: number;
    height: number;
  };
  loader?: 'vanilla' | 'forge' | 'fabric' | 'quilt' | 'neoforge' | null;
  loaderVersion?: string;
  instanceConfig: InstanceConfig;
};

/**
 * Servicio mejorado para lanzar el juego con el JRE correcto
 */
export class GameLaunchService {
  /**
   * Lanza el juego Minecraft con todas las configuraciones apropiadas
   */
  async launchGame(opts: LaunchOptions): Promise<ChildProcess> {
    try {
      logProgressService.info(`Iniciando lanzamiento de Minecraft ${opts.mcVersion}`, {
        instance: opts.instanceConfig.name,
        javaPath: opts.javaPath,
        ram: opts.ramMb
      });

      // Construir los argumentos para lanzar el juego
      const args = await this.buildLaunchArguments(opts);
      
      logProgressService.info(`Argumentos de lanzamiento construidos (${args.length} argumentos)`, {
        javaPath: opts.javaPath,
        classpathLength: args.filter(arg => arg.startsWith('-cp')).length > 0 ? 'class' : 'jar'
      });

      // Crear el proceso hijo
      const child = spawn(opts.javaPath, args, {
        cwd: opts.instancePath,
        env: {
          ...process.env,
          // Añadir variables de entorno específicas si son necesarias
        }
      });

      // Manejar la salida del proceso
      child.stdout.on('data', (data) => {
        const output = data.toString();
        logProgressService.info(`[Minecraft-OUT] ${output}`, { instance: opts.instanceConfig.name });
        opts.onData?.(output);
      });

      child.stderr.on('data', (data) => {
        const output = data.toString();
        logProgressService.error(`[Minecraft-ERR] ${output}`, { instance: opts.instanceConfig.name });
        opts.onData?.(output);
      });

      child.on('close', (code) => {
        logProgressService.info(`Minecraft cerrado con código: ${code}`, { 
          instance: opts.instanceConfig.name,
          exitCode: code
        });
        opts.onExit?.(code);
      });

      child.on('error', (error) => {
        logProgressService.error(`Error al lanzar Minecraft: ${error.message}`, { 
          instance: opts.instanceConfig.name,
          error: error.message
        });
        opts.onExit?.(null); // Indicar que el proceso falló
      });

      logProgressService.success(`Minecraft lanzado exitosamente para la instancia ${opts.instanceConfig.name}`, {
        instance: opts.instanceConfig.name,
        version: opts.mcVersion,
        pid: child.pid
      });

      return child;
    } catch (error) {
      logProgressService.error(`Error al lanzar Minecraft: ${(error as Error).message}`, {
        instance: opts.instanceConfig.name,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Construye los argumentos de lanzamiento para Minecraft
   */
  async buildLaunchArguments(opts: LaunchOptions): Promise<string[]> {
    // Definir valores por defecto
    const mem = Math.max(512, opts.ramMb || 2048);
    const minMem = Math.min(512, mem / 4); // Usar 1/4 de la RAM máxima como mínima

    // Definir la ruta al directorio de datos del launcher
    const launcherPath = getLauncherDataPath();

    // Definir argumentos JVM (configuración de memoria y optimizaciones)
    let jvmArgs = [
      `-Xms${minMem}m`,    // Memoria inicial
      `-Xmx${mem}m`,       // Memoria máxima
      // Opciones recomendadas para rendimiento
      '-XX:+UseG1GC',
      '-XX:+UnlockExperimentalVMOptions',
      '-XX:+UseG1GC',
      '-XX:MaxGCPauseMillis=100',
      '-XX:+DisableExplicitGC',
      '-XX:TargetSurvivorRatio=90',
      '-XX:G1NewSizePercent=50',
      '-XX:G1MaxNewSizePercent=80',
      '-XX:G1MixedGCLiveThresholdPercent=35',
      '-XX:+AlwaysPreTouch',
      '-XX:+ParallelRefProcEnabled',
      '-XX:MaxInlineLevel=9',
      '-XX:MaxTrivialSize=12',
      '-XX:-DontCompileHugeMethods',
      // Args adicionales si se proporcionaron
      ...(opts.jvmArgs || [])
    ];

    // Determinar el tipo de loader
    const loader = opts.loader || 'vanilla';

    // Para cada tipo de loader, construir el classpath y argumentos específicos
    if (loader === 'vanilla') {
      return await this.buildArgumentsForVanilla(opts, jvmArgs);
    } else {
      return await this.buildArgumentsForModded(opts, loader as 'forge' | 'fabric' | 'quilt' | 'neoforge', jvmArgs);
    }
  }

  /**
   * Construye argumentos para lanzar Minecraft vanilla
   */
  private async buildArgumentsForVanilla(opts: LaunchOptions, jvmArgs: string[]): Promise<string[]> {
    const versionJsonPath = await minecraftDownloadService.downloadVersionMetadata(opts.mcVersion);
    let classpath = path.join(opts.instancePath, 'client.jar'); // Valor por defecto
    let mainClass = 'net.minecraft.client.main.Main'; // Clase principal por defecto (nueva forma)

    // Si existe el archivo version.json, construir classpath y obtener la clase principal correcta
    if (fs.existsSync(versionJsonPath)) {
      try {
        const versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));

        // Obtener la clase principal desde el archivo de versión
        if (versionData.mainClass) {
          mainClass = versionData.mainClass;
        }

        // Obtener la información de las librerías
        const libraryJars: string[] = [];

        if (versionData.libraries && Array.isArray(versionData.libraries)) {
          for (const lib of versionData.libraries) {
            // Verificar reglas de aplicabilidad
            let allowed = true; // Valor por defecto
            let appliesToOS = true;

            if (lib.rules) {
              allowed = false; // Reiniciar valor si hay reglas

              for (const rule of lib.rules) {
                if (rule.os && rule.os.name) {
                  const osName = this.getOSName();
                  if (rule.os.name !== osName) {
                    appliesToOS = false;
                    if (rule.action === 'allow') continue; // Esta regla no aplica en este sistema
                    if (rule.action === 'disallow') {
                      allowed = false;
                      break;
                    }
                  } else {
                    allowed = rule.action === 'allow';
                  }
                } else if (rule.action === 'allow') {
                  allowed = true;
                } else if (rule.action === 'disallow') {
                  allowed = false;
                }
              }

              if (!appliesToOS && lib.rules.some((r: any) => r.os?.name)) continue;
              if (!allowed && lib.rules.some((r: any) => r.action === 'disallow')) continue;
            }
            // Si no hay reglas, allowed sigue siendo true por defecto

            if (lib.downloads && lib.downloads.artifact) {
              // Usar la ruta proporcionada en el artifact.path o construir la ruta tradicional
              let libPath;
              if (lib.downloads.artifact.path) {
                libPath = path.join(getLauncherDataPath(), 'libraries', lib.downloads.artifact.path);
              } else {
                libPath = path.join(getLauncherDataPath(), 'libraries', this.getLibraryPath(lib.name));
              }

              // Probar múltiples ubicaciones posibles
              const possiblePaths = [
                libPath, // Ruta estándar en .DRK Launcher/libraries
                path.join(opts.instancePath, 'libraries', this.getLibraryPath(lib.name)), // En la instancia
                path.join(process.env.APPDATA || '', '.minecraft', 'libraries', this.getLibraryPath(lib.name)), // .minecraft estándar
              ];

              let found = false;
              for (const possiblePath of possiblePaths) {
                if (fs.existsSync(possiblePath)) {
                  libraryJars.push(possiblePath);
                  found = true;
                  break;
                }
              }

              if (!found) {
                logProgressService.warning(`Librería no encontrada: ${lib.name}. Intentando descargar...`);

                // Intentar descargar la librería si no se encuentra
                try {
                  if (lib.downloads.artifact.url) {
                    // Crear carpeta donde debería estar la librería
                    const libDir = path.dirname(libPath);
                    fs.mkdirSync(libDir, { recursive: true });

                    // Descargar la librería directamente
                    const downloadResult = await this.downloadLibrary(lib.downloads.artifact.url, libPath);
                    if (downloadResult && fs.existsSync(libPath)) {
                      libraryJars.push(libPath);
                      logProgressService.success(`Librería descargada: ${lib.name}`);
                      found = true;
                    }
                  }
                } catch (downloadError) {
                  logProgressService.error(`Error al descargar la librería ${lib.name}: ${downloadError}`);
                }

                if (!found) {
                  logProgressService.warning(`No se pudo descargar la librería: ${lib.name}`);
                }
              }
            } else if (lib.url) {
              // Soporte para el formato antiguo de librerías (antes de 1.14)
              const libPath = path.join(getLauncherDataPath(), 'libraries', this.getLibraryPath(lib.name));
              const possiblePaths = [
                libPath,
                path.join(opts.instancePath, 'libraries', this.getLibraryPath(lib.name)),
                path.join(process.env.APPDATA || '', '.minecraft', 'libraries', this.getLibraryPath(lib.name)),
              ];

              let found = false;
              for (const possiblePath of possiblePaths) {
                if (fs.existsSync(possiblePath)) {
                  libraryJars.push(possiblePath);
                  found = true;
                  break;
                }
              }

              if (!found) {
                logProgressService.warning(`Librería no encontrada (formato viejo): ${lib.name}. Intentando descargar...`);

                try {
                  // Crear carpeta donde debería estar la librería
                  const libDir = path.dirname(libPath);
                  fs.mkdirSync(libDir, { recursive: true });

                  // Descargar la librería directamente
                  const downloadResult = await this.downloadLibrary(lib.url, libPath);
                  if (downloadResult && fs.existsSync(libPath)) {
                    libraryJars.push(libPath);
                    logProgressService.success(`Librería (formato viejo) descargada: ${lib.name}`);
                    found = true;
                  }
                } catch (downloadError) {
                  logProgressService.error(`Error al descargar la librería (formato viejo) ${lib.name}: ${downloadError}`);
                }

                if (!found) {
                  logProgressService.warning(`No se pudo descargar la librería (formato viejo): ${lib.name}`);
                }
              }
            }
          }
        }

        // Añadir client.jar
        const clientJar = path.join(opts.instancePath, 'client.jar');
        if (fs.existsSync(clientJar)) {
          libraryJars.push(clientJar);
        }

        if (libraryJars.length > 0) {
          classpath = libraryJars.join(path.delimiter);
        } else {
          logProgressService.warning(`No se encontraron librerías para la versión ${opts.mcVersion}, usando client.jar como fallback`);
        }
      } catch (error) {
        logProgressService.error('Error al leer archivo de versión para construir classpath:', error);
        // Usar valores por defecto
        classpath = path.join(opts.instancePath, 'client.jar');
        mainClass = 'net.minecraft.client.main.Main';
      }
    } else {
      logProgressService.warning(`No se encontró el archivo de versión ${versionJsonPath}, usando configuración mínima`);
      // MANUALLY ADD COMMON LIBRARIES AS A FALLBACK
      const commonLibs = [
          'net.sf.jopt-simple:jopt-simple:5.0.4',
          'com.google.code.gson:gson:2.8.9',
          'com.google.guava:guava:31.0.1-jre',
          'org.apache.commons:commons-lang3:3.12.0',
          'commons-io:commons-io:2.11.0'
      ];
      const libraryJars: string[] = [];
      for (const libName of commonLibs) {
          const libPath = path.join(getLauncherDataPath(), 'libraries', this.getLibraryPath(libName));
          const possiblePaths = [
              libPath,
              path.join(opts.instancePath, 'libraries', this.getLibraryPath(libName)),
              path.join(process.env.APPDATA || '', '.minecraft', 'libraries', this.getLibraryPath(libName)),
          ];

          let found = false;
          for (const possiblePath of possiblePaths) {
              if (fs.existsSync(possiblePath)) {
                  libraryJars.push(possiblePath);
                  found = true;
                  break;
              }
          }
          if (!found) {
              logProgressService.warning(`Librería común no encontrada: ${libName}`);
          }
      }
      if(libraryJars.length > 0) {
          classpath = [path.join(opts.instancePath, 'client.jar'), ...libraryJars].join(path.delimiter);
      }
    }

    // Definir argumentos del juego (necesarios para Minecraft)
    // Crear un UUID falso para perfiles no premium, o usar el real si está disponible
    // Generar UUID en formato estándar (8-4-4-4-12 caracteres hexadecimales)
    const fakeUUID = opts.userProfile?.id || `${Math.random().toString(16).substr(2, 8)}-${Math.random().toString(16).substr(2, 4)}-${Math.random().toString(16).substr(2, 4)}-${Math.random().toString(16).substr(2, 4)}-${Math.random().toString(16).substr(2, 12)}`;

    // Obtener el ID real del assetIndex del archivo version.json
    let assetIndexId = opts.mcVersion; // Por defecto usar la versión de Minecraft
    const versionJsonPath = await minecraftDownloadService.downloadVersionMetadata(opts.mcVersion);

    if (fs.existsSync(versionJsonPath)) {
      try {
        const versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));
        if (versionData.assetIndex && versionData.assetIndex.id) {
          assetIndexId = versionData.assetIndex.id;
        }
      } catch (error) {
        logProgressService.warning(`No se pudo leer el archivo version.json para obtener el assetIndex: ${error}`);
      }
    }

    const gameArgs = [
      '--username', opts.userProfile?.username || 'Player',
      '--version', opts.mcVersion,
      '--gameDir', opts.instancePath,
      '--assetsDir', path.join(getLauncherDataPath(), 'assets'), // Usar assets compartidos
      '--assetIndex', assetIndexId, // Usar el ID real del assetIndex
      '--uuid', fakeUUID,
      '--accessToken', '0', // Placeholder para no premium
      '--userType', 'mojang', // Para perfiles no premium
      '--versionType', 'DRK Launcher'
    ];

    // Añadir argumentos de tamaño de ventana si están definidos
    if (opts.windowSize) {
      gameArgs.push('--width', opts.windowSize.width.toString(), '--height', opts.windowSize.height.toString());
    }

    // Combinar todos los argumentos
    return [
      ...jvmArgs,
      '-cp', classpath,  // Usar classpath en lugar de -jar
      mainClass,  // Usar la clase principal específica de la versión de Minecraft
      ...gameArgs
    ];
  }

  /**
   * Construye argumentos para lanzar Minecraft con mod loader
   */
  private async buildArgumentsForModded(
    opts: LaunchOptions, 
    loader: 'forge' | 'fabric' | 'quilt' | 'neoforge', 
    jvmArgs: string[]
  ): Promise<string[]> {
    const mem = Math.max(512, opts.ramMb || 2048);
    const minMem = Math.min(512, mem / 4); // Usar 1/4 de la RAM máxima como mínima

    // Definir argumentos JVM (configuración de memoria y optimizaciones)
    let updatedJvmArgs = [
      `-Xms${minMem}m`,    // Memoria inicial
      `-Xmx${mem}m`,       // Memoria máxima
      // Opciones recomendadas para rendimiento
      '-XX:+UseG1GC',
      '-XX:+UnlockExperimentalVMOptions',
      '-XX:+UseG1GC',
      '-XX:MaxGCPauseMillis=100',
      '-XX:+DisableExplicitGC',
      '-XX:TargetSurvivorRatio=90',
      '-XX:G1NewSizePercent=50',
      '-XX:G1MaxNewSizePercent=80',
      '-XX:G1MixedGCLiveThresholdPercent=35',
      '-XX:+AlwaysPreTouch',
      '-XX:+ParallelRefProcEnabled',
      '-XX:MaxInlineLevel=9',
      '-XX:MaxTrivialSize=12',
      '-XX:-DontCompileHugeMethods',
      // Args adicionales si se proporcionaron
      ...(opts.jvmArgs || [])
    ];

    const launcherPath = getLauncherDataPath();
    const versionJsonPath = await minecraftDownloadService.downloadVersionMetadata(opts.mcVersion);

    // Determinar la configuración según el loader
    let mainClass = '';
    let additionalJvmArgs: string[] = [];
    let additionalGameArgs: string[] = [];

    switch (loader) {
      case 'forge':
      case 'neoforge':
        // Para Forge y NeoForge
        mainClass = 'cpw.mods.bootstraplauncher.BootstrapLauncher'; // Para Forge 1.17+

        // Añadir argumentos JVM específicos de Forge
        additionalJvmArgs = [
          `-Dfml.earlyprogresswindow=false`,
          '--add-opens', 'java.base/java.util.jar=cpw.mods.securejarhandler',
          '--add-opens', 'java.base/java.lang.invoke=cpw.mods.securejarhandler',
          '--add-opens', 'java.base/java.lang.reflect=cpw.mods.securejarhandler',
          '--add-opens', 'java.base/java.text=cpw.mods.securejarhandler',
          '--add-opens', 'java.base/java.util=cpw.mods.securejarhandler',
          '--add-opens', 'java.base/java.util.concurrent=cpw.mods.securejarhandler',
          '--add-opens', 'java.base/java.util.concurrent.atomic=cpw.mods.securejarhandler',
          '--add-opens', 'java.base/java.util.jar=cpw.mods.securejarhandler',
          '--add-opens', 'java.base/java.util.regex=cpw.mods.securejarhandler',
          '--add-opens', 'java.base/java.util.zip=cpw.mods.securejarhandler',
        ];

        // Argumentos de juego específicos
        additionalGameArgs = [
          '--launchTarget', 'forgeclient',
          '--fml.forgeVersion', opts.loaderVersion || '',
          '--fml.mcVersion', opts.mcVersion,
          '--fml.forgeGroup', 'net.minecraftforge',
          '--fml.mcpVersion', '' // Esto puede requerir información adicional
        ];
        break;

      case 'fabric':
      case 'quilt':
        // Para Fabric y Quilt (muy similares en términos de ejecución)
        mainClass = 'net.fabricmc.loader.impl.launch.knot.KnotClient';

        // Argumentos de juego específicos
        additionalGameArgs = [
          // No se requieren argumentos específicos del juego en Fabric/Quilt
        ];
        break;

      default:
        // Por defecto usar vanilla
        mainClass = 'net.minecraft.client.main.Main';
        break;
    }

    // Construir classpath para loaders modded
    // Para Forge, Fabric, etc., necesitamos encontrar el archivo JAR del loader
    const libraryJars: string[] = [];
    const loaderJarPath = this.findLoaderJar(opts.instancePath, loader, opts.loaderVersion);

    if (loaderJarPath && fs.existsSync(loaderJarPath)) {
      libraryJars.push(loaderJarPath);
      logProgressService.info(`Usando archivo JAR del loader: ${loaderJarPath}`);
    } else {
      logProgressService.warning(`No se encontró archivo JAR del loader ${loader}, usando client.jar`);
    }

    // También incluir el client.jar original
    const clientJar = path.join(opts.instancePath, 'client.jar');
    if (fs.existsSync(clientJar)) {
      libraryJars.push(clientJar);
    }

    // Cargar también las librerías desde el archivo de versión base
    if (fs.existsSync(versionJsonPath)) {
      try {
        const versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));
        if (versionData.libraries && Array.isArray(versionData.libraries)) {
          for (const lib of versionData.libraries) {
            if (lib.downloads && lib.downloads.artifact) {
              let libPath;
              if (lib.downloads.artifact.path) {
                libPath = path.join(launcherPath, 'libraries', lib.downloads.artifact.path);
              } else {
                libPath = path.join(launcherPath, 'libraries', this.getLibraryPath(lib.name));
              }

              // Probar múltiples ubicaciones posibles
              const possiblePaths = [
                libPath, // Ruta estándar en .DRK Launcher/libraries
                path.join(opts.instancePath, 'libraries', this.getLibraryPath(lib.name)), // En la instancia
                path.join(process.env.APPDATA || '', '.minecraft', 'libraries', this.getLibraryPath(lib.name)), // .minecraft estándar
              ];

              let found = false;
              for (const possiblePath of possiblePaths) {
                if (fs.existsSync(possiblePath)) {
                  // Evitar duplicados
                  if (!libraryJars.includes(possiblePath)) {
                    libraryJars.push(possiblePath);
                  }
                  found = true;
                  break;
                }
              }

              if (!found) {
                logProgressService.warning(`Librería no encontrada para loader: ${lib.name} en ninguna ubicación`);
              }
            }
          }
        }
      } catch (error) {
        logProgressService.error('Error al leer archivo de versión para construir classpath para loader:', error);
      }
    }

    const classpath = libraryJars.join(path.delimiter);

    // Definir argumentos del juego (necesarios para Minecraft)
    // Crear un UUID falso para perfiles no premium, o usar el real si está disponible
    // Generar UUID en formato estándar (8-4-4-4-12 caracteres hexadecimales)
    const fakeUUID = opts.userProfile?.id || `${Math.random().toString(16).substr(2, 8)}-${Math.random().toString(16).substr(2, 4)}-${Math.random().toString(16).substr(2, 4)}-${Math.random().toString(16).substr(2, 4)}-${Math.random().toString(16).substr(2, 12)}`;

    // Obtener el ID real del assetIndex del archivo version.json
    let assetIndexId = opts.mcVersion; // Por defecto usar la versión de Minecraft
    const versionJsonPath = await minecraftDownloadService.downloadVersionMetadata(opts.mcVersion);

    if (fs.existsSync(versionJsonPath)) {
      try {
        const versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));
        if (versionData.assetIndex && versionData.assetIndex.id) {
          assetIndexId = versionData.assetIndex.id;
        }
      } catch (error) {
        logProgressService.warning(`No se pudo leer el archivo version.json para obtener el assetIndex: ${error}`);
      }
    }

    const baseGameArgs = [
      '--username', opts.userProfile?.username || 'Player',
      '--version', opts.mcVersion,
      '--gameDir', opts.instancePath,
      '--assetsDir', path.join(getLauncherDataPath(), 'assets'), // Usar assets compartidos
      '--assetIndex', assetIndexId, // Usar el ID real del assetIndex
      '--uuid', fakeUUID,
      '--accessToken', '0', // Placeholder para no premium
      '--userType', 'mojang', // Para perfiles no premium
      '--versionType', `DRK Launcher ${loader}`
    ];

    // Añadir argumentos de tamaño de ventana si están definidos
    if (opts.windowSize) {
      baseGameArgs.push('--width', opts.windowSize.width.toString(), '--height', opts.windowSize.height.toString());
    }

    // Combinar todos los argumentos
    return [
      ...updatedJvmArgs,
      ...additionalJvmArgs,
      '-cp', classpath,  // Usar classpath en lugar de -jar
      mainClass,  // Usar la clase principal específica del loader
      ...baseGameArgs,
      ...additionalGameArgs,
      ...(opts.gameArgs || [])
    ];
  }

  /**
   * Función auxiliar para obtener el nombre del sistema operativo
   */
  private getOSName(): string {
    switch (process.platform) {
      case 'win32': return 'windows';
      case 'darwin': return 'osx';
      case 'linux': return 'linux';
      default: return 'linux';
    }
  }

  /**
   * Función auxiliar para construir la ruta de una librería basada en su nombre
   */
  private getLibraryPath(libraryName: string): string {
    const [group, artifact, version] = libraryName.split(':');
    const parts = group.split('.');
    return path.join(...parts, artifact, version, `${artifact}-${version}.jar`);
  }

  /**
   * Función auxiliar para descargar una librería
   */
  private async downloadLibrary(url: string, outputPath: string): Promise<boolean> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const buffer = await response.buffer();
      fs.writeFileSync(outputPath, buffer);
      return true;
    } catch (error) {
      logProgressService.error(`Error downloading library from ${url} to ${outputPath}: ${error}`);
      return false;
    }
  }

  /**
   * Función auxiliar para encontrar el JAR del loader
   */
  private findLoaderJar(instancePath: string, loader: string, version?: string): string | null {
    const loaderDir = path.join(instancePath, 'loader');

    // Buscar archivos JAR que coincidan con el loader
    if (fs.existsSync(loaderDir)) {
      const files = fs.readdirSync(loaderDir);
      for (const file of files) {
        if (file.endsWith('.jar')) {
          if (file.toLowerCase().includes(loader)) {
            return path.join(loaderDir, file);
          }
        }
      }
    }

    // Alternativamente, buscar en la carpeta de la instancia
    if (fs.existsSync(instancePath)) {
      const instanceFiles = fs.readdirSync(instancePath);
      for (const file of instanceFiles) {
        if (file.endsWith('.jar')) {
          if (file.toLowerCase().includes(loader)) {
            return path.join(instancePath, file);
          }
        }
      }
    }

    // Si la carpeta de Minecraft estándar existe, buscar allí también
    const standardMinecraftPath = path.join(process.env.APPDATA || '', '.minecraft', 'versions');
    const loaderVersionPath = path.join(standardMinecraftPath, `${loader}-${version || ''}`);
    if (fs.existsSync(loaderVersionPath)) {
      const versionFiles = fs.readdirSync(loaderVersionPath);
      for (const file of versionFiles) {
        if (file.endsWith('.jar') && file.includes(loader)) {
          return path.join(loaderVersionPath, file);
        }
      }
    }

    return null;
  }
}

export const gameLaunchService = new GameLaunchService();

// Tipos para los callbacks que no estaban definidos en el original
type LaunchDataCallback = (data: string) => void;
type LaunchExitCallback = (code: number | null) => void;

// Añadir los callbacks al tipo LaunchOptions
declare module './gameLaunchService' {
  interface LaunchOptions {
    onData?: LaunchDataCallback;
    onExit?: LaunchExitCallback;
  }
}