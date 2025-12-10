import fetch from 'node-fetch';

// API Key provided by the user
const CURSEFORGE_API_KEY = '$2a$10$8qrneNohy/pV0jJKZVbUuu.kXuDwlRmfhnf4o.7VGEN/bEjXTOPWC';
const CURSEFORGE_API_URL = 'https://api.curseforge.com/v1';

// Define types for CurseForge content
interface CurseForgeMod {
  id: number;
  name: string;
  summary: string;
  authors: { name: string }[];
  downloadCount: number;
  dateModified: string;
  gameVersionLatestFiles: { gameVersion: string }[];
  categories: { name: string }[];
  logo: { thumbnailUrl: string };
  links: { websiteUrl: string };
  latestFiles: { fileName: string; downloadUrl?: string }[];
}

interface CurseForgeSearchResponse {
  data: {
    data: CurseForgeMod[];
  };
}

// Map our content types to CurseForge category IDs
const curseForgeCategoryIds: { [key: string]: number } = {
  modpacks: 4471,  // Modpacks
  mods: 6,          // Minecraft Mods
  resourcepacks: 12, // Resource Packs
  datapacks: 5269,   // Data Packs
  shaders: 6552      // Shaders
};

// Map our content types to their display names
const contentTypeNames: { [key: string]: string } = {
  modpacks: 'Modpacks',
  mods: 'Mods',
  resourcepacks: 'Resource Packs',
  datapacks: 'Data Packs',
  shaders: 'Shaders'
};

export class CurseForgeService {
  private headers = {
    'X-API-Key': CURSEFORGE_API_KEY,
    'Content-Type': 'application/json',
    'User-Agent': 'DRK-Launcher/1.0 (contacto@drklauncher.com)'
  };

  async searchContent(contentType: string, search: string = ''): Promise<any[]> {
    try {
      // Get the category ID for the content type
      const categoryId = curseForgeCategoryIds[contentType];
      if (!categoryId) {
        console.error('Invalid content type for CurseForge:', contentType);
        return [];
      }

      // Fetch multiple pages concurrently to get more results (up to 1000 total) with reliable page size
      const PAGE_SIZE = 50; // Use page size that works reliably with CurseForge API
      const maxResults = 1000; // Maximum results to fetch

      // Calculate how many requests we'll need
      const numRequests = Math.min(20, Math.ceil(maxResults / PAGE_SIZE)); // Maximum of 20 requests for 1000 results

      // Create all request promises
      const requests = [];
      for (let i = 0; i < numRequests; i++) {
        const index = i * PAGE_SIZE;
        const params = new URLSearchParams({
          gameId: '432', // Minecraft game ID for CurseForge API
          classId: categoryId.toString(),
          searchFilter: search || '',
          sortField: search ? '2' : '3', // Sort by relevance if searching, otherwise by download count
          sortOrder: 'desc', // Descending order as string
          index: index.toString(),
          pageSize: PAGE_SIZE.toString()
        });

        const url = `${CURSEFORGE_API_URL}/mods/search?${params}`;
        console.log(`Preparando solicitud CurseForge ${i + 1}:`, url);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        requests.push(
          fetch(url, {
            method: 'GET',
            headers: this.headers,
            signal: controller.signal
          })
        );
      }

      // Execute all requests concurrently
      const responses = await Promise.all(requests);

      // Process all responses
      const allResults: any[] = [];
      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`Error fetching from CurseForge (request ${i + 1}): ${response.status} ${response.statusText}`, errorBody);
          continue; // Continue with other responses
        }

        const json: any = await response.json();
        console.log(`Respuesta de CurseForge solicitud ${i + 1}:`, json);

        // Process the response
        let pageItems: any[] = [];
        if (json && json.data && Array.isArray(json.data)) {
          pageItems = json.data;
        } else if (json && json.data && json.data.data && Array.isArray(json.data.data)) {
          pageItems = json.data.data;
        } else if (Array.isArray(json)) {
          pageItems = json;
        }

