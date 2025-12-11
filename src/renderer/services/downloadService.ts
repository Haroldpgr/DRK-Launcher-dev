// src/renderer/services/downloadService.ts
import { settingsService } from './settingsService';
import { notificationService } from './notificationService';
import { profileService } from './profileService';

export interface Download {
  id: string;
  name: string;
  url: string;
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'error';
  progress: number;
  downloadedBytes: number;
  totalBytes: number;
  startTime: number;
  endTime?: number;
  speed: number; // bytes per second
  path?: string;
  /** Usuario/perfil dueño de esta descarga (para historial por perfil) */
  profileUsername?: string;
}

export class DownloadService {
  private downloads: Map<string, Download> = new Map();
  private observers: Array<(downloads: Download[]) => void> = [];
  private downloadNotifications: Map<string, string> = new Map(); // Mapa de downloadId a notificationId
  private readonly STORAGE_KEY = 'launcher_downloads_v1';

  constructor() {
    // Registrar listeners globales para los eventos de descarga
    // Nota: Estos listeners ya están registrados globalmente en el constructor,
    // por lo que no hay que registrarlos múltiples veces
    window.api.download.onProgress(this.handleProgress.bind(this));
    window.api.download.onComplete(this.handleComplete.bind(this));
    window.api.download.onError(this.handleError.bind(this));

    // Cargar historial persistido
    this.loadFromStorage();
  }

  private handleProgress(event: any, data: { itemId: string; progress: number }) {
    const download = this.downloads.get(data.itemId);
    if (download) {
      // Actualizar con los datos reales del progreso
      download.progress = Math.round(data.progress * 100);
      // Actualizar los bytes descargados basados en el progreso y tamaño total
      download.downloadedBytes = Math.round(download.totalBytes * data.progress);

      // Calcular velocidad aproximada
      const elapsedSeconds = (Date.now() - download.startTime) / 1000;
      if (elapsedSeconds > 0) {
        download.speed = Math.round(download.downloadedBytes / elapsedSeconds);
      }

      // Actualizar notificación de progreso si existe
      const notificationId = this.downloadNotifications.get(data.itemId);
      if (notificationId) {
        notificationService.updateProgress(notificationId, download.progress, `${download.name} - ${download.progress}%`);
      }

      this.notifyObservers();

      // Si es parte de una descarga agrupada, actualizar también el progreso del grupo
      for (const [groupId, progressInfo] of this.instanceDownloadProgress) {
        if (progressInfo.downloads.includes(data.itemId)) {
          // Recalcular el progreso total del grupo basado en bytes reales descargados
          let groupDownloadedBytes = 0;
          let groupTotalBytes = 0;

          for (const downloadId of progressInfo.downloads) {
            const groupDownload = this.downloads.get(downloadId);
            if (groupDownload) {
              groupDownloadedBytes += groupDownload.downloadedBytes;
              groupTotalBytes += groupDownload.totalBytes;
            }
          }

          const group = this.downloads.get(groupId);
          if (group && groupTotalBytes > 0) {
            group.progress = Math.round((groupDownloadedBytes / groupTotalBytes) * 100);
            group.downloadedBytes = groupDownloadedBytes;

            // Calcular velocidad del grupo
            const groupElapsedSeconds = (Date.now() - group.startTime) / 1000;
            if (groupElapsedSeconds > 0) {
              group.speed = Math.round(groupDownloadedBytes / groupElapsedSeconds);
            }

            // Actualizar notificación del grupo si existe
            const groupNotificationId = this.downloadNotifications.get(groupId);
            if (groupNotificationId) {
              notificationService.updateProgress(groupNotificationId, group.progress, `${group.name} - ${group.progress}%`);
            }

            this.notifyObservers();
          }
          break; // Solo actualizar el primer grupo encontrado
        }
      }
    }
  }

