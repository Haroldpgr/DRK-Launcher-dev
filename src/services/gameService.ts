import { spawn } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'
import { Profile } from '../renderer/services/profileService'
import { minecraftDownloadService } from './minecraftDownloadService'
import { getLauncherDataPath } from '../utils/paths'
import fetch from 'node-fetch';

export type LaunchOptions = {
  javaPath: string
  mcVersion: string
  instancePath: string
  ramMb?: number
  jvmArgs?: string[]
  gameArgs?: string[]
  userProfile?: Profile
  windowSize?: {
    width: number
    height: number
  }
  loader?: 'vanilla' | 'forge' | 'fabric' | 'quilt' | 'neoforge' | null
  loaderVersion?: string
}

// Verificar si una instancia está completamente descargada y lista para jugar
export function isInstanceReady(instancePath: string): boolean {
  console.log(`Verificando si la instancia en ${instancePath} está lista para jugar...`);

  try {
    // Verificar que exista el archivo client.jar principal (archivo esencial)
    const clientJarPath = path.join(instancePath, 'client.jar');
    if (!fs.existsSync(clientJarPath)) {
      console.log(`[VERIFICACIÓN] client.jar no encontrado en ${clientJarPath}`);
      try {
        const files = fs.readdirSync(instancePath);
        console.log(`[VERIFICACIÓN] Archivos en la instancia ${instancePath}:`, files.join(', '));
      } catch (dirError) {
        console.log(`[VERIFICACIÓN] No se pudo leer el directorio de la instancia:`, dirError);
      }
      return false;
    }

    // Verificar si podemos acceder al archivo y obtener su tamaño
    let clientJarStats;
    try {
      clientJarStats = fs.statSync(clientJarPath);
    } catch (statError) {
      console.log(`[VERIFICACIÓN] No se pudo acceder al archivo client.jar: ${statError}`);
      return false;
    }

    // Verificar si el client.jar tiene un tamaño razonable (al menos 1MB para ser considerado válido)
    if (clientJarStats.size < 1024 * 1024) { // 1MB en bytes
      console.log(`[VERIFICACIÓN] client.jar es demasiado pequeño (${clientJarStats.size} bytes), probablemente no esté completamente descargado`);
      return false;
    }

    console.log(`[VERIFICACIÓN] client.jar encontrado y válido: ${clientJarPath} (${clientJarStats.size} bytes)`);

    // Verificar que exista la carpeta de assets en la ubicación compartida con estructura completa
    const launcherPath = getLauncherDataPath();
    const launcherAssetsPath = path.join(launcherPath, 'assets');

    // La carpeta compartida de assets DEBE existir y tener la estructura completa
    if (!fs.existsSync(launcherAssetsPath)) {
      console.log(`[VERIFICACIÓN] Carpeta de assets compartida no existe: ${launcherAssetsPath}`);
      return false;
    }

    // Verificar que existan las subcarpetas esenciales de assets
    const indexesPath = path.join(launcherAssetsPath, 'indexes');
    const objectsPath = path.join(launcherAssetsPath, 'objects');

    if (!fs.existsSync(indexesPath)) {
      console.log(`[VERIFICACIÓN] Carpeta de índices de assets no existe: ${indexesPath}`);
      return false;
    }

    if (!fs.existsSync(objectsPath)) {
      console.log(`[VERIFICACIÓN] Carpeta de objetos de assets no existe: ${objectsPath}`);
      return false;
    }

    // Verificar que haya al menos algunos archivos de índice (no necesariamente completos, pero al menos algunos)
    try {
      const indexFiles = fs.readdirSync(indexesPath);
      if (indexFiles.length === 0) {
        console.log(`[VERIFICACIÓN] Carpeta de índices de assets está vacía: ${indexesPath}`);
        return false; // No hay ningún archivo de índice
      }
    } catch (indexError) {
      console.log(`[VERIFICACIÓN] Error al leer carpeta de índices de assets:`, indexError);
      return false;
    }

    // Verificar que haya al menos algunos directorios de objetos (no necesariamente completos, pero al menos algunos)
    try {
      const objectFolders = fs.readdirSync(objectsPath);
      if (objectFolders.length === 0) {
        console.log(`[VERIFICACIÓN] Carpeta de objetos de assets está vacía: ${objectsPath}`);
        return false; // No hay ninguno directorio de objetos
      }
    } catch (objectsError) {
      console.log(`[VERIFICACIÓN] Error al leer carpeta de objetos de assets:`, objectsError);
      return false;
    }

    // Verificar que exista la estructura básica de carpetas (crearlas si no existen)
    const requiredFolders = ['mods', 'config', 'saves', 'logs'];
    for (const folder of requiredFolders) {
      const folderPath = path.join(instancePath, folder);
      if (!fs.existsSync(folderPath)) {
        // Creamos la carpeta si no existe (esto es común en instancias nuevas)
        try {
          fs.mkdirSync(folderPath, { recursive: true });
          console.log(`[VERIFICACIÓN] Carpeta creada: ${folderPath}`);
        } catch (mkdirErr) {
          console.log(`[VERIFICACIÓN] No se pudo crear carpeta ${folder}:`, mkdirErr);
        }
      }
    }

    // Si llega aquí, se considera que hay los archivos y estructura necesarios
    console.log(`[VERIFICACIÓN] Instancia en ${instancePath} está lista para jugar`);
    return true;
  } catch (error) {
    console.error('[VERIFICACIÓN] Error al verificar si la instancia está lista:', error);
    console.error('[VERIFICACIÓN] Error en detalle:', (error as Error).message);
    return false;
  }
}

