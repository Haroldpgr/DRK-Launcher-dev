import path from 'node:path';
import fs from 'node:fs';
import { minecraftDownloadService } from '../../minecraftDownloadService';
import { gameLaunchService } from '../../gameLaunchService';
import { logProgressService } from '../../logProgressService';

/**
 * Servicio para descargar instancias NeoForge de Minecraft
 */
export class DownloadNeoForge {
  /**
   * Descarga una instancia NeoForge completa
   * @param mcVersion Versión de Minecraft (ej. '1.20.1')
   * @param loaderVersion Versión de NeoForge (ej. '1.20.1-20.1.0')
   * @param instancePath Ruta donde se creará la instancia
   */
  async downloadInstance(
    mcVersion: string,
    loaderVersion: string | undefined,
    instancePath: string
  ): Promise<void> {
    try {
      logProgressService.info(`[NeoForge] Iniciando descarga de NeoForge ${loaderVersion || 'latest'} para Minecraft ${mcVersion}...`);
      
      // Asegurar que la carpeta de la instancia existe
      if (!fs.existsSync(instancePath)) {
        fs.mkdirSync(instancePath, { recursive: true });
      }

      // Descargar el cliente base de Minecraft
      await minecraftDownloadService.downloadClientJar(mcVersion, instancePath);
      
      // Descargar assets
      await minecraftDownloadService.validateAndDownloadAssets(mcVersion, undefined, 'NeoForge');
      
      // Descargar librerías base
      await minecraftDownloadService.downloadVersionLibraries(mcVersion);

      // Instalar NeoForge usando el servicio de lanzamiento (que tiene la lógica de Maven)
      // Nota: installForgeLoader guarda los archivos en la carpeta de versiones del launcher
      if (!loaderVersion) {
        throw new Error('La versión de NeoForge es requerida');
      }
      
      logProgressService.info(`[NeoForge] Instalando NeoForge ${loaderVersion} con todas sus dependencias...`);
      await gameLaunchService.installForgeLoader(mcVersion, 'neoforge', loaderVersion);
      
      // Copiar version.json a la carpeta de la instancia
      const launcherDataPath = require('../../utils/paths').getLauncherDataPath();
      const versionName = `${mcVersion}-neoforge-${loaderVersion}`;
      const versionJsonPath = path.join(launcherDataPath, 'versions', versionName, `${versionName}.json`);
      const instanceLoaderDir = path.join(instancePath, 'loader');
      if (!fs.existsSync(instanceLoaderDir)) {
        fs.mkdirSync(instanceLoaderDir, { recursive: true });
      }
      
      if (fs.existsSync(versionJsonPath)) {
        const instanceVersionJsonPath = path.join(instanceLoaderDir, 'version.json');
        fs.copyFileSync(versionJsonPath, instanceVersionJsonPath);
        logProgressService.info(`[NeoForge] version.json copiado a la instancia`);
        
        // IMPORTANTE: Descargar todas las librerías de NeoForge del version.json
        await this.downloadNeoForgeLibraries(versionJsonPath, instancePath);
      } else {
        logProgressService.warning(`[NeoForge] version.json no encontrado en: ${versionJsonPath}`);
      }
      
      logProgressService.info(`[NeoForge] Descarga completada exitosamente con todas las dependencias`);
    } catch (error) {
      logProgressService.error(`[NeoForge] Error al descargar instancia:`, error);
      throw error;
    }
  }

  /**
   * Descarga todas las librerías de NeoForge del version.json
   */
  private async downloadNeoForgeLibraries(versionJsonPath: string, instancePath: string): Promise<void> {
    try {
      logProgressService.info(`[NeoForge] Descargando librerías de NeoForge desde version.json...`);
      
      const versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));
      const launcherDataPath = require('../../utils/paths').getLauncherDataPath();
      const librariesDir = path.join(launcherDataPath, 'libraries');
      
      if (!versionData.libraries || !Array.isArray(versionData.libraries)) {
        logProgressService.warning(`[NeoForge] No se encontraron librerías en el version.json`);
        return;
      }

      let downloaded = 0;
      let skipped = 0;
      let failed = 0;

      for (const lib of versionData.libraries) {
        try {
          // Verificar reglas de compatibilidad
          if (lib.rules && !this.isLibraryAllowed(lib.rules)) {
            continue;
          }

          if (!lib.downloads?.artifact) {
            continue;
          }

          const libPath = path.join(librariesDir, lib.downloads.artifact.path);
          const libUrl = lib.downloads.artifact.url;

          // Verificar si ya existe
          if (fs.existsSync(libPath)) {
            skipped++;
            continue;
          }

          // Descargar la librería
          const libDir = path.dirname(libPath);
          if (!fs.existsSync(libDir)) {
            fs.mkdirSync(libDir, { recursive: true });
          }

          const response = await fetch(libUrl, { headers: { 'User-Agent': 'DRK-Launcher/1.0' } });
          if (response.ok) {
            const buffer = Buffer.from(await response.arrayBuffer());
            fs.writeFileSync(libPath, buffer);
            downloaded++;
            
            if (downloaded % 10 === 0) {
              logProgressService.info(`[NeoForge] Librerías descargadas: ${downloaded} (omitidas: ${skipped})`);
            }
          } else {
            failed++;
            logProgressService.warning(`[NeoForge] Error al descargar librería ${lib.name || 'unknown'}: HTTP ${response.status}`);
          }
        } catch (error) {
          failed++;
          logProgressService.warning(`[NeoForge] Error al procesar librería:`, error);
        }
      }

      logProgressService.info(`[NeoForge] Librerías descargadas: ${downloaded} nuevas, ${skipped} existentes, ${failed} fallidas`);
    } catch (error) {
      logProgressService.error(`[NeoForge] Error al descargar librerías:`, error);
      // No lanzar error, solo registrar
    }
  }

  /**
   * Verifica si una librería está permitida según sus reglas
   */
  private isLibraryAllowed(rules: any[]): boolean {
    if (!rules || !Array.isArray(rules)) {
      return true;
    }

    const os = process.platform;
    const osName = os === 'win32' ? 'windows' : os === 'darwin' ? 'osx' : 'linux';
    const arch = process.arch === 'x64' ? 'x86_64' : process.arch;

    for (const rule of rules) {
      if (rule.action === 'disallow') {
        if (!rule.os) {
          return false;
        }
        if (rule.os.name === osName || rule.os.arch === arch) {
          return false;
        }
      } else if (rule.action === 'allow') {
        if (!rule.os || rule.os.name === osName || rule.os.arch === arch) {
          return true;
        }
      }
    }

    return true;
  }

  /**
   * Valida que todos los archivos necesarios estén presentes
   */
  validateDownload(instancePath: string, loaderVersion: string): boolean {
    const clientJarPath = path.join(instancePath, 'client.jar');
    const versionJsonPath = path.join(instancePath, 'loader', 'version.json');
    
    if (!fs.existsSync(clientJarPath)) {
      logProgressService.warning(`[NeoForge] client.jar no encontrado`);
      return false;
    }

    if (!fs.existsSync(versionJsonPath)) {
      logProgressService.warning(`[NeoForge] version.json no encontrado`);
      return false;
    }

    return true;
  }
}

export const downloadNeoForge = new DownloadNeoForge();

