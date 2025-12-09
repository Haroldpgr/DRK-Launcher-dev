import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import { initDB, hasDB, sqlite } from '../services/db'
import { queryStatus } from '../services/serverService'
import { launchJava as originalLaunchJava, isInstanceReady, areAssetsReadyForVersion, ensureClientJar } from '../services/gameService'
import { javaDetector } from './javaDetector'
// Import our Java service
import javaService from './javaService';
import fetch from 'node-fetch'; // Añadido para peticiones a la API
import { getLauncherDataPath, ensureDir as ensureDirUtil } from '../utils/paths';
import { ensureValidUUID } from '../utils/uuid';
import { instanceService, InstanceConfig } from '../services/instanceService';
import { instanceCreationService } from '../services/instanceCreationService';
import { modrinthDownloadService } from '../services/modrinthDownloadService';
import { downloadQueueService } from '../services/downloadQueueService';
import { enhancedInstanceCreationService } from '../services/enhancedInstanceCreationService';
import { versionService } from '../services/versionService';
import { javaDownloadService } from '../services/javaDownloadService';
import { loaderService } from '../services/loaderService';
import { logProgressService } from '../services/logProgressService';
import { gameLaunchService } from '../services/gameLaunchService';

let win: BrowserWindow | null = null;

app.whenReady().then(async () => {
  const { instancesBaseDefault } = basePaths();
  ensureDir(instancesBaseDefault);
  initDB();

  // Detect Java using the service at startup
  try {
    await javaService.detectJava();
    console.log(`Java service initialized. Found ${javaService.getAllJavas().length} Java installations.`);
  } catch (error) {
    console.error('Error initializing Java service:', error);
  }

  await createWindow();
});

function getUserDataPath() {
  // Use the centralized launcher data path utility
  return getLauncherDataPath();
}

function ensureDir(dir: string) {
  return ensureDirUtil(dir);
}

async function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'DRK Launcher',
    backgroundColor: '#0f0f10',
    autoHideMenuBar: true, // Ocultar automáticamente la barra de menú
    frame: true, // Mantener el marco para mantener la funcionalidad de ventana
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  const url = process.env.VITE_DEV_SERVER_URL;
  if (url) {
    await win.loadURL(url);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    await win.loadFile(path.join(process.cwd(), 'dist', 'index.html'));
  }
}

function basePaths() {
  const data = getUserDataPath()
  const settingsPath = path.join(data, 'settings.json')
  // Directorio principal del launcher en la carpeta de roaming
  const drkLauncherDir = data  // Ya está incluido en getUserDataPath()
  ensureDir(drkLauncherDir)

  // Directorio de instancias dentro de .DRK Launcher
  // Esta es la estructura correcta para mantener instancias aisladas
  const instancesDir = path.join(drkLauncherDir, 'instances')
  ensureDir(instancesDir)

  return {
    data,
    settingsPath,
    instancesBaseDefault: instancesDir, // Instancias en la subcarpeta instances/
    // Todo se almacena en la carpeta principal del launcher o subcarpetas apropiadas
    downloadsBase: drkLauncherDir,
    versionsBase: drkLauncherDir,
    librariesBase: drkLauncherDir,
    configsBase: drkLauncherDir
  }
}

