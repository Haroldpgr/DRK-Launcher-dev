var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { d as downloadService } from "./downloadService-Cok5Tzv5.js";
import "./index-DVYB48ru.js";
const _JavaDownloadService = class _JavaDownloadService {
  /**
   * Obtiene la URL de descarga para una versión específica de Java
   * @param version - La versión de Java (8, 11, 17, 21)
   * @returns La URL de descarga para la versión de Java solicitada
   */
  async getJavaDownloadUrl(version, os, arch) {
    const detectedOS = os || this.detectOS();
    const detectedArch = arch || this.detectArchitecture();
    const apiUrl = `${_JavaDownloadService.API_BASE_URL}/installer/latest/${version}/ga/${detectedOS}/${detectedArch}/jdk/hotspot/normal/eclipse`;
    return apiUrl;
  }
  /**
   * Inicia la descarga de una versión específica de Java
   * @param version - La versión de Java a descargar (8, 11, 17, 21)
   */
  async installJava(version, os, arch) {
    try {
      const downloadUrl = await this.getJavaDownloadUrl(version, os, arch);
      const osName = os || this.detectOS();
      const archName = arch || this.detectArchitecture();
      const download = downloadService.createDownload(downloadUrl, `Java ${version} (${osName}/${archName})`);
      await downloadService.startDownload(download.id);
      console.log(`Java ${version} comenzó a descargarse. ID: ${download.id}`);
    } catch (error) {
      console.error(`Error al iniciar la descarga de Java ${version}:`, error);
      throw error;
    }
  }
  /**
   * Detecta el sistema operativo del usuario
   */
  detectOS() {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes("win")) {
      return "windows";
    } else if (userAgent.includes("mac")) {
      return "mac";
    } else if (userAgent.includes("linux")) {
      return "linux";
    }
    return "windows";
  }
  /**
   * Detecta la arquitectura del sistema
   */
  detectArchitecture() {
    return "x64";
  }
  /**
   * Valida si una versión de Java es compatible con Minecraft
   */
  getCompatibilityInfo(version) {
    const versionNum = parseInt(version, 10);
    if (versionNum < 8) {
      return { recommended: false, note: "Versión mínima requerida: Java 8" };
    } else if (versionNum === 8) {
      return {
        recommended: true,
        note: "Compatible con Minecraft 1.16.5 y anteriores"
      };
    } else if (versionNum === 17) {
      return {
        recommended: true,
        note: "Requerido para Minecraft 1.17+"
      };
    } else if (versionNum === 21) {
      return {
        recommended: true,
        note: "Compatible con las últimas versiones de Minecraft y mod loaders"
      };
    } else {
      return {
        recommended: false,
        note: "Versión recomendada: Java 8, 17 o 21"
      };
    }
  }
};
__publicField(_JavaDownloadService, "API_BASE_URL", "https://api.adoptium.net/v3");
let JavaDownloadService = _JavaDownloadService;
const javaDownloadService = new JavaDownloadService();
export {
  JavaDownloadService,
  javaDownloadService
};
