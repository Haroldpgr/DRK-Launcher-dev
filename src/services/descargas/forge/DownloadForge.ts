// src/services/descargas/forge/DownloadForge.ts
// Lógica CORRECTA para instalar Forge usando el installer oficial
// Basado en: https://minecraft-launcher-lib.readthedocs.io/
// Forge moderno (1.20.5+ / 1.21+) requiere el installer.jar oficial

import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import fetch from 'node-fetch';
import { getLauncherDataPath } from '../../../utils/paths';
import { logProgressService } from '../../logProgressService';
import { javaDownloadService } from '../../javaDownloadService';

/**
 * Servicio para instalar Forge usando el installer oficial
 * 
 * IMPORTANTE: Forge moderno NO funciona descargando librerías manualmente.
 * Debe ejecutarse el installer.jar oficial con --installClient.
 * El installer genera el version.json y descarga todas las dependencias correctamente.
 * 
 * NO descarga vanilla antes - el installer lo hace internamente.
 */
export class DownloadForge {
  private launcherDir: string;

  constructor() {
    this.launcherDir = getLauncherDataPath();
  }

  /**
   * Descarga una instancia Forge completa
   * 
   * Este método solo ejecuta el installer.jar oficial de Forge.
   * 
   * CRÍTICO:
   * - NO descarga vanilla antes del installer
   * - NO instala client.jar en instancePath
   * - NO instala NADA en instancePath
   * 
   * El installer de Forge:
   * - Se ejecuta desde launcherDir (no desde instancePath)
   * - Descarga su propia versión base de Minecraft
   * - Genera version.json en launcherDir/versions/{mcVersion}-forge-{version}/
   * - Descarga librerías en launcherDir/libraries/
   * - Controla las versiones exactas de librerías vanilla
   * 
   * @param mcVersion Versión de Minecraft (ej. '1.21.11')
   * @param loaderVersion Versión de Forge (ej. '61.0.2')
   * @param instancePath NO SE USA. Solo se mantiene por compatibilidad con la interfaz común.
   *                     Todo se instala en launcherDir, no en instancePath.
   */
  async downloadInstance(
    mcVersion: string,
    loaderVersion: string | undefined,
    instancePath: string
  ): Promise<void> {
    if (!loaderVersion) {
      throw new Error('La versión de Forge es requerida');
    }

    logProgressService.info(`[Forge] Instalando Forge ${loaderVersion} para Minecraft ${mcVersion}...`);
    logProgressService.info(`[Forge] NOTA: El installer trabaja desde launcherDir, NO instala nada en instancePath`);
    
    // Instalar Forge usando el installer oficial
    // El installer se encarga de TODO: descarga base, genera version.json, descarga librerías
    // Todo se instala en launcherDir (versions/, libraries/, etc.), NO en instancePath
    await this.installForgeLoader(mcVersion, 'forge', loaderVersion);
    
    logProgressService.info(`[Forge] Instalación completada exitosamente`);
  }

