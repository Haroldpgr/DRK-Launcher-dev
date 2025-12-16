import fs from 'node:fs';
import path from 'node:path';

/**
 * Interfaz para información de un mod
 */
export interface ModInfo {
  id: string;
  name: string;
  version: string;
  loader: 'fabric' | 'forge' | 'quilt' | 'neoforge';
  filePath: string;
  fileSize: number;
}

/**
 * Mods de optimización recomendados por loader
 */
export const OPTIMIZATION_MODS = {
  fabric: [
    {
      id: 'sodium',
      name: 'Sodium',
      description: 'Mejora significativamente el rendimiento de renderizado',
      modrinthId: 'AANobbMI',
      required: false
    },
    {
      id: 'lithium',
      name: 'Lithium',
      description: 'Optimiza la lógica del juego (FPS, TPS, uso de memoria)',
      modrinthId: 'gvQqBUqZ',
      required: false
    },
    {
      id: 'phosphor',
      name: 'Phosphor',
      description: 'Optimiza el sistema de iluminación',
      modrinthId: 'Ha28R6CL',
      required: false
    },
    {
      id: 'c2me',
      name: 'C2ME',
      description: 'Generación de chunks multihilo (mejora drásticamente la generación)',
      modrinthId: 'eCQ0M8xE',
      required: false
    },
    {
      id: 'fabric-api',
      name: 'Fabric API',
      description: 'API requerida por la mayoría de mods de Fabric',
      modrinthId: 'P7dR8mSH',
      required: true
    }
  ],
  quilt: [
    {
      id: 'sodium',
      name: 'Sodium',
      description: 'Mejora significativamente el rendimiento de renderizado',
      modrinthId: 'AANobbMI',
      required: false
    },
    {
      id: 'lithium',
      name: 'Lithium',
      description: 'Optimiza la lógica del juego (FPS, TPS, uso de memoria)',
      modrinthId: 'gvQqBUqZ',
      required: false
    },
    {
      id: 'quilt-standard-libraries',
      name: 'Quilt Standard Libraries',
      description: 'API requerida por la mayoría de mods de Quilt',
      modrinthId: 'quilt_standard_libraries',
      required: true
    }
  ],
  forge: [
    {
      id: 'embeddium',
      name: 'Embeddium',
      description: 'Mejora significativamente el rendimiento de renderizado (fork de Sodium para Forge)',
      modrinthId: 'embeddium',
      required: false
    },
    {
      id: 'ferritecore',
      name: 'FerriteCore',
      description: 'Reduce el uso de memoria',
      modrinthId: 'u6dRKJwZ',
      required: false
    },
    {
      id: 'c2me',
      name: 'C2ME',
      description: 'Generación de chunks multihilo',
      modrinthId: 'eCQ0M8xE',
      required: false
    }
  ],
  neoforge: [
    {
      id: 'embeddium',
      name: 'Embeddium',
      description: 'Mejora significativamente el rendimiento de renderizado',
      modrinthId: 'embeddium',
      required: false
    },
    {
      id: 'ferritecore',
      name: 'FerriteCore',
      description: 'Reduce el uso de memoria',
      modrinthId: 'u6dRKJwZ',
      required: false
    },
    {
      id: 'c2me',
      name: 'C2ME',
      description: 'Generación de chunks multihilo',
      modrinthId: 'eCQ0M8xE',
      required: false
    }
  ]
};

/**
 * Servicio para detectar y gestionar mods en instancias de Minecraft
 */
export class ModDetectionService {
  /**
   * Detecta todos los mods instalados en una instancia
   */
  static detectInstalledMods(instancePath: string, loader: 'vanilla' | 'fabric' | 'forge' | 'quilt' | 'neoforge'): ModInfo[] {
    const modsPath = path.join(instancePath, 'mods');
    
    if (!fs.existsSync(modsPath)) {
      return [];
    }

    const mods: ModInfo[] = [];
    const files = fs.readdirSync(modsPath);

    for (const file of files) {
      const filePath = path.join(modsPath, file);
      const stats = fs.statSync(filePath);

      // Solo procesar archivos .jar
      if (stats.isFile() && file.toLowerCase().endsWith('.jar')) {
        try {
          // Intentar extraer información del nombre del archivo
          // Formato común: modname-version.jar o modname_version.jar
          const nameWithoutExt = file.replace(/\.jar$/i, '');
          const parts = nameWithoutExt.split(/[-_]/);
          
          let modName = nameWithoutExt;
          let modVersion = 'unknown';

          // Si tiene formato nombre-versión, extraer ambos
          if (parts.length >= 2) {
            // El último elemento suele ser la versión
            const lastPart = parts[parts.length - 1];
            // Verificar si el último elemento parece una versión (contiene números)
            if (/\d/.test(lastPart)) {
              modVersion = lastPart;
              modName = parts.slice(0, -1).join('-');
            } else {
              modName = nameWithoutExt;
            }
          }

          // Detectar mods conocidos por nombre
          const detectedMod = this.detectKnownMod(file, modName);
          if (detectedMod) {
            mods.push({
              id: detectedMod.id,
              name: detectedMod.name,
              version: modVersion,
              loader,
              filePath,
              fileSize: stats.size
            });
          } else {
            mods.push({
              id: nameWithoutExt.toLowerCase().replace(/[^a-z0-9]/g, '-'),
              name: modName,
              version: modVersion,
              loader,
              filePath,
              fileSize: stats.size
            });
          }
        } catch (error) {
          // Si hay error, agregar el mod con información básica
          mods.push({
            id: file.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            name: file.replace(/\.jar$/i, ''),
            version: 'unknown',
            loader,
            filePath,
            fileSize: stats.size
          });
        }
      }
    }

    return mods;
  }

