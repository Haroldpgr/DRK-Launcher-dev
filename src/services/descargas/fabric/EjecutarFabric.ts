// src/services/descargas/fabric/EjecutarFabric.ts
// Lógica CORRECTA para ejecutar Fabric Loader
// Basado en: https://fabricmc.net/ y documentación oficial
// API: https://meta.fabricmc.net/v2/versions/loader/{mcVersion}/{loaderVersion}/profile/json

import { spawn, ChildProcess } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { Profile } from '../../../renderer/services/profileService';
import { logProgressService } from '../../logProgressService';
import { gameLogsService } from '../../gameLogsService';
import { InstanceConfig } from '../../enhancedInstanceCreationService';
import { ModDetectionService } from '../../modDetectionService';
import { minecraftDownloadService } from '../../minecraftDownloadService';
import { getLauncherDataPath } from '../../../utils/paths';
import { ensureValidUUID } from '../../../utils/uuid';
import { JavaConfigService } from '../../javaConfigService';
import fetch from 'node-fetch';

export interface FabricLaunchOptions {
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
  onData?: (chunk: string) => void;
  onExit?: (code: number | null) => void;
}

/**
 * Servicio para ejecutar instancias Fabric de Minecraft
 * 
 * IMPORTANTE: Fabric usa KnotClient (net.fabricmc.loader.impl.launch.knot.KnotClient)
 * El version.json de Fabric hereda de vanilla usando inheritsFrom.
 * 
 * Documentación: https://fabricmc.net/
 * API: https://meta.fabricmc.net/v2/versions/loader/{mcVersion}/{loaderVersion}/profile/json
 */
export class EjecutarFabric {
  private gameProcess: ChildProcess | null = null;

