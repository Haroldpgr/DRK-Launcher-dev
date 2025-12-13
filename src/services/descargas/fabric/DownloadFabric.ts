import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { logProgressService } from '../../logProgressService';
import { getLauncherDataPath } from '../../../utils/paths';
import { downloadQueueService } from '../../downloadQueueService';

/**
 * Servicio para descargar instancias Fabric de Minecraft
 */
export class DownloadFabric {
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
   * Descarga una instancia Fabric completa con mappings Intermediary
   * @param mcVersion Versión de Minecraft (ej. '1.20.1')
   * @param loaderVersion Versión del Fabric Loader (ej. '0.14.22')
   * @param instancePath Ruta donde se creará la instancia
   */
  async downloadInstance(
    mcVersion: string,
    loaderVersion: string | undefined,
    instancePath: string
  ): Promise<void> {
    try {
      logProgressService.info(`[Fabric] Iniciando descarga de Fabric ${loaderVersion || 'latest'} para Minecraft ${mcVersion}...`);
      
      // Asegurar que la carpeta de la instancia existe
      if (!fs.existsSync(instancePath)) {
        fs.mkdirSync(instancePath, { recursive: true });
      }

      // Obtener información de Fabric desde la API
      const fabricApiUrl = `https://meta.fabricmc.net/v2/versions/loader/${mcVersion}`;
      const response = await fetch(fabricApiUrl);
      const fabricVersions = await response.json();
      const fabricEntry = fabricVersions.find((v: any) => v.loader.stable) || fabricVersions[0];
      
      if (!fabricEntry) {
        throw new Error(`No se encontró versión compatible de Fabric para Minecraft ${mcVersion}`);
      }

      const finalLoaderVersion = loaderVersion || fabricEntry.loader.version;
      logProgressService.info(`[Fabric] Usando Fabric Loader ${finalLoaderVersion} con mappings Intermediary`);

      // 1. Descargar metadata de la versión
      logProgressService.info(`[Fabric] Descargando metadata de la versión...`);
      const versionJsonPath = await this.downloadVersionMetadata(mcVersion);
      const versionMetadata = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));

      // 2. Descargar el cliente base de Minecraft
      logProgressService.info(`[Fabric] Descargando client.jar...`);
      await this.downloadClientJar(mcVersion, instancePath, versionMetadata);
      
      // 3. Descargar assets
      logProgressService.info(`[Fabric] Descargando assets...`);
      await this.downloadAssets(mcVersion, versionMetadata);
      
      // 4. Descargar librerías base
      logProgressService.info(`[Fabric] Descargando librerías base...`);
      await this.downloadLibraries(versionMetadata);

      // 5. Descargar Fabric Loader
      logProgressService.info(`[Fabric] Descargando Fabric Loader...`);
      const loaderDir = path.join(instancePath, 'loader');
      if (!fs.existsSync(loaderDir)) {
        fs.mkdirSync(loaderDir, { recursive: true });
      }

      const fabricLoaderUrl = `https://maven.fabricmc.net/net/fabricmc/fabric-loader/${finalLoaderVersion}/fabric-loader-${finalLoaderVersion}.jar`;
      const fabricLoaderPath = path.join(loaderDir, `fabric-loader-${finalLoaderVersion}.jar`);

      if (!fs.existsSync(fabricLoaderPath)) {
        await this.downloadFile(fabricLoaderUrl, fabricLoaderPath);
      }

      // IMPORTANTE: Generar version.json con mappings Intermediary
      const fabricVersionJson = await this.generateFabricVersionJson(mcVersion, finalLoaderVersion, fabricEntry, instancePath);
      
      // Descargar todas las librerías del version.json de Fabric
      await this.downloadFabricLibraries(fabricVersionJson, instancePath);
      
