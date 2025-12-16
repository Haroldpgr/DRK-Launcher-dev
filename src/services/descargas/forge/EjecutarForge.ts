// src/services/descargas/forge/EjecutarForge.ts
// Servicio para ejecutar instancias Forge de Minecraft
// IMPLEMENTACIÓN COMPLETAMENTE REESCRITA - Método robusto y simplificado
// Basado en el funcionamiento de MultiMC y Prism Launcher

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

export interface ForgeLaunchOptions {
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
 * Servicio para ejecutar instancias Forge de Minecraft
 * 
 * IMPLEMENTACIÓN SIMPLIFICADA Y ROBUSTA:
 * - Usa los argumentos directamente del version.json generado por Forge
 * - Procesa y reemplaza variables según el estándar de Minecraft
 * - Método similar a cómo MultiMC y Prism Launcher ejecutan Forge
 */
export class EjecutarForge {
  private gameProcess: ChildProcess | null = null;

  /**
   * Ejecuta una instancia Forge
   */
  async ejecutar(opts: ForgeLaunchOptions): Promise<ChildProcess> {
    try {
      logProgressService.info(`[Forge] Iniciando ejecución de Forge ${opts.loaderVersion} para Minecraft ${opts.mcVersion}...`);

      // Normalizar loaderVersion
      let normalizedLoaderVersion = opts.loaderVersion;
      if (opts.loaderVersion.includes('-')) {
        const parts = opts.loaderVersion.split('-');
        if (parts.length > 1) {
          normalizedLoaderVersion = parts[parts.length - 1];
        }
      }

      // Validar version.json de Forge
      const launcherDataPath = getLauncherDataPath();
      const versionName = `${opts.mcVersion}-forge-${normalizedLoaderVersion}`;
      const versionJsonPath = path.join(launcherDataPath, 'versions', versionName, `${versionName}.json`);
      
      if (!fs.existsSync(versionJsonPath)) {
        throw new Error(`Version.json de Forge no encontrado en: ${versionJsonPath}`);
      }

      // Leer version.json
      const versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));
      
      if (!versionData.mainClass) {
        throw new Error('version.json de Forge no tiene mainClass');
      }

      logProgressService.info(`[Forge] Version.json válido. MainClass: ${versionData.mainClass}`);

      // Obtener version.json base si existe inheritsFrom
      let baseVersionData: any = null;
      if (versionData.inheritsFrom) {
        const baseVersionName = versionData.inheritsFrom;
        const baseVersionJsonPath = path.join(launcherDataPath, 'versions', baseVersionName, `${baseVersionName}.json`);
        if (fs.existsSync(baseVersionJsonPath)) {
          baseVersionData = JSON.parse(fs.readFileSync(baseVersionJsonPath, 'utf-8'));
          logProgressService.info(`[Forge] Version base cargado: ${baseVersionName}`);
        }
      }

      // Construir argumentos de lanzamiento
      const mem = Math.max(512, opts.ramMb || 2048);
      const jvmArgs = JavaConfigService.getStandardJvmArgs('forge', mem);
      
      // Procesar argumentos del version.json
      const launchArgs = await this.buildLaunchArgs(
        opts,
        versionData,
        baseVersionData,
        launcherDataPath,
        normalizedLoaderVersion,
        jvmArgs
      );

      logProgressService.info(`[Forge] Total de argumentos: ${launchArgs.length}`);