// Función adicional para verificar si los assets están disponibles para una versión específica
export function areAssetsReadyForVersion(instancePath: string, mcVersion: string): boolean {
  try {
    // Intentar obtener el archivo de metadata de la versión
    const versionJsonPath = path.join(getLauncherDataPath(), 'versions', mcVersion, `${mcVersion}.json`);

    if (!fs.existsSync(versionJsonPath)) {
      // Si no tenemos el archivo de metadata, asumir que los assets están disponibles
      // en la carpeta compartida (el juego puede funcionar sin el metadata local)
      console.log(`Metadata de versión ${mcVersion} no encontrada, verificando carpeta de assets compartida...`);
      const launcherAssetsPath = path.join(getLauncherDataPath(), 'assets');
      // Verificar si la carpeta de assets existe y hay subdirectorios con contenido
      if (fs.existsSync(launcherAssetsPath)) {
        // Verificar que existan al menos las carpetas básicas de assets
        const indexesPath = path.join(launcherAssetsPath, 'indexes');
        const objectsPath = path.join(launcherAssetsPath, 'objects');

        if (fs.existsSync(indexesPath) && fs.existsSync(objectsPath)) {
          // Contar si hay algún archivo en las carpetas relevantes
          const indexesCount = fs.readdirSync(indexesPath).length;
          const objectsSubdirs = fs.readdirSync(objectsPath).filter(dir =>
            fs.statSync(path.join(objectsPath, dir)).isDirectory()
          );

          // Si tienen contenido, considerar que los assets están disponibles
          return indexesCount > 0 && objectsSubdirs.length > 0;
        }
      }
      return false; // Si no existen las carpetas básicas, retornar falso
    }

    // Si tenemos el archivo de metadata, podemos verificar que los assets estén disponibles
    const versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));
    const assetIndexId = versionData.assetIndex?.id;

    // Verificar si el archivo de índice de assets existe en la carpeta compartida
    if (assetIndexId) {
      const assetIndexFile = path.join(getLauncherDataPath(), 'assets', 'indexes', `${assetIndexId}.json`);
      return fs.existsSync(assetIndexFile);
    }

    // Si no hay información específica de assets, asumir que está listo
    return true;
  } catch (error) {
    console.error(`Error al verificar si los assets están listos para la versión ${mcVersion}:`, error);
    // En caso de error, asumir que los assets están disponibles para no bloquear
    // pero loggear un mensaje
    console.log(`Asumiendo que los assets para la versión ${mcVersion} están disponibles debido a error...`);
    return true;
  }
}

