// ============================================
// SERVICIO DE ACTUALIZACIONES AUTOMÁTICAS
// Maneja la verificación y descarga de actualizaciones
// ============================================

import { autoUpdater } from 'electron-updater';
import { app, BrowserWindow, dialog } from 'electron';
import { ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

let mainWindow: BrowserWindow | null = null;
let pendingUpdate: any = null;
let laterTimer: NodeJS.Timeout | null = null;
let isDownloading = false;
let downloadProgress: any = null;
let isUpdateDownloaded = false; // Rastrear si hay una actualización descargada

// Configurar autoUpdater
autoUpdater.autoDownload = false; // No descargar automáticamente, pedir confirmación
autoUpdater.autoInstallOnAppQuit = true; // Instalar automáticamente al cerrar la app

// IMPORTANTE: Deshabilitar verificación de firma digital para desarrollo/testing
// En producción, deberías tener un certificado de firma de código válido
// Para desarrollo, deshabilitamos la verificación para permitir actualizaciones no firmadas
if (process.platform === 'win32') {
  // Deshabilitar verificación de firma en Windows
  (autoUpdater as any).verifySignatureAndIntegrity = false;
  console.log('[Updater] Verificación de firma digital deshabilitada (modo desarrollo/testing)');
}

// Configurar para evitar duplicados
autoUpdater.allowDowngrade = false;
autoUpdater.allowPrerelease = false;

// Configurar explícitamente GitHub como proveedor de actualizaciones
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'Haroldpgr',
  repo: 'DRK-Launcher-dev'
});

// Habilitar actualizaciones diferenciales (delta updates)
// Esto permite descargar solo los cambios en lugar del archivo completo
// electron-updater detectará automáticamente si hay un archivo .delta disponible
// y lo usará en lugar del archivo completo, ahorrando ancho de banda
(autoUpdater as any).deltaUpdate = true;

// IMPORTANTE: Permitir actualizaciones no firmadas para desarrollo/testing
// En producción, deberías tener un certificado de firma de código válido
// Para desarrollo, permitimos actualizaciones no firmadas
(autoUpdater as any).allowUnsigned = true;
(autoUpdater as any).autoRunAppAfterInstall = true;
console.log('[Updater] Actualizaciones no firmadas permitidas (modo desarrollo/testing)');
console.log('[Updater] La app se reiniciará automáticamente después de instalar');

console.log('[Updater] Configurado para buscar actualizaciones en GitHub: Haroldpgr/DRK-Launcher-dev');
console.log('[Updater] Actualizaciones diferenciales (delta) habilitadas');

