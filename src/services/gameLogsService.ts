import fs from 'node:fs';
import path from 'node:path';
import { ModCompatibilityService } from './modCompatibilityService';
import { logProgressService } from './logProgressService';

/**
 * Servicio para almacenar y gestionar logs del juego en memoria
 * Incluye análisis en tiempo real de mods incompatibles
 */
export class GameLogsService {
  private static instance: GameLogsService;
  private logs: Map<string, string[]> = new Map();
  private maxLogsPerInstance = 10000; // Máximo de líneas por instancia
  private instancePaths: Map<string, string> = new Map(); // instanceId -> instancePath
  private instanceLoaders: Map<string, 'fabric' | 'forge' | 'quilt' | 'neoforge'> = new Map();
  private analyzedMods: Map<string, Set<string>> = new Map(); // instanceId -> Set<modNames>
  private modErrorPatterns = [
    // Patrones de errores de mods incompatibles
    /InvalidAccessorException.*method_(\d+)/i,
    /@Mixin target.*was not found/i,
    /No candidates were found matching/i,
    /Mod '([^']+)' attempted to override option/i,
    /Error loading mod ([^\s:]+)/i,
    /Failed to load mod ([^\s:]+)/i,
    /([^\s]+) caused an error/i,
    /Caused by:.*mod\.([^\s.]+)/i
  ];

  private constructor() {}

  static getInstance(): GameLogsService {
    if (!GameLogsService.instance) {
      GameLogsService.instance = new GameLogsService();
    }
    return GameLogsService.instance;
  }

  /**
   * Registra información de la instancia para análisis
   */
  registerInstance(instanceId: string, instancePath: string, loader?: 'fabric' | 'forge' | 'quilt' | 'neoforge'): void {
    this.instancePaths.set(instanceId, instancePath);
    if (loader) {
      this.instanceLoaders.set(instanceId, loader);
    }
    if (!this.analyzedMods.has(instanceId)) {
      this.analyzedMods.set(instanceId, new Set());
    }
  }

  /**
   * Agrega un log para una instancia específica y analiza en tiempo real
   */
  addLog(instanceId: string, log: string): void {
    if (!this.logs.has(instanceId)) {
      this.logs.set(instanceId, []);
    }

    const instanceLogs = this.logs.get(instanceId)!;
    instanceLogs.push(log);

    // Limitar el número de logs para evitar consumo excesivo de memoria
    if (instanceLogs.length > this.maxLogsPerInstance) {
      // Eliminar los logs más antiguos (mantener los últimos maxLogsPerInstance)
      const logsToKeep = instanceLogs.slice(-this.maxLogsPerInstance);
      this.logs.set(instanceId, logsToKeep);
    }

    // Analizar el log en tiempo real para detectar mods incompatibles
    this.analyzeLogForIncompatibleMods(instanceId, log);
  }

  /**
   * Analiza un log en tiempo real para detectar mods incompatibles
   */
  private analyzeLogForIncompatibleMods(instanceId: string, log: string): void {
    const instancePath = this.instancePaths.get(instanceId);
    if (!instancePath) return;

    const loader = this.instanceLoaders.get(instanceId);
    if (!loader || loader === 'vanilla') return;

    const analyzed = this.analyzedMods.get(instanceId);
    if (!analyzed) return;

    // Buscar patrones de errores de mods
    for (const pattern of this.modErrorPatterns) {
      const match = log.match(pattern);
      if (match) {
        // Intentar extraer el nombre del mod del error
        let modName: string | null = null;

        // Buscar nombres de mods conocidos en el log
        const modsDir = path.join(instancePath, 'mods');
        if (fs.existsSync(modsDir)) {
          const modFiles = fs.readdirSync(modsDir).filter(f => f.endsWith('.jar'));
          
          // Buscar el nombre del mod en el mensaje de error
          for (const modFile of modFiles) {
            const modNameLower = modFile.toLowerCase().replace(/\.jar$/i, '');
            if (log.toLowerCase().includes(modNameLower) && !analyzed.has(modNameLower)) {
              modName = modNameLower;
              break;
            }
          }

          // Si no se encontró por nombre, usar el patrón del error
          if (!modName && match[1]) {
            const possibleModName = match[1].toLowerCase();
            // Verificar si existe un mod con ese nombre
            const matchingMod = modFiles.find(f => 
              f.toLowerCase().includes(possibleModName) || possibleModName.includes(f.toLowerCase().replace(/\.jar$/i, ''))
            );
            if (matchingMod) {
              modName = matchingMod.toLowerCase().replace(/\.jar$/i, '');
            }
          }
        }

        if (modName && !analyzed.has(modName)) {
          analyzed.add(modName);
          this.disableIncompatibleMod(instanceId, instancePath, modName, log);
        }
      }
    }
  }

  /**
   * Deshabilita un mod incompatible detectado durante la ejecución
   */
  private async disableIncompatibleMod(
    instanceId: string,
    instancePath: string,
    modName: string,
    errorLog: string
  ): Promise<void> {
    try {
      const modsDir = path.join(instancePath, 'mods');
      const disabledDir = path.join(instancePath, 'mods-disabled');

      if (!fs.existsSync(modsDir)) return;

      // Buscar el archivo del mod
      const modFiles = fs.readdirSync(modsDir).filter(f => 
        f.toLowerCase().endsWith('.jar') && f.toLowerCase().includes(modName.toLowerCase())
      );

      if (modFiles.length === 0) return;

      // Crear carpeta de deshabilitados si no existe
      if (!fs.existsSync(disabledDir)) {
        fs.mkdirSync(disabledDir, { recursive: true });
      }

      for (const modFile of modFiles) {
        const modPath = path.join(modsDir, modFile);
        const disabledPath = path.join(disabledDir, modFile);

        // Si ya existe en disabled, agregar timestamp
        if (fs.existsSync(disabledPath)) {
          const timestamp = Date.now();
          const nameWithoutExt = path.parse(modFile).name;
          const ext = path.parse(modFile).ext;
          const newFileName = `${nameWithoutExt}-${timestamp}${ext}`;
          const newDisabledPath = path.join(disabledDir, newFileName);
          fs.renameSync(modPath, newDisabledPath);
          
          logProgressService.warning(
            `[Mods] Mod incompatible detectado y deshabilitado automáticamente: ${modFile}`,
            { instanceId, modName: modFile, reason: 'Error detectado en logs' }
          );
        } else {
          fs.renameSync(modPath, disabledPath);
          
          logProgressService.warning(
            `[Mods] Mod incompatible detectado y deshabilitado automáticamente: ${modFile}`,
            { instanceId, modName: modFile, reason: 'Error detectado en logs', errorPreview: errorLog.substring(0, 100) }
          );
        }
      }
    } catch (error: any) {
      logProgressService.error(`Error al deshabilitar mod ${modName}: ${error.message}`);
    }
  }

  /**
   * Obtiene todos los logs de una instancia
   */
  getLogs(instanceId: string): string[] {
    return this.logs.get(instanceId) || [];
  }

  /**
   * Limpia los logs de una instancia
   */
  clearLogs(instanceId: string): void {
    this.logs.set(instanceId, []);
  }

  /**
   * Elimina todos los logs de una instancia (cuando se elimina la instancia)
   */
  removeInstance(instanceId: string): void {
    this.logs.delete(instanceId);
  }

  /**
   * Obtiene todas las instancias que tienen logs
   */
  getInstancesWithLogs(): string[] {
    return Array.from(this.logs.keys());
  }
}

export const gameLogsService = GameLogsService.getInstance();