// Función asíncrona para asegurar que el client.jar esté disponible antes de lanzar el juego
export async function ensureClientJar(instancePath: string, mcVersion: string): Promise<boolean> {
  const clientJarPath = path.join(instancePath, 'client.jar');

  // Si el archivo ya existe y tiene el tamaño adecuado, retornar true
  if (fs.existsSync(clientJarPath)) {
    try {
      const stats = fs.statSync(clientJarPath);
      if (stats.size >= 1024 * 1024) { // Al menos 1MB
        console.log(`client.jar ya existe y es válido: ${clientJarPath} (${stats.size} bytes)`);
        return true;
      } else {
        console.log(`client.jar existe pero es demasiado pequeño (${stats.size} bytes), se volverá a descargar`);
      }
    } catch (error) {
      console.log(`No se pudo verificar el tamaño del client.jar existente:`, error);
    }
  }

  // Intentar descargar el client.jar si no existe o es muy pequeño
  try {
    console.log(`Intentando descargar client.jar para la versión ${mcVersion} en ${instancePath}`);

    // Asegurarse de que el directorio exista
    fs.mkdirSync(path.dirname(clientJarPath), { recursive: true });

    await minecraftDownloadService.downloadClientJar(mcVersion, instancePath);

    // Dar un pequeño tiempo para que el sistema escriba el archivo
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verificar que se haya descargado correctamente
    if (fs.existsSync(clientJarPath)) {
      const stats = fs.statSync(clientJarPath);
      if (stats.size >= 1024 * 1024) { // Verificar que tenga el tamaño adecuado
        console.log(`client.jar descargado correctamente: ${clientJarPath} (${stats.size} bytes)`);
        return true;
      } else {
        console.error(`client.jar descargado es demasiado pequeño: ${stats.size} bytes`);
        // Eliminar el archivo corrupto
        try {
          fs.unlinkSync(clientJarPath);
        } catch (unlinkError) {
          console.error(`Error al eliminar archivo client.jar corrupto:`, unlinkError);
        }
        return false;
      }
    } else {
      console.error(`client.jar no se creó después de la descarga en: ${clientJarPath}`);
      return false;
    }
  } catch (error) {
    console.error(`Error al descargar client.jar para la versión ${mcVersion}:`, error);
    // Verificar si el archivo parcialmente descargado existe y eliminarlo
    if (fs.existsSync(clientJarPath)) {
      try {
        fs.unlinkSync(clientJarPath);
        console.log(`Archivo client.jar eliminado después de error de descarga`);
      } catch (unlinkError) {
        console.error(`Error al limpiar archivo client.jar después de error:`, unlinkError);
      }
    }
    return false;
  }
}

