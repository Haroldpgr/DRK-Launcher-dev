/**
 * Helper para manejar la API de CurseForge
 * Esta API tiene estructura específica de datos que difiere de Modrinth
 */

interface CurseForgeVersion {
  id: number;
  gameId: number;
  modId: number;
  isAvailable: boolean;
  displayName: string;
  fileName: string;
  releaseType: number; // 1: Release, 2: Beta, 3: Alpha
  fileStatus: number;
  hashes: Array<{
    value: string;
    algo: number;
  }>;
  fileDate: string;
  fileLength: number;
  downloadCount: number;
  externalMirrorUrl: string | null;
  downloadUrl: string;
  gameVersion: string; // Versión específica de Minecraft
  sortableGameVersion: Array<{
    gameVersionName: string;
    gameVersionPadded: string;
    gameVersion: string;
    gameVersionReleaseDate: string;
    gameVersionTypeId: number;
  }>;
  dependencies: Array<{
    modId: number;
    relationType: number;
  }>;
  exposedAsAlternative: boolean;
  parentProjectFileId: number | null;
  alternateFileId: number | null;
  isServerPack: boolean;
  serverPackFileId: number | null;
  fileSizeOnDisk: number | null;
  modFileId: number | null;
}

interface CurseForgeModLoader {
  name: string;
  type: string; // Ej. "Forge", "Fabric"
  version: string;
}

interface CurseForgeFileInfo {
  id: number;
  gameId: number;
  modId: number;
  isAvailable: boolean;
  displayName: string;
  fileName: string;
  fileType: number;
  fileStatus: number;
  hashes: Array<{
    value: string;
    algo: number;
  }>;
  fileDate: string;
  fileLength: number;
  releaseType: number;
  fileDescription: string;
  downloadCount: number;
  downloadUrl: string;
  gameVersion: string[];
  sortableGameVersion: Array<{
    gameVersionName: string;
    gameVersionPadded: string;
    gameVersion: string;
    gameVersionReleaseDate: string;
    gameVersionTypeId: number;
  }>;
  dependencies: Array<{
    modId: number;
    relationType: number;
  }>;
  alternateFileId: number | null;
  parentProjectFileId: number | null;
  exposeAsAlternative: boolean;
  isAvailable: boolean;
  serverPackFileId: number | null;
  isServerPack: boolean;
  fileSizeOnDisk: number | null;
  modFileId: number | null;
  modules: Array<{
    name: string;
    fingerprint: number;
  }>;
}

/**
 * Función para extraer información de compatibilidad de CurseForge
 * @param curseForgeResponse - La respuesta de la API de CurseForge
 * @returns Información de versiones y loaders compatibles
 */
export function parseCurseForgeCompatibility(curseForgeResponse: any[]) {
  const gameVersions = new Set<string>();
  const modLoaders = new Set<string>();

  if (Array.isArray(curseForgeResponse)) {
    curseForgeResponse.forEach((version: any) => {
      // Extraer versiones de juego
      if (version.gameVersion) {
        // Puede ser un string o un array
        if (typeof version.gameVersion === 'string') {
          gameVersions.add(version.gameVersion);
        } else if (Array.isArray(version.gameVersion)) {
          version.gameVersion.forEach((gv: string) => gameVersions.add(gv));
        }
      }

      // Extraer versiones desde sortableGameVersion si existe
      if (version.sortableGameVersion && Array.isArray(version.sortableGameVersion)) {
        version.sortableGameVersion.forEach((sgv: any) => {
          if (sgv.gameVersion) {
            gameVersions.add(sgv.gameVersion);
          }
        });
      }

      // Extraer modLoaders
      if (version.modLoaders && Array.isArray(version.modLoaders)) {
        version.modLoaders.forEach((loader: any) => {
          if (typeof loader === 'string') {
            modLoaders.add(loader.toLowerCase());
          } else if (typeof loader === 'object' && loader.name) {
            modLoaders.add(loader.name.toLowerCase());
          } else if (typeof loader === 'object' && loader.type) {
            modLoaders.add(loader.type.toLowerCase());
          }
        });
      } else if (version.modLoader) {
        // Alternativa para loader individual
        if (typeof version.modLoader === 'string') {
          modLoaders.add(version.modLoader.toLowerCase());
        } else if (typeof version.modLoader === 'object') {
          if (version.modLoader.name) {
            modLoaders.add(version.modLoader.name.toLowerCase());
          } else if (version.modLoader.type) {
            modLoaders.add(version.modLoader.type.toLowerCase());
          }
        }
      }
    });
  }

  return {
    gameVersions: Array.from(gameVersions),
    modLoaders: Array.from(modLoaders)
  };
}

/**
 * Función que intenta extraer información de una posible estructura de archivos de CurseForge
 * @param curseForgeResponse - La respuesta de la API de CurseForge
 * @returns Información de versiones y loaders compatibles
 */
