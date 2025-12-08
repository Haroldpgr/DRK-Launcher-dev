import path from 'node:path';
import fs from 'node:fs';
import fetch from 'node-fetch';
import { getLauncherDataPath } from '../utils/paths';
import { downloadQueueService } from './downloadQueueService';

/**
 * Interfaz para información de un loader
 */
export interface LoaderInfo {
  id: string;
  name: string;
  version: string;
  minecraftVersion: string;
  downloadUrl: string;
  fileName: string;
  installer?: boolean; // Indica si es un instalador o un archivo universal
}

/**
 * Interfaz para la API de versiones de un loader
 */
export interface LoaderVersion {
  id: string;
  version: string;
  minecraftVersion: string;
  stable: boolean;
  type: 'release' | 'beta' | 'alpha';
  url: string;
}

/**
 * Servicio para manejar la descarga e instalación de mod loaders
 */
export class LoaderService {
  private loaderPath: string;

  constructor() {
    this.loaderPath = path.join(getLauncherDataPath(), 'loaders');
    this.ensureDir(this.loaderPath);
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
   * Obtiene las versiones disponibles de Fabric para una versión de Minecraft
   */
  async getFabricVersions(mcVersion: string): Promise<LoaderVersion[]> {
    try {
      const apiUrl = `https://meta.fabricmc.net/v2/versions/loader/${mcVersion}`;
      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'DRK-Launcher/1.0 (compatible; Fetch)'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const fabricVersions = await response.json();
      
      // Mapear a nuestra interfaz estándar
      return fabricVersions.map((fv: any) => ({
        id: `fabric-${fv.loader.version}`,
        version: fv.loader.version,
        minecraftVersion: mcVersion,
        stable: fv.loader.stable,
        type: fv.loader.stable ? 'release' : 'beta',
        url: `https://maven.fabricmc.net/net/fabricmc/fabric-loader/${fv.loader.version}/fabric-loader-${fv.loader.version}.jar`
      }));
    } catch (error) {
      console.error(`Error al obtener versiones de Fabric para ${mcVersion}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene las versiones disponibles de Forge para una versión de Minecraft
   */
  async getForgeVersions(mcVersion: string): Promise<LoaderVersion[]> {
    try {
      // Usar el API de Forge para obtener versiones
      const apiUrl = `https://maven.minecraftforge.net/net/minecraftforge/forge/maven-metadata.json`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const metadata = await response.json();
      const versions = metadata.versioning.versions;

      // Filtrar versiones que coincidan con la versión de Minecraft
      const compatibleVersions = versions.filter((v: string) => v.startsWith(`${mcVersion}-`));

      // Mapear a nuestra interfaz estándar (obtener información más detallada si es posible)
      return compatibleVersions.map((version: string) => ({
        id: `forge-${version}`,
        version: version,
        minecraftVersion: mcVersion,
        stable: !version.toLowerCase().includes('alpha') && !version.toLowerCase().includes('beta'),
        type: version.toLowerCase().includes('alpha') ? 'alpha' : 
              version.toLowerCase().includes('beta') ? 'beta' : 'release',
        url: `https://maven.minecraftforge.net/net/minecraftforge/forge/${version}/forge-${version}-installer.jar`
      })).slice(0, 20); // Limitar a las 20 primeras versiones para no sobrecargar
    } catch (error) {
      console.error(`Error al obtener versiones de Forge para ${mcVersion}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene las versiones disponibles de Quilt para una versión de Minecraft
   */
  async getQuiltVersions(mcVersion: string): Promise<LoaderVersion[]> {
    try {
      const apiUrl = `https://meta.quiltmc.org/v3/versions/loader/${mcVersion}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const quiltVersions = await response.json();
      
      // Mapear a nuestra interfaz estándar
      return quiltVersions.map((qv: any) => ({
        id: `quilt-${qv.loader.version}`,
        version: qv.loader.version,
        minecraftVersion: mcVersion,
        stable: qv.loader.stable,
        type: qv.loader.stable ? 'release' : 'beta',
        url: `https://maven.quiltmc.org/repository/release/org/quiltmc/quilt-loader/${qv.loader.version}/quilt-loader-${qv.loader.version}.jar`
      }));
    } catch (error) {
      console.error(`Error al obtener versiones de Quilt para ${mcVersion}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene las versiones disponibles de NeoForge para una versión de Minecraft
   */
  async getNeoForgeVersions(mcVersion: string): Promise<LoaderVersion[]> {
    try {
      // NeoForge está alojado en su propio servidor Maven
      const apiUrl = `https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const allVersions = await response.json();
      
      // Filtrar versiones que coincidan con la versión de Minecraft
      const compatibleVersions = allVersions.filter((v: any) => v.version.startsWith(`${mcVersion}-`));

      // Mapear a nuestra interfaz estándar
      return compatibleVersions.map((nv: any) => ({
        id: `neoforge-${nv.version}`,
        version: nv.version,
        minecraftVersion: mcVersion,
        stable: nv.type === 'RELEASE',
        type: nv.type.toLowerCase(),
        url: `https://maven.neoforged.net/releases/net/neoforged/neoforge/${nv.version}/neoforge-${nv.version}.jar`
      }));
    } catch (error) {
      console.error(`Error al obtener versiones de NeoForge para ${mcVersion}:`, error);
      throw error;
    }
  }

  /**
   * Selecciona la mejor versión de un loader basado en la estabilidad y recomendación
   */
  selectBestLoaderVersion(versions: LoaderVersion[], preferredType: 'stable' | 'beta' | 'alpha' = 'stable'): LoaderVersion | null {
    if (versions.length === 0) {
      return null;
    }

    // Filtrar por tipo de preferencia
    let filteredVersions = versions;
    if (preferredType === 'stable') {
      filteredVersions = versions.filter(v => v.type === 'release');
    } else if (preferredType === 'beta') {
      filteredVersions = versions.filter(v => v.type === 'release' || v.type === 'beta');
    }
    // Para alpha, usar todas las versiones

    // Ordenar por estabilidad y versión (la más reciente primero)
    filteredVersions.sort((a, b) => {
      // Priorizar releases sobre betas y alphas
      const typePriority = { 'release': 3, 'beta': 2, 'alpha': 1 };
      if (typePriority[b.type] !== typePriority[a.type]) {
        return typePriority[b.type] - typePriority[a.type];
      }
      
      // Si son del mismo tipo, ordenar por versión (asumiendo formato semántico)
      return b.version.localeCompare(a.version, undefined, { numeric: true, sensitivity: 'base' });
    });

    return filteredVersions[0] || null;
  }

  /**
   * Descarga un loader específico
   */
  async downloadLoader(loaderInfo: LoaderInfo, instancePath: string): Promise<string> {
    const loaderDir = path.join(instancePath, 'loader');
    this.ensureDir(loaderDir);

    const filePath = path.join(loaderDir, loaderInfo.fileName);

    try {
      // Verificar si el archivo ya existe
      if (fs.existsSync(filePath)) {
        console.log(`Loader ${loaderInfo.name} ${loaderInfo.version} ya descargado: ${filePath}`);
        return filePath;
      }

      console.log(`Descargando ${loaderInfo.name} ${loaderInfo.version} para ${loaderInfo.minecraftVersion}...`);

      // Descargar el loader usando el servicio de descargas
      const downloadId = await downloadQueueService.addDownload(
        loaderInfo.downloadUrl, 
        filePath
      );

      // Esperar a que la descarga se complete
      await this.waitForDownload(downloadId);

      const downloadInfo = downloadQueueService.getDownloadStatus(downloadId);
      if (!downloadInfo || downloadInfo.status !== 'completed') {
        throw new Error(`La descarga del loader ${loaderInfo.name} falló: ${downloadInfo?.error || 'Error desconocido'}`);
      }

      console.log(`Loader ${loaderInfo.name} descargado exitosamente: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error(`Error al descargar el loader ${loaderInfo.name}:`, error);
      throw error;
    }
  }

  /**
   * Espera a que una descarga se complete
   */
  private async waitForDownload(downloadId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkStatus = () => {
        const status = downloadQueueService.getDownloadStatus(downloadId);
        if (!status) {
          reject(new Error(`Download ${downloadId} not found`));
          return;
        }

        if (status.status === 'completed') {
          resolve();
        } else if (status.status === 'error' || status.status === 'cancelled') {
          reject(new Error(status.error || 'Download failed or cancelled'));
        } else {
          // Continuar verificando cada 500ms
          setTimeout(checkStatus, 500);
        }
      };

      checkStatus();
    });
  }

  /**
   * Verifica si un loader ya está instalado en una instancia
   */
  isLoaderInstalled(loaderName: string, version: string, instancePath: string): boolean {
    const loaderDir = path.join(instancePath, 'loader');
    if (!fs.existsSync(loaderDir)) {
      return false;
    }

    const files = fs.readdirSync(loaderDir);
    return files.some(file => 
      file.toLowerCase().includes(loaderName.toLowerCase()) && 
      file.toLowerCase().includes(version.toLowerCase())
    );
  }

  /**
   * Instala un loader específico en una instancia
   */
  async installLoader(loaderName: string, mcVersion: string, loaderVersion?: string, instancePath: string): Promise<string> {
    let versionList: LoaderVersion[] = [];
    
    switch (loaderName.toLowerCase()) {
      case 'fabric':
        versionList = await this.getFabricVersions(mcVersion);
        break;
      case 'forge':
        versionList = await this.getForgeVersions(mcVersion);
        break;
      case 'quilt':
        versionList = await this.getQuiltVersions(mcVersion);
        break;
      case 'neoforge':
        versionList = await this.getNeoForgeVersions(mcVersion);
        break;
      default:
        throw new Error(`Loader no soportado: ${loaderName}`);
    }

    if (versionList.length === 0) {
      throw new Error(`No se encontraron versiones disponibles para ${loaderName} en Minecraft ${mcVersion}`);
    }

    let selectedVersion: LoaderVersion | null = null;
    
    if (loaderVersion) {
      // Si se especificó una versión específica, buscarla
      selectedVersion = versionList.find(v => v.version === loaderVersion);
      if (!selectedVersion) {
        throw new Error(`La versión ${loaderVersion} no está disponible para ${loaderName} en Minecraft ${mcVersion}`);
      }
    } else {
      // Si no se especificó versión, seleccionar la mejor disponible
      selectedVersion = this.selectBestLoaderVersion(versionList, 'stable');
      if (!selectedVersion) {
        throw new Error(`No se pudo seleccionar una versión adecuada de ${loaderName} para Minecraft ${mcVersion}`);
      }
    }

    // Crear la información del loader
    const loaderInfo: LoaderInfo = {
      id: `${loaderName}-${selectedVersion.version}`,
      name: loaderName,
      version: selectedVersion.version,
      minecraftVersion: mcVersion,
      downloadUrl: selectedVersion.url,
      fileName: `${loaderName}-${selectedVersion.version}.jar`,
      installer: selectedVersion.url.includes('installer')
    };

    // Descargar e instalar el loader
    return await this.downloadLoader(loaderInfo, instancePath);
  }

  /**
   * Obtiene un loader específico por nombre y versión
   */
  async getLoaderInfo(loaderName: string, mcVersion: string, loaderVersion?: string): Promise<LoaderInfo | null> {
    let versionList: LoaderVersion[] = [];
    
    switch (loaderName.toLowerCase()) {
      case 'fabric':
        versionList = await this.getFabricVersions(mcVersion);
        break;
      case 'forge':
        versionList = await this.getForgeVersions(mcVersion);
        break;
      case 'quilt':
        versionList = await this.getQuiltVersions(mcVersion);
        break;
      case 'neoforge':
        versionList = await this.getNeoForgeVersions(mcVersion);
        break;
      default:
        return null;
    }

    if (versionList.length === 0) {
      return null;
    }

    let selectedVersion: LoaderVersion | null = null;
    
    if (loaderVersion) {
      selectedVersion = versionList.find(v => v.version === loaderVersion);
    } else {
      selectedVersion = this.selectBestLoaderVersion(versionList, 'stable');
    }

    if (!selectedVersion) {
      return null;
    }

    return {
      id: `${loaderName}-${selectedVersion.version}`,
      name: loaderName,
      version: selectedVersion.version,
      minecraftVersion: mcVersion,
      downloadUrl: selectedVersion.url,
      fileName: `${loaderName}-${selectedVersion.version}.jar`,
      installer: selectedVersion.url.includes('installer')
    };
  }
}

export const loaderService = new LoaderService();