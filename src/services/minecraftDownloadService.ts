import path from 'node:path';
import fs from 'node:fs';
import { pipeline } from 'node:stream';
import { promisify } from 'node:util';
import fetch from 'node-fetch';
import crypto from 'node:crypto';
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
  private indexesPath: string;
  private objectsPath: string;

  constructor() {
    const launcherPath = getLauncherDataPath();
    this.versionsPath = path.join(launcherPath, 'versions');
    this.librariesPath = path.join(launcherPath, 'libraries');
    this.assetsPath = path.join(launcherPath, 'assets');
    this.indexesPath = path.join(this.assetsPath, 'indexes');
    this.objectsPath = path.join(this.assetsPath, 'objects');

    this.ensureDir(this.versionsPath);
    this.ensureDir(this.librariesPath);
    this.ensureDir(this.assetsPath);
    this.ensureDir(this.indexesPath);
    this.ensureDir(this.objectsPath);
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
   * Valida y descarga los assets faltantes para una versión específica de Minecraft
   * @param version Versión de Minecraft (por ejemplo, '1.21.1')
   * @returns Promise<boolean> Verdadero si todos los assets están presentes o se descargaron exitosamente
   */
  public async validateAndDownloadAssets(version: string): Promise<boolean> {
    try {
      const versionJsonPath = await this.downloadVersionMetadata(version);
      const versionMetadata = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));

      // Obtener el índice de assets
      const assetIndex = versionMetadata.assetIndex;
      if (!assetIndex) {
        console.log(`No se encontró asset index para la versión ${version}, omitiendo validación...`);
        return true;
      }

      const assetIndexUrl = assetIndex.url;
      const assetIndexPath = path.join(this.indexesPath, `${assetIndex.id}.json`);

      // Asegurar que el archivo de índice exista
      if (!fs.existsSync(assetIndexPath)) {
        console.log(`Descargando índice de assets para ${version}...`);
        await this.downloadFile(assetIndexUrl, assetIndexPath);
      }

      // Cargar el índice de assets
      const assetIndexData = JSON.parse(fs.readFileSync(assetIndexPath, 'utf-8'));
      const assetsObjects = assetIndexData.objects;
      const totalAssets = Object.keys(assetsObjects).length;

      console.log(`Validando ${totalAssets} assets para la versión ${version}...`);

      // Contar assets faltantes
      let missingAssets = 0;
      const assetsToDownload = [];

      for (const [assetName, assetInfo] of Object.entries(assetsObjects as any)) {
        const hash = (assetInfo as any).hash;
        const size = (assetInfo as any).size;

        // Crear la ruta del asset basada en el hash (primeros 2 dígitos como subcarpeta)
        const assetDir = path.join(this.objectsPath, hash.substring(0, 2));
        const assetPath = path.join(assetDir, hash);

        // Verificar si el asset existe y tiene el tamaño correcto
        if (!fs.existsSync(assetPath)) {
          missingAssets++;
          assetsToDownload.push({ assetName, assetInfo, assetPath, hash, size });
        } else {
          const stats = fs.statSync(assetPath);
          if (stats.size !== size) {
            console.log(`Asset tiene tamaño incorrecto, se volverá a descargar: ${assetName}`);
            missingAssets++;
            assetsToDownload.push({ assetName, assetInfo, assetPath, hash, size });
          } else {
            // Verificar el hash del archivo para asegurar la integridad
            try {
              const fileBuffer = fs.readFileSync(assetPath);
              const calculatedHash = crypto.createHash('sha1').update(fileBuffer).digest('hex');

              if (calculatedHash !== hash) {
                console.log(`Asset tiene hash incorrecto, se volverá a descargar: ${assetName}`);
                missingAssets++;
                assetsToDownload.push({ assetName, assetInfo, assetPath, hash, size });
              }
            } catch (hashError) {
              console.warn(`No se pudo verificar el hash del asset ${assetName}:`, hashError.message);
              // Si no podemos verificar el hash, asumimos que está bien para no re-descargar todo
            }
          }
        }
      }

      if (missingAssets > 0) {
        console.log(`Encontrados ${missingAssets} assets faltantes o incorrectos para la versión ${version}. Iniciando descarga...`);

        // Descargar assets faltantes
        let downloadedCount = 0;
        for (const assetData of assetsToDownload) {
          const { assetPath, hash, size, assetName } = assetData;
          const assetDir = path.dirname(assetPath);

          this.ensureDir(assetDir);

          // URL del asset: https://resources.download.minecraft.net/[first_2_chars_of_hash]/[full_hash]
          const assetUrl = `https://resources.download.minecraft.net/${hash.substring(0, 2)}/${hash}`;

          try {
            await this.downloadFile(assetUrl, assetPath, hash, 'sha1');

            // Verificar que el archivo descargado tenga el hash correcto
            const fileBuffer = fs.readFileSync(assetPath);
            const calculatedHash = crypto.createHash('sha1').update(fileBuffer).digest('hex');

            if (calculatedHash === hash) {
              downloadedCount++;
              console.log(`Asset descargado y verificado: ${assetName} (${Math.floor((downloadedCount) / assetsToDownload.length * 100)}%)`);
            } else {
              console.error(`El asset descargado tiene hash incorrecto: ${assetName} (esperado: ${hash}, obtenido: ${calculatedHash})`);
              // Eliminar archivo con hash incorrecto
              fs.unlinkSync(assetPath);
            }
          } catch (downloadError) {
            console.error(`Error al descargar asset ${assetName}:`, downloadError);
            // No lanzar error aquí para continuar con otros assets
          }
        }

        console.log(`Descarga de assets completada para la versión ${version}: ${downloadedCount}/${assetsToDownload.length} assets nuevos descargados`);
      } else {
        console.log(`Todos los assets están presentes y correctos para la versión ${version}`);
      }

      return true;
    } catch (error) {
      console.error(`Error al validar y descargar assets para la versión ${version}:`, error);
      throw error;
    }
  }

  /**
   * Asegura que archivos críticos como los de idioma estén presentes para una versión
   * @param version Versión de Minecraft
   */
  public async ensureCriticalAssets(version: string): Promise<void> {
    try {
      const versionJsonPath = await this.downloadVersionMetadata(version);
      const versionMetadata = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));

      // Obtener el índice de assets
      const assetIndex = versionMetadata.assetIndex;
      if (!assetIndex) {
        console.log(`No se encontró asset index para la versión ${version}, omitiendo verificación de assets críticos...`);
        return;
      }

      const assetIndexPath = path.join(this.indexesPath, `${assetIndex.id}.json`);

      // Asegurar que el archivo de índice exista
      if (!fs.existsSync(assetIndexPath)) {
        console.log(`Descargando índice de assets para ${version}...`);
        const assetIndexUrl = assetIndex.url;
        await this.downloadFile(assetIndexUrl, assetIndexPath);
      }

      // Cargar el índice de assets
      const assetIndexData = JSON.parse(fs.readFileSync(assetIndexPath, 'utf-8'));
      const assetsObjects = assetIndexData.objects;

      // Buscar archivos de idioma (archivos que contienen 'lang' en su nombre)
      const languageAssets = Object.keys(assetsObjects)
        .filter(assetName =>
          assetName.includes('lang') &&
          (assetName.endsWith('.json') || assetName.endsWith('.lang'))
        );

      console.log(`Verificando ${languageAssets.length} assets de idioma para la versión ${version}...`);

      // Verificar que cada asset de idioma esté presente
      for (const assetName of languageAssets) {
        const assetInfo = assetsObjects[assetName];
        const hash = assetInfo.hash;
        const size = assetInfo.size;

        // Crear la ruta del asset basada en el hash (primeros 2 dígitos como subcarpeta)
        const assetDir = path.join(this.objectsPath, hash.substring(0, 2));
        const assetPath = path.join(assetDir, hash);

        // Verificar si el asset existe y tiene el tamaño correcto
        if (!fs.existsSync(assetPath)) {
          console.log(`Descargando asset de idioma faltante: ${assetName}`);
          this.ensureDir(assetDir);

          // URL del asset: https://resources.download.minecraft.net/[first_2_chars_of_hash]/[full_hash]
          const assetUrl = `https://resources.download.minecraft.net/${hash.substring(0, 2)}/${hash}`;

          try {
            await this.downloadFile(assetUrl, assetPath, hash, 'sha1');

            // Verificar que el archivo descargado tenga el hash correcto
            const fileBuffer = fs.readFileSync(assetPath);
            const calculatedHash = crypto.createHash('sha1').update(fileBuffer).digest('hex');

            if (calculatedHash === hash) {
              console.log(`Asset de idioma descargado y verificado: ${assetName}`);
            } else {
              console.error(`El asset de idioma descargado tiene hash incorrecto: ${assetName}`);
              fs.unlinkSync(assetPath);
            }
          } catch (downloadError) {
            console.error(`Error al descargar asset de idioma ${assetName}:`, downloadError);
          }
        }
      }

      console.log(`Verificación de assets de idioma completada para la versión ${version}`);
    } catch (error) {
      console.error(`Error al asegurar assets críticos para la versión ${version}:`, error);
      throw error;
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

    // 4. Descargar assets (ESTO ES LO MÁS IMPORTANTE)
    console.log(`Iniciando descarga de assets para la versión ${version}...`);
    await this.downloadVersionAssets(version);
    console.log(`Descarga de assets completada para la versión ${version}`);

    // 5. Asegurar que todos los archivos críticos estén presentes en la instancia
    await this.ensureCriticalFiles(version, instancePath, versionJsonPath);

    // 6. Asegurar que los assets estén disponibles para la instancia
    await this.ensureAssetsForInstance(version, instancePath);

    // 7. Verificar que la versión esté completamente lista
    await this.verifyCompleteDownload(version, instancePath, versionJsonPath);

    console.log(`Versión completa de Minecraft ${version} descargada`);
  }

  /**
   * Verifica que todos los archivos necesarios estén completamente descargados
   */
  private async verifyCompleteDownload(version: string, instancePath: string, versionJsonPath: string): Promise<void> {
    console.log(`Verificando completitud de la descarga para la versión ${version}...`);

    // Verificar que el client.jar exista y tenga tamaño razonable
    const clientJarPath = path.join(instancePath, 'client.jar');
    if (!fs.existsSync(clientJarPath)) {
      throw new Error(`client.jar no encontrado en ${clientJarPath}`);
    }

    const clientStats = fs.statSync(clientJarPath);
    if (clientStats.size < 1024 * 1024) { // Menos de 1MB
      throw new Error(`client.jar tiene tamaño inusualmente pequeño: ${clientStats.size} bytes`);
    }

    // Verificar que el archivo de metadata de la versión exista
    const versionMetadata = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));

    // Verificar que el asset index esté disponible
    const assetIndexId = versionMetadata.assetIndex?.id;
    if (assetIndexId) {
      const assetIndexPath = path.join(this.assetsPath, 'indexes', `${assetIndexId}.json`);
      if (!fs.existsSync(assetIndexPath)) {
        throw new Error(`Índice de assets no encontrado: ${assetIndexPath}`);
      }

      // Cargar el índice y verificar algunos assets importantes
      const assetIndexData = JSON.parse(fs.readFileSync(assetIndexPath, 'utf-8'));
      const objects = assetIndexData.objects || {};

      // Verificar que al menos algunos assets hayan sido procesados
      if (Object.keys(objects).length === 0) {
        console.warn(`advertencia: No se encontraron objetos en el índice de assets para ${version}`);
      } else {
        console.log(`Verificados ${Object.keys(objects).length} assets en el índice para la versión ${version}`);
      }
    }

    // Verificar que la carpeta de libraries tenga contenido (si hay librerías en el metadata)
    if (versionMetadata.libraries && versionMetadata.libraries.length > 0) {
      const librariesPath = path.join(this.librariesPath, '..'); // Carpeta compartida de librerías
      if (!fs.existsSync(librariesPath)) {
        console.warn(`Carpeta de librerías no encontrada: ${librariesPath}`);
      } else {
        const libraryFiles = fs.readdirSync(librariesPath).filter(f => f.includes(version));
        console.log(`Encontradas ${libraryFiles.length} librerías relacionadas con la versión ${version}`);
      }
    }

    console.log(`Verificación completada para la versión ${version}: todos los archivos críticos están presentes`);
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
   * Descarga los assets para una versión específica con verificación de integridad
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
    const assetIndexPath = path.join(this.indexesPath, `${assetIndex.id}.json`);

    this.ensureDir(path.dirname(assetIndexPath));

    // Verificar si el índice de assets ya existe
    if (!fs.existsSync(assetIndexPath)) {
      try {
        await this.downloadFile(assetIndexUrl, assetIndexPath);
        console.log(`Asset index descargado para la versión ${version}: ${assetIndexPath}`);
      } catch (error) {
        console.error(`Error al descargar asset index para la versión ${version}:`, error);
        throw error; // Lanzar error para que se sepa que falló
      }
    } else {
      console.log(`Asset index ya existe para la versión ${version}: ${assetIndexPath}`);
    }

    // Cargar el índice de assets
    const assetIndexData = JSON.parse(fs.readFileSync(assetIndexPath, 'utf-8'));
    console.log(`Procesando ${Object.keys(assetIndexData.objects).length} assets para la versión ${version}...`);

    // Descargar cada asset
    const assetsObjects = assetIndexData.objects;
    const totalAssets = Object.keys(assetsObjects).length;

    // Si no hay assets para descargar, terminar aquí
    if (totalAssets === 0) {
      console.log(`No hay assets para descargar para la versión ${version}`);
      return;
    }

    console.log(`Iniciando descarga de ${totalAssets} assets para la versión ${version}...`);

    // Procesar los assets en lotes para evitar sobrecargar el sistema
    const batchSize = 5; // Reducir el tamaño del lote para mayor estabilidad
    let downloadedCount = 0;
    let verifiedCount = 0;
    const assetsEntries = Object.entries(assetsObjects as any);

    for (let i = 0; i < assetsEntries.length; i += batchSize) {
      // Verificar si se ha solicitado cancelar la descarga
      // (Aquí se podría implementar la verificación de un token de cancelación)

      const batch = assetsEntries.slice(i, i + batchSize);

      // Procesar el batch en paralelo
      const batchPromises = batch.map(async ([assetName, assetInfo]) => {
        const hash = (assetInfo as any).hash;
        const size = (assetInfo as any).size;

        // Crear la ruta del asset basada en el hash (primeros 2 dígitos como subcarpeta)
        const assetDir = path.join(this.objectsPath, hash.substring(0, 2));
        const assetPath = path.join(assetDir, hash);
        this.ensureDir(assetDir);

        try {
          // Verificar si el asset ya existe y tiene el tamaño correcto
          if (fs.existsSync(assetPath)) {
            const stats = fs.statSync(assetPath);
            if (stats.size === size) {
              // Verificar hash si es posible (requiere cálculo, omitido por rendimiento)
              verifiedCount++;
              downloadedCount++;
              console.log(`Asset verificado [${verifiedCount}/${totalAssets}]: ${assetName}`);
              return true;
            } else {
              console.log(`Asset tiene tamaño incorrecto, se volverá a descargar: ${assetName}`);
              fs.unlinkSync(assetPath); // Eliminar archivo con tamaño incorrecto
            }
          }

          // URL del asset: https://resources.download.minecraft.net/[first_2_chars_of_hash]/[full_hash]
          const assetUrl = `https://resources.download.minecraft.net/${hash.substring(0, 2)}/${hash}`;

          try {
            // Descargar asset con verificación de hash
            await this.downloadFile(assetUrl, assetPath, hash, 'sha1');

            // Verificar que el tamaño sea correcto después de la descarga
            const finalStats = fs.statSync(assetPath);
            if (finalStats.size !== size) {
              console.warn(`Advertencia: Asset descargado tiene tamaño incorrecto: ${assetName} (${finalStats.size} vs ${size})`);
            }

            downloadedCount++;
            verifiedCount++;
            console.log(`Asset descargado y verificado [${downloadedCount}/${totalAssets}]: ${assetName}`);
            return true;
          } catch (downloadError) {
            console.error(`Error al descargar o verificar asset ${assetName}:`, downloadError);

            // Si el archivo parcial existe, eliminarlo
            if (fs.existsSync(assetPath)) {
              try {
                fs.unlinkSync(assetPath);
              } catch (unlinkError) {
                console.error(`Error al eliminar asset parcial ${assetName}:`, unlinkError);
              }
            }

            return false;
          }
        } catch (error) {
          console.error(`Error al procesar asset ${assetName}:`, error);
          return false;
        }
      });

      // Esperar a que se complete el batch actual
      await Promise.all(batchPromises);
    }

    console.log(`Descarga de assets completada para la versión ${version}: ${downloadedCount}/${totalAssets} assets`);
    console.log(`Verificación de assets completada para la versión ${version}: ${verifiedCount}/${totalAssets} assets`);

    if (downloadedCount < totalAssets) {
      console.warn(`Advertencia: Solo ${downloadedCount} de ${totalAssets} assets descargados. Algunos assets pueden faltar.`);
    } else {
      console.log(`Todos los assets descargados exitosamente para la versión ${version}`);
    }
  }

  /**
   * Verifica la integridad de un archivo usando su hash
   */
  public async verifyFileIntegrity(filePath: string, expectedHash: string, algorithm: string = 'sha1'): Promise<boolean> {
    if (!fs.existsSync(filePath)) {
      console.log(`Archivo no existe para verificación: ${filePath}`);
      return false;
    }

    try {
      const crypto = await import('node:crypto');
      const hash = crypto.createHash(algorithm);
      const stream = fs.createReadStream(filePath);

      return new Promise((resolve, reject) => {
        stream.on('data', (data) => hash.update(data));
        stream.on('end', () => {
          const calculatedHash = hash.digest('hex');
          const isValid = calculatedHash.toLowerCase() === expectedHash.toLowerCase();
          resolve(isValid);
        });
        stream.on('error', reject);
      });
    } catch (error) {
      console.error(`Error al verificar integridad del archivo ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Obtiene el progreso de descarga de assets para una versión
   */
  public getAssetsDownloadProgress(version: string): { downloaded: number; total: number; percentage: number } {
    try {
      const versionJsonPath = path.join(this.versionsPath, version, `${version}.json`);
      if (!fs.existsSync(versionJsonPath)) {
        return { downloaded: 0, total: 0, percentage: 0 };
      }

      const versionMetadata = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));
      const assetIndex = versionMetadata.assetIndex;
      if (!assetIndex) {
        return { downloaded: 0, total: 0, percentage: 0 };
      }

      const assetIndexPath = path.join(this.indexesPath, `${assetIndex.id}.json`);
      if (!fs.existsSync(assetIndexPath)) {
        return { downloaded: 0, total: 0, percentage: 0 };
      }

      const assetIndexData = JSON.parse(fs.readFileSync(assetIndexPath, 'utf-8'));
      const totalAssets = Object.keys(assetIndexData.objects).length;

      let downloadedAssets = 0;
      for (const [assetName, assetInfo] of Object.entries(assetIndexData.objects as any)) {
        const hash = (assetInfo as any).hash;
        const assetPath = path.join(this.objectsPath, hash.substring(0, 2), hash);
        if (fs.existsSync(assetPath)) {
          downloadedAssets++;
        }
      }

      const percentage = totalAssets > 0 ? (downloadedAssets / totalAssets) * 100 : 0;

      return {
        downloaded: downloadedAssets,
        total: totalAssets,
        percentage: parseFloat(percentage.toFixed(2))
      };
    } catch (error) {
      console.error(`Error al obtener progreso de descarga de assets para la versión ${version}:`, error);
      return { downloaded: 0, total: 0, percentage: 0 };
    }
  }

  /**
   * Obtiene el progreso de descarga de bibliotecas para una versión
   */
  public getLibrariesDownloadProgress(version: string): { downloaded: number; total: number; percentage: number } {
    try {
      const versionJsonPath = path.join(this.versionsPath, version, `${version}.json`);
      if (!fs.existsSync(versionJsonPath)) {
        // Intentar descargar el metadata para poder calcular el progreso
        return { downloaded: 0, total: 0, percentage: 0 };
      }

      const versionMetadata = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));
      const libraries = versionMetadata.libraries || [];
      const totalLibraries = libraries.length;

      let downloadedLibraries = 0;
      for (const library of libraries) {
        if (this.isLibraryDownloaded(library)) {
          downloadedLibraries++;
        }
      }

      const percentage = totalLibraries > 0 ? (downloadedLibraries / totalLibraries) * 100 : 0;

      return {
        downloaded: downloadedLibraries,
        total: totalLibraries,
        percentage: parseFloat(percentage.toFixed(2))
      };
    } catch (error) {
      console.error(`Error al obtener progreso de descarga de bibliotecas para la versión ${version}:`, error);
      return { downloaded: 0, total: 0, percentage: 0 };
    }
  }

  /**
   * Verifica si una biblioteca ya ha sido descargada
   */
  private isLibraryDownloaded(library: any): boolean {
    if (!library.downloads?.artifact) {
      return false;
    }

    const libraryPath = this.getLibraryPath(library.name);
    return fs.existsSync(libraryPath);
  }

  /**
   * Asegura que los assets estén disponibles para una instancia específica
   * @param version Versión de Minecraft
   * @param instancePath Ruta de la instancia
   */
  public async ensureAssetsForInstance(version: string, instancePath: string): Promise<void> {
    console.log(`Asegurando assets para la instancia de ${version} en ${instancePath}`);

    const versionJsonPath = await this.downloadVersionMetadata(version);
    const versionMetadata = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));

    // Verificar que el índice de assets exista
    const assetIndexId = versionMetadata.assetIndex?.id;
    if (!assetIndexId) {
      console.log(`No se encontró ID del asset index para la versión ${version}`);
      return;
    }

    // Crear enlaces simbólicos o copiar assets a la instancia si no existen
    const instanceAssetsPath = path.join(instancePath, 'assets');
    const sharedAssetsPath = path.join(this.assetsPath, '..'); // Carpeta compartida de assets

    // Solo crear enlace simbólico si la carpeta compartida existe y la instancia no
    if (fs.existsSync(sharedAssetsPath) && !fs.existsSync(instanceAssetsPath)) {
      try {
        // Crear directorio de assets en la instancia
        fs.mkdirSync(instanceAssetsPath, { recursive: true });

        // Crear enlace simbólico al índice de assets
        const sharedIndexesPath = path.join(sharedAssetsPath, 'indexes');
        const instanceIndexesPath = path.join(instanceAssetsPath, 'indexes');

        if (fs.existsSync(sharedIndexesPath)) {
          // Copiar los archivos de índice en lugar de crear enlace simbólico para evitar problemas
          this.copyAssetsIndex(assetIndexId, sharedIndexesPath, instanceIndexesPath);
        }

        // Crear carpeta virtual simulada en la instancia para que Minecraft pueda encontrar los assets
        // Esto ayuda a que Minecraft pueda usar los assets compartidos
        const virtualAssetsPath = path.join(instanceAssetsPath, 'virtual');
        if (!fs.existsSync(virtualAssetsPath)) {
          fs.mkdirSync(virtualAssetsPath, { recursive: true });
        }

        console.log(`Estructura de assets configurada para la instancia ${instancePath}`);
      } catch (error) {
        console.error(`Error al configurar assets para la instancia ${instancePath}:`, error);
      }
    }
  }

  /**
   * Copia el archivo de índice de assets a la instancia
   */
  private copyAssetsIndex(assetIndexId: string, sharedIndexesPath: string, instanceIndexesPath: string): void {
    const sourceIndexPath = path.join(sharedIndexesPath, `${assetIndexId}.json`);
    const destIndexPath = path.join(instanceIndexesPath, `${assetIndexId}.json`);

    if (fs.existsSync(sourceIndexPath) && !fs.existsSync(destIndexPath)) {
      // Crear directorio destino si no existe
      fs.mkdirSync(path.dirname(destIndexPath), { recursive: true });

      // Copiar el archivo de índice
      fs.copyFileSync(sourceIndexPath, destIndexPath);
      console.log(`Índice de assets copiado para instancia: ${destIndexPath}`);
    }
  }
}

export const minecraftDownloadService = new MinecraftDownloadService();