      logProgressService.info(`[Fabric] Descarga completada exitosamente con mappings Intermediary`);
    } catch (error) {
      logProgressService.error(`[Fabric] Error al descargar instancia:`, error);
      throw error;
    }
  }

  /**
   * Descarga las librerías necesarias de Fabric
   */
  private async downloadFabricLibraries(fabricVersionJson: any, instancePath: string): Promise<void> {
    try {
      logProgressService.info(`[Fabric] Descargando librerías de Fabric...`);
      
      const { getLauncherDataPath } = require('../../utils/paths');
      const launcherPath = getLauncherDataPath();
      const librariesDir = path.join(launcherPath, 'libraries');
      
      if (!fabricVersionJson.libraries || !Array.isArray(fabricVersionJson.libraries)) {
        logProgressService.warning(`[Fabric] No se encontraron librerías en el version.json`);
        return;
      }

      let downloaded = 0;
      let skipped = 0;
      let failed = 0;

      for (const lib of fabricVersionJson.libraries) {
        try {
          let libPath: string | null = null;
          let libUrl: string | null = null;

          // Obtener ruta y URL de la librería
          if (lib.downloads?.artifact?.path && lib.downloads?.artifact?.url) {
            libPath = path.join(librariesDir, lib.downloads.artifact.path);
            libUrl = lib.downloads.artifact.url;
          } else if (lib.name) {
            // Construir ruta desde el nombre de la librería
            const libParts = lib.name.split(':');
            if (libParts.length >= 3) {
              const [groupId, artifactId, version] = libParts;
              const groupPath = groupId.replace(/\./g, '/');
              libPath = path.join(librariesDir, groupPath, artifactId, version, `${artifactId}-${version}.jar`);
              
              // Construir URL desde Maven
              libUrl = `https://maven.fabricmc.net/${groupPath}/${artifactId}/${version}/${artifactId}-${version}.jar`;
            }
          }

          if (!libPath || !libUrl) {
            continue;
          }

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

          await this.downloadFile(libUrl, libPath);
          downloaded++;
          
          if (downloaded % 10 === 0) {
            logProgressService.info(`[Fabric] Librerías descargadas: ${downloaded} (omitidas: ${skipped})`);
          }
        } catch (error) {
          failed++;
          logProgressService.warning(`[Fabric] Error al procesar librería ${lib.name}:`, error);
        }
      }

      logProgressService.info(`[Fabric] Librerías descargadas: ${downloaded} nuevas, ${skipped} existentes, ${failed} fallidas`);
    } catch (error) {
      logProgressService.error(`[Fabric] Error al descargar librerías:`, error);
      // No lanzar error, solo registrar
    }
  }

  /**
   * Genera el version.json de Fabric con mappings Intermediary
   */
  private async generateFabricVersionJson(
    mcVersion: string,
    loaderVersion: string,
    fabricEntry: any,
    instancePath: string
  ): Promise<any> {
    try {
      logProgressService.info(`[Fabric] Generando version.json con mappings Intermediary...`);

      // Obtener el perfil de versión base de Minecraft
      const baseVersionJsonPath = await this.downloadVersionMetadata(mcVersion);
      const baseVersionData = JSON.parse(fs.readFileSync(baseVersionJsonPath, 'utf-8'));

      // Obtener el perfil de versión de Fabric desde la API
      // La API de Fabric proporciona el perfil con mappings intermediary
      const fabricProfileUrl = `https://meta.fabricmc.net/v2/versions/loader/${mcVersion}/${loaderVersion}/profile/json`;
      logProgressService.info(`[Fabric] Descargando perfil de Fabric desde: ${fabricProfileUrl}`);
      
      const profileResponse = await fetch(fabricProfileUrl);
      if (!profileResponse.ok) {
        throw new Error(`Error al descargar perfil de Fabric: ${profileResponse.status}`);
      }

      const fabricVersionData = await profileResponse.json();

      // Verificar que el perfil tenga mappings intermediary
      if (!fabricVersionData.arguments || !fabricVersionData.libraries) {
        throw new Error('Perfil de Fabric inválido: falta información de mappings');
      }

      // Asegurar que las librerías incluyan las necesarias para Fabric
      const fabricLibraries = fabricVersionData.libraries || [];
      
      // Agregar Fabric Loader a las librerías si no está
      const fabricLoaderLib = {
        name: `net.fabricmc:fabric-loader:${loaderVersion}`,
        url: 'https://maven.fabricmc.net/'
      };
      
      const hasLoader = fabricLibraries.some((lib: any) => 
        lib.name && lib.name.includes('fabric-loader')
      );
      
      if (!hasLoader) {
        fabricLibraries.unshift(fabricLoaderLib);
      }

      // Construir el version.json final
      const versionName = `${mcVersion}-fabric-${loaderVersion}`;
      const fabricVersionJson = {
        id: versionName,
        inheritsFrom: mcVersion,
        time: baseVersionData.time || new Date().toISOString(),
        releaseTime: baseVersionData.releaseTime || baseVersionData.time || new Date().toISOString(),
        type: 'release',
        mainClass: 'net.fabricmc.loader.impl.launch.knot.KnotClient',
        arguments: {
          game: fabricVersionData.arguments?.game || baseVersionData.arguments?.game || [],
          jvm: fabricVersionData.arguments?.jvm || baseVersionData.arguments?.jvm || []
        },
        libraries: fabricLibraries,
        // Asegurar que se use mappings intermediary
        logging: baseVersionData.logging || {},
        assetIndex: baseVersionData.assetIndex || {},
        assets: baseVersionData.assets || mcVersion,
        downloads: baseVersionData.downloads || {}
      };

      // Guardar el version.json en la carpeta loader de la instancia
      const loaderDir = path.join(instancePath, 'loader');
      if (!fs.existsSync(loaderDir)) {
        fs.mkdirSync(loaderDir, { recursive: true });
      }

      const versionJsonPath = path.join(loaderDir, 'version.json');
      fs.writeFileSync(versionJsonPath, JSON.stringify(fabricVersionJson, null, 2));

      // También guardar en la carpeta de versiones del launcher para reutilización
      const launcherDataPath = getLauncherDataPath();
      const versionsDir = path.join(launcherDataPath, 'versions', versionName);
      if (!fs.existsSync(versionsDir)) {
        fs.mkdirSync(versionsDir, { recursive: true });
      }
      const launcherVersionJsonPath = path.join(versionsDir, `${versionName}.json`);
      fs.writeFileSync(launcherVersionJsonPath, JSON.stringify(fabricVersionJson, null, 2));

      logProgressService.info(`[Fabric] version.json generado con mappings Intermediary en: ${versionJsonPath}`);
      logProgressService.info(`[Fabric] version.json también guardado en: ${launcherVersionJsonPath}`);
      
      return fabricVersionJson;
    } catch (error) {
      logProgressService.error(`[Fabric] Error al generar version.json:`, error);
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
      logProgressService.info(`[Fabric] Descargando ${assetsToDownload.length} assets...`);
      
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
                logProgressService.info(`[Fabric] Asset descargado y verificado: ${downloadedCount}/${assetsToDownload.length} (${Math.floor((downloadedCount / assetsToDownload.length) * 100)}%)`);
              }
            } catch (error) {
              logProgressService.warning(`[Fabric] Error al descargar asset ${assetName}:`, error);
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

    logProgressService.info(`[Fabric] Descargando ${librariesToDownload.length} librerías base...`);

    const downloadPromises = librariesToDownload.map(async (library) => {
      try {
        await this.downloadLibrary(library);
      } catch (error) {
        logProgressService.warning(`[Fabric] Error al descargar librería ${library.name}:`, error);
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
   */
  validateDownload(instancePath: string, loaderVersion: string): boolean {
    const clientJarPath = path.join(instancePath, 'client.jar');
    const loaderJarPath = path.join(instancePath, 'loader', `fabric-loader-${loaderVersion}.jar`);
    
    if (!fs.existsSync(clientJarPath)) {
      logProgressService.warning(`[Fabric] client.jar no encontrado`);
      return false;
    }

    if (!fs.existsSync(loaderJarPath)) {
      logProgressService.warning(`[Fabric] Fabric Loader no encontrado`);
      return false;
    }

    return true;
  }
}

export const downloadFabric = new DownloadFabric();

