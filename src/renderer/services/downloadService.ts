// src/renderer/services/downloadService.ts
import { settingsService } from './settingsService';

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
}

export class DownloadService {
  private downloads: Map<string, Download> = new Map();
  private observers: Array<(downloads: Download[]) => void> = [];
  private progressListeners: Map<string, (event: any, data: { itemId: string; progress: number }) => void> = new Map();
  private completeListeners: Map<string, (event: any, data: { itemId: string; filePath: string }) => void> = new Map();
  private errorListeners: Map<string, (event: any, error: { itemId: string; message: string }) => void> = new Map();

  constructor() {
    // Registrar listeners globales para los eventos de descarga
    window.api.download.onProgress(this.handleProgress.bind(this));
    window.api.download.onComplete(this.handleComplete.bind(this));
    window.api.download.onError(this.handleError.bind(this));
  }

  private handleProgress(event: any, data: { itemId: string; progress: number }) {
    const download = this.downloads.get(data.itemId);
    if (download) {
      // Calcular bytes descargados basado en progreso
      download.progress = Math.round(data.progress * 100);
      download.downloadedBytes = Math.round(download.totalBytes * data.progress);

      // Calcular velocidad aproximada
      const elapsedSeconds = (Date.now() - download.startTime) / 1000;
      if (elapsedSeconds > 0) {
        download.speed = Math.round(download.downloadedBytes / elapsedSeconds);
      }

      this.notifyObservers();
    }
  }

  private handleComplete(event: any, data: { itemId: string; filePath: string }) {
    const download = this.downloads.get(data.itemId);
    if (download) {
      download.status = 'completed';
      download.progress = 100;
      download.endTime = Date.now();
      download.path = data.filePath;
      this.notifyObservers();
    }
  }

  private handleError(event: any, error: { itemId: string; message: string }) {
    const download = this.downloads.get(error.itemId);
    if (download) {
      download.status = 'error';
      download.endTime = Date.now();
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

  createDownload(url: string, name: string): Download {
    const downloadId = `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newDownload: Download = {
      id: downloadId,
      name,
      url,
      status: 'pending',
      progress: 0,
      downloadedBytes: 0,
      totalBytes: 100 * 1024 * 1024, // Valor por defecto (100MB), se actualizará al iniciar la descarga real
      startTime: Date.now(),
      speed: 0
    };

    this.downloads.set(downloadId, newDownload);
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
      this.notifyObservers();
    }
  }

  // Almacenamiento para descargas por instancia
  private instanceDownloadProgress: Map<string, { total: number; completed: number; downloads: string[] }> = new Map();

  // Método para iniciar descargas de archivos específicos
  downloadFile(url: string, filename: string, displayName?: string): Download {
    const downloadId = `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const name = displayName || filename;
    const newDownload: Download = {
      id: downloadId,
      name,
      url,
      status: 'pending',
      progress: 0,
      downloadedBytes: 0,
      totalBytes: 100 * 1024 * 1024, // Valor por defecto (100MB)
      startTime: Date.now(),
      speed: 0
    };

    this.downloads.set(downloadId, newDownload);
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
      speed: 0
    };

    this.downloads.set(groupId, groupDownload);
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
        speed: 0
      };

      this.downloads.set(downloadId, newDownload);

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

      this.notifyObservers();
    }

    // Marcar la descarga agrupada como completada
    groupDownload.status = 'completed';
    groupDownload.progress = 100;
    groupDownload.endTime = Date.now();

    this.notifyObservers();

    // Eliminar el progreso de la instancia después de completar
    setTimeout(() => {
      this.instanceDownloadProgress.delete(groupId);
      this.downloads.delete(groupId);
      this.notifyObservers();
    }, 10000); // Eliminar después de 10 segundos
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
      this.notifyObservers();
      // Remover después de un tiempo para no dejar entradas huérfanas
      setTimeout(() => {
        this.downloads.delete(downloadId);
        this.notifyObservers();
      }, 5000);
    }
  }

  getDownload(downloadId: string): Download | undefined {
    return this.downloads.get(downloadId);
  }

  getAllDownloads(): Download[] {
    return Array.from(this.downloads.values()).sort((a, b) => b.startTime - a.startTime);
  }

  getActiveDownloads(): Download[] {
    return Array.from(this.downloads.values())
      .filter(d => d.status === 'downloading' || d.status === 'paused')
      .sort((a, b) => b.startTime - a.startTime);
  }

  getCompletedDownloads(): Download[] {
    return Array.from(this.downloads.values())
      .filter(d => d.status === 'completed')
      .sort((a, b) => (b.endTime || 0) - (a.endTime || 0));
  }

  clearCompleted() {
    const completedIds = Array.from(this.downloads.entries())
      .filter(([_, download]) => download.status === 'completed')
      .map(([id, _]) => id);

    completedIds.forEach(id => this.downloads.delete(id));
    this.notifyObservers();
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