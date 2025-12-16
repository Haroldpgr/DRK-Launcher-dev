// src/services/descargas/neoforge/EjecutarNeoForge.ts
// Servicio para ejecutar instancias NeoForge de Minecraft
// NeoForge moderno NO usa client.jar, lee el version.json generado por el installer
// Basado en: https://neoforged.net/ y documentación oficial

import { spawn, ChildProcess } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { Profile } from '../../../renderer/services/profileService';
import { logProgressService } from '../../logProgressService';
import { gameLogsService } from '../../gameLogsService';
import { minecraftDownloadService } from '../../minecraftDownloadService';
import { getLauncherDataPath } from '../../../utils/paths';
import { ensureValidUUID } from '../../../utils/uuid';
import { JavaConfigService } from '../../javaConfigService';

export interface NeoForgeLaunchOptions {
  javaPath: string;
  mcVersion: string;
  loaderVersion: string;
  instancePath: string;
  ramMb?: number;
  jvmArgs?: string[];
  gameArgs?: string[];
  userProfile?: Profile;
  windowSize?: {
    width: number;
    height: number;
  };
  instanceConfig: any;
  onData?: (chunk: string) => void;
  onExit?: (code: number | null) => void;
}

/**
 * Servicio para ejecutar instancias NeoForge de Minecraft
 * 
 * IMPORTANTE: NeoForge moderno (1.20.5+ / 1.21+) NO usa client.jar en la instancia.
 * Todo está en el version.json generado por el installer en versions/
 * 
 * Documentación: https://neoforged.net/
 * Similar a Forge pero usa maven.neoforged.net
 */
export class EjecutarNeoForge {
  private gameProcess: ChildProcess | null = null;