export async function buildArgs(opts: LaunchOptions) {
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
    // Lógica para Vanilla (la existente)
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
            if (lib.rules) {
              let allowed = false;
              let appliesToOS = true;

              for (const rule of lib.rules) {
                if (rule.os && rule.os.name) {
                  const osName = getOSName();
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
            } else {
              // Si no hay reglas, asumir que está permitido
              allowed = true;
            }

            if (lib.downloads && lib.downloads.artifact) {
              // Usar la ruta proporcionada en el artifact.path o construir la ruta tradicional
              let libPath;
              if (lib.downloads.artifact.path) {
                libPath = path.join(launcherPath, 'libraries', lib.downloads.artifact.path);
              } else {
                libPath = path.join(launcherPath, 'libraries', getLibraryPath(lib.name));
              }

              // Probar múltiples ubicaciones posibles
              const possiblePaths = [
                libPath, // Ruta estándar en .DRK Launcher/libraries
                path.join(opts.instancePath, 'libraries', getLibraryPath(lib.name)), // En la instancia
                path.join(process.env.APPDATA || '', '.minecraft', 'libraries', getLibraryPath(lib.name)), // .minecraft estándar
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
                console.warn(`Librería no encontrada: ${lib.name}. Intentando descargar...`);

                // Intentar descargar la librería si no se encuentra
                try {
                  if (lib.downloads.artifact.url) {
                    // Crear carpeta donde debería estar la librería
                    const libDir = path.dirname(libPath);
                    fs.mkdirSync(libDir, { recursive: true });

                    // Descargar la librería directamente
                    const downloadResult = await downloadLibrary(lib.downloads.artifact.url, libPath);
                    if (downloadResult && fs.existsSync(libPath)) {
                      libraryJars.push(libPath);
                      console.log(`Librería descargada: ${lib.name}`);
                      found = true;
                    }
                  }
                } catch (downloadError) {
                  console.error(`Error al descargar la librería ${lib.name}:`, downloadError);
                }

                if (!found) {
                  console.warn(`No se pudo descargar la librería: ${lib.name}`);
                }
              }
            } else if (lib.url) {
              // Soporte para el formato antiguo de librerías (antes de 1.14)
              const libPath = path.join(launcherPath, 'libraries', getLibraryPath(lib.name));
              const possiblePaths = [
                libPath,
                path.join(opts.instancePath, 'libraries', getLibraryPath(lib.name)),
                path.join(process.env.APPDATA || '', '.minecraft', 'libraries', getLibraryPath(lib.name)),
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
                console.warn(`Librería no encontrada (formato viejo): ${lib.name}. Intentando descargar...`);

                try {
                  // Crear carpeta donde debería estar la librería
                  const libDir = path.dirname(libPath);
                  fs.mkdirSync(libDir, { recursive: true });

                  // Descargar la librería directamente
                  const downloadResult = await downloadLibrary(lib.url, libPath);
                  if (downloadResult && fs.existsSync(libPath)) {
                    libraryJars.push(libPath);
                    console.log(`Librería (formato viejo) descargada: ${lib.name}`);
                    found = true;
                  }
                } catch (downloadError) {
                  console.error(`Error al descargar la librería (formato viejo) ${lib.name}:`, downloadError);
                }

                if (!found) {
                  console.warn(`No se pudo descargar la librería (formato viejo): ${lib.name}`);
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
          console.warn(`No se encontraron librerías para la versión ${opts.mcVersion}, usando client.jar como fallback`);
        }
      } catch (error) {
        console.error('Error al leer archivo de versión para construir classpath:', error);
        // Usar valores por defecto
        classpath = path.join(opts.instancePath, 'client.jar');
        mainClass = 'net.minecraft.client.main.Main';
      }
    } else {
      console.warn(`No se encontró el archivo de versión ${versionJsonPath}, usando configuración mínima`);
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
          const libPath = path.join(launcherPath, 'libraries', getLibraryPath(libName));
          const possiblePaths = [
              libPath,
              path.join(opts.instancePath, 'libraries', getLibraryPath(libName)),
              path.join(process.env.APPDATA || '', '.minecraft', 'libraries', getLibraryPath(libName)),
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
              console.warn(`Librería común no encontrada: ${libName}`);
          }
      }
      if(libraryJars.length > 0) {
          classpath = [path.join(opts.instancePath, 'client.jar'), ...libraryJars].join(path.delimiter);
      }
    }

    // Definir argumentos del juego (necesarios para Minecraft)
    // Crear un UUID falso para perfiles no premium, o usar el real si está disponible
    const fakeUUID = opts.userProfile?.id || `0${Math.random().toString(16).substr(2, 31)}`;

    const gameArgs = [
      '--username', opts.userProfile?.username || 'Player',
      '--version', opts.mcVersion,
      '--gameDir', opts.instancePath,
      '--assetsDir', path.join(opts.instancePath, 'assets'),
      '--assetIndex', `${opts.mcVersion}`, // Esto podría necesitar ser más específico
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
  } else {
    // Para otros loaders (Forge, Fabric, etc.) - construir argumentos específicos
    return await buildArgsForModded(opts, loader);
  }
}

// Función auxiliar para obtener el nombre del sistema operativo
function getOSName(): string {
  switch (process.platform) {
    case 'win32': return 'windows';
    case 'darwin': return 'osx';
    case 'linux': return 'linux';
    default: return 'linux';
  }
}

// Función auxiliar para construir la ruta de una librería basada en su nombre
function getLibraryPath(libraryName: string): string {
  const [group, artifact, version] = libraryName.split(':');
  const parts = group.split('.');
  return path.join(...parts, artifact, version, `${artifact}-${version}.jar`);
}

// Función auxiliar para descargar una librería
async function downloadLibrary(url: string, outputPath: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const buffer = await response.buffer();
    fs.writeFileSync(outputPath, buffer);
    return true;
  } catch (error) {
    console.error(`Error downloading library from ${url} to ${outputPath}:`, error);
    return false;
  }
}

