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
    loaderVersion?: string; // IMPORTANTE: Versión del loader (ej: "61.0.2" para Forge)
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

  async getIncompleteDownloads(): Promise<any[]> {
    if (!window.api?.instance?.getIncompleteDownloads) {
      return [];
    }
    return await window.api.instance.getIncompleteDownloads() || [];
  }

  async resumeDownload(downloadId: string): Promise<any> {
    if (!window.api?.instance?.resumeDownload) {
      throw new Error('API de reanudación de descargas no disponible');
    }
    return await window.api.instance.resumeDownload(downloadId);
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
    try {
      console.log(`[Forge] Obteniendo versiones para Minecraft ${mcVersion}`);
      
      // Intentar múltiples URLs de la API de Forge
      const forgeApiUrls = [
        `https://maven.minecraftforge.net/net/minecraftforge/forge/maven-metadata.xml`,
        `https://files.minecraftforge.net/net/minecraftforge/forge/maven-metadata.xml`
      ];

      let data: any = null;
      let lastError: Error | null = null;

      // Intentar cada URL hasta que una funcione
      for (const url of forgeApiUrls) {
        try {
          console.log(`[Forge] Intentando URL: ${url}`);
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'DRK-Launcher/1.0'
            }
          });
          
          if (!response.ok) {
            console.warn(`[Forge] URL ${url} devolvió ${response.status}`);
            continue;
          }
          
          const contentType = response.headers.get('content-type') || '';
          
          if (contentType.includes('xml') || url.includes('.xml')) {
            // Parsear XML
            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            
            // Extraer versiones del XML
            const versionElements = xmlDoc.getElementsByTagName('version');
            const versions: string[] = [];
            for (let i = 0; i < versionElements.length; i++) {
              const version = versionElements[i].textContent;
              if (version) {
                versions.push(version);
              }
            }
            
            data = { versioning: { versions } };
            console.log(`[Forge] Datos XML recibidos, ${versions.length} versiones encontradas`);
            break;
          } else {
            // Parsear JSON
            data = await response.json();
            console.log(`[Forge] Datos JSON recibidos:`, data);
            break;
          }
        } catch (err: any) {
          console.warn(`[Forge] Error al obtener desde ${url}:`, err.message);
          lastError = err;
          continue;
        }
      }

      // Si ninguna URL funcionó, usar la API alternativa de Forge
      if (!data) {
        console.log(`[Forge] Intentando API alternativa de Forge (promociones)...`);
        try {
          // Usar la API de promociones de Forge como alternativa
          const promoResponse = await fetch(`https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json`, {
            headers: {
              'User-Agent': 'DRK-Launcher/1.0'
            }
          });
          
          if (promoResponse.ok) {
            const promoData = await promoResponse.json();
            console.log(`[Forge] Datos de promociones recibidos:`, promoData);
            
            // Extraer versiones de las promociones
            const allVersions: string[] = [];
            if (promoData.promos) {
              for (const key in promoData.promos) {
                if (key.startsWith(`${mcVersion}-`)) {
                  allVersions.push(key);
                }
              }
            }
            
            data = { versioning: { versions: allVersions } };
            console.log(`[Forge] ${allVersions.length} versiones extraídas de promociones`);
          }
        } catch (err: any) {
          console.error(`[Forge] Error al obtener promociones:`, err);
        }
      }

      if (!data || !data.versioning || !data.versioning.versions || !Array.isArray(data.versioning.versions)) {
        console.error('[Forge] No se pudieron obtener versiones de ninguna fuente');
        if (lastError) {
          throw lastError;
        }
        return [];
      }

      // Filtrar solo versiones compatibles con la versión de Minecraft específica
      const compatibleVersions = data.versioning.versions.filter((v: string) => {
        // Las versiones de Forge tienen el formato: MCVERSION-FORGEVERSION
        // Ejemplo: 1.20.1-47.2.0
        return v && typeof v === 'string' && v.startsWith(`${mcVersion}-`);
      });

      console.log(`[Forge] Versiones compatibles encontradas: ${compatibleVersions.length}`, compatibleVersions);

      if (compatibleVersions.length === 0) {
        console.warn(`[Forge] No se encontraron versiones compatibles para Minecraft ${mcVersion}`);
        return [];
      }

      // Ordenar versiones (más recientes primero)
      const sortedVersions = compatibleVersions.sort((a: string, b: string) => {
        // Extraer la versión de Forge (después del guión)
        const forgeVersionA = a.split('-')[1] || '';
        const forgeVersionB = b.split('-')[1] || '';
        return forgeVersionB.localeCompare(forgeVersionA, undefined, { numeric: true, sensitivity: 'base' });
      });

      // Obtener información detallada para versiones compatibles
      const forgeVersions = sortedVersions.map((version: string) => ({
        version,
        mcversion: mcVersion,
        type: 'release' // Por defecto, todas son releases
      }));

      console.log(`[Forge] Versiones procesadas:`, forgeVersions);
      return forgeVersions;
    } catch (error) {
      console.error('[Forge] Error al obtener versiones de Forge:', error);
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
      console.log(`[NeoForge] Obteniendo versiones para Minecraft ${mcVersion}`);
      
      // Usar la API de NeoForge Maven para obtener versiones
      const response = await fetch(`https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge`, {
        headers: {
          'User-Agent': 'DRK-Launcher/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json();
      console.log(`[NeoForge] Datos recibidos:`, responseData);

      // La API de NeoForge puede devolver un objeto con {versions: [...]} o un array directo
      let allVersions: any[] = [];
      
      if (Array.isArray(responseData)) {
        // Si es un array directo
        allVersions = responseData;
      } else if (responseData && responseData.versions && Array.isArray(responseData.versions)) {
        // Si es un objeto con propiedad versions
        allVersions = responseData.versions;
        console.log(`[NeoForge] Versiones extraídas del objeto: ${allVersions.length}`);
      } else {
        console.error('[NeoForge] Estructura de datos inválida:', responseData);
        return [];
      }

      // Mostrar algunas versiones de ejemplo para debugging
      if (allVersions.length > 0) {
        const sampleVersions = allVersions.slice(0, 5).map((v: any) => {
          if (typeof v === 'string') return v;
          return v.version || v.id || String(v);
        });
        console.log(`[NeoForge] Ejemplos de versiones (primeras 5):`, sampleVersions);
      }

      // Filtrar solo versiones compatibles con la versión de Minecraft específica
      const compatibleVersions = allVersions.filter((v: any) => {
        // Las versiones de NeoForge tienen el formato: MCVERSION-NEOFORGEVERSION
        // Ejemplo: 1.20.1-20.1.123 o 21.1.123 para MC 1.21.1
        let versionString = '';
        
        if (typeof v === 'string') {
          versionString = v;
        } else if (v && v.version) {
          versionString = v.version;
        } else if (v && typeof v === 'object') {
          // Intentar encontrar la propiedad version en el objeto
          versionString = v.version || v.id || '';
        }
        
        if (!versionString) return false;
        
        // Intentar múltiples formatos:
        // 1. Formato completo: 1.21.1-21.1.123
        if (versionString.startsWith(`${mcVersion}-`)) {
          return true;
        }
        
        // 2. Formato corto: extraer la versión de MC del inicio
        // Para MC 1.21.1, buscar versiones que empiecen con "1.21.1-" o "21.1."
        const mcVersionParts = mcVersion.split('.');
        if (mcVersionParts.length >= 2) {
          const majorMinor = `${mcVersionParts[0]}.${mcVersionParts[1]}`;
          // Formato: 1.21.1-21.1.123 o 21.1.123
          if (versionString.startsWith(`${majorMinor}.`) || versionString.startsWith(`${mcVersion}-`)) {
            return true;
          }
        }
        
        // 3. Formato alternativo: solo la versión de NeoForge (21.1.123) - verificar si coincide con el patrón
        // Para MC 1.21.1, el formato sería 21.1.xxx
        if (mcVersionParts.length >= 3) {
          const neoforgePattern = `${mcVersionParts[1]}.${mcVersionParts[2]}`;
          if (versionString.startsWith(neoforgePattern)) {
            return true;
          }
        }
        
        return false;
      });

      console.log(`[NeoForge] Versiones compatibles encontradas: ${compatibleVersions.length}`, compatibleVersions);

      if (compatibleVersions.length === 0) {
        console.warn(`[NeoForge] No se encontraron versiones compatibles para Minecraft ${mcVersion}`);
        return [];
      }

      // Normalizar el formato de datos y ordenar versiones (más recientes primero)
      const normalizedVersions = compatibleVersions.map((v: any) => {
        // Si es un string, convertirlo a objeto
        if (typeof v === 'string') {
          return { version: v };
        }
        // Si es un objeto pero no tiene version, intentar extraerlo
        if (v && !v.version) {
          return { version: v.id || v.name || String(v) };
        }
        return v;
      });

      // Ordenar versiones
      const sortedVersions = normalizedVersions.sort((a: any, b: any) => {
        const versionA = a.version || '';
        const versionB = b.version || '';
        
        // Extraer la versión de NeoForge (después del guión)
        const neoforgeVersionA = versionA.split('-')[1] || '';
        const neoforgeVersionB = versionB.split('-')[1] || '';
        
        return neoforgeVersionB.localeCompare(neoforgeVersionA, undefined, { numeric: true, sensitivity: 'base' });
      });

      // Formatear versiones para consistencia con Forge
      const neoforgeVersions = sortedVersions.map((v: any) => {
        const version = v.version || '';
        return {
          version,
          mcversion: mcVersion,
          type: v.type || 'release' // Por defecto, todas son releases
        };
      });

      console.log(`[NeoForge] Versiones procesadas:`, neoforgeVersions);
      return neoforgeVersions;
    } catch (error) {
      console.error('[NeoForge] Error al obtener versiones de NeoForge:', error);
      return [];
    }
  }
}

export const integratedDownloadService = new IntegratedDownloadService();