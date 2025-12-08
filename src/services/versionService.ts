import path from 'node:path';
import fs from 'node:fs';
import fetch from 'node-fetch';
import { getLauncherDataPath } from '../utils/paths';

export interface MinecraftVersion {
  id: string;
  type: string;
  url: string;
  releaseTime: string;
  releaseVersion?: string; // Para referenciar la versión de release correspondiente si es snapshot
}

export interface VersionManifest {
  latest: {
    release: string;
    snapshot: string;
  };
  versions: MinecraftVersion[];
}

/**
 * Servicio para manejar la adquisición y caché de versiones de Minecraft
 */
export class VersionService {
  private versionsCachePath: string;
  private cacheTimeout: number = 1000 * 60 * 60; // 1 hora de caché

  constructor() {
    const launcherPath = getLauncherDataPath();
    this.versionsCachePath = path.join(launcherPath, 'versions_cache.json');
  }

  /**
   * Obtiene las versiones de Minecraft desde Mojang con caché
   * @param forceRefresh Obliga a refrescar la caché
   * @returns Lista de versiones de Minecraft
   */
  async getMinecraftVersions(forceRefresh: boolean = false): Promise<MinecraftVersion[]> {
    // Verificar si hay caché válida
    if (!forceRefresh && await this.isCacheValid()) {
      try {
        const cachedData = JSON.parse(fs.readFileSync(this.versionsCachePath, 'utf-8'));
        console.log(`Caché de versiones válida, usando datos cacheados (${cachedData.versions.length} versiones)`);
        
        // Filtrar solo versiones de tipo "release"
        const releaseVersions = cachedData.versions.filter((v: MinecraftVersion) => v.type === 'release');
        return releaseVersions;
      } catch (error) {
        console.error('Error al leer la caché de versiones:', error);
        // Si hay error al leer la caché, continuar con la descarga
      }
    }

    // Si no hay caché válida o se forzó el refresh, descargar desde Mojang
    console.log('Obteniendo versiones de Minecraft desde Mojang...');
    const versions = await this.downloadMinecraftVersions();
    
    // Filtrar solo versiones de tipo "release"
    const releaseVersions = versions.filter(v => v.type === 'release');
    
    console.log(`Encontradas ${versions.length} versiones totales, ${releaseVersions.length} son releases`);
    
    // Guardar en caché
    await this.saveToCache(versions);
    
    return releaseVersions;
  }

  /**
   * Verifica si el archivo de caché es válido (menos de 1 hora de antigüedad)
   */
  private async isCacheValid(): Promise<boolean> {
    if (!fs.existsSync(this.versionsCachePath)) {
      return false;
    }

    const stats = fs.statSync(this.versionsCachePath);
    const now = Date.now();
    const fileTime = stats.mtime.getTime();
    
    return (now - fileTime) < this.cacheTimeout;
  }

  /**
   * Descarga la lista de versiones desde la API de Mojang
   */
  private async downloadMinecraftVersions(): Promise<MinecraftVersion[]> {
    try {
      const response = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json', {
        headers: {
          'User-Agent': 'DRK-Launcher/1.0 (compatible; Fetch)'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const manifest: VersionManifest = await response.json();
      
      // Filtrar solo versiones release y ordenar cronológicamente (más antigua a más reciente)
      const releaseVersions = manifest.versions.filter(v => v.type === 'release');
      const sortedVersions = releaseVersions.sort((a, b) => {
        // Convertir fechas a timestamp para ordenar cronológicamente
        const dateA = new Date(a.releaseTime).getTime();
        const dateB = new Date(b.releaseTime).getTime();
        return dateA - dateB; // Orden ascendente (más antigua primero)
      });

      return sortedVersions;
    } catch (error) {
      console.error('Error al descargar versiones de Minecraft:', error);
      
      // Si falla la descarga, intentar usar caché existente como fallback
      if (fs.existsSync(this.versionsCachePath)) {
        try {
          const cachedData = JSON.parse(fs.readFileSync(this.versionsCachePath, 'utf-8'));
          console.log('Usando datos cacheados como fallback');
          return cachedData.versions.filter((v: MinecraftVersion) => v.type === 'release');
        } catch (cacheError) {
          console.error('Error al usar caché como fallback:', cacheError);
        }
      }
      
      throw error;
    }
  }

  /**
   * Guarda las versiones en el archivo de caché
   */
  private async saveToCache(versions: MinecraftVersion[]): Promise<void> {
    try {
      const cacheData = {
        timestamp: Date.now(),
        versions: versions
      };
      
      fs.writeFileSync(this.versionsCachePath, JSON.stringify(cacheData, null, 2));
      console.log(`Caché de versiones guardada con ${versions.length} entradas`);
    } catch (error) {
      console.error('Error al guardar caché de versiones:', error);
    }
  }

  /**
   * Obtiene una versión específica por ID
   */
  async getVersionById(versionId: string): Promise<MinecraftVersion | null> {
    const versions = await this.getMinecraftVersions();
    return versions.find(v => v.id === versionId) || null;
  }

  /**
   * Fuerza la actualización del archivo de caché
   */
  async refreshCache(): Promise<void> {
    await this.getMinecraftVersions(true);
  }

  /**
   * Obtiene información detallada de una versión específica desde su URL
   */
  async getVersionDetails(version: MinecraftVersion): Promise<any> {
    try {
      const response = await fetch(version.url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error al obtener detalles de la versión ${version.id}:`, error);
      throw error;
    }
  }

  /**
   * Verifica si una versión específica es compatible con Forge/Fabric
   */
  async isVersionCompatibleWithLoader(versionId: string, loader: 'forge' | 'fabric' | 'quilt' | 'neoforge'): Promise<boolean> {
    // Esta funcionalidad se implementará cuando se manejen los loaders específicos
    // Por ahora, devolvemos true para versiones release
    return true;
  }
}

export const versionService = new VersionService();