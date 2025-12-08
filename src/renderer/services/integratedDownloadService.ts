// Servicio para interactuar con el backend usando window.api (exponida desde preload)
export class IntegratedDownloadService {
  // Métodos para el sistema de creación de instancias
  async getMinecraftVersions(): Promise<any[]> {
    if (!window.api?.versions?.list) {
      throw new Error('API de versiones no disponible');
    }
    return await window.api.versions.list();
  }

  async createInstance(payload: {
    name: string;
    version: string;
    loader?: 'vanilla' | 'forge' | 'fabric' | 'quilt' | 'neoforge';
    javaVersion?: string;
    maxMemory?: number;
    minMemory?: number;
    jvmArgs?: string[];
  }): Promise<any> {
    if (!window.api?.instance?.createFull) {
      throw new Error('API de creación de instancias no disponible');
    }
    return await window.api.instance.createFull(payload);
  }

  // Métodos para el sistema de logs y progreso
  async getRecentLogs(count: number = 50): Promise<any[]> {
    if (!window.api) {
      throw new Error('API de Electron no disponible');
    }
    // Usar fetch para acceder a las funciones IPC si están disponibles en window.api
    return await window.api.logs?.getRecent(count) || [];
  }

  async getLogsByType(type: string, count: number = 50): Promise<any[]> {
    if (!window.api) {
      throw new Error('API de Electron no disponible');
    }
    return await window.api.logs?.getByType({ type, count }) || [];
  }

  async getLogStats(): Promise<any> {
    if (!window.api) {
      throw new Error('API de Electron no disponible');
    }
    return await window.api.logs?.getStats() || {};
  }

  async getAllProgressStatuses(): Promise<any[]> {
    if (!window.api) {
      throw new Error('API de Electron no disponible');
    }
    return await window.api.progress?.getAllStatuses() || [];
  }

  async getOverallProgress(): Promise<any> {
    if (!window.api) {
      throw new Error('API de Electron no disponible');
    }
    return await window.api.progress?.getOverall() || { progress: 0, statusText: 'No disponible', activeOperations: 0 };
  }

  async getDownloadStatuses(): Promise<any[]> {
    if (!window.api) {
      throw new Error('API de Electron no disponible');
    }
    return await window.api.progress?.getDownloadStatuses() || [];
  }

  // Métodos para el sistema de Java (si están expuestos)
  async getJavaInstallations(): Promise<any[]> {
    if (!window.api?.java) {
      return []; // Si no está disponible, devolver array vacío
    }
    return await window.api.java?.getAll() || [];
  }

  async detectJava(): Promise<any[]> {
    if (!window.api?.java) {
      return []; // Si no está disponible, devolver array vacío
    }
    return await window.api.java?.detect() || [];
  }

  async getRecommendedJavaForVersion(mcVersion: string): Promise<string> {
    // Usar el servicio de Java para obtener la versión recomendada
    // (esto se implementaría en el backend si no está disponible directamente)
    return '17'; // Valor por defecto
  }

  // Métodos para el sistema de loaders
  async getFabricVersions(mcVersion: string): Promise<any[]> {
    // Implementar llamada al backend para obtener versiones de Fabric
    // Temporalmente usar la API directamente aquí
    try {
      const response = await fetch(`https://meta.fabricmc.net/v2/versions/loader/${mcVersion}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al obtener versiones de Fabric:', error);
      return [];
    }
  }

  async getForgeVersions(mcVersion: string): Promise<any[]> {
    // Implementar llamada al backend para obtener versiones de Forge
    try {
      const response = await fetch(`https://maven.minecraftforge.net/net/minecraftforge/forge/maven-metadata.json`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // Filtrar solo versiones compatibles con la versión de Minecraft específica
      const compatibleVersions = data.versioning.versions.filter((v: string) =>
        v.startsWith(`${mcVersion}-`)
      );

      // Obtener información detallada para versiones compatibles
      const forgeVersions = compatibleVersions.map((version: string) => ({
        version,
        mcversion: mcVersion,
        type: 'release' // Podría distinguir entre stable y beta si la API proporciona esta información
      }));

      return forgeVersions;
    } catch (error) {
      console.error('Error al obtener versiones de Forge:', error);
      return [];
    }
  }

  async getQuiltVersions(mcVersion: string): Promise<any[]> {
    try {
      const response = await fetch(`https://meta.quiltmc.org/v3/versions/loader/${mcVersion}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al obtener versiones de Quilt:', error);
      return [];
    }
  }

  async getNeoForgeVersions(mcVersion: string): Promise<any[]> {
    try {
      const response = await fetch(`https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const allVersions = await response.json();

      // Filtrar solo versiones compatibles con la versión de Minecraft
      const compatibleVersions = allVersions.filter((v: any) =>
        v.version.startsWith(`${mcVersion}-`)
      );

      return compatibleVersions;
    } catch (error) {
      console.error('Error al obtener versiones de NeoForge:', error);
      return [];
    }
  }
}

export const integratedDownloadService = new IntegratedDownloadService();