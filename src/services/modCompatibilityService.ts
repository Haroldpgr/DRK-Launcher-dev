import fs from 'node:fs';
import path from 'node:path';
import { logProgressService } from './logProgressService';

/**
 * Lista de mods conocidos como incompatibles o problemáticos
 * Basado en errores comunes reportados en logs
 */
export const INCOMPATIBLE_MODS = {
  // Mods que causan crashes críticos
  critical: [
    {
      id: 'trender',
      name: 'Trender',
      reason: 'InvalidAccessorException - método no encontrado en Minecraft 1.21.1',
      patterns: ['trender']
    }
  ],
  
  // Mods con problemas conocidos (warnings que pueden causar problemas)
  problematic: [
    {
      id: 'entityculling',
      name: 'Entity Culling',
      reason: 'Clase de Minecraft no encontrada (@Mixin target)',
      patterns: ['entityculling', 'entity-culling']
    },
    {
      id: 'transition',
      name: 'Transition',
      reason: 'Clases de Minecraft no encontradas (@Mixin target)',
      patterns: ['transition']
    },
    {
      id: 'ferritecore',
      name: 'FerriteCore',
      reason: 'Opción de mixin no disponible en esta versión',
      patterns: ['ferritecore', 'ferrite-core']
    }
  ],
  
  // Mods con conflictos conocidos
  conflicts: [
    {
      id: 'cobblemon-adorn',
      name: 'Cobblemon + Adorn',
      reason: 'Conflicto de mixin con Adorn',
      patterns: ['cobblemon'],
      conflictingWith: ['adorn']
    }
  ]
};

/**
 * Interfaz para información de un mod incompatible
 */
export interface IncompatibleModInfo {
  fileName: string;
  filePath: string;
  reason: string;
  severity: 'critical' | 'problematic' | 'conflict';
  category: string;
}

/**
 * Servicio para analizar y gestionar mods incompatibles
 */
export class ModCompatibilityService {
  /**
   * Analiza los mods instalados y detecta incompatibilidades
   */
  static analyzeMods(
    instancePath: string,
    loader: 'fabric' | 'forge' | 'quilt' | 'neoforge',
    mcVersion: string
  ): IncompatibleModInfo[] {
    const modsDir = path.join(instancePath, 'mods');
    const incompatibleMods: IncompatibleModInfo[] = [];

    if (!fs.existsSync(modsDir)) {
      return incompatibleMods;
    }

    const modFiles = fs.readdirSync(modsDir).filter(file => 
      file.toLowerCase().endsWith('.jar')
    );

    // Obtener lista de nombres de mods instalados para detectar conflictos
    const installedModNames = modFiles.map(f => f.toLowerCase());

    for (const file of modFiles) {
      const filePath = path.join(modsDir, file);
      const fileNameLower = file.toLowerCase();

      // Verificar mods críticos
      for (const criticalMod of INCOMPATIBLE_MODS.critical) {
        if (criticalMod.patterns.some(pattern => fileNameLower.includes(pattern))) {
          incompatibleMods.push({
            fileName: file,
            filePath,
            reason: criticalMod.reason,
            severity: 'critical',
            category: criticalMod.name
          });
          continue;
        }
      }

      // Verificar mods problemáticos
      for (const problematicMod of INCOMPATIBLE_MODS.problematic) {
        if (problematicMod.patterns.some(pattern => fileNameLower.includes(pattern))) {
          incompatibleMods.push({
            fileName: file,
            filePath,
            reason: problematicMod.reason,
            severity: 'problematic',
            category: problematicMod.name
          });
          continue;
        }
      }

      // Verificar conflictos
      for (const conflict of INCOMPATIBLE_MODS.conflicts) {
        if (conflict.patterns.some(pattern => fileNameLower.includes(pattern))) {
          // Verificar si el mod conflictivo también está instalado
          const hasConflict = conflict.conflictingWith?.some(conflictingMod =>
            installedModNames.some(installed => installed.includes(conflictingMod.toLowerCase()))
          );

          if (hasConflict) {
            incompatibleMods.push({
              fileName: file,
              filePath,
              reason: conflict.reason,
              severity: 'conflict',
              category: conflict.name
            });
          }
        }
      }
    }

    return incompatibleMods;
  }

