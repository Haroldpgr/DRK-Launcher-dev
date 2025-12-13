import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { logProgressService } from '../../logProgressService';
import { getLauncherDataPath } from '../../../utils/paths';
import { downloadQueueService } from '../../downloadQueueService';

/**
 * Servicio para descargar instancias Quilt de Minecraft
 */
export class DownloadQuilt {
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
   * Descarga una instancia Quilt completa con mappings Intermediary
   * @param mcVersion Versión de Minecraft (ej. '1.20.1')
   * @param loaderVersion Versión del Quilt Loader (ej. '0.20.0')
   * @param instancePath Ruta donde se creará la instancia
   */
  async downloadInstance(
    mcVersion: string,
    loaderVersion: string | undefined,
    instancePath: string
  ): Promise<void> {
    try {
      logProgressService.info(`[Quilt] Iniciando descarga de Quilt ${loaderVersion || 'latest'} para Minecraft ${mcVersion}...`);
      
      // Asegurar que la carpeta de la instancia existe
      if (!fs.existsSync(instancePath)) {
        fs.mkdirSync(instancePath, { recursive: true });
      }

      // Obtener información de Quilt desde la API
      const quiltApiUrl = `https://meta.quiltmc.org/v3/versions/loader/${mcVersion}`;
      const response = await fetch(quiltApiUrl);
      const quiltVersions = await response.json();
      
      if (!quiltVersions || quiltVersions.length === 0) {
        throw new Error(`No se encontró versión de Quilt para Minecraft ${mcVersion}`);
      }

      const quiltEntry = loaderVersion 
        ? quiltVersions.find((v: any) => v.loader?.version === loaderVersion)
        : quiltVersions.find((v: any) => v.loader?.stable) || quiltVersions[0];
      
      if (!quiltEntry) {
        throw new Error(`No se encontró versión compatible de Quilt para Minecraft ${mcVersion}`);
      }

      const finalLoaderVersion = loaderVersion || quiltEntry.loader.version;
      logProgressService.info(`[Quilt] Usando Quilt Loader ${finalLoaderVersion} con mappings Intermediary`);

      // 1. Descargar metadata de la versión
      logProgressService.info(`[Quilt] Descargando metadata de la versión...`);
      const versionJsonPath = await this.downloadVersionMetadata(mcVersion);
      const versionMetadata = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));

      // 2. Descargar el cliente base de Minecraft
      logProgressService.info(`[Quilt] Descargando client.jar...`);
      await this.downloadClientJar(mcVersion, instancePath, versionMetadata);
      
      // 3. Descargar assets
      logProgressService.info(`[Quilt] Descargando assets...`);
      await this.downloadAssets(mcVersion, versionMetadata);
      
      // 4. Descargar librerías base
      logProgressService.info(`[Quilt] Descargando librerías base...`);
      await this.downloadLibraries(versionMetadata);

      // Descargar Quilt Loader
      const loaderDir = path.join(instancePath, 'loader');
      if (!fs.existsSync(loaderDir)) {
        fs.mkdirSync(loaderDir, { recursive: true });
      }

      const quiltLoaderUrl = `https://maven.quiltmc.org/repository/release/org/quiltmc/quilt-loader/${finalLoaderVersion}/quilt-loader-${finalLoaderVersion}.jar`;
      const quiltLoaderPath = path.join(loaderDir, `quilt-loader-${finalLoaderVersion}.jar`);

      if (!fs.existsSync(quiltLoaderPath)) {
        await this.downloadFile(quiltLoaderUrl, quiltLoaderPath);
      }

      // IMPORTANTE: Generar version.json con mappings Intermediary
      const quiltVersionJson = await this.generateQuiltVersionJson(mcVersion, finalLoaderVersion, quiltEntry, instancePath);
      
      // Descargar todas las librerías del version.json de Quilt
      await this.downloadQuiltLibraries(quiltVersionJson, instancePath);
      