  private handleComplete(event: any, data: { itemId: string; filePath: string }) {
    const download = this.downloads.get(data.itemId);
    if (download) {
      download.status = 'completed';
      download.progress = 100;
      download.endTime = Date.now();
      download.path = data.filePath;

      this.persistDownloads();

      // Mostrar notificación de éxito
      const notificationId = this.downloadNotifications.get(data.itemId);
      if (notificationId) {
        // Actualizar la notificación existente a completado
        notificationService.updateProgress(notificationId, 100, `${download.name} - ¡Completado!`);
        // Programar el cierre de la notificación de éxito
        setTimeout(() => {
          notificationService.dismiss(notificationId);
          this.downloadNotifications.delete(data.itemId); // Limpiar el registro
        }, 3000);
      } else {
        // Si no había notificación activa, crear una nueva
        notificationService.show({
          title: 'Descarga completada',
          message: download.name,
          type: 'success',
          showProgress: false
        });
      }

      this.notifyObservers();
    }
  }

  private handleError(event: any, error: { itemId: string; message: string }) {
    const download = this.downloads.get(error.itemId);
    if (download) {
      download.status = 'error';
      download.endTime = Date.now();

      this.persistDownloads();

      // Mostrar notificación de error
      const notificationId = this.downloadNotifications.get(error.itemId);
      if (notificationId) {
        notificationService.updateProgress(notificationId, 0, `${download.name} - Error: ${error.message}`);
        // Cambiar tipo de notificación a error
        // Nota: Esto requiere una actualización del servicio de notificaciones
        // Por ahora, simplemente actualizamos el mensaje y lo mantenemos visible
      } else {
        notificationService.show({
          title: 'Error en descarga',
          message: `${download.name} - ${error.message}`,
          type: 'error',
          showProgress: false
        });
      }

      this.notifyObservers();
    }
  }

  subscribe(callback: (downloads: Download[]) => void) {
    this.observers.push(callback);
    // Notificar inmediatamente con la lista actual
    callback(this.getAllDownloads());

    return () => {
      this.observers = this.observers.filter(obs => obs !== callback);
    };
  }

