import path from 'node:path';
import fs from 'node:fs';
import { logProgressService } from '../../logProgressService';
import { minecraftDownloadService } from '../../minecraftDownloadService';

/**
 * Servicio ADAPTADOR para descargar instancias Vanilla de Minecraft
 * 
 * PROPÓSITO:
 * Este archivo actúa como un ADAPTADOR/ORQUESTADOR que proporciona una interfaz común
 * para todos los loaders (Vanilla, Fabric, Quilt, Forge, NeoForge).
 * 
 * ¿POR QUÉ EXISTE ESTE ARCHIVO?
 * 1. Interfaz común: Todos los loaders tienen `downloadInstance(version, instancePath)`
 * 2. Uso en orquestación: `enhancedInstanceCreationService` lo usa en un switch
 * 3. Reutilización: Fabric y Quilt lo usan para descargar la base vanilla primero
 * 4. Validación específica: Tiene métodos de validación específicos de Vanilla
 * 5. Logging contextual: Proporciona logging con contexto "[Vanilla]"
 * 
 * ARQUITECTURA:
 * - Este archivo ORQUESTA y delega la lógica real a `minecraftDownloadService`
 * - `minecraftDownloadService` contiene toda la lógica de descarga (reutilizable)
 * - Este archivo añade la capa de abstracción y validación específica de Vanilla
 * 
 * USO:
 * - Desde `enhancedInstanceCreationService`: switch case 'vanilla'
 * - Desde `DownloadFabric`: descarga vanilla base antes de instalar Fabric
 * - Desde `DownloadQuilt`: descarga vanilla base antes de instalar Quilt
 */
export class DownloadVanilla {
  /**
   * Descarga una instancia Vanilla completa
   * 
   * Este método:
   * 1. Crea la carpeta de la instancia si no existe
   * 2. Delega a `minecraftDownloadService.downloadCompleteVersion()` que descarga:
   *    - version.json (metadata)
   *    - Librerías (artifacts + natives)
   *    - client.jar
   *    - Assets (texturas, sonidos, lenguajes, etc.)
   * 
   * @param mcVersion Versión de Minecraft (ej. '1.21.11')
   * @param instancePath Ruta donde se creará la instancia
   */
  async downloadInstance(mcVersion: string, instancePath: string): Promise<void> {
    try {
      logProgressService.info(`[Vanilla] Iniciando descarga de Minecraft ${mcVersion}...`);
      
      // Asegurar que la carpeta de la instancia existe
      if (!fs.existsSync(instancePath)) {
        fs.mkdirSync(instancePath, { recursive: true });
      }

      // Delegar toda la lógica de descarga a minecraftDownloadService
      // Esto descarga: version.json, libraries (artifacts + natives), client.jar, assets
      await minecraftDownloadService.downloadCompleteVersion(mcVersion, instancePath);
      
      logProgressService.info(`[Vanilla] Descarga completada exitosamente para ${mcVersion}`);
    } catch (error) {
      logProgressService.error(`[Vanilla] Error al descargar instancia:`, error);
      throw error;
    }
  }

  /**
   * Valida que todos los archivos necesarios estén presentes
   * 
   * Este método es específico de Vanilla y valida:
   * - Que client.jar existe y tiene un tamaño razonable (>1MB)
   * 
   * NOTA: La validación completa de librerías y assets se hace en minecraftDownloadService
   * 
   * @param instancePath Ruta de la instancia
   * @param mcVersion Versión de Minecraft
   * @returns true si la descarga es válida, false en caso contrario
   */
  validateDownload(instancePath: string, mcVersion: string): boolean {
    const clientJarPath = path.join(instancePath, 'client.jar');
    
    if (!fs.existsSync(clientJarPath)) {
      logProgressService.warning(`[Vanilla] client.jar no encontrado en ${clientJarPath}`);
      return false;
    }

    const stats = fs.statSync(clientJarPath);
    if (stats.size < 1024 * 1024) { // Menos de 1MB
      logProgressService.warning(`[Vanilla] client.jar parece estar incompleto (${stats.size} bytes)`);
      return false;
    }

    return true;
  }
}

export const downloadVanilla = new DownloadVanilla();
