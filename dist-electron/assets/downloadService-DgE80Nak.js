var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { n as notificationService, p as profileService } from "./index-CBCIeQaY.js";
class DownloadService {
  constructor() {
    __publicField(this, "downloads", /* @__PURE__ */ new Map());
    __publicField(this, "observers", []);
    __publicField(this, "downloadNotifications", /* @__PURE__ */ new Map());
    // Mapa de downloadId a notificationId
    __publicField(this, "STORAGE_KEY", "launcher_downloads_v1");
    // Almacenamiento para descargas por instancia
    __publicField(this, "instanceDownloadProgress", /* @__PURE__ */ new Map());
    window.api.download.onProgress(this.handleProgress.bind(this));
    window.api.download.onComplete(this.handleComplete.bind(this));
    window.api.download.onError(this.handleError.bind(this));
    this.loadFromStorage();
  }
  handleProgress(event, data) {
    const download = this.downloads.get(data.itemId);
    if (download) {
      download.progress = Math.round(data.progress * 100);
      download.downloadedBytes = Math.round(download.totalBytes * data.progress);
      const elapsedSeconds = (Date.now() - download.startTime) / 1e3;
      if (elapsedSeconds > 0) {
        download.speed = Math.round(download.downloadedBytes / elapsedSeconds);
      }
      const notificationId = this.downloadNotifications.get(data.itemId);
      if (notificationId) {
        notificationService.updateProgress(notificationId, download.progress, `${download.name} - ${download.progress}%`);
      }
      this.notifyObservers();
      for (const [groupId, progressInfo] of this.instanceDownloadProgress) {
        if (progressInfo.downloads.includes(data.itemId)) {
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
            group.progress = Math.round(groupDownloadedBytes / groupTotalBytes * 100);
            group.downloadedBytes = groupDownloadedBytes;
            const groupElapsedSeconds = (Date.now() - group.startTime) / 1e3;
            if (groupElapsedSeconds > 0) {
              group.speed = Math.round(groupDownloadedBytes / groupElapsedSeconds);
            }
            const groupNotificationId = this.downloadNotifications.get(groupId);
            if (groupNotificationId) {
              notificationService.updateProgress(groupNotificationId, group.progress, `${group.name} - ${group.progress}%`);
            }
            this.notifyObservers();
          }
          break;
        }
      }
    }
  }
  handleComplete(event, data) {
    const download = this.downloads.get(data.itemId);
    if (download) {
      download.status = "completed";
      download.progress = 100;
      download.endTime = Date.now();
      download.path = data.filePath;
      this.persistDownloads();
      const notificationId = this.downloadNotifications.get(data.itemId);
      if (notificationId) {
        notificationService.updateProgress(notificationId, 100, `${download.name} - ¡Completado!`);
        setTimeout(() => {
          notificationService.dismiss(notificationId);
          this.downloadNotifications.delete(data.itemId);
        }, 3e3);
      } else {
        notificationService.show({
          title: "Descarga completada",
          message: download.name,
          type: "success",
          showProgress: false
        });
      }
      this.notifyObservers();
    }
  }
  handleError(event, error) {
    const download = this.downloads.get(error.itemId);
    if (download) {
      download.status = "error";
      download.endTime = Date.now();
      this.persistDownloads();
      const notificationId = this.downloadNotifications.get(error.itemId);
      if (notificationId) {
        notificationService.updateProgress(notificationId, 0, `${download.name} - Error: ${error.message}`);
      } else {
        notificationService.show({
          title: "Error en descarga",
          message: `${download.name} - ${error.message}`,
          type: "error",
          showProgress: false
        });
      }
      this.notifyObservers();
    }
  }
  subscribe(callback) {
    this.observers.push(callback);
    callback(this.getAllDownloads());
    return () => {
      this.observers = this.observers.filter((obs) => obs !== callback);
    };
  }
  notifyObservers() {
    const downloadsArray = this.getAllDownloads();
    this.observers.forEach((observer) => observer(downloadsArray));
  }
  loadFromStorage() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const fifteenDaysAgo = Date.now() - 15 * 24 * 60 * 60 * 1e3;
      const filtered = parsed.filter((d) => {
        if (d.status === "downloading" || d.status === "pending" || d.status === "paused") {
          return true;
        }
        if (d.status === "completed" && d.endTime) {
          return d.endTime > fifteenDaysAgo;
        }
        if (d.status === "error" && d.endTime) {
          const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1e3;
          return d.endTime > sevenDaysAgo;
        }
        return true;
      });
      if (filtered.length < parsed.length) {
        this.downloads = new Map(filtered.map((d) => [d.id, d]));
        this.persistDownloads();
      } else {
        this.downloads = new Map(filtered.map((d) => [d.id, d]));
      }
      this.notifyObservers();
    } catch (e) {
      console.error("Error cargando historial de descargas", e);
    }
  }
  persistDownloads() {
    try {
      const all = Array.from(this.downloads.values());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all));
    } catch (e) {
      console.error("Error guardando historial de descargas", e);
    }
  }
  getCurrentProfileUsername() {
    return profileService.getCurrentProfile();
  }
  isOwnedByCurrentProfile(download) {
    const current = this.getCurrentProfileUsername();
    if (!current) return true;
    return download.profileUsername === current || !download.profileUsername;
  }
  // Método para agregar una descarga completada al historial manualmente
  addDownloadToHistory(download) {
    this.downloads.set(download.id, download);
    this.persistDownloads();
    this.notifyObservers();
  }
  createDownload(url, name) {
    const downloadId = `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const profileUsername = this.getCurrentProfileUsername() || void 0;
    const newDownload = {
      id: downloadId,
      name,
      url,
      status: "pending",
      progress: 0,
      downloadedBytes: 0,
      totalBytes: 100 * 1024 * 1024,
      // Valor por defecto (100MB), se actualizará al iniciar la descarga real
      startTime: Date.now(),
      speed: 0,
      profileUsername
    };
    this.downloads.set(downloadId, newDownload);
    this.persistDownloads();
    const notificationId = notificationService.show({
      title: "Iniciando descarga",
      message: name,
      type: "info",
      progress: 0,
      showProgress: true
    });
    this.downloadNotifications.set(downloadId, notificationId);
    this.notifyObservers();
    this.startDownload(newDownload.id);
    return newDownload;
  }
  async startDownload(downloadId) {
    const download = this.downloads.get(downloadId);
    if (!download) return;
    if (download.status === "completed") {
      download.progress = 0;
      download.downloadedBytes = 0;
      download.startTime = Date.now();
      download.speed = 0;
    }
    download.status = "downloading";
    this.persistDownloads();
    this.notifyObservers();
    try {
      const downloadData = {
        url: download.url,
        filename: download.name.replace(/\s+/g, "_"),
        // Nombre del archivo limpio sin espacios
        itemId: downloadId
      };
      window.api.download.start(downloadData);
    } catch (error) {
      console.error("Error downloading file:", error);
      download.status = "error";
      this.persistDownloads();
      this.notifyObservers();
    }
  }
  // Método para iniciar descargas de archivos específicos
  downloadFile(url, filename, displayName) {
    const downloadId = `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const name = displayName || filename;
    const profileUsername = this.getCurrentProfileUsername() || void 0;
    const newDownload = {
      id: downloadId,
      name,
      url,
      status: "pending",
      progress: 0,
      downloadedBytes: 0,
      totalBytes: 100 * 1024 * 1024,
      // Valor por defecto (100MB)
      startTime: Date.now(),
      speed: 0,
      profileUsername
    };
    this.downloads.set(downloadId, newDownload);
    this.persistDownloads();
    this.notifyObservers();
    const downloadData = {
      url,
      filename,
      itemId: downloadId
    };
    window.api.download.start(downloadData);
    return newDownload;
  }
  // Método para iniciar una descarga agrupada por instancia
  async downloadInstance(instanceName, filesToDownload) {
    const groupId = `instance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const profileUsername = this.getCurrentProfileUsername() || void 0;
    const avgFileSize = 5 * 1024 * 1024;
    const totalBytes = filesToDownload.length * avgFileSize;
    const groupDownload = {
      id: groupId,
      name: `Instalación de ${instanceName} - ${filesToDownload.length} archivos`,
      url: "",
      status: "downloading",
      progress: 0,
      downloadedBytes: 0,
      totalBytes,
      startTime: Date.now(),
      speed: 0,
      profileUsername
    };
    this.downloads.set(groupId, groupDownload);
    this.persistDownloads();
    const groupNotificationId = notificationService.show({
      title: "Instalando Instancia",
      message: `Instalando ${instanceName} (${filesToDownload.length} archivos)`,
      type: "info",
      progress: 0,
      showProgress: true
    });
    this.downloadNotifications.set(groupId, groupNotificationId);
    this.notifyObservers();
    this.instanceDownloadProgress.set(groupId, {
      total: filesToDownload.length,
      completed: 0,
      downloads: []
    });
    let completedCount = 0;
    for (const file of filesToDownload) {
      const downloadId = `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const estimatedSize = avgFileSize;
      const newDownload = {
        id: downloadId,
        name: file.displayName,
        url: file.url,
        status: "pending",
        progress: 0,
        downloadedBytes: 0,
        totalBytes: estimatedSize,
        startTime: Date.now(),
        speed: 0,
        profileUsername
      };
      this.downloads.set(downloadId, newDownload);
      this.persistDownloads();
      const progressInfo = this.instanceDownloadProgress.get(groupId);
      if (progressInfo) {
        progressInfo.downloads.push(downloadId);
        this.instanceDownloadProgress.set(groupId, progressInfo);
      }
      this.notifyObservers();
      const downloadData = {
        url: file.url,
        filename: file.filename,
        itemId: downloadId
      };
      await this.startDownloadAndWait(downloadId, downloadData);
      completedCount++;
      const groupProgress = Math.round(completedCount / filesToDownload.length * 100);
      groupDownload.progress = Math.min(100, groupProgress);
      notificationService.updateProgress(groupNotificationId, groupProgress, `${instanceName} - ${completedCount}/${filesToDownload.length} archivos`);
      this.notifyObservers();
    }
    groupDownload.status = "completed";
    groupDownload.progress = 100;
    groupDownload.endTime = Date.now();
    this.persistDownloads();
    notificationService.updateProgress(groupNotificationId, 100, `${instanceName} - ¡Instalación completada!`);
    setTimeout(() => {
      notificationService.dismiss(groupNotificationId);
      this.downloadNotifications.delete(groupId);
    }, 5e3);
    this.notifyObservers();
    setTimeout(() => {
      this.instanceDownloadProgress.delete(groupId);
    }, 1e4);
  }
  // Método auxiliar para esperar a que una descarga se complete
  async startDownloadAndWait(downloadId, downloadData) {
    return new Promise((resolve, reject) => {
      window.api.download.onProgress((event, data) => {
        if (data.itemId === downloadId) {
          const download = this.downloads.get(downloadId);
          if (download) {
            download.progress = Math.round(data.progress * 100);
            download.downloadedBytes = Math.round(download.totalBytes * data.progress);
            const elapsedSeconds = (Date.now() - download.startTime) / 1e3;
            if (elapsedSeconds > 0) {
              download.speed = Math.round(download.downloadedBytes / elapsedSeconds);
            }
          }
          this.notifyObservers();
        }
      });
      window.api.download.onComplete((event, data) => {
        if (data.itemId === downloadId) {
          const download = this.downloads.get(downloadId);
          if (download) {
            download.status = "completed";
            download.progress = 100;
            download.endTime = Date.now();
            download.path = data.filePath;
          }
          this.persistDownloads();
          this.notifyObservers();
          resolve();
        }
      });
      window.api.download.onError((event, error) => {
        if (error.itemId === downloadId) {
          const download = this.downloads.get(downloadId);
          if (download) {
            download.status = "error";
            download.endTime = Date.now();
          }
          this.persistDownloads();
          this.notifyObservers();
          reject(new Error(error.message));
        }
      });
      window.api.download.start(downloadData);
    });
  }
  pauseDownload(downloadId) {
    const download = this.downloads.get(downloadId);
    if (download && download.status === "downloading") {
      download.status = "paused";
      this.notifyObservers();
    }
  }
  resumeDownload(downloadId) {
    const download = this.downloads.get(downloadId);
    if (download && download.status === "paused") {
      this.startDownload(downloadId);
    }
  }
  cancelDownload(downloadId) {
    const download = this.downloads.get(downloadId);
    if (download) {
      download.status = "error";
      download.endTime = Date.now();
      this.persistDownloads();
      this.notifyObservers();
    }
  }
  getDownload(downloadId) {
    return this.downloads.get(downloadId);
  }
  getAllDownloads() {
    return Array.from(this.downloads.values()).filter((d) => this.isOwnedByCurrentProfile(d)).sort((a, b) => b.startTime - a.startTime);
  }
  getActiveDownloads() {
    return Array.from(this.downloads.values()).filter((d) => (d.status === "downloading" || d.status === "paused") && this.isOwnedByCurrentProfile(d)).sort((a, b) => b.startTime - a.startTime);
  }
  getCompletedDownloads() {
    return Array.from(this.downloads.values()).filter((d) => d.status === "completed" && this.isOwnedByCurrentProfile(d)).sort((a, b) => (b.endTime || 0) - (a.endTime || 0));
  }
  clearCompleted() {
    const current = this.getCurrentProfileUsername();
    const entries = Array.from(this.downloads.entries());
    for (const [id, download] of entries) {
      if (download.status === "completed" && (!current || download.profileUsername === current || !download.profileUsername)) {
        this.downloads.delete(id);
      }
    }
    this.persistDownloads();
    this.notifyObservers();
  }
  clearErrors() {
    const current = this.getCurrentProfileUsername();
    const entries = Array.from(this.downloads.entries());
    for (const [id, download] of entries) {
      if (download.status === "error" && (!current || download.profileUsername === current || !download.profileUsername)) {
        this.downloads.delete(id);
      }
    }
    this.persistDownloads();
    this.notifyObservers();
  }
  clearCompletedAndErrors() {
    const current = this.getCurrentProfileUsername();
    const entries = Array.from(this.downloads.entries());
    for (const [id, download] of entries) {
      if ((download.status === "completed" || download.status === "error") && (!current || download.profileUsername === current || !download.profileUsername)) {
        this.downloads.delete(id);
      }
    }
    this.persistDownloads();
    this.notifyObservers();
  }
  removeFromHistory(downloadId) {
    if (this.downloads.has(downloadId)) {
      this.downloads.delete(downloadId);
      this.persistDownloads();
      this.notifyObservers();
    }
  }
  // Método especial para descargar Java desde Adoptium API
  async downloadJavaFromAdoptium(javaVersion, osFamily, arch) {
    const apiUrl = `https://api.adoptium.net/v3/binary/latest/${javaVersion}/ga/jdk/temurin/${osFamily}/${arch}/normal/hotspot/jdk`;
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Error al obtener la URL de descarga: ${response.status}`);
      }
      const downloadInfo = await response.json();
      const downloadUrl = downloadInfo.uri || downloadInfo.binary.link;
      const download = this.downloadFile(
        downloadUrl,
        `java-${javaVersion}-${osFamily}-${arch}.zip`,
        `Java ${javaVersion} (${osFamily}/${arch})`
      );
      return download;
    } catch (error) {
      console.error("Error downloading Java from Adoptium:", error);
      const download = this.downloadFile(
        "",
        `java-${javaVersion}-${osFamily}-${arch}.zip`,
        `Error: Java ${javaVersion} (${osFamily}/${arch})`
      );
      download.status = "error";
      this.notifyObservers();
      throw error;
    }
  }
}
const downloadService = new DownloadService();
export {
  downloadService as d
};