        if (pageItems.length === 0) {
          break; // No more results
        }

        allResults.push(...pageItems);

        if (pageItems.length < PAGE_SIZE) {
          break; // Last page
        }
      }

      // Limit to maxResults if needed
      const finalResults = allResults.slice(0, maxResults);

      return finalResults.map(item => ({
        id: item.id ? item.id.toString() : Math.random().toString(36).substr(2, 9), // Convert to string to match our existing format
        title: item.name || item.title || 'Unknown Title',
        description: item.summary || item.description || 'No description available',
        author: (item.authors && item.authors.length > 0) ? item.authors[0].name : item.author || 'Unknown',
        downloads: item.downloadCount || item.downloads || 0,
        lastUpdated: item.dateModified || item.lastUpdated || new Date().toISOString(),
        minecraftVersions: (item.gameVersionLatestFiles ? item.gameVersionLatestFiles.map((f: any) => f.gameVersion) :
                          item.gameVersions ? item.gameVersions : []),
        categories: (item.categories ? item.categories.map((c: any) => c.name) :
                    item.categorySection?.name ? [item.categorySection.name] : []),
        imageUrl: this.getBestImageUrl(item), // Use a dedicated method to get the best image
        type: contentType as 'modpacks' | 'mods' | 'resourcepacks' | 'datapacks' | 'shaders',
        version: (item.latestFiles && item.latestFiles.length > 0) ? item.latestFiles[0].fileName || item.version :
                  item.file?.fileName || item.version || 'N/A',
        downloadUrl: (item.latestFiles && item.latestFiles.length > 0) ? item.latestFiles[0].downloadUrl :
                   item.downloadUrl || undefined
      }));
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('CurseForge request timed out:', error);
        throw new Error('CurseForge request timed out');
      }
      console.error('Error fetching content from CurseForge:', error);
      return []; // Return empty array in case of error
    }
  }

  // Method to get the best available image URL
  private getBestImageUrl(item: any): string {
    // Check multiple possible image properties in order of preference
    const imageUrl =
      item.logo?.url ||
      item.logo?.thumbnailUrl ||
      item.logo?.imageUrl ||
      item.primaryScreenshot?.url ||
      (item.screenshots && item.screenshots.length > 0 ? item.screenshots[0]?.url : null) ||
      item.thumbnailUrl ||
      item.thumbnail?.url ||
      item.imageUrl ||
      'https://via.placeholder.com/400x200';

    return imageUrl;
  }

  // Get compatible versions for a specific project
  async getCompatibleVersions(projectId: string, mcVersion: string, loader?: string) {
    try {
      const response = await fetch(`${CURSEFORGE_API_URL}/mods/${projectId}/files`, {
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`Error fetching files for project ${projectId}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('CurseForge files response FULL:', JSON.stringify(data, null, 2));  // Log más detallado
      console.log('CurseForge files structure keys:', Object.keys(data));
      if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
        console.log('CurseForge first file example:', JSON.stringify(data.data[0], null, 2));
      }

      // Procesar la respuesta para extraer información de compatibilidad
      // CurseForge retorna información sobre archivos que incluye versiones de juego y loaders
      if (data && data.data && Array.isArray(data.data)) {
        // Extraer versiones de Minecraft y loaders de los archivos disponibles
        const compatibilityInfo: any[] = [];

        console.log(`CurseForge: Procesando ${data.data.length} archivos...`);
        data.data.forEach((file: any, index: number) => {
          if (index < 3) { // Solo mostrar información de los primeros 3 archivos para no saturar
            console.log(`CurseForge: Archivo ${index + 1} - Keys:`, Object.keys(file));
            console.log(`CurseForge: Archivo ${index + 1} - Ejemplo de props importantes:`, {
              fileName: file.fileName || file.displayName,
              gameVersions: file.gameVersions,
              modLoader: file.modLoader,
              modLoaders: file.modLoaders,
              categories: file.categories,
              dependencies: file.dependencies
            });
          }
          if (file.gameVersions && Array.isArray(file.gameVersions)) {
            // Extraer información del modloader - puede estar en varias propiedades
            let modLoaderType = null;
            if (file.modLoader) {
              modLoaderType = file.modLoader;
            } else if (file.modLoaders && Array.isArray(file.modLoaders) && file.modLoaders.length > 0) {
              modLoaderType = file.modLoaders[0]; // Tomar el primer loader disponible
            } else if (file.fileFingerprint && typeof file.fileFingerprint === 'object' && file.fileFingerprint.modLoader) {
              modLoaderType = file.fileFingerprint.modLoader;
            } else if (file.dependencies && Array.isArray(file.dependencies)) {
              // Buscar información de loader en dependencias
              const loaderDep = file.dependencies.find((dep: any) =>
                dep.type === 1 && (dep.slug.includes('forge') || dep.slug.includes('fabric') || dep.slug.includes('quilt'))
              );
              if (loaderDep) {
                if (loaderDep.slug.includes('forge')) modLoaderType = 'forge';
                else if (loaderDep.slug.includes('fabric')) modLoaderType = 'fabric';
                else if (loaderDep.slug.includes('quilt')) modLoaderType = 'quilt';
              }
            }

            // Extraer información del modloader - en CurseForge está mezclada con las versiones de juego
            // Separar loaders de versiones de juego (ej. ['Fabric', '1.20.1'] -> loader='Fabric', versiones=['1.20.1'])
            let extractedModLoader = null;
            const gameVersionList: string[] = [];

            file.gameVersions.forEach((versionOrLoader: string) => {
              // Verificar si es un loader identificable
              const lowerVersion = versionOrLoader.toLowerCase();
              if (lowerVersion.includes('forge') || lowerVersion.includes('fabric') ||
                  lowerVersion.includes('quilt') || lowerVersion.includes('neoforge')) {
                // Este es un loader
                if (lowerVersion.includes('forge') && !lowerVersion.includes('neo')) {
                  extractedModLoader = 'forge';
                } else if (lowerVersion.includes('fabric')) {
                  extractedModLoader = 'fabric';
                } else if (lowerVersion.includes('quilt')) {
                  extractedModLoader = 'quilt';
                } else if (lowerVersion.includes('neoforge') || lowerVersion.includes('neo-forge')) {
                  extractedModLoader = 'neoforge';
                }
              } else if (versionOrLoader.startsWith('1.')) {
                // Esto es una versión de juego de Minecraft
                gameVersionList.push(versionOrLoader);
              }
            });

            // Si no encontramos loader en gameVersions y no hay loader definido previamente, usar modLoaderType como fallback
            if (!extractedModLoader && modLoaderType) {
              const loaderLower = modLoaderType.toLowerCase();
              if (loaderLower.includes('forge') && !loaderLower.includes('neo')) {
                extractedModLoader = 'forge';
              } else if (loaderLower.includes('fabric')) {
                extractedModLoader = 'fabric';
              } else if (loaderLower.includes('quilt')) {
                extractedModLoader = 'quilt';
              } else if (loaderLower.includes('neoforge') || loaderLower.includes('neo-forge')) {
                extractedModLoader = 'neoforge';
              }
            }

            // Procesar cada versión de juego encontrada
            gameVersionList.forEach((version: string) => {
              // Solo incluir versiones válidas de Minecraft
              if (version.startsWith('1.')) {
                compatibilityInfo.push({
                  gameVersion: version,
                  modLoader: extractedModLoader, // Usar el loader extraído directamente del array gameVersions
                  fileName: file.fileName || file.displayName || null,
                  downloadUrl: file.downloadUrl || file.downloadUrl || null
                });
              }
            });
          }
        });

        return compatibilityInfo;
      }

      return [];
    } catch (error) {
      console.error(`Error getting compatible versions for project ${projectId}:`, error);
      return [];
    }
  }
}

export const curseforgeService = new CurseForgeService();