  /**
   * Detecta mods conocidos por nombre de archivo
   */
  private static detectKnownMod(fileName: string, modName: string): { id: string; name: string } | null {
    const lowerFileName = fileName.toLowerCase();
    const lowerModName = modName.toLowerCase();

    // Fabric API
    if (lowerFileName.includes('fabric-api') || lowerFileName.includes('fabricapi')) {
      return { id: 'fabric-api', name: 'Fabric API' };
    }

    // Sodium
    if (lowerFileName.includes('sodium') || lowerModName.includes('sodium')) {
      return { id: 'sodium', name: 'Sodium' };
    }

    // Lithium
    if (lowerFileName.includes('lithium') || lowerModName.includes('lithium')) {
      return { id: 'lithium', name: 'Lithium' };
    }

    // Phosphor
    if (lowerFileName.includes('phosphor') || lowerModName.includes('phosphor')) {
      return { id: 'phosphor', name: 'Phosphor' };
    }

    // C2ME
    if (lowerFileName.includes('c2me') || lowerModName.includes('c2me')) {
      return { id: 'c2me', name: 'C2ME' };
    }

    // Embeddium
    if (lowerFileName.includes('embeddium') || lowerModName.includes('embeddium')) {
      return { id: 'embeddium', name: 'Embeddium' };
    }

    // FerriteCore
    if (lowerFileName.includes('ferritecore') || lowerModName.includes('ferritecore')) {
      return { id: 'ferritecore', name: 'FerriteCore' };
    }

    // Quilt Standard Libraries
    if (lowerFileName.includes('qsl') || lowerFileName.includes('quilt-standard') || lowerModName.includes('qsl')) {
      return { id: 'quilt-standard-libraries', name: 'Quilt Standard Libraries' };
    }

    return null;
  }

  /**
   * Detecta mods de optimización faltantes y sugiere instalarlos
   */
  static detectMissingOptimizationMods(
    instancePath: string,
    loader: 'vanilla' | 'fabric' | 'forge' | 'quilt' | 'neoforge',
    mcVersion: string
  ): Array<{ mod: typeof OPTIMIZATION_MODS.fabric[0]; reason: string }> {
    if (loader === 'vanilla') {
      return []; // No hay mods de optimización para vanilla
    }

    const installedMods = this.detectInstalledMods(instancePath, loader);
    const installedModIds = new Set(installedMods.map(m => m.id.toLowerCase()));

    const recommendedMods = OPTIMIZATION_MODS[loader] || [];
    const missingMods: Array<{ mod: typeof OPTIMIZATION_MODS.fabric[0]; reason: string }> = [];

    for (const recommendedMod of recommendedMods) {
      if (!installedModIds.has(recommendedMod.id.toLowerCase())) {
        let reason = recommendedMod.description;
        
        if (recommendedMod.required) {
          reason = `⚠️ REQUERIDO: ${reason}. Muchos mods no funcionarán sin este mod.`;
        } else {
          reason = `💡 RECOMENDADO: ${reason}. Mejora significativamente el rendimiento.`;
        }

        missingMods.push({ mod: recommendedMod, reason });
      }
    }

    return missingMods;
  }

  /**
   * Verifica si Fabric API está instalado (requerido para la mayoría de mods de Fabric)
   */
  static hasFabricAPI(instancePath: string): boolean {
    const mods = this.detectInstalledMods(instancePath, 'fabric');
    return mods.some(m => m.id.toLowerCase() === 'fabric-api');
  }

  /**
   * Obtiene estadísticas de mods instalados
   */
  static getModStats(instancePath: string, loader: 'vanilla' | 'fabric' | 'forge' | 'quilt' | 'neoforge'): {
    total: number;
    optimizationMods: number;
    totalSize: number;
    hasRequiredAPI: boolean;
  } {
    const mods = this.detectInstalledMods(instancePath, loader);
    const optimizationModIds = new Set(
      (OPTIMIZATION_MODS[loader] || []).map(m => m.id.toLowerCase())
    );

    const optimizationMods = mods.filter(m => optimizationModIds.has(m.id.toLowerCase()));
    const totalSize = mods.reduce((sum, m) => sum + m.fileSize, 0);
    
    let hasRequiredAPI = true;
    if (loader === 'fabric') {
      hasRequiredAPI = this.hasFabricAPI(instancePath);
    } else if (loader === 'quilt') {
      hasRequiredAPI = mods.some(m => m.id.toLowerCase().includes('qsl') || m.id.toLowerCase().includes('quilt-standard'));
    }

    return {
      total: mods.length,
      optimizationMods: optimizationMods.length,
      totalSize,
      hasRequiredAPI
    };
  }
}

