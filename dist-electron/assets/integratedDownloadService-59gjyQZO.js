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
      console.log(`[Forge] Obteniendo versiones para Minecraft ${mcVersion}`);
      const forgeApiUrls = [
        `https://maven.minecraftforge.net/net/minecraftforge/forge/maven-metadata.xml`,
        `https://files.minecraftforge.net/net/minecraftforge/forge/maven-metadata.xml`
      ];
      let data = null;
      let lastError = null;
      for (const url of forgeApiUrls) {
        try {
          console.log(`[Forge] Intentando URL: ${url}`);
          const response = await fetch(url, {
            headers: {
              "User-Agent": "DRK-Launcher/1.0"
            }
          });
          if (!response.ok) {
            console.warn(`[Forge] URL ${url} devolvió ${response.status}`);
            continue;
          }
          const contentType = response.headers.get("content-type") || "";
          if (contentType.includes("xml") || url.includes(".xml")) {
            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "text/xml");
            const versionElements = xmlDoc.getElementsByTagName("version");
            const versions = [];
            for (let i = 0; i < versionElements.length; i++) {
              const version = versionElements[i].textContent;
              if (version) {
                versions.push(version);
              }
            }
            data = { versioning: { versions } };
            console.log(`[Forge] Datos XML recibidos, ${versions.length} versiones encontradas`);
            break;
          } else {
            data = await response.json();
            console.log(`[Forge] Datos JSON recibidos:`, data);
            break;
          }
        } catch (err) {
          console.warn(`[Forge] Error al obtener desde ${url}:`, err.message);
          lastError = err;
          continue;
        }
      }
      if (!data) {
        console.log(`[Forge] Intentando API alternativa de Forge (promociones)...`);
        try {
          const promoResponse = await fetch(`https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json`, {
            headers: {
              "User-Agent": "DRK-Launcher/1.0"
            }
          });
          if (promoResponse.ok) {
            const promoData = await promoResponse.json();
            console.log(`[Forge] Datos de promociones recibidos:`, promoData);
            const allVersions = [];
            if (promoData.promos) {
              for (const key in promoData.promos) {
                if (key.startsWith(`${mcVersion}-`)) {
                  allVersions.push(key);
                }
              }
            }
            data = { versioning: { versions: allVersions } };
            console.log(`[Forge] ${allVersions.length} versiones extraídas de promociones`);
          }
        } catch (err) {
          console.error(`[Forge] Error al obtener promociones:`, err);
        }
      }
      if (!data || !data.versioning || !data.versioning.versions || !Array.isArray(data.versioning.versions)) {
        console.error("[Forge] No se pudieron obtener versiones de ninguna fuente");
        if (lastError) {
          throw lastError;
        }
        return [];
      }
      const compatibleVersions = data.versioning.versions.filter((v) => {
        return v && typeof v === "string" && v.startsWith(`${mcVersion}-`);
      });
      console.log(`[Forge] Versiones compatibles encontradas: ${compatibleVersions.length}`, compatibleVersions);
      if (compatibleVersions.length === 0) {
        console.warn(`[Forge] No se encontraron versiones compatibles para Minecraft ${mcVersion}`);
        return [];
      }
      const sortedVersions = compatibleVersions.sort((a, b) => {
        const forgeVersionA = a.split("-")[1] || "";
        const forgeVersionB = b.split("-")[1] || "";
        return forgeVersionB.localeCompare(forgeVersionA, void 0, { numeric: true, sensitivity: "base" });
      });
      const forgeVersions = sortedVersions.map((version) => ({
        version,
        mcversion: mcVersion,
        type: "release"
        // Por defecto, todas son releases
      }));
      console.log(`[Forge] Versiones procesadas:`, forgeVersions);
      return forgeVersions;
    } catch (error) {
      console.error("[Forge] Error al obtener versiones de Forge:", error);
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
      console.log(`[NeoForge] Obteniendo versiones para Minecraft ${mcVersion}`);
      const response = await fetch(`https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge`, {
        headers: {
          "User-Agent": "DRK-Launcher/1.0"
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const responseData = await response.json();
      console.log(`[NeoForge] Datos recibidos:`, responseData);
      let allVersions = [];
      if (Array.isArray(responseData)) {
        allVersions = responseData;
      } else if (responseData && responseData.versions && Array.isArray(responseData.versions)) {
        allVersions = responseData.versions;
        console.log(`[NeoForge] Versiones extraídas del objeto: ${allVersions.length}`);
      } else {
        console.error("[NeoForge] Estructura de datos inválida:", responseData);
        return [];
      }
      if (allVersions.length > 0) {
        const sampleVersions = allVersions.slice(0, 5).map((v) => {
          if (typeof v === "string") return v;
          return v.version || v.id || String(v);
        });
        console.log(`[NeoForge] Ejemplos de versiones (primeras 5):`, sampleVersions);
      }
      const compatibleVersions = allVersions.filter((v) => {
        let versionString = "";
        if (typeof v === "string") {
          versionString = v;
        } else if (v && v.version) {
          versionString = v.version;
        } else if (v && typeof v === "object") {
          versionString = v.version || v.id || "";
        }
        if (!versionString) return false;
        if (versionString.startsWith(`${mcVersion}-`)) {
          return true;
        }
        const mcVersionParts = mcVersion.split(".");
        if (mcVersionParts.length >= 2) {
          const majorMinor = `${mcVersionParts[0]}.${mcVersionParts[1]}`;
          if (versionString.startsWith(`${majorMinor}.`) || versionString.startsWith(`${mcVersion}-`)) {
            return true;
          }
        }
        if (mcVersionParts.length >= 3) {
          const neoforgePattern = `${mcVersionParts[1]}.${mcVersionParts[2]}`;
          if (versionString.startsWith(neoforgePattern)) {
            return true;
          }
        }
        return false;
      });
      console.log(`[NeoForge] Versiones compatibles encontradas: ${compatibleVersions.length}`, compatibleVersions);
      if (compatibleVersions.length === 0) {
        console.warn(`[NeoForge] No se encontraron versiones compatibles para Minecraft ${mcVersion}`);
        return [];
      }
      const normalizedVersions = compatibleVersions.map((v) => {
        if (typeof v === "string") {
          return { version: v };
        }
        if (v && !v.version) {
          return { version: v.id || v.name || String(v) };
        }
        return v;
      });
      const sortedVersions = normalizedVersions.sort((a, b) => {
        const versionA = a.version || "";
        const versionB = b.version || "";
        const neoforgeVersionA = versionA.split("-")[1] || "";
        const neoforgeVersionB = versionB.split("-")[1] || "";
        return neoforgeVersionB.localeCompare(neoforgeVersionA, void 0, { numeric: true, sensitivity: "base" });
      });
      const neoforgeVersions = sortedVersions.map((v) => {
        const version = v.version || "";
        return {
          version,
          mcversion: mcVersion,
          type: v.type || "release"
          // Por defecto, todas son releases
        };
      });
      console.log(`[NeoForge] Versiones procesadas:`, neoforgeVersions);
      return neoforgeVersions;
    } catch (error) {
      console.error("[NeoForge] Error al obtener versiones de NeoForge:", error);
      return [];
    }
  }
}
const integratedDownloadService = new IntegratedDownloadService();
export {
  integratedDownloadService as i
};
