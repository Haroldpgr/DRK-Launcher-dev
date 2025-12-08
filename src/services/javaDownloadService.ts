import path from 'node:path';
import fs from 'node:fs';
import { pipeline } from 'node:stream';
import { promisify } from 'node:util';
import fetch from 'node-fetch';
import { getLauncherDataPath } from '../utils/paths';
import { downloadQueueService } from './downloadQueueService';

const pipelineAsync = promisify(pipeline);

/**
 * Información sobre una instalación de Java
 */
export interface JavaInstallation {
  id: string;
  version: string;
  path: string;
  executable: string;
  vendor?: string;
  architecture?: string;
  os?: string;
  isWorking?: boolean;
}

/**
 * Mapeo de versión de Minecraft a versión mínima de Java recomendada
 */
const MINECRAFT_JAVA_REQUIREMENTS: { [key: string]: string } = {
  '1.20': '17',
  '1.19': '17',
  '1.18': '17',
  '1.17': '17',
  '1.16': '8',
  '1.15': '8',
  '1.14': '8',
  '1.13': '8',
  // Versiones anteriores también pueden usar Java 8
};

/**
 * Servicio para manejar la descarga e instalación de Java Runtime Environment (JRE)
 * Utiliza Adoptium como fuente principal de Java
 */
export class JavaDownloadService {
  private runtimePath: string;
  private javaInstallations: Map<string, JavaInstallation> = new Map();

  constructor() {
    this.runtimePath = path.join(getLauncherDataPath(), 'runtime');
    this.ensureDir(this.runtimePath);
    this.loadJavaInstallations();
  }

  /**
   * Asegura que un directorio exista, creándolo si es necesario
   * @param dir Directorio a asegurar
   */
  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Detecta el sistema operativo y arquitectura
   */
  private getSystemInfo(): { os: string; arch: string } {
    const platform = process.platform;
    const arch = process.arch;

    let os: string;
    switch (platform) {
      case 'win32': os = 'windows'; break;
      case 'darwin': os = 'mac'; break;
      case 'linux': os = 'linux'; break;
      default: os = 'linux'; // Por defecto
    }

    let javaArch: string;
    switch (arch) {
      case 'x64': javaArch = 'x64'; break;
      case 'arm64': javaArch = 'aarch64'; break;
      case 'ia32': javaArch = 'x32'; break;
      default: javaArch = 'x64'; // Por defecto
    }

    return { os, arch: javaArch };
  }

  /**
   * Obtiene la versión de Java recomendada para una versión específica de Minecraft
   */
  getRecommendedJavaVersion(mcVersion: string): string {
    // Obtener el número principal de la versión (por ejemplo, '1.19.2' -> '1.19')
    const mainVersion = mcVersion.split('.').slice(0, 2).join('.');
    
    // Buscar la versión de Java necesaria
    for (const [mc, java] of Object.entries(MINECRAFT_JAVA_REQUIREMENTS)) {
      if (mainVersion.startsWith(mc)) {
        return java;
      }
    }
    
    // Por defecto, usar Java 17 para versiones más recientes
    return '17';
  }

  /**
   * Verifica si una instalación de Java ya existe y es funcional
   */
  private async isJavaWorking(javaPath: string): Promise<boolean> {
    try {
      const { spawn } = await import('node:child_process');
      
      return new Promise<boolean>((resolve) => {
        const process = spawn(javaPath, ['-version']);
        let output = '';
        let errorOutput = '';

        process.stdout.on('data', (data) => {
          output += data.toString();
        });

        process.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        process.on('close', (code) => {
          // Java -version normalmente devuelve código 0 o 1, no necesariamente 0
          // Lo importante es que se ejecute sin problemas
          const isWorking = code !== null && errorOutput.toLowerCase().includes('version');
          resolve(isWorking);
        });

        // Timeout después de 10 segundos
        setTimeout(() => {
          process.kill();
          resolve(false);
        }, 10000);
      });
    } catch (error) {
      console.error(`Error al verificar si Java funciona en ${javaPath}:`, error);
      return false;
    }
  }