  /**
   * Ejecuta una instancia Fabric
   */
  async ejecutar(opts: FabricLaunchOptions): Promise<ChildProcess> {
    try {
      logProgressService.info(`[Fabric] Iniciando ejecución de Fabric ${opts.loaderVersion} para Minecraft ${opts.mcVersion}...`);

      // Validación 1: client.jar existe
      const clientJarPath = path.join(opts.instancePath, 'client.jar');
      if (!fs.existsSync(clientJarPath)) {
        const error = new Error(`client.jar no encontrado en ${clientJarPath}`);
        logProgressService.error(`[Fabric] ERROR CRÍTICO: ${error.message}`);
        throw error;
      }

      // Validar tamaño del client.jar
      try {
        const stats = fs.statSync(clientJarPath);
        if (stats.size < 1024 * 1024) { // Menos de 1MB
          logProgressService.warning(`[Fabric] ADVERTENCIA: client.jar tiene tamaño inusualmente pequeño: ${stats.size} bytes`);
        }
        logProgressService.info(`[Fabric] client.jar validado: ${stats.size} bytes`);
      } catch (statError) {
        logProgressService.error(`[Fabric] Error al validar client.jar: ${statError}`);
        throw new Error(`No se pudo validar client.jar: ${statError}`);
      }

      // Validación 2: version.json de Fabric existe
      const launcherDataPath = getLauncherDataPath();
      const fabricVersionName = `fabric-loader-${opts.loaderVersion}-${opts.mcVersion}`;
      const fabricVersionDir = path.join(launcherDataPath, 'versions', fabricVersionName);
      
      // CRÍTICO: Buscar 'version.json' primero, luego el nombre antiguo como fallback
      let fabricVersionJsonPath = path.join(fabricVersionDir, 'version.json');
      const oldFabricVersionJsonPath = path.join(fabricVersionDir, `${fabricVersionName}.json`);
      
      if (!fs.existsSync(fabricVersionJsonPath)) {
        // Intentar con el nombre antiguo (compatibilidad con instancias creadas antes)
        if (fs.existsSync(oldFabricVersionJsonPath)) {
          logProgressService.warning(`[Fabric] Encontrado version.json con nombre antiguo, renombrando...`);
          try {
            fs.renameSync(oldFabricVersionJsonPath, fabricVersionJsonPath);
            logProgressService.info(`[Fabric] ✓ Version.json renombrado correctamente`);
          } catch (renameError) {
            logProgressService.warning(`[Fabric] Error al renombrar, usando archivo antiguo: ${renameError}`);
            fabricVersionJsonPath = oldFabricVersionJsonPath;
          }
        } else {
          // Si no existe ninguno, intentar regenerarlo
          logProgressService.warning(`[Fabric] Version.json no encontrado, intentando regenerar...`);
          try {
            // Importar dinámicamente para evitar dependencias circulares
            const downloadFabricModule = await import('./DownloadFabric');
            // Usar la instancia exportada o crear una nueva
            const downloadFabric = 'downloadFabric' in downloadFabricModule 
              ? downloadFabricModule.downloadFabric 
              : new downloadFabricModule.DownloadFabric();
            
            // Solo regenerar el version.json, no toda la instancia
            logProgressService.info(`[Fabric] Regenerando version.json de Fabric...`);
            await downloadFabric.downloadInstance(opts.mcVersion, opts.loaderVersion, opts.instancePath);
            
            // Verificar nuevamente
            if (!fs.existsSync(fabricVersionJsonPath) && !fs.existsSync(oldFabricVersionJsonPath)) {
              throw new Error(`No se pudo generar version.json de Fabric después de regenerar`);
            }
            if (fs.existsSync(oldFabricVersionJsonPath) && !fs.existsSync(fabricVersionJsonPath)) {
              logProgressService.warning(`[Fabric] Version.json regenerado con nombre antiguo, renombrando...`);
              try {
                fs.renameSync(oldFabricVersionJsonPath, fabricVersionJsonPath);
                logProgressService.info(`[Fabric] ✓ Version.json renombrado correctamente`);
              } catch (renameError) {
                logProgressService.warning(`[Fabric] Error al renombrar, usando archivo antiguo: ${renameError}`);
                fabricVersionJsonPath = oldFabricVersionJsonPath;
              }
            }
            logProgressService.info(`[Fabric] ✓ Version.json regenerado exitosamente`);
          } catch (regenerateError) {
            const errorMessage = regenerateError instanceof Error ? regenerateError.message : String(regenerateError);
            const error = new Error(`Version.json de Fabric no encontrado en: ${fabricVersionJsonPath} (tampoco en: ${oldFabricVersionJsonPath}). Error al regenerar: ${errorMessage}`);
            logProgressService.error(`[Fabric] ERROR CRÍTICO: ${error.message}`);
            logProgressService.error(`[Fabric] Asegúrate de que Fabric Loader esté instalado correctamente.`);
            throw error;
          }
        }
      }

      logProgressService.info(`[Fabric] Version.json de Fabric encontrado: ${fabricVersionName}`);

      // Validación 3: Verificar mods y Fabric API
      try {
        const mods = ModDetectionService.detectInstalledMods(opts.instancePath, 'fabric');
        const hasFabricAPI = ModDetectionService.hasFabricAPI ? 
          ModDetectionService.hasFabricAPI(opts.instancePath) :
          mods.some(m => 
            m.id.toLowerCase().includes('fabric-api') || 
            m.id.toLowerCase().includes('fabricapi') ||
            m.name.toLowerCase().includes('fabric api')
          );
        
        if (mods.length > 0 && !hasFabricAPI) {
          logProgressService.warning(`[Fabric] ⚠️ ADVERTENCIA: Se detectaron ${mods.length} mod(s) pero Fabric API no está instalado.`);
          logProgressService.warning(`[Fabric] Muchos mods pueden no funcionar sin Fabric API. Descarga desde: https://modrinth.com/mod/fabric-api o https://www.curseforge.com/minecraft/mc-mods/fabric-api`);
        } else if (mods.length > 0) {
          logProgressService.info(`[Fabric] ✓ ${mods.length} mod(s) detectado(s). Fabric API presente.`);
        } else {
          logProgressService.info(`[Fabric] No se detectaron mods instalados.`);
        }
      } catch (modError) {
        logProgressService.warning(`[Fabric] Error al detectar mods (continuando): ${modError}`);
        // No fallar si hay error detectando mods
      }

      // Obtener la configuración de la instancia
      let instanceId = path.basename(opts.instancePath);
      try {
        const { instanceService } = await import('../../instanceService');
        const config = instanceService.getInstanceConfig(opts.instancePath);
        if (config?.id) {
          instanceId = config.id;
        }
      } catch {
        // Si falla, usar el basename como fallback
      }

      const instanceConfig: InstanceConfig = {
        id: instanceId,
        name: path.basename(opts.instancePath),
        version: opts.mcVersion,
        loader: 'fabric',
        loaderVersion: opts.loaderVersion,
        path: opts.instancePath,
        createdAt: Date.now()
      };

      // Construir argumentos de lanzamiento
      logProgressService.info(`[Fabric] Construyendo argumentos de lanzamiento...`);
      const args = await this.buildLaunchArguments(opts, fabricVersionJsonPath);
      const stringArgs = args.map(arg => typeof arg === 'string' ? arg : String(arg));

      logProgressService.info(`[Fabric] Argumentos construidos (${stringArgs.length} argumentos totales)`);

      // Validación final antes de lanzar: verificar que el classpath tenga elementos
      const classpathIndex = stringArgs.findIndex(arg => arg === '-cp' || arg === '-classpath');
      if (classpathIndex !== -1 && classpathIndex + 1 < stringArgs.length) {
        const classpathValue = stringArgs[classpathIndex + 1];
        const classpathJars = classpathValue.split(path.delimiter);
        logProgressService.info(`[Fabric] Classpath contiene ${classpathJars.length} JARs`);
        
        // Verificar que client.jar esté en el classpath
        const hasClientJar = classpathJars.some(jar => jar.includes('client.jar'));
        if (!hasClientJar) {
          logProgressService.error(`[Fabric] ERROR CRÍTICO: client.jar NO está en el classpath!`);
          throw new Error('client.jar no está en el classpath');
        }

        // Verificar que Fabric Loader esté en el classpath
        const hasFabricLoader = classpathJars.some(jar => 
          jar.includes('fabric-loader') || jar.includes('fabric_loader')
        );
        if (!hasFabricLoader) {
          logProgressService.warning(`[Fabric] ADVERTENCIA: Fabric Loader no detectado en el classpath. Puede causar errores.`);
        }
      }

      // Crear el proceso hijo
      logProgressService.info(`[Fabric] Iniciando proceso Java...`);
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

      logProgressService.info(`[Fabric] Proceso iniciado con PID: ${this.gameProcess.pid}`);

      // Manejar salida estándar
      if (this.gameProcess.stdout) {
        this.gameProcess.stdout.on('data', (data) => {
          try {
            const output = data.toString();
            logProgressService.info(`[Fabric-OUT] ${output}`);
            gameLogsService.addLog(instanceConfig.id, output);
            if (opts.onData) {
              opts.onData(output);
            }
          } catch (outputError) {
            logProgressService.error(`[Fabric] Error al procesar salida estándar: ${outputError}`);
          }
        });
      }

      // Manejar salida de error
      if (this.gameProcess.stderr) {
        this.gameProcess.stderr.on('data', (data) => {
          try {
            const output = data.toString();
            logProgressService.error(`[Fabric-ERR] ${output}`);
            gameLogsService.addLog(instanceConfig.id, output);
            if (opts.onData) {
              opts.onData(output);
            }
          } catch (errorError) {
            logProgressService.error(`[Fabric] Error al procesar salida de error: ${errorError}`);
          }
        });
      }

      // Manejar cierre del proceso
      this.gameProcess.on('close', (code, signal) => {
        if (code !== null) {
          logProgressService.info(`[Fabric] Proceso terminado con código ${code}`);
        } else if (signal) {
          logProgressService.info(`[Fabric] Proceso terminado por señal: ${signal}`);
        } else {
          logProgressService.info(`[Fabric] Proceso terminado`);
        }
        
        if (opts.onExit) {
          opts.onExit(code);
        }
        this.gameProcess = null;
      });

      // Manejar errores del proceso
      this.gameProcess.on('error', (error) => {
        logProgressService.error(`[Fabric] Error en el proceso Java: ${error.message}`);
        logProgressService.error(`[Fabric] Stack trace: ${error.stack || 'No disponible'}`);
        
        if (opts.onExit) {
          opts.onExit(null);
        }
        
        this.gameProcess = null;
        throw error;
      });

      logProgressService.success(`[Fabric] Minecraft lanzado exitosamente`, {
        pid: this.gameProcess.pid
      });

      return this.gameProcess;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logProgressService.error(`[Fabric] ERROR al ejecutar: ${errorMessage}`);
      if (errorStack) {
        logProgressService.error(`[Fabric] Stack trace: ${errorStack}`);
      }
      
      throw error;
    }
  }