  /**
   * Instala Forge usando el installer oficial
   * 
   * Este método:
   * 1. Descarga el installer.jar desde Maven
   * 2. Lo ejecuta con --installClient
   * 3. Valida que se creó el version.json en versions/
   * 
   * NO toca librerías, NO descarga assets, NO construye classpath.
   * El installer de Forge hace TODO eso correctamente.
   * 
   * @param mcVersion Versión de Minecraft
   * @param loaderType Tipo de loader ('forge' o 'neoforge')
   * @param loaderVersion Versión del loader
   */
  async installForgeLoader(
    mcVersion: string,
    loaderType: 'forge' | 'neoforge',
    loaderVersion: string
  ): Promise<void> {
    const mavenBaseUrl = loaderType === 'forge' 
      ? 'https://maven.minecraftforge.net'
      : 'https://maven.neoforged.net';
    
    const groupId = loaderType === 'forge' ? 'net.minecraftforge' : 'net.neoforged';
    const artifactId = loaderType === 'forge' ? 'forge' : 'neoforge';
    
    // Normalizar loaderVersion: puede venir como "1.21.11-61.0.2" o solo "61.0.2"
    let normalizedLoaderVersion = loaderVersion;
    let detectedMcVersion = mcVersion; // Por defecto usar mcVersion proporcionado
    
    if (loaderVersion.includes('-')) {
      const parts = loaderVersion.split('-');
      if (parts.length >= 2) {
        // Si tiene formato "MCVERSION-FORGEVERSION", extraer ambos
        // Ejemplo: "1.21.10-60.1.5" -> MC: "1.21.10", Forge: "60.1.5"
        const potentialMcVersion = parts.slice(0, -1).join('-'); // Todo excepto el último
        const forgeVersion = parts[parts.length - 1];
        
        // Verificar si la primera parte parece una versión de MC (X.Y o X.Y.Z)
        if (/^\d+\.\d+(\.\d+)?$/.test(potentialMcVersion)) {
          detectedMcVersion = potentialMcVersion;
          normalizedLoaderVersion = forgeVersion;
          
          // Advertir si hay inconsistencia
          if (detectedMcVersion !== mcVersion) {
            logProgressService.warning(`[${loaderType}] ADVERTENCIA: Inconsistencia de versiones detectada. MC solicitado: ${mcVersion}, pero loaderVersion indica MC ${detectedMcVersion}. Usando MC ${detectedMcVersion} del loaderVersion.`);
          }
        } else {
          // Si no parece una versión de MC, solo extraer la versión de Forge
          normalizedLoaderVersion = forgeVersion;
        }
      }
    }
    
    // Validar formato de versión Forge (debe ser X.Y.Z)
    if (!/^\d+\.\d+\.\d+/.test(normalizedLoaderVersion)) {
      throw new Error(`Versión Forge inválida: ${loaderVersion} (normalizada: ${normalizedLoaderVersion})`);
    }
    
    // Construir nombre del installer usando la versión de MC detectada
    // Formato: forge-<mcVersion>-<forgeVersion>-installer.jar
    // Ejemplo: forge-1.21.10-60.1.5-installer.jar
    const installerFileName = `${artifactId}-${detectedMcVersion}-${normalizedLoaderVersion}-installer.jar`;
    const installerUrl = `${mavenBaseUrl}/${groupId.replace(/\./g, '/')}/${artifactId}/${detectedMcVersion}-${normalizedLoaderVersion}/${installerFileName}`;
    
    // Descargar installer
    const installersDir = path.join(this.launcherDir, 'installers');
    if (!fs.existsSync(installersDir)) {
      fs.mkdirSync(installersDir, { recursive: true });
    }
    
    const installerPath = path.join(installersDir, installerFileName);
    
    if (!fs.existsSync(installerPath)) {
      logProgressService.info(`[${loaderType}] Descargando installer desde: ${installerUrl}`);
      
      const response = await fetch(installerUrl, {
        headers: { 'User-Agent': 'DRK-Launcher/1.0' }
      });
      
      if (!response.ok) {
        throw new Error(`No se pudo descargar installer de ${loaderType}: HTTP ${response.status}`);
      }
      
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(installerPath, buffer);
      
      logProgressService.info(`[${loaderType}] Installer descargado: ${installerFileName}`);
    } else {
      logProgressService.info(`[${loaderType}] Installer ya existe: ${installerFileName}`);
    }
    
    // Obtener Java 17+ para ejecutar el installer
    // Forge installer NO necesita el Java específico de la versión de Minecraft
    // Necesita Java 17+ (Java 21 es OK, Java 8/11 NO funcionan)
    let javaPath: string;
    try {
      // Intentar obtener Java 17 o superior
      // Para MC 1.21+ normalmente devuelve Java 21, que es perfecto
      // Usar la versión de MC detectada para obtener Java apropiado
      const recommendedJava = javaDownloadService.getRecommendedJavaVersion(detectedMcVersion);
      const javaVersion = parseInt(recommendedJava);
      
      if (javaVersion < 17) {
        // Si la versión recomendada es menor a 17, forzar Java 17
        logProgressService.info(`[${loaderType}] Versión Java recomendada (${recommendedJava}) es menor a 17, usando Java 17`);
        javaPath = await javaDownloadService.downloadJava('17');
      } else {
        // Usar la versión recomendada (17 o superior) usando la versión de MC detectada
        javaPath = await javaDownloadService.getJavaForMinecraftVersion(detectedMcVersion);
      }
    } catch (error) {
      // Fallback: intentar descargar Java 17 directamente
      logProgressService.warning(`[${loaderType}] Error al obtener Java recomendado, usando Java 17 como fallback`);
      javaPath = await javaDownloadService.downloadJava('17');
    }
    
    if (!javaPath) {
      throw new Error(`No se encontró Java 17+ para ejecutar el installer de ${loaderType}`);
    }
    
    // Crear launcher_profiles.json si no existe (Forge installer lo requiere)
    // Forge busca este archivo en el directorio donde se ejecuta
    this.ensureLauncherProfiles();
    
    // Ejecutar installer con --installClient usando la versión de MC detectada
    logProgressService.info(`[${loaderType}] Ejecutando installer para MC ${detectedMcVersion}...`);
    await this.runInstaller(javaPath, installerPath);
    
    // Validar que se creó el version.json usando la versión de MC detectada
    const versionName = `${detectedMcVersion}-${loaderType}-${normalizedLoaderVersion}`;
    const versionJsonPath = path.join(this.launcherDir, 'versions', versionName, `${versionName}.json`);
    
    if (!fs.existsSync(versionJsonPath)) {
      throw new Error(`El installer de ${loaderType} no generó el version.json esperado en: ${versionJsonPath}`);
    }
    
    // Validar que el version.json es válido
    try {
      const versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));
      if (!versionData.mainClass || !versionData.libraries) {
        throw new Error(`Version.json generado por ${loaderType} es inválido`);
      }
      logProgressService.info(`[${loaderType}] Version.json generado correctamente: ${versionName}`);
    } catch (error) {
      throw new Error(`Error al validar version.json de ${loaderType}: ${error}`);
    }
  }

  /**
   * Crea launcher_profiles.json si no existe
   * 
   * Forge installer requiere este archivo para funcionar.
   * Solo necesita que exista, no que sea real (Forge no lo valida en detalle).
   */
  private ensureLauncherProfiles(): void {
    const launcherProfilesPath = path.join(this.launcherDir, 'launcher_profiles.json');
    
    if (!fs.existsSync(launcherProfilesPath)) {
      const launcherProfiles = {
        profiles: {},
        clientToken: 'drk-launcher',
        launcherVersion: {
          name: 'DRK Launcher',
          format: 21
        }
      };
      
      fs.writeFileSync(
        launcherProfilesPath,
        JSON.stringify(launcherProfiles, null, 2)
      );
      
      logProgressService.info(`[Forge] launcher_profiles.json creado en: ${launcherProfilesPath}`);
    }
  }

  /**
   * Ejecuta el installer de Forge/NeoForge
   * 
   * CRÍTICO: El installer debe ejecutarse desde el root del launcher (launcherDir),
   * no desde la carpeta del installer. Forge busca launcher_profiles.json en el cwd.
   * 
   * @param javaPath Ruta al ejecutable de Java
   * @param installerJar Ruta al installer.jar
   */
  private runInstaller(javaPath: string, installerJar: string): Promise<void> {
    return new Promise((resolve, reject) => {
      logProgressService.info(`[Forge Installer] Ejecutando: ${javaPath} -jar ${installerJar} --installClient`);
      
      const proc = spawn(
        javaPath,
        ['-jar', installerJar, '--installClient'],
        {
          cwd: this.launcherDir, // CRÍTICO: Forge debe ejecutarse desde el root del launcher
          stdio: 'pipe'
        }
      );

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data: Buffer) => {
        const text = data.toString();
        stdout += text;
        logProgressService.info(`[Forge Installer] ${text.trim()}`);
      });

      proc.stderr.on('data', (data: Buffer) => {
        const text = data.toString();
        stderr += text;
        // Algunos installers escriben información en stderr, no es necesariamente un error
        logProgressService.info(`[Forge Installer] ${text.trim()}`);
      });

      proc.on('close', (code) => {
        if (code === 0) {
          logProgressService.info(`[Forge Installer] Instalación completada exitosamente`);
          resolve();
        } else {
          const errorMsg = `Installer de Forge falló con código ${code}\nSTDOUT: ${stdout}\nSTDERR: ${stderr}`;
          logProgressService.error(`[Forge Installer] ${errorMsg}`);
          reject(new Error(errorMsg));
        }
      });

      proc.on('error', (error: Error) => {
        const errorMsg = `Error al ejecutar installer de Forge: ${error.message}`;
        logProgressService.error(`[Forge Installer] ${errorMsg}`);
        reject(new Error(errorMsg));
      });
    });
  }
}

// Exportar solo la instancia (patrón singleton)
export const downloadForge = new DownloadForge();

