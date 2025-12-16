// src/services/descargas/neoforge/DownloadNeoForge.ts
// Lógica CORRECTA para instalar NeoForge usando el installer oficial
// Basado en: https://minecraft-launcher-lib.readthedocs.io/
// NeoForge moderno (1.20.5+ / 1.21+) requiere el installer.jar oficial

import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import fetch from 'node-fetch';
import { getLauncherDataPath } from '../../../utils/paths';
import { logProgressService } from '../../logProgressService';
import { javaDownloadService } from '../../javaDownloadService';

/**
 * Servicio para instalar NeoForge usando el installer oficial
 * 
 * IMPORTANTE: NeoForge moderno NO funciona descargando librerías manualmente.
 * Debe ejecutarse el installer.jar oficial con --installClient.
 * El installer genera el version.json y descarga todas las dependencias correctamente.
 * 
 * NO descarga vanilla antes - el installer lo hace internamente.
 * 
 * Similar a Forge pero usa maven.neoforged.net
 */
export class DownloadNeoForge {
  private launcherDir: string;

  constructor() {
    this.launcherDir = getLauncherDataPath();
  }

  /**
   * Descarga una instancia NeoForge completa
   * 
   * Este método solo ejecuta el installer.jar oficial de NeoForge.
   * 
   * CRÍTICO:
   * - NO descarga vanilla antes del installer
   * - NO instala client.jar en instancePath
   * - NO instala NADA en instancePath
   * 
   * El installer de NeoForge:
   * - Se ejecuta desde launcherDir (no desde instancePath)
   * - Descarga su propia versión base de Minecraft
   * - Genera version.json en launcherDir/versions/{mcVersion}-neoforge-{version}/
   * - Descarga librerías en launcherDir/libraries/
   * - Controla las versiones exactas de librerías vanilla
   * 
   * @param mcVersion Versión de Minecraft (ej. '1.21.11')
   * @param loaderVersion Versión de NeoForge (ej. '21.1.0')
   * @param instancePath NO SE USA. Solo se mantiene por compatibilidad con la interfaz común.
   *                     Todo se instala en launcherDir, no en instancePath.
   */
  async downloadInstance(
    mcVersion: string,
    loaderVersion: string | undefined,
    instancePath: string
  ): Promise<void> {
    if (!loaderVersion) {
      throw new Error('La versión de NeoForge es requerida');
    }

    logProgressService.info(`[NeoForge] Instalando NeoForge ${loaderVersion} para Minecraft ${mcVersion}...`);
    logProgressService.info(`[NeoForge] NOTA: El installer trabaja desde launcherDir, NO instala nada en instancePath`);
    
    // Instalar NeoForge usando el installer oficial
    // El installer se encarga de TODO: descarga base, genera version.json, descarga librerías
    // Todo se instala en launcherDir (versions/, libraries/, etc.), NO en instancePath
    await this.installNeoForgeLoader(mcVersion, loaderVersion);
    
    logProgressService.info(`[NeoForge] Instalación completada exitosamente`);
  }

