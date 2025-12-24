// src/services/descargas/fabric/DownloadFabric.ts
// Lógica CORRECTA para instalar Fabric Loader
// API oficial: https://meta.fabricmc.net/v2/versions/loader/<mcVersion>
// Basado en: https://minecraft-launcher-lib.readthedocs.io/

import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';
import { getLauncherDataPath } from '../../../utils/paths';
import { logProgressService } from '../../logProgressService';
import { downloadVanilla } from '../vanilla/DownloadVanilla';

/**
 * Servicio para instalar Fabric Loader
 * 
 * IMPORTANTE: Fabric requiere vanilla primero, luego instala el loader sobre él.
 * 
 * Flujo correcto:
 * 1. Descargar vanilla completo (client.jar, version.json, libraries, assets)
 * 2. Descargar Fabric Loader desde meta.fabricmc.net
 * 3. Descargar dependencias del loader
 * 4. Generar version.json de Fabric que hereda de vanilla
 */
export class DownloadFabric {
  private launcherDir: string;
  private versionsPath: string;
  private librariesPath: string;

  constructor() {
    this.launcherDir = getLauncherDataPath();
    this.versionsPath = path.join(this.launcherDir, 'versions');
    this.librariesPath = path.join(this.launcherDir, 'libraries');
    this.ensureDir(this.versionsPath);
    this.ensureDir(this.librariesPath);
  }

  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Descarga una instancia Fabric completa
   * 
   * IMPORTANTE: Primero descarga vanilla, luego instala Fabric sobre él.
   * Fabric NO funciona sin vanilla base.
   * 
   * @param mcVersion Versión de Minecraft (ej. '1.21.11')
   * @param loaderVersion Versión de Fabric Loader (ej. '0.16.9') o undefined para última estable
   * @param instancePath Ruta donde se creará la instancia
   */
  async downloadInstance(
    mcVersion: string,
    loaderVersion: string | undefined,
    instancePath: string
  ): Promise<void> {
    try {
      logProgressService.info(`[Fabric] Iniciando instalación de Fabric para Minecraft ${mcVersion}...`);

      // PASO 1: Descargar vanilla completo primero (Fabric necesita vanilla base)
      logProgressService.info(`[Fabric] Descargando vanilla base...`);
      await downloadVanilla.downloadInstance(mcVersion, instancePath);

      // PASO 2: Obtener versión de Fabric Loader
      let fabricLoaderVersion = loaderVersion;
      if (!fabricLoaderVersion) {
        fabricLoaderVersion = await this.getLatestFabricLoaderVersion(mcVersion);
      }

      logProgressService.info(`[Fabric] Usando Fabric Loader ${fabricLoaderVersion}`);

      // PASO 3: Descargar Fabric Loader y sus dependencias
      await this.downloadFabricLoader(mcVersion, fabricLoaderVersion);

      // PASO 4: Generar version.json de Fabric
      await this.generateFabricVersionJson(mcVersion, fabricLoaderVersion);

      logProgressService.info(`[Fabric] Instalación completada exitosamente`);
    } catch (error) {
      logProgressService.error(`[Fabric] Error al instalar:`, error);
      throw error;
    }
  }