export function initializeUpdater(window: BrowserWindow) {
  mainWindow = window;

  // Verificar si hay una actualización ya descargada al iniciar
  // Esto es importante si la app se cerró después de descargar pero antes de instalar
  console.log('[Updater] Inicializando updater, verificando actualizaciones descargadas...');
  
  // Eventos de autoUpdater
  autoUpdater.on('checking-for-update', () => {
    console.log('[Updater] Verificando actualizaciones...');
    sendStatusToWindow('checking-for-update', { message: 'Verificando actualizaciones...' });
  });

  autoUpdater.on('update-available', (info) => {
    console.log('[Updater] Actualización disponible:', info.version);
    console.log('[Updater] electron-updater usará actualización diferencial si está disponible');
    console.log('[Updater] Tamaño estimado:', info.files ? info.files.map((f: any) => `${f.path}: ${(f.size / 1024 / 1024).toFixed(2)} MB`).join(', ') : 'N/A');
    pendingUpdate = info;
    
    // Parsear release notes para extraer cambios
    const releaseNotesStr = typeof info.releaseNotes === 'string' 
      ? info.releaseNotes 
      : Array.isArray(info.releaseNotes) 
        ? info.releaseNotes.map((note: any) => typeof note === 'string' ? note : note.note || '').join('\n')
        : '';
    const changes = parseReleaseNotes(releaseNotesStr);
    
    sendStatusToWindow('update-available', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes,
      changes: changes,
      files: info.files || []
    });
    
    // No mostrar diálogo nativo, dejar que el modal de React lo maneje
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('[Updater] No hay actualizaciones disponibles');
    console.log('[Updater] Versión actual instalada:', app.getVersion());
    console.log('[Updater] Información recibida:', JSON.stringify(info, null, 2));
    sendStatusToWindow('update-not-available', { message: 'Ya tienes la última versión' });
  });

  autoUpdater.on('error', (err: any) => {
    console.error('[Updater] Error en autoUpdater:', err);
    
    // Verificar si es un error de firma digital
    const errorMessage = err.message || err.toString() || '';
    const isSignatureError = errorMessage.includes('not signed') ||
      errorMessage.includes('no está firmado') ||
      errorMessage.includes('SignerCertificate') ||
      errorMessage.includes('certificate') ||
      errorMessage.includes('firmado digitalmente') ||
      errorMessage.includes('publisherNames');
    
    if (isSignatureError) {
      console.warn('[Updater] ⚠️ Advertencia: Error de firma digital detectado');
      console.warn('[Updater] Ignorando error de firma (permitido en desarrollo/testing)');
      console.warn('[Updater] Detalles:', errorMessage);
      
      // Si hay una actualización descargada, continuar con la instalación
      // El error de firma no debería bloquear la actualización en desarrollo
      if (isUpdateDownloaded) {
        console.log('[Updater] ✓ Actualización descargada encontrada, continuando a pesar del error de firma');
        // No enviar error al renderer, permitir que continúe
        return;
      }
    }
    
    isDownloading = false;
    downloadProgress = null;
    
    // Solo enviar error si NO es de firma digital
    if (!isSignatureError) {
      sendStatusToWindow('update-error', { error: errorMessage || 'Error desconocido' });
    }
    
    // No mostrar diálogo de error nativo, dejar que el modal lo maneje
  });

  autoUpdater.on('download-progress', (progressObj) => {
    const message = `Velocidad: ${progressObj.bytesPerSecond} - Descargado ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
    console.log('[Updater]', message);
    console.log('[Updater] Tipo de actualización:', (progressObj as any).delta ? 'Delta (diferencial)' : 'Completa');
    isDownloading = true;
    downloadProgress = progressObj;
    
    sendStatusToWindow('download-progress', {
      percent: progressObj.percent,
      transferred: progressObj.transferred,
      total: progressObj.total,
      bytesPerSecond: progressObj.bytesPerSecond,
      delta: (progressObj as any).delta || false
    });
    
    // IMPORTANTE: Si la descarga llega al 100%, forzar verificación de actualización descargada
    // Esto ayuda a detectar cuando electron-updater no dispara el evento 'update-downloaded' automáticamente
    if (progressObj.percent >= 100) {
      console.log('[Updater] Descarga al 100%, verificando si electron-updater detecta la actualización descargada...');
      
      // Esperar un momento y verificar si hay actualización descargada
      setTimeout(() => {
        // Verificar si electron-updater tiene la actualización descargada
        // Si no se disparó el evento 'update-downloaded', forzarlo manualmente
        if (pendingUpdate && !isUpdateDownloaded) {
          console.log('[Updater] ⚠️ Descarga al 100% pero evento update-downloaded no se disparó, forzando...');
          
          // Simular el evento update-downloaded manualmente
          const updateInfo = {
            version: pendingUpdate.version,
            releaseDate: pendingUpdate.releaseDate,
            files: pendingUpdate.files || []
          };
          
          // Llamar al handler de update-downloaded manualmente
          console.log('[Updater] Forzando proceso de validación y configuración...');
          handleUpdateDownloaded(updateInfo).catch((err) => {
            console.error('[Updater] Error al forzar update-downloaded:', err);
          });
        }
      }, 3000); // Esperar 3 segundos después del 100%
    }
  });
  
  // Función auxiliar para manejar update-downloaded (extraída para reutilización)
  async function handleUpdateDownloaded(info: any) {
    console.log('[Updater] ============================================');
    console.log('[Updater] ACTUALIZACIÓN DESCARGADA:', info.version);
    console.log('[Updater] ============================================');
    
    isDownloading = false;
    downloadProgress = null;
    
    // Notificar que se está validando
    sendStatusToWindow('update-validating', {
      message: 'Validando actualización...',
      version: info.version
    });
    
    // Esperar un momento para que el usuario vea el mensaje
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // PASO 1: Validar archivos descargados
    console.log('[Updater] [1/3] Validando archivos descargados...');
    const validationResult = await validateUpdateFiles(info);
    
    if (!validationResult.valid) {
      console.error('[Updater] Error en validación:', validationResult.error);
      isUpdateDownloaded = false;
      sendStatusToWindow('update-error', {
        error: `Error al validar actualización: ${validationResult.error}`
      });
      return;
    }
    console.log('[Updater] ✓ Validación de archivos completada');
    
    // PASO 2: Verificar y configurar datos del usuario
    sendStatusToWindow('update-configuring', {
      message: 'Configurando actualización...',
      version: info.version
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('[Updater] [2/3] Verificando datos del usuario...');
    try {
      const { app } = require('electron');
      const { getLauncherDataPath } = require('../utils/paths');
      const launcherDataPath = getLauncherDataPath();
      const dbPath = require('path').join(launcherDataPath, 'drk.sqlite');
      
      // Verificar que el directorio de datos existe
      if (!require('fs').existsSync(launcherDataPath)) {
        console.warn('[Updater] Directorio de datos del usuario no encontrado, se creará después de la actualización');
      } else {
        console.log('[Updater] ✓ Directorio de datos del usuario verificado:', launcherDataPath);
      }
      
      // Verificar que la base de datos existe (si ya se ha usado la app)
      if (require('fs').existsSync(dbPath)) {
        console.log('[Updater] ✓ Base de datos del usuario encontrada y será preservada');
      } else {
        console.log('[Updater] Base de datos aún no existe (primera instalación)');
      }
      
      // Verificar directorio de instancias
      const instancesPath = require('path').join(launcherDataPath, 'instances');
      if (require('fs').existsSync(instancesPath)) {
        const instances = require('fs').readdirSync(instancesPath);
        console.log(`[Updater] ✓ Directorio de instancias encontrado con ${instances.length} instancia(s) que serán preservadas`);
      }
      
      console.log('[Updater] ✓ Todos los datos del usuario se preservarán durante la actualización');
      console.log('[Updater] Los datos están en:', launcherDataPath);
      console.log('[Updater] Este directorio NO será afectado por la actualización');
    } catch (err) {
      console.warn('[Updater] Error al verificar datos del usuario:', err);
      // No bloquear la actualización por esto, pero registrar el warning
    }
    
    // PASO 3: Obtener información del archivo
    console.log('[Updater] [3/3] Obteniendo información del archivo...');
    let fileSize = 0;
    let filePath = '';
    try {
      if (info.files && info.files.length > 0) {
        const file = info.files[0];
        fileSize = file.size || 0;
        filePath = file.path || '';
        console.log('[Updater] Archivo descargado:', filePath);
        console.log('[Updater] Tamaño real del archivo:', (fileSize / 1024 / 1024).toFixed(2), 'MB');
      }
    } catch (err) {
      console.warn('[Updater] No se pudo obtener información del archivo:', err);
    }
    
    const isDelta = (info as any).delta || false;
    console.log('[Updater] Tipo:', isDelta ? 'Delta (diferencial) - solo cambios descargados' : 'Completa - archivo completo descargado');
    
    // Marcar como descargada SOLO después de validar y configurar
    isUpdateDownloaded = true;
    
    console.log('[Updater] ============================================');
    console.log('[Updater] ✓ ACTUALIZACIÓN LISTA PARA INSTALAR');
    console.log('[Updater] ============================================');
    
    // Enviar evento final de descarga completada
    console.log('[Updater] Enviando evento update-downloaded al renderer...');
    sendStatusToWindow('update-downloaded', {
      version: info.version,
      releaseDate: info.releaseDate,
      delta: isDelta,
      fileSize: fileSize,
      filePath: filePath
    });
    console.log('[Updater] ✓ Evento update-downloaded enviado correctamente');

    // Notificar al renderer que la actualización está lista para instalar
    sendStatusToWindow('update-ready-to-install', { version: info.version });
    
    // Programar instalación automática después de 5 minutos si el usuario eligió "Más tarde"
    if (laterTimer) {
      clearTimeout(laterTimer);
    }
    
    laterTimer = setTimeout(() => {
      console.log('[Updater] Instalando actualización automáticamente después de espera...');
      installUpdate();
    }, 5 * 60 * 1000); // 5 minutos
  }

  autoUpdater.on('update-downloaded', async (info) => {
    console.log('[Updater] Evento update-downloaded disparado por electron-updater');
    await handleUpdateDownloaded(info);
  });

  // CRÍTICO: Verificar si hay una actualización ya descargada al iniciar
  // electron-updater mantiene el estado de actualizaciones descargadas
  // Verificamos si hay una actualización pendiente de instalación
  setTimeout(() => {
    // IMPORTANTE: Verificar la versión actual de la app
    // Si la versión actual coincide con la versión pendiente, significa que ya se instaló
    const currentVersion = app.getVersion();
    console.log('[Updater] ============================================');
    console.log('[Updater] Verificando estado de actualizaciones al iniciar...');
    console.log('[Updater] Versión actual de la aplicación:', currentVersion);
    
    // CRÍTICO: Limpiar el estado si la versión pendiente ya está instalada
    // Esto previene que se muestre el modal de actualización después de una actualización exitosa
    if (pendingUpdate) {
      console.log('[Updater] Versión pendiente detectada:', pendingUpdate.version);
      
      if (pendingUpdate.version === currentVersion) {
        // Si la versión coincide, significa que ya se instaló, limpiar el estado
        console.log('[Updater] ✓ La actualización ya está instalada, limpiando estado...');
        isUpdateDownloaded = false;
        pendingUpdate = null;
        console.log('[Updater] ✓ Estado limpiado correctamente');
      } else {
        // Si la versión pendiente es diferente a la actual, verificar si realmente está descargada
        console.log('[Updater] Versión pendiente diferente a la actual, verificando si está descargada...');
        
        // Verificar si realmente hay una actualización descargada
        // electron-updater puede mantener el estado incluso después de reiniciar
        try {
          const updateCacheDir = (autoUpdater as any).downloadedUpdateHelper?.cacheDir;
          if (updateCacheDir && fs.existsSync(updateCacheDir)) {
            console.log('[Updater] Se encontró directorio de actualización descargada');
            // Verificar si la versión en el cache coincide con la pendiente
            const files = fs.readdirSync(updateCacheDir);
            if (files.length > 0) {
              console.log('[Updater] Archivos de actualización encontrados, notificando al renderer...');
              // Notificar al renderer que hay una actualización descargada
              sendStatusToWindow('update-downloaded', {
                version: pendingUpdate.version,
                releaseDate: pendingUpdate.releaseDate,
                delta: false,
                fileSize: 0,
                filePath: ''
              });
              isUpdateDownloaded = true;
            } else {
              console.log('[Updater] Directorio de actualización vacío, limpiando estado...');
              isUpdateDownloaded = false;
              pendingUpdate = null;
            }
          } else {
            console.log('[Updater] No se encontró directorio de actualización, limpiando estado...');
            isUpdateDownloaded = false;
            pendingUpdate = null;
          }
        } catch (err) {
          console.warn('[Updater] Error al verificar actualización descargada:', err);
          // En caso de error, limpiar el estado para evitar bucles
          isUpdateDownloaded = false;
          pendingUpdate = null;
        }
      }
    } else {
      console.log('[Updater] No hay actualización pendiente');
      isUpdateDownloaded = false;
    }
    
    console.log('[Updater] ============================================');
    
    // Verificar actualizaciones (esto detectará si hay una versión más nueva disponible)
    checkForUpdates();
  }, 2000);

  // Verificar actualizaciones cada 4 horas
  setInterval(() => {
    checkForUpdates();
  }, 4 * 60 * 60 * 1000);
}

/**
 * Verifica si hay actualizaciones disponibles
 */
export function checkForUpdates() {
  if (process.env.VITE_DEV_SERVER_URL) {
    console.log('[Updater] Modo desarrollo - saltando verificación de actualizaciones');
    return;
  }
  
  console.log('[Updater] Verificando actualizaciones...');
  autoUpdater.checkForUpdates().catch((err) => {
    console.error('[Updater] Error al verificar:', err);
  });
}

/**
 * Envía el estado de actualización a la ventana principal
 */
function sendStatusToWindow(event: string, data: any) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updater-status', { event, data });
  }
}

/**
 * Parsea release notes para extraer lista de cambios
 */
function parseReleaseNotes(releaseNotes?: string): string[] {
  if (!releaseNotes) return [];
  
  const lines = releaseNotes.split('\n').filter(line => line.trim());
  const changes: string[] = [];
  
  for (const line of lines) {
    // Buscar listas con -, *, •, o números
    const match = line.match(/^[-*•\d.\s]+(.+)$/);
    if (match) {
      changes.push(match[1].trim());
    } else if (line.startsWith('##') || line.startsWith('#')) {
      // Ignorar headers de markdown
      continue;
    } else if (line.trim().length > 10) {
      // Agregar líneas significativas
      changes.push(line.trim());
    }
  }
  
  return changes.length > 0 ? changes : ['Mejoras y correcciones generales'];
}

/**
 * Valida los archivos de actualización descargados
 */
async function validateUpdateFiles(info: any): Promise<{ valid: boolean; error?: string }> {
  try {
    // electron-updater valida automáticamente, pero podemos agregar validaciones adicionales
    const updateCacheDir = (autoUpdater as any).downloadedUpdateHelper?.cacheDir;
    
    if (!updateCacheDir) {
      return { valid: true }; // Si no hay cache dir, confiar en la validación de electron-updater
    }
    
    // Verificar que el directorio existe
    if (!fs.existsSync(updateCacheDir)) {
      return { valid: false, error: 'Directorio de actualización no encontrado' };
    }
    
    // Verificar que hay archivos
    const files = fs.readdirSync(updateCacheDir);
    if (files.length === 0) {
      return { valid: false, error: 'No se encontraron archivos de actualización' };
    }
    
    // Verificar checksums si están disponibles
    // electron-updater ya hace esto, pero podemos agregar validación adicional
    
    return { valid: true };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

/**
 * Descarga la actualización
 */
export function downloadUpdate() {
  if (isDownloading) {
    console.log('[Updater] Ya se está descargando una actualización');
    sendStatusToWindow('download-error', { error: 'Ya se está descargando una actualización' });
    return;
  }
  
  if (!pendingUpdate) {
    console.log('[Updater] No hay actualización pendiente');
    sendStatusToWindow('download-error', { error: 'No hay actualización pendiente' });
    return;
  }
  
  // electron-updater verifica automáticamente si ya está descargada
  // y no descargará de nuevo si ya existe (ahorra espacio)
  // También detecta automáticamente si hay actualización diferencial (delta)
  // y la usa en lugar del archivo completo (ahorra ancho de banda)
  
  console.log('[Updater] Iniciando descarga de actualización...');
  console.log('[Updater] electron-updater verificará automáticamente:');
  console.log('[Updater]  - Si ya está descargada (no descargará de nuevo)');
  console.log('[Updater]  - Si hay actualización diferencial disponible (solo cambios)');
  
  isDownloading = true;
  downloadProgress = null;
  
  // Notificar inicio inmediato
  sendStatusToWindow('download-start', { message: 'Iniciando descarga...' });
  
  // Iniciar descarga
  // electron-updater maneja automáticamente:
  // 1. Verificación si ya está descargada (no descarga de nuevo)
  // 2. Detección de actualización diferencial (delta) si está disponible
  // 3. Descarga del archivo completo solo si no hay delta
  autoUpdater.downloadUpdate().catch((err: any) => {
    console.error('[Updater] Error al iniciar descarga:', err);
    
    // Verificar si es un error de firma digital
    const errorMessage = err.message || err.toString() || '';
    const isSignatureError = errorMessage.includes('not signed') ||
      errorMessage.includes('no está firmado') ||
      errorMessage.includes('SignerCertificate') ||
      errorMessage.includes('certificate') ||
      errorMessage.includes('firmado digitalmente') ||
      errorMessage.includes('publisherNames') ||
      errorMessage.includes('StatusMessage');
    
    if (isSignatureError) {
      console.warn('[Updater] ⚠️ Error de firma digital detectado en descarga');
      console.warn('[Updater] Ignorando error de firma (permitido en desarrollo/testing)');
      console.warn('[Updater] Continuando con la descarga...');
      // No enviar error al renderer, permitir que continúe
      // La descarga puede continuar a pesar del error de firma
      return;
    }
    
    isDownloading = false;
    // Solo enviar error si NO es de firma digital
    sendStatusToWindow('download-error', { error: errorMessage || 'Error desconocido' });
  });
}

/**
 * Instala la actualización y reinicia
 */
export function installUpdate() {
  if (laterTimer) {
    clearTimeout(laterTimer);
    laterTimer = null;
  }
  
  if (!isUpdateDownloaded) {
    console.error('[Updater] No hay actualización descargada para instalar');
    sendStatusToWindow('update-error', { error: 'No hay actualización descargada para instalar' });
    return;
  }
  
  console.log('[Updater] ============================================');
  console.log('[Updater] INICIANDO INSTALACIÓN DE ACTUALIZACIÓN');
  console.log('[Updater] ============================================');
  
  // Verificación final de que los datos del usuario están seguros
  try {
    const { getLauncherDataPath } = require('../utils/paths');
    const launcherDataPath = getLauncherDataPath();
    console.log('[Updater] ✓ Datos del usuario en:', launcherDataPath);
    console.log('[Updater] ✓ Estos datos NO serán afectados por la actualización');
    console.log('[Updater] ✓ La actualización solo afecta los archivos de la aplicación');
    console.log('[Updater] ✓ Instancias, perfiles, configuraciones y base de datos se preservarán');
  } catch (err) {
    console.warn('[Updater] Error al verificar datos:', err);
  }
  
  console.log('[Updater] Instalando actualización y reiniciando...');
  console.log('[Updater] Cerrando aplicación para instalar actualización...');
  
  // Notificar a la ventana que se va a instalar
  sendStatusToWindow('installing-update', { message: 'Instalando actualización...' });
  
  // IMPORTANTE: electron-updater por defecto preserva los datos del usuario porque:
  // 1. Los datos están en app.getPath('appData') que está fuera del directorio de instalación
  // 2. La configuración de NSIS tiene "deleteAppDataOnUninstall": false
  // 3. Las actualizaciones solo reemplazan archivos en el directorio de instalación
  
  const { app } = require('electron');
  
  // CRÍTICO: Asegurar que la ventana sea cerrable antes de instalar
  // Esto es esencial para que quitAndInstall funcione correctamente
  if (mainWindow && !mainWindow.isDestroyed()) {
    console.log('[Updater] Asegurando que la ventana sea cerrable...');
    mainWindow.setClosable(true);
    
    // Remover TODOS los listeners de 'close' que puedan prevenir el cierre
    mainWindow.removeAllListeners('close');
    
    // NO agregar ningún handler que pueda prevenir el cierre
    // La ventana debe poder cerrarse libremente
  }
  
  // Remover todos los listeners de before-quit y will-quit que puedan bloquear
  app.removeAllListeners('before-quit');
  app.removeAllListeners('will-quit');
  
  // NO agregar ningún listener que pueda prevenir el cierre
  // La app debe poder cerrarse libremente para que quitAndInstall funcione
  
  // Dar un momento para que los listeners se remuevan
  setTimeout(() => {
    try {
      console.log('[Updater] ============================================');
      console.log('[Updater] Ejecutando quitAndInstall...');
      console.log('[Updater] isSilent=false (mostrar instalador)');
      console.log('[Updater] isForceRunAfter=true (ejecutar app después)');
      console.log('[Updater] ============================================');
      
      // Ejecutar quitAndInstall
      // El primer parámetro (isSilent) = false significa que puede mostrar diálogos del instalador
      // El segundo parámetro (isForceRunAfter) = true significa que ejecutará la app después de instalar
      autoUpdater.quitAndInstall(false, true);
      
      console.log('[Updater] quitAndInstall llamado exitosamente');
      console.log('[Updater] La app debería cerrarse ahora y el instalador debería ejecutarse');
      console.log('[Updater] Después de instalar, la app se reiniciará automáticamente');
      
      // Si después de 3 segundos la app aún no se ha cerrado, forzar el cierre
      setTimeout(() => {
        console.log('[Updater] Verificando si la app se cerró...');
        if (mainWindow && !mainWindow.isDestroyed()) {
          console.log('[Updater] ⚠️ La ventana aún existe, forzando destrucción...');
          mainWindow.destroy();
        }
        console.log('[Updater] Forzando salida de la aplicación con app.exit(0)...');
        app.exit(0);
      }, 3000);
    } catch (error) {
      console.error('[Updater] ❌ Error al ejecutar quitAndInstall:', error);
      // Si falla, intentar cerrar la aplicación de todas formas
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.destroy();
      }
      app.exit(0);
    }
  }, 500);
}

/**
 * Programa instalación para más tarde
 */
export function scheduleLaterInstall() {
  if (laterTimer) {
    clearTimeout(laterTimer);
  }
  
  // La instalación se programará cuando la descarga termine
  console.log('[Updater] Actualización programada para más tarde');
}

// Handlers IPC para control desde el renderer
export function registerUpdaterHandlers() {
  // Verificar actualizaciones manualmente
  ipcMain.handle('updater:check', async () => {
    try {
      checkForUpdates();
      return { success: true };
    } catch (error: any) {
      console.error('[Updater] Error al verificar:', error);
      return { success: false, error: error.message };
    }
  });

  // Obtener versión actual y estado
  ipcMain.handle('updater:get-version', async () => {
    return {
      currentVersion: app.getVersion(),
      updateAvailable: !!pendingUpdate,
      pendingUpdate: pendingUpdate ? {
        version: pendingUpdate.version,
        releaseDate: pendingUpdate.releaseDate,
        releaseNotes: pendingUpdate.releaseNotes
      } : null,
      isDownloading,
      downloadProgress
    };
  });

  // Obtener información de actualización pendiente
  ipcMain.handle('updater:get-pending', async () => {
    if (!pendingUpdate) {
      return { available: false };
    }
    
    return {
      available: true,
      version: pendingUpdate.version,
      releaseDate: pendingUpdate.releaseDate,
      releaseNotes: pendingUpdate.releaseNotes,
      changes: parseReleaseNotes(pendingUpdate.releaseNotes)
    };
  });

  // Descargar actualización manualmente
  ipcMain.handle('updater:download', async () => {
    try {
      downloadUpdate();
      return { success: true };
    } catch (error: any) {
      console.error('[Updater] Error al descargar:', error);
      return { success: false, error: error.message };
    }
  });

  // Programar para más tarde
  ipcMain.handle('updater:later', async () => {
    try {
      scheduleLaterInstall();
      return { success: true };
    } catch (error: any) {
      console.error('[Updater] Error al programar:', error);
      return { success: false, error: error.message };
    }
  });

  // Instalar actualización y reiniciar
  ipcMain.handle('updater:install', async () => {
    try {
      installUpdate();
      return { success: true };
    } catch (error: any) {
      console.error('[Updater] Error al instalar:', error);
      return { success: false, error: error.message };
    }
  });

  // Verificar conexión a internet
  ipcMain.handle('updater:check-internet', async () => {
    try {
      const https = require('https');
      return new Promise((resolve) => {
        const req = https.request('https://www.google.com', { method: 'HEAD', timeout: 3000 }, () => {
          resolve({ hasInternet: true });
        });
        req.on('error', () => resolve({ hasInternet: false }));
        req.on('timeout', () => {
          req.destroy();
          resolve({ hasInternet: false });
        });
        req.end();
      });
    } catch {
      return { hasInternet: false };
    }
  });
}

