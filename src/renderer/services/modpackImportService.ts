import path from 'path';
import fs from 'fs';
import { modrinthDownloadService } from '../../services/modrinthDownloadService';

interface ModpackMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  mcVersion: string;
  loader: 'vanilla' | 'forge' | 'fabric' | 'quilt' | 'neoforge';
  modCount?: number;
  fileCount?: number;
  thumbnail?: string;
}

interface CompatibilityCheck {
  compatible: boolean;
  message: string;
  compatibleInstances: any[];
  incompatibleInstances: any[];
}

interface Instance {
  id: string;
  name: string;
  version: string;
  loader?: 'vanilla' | 'forge' | 'fabric' | 'quilt' | 'neoforge';
  path: string;
}

export class ModpackImportService {
  /**
   * Analiza un archivo de modpack para extraer metadatos
   */
  public async analyzeModpack(source: string): Promise<ModpackMetadata> {
    // Si es una URL, extraer metadatos desde la URL
    if (source.startsWith('http')) {
      return this.analyzeFromUrl(source);
    } 
    // Si es un archivo, leerlo y extraer metadatos
    else {
      return this.analyzeFromFile(source);
    }
  }

  /**
   * Extrae metadatos de un archivo local (.mrpack o .zip)
   */
  private async analyzeFromFile(filePath: string): Promise<ModpackMetadata> {
    const nodeStreamZip = require('node-stream-zip');
    
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
                  
                  const metadata: ModpackMetadata = {
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
                    
                    const metadata: ModpackMetadata = {
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
              const metadata: ModpackMetadata = {
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
   * Extrae metadatos desde una URL
   */
  private async analyzeFromUrl(url: string): Promise<ModpackMetadata> {
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
        const basename = path.basename(url);
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
  private extractLoader(manifest: any): 'vanilla' | 'forge' | 'fabric' | 'quilt' | 'neoforge' {
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
  private extractCurseForgeLoader(manifest: any): 'vanilla' | 'forge' | 'fabric' | 'quilt' | 'neoforge' {
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
   * Verifica la compatibilidad del modpack con instancias existentes
   */
  public checkCompatibility(
    modpackMetadata: ModpackMetadata,
    instances: Instance[]
  ): CompatibilityCheck {
    const compatibleInstances = instances.filter(instance => 
      instance.version === modpackMetadata.mcVersion && 
      instance.loader === modpackMetadata.loader
    );
    
    const incompatibleInstances = instances.filter(instance => 
      instance.version !== modpackMetadata.mcVersion || 
      instance.loader !== modpackMetadata.loader
    );
    
    const isCompatible = compatibleInstances.length > 0;
    
    return {
      compatible: isCompatible,
      message: isCompatible 
        ? 'Compatible con algunas instancias existentes' 
        : 'No compatible con ninguna instancia existente',
      compatibleInstances,
      incompatibleInstances
    };
  }

  /**
   * Importa un modpack a una instancia específica
   */
  public async importModpack(
    source: string,
    targetInstanceId: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    try {
      if (source.startsWith('http')) {
        // Importar desde URL
        await this.importFromUrl(source, targetInstanceId, onProgress);
      } else {
        // Importar desde archivo local
        await this.importFromFile(source, targetInstanceId, onProgress);
      }
    } catch (error) {
      console.error('Error al importar modpack:', error);
      throw error;
    }
  }

  /**
   * Importa un modpack desde una URL
   */
  private async importFromUrl(
    url: string, 
    targetInstanceId: string, 
    onProgress?: (progress: number) => void
  ): Promise<void> {
    // Obtener la instancia de destino para saber la ruta
    if (!window.api?.instances) {
      throw new Error('API de instancias no disponible');
    }

    const instance = await window.api.instances.list()
      .then(instances => instances.find((inst: any) => inst.id === targetInstanceId));

    if (!instance) {
      throw new Error('Instancia de destino no encontrada');
    }

    // Si es una URL de Modrinth
    if (url.includes('modrinth.com')) {
      const projectId = this.extractModrinthProjectId(url);
      if (projectId) {
        // Utilizar servicio de descarga de Modrinth
        const { mcVersion, loader } = await this.analyzeFromUrl(url);
        await modrinthDownloadService.downloadModpack(projectId, instance.path, mcVersion, loader);
        return;
      }
    }

    // Para otras URLs, descargar el archivo y luego importarlo
    const tempPath = path.join(require('os').tmpdir(), `modpack_${Date.now()}`);
    
    // Aquí iría la lógica para descargar el archivo y descomprimirlo
    // Usando el servicio de descargas existente
    if (window.api?.download) {
      return new Promise((resolve, reject) => {
        const itemId = `modpack_${Date.now()}`;
        window.api.download.start({ url, filename: tempPath, itemId });

        const progressCleanup = window.api.download.onProgress((_, data) => {
          if (data.itemId === itemId && onProgress) {
            onProgress(data.progress);
          }
        });

        const completeCleanup = window.api.download.onComplete((_, data) => {
          if (data.itemId === itemId) {
            progressCleanup();
            completeCleanup();
            this.extractAndInstall(tempPath, instance.path)
              .then(resolve)
              .catch(reject);
          }
        });

        const errorCleanup = window.api.download.onError((_, error) => {
          if (error.itemId === itemId) {
            progressCleanup();
            completeCleanup();
            errorCleanup();
            reject(new Error(`Error al descargar: ${error.message}`));
          }
        });
      });
    } else {
      throw new Error('Servicio de descarga no disponible');
    }
  }

  /**
   * Importa un modpack desde un archivo local
   */
  private async importFromFile(
    filePath: string, 
    targetInstanceId: string, 
    onProgress?: (progress: number) => void
  ): Promise<void> {
    // Obtener la instancia de destino para saber la ruta
    if (!window.api?.instances) {
      throw new Error('API de instancias no disponible');
    }

    const instance = await window.api.instances.list()
      .then(instances => instances.find((inst: any) => inst.id === targetInstanceId));

    if (!instance) {
      throw new Error('Instancia de destino no encontrada');
    }

    // Extraer y copiar el modpack a la instancia
    await this.extractAndInstall(filePath, instance.path);
  }

  /**
   * Extrae un archivo de modpack y lo instala en la instancia
   */
  private async extractAndInstall(sourcePath: string, targetPath: string): Promise<void> {
    const nodeStreamZip = require('node-stream-zip');
    
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
              
              // Notificar progreso
              if (processedFiles % 5 === 0) { // Actualizar cada 5 archivos
                const progress = Math.round((processedFiles / totalFiles) * 100);
                console.log(`Progreso: ${progress}% (${processedFiles}/${totalFiles})`);
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
   * Genera una URL temporal para compartir un modpack
   */
  public async generateTemporaryUrl(filePath: string): Promise<string> {
    // En una implementación real, esto subiría el archivo a un servicio de almacenamiento
    // temporal como AWS S3, Google Cloud Storage, etc.
    // Por ahora, simulamos con una URL de ejemplo
    
    const fileName = path.basename(filePath);
    const tempId = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    
    // URL simulada - en producción esto sería una URL real que expire después de un tiempo
    return `https://temp-share.example.com/${tempId}/${encodeURIComponent(fileName)}`;
  }

  /**
   * Valida si una URL de modpack es válida y accesible
   */
  public async validateModpackUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export const modpackImportService = new ModpackImportService();