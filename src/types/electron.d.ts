export {};

declare global {
  interface Window {
    api: {
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
      };
      versions: {
        list: () => Promise<any>;
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
        launch: (p: unknown) => Promise<any>;
      };
      java: {
        detect: () => Promise<any>;
        explore: () => Promise<any>;
        test: (path: string) => Promise<any>;
        install: (version: string) => Promise<any>;
        getAll: () => Promise<any>;
        getDefault: () => Promise<any>;
        setDefault: (javaId: string) => Promise<any>;
        remove: (javaId: string) => Promise<any>;
        getCompatibility: (minecraftVersion: string) => Promise<any>;
        detectSimple: () => Promise<any>;
      };
      modrinth: {
        search: (options: { contentType: string; search: string }) => Promise<Array<{
          id: string;
          title: string;
          description: string;
          author: string;
          downloads: number;
          lastUpdated: string;
          minecraftVersions: string[];
          categories: string[];
          imageUrl: string;
          type: string;
          version: string;
          downloadUrl: string | null;
        }>>;
      };
      curseforge: {
        search: (options: { contentType: string; search: string }) => Promise<any[]>;
        getCompatibleVersions: (payload: { projectId: string, mcVersion: string, loader?: string }) => Promise<any[]>;
      };
      elyby: {
        verifyUsername: (username: string) => Promise<{ exists: boolean; user: { id: string; name: string } | null }>;
        authenticate: (username: string, password: string, totpToken?: string) => Promise<{ success: boolean; requires2FA?: boolean; accessToken?: string; clientToken?: string; selectedProfile?: { id: string; name: string }; availableProfiles?: Array<{ id: string; name: string }>; user?: any; error?: string }>;
        startOAuth: () => Promise<{ success: boolean; accessToken?: string; refreshToken?: string; expiresIn?: number; tokenType?: string; selectedProfile?: { id: string; name: string }; user?: any; error?: string }>;
      };
      littleskin: {
        startOAuth: () => Promise<{ success: boolean; accessToken?: string; refreshToken?: string; expiresIn?: number; tokenType?: string; selectedProfile?: { id: string; name: string }; user?: any; error?: string }>;
      };
      yggdrasil: {
        authenticate: (username: string, password: string) => Promise<{ success: boolean; accessToken?: string; clientToken?: string; selectedProfile?: { id: string; name: string }; availableProfiles?: Array<{ id: string; name: string }>; user?: any; error?: string }>;
        refresh: (accessToken: string, clientToken: string) => Promise<{ success: boolean; accessToken?: string; clientToken?: string; selectedProfile?: { id: string; name: string }; user?: any; error?: string }>;
        validate: (accessToken: string) => Promise<{ success: boolean; isValid: boolean; error?: string }>;
      };
      drkauth: {
        authenticate: (username: string, password: string) => Promise<{ success: boolean; accessToken?: string; clientToken?: string; selectedProfile?: { id: string; name: string }; availableProfiles?: Array<{ id: string; name: string }>; user?: any; error?: string }>;
        refresh: (accessToken: string, clientToken: string) => Promise<{ success: boolean; accessToken?: string; clientToken?: string; selectedProfile?: { id: string; name: string }; user?: any; error?: string }>;
        validate: (accessToken: string) => Promise<{ success: boolean; isValid: boolean; error?: string }>;
      };
      download: {
        start: (data: { url: string; filename: string; itemId: string }) => void;
        onProgress: (callback: (event: any, data: { itemId: string; progress: number }) => void) => void;
        onComplete: (callback: (event: any, data: { itemId: string; filePath: string }) => void) => void;
        onError: (callback: (event: any, error: { itemId: string; message: string }) => void) => void;
      };
      modpack: {
        createTemporary: (originalPath: string) => Promise<string>;
        getTemporary: (id: string) => Promise<any>;
      };
      modpackImport: {
        analyzeFile: (filePath: string) => Promise<any>;
        analyzeUrl: (url: string) => Promise<any>;
        extractAndInstall: (sourcePath: string, targetPath: string) => Promise<void>;
        downloadModpackFromModrinth: (projectId: string, targetPath: string, mcVersion: string, loader: string) => Promise<void>;
        downloadAndExtractFromUrl: (url: string, targetPath: string, onProgress?: (progress: number) => void) => Promise<void>;
        importAndCreateInstance: (source: string, metadata: any) => Promise<any>;
        saveTemporaryFile: (bufferArray: number[], fileName: string) => Promise<string>;
      };
      dialog: {
        showOpenDialog: (options: any) => Promise<any>;
      };
      shell: {
        showItemInFolder: (filePath: string) => Promise<boolean>;
        openPath: (folderPath: string) => Promise<boolean>;
        openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;
      };
      app: {
        getVersion: () => Promise<string>;
        getName: () => Promise<string>;
      };
      os: {
        platform: () => Promise<string>;
        arch: () => Promise<string>;
        release: () => Promise<string>;
      };
      feedback: {
        send: (data: { to: string; subject: string; body: string; type: string; userEmail?: string }) => Promise<{ success: boolean; error?: string; messageId?: string }>;
      };
      updater: {
        check: () => Promise<{ success: boolean; error?: string }>;
        getVersion: () => Promise<{ currentVersion: string; updateAvailable: boolean; pendingUpdate?: any; isDownloading?: boolean; downloadProgress?: any }>;
        getPending: () => Promise<{ available: boolean; version?: string; releaseDate?: string; releaseNotes?: string; changes?: string[] }>;
        download: () => Promise<{ success: boolean; error?: string }>;
        later: () => Promise<{ success: boolean; error?: string }>;
        install: () => Promise<{ success: boolean; error?: string }>;
        checkInternet: () => Promise<{ hasInternet: boolean }>;
        onStatus: (callback: (event: any, data: any) => void) => () => void;
      };
    };
  }
}
