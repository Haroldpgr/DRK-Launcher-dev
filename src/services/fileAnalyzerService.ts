import { ipcMain } from 'electron';

export class FileAnalyzerService {
  /**
   * Analiza un archivo ZIP/MRPACK para extraer metadatos del modpack
   */
  public async analyzeFile(filePath: string): Promise<any> {
    // Usando node-stream-zip en el proceso principal (Node.js)
    const nodeStreamZip = require('node-stream-zip');
    const path = require('path');
    
    return new Promise((resolve, reject) => {
      const zip = new nodeStreamZip({
        file: filePath,
        storeEntries: true
      });

      zip.on('ready', () => {
        try {
          // Buscar el archivo de manifiesto de modpack (modrinth.index.json o manifest.json)
          let manifestEntry = Object.keys(zip.entries()).find(entry => 
            entry === 'modrinth.index.json' || entry.endsWith('modrinth.index.json')
          );

          if (manifestEntry) {
            // Es un modpack de Modrinth
            zip.stream(manifestEntry, (err: Error | null, stm: any) => {
              if (err) {
                reject(err);
                zip.close();
                return;
              }

              const chunks: Buffer[] = [];
              stm.on('data', (chunk: Buffer) => chunks.push(chunk));

              stm.on('end', () => {
                try {
                  const data = Buffer.concat(chunks);
                  const manifest = JSON.parse(data.toString('utf-8'));
                  
                  const metadata = {
                    id: manifest.id || 'unknown',
                    name: manifest.name || path.basename(filePath, path.extname(filePath)),
                    version: manifest.version_id || manifest.version || '1.0.0',
                    description: manifest.description || 'Modpack sin descripción',
                    author: manifest.author || 'Desconocido',
                    mcVersion: this.extractMinecraftVersion(manifest),
                    loader: this.extractLoader(manifest),
                    modCount: manifest.files ? manifest.files.length : 0,
                    fileCount: manifest.files ? manifest.files.length : 0
                  };

                  zip.close();
                  resolve(metadata);
                } catch (parseError) {
                  zip.close();
                  reject(parseError);
                }
              });

              stm.on('error', (streamErr: Error) => {
                zip.close();
                reject(streamErr);
              });
            });
          } else {
            // Buscar manifest.json (curseforge)
            manifestEntry = Object.keys(zip.entries()).find(entry => 
              entry === 'manifest.json' || entry === 'mmc-pack.json'
            );

            if (manifestEntry) {
              zip.stream(manifestEntry, (err: Error | null, stm: any) => {
                if (err) {
                  reject(err);
                  zip.close();
                  return;
                }

                const chunks: Buffer[] = [];
                stm.on('data', (chunk: Buffer) => chunks.push(chunk));

                stm.on('end', () => {
                  try {
                    const data = Buffer.concat(chunks);
                    const manifest = JSON.parse(data.toString('utf-8'));
                    
                    const metadata = {
                      id: manifest.projectID || 'unknown',
                      name: manifest.name || path.basename(filePath, path.extname(filePath)),
                      version: manifest.version || '1.0.0',
                      description: manifest.overrides ? 'CurseForge modpack' : 'Modpack sin descripción',
                      author: manifest.author || 'Desconocido',
                      mcVersion: manifest.minecraft?.version || 'unknown',
                      loader: this.extractCurseForgeLoader(manifest),
                      modCount: manifest.files ? manifest.files.length : 0,
                      fileCount: manifest.files ? manifest.files.length : 0
                    };

                    zip.close();
                    resolve(metadata);
                  } catch (parseError) {
                    zip.close();
                    reject(parseError);
                  }
                });

                stm.on('error', (streamErr: Error) => {
                  zip.close();
                  reject(streamErr);
                });
              });
            } else {
              // Si no es un archivo de modpack estandarizado, tratar como ZIP común
              const metadata = {
                id: `local-${Date.now()}`,
                name: path.basename(filePath, path.extname(filePath)),
                version: '1.0.0',
                description: 'Archivo ZIP local sin metadatos',
                author: 'Usuario',
                mcVersion: 'unknown',
                loader: 'vanilla',
                fileCount: Object.keys(zip.entries()).length
              };

              zip.close();
              resolve(metadata);
            }
          }
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

  /**
   * Extrae la versión de Minecraft del manifiesto
   */
  private extractMinecraftVersion(manifest: any): string {
    // Para Modrinth
    if (manifest.dependencies && manifest.dependencies['minecraft']) {
      return manifest.dependencies['minecraft'];
    }
    // Para CurseForge
    if (manifest.minecraft && manifest.minecraft.version) {
      return manifest.minecraft.version;
    }
    return 'unknown';
  }

  /**
   * Extrae el loader del manifiesto de Modrinth
   */
  private extractLoader(manifest: any): string {
    if (manifest.dependencies) {
      if (manifest.dependencies['fabric-loader']) return 'fabric';
      if (manifest.dependencies['forge']) return 'forge';
      if (manifest.dependencies['quilt-loader']) return 'quilt';
      if (manifest.dependencies['neoforge']) return 'neoforge';
    }
    return 'vanilla';
  }

  /**
   * Extrae el loader del manifiesto de CurseForge
   */
  private extractCurseForgeLoader(manifest: any): string {
    if (manifest.minecraft && manifest.minecraft.modLoaders) {
      const loaders = manifest.minecraft.modLoaders;
      if (Array.isArray(loaders)) {
        for (const loader of loaders) {
          if (loader.id.includes('fabric')) return 'fabric';
          if (loader.id.includes('forge')) return 'forge';
          if (loader.id.includes('quilt')) return 'quilt';
        }
      } else if (typeof loaders === 'object') {
        if (loaders.id.includes('fabric')) return 'fabric';
        if (loaders.id.includes('forge')) return 'forge';
        if (loaders.id.includes('quilt')) return 'quilt';
      }
    }
    return 'vanilla';
  }

  /**
   * Extrae un archivo de modpack y lo instala en la instancia
   */
  public async extractAndInstall(sourcePath: string, targetPath: string): Promise<void> {
    const nodeStreamZip = require('node-stream-zip');
    const fs = require('fs');
    const path = require('path');

    return new Promise((resolve, reject) => {
      const zip = new nodeStreamZip({
        file: sourcePath,
        storeEntries: true
      });

      zip.on('ready', async () => {
        try {
          // Directorios destino
          const modsDir = path.join(targetPath, 'mods');
          const resourcepacksDir = path.join(targetPath, 'resourcepacks');
          const shaderpacksDir = path.join(targetPath, 'shaderpacks');
          const configDir = path.join(targetPath, 'config');
          const datapacksDir = path.join(targetPath, 'datapacks');

          // Crear directorios si no existen
          [modsDir, resourcepacksDir, shaderpacksDir, configDir, datapacksDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }
          });

          // Procesar cada archivo del ZIP
          const entries = zip.entries();
          const totalFiles = Object.keys(entries).length;
          let processedFiles = 0;

          for (const entryName in entries) {
            const entry = entries[entryName];

            if (!entry.isDirectory) {
              // Determinar destino según la ruta dentro del ZIP
              let targetDir = targetPath; // Por defecto, raíz de la instancia

              if (entryName.startsWith('mods/')) {
                targetDir = modsDir;
              } else if (entryName.startsWith('resourcepacks/')) {
                targetDir = resourcepacksDir;
              } else if (entryName.startsWith('shaderpacks/')) {
                targetDir = shaderpacksDir;
              } else if (entryName.startsWith('config/')) {
                targetDir = configDir;
              } else if (entryName.startsWith('datapacks/')) {
                targetDir = datapacksDir;
              }

              // Crear directorios intermedios si no existen
              const targetFile = path.join(targetDir, path.basename(entryName));
              const targetDirPath = path.dirname(targetFile);

              if (!fs.existsSync(targetDirPath)) {
                fs.mkdirSync(targetDirPath, { recursive: true });
              }

              // Extraer archivo
              await new Promise((fileResolve, fileReject) => {
                zip.extract(entryName, targetFile, (err: Error | null) => {
                  if (err) {
                    fileReject(err);
                  } else {
                    fileResolve(undefined);
                  }
                });
              });

              processedFiles++;

              // Notificar progreso (aunque aquí no tenemos un callback de progreso)
              if (processedFiles % 5 === 0) { // Actualizar cada 5 archivos
                console.log(`Progreso: ${Math.round((processedFiles / totalFiles) * 100)}% (${processedFiles}/${totalFiles})`);
              }
            }
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

  /**
   * Descarga y extrae un modpack desde una URL
   */
  public async downloadAndExtractFromUrl(url: string, targetPath: string, onProgress?: (progress: number) => void): Promise<void> {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const fetch = require('node-fetch');
    const { pipeline } = require('stream');
    const { promisify } = require('util');

    const pipelineAsync = promisify(pipeline);

    // Crear directorio temporal si no existe
    const tempDir = path.join(os.tmpdir(), 'drk_launcher_temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempPath = path.join(tempDir, `modpack_${Date.now()}.download`);

    try {
      // Descargar archivo
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const writeStream = fs.createWriteStream(tempPath);
      await pipelineAsync(response.body, writeStream);

      // Extraer y copiar al directorio objetivo
      await this.extractAndInstall(tempPath, targetPath);

      // Eliminar archivo temporal
      fs.unlinkSync(tempPath);
    } catch (error) {
      // Intentar limpiar archivo temporal si existe
      try {
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      } catch (cleanupError) {
        console.error('Error al limpiar archivo temporal:', cleanupError);
      }

      throw error;
    }
  }

  /**
   * Descarga un modpack de Modrinth
   */
  public async downloadModpackFromModrinth(projectId: string, targetPath: string, mcVersion: string, loader: string): Promise<void> {
    // Importar el servicio de Modrinth que ya existe
    const { modrinthDownloadService } = require('./modrinthDownloadService');
    await modrinthDownloadService.downloadModpack(projectId, targetPath, mcVersion, loader);
  }

  /**
   * Analiza una URL de modpack
   */
  public async analyzeUrl(url: string): Promise<any> {
    const { modrinthDownloadService } = require('./modrinthDownloadService');

    try {
      // Si es una URL de Modrinth
      if (url.includes('modrinth.com')) {
        const projectId = this.extractModrinthProjectId(url);
        if (projectId) {
          const versions = await modrinthDownloadService.getAvailableVersions(projectId);
          if (versions.length > 0) {
            const latestVersion = versions[0];
            return {
              id: projectId,
              name: latestVersion.name,
              version: latestVersion.version_number,
              description: latestVersion.description || 'Modpack desde Modrinth',
              author: 'Modrinth Creator',
              mcVersion: latestVersion.game_versions[0] || 'unknown',
              loader: (latestVersion.loaders[0] as any) || 'vanilla',
              modCount: latestVersion.files?.length,
              fileCount: latestVersion.files?.length
            };
          }
        }
      }
      // Si es una URL directa a un archivo
      else if (url.endsWith('.mrpack') || url.endsWith('.zip')) {
        // Extraer el nombre del archivo de la URL
        const basename = url.split('/').pop() || url;
        return {
          id: `url-${Date.now()}`,
          name: basename,
          version: '1.0.0',
          description: `Archivo remoto: ${url}`,
          author: 'Remoto',
          mcVersion: 'unknown',
          loader: 'vanilla',
          fileCount: 0
        };
      }

      throw new Error('No se pudo analizar la URL');
    } catch (error) {
      console.error('Error al analizar URL:', error);
      throw error;
    }
  }

  /**
   * Extrae el ID del proyecto de Modrinth de una URL
   */
  private extractModrinthProjectId(url: string): string | null {
    const match = url.match(/modrinth\.com\/(mod|modpack)\/([^\/]+)/);
    return match ? match[2] : null;
  }
}

export const fileAnalyzerService = new FileAnalyzerService();

// IPC handlers para Electron
ipcMain.handle('modpack-import:analyze-file', async (_, filePath: string) => {
  return await fileAnalyzerService.analyzeFile(filePath);
});

ipcMain.handle('modpack-import:extract-and-install', async (_, sourcePath: string, targetPath: string) => {
  return await fileAnalyzerService.extractAndInstall(sourcePath, targetPath);
});

ipcMain.handle('modpack-import:download-and-extract-from-url', async (_, url: string, targetPath: string) => {
  return await fileAnalyzerService.downloadAndExtractFromUrl(url, targetPath);
});

ipcMain.handle('modpack-import:download-modpack-from-modrinth', async (_, projectId: string, targetPath: string, mcVersion: string, loader: string) => {
  return await fileAnalyzerService.downloadModpackFromModrinth(projectId, targetPath, mcVersion, loader);
});

ipcMain.handle('modpack-import:analyze-url', async (_, url: string) => {
  return await fileAnalyzerService.analyzeUrl(url);
});