  /**
   * Construye los argumentos de lanzamiento para Fabric
   * 
   * IMPORTANTE: Fabric usa el version.json que hereda de vanilla.
   * Necesitamos leer el version.json de Fabric y resolver el inheritsFrom.
   */
  private async buildLaunchArguments(
    opts: FabricLaunchOptions,
    fabricVersionJsonPath: string
  ): Promise<string[]> {
    try {
      const mem = Math.max(512, opts.ramMb || 2048);
      const jvmArgs = JavaConfigService.getStandardJvmArgs('fabric', mem);
      
      logProgressService.info(`[Fabric] Memoria configurada: ${mem}MB`);
      logProgressService.info(`[Fabric] JVM args base: ${jvmArgs.length} argumentos`);

      const launcherDataPath = getLauncherDataPath();
      const libraryJars: string[] = [];
      const nativeLibraries: string[] = [];

      // PASO 1: Leer version.json de Fabric
      logProgressService.info(`[Fabric] Leyendo version.json de Fabric desde: ${fabricVersionJsonPath}...`);
      let fabricVersionData: any;
      try {
        // Verificar que el archivo existe (ya se validó antes, pero por si acaso)
        if (!fs.existsSync(fabricVersionJsonPath)) {
          const fabricVersionName = `fabric-loader-${opts.loaderVersion}-${opts.mcVersion}`;
          const oldPath = path.join(launcherDataPath, 'versions', fabricVersionName, `${fabricVersionName}.json`);
          if (fs.existsSync(oldPath)) {
            logProgressService.warning(`[Fabric] Usando version.json con nombre antiguo como fallback`);
            fabricVersionJsonPath = oldPath;
          } else {
            throw new Error(`Version.json no encontrado en ${fabricVersionJsonPath} ni en ${oldPath}`);
          }
        }
        
        const fabricVersionContent = fs.readFileSync(fabricVersionJsonPath, 'utf-8');
        fabricVersionData = JSON.parse(fabricVersionContent);
        
        if (!fabricVersionData.mainClass) {
          throw new Error('version.json de Fabric no tiene mainClass');
        }
        if (!fabricVersionData.libraries || !Array.isArray(fabricVersionData.libraries)) {
          throw new Error('version.json de Fabric no tiene libraries válido');
        }
        
        logProgressService.info(`[Fabric] Version.json de Fabric leído: ${fabricVersionData.libraries.length} librerías`);
      } catch (readError) {
        logProgressService.error(`[Fabric] ERROR al leer version.json de Fabric: ${readError}`);
        throw new Error(`No se pudo leer version.json de Fabric: ${readError}`);
      }

      // PASO 2: Si tiene inheritsFrom, leer el version.json base (vanilla)
      let vanillaVersionData: any = null;
      if (fabricVersionData.inheritsFrom) {
        const vanillaVersionName = fabricVersionData.inheritsFrom;
        // CRÍTICO: Buscar 'version.json' para consistencia con Vanilla
        const vanillaVersionJsonPath = path.join(launcherDataPath, 'versions', vanillaVersionName, 'version.json');
        
        logProgressService.info(`[Fabric] Version.json hereda de: ${vanillaVersionName}`);
        
        if (fs.existsSync(vanillaVersionJsonPath)) {
          try {
            const vanillaVersionContent = fs.readFileSync(vanillaVersionJsonPath, 'utf-8');
            vanillaVersionData = JSON.parse(vanillaVersionContent);
            logProgressService.info(`[Fabric] Version.json base (vanilla) leído: ${vanillaVersionData.libraries?.length || 0} librerías`);
          } catch (vanillaReadError) {
            logProgressService.warning(`[Fabric] ADVERTENCIA: No se pudo leer version.json base: ${vanillaReadError}`);
            logProgressService.warning(`[Fabric] Continuando solo con librerías de Fabric...`);
          }
        } else {
          logProgressService.warning(`[Fabric] ADVERTENCIA: Version.json base no encontrado: ${vanillaVersionJsonPath}`);
          logProgressService.warning(`[Fabric] Intentando descargar version.json base...`);
          
          try {
            // Intentar descargar el version.json base
            await minecraftDownloadService.downloadVersionMetadata(vanillaVersionName);
            // Después de descargar, buscar 'version.json' (no ${vanillaVersionName}.json)
            if (fs.existsSync(vanillaVersionJsonPath)) {
              const vanillaVersionContent = fs.readFileSync(vanillaVersionJsonPath, 'utf-8');
              vanillaVersionData = JSON.parse(vanillaVersionContent);
              logProgressService.info(`[Fabric] Version.json base descargado y leído`);
            }
          } catch (downloadError) {
            logProgressService.warning(`[Fabric] No se pudo descargar version.json base: ${downloadError}`);
          }
        }
      }

      // PASO 3: Procesar librerías del version.json base (vanilla) primero
      if (vanillaVersionData && vanillaVersionData.libraries && Array.isArray(vanillaVersionData.libraries)) {
        logProgressService.info(`[Fabric] Procesando ${vanillaVersionData.libraries.length} librerías de vanilla...`);
        
        for (const lib of vanillaVersionData.libraries) {
          try {
            if (!this.isLibraryAllowed(lib.rules)) {
              continue;
            }

            if (lib.downloads?.artifact) {
              // Verificar si es librería nativa de otra plataforma
              if (this.isNativeLibraryForOtherPlatform(lib.name, lib.downloads.classifiers)) {
                continue;
              }

              let libPath: string;
              if (lib.downloads.artifact.path) {
                libPath = path.join(launcherDataPath, 'libraries', lib.downloads.artifact.path);
              } else {
                libPath = path.join(launcherDataPath, 'libraries', this.getLibraryPath(lib.name));
              }

              // Buscar en múltiples ubicaciones
              const possiblePaths = [
                libPath,
                path.join(opts.instancePath, 'libraries', this.getLibraryPath(lib.name)),
                path.join(process.env.APPDATA || process.env.HOME || '', '.minecraft', 'libraries', this.getLibraryPath(lib.name)),
              ];

              let found = false;
              for (const possiblePath of possiblePaths) {
                if (fs.existsSync(possiblePath)) {
                  if (!libraryJars.includes(possiblePath)) {
                    libraryJars.push(possiblePath);
                  }
                  found = true;
                  break;
                }
              }

              // Si no se encontró y hay URL, intentar descargar
              if (!found && lib.downloads.artifact.url) {
                try {
                  logProgressService.info(`[Fabric] Descargando librería faltante de vanilla: ${lib.name}`);
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
                    logProgressService.info(`[Fabric] Librería de vanilla descargada: ${lib.name}`);
                    
                    if (!libraryJars.includes(libPath)) {
                      libraryJars.push(libPath);
                    }
                  } else {
                    logProgressService.warning(`[Fabric] Error HTTP al descargar librería ${lib.name}: ${response.status}`);
                  }
                } catch (downloadError) {
                  logProgressService.warning(`[Fabric] Error al descargar librería ${lib.name}: ${downloadError}`);
                }
              }

              // Procesar classifiers (nativas)
              if (lib.downloads.classifiers) {
                const currentOs = this.getOSClassifier();
                const nativeClassifier = lib.downloads.classifiers[currentOs];
                
                if (nativeClassifier && nativeClassifier.path) {
                  const nativePath = path.join(launcherDataPath, 'libraries', nativeClassifier.path);
                  if (fs.existsSync(nativePath)) {
                    nativeLibraries.push(nativePath);
                  }
                }
              }
            }
          } catch (libError) {
            logProgressService.warning(`[Fabric] Error al procesar librería de vanilla ${lib.name}: ${libError}`);
            // Continuar con las siguientes librerías
          }
        }
      }

      // PASO 4: Procesar librerías del version.json de Fabric
      logProgressService.info(`[Fabric] Procesando ${fabricVersionData.libraries.length} librerías de Fabric...`);
      
      let fabricLibrariesAdded = 0;
      for (const lib of fabricVersionData.libraries) {
        try {
          if (!this.isLibraryAllowed(lib.rules)) {
            logProgressService.info(`[Fabric] Librería excluida por reglas: ${lib.name || 'sin nombre'}`);
            continue;
          }

          if (!lib.name) {
            logProgressService.warning(`[Fabric] Librería sin nombre, omitiendo`);
            continue;
          }

          // Construir path desde el nombre Maven (formato: group:artifact:version)
          const libPath = path.join(launcherDataPath, 'libraries', this.getLibraryPath(lib.name));

          const possiblePaths = [
            libPath,
            path.join(opts.instancePath, 'libraries', this.getLibraryPath(lib.name)),
          ];

          let found = false;
          for (const possiblePath of possiblePaths) {
            if (fs.existsSync(possiblePath)) {
              if (!libraryJars.includes(possiblePath)) {
                libraryJars.push(possiblePath);
                fabricLibrariesAdded++;
                logProgressService.info(`[Fabric] ✓ Librería añadida al classpath: ${path.basename(possiblePath)}`);
              }
              found = true;
              break;
            }
          }

          // Si no se encontró, intentar descargar
          if (!found) {
            let downloadUrl: string | null = null;

            // Prioridad 1: URL desde downloads.artifact.url (si existe en el version.json)
            if (lib.downloads?.artifact?.url) {
              downloadUrl = lib.downloads.artifact.url;
              logProgressService.info(`[Fabric] Usando URL del version.json para: ${lib.name}`);
            }
            // Prioridad 2: Construir URL desde repositorio de Fabric (para net.fabricmc.*)
            else if (lib.name && lib.name.startsWith('net.fabricmc:')) {
              downloadUrl = this.buildFabricMavenUrl(lib.name);
              logProgressService.info(`[Fabric] Construyendo URL desde repositorio de Fabric para: ${lib.name}`);
            }
            // Prioridad 3: Construir URL desde Maven Central (para otras librerías como org.ow2.asm.*)
            else if (lib.name && lib.name.includes(':')) {
              downloadUrl = this.buildMavenUrl(lib.name);
              logProgressService.info(`[Fabric] Construyendo URL desde Maven Central para: ${lib.name}`);
            }

            if (downloadUrl) {
              try {
                logProgressService.info(`[Fabric] Descargando librería faltante de Fabric: ${lib.name}`);
                const libDir = path.dirname(libPath);
                if (!fs.existsSync(libDir)) {
                  fs.mkdirSync(libDir, { recursive: true });
                }

                const response = await fetch(downloadUrl, {
                  headers: { 'User-Agent': 'DRK-Launcher/1.0' }
                });

                if (response.ok) {
                  const buffer = Buffer.from(await response.arrayBuffer());
                  fs.writeFileSync(libPath, buffer);
                  logProgressService.info(`[Fabric] ✓ Librería de Fabric descargada: ${path.basename(libPath)} (${(buffer.length / 1024).toFixed(2)} KB)`);
                  
                  if (!libraryJars.includes(libPath)) {
                    libraryJars.push(libPath);
                    fabricLibrariesAdded++;
                  }
                } else {
                  logProgressService.warning(`[Fabric] Error HTTP al descargar librería de Fabric: ${response.status} (URL: ${downloadUrl})`);
                  // Si falla con Maven Central, intentar con repositorio de Fabric como fallback
                  if (downloadUrl.includes('repo1.maven.org') && lib.name && lib.name.includes(':')) {
                    const fabricUrl = this.buildFabricMavenUrl(lib.name);
                    if (fabricUrl && fabricUrl !== downloadUrl) {
                      logProgressService.info(`[Fabric] Intentando descargar desde repositorio de Fabric como fallback...`);
                      try {
                        const fallbackResponse = await fetch(fabricUrl, {
                          headers: { 'User-Agent': 'DRK-Launcher/1.0' }
                        });
                        if (fallbackResponse.ok) {
                          const buffer = Buffer.from(await fallbackResponse.arrayBuffer());
                          fs.writeFileSync(libPath, buffer);
                          logProgressService.info(`[Fabric] ✓ Librería descargada desde repositorio de Fabric: ${path.basename(libPath)}`);
                          if (!libraryJars.includes(libPath)) {
                            libraryJars.push(libPath);
                            fabricLibrariesAdded++;
                          }
                        }
                      } catch (fallbackError) {
                        logProgressService.warning(`[Fabric] Fallback también falló: ${fallbackError}`);
                      }
                    }
                  }
                }
              } catch (downloadError) {
                logProgressService.warning(`[Fabric] Error al descargar librería de Fabric: ${downloadError}`);
              }
            } else {
              logProgressService.warning(`[Fabric] Librería no encontrada y sin URL disponible: ${lib.name} en ${libPath}`);
            }
          }
        } catch (libError) {
          logProgressService.warning(`[Fabric] Error al procesar librería de Fabric ${lib.name || 'sin nombre'}: ${libError}`);
          // Continuar con las siguientes librerías
        }
      }
      
      logProgressService.info(`[Fabric] Librerías de Fabric procesadas: ${fabricLibrariesAdded} añadidas al classpath`);

      // PASO 5: Añadir client.jar al classpath
      const clientJar = path.join(opts.instancePath, 'client.jar');
      if (fs.existsSync(clientJar)) {
        libraryJars.push(clientJar);
        logProgressService.info(`[Fabric] client.jar añadido al classpath`);
      } else {
        logProgressService.error(`[Fabric] ERROR: client.jar no encontrado en ${clientJar}`);
        throw new Error(`client.jar no encontrado`);
      }

      // PASO 6: Construir classpath
      const classpath = libraryJars.join(path.delimiter);
      logProgressService.info(`[Fabric] Classpath construido con ${libraryJars.length} JARs`);

      // PASO 7: Extraer librerías nativas si existen
      if (nativeLibraries.length > 0) {
        const nativesDir = path.join(opts.instancePath, 'natives');
        if (!fs.existsSync(nativesDir)) {
          fs.mkdirSync(nativesDir, { recursive: true });
        }

        // Limpiar directorio de nativas
        try {
          const existingFiles = fs.readdirSync(nativesDir);
          for (const file of existingFiles) {
            const filePath = path.join(nativesDir, file);
            try {
              fs.unlinkSync(filePath);
            } catch {}
          }
        } catch {}

        // Extraer archivos nativos
        for (const nativeJar of nativeLibraries) {
          if (fs.existsSync(nativeJar)) {
            try {
              const StreamZipAsync = (await import('node-stream-zip')).default;
              const zip = new StreamZipAsync.async({ file: nativeJar });
              const entries = await zip.entries();

              for (const entry of Object.values(entries) as Array<{ name: string }>) {
                if (entry && entry.name && (
                  entry.name.endsWith('.dll') ||
                  entry.name.endsWith('.so') ||
                  entry.name.endsWith('.dylib') ||
                  entry.name.endsWith('.jnilib')
                )) {
                  const extractPath = path.join(nativesDir, path.basename(entry.name));
                  await zip.extract(entry.name, extractPath);
                  logProgressService.info(`[Fabric] Extraída librería nativa: ${path.basename(entry.name)}`);
                }
              }

              await zip.close();
            } catch (extractError) {
              logProgressService.warning(`[Fabric] Error al extraer librerías nativas de ${nativeJar}: ${extractError}`);
            }
          }
        }

        jvmArgs.push('-Djava.library.path', nativesDir);
        logProgressService.info(`[Fabric] java.library.path configurado: ${nativesDir}`);
      }

      // PASO 8: Obtener mainClass (Fabric usa KnotClient)
      const mainClass = fabricVersionData.mainClass || 'net.fabricmc.loader.impl.launch.knot.KnotClient';
      logProgressService.info(`[Fabric] MainClass: ${mainClass}`);

      // PASO 9: Construir argumentos del juego
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

      // Obtener assetIndexId (CRÍTICO: usar el ID del assetIndex, no la versión)
      let assetIndexId = opts.mcVersion;
      if (vanillaVersionData && vanillaVersionData.assetIndex && vanillaVersionData.assetIndex.id) {
        assetIndexId = vanillaVersionData.assetIndex.id;
        logProgressService.info(`[Fabric] Asset Index ID desde vanilla: ${assetIndexId}`);
      } else if (fabricVersionData.assetIndex && fabricVersionData.assetIndex.id) {
        assetIndexId = fabricVersionData.assetIndex.id;
        logProgressService.info(`[Fabric] Asset Index ID desde Fabric: ${assetIndexId}`);
      } else {
        logProgressService.warning(`[Fabric] No se encontró assetIndex.id, usando versión como fallback: ${assetIndexId}`);
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
        '--versionType', 'DRK Launcher (Fabric)'
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

      // PASO 10: Construir argumentos finales
      const launchArgs = [
        ...jvmArgs,
        ...(opts.jvmArgs || []),
        '-cp', classpath,
        mainClass,
        ...gameArgs,
        ...(opts.gameArgs || [])
      ];

      logProgressService.info(`[Fabric] Argumentos de lanzamiento construidos exitosamente`);
      return launchArgs;
    } catch (error) {
      logProgressService.error(`[Fabric] ERROR al construir argumentos de lanzamiento: ${error}`);
      throw error;
    }
  }