  private notifyObservers() {
    const downloadsArray = this.getAllDownloads();
    this.observers.forEach(observer => observer(downloadsArray));
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return;
      const parsed: Download[] = JSON.parse(raw);
      
      // Limpiar descargas completadas que tengan más de 15 días
      const fifteenDaysAgo = Date.now() - (15 * 24 * 60 * 60 * 1000);
      const filtered = parsed.filter(d => {
        // Mantener descargas activas o recientes
        if (d.status === 'downloading' || d.status === 'pending' || d.status === 'paused') {
          return true;
        }
        // Si está completada, verificar que no tenga más de 15 días
        if (d.status === 'completed' && d.endTime) {
          return d.endTime > fifteenDaysAgo;
        }
        // Si está en error, mantener por 7 días
        if (d.status === 'error' && d.endTime) {
          const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
          return d.endTime > sevenDaysAgo;
        }
        return true;
      });
      
      // Si se eliminaron descargas, guardar el estado actualizado
      if (filtered.length < parsed.length) {
        this.downloads = new Map(filtered.map(d => [d.id, d]));
        this.persistDownloads();
      } else {
        this.downloads = new Map(filtered.map(d => [d.id, d]));
      }
      
      this.notifyObservers();
    } catch (e) {
      console.error('Error cargando historial de descargas', e);
    }
  }

  private persistDownloads() {
    try {
      const all = Array.from(this.downloads.values());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all));
    } catch (e) {
      console.error('Error guardando historial de descargas', e);
    }
  }

  private getCurrentProfileUsername(): string | null {
    return profileService.getCurrentProfile();
  }

  private isOwnedByCurrentProfile(download: Download): boolean {
    const current = this.getCurrentProfileUsername();
    if (!current) return true; // si no hay perfil actual, mostrar todo
    // Descargas antiguas sin perfil asignado se muestran para todos
    return download.profileUsername === current || !download.profileUsername;
  }

  // Método para agregar una descarga completada al historial manualmente
  addDownloadToHistory(download: Download) {
    this.downloads.set(download.id, download);
    this.persistDownloads();
    this.notifyObservers();
  }

  createDownload(url: string, name: string): Download {
    const downloadId = `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const profileUsername = this.getCurrentProfileUsername() || undefined;
    const newDownload: Download = {
      id: downloadId,
      name,
      url,
      status: 'pending',
      progress: 0,
      downloadedBytes: 0,
      totalBytes: 100 * 1024 * 1024, // Valor por defecto (100MB), se actualizará al iniciar la descarga real
      startTime: Date.now(),
      speed: 0,
      profileUsername,
    };

    this.downloads.set(downloadId, newDownload);
    this.persistDownloads();

    // Mostrar notificación de inicio de descarga
    const notificationId = notificationService.show({
      title: 'Iniciando descarga',
      message: name,
      type: 'info',
      progress: 0,
      showProgress: true
    });

    // Registrar la notificación para actualizaciones futuras
    this.downloadNotifications.set(downloadId, notificationId);

    this.notifyObservers();

    // Iniciar la descarga real usando el API de Electron
    this.startDownload(newDownload.id);

    return newDownload;
  }

  async startDownload(downloadId: string) {
    const download = this.downloads.get(downloadId);
    if (!download) return;

    if (download.status === 'completed') {
      // Reiniciar descarga si ya está completada
      download.progress = 0;
      download.downloadedBytes = 0;
      download.startTime = Date.now();
      download.speed = 0;
    }

    download.status = 'downloading';
    this.persistDownloads();
    this.notifyObservers();

    try {
      // Usar el API real de Electron para iniciar la descarga
      const downloadData = {
        url: download.url,
        filename: download.name.replace(/\s+/g, '_'), // Nombre del archivo limpio sin espacios
        itemId: downloadId
      };

      window.api.download.start(downloadData);
    } catch (error) {
      console.error('Error downloading file:', error);
      download.status = 'error';
      this.persistDownloads();
      this.notifyObservers();
    }
  }

  // Almacenamiento para descargas por instancia
  private instanceDownloadProgress: Map<string, { total: number; completed: number; downloads: string[] }> = new Map();

  // Método para iniciar descargas de archivos específicos
  downloadFile(url: string, filename: string, displayName?: string): Download {
    const downloadId = `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const name = displayName || filename;
    const profileUsername = this.getCurrentProfileUsername() || undefined;
    const newDownload: Download = {
      id: downloadId,
      name,
      url,
      status: 'pending',
      progress: 0,
      downloadedBytes: 0,
      totalBytes: 100 * 1024 * 1024, // Valor por defecto (100MB)
      startTime: Date.now(),
      speed: 0,
      profileUsername,
    };

    this.downloads.set(downloadId, newDownload);
    this.persistDownloads();
    this.notifyObservers();

    // Iniciar la descarga real usando el API de Electron
    const downloadData = {
      url,
      filename,
      itemId: downloadId
    };

    window.api.download.start(downloadData);

    return newDownload;
  }

  // Método para iniciar una descarga agrupada por instancia
  async downloadInstance(instanceName: string, filesToDownload: Array<{ url: string; filename: string; displayName: string }>): Promise<void> {
    const groupId = `instance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const profileUsername = this.getCurrentProfileUsername() || undefined;

    // Estimar tamaño total de forma realista (usando estimaciones promedio por tipo de archivo)
    // Los archivos JAR de Minecraft suelen ser de 1-15MB, así que usaremos un valor promedio
    const avgFileSize = 5 * 1024 * 1024; // 5MB promedio por archivo
    const totalBytes = filesToDownload.length * avgFileSize;

    // Crear una descarga agrupada para mostrar el progreso general
    const groupDownload: Download = {
      id: groupId,
      name: `Instalación de ${instanceName} - ${filesToDownload.length} archivos`,
      url: '',
      status: 'downloading',
      progress: 0,
      downloadedBytes: 0,
      totalBytes: totalBytes,
      startTime: Date.now(),
      speed: 0,
      profileUsername,
    };

    this.downloads.set(groupId, groupDownload);
    this.persistDownloads();

    // Mostrar notificación de inicio de instalación de instancia
    const groupNotificationId = notificationService.show({
      title: 'Instalando Instancia',
      message: `Instalando ${instanceName} (${filesToDownload.length} archivos)`,
      type: 'info',
      progress: 0,
      showProgress: true
    });

    // Registrar la notificación para actualizaciones futuras
    this.downloadNotifications.set(groupId, groupNotificationId);

    this.notifyObservers();

    // Almacenar el progreso de la descarga agrupada
    this.instanceDownloadProgress.set(groupId, {
      total: filesToDownload.length,
      completed: 0,
      downloads: []
    });

    // Procesar descargas secuencialmente
    let completedCount = 0;

    for (const file of filesToDownload) {
      const downloadId = `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const estimatedSize = avgFileSize; // Usar tamaño promedio

      const newDownload: Download = {
        id: downloadId,
        name: file.displayName,
        url: file.url,
        status: 'pending',
        progress: 0,
        downloadedBytes: 0,
        totalBytes: estimatedSize,
        startTime: Date.now(),
        speed: 0,
        profileUsername,
      };

      this.downloads.set(downloadId, newDownload);
      this.persistDownloads();

      // Actualizar el progreso de la descarga agrupada
      const progressInfo = this.instanceDownloadProgress.get(groupId);
      if (progressInfo) {
        progressInfo.downloads.push(downloadId);
        this.instanceDownloadProgress.set(groupId, progressInfo);
      }

      this.notifyObservers();

      // Iniciar la descarga real usando el API de Electron
      const downloadData = {
        url: file.url,
        filename: file.filename,
        itemId: downloadId
      };

      // Esperar a que esta descarga se complete antes de iniciar la siguiente
      await this.startDownloadAndWait(downloadId, downloadData);

      // Actualizar el progreso de la descarga agrupada basado en archivos completados
      completedCount++;
      const groupProgress = Math.round((completedCount / filesToDownload.length) * 100);
      groupDownload.progress = Math.min(100, groupProgress); // No exceder 100%

      // Actualizar notificación de la descarga agrupada
      notificationService.updateProgress(groupNotificationId, groupProgress, `${instanceName} - ${completedCount}/${filesToDownload.length} archivos`);

      this.notifyObservers();
    }

    // Marcar la descarga agrupada como completada
    groupDownload.status = 'completed';
    groupDownload.progress = 100;
    groupDownload.endTime = Date.now();
    this.persistDownloads();

    // Actualizar notificación de la descarga agrupada a completado
    notificationService.updateProgress(groupNotificationId, 100, `${instanceName} - ¡Instalación completada!`);

    // Programar el cierre de la notificación de éxito
    setTimeout(() => {
      notificationService.dismiss(groupNotificationId);
      this.downloadNotifications.delete(groupId); // Limpiar el registro
    }, 5000);

    this.notifyObservers();

    // Eliminar solo el registro de progreso interno después de completar,
    // pero mantener la descarga en el historial
    setTimeout(() => {
      this.instanceDownloadProgress.delete(groupId);
    }, 10000); // Limpiar progreso interno después de 10 segundos
  }

  // Método auxiliar para esperar a que una descarga se complete
  private async startDownloadAndWait(downloadId: string, downloadData: any): Promise<void> {
    return new Promise((resolve, reject) => {
      // Registrar listeners temporales para esta descarga específica
      const unsubscribeProgress = window.api.download.onProgress((event, data) => {
        if (data.itemId === downloadId) {
          const download = this.downloads.get(downloadId);
          if (download) {
            download.progress = Math.round(data.progress * 100);
            download.downloadedBytes = Math.round(download.totalBytes * data.progress);

            // Calcular velocidad aproximada
            const elapsedSeconds = (Date.now() - download.startTime) / 1000;
            if (elapsedSeconds > 0) {
              download.speed = Math.round(download.downloadedBytes / elapsedSeconds);
            }
          }
          this.notifyObservers();
        }
      });

      const unsubscribeComplete = window.api.download.onComplete((event, data) => {
        if (data.itemId === downloadId) {
          const download = this.downloads.get(downloadId);
          if (download) {
            download.status = 'completed';
            download.progress = 100;
            download.endTime = Date.now();
            download.path = data.filePath;
          }
          this.persistDownloads();
          this.notifyObservers();
          resolve(); // Resolver la promesa cuando se completa
        }
      });

      const unsubscribeError = window.api.download.onError((event, error) => {
        if (error.itemId === downloadId) {
          const download = this.downloads.get(downloadId);
          if (download) {
            download.status = 'error';
            download.endTime = Date.now();
          }
          this.persistDownloads();
          this.notifyObservers();
          reject(new Error(error.message)); // Rechazar la promesa si hay error
        }
      });

      // Iniciar la descarga
      window.api.download.start(downloadData);

      // Limpieza de listeners cuando se complete o haya error
      // (Los listeners se manejan globalmente en el constructor, así que solo se notificará al completar)
    });
  }

  pauseDownload(downloadId: string) {
    // Nota: La API de Electron no tiene pausa directa, así que solo cambiamos el estado visualmente
    const download = this.downloads.get(downloadId);
    if (download && download.status === 'downloading') {
      download.status = 'paused';
      this.notifyObservers();
    }
  }

  resumeDownload(downloadId: string) {
    const download = this.downloads.get(downloadId);
    if (download && download.status === 'paused') {
      this.startDownload(downloadId);
    }
  }

  cancelDownload(downloadId: string) {
    const download = this.downloads.get(downloadId);
    if (download) {
      download.status = 'error';
      download.endTime = Date.now();
      this.persistDownloads();
      this.notifyObservers();
    }
  }

  getDownload(downloadId: string): Download | undefined {
    return this.downloads.get(downloadId);
  }

  getAllDownloads(): Download[] {
    return Array.from(this.downloads.values())
      .filter(d => this.isOwnedByCurrentProfile(d))
      .sort((a, b) => b.startTime - a.startTime);
  }

  getActiveDownloads(): Download[] {
    return Array.from(this.downloads.values())
      .filter(d => (d.status === 'downloading' || d.status === 'paused') && this.isOwnedByCurrentProfile(d))
      .sort((a, b) => b.startTime - a.startTime);
  }

  getCompletedDownloads(): Download[] {
    return Array.from(this.downloads.values())
      .filter(d => d.status === 'completed' && this.isOwnedByCurrentProfile(d))
      .sort((a, b) => (b.endTime || 0) - (a.endTime || 0));
  }

  clearCompleted() {
    const current = this.getCurrentProfileUsername();
    const entries = Array.from(this.downloads.entries());

    for (const [id, download] of entries) {
      if (download.status === 'completed' && (!current || download.profileUsername === current || !download.profileUsername)) {
        this.downloads.delete(id);
      }
    }

    this.persistDownloads();
    this.notifyObservers();
  }

  removeFromHistory(downloadId: string) {
    if (this.downloads.has(downloadId)) {
      this.downloads.delete(downloadId);
      this.persistDownloads();
      this.notifyObservers();
    }
  }

  // Método especial para descargar Java desde Adoptium API
  async downloadJavaFromAdoptium(javaVersion: string, osFamily: string, arch: string): Promise<Download> {
    const apiUrl = `https://api.adoptium.net/v3/binary/latest/${javaVersion}/ga/jdk/temurin/${osFamily}/${arch}/normal/hotspot/jdk`;

    // Hacer solicitud para obtener la URL de descarga
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Error al obtener la URL de descarga: ${response.status}`);
      }

      const downloadInfo = await response.json();
      const downloadUrl = downloadInfo.uri || downloadInfo.binary.link; // Adaptar según formato real de la API

      const download = this.downloadFile(
        downloadUrl,
        `java-${javaVersion}-${osFamily}-${arch}.zip`,
        `Java ${javaVersion} (${osFamily}/${arch})`
      );

      return download;
    } catch (error) {
      console.error('Error downloading Java from Adoptium:', error);
      const download = this.downloadFile(
        '',
        `java-${javaVersion}-${osFamily}-${arch}.zip`,
        `Error: Java ${javaVersion} (${osFamily}/${arch})`
      );
      download.status = 'error';
      this.notifyObservers();
      throw error;
    }
  }
}

export const downloadService = new DownloadService();