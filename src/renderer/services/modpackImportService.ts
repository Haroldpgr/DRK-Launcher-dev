// Servicio de importación de modpacks - Solo para uso en el renderer (sin módulos de Node.js)
// Todo el procesamiento pesado se hace en el proceso principal

interface ModpackMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  mcVersion: string;
  loader: 'vanilla' | 'forge' | 'fabric' | 'quilt' | 'neoforge';
  modCount?: number;
  fileCount?: number;
  thumbnail?: string;
}

// Definir tipos para el estado de compatibilidad
interface CompatibilityCheck {
  compatible: boolean;
  message: string;
  compatibleInstances: any[];
  incompatibleInstances: any[];
}

interface Instance {
  id: string;
  name: string;
  version: string;
  loader?: 'vanilla' | 'forge' | 'fabric' | 'quilt' | 'neoforge';
  path: string;
}

export class ModpackImportService {
  /**
   * Analiza un modpack desde archivo o URL
   */
  public async analyzeModpack(source: string): Promise<ModpackMetadata> {
    // Todo se maneja en el proceso principal
    if (source.startsWith('http')) {
      // Usar el proceso principal para analizar URLs
      if (!window.api?.modpackImport) {
        throw new Error('API de importación de modpacks no disponible');
      }
      return await window.api.modpackImport.analyzeUrl(source);
    } else {
      // Usar el proceso principal para analizar archivos locales
      if (!window.api?.modpackImport) {
        throw new Error('API de importación de modpacks no disponible');
      }
      return await window.api.modpackImport.analyzeFile(source);
    }
  }

  /**
   * Verifica la compatibilidad del modpack con instancias existentes
   */
  public checkCompatibility(
    modpackMetadata: ModpackMetadata,
    instances: Instance[]
  ): CompatibilityCheck {
    const compatibleInstances = instances.filter(instance => 
      instance.version === modpackMetadata.mcVersion && 
      instance.loader === modpackMetadata.loader
    );
    
    const incompatibleInstances = instances.filter(instance => 
      instance.version !== modpackMetadata.mcVersion || 
      instance.loader !== modpackMetadata.loader
    );
    
    const isCompatible = compatibleInstances.length > 0;
    
    return {
      compatible: isCompatible,
      message: isCompatible 
        ? 'Compatible con algunas instancias existentes' 
        : 'No compatible con ninguna instancia existente',
      compatibleInstances,
      incompatibleInstances
    };
  }

  /**
   * Importa un modpack a una instancia específica
   */
  public async importModpack(
    source: string,
    targetInstanceId: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    try {
      if (!window.api?.modpackImport) {
        throw new Error('API de importación de modpacks no disponible');
      }
      
      // Obtener la ruta de la instancia objetivo
      if (!window.api?.instances) {
        throw new Error('API de instancias no disponible');
      }

      const instance = await window.api.instances.list()
        .then(instances => instances.find((inst: any) => inst.id === targetInstanceId));

      if (!instance) {
        throw new Error('Instancia de destino no encontrada');
      }
      
      if (source.startsWith('http')) {
        // Importar desde URL usando proceso principal
        await window.api.modpackImport.downloadAndExtractFromUrl(source, instance.path, onProgress);
      } else {
        // Importar desde archivo local usando proceso principal
        await window.api.modpackImport.extractAndInstall(source, instance.path);
      }
    } catch (error) {
      console.error('Error al importar modpack:', error);
      throw error;
    }
  }

  /**
   * Importa un modpack creando una nueva instancia automáticamente
   */
  public async importModpackAndCreateInstance(
    source: string,
    metadata: ModpackMetadata,
    onProgress?: (progress: number) => void
  ): Promise<any> {
    try {
      if (!window.api?.modpackImport) {
        throw new Error('API de importación de modpacks no disponible');
      }
      
      // Crear instancia automáticamente usando el proceso principal
      return await window.api.modpackImport.importAndCreateInstance(source, metadata, onProgress);
    } catch (error) {
      console.error('Error al importar modpack y crear instancia:', error);
      throw error;
    }
  }

  /**
   * Genera una URL temporal para compartir un modpack o carpeta
   */
  public async generateTemporaryUrl(filePath: string): Promise<string> {
    if (!window.api?.modpack) {
      throw new Error('API de modpacks no disponible');
    }

    // Enviar la solicitud al proceso principal para manejar archivos grandes
    return await window.api.modpack.createTemporary(filePath);
  }

  /**
   * Valida si una URL de modpack es válida y accesible
   */
  public async validateModpackUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export const modpackImportService = new ModpackImportService();