// Función auxiliar para obtener la ruta de datos del launcher
function getLauncherDataPath(): string {
  // Esta ruta debe coincidir con la ruta usada en el main process
  if (process.env.APPDATA) {
    return path.join(process.env.APPDATA!, '.DRK Launcher');
  } else if (process.platform === 'darwin') {
    return path.join(process.env.HOME!, 'Library', 'Application Support', '.DRK Launcher');
  } else {
    return path.join(process.env.HOME!, '.DRK Launcher');
  }
}

// Función auxiliar para construir argumentos específicos para versiones con mods (Forge, Fabric, etc.)
async function buildArgsForModded(opts: LaunchOptions, loader: string) {
  const mem = Math.max(512, opts.ramMb || 2048);
  const minMem = Math.min(512, mem / 4); // Usar 1/4 de la RAM máxima como mínima

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
        `-Dforge.logging.console.level=info`,
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
  const loaderJarPath = findLoaderJar(opts.instancePath, loader, opts.loaderVersion);

  if (loaderJarPath && fs.existsSync(loaderJarPath)) {
    libraryJars.push(loaderJarPath);
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
              libPath = path.join(launcherPath, 'libraries', getLibraryPath(lib.name));
            }

            // Probar múltiples ubicaciones posibles
            const possiblePaths = [
              libPath, // Ruta estándar en .DRK Launcher/libraries
              path.join(opts.instancePath, 'libraries', getLibraryPath(lib.name)), // En la instancia
              path.join(process.env.APPDATA || '', '.minecraft', 'libraries', getLibraryPath(lib.name)), // .minecraft estándar
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
              console.warn(`Librería no encontrada para loader: ${lib.name} en ninguna ubicación:`, possiblePaths);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error al leer archivo de versión para construir classpath para loader:', error);
    }
  }

  const classpath = libraryJars.join(path.delimiter);

  // Definir argumentos del juego (necesarios para Minecraft)
  // Crear un UUID falso para perfiles no premium, o usar el real si está disponible
  const fakeUUID = opts.userProfile?.id || `0${Math.random().toString(16).substr(2, 31)}`;

  const baseGameArgs = [
    '--username', opts.userProfile?.username || 'Player',
    '--version', opts.mcVersion,
    '--gameDir', opts.instancePath,
    '--assetsDir', path.join(opts.instancePath, 'assets'),
    '--assetIndex', `${opts.mcVersion}`, // Esto podría necesitar ser más específico
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
    ...jvmArgs,
    ...additionalJvmArgs,
    '-cp', classpath,  // Usar classpath en lugar de -jar
    mainClass,  // Usar la clase principal específica del loader
    ...baseGameArgs,
    ...additionalGameArgs,
    ...(opts.gameArgs || [])
  ];
}

// Función auxiliar para encontrar el JAR del loader
function findLoaderJar(instancePath: string, loader: string, version?: string): string | null {
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
  const instanceFiles = fs.readdirSync(instancePath);
  for (const file of instanceFiles) {
    if (file.endsWith('.jar')) {
      if (file.toLowerCase().includes(loader)) {
        return path.join(instancePath, file);
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

export async function launchJava(opts: LaunchOptions, onData: (chunk: string) => void, onExit: (code: number | null) => void) {
  const args = await buildArgs(opts)
  const child = spawn(opts.javaPath || 'java', args, {
    cwd: opts.instancePath,
    env: {
      ...process.env,
      // Añadir variables de entorno específicas si son necesarias
    }
  })

  child.stdout.on('data', d => onData(d.toString()))
  child.stderr.on('data', d => onData(d.toString()))
  child.on('close', c => onExit(c))

  return child
}