  /**
   * Busca instalaciones de Java existentes en el sistema
   */
  async scanForJavaInstallations(): Promise<JavaInstallation[]> {
    const installations: JavaInstallation[] = [];

    // En Windows, buscar en lugares comunes
    if (process.platform === 'win32') {
      const commonPaths = [
        'C:/Program Files/Java/',
        'C:/Program Files/Eclipse Adoptium/',
        'C:/Program Files/Amazon Corretto/',
        'C:/Program Files/Red Hat/',
        'C:/Program Files/AdoptOpenJDK/',
        process.env.JAVA_HOME || '',
        process.env.JRE_HOME || ''
      ].filter(path => path !== '');

      for (const basePath of commonPaths) {
        if (fs.existsSync(basePath)) {
          const folders = fs.readdirSync(basePath);
          for (const folder of folders) {
            const javaPath = path.join(basePath, folder);
            const exePath = path.join(javaPath, 'bin', 'java.exe');
            if (fs.existsSync(exePath)) {
              try {
                const isWorking = await this.isJavaWorking(exePath);
                const version = await this.getJavaVersion(exePath);
                installations.push({
                  id: `system-${folder}`,
                  version: version || folder,
                  path: javaPath,
                  executable: exePath,
                  isWorking
                });
              } catch (error) {
                console.error(`Error al verificar Java en ${exePath}:`, error);
              }
            }
          }
        }
      }
    }

    // Buscar instalaciones descargadas en el directorio runtime
    const runtimeFolders = fs.readdirSync(this.runtimePath);
    for (const folder of runtimeFolders) {
      const javaPath = path.join(this.runtimePath, folder);
      const isWindows = process.platform === 'win32';
      const exePath = path.join(javaPath, 'bin', isWindows ? 'java.exe' : 'java');

      if (fs.existsSync(exePath)) {
        try {
          const isWorking = await this.isJavaWorking(exePath);
          // Extraer la versión de Java del nombre de la carpeta o comprobando la instalación
          const version = folder.replace('java', '').replace(/[^0-9.]/g, '') || 'unknown';
          installations.push({
            id: `downloaded-${folder}`,
            version: version,
            path: javaPath,
            executable: exePath,
            isWorking,
            vendor: 'Adoptium' // Porque lo descargamos de Adoptium
          });
        } catch (error) {
          console.error(`Error al verificar Java descargado en ${exePath}:`, error);
        }
      }
    }

    return installations;
  }

