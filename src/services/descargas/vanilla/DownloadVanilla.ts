import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { logProgressService } from '../../logProgressService';
import { getLauncherDataPath } from '../../../utils/paths';
import { downloadQueueService } from '../../downloadQueueService';

/**
 * Servicio para descargar instancias Vanilla de Minecraft
 */
export class DownloadVanilla {
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
   * Descarga una instancia Vanilla completa
   * @param mcVersion Versión de Minecraft (ej. '1.20.1')
   * @param instancePath Ruta donde se creará la instancia
   */
  async downloadInstance(mcVersion: string, instancePath: string): Promise<void> {
    try {
      logProgressService.info(`[Vanilla] Iniciando descarga de Minecraft ${mcVersion}...`);
      
      // Asegurar que la carpeta de la instancia existe
      if (!fs.existsSync(instancePath)) {
        fs.mkdirSync(instancePath, { recursive: true });
      }

      // 1. Descargar metadata de la versión
      logProgressService.info(`[Vanilla] Descargando metadata de la versión...`);
      const versionJsonPath = await this.downloadVersionMetadata(mcVersion);
      const versionMetadata = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));

      // 2. Descargar el cliente JAR
      logProgressService.info(`[Vanilla] Descargando client.jar...`);
      await this.downloadClientJar(mcVersion, instancePath, versionMetadata);
      
      // 3. Descargar assets
      logProgressService.info(`[Vanilla] Descargando assets...`);
      await this.downloadAssets(mcVersion, versionMetadata);
      
      // 4. Descargar librerías
      logProgressService.info(`[Vanilla] Descargando librerías...`);
      await this.downloadLibraries(versionMetadata);
      
      logProgressService.info(`[Vanilla] Descarga completada exitosamente para ${mcVersion}`);
    } catch (error) {
      logProgressService.error(`[Vanilla] Error al descargar instancia:`, error);
      throw error;
    }
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
      if (stats.size > 1024 * 1024) { // Más de 1MB, asumir válido
        return;
      }
    }

    const clientDownloadUrl = versionMetadata.downloads?.client?.url;
    if (!clientDownloadUrl) {
      throw new Error(`No se encontró URL de descarga para client.jar de la versión ${mcVersion}`);
    }

    const expectedHash = versionMetadata.downloads?.client?.sha1;
    await this.downloadFile(clientDownloadUrl, clientJarPath, expectedHash, 'sha1');

    // Verificar que el archivo se haya descargado correctamente
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

    // Descargar asset index
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

    // Validar y descargar assets faltantes
    const assetsToDownload: Array<{ assetPath: string; hash: string; assetName: string }> = [];
    
    for (const [assetName, assetInfo] of Object.entries(objects) as [string, any][]) {
      const hash = assetInfo.hash;
      const assetPath = path.join(objectsDir, hash.substring(0, 2), hash);
      
      if (!fs.existsSync(assetPath)) {
        assetsToDownload.push({ assetPath, hash, assetName });
      }
    }

    if (assetsToDownload.length > 0) {
      logProgressService.info(`[Vanilla] Descargando ${assetsToDownload.length} assets...`);
      
      const CONCURRENT_DOWNLOADS = 70;
      let downloadedCount = 0;

      for (let i = 0; i < assetsToDownload.length; i += CONCURRENT_DOWNLOADS) {
        const batch = assetsToDownload.slice(i, i + CONCURRENT_DOWNLOADS);
        
        // Crear directorios
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
                logProgressService.info(`[Vanilla] Asset descargado y verificado: ${downloadedCount}/${assetsToDownload.length} (${Math.floor((downloadedCount / assetsToDownload.length) * 100)}%)`);
              }
            } catch (error) {
              logProgressService.warning(`[Vanilla] Error al descargar asset ${assetName}:`, error);
            }
          })
        );
      }
    }
  }

  /**
   * Descarga las librerías
   */
  private async downloadLibraries(versionMetadata: any): Promise<void> {
    const libraries = versionMetadata.libraries || [];
    const librariesToDownload: any[] = [];

    for (const library of libraries) {
      // Verificar reglas de compatibilidad
      if (library.rules && !this.isLibraryAllowed(library.rules)) {
        continue;
      }

      const downloads = library.downloads;
      if (!downloads || !downloads.artifact) {
        continue;
      }

      const artifact = downloads.artifact;
      const libraryPath = this.getLibraryPath(library.name);
      
      // Verificar si existe y es válida
      if (fs.existsSync(libraryPath)) {
        const expectedHash = artifact.sha1;
        if (expectedHash) {
          try {
            const fileBuffer = fs.readFileSync(libraryPath);
            const hash = crypto.createHash('sha1').update(fileBuffer).digest('hex');
            if (hash.toLowerCase() === expectedHash.toLowerCase()) {
              continue; // Ya existe y es válida
            }
          } catch {
            // Si hay error, redescargar
          }
        } else {
          continue; // Ya existe
        }
      }

      librariesToDownload.push(library);
    }

    if (librariesToDownload.length === 0) {
      return;
    }

    logProgressService.info(`[Vanilla] Descargando ${librariesToDownload.length} librerías...`);

    const downloadPromises = librariesToDownload.map(async (library) => {
      try {
        await this.downloadLibrary(library);
      } catch (error) {
        logProgressService.warning(`[Vanilla] Error al descargar librería ${library.name}:`, error);
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
   * Verifica si una librería está permitida según las reglas
   */
  private isLibraryAllowed(rules: any[]): boolean {
    let allowed = true;
    
    for (const rule of rules) {
      const osName = rule.os?.name;
      const action = rule.action;
      
      if (osName) {
        let currentOs = '';
        switch (process.platform) {
          case 'win32': currentOs = 'windows'; break;
          case 'darwin': currentOs = 'osx'; break;
          case 'linux': currentOs = 'linux'; break;
          default: currentOs = 'linux';
        }
        
        if (osName === currentOs) {
          allowed = action === 'allow';
        }
      } else if (action === 'disallow') {
        allowed = false;
      }
    }
    
    return allowed;
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

  /**
   * Valida que todos los archivos necesarios estén presentes
   * @param instancePath Ruta de la instancia
   * @param mcVersion Versión de Minecraft
   */
  validateDownload(instancePath: string, mcVersion: string): boolean {
    const clientJarPath = path.join(instancePath, 'client.jar');
    
    if (!fs.existsSync(clientJarPath)) {
      logProgressService.warning(`[Vanilla] client.jar no encontrado en ${clientJarPath}`);
      return false;
    }

    const stats = fs.statSync(clientJarPath);
    if (stats.size < 1024 * 1024) { // Menos de 1MB
      logProgressService.warning(`[Vanilla] client.jar parece estar incompleto (${stats.size} bytes)`);
      return false;
    }

    return true;
  }
}

export const downloadVanilla = new DownloadVanilla();

