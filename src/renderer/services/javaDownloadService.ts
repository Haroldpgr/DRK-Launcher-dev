// src/renderer/services/javaDownloadService.ts
import { downloadService } from './downloadService';
import { settingsService } from './settingsService';
import { JavaInfo } from '../components/JavaSettings';

export class JavaDownloadService {
  private static readonly API_BASE_URL = 'https://api.adoptium.net/v3';

  /**
   * Obtiene la URL de descarga para una versión específica de Java
   * @param version - La versión de Java (8, 11, 17, 21)
   * @returns La URL de descarga para la versión de Java solicitada
   */
  async getJavaDownloadUrl(version: string, os?: string, arch?: string): Promise<string> {
    // Detectar sistema operativo y arquitectura si no se proporcionan
    const detectedOS = os || this.detectOS();
    const detectedArch = arch || this.detectArchitecture();
    
    // Construir la URL de la API
    const apiUrl = `${JavaDownloadService.API_BASE_URL}/binary/latest/${version}/ga/jdk/temurin/${detectedOS}/${detectedArch}/normal/hotspot/jdk`;
    
    try {
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'DRK-Launcher/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error al obtener la URL de descarga: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // La respuesta contiene un enlace de descarga
      if (data.binary && data.binary.package && data.binary.package.link) {
        return data.binary.package.link;
      } else if (data.uri) {
        return data.uri;
      } else {
        throw new Error('No se encontró una URL de descarga válida en la respuesta de la API');
      }
    } catch (error) {
      console.error(`Error obteniendo URL de descarga para Java ${version}:`, error);
      throw error;
    }
  }

  /**
   * Inicia la descarga de una versión específica de Java
   * @param version - La versión de Java a descargar (8, 11, 17, 21)
   */
  async installJava(version: string, os?: string, arch?: string): Promise<void> {
    try {
      // Obtener la URL de descarga
      const downloadUrl = await this.getJavaDownloadUrl(version, os, arch);
      
      // Crear un nombre descriptivo para la descarga
      const osName = os || this.detectOS();
      const archName = arch || this.detectArchitecture();
      const fileName = `java-${version}-temurin-${osName}-${archName}.zip`;
      
      // Iniciar la descarga usando el servicio de descargas
      const download = downloadService.createDownload(downloadUrl, `Java ${version} (${osName}/${archName})`);
      await downloadService.startDownload(download.id);
      
      // Aquí normalmente tendríamos lógica para descomprimir e instalar Java
      // en el directorio apropiado después de la descarga
      
      console.log(`Java ${version} comenzó a descargarse. ID: ${download.id}`);
    } catch (error) {
      console.error(`Error al iniciar la descarga de Java ${version}:`, error);
      throw error;
    }
  }

  /**
   * Detecta el sistema operativo del usuario
   */
  private detectOS(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('win')) {
      return 'windows';
    } else if (userAgent.includes('mac')) {
      return 'mac';
    } else if (userAgent.includes('linux')) {
      return 'linux';
    }
    
    // Por defecto, asumir Windows
    return 'windows';
  }

  /**
   * Detecta la arquitectura del sistema
   */
  private detectArchitecture(): string {
    // Para simplificar, devolvemos x64 por defecto
    // En una implementación real, esto dependería de la plataforma
    return 'x64';
  }

  /**
   * Valida si una versión de Java es compatible con Minecraft
   */
  getCompatibilityInfo(version: string): { recommended: boolean; note?: string } {
    const versionNum = parseInt(version, 10);
    
    if (versionNum < 8) {
      return { recommended: false, note: 'Versión mínima requerida: Java 8' };
    } else if (versionNum === 8) {
      return { 
        recommended: true, 
        note: 'Compatible con Minecraft 1.16.5 y anteriores' 
      };
    } else if (versionNum === 17) {
      return { 
        recommended: true, 
        note: 'Requerido para Minecraft 1.17+' 
      };
    } else if (versionNum === 21) {
      return { 
        recommended: true, 
        note: 'Compatible con las últimas versiones de Minecraft y mod loaders' 
      };
    } else {
      return { 
        recommended: false, 
        note: 'Versión recomendada: Java 8, 17 o 21' 
      };
    }
  }
}

export const javaDownloadService = new JavaDownloadService();