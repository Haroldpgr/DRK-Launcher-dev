import path from 'node:path';
import fs from 'node:fs';
import { pipeline } from 'node:stream';
import { promisify } from 'node:util';
import fetch from 'node-fetch';
import { basePaths } from '../main/main';
import { getLauncherDataPath } from '../utils/paths';
import { downloadQueueService } from './downloadQueueService';

const pipelineAsync = promisify(pipeline);

/**
 * Servicio para manejar la descarga de versiones base de Minecraft
 */
export class MinecraftDownloadService {
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

  /**
   * Asegura que un directorio exista, creándolo si es necesario
   * @param dir Directorio a asegurar
   */
  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Descarga la metadata de una versión específica de Minecraft
   * @param version Versión de Minecraft (por ejemplo, '1.20.1')
   * @returns Ruta al archivo version.json
   */
  public async downloadVersionMetadata(version: string): Promise<string> {
    const versionDir = path.join(this.versionsPath, version);
    this.ensureDir(versionDir);
    
    const versionJsonPath = path.join(versionDir, 'version.json');
    
    // Verificar si ya existe la metadata
    if (fs.existsSync(versionJsonPath)) {
      console.log(`Metadata de la versión ${version} ya existe`);
      return versionJsonPath;
    }

    try {
      // Obtener URL de metadata desde Mojang
      const manifestResponse = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json');
      const manifest = await manifestResponse.json();
      
      const versionInfo = manifest.versions.find((v: any) => v.id === version);
      if (!versionInfo) {
        throw new Error(`Versión ${version} no encontrada en el manifest`);
      }

      const versionMetadataResponse = await fetch(versionInfo.url);
      const versionMetadata = await versionMetadataResponse.json();
      
      // Guardar metadata
      fs.writeFileSync(versionJsonPath, JSON.stringify(versionMetadata, null, 2));
      
      console.log(`Metadata de la versión ${version} descargada`);
      return versionJsonPath;
    } catch (error) {
      console.error(`Error al descargar metadata de la versión ${version}:`, error);
      throw error;
    }
  }