  /**
   * Verifica si una librería está permitida según sus reglas
   */
  private isLibraryAllowed(rules: any[]): boolean {
    if (!rules || !Array.isArray(rules) || rules.length === 0) {
      return true; // Por defecto, permitir si no hay reglas
    }

    const osName = this.getOSName();
    let allowed = false;

    for (const rule of rules) {
      const ruleOsName = rule.os?.name;
      const action = rule.action;

      if (ruleOsName) {
        // Regla específica de OS
        if (ruleOsName === osName) {
          allowed = action === 'allow';
        }
        // Si la regla es para otro OS, no la aplicamos
      } else {
        // Regla general (sin restricción de OS)
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
   * Verifica si una librería es nativa de otra plataforma
   */
  private isNativeLibraryForOtherPlatform(libraryName: string, classifiers?: any): boolean {
    const currentOs = process.platform;
    
    if (libraryName) {
      if (currentOs === 'win32') {
        return libraryName.includes(':natives-linux') || 
               libraryName.includes(':natives-macos') ||
               libraryName.includes(':natives-osx');
      }
      
      if (currentOs === 'linux') {
        return libraryName.includes(':natives-windows') || 
               libraryName.includes(':natives-macos') ||
               libraryName.includes(':natives-osx');
      }
      
      if (currentOs === 'darwin') {
        return libraryName.includes(':natives-windows') || 
               libraryName.includes(':natives-linux');
      }
    }

    return false;
  }

  /**
   * Obtiene el nombre del sistema operativo en formato Minecraft
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
   * Obtiene el classifier del OS para librerías nativas
   */
  private getOSClassifier(): string {
    switch (process.platform) {
      case 'win32': return 'natives-windows';
      case 'darwin': return 'natives-macos';
      case 'linux': return 'natives-linux';
      default: return 'natives-linux';
    }
  }

  /**
   * Construye la ruta de una librería basada en su nombre Maven
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
   * Construye la URL de Maven Central para una librería
   * Formato: group:artifact:version -> https://repo1.maven.org/maven2/group/path/artifact/version/artifact-version.jar
   */
  private buildMavenUrl(libraryName: string): string {
    const parts = libraryName.split(':');
    if (parts.length < 3) {
      return '';
    }

    const [group, artifact, version] = parts;
    const groupPath = group.replace(/\./g, '/');
    
    // Maven Central URL
    return `https://repo1.maven.org/maven2/${groupPath}/${artifact}/${version}/${artifact}-${version}.jar`;
  }

  /**
   * Construye la URL del repositorio de Fabric para una librería
   * Formato: group:artifact:version -> https://maven.fabricmc.net/group/path/artifact/version/artifact-version.jar
   * 
   * IMPORTANTE: Las librerías de Fabric (net.fabricmc.*) están en maven.fabricmc.net, NO en Maven Central
   */
  private buildFabricMavenUrl(libraryName: string): string {
    const parts = libraryName.split(':');
    if (parts.length < 3) {
      return '';
    }

    const [group, artifact, version] = parts;
    const groupPath = group.replace(/\./g, '/');
    
    // Repositorio de Fabric Maven
    return `https://maven.fabricmc.net/${groupPath}/${artifact}/${version}/${artifact}-${version}.jar`;
  }

  /**
   * Detiene la ejecución del juego
   */
  detener(): void {
    if (this.gameProcess) {
      logProgressService.info(`[Fabric] Deteniendo proceso...`);
      try {
        this.gameProcess.kill();
        this.gameProcess = null;
        logProgressService.info(`[Fabric] Proceso detenido`);
      } catch (error) {
        logProgressService.error(`[Fabric] Error al detener proceso: ${error}`);
      }
    }
  }
}

// Exportar solo la instancia (patrón singleton)
export const ejecutarFabric = new EjecutarFabric();

