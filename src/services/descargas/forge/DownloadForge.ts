import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { gameLaunchService } from '../../gameLaunchService';
import { logProgressService } from '../../logProgressService';
import { getLauncherDataPath } from '../../../utils/paths';
import { downloadQueueService } from '../../downloadQueueService';

/**
 * Servicio para descargar instancias Forge de Minecraft
 */
export class DownloadForge {
  private versionsPath: string;
  private librariesPath: string;
  private assetsPath: string;

  constructor() {
    const launcherPath = getLauncherDataPath();
    this.versionsPath = path.join(launcherPath, 'versions');
    this.librariesPath = path.join(launcherPath, 'libraries');
    this.assetsPath = path.join(launcherPath, 'assets');
    this.ensureDir(this.versionsPath);
    this.ensureDir(this.librariesPath);
    this.ensureDir(this.assetsPath);
  }

  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  /**
   * Descarga una instancia Forge completa
   * @param mcVersion Versión de Minecraft (ej. '1.20.1')
   * @param loaderVersion Versión de Forge (ej. '1.20.1-47.2.0')
   * @param instancePath Ruta donde se creará la instancia
   */
  async downloadInstance(
    mcVersion: string,
    loaderVersion: string | undefined,
    instancePath: string
  ): Promise<void> {
    try {
      logProgressService.info(`[Forge] Iniciando descarga de Forge ${loaderVersion || 'latest'} para Minecraft ${mcVersion}...`);
      
      // Asegurar que la carpeta de la instancia existe
      if (!fs.existsSync(instancePath)) {
        fs.mkdirSync(instancePath, { recursive: true });
      }

      // 1. Descargar metadata de la versión
      logProgressService.info(`[Forge] Descargando metadata de la versión...`);
      const versionJsonPath = await this.downloadVersionMetadata(mcVersion);
      const versionMetadata = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));

      // 2. Descargar el cliente base de Minecraft
      logProgressService.info(`[Forge] Descargando client.jar...`);
      await this.downloadClientJar(mcVersion, instancePath, versionMetadata);
      
      // 3. Descargar assets
      logProgressService.info(`[Forge] Descargando assets...`);
      await this.downloadAssets(mcVersion, versionMetadata);
      
      // 4. Descargar librerías base
      logProgressService.info(`[Forge] Descargando librerías base...`);
      await this.downloadLibraries(versionMetadata);

      // Instalar Forge usando el servicio de lanzamiento (que tiene la lógica de Maven)
      // Nota: installForgeLoader guarda los archivos en la carpeta de versiones del launcher
      if (!loaderVersion) {
        throw new Error('La versión de Forge es requerida');
      }
      
      logProgressService.info(`[Forge] Instalando Forge ${loaderVersion} con todas sus dependencias...`);
      await gameLaunchService.installForgeLoader(mcVersion, 'forge', loaderVersion);
      
      // Copiar version.json a la carpeta de la instancia
      const launcherDataPath = require('../../utils/paths').getLauncherDataPath();
      const versionName = `${mcVersion}-forge-${loaderVersion}`;
      const versionJsonPath = path.join(launcherDataPath, 'versions', versionName, `${versionName}.json`);
      const instanceLoaderDir = path.join(instancePath, 'loader');
      if (!fs.existsSync(instanceLoaderDir)) {
        fs.mkdirSync(instanceLoaderDir, { recursive: true });
      }
      
      if (fs.existsSync(versionJsonPath)) {
        const instanceVersionJsonPath = path.join(instanceLoaderDir, 'version.json');
        fs.copyFileSync(versionJsonPath, instanceVersionJsonPath);
        logProgressService.info(`[Forge] version.json copiado a la instancia`);
        
        // IMPORTANTE: Descargar todas las librerías de Forge del version.json
        await this.downloadForgeLibraries(versionJsonPath, instancePath);
      } else {
        logProgressService.warning(`[Forge] version.json no encontrado en: ${versionJsonPath}`);
      }
      