  /**
   * Descarga las librerías base de una versión de Minecraft
   * @param version Versión de Minecraft
   */
  public async downloadVersionLibraries(version: string): Promise<void> {
    const versionJsonPath = await this.downloadVersionMetadata(version);
    const versionMetadata = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));
    
    const libraries = versionMetadata.libraries || [];
    
    console.log(`Descargando ${libraries.length} librerías para la versión ${version}...`);
    
    for (const library of libraries) {
      await this.downloadLibrary(library);
    }
    
    console.log(`Descarga de librerías para la versión ${version} completada`);
  }

  /**
   * Descarga una librería específica
   * @param library Objeto de librería desde el version.json
   */
  private async downloadLibrary(library: any): Promise<void> {
    // Verificar reglas de compatibilidad
    if (library.rules) {
      const allowed = this.isLibraryAllowed(library.rules);
      if (!allowed) {
        console.log(`Librería ${library.name} no permitida en este sistema, omitiendo...`);
        return;
      }
    }

    const downloads = library.downloads;
    if (!downloads || !downloads.artifact) {
      console.log(`Librería ${library.name} no tiene URLs de descarga, omitiendo...`);
      return;
    }

    const artifact = downloads.artifact;
    const libraryPath = this.getLibraryPath(library.name);
    const libraryDir = path.dirname(libraryPath);
    
    this.ensureDir(libraryDir);

    // Verificar si la librería ya existe
    if (fs.existsSync(libraryPath)) {
      console.log(`Librería ${library.name} ya existe, omitiendo...`);
      return;
    }

    try {
      // Extraer hash si está disponible
      const expectedHash = artifact.sha1 || library?.downloads?.artifact?.sha1;
      await this.downloadFile(artifact.url, libraryPath, expectedHash, 'sha1');
      console.log(`Librería ${library.name} descargada`);
    } catch (error) {
      console.error(`Error al descargar librería ${library.name}:`, error);
    }
  }

  /**
   * Verifica si una librería está permitida según las reglas
   */
  private isLibraryAllowed(rules: any[]): boolean {
    let allowed = false;
    
    for (const rule of rules) {
      const osName = rule.os?.name;
      const action = rule.action;
      
      if (osName) {
        // Determinar sistema operativo actual
        let currentOs = '';
        switch (process.platform) {
          case 'win32': currentOs = 'windows'; break;
          case 'darwin': currentOs = 'osx'; break;
          case 'linux': currentOs = 'linux'; break;
          default: currentOs = 'linux';
        }
        
        if (osName === currentOs) {
          allowed = action === 'allow';
        } else if (!osName && action === 'allow') {
          allowed = true;
        }
      } else if (!osName) {
        allowed = action === 'allow';
      }
    }
    
    return allowed;
  }

  /**
   * Convierte el nombre de la librería al formato de ruta
   * Ej: net.minecraft:client:1.20.1 -> net/minecraft/client/1.20.1/client-1.20.1.jar
   */
  private getLibraryPath(libraryName: string): string {
    const [group, artifact, version] = libraryName.split(':');
    const artifactWithoutClassifier = artifact.split('@')[0]; // Remover extensión si está presente
    const ext = artifact.includes('@') ? artifact.split('@')[1] : 'jar';
    
    const parts = group.split('.');
    const libraryDir = path.join(this.librariesPath, ...parts, artifactWithoutClassifier, version);
    const fileName = `${artifactWithoutClassifier}-${version}.${ext}`;
    
    return path.join(libraryDir, fileName);
  }

  /**
   * Descarga un archivo
   */
  private async downloadFile(url: string, outputPath: string, expectedHash?: string, hashAlgorithm?: string): Promise<void> {
    // Usar el servicio de cola de descargas para manejar timeouts y errores
    const downloadId = await downloadQueueService.addDownload(url, outputPath, expectedHash, hashAlgorithm);

    // Esperar a que la descarga se complete
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
          // Continuar verificando cada 500ms
          setTimeout(checkStatus, 500);
        }
      };

      checkStatus();
    });
  }

  /**
   * Descarga el archivo client.jar para una versión específica
   * @param version Versión de Minecraft
   * @param instancePath Ruta de la instancia donde colocar el client.jar
   */
  public async downloadClientJar(version: string, instancePath: string): Promise<string> {
    const clientJarPath = path.join(instancePath, 'client.jar');

    // Verificar si ya existe
    if (fs.existsSync(clientJarPath)) {
      console.log(`client.jar ya existe para la versión ${version}`);
      return clientJarPath;
    }

    // Asegurarse de que la carpeta de la instancia exista
    this.ensureDir(instancePath);

    const versionJsonPath = await this.downloadVersionMetadata(version);
    const versionMetadata = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));

    const clientDownloadUrl = versionMetadata.downloads?.client?.url;
    if (!clientDownloadUrl) {
      throw new Error(`No se encontró URL de descarga para client.jar de la versión ${version}`);
    }

    try {
      // Extraer hash del cliente si está disponible en los metadatos
      const versionJsonPath = await this.downloadVersionMetadata(version);
      const versionMetadata = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));
      const expectedHash = versionMetadata.downloads?.client?.sha1;

      await this.downloadFile(clientDownloadUrl, clientJarPath, expectedHash, 'sha1');

      // Verificar que el archivo se haya descargado correctamente
      if (!fs.existsSync(clientJarPath)) {
        throw new Error(`client.jar no se descargó correctamente en ${clientJarPath}`);
      }

      const stats = fs.statSync(clientJarPath);
      if (stats.size < 1024 * 1024) { // Menos de 1MB
        throw new Error(`client.jar descargado tiene un tamaño inusualmente pequeño: ${stats.size} bytes`);
      }

      console.log(`client.jar descargado correctamente para la versión ${version} en ${clientJarPath} (${stats.size} bytes)`);
      return clientJarPath;
    } catch (error) {
      console.error(`Error al descargar client.jar para la versión ${version}:`, error);
      // Intentar crear un archivo vacío para evitar fallos catastróficos
      try {
        fs.writeFileSync(clientJarPath, '');
      } catch (writeError) {
        console.error(`Error al crear archivo client.jar temporal:`, writeError);
      }
      throw error;
    }
  }

  /**
   * Descarga todos los archivos necesarios para una versión de Minecraft
   * @param version Versión de Minecraft
   * @param instancePath Ruta de la instancia
   */
  public async downloadCompleteVersion(version: string, instancePath: string): Promise<void> {
    console.log(`Descargando versión completa de Minecraft ${version}...`);

    // 1. Descargar metadata de la versión
    const versionJsonPath = await this.downloadVersionMetadata(version);

    // 2. Descargar librerías
    await this.downloadVersionLibraries(version);

    // 3. Descargar cliente
    await this.downloadClientJar(version, instancePath);

    // 4. Descargar assets
    await this.downloadVersionAssets(version);

    // 5. Asegurar que todos los archivos críticos estén presentes en la instancia
    await this.ensureCriticalFiles(version, instancePath, versionJsonPath);

    console.log(`Versión completa de Minecraft ${version} descargada`);
  }

  /**
   * Asegura que todos los archivos críticos necesarios estén presentes en la instancia
   */
  private async ensureCriticalFiles(version: string, instancePath: string, versionJsonPath: string): Promise<void> {
    console.log(`Asegurando archivos críticos para la versión ${version}...`);

    // Leer el archivo de metadata
    const versionMetadata = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));

    // Asegurar que el client.jar esté en la instancia (si no, descargarlo)
    const clientJarPath = path.join(instancePath, 'client.jar');
    if (!fs.existsSync(clientJarPath) || fs.statSync(clientJarPath).size < 1024 * 1024) {
      // Descargar cliente si no existe o es demasiado pequeño
      if (versionMetadata.downloads?.client?.url) {
        const expectedHash = versionMetadata.downloads.client.sha1;
        await this.downloadFile(versionMetadata.downloads.client.url, clientJarPath, expectedHash, 'sha1');
        console.log(`client.jar asegurado en la instancia: ${clientJarPath}`);
      }
    }

    // Asegurar que la carpeta de assets esté disponible (como enlace simbólico o creando estructura)
    const assetsPath = path.join(instancePath, 'assets');
    const launcherAssetsPath = path.join(this.assetsPath, '..'); // Carpeta de assets compartida

    if (!fs.existsSync(assetsPath)) {
      try {
        // Crear directorio de assets si no existe
        fs.mkdirSync(assetsPath, { recursive: true });
        console.log(`Carpeta de assets creada en la instancia: ${assetsPath}`);
      } catch (error) {
        console.error(`Error al crear carpeta de assets en la instancia:`, error);
      }
    }

    // Asegurar carpetas base
    const requiredFolders = ['mods', 'config', 'saves', 'logs', 'resourcepacks', 'shaderpacks'];
    for (const folder of requiredFolders) {
      const folderPath = path.join(instancePath, folder);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
    }

    console.log(`Archivos críticos asegurados para la versión ${version}`);
  }

  /**
   * Descarga los assets para una versión específica
   * @param version Versión de Minecraft
   */
  public async downloadVersionAssets(version: string): Promise<void> {
    const versionJsonPath = await this.downloadVersionMetadata(version);
    const versionMetadata = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));

    // Obtener el índice de assets
    const assetIndex = versionMetadata.assetIndex;
    if (!assetIndex) {
      console.log(`No se encontró asset index para la versión ${version}, omitiendo assets...`);
      return;
    }

    const assetIndexUrl = assetIndex.url;
    const assetIndexPath = path.join(this.assetsPath, 'indexes', `${assetIndex.id}.json`);

    this.ensureDir(path.dirname(assetIndexPath));

    // Verificar si el índice de assets ya existe
    if (!fs.existsSync(assetIndexPath)) {
      await this.downloadFile(assetIndexUrl, assetIndexPath);
      console.log(`Asset index descargado para la versión ${version}`);
    }

    // Cargar el índice de assets
    const assetIndexData = JSON.parse(fs.readFileSync(assetIndexPath, 'utf-8'));
    console.log(`Descargando ${Object.keys(assetIndexData.objects).length} assets para la versión ${version}...`);

    // Descargar cada asset
    const assetsObjects = assetIndexData.objects;
    let downloadedCount = 0;
    const totalAssets = Object.keys(assetsObjects).length;

    for (const [assetName, assetInfo] of Object.entries(assetsObjects as any)) {
      const hash = (assetInfo as any).hash;
      const size = (assetInfo as any).size;

      // Crear la ruta del asset basada en el hash (primeros 2 dígitos como subcarpeta)
      const assetDir = path.join(this.assetsPath, 'objects', hash.substring(0, 2));
      const assetPath = path.join(assetDir, hash);
      this.ensureDir(assetDir);

      // Verificar si el asset ya existe
      if (!fs.existsSync(assetPath)) {
        // URL del asset: https://resources.download.minecraft.net/[first_2_chars_of_hash]/[full_hash]
        const assetUrl = `https://resources.download.minecraft.net/${hash.substring(0, 2)}/${hash}`;

        try {
          // Usar el hash del objeto de asset para verificación
          const expectedHash = (assetInfo as any).hash;
          await this.downloadFile(assetUrl, assetPath, expectedHash, 'sha1');
          downloadedCount++;
          console.log(`Asset descargado [${downloadedCount}/${totalAssets}]: ${assetName}`);
        } catch (error) {
          console.error(`Error al descargar asset ${assetName}:`, error);
          // Continuar con los demás assets
        }
      } else {
        downloadedCount++;
        console.log(`Asset ya existe [${downloadedCount}/${totalAssets}]: ${assetName}`);
      }
    }

    console.log(`Descarga de assets completada para la versión ${version}: ${downloadedCount}/${totalAssets} assets`);
  }
}

export const minecraftDownloadService = new MinecraftDownloadService();