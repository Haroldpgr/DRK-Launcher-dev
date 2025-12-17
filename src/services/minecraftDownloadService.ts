import path from 'node:path';
import fs from 'node:fs';
import fetch from 'node-fetch';
import crypto from 'node:crypto';
import { getLauncherDataPath } from '../utils/paths';
import { downloadQueueService } from './downloadQueueService';
import { logProgressService } from './logProgressService';

/**
 * Servicio simplificado para descargar archivos base de Minecraft
 * Solo lo esencial: metadata, librerías (artifacts + natives), client.jar, assets
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

  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Descarga el version.json de una versión
   * 
   * API: https://launchermeta.mojang.com/mc/game/version_manifest.json
   * 1. Obtiene el manifest con todas las versiones
   * 2. Busca la versión solicitada
   * 3. Descarga el version.json desde la URL específica (piston-meta.mojang.com)
   * 4. Guarda como version.json en versions/{version}/version.json
   */
  public async downloadVersionMetadata(version: string): Promise<string> {
    const versionDir = path.join(this.versionsPath, version);
    this.ensureDir(versionDir);
    
    const versionJsonPath = path.join(versionDir, 'version.json');
    
    if (fs.existsSync(versionJsonPath)) {
      return versionJsonPath;
    }

    // Paso 1: Obtener manifest desde launchermeta.mojang.com
      const manifestResponse = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json');
    if (!manifestResponse.ok) {
      throw new Error(`Error al obtener manifest: ${manifestResponse.status}`);
    }
      const manifest = await manifestResponse.json();
      
    // Paso 2: Buscar la versión solicitada
      const versionInfo = manifest.versions.find((v: any) => v.id === version);
      if (!versionInfo) {
        throw new Error(`Versión ${version} no encontrada en el manifest`);
      }

    // Paso 3: Descargar version.json desde la URL específica (piston-meta.mojang.com)
      const versionMetadataResponse = await fetch(versionInfo.url);
    if (!versionMetadataResponse.ok) {
      throw new Error(`Error al descargar version.json: ${versionMetadataResponse.status}`);
    }
      const versionMetadata = await versionMetadataResponse.json();
      
    // Paso 4: Guardar como version.json (no {version}.json)
      fs.writeFileSync(versionJsonPath, JSON.stringify(versionMetadata, null, 2));
      return versionJsonPath;
  }

  /**
   * Descarga todas las librerías (artifacts + natives) de una versión
   */
  public async downloadVersionLibraries(version: string): Promise<void> {
    const versionJsonPath = await this.downloadVersionMetadata(version);
    const versionMetadata = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));
    const libraries = versionMetadata.libraries || [];
    
    logProgressService.info(`[Libraries] Descargando ${libraries.length} librerías para ${version}...`);
    
    let downloaded = 0;
    let skipped = 0;
    
    for (const library of libraries) {
      if (library.rules && !this.isLibraryAllowed(library.rules)) {
        skipped++;
        continue;
      }

      try {
      await this.downloadLibrary(library);
        downloaded++;
        if (downloaded % 10 === 0) {
          logProgressService.info(`[Libraries] Progreso: ${downloaded}/${libraries.length - skipped} librerías descargadas...`);
        }
      } catch (error) {
        logProgressService.error(`[Libraries] Error al descargar librería ${library.name || 'unknown'}:`, error);
        // Continuar con las demás librerías
      }
    }
    
    logProgressService.success(`[Libraries] Descarga completada: ${downloaded} librerías descargadas, ${skipped} omitidas por reglas`);
  }

  /**
   * Descarga una librería (artifact + natives si existen)
   * 
   * API: https://libraries.minecraft.net/
   * Las URLs vienen directamente del version.json en downloads.artifact.url y downloads.classifiers[].url
   * Estas URLs ya apuntan a libraries.minecraft.net, no necesitamos construir la URL manualmente
   * 
   * PÚBLICO para que EjecutarVanilla pueda usarlo
   */
  public async downloadLibrary(library: any): Promise<void> {
    const downloads = library.downloads;
    if (!downloads) return;

    // 1. Descargar artifact (JAR principal)
    // URL viene del version.json: downloads.artifact.url (ya apunta a libraries.minecraft.net)
    if (downloads.artifact?.path && downloads.artifact?.url) {
      const artifactPath = path.join(this.librariesPath, downloads.artifact.path);
      
      if (!fs.existsSync(artifactPath)) {
        const artifactDir = path.dirname(artifactPath);
        this.ensureDir(artifactDir);
        // Usar la URL del version.json directamente (ya es correcta)
        await this.downloadFile(downloads.artifact.url, artifactPath, downloads.artifact.sha1, 'sha1');
      }
    }

    // 2. Descargar natives (classifiers) - CRÍTICO para LWJGL
    // URL viene del version.json: downloads.classifiers[].url (ya apunta a libraries.minecraft.net)
    if (downloads.classifiers && library.natives?.windows) {
      const targetClassifier = library.natives.windows.replace('${arch}', 'x86_64');
      const classifierData = downloads.classifiers[targetClassifier];
      
      if (classifierData?.path && classifierData?.url) {
        const nativeJarPath = path.join(this.librariesPath, classifierData.path);
        
        if (!fs.existsSync(nativeJarPath)) {
          const nativeJarDir = path.dirname(nativeJarPath);
          this.ensureDir(nativeJarDir);
          // Usar la URL del version.json directamente (ya es correcta)
          await this.downloadFile(classifierData.url, nativeJarPath, classifierData.sha1, 'sha1');
        }
      }
    }
  }

  /**
   * Descarga el client.jar
   * 
   * API: URL específica del cliente desde version.json
   * La URL viene en versionMetadata.downloads.client.url
   * Esta URL apunta directamente al servidor de Mojang (piston-data.mojang.com)
   */
  public async downloadClientJar(version: string, instancePath: string): Promise<string> {
    const clientJarPath = path.join(instancePath, 'client.jar');
    
    if (fs.existsSync(clientJarPath)) {
      return clientJarPath;
    }

    this.ensureDir(instancePath);
    const versionJsonPath = await this.downloadVersionMetadata(version);
    const versionMetadata = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));

    // La URL del client.jar viene directamente del version.json
    const clientDownload = versionMetadata.downloads?.client;
    if (!clientDownload?.url) {
      throw new Error(`No se encontró URL para client.jar de la versión ${version}`);
    }

    // Descargar usando la URL del version.json (ya es correcta)
    await this.downloadFile(clientDownload.url, clientJarPath, clientDownload.sha1, 'sha1');
    return clientJarPath;
  }

  /**
   * Descarga los assets de una versión
   * 
   * API: https://resources.download.minecraft.net/
   * 1. Descarga el asset index desde versionMetadata.assetIndex.url
   * 2. Construye URLs de assets como: https://resources.download.minecraft.net/{hash[0:2]}/{hash}
   * 
   * IMPORTANTE: Los assets incluyen:
   * - Texturas
   * - Sonidos
   * - Lenguajes (archivos .json en assets/minecraft/lang/)
   * - Modelos 3D
   * - Y más recursos del juego
   */
  public async downloadVersionAssets(version: string): Promise<void> {
    logProgressService.info(`[Assets] Iniciando descarga de assets para ${version}...`);
    
    const versionJsonPath = await this.downloadVersionMetadata(version);
    const versionMetadata = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));

    const assetIndex = versionMetadata.assetIndex;
    if (!assetIndex) {
      logProgressService.warning(`[Assets] No se encontró assetIndex para ${version}`);
      return;
    }

    // Paso 1: Descargar índice de assets (URL viene del version.json)
    const assetIndexPath = path.join(this.indexesPath, `${assetIndex.id}.json`);
    if (!fs.existsSync(assetIndexPath)) {
      logProgressService.info(`[Assets] Descargando índice de assets: ${assetIndex.id}...`);
      // La URL del asset index viene del version.json (ya es correcta)
      await this.downloadFile(assetIndex.url, assetIndexPath);
      logProgressService.success(`[Assets] Índice de assets descargado`);
    } else {
      logProgressService.info(`[Assets] Índice de assets ya existe: ${assetIndex.id}`);
    }

    // Paso 2: Cargar índice y descargar assets faltantes
    logProgressService.info(`[Assets] Cargando índice de assets...`);
    const assetIndexData = JSON.parse(fs.readFileSync(assetIndexPath, 'utf-8'));
    const assetsObjects = assetIndexData.objects;
    const totalAssets = Object.keys(assetsObjects).length;

    logProgressService.info(`[Assets] Total de assets a verificar: ${totalAssets}`);

    // Paso 3: Verificar qué assets faltan (uso de streaming para reducir RAM)
    const missingAssets: Array<[string, { hash: string; size: number }]> = [];

    // Procesar por lotes para reducir el uso de memoria
    const batchSize = 5000; // Tamaño de lote para procesamiento (valor original)
    const assetKeys = Object.keys(assetsObjects);

    for (let i = 0; i < assetKeys.length; i += batchSize) {
      const batchKeys = assetKeys.slice(i, i + batchSize);

      for (const assetName of batchKeys) {
        const assetInfo = assetsObjects[assetName];
        const hash = assetInfo.hash;
        const assetPath = path.join(this.objectsPath, hash.substring(0, 2), hash);

        if (!fs.existsSync(assetPath)) {
          missingAssets.push([assetName, assetInfo]);
        }

        // Liberar memoria intermedia periódicamente
        if (missingAssets.length % 1000 === 0) {
          // Hacer pequeña pausa para permitir que el recolector de basura actúe
          await new Promise(resolve => setImmediate(resolve));
        }
      }
    }
    
    const existingAssets = totalAssets - missingAssets.length;
    logProgressService.info(`[Assets] Assets existentes: ${existingAssets}/${totalAssets}`);
    
    if (missingAssets.length === 0) {
      logProgressService.success(`[Assets] Todos los assets ya están descargados`);
      return;
    }
    
    logProgressService.info(`[Assets] Descargando ${missingAssets.length} assets faltantes...`);

    // Paso 4: Descargar assets faltantes desde resources.download.minecraft.net
    // Formato: https://resources.download.minecraft.net/{primeros 2 chars del hash}/{hash completo}
    const downloadBatchSize = 25; // Tamaño original para mejor rendimiento
    let downloaded = 0;

    for (let i = 0; i < missingAssets.length; i += downloadBatchSize) {
      const batch = missingAssets.slice(i, i + downloadBatchSize);

      const results = await Promise.allSettled(batch.map(async ([assetName, assetInfo]: [string, { hash: string; size: number }]) => {
        const hash = assetInfo.hash;
        const assetDir = path.join(this.objectsPath, hash.substring(0, 2));
        const assetPath = path.join(assetDir, hash);

        this.ensureDir(assetDir);
        // Construir URL según formato de Mojang: resources.download.minecraft.net/{hash[0:2]}/{hash}
        const assetUrl = `https://resources.download.minecraft.net/${hash.substring(0, 2)}/${hash}`;
        await this.downloadFile(assetUrl, assetPath, hash, 'sha1');

        // Log especial para lenguajes (importante para el selector de idioma)
        if (assetName.includes('lang/') || assetName.includes('minecraft/lang/')) {
          logProgressService.info(`[Assets] Idioma descargado: ${path.basename(assetName)}`);
        }
      }));

      // Contar éxitos
      const successes = results.filter(r => r.status === 'fulfilled').length;
      downloaded += successes;

      // Log de progreso cada batch
      const progress = Math.round((downloaded / missingAssets.length) * 100);
      logProgressService.info(`[Assets] Progreso: ${downloaded}/${missingAssets.length} (${progress}%)`);

      // Log de errores si los hay
      const errors = results.filter(r => r.status === 'rejected');
      if (errors.length > 0) {
        logProgressService.warning(`[Assets] ${errors.length} assets fallaron en este lote (continuando...)`);
      }

      // Permitir que el recolector de basura actúe entre lotes
      await new Promise(resolve => setImmediate(resolve));
    }
    
    logProgressService.success(`[Assets] Descarga completada: ${downloaded}/${missingAssets.length} assets descargados`);
    logProgressService.info(`[Assets] Total de assets disponibles: ${existingAssets + downloaded}/${totalAssets}`);
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
   * Descarga todos los archivos necesarios para una versión
   * @param skipClientJar Si es true, NO descarga client.jar (útil para Forge/NeoForge que no lo usan)
   * 
   * Orden de descarga:
   * 1. Metadata (version.json)
   * 2. Librerías (JARs + natives)
   * 3. Client.jar (si no se omite)
   * 4. Assets (texturas, sonidos, lenguajes, etc.)
   */
  public async downloadCompleteVersion(version: string, instancePath: string, skipClientJar: boolean = false): Promise<void> {
    logProgressService.info(`[Download] Iniciando descarga completa de Minecraft ${version}...`);
    
    try {
      // Paso 1: Metadata
      logProgressService.info(`[Download] Paso 1/4: Descargando metadata...`);
      await this.downloadVersionMetadata(version);
      logProgressService.success(`[Download] Metadata descargada`);
      
      // Paso 2: Librerías
      logProgressService.info(`[Download] Paso 2/4: Descargando librerías...`);
      await this.downloadVersionLibraries(version);
      logProgressService.success(`[Download] Librerías descargadas`);
      
      // Paso 3: Client.jar
      if (!skipClientJar) {
        logProgressService.info(`[Download] Paso 3/4: Descargando client.jar...`);
        await this.downloadClientJar(version, instancePath);
        logProgressService.success(`[Download] client.jar descargado`);
      } else {
        logProgressService.info(`[Download] Paso 3/4: Omitiendo client.jar (skipClientJar=true)`);
      }
      
      // Paso 4: Assets (CRÍTICO para que el juego funcione correctamente)
      logProgressService.info(`[Download] Paso 4/4: Descargando assets (texturas, sonidos, lenguajes)...`);
      await this.downloadVersionAssets(version);
      logProgressService.success(`[Download] Assets descargados`);
      
      logProgressService.success(`[Download] Descarga completa de Minecraft ${version} finalizada exitosamente`);
    } catch (error) {
      logProgressService.error(`[Download] Error durante la descarga de ${version}:`, error);
      throw error;
    }
  }

  /**
   * Descarga y extrae una librería nativa (DLLs/SO) a un directorio
   */
  public async downloadAndExtractNative(nativeLib: { classifierPath: string; classifierUrl: string; classifierSha1?: string }, nativesPath: string): Promise<void> {
    const nativeJarPath = path.join(this.librariesPath, nativeLib.classifierPath);
    
    // Descargar natives JAR si no existe
    if (!fs.existsSync(nativeJarPath)) {
      const nativeJarDir = path.dirname(nativeJarPath);
      this.ensureDir(nativeJarDir);
      await this.downloadFile(nativeLib.classifierUrl, nativeJarPath, nativeLib.classifierSha1, 'sha1');
    }

    // Extraer DLLs/SO del JAR
    const StreamZipAsync = (await import('node-stream-zip')).default;
    try {
      const zip = new StreamZipAsync.async({ file: nativeJarPath });
      const entries = await zip.entries();

      for (const entry of Object.values(entries)) {
        if (entry.name && (
          entry.name.endsWith('.dll') ||
          entry.name.endsWith('.so') ||
          entry.name.endsWith('.dylib') ||
          entry.name.endsWith('.jnilib')
        )) {
          const extractPath = path.join(nativesPath, path.basename(entry.name));
          await zip.extract(entry.name, extractPath);
        }
      }

      await zip.close();
    } catch (error) {
      console.error(`Error al extraer natives de ${nativeJarPath}:`, error);
      throw error;
    }
  }

  /**
   * Verifica si una librería está permitida según las reglas
   */
  private isLibraryAllowed(rules: any[]): boolean {
    let allowed = false;
    const currentOs = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'osx' : 'linux';
    
    for (const rule of rules) {
      const osName = rule.os?.name;
      const action = rule.action;
      
      if (osName && osName === currentOs) {
        allowed = action === 'allow';
      } else if (!osName && action === 'allow') {
        allowed = true;
      }
    }
    
    return allowed;
  }
}

export const minecraftDownloadService = new MinecraftDownloadService();