      logProgressService.info(`[Quilt] Descarga completada exitosamente con mappings Intermediary`);
    } catch (error) {
      logProgressService.error(`[Quilt] Error al descargar instancia:`, error);
      throw error;
    }
  }

  /**
   * Genera el version.json de Quilt con mappings Intermediary
   */
  private async generateQuiltVersionJson(
    mcVersion: string,
    loaderVersion: string,
    quiltEntry: any,
    instancePath: string
  ): Promise<any> {
    try {
      logProgressService.info(`[Quilt] Generando version.json con mappings Intermediary...`);

      // Obtener el perfil de versión base de Minecraft
      const baseVersionJsonPath = await this.downloadVersionMetadata(mcVersion);
      const baseVersionData = JSON.parse(fs.readFileSync(baseVersionJsonPath, 'utf-8'));

      // Obtener el perfil de versión de Quilt desde la API
      // La API de Quilt proporciona el perfil con mappings intermediary
      const quiltProfileUrl = `https://meta.quiltmc.org/v3/versions/loader/${mcVersion}/${loaderVersion}/profile/json`;
      logProgressService.info(`[Quilt] Descargando perfil de Quilt desde: ${quiltProfileUrl}`);
      
      const profileResponse = await fetch(quiltProfileUrl);
      if (!profileResponse.ok) {
        throw new Error(`Error al descargar perfil de Quilt: ${profileResponse.status}`);
      }

      const quiltVersionData = await profileResponse.json();

      // Verificar que el perfil tenga mappings intermediary
      if (!quiltVersionData.arguments || !quiltVersionData.libraries) {
        throw new Error('Perfil de Quilt inválido: falta información de mappings');
      }

      // Asegurar que las librerías incluyan las necesarias para Quilt
      const quiltLibraries = quiltVersionData.libraries || [];
      
      // Agregar Quilt Loader a las librerías si no está
      const quiltLoaderLib = {
        name: `org.quiltmc:quilt-loader:${loaderVersion}`,
        url: 'https://maven.quiltmc.org/repository/release/'
      };
      
      const hasLoader = quiltLibraries.some((lib: any) => 
        lib.name && lib.name.includes('quilt-loader')
      );
      
      if (!hasLoader) {
        quiltLibraries.unshift(quiltLoaderLib);
      }

      // Construir el version.json final
      const versionName = `${mcVersion}-quilt-${loaderVersion}`;
      const quiltVersionJson = {
        id: versionName,
        inheritsFrom: mcVersion,
        time: baseVersionData.time || new Date().toISOString(),
        releaseTime: baseVersionData.releaseTime || baseVersionData.time || new Date().toISOString(),
        type: 'release',
        mainClass: 'org.quiltmc.loader.impl.launch.knot.KnotClient',
        arguments: {
          game: quiltVersionData.arguments?.game || baseVersionData.arguments?.game || [],
          jvm: quiltVersionData.arguments?.jvm || baseVersionData.arguments?.jvm || []
        },
        libraries: quiltLibraries,
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
      fs.writeFileSync(versionJsonPath, JSON.stringify(quiltVersionJson, null, 2));

      // También guardar en la carpeta de versiones del launcher para reutilización
      const launcherDataPath = getLauncherDataPath();
      const versionsDir = path.join(launcherDataPath, 'versions', versionName);
      if (!fs.existsSync(versionsDir)) {
        fs.mkdirSync(versionsDir, { recursive: true });
      }
      const launcherVersionJsonPath = path.join(versionsDir, `${versionName}.json`);
      fs.writeFileSync(launcherVersionJsonPath, JSON.stringify(quiltVersionJson, null, 2));

      logProgressService.info(`[Quilt] version.json generado con mappings Intermediary en: ${versionJsonPath}`);
      logProgressService.info(`[Quilt] version.json también guardado en: ${launcherVersionJsonPath}`);
      
      return quiltVersionJson;
    } catch (error) {
      logProgressService.error(`[Quilt] Error al generar version.json:`, error);
      throw error;
    }
  }

  /**
   * Descarga las librerías necesarias de Quilt
   */
  private async downloadQuiltLibraries(quiltVersionJson: any, instancePath: string): Promise<void> {
    try {
      logProgressService.info(`[Quilt] Descargando librerías de Quilt...`);
      
      const launcherPath = getLauncherDataPath();
      const librariesDir = path.join(launcherPath, 'libraries');
      
      if (!quiltVersionJson.libraries || !Array.isArray(quiltVersionJson.libraries)) {
        logProgressService.warning(`[Quilt] No se encontraron librerías en el version.json`);
        return;
      }

      let downloaded = 0;
      let skipped = 0;
      let failed = 0;

      for (const lib of quiltVersionJson.libraries) {
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
              const baseUrl = lib.url || 'https://maven.quiltmc.org/repository/release/';
              libUrl = `${baseUrl}${groupPath}/${artifactId}/${version}/${artifactId}-${version}.jar`;
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
            logProgressService.info(`[Quilt] Librerías descargadas: ${downloaded} (omitidas: ${skipped})`);
          }
        } catch (error) {
          failed++;
          logProgressService.warning(`[Quilt] Error al procesar librería ${lib.name}:`, error);
        }
      }

      logProgressService.info(`[Quilt] Librerías descargadas: ${downloaded} nuevas, ${skipped} existentes, ${failed} fallidas`);
    } catch (error) {
      logProgressService.error(`[Quilt] Error al descargar librerías:`, error);
      // No lanzar error, solo registrar
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
      logProgressService.info(`[Quilt] Descargando ${assetsToDownload.length} assets...`);
      
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
                logProgressService.info(`[Quilt] Asset descargado y verificado: ${downloadedCount}/${assetsToDownload.length} (${Math.floor((downloadedCount / assetsToDownload.length) * 100)}%)`);
              }
            } catch (error) {
              logProgressService.warning(`[Quilt] Error al descargar asset ${assetName}:`, error);
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

    logProgressService.info(`[Quilt] Descargando ${librariesToDownload.length} librerías base...`);

    const downloadPromises = librariesToDownload.map(async (library) => {
      try {
        await this.downloadLibrary(library);
      } catch (error) {
        logProgressService.warning(`[Quilt] Error al descargar librería ${library.name}:`, error);
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
    const loaderJarPath = path.join(instancePath, 'loader', `quilt-loader-${loaderVersion}.jar`);
    
    if (!fs.existsSync(clientJarPath)) {
      logProgressService.warning(`[Quilt] client.jar no encontrado`);
      return false;
    }

    if (!fs.existsSync(loaderJarPath)) {
      logProgressService.warning(`[Quilt] Quilt Loader no encontrado`);
      return false;
    }

    return true;
  }
}

export const downloadQuilt = new DownloadQuilt();