  /**
   * Instala NeoForge usando el installer oficial
   * 
   * Este método:
   * 1. Descarga el installer.jar desde Maven (maven.neoforged.net)
   * 2. Lo ejecuta con --installClient
   * 3. Valida que se creó el version.json en versions/
   * 
   * NO toca librerías, NO descarga assets, NO construye classpath.
   * El installer de NeoForge hace TODO eso correctamente.
   * 
   * @param mcVersion Versión de Minecraft
   * @param loaderVersion Versión del loader
   */
  async installNeoForgeLoader(
    mcVersion: string,
    loaderVersion: string
  ): Promise<void> {
    const mavenBaseUrl = 'https://maven.neoforged.net';
    const groupId = 'net.neoforged';
    const artifactId = 'neoforge';
    
    // Normalizar loaderVersion: puede venir como "1.21.11-21.1.0" o solo "21.1.0"
    let normalizedLoaderVersion = loaderVersion;
    if (loaderVersion.includes('-')) {
      const parts = loaderVersion.split('-');
      if (parts.length > 1) {
        normalizedLoaderVersion = parts[parts.length - 1];
      }
    }
    
    // Validar formato de versión NeoForge (debe ser X.Y.Z)
    if (!/^\d+\.\d+\.\d+/.test(normalizedLoaderVersion)) {
      throw new Error(`Versión NeoForge inválida: ${loaderVersion} (normalizada: ${normalizedLoaderVersion})`);
    }
    
    // Construir nombre del installer
    // Formato: neoforge-<mcVersion>-<neoForgeVersion>-installer.jar
    // Ejemplo: neoforge-1.21.11-21.1.0-installer.jar
    const installerFileName = `${artifactId}-${mcVersion}-${normalizedLoaderVersion}-installer.jar`;
    const installerUrl = `${mavenBaseUrl}/releases/${groupId.replace(/\./g, '/')}/${artifactId}/${mcVersion}-${normalizedLoaderVersion}/${installerFileName}`;
    
    // Descargar installer
    const installersDir = path.join(this.launcherDir, 'installers');
    if (!fs.existsSync(installersDir)) {
      fs.mkdirSync(installersDir, { recursive: true });
    }
    
    const installerPath = path.join(installersDir, installerFileName);
    
    if (!fs.existsSync(installerPath)) {
      logProgressService.info(`[NeoForge] Descargando installer desde: ${installerUrl}`);
      
      const response = await fetch(installerUrl, {
        headers: { 'User-Agent': 'DRK-Launcher/1.0' }
      });
      
      if (!response.ok) {
        throw new Error(`No se pudo descargar installer de NeoForge: HTTP ${response.status}`);
      }
      
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(installerPath, buffer);
      
      logProgressService.info(`[NeoForge] Installer descargado: ${installerFileName}`);
    } else {
      logProgressService.info(`[NeoForge] Installer ya existe: ${installerFileName}`);
    }
    
    // Obtener Java 17+ para ejecutar el installer
    // NeoForge installer NO necesita el Java específico de la versión de Minecraft
    // Necesita Java 17+ (Java 21 es OK, Java 8/11 NO funcionan)
    let javaPath: string;
    try {
      // Intentar obtener Java 17 o superior
      // Para MC 1.21+ normalmente devuelve Java 21, que es perfecto
      const recommendedJava = javaDownloadService.getRecommendedJavaVersion(mcVersion);
      const javaVersion = parseInt(recommendedJava);
      
      if (javaVersion < 17) {
        // Si la versión recomendada es menor a 17, forzar Java 17
        logProgressService.info(`[NeoForge] Versión Java recomendada (${recommendedJava}) es menor a 17, usando Java 17`);
        javaPath = await javaDownloadService.downloadJava('17');
      } else {
        // Usar la versión recomendada (17 o superior)
        javaPath = await javaDownloadService.getJavaForMinecraftVersion(mcVersion);
      }
    } catch (error) {
      // Fallback: intentar descargar Java 17 directamente
      logProgressService.warning(`[NeoForge] Error al obtener Java recomendado, usando Java 17 como fallback`);
      javaPath = await javaDownloadService.downloadJava('17');
    }
    
    if (!javaPath) {
      throw new Error(`No se encontró Java 17+ para ejecutar el installer de NeoForge`);
    }
    
    // Crear launcher_profiles.json si no existe (NeoForge installer lo requiere)
    // NeoForge busca este archivo en el directorio donde se ejecuta
    this.ensureLauncherProfiles();
    
    // Ejecutar installer con --installClient
    logProgressService.info(`[NeoForge] Ejecutando installer...`);
    await this.runInstaller(javaPath, installerPath);
    
    // Validar que se creó el version.json
    const versionName = `${mcVersion}-neoforge-${normalizedLoaderVersion}`;
    const versionJsonPath = path.join(this.launcherDir, 'versions', versionName, `${versionName}.json`);
    
    if (!fs.existsSync(versionJsonPath)) {
      throw new Error(`El installer de NeoForge no generó el version.json esperado en: ${versionJsonPath}`);
    }
    
    // Validar que el version.json es válido
    try {
      const versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));
      if (!versionData.mainClass || !versionData.libraries) {
        throw new Error(`Version.json generado por NeoForge es inválido`);
      }
      logProgressService.info(`[NeoForge] Version.json generado correctamente: ${versionName}`);
    } catch (error) {
      throw new Error(`Error al validar version.json de NeoForge: ${error}`);
    }
  }

  /**
   * Crea launcher_profiles.json si no existe
   * 
   * NeoForge installer requiere este archivo para funcionar.
   * Solo necesita que exista, no que sea real (NeoForge no lo valida en detalle).
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
      
      logProgressService.info(`[NeoForge] launcher_profiles.json creado en: ${launcherProfilesPath}`);
    }
  }

  /**
   * Ejecuta el installer de NeoForge
   * 
   * CRÍTICO: El installer debe ejecutarse desde el root del launcher (launcherDir),
   * no desde la carpeta del installer. NeoForge busca launcher_profiles.json en el cwd.
   * 
   * @param javaPath Ruta al ejecutable de Java
   * @param installerJar Ruta al installer.jar
   */
  private runInstaller(javaPath: string, installerJar: string): Promise<void> {
    return new Promise((resolve, reject) => {
      logProgressService.info(`[NeoForge Installer] Ejecutando: ${javaPath} -jar ${installerJar} --installClient`);
      
      const proc = spawn(
        javaPath,
        ['-jar', installerJar, '--installClient'],
        {
          cwd: this.launcherDir, // CRÍTICO: NeoForge debe ejecutarse desde el root del launcher
          stdio: 'pipe'
        }
      );

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data: Buffer) => {
        const text = data.toString();
        stdout += text;
        logProgressService.info(`[NeoForge Installer] ${text.trim()}`);
      });

      proc.stderr.on('data', (data: Buffer) => {
        const text = data.toString();
        stderr += text;
        // Algunos installers escriben información en stderr, no es necesariamente un error
        logProgressService.info(`[NeoForge Installer] ${text.trim()}`);
      });

      proc.on('close', (code) => {
        if (code === 0) {
          logProgressService.info(`[NeoForge Installer] Instalación completada exitosamente`);
          resolve();
        } else {
          const errorMsg = `Installer de NeoForge falló con código ${code}\nSTDOUT: ${stdout}\nSTDERR: ${stderr}`;
          logProgressService.error(`[NeoForge Installer] ${errorMsg}`);
          reject(new Error(errorMsg));
        }
      });

      proc.on('error', (error: Error) => {
        const errorMsg = `Error al ejecutar installer de NeoForge: ${error.message}`;
        logProgressService.error(`[NeoForge Installer] ${errorMsg}`);
        reject(new Error(errorMsg));
      });
    });
  }
}

// Exportar solo la instancia (patrón singleton)
export const downloadNeoForge = new DownloadNeoForge();