export function extractCurseForgeFileInfo(curseForgeResponse: any[]) {
  const gameVersions = new Set<string>();
  const modLoaders = new Set<string>();

  if (Array.isArray(curseForgeResponse)) {
    curseForgeResponse.forEach((file: any) => {
      // Extraer gameVersion de diferentes posibles propiedades
      if (file.gameVersion) {
        if (typeof file.gameVersion === 'string') {
          gameVersions.add(file.gameVersion);
        } else if (Array.isArray(file.gameVersion)) {
          file.gameVersion.forEach((gv: string) => gameVersions.add(gv));
        }
      }

      // Extraer desde sortableGameVersion
      if (file.sortableGameVersion && Array.isArray(file.sortableGameVersion)) {
        file.sortableGameVersion.forEach((sgv: any) => {
          if (sgv.gameVersion) {
            gameVersions.add(sgv.gameVersion);
          }
        });
      }

      // Extraer modLoaders
      if (file.modLoaders && Array.isArray(file.modLoaders)) {
        file.modLoaders.forEach((loader: any) => {
          if (typeof loader === 'string') {
            modLoaders.add(loader.toLowerCase());
          } else if (typeof loader === 'object' && loader.name) {
            modLoaders.add(loader.name.toLowerCase());
          } else if (typeof loader === 'object' && loader.type) {
            modLoaders.add(loader.type.toLowerCase());
          }
        });
      }
    });
  }

  return {
    gameVersions: Array.from(gameVersions),
    modLoaders: Array.from(modLoaders)
  };
}

/**
 * Función que extrae información de compatibilidad de CurseForge a partir de la respuesta de la API
 * @param curseForgeResponse - La respuesta de la API de CurseForge
 * @returns Información de versiones y loaders compatibles
 */
export function extractCurseForgeCompatibilityInfo(curseForgeResponse: any[]) {
  const gameVersions = new Set<string>();
  const modLoaders = new Set<string>();

  if (Array.isArray(curseForgeResponse)) {
    curseForgeResponse.forEach((item: any) => {
      // Extraer versiones de juego - puede venir de diferentes estructuras
      if (item.gameVersion) {
        // Si es un string directo
        if (typeof item.gameVersion === 'string') {
          gameVersions.add(item.gameVersion);
        }
        // Si es un array
        else if (Array.isArray(item.gameVersion)) {
          item.gameVersion.forEach((version: string) => {
            if (typeof version === 'string' && version.startsWith('1.')) {
              gameVersions.add(version);
            }
          });
        }
      }
      
      // También puede estar en gameVersions (array)
      if (item.gameVersions && Array.isArray(item.gameVersions)) {
        item.gameVersions.forEach((version: string) => {
          if (typeof version === 'string' && version.startsWith('1.')) {
            gameVersions.add(version);
          }
        });
      }

      // Extraer modLoaders - puede venir de diferentes estructuras
      if (item.modLoader) {
        // Si es un string directo
        if (typeof item.modLoader === 'string') {
          const loaderLower = item.modLoader.toLowerCase();
          if (loaderLower.includes('forge') && !loaderLower.includes('neo')) {
            modLoaders.add('forge');
          } else if (loaderLower.includes('fabric')) {
            modLoaders.add('fabric');
          } else if (loaderLower.includes('quilt')) {
            modLoaders.add('quilt');
          } else if (loaderLower.includes('neoforge') || loaderLower.includes('neo-forge')) {
            modLoaders.add('neoforge');
          }
        }
        // Si es un objeto
        else if (typeof item.modLoader === 'object') {
          const loaderName = (item.modLoader.name || item.modLoader.type || '').toLowerCase();
          if (loaderName.includes('forge') && !loaderName.includes('neo')) {
            modLoaders.add('forge');
          } else if (loaderName.includes('fabric')) {
            modLoaders.add('fabric');
          } else if (loaderName.includes('quilt')) {
            modLoaders.add('quilt');
          } else if (loaderName.includes('neoforge') || loaderName.includes('neo-forge')) {
            modLoaders.add('neoforge');
          }
        }
      }
      
      // También puede estar en loaders (array)
      if (item.loaders && Array.isArray(item.loaders)) {
        item.loaders.forEach((loader: any) => {
          const loaderStr = typeof loader === 'string' ? loader : (loader.name || loader.type || '');
          const loaderLower = loaderStr.toLowerCase();
          if (loaderLower.includes('forge') && !loaderLower.includes('neo')) {
            modLoaders.add('forge');
          } else if (loaderLower.includes('fabric')) {
            modLoaders.add('fabric');
          } else if (loaderLower.includes('quilt')) {
            modLoaders.add('quilt');
          } else if (loaderLower.includes('neoforge') || loaderLower.includes('neo-forge')) {
            modLoaders.add('neoforge');
          }
        });
      }
    });
  }

  return {
    gameVersions: Array.from(gameVersions).sort((a, b) => {
      // Ordenar versiones de forma descendente
      const aParts = a.split('.').map(Number);
      const bParts = b.split('.').map(Number);
      for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
        if (aParts[i] !== bParts[i]) {
          return bParts[i] - aParts[i];
        }
      }
      return bParts.length - aParts.length;
    }),
    modLoaders: Array.from(modLoaders)
  };
}

// Estas funciones ya no se usan directamente sino solo la función principal que ya creé
// La estructura de datos que devuelve getCompatibleVersions es diferente ahora