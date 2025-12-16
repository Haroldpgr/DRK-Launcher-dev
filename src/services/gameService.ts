// src/services/gameService.ts

import path from 'node:path';
import fs from 'node:fs';
import { getLauncherDataPath } from '../utils/paths';
import { instanceService, InstanceConfig } from './instanceService';
import { minecraftDownloadService } from './minecraftDownloadService';
import { logProgressService } from './logProgressService';

/**
 * Verifica si una instancia está lista para jugar
 * Wrapper que delega a instanceService
 */
export function isInstanceReady(instancePath: string): boolean {
  return instanceService.isInstanceReady(instancePath);
}

/**
 * Verifica si los assets necesarios para una versión están disponibles
 * IMPORTANTE: Esta verificación es tolerante porque Minecraft puede descargar
 * assets faltantes en tiempo de ejecución. Solo verifica que exista la estructura básica.
 */
export function areAssetsReadyForVersion(instancePath: string, mcVersion: string): boolean {
  try {
    const launcherDataPath = getLauncherDataPath();
    const assetsPath = path.join(launcherDataPath, 'assets');
    
    // Verificar que exista la carpeta de assets
    if (!fs.existsSync(assetsPath)) {
      console.log(`[ASSETS] Carpeta de assets no existe: ${assetsPath}`);
      return false;
    }

    // Verificar que exista la carpeta de índices
    const indexesPath = path.join(assetsPath, 'indexes');
    if (!fs.existsSync(indexesPath)) {
      console.log(`[ASSETS] Carpeta de índices no existe: ${indexesPath}`);
      // No es crítico, puede estar vacía y Minecraft descargará según necesite
      return true; // Permitir continuar
    }

    // Verificar que exista el índice para esta versión (opcional, puede descargarse en runtime)
    // Solo verificamos que la estructura esté, no que todos los assets estén descargados
    const indexFile = path.join(indexesPath, `${mcVersion}.json`);
    if (!fs.existsSync(indexFile)) {
      console.log(`[ASSETS] Índice de assets no encontrado para ${mcVersion}, pero puede descargarse en runtime`);
      // No es crítico, Minecraft puede descargar el índice si falta
      return true; // Permitir continuar
    }

    console.log(`[ASSETS] Estructura de assets verificada para ${mcVersion}`);
    return true;
  } catch (error) {
    console.error(`[ASSETS] Error al verificar assets: ${error}`);
    // En caso de error, permitir continuar (tolerancia)
    return true;
  }
}

/**
 * Función legacy/deprecated - No usar, usar gameLaunchService en su lugar
 */
export async function launchJava(...args: any[]): Promise<any> {
  console.warn('[DEPRECATED] launchJava está deprecated. Usar gameLaunchService en su lugar.');
  throw new Error('launchJava está deprecated. Usar gameLaunchService.launchGame() en su lugar.');
}

/**
 * NUEVA FUNCIÓN CRÍTICA: Asegura que todas las librerías JAR y los archivos nativos 
 * (DLLs/SOs) estén disponibles para la ejecución de Minecraft.
 */
export async function ensureDependenciesAreReady(instancePath: string, mcVersion: string, loader: string = 'vanilla'): Promise<boolean> {
    try {
        logProgressService.info(`[DEPENDENCIES] Asegurando librerías y nativos para ${mcVersion} (${loader})...`);

        // Usar skipClientJar=true para no re-descargar el cliente si es Forge/NeoForge
        const skipClientJar = loader === 'forge' || loader === 'neoforge';
        
        // Utiliza la lógica del servicio de descarga que ahora incluye la extracción de nativos
        await minecraftDownloadService.downloadCompleteVersion(mcVersion, instancePath, skipClientJar);

        logProgressService.info(`[DEPENDENCIES] Todas las librerías y nativos están listos.`);
        
        return true;
    } catch (error) {
        logProgressService.error(`[DEPENDENCIES] Error al asegurar dependencias:`, error);
        return false;
    }
}

/**
 * Asegura que el client.jar esté disponible para una instancia (Simplificada)
 */
export async function ensureClientJar(instancePath: string, mcVersion: string): Promise<boolean> {
    try {
        const config = instanceService.getInstanceConfig(instancePath);
        const loader = config?.loader || 'vanilla';

        if (loader === 'forge' || loader === 'neoforge') {
            logProgressService.info(`[CLIENT.JAR] Instancia ${loader} no requiere client.jar en la instancia, omitiendo verificación`);
            return true;
        }

        // Delegamos la descarga al servicio especializado
        await minecraftDownloadService.downloadClientJar(mcVersion, instancePath); 
        
        const clientJarPath = path.join(instancePath, 'client.jar');
        if (fs.existsSync(clientJarPath)) {
            const stats = fs.statSync(clientJarPath);
            logProgressService.info(`[CLIENT.JAR] client.jar listo: ${clientJarPath} (${stats.size} bytes)`);
            return true;
        }

        return false;
    } catch (error) {
        logProgressService.error(`[CLIENT.JAR] Error al asegurar client.jar:`, error);
        return false;
    }
}

// ... (launchJava - función legacy/deprecated) ...