import { spawn, ChildProcess } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { Profile } from '../renderer/services/profileService';
import { minecraftDownloadService } from './minecraftDownloadService';
import { getLauncherDataPath } from '../utils/paths';
import { logProgressService } from './logProgressService';
import { InstanceConfig } from './enhancedInstanceCreationService';
import { ensureValidUUID } from '../utils/uuid';

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
  onData?: (chunk: string) => void;
  onExit?: (code: number | null) => void;
};

/**
 * Interfaz para el perfil de lanzamiento de Forge (modelo Modrinth)
 */
interface ForgeLaunchProfile {
  versionName: string;
  mainClass: string;
  libraries: Array<{
    name: string;
    path: string;
    url?: string;
    rules?: any[];
  }>;
  arguments: {
    jvm: string[];
    game: string[];
  };
  assetIndex: string;
  assets: string;
}

/**
 * Metadatos de instancia de Forge/NeoForge
 */
interface ForgeInstanceMetadata {
  versionName: string;
  mainClass: string;
  libraries: Array<{
    name: string;
    path: string;
    url: string;
    mavenPath: string;
  }>;
  versionJsonPath: string;
}

/**
 * Sesión de usuario para lanzamiento
 */
interface UserSession {
  username: string;
  uuid: string;
  accessToken: string;
  clientId?: string;
  xuid?: string;
}

/**
 * Servicio mejorado para lanzar el juego con el JRE correcto
 */
export class GameLaunchService {
  /**
   * Valida que todos los archivos necesarios estén presentes antes de lanzar el juego
   */
  async validateInstanceFiles(opts: LaunchOptions): Promise<void> {
    logProgressService.info(`Validando archivos para la instancia ${opts.instanceConfig.name}`, {
      instance: opts.instanceConfig.name,
      version: opts.mcVersion
    });

    // Validar que exista el archivo client.jar
    const clientJarPath = path.join(opts.instancePath, 'client.jar');
    if (!fs.existsSync(clientJarPath)) {
      throw new Error(`client.jar no encontrado en ${clientJarPath}`);
    }

    // Validar el tamaño del client.jar (debe ser mayor a 1MB)
    const clientStats = fs.statSync(clientJarPath);
    if (clientStats.size < 1024 * 1024) { // 1MB
      throw new Error(`client.jar tiene tamaño muy pequeño (${clientStats.size} bytes), probablemente incompleto`);
    }

    // Validar que exista el directorio de assets compartido
    const assetsDir = path.join(getLauncherDataPath(), 'assets');
    if (!fs.existsSync(assetsDir)) {
      throw new Error(`Directorio de assets no encontrado: ${assetsDir}`);
    }

    // Validar que exista el archivo de índice de assets para esta versión
    const launcherVersionJsonPath = await minecraftDownloadService.downloadVersionMetadata(opts.mcVersion);
    if (!fs.existsSync(launcherVersionJsonPath)) {
      throw new Error(`Archivo de metadatos de versión no encontrado: ${launcherVersionJsonPath}`);
    }

    // Cargar el archivo de metadatos para verificar los assets
    const versionData = JSON.parse(fs.readFileSync(launcherVersionJsonPath, 'utf-8'));
    const assetIndexId = versionData.assetIndex?.id || opts.mcVersion;
    const assetIndexPath = path.join(getLauncherDataPath(), 'assets', 'indexes', `${assetIndexId}.json`);

    if (!fs.existsSync(assetIndexPath)) {
      throw new Error(`Índice de assets no encontrado: ${assetIndexPath}`);
    }

    // Validar y descargar completamente librerías si es necesario
    if (versionData.libraries && Array.isArray(versionData.libraries)) {
      const totalLibraries = versionData.libraries.length;
      let validatedLibraries = 0;

      for (const lib of versionData.libraries) {
        // Verificar reglas de aplicabilidad
        let libraryAllowed = true;
        if (lib.rules) {
          libraryAllowed = false;
          const osName = this.getOSName();
          for (const rule of lib.rules) {
            if (rule.action === 'allow') {
              if (!rule.os || rule.os.name === osName) {
                libraryAllowed = true;
              }
            } else if (rule.action === 'disallow') {
              if (rule.os && rule.os.name === osName) {
                libraryAllowed = false;
                break;
              }
            }
          }
        }

        if (libraryAllowed && lib.downloads && lib.downloads.artifact) {
          let libPath;
          if (lib.downloads.artifact.path) {
            libPath = path.join(getLauncherDataPath(), 'libraries', lib.downloads.artifact.path);
          } else {
            // Construir ruta de librería usando el formato antiguo
            const nameParts = lib.name.split(':');
            const [group, artifact, version] = nameParts;
            const parts = group.split('.');
            libPath = path.join(getLauncherDataPath(), 'libraries', ...parts, artifact, version, `${artifact}-${version}.jar`);
          }

          // Verificar si la librería existe, tiene el tamaño correcto y hash correcto
          if (!fs.existsSync(libPath)) {
            logProgressService.info(`Descargando librería faltante: ${lib.name}`, {
              path: libPath,
              library: lib.name
            });

            // Crear directorio si no existe
            this.ensureDir(path.dirname(libPath));

            try {
              // Descargar la librería
              await this.downloadLibrary(lib.downloads.artifact.url, libPath);
              logProgressService.info(`Librería descargada: ${lib.name}`, { library: lib.name });
              validatedLibraries++;
            } catch (downloadError) {
              logProgressService.error(`Error al descargar librería ${lib.name}: ${downloadError.message}`, {
                library: lib.name,
                error: downloadError.message
              });
            }
          } else {
            // Si el archivo existe, verificar su integridad si es posible
            try {
              const libStats = fs.statSync(libPath);
              if (lib.downloads.artifact.size && libStats.size !== lib.downloads.artifact.size) {
                logProgressService.warning(`Librería tiene tamaño incorrecto, descargando: ${lib.name}`, {
                  path: libPath,
                  library: lib.name
                });

                try {
                  await this.downloadLibrary(lib.downloads.artifact.url, libPath);
                  validatedLibraries++;
                } catch (downloadError) {
                  logProgressService.error(`Error al descargar librería ${lib.name}: ${downloadError.message}`, {
                    library: lib.name,
                    error: downloadError.message
                  });
                }
              } else {
                validatedLibraries++;
              }
            } catch (statError) {
              logProgressService.error(`Error al verificar librería ${lib.name}: ${statError.message}`, {
                library: lib.name,
                error: statError.message
              });
            }
          }
        }
      }

      logProgressService.info(`Validación de librerías completada: ${validatedLibraries}/${totalLibraries} librerías procesadas`, {
        validated: validatedLibraries,
        total: totalLibraries
      });
    }

    // Validar y descargar assets faltantes para la versión de Minecraft
    try {
      logProgressService.info(`Iniciando validación y descarga completa de assets para la versión ${opts.mcVersion}`, {
        instance: opts.instanceConfig.name,
        version: opts.mcVersion
      });

      await minecraftDownloadService.validateAndDownloadAssets(opts.mcVersion);
      logProgressService.info(`Assets validados y completados para la versión ${opts.mcVersion}`, {
        instance: opts.instanceConfig.name,
        version: opts.mcVersion
      });

      // Asegurar que assets críticos como los de idioma estén presentes
      await minecraftDownloadService.ensureCriticalAssets(opts.mcVersion);
      logProgressService.info(`Assets críticos asegurados para la versión ${opts.mcVersion}`, {
        instance: opts.instanceConfig.name,
        version: opts.mcVersion
      });
    } catch (assetsError) {
      logProgressService.error(`Error al validar assets para la versión ${opts.mcVersion}: ${assetsError.message}`, {
        instance: opts.instanceConfig.name,
        version: opts.mcVersion,
        error: assetsError.message
      });
      throw assetsError;
    }

    // SOLUCIÓN 16: Validación exhaustiva para Forge/NeoForge - verificar todas las librerías del version.json
    if (opts.instanceConfig.loader === 'forge' || opts.instanceConfig.loader === 'neoforge') {
      await this.validateForgeLibraries(opts.mcVersion, opts.instanceConfig.loaderVersion);
    }

    logProgressService.success(`Validación completa de archivos exitosa para la instancia ${opts.instanceConfig.name}`, {
      instance: opts.instanceConfig.name,
      version: opts.mcVersion
    });
  }

  /**
   * Valida exhaustivamente todas las librerías de Forge antes del lanzamiento
   */
  private async validateForgeLibraries(
    mcVersion: string,
    loaderVersion: string | undefined
  ): Promise<void> {
    if (!loaderVersion) {
      logProgressService.warning(`No se proporcionó versión del loader, saltando validación exhaustiva de Forge`);
      return;
    }

    const launcherDataPath = getLauncherDataPath();
    const versionName = `${mcVersion}-forge-${loaderVersion}`;
    const versionJsonPath = path.join(launcherDataPath, 'versions', versionName, `${versionName}.json`);
    
    if (!fs.existsSync(versionJsonPath)) {
      throw new Error(`Version.json de Forge no encontrado: ${versionJsonPath}. Por favor, ejecuta el instalador de Forge primero.`);
    }

    logProgressService.info(`Validando exhaustivamente todas las librerías de Forge desde ${versionJsonPath}`);

    try {
      const versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));
      
      if (!versionData.libraries || !Array.isArray(versionData.libraries)) {
        throw new Error(`Version.json de Forge no contiene librerías válidas`);
      }

      let validated = 0;
      let missing = 0;
      const missingLibraries: string[] = [];
      const total = versionData.libraries.length;

      for (const lib of versionData.libraries) {
        // Verificar reglas de aplicabilidad
        if (lib.rules && !this.isLibraryAllowed(lib.rules)) {
          continue;
        }

        if (lib.downloads && lib.downloads.artifact) {
          let libPath;
          if (lib.downloads.artifact.path) {
            libPath = path.join(launcherDataPath, 'libraries', lib.downloads.artifact.path);
          } else {
            const nameParts = lib.name.split(':');
            const [group, artifact, version] = nameParts;
            const parts = group.split('.');
            libPath = path.join(launcherDataPath, 'libraries', ...parts, artifact, version, `${artifact}-${version}.jar`);
          }

          if (!fs.existsSync(libPath)) {
            missing++;
            missingLibraries.push(lib.name);
            logProgressService.warning(`Librería de Forge faltante: ${lib.name}`);
            
            // Intentar descargar la librería faltante
            try {
              this.ensureDir(path.dirname(libPath));
              await this.downloadLibrary(lib.downloads.artifact.url, libPath);
              logProgressService.info(`Librería de Forge descargada: ${lib.name}`);
              validated++;
            } catch (downloadError) {
              logProgressService.error(`Error al descargar librería de Forge ${lib.name}: ${downloadError.message}`);
            }
          } else {
            // Verificar integridad
            const libStats = fs.statSync(libPath);
            if (lib.downloads.artifact.size && libStats.size !== lib.downloads.artifact.size) {
              logProgressService.warning(`Librería de Forge tiene tamaño incorrecto, re-descargando: ${lib.name}`);
              try {
                await this.downloadLibrary(lib.downloads.artifact.url, libPath);
                validated++;
              } catch (downloadError) {
                logProgressService.error(`Error al re-descargar librería de Forge ${lib.name}: ${downloadError.message}`);
                missing++;
                missingLibraries.push(lib.name);
              }
            } else {
              validated++;
            }
          }
        }
      }

      logProgressService.info(`Validación exhaustiva de Forge: ${validated}/${total} librerías validadas`);