  /**
   * Obtiene la última versión estable de Fabric Loader para una versión de MC
   */
  private async getLatestFabricLoaderVersion(mcVersion: string): Promise<string> {
    const apiUrl = `https://meta.fabricmc.net/v2/versions/loader/${mcVersion}`;
    
    logProgressService.info(`[Fabric] Consultando API: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      headers: { 'User-Agent': 'DRK-Launcher/1.0' }
    });

    if (!response.ok) {
      throw new Error(`Error al consultar API de Fabric: HTTP ${response.status}`);
    }

    const versions = await response.json();
    
    // Buscar versión estable
    const stableVersion = versions.find((v: any) => v.loader?.stable === true);
    if (stableVersion && stableVersion.loader?.version) {
      return stableVersion.loader.version;
    }

    // Si no hay estable, usar la primera (más reciente)
    if (versions.length > 0 && versions[0].loader?.version) {
      return versions[0].loader.version;
    }

    throw new Error(`No se encontró versión de Fabric Loader para Minecraft ${mcVersion}`);
  }

  /**
   * Descarga Fabric Loader y sus dependencias
   */
  private async downloadFabricLoader(mcVersion: string, loaderVersion: string): Promise<void> {
    const apiUrl = `https://meta.fabricmc.net/v2/versions/loader/${mcVersion}/${loaderVersion}/profile/json`;
    
    logProgressService.info(`[Fabric] Descargando perfil de Fabric desde: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      headers: { 'User-Agent': 'DRK-Launcher/1.0' }
    });

    if (!response.ok) {
      throw new Error(`Error al obtener perfil de Fabric: HTTP ${response.status}`);
    }

    const profile = await response.json();
    
    // Descargar librerías del perfil con descargas paralelas (hasta 75 simultáneas)
    if (profile.libraries && Array.isArray(profile.libraries)) {
      logProgressService.info(`[Fabric] Descargando ${profile.libraries.length} librerías en paralelo (hasta 75 simultáneas)...`);
      
      const maxConcurrent = 75;
      let downloaded = 0;
      const total = profile.libraries.length;
      
      // Procesar en lotes de hasta 75 descargas simultáneas
      for (let i = 0; i < profile.libraries.length; i += maxConcurrent) {
        const batch = profile.libraries.slice(i, i + maxConcurrent);
        
        const results = await Promise.allSettled(
          batch.map(async (lib: any) => {
            try {
              await this.downloadLibrary(lib);
              downloaded++;
              
              // Log de progreso cada 10 descargas
              if (downloaded % 10 === 0) {
                const progress = Math.round((downloaded / total) * 100);
                logProgressService.info(`[Fabric] Progreso librerías: ${downloaded}/${total} (${progress}%)`);
              }
            } catch (error) {
              logProgressService.warning(`[Fabric] Error al descargar librería:`, error);
              throw error;
            }
          })
        );
        
        const successes = results.filter(r => r.status === 'fulfilled').length;
        const errors = results.filter(r => r.status === 'rejected').length;
        
        if (errors > 0) {
          logProgressService.warning(`[Fabric] ${errors} librerías fallaron en este lote (continuando...)`);
        }
        
        // Pequeña pausa entre lotes
        if (i + maxConcurrent < profile.libraries.length) {
          await new Promise(resolve => setImmediate(resolve));
        }
      }
      
      logProgressService.success(`[Fabric] Librerías descargadas: ${downloaded}/${total}`);
    }
  }

  /**
   * Descarga una librería individual
   */
  private async downloadLibrary(lib: any): Promise<void> {
    if (!lib.name) {
      logProgressService.warning(`[Fabric] Librería sin nombre, omitiendo`);
      return;
    }

    // Verificar reglas de compatibilidad PRIMERO
    if (lib.rules && !this.isLibraryAllowed(lib.rules)) {
      logProgressService.info(`[Fabric] Librería excluida por reglas: ${lib.name}`);
      return;
    }

    // Construir path desde el nombre Maven
    const libPath = lib.downloads?.artifact?.path
      ? path.join(this.librariesPath, lib.downloads.artifact.path)
      : path.join(this.librariesPath, this.getLibraryPath(lib.name));
    
    if (fs.existsSync(libPath)) {
      logProgressService.info(`[Fabric] Librería ya existe: ${path.basename(libPath)}`);
      return; // Ya existe
    }

    try {
      this.ensureDir(path.dirname(libPath));
      
      // Determinar URL de descarga
      let downloadUrl: string | null = null;
      
      // Prioridad 1: URL desde downloads.artifact.url
      if (lib.downloads?.artifact?.url) {
        downloadUrl = lib.downloads.artifact.url;
      }
      // Prioridad 2: Repositorio de Fabric para net.fabricmc.*
      else if (lib.name.startsWith('net.fabricmc:')) {
        downloadUrl = this.buildFabricMavenUrl(lib.name);
      }
      // Prioridad 3: Maven Central para otras librerías
      else if (lib.name.includes(':')) {
        downloadUrl = this.buildMavenUrl(lib.name);
      }

      if (!downloadUrl) {
        logProgressService.warning(`[Fabric] No se pudo construir URL para librería: ${lib.name}`);
        return;
      }

      logProgressService.info(`[Fabric] Descargando librería: ${lib.name} -> ${path.basename(libPath)}`);
      
      const response = await fetch(downloadUrl, {
        headers: { 'User-Agent': 'DRK-Launcher/1.0' }
      });

      if (!response.ok) {
        // Si falla con Maven Central y es net.fabricmc.*, intentar con repositorio de Fabric
        if (downloadUrl.includes('repo1.maven.org') && lib.name.startsWith('net.fabricmc:')) {
          const fabricUrl = this.buildFabricMavenUrl(lib.name);
          if (fabricUrl !== downloadUrl) {
            logProgressService.info(`[Fabric] Reintentando desde repositorio de Fabric...`);
            const fallbackResponse = await fetch(fabricUrl, {
              headers: { 'User-Agent': 'DRK-Launcher/1.0' }
            });
            if (fallbackResponse.ok) {
              const buffer = Buffer.from(await fallbackResponse.arrayBuffer());
              fs.writeFileSync(libPath, buffer);
              logProgressService.info(`[Fabric] ✓ Librería descargada desde repositorio de Fabric: ${path.basename(libPath)} (${(buffer.length / 1024).toFixed(2)} KB)`);
              return;
            }
          }
        }
        throw new Error(`Error al descargar ${lib.name}: HTTP ${response.status} (URL: ${downloadUrl})`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(libPath, buffer);
      
      logProgressService.info(`[Fabric] ✓ Librería descargada: ${path.basename(libPath)} (${(buffer.length / 1024).toFixed(2)} KB)`);
    } catch (error) {
      logProgressService.warning(`[Fabric] Error al descargar librería ${lib.name}:`, error);
      // No lanzar error, continuar con otras librerías
    }
  }

  /**
   * Genera el version.json de Fabric
   */
  private async generateFabricVersionJson(mcVersion: string, loaderVersion: string): Promise<void> {
    const apiUrl = `https://meta.fabricmc.net/v2/versions/loader/${mcVersion}/${loaderVersion}/profile/json`;
    
    const response = await fetch(apiUrl, {
      headers: { 'User-Agent': 'DRK-Launcher/1.0' }
    });

    if (!response.ok) {
      throw new Error(`Error al obtener perfil de Fabric: HTTP ${response.status}`);
    }

    const fabricProfile = await response.json();
    
    // El perfil de Fabric ya viene con toda la información necesaria
    // Solo necesitamos guardarlo en el lugar correcto
    const versionName = `fabric-loader-${loaderVersion}-${mcVersion}`;
    const versionDir = path.join(this.versionsPath, versionName);
    this.ensureDir(versionDir);
    
    // CRÍTICO: Guardar como 'version.json' para consistencia con Vanilla
    const versionJsonPath = path.join(versionDir, 'version.json');
    
    // Asegurar que el profile tenga el ID correcto
    const profileToSave = {
      ...fabricProfile,
      id: versionName
    };
    
    fs.writeFileSync(versionJsonPath, JSON.stringify(profileToSave, null, 2));
    
    logProgressService.info(`[Fabric] Version.json generado: ${versionName}`);
  }

  /**
   * Verifica si una librería está permitida según las reglas
   */
  private isLibraryAllowed(rules: any[]): boolean {
    if (!rules || rules.length === 0) {
      return true;
    }

    let allowed = false;
    const currentOs = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'osx' : 'linux';

    for (const rule of rules) {
      const osName = rule.os?.name;
      const action = rule.action;

      if (osName) {
        if (osName === currentOs) {
          allowed = action === 'allow';
        }
      } else if (action === 'allow') {
        allowed = true;
      } else if (action === 'disallow') {
        allowed = false;
      }
    }

    return allowed;
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
    const fileName = `${artifact}-${version}.jar`;
    
    return path.join(groupPath, artifact, version, fileName);
  }

  /**
   * Construye la URL de Maven Central para una librería
   */
  private buildMavenUrl(libraryName: string): string {
    const parts = libraryName.split(':');
    if (parts.length < 3) {
      return '';
    }

    const [group, artifact, version] = parts;
    const groupPath = group.replace(/\./g, '/');
    
    return `https://repo1.maven.org/maven2/${groupPath}/${artifact}/${version}/${artifact}-${version}.jar`;
  }

  /**
   * Construye la URL del repositorio de Fabric para una librería
   * IMPORTANTE: Las librerías de Fabric (net.fabricmc.*) están en maven.fabricmc.net
   */
  private buildFabricMavenUrl(libraryName: string): string {
    const parts = libraryName.split(':');
    if (parts.length < 3) {
      return '';
    }

    const [group, artifact, version] = parts;
    const groupPath = group.replace(/\./g, '/');
    
    return `https://maven.fabricmc.net/${groupPath}/${artifact}/${version}/${artifact}-${version}.jar`;
  }
}

// Exportar solo la instancia (patrón singleton)
export const downloadFabric = new DownloadFabric();

