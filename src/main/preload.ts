import { contextBridge, ipcRenderer } from 'electron';

// Exponer API de forma segura
contextBridge.exposeInMainWorld('api', {
  // Métodos de búsqueda
  modrinth: {
    search: (options: { contentType: string; search: string }) => {
      console.log('Buscando en Modrinth:', options);
      return ipcRenderer.invoke('modrinth:search', options);
    },
    getCompatibleVersions: (payload: { projectId: string, mcVersion: string, loader?: string }) =>
      ipcRenderer.invoke('modrinth:get-compatible-versions', payload)
  },

  // Métodos de descarga
  download: {
    start: (data: { url: string; filename: string; itemId: string }) =>
      ipcRenderer.send('download:start', data),
    onProgress: (callback: (event: any, data: any) => void) => {
      ipcRenderer.on('download:progress', callback);
      return () => ipcRenderer.removeListener('download:progress', callback);
    },
    onComplete: (callback: (event: any, data: any) => void) => {
      ipcRenderer.on('download:complete', callback);
      return () => ipcRenderer.removeListener('download:complete', callback);
    },
    onError: (callback: (event: any, error: any) => void) => {
      ipcRenderer.on('download:error', callback);
      return () => ipcRenderer.removeListener('download:error', callback);
    },
    // Método para cancelar descargas
    cancel: (downloadId: string) => ipcRenderer.invoke('download:cancel', downloadId),
    cancelAll: () => ipcRenderer.invoke('download:cancelAll')
  },

  // Otros métodos necesarios (mantén solo los que necesites)
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (s: unknown) => ipcRenderer.invoke('settings:set', s)
  },

  // API de instancias
  instances: {
    list: () => ipcRenderer.invoke('instances:list'),
    create: (p: unknown) => ipcRenderer.invoke('instances:create', p),
    update: (p: unknown) => ipcRenderer.invoke('instances:update', p),
    delete: (id: string) => ipcRenderer.invoke('instances:delete', id),
    openFolder: (id: string) => ipcRenderer.invoke('instances:openFolder', id),
    installContent: (payload: unknown) => ipcRenderer.invoke('instance:install-content', payload),
    scanAndRegister: () => ipcRenderer.invoke('instances:scan-and-register')
  },

  // API para creación completa de instancias
  instance: {
    createFull: (payload: unknown) => ipcRenderer.invoke('instance:create-full', payload)
  },

  // Otros APIs
  versions: {
    list: () => ipcRenderer.invoke('versions:list')
  },

  logs: {
    getRecent: (count: number) => ipcRenderer.invoke('logs:get-recent', count),
    getByType: (payload: { type: string, count: number }) => ipcRenderer.invoke('logs:get-by-type', payload),
    getStats: () => ipcRenderer.invoke('logs:get-stats')
  },

  progress: {
    getAllStatuses: () => ipcRenderer.invoke('progress:get-all-statuses'),
    getOverall: () => ipcRenderer.invoke('progress:get-overall'),
    getDownloadStatuses: () => ipcRenderer.invoke('progress:get-download-statuses')
  },

  crash: {
    analyze: (p: unknown) => ipcRenderer.invoke('crash:analyze', p),
    list: () => ipcRenderer.invoke('crash:list')
  },

  servers: {
    list: () => ipcRenderer.invoke('servers:list'),
    save: (list: unknown) => ipcRenderer.invoke('servers:save', list),
    ping: (ip: string) => ipcRenderer.invoke('servers:ping', ip)
  },

  game: {
    launch: (p: { instanceId: string, userProfile?: any }) => ipcRenderer.invoke('game:launch', p)
  },

  java: {
    getAll: () => ipcRenderer.invoke('java:get-all'),
    detect: () => ipcRenderer.invoke('java:detect'),
    getJavaForMinecraftVersion: (version: string) => ipcRenderer.invoke('java:getJavaForMinecraftVersion', version)
  },

  // API de diálogo del sistema
  dialog: {
    showOpenDialog: (options: any) => ipcRenderer.invoke('dialog:showOpenDialog', options)
  }
});

// Declaración de tipos para TypeScript
declare global {
  interface Window {
    api: {
      modrinth: {
        search: (options: { contentType: string; search: string }) => Promise<any[]>;
        getCompatibleVersions: (payload: { projectId: string, mcVersion: string, loader?: string }) => Promise<any[]>;
      };
      download: {
        start: (data: { url: string; filename: string; itemId: string }) => void;
        onProgress: (callback: (event: any, data: any) => void) => () => void;
        onComplete: (callback: (event: any, data: any) => void) => () => void;
        onError: (callback: (event: any, error: any) => void) => () => void;
      };
      settings: {
        get: () => Promise<any>;
        set: (s: unknown) => Promise<any>;
      };
      instances: {
        list: () => Promise<any>;
        create: (p: unknown) => Promise<any>;
        update: (p: unknown) => Promise<any>;
        delete: (id: string) => Promise<any>;
        openFolder: (id: string) => Promise<any>;
        installContent: (payload: unknown) => Promise<any>;
        scanAndRegister: () => Promise<any>;
      };
      instance: {
        createFull: (payload: { name: string; version: string; loader?: any; javaVersion?: string; maxMemory?: number; minMemory?: number; jvmArgs?: string[] }) => Promise<any>;
      };
      versions: {
        list: () => Promise<any>;
      };
      logs: {
        getRecent: (count: number) => Promise<any[]>;
        getByType: (payload: { type: string, count: number }) => Promise<any[]>;
        getStats: () => Promise<any>;
      };
      progress: {
        getAllStatuses: () => Promise<any[]>;
        getOverall: () => Promise<any>;
        getDownloadStatuses: () => Promise<any[]>;
      };
      crash: {
        analyze: (p: unknown) => Promise<any>;
        list: () => Promise<any>;
      };
      servers: {
        list: () => Promise<any>;
        save: (list: unknown) => Promise<any>;
        ping: (ip: string) => Promise<any>;
      };
      game: {
        launch: (p: { instanceId: string, userProfile?: any }) => Promise<any>;
      };
      java: {
        getAll: () => Promise<any[]>;
        detect: () => Promise<any[]>;
        getJavaForMinecraftVersion: (version: string) => Promise<string>;
      };
      dialog: {
        showOpenDialog: (options: any) => Promise<any>;
      };
    };
  }
}
