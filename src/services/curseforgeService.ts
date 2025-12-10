import path from 'node:path';
import fs from 'node:fs';
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

  // Download content to an instance
  async downloadContent(
    projectId: string,
    instancePath: string,
    mcVersion: string,
    loader?: string,
    contentType?: string,
    versionId?: string
  ): Promise<void> {
    try {
      // Handle modpacks differently from other content types
      if (contentType === 'modpacks' || contentType === 'modpack') {
        await this.downloadModpack(projectId, instancePath, mcVersion, loader, versionId);
      } else {
        await this.downloadRegularContent(projectId, instancePath, mcVersion, loader, contentType, versionId);
      }
    } catch (error) {
      console.error(`Error downloading content ${projectId} from CurseForge:`, error);
      throw error;
    }
  }

  // Download regular content (mods, resourcepacks, etc.) to an instance
  private async downloadRegularContent(
    projectId: string,
    instancePath: string,
    mcVersion: string,
    loader?: string,
    contentType?: string,
    versionId?: string
  ): Promise<void> {
    // First, get the available files for this project
    const filesResponse = await fetch(`${CURSEFORGE_API_URL}/mods/${projectId}/files`, {
      headers: this.headers
    });

    if (!filesResponse.ok) {
      throw new Error(`Error fetching files for project ${projectId}: ${filesResponse.statusText}`);
    }

    const data = await filesResponse.json();

    if (!data || !data.data || !Array.isArray(data.data)) {
      throw new Error(`Invalid response format for project ${projectId}`);
    }

    // Find the appropriate file based on criteria
    let targetFile = null;

    if (versionId) {
      // If a specific version ID was provided, find that file
      console.log(`Buscando archivo específico con ID: ${versionId} para el proyecto: ${projectId}`);
      targetFile = data.data.find((file: any) => file.id.toString() === versionId);

      if (!targetFile) {
        // Si no se encuentra el archivo con el ID exacto, lanzar error para que el usuario sepa que la versión no existe
        throw new Error(`No se encontró la versión específica con ID ${versionId} para el proyecto ${projectId}. Posibles IDs disponibles: ${data.data.slice(0, 5).map((f: any) => f.id).join(', ')}`);
      } else {
        console.log(`Archivo encontrado con ID: ${targetFile.id}, Nombre: ${targetFile.fileName || targetFile.displayName}`);
      }
    } else {
      // Si no se especificó una versión exacta, buscar la versión más compatible
      // El problema es que el launcher está usando la versión de la instancia (1.20.1)
      // en lugar de buscar la versión más reciente compatible con la versión objetivo
      console.log(`Buscando archivo compatible para proyecto: ${projectId}, MC version: ${mcVersion}, loader: ${loader}`);

      // Lo ideal sería que el frontend pasara la versión objetivo de Minecraft, no solo la de la instancia
      // Por ahora, intentamos buscar versiones más recientes o específicas

      // Primero, intentar encontrar un archivo que contenga información de la versión más alta de Minecraft
      let targetFile = null;

      // Filtrar archivos que tengan información de versión de Minecraft
      const filesWithMCVersion = data.data.filter((file: any) =>
        file.gameVersions && Array.isArray(file.gameVersions) &&
        file.gameVersions.some((v: string) => v.startsWith('1.'))
      );

      // Si hay archivos con versiones de Minecraft, ordenarlos por versión de MC (de forma descendente)
      if (filesWithMCVersion.length > 0) {
        // Obtener la versión más alta de Minecraft disponible
        const sortedByVersion = filesWithMCVersion.sort((a, b) => {
          // Extraer versiones de Minecraft de cada archivo
          const aVersions = a.gameVersions.filter((v: string) => v.startsWith('1.'));
          const bVersions = b.gameVersions.filter((v: string) => v.startsWith('1.'));

          if (aVersions.length === 0 && bVersions.length === 0) return 0;
          if (aVersions.length === 0) return 1;
          if (bVersions.length === 0) return -1;

          // Comparar las versiones de Minecraft (ordenadas de mayor a menor)
          const aMaxVersion = this.extractVersionNumber(aVersions[0]); // Tomamos la primera, que suele ser la más importante
          const bMaxVersion = this.extractVersionNumber(bVersions[0]);

          return bMaxVersion - aMaxVersion; // Mayor versión primero
        });

        targetFile = sortedByVersion[0];
        console.log(`Archivo seleccionado basado en versión más reciente de Minecraft: ID ${targetFile.id}, Nombre: ${targetFile.fileName || targetFile.displayName}, Versiones de Minecraft: ${targetFile.gameVersions?.join(', ')}`);
      } else {
        // Si no hay archivos con versiones de Minecraft, usar el archivo más reciente
        const sortedByFileId = [...data.data].sort((a, b) => b.id - a.id);
        targetFile = sortedByFileId[0];
        console.log(`Archivo seleccionado basado en ID más alto (más reciente): ID ${targetFile.id}, Nombre: ${targetFile.fileName || targetFile.displayName}`);
      }
    }

    if (!targetFile) {
      throw new Error(`No compatible file found for project ${projectId} with MC version ${mcVersion} and loader ${loader}`);
    }

    // Get download URL from the file
    const downloadUrl = targetFile.downloadUrl || (targetFile.file && targetFile.file.downloadUrl);

    if (!downloadUrl) {
      throw new Error(`No download URL available for file ${targetFile.id}`);
    }

    // Determine the file path based on content type
    let targetDir = '';
    if (contentType === 'mod') {
      targetDir = path.join(instancePath, 'mods');
    } else if (contentType === 'resourcepack') {
      targetDir = path.join(instancePath, 'resourcepacks');
    } else if (contentType === 'shader') {
      targetDir = path.join(instancePath, 'shaderpacks');
    } else if (contentType === 'datapack') {
      targetDir = path.join(instancePath, 'datapacks');
    } else {
      // Default to mods folder if content type is unknown
      targetDir = path.join(instancePath, 'mods');
    }

    // Create the target directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Get the file name
    const fileName = targetFile.fileName || targetFile.displayName || `curseforge_file_${targetFile.id}.jar`;
    const filePath = path.join(targetDir, fileName);

    // Download the file
    const response = await fetch(downloadUrl);

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    console.log(`Downloaded and saved ${fileName} to ${filePath}`);
  }

  // Download a CurseForge modpack to an instance
  private async downloadModpack(
    projectId: string,
    instancePath: string,
    mcVersion: string,
    loader?: string,
    versionId?: string
  ): Promise<void> {
    try {
      // First, get the available files for this project
      const filesResponse = await fetch(`${CURSEFORGE_API_URL}/mods/${projectId}/files`, {
        headers: this.headers
      });

      if (!filesResponse.ok) {
        throw new Error(`Error fetching modpack files for project ${projectId}: ${filesResponse.statusText}`);
      }

      const data = await filesResponse.json();

      if (!data || !data.data || !Array.isArray(data.data)) {
        throw new Error(`Invalid response format for modpack project ${projectId}`);
      }

      // Find the appropriate modpack file based on criteria
      let targetFile = null;

      if (versionId) {
        // If a specific version ID was provided, find that file
        targetFile = data.data.find((file: any) => file.id.toString() === versionId);
      } else {
        // Otherwise, find the most appropriate modpack file
        // Filter by Minecraft version and loader if specified
        const filteredFiles = data.data.filter((file: any) => {
          if (!file.gameVersions || !Array.isArray(file.gameVersions)) {
            return false;
          }

          // Check if this file supports the requested Minecraft version
          const hasMcVersion = mcVersion ? file.gameVersions.includes(mcVersion) : true;

          // If loader is specified, check if file has that loader info
          let hasLoader = true;
          if (loader) {
            // CurseForge sometimes includes loader info in the gameVersions array
            const loaderInGameVersions = file.gameVersions.some((v: string) =>
              v.toLowerCase().includes(loader.toLowerCase())
            );
            hasLoader = loaderInGameVersions;
          }

          return hasMcVersion && hasLoader;
        });

        // Take the first compatible file or the latest
        targetFile = filteredFiles.length > 0 ? filteredFiles[0] : data.data[0];
      }

      if (!targetFile) {
        throw new Error(`No compatible modpack file found for project ${projectId} with MC version ${mcVersion} and loader ${loader}`);
      }

      // Get download URL from the file
      const downloadUrl = targetFile.downloadUrl || (targetFile.file && targetFile.file.downloadUrl);

      if (!downloadUrl) {
        throw new Error(`No download URL available for modpack file ${targetFile.id}`);
      }

      // Create a temporary directory for the modpack download
      const tempDir = path.join(instancePath, '.temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Get the file name for the modpack zip
      const fileName = targetFile.fileName || targetFile.displayName || `curseforge_modpack_${projectId}.zip`;
      const tempFilePath = path.join(tempDir, fileName);

      // Download the modpack zip file
      const response = await fetch(downloadUrl);

      if (!response.ok) {
        throw new Error(`Failed to download modpack: ${response.statusText}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(tempFilePath, buffer);

      console.log(`Downloaded modpack ${fileName} to ${tempFilePath}`);

      // For CurseForge modpacks, we need to extract the zip and place contents appropriately
      await this.extractModpack(tempFilePath, instancePath);

      // Clean up the temporary file
      fs.unlinkSync(tempFilePath);
      if (fs.readdirSync(tempDir).length === 0) {
        fs.rmdirSync(tempDir);
      }

      console.log(`CurseForge modpack ${projectId} installed successfully`);
    } catch (error) {
      console.error(`Error downloading and extracting CurseForge modpack ${projectId}:`, error);
      throw error;
    }
  }

  // Extract the modpack zip file to the instance directory
  private async extractModpack(zipPath: string, instancePath: string): Promise<void> {
    // Using node-stream-zip to handle the zip extraction
    const nodeStreamZip = require('node-stream-zip');

    return new Promise((resolve, reject) => {
      const zip = new nodeStreamZip({
        file: zipPath,
        storeEntries: true
      });

      zip.on('ready', async () => {
        try {
          // List all entries to identify structure
          const entries = Object.keys(zip.entries());

          // Create directories that don't exist
          const ensureDir = (dir: string) => {
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }
          };

          // Process each entry in the zip
          for (const entryName of entries) {
            const entry = zip.entries()[entryName];

            if (entry.isDirectory) continue; // Skip directories

            // Determine target path based on entry name
            let targetPath: string;

            if (entryName.startsWith('mods/')) {
              targetPath = path.join(instancePath, entryName);
            } else if (entryName.startsWith('resourcepacks/')) {
              targetPath = path.join(instancePath, entryName);
            } else if (entryName.startsWith('shaderpacks/')) {
              targetPath = path.join(instancePath, entryName);
            } else if (entryName.startsWith('datapacks/')) {
              targetPath = path.join(instancePath, entryName);
            } else if (entryName.startsWith('config/')) {
              targetPath = path.join(instancePath, entryName);
            } else {
              // Default to mods folder or root depending on file type
              if (entryName.endsWith('.jar') || entryName.endsWith('.zip')) {
                // If it's a jar file and not in a specific folder, put it in mods
                targetPath = path.join(instancePath, 'mods', path.basename(entryName));
              } else {
                // For other files, put them in the root of the instance
                targetPath = path.join(instancePath, entryName);
              }
            }

            // Ensure the target directory exists
            ensureDir(path.dirname(targetPath));

            // Extract the file
            zip.extract(entryName, targetPath, (err: Error | null) => {
              if (err) {
                console.error(`Error extracting file ${entryName}:`, err);
                zip.close();
                reject(err);
                return;
              }
            });
          }

          zip.close();
          resolve();
        } catch (error) {
          zip.close();
          reject(error);
        }
      });

      zip.on('error', (err: Error) => {
        reject(err);
      });
    });
  }

  // Helper function to extract numeric value from Minecraft version for comparison
  private extractVersionNumber(version: string): number {
    // Convert version like "1.21.10" to a comparable number
    // 1.21.10 -> 12110, 1.20.1 -> 12001, etc.
    if (!version || !version.startsWith('1.')) return 0;

    const parts = version.substring(2).split('.').map(Number);
    if (parts.length === 2) {
      // Format like 1.20 -> treat as 1.20.0
      parts.push(0);
    }

    // Convert to a single number for comparison: major*1000000 + minor*1000 + patch
    return parts[0] * 1000000 + parts[1] * 1000 + (parts[2] || 0);
  }

  // Get compatible versions for a specific project - adapted for installation context
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