      // Crear el proceso
      this.gameProcess = spawn(opts.javaPath, launchArgs, {
        cwd: opts.instancePath,
        env: {
          ...process.env
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      if (!this.gameProcess.pid) {
        throw new Error('No se pudo iniciar el proceso Java');
      }

      logProgressService.info(`[Forge] Proceso iniciado con PID: ${this.gameProcess.pid}`);

      // Manejar salida
      this.gameProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        logProgressService.info(`[Forge-OUT] ${output}`);
        if (opts.instanceConfig?.id) {
          gameLogsService.addLog(opts.instanceConfig.id, output);
        }
        opts.onData?.(output);
      });

      this.gameProcess.stderr?.on('data', (data) => {
        const output = data.toString();
        logProgressService.error(`[Forge-ERR] ${output}`);
        if (opts.instanceConfig?.id) {
          gameLogsService.addLog(opts.instanceConfig.id, output);
        }
        opts.onData?.(output);
      });

      this.gameProcess.on('close', (code) => {
        logProgressService.info(`[Forge] Proceso terminado con código ${code}`);
        opts.onExit?.(code ?? null);
        this.gameProcess = null;
      });

      this.gameProcess.on('error', (error) => {
        logProgressService.error(`[Forge] Error en proceso: ${error.message}`);
        opts.onExit?.(null);
        this.gameProcess = null;
        throw error;
      });

      logProgressService.success(`[Forge] Minecraft lanzado exitosamente`, {
        pid: this.gameProcess.pid
      });

      return this.gameProcess;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logProgressService.error(`[Forge] ERROR al ejecutar: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Construye los argumentos de lanzamiento de forma simplificada y robusta
   */
  private async buildLaunchArgs(
    opts: ForgeLaunchOptions,
    versionData: any,
    baseVersionData: any,
    launcherDataPath: string,
    normalizedLoaderVersion: string,
    baseJvmArgs: string[]
  ): Promise<string[]> {
    // Obtener assetIndex
    let assetIndexId = opts.mcVersion;
    if (baseVersionData?.assetIndex?.id) {
      assetIndexId = baseVersionData.assetIndex.id;
    }

    // Variables para reemplazar en argumentos
    const variables: Record<string, string> = {
      '${natives_directory}': path.join(opts.instancePath, 'natives').replace(/\\/g, '/'),
      '${launcher_name}': 'DRK-Launcher',
      '${launcher_version}': '1.0',
      '${classpath_separator}': path.delimiter,
      '${library_directory}': path.join(launcherDataPath, 'libraries').replace(/\\/g, '/'),
      '${version_name}': versionData.id || `${opts.mcVersion}-forge-${normalizedLoaderVersion}`,
      '${game_directory}': opts.instancePath.replace(/\\/g, '/'),
      '${assets_root}': path.join(launcherDataPath, 'assets').replace(/\\/g, '/'),
      '${assets_index_name}': assetIndexId,
      '${auth_uuid}': opts.userProfile?.id ? ensureValidUUID(opts.userProfile.id) : ensureValidUUID('00000000-0000-0000-0000-000000000000'),
      '${auth_access_token}': opts.userProfile?.accessToken && opts.userProfile.accessToken !== '0' ? opts.userProfile.accessToken : 'NO_AUTH',
      '${auth_player_name}': opts.userProfile?.username || 'Player',
      '${version_type}': 'release',
      '${user_type}': opts.userProfile?.type === 'microsoft' ? 'mojang' : 'legacy'
    };

    // Combinar librerías de base y Forge
    const allLibraries: any[] = [];
    if (baseVersionData?.libraries) {
      allLibraries.push(...baseVersionData.libraries);
    }
    if (versionData.libraries) {
      allLibraries.push(...versionData.libraries);
    }

    // Construir classpath y module-path
    const { classpath, modulePath } = await this.buildClasspathAndModulePath(
      allLibraries,
      launcherDataPath,
      versionData.inheritsFrom ? baseVersionData : null
    );

    // Procesar argumentos JVM del version.json
    const jvmArgsFromVersion: string[] = [];
    if (versionData.arguments?.jvm) {
      for (const arg of versionData.arguments.jvm) {
        if (typeof arg === 'string') {
          let processed = arg;
          for (const [key, value] of Object.entries(variables)) {
            processed = processed.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
          }
          jvmArgsFromVersion.push(processed);
        } else if (arg?.value && typeof arg.value === 'string') {
          let processed = arg.value;
          for (const [key, value] of Object.entries(variables)) {
            processed = processed.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
          }
          jvmArgsFromVersion.push(processed);
        }
      }
    }

    // Procesar argumentos del juego del version.json
    const gameArgsFromVersion: string[] = [];
    if (versionData.arguments?.game) {
      for (const arg of versionData.arguments.game) {
        if (typeof arg === 'string') {
          let processed = arg;
          for (const [key, value] of Object.entries(variables)) {
            processed = processed.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
          }
          gameArgsFromVersion.push(processed);
        } else if (arg?.value && typeof arg.value === 'string') {
          let processed = arg.value;
          for (const [key, value] of Object.entries(variables)) {
            processed = processed.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
          }
          gameArgsFromVersion.push(processed);
        }
      }
    }

    // Argumentos del juego requeridos (asegurar que estén presentes)
    const requiredGameArgs: Record<string, string> = {
      '--username': opts.userProfile?.username || 'Player',
      '--version': opts.mcVersion,
      '--gameDir': opts.instancePath,
      '--assetsDir': path.join(launcherDataPath, 'assets'),
      '--assetIndex': assetIndexId,
      '--uuid': variables['${auth_uuid}'],
      '--accessToken': variables['${auth_access_token}'],
      '--userType': variables['${user_type}'],
      '--versionType': 'release'
    };

    // Combinar argumentos del juego
    const finalGameArgs: string[] = [];
    
    // Añadir argumentos del version.json primero
    finalGameArgs.push(...gameArgsFromVersion);
    
    // Asegurar que los argumentos requeridos estén presentes
    for (let i = 0; i < finalGameArgs.length; i += 2) {
      const key = finalGameArgs[i];
      if (requiredGameArgs[key] && (key === '--username' || key === '--uuid' || key === '--accessToken')) {
        finalGameArgs[i + 1] = requiredGameArgs[key];
        delete requiredGameArgs[key];
      }
    }
    
    // Añadir argumentos requeridos que faltan
    for (const [key, value] of Object.entries(requiredGameArgs)) {
      if (!finalGameArgs.includes(key)) {
        finalGameArgs.push(key, value);
      }
    }

    // Añadir tamaño de ventana si se especificó
    if (opts.windowSize && !finalGameArgs.includes('--width')) {
      finalGameArgs.push('--width', opts.windowSize.width.toString(), '--height', opts.windowSize.height.toString());
    }

    // Construir argumentos finales
    const launchArgs: string[] = [
      ...baseJvmArgs,
      ...jvmArgsFromVersion,
      // Propiedades críticas del sistema
      `-Dminecraft.version=${opts.mcVersion}`,
      `-Dforge.version=${normalizedLoaderVersion}`,
      `-Dminecraft.gameDir=${opts.instancePath.replace(/\\/g, '/')}`,
      `-Dforge.gameDir=${opts.instancePath.replace(/\\/g, '/')}`,
      ...(opts.jvmArgs || [])
    ];

    // Añadir module-path y classpath
    if (modulePath.length > 0) {
      launchArgs.push('--module-path', modulePath.join(path.delimiter));
    }
    if (classpath.length > 0) {
      launchArgs.push('-cp', classpath.join(path.delimiter));
    }

    // Módulos JPMS necesarios
    launchArgs.push(
      '--add-modules=ALL-MODULE-PATH',
      '--add-modules=org.apache.logging.log4j.core',
      '--add-modules=org.apache.logging.log4j'
    );

    // Opens necesarios
    const opens = [
      'java.base/java.lang=ALL-UNNAMED',
      'java.base/java.util=ALL-UNNAMED',
      'java.base/java.lang.invoke=ALL-UNNAMED',
      'java.base/java.util.concurrent.atomic=ALL-UNNAMED',
      'java.base/java.net=ALL-UNNAMED',
      'java.base/java.io=ALL-UNNAMED',
      'java.base/java.util.jar=cpw.mods.securejarhandler',
      'java.base/java.lang.reflect=cpw.mods.securejarhandler',
      'java.base/java.text=cpw.mods.securejarhandler',
      'java.base/java.util.concurrent=cpw.mods.securejarhandler',
      'java.base/java.util.regex=cpw.mods.securejarhandler',
      'java.base/java.util.zip=cpw.mods.securejarhandler'
    ];
    
    for (const open of opens) {
      launchArgs.push('--add-opens', open);
    }

    // Main class y argumentos del juego
    launchArgs.push(versionData.mainClass, ...finalGameArgs);

    return launchArgs;
  }

  /**
   * Construye classpath y module-path desde las librerías
   * Método robusto que busca librerías en múltiples ubicaciones
   */
  private async buildClasspathAndModulePath(
    libraries: any[],
    launcherDataPath: string,
    baseVersionData: any | null
  ): Promise<{ classpath: string[]; modulePath: string[] }> {
    const classpath: string[] = [];
    const modulePath: string[] = [];

    // Módulos que deben ir en module-path
    const moduleKeywords = [
      'modlauncher',
      'forge',
      'fml',
      'bootstrap',
      'unsafe',
      'log4j',
      'slf4j',
      'securejarhandler',
      'securemodules',
      'jopt-simple',
      'asm',
      'gson'
    ];

    // Excepciones que deben ir en classpath incluso si contienen keywords
    const classpathExceptions = ['client-', '-official.jar', 'minecraft-'];

    for (const lib of libraries) {
      try {
        // Verificar reglas
        if (lib.rules && !this.isLibraryAllowed(lib.rules)) {
          continue;
        }

        // Omitir librerías nativas de otras plataformas
        if (lib.name && this.isNativeLibraryForOtherPlatform(lib.name)) {
          continue;
        }

        // Construir ruta y buscar en múltiples ubicaciones
        let libPath: string | null = null;
        
        // Intentar desde downloads.artifact.path primero
        if (lib.downloads?.artifact?.path) {
          libPath = path.join(launcherDataPath, 'libraries', lib.downloads.artifact.path);
          if (!fs.existsSync(libPath)) {
            // Buscar en .minecraft estándar
            const minecraftPath = path.join(
              process.env.APPDATA || process.env.HOME || '',
              '.minecraft',
              'libraries',
              lib.downloads.artifact.path
            );
            if (fs.existsSync(minecraftPath)) {
              libPath = minecraftPath;
            }
          }
        }
        
        // Si no se encontró, construir desde nombre Maven
        if ((!libPath || !fs.existsSync(libPath)) && lib.name) {
          libPath = this.getLibraryPathFromName(lib.name, launcherDataPath);
          
          // Si aún no existe, buscar en .minecraft
          if (!fs.existsSync(libPath)) {
            const parts = lib.name.split(':');
            if (parts.length >= 3) {
              const [group, artifact, version] = parts;
              const groupPath = group.replace(/\./g, '/');
              const fileName = `${artifact}-${version}.jar`;
              const minecraftPath = path.join(
                process.env.APPDATA || process.env.HOME || '',
                '.minecraft',
                'libraries',
                groupPath,
                artifact,
                version,
                fileName
              );
              if (fs.existsSync(minecraftPath)) {
                libPath = minecraftPath;
              }
            }
          }
        }

        if (!libPath || !fs.existsSync(libPath)) {
          continue;
        }

        const basename = path.basename(libPath).toLowerCase();
        
        // Verificar si es excepción de classpath
        const isException = classpathExceptions.some(ex => basename.includes(ex));
        const isModule = moduleKeywords.some(kw => basename.includes(kw));

        if (isException) {
          if (!classpath.includes(libPath)) {
            classpath.push(libPath);
          }
        } else if (isModule) {
          if (!modulePath.includes(libPath)) {
            modulePath.push(libPath);
          }
        } else {
          if (!classpath.includes(libPath)) {
            classpath.push(libPath);
          }
        }
      } catch (error) {
        // Continuar con siguiente librería
        logProgressService.warning(`[Forge] Error al procesar librería: ${error}`);
      }
    }

    // Verificar que módulos críticos estén presentes
    const criticalModules = ['modlauncher', 'bootstrap', 'log4j-core', 'log4j-api'];
    for (const critical of criticalModules) {
      const found = modulePath.some(p => path.basename(p).toLowerCase().includes(critical));
      if (!found) {
        logProgressService.warning(`[Forge] ADVERTENCIA: Módulo crítico '${critical}' no encontrado en module-path`);
      }
    }

    logProgressService.info(`[Forge] Classpath: ${classpath.length} librerías, Module-path: ${modulePath.length} módulos`);
    return { classpath, modulePath };
  }

  /**
   * Verifica si una librería es nativa de otra plataforma
   */
  private isNativeLibraryForOtherPlatform(libraryName: string): boolean {
    if (!libraryName) return false;
    
    const currentOs = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'osx' : 'linux';
    
    if (libraryName.includes('natives-')) {
      if (currentOs === 'windows' && !libraryName.includes('natives-windows')) {
        return true;
      }
      if (currentOs === 'osx' && !libraryName.includes('natives-macos') && !libraryName.includes('natives-osx')) {
        return true;
      }
      if (currentOs === 'linux' && !libraryName.includes('natives-linux')) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Obtiene la ruta de una librería desde su nombre Maven
   */
  private getLibraryPathFromName(libraryName: string, launcherDataPath: string): string {
    const parts = libraryName.split(':');
    if (parts.length < 3) {
      return '';
    }

    const [group, artifact, version] = parts;
    const groupPath = group.replace(/\./g, '/');
    const fileName = `${artifact}-${version}.jar`;
    
    return path.join(launcherDataPath, 'libraries', groupPath, artifact, version, fileName);
  }

  /**
   * Verifica si una librería está permitida según las reglas
   */
  private isLibraryAllowed(rules: any[]): boolean {
    if (!rules || !Array.isArray(rules) || rules.length === 0) {
      return true;
    }

    const currentOs = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'osx' : 'linux';
    let allowed = false;

    for (const rule of rules) {
      const osName = rule.os?.name;
      const action = rule.action;

      if (osName) {
        if (osName === currentOs) {
          allowed = action === 'allow';
        }
      } else {
        if (action === 'allow') {
          allowed = true;
        } else if (action === 'disallow') {
          allowed = false;
        }
      }
    }

    return allowed;
  }

  /**
   * Detiene la ejecución del juego
   */
  detener(): void {
    if (this.gameProcess) {
      logProgressService.info(`[Forge] Deteniendo proceso...`);
      this.gameProcess.kill();
      this.gameProcess = null;
    }
  }
}

export const ejecutarForge = new EjecutarForge();