  /**
   * Ejecuta una instancia NeoForge
   */
  async ejecutar(opts: NeoForgeLaunchOptions): Promise<ChildProcess> {
    try {
      logProgressService.info(`[NeoForge] Iniciando ejecución de NeoForge ${opts.loaderVersion} para Minecraft ${opts.mcVersion}...`);

      // Normalizar loaderVersion: puede venir como "1.21.11-21.1.0" o solo "21.1.0"
      let normalizedLoaderVersion = opts.loaderVersion;
      if (opts.loaderVersion.includes('-')) {
        const parts = opts.loaderVersion.split('-');
        if (parts.length > 1) {
          normalizedLoaderVersion = parts[parts.length - 1];
        }
      }

      // Validar que exista el version.json generado por NeoForge
      // NeoForge NO usa client.jar, todo está en el version.json
      const launcherDataPath = getLauncherDataPath();
      const versionName = `${opts.mcVersion}-neoforge-${normalizedLoaderVersion}`;
      const versionJsonPath = path.join(launcherDataPath, 'versions', versionName, `${versionName}.json`);
      
      if (!fs.existsSync(versionJsonPath)) {
        const error = new Error(`Version.json de NeoForge no encontrado en: ${versionJsonPath}`);
        logProgressService.error(`[NeoForge] ERROR CRÍTICO: ${error.message}`);
        logProgressService.error(`[NeoForge] Asegúrate de que NeoForge esté instalado correctamente.`);
        throw error;
      }

      logProgressService.info(`[NeoForge] Version.json de NeoForge encontrado: ${versionName}`);

      // Construir argumentos de lanzamiento específicos de NeoForge
      const args = await this.buildLaunchArguments(opts, versionJsonPath, normalizedLoaderVersion);
      const stringArgs = args.map(arg => typeof arg === 'string' ? arg : String(arg));

      logProgressService.info(`[NeoForge] Argumentos construidos (${stringArgs.length} argumentos)`);

      // Crear el proceso hijo
      logProgressService.info(`[NeoForge] Iniciando proceso Java...`);
      this.gameProcess = spawn(opts.javaPath, stringArgs, {
        cwd: opts.instancePath,
        env: {
          ...process.env
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      if (!this.gameProcess.pid) {
        throw new Error('No se pudo iniciar el proceso Java');
      }

      logProgressService.info(`[NeoForge] Proceso iniciado con PID: ${this.gameProcess.pid}`);

      // Manejar salida estándar
      if (this.gameProcess.stdout) {
        this.gameProcess.stdout.on('data', (data) => {
          try {
            const output = data.toString();
            logProgressService.info(`[NeoForge-OUT] ${output}`);
            if (opts.instanceConfig?.id) {
              gameLogsService.addLog(opts.instanceConfig.id, output);
            }
            if (opts.onData) {
              opts.onData(output);
            }
          } catch (outputError) {
            logProgressService.error(`[NeoForge] Error al procesar salida estándar: ${outputError}`);
          }
        });
      }

      // Manejar salida de error
      if (this.gameProcess.stderr) {
        this.gameProcess.stderr.on('data', (data) => {
          try {
            const output = data.toString();
            logProgressService.error(`[NeoForge-ERR] ${output}`);
            if (opts.instanceConfig?.id) {
              gameLogsService.addLog(opts.instanceConfig.id, output);
            }
            if (opts.onData) {
              opts.onData(output);
            }
          } catch (errorError) {
            logProgressService.error(`[NeoForge] Error al procesar salida de error: ${errorError}`);
          }
        });
      }

      // Manejar cierre del proceso
      this.gameProcess.on('close', (code, signal) => {
        if (code !== null) {
          logProgressService.info(`[NeoForge] Proceso terminado con código ${code}`);
        } else if (signal) {
          logProgressService.info(`[NeoForge] Proceso terminado por señal: ${signal}`);
        } else {
          logProgressService.info(`[NeoForge] Proceso terminado`);
        }
        
        if (opts.onExit) {
          opts.onExit(code);
        }
        this.gameProcess = null;
      });

      // Manejar errores del proceso
      this.gameProcess.on('error', (error) => {
        logProgressService.error(`[NeoForge] Error en el proceso Java: ${error.message}`);
        logProgressService.error(`[NeoForge] Stack trace: ${error.stack || 'No disponible'}`);
        
        if (opts.onExit) {
          opts.onExit(null);
        }
        
        this.gameProcess = null;
        throw error;
      });

      logProgressService.success(`[NeoForge] Minecraft lanzado exitosamente`, {
        pid: this.gameProcess.pid
      });

      return this.gameProcess;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logProgressService.error(`[NeoForge] ERROR al ejecutar: ${errorMessage}`);
      if (errorStack) {
        logProgressService.error(`[NeoForge] Stack trace: ${errorStack}`);
      }
      
      throw error;
    }
  }

  /**
   * Construye los argumentos de lanzamiento para NeoForge
   * IMPORTANTE: NeoForge usa --module-path y -cp separados (JPMS)
   */
  private async buildLaunchArguments(
    opts: NeoForgeLaunchOptions,
    versionJsonPath: string,
    normalizedLoaderVersion: string
  ): Promise<string[]> {
    try {
      const mem = Math.max(512, opts.ramMb || 2048);
      const jvmArgs = JavaConfigService.getStandardJvmArgs('neoforge', mem);
      
      logProgressService.info(`[NeoForge] Memoria configurada: ${mem}MB`);
      logProgressService.info(`[NeoForge] JVM args base: ${jvmArgs.length} argumentos`);

      // Leer version.json generado por NeoForge
      let versionData: any;
      try {
        versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));
        logProgressService.info(`[NeoForge] Version.json leído correctamente`);
      } catch (error) {
        logProgressService.error(`[NeoForge] ERROR al leer version.json de NeoForge: ${error}`);
        throw new Error(`Error al leer version.json de NeoForge: ${error}`);
      }

      // Obtener mainClass del version.json (normalmente 'cpw.mods.modlauncher.Launcher')
      const mainClass = versionData.mainClass || 'cpw.mods.modlauncher.Launcher';
      logProgressService.info(`[NeoForge] MainClass: ${mainClass}`);
      
      // Argumentos JVM específicos de NeoForge
      const additionalJvmArgs = [
        '--add-modules=ALL-MODULE-PATH',
        // Agregar módulos específicos de log4j (requeridos por modlauncher)
        '--add-modules=org.apache.logging.log4j.core',
        '--add-modules=org.apache.logging.log4j',
        // Opens necesarios para NeoForge y securejarhandler
        '--add-opens', 'java.base/java.lang=ALL-UNNAMED',
        '--add-opens', 'java.base/java.util=ALL-UNNAMED',
        '--add-opens', 'java.base/java.lang.invoke=ALL-UNNAMED',
        '--add-opens', 'java.base/java.util.concurrent.atomic=ALL-UNNAMED',
        '--add-opens', 'java.base/java.net=ALL-UNNAMED',
        '--add-opens', 'java.base/java.io=ALL-UNNAMED',
        // Opens para securejarhandler (solo funcionan si el módulo está en module-path)
        '--add-opens', 'java.base/java.util.jar=cpw.mods.securejarhandler',
        '--add-opens', 'java.base/java.lang.reflect=cpw.mods.securejarhandler',
        '--add-opens', 'java.base/java.text=cpw.mods.securejarhandler',
        '--add-opens', 'java.base/java.util.concurrent=cpw.mods.securejarhandler',
        '--add-opens', 'java.base/java.util.regex=cpw.mods.securejarhandler',
        '--add-opens', 'java.base/java.util.zip=cpw.mods.securejarhandler',
        // Propiedades de NeoForge
        '-Dforge.logging.console.level=info',
        '-Dforge.logging.markers=REGISTRIES',
        '-Dfml.earlyprogresswindow=false'
      ];
      
      // Construir classpath y module-path desde las librerías del version.json
      const launcherDataPath = getLauncherDataPath();
      const { modulePath: modulePathLibs, classpath: classpathLibs } = this.partitionNeoForgeLibraries(
        versionData.libraries || [],
        launcherDataPath
      );
      
      // Construir rutas completas y verificar existencia
      const modulePathFull = modulePathLibs.filter(p => fs.existsSync(p));
      const classpathFull = classpathLibs.filter(p => fs.existsSync(p));
      
      logProgressService.info(`[NeoForge] Librerías clasificadas: ${modulePathFull.length} en module-path, ${classpathFull.length} en classpath`);
      
      if (modulePathFull.length === 0) {
        logProgressService.error(`[NeoForge] ERROR: Module-path está vacío`);
        throw new Error('[NeoForge] Module-path está vacío. Las librerías de NeoForge no se clasificaron correctamente.');
      }

      // Obtener assetIndex del version.json base de Minecraft
      let assetIndexId = opts.mcVersion;
      try {
        const baseVersionJsonPath = await minecraftDownloadService.downloadVersionMetadata(opts.mcVersion);
        if (fs.existsSync(baseVersionJsonPath)) {
          const baseVersionData = JSON.parse(fs.readFileSync(baseVersionJsonPath, 'utf-8'));
          if (baseVersionData.assetIndex && baseVersionData.assetIndex.id) {
            assetIndexId = baseVersionData.assetIndex.id;
          }
        }
      } catch (error) {
        logProgressService.warning(`[NeoForge] No se pudo leer version.json base para assetIndex: ${error}`);
      }

      // Argumentos del juego
      const userUUID = opts.userProfile?.id ? ensureValidUUID(opts.userProfile.id) : ensureValidUUID('00000000-0000-0000-0000-000000000000');
      
      let accessToken = '0';
      let userType = 'legacy';
      
      if (opts.userProfile) {
        if (opts.userProfile.accessToken && opts.userProfile.accessToken !== '0' && opts.userProfile.accessToken.trim() !== '') {
          accessToken = opts.userProfile.accessToken;
          if (opts.userProfile.type === 'microsoft') {
            userType = 'mojang';
          } else if (opts.userProfile.type === 'yggdrasil' || opts.userProfile.type === 'drkauth' || opts.userProfile.type === 'elyby') {
            userType = 'mojang';
          } else {
            userType = 'legacy';
          }
        }
      }

      const gameArgs = [
        '--username', opts.userProfile?.username || 'Player',
        '--version', opts.mcVersion,
        '--gameDir', opts.instancePath,
        '--assetsDir', path.join(launcherDataPath, 'assets'),
        '--assetIndex', assetIndexId,
        '--uuid', userUUID,
        '--accessToken', accessToken,
        '--userType', userType,
        '--versionType', 'release',
        '--launchTarget', 'fmlclient'
      ];
      
      if (opts.userProfile?.clientId) {
        gameArgs.push('--clientId', opts.userProfile.clientId);
      }
      
      if (opts.userProfile?.xuid) {
        gameArgs.push('--xuid', opts.userProfile.xuid);
      }

      if (opts.windowSize) {
        gameArgs.push('--width', opts.windowSize.width.toString(), '--height', opts.windowSize.height.toString());
      }

      // Construir argumentos finales con module-path y classpath
      const launchArgs: string[] = [
        ...jvmArgs,
        ...additionalJvmArgs,
        ...(opts.jvmArgs || [])
      ];
      
      // Agregar module-path y classpath (CRÍTICO: NeoForge Bootstrap necesita módulos en module-path)
      if (modulePathFull.length > 0) {
        const modulePathStr = modulePathFull.join(path.delimiter);
        launchArgs.push('--module-path', modulePathStr);
        logProgressService.info(`[NeoForge] Module-path configurado: ${modulePathFull.length} módulos`);
      }
      
      if (classpathFull.length > 0) {
        const classpathStr = classpathFull.join(path.delimiter);
        launchArgs.push('-cp', classpathStr);
        logProgressService.info(`[NeoForge] Classpath configurado: ${classpathFull.length} librerías`);
      }
      
      launchArgs.push(
        mainClass,
        ...gameArgs
      );

      logProgressService.info(`[NeoForge] Argumentos de lanzamiento construidos exitosamente`);
      return launchArgs;
    } catch (error) {
      logProgressService.error(`[NeoForge] ERROR al construir argumentos de lanzamiento: ${error}`);
      throw error;
    }
  }

  /**
   * Clasifica librerías en module-path y classpath
   * NeoForge Bootstrap necesita módulos en --module-path para que Java los reconozca
   */
  private partitionNeoForgeLibraries(
    libraries: any[],
    launcherDataPath: string
  ): { modulePath: string[]; classpath: string[] } {
    const modulePath: string[] = [];
    const classpath: string[] = [];
    
    // Librerías que deben ir en classpath (no son módulos)
    const CLASSPATH_EXCEPTIONS = [
      'client-',
      '-official.jar',
      'minecraft-'
    ];
    
    // Librerías críticas que DEBEN ir en module-path
    const MODULE_PATH_KEYWORDS = [
      'modlauncher',
      'neoforge',
      'forge',
      'fml',
      'log4j',
      'securejarhandler',
      'securemodules',
      'jopt-simple',
      'asm',
      'guava',
      'gson'
    ];

    for (const lib of libraries) {
      // Verificar reglas de compatibilidad
      if (lib.rules && !this.isLibraryAllowed(lib.rules)) {
        continue;
      }

      // Omitir librerías nativas de otras plataformas
      if (this.isNativeLibraryForOtherPlatform(lib.name)) {
        continue;
      }

      // Construir ruta de la librería
      let libPath: string | null = null;
      
      if (lib.downloads && lib.downloads.artifact) {
        if (lib.downloads.artifact.path) {
          libPath = path.join(launcherDataPath, 'libraries', lib.downloads.artifact.path);
        } else {
          libPath = path.join(launcherDataPath, 'libraries', this.getLibraryPath(lib.name));
        }
      } else if (lib.name) {
        libPath = path.join(launcherDataPath, 'libraries', this.getLibraryPath(lib.name));
      }

      if (!libPath) {
        continue;
      }

      // Buscar la librería en múltiples ubicaciones
      const foundPath = this.findLibraryInMultipleLocations(lib.name, libPath, launcherDataPath);
      
      if (!foundPath || !fs.existsSync(foundPath)) {
        // Intentar descargar si falta
        if (lib.downloads && lib.downloads.artifact && lib.downloads.artifact.url) {
          // La descarga se hará en otro lugar, solo continuar
          continue;
        }
        continue;
      }

      const basename = path.basename(foundPath).toLowerCase();
      
      // Verificar si es una excepción de classpath
      const isClasspathException = CLASSPATH_EXCEPTIONS.some(kw => basename.includes(kw));
      
      if (isClasspathException) {
        if (!classpath.includes(foundPath)) {
          classpath.push(foundPath);
        }
      } else {
        // Verificar si debe ir en module-path (es un módulo)
        const isModule = MODULE_PATH_KEYWORDS.some(kw => basename.includes(kw.toLowerCase()));
        
        if (isModule) {
          if (!modulePath.includes(foundPath)) {
            modulePath.push(foundPath);
          }
        } else {
          // Por defecto, ir en classpath si no es claramente un módulo
          if (!classpath.includes(foundPath)) {
            classpath.push(foundPath);
          }
        }
      }
    }
    
    // Asegurar que las librerías críticas estén en module-path
    const criticalLibs = ['modlauncher', 'log4j-core', 'log4j-api', 'neoforge', 'forge'];
    for (const criticalKeyword of criticalLibs) {
      const found = modulePath.find(p => {
        const basename = path.basename(p).toLowerCase();
        return basename.includes(criticalKeyword.toLowerCase());
      });
      if (!found) {
        // Buscar en classpath y moverlo
        const classpathIndex = classpath.findIndex(p => {
          const basename = path.basename(p).toLowerCase();
          return basename.includes(criticalKeyword.toLowerCase());
        });
        if (classpathIndex >= 0) {
          modulePath.push(classpath[classpathIndex]);
          classpath.splice(classpathIndex, 1);
          logProgressService.info(`[NeoForge] Librería crítica ${criticalKeyword} movida de classpath a module-path`);
        }
      }
    }
    
    logProgressService.info(`[NeoForge] Librerías clasificadas: ${modulePath.length} en module-path, ${classpath.length} en classpath`);
    
    return { modulePath, classpath };
  }

  /**
   * Verifica si una librería está permitida según las reglas
   */
  private isLibraryAllowed(rules: any[]): boolean {
    if (!rules || !Array.isArray(rules) || rules.length === 0) {
      return true; // Por defecto, permitir si no hay reglas
    }
    
    let allowed = false;
    const currentOs = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'osx' : 'linux';
    
    for (const rule of rules) {
      const osName = rule.os?.name;
      const action = rule.action;
      
      if (osName) {
        if (osName === currentOs) {
          allowed = action === 'allow';
        }
      } else if (action === 'allow') {
        allowed = true;
      } else if (action === 'disallow') {
        allowed = false;
      }
    }
    
    return allowed;
  }

  /**
   * Verifica si una librería es nativa de otra plataforma
   */
  private isNativeLibraryForOtherPlatform(libraryName: string): boolean {
    const currentOs = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'osx' : 'linux';
    
    if (libraryName && libraryName.includes('natives-')) {
      if (currentOs === 'windows' && !libraryName.includes('natives-windows')) {
        return true;
      }
      if (currentOs === 'osx' && !libraryName.includes('natives-macos')) {
        return true;
      }
      if (currentOs === 'linux' && !libraryName.includes('natives-linux')) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Busca una librería en múltiples ubicaciones posibles
   */
  private findLibraryInMultipleLocations(
    libraryName: string,
    defaultPath: string,
    launcherDataPath: string
  ): string | null {
    if (!libraryName) {
      return defaultPath;
    }

    const parts = libraryName.split(':');
    if (parts.length < 3) {
      return defaultPath;
    }
    
    const [group, artifact, version] = parts;
    const groupPath = group.replace(/\./g, '/');
    const fileName = `${artifact}-${version}.jar`;

    const possiblePaths = [
      defaultPath, // Ruta construida desde lib.downloads.artifact.path o this.getLibraryPath(lib.name)
      path.join(launcherDataPath, 'libraries', groupPath, artifact, version, fileName), // Ruta estándar en .DRK Launcher/libraries
      path.join(process.env.APPDATA || process.env.HOME || '', '.minecraft', 'libraries', groupPath, artifact, version, fileName), // .minecraft estándar
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }
    
    return defaultPath;
  }

  /**
   * Convierte el nombre de la librería al formato de ruta
   */
  private getLibraryPath(libraryName: string): string {
    const parts = libraryName.split(':');
    if (parts.length < 3) {
      throw new Error(`Formato de librería inválido: ${libraryName}`);
    }

    const [group, artifact, version] = parts;
    const groupPath = group.replace(/\./g, '/');
    const fileName = `${artifact}-${version}.jar`;
    
    return path.join(groupPath, artifact, version, fileName);
  }

  /**
   * Detiene la ejecución del juego
   */
  detener(): void {
    if (this.gameProcess) {
      logProgressService.info(`[NeoForge] Deteniendo proceso...`);
      try {
        this.gameProcess.kill();
        this.gameProcess = null;
        logProgressService.info(`[NeoForge] Proceso detenido`);
      } catch (error) {
        logProgressService.error(`[NeoForge] Error al detener proceso: ${error}`);
      }
    }
  }
}

export const ejecutarNeoForge = new EjecutarNeoForge();