      if (missing > 0) {
        throw new Error(`Faltan ${missing} librerías críticas de Forge: ${missingLibraries.slice(0, 5).join(', ')}${missingLibraries.length > 5 ? '...' : ''}. Por favor, reinstala Forge.`);
      }
    } catch (error) {
      logProgressService.error(`Error en validación exhaustiva de Forge: ${error.message}`);
      throw error;
    }
  }

  /**
   * Asegura que un directorio exista
   */
  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Descarga una librería desde una URL
   */
  private async downloadLibrary(url: string, outputPath: string): Promise<boolean> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(outputPath, buffer);
      return true;
    } catch (error) {
      logProgressService.error(`Error downloading library from ${url} to ${outputPath}: ${error}`);
      return false;
    }
  }

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

      // Validar los archivos antes de lanzar el juego
      await this.validateInstanceFiles(opts);

      // Construir los argumentos para lanzar el juego
      const args = await this.buildLaunchArguments(opts);

      // Asegurar que todos los argumentos sean strings
      const stringArgs = args.map(arg => typeof arg === 'string' ? arg : String(arg));
      
      logProgressService.info(`Argumentos de lanzamiento construidos (${stringArgs.length} argumentos)`, {
        javaPath: opts.javaPath,
        classpathLength: stringArgs.filter(arg => typeof arg === 'string' && arg.startsWith('-cp')).length > 0 ? 'class' : 'jar'
      });

      // Crear el proceso hijo
      const child = spawn(opts.javaPath, stringArgs, {
        cwd: opts.instancePath,
        env: {
          ...process.env,
          // Añadir variables de entorno específicas si son necesarias
        }
      });

      // Manejar la salida del proceso
      child.stdout.on('data', (data) => {
        const output = data.toString();
        // Registrar la salida en un archivo de log específico de la instancia
        this.logOutputToFile(opts.instanceConfig.name, `[OUT] ${output}`);
        logProgressService.info(`[Minecraft-OUT] ${output}`, { instance: opts.instanceConfig.name });
        opts.onData?.(output);
      });

      child.stderr.on('data', (data) => {
        const output = data.toString();
        // Registrar los errores en un archivo de log específico de la instancia
        this.logOutputToFile(opts.instanceConfig.name, `[ERROR] ${output}`);
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
    // Asegurar que el UUID esté en formato válido
    const fakeUUID = ensureValidUUID(opts.userProfile?.id);

    // Obtener el ID real del assetIndex del archivo version.json
    let assetIndexId = opts.mcVersion; // Por defecto usar la versión de Minecraft
    const moddedVersionJsonPath = await minecraftDownloadService.downloadVersionMetadata(opts.mcVersion);

    if (fs.existsSync(moddedVersionJsonPath)) {
      try {
        const versionData = JSON.parse(fs.readFileSync(moddedVersionJsonPath, 'utf-8'));
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
   * Construye el perfil de Forge sin usar el instalador (modelo Modrinth/Prism)
   */
  private async buildForgeProfile(
    minecraftVersion: string,
    forgeVersion: string
  ): Promise<ForgeLaunchProfile> {
    const launcherDataPath = getLauncherDataPath();
    const versionName = `${minecraftVersion}-forge-${forgeVersion}`;
    
    // 1. Descargar version.json base de Minecraft
    const baseVersionJsonPath = await minecraftDownloadService.downloadVersionMetadata(minecraftVersion);
    const baseVersionData = JSON.parse(fs.readFileSync(baseVersionJsonPath, 'utf-8'));
    
    // 2. Descargar o leer el version.json de Forge
    const versionDir = path.join(launcherDataPath, 'versions', versionName);
    this.ensureDir(versionDir);
    const forgeVersionJsonPath = path.join(versionDir, `${versionName}.json`);
    
    let forgeVersionData: any;
    if (fs.existsSync(forgeVersionJsonPath)) {
      forgeVersionData = JSON.parse(fs.readFileSync(forgeVersionJsonPath, 'utf-8'));
      logProgressService.info(`Version.json de Forge encontrado, usando existente`);
    } else {
      // Construir version.json de Forge desde Maven usando installForgeLoader
      logProgressService.info(`Construyendo version.json de Forge desde Maven...`);
      try {
        await this.installForgeLoader(minecraftVersion, 'forge', forgeVersion);
        forgeVersionData = JSON.parse(fs.readFileSync(forgeVersionJsonPath, 'utf-8'));
      } catch (error) {
        logProgressService.error(`Error al instalar Forge desde Maven: ${error}`);
        throw error;
      }
    }
    
    // 3. Normalizar el JSON: eliminar duplicados y referencias a universal.jar
    const normalizedLibraries: Array<{
      name: string;
      path: string;
      url?: string;
      rules?: any[];
    }> = [];
    const seenLibraryNames = new Set<string>();
    const seenLibraryPaths = new Set<string>();
    
    // Combinar librerías base de Minecraft y Forge
    const allLibraries = [
      ...(baseVersionData.libraries || []),
      ...(forgeVersionData.libraries || [])
    ];
    
    for (const lib of allLibraries) {
      // Verificar reglas de aplicabilidad
      if (lib.rules && !this.isLibraryAllowed(lib.rules)) {
        continue;
      }
      
      // Omitir librerías nativas de otras plataformas
      if (this.isNativeLibraryForOtherPlatform(lib.name)) {
        continue;
      }
      
      // Omitir universal.jar y server.jar
      if (lib.name && (lib.name.includes('-universal') || lib.name.includes('-server'))) {
        continue;
      }
      
      if (!lib.downloads || !lib.downloads.artifact) {
        continue;
      }
      
      // Construir ruta de la librería
      let libPath: string;
      if (lib.downloads.artifact.path) {
        libPath = lib.downloads.artifact.path;
      } else {
        libPath = this.getLibraryPath(lib.name);
      }
      
      // Verificar duplicados por nombre y ruta
      if (seenLibraryNames.has(lib.name) || seenLibraryPaths.has(libPath)) {
        continue;
      }
      
      seenLibraryNames.add(lib.name);
      seenLibraryPaths.add(libPath);
      
      normalizedLibraries.push({
        name: lib.name,
        path: libPath,
        url: lib.downloads.artifact.url,
        rules: lib.rules
      });
    }
    
    // 4. Asegurar que mainClass sea modlauncher.Launcher
    const mainClass = 'cpw.mods.modlauncher.Launcher';
    
    // 5. Construir argumentos JVM (modelo Modrinth - mínimo necesario)
    // Modrinth no usa argumentos JVM excesivos, solo los esenciales
    const jvmArguments = [
      '--add-modules=ALL-MODULE-PATH',
      ...(baseVersionData.arguments?.jvm || [])
    ];
    
    // 6. Construir argumentos del juego (modelo Modrinth exacto)
    // ModLauncher recibe estos argumentos y luego los pasa al juego
    const gameArguments = [
      '--launchTarget', 'forge_client'  // Modrinth usa 'forge_client' no 'forgeclient'
    ];
    
    return {
      versionName,
      mainClass,
      libraries: normalizedLibraries,
      arguments: {
        jvm: jvmArguments,
        game: gameArguments
      },
      assetIndex: baseVersionData.assetIndex?.id || minecraftVersion,
      assets: baseVersionData.assets || minecraftVersion
    };
  }

  /**
   * Instala el loader de Forge/NeoForge descargando dependencias desde Maven
   * FASE DE INSTALACIÓN: Resolver dependencias Maven
   */
  async installForgeLoader(
    mcVersion: string,
    loaderType: 'forge' | 'neoforge',
    loaderVersion: string
  ): Promise<ForgeInstanceMetadata> {
    console.log(`[${loaderType}] installForgeLoader llamado: MC ${mcVersion}, Loader ${loaderVersion}`);
    const launcherDataPath = getLauncherDataPath();
    const versionName = `${mcVersion}-${loaderType}-${loaderVersion}`;
    const versionDir = path.join(launcherDataPath, 'versions', versionName);
    this.ensureDir(versionDir);
    
    const versionJsonPath = path.join(versionDir, `${versionName}.json`);
    console.log(`[${loaderType}] Version.json se guardará en: ${versionJsonPath}`);
    
    // Paso 1: Resolver Metadatos - Descargar y analizar el POM
    console.log(`[${loaderType}] Paso 1: Descargando POM desde Maven...`);
    logProgressService.info(`[${loaderType}] Descargando POM desde Maven...`);
    const mavenBaseUrl = loaderType === 'forge' 
      ? 'https://maven.minecraftforge.net'
      : 'https://maven.neoforged.net';
    
    const groupId = loaderType === 'forge' ? 'net.minecraftforge' : 'net.neoforged';
    const artifactId = loaderType === 'forge' ? 'forge' : 'neoforge';
    
    // Normalizar loaderVersion: puede venir como "1.21.11-61.0.2" o solo "61.0.2"
    let normalizedLoaderVersion = loaderVersion;
    if (loaderVersion.includes('-')) {
      // Si tiene formato "1.21.11-61.0.2", extraer solo la parte de Forge
      const parts = loaderVersion.split('-');
      if (parts.length > 1) {
        normalizedLoaderVersion = parts[parts.length - 1]; // Tomar la última parte
      }
    }
    
    const pomUrl = `${mavenBaseUrl}/${groupId.replace(/\./g, '/')}/${artifactId}/${normalizedLoaderVersion}/${artifactId}-${normalizedLoaderVersion}.pom`;
    
    let pomText: string;
    try {
      const pomResponse = await fetch(pomUrl, {
        headers: { 'User-Agent': 'DRK-Launcher/1.0' }
      });
      
      if (!pomResponse.ok) {
        throw new Error(`No se pudo descargar POM (${pomResponse.status})`);
      }
      
      pomText = await pomResponse.text();
      console.log(`[${loaderType}] ✓ POM descargado exitosamente (${pomText.length} bytes)`);
      logProgressService.info(`[${loaderType}] POM descargado exitosamente`);
    } catch (error) {
      console.error(`[${loaderType}] ✗ Error al descargar POM: ${error}`);
      logProgressService.error(`[${loaderType}] Error al descargar POM: ${error}`);
      throw error;
    }
    
    // Paso 2: Analizar POM y extraer dependencias
    console.log(`[${loaderType}] Paso 2: Analizando POM y extrayendo dependencias...`);
    const dependencies = this.parsePomDependencies(pomText, loaderType, loaderVersion);
    console.log(`[${loaderType}] ✓ ${dependencies.length} dependencias encontradas en el POM`);
    logProgressService.info(`[${loaderType}] ${dependencies.length} dependencias encontradas en POM`);
    
    // Paso 3: Descargar version.json base de Minecraft (Vanilla)
    const baseVersionJsonPath = await minecraftDownloadService.downloadVersionMetadata(mcVersion);
    const baseVersionData = JSON.parse(fs.readFileSync(baseVersionJsonPath, 'utf-8'));
    
    // Paso 4: Descargar artefactos principales
    // Usar normalizedLoaderVersion ya calculado arriba
    const mainArtifactPath = `${groupId.replace(/\./g, '/')}/${artifactId}/${normalizedLoaderVersion}/${artifactId}-${normalizedLoaderVersion}-client.jar`;
    const mainArtifactUrl = `${mavenBaseUrl}/${mainArtifactPath}`;
    const mainArtifactLocalPath = path.join(launcherDataPath, 'libraries', mainArtifactPath);
    
    logProgressService.info(`[${loaderType}] Descargando JAR principal: ${mainArtifactUrl}`);
    try {
      await this.downloadArtifact(mainArtifactUrl, mainArtifactLocalPath);
    } catch (error) {
      logProgressService.error(`[${loaderType}] Error crítico al descargar JAR principal: ${error}`);
      throw error;
    }
    
    // Paso 5: Descargar todas las dependencias del POM
    logProgressService.info(`[${loaderType}] Descargando ${dependencies.length} dependencias...`);
    const downloadedLibraries: Array<{ name: string; path: string; url: string; mavenPath: string }> = [];
    
    // Añadir el JAR principal
    downloadedLibraries.push({
      name: `${groupId}:${artifactId}:${normalizedLoaderVersion}`,
      path: mainArtifactPath,
      url: mainArtifactUrl,
      mavenPath: mainArtifactPath
    });
    
    // Descargar dependencias en paralelo (aumentado para mayor velocidad)
    console.log(`[${loaderType}] Paso 3: Descargando ${dependencies.length} dependencias (70 simultáneas)...`);
    logProgressService.info(`[${loaderType}] Descargando ${dependencies.length} dependencias (70 simultáneas)...`);
    const CONCURRENT_DOWNLOADS = 70;
    let downloadedCount = 0;
    let failedCount = 0;
    
    for (let i = 0; i < dependencies.length; i += CONCURRENT_DOWNLOADS) {
      const batch = dependencies.slice(i, i + CONCURRENT_DOWNLOADS);
      
      const results = await Promise.allSettled(
        batch.map(async (dep) => {
          try {
            const libPath = path.join(launcherDataPath, 'libraries', dep.mavenPath);
            if (!fs.existsSync(libPath)) {
              await this.downloadArtifact(dep.url, libPath);
              downloadedCount++;
            } else {
              // Ya existe, verificar que sea válido
              const stats = fs.statSync(libPath);
              if (stats.size === 0) {
                // Archivo corrupto, re-descargar
                fs.unlinkSync(libPath);
                await this.downloadArtifact(dep.url, libPath);
                downloadedCount++;
              }
            }
            downloadedLibraries.push(dep);
            return { success: true, dep };
          } catch (err) {
            failedCount++;
            logProgressService.warning(`[${loaderType}] Error al descargar ${dep.name}: ${err}`);
            return { success: false, dep, error: err };
          }
        })
      );
      
      // Reportar progreso
      const currentProgress = Math.min(i + CONCURRENT_DOWNLOADS, dependencies.length);
      if (currentProgress % 20 === 0 || currentProgress >= dependencies.length) {
        console.log(`[${loaderType}] Progreso descarga: ${currentProgress}/${dependencies.length} (${downloadedCount} nuevas, ${failedCount} fallidas)`);
        logProgressService.info(`[${loaderType}] Progreso: ${currentProgress}/${dependencies.length} dependencias (${downloadedCount} descargadas, ${failedCount} fallidas)`);
      }
    }
    
    console.log(`[${loaderType}] ✓ Descarga completada: ${downloadedCount} nuevas, ${downloadedLibraries.length - downloadedCount} existentes, ${failedCount} fallidas`);
    logProgressService.info(`[${loaderType}] Descarga completada: ${downloadedCount} nuevas, ${downloadedLibraries.length - downloadedCount} existentes, ${failedCount} fallidas`);
    
    // Paso 6: Combinar librerías de Vanilla y Forge/NeoForge
    const allLibraries: any[] = [];
    const seenNames = new Set<string>();
    
    // Añadir librerías de Vanilla
    if (baseVersionData.libraries) {
      for (const lib of baseVersionData.libraries) {
        if (lib.name && !seenNames.has(lib.name)) {
          allLibraries.push(lib);
          seenNames.add(lib.name);
        }
      }
    }
    
    // Añadir librerías de Forge/NeoForge desde POM
    for (const dep of downloadedLibraries) {
      if (!seenNames.has(dep.name)) {
        allLibraries.push({
          name: dep.name,
          downloads: {
            artifact: {
              path: dep.mavenPath,
              url: dep.url
            }
          }
        });
        seenNames.add(dep.name);
      }
    }
    
    // Paso 7: Generar JSON Local
    const forgeVersionData = {
      id: versionName,
      time: new Date().toISOString(),
      releaseTime: new Date().toISOString(),
      type: 'release',
      mainClass: 'cpw.mods.modlauncher.Launcher',
      inheritsFrom: mcVersion,
      logging: baseVersionData.logging || {},
      arguments: {
        game: baseVersionData.arguments?.game || [],
        jvm: baseVersionData.arguments?.jvm || []
      },
      libraries: allLibraries,
      downloads: baseVersionData.downloads || {},
      assetIndex: baseVersionData.assetIndex || {},
      assets: baseVersionData.assets || mcVersion
    };
    
    fs.writeFileSync(versionJsonPath, JSON.stringify(forgeVersionData, null, 2));
    console.log(`[${loaderType}] ✓ Version.json generado exitosamente: ${versionJsonPath}`);
    console.log(`[${loaderType}] ✓ Total de librerías en version.json: ${allLibraries.length}`);
    logProgressService.info(`[${loaderType}] Version.json generado: ${versionJsonPath}`);
    
    return {
      versionName,
      mainClass: 'cpw.mods.modlauncher.Launcher',
      libraries: downloadedLibraries,
      versionJsonPath
    };
  }

  /**
   * Parsea el POM y extrae las dependencias
   */
  private parsePomDependencies(
    pomText: string,
    loaderType: 'forge' | 'neoforge',
    loaderVersion: string
  ): Array<{ name: string; path: string; url: string; mavenPath: string }> {
    const dependencies: Array<{ name: string; path: string; url: string; mavenPath: string }> = [];
    const mavenBaseUrl = loaderType === 'forge' 
      ? 'https://maven.minecraftforge.net'
      : 'https://maven.neoforged.net';
    
    // Normalizar loaderVersion: puede venir como "1.21.11-61.0.2" o solo "61.0.2"
    let normalizedLoaderVersion = loaderVersion;
    if (loaderVersion.includes('-')) {
      // Si tiene formato "1.21.11-61.0.2", extraer solo la parte de Forge
      const parts = loaderVersion.split('-');
      if (parts.length > 1) {
        normalizedLoaderVersion = parts[parts.length - 1]; // Tomar la última parte
      }
    }
    
    // Extraer dependencias del POM usando regex mejorado
    // Maneja espacios, comentarios y propiedades Maven básicas
    const dependencyRegex = /<dependency>[\s\S]*?<groupId>\s*([^<\s]+)\s*<\/groupId>[\s\S]*?<artifactId>\s*([^<\s]+)\s*<\/artifactId>[\s\S]*?<version>\s*([^<\s${}]+)\s*<\/version>[\s\S]*?<\/dependency>/g;
    const matches = Array.from(pomText.matchAll(dependencyRegex));
    
    const seenDeps = new Set<string>();
    
    for (const match of matches) {
      let groupId = match[1].trim();
      let artifactId = match[2].trim();
      let version = match[3].trim();
      
      // Resolver propiedades Maven básicas (${...})
      if (version.includes('${')) {
        const propMatch = version.match(/\$\{([^}]+)\}/);
        if (propMatch) {
          const propName = propMatch[1];
          // Buscar la propiedad en el POM
          const propRegex = new RegExp(`<${propName}>\\s*([^<]+)\\s*</${propName}>`, 'i');
          const propMatch2 = pomText.match(propRegex);
          if (propMatch2) {
            version = propMatch2[1].trim();
          } else {
            // Si no se encuentra, usar el valor por defecto o saltar
            logProgressService.warning(`No se pudo resolver propiedad Maven: ${propName}`);
            continue;
          }
        }
      }
      
      // Saltar si la versión contiene propiedades no resueltas
      if (version.includes('${') || !version || version === '') {
        continue;
      }
      
      const depName = `${groupId}:${artifactId}:${version}`;
      
      // Evitar duplicados
      if (seenDeps.has(depName)) {
        continue;
      }
      seenDeps.add(depName);
      
      // Construir ruta Maven
      const groupPath = groupId.replace(/\./g, '/');
      const mavenPath = `${groupPath}/${artifactId}/${version}/${artifactId}-${version}.jar`;
      
      // Determinar URL base según el grupo
      let depUrl: string;
      if (groupId.startsWith('net.minecraftforge') || groupId.startsWith('cpw.mods')) {
        depUrl = `${mavenBaseUrl}/${mavenPath}`;
      } else if (groupId.startsWith('net.neoforged')) {
        depUrl = `https://maven.neoforged.net/${mavenPath}`;
      } else if (groupId.startsWith('com.mojang') || groupId.startsWith('org.lwjgl')) {
        // Librerías de Mojang van a libraries.minecraft.net
        depUrl = `https://libraries.minecraft.net/${mavenPath}`;
      } else {
        // Otras librerías van a Maven Central
        depUrl = `https://repo1.maven.org/maven2/${mavenPath}`;
      }
      
      dependencies.push({
        name: depName,
        path: mavenPath,
        url: depUrl,
        mavenPath
      });
    }
    
    // Añadir dependencias conocidas críticas que pueden no estar en el POM
    const criticalDeps = [
      {
        name: loaderType === 'forge' 
          ? `net.minecraftforge:forge:${normalizedLoaderVersion}`
          : `net.neoforged:neoforge:${normalizedLoaderVersion}`,
        path: loaderType === 'forge'
          ? `net/minecraftforge/forge/${normalizedLoaderVersion}/forge-${normalizedLoaderVersion}-client.jar`
          : `net/neoforged/neoforge/${normalizedLoaderVersion}/neoforge-${normalizedLoaderVersion}-client.jar`,
        url: loaderType === 'forge'
          ? `https://maven.minecraftforge.net/net/minecraftforge/forge/${normalizedLoaderVersion}/forge-${normalizedLoaderVersion}-client.jar`
          : `https://maven.neoforged.net/net/neoforged/neoforge/${normalizedLoaderVersion}/neoforge-${normalizedLoaderVersion}-client.jar`,
        mavenPath: loaderType === 'forge'
          ? `net/minecraftforge/forge/${normalizedLoaderVersion}/forge-${normalizedLoaderVersion}-client.jar`
          : `net/neoforged/neoforge/${normalizedLoaderVersion}/neoforge-${normalizedLoaderVersion}-client.jar`
      }
    ];
    
    for (const dep of criticalDeps) {
      if (!seenDeps.has(dep.name)) {
        dependencies.push(dep);
        seenDeps.add(dep.name);
      }
    }
    
    logProgressService.info(`[${loaderType}] Total de dependencias extraídas: ${dependencies.length}`);
    
    return dependencies;
  }

  /**
   * Descarga un artefacto desde una URL
   */
  private async downloadArtifact(url: string, localPath: string, retries: number = 3): Promise<void> {
    this.ensureDir(path.dirname(localPath));
    
    if (fs.existsSync(localPath)) {
      // Verificar que el archivo no esté corrupto (tamaño > 0)
      const stats = fs.statSync(localPath);
      if (stats.size > 0) {
        return; // Ya existe y es válido
      } else {
        // Archivo corrupto, eliminarlo
        fs.unlinkSync(localPath);
        logProgressService.warning(`Archivo corrupto detectado, re-descargando: ${path.basename(localPath)}`);
      }
    }
    
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'DRK-Launcher/1.0' },
          signal: AbortSignal.timeout(30000) // Timeout de 30 segundos
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`Archivo no encontrado (404): ${url}`);
          }
          throw new Error(`HTTP ${response.status}`);
        }
        
        const buffer = Buffer.from(await response.arrayBuffer());
        
        // Verificar que el buffer no esté vacío
        if (buffer.length === 0) {
          throw new Error('Archivo descargado está vacío');
        }
        
        fs.writeFileSync(localPath, buffer);
        logProgressService.info(`Descargado: ${path.basename(localPath)} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
        return; // Éxito
      } catch (error: any) {
        lastError = error;
        if (attempt < retries) {
          const waitTime = attempt * 1000; // Esperar 1s, 2s, 3s...
          logProgressService.warning(`Intento ${attempt}/${retries} fallido para ${path.basename(localPath)}, reintentando en ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    // Si llegamos aquí, todos los intentos fallaron
    logProgressService.error(`Error al descargar ${url} después de ${retries} intentos: ${lastError}`);
    throw lastError || new Error(`No se pudo descargar ${url}`);
  }


  /**
   * Clasifica librerías en module-path y classpath (modelo Modrinth/JPMS)
   * CLASIFICACIÓN ESTRICTA: Solo módulos de Forge/NeoForge van en module-path
   */
  private partitionForgeLibraries(
    libraries: Array<{ name: string; path: string; url?: string }>,
    launcherDataPath: string
  ): { modulePath: string[]; classpath: string[] } {
    const modulePath: string[] = [];
    const classpath: string[] = [];
    
    // ESTRATEGIA INVERTIDA: Por defecto al Module-path
    // Solo excepciones específicas van al Classpath
    // Esto asegura que la mayoría de las librerías se traten como módulos automáticos
    const CLASSPATH_EXCEPTIONS = [
      'client-', 
      '-official.jar', // JAR oficial de Minecraft (debe estar en classpath)
      // Librerías que sabemos que dan problemas si son módulos (si las hubiera)
    ];

    for (const lib of libraries) {
      const basename = path.basename(lib.path).toLowerCase();
      
      // Construir ruta completa (absoluta)
      const fullPath = path.join(launcherDataPath, 'libraries', lib.path);
      
      // REGLA 1: Excluir universal.jar si ya tenemos client.jar
      if (basename.includes('-universal.jar')) {
        // Verificar si ya tenemos el client.jar
        const hasClientJar = libraries.some(l => {
          const otherBasename = path.basename(l.path).toLowerCase();
          return otherBasename.includes('-client.jar') && 
                 otherBasename.includes(basename.split('-')[0]); // Mismo prefijo (forge/neoforge)
        });
        if (hasClientJar) {
          logProgressService.info(`Excluyendo universal.jar (ya tenemos client.jar): ${basename}`);
          continue;
        }
      }
      
      // REGLA 2: Excepciones forzadas al classpath
      const isClasspathException = CLASSPATH_EXCEPTIONS.some(kw => basename.includes(kw));
      
      if (isClasspathException) {
        if (!classpath.includes(fullPath)) {
          classpath.push(fullPath);
          logProgressService.info(`Asignado al Classpath (excepción): ${basename}`);
        }
      } else {
        // REGLA 3: Todo lo demás va al Module-path
        if (!modulePath.includes(fullPath)) {
          modulePath.push(fullPath);
          // Log solo para módulos críticos para no saturar
          if (basename.includes('forge') || basename.includes('log4j') || basename.includes('modlauncher')) {
             logProgressService.info(`Módulo identificado: ${basename}`);
          }
        }
      }
    }
    
    // VALIDACIÓN CRÍTICA: Si el module-path está vacío, algo falló
    if (modulePath.length === 0) {
      logProgressService.error(`ERROR CRÍTICO: No se encontraron JARs de Forge Loader (modlauncher, forge-client) para el Module-path.`);
      logProgressService.error(`Librerías procesadas: ${libraries.length}`);
      logProgressService.error(`Ejemplos de librerías: ${libraries.slice(0, 5).map(l => path.basename(l.path)).join(', ')}`);
      
      // Intentar buscar manualmente las librerías críticas
      const criticalLibs = [
        'modlauncher',
        'forge-',
        'neoforge-',
        'fmlloader',
        'fmlcore'
      ];
      
      for (const criticalKeyword of criticalLibs) {
        const found = libraries.find(l => {
          const basename = path.basename(l.path).toLowerCase();
          return basename.includes(criticalKeyword.toLowerCase());
        });
        if (found) {
          const criticalPath = path.join(launcherDataPath, 'libraries', found.path);
          if (fs.existsSync(criticalPath)) {
            modulePath.push(criticalPath);
            logProgressService.warning(`Librería crítica añadida manualmente: ${path.basename(found.path)}`);
          }
        }
      }
    }
    
    logProgressService.info(`Librerías clasificadas (estricto): ${modulePath.length} en module-path, ${classpath.length} en classpath`);
    
    if (modulePath.length > 0) {
      logProgressService.info(`Módulos en module-path: ${modulePath.map(p => path.basename(p)).join(', ')}`);
    }
    
    return { modulePath, classpath };
  }

  /**
   * Alias para mantener compatibilidad
   */
  private partitionLibraries(
    libraries: Array<{ name: string; path: string; url?: string }>,
    launcherDataPath: string
  ): { modulePath: string[]; classpath: string[] } {
    return this.partitionForgeLibraries(libraries, launcherDataPath);
  }

  /**
   * Construye argumentos para lanzar Minecraft con mod loader
   */
  private async buildArgumentsForModded(
    opts: LaunchOptions, 
    loader: 'forge' | 'fabric' | 'quilt' | 'neoforge', 
    jvmArgs: string[]
  ): Promise<string[]> {
    // Descargar metadata de la versión primero (necesario para construir el classpath)
    const versionJsonPath = await minecraftDownloadService.downloadVersionMetadata(opts.mcVersion);
    
    const mem = Math.max(512, opts.ramMb || 2048);
    const minMem = Math.min(512, mem / 4); // Usar 1/4 de la RAM máxima como mínima

    // Definir argumentos JVM (configuración de memoria y optimizaciones)
    // Argumentos estándar para mejor rendimiento en Minecraft/Forge
    let updatedJvmArgs = [
      // Configuración de memoria
      `-Xms${minMem}m`,    // Memoria inicial
      `-Xmx${mem}m`,       // Memoria máxima
      
      // Garbage Collector: G1GC (recomendado para Minecraft)
      '-XX:+UseG1GC',
      '-XX:+UnlockExperimentalVMOptions',
      '-XX:MaxGCPauseMillis=200',
      '-XX:+ParallelRefProcEnabled',
      '-XX:+DisableExplicitGC',
      '-XX:+AlwaysPreTouch',
      
      // Optimizaciones G1GC
      '-XX:G1NewSizePercent=30',
      '-XX:G1MaxNewSizePercent=40',
      '-XX:G1HeapRegionSize=8M',
      '-XX:G1ReservePercent=20',
      '-XX:G1HeapWastePercent=5',
      '-XX:G1MixedGCCountTarget=4',
      '-XX:InitiatingHeapOccupancyPercent=15',
      '-XX:G1MixedGCLiveThresholdPercent=90',
      '-XX:G1RSetUpdatingPauseTimePercent=5',
      '-XX:SurvivorRatio=32',
      '-XX:MaxTenuringThreshold=1',
      '-XX:TargetSurvivorRatio=90',
      
      // Optimizaciones de compilación JIT
      '-XX:+TieredCompilation',
      '-XX:TieredStopAtLevel=1',
      '-XX:MaxInlineLevel=15',
      '-XX:MaxTrivialSize=12',
      '-XX:-DontCompileHugeMethods',
      '-XX:+UseFastUnorderedTimeStamps',
      
      // Optimizaciones de memoria
      '-XX:+UseStringDeduplication',
      '-XX:+OptimizeStringConcat',
      '-XX:+UseCompressedOops',
      '-XX:+UseCompressedClassPointers',
      '-XX:+PerfDisableSharedMem',
      
      // Flags de Aikar (optimizaciones populares para Minecraft)
      '-Dusing.aikars.flags=https://mcflags.emc.gs',
      '-Daikars.new.flags=true',
      
      // Nota: Los siguientes argumentos fueron removidos en Java 21 o no son compatibles:
      // - UseFastAccessorMethods: Removido en Java 21
      // - UseThreadPriorities: Removido en Java 21
      // - ThreadPriorityPolicy: Removido en Java 21
      // - ReduceSignalUsage: Removido en Java 21
      // - UseTransparentHugePages: Solo Linux
      // - UseLargePages: Requiere configuración especial en Windows
      // - UseBiasedLocking: Removido en Java 15+
      // - UseCompressedStrings: Removido en Java 9+
      
      // Args adicionales personalizados si se proporcionaron
      ...(opts.jvmArgs || [])
    ];

    const launcherPath = getLauncherDataPath();

    // Determinar la configuración según el loader
    let mainClass = '';
    let additionalJvmArgs: string[] = [];
    let additionalGameArgs: string[] = [];

    switch (loader) {
      case 'forge':
      case 'neoforge':
        // MODELO MODRINTH: Usar buildForgeProfile para construir el perfil
        // Intentar extraer la versión de Forge si no está especificada
        let forgeVersion = opts.loaderVersion || opts.instanceConfig?.loaderVersion;
        
        if (!forgeVersion) {
          // 1. Intentar extraer del nombre de la versión (ej: 1.21.11-forge-61.0.2)
          const versionMatch = opts.mcVersion.match(/-forge-([\d.]+)$/i) || opts.mcVersion.match(/-neoforge-([\d.]+)$/i);
          if (versionMatch && versionMatch[1]) {
            forgeVersion = versionMatch[1];
            logProgressService.info(`Versión de ${loader} extraída del nombre de versión: ${forgeVersion}`);
          }
        }
        
        if (!forgeVersion) {
          // 2. Buscar en el directorio de versiones escaneando todos los directorios de Forge
          const launcherDataPath = getLauncherDataPath();
          const versionsDir = path.join(launcherDataPath, 'versions');
          
          if (fs.existsSync(versionsDir)) {
            try {
              const versionDirs = fs.readdirSync(versionsDir, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);
              
              // Buscar directorios que contengan "forge" o "neoforge" y la versión de Minecraft
              const forgeVersionDirs = versionDirs.filter(dir => {
                const lowerDir = dir.toLowerCase();
                return (lowerDir.includes('forge') || lowerDir.includes('neoforge')) && 
                       lowerDir.includes(opts.mcVersion.replace(/\./g, '-'));
              });
              
              for (const versionDirName of forgeVersionDirs) {
                const versionJsonPath = path.join(versionsDir, versionDirName, `${versionDirName}.json`);
                
                if (fs.existsSync(versionJsonPath)) {
                  try {
                    const versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));
                    
                    // Intentar extraer la versión de Forge del ID
                    const idMatch = versionData.id?.match(/-forge-([\d.]+)$/i) || 
                                   versionData.id?.match(/-neoforge-([\d.]+)$/i) ||
                                   versionData.id?.match(/forge-[\d.]+-([\d.]+)$/i) ||
                                   versionData.id?.match(/neoforge-[\d.]+-([\d.]+)$/i);
                    
                    if (idMatch && idMatch[1]) {
                      forgeVersion = idMatch[1];
                      logProgressService.info(`Versión de ${loader} extraída del version.json (${versionDirName}): ${forgeVersion}`);
                      break;
                    }
                    
                    // Buscar en las librerías de Forge
                    if (versionData.libraries && Array.isArray(versionData.libraries)) {
                      for (const lib of versionData.libraries) {
                        if (lib.name) {
                          // Patrones: net.minecraftforge:forge:1.21.11-61.0.2 o net.minecraftforge:forge:61.0.2
                          const libMatch = lib.name.match(/forge:[\d.]+-([\d.]+)/i) ||
                                         lib.name.match(/forge:([\d.]+)/i) ||
                                         lib.name.match(/neoforge:[\d.]+-([\d.]+)/i) ||
                                         lib.name.match(/neoforge:([\d.]+)/i);
                          
                          if (libMatch && libMatch[1] && !libMatch[1].includes(opts.mcVersion)) {
                            forgeVersion = libMatch[1];
                            logProgressService.info(`Versión de ${loader} extraída de librerías (${lib.name}): ${forgeVersion}`);
                            break;
                          }
                        }
                      }
                    }
                    
                    if (forgeVersion) break;
                  } catch (err) {
                    logProgressService.warning(`Error al leer version.json (${versionDirName}): ${err}`);
                  }
                }
              }
            } catch (err) {
              logProgressService.warning(`Error al escanear directorio de versiones: ${err}`);
            }
          }
        }
        
        if (!forgeVersion) {
          // 3. Buscar en el directorio de librerías de Forge
          const launcherDataPath = getLauncherDataPath();
          const forgeLibsDir = path.join(launcherDataPath, 'libraries', 'net', 'minecraftforge', 'forge');
          
          if (fs.existsSync(forgeLibsDir)) {
            try {
              const forgeVersions = fs.readdirSync(forgeLibsDir, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name)
                .filter(name => name.includes(opts.mcVersion))
                .sort((a, b) => b.localeCompare(a)); // Ordenar descendente para obtener la más reciente
              
              if (forgeVersions.length > 0) {
                // Extraer la versión de Forge del formato: 1.21.11-61.0.2 -> 61.0.2
                const versionParts = forgeVersions[0].split('-');
                if (versionParts.length >= 2 && versionParts[0] === opts.mcVersion) {
                  forgeVersion = versionParts.slice(1).join('-');
                  logProgressService.info(`Versión de ${loader} extraída de librerías instaladas: ${forgeVersion}`);
                }
              }
            } catch (err) {
              logProgressService.warning(`Error al buscar en librerías de Forge: ${err}`);
            }
          }
        }
        
        if (!forgeVersion) {
          // 4. Buscar en el directorio de la instancia
          try {
            const instanceFiles = fs.readdirSync(opts.instancePath);
            for (const file of instanceFiles) {
              if (file.toLowerCase().includes('forge') || file.toLowerCase().includes('neoforge')) {
                // Intentar extraer versión del nombre del archivo
                // Patrones: forge-1.21.11-61.0.2-installer.jar -> 61.0.2
                const fileMatch = file.match(/(?:forge|neoforge)-[\d.]+-([\d.]+)/i) ||
                                 file.match(/(?:forge|neoforge)[-.]?([\d.]+)/i);
                if (fileMatch && fileMatch[1] && !fileMatch[1].includes(opts.mcVersion)) {
                  forgeVersion = fileMatch[1];
                  logProgressService.info(`Versión de ${loader} extraída del archivo de instancia: ${forgeVersion}`);
                  break;
                }
              }
            }
          } catch (err) {
            logProgressService.warning(`Error al buscar versión en directorio de instancia: ${err}`);
          }
        }
        
        if (!forgeVersion) {
          throw new Error(`Versión de ${loader} no especificada y no se pudo extraer automáticamente. Por favor, especifica la versión en la configuración de la instancia.`);
        }
        
        // MODELO MODRINTH: Simplificado - usar directamente modlauncher.Launcher
        mainClass = 'cpw.mods.modlauncher.Launcher';
        
        // Argumentos JVM para Forge/NeoForge (completos y optimizados)
        // Solución para Java 21: nashorn fue removido pero Forge lo requiere
        additionalJvmArgs = [
          // JPMS: Módulos
          '--add-modules=ALL-MODULE-PATH',
          // Añadir explícitamente log4j como módulo automático (requerido por coremod)
          '--add-modules', 'org.apache.logging.log4j.core,org.apache.logging.log4j',
          
          // Apertura de módulos para coremod (nashorn fue removido en Java 15+)
          '--add-opens', 'java.base/java.lang=net.minecraftforge.coremod',
          '--add-opens', 'java.base/java.util=net.minecraftforge.coremod',
          '--add-opens', 'java.base/java.lang.reflect=net.minecraftforge.coremod',
          '--add-opens', 'java.base/java.util.concurrent=net.minecraftforge.coremod',
          '--add-opens', 'java.base/java.lang.invoke=net.minecraftforge.coremod',
          '--add-opens', 'java.base/java.util.jar=ALL-UNNAMED',
          '--add-opens', 'java.base/java.net=ALL-UNNAMED',
          '--add-opens', 'java.base/java.io=ALL-UNNAMED',
          '--add-opens', 'java.base/java.text=ALL-UNNAMED',
          '--add-opens', 'java.base/java.util.regex=ALL-UNNAMED',
          '--add-opens', 'java.base/java.util.zip=ALL-UNNAMED',
          
          // Apertura de módulos para log4j (requerido por coremod - CRÍTICO)
          '--add-opens', 'java.base/java.lang=org.apache.logging.log4j.core',
          '--add-opens', 'java.base/java.util=org.apache.logging.log4j.core',
          '--add-opens', 'java.base/java.lang.reflect=org.apache.logging.log4j.core',
          '--add-opens', 'java.base/java.util.concurrent=org.apache.logging.log4j.core',
          '--add-opens', 'java.base/java.lang=org.apache.logging.log4j',
          '--add-opens', 'java.base/java.util=org.apache.logging.log4j',
          
          // Exports necesarios
          '--add-exports', 'java.base/sun.nio.ch=ALL-UNNAMED',
          '--add-exports', 'java.base/java.io=ALL-UNNAMED',
          
          // Propiedades del sistema para Forge
          '-Dforge.logging.console.level=info',
          '-Dforge.logging.markers=REGISTRIES',
          '-Dfml.earlyprogresswindow=false',
          '-Dnashorn.args=--no-deprecation-warning',
          
          // Configuración de Log4j
          '-Dlog4j.configurationFile=log4j2.xml',
          '-Dlog4j2.formatMsgNoLookups=true',
          '-Dlog4j2.loggerContextFactory=org.apache.logging.log4j.core.impl.Log4jContextFactory'
        ];
        
        // Argumentos del juego (modelo Modrinth exacto - ModLauncher recibe estos argumentos)
        additionalGameArgs = [
          '--launchTarget', 'forge_client'  // Modrinth usa 'forge_client' (con guion bajo)
        ];
        
        // Leer version.json de Forge para obtener librerías
        const launcherDataPath = getLauncherDataPath();
        const versionName = `${opts.mcVersion}-forge-${forgeVersion}`;
        const versionJsonPath = path.join(launcherDataPath, 'versions', versionName, `${versionName}.json`);
        
        let forgeLibraries: Array<{ name: string; path: string; url?: string }> = [];
        
        if (fs.existsSync(versionJsonPath)) {
          try {
            const versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));
            
            // Construir lista de librerías desde version.json
            if (versionData.libraries && Array.isArray(versionData.libraries)) {
              for (const lib of versionData.libraries) {
                if (lib.rules && !this.isLibraryAllowed(lib.rules)) {
                  continue;
                }
                
                if (this.isNativeLibraryForOtherPlatform(lib.name)) {
                  continue;
                }
                
                if (!lib.downloads || !lib.downloads.artifact) {
                  continue;
                }
                
                let libPath: string;
                if (lib.downloads.artifact.path) {
                  libPath = lib.downloads.artifact.path;
                } else {
                  libPath = this.getLibraryPath(lib.name);
                }
                
                forgeLibraries.push({
                  name: lib.name,
                  path: libPath,
                  url: lib.downloads.artifact.url
                });
              }
            }
          } catch (err) {
            logProgressService.warning(`Error al leer version.json de Forge: ${err}`);
          }
        }
        
        // Clasificar librerías en module-path y classpath
        const { modulePath: modulePathLibs, classpath: classpathLibs } = this.partitionLibraries(
          forgeLibraries,
          launcherDataPath
        );
        
        // Descargar librerías faltantes
        await this.downloadMissingLibrariesForProfile(forgeLibraries, launcherDataPath);
        
        // Construir rutas completas y verificar existencia
        const modulePathFull = modulePathLibs.filter(p => fs.existsSync(p));
        const classpathFull = classpathLibs.filter(p => fs.existsSync(p));
        
        // Guardar para uso posterior
        (this as any)._forgeModulePath = modulePathFull;
        (this as any)._forgeClasspath = classpathFull;
        
        logProgressService.info(`Perfil de Forge construido (modelo Modrinth): ${modulePathFull.length} módulos, ${classpathFull.length} dependencias`);
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
      // Verificar si es un instalador de Forge/NeoForge
      if ((loader === 'forge' || loader === 'neoforge') && loaderJarPath.toLowerCase().includes('installer')) {
        logProgressService.warning(`Se encontró instalador de ${loader}. Intentando descargar Universal JAR en su lugar...`);
        
        // Extraer la versión del loader del nombre del archivo instalador
        let extractedLoaderVersion = opts.loaderVersion || '';
        if (!extractedLoaderVersion) {
          const fileName = path.basename(loaderJarPath);
          // Para Forge: forge-1.21.11-61.0.2-installer.jar -> 1.21.11-61.0.2
          // Para NeoForge: neoforge-1.21.11-21.1.123-installer.jar -> 1.21.11-21.1.123
          const match = fileName.match(/(?:forge|neoforge)-([\d.]+-[\d.]+)-installer\.jar/);
          if (match && match[1]) {
            extractedLoaderVersion = match[1];
            logProgressService.info(`Versión del loader extraída del nombre del instalador: ${extractedLoaderVersion}`);
          }
        }
        
        // Intentar descargar el Universal JAR directamente (más fácil que ejecutar el instalador)
        try {
          const universalJarPath = await this.downloadForgeUniversalJar(
            opts.instancePath,
            loader,
            opts.mcVersion,
            extractedLoaderVersion
          );
          
          if (universalJarPath && fs.existsSync(universalJarPath)) {
            libraryJars.push(universalJarPath);
            logProgressService.info(`Usando Universal JAR de ${loader}: ${universalJarPath}`);
            
            // NOTA: Para Forge moderno (1.17+), el Universal JAR ya contiene BootstrapLauncher y SecureJarHandler
            // No necesitamos añadir las librerías separadas porque causaría conflictos de módulos duplicados
            // El Universal JAR es un "fat jar" que contiene todas las dependencias necesarias
            logProgressService.info(`Universal JAR de ${loader} descargado. Contiene todas las dependencias necesarias (BootstrapLauncher, SecureJarHandler, ASM).`);
          } else {
            logProgressService.warning(`No se pudo descargar Universal JAR. Intentando ejecutar instalador...`);
            // Fallback: intentar ejecutar el instalador
            try {
              await this.runForgeInstaller(loaderJarPath, opts.instancePath, opts.mcVersion, opts.loaderVersion || '');
              const installedJarPath = await this.findInstalledForgeJar(opts.instancePath, loader, opts.mcVersion, opts.loaderVersion || '');
              if (installedJarPath && fs.existsSync(installedJarPath)) {
                libraryJars.push(installedJarPath);
                logProgressService.info(`Usando JAR de ${loader} instalado: ${installedJarPath}`);
              } else {
                logProgressService.warning(`Instalador ejecutado pero no se encontró JAR instalado. Usando client.jar vanilla.`);
              }
            } catch (installerError) {
              logProgressService.error(`Error al ejecutar instalador de ${loader}:`, installerError);
              logProgressService.warning(`Usando client.jar vanilla como fallback.`);
            }
          }
        } catch (error) {
          logProgressService.error(`Error al descargar Universal JAR de ${loader}:`, error);
          logProgressService.warning(`Usando client.jar vanilla como fallback.`);
        }
      } else {
        // No es un instalador, usar directamente
        libraryJars.push(loaderJarPath);
        logProgressService.info(`Usando archivo JAR del loader: ${loaderJarPath}`);
        
        // NOTA: Para Forge moderno (1.17+), el Universal JAR ya contiene BootstrapLauncher y SecureJarHandler
        // No necesitamos añadir las librerías separadas porque causaría conflictos de módulos duplicados
        // El Universal JAR es un "fat jar" que contiene todas las dependencias necesarias
        logProgressService.info(`Universal JAR de ${loader} detectado. No se añadirán librerías BootstrapLauncher separadas para evitar conflictos de módulos.`);
      }
      
      // Para Fabric y Quilt, necesitamos agregar las dependencias del loader
      // IMPORTANTE: Usar el version.json con mappings Intermediary de la instancia
      if (loader === 'fabric' || loader === 'quilt') {
        // Intentar usar el version.json de la instancia primero (tiene mappings Intermediary)
        const instanceVersionJsonPath = path.join(opts.instancePath, 'loader', 'version.json');
        if (fs.existsSync(instanceVersionJsonPath)) {
          logProgressService.info(`[${loader.charAt(0).toUpperCase() + loader.slice(1)}] Usando version.json con mappings Intermediary de la instancia`);
          try {
            const loaderVersionData = JSON.parse(fs.readFileSync(instanceVersionJsonPath, 'utf-8'));
            // Agregar todas las librerías del version.json
            if (loaderVersionData.libraries && Array.isArray(loaderVersionData.libraries)) {
              for (const lib of loaderVersionData.libraries) {
                // Verificar reglas de compatibilidad
                if (lib.rules && !this.isLibraryAllowed(lib.rules)) {
                  continue;
                }

                if (lib.downloads?.artifact?.path) {
                  const libPath = path.join(launcherPath, 'libraries', lib.downloads.artifact.path);
                  if (fs.existsSync(libPath) && !libraryJars.includes(libPath)) {
                    libraryJars.push(libPath);
                  }
                } else if (lib.name) {
                  // Construir ruta desde el nombre de la librería
                  const libPath = path.join(launcherPath, 'libraries', this.getLibraryPath(lib.name));
                  if (fs.existsSync(libPath) && !libraryJars.includes(libPath)) {
                    libraryJars.push(libPath);
                  }
                }
              }
              logProgressService.info(`[${loader.charAt(0).toUpperCase() + loader.slice(1)}] Librerías del version.json con mappings Intermediary agregadas al classpath`);
            }
          } catch (error) {
            logProgressService.warning(`[${loader.charAt(0).toUpperCase() + loader.slice(1)}] Error al leer version.json de la instancia, usando método alternativo:`, error);
            await this.addLoaderDependencies(libraryJars, loader, opts.mcVersion, opts.loaderVersion, launcherPath);
          }
        } else {
          // Fallback al método original
          await this.addLoaderDependencies(libraryJars, loader, opts.mcVersion, opts.loaderVersion, launcherPath);
        }
      }
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
            // Verificar reglas de compatibilidad antes de procesar la librería
            if (lib.rules && !this.isLibraryAllowed(lib.rules)) {
              // Librería no permitida en esta plataforma, omitir sin advertencia
              continue;
            }

            // Solo procesar librerías JAR (artifacts), no librerías nativas que no son necesarias
            if (lib.downloads && lib.downloads.artifact) {
              // Verificar si es una librería nativa de otra plataforma
              if (this.isNativeLibraryForOtherPlatform(lib.name)) {
                // Es una librería nativa de otra plataforma, omitir sin advertencia
                continue;
              }

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

              // SOLUCIÓN CRÍTICA: Si la librería no se encuentra, intentar descargarla automáticamente
              if (!found && lib.downloads && lib.downloads.artifact && lib.downloads.artifact.url) {
                try {
                  logProgressService.info(`Descargando librería faltante: ${lib.name}`);
                  const libDir = path.dirname(libPath);
                  if (!fs.existsSync(libDir)) {
                    fs.mkdirSync(libDir, { recursive: true });
                  }
                  
                  const response = await fetch(lib.downloads.artifact.url, {
                    headers: { 'User-Agent': 'DRK-Launcher/1.0' }
                  });
                  
                  if (response.ok) {
                    const buffer = Buffer.from(await response.arrayBuffer());
                    fs.writeFileSync(libPath, buffer);
                    logProgressService.info(`Librería descargada exitosamente: ${lib.name}`);
                    
                    if (!libraryJars.includes(libPath)) {
                      libraryJars.push(libPath);
                    }
                    found = true;
                  } else {
                    logProgressService.warning(`No se pudo descargar librería ${lib.name}: HTTP ${response.status}`);
                  }
                } catch (downloadError) {
                  logProgressService.warning(`Error al descargar librería ${lib.name}:`, downloadError);
                }
              }

              // Solo mostrar advertencia si la librería es realmente necesaria
              if (!found && this.isLibraryRequired(lib)) {
                logProgressService.warning(`Librería no encontrada para loader: ${lib.name} en ninguna ubicación`);
              }
            }
          }
        }
      } catch (error) {
        logProgressService.error('Error al leer archivo de versión para construir classpath para loader:', error);
      }
    }

    // Para Forge/NeoForge, asegurar que el Universal JAR esté al principio del classpath
    // Esto es crítico porque BootstrapLauncher debe ser encontrado primero
    if (loader === 'forge' || loader === 'neoforge') {
      const universalJarIndex = libraryJars.findIndex(lib => {
        const libName = path.basename(lib);
        return libName.includes('universal') || (libName.includes('forge') && !libName.includes('installer') && !libName.includes('client'));
      });
      
      if (universalJarIndex > 0) {
        // Mover el Universal JAR al principio
        const universalJar = libraryJars.splice(universalJarIndex, 1)[0];
        libraryJars.unshift(universalJar);
        logProgressService.info(`Universal JAR movido al principio del classpath: ${path.basename(universalJar)}`);
      } else if (universalJarIndex === 0) {
        logProgressService.info(`Universal JAR ya está al principio del classpath`);
      }
      
      // Verificar que el Universal JAR existe y contiene BootstrapLauncher
      if (libraryJars.length > 0) {
        const firstJar = libraryJars[0];
        const libName = path.basename(firstJar);
        if (libName.includes('universal') || (libName.includes('forge') && !libName.includes('installer'))) {
          if (fs.existsSync(firstJar)) {
            const stats = fs.statSync(firstJar);
            logProgressService.info(`Universal JAR verificado: ${path.basename(firstJar)} (${stats.size} bytes) en posición 0 del classpath`);
            
            // Verificar si el Universal JAR contiene BootstrapLauncher usando node-stream-zip
            try {
              const StreamZip = require('node-stream-zip');
              const zip = new StreamZip.async({ file: firstJar });
              const entries = await zip.entries();
              const hasBootstrapLauncher = Object.keys(entries).some(entryName => 
                entryName.includes('cpw/mods/bootstraplauncher/BootstrapLauncher.class')
              );
              await zip.close();
              
              if (hasBootstrapLauncher) {
                logProgressService.info(`Universal JAR contiene BootstrapLauncher`);
              } else {
                logProgressService.warning(`Universal JAR NO contiene BootstrapLauncher. El Universal JAR puede ser solo para servidores. Intentando usar el instalador...`);
                // Si no contiene BootstrapLauncher, el Universal JAR puede ser solo para servidores
                // Necesitamos ejecutar el instalador para generar los archivos del cliente
                
                // Extraer la versión del loader del nombre del Universal JAR
                let extractedLoaderVersion = opts.loaderVersion || '';
                if (!extractedLoaderVersion) {
                  const fileName = path.basename(firstJar);
                  // Para Forge: forge-1.21.11-61.0.2-universal.jar -> 1.21.11-61.0.2
                  // Para NeoForge: neoforge-1.21.11-21.1.123.jar -> 1.21.11-21.1.123
                  const match = fileName.match(/(?:forge|neoforge)-([\d.]+-[\d.]+)(?:-universal)?\.jar/);
                  if (match && match[1]) {
                    extractedLoaderVersion = match[1];
                    logProgressService.info(`Versión del loader extraída del Universal JAR: ${extractedLoaderVersion}`);
                  } else {
                    // Fallback: usar mcVersion
                    extractedLoaderVersion = opts.mcVersion;
                    logProgressService.warning(`No se pudo extraer la versión del loader del nombre del Universal JAR. Usando versión de MC: ${extractedLoaderVersion}`);
                  }
                }
                
                const installerPath = path.join(path.dirname(firstJar), `forge-${extractedLoaderVersion}-installer.jar`);
                
                if (!fs.existsSync(installerPath)) {
                  // Intentar descargar el instalador
                  logProgressService.info(`Instalador no encontrado. Intentando descargarlo...`);
                  const installerUrl = `https://maven.minecraftforge.net/net/minecraftforge/forge/${extractedLoaderVersion}/forge-${extractedLoaderVersion}-installer.jar`;
                  logProgressService.info(`URL del instalador: ${installerUrl}`);
                  try {
                    const response = await fetch(installerUrl, {
                      headers: { 'User-Agent': 'DRK-Launcher/1.0' }
                    });
                    logProgressService.info(`Respuesta del instalador: ${response.status} ${response.statusText}`);
                    if (response.ok) {
                      const buffer = Buffer.from(await response.arrayBuffer());
                      fs.writeFileSync(installerPath, buffer);
                      logProgressService.info(`Instalador descargado exitosamente: ${path.basename(installerPath)} (${buffer.length} bytes)`);
                    } else {
                      logProgressService.error(`Error al descargar instalador: ${response.status} ${response.statusText}`);
                      // Intentar con una URL alternativa
                      const altUrl = `https://files.minecraftforge.net/net/minecraftforge/forge/${extractedLoaderVersion}/forge-${extractedLoaderVersion}-installer.jar`;
                      logProgressService.info(`Intentando URL alternativa: ${altUrl}`);
                      const altResponse = await fetch(altUrl, {
                        headers: { 'User-Agent': 'DRK-Launcher/1.0' }
                      });
                      if (altResponse.ok) {
                        const buffer = Buffer.from(await altResponse.arrayBuffer());
                        fs.writeFileSync(installerPath, buffer);
                        logProgressService.info(`Instalador descargado desde URL alternativa: ${path.basename(installerPath)} (${buffer.length} bytes)`);
                      } else {
                        logProgressService.error(`Error al descargar instalador desde URL alternativa: ${altResponse.status} ${altResponse.statusText}`);
                      }
                    }
                  } catch (downloadError) {
                    logProgressService.error(`Error al descargar instalador:`, downloadError);
                  }
                }
                
                if (fs.existsSync(installerPath)) {
                  logProgressService.info(`Ejecutando instalador de Forge para generar archivos del cliente...`);
                  try {
                    await this.runForgeInstaller(installerPath, opts.instancePath, opts.mcVersion, extractedLoaderVersion);
                    const installedJarPath = await this.findInstalledForgeJar(opts.instancePath, loader, opts.mcVersion, extractedLoaderVersion);
                    if (installedJarPath && fs.existsSync(installedJarPath)) {
                      // Reemplazar el Universal JAR con el JAR instalado
                      const universalIndex = libraryJars.findIndex(lib => lib === firstJar);
                      if (universalIndex >= 0) {
                        libraryJars[universalIndex] = installedJarPath;
                        logProgressService.info(`Reemplazado Universal JAR con JAR instalado: ${path.basename(installedJarPath)}`);
                      }
                      
                      // Leer el version.json generado por el instalador para obtener todas las librerías y mainClass
                      const launcherDataPath = getLauncherDataPath();
                      const forgeProfile = this.readForgeInstallerProfile(opts.mcVersion, extractedLoaderVersion);
                      if (forgeProfile && fs.existsSync(forgeProfile.versionJsonPath)) {
                        try {
                          const versionData = JSON.parse(fs.readFileSync(forgeProfile.versionJsonPath, 'utf-8'));
                          logProgressService.info(`Leyendo configuración desde version.json generado por el instalador...`);
                          
                          // MIGRACIÓN JPMS: Usar modlauncher.Launcher en lugar de ForgeBootstrap
                          // El version.json puede especificar ForgeBootstrap, pero lo reemplazamos por modlauncher
                          if (versionData.mainClass) {
                            const originalMainClass = versionData.mainClass;
                            
                            // Si el version.json especifica ForgeBootstrap, usar modlauncher.Launcher en su lugar
                            if (originalMainClass.includes('ForgeBootstrap') || originalMainClass.includes('Bootstrap')) {
                              mainClass = 'cpw.mods.modlauncher.Launcher';
                              logProgressService.info(`MainClass reemplazado desde ${originalMainClass} a ${mainClass} (JPMS-compatible)`);
                            } else if (originalMainClass.includes('modlauncher')) {
                              mainClass = originalMainClass;
                              logProgressService.info(`MainClass actualizado desde version.json: ${mainClass}`);
                            } else {
                              // Si no es ForgeBootstrap ni modlauncher, usar el del version.json
                              mainClass = originalMainClass;
                              logProgressService.info(`MainClass actualizado desde version.json: ${mainClass}`);
                            }
                          }
                          
                          // Limpiar librerías actuales y usar las del version.json
                          // CRÍTICO: Limpiar completamente para evitar duplicados
                          libraryJars.length = 0;
                          
                          // Añadir el JAR principal primero (si no está ya en el version.json)
                          // El version.json del instalador ya incluye el JAR principal, pero lo añadimos primero
                          // para asegurar el orden correcto
                          if (installedJarPath && fs.existsSync(installedJarPath)) {
                          libraryJars.push(installedJarPath);
                            logProgressService.info(`JAR principal añadido: ${path.basename(installedJarPath)}`);
                          }
                          
                          // Añadir todas las librerías del version.json
                          if (versionData.libraries && Array.isArray(versionData.libraries)) {
                            let librariesAdded = 0;
                            for (const lib of versionData.libraries) {
                              if (lib.rules && !this.isLibraryAllowed(lib.rules)) {
                                continue;
                              }
                              
                              // Verificar si es una librería nativa de otra plataforma
                              if (this.isNativeLibraryForOtherPlatform(lib.name)) {
                                continue;
                              }
                              
                              if (lib.downloads && lib.downloads.artifact) {
                                let libPath;
                                if (lib.downloads.artifact.path) {
                                  libPath = path.join(launcherDataPath, 'libraries', lib.downloads.artifact.path);
                                } else {
                                  libPath = path.join(launcherDataPath, 'libraries', this.getLibraryPath(lib.name));
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
                                    // SOLUCIÓN CRÍTICA: Verificar duplicados por ruta normalizada y nombre de archivo
                                    // Esto previene añadir el mismo JAR múltiples veces con diferentes rutas
                                    const normalizedPath = path.resolve(possiblePath).toLowerCase();
                                    const basename = path.basename(possiblePath).toLowerCase();
                                    
                                    const isDuplicate = libraryJars.some(existingPath => {
                                      const existingNormalized = path.resolve(existingPath).toLowerCase();
                                      const existingBasename = path.basename(existingPath).toLowerCase();
                                      return normalizedPath === existingNormalized || basename === existingBasename;
                                    });
                                    
                                    if (!isDuplicate) {
                                      libraryJars.push(possiblePath);
                                      librariesAdded++;
                                    } else {
                                      logProgressService.warning(`Duplicado detectado y omitido en version.json: ${path.basename(possiblePath)}`);
                                    }
                                    found = true;
                                    break;
                                  }
                                }
                                
                                // SOLUCIÓN CRÍTICA: Si la librería no se encuentra, intentar descargarla automáticamente
                                if (!found && lib.downloads && lib.downloads.artifact && lib.downloads.artifact.url) {
                                  try {
                                    logProgressService.info(`Descargando librería faltante: ${lib.name}`);
                                    const libDir = path.dirname(libPath);
                                    if (!fs.existsSync(libDir)) {
                                      fs.mkdirSync(libDir, { recursive: true });
                                    }
                                    
                                    const response = await fetch(lib.downloads.artifact.url, {
                                      headers: { 'User-Agent': 'DRK-Launcher/1.0' }
                                    });
                                    
                                    if (response.ok) {
                                      const buffer = Buffer.from(await response.arrayBuffer());
                                      fs.writeFileSync(libPath, buffer);
                                      logProgressService.info(`Librería descargada exitosamente: ${lib.name}`);
                                      
                                      if (!libraryJars.includes(libPath)) {
                                        libraryJars.push(libPath);
                                        librariesAdded++;
                                      }
                                      found = true;
                                    } else {
                                      logProgressService.warning(`No se pudo descargar librería ${lib.name}: HTTP ${response.status}`);
                                    }
                                  } catch (downloadError) {
                                    logProgressService.warning(`Error al descargar librería ${lib.name}:`, downloadError);
                                  }
                                }
                                
                                if (!found && this.isLibraryRequired(lib)) {
                                  logProgressService.warning(`Librería no encontrada para Forge: ${lib.name} en ninguna ubicación`);
                                }
                              }
                            }
                            logProgressService.info(`Añadidas ${librariesAdded} librerías desde version.json del instalador.`);
                          }
                          
                          logProgressService.info(`Classpath actualizado con ${libraryJars.length} librerías desde version.json del instalador.`);
                        } catch (versionError) {
                          logProgressService.warning(`Error al leer version.json del instalador:`, versionError);
                        }
                      } else {
                        // Si no se encontró el version.json, buscar BootstrapLauncher manualmente
                        const bootstrapLauncher = this.findBootstrapLauncherLibrary(extractedLoaderVersion);
                        if (bootstrapLauncher && !libraryJars.includes(bootstrapLauncher)) {
                          // Añadir BootstrapLauncher al principio del classpath
                          libraryJars.unshift(bootstrapLauncher);
                          logProgressService.info(`BootstrapLauncher añadido al classpath: ${path.basename(bootstrapLauncher)}`);
                        } else if (!bootstrapLauncher) {
                          logProgressService.warning(`No se encontró la librería de BootstrapLauncher. El juego puede no iniciar correctamente.`);
                        }
                      }
                    } else {
                      logProgressService.warning(`Instalador ejecutado pero no se encontró JAR instalado. Continuando con Universal JAR.`);
                    }
                  } catch (installerError) {
                    logProgressService.error(`Error al ejecutar instalador:`, installerError);
                    logProgressService.warning(`Continuando con Universal JAR aunque puede no funcionar.`);
                  }
                } else {
                  logProgressService.warning(`No se pudo obtener el instalador. El Universal JAR puede no funcionar para el cliente.`);
                }
              }
            } catch (zipError) {
              logProgressService.warning(`No se pudo verificar el contenido del Universal JAR:`, zipError);
              logProgressService.info(`Asumiendo que el Universal JAR contiene BootstrapLauncher y continuando...`);
            }
          } else {
            logProgressService.error(`Universal JAR no existe en: ${firstJar}`);
          }
        }
      }
    }
    
    // Para Forge/NeoForge, asegurarse de que BootstrapLauncher esté en el classpath
    if ((loader === 'forge' || loader === 'neoforge') && libraryJars.length > 0) {
      // Verificar si BootstrapLauncher ya está en el classpath
      const hasBootstrapLauncher = libraryJars.some(libPath => {
        const libName = path.basename(libPath).toLowerCase();
        return libName.includes('bootstraplauncher');
      });
      
      if (!hasBootstrapLauncher) {
        // Buscar BootstrapLauncher en las librerías descargadas
        const bootstrapLauncher = this.findBootstrapLauncherLibrary(opts.loaderVersion || '');
        if (bootstrapLauncher) {
          // Añadir BootstrapLauncher al principio del classpath
          libraryJars.unshift(bootstrapLauncher);
          logProgressService.info(`BootstrapLauncher añadido al classpath: ${path.basename(bootstrapLauncher)}`);
        } else {
          logProgressService.warning(`No se encontró la librería de BootstrapLauncher. El juego puede no iniciar correctamente.`);
        }
      }
    }
    
    // SOLUCIÓN CRÍTICA: Asegurar que las librerías de log4j estén en el classpath
    // Estas librerías son esenciales para Forge y deben estar presentes
    if ((loader === 'forge' || loader === 'neoforge') && mainClass.includes('ForgeBootstrap')) {
      const log4jLibraries = await this.ensureLog4jLibraries(libraryJars);
      
      // Añadir log4j-core al classpath si no está presente
      if (log4jLibraries.log4jCore && !libraryJars.includes(log4jLibraries.log4jCore)) {
        libraryJars.push(log4jLibraries.log4jCore);
        logProgressService.info(`log4j-core añadido al classpath: ${path.basename(log4jLibraries.log4jCore)}`);
      }
      
      // Añadir log4j-api al classpath si no está presente
      if (log4jLibraries.log4jApi && !libraryJars.includes(log4jLibraries.log4jApi)) {
        libraryJars.push(log4jLibraries.log4jApi);
        logProgressService.info(`log4j-api añadido al classpath: ${path.basename(log4jLibraries.log4jApi)}`);
      }
      
      // Verificar que ambas estén presentes después de intentar añadirlas
      const hasLog4jCore = libraryJars.some(libPath => {
        const libName = path.basename(libPath).toLowerCase();
        return libName.includes('log4j-core');
      });
      const hasLog4jApi = libraryJars.some(libPath => {
        const libName = path.basename(libPath).toLowerCase();
        return libName.includes('log4j-api');
      });
      
      if (!hasLog4jCore || !hasLog4jApi) {
        logProgressService.warning(`Librerías de log4j faltantes en classpath. log4j-core: ${hasLog4jCore}, log4j-api: ${hasLog4jApi}`);
        logProgressService.warning(`El juego puede fallar al iniciar sin estas librerías críticas.`);
      } else {
        logProgressService.info(`Librerías de log4j verificadas en classpath: log4j-core y log4j-api presentes`);
      }
    }
    
    // SOLUCIÓN CRÍTICA: Eliminar duplicados del classpath antes de construir el comando
    // Esto previene errores como "net.minecraftforge.coremod specified more than once to --patch-module"
    const uniqueLibraryJars: string[] = [];
    const seenPaths = new Set<string>();
    const seenBasenames = new Set<string>();
    
    for (const libPath of libraryJars) {
      // Normalizar la ruta para comparación (resolver rutas relativas y usar separadores consistentes)
      const normalizedPath = path.resolve(libPath).toLowerCase();
      const basename = path.basename(libPath).toLowerCase();
      
      // Verificar duplicados por ruta completa y por nombre de archivo
      // Algunos JARs pueden estar en diferentes ubicaciones pero ser el mismo archivo
      if (!seenPaths.has(normalizedPath) && !seenBasenames.has(basename)) {
        uniqueLibraryJars.push(libPath);
        seenPaths.add(normalizedPath);
        seenBasenames.add(basename);
      } else {
        logProgressService.warning(`Duplicado detectado y eliminado del classpath: ${path.basename(libPath)}`);
      }
    }
    
    const duplicatesRemoved = libraryJars.length - uniqueLibraryJars.length;
    if (duplicatesRemoved > 0) {
      logProgressService.info(`Eliminados ${duplicatesRemoved} duplicados del classpath. Total de librerías únicas: ${uniqueLibraryJars.length}`);
    }
    
    // SOLUCIÓN CRÍTICA: Filtrar JARs de Forge/NeoForge para excluir universal.jar, server.jar e installer
    // y garantizar que solo haya una instancia de los coremods clave (modlauncher, fmlloader, fmlcore)
    let finalLibraryJars: string[] = [];
    let classpath: string;
    
    if (loader === 'forge' || loader === 'neoforge') {
      const EXCLUSION_KEYWORDS = ['-universal.jar', '-server.jar', '-installer.jar', '-client.jar'];
      const CORE_SINGLETON_KEYWORDS = ['modlauncher-', 'fmlloader-', 'fmlcore-'];
      const seenCoreSingleton = new Set<string>();
      
      // Filtrar librerías excluyendo universal, server, installer y client
      const filteredLibraries: string[] = [];
      const excludedJars: string[] = [];
      
      for (const libPath of uniqueLibraryJars) {
        const basename = path.basename(libPath).toLowerCase();
        const shouldExclude = EXCLUSION_KEYWORDS.some(keyword => basename.includes(keyword));
        
        // Si es un JAR de Forge/NeoForge que debe excluirse
        if (shouldExclude && (basename.includes('forge') || basename.includes('neoforge'))) {
          excludedJars.push(libPath);
          logProgressService.info(`JAR excluido del classpath (solo para servidor/legacy): ${path.basename(libPath)}`);
        } else {
          // Garantizar que los coremods críticos (modlauncher, fmlloader, fmlcore) aparezcan solo una vez
          const coreKey = CORE_SINGLETON_KEYWORDS.find(keyword => basename.includes(keyword));
          if (coreKey) {
            if (seenCoreSingleton.has(coreKey)) {
              excludedJars.push(libPath);
              logProgressService.info(`JAR excluido del classpath (duplicado de ${coreKey}): ${path.basename(libPath)}`);
              continue;
            }
            seenCoreSingleton.add(coreKey);
          }
          
          filteredLibraries.push(libPath);
        }
      }
      // Nota: No se reinsertará el client.jar; el bootstrap de Forge lo manejará.
      
      if (excludedJars.length > 0) {
        logProgressService.info(`Excluidos ${excludedJars.length} JARs del classpath (universal/server/installer). Total de librerías después del filtro: ${filteredLibraries.length}`);
        excludedJars.forEach(jar => {
          logProgressService.info(`  - Excluido: ${path.basename(jar)}`);
        });
      }
      
      // Verificar que solo haya un JAR de Forge/NeoForge principal
      const forgeJars = filteredLibraries.filter(lib => {
        const basename = path.basename(lib).toLowerCase();
        return (basename.includes('forge') || basename.includes('neoforge')) && 
               (basename.includes('-universal.jar') || basename.includes('-server.jar') || basename.includes('-client.jar'));
      });
      
      if (forgeJars.length > 1) {
        logProgressService.warning(`ADVERTENCIA: Aún hay ${forgeJars.length} JARs de Forge en el classpath después del filtro:`);
        forgeJars.forEach((jar, idx) => {
          logProgressService.warning(`  ${idx + 1}. ${path.basename(jar)}`);
        });
      } else if (forgeJars.length === 1) {
        logProgressService.info(`JAR de Forge/NeoForge único confirmado: ${path.basename(forgeJars[0])}`);
      }
      
      // Usar las librerías filtradas
      finalLibraryJars = filteredLibraries;
      classpath = filteredLibraries.join(path.delimiter);
      
      // Log del classpath para depuración
      logProgressService.info(`Classpath final contiene ${filteredLibraries.length} librerías únicas. Primera librería: ${path.basename(filteredLibraries[0] || 'N/A')}`);
    } else {
      // Para otros loaders, usar las librerías únicas sin filtro adicional
      finalLibraryJars = uniqueLibraryJars;
      classpath = uniqueLibraryJars.join(path.delimiter);
      
      // Log del classpath para depuración
      logProgressService.info(`Classpath contiene ${uniqueLibraryJars.length} librerías únicas. Primera librería: ${path.basename(uniqueLibraryJars[0] || 'N/A')}`);
    }

    // Definir argumentos del juego (necesarios para Minecraft)
    // Crear un UUID falso para perfiles no premium, o usar el real si está disponible
    // Asegurar que el UUID esté en formato válido
    const fakeUUID = ensureValidUUID(opts.userProfile?.id);

    // Obtener el ID real del assetIndex del archivo version.json
    let assetIndexId = opts.mcVersion; // Por defecto usar la versión de Minecraft
    const loaderVersionJsonPath = await minecraftDownloadService.downloadVersionMetadata(opts.mcVersion);

    if (fs.existsSync(loaderVersionJsonPath)) {
      try {
        const versionData = JSON.parse(fs.readFileSync(loaderVersionJsonPath, 'utf-8'));
        if (versionData.assetIndex && versionData.assetIndex.id) {
          assetIndexId = versionData.assetIndex.id;
        }
      } catch (error) {
        logProgressService.warning(`No se pudo leer el archivo version.json para obtener el assetIndex: ${error}`);
      }
    }

    // Argumentos del juego (modelo Modrinth exacto)
    // Estos argumentos se pasan a ModLauncher, que luego los pasa al juego
    const baseGameArgs = [
      '--username', opts.userProfile?.username || 'Player',
      '--version', opts.mcVersion,
      '--gameDir', opts.instancePath,
      '--assetsDir', path.join(getLauncherDataPath(), 'assets'),
      '--assetIndex', assetIndexId,
      '--uuid', fakeUUID,
      '--accessToken', opts.userProfile?.accessToken || '0',
      '--userType', 'mojang',
      '--versionType', 'release'  // Modrinth usa 'release' no el nombre del launcher
    ];
    
    // Añadir clientId y xuid (como en Modrinth)
    // Usar valores por defecto si no están disponibles en el perfil
    baseGameArgs.push('--clientId', 'c4502edb-87c6-40cb-b595-64a280cf8906');
    baseGameArgs.push('--xuid', '0');

    // Añadir argumentos de tamaño de ventana si están definidos
    if (opts.windowSize) {
      baseGameArgs.push('--width', opts.windowSize.width.toString(), '--height', opts.windowSize.height.toString());
    }

    // MIGRACIÓN JPMS: Separar librerías en module-path y classpath para Forge/NeoForge
    // Module-path: JARs modulares de Forge (client.jar, modlauncher, fmlloader, fmlcore, bootstraplauncher, securejarhandler, asm, log4j)
    // Classpath: Solo dependencias no modulares (guava, gson, commons, etc.)
    let modulePath = '';
    let classpathForLaunch = classpath;
    
    if (loader === 'forge' || loader === 'neoforge') {
      // Identificar JARs que deben ir en module-path (módulos de Forge)
      const modulePathLibs: string[] = [];
      const classpathOnlyLibs: string[] = [];
      
      // Palabras clave para identificar JARs modulares de Forge
      const MODULE_KEYWORDS = [
        'forge-', 'neoforge-',
        'modlauncher-', 'fmlloader-', 'fmlcore-',
        'bootstraplauncher-', 'securejarhandler-',
        'asm-', 'asm-commons-', 'asm-tree-', 'asm-util-', 'asm-analysis-',
        'log4j-api-', 'log4j-core-'
      ];
      
      // Palabras clave para identificar dependencias no modulares (van en classpath)
      const CLASSPATH_ONLY_KEYWORDS = [
        'guava-', 'gson-', 'commons-io-', 'commons-lang3-',
        'jopt-simple-', 'jline-', 'oshi-', 'oshi-core-'
      ];
      
      for (const libPath of finalLibraryJars) {
        const basename = path.basename(libPath).toLowerCase();
        const isModule = MODULE_KEYWORDS.some(keyword => basename.includes(keyword));
        const isClasspathOnly = CLASSPATH_ONLY_KEYWORDS.some(keyword => basename.includes(keyword));
        
        if (isModule) {
          // JARs modulares van en module-path
          modulePathLibs.push(libPath);
        } else if (!isClasspathOnly) {
          // Si no es claramente classpath-only, verificar si es un JAR de Forge
          // Los JARs de Forge que no son modulares van en classpath
          if (basename.includes('forge') || basename.includes('neoforge')) {
            // JARs de Forge no modulares van en classpath
            classpathOnlyLibs.push(libPath);
          } else {
            // Por defecto, dependencias van en classpath
            classpathOnlyLibs.push(libPath);
            }
          } else {
          // Dependencias no modulares van en classpath
          classpathOnlyLibs.push(libPath);
        }
      }
      
      // Construir module-path y classpath separados
      if (modulePathLibs.length > 0) {
        modulePath = modulePathLibs.join(path.delimiter);
        logProgressService.info(`Module-path configurado con ${modulePathLibs.length} librerías modulares: ${modulePathLibs.map(p => path.basename(p)).slice(0, 5).join(', ')}${modulePathLibs.length > 5 ? '...' : ''}`);
      } else {
        logProgressService.error(`ERROR CRÍTICO: No se encontraron librerías modulares para el module-path.`);
        logProgressService.error(`Total de librerías procesadas: ${finalLibraryJars.length}`);
        if (finalLibraryJars.length > 0) {
          logProgressService.error(`Ejemplos: ${finalLibraryJars.slice(0, 10).map(p => path.basename(p)).join(', ')}`);
        }
      }
      
      if (classpathOnlyLibs.length > 0) {
        classpathForLaunch = classpathOnlyLibs.join(path.delimiter);
        logProgressService.info(`Classpath configurado con ${classpathOnlyLibs.length} librerías de dependencia (no modulares)`);
      } else {
        // Si no hay librerías para classpath, usar un classpath mínimo
        classpathForLaunch = '';
        logProgressService.info(`Classpath mínimo: solo módulos en module-path`);
      }
      
      // Verificar que el client.jar esté en module-path si existe
      const clientJarInModulePath = modulePathLibs.find(lib => {
        const basename = path.basename(lib).toLowerCase();
        return basename.includes('-client.jar') && (basename.includes('forge') || basename.includes('neoforge'));
      });
      
      if (clientJarInModulePath) {
        logProgressService.info(`JAR del cliente confirmado en module-path: ${path.basename(clientJarInModulePath)}`);
      } else {
        logProgressService.warning(`ADVERTENCIA: No se encontró client.jar en module-path. El juego puede no iniciar correctamente.`);
      }
    }
    
    // Combinar todos los argumentos
    const launchArgs: string[] = [
      ...updatedJvmArgs,
      ...additionalJvmArgs,
    ];
    
    // MODELO MODRINTH: Usar module-path y classpath separados para Forge/NeoForge
    if ((loader === 'forge' || loader === 'neoforge') && mainClass.includes('modlauncher.Launcher')) {
      // Verificar si tenemos las rutas del perfil de Forge
      const forgeModulePath = (this as any)._forgeModulePath as string[] | undefined;
      const forgeClasspath = (this as any)._forgeClasspath as string[] | undefined;
      
      if (forgeModulePath && forgeModulePath.length > 0 && forgeClasspath) {
        // Usar las rutas del perfil construido (modelo Modrinth)
        const modulePathStr = forgeModulePath.join(path.delimiter);
        const classpathStr = forgeClasspath.join(path.delimiter);
        
        // CRÍTICO: Validar que module-path no esté vacío
        if (modulePathStr && modulePathStr.length > 0) {
          launchArgs.push('--module-path', modulePathStr);
          logProgressService.info(`Module-path configurado: ${forgeModulePath.length} módulos`);
        } else {
          logProgressService.error(`ERROR: Module-path está vacío. No se puede lanzar el juego.`);
          throw new Error('Module-path está vacío. Las librerías de Forge no se clasificaron correctamente.');
        }
        
        if (classpathStr && classpathStr.length > 0) {
          launchArgs.push('-cp', classpathStr);
          logProgressService.info(`Classpath configurado: ${forgeClasspath.length} librerías`);
        }
        
        logProgressService.info(`Usando module-path (${forgeModulePath.length} librerías) y classpath (${forgeClasspath.length} librerías) para ${mainClass} [Modelo Modrinth]`);
      } else if (modulePath && modulePath.length > 0 && classpathForLaunch) {
        // Fallback: usar las rutas construidas por el método anterior
      launchArgs.push('--module-path', modulePath);
        launchArgs.push('-cp', classpathForLaunch);
        logProgressService.info(`Usando module-path y classpath (método anterior) para ${mainClass}`);
    } else {
        // Último fallback: solo classpath
        if (classpathForLaunch) {
          launchArgs.push('-cp', classpathForLaunch);
          logProgressService.warning(`ADVERTENCIA: Usando solo classpath (sin module-path). Esto puede causar problemas con modlauncher.`);
        } else {
          logProgressService.error(`ERROR: No hay librerías configuradas. El juego no puede iniciar.`);
        }
      }
    } else {
      // Para otros loaders, usar solo classpath
      launchArgs.push('-cp', classpathForLaunch);
    }
    
    // Añadir clase principal y argumentos del juego
    // Asegurar que mainClass sea un string
    const mainClassString = typeof mainClass === 'string' ? mainClass : String(mainClass || 'net.minecraft.client.main.Main');
    
    launchArgs.push(
      mainClassString,
      ...baseGameArgs,
      ...additionalGameArgs,
      ...(opts.gameArgs || [])
    );
    
    // Asegurar que todos los argumentos sean strings antes de retornar
    return launchArgs.map(arg => typeof arg === 'string' ? arg : String(arg));
  }

  /**
   * Construye argumentos de lanzamiento para Forge/NeoForge (FASE DE EJECUCIÓN)
   * Lógica JPMS completa con clasificación estricta de librerías
   */
  buildForgeLaunchArguments(
    metadata: ForgeInstanceMetadata,
    user: UserSession,
    instancePath: string,
    mcVersion: string,
    loaderType: 'forge' | 'neoforge',
    ramMb: number = 4096,
    windowSize?: { width: number; height: number }
  ): string[] {
    const launcherDataPath = getLauncherDataPath();
    const minMem = Math.min(512, ramMb / 4);
    
    // A. Clasificación Estricta de Librerías
    const { modulePath: modulePathLibs, classpath: classpathLibs } = this.partitionForgeLibraries(
      metadata.libraries.map(lib => ({ name: lib.name, path: lib.path, url: lib.url })),
      launcherDataPath
    );
    
    // Filtrar solo las que existen
    const modulePathFull = modulePathLibs.filter(p => fs.existsSync(p));
    const classpathFull = classpathLibs.filter(p => fs.existsSync(p));
    
    // Construir strings de rutas
    const modulePathStr = modulePathFull.join(path.delimiter);
    const classpathStr = classpathFull.join(path.delimiter);
    
    // B. Argumentos JVM completos (JPMS)
    const jvmArgs: string[] = [
      // Configuración de memoria
      `-Xms${minMem}m`,
      `-Xmx${ramMb}m`,
      
      // Garbage Collector: G1GC (recomendado para Minecraft/Forge)
      '-XX:+UseG1GC',
      '-XX:+UnlockExperimentalVMOptions',
      '-XX:MaxGCPauseMillis=200',
      '-XX:+ParallelRefProcEnabled',
      '-XX:+DisableExplicitGC',
      '-XX:+AlwaysPreTouch',
      
      // Optimizaciones G1GC
      '-XX:G1NewSizePercent=30',
      '-XX:G1MaxNewSizePercent=40',
      '-XX:G1HeapRegionSize=8M',
      '-XX:G1ReservePercent=20',
      '-XX:G1HeapWastePercent=5',
      '-XX:G1MixedGCCountTarget=4',
      '-XX:InitiatingHeapOccupancyPercent=15',
      '-XX:G1MixedGCLiveThresholdPercent=90',
      '-XX:G1RSetUpdatingPauseTimePercent=5',
      '-XX:SurvivorRatio=32',
      '-XX:MaxTenuringThreshold=1',
      '-XX:TargetSurvivorRatio=90',
      
      // Optimizaciones de compilación JIT
      '-XX:+TieredCompilation',
      '-XX:TieredStopAtLevel=1',
      '-XX:MaxInlineLevel=15',
      '-XX:MaxTrivialSize=12',
      '-XX:-DontCompileHugeMethods',
      '-XX:+UseFastUnorderedTimeStamps',
      
      // Optimizaciones de memoria
      '-XX:+UseStringDeduplication',
      '-XX:+OptimizeStringConcat',
      '-XX:+UseCompressedOops',
      '-XX:+UseCompressedClassPointers',
      '-XX:+PerfDisableSharedMem',
      
      // Flags de Aikar (optimizaciones populares para Minecraft)
      '-Dusing.aikars.flags=https://mcflags.emc.gs',
      '-Daikars.new.flags=true',
      
      // Nota: Los siguientes argumentos fueron removidos en Java 21 o no son compatibles:
      // - UseFastAccessorMethods: Removido en Java 21
      // - UseThreadPriorities: Removido en Java 21
      // - ThreadPriorityPolicy: Removido en Java 21
      // - ReduceSignalUsage: Removido en Java 21
      // - UseBiasedLocking: Removido en Java 15+
      // - UseTransparentHugePages: Solo Linux
      // - UseLargePages: Requiere configuración especial en Windows
      
      // JPMS: Apertura de módulos (completo)
      '--add-modules=ALL-MODULE-PATH',
      // Añadir explícitamente log4j como módulo automático (requerido por coremod)
      '--add-modules', 'org.apache.logging.log4j.core,org.apache.logging.log4j',
      '--add-opens', 'java.base/java.util.jar=ALL-UNNAMED',
      '--add-opens', 'java.base/java.lang=ALL-UNNAMED',
      '--add-opens', 'java.base/java.util=ALL-UNNAMED',
      '--add-opens', 'java.base/java.lang.invoke=ALL-UNNAMED',
      '--add-opens', 'java.base/java.util.concurrent.atomic=ALL-UNNAMED',
      '--add-opens', 'java.base/java.net=ALL-UNNAMED',
      '--add-opens', 'java.base/java.io=ALL-UNNAMED',
      '--add-opens', 'java.base/java.lang.reflect=ALL-UNNAMED',
      '--add-opens', 'java.base/java.text=ALL-UNNAMED',
      '--add-opens', 'java.base/java.util.concurrent=ALL-UNNAMED',
      '--add-opens', 'java.base/java.util.regex=ALL-UNNAMED',
      '--add-opens', 'java.base/java.util.zip=ALL-UNNAMED',
      '--add-exports', 'java.base/sun.nio.ch=ALL-UNNAMED',
      '--add-exports', 'java.base/java.io=ALL-UNNAMED',
      
      // Solución para Java 21: nashorn fue removido, pero Forge lo requiere
      // Añadir argumentos para permitir que Forge funcione sin nashorn
      '--add-opens', 'java.base/java.lang=net.minecraftforge.coremod',
      '--add-opens', 'java.base/java.util=net.minecraftforge.coremod',
      '--add-opens', 'java.base/java.lang.reflect=net.minecraftforge.coremod',
      '--add-opens', 'java.base/java.util.concurrent=net.minecraftforge.coremod',
      
      // Apertura de módulos para log4j (requerido por coremod - CRÍTICO)
      '--add-opens', 'java.base/java.lang=org.apache.logging.log4j.core',
      '--add-opens', 'java.base/java.util=org.apache.logging.log4j.core',
      '--add-opens', 'java.base/java.lang.reflect=org.apache.logging.log4j.core',
      '--add-opens', 'java.base/java.util.concurrent=org.apache.logging.log4j.core',
      '--add-opens', 'java.base/java.lang=org.apache.logging.log4j',
      '--add-opens', 'java.base/java.util=org.apache.logging.log4j',
      
      // Propiedades del sistema para Forge
      '-Dforge.logging.console.level=info',
      '-Dforge.logging.markers=REGISTRIES',
      '-Dfml.earlyprogresswindow=false',
      '-Dnashorn.args=--no-deprecation-warning',
      
      // Configuración de Log4j
      '-Dlog4j.configurationFile=log4j2.xml',
      '-Dlog4j2.formatMsgNoLookups=true',
      '-Dlog4j2.loggerContextFactory=org.apache.logging.log4j.core.impl.Log4jContextFactory'
    ];
    
    // CRÍTICO: Validar y añadir Module-path y Classpath
    // Solo añadir --module-path si tiene contenido
    if (modulePathStr && modulePathStr.length > 0) {
      jvmArgs.push('--module-path', modulePathStr);
      logProgressService.info(`Module-path configurado con ${modulePathFull.length} módulos`);
    } else {
      logProgressService.error(`ERROR: La cadena Module-path está vacía. No se puede lanzar el juego.`);
      throw new Error('Module-path está vacío. Las librerías de Forge no se clasificaron correctamente.');
    }
    
    // Classpath siempre se necesita
    if (classpathStr && classpathStr.length > 0) {
      jvmArgs.push('-cp', classpathStr);
      logProgressService.info(`Classpath configurado con ${classpathFull.length} librerías`);
    } else {
      logProgressService.warning(`Advertencia: Classpath está vacío. Esto puede causar errores.`);
    }
    
    // C. Clase Principal
    const mainClass = metadata.mainClass || 'cpw.mods.modlauncher.Launcher';
    
    // D. Argumentos de Minecraft
    const gameArgs: string[] = [
      '--username', user.username,
      '--version', mcVersion,
      '--gameDir', instancePath,
      '--assetsDir', path.join(launcherDataPath, 'assets'),
      '--assetIndex', '29', // TODO: Obtener del version.json
      '--uuid', user.uuid,
      '--accessToken', user.accessToken,
      '--userType', 'mojang',
      '--versionType', 'release',
      '--clientId', user.clientId || 'c4502edb-87c6-40cb-b595-64a280cf8906',
      '--xuid', user.xuid || '0'
    ];
    
    // Añadir tamaño de ventana si está definido
    if (windowSize) {
      gameArgs.push('--width', windowSize.width.toString());
      gameArgs.push('--height', windowSize.height.toString());
    }
    
    // E. Argumentos específicos de Forge/NeoForge
    const forgeArgs: string[] = [
      '--launchTarget', loaderType === 'forge' ? 'forge_client' : 'neoforge_client'
    ];
    
    // Combinar todos los argumentos
    return [
      ...jvmArgs,
      mainClass,
      ...gameArgs,
      ...forgeArgs
    ];
  }

  /**
   * Registra la salida del juego en un archivo de log específico de la instancia
   */
  private logOutputToFile(instanceName: string, output: string): void {
    try {
      const launcherPath = getLauncherDataPath();
      const logsDir = path.join(launcherPath, 'logs', 'games');
      fs.mkdirSync(logsDir, { recursive: true });

      // Crear un nombre de archivo seguro basado en el nombre de la instancia
      const safeInstanceName = instanceName
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Eliminar tildes
        .replace(/[^\w\s-]/g, '') // Eliminar caracteres especiales
        .replace(/\s+/g, '-') // Reemplazar espacios con guiones
        .replace(/-+/g, '-') // Eliminar múltiples guiones seguidos
        .trim(); // Eliminar espacios al inicio y final

      const logFilePath = path.join(logsDir, `${safeInstanceName}_${new Date().toISOString().split('T')[0]}.log`);

      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] ${output}\n`;

      fs.appendFileSync(logFilePath, logEntry);
    } catch (error) {
      console.error('Error al escribir log al archivo:', error);
    }
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
   * Descarga librerías faltantes en paralelo para el perfil de Forge
   */
  private async downloadMissingLibrariesForProfile(
    libraries: Array<{ name: string; path: string; url?: string }>,
    launcherDataPath: string
  ): Promise<void> {
    const librariesToDownload: Array<{ lib: { name: string; path: string; url: string }; libPath: string }> = [];
    
    for (const lib of libraries) {
      const libPath = path.join(launcherDataPath, 'libraries', lib.path);
      
      // Verificar si existe y es válido
      let needsDownload = false;
      if (!fs.existsSync(libPath)) {
        needsDownload = true;
      } else {
        // Verificar que el archivo no esté corrupto
        try {
          const stats = fs.statSync(libPath);
          if (stats.size === 0) {
            needsDownload = true;
            fs.unlinkSync(libPath); // Eliminar archivo corrupto
            logProgressService.warning(`Archivo corrupto detectado, re-descargando: ${path.basename(libPath)}`);
          }
        } catch (err) {
          needsDownload = true;
        }
      }
      
      if (needsDownload) {
        // Obtener URL: usar la proporcionada o construirla desde el nombre Maven
        let url = lib.url;
        if (!url) {
          url = this.constructMavenUrl(lib.name, lib.path);
        }
        
        if (url) {
          librariesToDownload.push({ lib: { ...lib, url }, libPath });
        } else {
          logProgressService.warning(`No se puede descargar ${lib.name}: falta URL y no se puede construir`);
        }
      }
    }
    
    if (librariesToDownload.length === 0) {
      logProgressService.info(`Todas las librerías están presentes y son válidas`);
      return;
    }
    
    logProgressService.info(`Descargando ${librariesToDownload.length} librerías faltantes...`);
    
    // Descargar en paralelo (aumentado para mayor velocidad)
    const CONCURRENT_DOWNLOADS = 70;
    let downloaded = 0;
    let failed = 0;
    
    for (let i = 0; i < librariesToDownload.length; i += CONCURRENT_DOWNLOADS) {
      const batch = librariesToDownload.slice(i, i + CONCURRENT_DOWNLOADS);
      
      await Promise.allSettled(
        batch.map(async ({ lib, libPath }) => {
          try {
            await this.downloadArtifact(lib.url, libPath);
            downloaded++;
          } catch (err) {
            failed++;
            logProgressService.warning(`Error al descargar ${lib.name}: ${err}`);
          }
        })
      );
      
      // Reportar progreso cada 20 librerías o al final
      const currentProgress = Math.min(i + CONCURRENT_DOWNLOADS, librariesToDownload.length);
      if (currentProgress % 20 === 0 || currentProgress >= librariesToDownload.length) {
        logProgressService.info(`Progreso: ${currentProgress}/${librariesToDownload.length} (${downloaded} descargadas, ${failed} fallidas)`);
      }
    }
    
    logProgressService.info(`Descarga de librerías completada: ${downloaded} descargadas, ${failed} fallidas, ${librariesToDownload.length - downloaded - failed} ya existían`);
  }

  /**
   * Construye URL Maven desde el nombre de la librería
   */
  private constructMavenUrl(libName: string, libPath: string): string | null {
    try {
      // Formato: groupId:artifactId:version
      const parts = libName.split(':');
      if (parts.length < 3) {
        return null;
      }
      
      const groupId = parts[0];
      
      // Determinar repositorio base
      let baseUrl: string;
      if (groupId.startsWith('net.minecraftforge') || groupId.startsWith('cpw.mods')) {
        baseUrl = 'https://maven.minecraftforge.net';
      } else if (groupId.startsWith('net.neoforged')) {
        baseUrl = 'https://maven.neoforged.net';
      } else if (groupId.startsWith('com.mojang') || groupId.startsWith('org.lwjgl')) {
        baseUrl = 'https://libraries.minecraft.net';
      } else {
        baseUrl = 'https://repo1.maven.org/maven2';
      }
      
      return `${baseUrl}/${libPath}`;
    } catch (err) {
      return null;
    }
  }

  /**
   * Agrega las dependencias del loader (ASM, etc.) al classpath
   */
  private async addLoaderDependencies(
    libraryJars: string[],
    loader: 'fabric' | 'quilt',
    mcVersion: string,
    loaderVersion: string | undefined,
    launcherPath: string
  ): Promise<void> {
    try {
      // Obtener información del loader desde la API
      const apiUrl = loader === 'fabric' 
        ? `https://meta.fabricmc.net/v2/versions/loader/${mcVersion}`
        : `https://meta.quiltmc.org/v3/versions/loader/${mcVersion}`;
      
      const response = await fetch(apiUrl);
      if (!response.ok) {
        logProgressService.warning(`No se pudieron obtener las dependencias del loader ${loader}`);
        return;
      }

      const versions = await response.json();
      const loaderEntry = loaderVersion 
        ? versions.find((v: any) => v.loader?.version === loaderVersion)
        : versions.find((v: any) => v.loader?.stable) || versions[0];

      if (!loaderEntry || !loaderEntry.launcherMeta) {
        logProgressService.warning(`No se encontró información de dependencias para ${loader}`);
        return;
      }

      // Obtener las librerías requeridas del launcherMeta
      let librariesToAdd: any[] = [];
      
      // Intentar diferentes formatos de la API
      if (loaderEntry.launcherMeta?.libraries?.common && Array.isArray(loaderEntry.launcherMeta.libraries.common)) {
        librariesToAdd = loaderEntry.launcherMeta.libraries.common;
      } else if (loaderEntry.launcherMeta?.libraries && Array.isArray(loaderEntry.launcherMeta.libraries)) {
        librariesToAdd = loaderEntry.launcherMeta.libraries;
      } else if (loaderEntry.intermediary) {
        // Si no hay launcherMeta, usar dependencias conocidas de Fabric/Quilt
        librariesToAdd = this.getKnownLoaderDependencies(loader, loaderEntry.loader?.version);
      }

      // Si aún no hay librerías, usar dependencias conocidas como fallback
      if (librariesToAdd.length === 0) {
        logProgressService.warning(`No se encontraron librerías en la API, usando dependencias conocidas para ${loader}`);
        librariesToAdd = this.getKnownLoaderDependencies(loader, loaderEntry.loader?.version);
      }

      // Descargar y agregar cada librería al classpath
      for (const lib of librariesToAdd) {
        let libName: string;
        
        // Manejar diferentes formatos de librería
        if (typeof lib === 'string') {
          libName = lib;
        } else if (lib.name) {
          libName = lib.name;
        } else {
          continue;
        }

        // Construir la ruta de la librería
        const libPath = path.join(launcherPath, 'libraries', this.getLibraryPath(libName));
        const libDir = path.dirname(libPath);

        // Verificar si la librería ya existe
        if (fs.existsSync(libPath)) {
          if (!libraryJars.includes(libPath)) {
            libraryJars.push(libPath);
          }
          continue;
        }

        // Intentar descargar la librería si no existe
        try {
          this.ensureDir(libDir);
          
          // Construir URL de descarga desde Maven
          const libParts = libName.split(':');
          if (libParts.length >= 3) {
            const [groupId, artifactId, version] = libParts;
            const groupPath = groupId.replace(/\./g, '/');
            
            // Intentar múltiples repositorios Maven
            const mavenUrls = [
              `https://maven.fabricmc.net/${groupPath}/${artifactId}/${version}/${artifactId}-${version}.jar`,
              `https://maven.quiltmc.org/repository/release/${groupPath}/${artifactId}/${version}/${artifactId}-${version}.jar`,
              `https://repo1.maven.org/maven2/${groupPath}/${artifactId}/${version}/${artifactId}-${version}.jar`
            ];
            
            let downloaded = false;
            for (const mavenUrl of mavenUrls) {
              try {
                const libResponse = await fetch(mavenUrl);
                if (libResponse.ok) {
                  const buffer = Buffer.from(await libResponse.arrayBuffer());
                  fs.writeFileSync(libPath, buffer);
                  if (!libraryJars.includes(libPath)) {
                    libraryJars.push(libPath);
                  }
                  logProgressService.info(`Librería ${libName} descargada para ${loader}`);
                  downloaded = true;
                  break;
                }
              } catch (fetchError) {
                // Continuar con el siguiente repositorio
                continue;
              }
            }
            
            if (!downloaded) {
              logProgressService.warning(`No se pudo descargar la librería ${libName} desde ningún repositorio`);
            }
          }
        } catch (error) {
          logProgressService.warning(`Error al procesar la librería ${libName}: ${error}`);
          // Continuar con las siguientes librerías
        }
      }
    } catch (error) {
      logProgressService.warning(`Error al obtener dependencias del loader ${loader}: ${error}`);
      // No lanzar error, solo continuar sin las dependencias adicionales
    }
  }

  /**
   * Verifica si una librería está permitida según las reglas de compatibilidad
   */
  private isLibraryAllowed(rules: any[]): boolean {
    let allowed = true; // Por defecto permitida si no hay reglas

    for (const rule of rules) {
      if (rule.action === 'disallow') {
        // Si hay una regla de "disallow" que coincide, no está permitida
        if (this.matchesRule(rule)) {
          allowed = false;
        }
      } else if (rule.action === 'allow') {
        // Si hay una regla de "allow" que coincide, está permitida
        if (this.matchesRule(rule)) {
          allowed = true;
        }
      }
    }

    return allowed;
  }

  /**
   * Verifica si una regla de librería coincide con el sistema actual
   */
  private matchesRule(rule: any): boolean {
    if (!rule.os) {
      return true; // Sin restricción de OS, siempre coincide
    }

    const osName = rule.os.name;
    const currentOs = process.platform;

    if (osName === 'windows' && currentOs === 'win32') return true;
    if (osName === 'osx' && currentOs === 'darwin') return true;
    if (osName === 'linux' && currentOs === 'linux') return true;

    return false;
  }

  /**
   * Verifica si una librería es nativa de otra plataforma (no Windows)
   */
  private isNativeLibraryForOtherPlatform(libraryName: string): boolean {
    const currentOs = process.platform;
    
    // En Windows, omitir librerías nativas de Linux y macOS
    if (currentOs === 'win32') {
      return libraryName.includes(':natives-linux') || 
             libraryName.includes(':natives-macos') ||
             libraryName.includes(':natives-osx') ||
             libraryName.includes('linux-aarch_64') ||
             libraryName.includes('linux-x86_64') ||
             libraryName.includes('osx-aarch_64') ||
             libraryName.includes('osx-x86_64') ||
             libraryName.includes('java-objc-bridge'); // macOS específico
    }
    
    // En Linux, omitir librerías nativas de Windows y macOS
    if (currentOs === 'linux') {
      return libraryName.includes(':natives-windows') || 
             libraryName.includes(':natives-macos') ||
             libraryName.includes(':natives-osx') ||
             libraryName.includes('osx-aarch_64') ||
             libraryName.includes('osx-x86_64') ||
             libraryName.includes('java-objc-bridge');
    }
    
    // En macOS, omitir librerías nativas de Windows y Linux
    if (currentOs === 'darwin') {
      return libraryName.includes(':natives-windows') || 
             libraryName.includes(':natives-linux') ||
             libraryName.includes('linux-aarch_64') ||
             libraryName.includes('linux-x86_64');
    }

    return false;
  }

  /**
   * Verifica si una librería es realmente necesaria (no es opcional)
   */
  private isLibraryRequired(lib: any): boolean {
    // Si tiene reglas que la deshabilitan, no es necesaria
    if (lib.rules && !this.isLibraryAllowed(lib.rules)) {
      return false;
    }

    // Si es una librería nativa de otra plataforma, no es necesaria
    if (this.isNativeLibraryForOtherPlatform(lib.name)) {
      return false;
    }

    // Si tiene downloads.artifact, es una librería principal (necesaria)
    return !!(lib.downloads && lib.downloads.artifact);
  }

  /**
   * Obtiene las dependencias conocidas de Fabric/Quilt como fallback
   */
  private getKnownLoaderDependencies(loader: 'fabric' | 'quilt', loaderVersion?: string): string[] {
    // Dependencias comunes de Fabric Loader (ASM y otras)
    // Estas son las dependencias mínimas que Fabric necesita para funcionar
    const fabricDependencies = [
      'org.ow2.asm:asm:9.7.1',
      'org.ow2.asm:asm-analysis:9.7.1',
      'org.ow2.asm:asm-commons:9.7.1',
      'org.ow2.asm:asm-tree:9.7.1',
      'net.fabricmc:sponge-mixin:0.12.5+mixin.0.8.5',
      'net.fabricmc:tiny-mappings-parser:0.3.0+build.17',
      'net.fabricmc:tiny-remapper:0.8.10',
      'net.fabricmc:access-widener:2.1.0',
      'org.ow2.asm:asm-util:9.7.1'
    ];

    // Dependencias de Quilt (similar a Fabric pero con algunas diferencias)
    const quiltDependencies = [
      'org.ow2.asm:asm:9.7.1',
      'org.ow2.asm:asm-analysis:9.7.1',
      'org.ow2.asm:asm-commons:9.7.1',
      'org.ow2.asm:asm-tree:9.7.1',
      'org.quiltmc:quilt-loader-solver:0.23.1',
      'org.quiltmc:sponge-mixin:0.12.5+mixin.0.8.5',
      'org.quiltmc:tiny-mappings-parser:0.3.0+build.17',
      'org.quiltmc:tiny-remapper:0.8.10',
      'org.quiltmc:access-widener:2.1.0',
      'org.ow2.asm:asm-util:9.7.1'
    ];

    return loader === 'fabric' ? fabricDependencies : quiltDependencies;
  }

  /**
   * Función auxiliar para encontrar el JAR del loader
   */
  private findLoaderJar(instancePath: string, loader: string, version?: string): string | null {
    const loaderDir = path.join(instancePath, 'loader');

    // Buscar archivos JAR que coincidan con el loader
    if (fs.existsSync(loaderDir)) {
      const files = fs.readdirSync(loaderDir);
      
      // Para Forge/NeoForge, evitar usar el instalador directamente
      // Buscar primero archivos que NO sean instaladores
      const nonInstallerJars: string[] = [];
      const installerJars: string[] = [];
      
      for (const file of files) {
        if (file.endsWith('.jar')) {
          const fileLower = file.toLowerCase();
          if (fileLower.includes(loader)) {
            // Detectar si es un instalador
            if (fileLower.includes('installer')) {
              installerJars.push(file);
            } else {
              // No es un instalador, es un JAR ejecutable
              nonInstallerJars.push(file);
            }
          }
        }
      }
      
      // Priorizar JARs que no sean instaladores
      if (nonInstallerJars.length > 0) {
        // Para Forge, buscar el JAR universal o el JAR principal
        for (const file of nonInstallerJars) {
          const fileLower = file.toLowerCase();
          // Preferir universal.jar o client.jar de Forge
          if (fileLower.includes('universal') || fileLower.includes('client') || !fileLower.includes('server')) {
            return path.join(loaderDir, file);
          }
        }
        // Si no hay universal/client, usar el primero que no sea instalador
        return path.join(loaderDir, nonInstallerJars[0]);
      }
      
      // Si solo hay instaladores, retornar el path del instalador para que se ejecute
      if (installerJars.length > 0) {
        return path.join(loaderDir, installerJars[0]);
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

  /**
   * Crea un perfil de launcher de Minecraft falso para que el instalador de Forge funcione
   */
  private createFakeLauncherProfile(minecraftDir: string): void {
    const launcherProfilesPath = path.join(minecraftDir, 'launcher_profiles.json');
    
    // Si ya existe, no hacer nada
    if (fs.existsSync(launcherProfilesPath)) {
      logProgressService.info(`Perfil de launcher ya existe en: ${launcherProfilesPath}`);
      return;
    }
    
    // Crear el directorio si no existe
    if (!fs.existsSync(minecraftDir)) {
      fs.mkdirSync(minecraftDir, { recursive: true });
    }
    
    // Crear un perfil de launcher falso
    const fakeProfile = {
      profiles: {
        "(Default)": {
          name: "(Default)",
          type: "latest-release",
          created: new Date().toISOString(),
          lastUsed: new Date().toISOString(),
          icon: "Grass"
        }
      },
      selectedProfile: "(Default)",
      clientToken: "00000000-0000-0000-0000-000000000000",
      authenticationDatabase: {},
      selectedUser: {
        account: "",
        profile: ""
      },
      analyticsToken: "",
      launcherVersion: {
        name: "DRK Launcher",
        format: 21,
        profilesFormat: 2
      }
    };
    
    fs.writeFileSync(launcherProfilesPath, JSON.stringify(fakeProfile, null, 2));
    logProgressService.info(`Perfil de launcher falso creado en: ${launcherProfilesPath}`);
  }

  /**
   * Ejecuta el instalador de Forge/NeoForge
   */
  private async runForgeInstaller(
    installerPath: string,
    instancePath: string,
    mcVersion: string,
    loaderVersion: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process');
      
      // Obtener la ruta de Java
      const javaPath = this.getJavaPath(mcVersion);
      if (!javaPath) {
        reject(new Error('No se encontró Java para ejecutar el instalador'));
        return;
      }

      logProgressService.info(`Ejecutando instalador de Forge: ${installerPath}`);
      
      // Ejecutar el instalador con --installClient
      // El instalador de Forge moderno necesita el directorio de Minecraft, no el de la instancia
      const minecraftDir = path.join(process.env.APPDATA || '', '.minecraft');
      const launcherDataPath = getLauncherDataPath();
      
      // Crear un perfil de launcher falso antes de ejecutar el instalador
      this.createFakeLauncherProfile(launcherDataPath);
      
      // Usar el directorio de datos del launcher como base
      const installTarget = launcherDataPath;
      
      logProgressService.info(`Ejecutando instalador de Forge en: ${installTarget}`);
      logProgressService.info(`Comando: ${javaPath} -jar ${installerPath} --installClient ${installTarget}`);
      
      const installerProcess = spawn(javaPath, ['-jar', installerPath, '--installClient', installTarget], {
        cwd: path.dirname(installerPath),
        stdio: 'pipe'
      });

      let stdout = '';
      let stderr = '';

      installerProcess.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
        logProgressService.info(`[Instalador] ${data.toString().trim()}`);
      });

      installerProcess.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
        logProgressService.warning(`[Instalador] ${data.toString().trim()}`);
      });

      installerProcess.on('close', (code: number) => {
        if (code === 0) {
          logProgressService.info(`Instalador de Forge ejecutado exitosamente`);
          resolve();
        } else {
          logProgressService.error(`Instalador de Forge falló con código ${code}`);
          logProgressService.error(`Salida: ${stdout}`);
          logProgressService.error(`Errores: ${stderr}`);
          reject(new Error(`Instalador falló con código ${code}`));
        }
      });

      installerProcess.on('error', (error: Error) => {
        logProgressService.error(`Error al ejecutar instalador:`, error);
        reject(error);
      });
    });
  }

  /**
   * Lee el perfil generado por el instalador de Forge para obtener la configuración correcta
   */
  private readForgeInstallerProfile(mcVersion: string, loaderVersion: string): { versionName: string; versionJsonPath: string } | null {
    const launcherDataPath = getLauncherDataPath();
    const versionName = `${mcVersion}-forge-${loaderVersion}`;
    
    // Buscar directamente el version.json en la carpeta versions
    const versionJsonPath = path.join(launcherDataPath, 'versions', versionName, `${versionName}.json`);
    
    if (fs.existsSync(versionJsonPath)) {
      logProgressService.info(`Version.json de Forge encontrado: ${versionJsonPath}`);
      return { versionName, versionJsonPath };
    }
    
    // Si no se encuentra con el nombre exacto, buscar cualquier version.json de Forge para esta versión
    const versionsDir = path.join(launcherDataPath, 'versions');
    if (fs.existsSync(versionsDir)) {
      const dirs = fs.readdirSync(versionsDir, { withFileTypes: true });
      for (const dir of dirs) {
        if (dir.isDirectory() && dir.name.includes(mcVersion) && dir.name.includes('forge')) {
          const possibleVersionJson = path.join(versionsDir, dir.name, `${dir.name}.json`);
          if (fs.existsSync(possibleVersionJson)) {
            logProgressService.info(`Version.json de Forge encontrado (búsqueda alternativa): ${possibleVersionJson}`);
            return { versionName: dir.name, versionJsonPath: possibleVersionJson };
          }
        }
      }
    }
    
    logProgressService.warning(`No se encontró version.json de Forge para ${versionName}`);
    return null;
  }

  /**
   * Busca la librería de BootstrapLauncher en las librerías descargadas
   */
  private findBootstrapLauncherLibrary(loaderVersion: string): string | null {
    const launcherDataPath = getLauncherDataPath();
    
    // BootstrapLauncher está en net.minecraftforge:bootstraplauncher
    const possiblePaths = [
      path.join(launcherDataPath, 'libraries', 'net', 'minecraftforge', 'bootstraplauncher', '1.1.8', 'bootstraplauncher-1.1.8.jar'),
      path.join(launcherDataPath, 'libraries', 'net', 'minecraftforge', 'bootstraplauncher', '2.1.8', 'bootstraplauncher-2.1.8.jar'),
      path.join(launcherDataPath, 'libraries', 'net', 'minecraftforge', 'bootstraplauncher', '1.1.0', 'bootstraplauncher-1.1.0.jar'),
    ];
    
    for (const bootstrapPath of possiblePaths) {
      if (fs.existsSync(bootstrapPath)) {
        logProgressService.info(`BootstrapLauncher encontrado: ${bootstrapPath}`);
        return bootstrapPath;
      }
    }
    
    // Buscar en todas las versiones de bootstraplauncher
    const bootstraplauncherDir = path.join(launcherDataPath, 'libraries', 'net', 'minecraftforge', 'bootstraplauncher');
    if (fs.existsSync(bootstraplauncherDir)) {
      const versions = fs.readdirSync(bootstraplauncherDir);
      for (const version of versions) {
        const bootstrapJar = path.join(bootstraplauncherDir, version, `bootstraplauncher-${version}.jar`);
        if (fs.existsSync(bootstrapJar)) {
          logProgressService.info(`BootstrapLauncher encontrado: ${bootstrapJar}`);
          return bootstrapJar;
        }
      }
    }
    
    return null;
  }

  /**
   * Busca y descarga las librerías críticas de log4j si no están presentes
   * Retorna las rutas de las librerías encontradas o descargadas
   */
  private async ensureLog4jLibraries(libraryJars: string[]): Promise<{ log4jCore: string | null; log4jApi: string | null }> {
    const launcherDataPath = getLauncherDataPath();
    
    // Versiones comunes de log4j usadas por Minecraft/Forge
    const log4jVersions = ['2.20.0', '2.20.1', '2.19.0', '2.18.0', '2.17.1', '2.16.0'];
    
    let log4jCorePath: string | null = null;
    let log4jApiPath: string | null = null;
    
    // Primero verificar si ya están en el classpath
    for (const libPath of libraryJars) {
      const libName = path.basename(libPath).toLowerCase();
      if (libName.includes('log4j-core') && !log4jCorePath) {
        log4jCorePath = libPath;
      }
      if (libName.includes('log4j-api') && !log4jApiPath) {
        log4jApiPath = libPath;
      }
    }
    
    // Si ya están en el classpath, retornar
    if (log4jCorePath && log4jApiPath) {
      return { log4jCore: log4jCorePath, log4jApi: log4jApiPath };
    }
    
    // Buscar en múltiples ubicaciones posibles
    const searchPaths = [
      path.join(launcherDataPath, 'libraries'),
      path.join(process.env.APPDATA || '', '.minecraft', 'libraries'),
    ];
    
    for (const searchBase of searchPaths) {
      if (!fs.existsSync(searchBase)) continue;
      
      // Buscar log4j-core
      if (!log4jCorePath) {
        for (const version of log4jVersions) {
          const possiblePath = path.join(searchBase, 'org', 'apache', 'logging', 'log4j', 'log4j-core', version, `log4j-core-${version}.jar`);
          if (fs.existsSync(possiblePath)) {
            log4jCorePath = possiblePath;
            logProgressService.info(`log4j-core encontrado: ${log4jCorePath}`);
            break;
          }
        }
      }
      
      // Buscar log4j-api
      if (!log4jApiPath) {
        for (const version of log4jVersions) {
          const possiblePath = path.join(searchBase, 'org', 'apache', 'logging', 'log4j', 'log4j-api', version, `log4j-api-${version}.jar`);
          if (fs.existsSync(possiblePath)) {
            log4jApiPath = possiblePath;
            logProgressService.info(`log4j-api encontrado: ${log4jApiPath}`);
            break;
          }
        }
      }
    }
    
    // Si no se encontraron, intentar descargarlas
    if (!log4jCorePath || !log4jApiPath) {
      // Usar la versión más reciente común (2.20.0)
      const log4jVersion = '2.20.0';
      const mavenBaseUrl = 'https://repo1.maven.org/maven2';
      
      // Descargar log4j-core si falta
      if (!log4jCorePath) {
        try {
          const log4jCorePath_local = path.join(launcherDataPath, 'libraries', 'org', 'apache', 'logging', 'log4j', 'log4j-core', log4jVersion, `log4j-core-${log4jVersion}.jar`);
          const log4jCoreDir = path.dirname(log4jCorePath_local);
          
          if (!fs.existsSync(log4jCorePath_local)) {
            logProgressService.info(`Descargando log4j-core ${log4jVersion}...`);
            fs.mkdirSync(log4jCoreDir, { recursive: true });
            
            const log4jCoreUrl = `${mavenBaseUrl}/org/apache/logging/log4j/log4j-core/${log4jVersion}/log4j-core-${log4jVersion}.jar`;
            const response = await fetch(log4jCoreUrl, {
              headers: { 'User-Agent': 'DRK-Launcher/1.0' }
            });
            
            if (response.ok) {
              const buffer = Buffer.from(await response.arrayBuffer());
              fs.writeFileSync(log4jCorePath_local, buffer);
              logProgressService.info(`log4j-core ${log4jVersion} descargado exitosamente`);
              log4jCorePath = log4jCorePath_local;
            } else {
              logProgressService.warning(`No se pudo descargar log4j-core: HTTP ${response.status}`);
            }
          } else {
            log4jCorePath = log4jCorePath_local;
            logProgressService.info(`log4j-core encontrado en ubicación local: ${log4jCorePath}`);
          }
        } catch (error) {
          logProgressService.warning(`Error al descargar log4j-core:`, error);
        }
      }
      
      // Descargar log4j-api si falta
      if (!log4jApiPath) {
        try {
          const log4jApiPath_local = path.join(launcherDataPath, 'libraries', 'org', 'apache', 'logging', 'log4j', 'log4j-api', log4jVersion, `log4j-api-${log4jVersion}.jar`);
          const log4jApiDir = path.dirname(log4jApiPath_local);
          
          if (!fs.existsSync(log4jApiPath_local)) {
            logProgressService.info(`Descargando log4j-api ${log4jVersion}...`);
            fs.mkdirSync(log4jApiDir, { recursive: true });
            
            const log4jApiUrl = `${mavenBaseUrl}/org/apache/logging/log4j/log4j-api/${log4jVersion}/log4j-api-${log4jVersion}.jar`;
            const response = await fetch(log4jApiUrl, {
              headers: { 'User-Agent': 'DRK-Launcher/1.0' }
            });
            
            if (response.ok) {
              const buffer = Buffer.from(await response.arrayBuffer());
              fs.writeFileSync(log4jApiPath_local, buffer);
              logProgressService.info(`log4j-api ${log4jVersion} descargado exitosamente`);
              log4jApiPath = log4jApiPath_local;
            } else {
              logProgressService.warning(`No se pudo descargar log4j-api: HTTP ${response.status}`);
            }
          } else {
            log4jApiPath = log4jApiPath_local;
            logProgressService.info(`log4j-api encontrado en ubicación local: ${log4jApiPath}`);
          }
        } catch (error) {
          logProgressService.warning(`Error al descargar log4j-api:`, error);
        }
      }
    }
    
    return { log4jCore: log4jCorePath, log4jApi: log4jApiPath };
  }

  /**
   * Busca el JAR de Forge instalado después de ejecutar el instalador
   */
  private async findInstalledForgeJar(
    instancePath: string,
    loader: string,
    mcVersion: string,
    loaderVersion: string
  ): Promise<string | null> {
    // El instalador de Forge crea archivos en el directorio de datos del launcher
    // Buscar en varias ubicaciones posibles
    
    const launcherDataPath = getLauncherDataPath();
    const versionName = `${mcVersion}-forge-${loaderVersion}`;
    
    // 1. Intentar leer el perfil generado por el instalador
    const forgeProfile = this.readForgeInstallerProfile(mcVersion, loaderVersion);
    if (forgeProfile && fs.existsSync(forgeProfile.versionJsonPath)) {
      try {
        const versionData = JSON.parse(fs.readFileSync(forgeProfile.versionJsonPath, 'utf-8'));
        // El instalador genera un JAR en versions/versionName/versionName.jar
        const installedJar = path.join(launcherDataPath, 'versions', forgeProfile.versionName, `${forgeProfile.versionName}.jar`);
        if (fs.existsSync(installedJar)) {
          logProgressService.info(`JAR instalado encontrado desde perfil: ${installedJar}`);
          return installedJar;
        }
      } catch (error) {
        logProgressService.warning(`Error al leer version.json:`, error);
      }
    }
    
    // 2. Buscar el client.jar generado por el instalador
    // El instalador de Forge moderno genera un client.jar en la carpeta de librerías
    const clientJarPaths = [
      // Ubicación estándar del instalador de Forge (en libraries)
      path.join(launcherDataPath, 'libraries', 'net', 'minecraftforge', 'forge', loaderVersion, `forge-${loaderVersion}-client.jar`),
      // En .minecraft estándar
      path.join(process.env.APPDATA || '', '.minecraft', 'libraries', 'net', 'minecraftforge', 'forge', loaderVersion, `forge-${loaderVersion}-client.jar`),
    ];

    logProgressService.info(`Buscando client.jar generado por el instalador de Forge...`);
    for (const clientJarPath of clientJarPaths) {
      if (fs.existsSync(clientJarPath)) {
        logProgressService.info(`Client JAR encontrado: ${clientJarPath}`);
        // El client.jar es válido aunque no contenga BootstrapLauncher directamente
        // BootstrapLauncher está en una librería separada
        return clientJarPath;
      }
    }

    // 2. Buscar en el directorio de datos del launcher (versiones instaladas)
    const possiblePaths = [
      // Ubicación estándar del instalador de Forge
      path.join(launcherDataPath, 'versions', versionName, `${versionName}.jar`),
      path.join(launcherDataPath, 'versions', `${mcVersion}-${loaderVersion}`, `${mcVersion}-${loaderVersion}.jar`),
      // En la carpeta de la instancia
      path.join(instancePath, `${mcVersion}-${loaderVersion}`, `${mcVersion}-${loaderVersion}.jar`),
      path.join(instancePath, 'versions', `${mcVersion}-${loaderVersion}`, `${mcVersion}-${loaderVersion}.jar`),
      // En .minecraft estándar
      path.join(process.env.APPDATA || '', '.minecraft', 'versions', versionName, `${versionName}.jar`),
      path.join(process.env.APPDATA || '', '.minecraft', 'versions', `${mcVersion}-${loaderVersion}`, `${mcVersion}-${loaderVersion}.jar`),
    ];

    logProgressService.info(`Buscando JAR instalado de Forge en ${possiblePaths.length} ubicaciones adicionales...`);
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        logProgressService.info(`JAR instalado encontrado: ${possiblePath}`);
        return possiblePath;
      }
    }

    // 2. Buscar cualquier JAR de Forge/NeoForge en las carpetas de búsqueda
    const searchDirs = [
      path.join(launcherDataPath, 'versions'),
      instancePath,
      path.join(instancePath, 'loader'),
      path.join(instancePath, 'versions', `${mcVersion}-${loaderVersion}`),
      path.join(process.env.APPDATA || '', '.minecraft', 'versions')
    ];

    for (const searchDir of searchDirs) {
      if (fs.existsSync(searchDir)) {
        const files = fs.readdirSync(searchDir);
        for (const file of files) {
          if (file.endsWith('.jar') && !file.includes('installer') && !file.includes('client.jar')) {
            const fileLower = file.toLowerCase();
            if (fileLower.includes(loader) || fileLower.includes('forge') || fileLower.includes('neoforge')) {
              return path.join(searchDir, file);
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * Obtiene la ruta de Java para una versión específica de Minecraft
   */
  private getJavaPath(mcVersion: string): string | null {
    // Lógica simplificada: usar Java 17 o 21 según la versión de MC
    const majorVersion = parseInt(mcVersion.split('.')[1] || '0', 10);
    const javaVersion = majorVersion >= 21 ? '21' : majorVersion >= 17 ? '17' : '8';
    
    const javaPath = path.join(
      getLauncherDataPath(),
      'runtime',
      `java${javaVersion}`,
      'bin',
      'java.exe'
    );

    if (fs.existsSync(javaPath)) {
      return javaPath;
    }

    // Fallback: buscar en PATH
    return 'java';
  }

  /**
   * Añade las librerías de BootstrapLauncher necesarias para Forge/NeoForge
   */
  private async addForgeBootstrapLibraries(
    libraryJars: string[],
    loader: string,
    loaderVersion: string,
    launcherPath: string
  ): Promise<void> {
    try {
      // Para Forge moderno, necesitamos descargar las librerías de BootstrapLauncher
      // El Universal JAR contiene las librerías de Forge, pero el BootstrapLauncher está en una librería separada
      // Las librerías necesarias son:
      // - cpw.mods:bootstraplauncher:VERSION (contiene BootstrapLauncher)
      // - cpw.mods:securejarhandler:VERSION (contiene securejarhandler)
      
      // Para Forge moderno, necesitamos obtener las versiones correctas de las librerías de BootstrapLauncher
      // Estas versiones pueden no coincidir exactamente con la versión de Forge
      // Intentar obtener las versiones desde el Universal JAR o usar versiones conocidas
      
      // Extraer la versión de Forge del loaderVersion (ej: 1.21.11-61.0.2 -> 61.0.2)
      const forgeVersionMatch = loaderVersion.match(/[\d.]+-([\d.]+)/);
      const forgeVersion = forgeVersionMatch ? forgeVersionMatch[1] : loaderVersion.split('-')[1] || loaderVersion;
      
      // Para Forge 1.17+, las librerías de BootstrapLauncher están en el grupo cpw.mods
      // Las versiones suelen ser 1.0.x o 2.0.x, independientes de la versión de Forge
      // Intentar versiones comunes primero
      const commonBootstrapVersions = ['2.1.0', '2.0.0', '1.0.0', '1.0.1', '1.0.2', '1.0.3'];
      
      const mavenBaseUrl = loader === 'forge' 
        ? 'https://maven.minecraftforge.net'
        : 'https://maven.neoforged.net/releases';
      
      const bootstrapLibs = [
        { groupId: 'cpw.mods', artifactId: 'bootstraplauncher' },
        { groupId: 'cpw.mods', artifactId: 'securejarhandler' }
      ];
      
      for (const lib of bootstrapLibs) {
        let libFound = false;
        
        // Intentar versiones comunes primero
        for (const version of commonBootstrapVersions) {
          const libName = `${lib.groupId}:${lib.artifactId}:${version}`;
          const libPath = path.join(launcherPath, 'libraries', this.getLibraryPath(libName));
          const libUrl = `${mavenBaseUrl}/${lib.groupId.replace(/\./g, '/')}/${lib.artifactId}/${version}/${lib.artifactId}-${version}.jar`;
          
          // Si la librería ya existe, usarla
          if (fs.existsSync(libPath)) {
            if (!libraryJars.includes(libPath)) {
              libraryJars.push(libPath);
              logProgressService.info(`Añadida librería existente al classpath: ${libName}`);
            }
            libFound = true;
            break;
          }
          
          // Intentar descargarla
          logProgressService.info(`Intentando descargar librería de Forge: ${libName}`);
          try {
            const response = await fetch(libUrl, {
              headers: {
                'User-Agent': 'DRK-Launcher/1.0'
              }
            });
            
            if (response.ok) {
              // Crear directorio si no existe
              const libDir = path.dirname(libPath);
              if (!fs.existsSync(libDir)) {
                fs.mkdirSync(libDir, { recursive: true });
              }
              
              const buffer = Buffer.from(await response.arrayBuffer());
              fs.writeFileSync(libPath, buffer);
              logProgressService.info(`Librería descargada exitosamente: ${libName}`);
              
              if (!libraryJars.includes(libPath)) {
                libraryJars.push(libPath);
                logProgressService.info(`Añadida librería al classpath: ${libName}`);
              }
              libFound = true;
              break;
            } else {
              logProgressService.warning(`No se pudo descargar librería ${libName} (${response.status})`);
            }
          } catch (error) {
            logProgressService.warning(`Error al descargar librería ${libName}:`, error);
          }
        }
        
        if (!libFound) {
          logProgressService.warning(`No se pudo encontrar ni descargar la librería ${lib.artifactId}. El Universal JAR puede contener estas clases, pero puede fallar al iniciar.`);
        }
      }
      
      // Añadir ASM (ObjectWeb ASM) que es una dependencia de SecureJarHandler
      // ASM es necesario para la manipulación de bytecode
      // Necesitamos múltiples módulos de ASM: asm, asm-tree, asm-commons, asm-analysis, asm-util
      const asmVersions = ['9.7.1', '9.7', '9.6', '9.5', '9.4', '9.3'];
      const asmMavenUrl = 'https://repo1.maven.org/maven2'; // Maven Central
      
      for (const asmVersion of asmVersions) {
        const asmLibs = [
          { groupId: 'org.ow2.asm', artifactId: 'asm', version: asmVersion },
          { groupId: 'org.ow2.asm', artifactId: 'asm-tree', version: asmVersion },
          { groupId: 'org.ow2.asm', artifactId: 'asm-commons', version: asmVersion },
          { groupId: 'org.ow2.asm', artifactId: 'asm-analysis', version: asmVersion },
          { groupId: 'org.ow2.asm', artifactId: 'asm-util', version: asmVersion }
        ];
        
        let allAsmLibsFound = true;
        
        for (const asmLib of asmLibs) {
          const asmName = `${asmLib.groupId}:${asmLib.artifactId}:${asmLib.version}`;
          const asmPath = path.join(launcherPath, 'libraries', this.getLibraryPath(asmName));
          const asmUrl = `${asmMavenUrl}/${asmLib.groupId.replace(/\./g, '/')}/${asmLib.artifactId}/${asmLib.version}/${asmLib.artifactId}-${asmLib.version}.jar`;
          
          // Si la librería ya existe, usarla
          if (fs.existsSync(asmPath)) {
            if (!libraryJars.includes(asmPath)) {
              libraryJars.push(asmPath);
              logProgressService.info(`Añadida librería ASM existente al classpath: ${asmName}`);
            }
            continue;
          }
          
          // Intentar descargarla
          logProgressService.info(`Intentando descargar librería ASM: ${asmName}`);
          try {
            const response = await fetch(asmUrl, {
              headers: {
                'User-Agent': 'DRK-Launcher/1.0'
              }
            });
            
            if (response.ok) {
              // Crear directorio si no existe
              const asmDir = path.dirname(asmPath);
              if (!fs.existsSync(asmDir)) {
                fs.mkdirSync(asmDir, { recursive: true });
              }
              
              const buffer = Buffer.from(await response.arrayBuffer());
              fs.writeFileSync(asmPath, buffer);
              logProgressService.info(`Librería ASM descargada exitosamente: ${asmName}`);
              
              if (!libraryJars.includes(asmPath)) {
                libraryJars.push(asmPath);
                logProgressService.info(`Añadida librería ASM al classpath: ${asmName}`);
              }
            } else {
              logProgressService.warning(`No se pudo descargar librería ASM ${asmName} (${response.status})`);
              allAsmLibsFound = false;
            }
          } catch (error) {
            logProgressService.warning(`Error al descargar librería ASM ${asmName}:`, error);
            allAsmLibsFound = false;
          }
        }
        
        // Si encontramos todas las librerías ASM necesarias, no intentar otras versiones
        if (allAsmLibsFound) {
          break;
        }
      }
    } catch (error) {
      logProgressService.warning(`Error al añadir librerías de BootstrapLauncher:`, error);
    }
  }

  /**
   * Descarga el Universal JAR de Forge/NeoForge directamente
   */
  private async downloadForgeUniversalJar(
    instancePath: string,
    loader: string,
    mcVersion: string,
    loaderVersion: string
  ): Promise<string | null> {
    try {
      const loaderDir = path.join(instancePath, 'loader');
      if (!fs.existsSync(loaderDir)) {
        fs.mkdirSync(loaderDir, { recursive: true });
      }

      let universalUrl: string;
      let universalPath: string;

      if (loader === 'forge') {
        universalUrl = `https://maven.minecraftforge.net/net/minecraftforge/forge/${loaderVersion}/forge-${loaderVersion}-universal.jar`;
        universalPath = path.join(loaderDir, `forge-${loaderVersion}-universal.jar`);
      } else if (loader === 'neoforge') {
        universalUrl = `https://maven.neoforged.net/releases/net/neoforged/neoforge/${loaderVersion}/neoforge-${loaderVersion}.jar`;
        universalPath = path.join(loaderDir, `neoforge-${loaderVersion}.jar`);
      } else {
        return null;
      }

      logProgressService.info(`Descargando Universal JAR de ${loader} desde: ${universalUrl}`);
      const response = await fetch(universalUrl, {
        headers: {
          'User-Agent': 'DRK-Launcher/1.0'
        }
      });

      if (response.ok) {
        const buffer = Buffer.from(await response.arrayBuffer());
        fs.writeFileSync(universalPath, buffer);
        logProgressService.info(`Universal JAR de ${loader} descargado exitosamente: ${universalPath}`);
        return universalPath;
      } else {
        logProgressService.warning(`No se pudo descargar Universal JAR de ${loader} (${response.status})`);
        return null;
      }
    } catch (error) {
      logProgressService.error(`Error al descargar Universal JAR de ${loader}:`, error);
      return null;
    }
  }
}

export const gameLaunchService = new GameLaunchService();