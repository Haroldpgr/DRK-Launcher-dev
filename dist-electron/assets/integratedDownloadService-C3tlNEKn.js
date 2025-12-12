class IntegratedDownloadService {
  // Métodos para el sistema de creación de instancias
  async getMinecraftVersions() {
    var _a, _b;
    if (!((_b = (_a = window.api) == null ? void 0 : _a.versions) == null ? void 0 : _b.list)) {
      throw new Error("API de versiones no disponible");
    }
    return await window.api.versions.list();
  }
  async createInstance(payload) {
    var _a, _b;
    if (!((_b = (_a = window.api) == null ? void 0 : _a.instance) == null ? void 0 : _b.createFull)) {
      throw new Error("API de creación de instancias no disponible");
    }
    return await window.api.instance.createFull(payload);
  }
  // Métodos para el sistema de logs y progreso
  async getRecentLogs(count = 50) {
    var _a;
    if (!window.api) {
      throw new Error("API de Electron no disponible");
    }
    return await ((_a = window.api.logs) == null ? void 0 : _a.getRecent(count)) || [];
  }
  async getLogsByType(type, count = 50) {
    var _a;
    if (!window.api) {
      throw new Error("API de Electron no disponible");
    }
    return await ((_a = window.api.logs) == null ? void 0 : _a.getByType({ type, count })) || [];
  }
  async getLogStats() {
    var _a;
    if (!window.api) {
      throw new Error("API de Electron no disponible");
    }
    return await ((_a = window.api.logs) == null ? void 0 : _a.getStats()) || {};
  }
  async getAllProgressStatuses() {
    var _a;
    if (!window.api) {
      throw new Error("API de Electron no disponible");
    }
    return await ((_a = window.api.progress) == null ? void 0 : _a.getAllStatuses()) || [];
  }
  async getOverallProgress() {
    var _a;
    if (!window.api) {
      throw new Error("API de Electron no disponible");
    }
    return await ((_a = window.api.progress) == null ? void 0 : _a.getOverall()) || { progress: 0, statusText: "No disponible", activeOperations: 0 };
  }
  async getDownloadStatuses() {
    var _a;
    if (!window.api) {
      throw new Error("API de Electron no disponible");
    }
    return await ((_a = window.api.progress) == null ? void 0 : _a.getDownloadStatuses()) || [];
  }
  // Métodos para el sistema de Java (si están expuestos)
  async getJavaInstallations() {
    var _a, _b;
    if (!((_a = window.api) == null ? void 0 : _a.java)) {
      return [];
    }
    return await ((_b = window.api.java) == null ? void 0 : _b.getAll()) || [];
  }
  async detectJava() {
    var _a, _b;
    if (!((_a = window.api) == null ? void 0 : _a.java)) {
      return [];
    }
    return await ((_b = window.api.java) == null ? void 0 : _b.detect()) || [];
  }
  async getRecommendedJavaForVersion(mcVersion) {
    return "17";
  }
  // Métodos para el sistema de loaders
  async getFabricVersions(mcVersion) {
    try {
      const response = await fetch(`https://meta.fabricmc.net/v2/versions/loader/${mcVersion}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error al obtener versiones de Fabric:", error);
      return [];
    }
  }
  async getForgeVersions(mcVersion) {
    try {
      const response = await fetch(`https://maven.minecraftforge.net/net/minecraftforge/forge/maven-metadata.json`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const compatibleVersions = data.versioning.versions.filter(
        (v) => v.startsWith(`${mcVersion}-`)
      );
      const forgeVersions = compatibleVersions.map((version) => ({
        version,
        mcversion: mcVersion,
        type: "release"
        // Podría distinguir entre stable y beta si la API proporciona esta información
      }));
      return forgeVersions;
    } catch (error) {
      console.error("Error al obtener versiones de Forge:", error);
      return [];
    }
  }
  async getQuiltVersions(mcVersion) {
    try {
      const response = await fetch(`https://meta.quiltmc.org/v3/versions/loader/${mcVersion}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error al obtener versiones de Quilt:", error);
      return [];
    }
  }
  async getNeoForgeVersions(mcVersion) {
    try {
      const response = await fetch(`https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const allVersions = await response.json();
      const compatibleVersions = allVersions.filter(
        (v) => v.version.startsWith(`${mcVersion}-`)
      );
      return compatibleVersions;
    } catch (error) {
      console.error("Error al obtener versiones de NeoForge:", error);
      return [];
    }
  }
}
const integratedDownloadService = new IntegratedDownloadService();
export {
  integratedDownloadService as i
};