  /**
   * Deshabilita mods incompatibles moviéndolos a una carpeta de respaldo
   */
  static async disableIncompatibleMods(
    instancePath: string,
    loader: 'fabric' | 'forge' | 'quilt' | 'neoforge',
    mcVersion: string,
    options?: {
      disableCritical?: boolean;
      disableProblematic?: boolean;
      disableConflicts?: boolean;
    }
  ): Promise<{
    disabled: string[];
    warnings: string[];
    errors: string[];
  }> {
    const disabled: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    const {
      disableCritical = true,
      disableProblematic = false, // Por defecto solo deshabilitar críticos
      disableConflicts = false
    } = options || {};

    const incompatibleMods = this.analyzeMods(instancePath, loader, mcVersion);
    const modsDir = path.join(instancePath, 'mods');
    const disabledDir = path.join(instancePath, 'mods-disabled');

    // Crear carpeta de mods deshabilitados si no existe
    if (!fs.existsSync(disabledDir)) {
      fs.mkdirSync(disabledDir, { recursive: true });
    }

    for (const mod of incompatibleMods) {
      const shouldDisable =
        (mod.severity === 'critical' && disableCritical) ||
        (mod.severity === 'problematic' && disableProblematic) ||
        (mod.severity === 'conflict' && disableConflicts);

      if (!shouldDisable) {
        continue;
      }

      try {
        const fileName = path.basename(mod.filePath);
        const disabledPath = path.join(disabledDir, fileName);

        // Si ya existe en disabled, agregar timestamp
        if (fs.existsSync(disabledPath)) {
          const timestamp = Date.now();
          const nameWithoutExt = path.parse(fileName).name;
          const ext = path.parse(fileName).ext;
          const newFileName = `${nameWithoutExt}-${timestamp}${ext}`;
          const newDisabledPath = path.join(disabledDir, newFileName);
          fs.renameSync(mod.filePath, newDisabledPath);
          disabled.push(fileName);
          logProgressService.info(`[Mods] Mod incompatible deshabilitado: ${fileName} -> ${newFileName}`);
        } else {
          fs.renameSync(mod.filePath, disabledPath);
          disabled.push(fileName);
          logProgressService.info(`[Mods] Mod incompatible deshabilitado: ${fileName}`);
        }

        // Registrar advertencia
        warnings.push(`${mod.fileName}: ${mod.reason} (${mod.severity})`);
      } catch (error: any) {
        const errorMsg = `Error al deshabilitar mod ${mod.fileName}: ${error.message}`;
        errors.push(errorMsg);
        logProgressService.error(`[Mods] ${errorMsg}`);
      }
    }

    return { disabled, warnings, errors };
  }

  /**
   * Rehabilita mods deshabilitados (mueve de vuelta a mods/)
   */
  static async reenableMods(
    instancePath: string,
    modFileNames?: string[]
  ): Promise<{
    reenabled: string[];
    errors: string[];
  }> {
    const reenabled: string[] = [];
    const errors: string[] = [];

    const modsDir = path.join(instancePath, 'mods');
    const disabledDir = path.join(instancePath, 'mods-disabled');

    if (!fs.existsSync(disabledDir)) {
      return { reenabled, errors };
    }

    const disabledFiles = modFileNames
      ? fs.readdirSync(disabledDir).filter(file =>
          modFileNames.some(name => file.includes(name))
        )
      : fs.readdirSync(disabledDir).filter(file => file.toLowerCase().endsWith('.jar'));

    for (const file of disabledFiles) {
      try {
        const disabledPath = path.join(disabledDir, file);
        const enabledPath = path.join(modsDir, file);

        // Si ya existe en mods, agregar timestamp
        if (fs.existsSync(enabledPath)) {
          const timestamp = Date.now();
          const nameWithoutExt = path.parse(file).name;
          const ext = path.parse(file).ext;
          const newFileName = `${nameWithoutExt}-${timestamp}${ext}`;
          const newEnabledPath = path.join(modsDir, newFileName);
          fs.renameSync(disabledPath, newEnabledPath);
          reenabled.push(file);
        } else {
          fs.renameSync(disabledPath, enabledPath);
          reenabled.push(file);
        }
      } catch (error: any) {
        errors.push(`Error al rehabilitar ${file}: ${error.message}`);
      }
    }

    return { reenabled, errors };
  }

  /**
   * Obtiene un resumen de mods incompatibles sin deshabilitarlos
   */
  static getCompatibilityReport(
    instancePath: string,
    loader: 'fabric' | 'forge' | 'quilt' | 'neoforge',
    mcVersion: string
  ): {
    total: number;
    critical: number;
    problematic: number;
    conflicts: number;
    details: IncompatibleModInfo[];
  } {
    const incompatibleMods = this.analyzeMods(instancePath, loader, mcVersion);

    return {
      total: incompatibleMods.length,
      critical: incompatibleMods.filter(m => m.severity === 'critical').length,
      problematic: incompatibleMods.filter(m => m.severity === 'problematic').length,
      conflicts: incompatibleMods.filter(m => m.severity === 'conflict').length,
      details: incompatibleMods
    };
  }
}