      logProgressService.info(`[Forge] Descarga completada exitosamente con todas las dependencias`);
    } catch (error) {
      logProgressService.error(`[Forge] Error al descargar instancia:`, error);
      throw error;
    }
  }

  /**
   * Descarga todas las librerías de Forge del version.json
   */
  private async downloadForgeLibraries(versionJsonPath: string, instancePath: string): Promise<void> {
    try {
      logProgressService.info(`[Forge] Descargando librerías de Forge desde version.json...`);
      
      const versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));
      const launcherDataPath = require('../../utils/paths').getLauncherDataPath();
      const librariesDir = path.join(launcherDataPath, 'libraries');
      
      if (!versionData.libraries || !Array.isArray(versionData.libraries)) {
        logProgressService.warning(`[Forge] No se encontraron librerías en el version.json`);
        return;
      }

      let downloaded = 0;
      let skipped = 0;
      let failed = 0;

      for (const lib of versionData.libraries) {
        try {
          // Verificar reglas de compatibilidad
          if (lib.rules && !this.isLibraryAllowed(lib.rules)) {
            continue;
          }

          if (!lib.downloads?.artifact) {
            continue;
          }

          const libPath = path.join(librariesDir, lib.downloads.artifact.path);
          const libUrl = lib.downloads.artifact.url;

          // Verificar si ya existe
          if (fs.existsSync(libPath)) {
            skipped++;
            continue;
          }

          // Descargar la librería
          const libDir = path.dirname(libPath);
          if (!fs.existsSync(libDir)) {
            fs.mkdirSync(libDir, { recursive: true });
          }

          const response = await fetch(libUrl, { headers: { 'User-Agent': 'DRK-Launcher/1.0' } });
          if (response.ok) {
            const buffer = Buffer.from(await response.arrayBuffer());
            fs.writeFileSync(libPath, buffer);
            downloaded++;
            
            if (downloaded % 10 === 0) {
              logProgressService.info(`[Forge] Librerías descargadas: ${downloaded} (omitidas: ${skipped})`);
            }
          } else {
            failed++;
            logProgressService.warning(`[Forge] Error al descargar librería ${lib.name || 'unknown'}: HTTP ${response.status}`);
          }
        } catch (error) {
          failed++;
          logProgressService.warning(`[Forge] Error al procesar librería:`, error);
        }
      }

      logProgressService.info(`[Forge] Librerías descargadas: ${downloaded} nuevas, ${skipped} existentes, ${failed} fallidas`);
    } catch (error) {
      logProgressService.error(`[Forge] Error al descargar librerías:`, error);
      // No lanzar error, solo registrar
    }
  }

  /**
   * Verifica si una librería está permitida según sus reglas
   */
  private isLibraryAllowed(rules: any[]): boolean {
    if (!rules || !Array.isArray(rules)) {
      return true;
    }

    const os = process.platform;
    const osName = os === 'win32' ? 'windows' : os === 'darwin' ? 'osx' : 'linux';
    const arch = process.arch === 'x64' ? 'x86_64' : process.arch;

    for (const rule of rules) {
      if (rule.action === 'disallow') {
        if (!rule.os) {
          return false;
        }
        if (rule.os.name === osName || rule.os.arch === arch) {
          return false;
        }
      } else if (rule.action === 'allow') {
        if (!rule.os || rule.os.name === osName || rule.os.arch === arch) {
          return true;
        }
      }
    }

    return true;
  }

  /**
   * Valida que todos los archivos necesarios estén presentes
   */
  validateDownload(instancePath: string, loaderVersion: string): boolean {
    const clientJarPath = path.join(instancePath, 'client.jar');
    const versionJsonPath = path.join(instancePath, 'loader', 'version.json');
    
    if (!fs.existsSync(clientJarPath)) {
      logProgressService.warning(`[Forge] client.jar no encontrado`);
      return false;
    }

    if (!fs.existsSync(versionJsonPath)) {
      logProgressService.warning(`[Forge] version.json no encontrado`);
      return false;
    }

    return true;
  }

  /**
   * Descarga la metadata de una versión
   */
  private async downloadVersionMetadata(version: string): Promise<string> {
    const versionDir = path.join(this.versionsPath, version);
    this.ensureDir(versionDir);
    
    const versionJsonPath = path.join(versionDir, 'version.json');
    
    if (fs.existsSync(versionJsonPath)) {
      return versionJsonPath;
    }

    const manifestResponse = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json');
    const manifest = await manifestResponse.json();
    
    const versionInfo = manifest.versions.find((v: any) => v.id === version);
    if (!versionInfo) {
      throw new Error(`Versión ${version} no encontrada en el manifest`);
    }

    const versionMetadataResponse = await fetch(versionInfo.url);
    const versionMetadata = await versionMetadataResponse.json();
    
    fs.writeFileSync(versionJsonPath, JSON.stringify(versionMetadata, null, 2));
    return versionJsonPath;
  }

  /**
   * Descarga el client.jar
   */
  private async downloadClientJar(mcVersion: string, instancePath: string, versionMetadata: any): Promise<void> {
    const clientJarPath = path.join(instancePath, 'client.jar');
    
    if (fs.existsSync(clientJarPath)) {
      const stats = fs.statSync(clientJarPath);
      if (stats.size > 1024 * 1024) {
        return;
      }
    }

    const clientDownloadUrl = versionMetadata.downloads?.client?.url;
    if (!clientDownloadUrl) {
      throw new Error(`No se encontró URL de descarga para client.jar de la versión ${mcVersion}`);
    }

    const expectedHash = versionMetadata.downloads?.client?.sha1;
    await this.downloadFile(clientDownloadUrl, clientJarPath, expectedHash, 'sha1');

    if (!fs.existsSync(clientJarPath)) {
      throw new Error(`client.jar no se descargó correctamente`);
    }

    const stats = fs.statSync(clientJarPath);
    if (stats.size < 1024 * 1024) {
      throw new Error(`client.jar descargado tiene un tamaño inusualmente pequeño: ${stats.size} bytes`);
    }
  }

  /**
   * Descarga los assets
   */
  private async downloadAssets(mcVersion: string, versionMetadata: any): Promise<void> {
    const assetIndexId = versionMetadata.assetIndex?.id || mcVersion;
    const assetIndexUrl = versionMetadata.assetIndex?.url;
    
    if (!assetIndexUrl) {
      throw new Error(`No se encontró URL del asset index para la versión ${mcVersion}`);
    }

    const indexesDir = path.join(this.assetsPath, 'indexes');
    this.ensureDir(indexesDir);
    const assetIndexPath = path.join(indexesDir, `${assetIndexId}.json`);
    
    if (!fs.existsSync(assetIndexPath)) {
      await this.downloadFile(assetIndexUrl, assetIndexPath);
    }

    const assetIndex = JSON.parse(fs.readFileSync(assetIndexPath, 'utf-8'));
    const objects = assetIndex.objects || {};
    const objectsDir = path.join(this.assetsPath, 'objects');
    this.ensureDir(objectsDir);

    const assetsToDownload: Array<{ assetPath: string; hash: string; assetName: string }> = [];
    
    for (const [assetName, assetInfo] of Object.entries(objects) as [string, any][]) {
      const hash = assetInfo.hash;
      const assetPath = path.join(objectsDir, hash.substring(0, 2), hash);
      
      if (!fs.existsSync(assetPath)) {
        assetsToDownload.push({ assetPath, hash, assetName });
      }
    }

    if (assetsToDownload.length > 0) {
      logProgressService.info(`[Forge] Descargando ${assetsToDownload.length} assets...`);
      
      const CONCURRENT_DOWNLOADS = 70;
      let downloadedCount = 0;

      for (let i = 0; i < assetsToDownload.length; i += CONCURRENT_DOWNLOADS) {
        const batch = assetsToDownload.slice(i, i + CONCURRENT_DOWNLOADS);
        
        for (const { assetPath } of batch) {
          this.ensureDir(path.dirname(assetPath));
        }

        await Promise.allSettled(
          batch.map(async ({ assetPath, hash, assetName }) => {
            try {
              const assetUrl = `https://resources.download.minecraft.net/${hash.substring(0, 2)}/${hash}`;
              await this.downloadFile(assetUrl, assetPath, hash, 'sha1');
              
              downloadedCount++;
              if (downloadedCount % 100 === 0 || downloadedCount === assetsToDownload.length) {
                logProgressService.info(`[Forge] Asset descargado y verificado: ${downloadedCount}/${assetsToDownload.length} (${Math.floor((downloadedCount / assetsToDownload.length) * 100)}%)`);
              }
            } catch (error) {
              logProgressService.warning(`[Forge] Error al descargar asset ${assetName}:`, error);
            }
          })
        );
      }
    }
  }

  /**
   * Descarga las librerías base de Minecraft
   */
  private async downloadLibraries(versionMetadata: any): Promise<void> {
    const libraries = versionMetadata.libraries || [];
    const librariesToDownload: any[] = [];

    for (const library of libraries) {
      if (library.rules && !this.isLibraryAllowed(library.rules)) {
        continue;
      }

      const downloads = library.downloads;
      if (!downloads || !downloads.artifact) {
        continue;
      }

      const artifact = downloads.artifact;
      const libraryPath = this.getLibraryPath(library.name);
      
      if (fs.existsSync(libraryPath)) {
        const expectedHash = artifact.sha1;
        if (expectedHash) {
          try {
            const fileBuffer = fs.readFileSync(libraryPath);
            const hash = crypto.createHash('sha1').update(fileBuffer).digest('hex');
            if (hash.toLowerCase() === expectedHash.toLowerCase()) {
              continue;
            }
          } catch {
            // Redescargar si hay error
          }
        } else {
          continue;
        }
      }

      librariesToDownload.push(library);
    }

    if (librariesToDownload.length === 0) {
      return;
    }

    logProgressService.info(`[Forge] Descargando ${librariesToDownload.length} librerías base...`);

    const downloadPromises = librariesToDownload.map(async (library) => {
      try {
        await this.downloadLibrary(library);
      } catch (error) {
        logProgressService.warning(`[Forge] Error al descargar librería ${library.name}:`, error);
      }
    });

    await Promise.allSettled(downloadPromises);
  }

  /**
   * Descarga una librería específica
   */
  private async downloadLibrary(library: any): Promise<void> {
    const artifact = library.downloads.artifact;
    const libraryPath = this.getLibraryPath(library.name);
    const libraryDir = path.dirname(libraryPath);
    
    this.ensureDir(libraryDir);

    const expectedHash = artifact.sha1;
    await this.downloadFile(artifact.url, libraryPath, expectedHash, 'sha1');
  }

  /**
   * Convierte el nombre de la librería al formato de ruta
   */
  private getLibraryPath(libraryName: string): string {
    const parts = libraryName.split(':');
    if (parts.length < 3) {
      throw new Error(`Formato de librería inválido: ${libraryName}`);
    }

    const [group, artifact, version] = parts;
    const groupPath = group.replace(/\./g, '/');
    const libraryDir = path.join(this.librariesPath, groupPath, artifact, version);
    const fileName = `${artifact}-${version}.jar`;
    
    return path.join(libraryDir, fileName);
  }

  /**
   * Descarga un archivo usando el servicio de cola
   */
  private async downloadFile(url: string, outputPath: string, expectedHash?: string, hashAlgorithm: string = 'sha1'): Promise<void> {
    const downloadId = await downloadQueueService.addDownload(url, outputPath, expectedHash, hashAlgorithm);

    return new Promise((resolve, reject) => {
      const checkStatus = () => {
        const status = downloadQueueService.getDownloadStatus(downloadId);
        if (!status) {
          reject(new Error(`Download ${downloadId} not found`));
          return;
        }

        if (status.status === 'completed') {
          resolve();
        } else if (status.status === 'error') {
          reject(new Error(status.error || 'Download failed'));
        } else {
          setTimeout(checkStatus, 500);
        }
      };

      checkStatus();
    });
  }
}

export const downloadForge = new DownloadForge();

