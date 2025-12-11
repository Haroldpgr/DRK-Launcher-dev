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
  // Retorna estructura similar a Modrinth para compatibilidad
  // NO filtra por mcVersion ni loader - devuelve TODAS las versiones disponibles
  // El filtrado lo hace ContentPage igual que con Modrinth
  async getCompatibleVersions(projectId: string, mcVersion: string, loader?: string) {
    try {
      const response = await fetch(`${CURSEFORGE_API_URL}/mods/${projectId}/files`, {
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`Error fetching files for project ${projectId}: ${response.statusText}`);
      }

      const data = await response.json();

      // Procesar la respuesta para extraer información de compatibilidad
      // Retornar estructura similar a Modrinth: objetos con game_versions (array) y loaders (array)
      // NO filtrar aquí - devolver TODAS las versiones y loaders disponibles
      if (data && data.data && Array.isArray(data.data)) {
        const compatibilityInfo: any[] = [];

        console.log(`CurseForge: Procesando ${data.data.length} archivos...`);
        
        data.data.forEach((file: any) => {
          if (!file.gameVersions || !Array.isArray(file.gameVersions)) {
            return;
          }

          // Extraer información del modloader desde gameVersionTypeIds (más confiable)
          let extractedModLoader: string | null = null;
          
          if (file.gameVersionTypeIds && Array.isArray(file.gameVersionTypeIds) && file.gameVersionTypeIds.length > 0) {
            const loaderTypeMap: Record<number, string> = {
              1: 'forge',
              4: 'fabric',
              5: 'quilt',
              6: 'neoforge'
            };
            
            for (const typeId of file.gameVersionTypeIds) {
              if (loaderTypeMap[typeId]) {
                extractedModLoader = loaderTypeMap[typeId];
                break;
              }
            }
          }
          
          // Si no se encontró en gameVersionTypeIds, intentar otras propiedades
          if (!extractedModLoader) {
            if (file.modLoader) {
              const loaderLower = file.modLoader.toLowerCase();
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
          }

          // Extraer versiones de juego del array gameVersions
          const gameVersionList: string[] = [];
          file.gameVersions.forEach((versionOrLoader: string) => {
            // Si es una versión de Minecraft (empieza con "1.")
            if (typeof versionOrLoader === 'string' && versionOrLoader.startsWith('1.')) {
              gameVersionList.push(versionOrLoader);
            }
            // Si es un loader en el array (puede estar mezclado)
            else if (typeof versionOrLoader === 'string') {
              const lower = versionOrLoader.toLowerCase();
              if (lower.includes('forge') && !lower.includes('neo') && !extractedModLoader) {
                extractedModLoader = 'forge';
              } else if (lower.includes('fabric') && !extractedModLoader) {
                extractedModLoader = 'fabric';
              } else if (lower.includes('quilt') && !extractedModLoader) {
                extractedModLoader = 'quilt';
              } else if ((lower.includes('neoforge') || lower.includes('neo-forge')) && !extractedModLoader) {
                extractedModLoader = 'neoforge';
              }
            }
          });

          // Si no hay loader extraído, intentar usar el loader por defecto o saltar este archivo
          if (!extractedModLoader) {
            // Algunos archivos pueden no tener loader explícito, pero podemos intentar inferirlo
            // Por ahora, saltamos estos archivos para evitar datos incorrectos
            return;
          }

          // Procesar cada versión de juego encontrada - NO FILTRAR AQUÍ
          // Devolver TODAS las versiones y loaders disponibles
          gameVersionList.forEach((version: string) => {
            // Solo incluir versiones válidas de Minecraft (empiezan con "1.")
            if (version.startsWith('1.')) {
              // Crear un objeto por cada combinación versión-loader, igual que Modrinth
              compatibilityInfo.push({
                game_versions: [version], // Array como Modrinth
                loaders: [extractedModLoader!], // Array como Modrinth
                gameVersion: version, // Mantener para compatibilidad
                modLoader: extractedModLoader! // Mantener para compatibilidad
              });
            }
          });
        });

        // Ordenar por versión de juego (más reciente primero) - simular comportamiento de Modrinth
        return compatibilityInfo.sort((a, b) => {
          const aParts = a.game_versions[0].split('.').map(Number);
          const bParts = b.game_versions[0].split('.').map(Number);
          for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
            if (aParts[i] !== bParts[i]) {
              return bParts[i] - aParts[i]; // Orden descendente
            }
          }
          return bParts.length - aParts.length;
        });
      }

      return [];
    } catch (error) {
      console.error(`Error getting compatible versions for project ${projectId}:`, error);
      return [];
    }
  }

  /**
   * Descarga contenido de CurseForge a una instancia
   */
  async downloadContent(
    projectId: string,
    instancePath: string,
    mcVersion: string,
    loader?: string,
    contentType: 'mod' | 'resourcepack' | 'shader' | 'datapack' = 'mod'
  ): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');
    const https = await import('https');
    const http = await import('http');

    try {
      // Obtener versiones compatibles
      const compatibleVersions = await this.getCompatibleVersions(projectId, mcVersion, loader);
      
      if (compatibleVersions.length === 0) {
        throw new Error(`No se encontró una versión compatible para ${mcVersion} y ${loader || 'cualquier loader'}`);
      }

      // Tomar la primera versión compatible (la más reciente)
      const targetVersion = compatibleVersions[0];
      
      // Obtener URL de descarga
      let downloadUrl = targetVersion.downloadUrl;
      if (!downloadUrl && (targetVersion as any).fileId) {
        // Construir URL de descarga usando el ID del archivo si no está disponible
        const fileId = (targetVersion as any).fileId;
        const fileName = targetVersion.fileName || `curseforge-${projectId}.jar`;
        downloadUrl = `https://edge.forgecdn.net/files/${Math.floor(fileId / 1000)}/${fileId % 1000}/${fileName}`;
      }
      
      if (!downloadUrl) {
        throw new Error(`No se encontró URL de descarga para la versión compatible`);
      }

      // Determinar carpeta de destino según tipo de contenido
      let targetDir: string;
      switch (contentType) {
        case 'mod':
          targetDir = path.join(instancePath, 'mods');
          break;
        case 'resourcepack':
          targetDir = path.join(instancePath, 'resourcepacks');
          break;
        case 'shader':
          targetDir = path.join(instancePath, 'shaderpacks');
          break;
        case 'datapack':
          targetDir = path.join(instancePath, 'datapacks');
          break;
        default:
          throw new Error(`Tipo de contenido no soportado: ${contentType}`);
      }

      // Asegurar que el directorio existe
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Obtener nombre del archivo
      const fileName = targetVersion.fileName || `curseforge-${projectId}.jar`;
      const filePath = path.join(targetDir, fileName);

      // Si el archivo ya existe, generar nombre único
      let finalPath = filePath;
      if (fs.existsSync(filePath)) {
        const ext = path.extname(fileName);
        const nameWithoutExt = path.basename(fileName, ext);
        let counter = 1;
        let uniqueFileName;

        do {
          uniqueFileName = `${nameWithoutExt}_${counter}${ext}`;
          finalPath = path.join(targetDir, uniqueFileName);
          counter++;
        } while (fs.existsSync(finalPath));
      }

      // Descargar archivo
      await this.downloadFileToPath(downloadUrl, finalPath);
      console.log(`Descargado ${fileName} en ${targetDir}`);
    } catch (error) {
      console.error(`Error al descargar contenido ${contentType} ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Descarga un archivo desde una URL a una ruta local
   */
  private async downloadFileToPath(url: string, filePath: string): Promise<void> {
    const fs = await import('fs');
    const https = await import('https');
    const http = await import('http');

    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(filePath);
      const protocol = url.startsWith('https') ? https : http;

      protocol.get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          // Seguir redirecciones
          return this.downloadFileToPath(response.headers.location!, filePath)
            .then(resolve)
            .catch(reject);
        }

        if (response.statusCode !== 200) {
          file.close();
          fs.unlinkSync(filePath);
          reject(new Error(`Error al descargar: ${response.statusCode} ${response.statusMessage}`));
          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve();
        });

        file.on('error', (err) => {
          file.close();
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          reject(err);
        });
      }).on('error', (err) => {
        file.close();
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        reject(err);
      });
    });
  }
}

export const curseforgeService = new CurseForgeService();