function readJSON<T>(file: string, fallback: T) {
  try {
    if (!fs.existsSync(file)) return fallback
    const raw = fs.readFileSync(file, 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJSON(file: string, value: unknown) {
  ensureDir(path.dirname(file))
  fs.writeFileSync(file, JSON.stringify(value, null, 2))
}

type Settings = {
  javaPath?: string
  defaultRamMb?: number
  theme?: 'dark' | 'light' | 'oled'
  language?: 'es' | 'en'
  instancesBase?: string
  personalizedAds?: boolean
  telemetry?: boolean
  discordRPC?: boolean
  defaultLandingPage?: 'home' | 'recent-worlds' | 'instances' | 'servers'
  jumpBackToWorlds?: boolean
  advancedRendering?: {
    renderDistance?: number
    graphics?: 'fast' | 'fancy'
    particles?: 'minimal' | 'decreased' | 'all'
    smoothLighting?: number
  }
}

type Instance = {
  id: string
  name: string
  version: string
  loader?: 'vanilla' | 'forge' | 'fabric' | 'quilt' | 'neoforge'
  createdAt: number
  path: string
  ramMb?: number
  userProfile?: string
  ready?: boolean // Nuevo campo para indicar si la instancia está lista para jugar
}

type ServerInfo = {
  id: string
  name: string
  ip: string
  country?: string
  category?: string
  thumbnail?: string
  requiredVersion?: string
  modsHint?: string
  favorite?: boolean
}

type CrashRecord = {
  id: string
  instanceId: string
  createdAt: number
  summary: string
  logPath: string
  recommendation?: string
}

function settings(): Settings {
  const { settingsPath, instancesBaseDefault } = basePaths()
  const s = readJSON<Settings>(settingsPath, {
    theme: 'dark',
    language: 'es',
    defaultRamMb: 4096,
    instancesBase: instancesBaseDefault,
    personalizedAds: true,
    telemetry: true,
    discordRPC: true,
    defaultLandingPage: 'home',
    jumpBackToWorlds: true,
    advancedRendering: {
      renderDistance: 8,
      graphics: 'fancy',
      particles: 'all',
      smoothLighting: 2
    }
  })
  if (!s.instancesBase) s.instancesBase = instancesBaseDefault
  return s
}

function saveSettings(s: Settings) {
  const { settingsPath } = basePaths()
  writeJSON(settingsPath, s)
}

function instancesFile() {
  const { data } = basePaths()
  return path.join(data, 'instances.json')
}

// Crear una función para verificar si una instancia está completamente lista
function isInstanceFullyReady(instance: Instance): boolean {
  // Usar el servicio de instancias para verificar si está lista
  return instanceService.isInstanceReady(instance.path);
}

// Mantener la función original para compatibilidad con otros procesos internos
function listInstances(): Instance[] {
  return readJSON<Instance[]>(instancesFile(), []);
}

function saveInstances(list: Instance[]) {
  writeJSON(instancesFile(), list)
}

function createInstance(payload: { name: string; version: string; loader?: Instance['loader'] }): InstanceConfig {
  // Usar el servicio de instancias para crear una instancia con la estructura completa
  const instance = instanceService.createInstance({
    name: payload.name,
    version: payload.version,
    loader: payload.loader || 'vanilla',
    id: undefined
  });

  // Añadir la instancia a la lista persistente
  const list = listInstances();
  const i: Instance = {
    id: instance.id,
    name: instance.name,
    version: instance.version,
    loader: instance.loader || 'vanilla',
    createdAt: instance.createdAt,
    path: instance.path
  };
  list.push(i);
  saveInstances(list);

  return i;
}

function updateInstance(id: string, patch: Partial<Instance>): Instance | null {
  const list = listInstances()
  const idx = list.findIndex(x => x.id === id)
  if (idx === -1) return null
  const updated = { ...list[idx], ...patch }
  list[idx] = updated
  saveInstances(list)
  return updated
}

function deleteInstance(id: string) {
  const list = listInstances()
  const item = list.find(x => x.id === id)
  saveInstances(list.filter(x => x.id !== id))
  if (item && fs.existsSync(item.path)) fs.rmSync(item.path, { recursive: true, force: true })
}

async function mojangVersions() {
  const res = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json')
  const json = await res.json()
  return json.versions as { id: string; type: string; url: string; releaseTime: string }[]
}

function analyzeLog(content: string) {
  const lower = content.toLowerCase()
  if (lower.includes('noclassdeffounderror')) return { summary: 'Falta una librería o versión incorrecta', recommendation: 'Actualizar loader o instalar dependencia faltante' }
  if (lower.includes('classnotfoundexception')) return { summary: 'Clase no encontrada', recommendation: 'Verificar versiones de mods' }
  if (lower.includes('mixin')) return { summary: 'Error de Mixin', recommendation: 'Actualizar mods y loader, revisar compatibilidad' }
  return { summary: 'Error no identificado', recommendation: 'Revisar mods recientes y memoria asignada' }
}

function crashesFile() {
  const { data } = basePaths()
  return path.join(data, 'crashes.json')
}

function listCrashes(): CrashRecord[] {
  return readJSON<CrashRecord[]>(crashesFile(), [])
}

function saveCrashes(list: CrashRecord[]) {
  writeJSON(crashesFile(), list)
}


ipcMain.handle('settings:get', async () => settings())
ipcMain.handle('settings:set', async (_e, s: Settings) => { saveSettings(s); return s })

ipcMain.handle('instances:list', async () => {
  if (hasDB()) {
    try { return sqlite().prepare('SELECT * FROM instances').all() } catch { return [] }
  }
  return listInstances()
})
ipcMain.handle('instances:create', async (_e, p: { name: string; version: string; loader?: Instance['loader'] }) => {
  const inst = createInstance(p)
  if (hasDB()) {
    try {
      sqlite().prepare('INSERT OR REPLACE INTO instances (id,name,version,loader,createdAt,path) VALUES (@id,@name,@version,@loader,@createdAt,@path)').run(inst)
    } catch {}
  }
  return inst
})
ipcMain.handle('instances:update', async (_e, p: { id: string; patch: Partial<Instance> }) => {
  const updated = updateInstance(p.id, p.patch)
  if (updated && hasDB()) {
    try { sqlite().prepare('INSERT OR REPLACE INTO instances (id,name,version,loader,createdAt,path,ramMb,userProfile) VALUES (@id,@name,@version,@loader,@createdAt,@path,@ramMb,@userProfile)').run(updated) } catch {}
  }
  return updated
})
ipcMain.handle('instances:delete', async (_e, id: string) => {
  if (hasDB()) { try { sqlite().prepare('DELETE FROM instances WHERE id = ?').run(id) } catch {} }
  deleteInstance(id); return true
})
ipcMain.handle('instances:openFolder', async (_e, id: string) => { const i = listInstances().find(x => x.id === id); if (i) shell.openPath(i.path); return true })

ipcMain.handle('versions:list', async () => mojangVersions())

ipcMain.handle('crash:analyze', async (_e, p: { instanceId: string; logPath?: string }) => {
  const i = listInstances().find(x => x.id === p.instanceId)
  if (!i) return null
  const target = p.logPath || path.join(i.path, 'logs', 'latest.log')
  if (!fs.existsSync(target)) return null
  const txt = fs.readFileSync(target, 'utf-8')
  const res = analyzeLog(txt)
  const rec: CrashRecord = { id: Math.random().toString(36).slice(2), instanceId: i.id, createdAt: Date.now(), summary: res.summary, logPath: target, recommendation: res.recommendation }
  const list = listCrashes(); list.push(rec); saveCrashes(list)
  return rec
})

ipcMain.handle('crash:list', async () => listCrashes())

// Nuevo handler para leer archivos de log
ipcMain.handle('logs:readLog', async (_e, logPath: string) => {
  try {
    // Validar que la ruta del archivo esté dentro de directorios permitidos
    const { data } = basePaths();
    const instancesPath = path.join(data, 'instances');

    // Asegurarse de que el path esté dentro del directorio de instancias
    const resolvedPath = path.resolve(logPath);
    const resolvedInstancesPath = path.resolve(instancesPath);

    if (!resolvedPath.startsWith(resolvedInstancesPath)) {
      throw new Error('Ruta de archivo no permitida');
    }

    if (!fs.existsSync(resolvedPath)) {
      throw new Error('El archivo de log no existe');
    }

    const content = fs.readFileSync(resolvedPath, 'utf-8');
    return content;
  } catch (error) {
    console.error('Error al leer archivo de log:', error);
    throw error;
  }
})

ipcMain.handle('servers:list', async () => {
  const { data } = basePaths()
  const file = path.join(data, 'servers.json')
  return readJSON<ServerInfo[]>(file, [])
})

ipcMain.handle('servers:save', async (_e, list: ServerInfo[]) => {
  const { data } = basePaths()
  const file = path.join(data, 'servers.json')
  writeJSON(file, list)
  return true
})

ipcMain.handle('servers:ping', async (_e, ip: string) => queryStatus(ip))

// ... otros handlers ...

// Definir tipo para el perfil de usuario que puede ser enviado desde el renderer
type UserProfile = {
  id: string;
  username: string;
  type: 'microsoft' | 'non-premium';
  lastUsed: number;
  gameTime?: number;
  instances?: string[];
  skinUrl?: string;
};

ipcMain.handle('game:launch', async (_e, p: { instanceId: string, userProfile?: UserProfile }) => {
  const i = listInstances().find(x => x.id === p.instanceId)
  const s = settings()
  if (!i) return null

  // Registrar inicio del proceso de lanzamiento
  logProgressService.launch(`Iniciando lanzamiento de la instancia ${i.name}`, {
    instanceId: i.id,
    version: i.version,
    loader: i.loader
  });

  try {
    // Asegurar que el client.jar esté disponible antes de verificar si la instancia está lista
    const clientJarReady = await ensureClientJar(i.path, i.version);
    if (!clientJarReady) {
      const errorMsg = `No se pudo asegurar el archivo client.jar para la instancia ${i.name}.`;
      logProgressService.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Verificar si la instancia está completamente descargada (ahora client.jar debería estar presente)
    if (!isInstanceReady(i.path)) {
      const errorMsg = `La instancia ${i.name} no está lista para jugar. Archivos esenciales faltantes.`;
      logProgressService.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Verificar si los assets necesarios para la versión están disponibles
    // IMPORTANTE: Esta verificación se hace con tolerancia ya que Minecraft puede descargar assets faltantes en tiempo de ejecución
    const assetsReady = areAssetsReadyForVersion(i.path, i.version);
    if (!assetsReady) {
      logProgressService.warning(`Advertencia: Los assets para la versión ${i.version} pueden no estar completamente descargados, pero se intentará iniciar el juego.`);
      // No lanzar error, permitir que el juego se inicie y descargue assets según sea necesario
    }

    // Usar la configuración de la instancia si está disponible
    const instanceConfig = instanceService.getInstanceConfig(i.path);
    const ramMb = instanceConfig?.maxMemory || i.ramMb || s.defaultRamMb;
    const javaPath = instanceConfig?.javaPath || s.javaPath || 'java';
    const windowWidth = instanceConfig?.windowWidth || 1280;
    const windowHeight = instanceConfig?.windowHeight || 720;
    const jvmArgs = instanceConfig?.jvmArgs || [];

    // Obtener el JRE recomendado para esta versión de Minecraft
    let finalJavaPath = javaPath;

    // Función auxiliar para extraer la versión de Java de una ruta
    const getJavaVersionFromPath = (path: string): number | null => {
      // Buscar patrones como java8, java17, java21 en la ruta
      const match = path.match(/java(\d+)/i);
      if (match && match[1]) {
        return parseInt(match[1], 10);
      }
      return null;
    };

    // Si no hay javaPath o es 'java', usar la versión recomendada
    if (!javaPath || javaPath === 'java') {
      finalJavaPath = await javaDownloadService.getJavaForMinecraftVersion(i.version);
    } else {
      // Si ya hay un javaPath, verificar si es compatible con la versión de Minecraft
      const recommendedJavaPath = await javaDownloadService.getJavaForMinecraftVersion(i.version);

      const currentVersion = getJavaVersionFromPath(javaPath);
      const recommendedVersion = getJavaVersionFromPath(recommendedJavaPath);

      if (currentVersion !== null && recommendedVersion !== null) {
        // Si la versión recomendada es mayor que la actual, usar la recomendada
        if (recommendedVersion > currentVersion) {
          logProgressService.info(`Versión de Java actual (${currentVersion}) es menor que la recomendada (${recommendedVersion}) para Minecraft ${i.version}, actualizando...`, {
            currentVersion,
            recommendedVersion
          });
          finalJavaPath = recommendedJavaPath;
        } else {
          logProgressService.info(`Versión de Java actual (${currentVersion}) es adecuada para Minecraft ${i.version}`, {
            currentVersion,
            recommendedVersion
          });
        }
      } else {
        // Si no podemos determinar la versión, usar la recomendada
        finalJavaPath = recommendedJavaPath;
        logProgressService.warning(`No se pudo determinar la versión de Java, usando recomendada`, {
          javaPath,
          recommendedJavaPath
        });
      }
    }

    logProgressService.info(`Usando Java en: ${finalJavaPath}`, { javaPath: finalJavaPath });

    // Asegurar que el UUID en el perfil de usuario sea válido antes de pasarlo al juego
    let validatedUserProfile = p.userProfile;
    if (p.userProfile && p.userProfile.id) {
      validatedUserProfile = {
        ...p.userProfile,
        id: ensureValidUUID(p.userProfile.id)
      };
    }

    // Launch the game with all configurations using the enhanced service
    const childProcess = await gameLaunchService.launchGame({
      javaPath: finalJavaPath,
      mcVersion: i.version,
      instancePath: i.path,
      ramMb: ramMb,
      jvmArgs: jvmArgs,
      userProfile: validatedUserProfile,
      windowSize: {
        width: windowWidth,
        height: windowHeight
      },
      loader: i.loader || 'vanilla', // Pasar el tipo de loader de la instancia
      loaderVersion: instanceConfig?.loaderVersion, // Versión específica del loader si está disponible
      instanceConfig: instanceConfig as any // Ajuste de tipo temporal
    });

    logProgressService.success(`Minecraft lanzado exitosamente para la instancia ${i.name}`, {
      instanceId: i.id,
      pid: childProcess.pid
    });

    return { started: true, pid: childProcess.pid }
  } catch (error) {
    logProgressService.error(`Error al lanzar la instancia ${i.name}: ${(error as Error).message}`, {
      instanceId: i.id,
      error: (error as Error).message
    });
    throw error;
  }
})

// --- IPC Handlers for Instance Creation --- //
ipcMain.handle('instance:create-full', async (_e, payload: { name: string; version: string; loader?: Instance['loader']; javaVersion?: string; maxMemory?: number; minMemory?: number; jvmArgs?: string[] }) => {
  try {
    logProgressService.info(`Iniciando creación de instancia: ${payload.name}`, {
      name: payload.name,
      version: payload.version,
      loader: payload.loader
    });

    // Usar el servicio mejorado de creación de instancias
    const instance = await enhancedInstanceCreationService.createInstance({
      name: payload.name,
      version: payload.version,
      loader: payload.loader || 'vanilla',
      javaVersion: payload.javaVersion,
      maxMemory: payload.maxMemory,
      minMemory: payload.minMemory,
      jvmArgs: payload.jvmArgs
    });

    logProgressService.success(`Instancia creada exitosamente: ${payload.name}`, {
      id: instance.id,
      name: payload.name,
      version: payload.version
    });

    return instance;
  } catch (error) {
    logProgressService.error(`Error creando instancia ${payload.name}: ${(error as Error).message}`, {
      name: payload.name,
      error: (error as Error).message
    });
    throw error;
  }
});

// --- IPC Handler para escanear y registrar instancias faltantes --- //
ipcMain.handle('instances:scan-and-register', async () => {
  try {
    const { instancesBaseDefault } = basePaths();

    // Verificar si existe el directorio de instancias
    if (!fs.existsSync(instancesBaseDefault)) {
      console.log('No existe el directorio de instancias:', instancesBaseDefault);
      return { count: 0, registered: [] };
    }

    // Obtener todas las carpetas en el directorio de instancias
    const allItems = fs.readdirSync(instancesBaseDefault);
    const instanceFolders = allItems.filter(item => {
      const itemPath = path.join(instancesBaseDefault, item);
      return fs.statSync(itemPath).isDirectory();
    });

    // Obtener la lista actual de instancias registradas
    const registeredInstances = listInstances();
    const registeredPaths = new Set(registeredInstances.map(instance => instance.path));

    // Encontrar carpetas que no están registradas
    const unregisteredFolders = instanceFolders.filter(folder => {
      const folderPath = path.join(instancesBaseDefault, folder);
      return !Array.from(registeredPaths).some(registeredPath => registeredPath === folderPath);
    });

    const newlyRegistered = [];
    let registeredCount = 0;

    // Intentar registrar cada carpeta no registrada
    for (const folder of unregisteredFolders) {
      const instancePath = path.join(instancesBaseDefault, folder);

      try {
        // Verificar si hay un archivo de configuración de instancia o información de versión
        // para reconstruir la información de la instancia
        const instanceJsonPath = path.join(instancePath, 'instance.json');
        let instanceConfig: InstanceConfig | null = null;

        if (fs.existsSync(instanceJsonPath)) {
          // Si existe el archivo de configuración, usarlo
          instanceConfig = JSON.parse(fs.readFileSync(instanceJsonPath, 'utf-8'));

          // Asegurarse de que tenga un ID único
          if (!instanceConfig.id) {
            instanceConfig.id = `${folder}_${Date.now()}`;
          }
        } else {
          // Si no existe, intentar reconstruir la información desde el directorio
          // Buscar información en archivos comunes de Minecraft
          const filesInDir = fs.readdirSync(instancePath);

          // Intentar encontrar alguna información básica
          let version = 'unknown';
          let loader: Instance['loader'] = 'vanilla';

          // Si hay cliente.jar, intentar encontrar información de versión
          // Buscar archivos que puedan dar indicios de la versión
          const jarFiles = filesInDir.filter(f => f.endsWith('.jar') && (f.includes('client') || f.includes('minecraft')));
          if (jarFiles.length > 0) {
            // Intentar extraer la versión del nombre del archivo
            const jarName = jarFiles[0];
            // Buscar patrones como 1.20.1 o versiones reconocibles
            const versionMatch = jarName.match(/(\d+\.\d+(?:\.\d+)?)/)?.[0];
            if (versionMatch) {
              version = versionMatch;
            }
          }

          // Revisar si hay archivos que indiquen el uso de un loader específico
          if (filesInDir.some(f => f.toLowerCase().includes('forge'))) {
            loader = 'forge';
          } else if (filesInDir.some(f => f.toLowerCase().includes('fabric'))) {
            loader = 'fabric';
          } else if (filesInDir.some(f => f.toLowerCase().includes('quilt'))) {
            loader = 'quilt';
          }

          // Crear una configuración mínima
          instanceConfig = {
            id: `${folder}_${Date.now()}`, // ID único
            name: folder,
            version: version,
            loader: loader,
            createdAt: Date.now(),
            path: instancePath
          };
        }

        // Asegurarse de que el ID sea único
        if (!instanceConfig.id) {
          instanceConfig.id = `${folder}_${Date.now()}`;
        }

        // Registrar la instancia en la lista
        const existingInList = registeredInstances.find(i => i.id === instanceConfig!.id);
        if (!existingInList) {
          const instanceForList: Instance = {
            id: instanceConfig.id,
            name: instanceConfig.name || folder,
            version: instanceConfig.version,
            loader: instanceConfig.loader || 'vanilla',
            createdAt: instanceConfig.createdAt || Date.now(),
            path: instanceConfig.path
          };

          // Guardar en la lista de instancias
          const list = listInstances();
          list.push(instanceForList);
          saveInstances(list);

          newlyRegistered.push(instanceForList);
          registeredCount++;

          console.log(`Instancia registrada automáticamente: ${folder} -> ${instanceConfig.id}`);
        }
      } catch (folderError) {
        console.error(`Error al procesar carpeta de instancia ${folder}:`, folderError);
      }
    }

    return { count: registeredCount, registered: newlyRegistered };
  } catch (error) {
    console.error('Error al escanear instancias:', error);
    throw error;
  }
});

ipcMain.handle('instance:install-content', async (_e, payload: {
  instancePath: string;
  contentId: string;
  contentType: 'mod' | 'resourcepack' | 'shader' | 'datapack' | 'modpack';
  mcVersion: string;
  loader?: string;
  versionId?: string;  // Nuevo parámetro para versión específica
}) => {
  try {
    if (payload.contentType === 'modpack') {
      // Para modpacks, usar el método existente
      await instanceCreationService.installContentToInstance(
        payload.instancePath,
        payload.contentId,
        payload.contentType,
        payload.mcVersion,
        payload.loader
      );
    } else {
      // Para otros contenidos, usar el nuevo método con selección de versión
      await modrinthDownloadService.downloadContent(
        payload.contentId,
        payload.instancePath,
        payload.mcVersion,
        payload.loader,
        payload.contentType,
        payload.versionId  // Pasar el ID de versión específico si se proporcionó
      );
    }
    return { success: true };
  } catch (error) {
    console.error('Error installing content to instance:', error);
    throw error;
  }
});

ipcMain.handle('instance:is-complete', async (_e, instancePath: string) => {
  return instanceCreationService.isInstanceComplete(instancePath);
});

// --- IPC Handlers for Download Management --- //
ipcMain.handle('downloads:get-all', async () => {
  return downloadQueueService.getAllDownloads();
});

ipcMain.handle('downloads:get-status', async (_e, downloadId: string) => {
  return downloadQueueService.getDownloadStatus(downloadId);
});

ipcMain.handle('downloads:cancel', async (_e, downloadId: string) => {
  return downloadQueueService.cancelDownload(downloadId);
});

ipcMain.handle('downloads:restart', async (_e, downloadId: string) => {
  const result = await downloadQueueService.restartDownload(downloadId);
  return result !== null;
});

// --- IPC Handlers for Mod Versions --- //
ipcMain.handle('modrinth:get-versions', async (_e, projectId: string) => {
  return await modrinthDownloadService.getAvailableVersions(projectId);
});

ipcMain.handle('modrinth:get-compatible-versions', async (_e, payload: {
  projectId: string,
  mcVersion: string,
  loader?: string
}) => {
  return await modrinthDownloadService.getCompatibleVersions(
    payload.projectId,
    payload.mcVersion,
    payload.loader
  );
});

// --- IPC Handlers for Dialog --- //
ipcMain.handle('dialog:showOpenDialog', async (_e, options: any) => {
  try {
    const { dialog } = require('electron');
    const result = await dialog.showOpenDialog(options);
    return result;
  } catch (error) {
    console.error('Error en showOpenDialog:', error);
    return { canceled: true, filePaths: [] };
  }
});


// --- IPC Handlers for Java --- //
ipcMain.handle('java:detect', async () => {
  try {
    return await javaService.detectJava();
  } catch (error) {
    console.error('Error detecting Java:', error);
    return [];
  }
});

ipcMain.handle('java:get-all', async () => {
  return javaService.getAllJavas();
});

ipcMain.handle('java:get-default', async () => {
  return javaService.getDefaultJava();
});

ipcMain.handle('java:set-default', async (_event, javaId: string) => {
  return javaService.setDefaultJava(javaId);
});

ipcMain.handle('java:remove', async (_event, javaId: string) => {
  return javaService.removeInstalledJava(javaId);
});

ipcMain.handle('java:test', async (_event, javaPath: string) => {
  try {
    const isWorking = await javaService.testJava(javaPath);
    return { isWorking };
  } catch (error) {
    return { isWorking: false, error: (error as Error).message };
  }
});

ipcMain.handle('java:get-compatibility', async (_event, minecraftVersion: string) => {
  return javaService.getMinecraftJavaCompatibility(minecraftVersion);
});

ipcMain.handle('java:getJavaForMinecraftVersion', async (_event, minecraftVersion: string) => {
  try {
    return await javaService.getJavaForMinecraftVersion(minecraftVersion);
  } catch (error) {
    console.error('Error getting Java for Minecraft version:', error);
    throw error;
  }
});

ipcMain.handle('java:explore', async () => {
  const { dialog } = require('electron');
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Java Executable', extensions: [process.platform === 'win32' ? 'exe' : ''] },
      { name: 'All Files', extensions: ['*'] }
    ],
    title: 'Seleccionar archivo ejecutable de Java'
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});


// ===== MANEJO DE DESCARGAS =====
import { pipeline } from 'node:stream';
import { promisify } from 'node:util';

const pipelineAsync = promisify(pipeline);

// Función para limpiar nombres de archivos y rutas
function sanitizeFileName(fileName: string): string {
  // Reemplazar caracteres problemáticos
  return fileName
    .replace(/[:<>|*?"]/g, '_')  // Reemplazar caracteres prohibidos en Windows
    .replace(/@/g, '_at_')       // Reemplazar @
    .replace(/:/g, '_');         // Reemplazar dos puntos específicamente
}

ipcMain.on('download:start', async (event, { url, filename, itemId }) => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return;

  // Limpiar el nombre de archivo para evitar caracteres problemáticos
  const cleanFilename = sanitizeFileName(filename);

  // Guardar en el directorio principal del launcher (.DRK Launcher)
  const { downloadsBase } = basePaths();
  const downloadPath = downloadsBase; // Usar la carpeta principal del launcher
  ensureDir(downloadPath);

  // Crear la ruta completa del archivo y asegurarse de que los directorios existan
  const filePath = path.join(downloadPath, cleanFilename);
  const fileDir = path.dirname(filePath);
  ensureDir(fileDir); // Asegurar que el directorio del archivo exista

  try {
    // Realizar la descarga usando fetch y streams para evitar ventanas emergentes
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const totalBytes = parseInt(response.headers.get('content-length') || '0', 10);
    let downloadedBytes = 0;

    // Crear un stream de escritura para el archivo
    const fileStream = fs.createWriteStream(filePath);

    // Controlar el progreso de la descarga
    const progressStream = new (require('stream').Transform)({
      transform(chunk, encoding, callback) {
        downloadedBytes += chunk.length;
        const progress = totalBytes > 0 ? downloadedBytes / totalBytes : 0;

        // Enviar progreso al frontend
        win.webContents.send('download:progress', {
          itemId,
          progress
        });

        callback(null, chunk);
      }
    });

    // Conectar los streams
    response.body
      .pipe(progressStream)
      .pipe(fileStream);

    // Esperar a que la descarga termine
    await new Promise((resolve, reject) => {
      fileStream.on('finish', () => resolve(undefined));
      fileStream.on('error', reject);
      progressStream.on('error', reject);
    });

    // Enviar evento de descarga completada
    win.webContents.send('download:complete', {
      itemId,
      filePath
    });
  } catch (error) {
    console.error(`Error downloading ${url}:`, error);
    win.webContents.send('download:error', {
      itemId,
      message: `Error en la descarga: ${(error as Error).message}`
    });
  }
});

// --- Modrinth API Integration --- //
const MODRINTH_API_URL = 'https://api.modrinth.com/v2';

// Mapeo de nuestros tipos a los tipos de proyecto de Modrinth
const modrinthProjectTypes = {
  modpacks: 'modpack',
  mods: 'mod',
  resourcepacks: 'resourcepack',
  datapacks: 'datapack',
  shaders: 'shader'
};

// Mapeo de tipos de carga (loaders) para Modrinth
const modrinthLoaders = {
  modpacks: ['forge', 'fabric', 'quilt', 'neoforge'],
  mods: ['forge', 'fabric', 'quilt', 'neoforge'],
  resourcepacks: [],
  datapacks: [],
  shaders: ['iris', 'optifine']
};

async function fetchModrinthContent(contentType: keyof typeof modrinthProjectTypes, search: string) {
  let facets: string[][];

  // Estructura correcta de facetas para la API de Modrinth
  if (contentType === 'modpacks') {
    facets = [["project_type:modpack"]];
  } else if (contentType === 'mods') {
    facets = [["project_type:mod"]];
  } else if (contentType === 'resourcepacks') {
    facets = [["project_type:resourcepack"]];
  } else if (contentType === 'datapacks') {
    facets = [["project_type:datapack"]];
  } else if (contentType === 'shaders') {
    facets = [["project_type:shader"]];
  } else {
    console.error('Tipo de contenido no válido para Modrinth:', contentType);
    return [];
  }

  try {
    // Si no hay término de búsqueda, obtener contenido popular por tipo
    const searchParams = new URLSearchParams({
      query: search || '', // Puede ser vacío para obtener resultados generales
      facets: JSON.stringify(facets),
      limit: '100', // Aumentar a 100 resultados por página
      index: search ? 'relevance' : 'downloads' // Ordenar por descargas si no hay búsqueda específica
    });

    const url = `${MODRINTH_API_URL}/search?${searchParams}`;
    console.log('Buscando en Modrinth:', url);

    // Aumentar el timeout de la solicitud
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos de timeout

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'DRKLauncher/1.0 (haroldpgr@gmail.com)',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Error al buscar en Modrinth: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`Error de la API de Modrinth: ${response.statusText}`);
    }

    const json = await response.json();
    console.log('Respuesta de Modrinth:', json); // Debug log

    // Verificar si hay resultados válidos
    if (!json || !json.hits || !Array.isArray(json.hits)) {
      console.warn('La respuesta de Modrinth no contiene resultados válidos:', json);
      return [];
    }

    // Mapear la respuesta de Modrinth a nuestro formato
    return json.hits.map((item: any) => ({
      id: item.project_id || item.id,
      title: item.title,
      description: item.description,
      author: item.author || 'Desconocido',
      downloads: item.downloads || 0,
      lastUpdated: item.date_modified || item.updated,
      minecraftVersions: item.versions || [],
      categories: item.categories || [],
      imageUrl: item.icon_url || 'https://via.placeholder.com/400x200',
      type: contentType,
      version: item.versions && item.versions.length > 0 ? item.versions[0] : 'N/A',
      downloadUrl: item.project_id && item.versions && item.versions.length > 0
        ? `${MODRINTH_API_URL}/project/${item.project_id}/version/${item.versions[0]}`
        : null
    }));
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('La solicitud a Modrinth ha expirado:', error);
      throw new Error('La solicitud a Modrinth ha tardado demasiado en responder');
    }
    console.error('Fallo al obtener datos de Modrinth:', error);
    return []; // Devolver un array vacío en caso de error
  }
}

// Manejador IPC para búsquedas de Modrinth
ipcMain.handle('modrinth:search', async (_event, { contentType, search }) => {
  return fetchModrinthContent(contentType, search);
});

// IPC Handlers para cancelación de descargas
ipcMain.handle('download:cancel', async (_event, downloadId: string) => {
  const { downloadQueueService } = await import('../services/downloadQueueService.js');
  return downloadQueueService.cancelDownloadById(downloadId);
});

ipcMain.handle('download:cancelAll', async (_event) => {
  const { downloadQueueService } = await import('../services/downloadQueueService.js');
  return downloadQueueService.cancelAllDownloads();
});

// IPC Handlers para el sistema de logs y progreso
ipcMain.handle('logs:get-recent', async (_event, count: number = 50) => {
  return logProgressService.getRecentLogs(count);
});

ipcMain.handle('logs:get-by-type', async (_event, { type, count }: { type: string; count: number }) => {
  return logProgressService.getLogsByType(type as any, count);
});

ipcMain.handle('logs:get-stats', async () => {
  return logProgressService.getStats();
});

ipcMain.handle('progress:get-all-statuses', async () => {
  return logProgressService.getAllProgressStatuses();
});

ipcMain.handle('progress:get-overall', async () => {
  return logProgressService.getOverallProgress();
});

ipcMain.handle('progress:get-download-statuses', async () => {
  return logProgressService.getCurrentDownloadStatuses();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
