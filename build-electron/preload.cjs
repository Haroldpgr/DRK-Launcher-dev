// src/main/preload.ts
var import_electron = require("electron");
import_electron.contextBridge.exposeInMainWorld("api", {
  // Métodos de búsqueda
  modrinth: {
    search: (options) => {
      console.log("Buscando en Modrinth:", options);
      return import_electron.ipcRenderer.invoke("modrinth:search", options);
    },
    getCompatibleVersions: (payload) => import_electron.ipcRenderer.invoke("modrinth:get-compatible-versions", payload)
  },
  // Métodos de descarga
  download: {
    start: (data) => import_electron.ipcRenderer.send("download:start", data),
    onProgress: (callback) => {
      import_electron.ipcRenderer.on("download:progress", callback);
      return () => import_electron.ipcRenderer.removeListener("download:progress", callback);
    },
    onComplete: (callback) => {
      import_electron.ipcRenderer.on("download:complete", callback);
      return () => import_electron.ipcRenderer.removeListener("download:complete", callback);
    },
    onError: (callback) => {
      import_electron.ipcRenderer.on("download:error", callback);
      return () => import_electron.ipcRenderer.removeListener("download:error", callback);
    },
    // Método para cancelar descargas
    cancel: (downloadId) => import_electron.ipcRenderer.invoke("download:cancel", downloadId),
    cancelAll: () => import_electron.ipcRenderer.invoke("download:cancelAll")
  },
  // Otros métodos necesarios (mantén solo los que necesites)
  settings: {
    get: () => import_electron.ipcRenderer.invoke("settings:get"),
    set: (s) => import_electron.ipcRenderer.invoke("settings:set", s)
  },
  // API de instancias
  instances: {
    list: () => import_electron.ipcRenderer.invoke("instances:list"),
    create: (p) => import_electron.ipcRenderer.invoke("instances:create", p),
    update: (p) => import_electron.ipcRenderer.invoke("instances:update", p),
    delete: (id) => import_electron.ipcRenderer.invoke("instances:delete", id),
    openFolder: (id) => import_electron.ipcRenderer.invoke("instances:openFolder", id),
    installContent: (payload) => import_electron.ipcRenderer.invoke("instance:install-content", payload),
    scanAndRegister: () => import_electron.ipcRenderer.invoke("instances:scan-and-register")
  },
  // API para creación completa de instancias
  instance: {
    createFull: (payload) => import_electron.ipcRenderer.invoke("instance:create-full", payload)
  },
  // Otros APIs
  versions: {
    list: () => import_electron.ipcRenderer.invoke("versions:list")
  },
  logs: {
    getRecent: (count) => import_electron.ipcRenderer.invoke("logs:get-recent", count),
    getByType: (payload) => import_electron.ipcRenderer.invoke("logs:get-by-type", payload),
    getStats: () => import_electron.ipcRenderer.invoke("logs:get-stats")
  },
  progress: {
    getAllStatuses: () => import_electron.ipcRenderer.invoke("progress:get-all-statuses"),
    getOverall: () => import_electron.ipcRenderer.invoke("progress:get-overall"),
    getDownloadStatuses: () => import_electron.ipcRenderer.invoke("progress:get-download-statuses")
  },
  crash: {
    analyze: (p) => import_electron.ipcRenderer.invoke("crash:analyze", p),
    list: () => import_electron.ipcRenderer.invoke("crash:list")
  },
  servers: {
    list: () => import_electron.ipcRenderer.invoke("servers:list"),
    save: (list) => import_electron.ipcRenderer.invoke("servers:save", list),
    ping: (ip) => import_electron.ipcRenderer.invoke("servers:ping", ip)
  },
  game: {
    launch: (p) => import_electron.ipcRenderer.invoke("game:launch", p)
  },
  java: {
    getAll: () => import_electron.ipcRenderer.invoke("java:get-all"),
    detect: () => import_electron.ipcRenderer.invoke("java:detect")
  },
  // API de diálogo del sistema
  dialog: {
    showOpenDialog: (options) => import_electron.ipcRenderer.invoke("dialog:showOpenDialog", options)
  }
});
//# sourceMappingURL=preload.cjs.map
