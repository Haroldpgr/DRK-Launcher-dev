// ============================================
// SERVICIO DE ACTUALIZACIONES (Renderer)
// Maneja la comunicación con el proceso principal
// ============================================

interface UpdaterStatus {
  event: string;
  data: any;
}

class UpdaterService {
  private statusListeners: Array<(status: UpdaterStatus) => void> = [];

  constructor() {
    // Escuchar eventos de actualización desde el proceso principal
    if (window.api?.updater?.onStatus) {
      window.api.updater.onStatus((_event: any, status: UpdaterStatus) => {
        this.notifyListeners(status);
      });
    }
  }

  /**
   * Verifica si hay actualizaciones disponibles
   */
  async checkForUpdates(): Promise<{ success: boolean; error?: string }> {
    try {
      if (window.api?.updater?.check) {
        return await window.api.updater.check();
      }
      return { success: false, error: 'API de actualizaciones no disponible' };
    } catch (error: any) {
      console.error('[Updater] Error al verificar:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene la versión actual
   */
  async getVersion(): Promise<{ currentVersion: string; updateAvailable: boolean; isDownloaded?: boolean }> {
    try {
      if (window.api?.updater?.getVersion) {
        return await window.api.updater.getVersion();
      }
      return { currentVersion: '0.0.0', updateAvailable: false, isDownloaded: false };
    } catch (error: any) {
      console.error('[Updater] Error al obtener versión:', error);
      return { currentVersion: '0.0.0', updateAvailable: false, isDownloaded: false };
    }
  }

  /**
   * Descarga la actualización disponible
   */
  async downloadUpdate(): Promise<{ success: boolean; error?: string }> {
    try {
      if (window.api?.updater?.download) {
        return await window.api.updater.download();
      }
      return { success: false, error: 'API de actualizaciones no disponible' };
    } catch (error: any) {
      console.error('[Updater] Error al descargar:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Instala la actualización y reinicia
   */
  async installUpdate(): Promise<{ success: boolean; error?: string }> {
    try {
      if (window.api?.updater?.install) {
        return await window.api.updater.install();
      }
      return { success: false, error: 'API de actualizaciones no disponible' };
    } catch (error: any) {
      console.error('[Updater] Error al instalar:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Programa la instalación para más tarde
   */
  async scheduleLater(): Promise<{ success: boolean; error?: string }> {
    try {
      if (window.api?.updater?.later) {
        return await window.api.updater.later();
      }
      return { success: false, error: 'API de actualizaciones no disponible' };
    } catch (error: any) {
      console.error('[Updater] Error al programar:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene información de actualización pendiente
   */
  async getPendingUpdate(): Promise<{ available: boolean; version?: string; releaseDate?: string; releaseNotes?: string; changes?: string[] }> {
    try {
      if (window.api?.updater?.getPending) {
        return await window.api.updater.getPending();
      }
      return { available: false };
    } catch (error: any) {
      console.error('[Updater] Error al obtener actualización pendiente:', error);
      return { available: false };
    }
  }

  /**
   * Verifica conexión a internet
   */
  async checkInternet(): Promise<boolean> {
    try {
      if (window.api?.updater?.checkInternet) {
        const result = await window.api.updater.checkInternet();
        return result.hasInternet || false;
      }
      return navigator.onLine;
    } catch (error) {
      console.error('[Updater] Error al verificar internet:', error);
      return navigator.onLine;
    }
  }

  /**
   * Suscribe un listener para eventos de actualización
   */
  onStatus(callback: (status: UpdaterStatus) => void): () => void {
    this.statusListeners.push(callback);
    return () => {
      this.statusListeners = this.statusListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notifica a todos los listeners
   */
  private notifyListeners(status: UpdaterStatus) {
    this.statusListeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('[Updater] Error en listener:', error);
      }
    });
  }
}

export const updaterService = new UpdaterService();
export default updaterService;