  /**
   * Obtiene la versión de Java desde su ejecutable
   */
  private async getJavaVersion(javaPath: string): Promise<string | null> {
    try {
      const { spawn } = await import('node:child_process');
      
      return new Promise<string | null>((resolve) => {
        const process = spawn(javaPath, ['-version']);
        let errorOutput = '';

        process.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        process.on('close', (code) => {
          // La salida de versión de Java va por stderr
          const match = errorOutput.match(/version "([^"]+)"/);
          if (match && match[1]) {
            resolve(match[1]);
          } else {
            resolve(null);
          }
        });

        // Timeout después de 10 segundos
        setTimeout(() => {
          process.kill();
          resolve(null);
        }, 10000);
      });
    } catch (error) {
      console.error(`Error al obtener versión de Java desde ${javaPath}:`, error);
      return null;
    }
  }

  /**
   * Carga las instalaciones de Java guardadas
   */
  private loadJavaInstallations(): void {
    try {
      // Buscar instalaciones en el directorio runtime
      if (fs.existsSync(this.runtimePath)) {
        const folders = fs.readdirSync(this.runtimePath);
        for (const folder of folders) {
          // Usar la función que busca el ejecutable en múltiples ubicaciones
          const version = folder.replace('java', '').replace(/[^0-9.]/g, '');
          if (version) { // Asegurar que es una carpeta de Java
            const exePath = this.getJavaExecutable(version);
            if (exePath) {
              const javaPath = path.dirname(path.dirname(exePath)); // Obtener directorio base de Java
              const installation: JavaInstallation = {
                id: folder,
                version: version,
                path: javaPath,
                executable: exePath
              };
              this.javaInstallations.set(folder, installation);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error al cargar instalaciones de Java:', error);
    }
  }

  /**
   * Verifica si una versión específica de Java ya está instalada
   */
  private isJavaInstalled(javaVersion: string): boolean {
    // Usar la función getJavaExecutable que busca en múltiples ubicaciones
    return this.getJavaExecutable(javaVersion) !== null;
  }

  /**
   * Obtiene la ruta de ejecución de una versión específica de Java
   */
  getJavaExecutable(javaVersion: string): string | null {
    const javaDir = path.join(this.runtimePath, `java${javaVersion}`);

    console.log(`Buscando Java ejecutable para versión ${javaVersion} en: ${javaDir}`);

    const isWindows = process.platform === 'win32';
    const javaExecutableName = isWindows ? 'java.exe' : 'java';

    // Definir posibles ubicaciones donde podría estar el ejecutable
    const possibleLocations = [
      // Ubicación estándar después de reorganización
      path.join(javaDir, 'bin', javaExecutableName),
      // Posible ubicación si la reorganización no funcionó completamente
      path.join(javaDir, 'bin'),  // Directorio bin en raíz
      // Posibles ubicaciones en subdirectorios comunes
      path.join(javaDir, 'jdk-17.0.17+10', 'bin', javaExecutableName),
      path.join(javaDir, 'jdk-17.0.17+10', 'bin'),
      path.join(javaDir, 'jdk-17.*', 'bin', javaExecutableName), // Patrón general
      path.join(javaDir, 'openjdk-17*', 'bin', javaExecutableName),
      path.join(javaDir, 'temurin-17*', 'bin', javaExecutableName),
    ];

    // Verificar cada ubicación estándar
    for (const location of possibleLocations) {
      if (location.includes('*')) {
        // Este es un patrón con comodines, no lo verificamos directamente
        continue;
      }

      console.log(`Verificando ubicación: ${location}`);
      if (fs.existsSync(location)) {
        if (fs.statSync(location).isFile()) {
          // Es un archivo, verificar si es el ejecutable correcto
          if (location.endsWith(javaExecutableName)) {
            console.log(`Java encontrado en ubicación específica: ${location}`);
            return location;
          }
        } else if (fs.statSync(location).isDirectory()) {
          // Es un directorio, buscar el ejecutable dentro
          const exeInDir = path.join(location, javaExecutableName);
          if (fs.existsSync(exeInDir)) {
            console.log(`Java encontrado en directorio: ${exeInDir}`);
            return exeInDir;
          }
        }
      }
    }

    // Si no se encuentra en ubicaciones estándar, hacer búsqueda recursiva
    try {
      if (fs.existsSync(javaDir)) {
        const result = this.findJavaExecutableRecursive(javaDir, javaExecutableName);
        if (result) {
          console.log(`Java encontrado en búsqueda recursiva: ${result}`);
          return result;
        }
      }
    } catch (error) {
      console.error('Error en la búsqueda recursiva de Java:', error);
    }

    console.log(`No se encontró Java ejecutable para la versión ${javaVersion}`);
    return null;
  }

  /**
   * Método auxiliar para buscar el ejecutable de Java recursivamente
   */
  private findJavaExecutableRecursive(dirPath: string, executableName: string, depth: number = 0): string | null {
    // Límite de profundidad para evitar búsquedas infinitas
    if (depth > 3) {
      return null;
    }

    try {
      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = fs.statSync(itemPath);

        if (stat.isFile() && item === executableName) {
          // Encontramos el ejecutable
          return itemPath;
        } else if (stat.isDirectory()) {
          // Buscar recursivamente en subdirectorios
          const result = this.findJavaExecutableRecursive(itemPath, executableName, depth + 1);
          if (result) {
            return result;
          }
        }
      }
    } catch (error) {
      console.error(`Error al buscar recursivamente en ${dirPath}:`, error);
    }

    return null;
  }

  /**
   * Descarga e instala una versión específica de Java desde Adoptium
   * @param javaVersion Versión de Java (por ejemplo, '17', '11', '8')
   * @returns Ruta al ejecutable java
   */
  async downloadJava(javaVersion: string = '17'): Promise<string> {
    const { os, arch } = this.getSystemInfo();
    
    // Verificar si Java ya está instalado
    if (this.isJavaInstalled(javaVersion)) {
      const javaExe = this.getJavaExecutable(javaVersion);
      if (javaExe) {
        console.log(`Java ${javaVersion} ya está instalado en ${path.dirname(javaExe)}`);
        return javaExe;
      }
    }

    const javaDir = path.join(this.runtimePath, `java${javaVersion}`);

    // Limpiar directorio existente para evitar conflictos
    if (fs.existsSync(javaDir)) {
      console.log(`Limpiando directorio existente de Java ${javaVersion}...`);
      fs.rmSync(javaDir, { recursive: true, force: true });
    }
    this.ensureDir(javaDir);

    console.log(`Descargando Java ${javaVersion} para ${os}-${arch} desde Adoptium...`);

    // URL de la API de Adoptium para obtener información de la versión
    const apiURL = `https://api.adoptium.net/v3/assets/latest/${javaVersion}/hotspot?os=${os}&architecture=${arch}&image_type=jdk&vendor=eclipse`;

    try {
      const response = await fetch(apiURL, {
        headers: {
          'User-Agent': 'DRK-Launcher/1.0 (compatible; Fetch)'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error al obtener información de Java ${javaVersion} desde Adoptium: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data || data.length === 0) {
        throw new Error(`No se encontró Java ${javaVersion} disponible para ${os}-${arch} en Adoptium`);
      }

      const binary = data[0];
      const downloadUrl = binary.binary.package.link;
      const expectedChecksum = binary.binary.package.checksum;
      const fileName = path.basename(downloadUrl);

      console.log(`Iniciando descarga de Java ${javaVersion} desde: ${downloadUrl}`);

      // Descargar archivo usando el servicio de cola
      const tempZipPath = path.join(this.runtimePath, fileName);
      const downloadId = await downloadQueueService.addDownload(
        downloadUrl, 
        tempZipPath, 
        expectedChecksum, 
        'sha256' // Adoptium proporciona checksums SHA-256
      );

      // Esperar a que la descarga se complete
      await this.waitForDownload(downloadId);

      const downloadInfo = downloadQueueService.getDownloadStatus(downloadId);
      if (!downloadInfo || downloadInfo.status !== 'completed') {
        throw new Error(`La descarga de Java ${javaVersion} falló: ${downloadInfo?.error || 'Error desconocido'}`);
      }

      // Extraer archivo ZIP
      console.log(`Extrayendo Java ${javaVersion}...`);
      await this.extractJavaArchive(tempZipPath, javaDir);

      // Eliminar archivo temporal
      if (fs.existsSync(tempZipPath)) {
        fs.unlinkSync(tempZipPath);
      }

      // Verificar que la instalación sea funcional
      const javaExe = this.getJavaExecutable(javaVersion);
      if (!javaExe) {
        // Si no se encuentra, listar el contenido del directorio para depuración
        try {
          const dirContents = fs.readdirSync(javaDir, { withFileTypes: true });
          console.log(`Contenido del directorio de Java (${javaDir}):`, dirContents.map(item =>
            item.isDirectory() ? `[DIR] ${item.name}` : item.name
          ));

          // Listar también subdirectorios en busca de bin/java.exe
          for (const item of dirContents) {
            if (item.isDirectory()) {
              const subDirPath = path.join(javaDir, item.name);
              try {
                const subDirContents = fs.readdirSync(subDirPath, { withFileTypes: true });
                console.log(`Contenido del subdirectorio ${subDirPath}:`, subDirContents.map(subItem =>
                  subItem.isDirectory() ? `[DIR] ${subItem.name}` : subItem.name
                ));

                // Verificar si tiene una carpeta bin
                if (subDirContents.some(subItem => subItem.name === 'bin' && subItem.isDirectory())) {
                  const binPath = path.join(subDirPath, 'bin');
                  const binContents = fs.readdirSync(binPath);
                  console.log(`Contenido de bin en ${binPath}:`, binContents);
                }
              } catch (subDirError) {
                console.error(`Error al leer subdirectorio ${item.name}:`, subDirError);
              }
            }
          }
        } catch (dirError) {
          console.error('Error al leer directorio de Java:', dirError);
        }

        throw new Error(`No se encontró el ejecutable de Java después de la instalación en ${javaDir}`);
      }

      const isWorking = await this.isJavaWorking(javaExe);
      if (!isWorking) {
        throw new Error(`La instalación de Java ${javaVersion} no es funcional: no se pudo ejecutar java -version`);
      }

      console.log(`Java ${javaVersion} instalado y verificado correctamente en ${javaDir} (ejecutable: ${javaExe})`);
      
      // Registrar la instalación
      const installation: JavaInstallation = {
        id: `java${javaVersion}`,
        version: javaVersion,
        path: javaDir,
        executable: javaExe,
        vendor: 'Adoptium',
        architecture: arch,
        os: os,
        isWorking: true
      };
      this.javaInstallations.set(`java${javaVersion}`, installation);

      return javaExe;
    } catch (error) {
      console.error(`Error al descargar o instalar Java ${javaVersion}:`, error);
      throw error;
    }
  }

  /**
   * Espera a que una descarga se complete
   */
  private async waitForDownload(downloadId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkStatus = () => {
        const status = downloadQueueService.getDownloadStatus(downloadId);
        if (!status) {
          reject(new Error(`Download ${downloadId} not found`));
          return;
        }

        if (status.status === 'completed') {
          resolve();
        } else if (status.status === 'error' || status.status === 'cancelled') {
          reject(new Error(status.error || 'Download failed or cancelled'));
        } else {
          // Continuar verificando cada 500ms
          setTimeout(checkStatus, 500);
        }
      };

      checkStatus();
    });
  }

  /**
   * Extrae el archivo ZIP de Java en la carpeta de destino
   */
  private async extractJavaArchive(archivePath: string, extractTo: string): Promise<void> {
    // Usar node-stream-zip para extraer el archivo
    const nodeStreamZip = require('node-stream-zip');
    if (!nodeStreamZip) {
      throw new Error('node-stream-zip no está disponible');
    }

    return new Promise((resolve, reject) => {
      try {
        const zip = new nodeStreamZip({
          file: archivePath,
          storeEntries: true
        });

        zip.on('ready', () => {
          try {
            // Extraer todo el contenido
            zip.extract(null, extractTo, (err: Error | null) => {
              zip.close();
              if (err) {
                reject(err);
                return;
              }

              // Despues de la extracción, verificar si los archivos se extrajeron en una subcarpeta
              // y moverlos a la ubicación correcta si es necesario
              this.reorganizeJavaStructure(extractTo);
              resolve();
            });
          } catch (error) {
            zip.close();
            reject(error);
          }
        });

        zip.on('error', (err: Error) => {
          reject(err);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Reorganiza la estructura de directorios de Java después de la extracción
   * Maneja el caso donde los archivos se extraen en una subcarpeta con el nombre del JDK
   */
  private reorganizeJavaStructure(extractTo: string): void {
    try {
      const items = fs.readdirSync(extractTo);
      let javaDirFound = false;

      // Buscar directorios que contengan la estructura típica de Java (carpeta bin con java.exe/java)
      for (const item of items) {
        const itemPath = path.join(extractTo, item);
        const isDir = fs.statSync(itemPath).isDirectory();

        if (isDir) {
          // Verificar si este directorio tiene la estructura típica de Java
          const binPath = path.join(itemPath, 'bin');
          const javaExePath = path.join(binPath, process.platform === 'win32' ? 'java.exe' : 'java');

          if (fs.existsSync(binPath) && fs.existsSync(javaExePath)) {
            console.log(`Estructura de Java encontrada en subdirectorio: ${itemPath}`);

            // Este es el directorio correcto, pero está anidado
            // Mover todos los contenidos de este directorio a la raíz
            const nestedItems = fs.readdirSync(itemPath);
            for (const nestedItem of nestedItems) {
              const sourcePath = path.join(itemPath, nestedItem);
              const destPath = path.join(extractTo, nestedItem);

              // Si el destino ya existe, eliminarlo primero
              if (fs.existsSync(destPath)) {
                const destStat = fs.statSync(destPath);
                if (destStat.isDirectory()) {
                  fs.rmSync(destPath, { recursive: true, force: true });
                } else {
                  fs.unlinkSync(destPath);
                }
              }

              fs.renameSync(sourcePath, destPath);
            }

            // Eliminar el directorio vacío
            fs.rmdirSync(itemPath);

            console.log(`Reorganizada estructura de Java: contenido movido desde subdirectorio ${item} a raíz`);
            javaDirFound = true;
            break; // Solo mover una estructura, asumir que es la correcta
          }
        }
      }

      if (!javaDirFound) {
        console.log(`No se encontró estructura de Java típica en: ${extractTo}`);
        // Listar contenido para depuración
        console.log(`Contenido de ${extractTo}:`, items);
      }
    } catch (error) {
      console.error(`Error al reorganizar la estructura de Java en ${extractTo}:`, error);
    }
  }

  /**
   * Obtiene todas las instalaciones de Java disponibles
   */
  getAllJavaInstallations(): JavaInstallation[] {
    return Array.from(this.javaInstallations.values());
  }

  /**
   * Obtiene la instalación de Java específica por ID
   */
  getJavaInstallation(javaId: string): JavaInstallation | undefined {
    return this.javaInstallations.get(javaId);
  }

  /**
   * Quita una instalación de Java
   */
  async removeJavaInstallation(javaId: string): Promise<boolean> {
    const installation = this.javaInstallations.get(javaId);
    if (!installation) {
      return false;
    }

    try {
      // Eliminar directorio de la instalación
      fs.rmSync(installation.path, { recursive: true, force: true });
      this.javaInstallations.delete(javaId);
      return true;
    } catch (error) {
      console.error(`Error al eliminar la instalación de Java ${javaId}:`, error);
      return false;
    }
  }

  /**
   * Obtiene o descarga la versión de Java recomendada para una versión de Minecraft
   */
  async getJavaForMinecraftVersion(mcVersion: string): Promise<string> {
    const recommendedVersion = this.getRecommendedJavaVersion(mcVersion);
    console.log(`Versión de Java recomendada para Minecraft ${mcVersion}: ${recommendedVersion}`);
    
    // Verificar si la versión recomendada ya está instalada
    if (this.isJavaInstalled(recommendedVersion)) {
      const javaExe = this.getJavaExecutable(recommendedVersion);
      if (javaExe) {
        console.log(`Java ${recommendedVersion} ya está instalado, usando: ${javaExe}`);
        return javaExe;
      }
    }

    // Si no está instalada, descargarla
    console.log(`Java ${recommendedVersion} no está instalada, descargando...`);
    return await this.downloadJava(recommendedVersion);
  }
}

export const javaDownloadService = new JavaDownloadService();