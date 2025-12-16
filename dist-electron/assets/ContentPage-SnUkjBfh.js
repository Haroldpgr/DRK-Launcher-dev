var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { j as jsxDevRuntimeExports, r as reactExports, u as useParams, a as useNavigate, b as useLocation, R as React, _ as __vitePreload } from "./index-fZOSeWy0.js";
import { d as downloadService } from "./downloadService-CLyrCO7i.js";
import { s as showModernAlert, a as showModernConfirm } from "./uiUtils-B8zV5rkL.js";
function extractCurseForgeCompatibilityInfo(curseForgeResponse) {
  const gameVersions = /* @__PURE__ */ new Set();
  const modLoaders = /* @__PURE__ */ new Set();
  if (Array.isArray(curseForgeResponse)) {
    curseForgeResponse.forEach((item) => {
      if (item.gameVersion) {
        if (typeof item.gameVersion === "string") {
          gameVersions.add(item.gameVersion);
        } else if (Array.isArray(item.gameVersion)) {
          item.gameVersion.forEach((version) => {
            if (typeof version === "string" && version.startsWith("1.")) {
              gameVersions.add(version);
            }
          });
        }
      }
      if (item.gameVersions && Array.isArray(item.gameVersions)) {
        item.gameVersions.forEach((version) => {
          if (typeof version === "string" && version.startsWith("1.")) {
            gameVersions.add(version);
          }
        });
      }
      if (item.modLoader) {
        if (typeof item.modLoader === "string") {
          const loaderLower = item.modLoader.toLowerCase();
          if (loaderLower.includes("forge") && !loaderLower.includes("neo")) {
            modLoaders.add("forge");
          } else if (loaderLower.includes("fabric")) {
            modLoaders.add("fabric");
          } else if (loaderLower.includes("quilt")) {
            modLoaders.add("quilt");
          } else if (loaderLower.includes("neoforge") || loaderLower.includes("neo-forge")) {
            modLoaders.add("neoforge");
          }
        } else if (typeof item.modLoader === "object") {
          const loaderName = (item.modLoader.name || item.modLoader.type || "").toLowerCase();
          if (loaderName.includes("forge") && !loaderName.includes("neo")) {
            modLoaders.add("forge");
          } else if (loaderName.includes("fabric")) {
            modLoaders.add("fabric");
          } else if (loaderName.includes("quilt")) {
            modLoaders.add("quilt");
          } else if (loaderName.includes("neoforge") || loaderName.includes("neo-forge")) {
            modLoaders.add("neoforge");
          }
        }
      }
      if (item.loaders && Array.isArray(item.loaders)) {
        item.loaders.forEach((loader) => {
          const loaderStr = typeof loader === "string" ? loader : loader.name || loader.type || "";
          const loaderLower = loaderStr.toLowerCase();
          if (loaderLower.includes("forge") && !loaderLower.includes("neo")) {
            modLoaders.add("forge");
          } else if (loaderLower.includes("fabric")) {
            modLoaders.add("fabric");
          } else if (loaderLower.includes("quilt")) {
            modLoaders.add("quilt");
          } else if (loaderLower.includes("neoforge") || loaderLower.includes("neo-forge")) {
            modLoaders.add("neoforge");
          }
        });
      }
    });
  }
  return {
    gameVersions: Array.from(gameVersions).sort((a, b) => {
      const aParts = a.split(".").map(Number);
      const bParts = b.split(".").map(Number);
      for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
        if (aParts[i] !== bParts[i]) {
          return bParts[i] - aParts[i];
        }
      }
      return bParts.length - aParts.length;
    }),
    modLoaders: Array.from(modLoaders)
  };
}
class ModrinthAPI_Handler {
  constructor() {
    __publicField(this, "baseUrl", "https://api.modrinth.com/v2");
    __publicField(this, "userAgent", "Drakkar-ModLauncher/1.0.0 (haroldmuller2015@gmail.com)");
  }
  /**
   * Search for projects on Modrinth
   * @param params Search parameters
   * @returns Array of ModrinthProject
   */
  async searchProjects(params) {
    try {
      const queryParams = new URLSearchParams();
      if (params.query) queryParams.append("query", params.query);
      if (params.limit) queryParams.append("limit", params.limit.toString());
      if (params.offset) queryParams.append("offset", params.offset.toString());
      if (params.version && params.version.length > 0) {
        queryParams.append("game_versions", JSON.stringify(params.version));
      }
      if (params.loader && params.loader.length > 0) {
        queryParams.append("loaders", JSON.stringify(params.loader));
      }
      if (params.environment) queryParams.append("environment", params.environment);
      if (params.project_type) queryParams.append("project_type", params.project_type);
      if (params.license) queryParams.append("license", params.license);
      if (params.downloads) queryParams.append("downloads", JSON.stringify(params.downloads));
      if (params.follows) queryParams.append("follows", JSON.stringify(params.follows));
      if (params.color) queryParams.append("color", params.color.toString());
      if (params.show_beta !== void 0) queryParams.append("show_beta", params.show_beta.toString());
      if (params.show_alpha !== void 0) queryParams.append("show_alpha", params.show_alpha.toString());
      if (params.facets && params.facets.length > 0) {
        queryParams.append("facets", JSON.stringify(params.facets));
      }
      if (params.sort) {
        queryParams.append("sort", params.sort.field);
        queryParams.append("sort_direction", params.sort.direction);
      }
      const response = await fetch(
        `${this.baseUrl}/search?${queryParams.toString()}`,
        {
          headers: {
            "User-Agent": this.userAgent,
            "Accept": "application/json"
          }
        }
      );
      if (!response.ok) {
        throw new Error(`Modrinth API error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return data.hits;
    } catch (error) {
      console.error("Error searching Modrinth projects:", error);
      throw error;
    }
  }
  /**
   * Get a project by its ID
   * @param projectId The project ID or slug
   * @returns ModrinthProject
   */
  async getProject(projectId) {
    try {
      const response = await fetch(
        `${this.baseUrl}/project/${projectId}`,
        {
          headers: {
            "User-Agent": this.userAgent,
            "Accept": "application/json"
          }
        }
      );
      if (!response.ok) {
        throw new Error(`Modrinth API error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error getting Modrinth project ${projectId}:`, error);
      throw error;
    }
  }
  /**
   * Get all versions for a project
   * @param projectId The project ID or slug
   * @returns Array of ModrinthVersion
   */
  async getProjectVersions(projectId) {
    try {
      const response = await fetch(
        `${this.baseUrl}/project/${projectId}/version`,
        {
          headers: {
            "User-Agent": this.userAgent,
            "Accept": "application/json"
          }
        }
      );
      if (!response.ok) {
        throw new Error(`Modrinth API error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error getting Modrinth project versions ${projectId}:`, error);
      throw error;
    }
  }
  /**
   * Get versions compatible with specific game version and loader
   * @param query Compatible version query parameters
   * @returns Array of ModrinthVersion
   */
  async getCompatibleVersions(query) {
    try {
      const response = await fetch(
        `${this.baseUrl}/project/${query.projectId}/version`,
        {
          headers: {
            "User-Agent": this.userAgent,
            "Accept": "application/json"
          }
        }
      );
      if (!response.ok) {
        throw new Error(`Modrinth API error: ${response.status} ${response.statusText}`);
      }
      const versions = await response.json();
      return versions.filter((version) => {
        const gameVersionMatch = !query.mcVersion || version.game_versions.includes(query.mcVersion);
        const loaderMatch = !query.loader || version.loaders.includes(query.loader);
        return gameVersionMatch && loaderMatch;
      });
    } catch (error) {
      console.error(`Error getting compatible versions for project ${query.projectId}:`, error);
      throw error;
    }
  }
  /**
   * Get specific version by ID
   * @param versionId The version ID
   * @returns ModrinthVersion
   */
  async getVersion(versionId) {
    try {
      const response = await fetch(
        `${this.baseUrl}/version/${versionId}`,
        {
          headers: {
            "User-Agent": this.userAgent,
            "Accept": "application/json"
          }
        }
      );
      if (!response.ok) {
        throw new Error(`Modrinth API error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error getting Modrinth version ${versionId}:`, error);
      throw error;
    }
  }
  /**
   * Download a file by URL
   * @param downloadUrl The download URL
   * @param filename The filename to save as
   * @returns Promise that resolves when download is complete
   */
  async downloadFile(downloadUrl, filename) {
    try {
      console.log(`Prepared to download from: ${downloadUrl} as ${filename}`);
    } catch (error) {
      console.error(`Error preparing download for ${filename}:`, error);
      throw error;
    }
  }
  /**
   * Get a specific file from a version by its ID
   * @param fileId The file ID
   * @returns ModrinthFile
   */
  async getFile(fileId) {
    throw new Error("Modrinth does not have a direct file API endpoint. Get the version containing the file instead.");
  }
}
const modrinthAPI = new ModrinthAPI_Handler();
class CurseForgeAPI_Handler {
  constructor() {
    __publicField(this, "baseUrl", "https://api.curseforge.com/v1");
    __publicField(this, "apiKey", null);
    __publicField(this, "userAgent", "Drakkar-ModLauncher/1.0.0 (haroldmuller2015@gmail.com)");
    this.loadApiKey();
  }
  /**
   * Load API key from settings
   */
  loadApiKey() {
    try {
      this.apiKey = "$2a$10$8qrneNohy/pV0jJKZVbUuu.kXuDwlRmfhnf4o.7VGEN/bEjXTOPWC";
    } catch (error) {
      console.warn("Could not load CurseForge API key:", error);
      this.apiKey = null;
    }
  }
  /**
   * Get headers for API requests
   */
  getHeaders() {
    const headers = {
      "User-Agent": this.userAgent,
      "Accept": "application/json",
      "Content-Type": "application/json"
    };
    if (this.apiKey) {
      headers["X-API-Key"] = this.apiKey;
    }
    return headers;
  }
  /**
   * Search for mods on CurseForge
   * @param params Search parameters
   * @returns Array of CurseForgeMod
   */
  async searchMods(params) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("gameId", params.gameId.toString());
      if (params.classId) queryParams.append("classId", params.classId.toString());
      if (params.categoryId) queryParams.append("categoryId", params.categoryId.toString());
      if (params.gameVersion) queryParams.append("gameVersion", params.gameVersion);
      if (params.searchFilter) queryParams.append("searchFilter", params.searchFilter);
      if (params.modLoaderType !== void 0) queryParams.append("modLoaderType", params.modLoaderType.toString());
      if (params.gameVersionTypeId) queryParams.append("gameVersionTypeId", params.gameVersionTypeId.toString());
      if (params.index) queryParams.append("index", params.index.toString());
      if (params.pageSize) queryParams.append("pageSize", params.pageSize.toString());
      if (params.sortField) queryParams.append("sortField", params.sortField.toString());
      if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);
      if (params.modStatus) queryParams.append("modStatus", params.modStatus.toString());
      const response = await fetch(
        `${this.baseUrl}/mods/search?${queryParams.toString()}`,
        {
          headers: this.getHeaders()
        }
      );
      if (!response.ok) {
        throw new Error(`CurseForge API error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error("Error searching CurseForge mods:", error);
      throw error;
    }
  }
  /**
   * Get a specific mod by ID
   * @param modId The mod ID
   * @returns CurseForgeMod
   */
  async getMod(modId) {
    try {
      const response = await fetch(
        `${this.baseUrl}/mods/${modId}`,
        {
          headers: this.getHeaders()
        }
      );
      if (!response.ok) {
        throw new Error(`CurseForge API error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error(`Error getting CurseForge mod ${modId}:`, error);
      throw error;
    }
  }
  /**
   * Get all files for a mod
   * @param modId The mod ID
   * @returns Array of CurseForgeFile
   */
  async getModFiles(modId) {
    try {
      const response = await fetch(
        `${this.baseUrl}/mods/${modId}/files`,
        {
          headers: this.getHeaders()
        }
      );
      if (!response.ok) {
        throw new Error(`CurseForge API error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error(`Error getting CurseForge mod files for ${modId}:`, error);
      throw error;
    }
  }
  /**
   * Get a specific file for a mod
   * @param modId The mod ID
   * @param fileId The file ID
   * @returns CurseForgeFile
   */
  async getModFile(modId, fileId) {
    try {
      const response = await fetch(
        `${this.baseUrl}/mods/${modId}/files/${fileId}`,
        {
          headers: this.getHeaders()
        }
      );
      if (!response.ok) {
        throw new Error(`CurseForge API error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error(`Error getting CurseForge file ${fileId} for mod ${modId}:`, error);
      throw error;
    }
  }
  /**
   * Get compatible versions for a mod
   * @param modId The mod ID
   * @param mcVersion Minecraft version
   * @param loader Optional loader (e.g., forge, fabric)
   * @returns Array of compatible versions
   */
  async getCompatibleVersions(modId, mcVersion, loader) {
    try {
      const files = await this.getModFiles(modId);
      return files.filter((file) => {
        const versionMatch = file.gameVersions.includes(mcVersion);
        if (!loader) return versionMatch;
        const loaderMap = {
          "forge": 1,
          "fabric": 4,
          "quilt": 5,
          "neoforge": 6
        };
        const loaderId = loaderMap[loader.toLowerCase()];
        return versionMatch && (!loaderId || file.gameVersionTypIds.includes(loaderId));
      });
    } catch (error) {
      console.error(`Error getting compatible versions for mod ${modId}:`, error);
      throw error;
    }
  }
  /**
   * Get dependencies for a specific mod
   * @param modId The mod ID
   * @returns Dependencies information
   */
  async getModDependencies(modId) {
    try {
      const mod = await this.getMod(modId);
      const files = await this.getModFiles(modId);
      const allDependencies = [];
      for (const file of files) {
        if (file.fileDependencies && file.fileDependencies.length > 0) {
          allDependencies.push(...file.fileDependencies.map((dep) => ({
            ...dep,
            fileName: file.displayName,
            fileId: file.id
          })));
        }
      }
      const uniqueDependencies = allDependencies.filter(
        (dep, index, self) => index === self.findIndex((d) => d.modId === dep.modId)
      );
      return {
        modInfo: mod,
        dependencies: uniqueDependencies,
        files
      };
    } catch (error) {
      console.error(`Error getting dependencies for CurseForge mod ${modId}:`, error);
      throw error;
    }
  }
  /**
   * Get all game versions (Minecraft versions)
   * @returns Array of game version strings
   */
  async getGameVersions() {
    try {
      const response = await fetch(
        `${this.baseUrl}/games/4471/versions`,
        {
          headers: this.getHeaders()
        }
      );
      if (!response.ok) {
        throw new Error(`CurseForge API error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      const versions = data.data;
      return versions.map((v) => v.name);
    } catch (error) {
      console.error("Error getting CurseForge game versions:", error);
      throw error;
    }
  }
  /**
   * Get all mod loaders (Forge, Fabric, etc.)
   * @returns Array of mod loader objects
   */
  async getModLoaders() {
    try {
      const response = await fetch(
        `${this.baseUrl}/games/4471/modloader-types`,
        {
          headers: this.getHeaders()
        }
      );
      if (!response.ok) {
        throw new Error(`CurseForge API error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error("Error getting CurseForge mod loaders:", error);
      throw error;
    }
  }
  /**
   * Download a file by URL
   * @param downloadUrl The download URL
   * @param filename The filename to save as
   * @param displayName Display name for the download
   * @returns Promise that resolves when download is initiated
   */
  async downloadFile(downloadUrl, filename, displayName) {
    try {
      downloadService.downloadFile(downloadUrl, filename, displayName);
    } catch (error) {
      console.error(`Error initiating download for ${filename}:`, error);
      throw error;
    }
  }
}
const curseForgeAPI = new CurseForgeAPI_Handler();
const ContentCard = ({
  id,
  title,
  description,
  author,
  downloads,
  lastUpdated,
  imageUrl,
  type,
  onDownload,
  onDetails,
  isDownloading = false,
  downloadProgress = 0,
  platform
}) => {
  const formatDownloads = (count) => {
    if (count >= 1e6) return `${(count / 1e6).toFixed(1)}M`;
    if (count >= 1e3) return `${(count / 1e3).toFixed(1)}K`;
    return count.toString();
  };
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "div",
    {
      className: "bg-gray-700/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-600 hover:bg-gray-700/70 transition-all duration-300 cursor-pointer group",
      onClick: () => onDetails(id),
      children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "relative h-40 overflow-hidden", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "img",
            {
              src: imageUrl,
              alt: title,
              className: "w-full h-full object-cover transition-transform duration-300 group-hover:scale-105",
              loading: "lazy",
              onError: (e) => {
                const target = e.target;
                target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWYyOTM3Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk1pbmVjcmFmdDwvdGV4dD48L3N2Zz4=";
              }
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentCard.tsx",
              lineNumber: 56,
              columnNumber: 9
            },
            void 0
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded", children: platform === "modrinth" ? "Modrinth" : "CurseForge" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentCard.tsx",
            lineNumber: 66,
            columnNumber: 9
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded", children: type }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentCard.tsx",
            lineNumber: 69,
            columnNumber: 9
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentCard.tsx",
          lineNumber: 55,
          columnNumber: 7
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-4", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "font-medium text-white text-lg mb-2 line-clamp-2 h-12", children: title }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentCard.tsx",
            lineNumber: 76,
            columnNumber: 9
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-sm text-gray-400 mb-3 line-clamp-3 h-12", children: description }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentCard.tsx",
            lineNumber: 77,
            columnNumber: 9
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between text-xs text-gray-500 mb-4", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: [
              "por ",
              author
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentCard.tsx",
              lineNumber: 80,
              columnNumber: 11
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: formatDate(lastUpdated) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentCard.tsx",
              lineNumber: 81,
              columnNumber: 11
            }, void 0)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentCard.tsx",
            lineNumber: 79,
            columnNumber: 9
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between text-xs text-gray-500 mb-4", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: [
            formatDownloads(downloads),
            " descargas"
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentCard.tsx",
            lineNumber: 85,
            columnNumber: 11
          }, void 0) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentCard.tsx",
            lineNumber: 84,
            columnNumber: 9
          }, void 0),
          isDownloading && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mb-3", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-full bg-gray-600 rounded-full h-2", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "div",
              {
                className: "bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300 ease-out",
                style: { width: `${downloadProgress}%` }
              },
              void 0,
              false,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentCard.tsx",
                lineNumber: 92,
                columnNumber: 15
              },
              void 0
            ) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentCard.tsx",
              lineNumber: 91,
              columnNumber: 13
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-right text-xs text-gray-400 mt-1", children: [
              Math.round(downloadProgress),
              "%"
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentCard.tsx",
              lineNumber: 97,
              columnNumber: 13
            }, void 0)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentCard.tsx",
            lineNumber: 90,
            columnNumber: 11
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex space-x-2", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "button",
              {
                onClick: (e) => {
                  e.stopPropagation();
                  onDetails(id);
                },
                className: "flex-1 py-2 px-3 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded-lg text-sm font-medium transition-colors",
                children: "Detalles"
              },
              void 0,
              false,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentCard.tsx",
                lineNumber: 105,
                columnNumber: 11
              },
              void 0
            ),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "button",
              {
                onClick: (e) => {
                  e.stopPropagation();
                  onDownload();
                },
                disabled: isDownloading,
                className: `flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${isDownloading ? "bg-gray-600 text-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"}`,
                children: isDownloading ? "Descargando..." : "Descargar"
              },
              void 0,
              false,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentCard.tsx",
                lineNumber: 114,
                columnNumber: 11
              },
              void 0
            )
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentCard.tsx",
            lineNumber: 104,
            columnNumber: 9
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentCard.tsx",
          lineNumber: 75,
          columnNumber: 7
        }, void 0)
      ]
    },
    void 0,
    true,
    {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentCard.tsx",
      lineNumber: 50,
      columnNumber: 5
    },
    void 0
  );
};
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "div",
    {
      className: "fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center",
      onClick: onClose,
      children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
        "div",
        {
          className: "bg-gray-900 rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto",
          onClick: (e) => e.stopPropagation(),
          children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-center mb-4", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h2", { className: "text-xl font-semibold", children: title }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/Modal.tsx",
                lineNumber: 22,
                columnNumber: 11
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                "button",
                {
                  onClick: onClose,
                  className: "text-gray-400 hover:text-white",
                  children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M6 18L18 6M6 6l12 12" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/Modal.tsx",
                    lineNumber: 28,
                    columnNumber: 15
                  }, this) }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/Modal.tsx",
                    lineNumber: 27,
                    columnNumber: 13
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/Modal.tsx",
                  lineNumber: 23,
                  columnNumber: 11
                },
                this
              )
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/Modal.tsx",
              lineNumber: 21,
              columnNumber: 9
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/Modal.tsx",
              lineNumber: 32,
              columnNumber: 9
            }, this)
          ]
        },
        void 0,
        true,
        {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/Modal.tsx",
          lineNumber: 17,
          columnNumber: 7
        },
        this
      )
    },
    void 0,
    false,
    {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/Modal.tsx",
      lineNumber: 13,
      columnNumber: 5
    },
    this
  );
}
const DownloadModalModrinth = ({
  isOpen,
  onClose,
  project,
  onDownloadComplete
}) => {
  const [selectedVersion, setSelectedVersion] = reactExports.useState("");
  const [selectedLoader, setSelectedLoader] = reactExports.useState("fabric");
  const [customPath, setCustomPath] = reactExports.useState("");
  const [isCustomPathSelected, setIsCustomPathSelected] = reactExports.useState(false);
  const [versions, setVersions] = reactExports.useState([]);
  const [compatibleVersions, setCompatibleVersions] = reactExports.useState([]);
  const [selectedFileVersion, setSelectedFileVersion] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  const [instances, setInstances] = reactExports.useState([]);
  reactExports.useEffect(() => {
    if (isOpen && project) {
      loadProjectData();
    }
  }, [isOpen, project]);
  const loadProjectData = async () => {
    var _a;
    setLoading(true);
    setError(null);
    try {
      if ((_a = window.api) == null ? void 0 : _a.instances) {
        const userInstances = await window.api.instances.list();
        setInstances(userInstances);
      }
      const allVersions = await new ModrinthAPI_Handler().getProjectVersions(project.id);
      setVersions(allVersions);
      setCompatibleVersions(allVersions);
      if (allVersions.length > 0) {
        setSelectedVersion(allVersions[0].version_number);
        setSelectedFileVersion(allVersions[0]);
      }
    } catch (err) {
      console.error("Error loading project data:", err);
      setError("Error al cargar los datos del proyecto. Por favor, inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };
  const handleVersionChange = (versionNumber) => {
    setSelectedVersion(versionNumber);
    const version = versions.find((v) => v.version_number === versionNumber);
    if (version) {
      setSelectedFileVersion(version);
    }
  };
  const handleSelectCustomPath = async () => {
    var _a, _b;
    try {
      if ((_b = (_a = window.api) == null ? void 0 : _a.dialog) == null ? void 0 : _b.showOpenDialog) {
        const result = await window.api.dialog.showOpenDialog({
          properties: ["openDirectory"],
          title: "Seleccionar carpeta de destino",
          buttonLabel: "Seleccionar"
        });
        if (!result.canceled && result.filePaths.length > 0) {
          setCustomPath(result.filePaths[0]);
          setIsCustomPathSelected(true);
        }
      }
    } catch (error2) {
      console.error("Error selecting custom path:", error2);
      setError("Error al seleccionar la carpeta personalizada.");
    }
  };
  const handleDownload = async () => {
    var _a;
    if (!selectedFileVersion) {
      setError("Por favor, selecciona una versión para descargar.");
      return;
    }
    try {
      const primaryFile = selectedFileVersion.files.find((f) => f.primary) || selectedFileVersion.files[0];
      if (!primaryFile) {
        setError("No se encontró un archivo para descargar.");
        return;
      }
      let targetPath = "";
      if (isCustomPathSelected && customPath) {
        targetPath = customPath;
      } else {
        const selectedInstanceId = (_a = document.querySelector('select[name="instance-select"]')) == null ? void 0 : _a.value;
        if (selectedInstanceId && selectedInstanceId !== "custom") {
          const selectedInstance = instances.find((instance) => instance.id === selectedInstanceId);
          if (selectedInstance) {
            targetPath = selectedInstance.path;
          }
        }
      }
      if (!targetPath) {
        setError("Por favor, selecciona una instancia o carpeta personalizada para la descarga.");
        return;
      }
      downloadService.downloadFile(
        primaryFile.url,
        primaryFile.filename,
        `${project.title} ${selectedFileVersion.version_number}`
      );
      onClose();
      if (onDownloadComplete) {
        onDownloadComplete();
      }
    } catch (error2) {
      console.error("Error starting download:", error2);
      setError("Error al iniciar la descarga. Por favor, inténtalo de nuevo.");
    }
  };
  reactExports.useEffect(() => {
    if (versions.length > 0) {
      const filtered = versions.filter(
        (version) => !selectedLoader || version.loaders.includes(selectedLoader)
      );
      setCompatibleVersions(filtered);
      if (selectedFileVersion && !filtered.some((v) => v.id === selectedFileVersion.id)) {
        const newSelected = filtered[0] || null;
        setSelectedFileVersion(newSelected);
        if (newSelected) {
          setSelectedVersion(newSelected.version_number);
        }
      }
    }
  }, [versions, selectedLoader, selectedFileVersion]);
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Modal, { isOpen, onClose, children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-full max-w-2xl bg-gray-800 rounded-xl border border-gray-700 shadow-2xl overflow-hidden", children: [
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-6 border-b border-gray-700", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-start justify-between", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-start space-x-4", children: [
        project.icon_url && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "img",
          {
            src: project.icon_url,
            alt: project.title,
            className: "w-16 h-16 rounded-lg object-cover border border-gray-600",
            onError: (e) => {
              const target = e.target;
              target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzFmMjkzNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5NPC90ZXh0Pjwvc3ZnPg==";
            }
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
            lineNumber: 175,
            columnNumber: 17
          },
          void 0
        ),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h2", { className: "text-xl font-bold text-white", children: project.title }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
            lineNumber: 186,
            columnNumber: 17
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-sm text-gray-400 mt-1", children: "Descargar contenido" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
            lineNumber: 187,
            columnNumber: 17
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
          lineNumber: 185,
          columnNumber: 15
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
        lineNumber: 173,
        columnNumber: 13
      }, void 0),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
        "button",
        {
          onClick: onClose,
          className: "text-gray-400 hover:text-white transition-colors",
          children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M6 18L18 6M6 6l12 12" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
            lineNumber: 195,
            columnNumber: 17
          }, void 0) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
            lineNumber: 194,
            columnNumber: 15
          }, void 0)
        },
        void 0,
        false,
        {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
          lineNumber: 190,
          columnNumber: 13
        },
        void 0
      )
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
      lineNumber: 172,
      columnNumber: 11
    }, void 0) }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
      lineNumber: 171,
      columnNumber: 9
    }, void 0),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-6 max-h-[60vh] overflow-y-auto", children: loading ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-center h-32", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
      lineNumber: 205,
      columnNumber: 15
    }, void 0) }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
      lineNumber: 204,
      columnNumber: 13
    }, void 0) : error ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-red-500 text-center py-8", children: error }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
      lineNumber: 208,
      columnNumber: 13
    }, void 0) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300", children: "Versión del Juego:" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
          lineNumber: 213,
          columnNumber: 17
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "relative", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "select",
            {
              value: selectedVersion,
              onChange: (e) => handleVersionChange(e.target.value),
              className: "w-full bg-gray-700/80 backdrop-blur-sm border border-gray-600 rounded-xl py-3 px-4 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 appearance-none",
              children: compatibleVersions.map((version) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: version.version_number, children: [
                version.game_versions.join(", "),
                " - ",
                version.version_number,
                " (",
                version.version_type,
                ")"
              ] }, version.id, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
                lineNumber: 223,
                columnNumber: 23
              }, void 0))
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
              lineNumber: 217,
              columnNumber: 19
            },
            void 0
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-300", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M19 9l-7 7-7-7" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
            lineNumber: 230,
            columnNumber: 23
          }, void 0) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
            lineNumber: 229,
            columnNumber: 21
          }, void 0) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
            lineNumber: 228,
            columnNumber: 19
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
          lineNumber: 216,
          columnNumber: 17
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
        lineNumber: 212,
        columnNumber: 15
      }, void 0),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300", children: "Plataforma (Loader):" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
          lineNumber: 238,
          columnNumber: 17
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex flex-wrap gap-2", children: ["fabric", "forge", "quilt", "neoforge"].map((loader) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: () => setSelectedLoader(loader),
            className: `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${selectedLoader === loader ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md" : "bg-gray-700/70 text-gray-300 hover:bg-gray-600/80"}`,
            children: loader.charAt(0).toUpperCase() + loader.slice(1)
          },
          loader,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
            lineNumber: 243,
            columnNumber: 21
          },
          void 0
        )) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
          lineNumber: 241,
          columnNumber: 17
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
        lineNumber: 237,
        columnNumber: 15
      }, void 0),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300", children: "Destino de Instalación:" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
          lineNumber: 260,
          columnNumber: 17
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "relative", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "select",
            {
              name: "instance-select",
              className: "w-full bg-gray-700/80 backdrop-blur-sm border border-gray-600 rounded-xl py-3 px-4 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 appearance-none",
              children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "", children: "Seleccionar instancia..." }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
                  lineNumber: 268,
                  columnNumber: 21
                }, void 0),
                instances.map((instance) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: instance.id, children: [
                  instance.name,
                  " (",
                  instance.version,
                  ") ",
                  instance.loader && ` - ${instance.loader}`
                ] }, instance.id, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
                  lineNumber: 270,
                  columnNumber: 23
                }, void 0)),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "custom", children: "Carpeta personalizada..." }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
                  lineNumber: 274,
                  columnNumber: 21
                }, void 0)
              ]
            },
            void 0,
            true,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
              lineNumber: 264,
              columnNumber: 19
            },
            void 0
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-300", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M19 9l-7 7-7-7" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
            lineNumber: 278,
            columnNumber: 23
          }, void 0) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
            lineNumber: 277,
            columnNumber: 21
          }, void 0) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
            lineNumber: 276,
            columnNumber: 19
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
          lineNumber: 263,
          columnNumber: 17
        }, void 0),
        isCustomPathSelected || /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: handleSelectCustomPath,
            className: "mt-2 w-full bg-gray-700/70 hover:bg-gray-600/80 text-gray-300 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors",
            children: "Carpeta personalizada..."
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
            lineNumber: 284,
            columnNumber: 19
          },
          void 0
        ),
        isCustomPathSelected && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-2 p-3 bg-gray-700/50 rounded-lg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-center", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-sm text-gray-300 truncate", children: customPath }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
            lineNumber: 295,
            columnNumber: 23
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              onClick: () => setIsCustomPathSelected(false),
              className: "text-red-500 hover:text-red-400 ml-2",
              children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M6 18L18 6M6 6l12 12" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
                lineNumber: 301,
                columnNumber: 27
              }, void 0) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
                lineNumber: 300,
                columnNumber: 25
              }, void 0)
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
              lineNumber: 296,
              columnNumber: 23
            },
            void 0
          )
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
          lineNumber: 294,
          columnNumber: 21
        }, void 0) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
          lineNumber: 293,
          columnNumber: 19
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
        lineNumber: 259,
        columnNumber: 15
      }, void 0),
      selectedFileVersion && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-700/50 p-4 rounded-xl border border-gray-600", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h4", { className: "font-medium text-gray-200 mb-2", children: "Detalles del Archivo Seleccionado:" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
          lineNumber: 312,
          columnNumber: 19
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-start space-x-3", children: [
          project.icon_url && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "img",
            {
              src: project.icon_url,
              alt: project.title,
              className: "w-10 h-10 rounded object-cover border border-gray-500",
              onError: (e) => {
                const target = e.target;
                target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzFmMjkzNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5GPC90ZXh0Pjwvc3ZnPg==";
              }
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
              lineNumber: 315,
              columnNumber: 23
            },
            void 0
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-sm font-medium text-white truncate", children: selectedFileVersion.name }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
              lineNumber: 326,
              columnNumber: 23
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-400 mt-1", children: [
              "Versión: ",
              selectedFileVersion.version_number
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
              lineNumber: 329,
              columnNumber: 23
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-400", children: [
              selectedFileVersion.loaders.join(", "),
              " - ",
              selectedFileVersion.game_versions.join(", ")
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
              lineNumber: 332,
              columnNumber: 23
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-500 mt-1", children: [
              selectedFileVersion.downloads,
              " descargas"
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
              lineNumber: 335,
              columnNumber: 23
            }, void 0)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
            lineNumber: 325,
            columnNumber: 21
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
          lineNumber: 313,
          columnNumber: 19
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
        lineNumber: 311,
        columnNumber: 17
      }, void 0)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
      lineNumber: 210,
      columnNumber: 13
    }, void 0) }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
      lineNumber: 202,
      columnNumber: 9
    }, void 0),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-6 border-t border-gray-700 bg-gray-800/80", children: [
      error && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-red-500 text-sm mb-4", children: error }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
        lineNumber: 349,
        columnNumber: 13
      }, void 0),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-end space-x-3", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: onClose,
            className: "px-5 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium transition-colors",
            children: "Cancelar"
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
            lineNumber: 352,
            columnNumber: 13
          },
          void 0
        ),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: handleDownload,
            disabled: loading || !selectedFileVersion,
            className: "px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium transition-all duration-200 shadow-lg shadow-blue-500/20 disabled:opacity-50",
            children: "Descargar Contenido"
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
            lineNumber: 358,
            columnNumber: 13
          },
          void 0
        )
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
        lineNumber: 351,
        columnNumber: 11
      }, void 0)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
      lineNumber: 347,
      columnNumber: 9
    }, void 0)
  ] }, void 0, true, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
    lineNumber: 169,
    columnNumber: 7
  }, void 0) }, void 0, false, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalModrinth.tsx",
    lineNumber: 168,
    columnNumber: 5
  }, void 0);
};
const DownloadModalCurseForge = ({
  isOpen,
  onClose,
  mod,
  onDownloadComplete
}) => {
  const [selectedVersion, setSelectedVersion] = reactExports.useState("");
  const [selectedLoader, setSelectedLoader] = reactExports.useState("");
  const [customPath, setCustomPath] = reactExports.useState("");
  const [isCustomPathSelected, setIsCustomPathSelected] = reactExports.useState(false);
  const [files, setFiles] = reactExports.useState([]);
  const [compatibleFiles, setCompatibleFiles] = reactExports.useState([]);
  const [selectedFile, setSelectedFile] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  const [instances, setInstances] = reactExports.useState([]);
  const [manualDownloadUrl, setManualDownloadUrl] = reactExports.useState("");
  reactExports.useEffect(() => {
    if (isOpen && mod) {
      loadModData();
    }
  }, [isOpen, mod]);
  const loadModData = async () => {
    var _a;
    setLoading(true);
    setError(null);
    try {
      if ((_a = window.api) == null ? void 0 : _a.instances) {
        const userInstances = await window.api.instances.list();
        setInstances(userInstances);
      }
      const modFiles = await new CurseForgeAPI_Handler().getModFiles(mod.id);
      setFiles(modFiles);
      setCompatibleFiles(modFiles);
      if (modFiles.length > 0) {
        setSelectedFile(modFiles[0]);
        setManualDownloadUrl(modFiles[0].downloadUrl);
      }
    } catch (err) {
      console.error("Error loading mod data:", err);
      setError("Error al cargar los datos del mod. Por favor, inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };
  const handleVersionChange = (version) => {
    setSelectedVersion(version);
    const filteredFiles = files.filter(
      (file) => file.gameVersions.includes(version) && (!selectedLoader || selectedLoader === "forge" && file.gameVersionTypIds.includes(1) || selectedLoader === "fabric" && file.gameVersionTypIds.includes(4) || selectedLoader === "quilt" && file.gameVersionTypIds.includes(5) || selectedLoader === "neoforge" && file.gameVersionTypIds.includes(6))
    );
    setCompatibleFiles(filteredFiles);
    if (filteredFiles.length > 0) {
      setSelectedFile(filteredFiles[0]);
      setManualDownloadUrl(filteredFiles[0].downloadUrl);
    }
  };
  const handleLoaderChange = (loader) => {
    setSelectedLoader(loader);
    const loaderMap = {
      "forge": 1,
      "fabric": 4,
      "quilt": 5,
      "neoforge": 6
    };
    const expectedLoaderId = loaderMap[loader];
    const filteredFiles = files.filter(
      (file) => !expectedLoaderId || file.gameVersionTypIds.includes(expectedLoaderId)
    );
    setCompatibleFiles(filteredFiles);
    if (filteredFiles.length > 0) {
      setSelectedFile(filteredFiles[0]);
      setManualDownloadUrl(filteredFiles[0].downloadUrl);
    }
  };
  const handleSelectCustomPath = async () => {
    var _a, _b;
    try {
      if ((_b = (_a = window.api) == null ? void 0 : _a.dialog) == null ? void 0 : _b.showOpenDialog) {
        const result = await window.api.dialog.showOpenDialog({
          properties: ["openDirectory"],
          title: "Seleccionar carpeta de destino",
          buttonLabel: "Seleccionar"
        });
        if (!result.canceled && result.filePaths.length > 0) {
          setCustomPath(result.filePaths[0]);
          setIsCustomPathSelected(true);
        }
      }
    } catch (error2) {
      console.error("Error selecting custom path:", error2);
      setError("Error al seleccionar la carpeta personalizada.");
    }
  };
  const handleDownload = async () => {
    var _a;
    if (!selectedFile) {
      setError("Por favor, selecciona un archivo para descargar.");
      return;
    }
    try {
      let targetPath = "";
      if (isCustomPathSelected && customPath) {
        targetPath = customPath;
      } else {
        const selectedInstanceId = (_a = document.querySelector('select[name="instance-select"]')) == null ? void 0 : _a.value;
        if (selectedInstanceId && selectedInstanceId !== "custom") {
          const selectedInstance = instances.find((instance) => instance.id === selectedInstanceId);
          if (selectedInstance) {
            targetPath = selectedInstance.path;
          }
        }
      }
      if (!targetPath) {
        setError("Por favor, selecciona una instancia o carpeta personalizada para la descarga.");
        return;
      }
      downloadService.downloadFile(
        selectedFile.downloadUrl,
        selectedFile.fileName,
        `${mod.name} ${selectedFile.displayName}`
      );
      onClose();
      if (onDownloadComplete) {
        onDownloadComplete();
      }
    } catch (error2) {
      console.error("Error starting download:", error2);
      setError("Error al iniciar la descarga. Por favor, inténtalo de nuevo.");
    }
  };
  const handleManualDownload = () => {
    if (manualDownloadUrl) {
      window.open(manualDownloadUrl, "_blank");
    }
  };
  const gameVersions = Array.from(
    new Set(files.flatMap((file) => file.gameVersions))
  ).sort((a, b) => b.localeCompare(a));
  const loaderOptions = [
    { id: 1, name: "Forge", value: "forge" },
    { id: 4, name: "Fabric", value: "fabric" },
    { id: 5, name: "Quilt", value: "quilt" },
    { id: 6, name: "NeoForge", value: "neoforge" }
  ];
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Modal, { isOpen, onClose, children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-full max-w-2xl bg-gray-800 rounded-xl border border-gray-700 shadow-2xl overflow-hidden", children: [
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-6 border-b border-gray-700", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-start justify-between", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-start space-x-4", children: [
        mod.logo && mod.logo.url ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "img",
          {
            src: mod.logo.url,
            alt: mod.name,
            className: "w-16 h-16 rounded-lg object-cover border border-gray-600",
            onError: (e) => {
              const target = e.target;
              target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzFmMjkzNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5NPC90ZXh0Pjwvc3ZnPg==";
            }
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
            lineNumber: 202,
            columnNumber: 17
          },
          void 0
        ) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-16 h-16 rounded-lg bg-gray-700 flex items-center justify-center border border-gray-600", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-gray-400 text-xs font-bold", children: "CF" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
          lineNumber: 213,
          columnNumber: 19
        }, void 0) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
          lineNumber: 212,
          columnNumber: 17
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h2", { className: "text-xl font-bold text-white", children: mod.name }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
            lineNumber: 217,
            columnNumber: 17
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-sm text-gray-400 mt-1", children: "Descargar contenido" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
            lineNumber: 218,
            columnNumber: 17
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
          lineNumber: 216,
          columnNumber: 15
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
        lineNumber: 200,
        columnNumber: 13
      }, void 0),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
        "button",
        {
          onClick: onClose,
          className: "text-gray-400 hover:text-white transition-colors",
          children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M6 18L18 6M6 6l12 12" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
            lineNumber: 226,
            columnNumber: 17
          }, void 0) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
            lineNumber: 225,
            columnNumber: 15
          }, void 0)
        },
        void 0,
        false,
        {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
          lineNumber: 221,
          columnNumber: 13
        },
        void 0
      )
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
      lineNumber: 199,
      columnNumber: 11
    }, void 0) }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
      lineNumber: 198,
      columnNumber: 9
    }, void 0),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-6 max-h-[60vh] overflow-y-auto", children: loading ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-center h-32", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
      lineNumber: 236,
      columnNumber: 15
    }, void 0) }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
      lineNumber: 235,
      columnNumber: 13
    }, void 0) : error ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-red-500 text-center py-8", children: error }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
      lineNumber: 239,
      columnNumber: 13
    }, void 0) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-700/50 p-4 rounded-xl border border-gray-600", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "font-medium text-gray-200 mb-2", children: "Opción Manual:" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
          lineNumber: 244,
          columnNumber: 17
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: handleManualDownload,
            className: "w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200",
            children: "Descargar el archivo manualmente"
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
            lineNumber: 245,
            columnNumber: 17
          },
          void 0
        )
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
        lineNumber: 243,
        columnNumber: 15
      }, void 0),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300", children: "Versión del Juego:" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
          lineNumber: 255,
          columnNumber: 17
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "relative", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "select",
            {
              value: selectedVersion,
              onChange: (e) => handleVersionChange(e.target.value),
              className: "w-full bg-gray-700/80 backdrop-blur-sm border border-gray-600 rounded-xl py-3 px-4 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 appearance-none",
              children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "", children: "Seleccionar versión..." }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
                  lineNumber: 264,
                  columnNumber: 21
                }, void 0),
                gameVersions.map((version) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: version, children: version }, version, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
                  lineNumber: 266,
                  columnNumber: 23
                }, void 0))
              ]
            },
            void 0,
            true,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
              lineNumber: 259,
              columnNumber: 19
            },
            void 0
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-300", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M19 9l-7 7-7-7" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
            lineNumber: 273,
            columnNumber: 23
          }, void 0) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
            lineNumber: 272,
            columnNumber: 21
          }, void 0) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
            lineNumber: 271,
            columnNumber: 19
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
          lineNumber: 258,
          columnNumber: 17
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
        lineNumber: 254,
        columnNumber: 15
      }, void 0),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300", children: "Selector de Loader:" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
          lineNumber: 281,
          columnNumber: 17
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "relative", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "select",
            {
              value: selectedLoader,
              onChange: (e) => handleLoaderChange(e.target.value),
              className: "w-full bg-gray-700/80 backdrop-blur-sm border border-gray-600 rounded-xl py-3 px-4 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 appearance-none",
              children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "", children: "Seleccionar loader..." }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
                  lineNumber: 290,
                  columnNumber: 21
                }, void 0),
                loaderOptions.map((loader) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: loader.value, children: loader.name }, loader.id, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
                  lineNumber: 292,
                  columnNumber: 23
                }, void 0))
              ]
            },
            void 0,
            true,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
              lineNumber: 285,
              columnNumber: 19
            },
            void 0
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-300", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M19 9l-7 7-7-7" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
            lineNumber: 299,
            columnNumber: 23
          }, void 0) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
            lineNumber: 298,
            columnNumber: 21
          }, void 0) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
            lineNumber: 297,
            columnNumber: 19
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
          lineNumber: 284,
          columnNumber: 17
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
        lineNumber: 280,
        columnNumber: 15
      }, void 0),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300", children: "Destino de Instalación:" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
          lineNumber: 307,
          columnNumber: 17
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "relative", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "select",
            {
              name: "instance-select",
              className: "w-full bg-gray-700/80 backdrop-blur-sm border border-gray-600 rounded-xl py-3 px-4 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 appearance-none",
              children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "", children: "Seleccionar instancia..." }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
                  lineNumber: 315,
                  columnNumber: 21
                }, void 0),
                instances.map((instance) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: instance.id, children: [
                  instance.name,
                  " (",
                  instance.version,
                  ") ",
                  instance.loader && ` - ${instance.loader}`
                ] }, instance.id, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
                  lineNumber: 317,
                  columnNumber: 23
                }, void 0)),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "custom", children: "Carpeta personalizada..." }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
                  lineNumber: 321,
                  columnNumber: 21
                }, void 0)
              ]
            },
            void 0,
            true,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
              lineNumber: 311,
              columnNumber: 19
            },
            void 0
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-300", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M19 9l-7 7-7-7" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
            lineNumber: 325,
            columnNumber: 23
          }, void 0) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
            lineNumber: 324,
            columnNumber: 21
          }, void 0) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
            lineNumber: 323,
            columnNumber: 19
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
          lineNumber: 310,
          columnNumber: 17
        }, void 0),
        isCustomPathSelected || /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: handleSelectCustomPath,
            className: "mt-2 w-full bg-gray-700/70 hover:bg-gray-600/80 text-gray-300 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors",
            children: "Carpeta personalizada..."
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
            lineNumber: 331,
            columnNumber: 19
          },
          void 0
        ),
        isCustomPathSelected && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-2 p-3 bg-gray-700/50 rounded-lg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-center", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-sm text-gray-300 truncate", children: customPath }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
            lineNumber: 342,
            columnNumber: 23
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              onClick: () => setIsCustomPathSelected(false),
              className: "text-red-500 hover:text-red-400 ml-2",
              children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M6 18L18 6M6 6l12 12" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
                lineNumber: 348,
                columnNumber: 27
              }, void 0) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
                lineNumber: 347,
                columnNumber: 25
              }, void 0)
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
              lineNumber: 343,
              columnNumber: 23
            },
            void 0
          )
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
          lineNumber: 341,
          columnNumber: 21
        }, void 0) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
          lineNumber: 340,
          columnNumber: 19
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
        lineNumber: 306,
        columnNumber: 15
      }, void 0),
      selectedFile && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-700/50 p-4 rounded-xl border border-gray-600", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h4", { className: "font-medium text-gray-200 mb-2", children: "Detalles del Archivo Seleccionado:" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
          lineNumber: 359,
          columnNumber: 19
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-start space-x-3", children: [
          mod.logo && mod.logo.url ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "img",
            {
              src: mod.logo.url,
              alt: mod.name,
              className: "w-10 h-10 rounded object-cover border border-gray-500",
              onError: (e) => {
                const target = e.target;
                target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzFmMjkzNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5GPC90ZXh0Pjwvc3ZnPg==";
              }
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
              lineNumber: 362,
              columnNumber: 23
            },
            void 0
          ) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-10 h-10 rounded bg-gray-600 flex items-center justify-center", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-gray-400 text-xs", children: "CF" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
            lineNumber: 373,
            columnNumber: 25
          }, void 0) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
            lineNumber: 372,
            columnNumber: 23
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-sm font-medium text-white truncate", children: selectedFile.displayName }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
              lineNumber: 377,
              columnNumber: 23
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-400 mt-1", children: [
              "Versión: ",
              selectedFile.displayName,
              " - ID: ",
              selectedFile.id
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
              lineNumber: 380,
              columnNumber: 23
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-400", children: selectedFile.gameVersions.join(", ") }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
              lineNumber: 383,
              columnNumber: 23
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-500 mt-1", children: [
              selectedFile.downloadCount,
              " descargas • ",
              Math.round(selectedFile.fileLength / 1024 / 1024),
              " MB"
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
              lineNumber: 386,
              columnNumber: 23
            }, void 0)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
            lineNumber: 376,
            columnNumber: 21
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
          lineNumber: 360,
          columnNumber: 19
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
        lineNumber: 358,
        columnNumber: 17
      }, void 0)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
      lineNumber: 241,
      columnNumber: 13
    }, void 0) }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
      lineNumber: 233,
      columnNumber: 9
    }, void 0),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-6 border-t border-gray-700 bg-gray-800/80", children: [
      error && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-red-500 text-sm mb-4", children: error }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
        lineNumber: 400,
        columnNumber: 13
      }, void 0),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-end space-x-3", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: onClose,
            className: "px-5 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium transition-colors",
            children: "Cancelar"
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
            lineNumber: 403,
            columnNumber: 13
          },
          void 0
        ),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: handleDownload,
            disabled: loading || !selectedFile,
            className: "px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium transition-all duration-200 shadow-lg shadow-blue-500/20 disabled:opacity-50",
            children: "Descargar"
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
            lineNumber: 409,
            columnNumber: 13
          },
          void 0
        )
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
        lineNumber: 402,
        columnNumber: 11
      }, void 0)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
      lineNumber: 398,
      columnNumber: 9
    }, void 0)
  ] }, void 0, true, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
    lineNumber: 196,
    columnNumber: 7
  }, void 0) }, void 0, false, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadModalCurseForge.tsx",
    lineNumber: 195,
    columnNumber: 5
  }, void 0);
};
class MultipleDownloadQueueService {
  // Contador para IDs únicos
  constructor() {
    __publicField(this, "queue", []);
    __publicField(this, "observers", []);
    __publicField(this, "STORAGE_KEY", "multipleDownloadQueue_v2");
    __publicField(this, "idCounter", 0);
    this.loadFromStorage();
  }
  loadFromStorage() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.queue = parsed;
        this.notifyObservers();
      }
    } catch (e) {
      console.error("Error cargando cola de descargas múltiples:", e);
    }
  }
  persistQueue() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
    } catch (e) {
      console.error("Error guardando cola de descargas múltiples:", e);
    }
  }
  notifyObservers() {
    this.observers.forEach((observer) => observer([...this.queue]));
  }
  subscribe(callback) {
    this.observers.push(callback);
    callback([...this.queue]);
    return () => {
      this.observers = this.observers.filter((obs) => obs !== callback);
    };
  }
  addToQueue(items) {
    const newItems = items.map((item) => {
      this.idCounter++;
      return {
        ...item,
        id: `${item.originalId}-${Date.now()}-${this.idCounter}-${Math.random().toString(36).substr(2, 9)}`,
        // ID único para React
        originalId: item.originalId,
        // ID original del contenido
        status: "pending",
        enabled: true
      };
    });
    this.queue = [...this.queue, ...newItems];
    this.persistQueue();
    this.notifyObservers();
    return newItems;
  }
  removeFromQueue(id) {
    this.queue = this.queue.filter((item) => item.id !== id);
    this.persistQueue();
    this.notifyObservers();
  }
  toggleItemEnabled(id) {
    this.queue = this.queue.map(
      (item) => item.id === id ? { ...item, enabled: !item.enabled } : item
    );
    this.persistQueue();
    this.notifyObservers();
  }
  clearCompleted() {
    this.queue = this.queue.filter((item) => item.status !== "completed");
    this.persistQueue();
    this.notifyObservers();
  }
  clearErrors() {
    this.queue = this.queue.filter((item) => item.status !== "error");
    this.persistQueue();
    this.notifyObservers();
  }
  clearCompletedAndErrors() {
    this.queue = this.queue.filter((item) => item.status !== "completed" && item.status !== "error");
    this.persistQueue();
    this.notifyObservers();
  }
  getQueue() {
    return [...this.queue];
  }
  getEnabledItems() {
    return this.queue.filter((item) => item.enabled && item.status === "pending");
  }
  updateItemStatus(id, status, progress, error) {
    this.queue = this.queue.map(
      (item) => item.id === id ? { ...item, status, progress, error } : item
    );
    this.persistQueue();
    this.notifyObservers();
  }
}
const multipleDownloadQueueService = new MultipleDownloadQueueService();
const multipleDownloadQueueService$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  multipleDownloadQueueService
}, Symbol.toStringTag, { value: "Module" }));
const ContentDownloadProgressWidget = ({ position = "top-left", onShowHistory }) => {
  const [activeDownloads, setActiveDownloads] = reactExports.useState([]);
  const [completedDownloads, setCompletedDownloads] = reactExports.useState([]);
  const [isExpanded, setIsExpanded] = reactExports.useState(false);
  const [activeTab, setActiveTab] = reactExports.useState("single");
  const [multipleQueue, setMultipleQueue] = reactExports.useState([]);
  reactExports.useEffect(() => {
    const unsubscribe = downloadService.subscribe((downloads) => {
      setTimeout(() => {
        console.log("Total descargas recibidas:", downloads.length);
        const contentDownloads = downloads.filter((d) => {
          var _a, _b;
          const nameLower = d.name.toLowerCase();
          const urlLower = ((_a = d.url) == null ? void 0 : _a.toLowerCase()) || "";
          const idLower = ((_b = d.id) == null ? void 0 : _b.toLowerCase()) || "";
          const isContentDownload = idLower.startsWith("content-") || idLower.startsWith("multiple-");
          const hasContentUrl = urlLower.startsWith("content://");
          const hasContentKeywords = nameLower.includes(".jar") && (nameLower.includes("mod") || nameLower.includes("fabric") || nameLower.includes("forge") || nameLower.includes("quilt") || nameLower.includes("neoforge")) || nameLower.includes("resourcepack") || nameLower.includes("resource-pack") || nameLower.includes("texture") || nameLower.includes("shader") || nameLower.includes("datapack") || nameLower.includes("data-pack") || urlLower.includes("/mod/") || urlLower.includes("/resourcepack/") || urlLower.includes("/shader/") || urlLower.includes("/datapack/") || urlLower.includes("modrinth.com") || urlLower.includes("curseforge.com");
          return isContentDownload || hasContentUrl || hasContentKeywords;
        });
        console.log("Descargas de contenido filtradas:", contentDownloads.length, contentDownloads.map((d) => ({ id: d.id, name: d.name, status: d.status })));
        const active = contentDownloads.filter(
          (d) => d.status === "downloading" || d.status === "pending" || d.status === "paused"
        );
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1e3;
        const completed = contentDownloads.filter(
          (d) => d.status === "completed" && d.endTime && d.endTime > oneDayAgo
        );
        setActiveDownloads(active);
        setCompletedDownloads(completed);
      }, 0);
    });
    return () => {
      unsubscribe();
    };
  }, []);
  reactExports.useEffect(() => {
    const unsubscribe = multipleDownloadQueueService.subscribe((queue) => {
      setMultipleQueue(queue);
    });
    return () => {
      unsubscribe();
    };
  }, []);
  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4"
  }[position];
  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };
  const formatSpeed = (bytesPerSecond) => {
    if (bytesPerSecond === 0) return "0 B/s";
    const k = 1024;
    const sizes = ["B/s", "KB/s", "MB/s", "GB/s"];
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
    return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };
  const handleOpenFolder = async (download) => {
    var _a, _b, _c, _d;
    if (download.path) {
      try {
        if ((_b = (_a = window.api) == null ? void 0 : _a.shell) == null ? void 0 : _b.showItemInFolder) {
          await window.api.shell.showItemInFolder(download.path);
        } else if ((_d = (_c = window.api) == null ? void 0 : _c.shell) == null ? void 0 : _d.openPath) {
          const dirPath = download.path.substring(0, download.path.lastIndexOf("\\") || download.path.lastIndexOf("/"));
          await window.api.shell.openPath(dirPath);
        } else {
          console.warn("Shell API not available to open folder");
        }
      } catch (error) {
        console.error("Error opening folder:", error);
      }
    }
  };
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: `fixed z-[100] ${positionClasses} transition-all duration-300`, children: [
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
      "div",
      {
        className: "relative",
        onClick: () => setIsExpanded(!isExpanded),
        children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("button", { className: "relative w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg flex items-center justify-center hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 group", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "svg",
            {
              className: "w-6 h-6 text-white",
              fill: "none",
              stroke: "currentColor",
              viewBox: "0 0 24 24",
              xmlns: "http://www.w3.org/2000/svg",
              children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                "path",
                {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  strokeWidth: "2",
                  d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                },
                void 0,
                false,
                {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                  lineNumber: 183,
                  columnNumber: 13
                },
                void 0
              )
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
              lineNumber: 176,
              columnNumber: 11
            },
            void 0
          ),
          activeDownloads.length > 0 && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center", children: activeDownloads.length }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
            lineNumber: 193,
            columnNumber: 13
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
          lineNumber: 174,
          columnNumber: 9
        }, void 0)
      },
      void 0,
      false,
      {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
        lineNumber: 170,
        columnNumber: 7
      },
      void 0
    ),
    isExpanded && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: `absolute mt-2 ${position === "top-left" ? "left-0" : "-left-96"} w-96 bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700/80 overflow-hidden z-50`, children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-4 border-b border-gray-700/50", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-center", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-semibold text-white", children: "Progreso de Descargas" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
            lineNumber: 206,
            columnNumber: 15
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-2", children: [
            onShowHistory && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "button",
              {
                onClick: () => {
                  setIsExpanded(false);
                  onShowHistory();
                },
                className: "p-1.5 text-gray-400 hover:text-white transition-colors",
                title: "Ver historial",
                children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                  lineNumber: 218,
                  columnNumber: 23
                }, void 0) }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                  lineNumber: 217,
                  columnNumber: 21
                }, void 0)
              },
              void 0,
              false,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                lineNumber: 209,
                columnNumber: 19
              },
              void 0
            ),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "button",
              {
                onClick: () => setIsExpanded(false),
                className: "text-gray-400 hover:text-white",
                children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M6 18L18 6M6 6l12 12" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                  lineNumber: 227,
                  columnNumber: 21
                }, void 0) }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                  lineNumber: 226,
                  columnNumber: 19
                }, void 0)
              },
              void 0,
              false,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                lineNumber: 222,
                columnNumber: 17
              },
              void 0
            )
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
            lineNumber: 207,
            columnNumber: 15
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
          lineNumber: 205,
          columnNumber: 13
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-3 flex space-x-1", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              className: `flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === "single" ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-black shadow-sm" : "bg-gray-700/70 text-gray-300"}`,
              onClick: () => setActiveTab("single"),
              children: "Descargas Complemento"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
              lineNumber: 235,
              columnNumber: 15
            },
            void 0
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              className: `flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === "multiple" ? "bg-gradient-to-r from-purple-600 to-pink-600 text-black shadow-sm" : "bg-gray-700/70 text-gray-300"}`,
              onClick: () => setActiveTab("multiple"),
              children: "Descargas Múltiples"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
              lineNumber: 245,
              columnNumber: 15
            },
            void 0
          )
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
          lineNumber: 234,
          columnNumber: 13
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
        lineNumber: 204,
        columnNumber: 11
      }, void 0),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "max-h-[500px] overflow-y-auto", children: activeTab === "single" ? (
        /* Single Downloads Tab */
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "divide-y divide-gray-700/50", children: activeDownloads.length === 0 && completedDownloads.length === 0 ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-6 text-center text-gray-400", children: "No hay descargas activas o completadas" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
          lineNumber: 264,
          columnNumber: 19
        }, void 0) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(jsxDevRuntimeExports.Fragment, { children: [
          activeDownloads.map((download, index) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-3 hover:bg-gray-700/50 transition-colors", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-start justify-between", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h4", { className: "font-medium text-white text-sm truncate", children: download.name }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
              lineNumber: 274,
              columnNumber: 29
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-1", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-full bg-gray-700 rounded-full h-2", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                "div",
                {
                  className: "bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300 ease-out",
                  style: { width: `${download.progress}%` }
                },
                void 0,
                false,
                {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                  lineNumber: 279,
                  columnNumber: 33
                },
                void 0
              ) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                lineNumber: 278,
                columnNumber: 31
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between text-xs text-gray-400 mt-1", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: [
                  Math.round(download.progress),
                  "%"
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                  lineNumber: 285,
                  columnNumber: 33
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: download.downloadedBytes > 0 && download.totalBytes > 0 ? `${formatBytes(download.downloadedBytes)} / ${formatBytes(download.totalBytes)}` : `${formatBytes(download.downloadedBytes)}` }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                  lineNumber: 286,
                  columnNumber: 33
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                lineNumber: 284,
                columnNumber: 31
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
              lineNumber: 277,
              columnNumber: 29
            }, void 0),
            download.speed > 0 && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-500 mt-1", children: formatSpeed(download.speed) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
              lineNumber: 294,
              columnNumber: 31
            }, void 0)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
            lineNumber: 273,
            columnNumber: 27
          }, void 0) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
            lineNumber: 272,
            columnNumber: 25
          }, void 0) }, `active-${download.id}-${index}`, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
            lineNumber: 271,
            columnNumber: 23
          }, void 0)),
          completedDownloads.map((download, index) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-3 hover:bg-gray-700/50 transition-colors border-t border-gray-700/50", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-start justify-between gap-2", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-2 mb-1", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5 text-green-400 flex-shrink-0", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2.5, d: "M5 13l4 4L19 7" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                  lineNumber: 311,
                  columnNumber: 33
                }, void 0) }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                  lineNumber: 310,
                  columnNumber: 31
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h4", { className: "font-medium text-green-400 text-sm truncate", children: download.name }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                  lineNumber: 313,
                  columnNumber: 31
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                lineNumber: 308,
                columnNumber: 29
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-1", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-full bg-gray-700 rounded-full h-2", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  "div",
                  {
                    className: "bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-300 ease-out",
                    style: { width: "100%" }
                  },
                  void 0,
                  false,
                  {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                    lineNumber: 319,
                    columnNumber: 33
                  },
                  void 0
                ) }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                  lineNumber: 318,
                  columnNumber: 31
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-400 mt-1", children: "Completado" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                  lineNumber: 324,
                  columnNumber: 31
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                lineNumber: 317,
                columnNumber: 29
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
              lineNumber: 307,
              columnNumber: 27
            }, void 0),
            download.path && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "button",
              {
                onClick: () => handleOpenFolder(download),
                className: "ml-2 p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg text-white hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex-shrink-0",
                title: "Abrir carpeta",
                children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                  lineNumber: 338,
                  columnNumber: 33
                }, void 0) }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                  lineNumber: 337,
                  columnNumber: 31
                }, void 0)
              },
              void 0,
              false,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                lineNumber: 332,
                columnNumber: 29
              },
              void 0
            )
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
            lineNumber: 306,
            columnNumber: 25
          }, void 0) }, `completed-${download.id}-${index}`, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
            lineNumber: 305,
            columnNumber: 23
          }, void 0))
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
          lineNumber: 268,
          columnNumber: 19
        }, void 0) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
          lineNumber: 262,
          columnNumber: 15
        }, void 0)
      ) : (
        /* Multiple Downloads Tab */
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "divide-y divide-gray-700/50", children: multipleQueue.length === 0 ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-6 text-center text-gray-400", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-4xl mb-3", children: "📦" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
            lineNumber: 353,
            columnNumber: 21
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "font-medium text-white mb-2", children: "Descargas Múltiples" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
            lineNumber: 354,
            columnNumber: 21
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-sm", children: [
            "No hay descargas en cola.",
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("br", {}, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
              lineNumber: 356,
              columnNumber: 48
            }, void 0),
            "Agrega elementos desde la vista de contenido."
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
            lineNumber: 355,
            columnNumber: 21
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
          lineNumber: 352,
          columnNumber: 19
        }, void 0) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(jsxDevRuntimeExports.Fragment, { children: multipleQueue.map((item, index) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "div",
          {
            className: `p-3 hover:bg-gray-700/50 transition-colors ${!item.enabled ? "opacity-50" : ""}`,
            children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-start justify-between gap-2", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-start gap-2 flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: `mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${item.enabled ? "bg-gradient-to-r from-green-500 to-emerald-500 border-green-400" : "bg-gray-600 border-gray-500"}`, children: item.enabled && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-2.5 h-2.5 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 3, d: "M5 13l4 4L19 7" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                lineNumber: 378,
                columnNumber: 35
              }, void 0) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                lineNumber: 377,
                columnNumber: 33
              }, void 0) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                lineNumber: 371,
                columnNumber: 29
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h4", { className: `font-medium text-sm truncate ${item.status === "completed" ? "text-green-400" : item.status === "downloading" ? "text-blue-400" : item.status === "error" ? "text-red-400" : item.enabled ? "text-white" : "text-gray-500"}`, children: item.name }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                    lineNumber: 384,
                    columnNumber: 33
                  }, void 0),
                  item.status === "completed" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-4 h-4 text-green-400 flex-shrink-0", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2.5, d: "M5 13l4 4L19 7" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                    lineNumber: 399,
                    columnNumber: 37
                  }, void 0) }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                    lineNumber: 398,
                    columnNumber: 35
                  }, void 0)
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                  lineNumber: 383,
                  columnNumber: 31
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex flex-wrap gap-1.5 mt-1 text-xs text-gray-400", children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: item.version }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                    lineNumber: 404,
                    columnNumber: 33
                  }, void 0),
                  item.loader && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: [
                    "• ",
                    item.loader
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                    lineNumber: 405,
                    columnNumber: 49
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: [
                    "• ",
                    item.platform
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                    lineNumber: 406,
                    columnNumber: 33
                  }, void 0)
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                  lineNumber: 403,
                  columnNumber: 31
                }, void 0),
                item.status === "downloading" && item.progress !== void 0 && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-2", children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-full bg-gray-700 rounded-full h-1.5", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                    "div",
                    {
                      className: "bg-gradient-to-r from-blue-500 to-indigo-600 h-1.5 rounded-full transition-all duration-300 ease-out",
                      style: { width: `${item.progress}%` }
                    },
                    void 0,
                    false,
                    {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                      lineNumber: 411,
                      columnNumber: 37
                    },
                    void 0
                  ) }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                    lineNumber: 410,
                    columnNumber: 35
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-500 mt-0.5", children: [
                    Math.round(item.progress),
                    "%"
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                    lineNumber: 416,
                    columnNumber: 35
                  }, void 0)
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                  lineNumber: 409,
                  columnNumber: 33
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
                lineNumber: 382,
                columnNumber: 29
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
              lineNumber: 370,
              columnNumber: 27
            }, void 0) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
              lineNumber: 369,
              columnNumber: 25
            }, void 0)
          },
          `multiple-${item.id}-${index}`,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
            lineNumber: 363,
            columnNumber: 23
          },
          void 0
        )) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
          lineNumber: 361,
          columnNumber: 19
        }, void 0) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
          lineNumber: 350,
          columnNumber: 15
        }, void 0)
      ) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
        lineNumber: 259,
        columnNumber: 11
      }, void 0),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-3 bg-gray-900/50 border-t border-gray-700/50 text-xs text-gray-400", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: [
          activeDownloads.length,
          " activas"
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
          lineNumber: 435,
          columnNumber: 15
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: [
          completedDownloads.length,
          " completadas"
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
          lineNumber: 436,
          columnNumber: 15
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
        lineNumber: 434,
        columnNumber: 13
      }, void 0) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
        lineNumber: 433,
        columnNumber: 11
      }, void 0)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
      lineNumber: 202,
      columnNumber: 9
    }, void 0)
  ] }, void 0, true, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ContentDownloadProgressWidget.tsx",
    lineNumber: 168,
    columnNumber: 5
  }, void 0);
};
const ModernContentDetail = ({ selectedContent }) => {
  var _a, _b, _c, _d, _e, _f;
  const [activeTab, setActiveTab] = reactExports.useState("description");
  const [contentDetails, setContentDetails] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  reactExports.useEffect(() => {
    const fetchDetails = async () => {
      var _a2, _b2;
      setLoading(true);
      setError(null);
      try {
        if (selectedContent.platform === "modrinth") {
          const project = await modrinthAPI.getProject(selectedContent.id);
          const versions = await modrinthAPI.getProjectVersions(selectedContent.id);
          setContentDetails({
            description: project.description || project.body || selectedContent.description,
            screenshots: ((_a2 = project.gallery) == null ? void 0 : _a2.map((ss) => ({
              url: ss.url,
              title: ss.title || `Screenshot ${ss.id}`
            }))) || [],
            changelog: project.changelog || "",
            // El changelog real del proyecto
            versions: versions.map((version) => ({
              id: version.id,
              name: version.version_number || version.name,
              date: version.date_published || version.updated,
              type: version.version_type || "release",
              files: version.files || [],
              game_versions: version.game_versions || [],
              loaders: version.loaders || []
            }))
          });
        } else if (selectedContent.platform === "curseforge") {
          const modId = parseInt(selectedContent.id, 10);
          if (isNaN(modId)) {
            throw new Error("ID de mod inválido para CurseForge");
          }
          const mod = await curseForgeAPI.getMod(modId);
          const modFiles = await curseForgeAPI.getModFiles(modId);
          const allGameVersions = /* @__PURE__ */ new Set();
          modFiles.forEach((file) => {
            if (file.gameVersions && Array.isArray(file.gameVersions)) {
              file.gameVersions.forEach((version) => allGameVersions.add(version));
            }
          });
          const gameVersionsArray = Array.from(allGameVersions);
          const modDependenciesInfo = await curseForgeAPI.getModDependencies(modId);
          const modDependencies = modDependenciesInfo.dependencies || [];
          const processedRelations = modDependencies.map((dep) => ({
            id: dep.modId,
            name: dep.name || `Dependencia ${dep.modId}`,
            type: dep.type,
            // 1 = EmbeddedLibrary, 2 = OptionalDependency, 3 = RequiredDependency, 4 = Tool, 5 = Incompatible, 6 = Include
            addonId: dep.modId,
            mandatory: dep.mandatory || false
          }));
          setContentDetails({
            description: mod.summary || selectedContent.description,
            screenshots: ((_b2 = mod.screenshots) == null ? void 0 : _b2.map((ss) => ({
              url: ss.url,
              title: ss.title || `Imagen ${ss.id}`
            }))) || [],
            minecraftVersions: gameVersionsArray,
            // Agregar las versiones de Minecraft desde los archivos
            comments: [],
            // CurseForge tiene una API separada para comentarios
            files: (modFiles == null ? void 0 : modFiles.map((file) => {
              var _a3;
              return {
                id: file.id,
                name: file.displayName || file.fileName,
                version: ((_a3 = file.gameVersions) == null ? void 0 : _a3.join(", ")) || "N/A",
                size: `${(file.fileLength / (1024 * 1024)).toFixed(2)} MB`,
                releaseType: file.releaseType
                // 1 = Release, 2 = Beta, 3 = Alpha
              };
            })) || [],
            relations: processedRelations
          });
        }
      } catch (err) {
        setError("Error al cargar los detalles del contenido");
        console.error("Error fetching content details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [selectedContent.id, selectedContent.platform]);
  const modrinthTabs = [
    { id: "description", label: "Descripción" },
    { id: "gallery", label: "Galería" },
    { id: "changelog", label: "Registro de cambios" },
    { id: "versions", label: "Versiones" }
  ];
  const curseforgeTabs = [
    { id: "description", label: "Descripción" },
    { id: "comments", label: "Comentarios" },
    { id: "files", label: "Archivos" },
    { id: "gallery", label: "Galería" },
    { id: "relations", label: "Relaciones" }
  ];
  const tabs = selectedContent.platform === "modrinth" ? modrinthTabs : curseforgeTabs;
  if (loading) {
    return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-center items-center h-64", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
      lineNumber: 138,
      columnNumber: 11
    }, void 0) }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
      lineNumber: 137,
      columnNumber: 9
    }, void 0) }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
      lineNumber: 136,
      columnNumber: 7
    }, void 0);
  }
  if (error) {
    return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-red-500 text-center py-8", children: error }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
      lineNumber: 147,
      columnNumber: 9
    }, void 0) }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
      lineNumber: 146,
      columnNumber: 7
    }, void 0);
  }
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex flex-wrap gap-2 border-b border-gray-700/50 pb-4", children: tabs.map((tab) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
      "button",
      {
        className: `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 relative ${activeTab === tab.id ? "text-blue-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-400" : "text-gray-400 hover:text-gray-200"}`,
        onClick: () => setActiveTab(tab.id),
        children: tab.label
      },
      tab.id,
      false,
      {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
        lineNumber: 157,
        columnNumber: 11
      },
      void 0
    )) }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
      lineNumber: 155,
      columnNumber: 7
    }, void 0),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6", children: [
      activeTab === "description" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "prose prose-invert max-w-none", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-xl font-bold text-white mb-4", children: "Descripción" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
          lineNumber: 175,
          columnNumber: 13
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "div",
          {
            className: "text-gray-300 leading-relaxed",
            dangerouslySetInnerHTML: {
              __html: ((_a = contentDetails == null ? void 0 : contentDetails.description) == null ? void 0 : _a.replace(/\n/g, "<br>")) || selectedContent.description || "No hay descripción disponible para este contenido."
            }
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
            lineNumber: 176,
            columnNumber: 13
          },
          void 0
        )
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
        lineNumber: 174,
        columnNumber: 11
      }, void 0),
      activeTab === "gallery" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-xl font-bold text-white mb-4", children: "Galería de Imágenes" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
          lineNumber: 187,
          columnNumber: 13
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4", children: [
          ((contentDetails == null ? void 0 : contentDetails.screenshots) || []).map((img, idx) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "aspect-video bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl overflow-hidden border border-gray-600/50 shadow-lg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "img",
            {
              src: img.url,
              alt: img.title || `Galería ${idx + 1}`,
              className: "w-full h-full object-cover transition-transform duration-300 hover:scale-105",
              onError: (e) => {
                const target = e.target;
                target.src = selectedContent.imageUrl;
              }
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
              lineNumber: 191,
              columnNumber: 19
            },
            void 0
          ) }, idx, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
            lineNumber: 190,
            columnNumber: 17
          }, void 0)),
          (((_b = contentDetails == null ? void 0 : contentDetails.screenshots) == null ? void 0 : _b.length) === 0 || !(contentDetails == null ? void 0 : contentDetails.screenshots)) && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "col-span-full text-center text-gray-400 py-10", children: "No hay imágenes disponibles en la galería." }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
            lineNumber: 203,
            columnNumber: 17
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
          lineNumber: 188,
          columnNumber: 13
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
        lineNumber: 186,
        columnNumber: 11
      }, void 0),
      activeTab === "changelog" && selectedContent.platform === "modrinth" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-xl font-bold text-white mb-4", children: "Registro de Cambios" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
          lineNumber: 213,
          columnNumber: 13
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "div",
          {
            className: "text-gray-300 prose prose-invert max-w-none",
            dangerouslySetInnerHTML: {
              __html: ((_c = contentDetails == null ? void 0 : contentDetails.changelog) == null ? void 0 : _c.replace(/\n/g, "<br>").replace(/##/g, '<h4 class="text-lg font-bold text-white mt-4">').replace(/\n-/g, '</h4><ul class="list-disc list-inside ml-4"><li>')) + "</li></ul>" || "No hay registro de cambios disponible."
            }
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
            lineNumber: 214,
            columnNumber: 13
          },
          void 0
        )
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
        lineNumber: 212,
        columnNumber: 11
      }, void 0),
      activeTab === "versions" && selectedContent.platform === "modrinth" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-xl font-bold text-white mb-4", children: "Versiones Disponibles" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
          lineNumber: 225,
          columnNumber: 13
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-3", children: [
          ((contentDetails == null ? void 0 : contentDetails.versions) || []).map((version, idx) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-4 bg-gray-700/30 rounded-xl border border-gray-600/30 hover:bg-gray-700/50 transition-colors", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-center", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "font-bold text-white", children: version.name }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
                lineNumber: 230,
                columnNumber: 21
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-sm text-blue-400 bg-blue-400/10 px-2 py-1 rounded capitalize", children: version.type }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
                lineNumber: 231,
                columnNumber: 21
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
              lineNumber: 229,
              columnNumber: 19
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-sm text-gray-400 mt-1", children: [
              "Publicado: ",
              new Date(version.date).toLocaleDateString("es-ES")
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
              lineNumber: 235,
              columnNumber: 19
            }, void 0)
          ] }, idx, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
            lineNumber: 228,
            columnNumber: 17
          }, void 0)),
          (((_d = contentDetails == null ? void 0 : contentDetails.versions) == null ? void 0 : _d.length) === 0 || !contentDetails.versions) && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-gray-400 text-center py-4", children: "No hay versiones disponibles." }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
            lineNumber: 241,
            columnNumber: 17
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
          lineNumber: 226,
          columnNumber: 13
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
        lineNumber: 224,
        columnNumber: 11
      }, void 0),
      activeTab === "comments" && selectedContent.platform === "curseforge" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-xl font-bold text-white mb-4", children: "Comentarios" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
          lineNumber: 251,
          columnNumber: 13
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-4", children: [
          ((contentDetails == null ? void 0 : contentDetails.comments) || []).map((comment, idx) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-4 bg-gray-700/30 rounded-xl border border-gray-600/30", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center mb-2", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold mr-3", children: idx + 1 }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
                lineNumber: 256,
                columnNumber: 21
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "font-medium text-white", children: comment.username }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
                  lineNumber: 260,
                  columnNumber: 23
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-400", children: new Date(comment.date).toLocaleDateString("es-ES") }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
                  lineNumber: 261,
                  columnNumber: 23
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
                lineNumber: 259,
                columnNumber: 21
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
              lineNumber: 255,
              columnNumber: 19
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-gray-300 ml-11", children: comment.content }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
              lineNumber: 264,
              columnNumber: 19
            }, void 0)
          ] }, idx, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
            lineNumber: 254,
            columnNumber: 17
          }, void 0)),
          (((_e = contentDetails == null ? void 0 : contentDetails.comments) == null ? void 0 : _e.length) === 0 || !contentDetails.comments) && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-gray-400 text-center py-4", children: "No hay comentarios disponibles." }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
            lineNumber: 268,
            columnNumber: 17
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
          lineNumber: 252,
          columnNumber: 13
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
        lineNumber: 250,
        columnNumber: 11
      }, void 0),
      activeTab === "files" && selectedContent.platform === "curseforge" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-xl font-bold text-white mb-4", children: "Archivos Disponibles" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
          lineNumber: 278,
          columnNumber: 13
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-3", children: [
          ((contentDetails == null ? void 0 : contentDetails.files) || []).map((file, idx) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-4 bg-gray-700/30 rounded-xl border border-gray-600/30 hover:bg-gray-700/50 transition-colors", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-center", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "font-bold text-white", children: file.name }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
                lineNumber: 284,
                columnNumber: 23
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-sm text-gray-400", children: [
                "Versión: ",
                file.version,
                " · Tamaño: ",
                file.size
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
                lineNumber: 285,
                columnNumber: 23
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
              lineNumber: 283,
              columnNumber: 21
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("button", { className: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-all", children: "Descargar" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
              lineNumber: 287,
              columnNumber: 21
            }, void 0)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
            lineNumber: 282,
            columnNumber: 19
          }, void 0) }, idx, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
            lineNumber: 281,
            columnNumber: 17
          }, void 0)),
          (((_f = contentDetails == null ? void 0 : contentDetails.files) == null ? void 0 : _f.length) === 0 || !contentDetails.files) && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-gray-400 text-center py-4", children: "No hay archivos disponibles." }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
            lineNumber: 294,
            columnNumber: 17
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
          lineNumber: 279,
          columnNumber: 13
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
        lineNumber: 277,
        columnNumber: 11
      }, void 0),
      activeTab === "relations" && selectedContent.platform === "curseforge" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-xl font-bold text-white mb-4", children: "Relaciones" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
          lineNumber: 304,
          columnNumber: 13
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h4", { className: "font-bold text-blue-400 mb-3", children: "Dependencias Requeridas" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
              lineNumber: 307,
              columnNumber: 17
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-2", children: [
              ((contentDetails == null ? void 0 : contentDetails.relations) || []).filter((rel) => rel.type === 3).map((dep, idx) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-3 bg-gray-700/30 rounded-lg border border-gray-600/30", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "font-medium text-white", children: dep.name }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
                  lineNumber: 311,
                  columnNumber: 23
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-sm text-gray-400", children: dep.type === 1 ? "Librería Incrustada" : dep.type === 2 ? "Dependencia Opcional" : dep.type === 3 ? "Dependencia Requerida" : dep.type === 4 ? "Herramienta" : dep.type === 5 ? "Incompatible" : dep.type === 6 ? "Incluido" : "Dependencia" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
                  lineNumber: 312,
                  columnNumber: 23
                }, void 0)
              ] }, idx, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
                lineNumber: 310,
                columnNumber: 21
              }, void 0)),
              (contentDetails == null ? void 0 : contentDetails.relations) && contentDetails.relations.filter((rel) => rel.type === 3).length === 0 && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-gray-400 text-center py-2", children: "No hay dependencias requeridas." }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
                lineNumber: 323,
                columnNumber: 21
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
              lineNumber: 308,
              columnNumber: 17
            }, void 0)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
            lineNumber: 306,
            columnNumber: 15
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h4", { className: "font-bold text-emerald-400 mb-3", children: "Dependencias Opcionales" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
              lineNumber: 330,
              columnNumber: 17
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-2", children: [
              ((contentDetails == null ? void 0 : contentDetails.relations) || []).filter((rel) => rel.type === 2).map((sug, idx) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-3 bg-gray-700/30 rounded-lg border border-gray-600/30", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "font-medium text-white", children: sug.name }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
                  lineNumber: 334,
                  columnNumber: 23
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-sm text-gray-400", children: sug.type === 1 ? "Librería Incrustada" : sug.type === 2 ? "Dependencia Opcional" : sug.type === 3 ? "Dependencia Requerida" : sug.type === 4 ? "Herramienta" : sug.type === 5 ? "Incompatible" : sug.type === 6 ? "Incluido" : "Sugerencia" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
                  lineNumber: 335,
                  columnNumber: 23
                }, void 0)
              ] }, idx, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
                lineNumber: 333,
                columnNumber: 21
              }, void 0)),
              (contentDetails == null ? void 0 : contentDetails.relations) && contentDetails.relations.filter((rel) => rel.type === 2).length === 0 && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-gray-400 text-center py-2", children: "No hay dependencias opcionales." }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
                lineNumber: 346,
                columnNumber: 21
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
              lineNumber: 331,
              columnNumber: 17
            }, void 0)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
            lineNumber: 329,
            columnNumber: 15
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h4", { className: "font-bold text-amber-400 mb-3", children: "Otras Relaciones" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
              lineNumber: 353,
              columnNumber: 17
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-2", children: [
              ((contentDetails == null ? void 0 : contentDetails.relations) || []).filter((rel) => ![2, 3].includes(rel.type)).map((other, idx) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-3 bg-gray-700/30 rounded-lg border border-gray-600/30", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "font-medium text-white", children: other.name }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
                  lineNumber: 357,
                  columnNumber: 23
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-sm text-gray-400", children: other.type === 1 ? "Librería Incrustada" : other.type === 4 ? "Herramienta" : other.type === 5 ? "Incompatible" : other.type === 6 ? "Incluido" : "Relación" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
                  lineNumber: 358,
                  columnNumber: 23
                }, void 0)
              ] }, idx, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
                lineNumber: 356,
                columnNumber: 21
              }, void 0)),
              (contentDetails == null ? void 0 : contentDetails.relations) && contentDetails.relations.filter((rel) => ![2, 3].includes(rel.type)).length === 0 && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-gray-400 text-center py-2", children: "No hay otras relaciones." }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
                lineNumber: 367,
                columnNumber: 21
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
              lineNumber: 354,
              columnNumber: 17
            }, void 0)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
            lineNumber: 352,
            columnNumber: 15
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
          lineNumber: 305,
          columnNumber: 13
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
        lineNumber: 303,
        columnNumber: 11
      }, void 0)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
      lineNumber: 172,
      columnNumber: 7
    }, void 0)
  ] }, void 0, true, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ModernContentDetail.tsx",
    lineNumber: 153,
    columnNumber: 5
  }, void 0);
};
const Tooltip = ({
  children,
  content,
  position = "top",
  delay = 500
}) => {
  const [isVisible, setIsVisible] = reactExports.useState(false);
  const [timeoutId, setTimeoutId] = reactExports.useState(null);
  const showTooltip = () => {
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };
  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setIsVisible(false);
  };
  const positionClasses = {
    top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
    right: "top-1/2 left-full transform -translate-y-1/2 ml-2",
    bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
    left: "top-1/2 right-full transform -translate-y-1/2 mr-2"
  }[position];
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "relative inline-block", children: [
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
      "div",
      {
        onMouseEnter: showTooltip,
        onMouseLeave: hideTooltip,
        onFocus: showTooltip,
        onBlur: hideTooltip,
        className: "cursor-pointer",
        children
      },
      void 0,
      false,
      {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/Tooltip.tsx",
        lineNumber: 43,
        columnNumber: 7
      },
      void 0
    ),
    isVisible && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: `absolute z-50 ${positionClasses} w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg border border-gray-700/80`, children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "relative", children: [
      content,
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: `absolute w-0 h-0 border-8 ${position === "top" ? "border-t-gray-900 border-r-gray-900/0 border-l-gray-900/0 border-b-gray-900/0 top-full left-1/2 transform -translate-x-1/2" : position === "bottom" ? "border-b-gray-900 border-r-gray-900/0 border-l-gray-900/0 border-t-gray-900/0 bottom-full left-1/2 transform -translate-x-1/2" : position === "left" ? "border-l-gray-900 border-t-gray-900/0 border-b-gray-900/0 border-r-gray-900/0 right-full top-1/2 transform -translate-y-1/2" : "border-r-gray-900 border-t-gray-900/0 border-b-gray-900/0 border-l-gray-900/0 left-full top-1/2 transform -translate-y-1/2"}` }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/Tooltip.tsx",
        lineNumber: 56,
        columnNumber: 13
      }, void 0)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/Tooltip.tsx",
      lineNumber: 54,
      columnNumber: 11
    }, void 0) }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/Tooltip.tsx",
      lineNumber: 53,
      columnNumber: 9
    }, void 0)
  ] }, void 0, true, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/Tooltip.tsx",
    lineNumber: 42,
    columnNumber: 5
  }, void 0);
};
const DownloadSelectionModal = ({
  isOpen,
  onClose,
  onSingleDownload,
  onMultipleDownload
}) => {
  if (!isOpen) return null;
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-700/80 shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-6", children: [
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-center mb-6", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h2", { className: "text-2xl font-bold text-white", children: "Seleccionar Tipo de Descarga" }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadSelectionModal.tsx",
        lineNumber: 24,
        columnNumber: 13
      }, void 0),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
        "button",
        {
          onClick: onClose,
          className: "text-gray-400 hover:text-white transition-colors",
          children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadSelectionModal.tsx",
            lineNumber: 30,
            columnNumber: 17
          }, void 0) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadSelectionModal.tsx",
            lineNumber: 29,
            columnNumber: 15
          }, void 0)
        },
        void 0,
        false,
        {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadSelectionModal.tsx",
          lineNumber: 25,
          columnNumber: 13
        },
        void 0
      )
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadSelectionModal.tsx",
      lineNumber: 23,
      columnNumber: 11
    }, void 0),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
        "button",
        {
          onClick: () => {
            onSingleDownload();
            onClose();
          },
          className: "w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30",
          children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-center", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5 mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadSelectionModal.tsx",
                lineNumber: 45,
                columnNumber: 19
              }, void 0) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadSelectionModal.tsx",
                lineNumber: 44,
                columnNumber: 17
              }, void 0),
              "Descarga Individual"
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadSelectionModal.tsx",
              lineNumber: 43,
              columnNumber: 15
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-sm text-blue-200 mt-1", children: "Descargar un solo contenido con configuración específica" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadSelectionModal.tsx",
              lineNumber: 49,
              columnNumber: 15
            }, void 0)
          ]
        },
        void 0,
        true,
        {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadSelectionModal.tsx",
          lineNumber: 36,
          columnNumber: 13
        },
        void 0
      ),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
        "button",
        {
          onClick: () => {
            onMultipleDownload();
            onClose();
          },
          className: "w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30",
          children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-center", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5 mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadSelectionModal.tsx",
                lineNumber: 61,
                columnNumber: 19
              }, void 0) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadSelectionModal.tsx",
                lineNumber: 60,
                columnNumber: 17
              }, void 0),
              "Descarga Múltiple"
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadSelectionModal.tsx",
              lineNumber: 59,
              columnNumber: 15
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-sm text-purple-200 mt-1", children: "Agregar múltiples contenidos a una cola de descargas" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadSelectionModal.tsx",
              lineNumber: 65,
              columnNumber: 15
            }, void 0)
          ]
        },
        void 0,
        true,
        {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadSelectionModal.tsx",
          lineNumber: 52,
          columnNumber: 13
        },
        void 0
      )
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadSelectionModal.tsx",
      lineNumber: 35,
      columnNumber: 11
    }, void 0),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-6 text-center text-sm text-gray-400", children: "Selecciona el modo de descarga que mejor se adapte a tus necesidades" }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadSelectionModal.tsx",
      lineNumber: 69,
      columnNumber: 11
    }, void 0)
  ] }, void 0, true, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadSelectionModal.tsx",
    lineNumber: 22,
    columnNumber: 9
  }, void 0) }, void 0, false, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadSelectionModal.tsx",
    lineNumber: 21,
    columnNumber: 7
  }, void 0) }, void 0, false, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadSelectionModal.tsx",
    lineNumber: 20,
    columnNumber: 5
  }, void 0);
};
const SingleDownloadModal = ({
  isOpen,
  onClose,
  contentItem,
  availableVersions: propsAvailableVersions = [],
  availableLoaders: propsAvailableLoaders = [],
  onDownloadStart
}) => {
  const [selectedVersion, setSelectedVersion] = reactExports.useState("");
  const [selectedLoader, setSelectedLoader] = reactExports.useState("");
  const [targetPath, setTargetPath] = reactExports.useState("");
  const [availableVersions, setAvailableVersions] = reactExports.useState(propsAvailableVersions);
  const [availableLoaders, setAvailableLoaders] = reactExports.useState(propsAvailableLoaders);
  const [filteredLoaders, setFilteredLoaders] = reactExports.useState(propsAvailableLoaders);
  const [isCustomPath, setIsCustomPath] = reactExports.useState(false);
  const [showVersionOptions, setShowVersionOptions] = reactExports.useState(false);
  const [showLoaderOptions, setShowLoaderOptions] = reactExports.useState(false);
  const [loadingLoaders, setLoadingLoaders] = reactExports.useState(false);
  reactExports.useEffect(() => {
    setAvailableVersions(propsAvailableVersions);
  }, [propsAvailableVersions]);
  reactExports.useEffect(() => {
    setAvailableLoaders(propsAvailableLoaders);
    if (!selectedVersion) {
      setFilteredLoaders(propsAvailableLoaders);
    }
  }, [propsAvailableLoaders]);
  reactExports.useEffect(() => {
    const filterLoadersForVersion = async () => {
      if (!selectedVersion || contentItem.type !== "mods" && contentItem.type !== "modpacks") {
        setFilteredLoaders(availableLoaders);
        return;
      }
      setLoadingLoaders(true);
      const compatibleLoaders = [];
      const allLoaders = ["forge", "fabric", "quilt", "neoforge"];
      for (const loader of allLoaders) {
        try {
          let compatibleVersions = [];
          if (contentItem.platform === "modrinth") {
            compatibleVersions = await window.api.modrinth.getCompatibleVersions({
              projectId: contentItem.id,
              mcVersion: selectedVersion,
              loader
            });
            if (Array.isArray(compatibleVersions) && compatibleVersions.length > 0) {
              const matchingVersions = compatibleVersions.filter((v) => {
                const versionMatch = v.game_versions && Array.isArray(v.game_versions) && v.game_versions.includes(selectedVersion);
                const loaderMatch = v.loaders && Array.isArray(v.loaders) && v.loaders.includes(loader);
                return versionMatch && loaderMatch;
              });
              if (matchingVersions.length > 0) {
                compatibleLoaders.push(loader);
              }
            }
          } else if (contentItem.platform === "curseforge") {
            compatibleVersions = await window.api.curseforge.getCompatibleVersions({
              projectId: contentItem.id,
              mcVersion: selectedVersion,
              loader
            });
            if (Array.isArray(compatibleVersions) && compatibleVersions.length > 0) {
              const matchingVersions = compatibleVersions.filter((v) => {
                const versionMatch = v.game_versions && Array.isArray(v.game_versions) && v.game_versions.includes(selectedVersion) || v.gameVersion === selectedVersion;
                const loaderMatch = v.loaders && Array.isArray(v.loaders) && v.loaders.includes(loader) || v.modLoader && v.modLoader.toLowerCase() === loader.toLowerCase();
                return versionMatch && loaderMatch;
              });
              if (matchingVersions.length > 0) {
                compatibleLoaders.push(loader);
              }
            }
          }
        } catch (error) {
          console.error(`Error verificando loader ${loader}:`, error);
        }
      }
      setFilteredLoaders(compatibleLoaders);
      setLoadingLoaders(false);
      if (selectedLoader && !compatibleLoaders.includes(selectedLoader)) {
        setSelectedLoader("");
      }
    };
    filterLoadersForVersion();
  }, [selectedVersion, contentItem.id, contentItem.platform, contentItem.type]);
  const handleStartDownload = async () => {
    if (!selectedVersion || contentItem.type === "mods" && !selectedLoader || !targetPath && !isCustomPath) {
      await showModernAlert("Campos requeridos", "Por favor, completa todos los campos requeridos", "warning");
      return;
    }
    onDownloadStart({
      id: contentItem.id,
      name: contentItem.title,
      version: selectedVersion,
      loader: selectedLoader,
      targetPath,
      platform: contentItem.platform
    });
    onClose();
  };
  if (!isOpen) return null;
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-700/80 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-6", children: [
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-start mb-6", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h2", { className: "text-2xl font-bold text-white", children: "Descarga Individual" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
          lineNumber: 156,
          columnNumber: 15
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-gray-400", children: [
          'Configura la descarga de "',
          contentItem.title,
          '"'
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
          lineNumber: 157,
          columnNumber: 15
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
        lineNumber: 155,
        columnNumber: 13
      }, void 0),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
        "button",
        {
          onClick: onClose,
          className: "text-gray-400 hover:text-white transition-colors",
          children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
            lineNumber: 164,
            columnNumber: 17
          }, void 0) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
            lineNumber: 163,
            columnNumber: 15
          }, void 0)
        },
        void 0,
        false,
        {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
          lineNumber: 159,
          columnNumber: 13
        },
        void 0
      )
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
      lineNumber: 154,
      columnNumber: 11
    }, void 0),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-6", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "md:col-span-1 flex justify-center", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
        "img",
        {
          src: contentItem.imageUrl,
          alt: contentItem.title,
          className: "w-32 h-32 object-cover rounded-xl border border-gray-600 shadow-lg",
          onError: (e) => {
            const target = e.target;
            target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWYyOTM3Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk08L3RleHQ+PC9zdmc+";
          }
        },
        void 0,
        false,
        {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
          lineNumber: 171,
          columnNumber: 15
        },
        void 0
      ) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
        lineNumber: 170,
        columnNumber: 13
      }, void 0),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "md:col-span-2", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-xl font-bold text-white mb-2", children: contentItem.title }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
          lineNumber: 182,
          columnNumber: 15
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-gray-300 mb-4", children: contentItem.description }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
          lineNumber: 183,
          columnNumber: 15
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-gray-400", children: "Autor" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
              lineNumber: 187,
              columnNumber: 19
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-white", children: contentItem.author }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
              lineNumber: 188,
              columnNumber: 19
            }, void 0)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
            lineNumber: 186,
            columnNumber: 17
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-gray-400", children: "Tipo" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
              lineNumber: 191,
              columnNumber: 19
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-white capitalize", children: contentItem.type }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
              lineNumber: 192,
              columnNumber: 19
            }, void 0)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
            lineNumber: 190,
            columnNumber: 17
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-gray-400", children: "Descargas" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
              lineNumber: 195,
              columnNumber: 19
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-white", children: contentItem.downloads.toLocaleString() }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
              lineNumber: 196,
              columnNumber: 19
            }, void 0)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
            lineNumber: 194,
            columnNumber: 17
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-gray-400", children: "Plataforma" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
              lineNumber: 199,
              columnNumber: 19
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-purple-400 capitalize", children: contentItem.platform }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
              lineNumber: 200,
              columnNumber: 19
            }, void 0)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
            lineNumber: 198,
            columnNumber: 17
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
          lineNumber: 185,
          columnNumber: 15
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
        lineNumber: 181,
        columnNumber: 13
      }, void 0)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
      lineNumber: 169,
      columnNumber: 11
    }, void 0),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-center mb-2", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300", children: "Versión de Minecraft" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
            lineNumber: 210,
            columnNumber: 17
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-xs text-gray-400", children: [
            availableVersions.length,
            " disponibles"
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
            lineNumber: 213,
            columnNumber: 17
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
          lineNumber: 209,
          columnNumber: 15
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "relative", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              type: "button",
              className: `w-full bg-gray-700/80 backdrop-blur-sm border border-gray-600 rounded-xl py-3 px-4 text-left flex justify-between items-center ${selectedVersion ? "text-white" : "text-gray-400"}`,
              onClick: () => setShowVersionOptions(!showVersionOptions),
              children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: selectedVersion || "Selecciona una versión..." }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
                  lineNumber: 224,
                  columnNumber: 19
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  "svg",
                  {
                    className: `w-5 h-5 transition-transform duration-200 ${showVersionOptions ? "rotate-180" : ""}`,
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24",
                    children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
                      lineNumber: 231,
                      columnNumber: 21
                    }, void 0)
                  },
                  void 0,
                  false,
                  {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
                    lineNumber: 225,
                    columnNumber: 19
                  },
                  void 0
                )
              ]
            },
            void 0,
            true,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
              lineNumber: 217,
              columnNumber: 17
            },
            void 0
          ),
          showVersionOptions && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "absolute z-10 w-full mt-2 bg-gray-700/90 backdrop-blur-sm border border-gray-600 rounded-xl shadow-lg max-h-60 overflow-y-auto", children: availableVersions.length > 0 ? availableVersions.map((version) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "div",
            {
              className: `flex items-center px-4 py-3 cursor-pointer hover:bg-gray-600/50 ${selectedVersion === version ? "bg-blue-600/30" : ""}`,
              onClick: async () => {
                setSelectedVersion(version);
                setShowVersionOptions(false);
                setSelectedLoader("");
              },
              children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "mr-3", children: selectedVersion === version ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5 text-green-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
                  lineNumber: 254,
                  columnNumber: 33
                }, void 0) }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
                  lineNumber: 253,
                  columnNumber: 31
                }, void 0) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-5 h-5 border border-gray-400 rounded" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
                  lineNumber: 257,
                  columnNumber: 31
                }, void 0) }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
                  lineNumber: 251,
                  columnNumber: 27
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: selectedVersion === version ? "text-white font-medium" : "text-gray-300", children: version }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
                  lineNumber: 260,
                  columnNumber: 27
                }, void 0)
              ]
            },
            version,
            true,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
              lineNumber: 239,
              columnNumber: 25
            },
            void 0
          )) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "px-4 py-3 text-gray-400", children: "No hay versiones disponibles" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
            lineNumber: 266,
            columnNumber: 23
          }, void 0) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
            lineNumber: 236,
            columnNumber: 19
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
          lineNumber: 216,
          columnNumber: 15
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
        lineNumber: 208,
        columnNumber: 13
      }, void 0),
      (contentItem.type === "mods" || contentItem.type === "modpacks") && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-center mb-2", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300", children: "Loader Compatible" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
            lineNumber: 277,
            columnNumber: 19
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-xs text-gray-400", children: loadingLoaders ? "Verificando..." : `${filteredLoaders.length} disponibles` }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
            lineNumber: 280,
            columnNumber: 19
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
          lineNumber: 276,
          columnNumber: 17
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "relative", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              type: "button",
              className: `w-full bg-gray-700/80 backdrop-blur-sm border border-gray-600 rounded-xl py-3 px-4 text-left flex justify-between items-center ${selectedLoader ? "text-white" : "text-gray-400"}`,
              onClick: () => setShowLoaderOptions(!showLoaderOptions),
              children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: selectedLoader ? selectedLoader.charAt(0).toUpperCase() + selectedLoader.slice(1) : "Selecciona un loader..." }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
                  lineNumber: 293,
                  columnNumber: 21
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  "svg",
                  {
                    className: `w-5 h-5 transition-transform duration-200 ${showLoaderOptions ? "rotate-180" : ""}`,
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24",
                    children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
                      lineNumber: 300,
                      columnNumber: 23
                    }, void 0)
                  },
                  void 0,
                  false,
                  {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
                    lineNumber: 294,
                    columnNumber: 21
                  },
                  void 0
                )
              ]
            },
            void 0,
            true,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
              lineNumber: 286,
              columnNumber: 19
            },
            void 0
          ),
          showLoaderOptions && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "absolute z-10 w-full mt-2 bg-gray-700/90 backdrop-blur-sm border border-gray-600 rounded-xl shadow-lg", children: loadingLoaders ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "px-4 py-3 text-gray-400 text-center", children: "Verificando loaders disponibles..." }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
            lineNumber: 307,
            columnNumber: 25
          }, void 0) : filteredLoaders.length > 0 ? filteredLoaders.map((loader) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "div",
            {
              className: `flex items-center px-4 py-3 cursor-pointer hover:bg-gray-600/50 ${selectedLoader === loader ? "bg-blue-600/30" : ""}`,
              onClick: () => {
                setSelectedLoader(loader);
                setShowLoaderOptions(false);
              },
              children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "mr-3", children: selectedLoader === loader ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5 text-green-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
                  lineNumber: 323,
                  columnNumber: 35
                }, void 0) }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
                  lineNumber: 322,
                  columnNumber: 33
                }, void 0) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-5 h-5 border border-gray-400 rounded" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
                  lineNumber: 326,
                  columnNumber: 33
                }, void 0) }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
                  lineNumber: 320,
                  columnNumber: 29
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: selectedLoader === loader ? "text-white font-medium" : "text-gray-300", children: loader.charAt(0).toUpperCase() + loader.slice(1) }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
                  lineNumber: 329,
                  columnNumber: 29
                }, void 0)
              ]
            },
            loader,
            true,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
              lineNumber: 310,
              columnNumber: 27
            },
            void 0
          )) : selectedVersion ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "px-4 py-3 text-gray-400", children: [
            "No hay loaders disponibles para ",
            selectedVersion
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
            lineNumber: 335,
            columnNumber: 25
          }, void 0) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "px-4 py-3 text-gray-400", children: "Selecciona una versión primero" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
            lineNumber: 337,
            columnNumber: 25
          }, void 0) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
            lineNumber: 305,
            columnNumber: 21
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
          lineNumber: 285,
          columnNumber: 17
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
        lineNumber: 275,
        columnNumber: 15
      }, void 0),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Destino de la descarga" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
          lineNumber: 347,
          columnNumber: 15
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "input",
              {
                type: "radio",
                id: "folder-custom",
                checked: isCustomPath,
                onChange: () => setIsCustomPath(true),
                className: "w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
              },
              void 0,
              false,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
                lineNumber: 352,
                columnNumber: 19
              },
              void 0
            ),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { htmlFor: "folder-custom", className: "ml-2 text-gray-300", children: "Carpeta personalizada" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
              lineNumber: 359,
              columnNumber: 19
            }, void 0)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
            lineNumber: 351,
            columnNumber: 17
          }, void 0),
          isCustomPath && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "ml-6 space-y-2", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "input",
              {
                type: "text",
                value: targetPath,
                onChange: (e) => setTargetPath(e.target.value),
                placeholder: "Selecciona una carpeta...",
                className: "w-full bg-gray-700/80 backdrop-blur-sm border border-gray-600 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
              },
              void 0,
              false,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
                lineNumber: 366,
                columnNumber: 21
              },
              void 0
            ),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "button",
              {
                className: "w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-4 rounded-xl font-medium transition-all duration-200",
                onClick: async () => {
                  var _a, _b;
                  try {
                    if ((_b = (_a = window.api) == null ? void 0 : _a.dialog) == null ? void 0 : _b.showOpenDialog) {
                      const result = await window.api.dialog.showOpenDialog({
                        properties: ["openDirectory"],
                        title: "Seleccionar carpeta de destino",
                        buttonLabel: "Seleccionar"
                      });
                      if (!result.canceled && result.filePaths.length > 0) {
                        setTargetPath(result.filePaths[0]);
                      }
                    } else {
                      await showModernAlert("Función no disponible", "La función de selección de carpetas no está disponible.", "warning");
                    }
                  } catch (error) {
                    console.error("Error al seleccionar carpeta:", error);
                    await showModernAlert("Error", "Error al seleccionar la carpeta: " + error.message, "error");
                  }
                },
                children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5 inline mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
                    lineNumber: 396,
                    columnNumber: 25
                  }, void 0) }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
                    lineNumber: 395,
                    columnNumber: 23
                  }, void 0),
                  "Seleccionar carpeta"
                ]
              },
              void 0,
              true,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
                lineNumber: 373,
                columnNumber: 21
              },
              void 0
            )
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
            lineNumber: 365,
            columnNumber: 19
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
          lineNumber: 350,
          columnNumber: 15
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
        lineNumber: 346,
        columnNumber: 13
      }, void 0),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "pt-4", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
        "button",
        {
          onClick: handleStartDownload,
          disabled: !selectedVersion || contentItem.type === "mods" && !selectedLoader || !targetPath && !isCustomPath,
          className: "w-full relative overflow-hidden rounded-xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30",
          children: "Iniciar Descarga Individual"
        },
        void 0,
        false,
        {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
          lineNumber: 407,
          columnNumber: 15
        },
        void 0
      ) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
        lineNumber: 406,
        columnNumber: 13
      }, void 0)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
      lineNumber: 206,
      columnNumber: 11
    }, void 0)
  ] }, void 0, true, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
    lineNumber: 153,
    columnNumber: 9
  }, void 0) }, void 0, false, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
    lineNumber: 152,
    columnNumber: 7
  }, void 0) }, void 0, false, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SingleDownloadModal.tsx",
    lineNumber: 151,
    columnNumber: 5
  }, void 0);
};
const MultipleDownloadModal = ({
  isOpen,
  onClose,
  contentItems,
  availableVersions: propsAvailableVersions = [],
  availableLoaders: propsAvailableLoaders = [],
  onAddToQueue
}) => {
  const [selectedItems, setSelectedItems] = reactExports.useState(/* @__PURE__ */ new Set());
  const [downloadConfigs, setDownloadConfigs] = reactExports.useState({});
  const [showVersionOptions, setShowVersionOptions] = reactExports.useState({});
  const [showLoaderOptions, setShowLoaderOptions] = reactExports.useState({});
  const [globalTargetPath, setGlobalTargetPath] = reactExports.useState("");
  const [isCustomGlobalPath, setIsCustomGlobalPath] = reactExports.useState(false);
  const [isProcessing, setIsProcessing] = reactExports.useState(false);
  const [itemDetailsLoaded, setItemDetailsLoaded] = reactExports.useState(/* @__PURE__ */ new Set());
  const [animatingItems, setAnimatingItems] = reactExports.useState(/* @__PURE__ */ new Set());
  const [loadingLoaders, setLoadingLoaders] = reactExports.useState({});
  reactExports.useEffect(() => {
    if (isOpen) {
      const initialConfigs = {};
      const initialShowVersionOptions = {};
      const initialShowLoaderOptions = {};
      contentItems.forEach((item) => {
        const itemVersions = propsAvailableVersions.length > 0 ? propsAvailableVersions : item.minecraftVersions || [];
        const itemLoaders = propsAvailableLoaders.length > 0 ? propsAvailableLoaders : item.type === "mods" || item.type === "modpacks" ? ["forge", "fabric", "quilt", "neoforge"] : [];
        initialConfigs[item.id] = {
          version: itemVersions[0] || "",
          loader: "",
          targetPath: globalTargetPath || "",
          availableVersions: itemVersions,
          availableLoaders: itemLoaders,
          filteredLoaders: itemLoaders
          // Inicialmente mostrar todos
        };
        initialShowVersionOptions[item.id] = false;
        initialShowLoaderOptions[item.id] = false;
      });
      setDownloadConfigs(initialConfigs);
      setShowVersionOptions(initialShowVersionOptions);
      setShowLoaderOptions(initialShowLoaderOptions);
    }
  }, [isOpen, contentItems, globalTargetPath, propsAvailableVersions, propsAvailableLoaders]);
  reactExports.useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;
      if (!target.closest(".dropdown-container")) {
        setShowVersionOptions({});
        setShowLoaderOptions({});
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);
  const toggleItemSelection = (id) => {
    const newSelectedItems = new Set(selectedItems);
    if (newSelectedItems.has(id)) {
      newSelectedItems.delete(id);
    } else {
      newSelectedItems.add(id);
    }
    setSelectedItems(newSelectedItems);
  };
  const updateItemConfig = (id, config) => {
    setDownloadConfigs((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...config
      }
    }));
  };
  const filterLoadersForItemVersion = async (itemId, version) => {
    const item = contentItems.find((i) => i.id === itemId);
    if (!item || item.type !== "mods" && item.type !== "modpacks" || !version) {
      return;
    }
    setLoadingLoaders((prev) => ({ ...prev, [itemId]: true }));
    const compatibleLoaders = [];
    const allLoaders = ["forge", "fabric", "quilt", "neoforge"];
    for (const loader of allLoaders) {
      try {
        let compatibleVersions = [];
        if (item.platform === "modrinth") {
          compatibleVersions = await window.api.modrinth.getCompatibleVersions({
            projectId: item.id,
            mcVersion: version,
            loader
          });
          if (Array.isArray(compatibleVersions) && compatibleVersions.length > 0) {
            const matchingVersions = compatibleVersions.filter((v) => {
              const versionMatch = v.game_versions && Array.isArray(v.game_versions) && v.game_versions.includes(version);
              const loaderMatch = v.loaders && Array.isArray(v.loaders) && v.loaders.includes(loader);
              return versionMatch && loaderMatch;
            });
            if (matchingVersions.length > 0) {
              compatibleLoaders.push(loader);
            }
          }
        } else if (item.platform === "curseforge") {
          compatibleVersions = await window.api.curseforge.getCompatibleVersions({
            projectId: item.id,
            mcVersion: version,
            loader
          });
          if (Array.isArray(compatibleVersions) && compatibleVersions.length > 0) {
            const matchingVersions = compatibleVersions.filter((v) => {
              const versionMatch = v.game_versions && Array.isArray(v.game_versions) && v.game_versions.includes(version) || v.gameVersion === version;
              const loaderMatch = v.loaders && Array.isArray(v.loaders) && v.loaders.includes(loader) || v.modLoader && v.modLoader.toLowerCase() === loader.toLowerCase();
              return versionMatch && loaderMatch;
            });
            if (matchingVersions.length > 0) {
              compatibleLoaders.push(loader);
            }
          }
        }
      } catch (error) {
        console.error(`Error verificando loader ${loader} para ${item.title}:`, error);
      }
    }
    setDownloadConfigs((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        filteredLoaders: compatibleLoaders,
        loader: prev[itemId].loader && compatibleLoaders.includes(prev[itemId].loader || "") ? prev[itemId].loader : ""
        // Limpiar loader si no está disponible
      }
    }));
    setLoadingLoaders((prev) => ({ ...prev, [itemId]: false }));
  };
  const handleAddToQueue = async () => {
    setIsProcessing(true);
    const validItems = [];
    const invalidItems = [];
    for (const id of selectedItems) {
      const item = contentItems.find((i) => i.id === id);
      const config = downloadConfigs[id];
      if (!item || !config) continue;
      let contentType = "mod";
      if (item.type === "resourcepacks") {
        contentType = "resourcepack";
      } else if (item.type === "shaders") {
        contentType = "shader";
      } else if (item.type === "datapacks") {
        contentType = "datapack";
      } else if (item.type === "modpacks") {
        contentType = "modpack";
      }
      try {
        let compatibleVersions = [];
        if (item.platform === "modrinth") {
          compatibleVersions = await window.api.modrinth.getCompatibleVersions({
            projectId: item.id,
            mcVersion: config.version,
            loader: config.loader || void 0
          });
          if (Array.isArray(compatibleVersions) && compatibleVersions.length > 0) {
            const matchingVersions = compatibleVersions.filter((v) => {
              const versionMatch = v.game_versions && Array.isArray(v.game_versions) && v.game_versions.includes(config.version);
              const loaderMatch = !config.loader || v.loaders && Array.isArray(v.loaders) && v.loaders.includes(config.loader);
              return versionMatch && loaderMatch;
            });
            if (matchingVersions.length === 0) {
              compatibleVersions = [];
            }
          }
        } else if (item.platform === "curseforge") {
          compatibleVersions = await window.api.curseforge.getCompatibleVersions({
            projectId: item.id,
            mcVersion: config.version,
            loader: config.loader || void 0
          });
          if (Array.isArray(compatibleVersions) && compatibleVersions.length > 0) {
            const matchingVersions = compatibleVersions.filter((v) => {
              const versionMatch = v.game_versions && Array.isArray(v.game_versions) && v.game_versions.includes(config.version) || v.gameVersion === config.version;
              const loaderMatch = !config.loader || v.loaders && Array.isArray(v.loaders) && v.loaders.includes(config.loader) || v.modLoader && v.modLoader.toLowerCase() === config.loader.toLowerCase();
              return versionMatch && loaderMatch;
            });
            if (matchingVersions.length === 0) {
              compatibleVersions = [];
            }
          }
        }
        if (!compatibleVersions || compatibleVersions.length === 0) {
          const loaderText = config.loader ? ` y ${config.loader}` : "";
          invalidItems.push({
            name: item.title,
            reason: `No hay versiones disponibles para ${config.version}${loaderText}`
          });
          continue;
        }
        validItems.push({
          originalId: item.id,
          name: item.title,
          version: config.version,
          loader: config.loader,
          targetPath: config.targetPath,
          platform: item.platform,
          contentType
        });
      } catch (error) {
        console.error(`Error validando ${item.title}:`, error);
        invalidItems.push({
          name: item.title,
          reason: error instanceof Error ? error.message : "Error al verificar compatibilidad"
        });
      }
    }
    setIsProcessing(false);
    if (invalidItems.length > 0) {
      const errorMessages = invalidItems.map((item) => `• ${item.name}: ${item.reason}`).join("\n");
      await showModernAlert(
        "Items no agregados",
        `Los siguientes items no se pudieron agregar a la cola:

${errorMessages}

${validItems.length > 0 ? "Los items válidos se agregarán a la cola." : "Por favor, selecciona versiones y loaders compatibles."}`,
        "warning"
      );
    }
    if (validItems.length === 0) {
      return;
    }
    if (validItems.length > 0) {
      setAnimatingItems(new Set(selectedItems));
      validItems.forEach((item, index) => {
        setTimeout(() => {
          setTimeout(() => {
            setAnimatingItems((prev) => {
              const newSet = new Set(prev);
              newSet.delete(item.originalId);
              return newSet;
            });
          }, 600);
        }, index * 50);
      });
      setTimeout(() => {
        onAddToQueue(validItems);
        setSelectedItems((prev) => {
          const newSet = new Set(prev);
          validItems.forEach((item) => newSet.delete(item.originalId));
          return newSet;
        });
        if (invalidItems.length === 0) {
          onClose();
        }
      }, validItems.length * 50 + 300);
    }
  };
  if (!isOpen) return null;
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(jsxDevRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("style", { children: `
        @keyframes slideOut {
          0% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
          50% {
            opacity: 0.7;
            transform: translateX(20px) scale(0.98);
          }
          100% {
            opacity: 0;
            transform: translateX(100px) scale(0.95);
          }
        }
      ` }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
      lineNumber: 372,
      columnNumber: 7
    }, void 0),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-700/80 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-6 border-b border-gray-700/50", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-start mb-6", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h2", { className: "text-2xl font-bold text-white", children: "Descarga Múltiple" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
              lineNumber: 393,
              columnNumber: 15
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-gray-400 mt-1", children: "Selecciona múltiples items para descargar en cola" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
              lineNumber: 394,
              columnNumber: 15
            }, void 0)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
            lineNumber: 392,
            columnNumber: 13
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              onClick: onClose,
              className: "text-gray-400 hover:text-white transition-colors",
              children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                lineNumber: 403,
                columnNumber: 17
              }, void 0) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                lineNumber: 402,
                columnNumber: 15
              }, void 0)
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
              lineNumber: 398,
              columnNumber: 13
            },
            void 0
          )
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
          lineNumber: 391,
          columnNumber: 11
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-4 bg-gradient-to-br from-gray-700/40 to-gray-800/40 rounded-xl border border-gray-600/50 shadow-lg", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "font-semibold text-white mb-4 flex items-center", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5 mr-2 text-blue-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
              lineNumber: 412,
              columnNumber: 17
            }, void 0) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
              lineNumber: 411,
              columnNumber: 15
            }, void 0),
            "Configuración Global"
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
            lineNumber: 410,
            columnNumber: 13
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Carpeta de destino global" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                lineNumber: 418,
                columnNumber: 17
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  "input",
                  {
                    type: "text",
                    value: globalTargetPath,
                    onChange: (e) => setGlobalTargetPath(e.target.value),
                    placeholder: "Ruta predeterminada para descargas...",
                    className: "flex-1 bg-gray-700/80 backdrop-blur-sm border border-gray-600 rounded-xl py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
                  },
                  void 0,
                  false,
                  {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                    lineNumber: 422,
                    columnNumber: 19
                  },
                  void 0
                ),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  "button",
                  {
                    className: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-4 rounded-xl font-medium transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30",
                    onClick: async () => {
                      var _a, _b;
                      try {
                        if ((_b = (_a = window.api) == null ? void 0 : _a.dialog) == null ? void 0 : _b.showOpenDialog) {
                          const result = await window.api.dialog.showOpenDialog({
                            properties: ["openDirectory"],
                            title: "Seleccionar carpeta de destino global",
                            buttonLabel: "Seleccionar"
                          });
                          if (!result.canceled && result.filePaths.length > 0) {
                            setGlobalTargetPath(result.filePaths[0]);
                          }
                        } else {
                          await showModernAlert("Función no disponible", "La función de selección de carpetas no está disponible.", "warning");
                        }
                      } catch (error) {
                        console.error("Error al seleccionar carpeta:", error);
                        await showModernAlert("Error", "Error al seleccionar la carpeta: " + error.message, "error");
                      }
                    },
                    children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                      lineNumber: 452,
                      columnNumber: 23
                    }, void 0) }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                      lineNumber: 451,
                      columnNumber: 21
                    }, void 0)
                  },
                  void 0,
                  false,
                  {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                    lineNumber: 429,
                    columnNumber: 19
                  },
                  void 0
                )
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                lineNumber: 421,
                columnNumber: 17
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
              lineNumber: 417,
              columnNumber: 15
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "button",
              {
                onClick: () => {
                  const updatedConfigs = { ...downloadConfigs };
                  Object.keys(updatedConfigs).forEach((id) => {
                    updatedConfigs[id] = { ...updatedConfigs[id], targetPath: globalTargetPath };
                  });
                  setDownloadConfigs(updatedConfigs);
                },
                className: "w-full bg-gray-600/80 hover:bg-gray-500/80 text-white py-2.5 px-4 rounded-xl font-medium transition-all duration-200 border border-gray-500/50",
                children: "Aplicar destino global a todos los items seleccionados"
              },
              void 0,
              false,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                lineNumber: 457,
                columnNumber: 15
              },
              void 0
            )
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
            lineNumber: 416,
            columnNumber: 13
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
          lineNumber: 409,
          columnNumber: 11
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
        lineNumber: 390,
        columnNumber: 9
      }, void 0),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-1 overflow-y-auto p-6", children: contentItems.length === 0 ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-center py-12 text-gray-400", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "mx-auto h-12 w-12 text-gray-500 mb-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1, d: "M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
          lineNumber: 477,
          columnNumber: 17
        }, void 0) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
          lineNumber: 476,
          columnNumber: 15
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-lg font-medium text-gray-300", children: "No hay elementos disponibles para descargar" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
          lineNumber: 479,
          columnNumber: 15
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
        lineNumber: 475,
        columnNumber: 13
      }, void 0) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-4", children: contentItems.map((item) => {
        const isSelected = selectedItems.has(item.id);
        const isAnimating = animatingItems.has(item.id);
        const config = downloadConfigs[item.id] || {
          version: "",
          loader: "",
          targetPath: "",
          availableVersions: propsAvailableVersions.length > 0 ? propsAvailableVersions : item.minecraftVersions,
          availableLoaders: propsAvailableLoaders,
          filteredLoaders: propsAvailableLoaders
        };
        return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "div",
          {
            className: `p-5 rounded-xl border transition-all duration-300 ${isAnimating ? "animate-pulse bg-gradient-to-br from-green-900/60 to-emerald-900/60 border-green-500/80 shadow-lg shadow-green-500/30 transform scale-105" : isSelected ? "bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border-blue-500/60 shadow-lg shadow-blue-500/10" : "bg-gray-700/30 border-gray-600/40 hover:bg-gray-700/40 hover:border-gray-500/50"}`,
            style: isAnimating ? {
              animation: "slideOut 0.6s ease-out forwards"
            } : {},
            children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-start gap-4", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-shrink-0 mt-1", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                "input",
                {
                  type: "checkbox",
                  checked: isSelected,
                  onChange: () => toggleItemSelection(item.id),
                  className: "w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                },
                void 0,
                false,
                {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                  lineNumber: 511,
                  columnNumber: 25
                },
                void 0
              ) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                lineNumber: 510,
                columnNumber: 23
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-start justify-between mb-3", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-start gap-3 flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                    "img",
                    {
                      src: item.imageUrl,
                      alt: item.title,
                      className: "w-16 h-16 object-cover rounded-lg border border-gray-600/50 flex-shrink-0",
                      onError: (e) => {
                        const target = e.target;
                        target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzFmMjkzNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5NPC90ZXh0Pjwvc3ZnPg==";
                      }
                    },
                    void 0,
                    false,
                    {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                      lineNumber: 521,
                      columnNumber: 29
                    },
                    void 0
                  ),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-1 min-w-0", children: [
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "font-semibold text-white truncate text-lg", children: item.title }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                      lineNumber: 531,
                      columnNumber: 31
                    }, void 0),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-sm text-gray-400 mt-1", children: [
                      "por ",
                      item.author
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                      lineNumber: 532,
                      columnNumber: 31
                    }, void 0),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-2 mt-2", children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-xs px-2 py-1 bg-gray-600/40 text-gray-300 rounded-full", children: item.platform }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                        lineNumber: 534,
                        columnNumber: 33
                      }, void 0),
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-xs px-2 py-1 bg-blue-600/20 text-blue-300 rounded-full capitalize", children: item.type }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                        lineNumber: 537,
                        columnNumber: 33
                      }, void 0)
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                      lineNumber: 533,
                      columnNumber: 31
                    }, void 0)
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                    lineNumber: 530,
                    columnNumber: 29
                  }, void 0)
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                  lineNumber: 520,
                  columnNumber: 27
                }, void 0) }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                  lineNumber: 519,
                  columnNumber: 25
                }, void 0),
                isSelected && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-4 pt-4 border-t border-gray-600/40 space-y-4", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "dropdown-container", children: [
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-center mb-2", children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300", children: "Versión de Minecraft" }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                        lineNumber: 551,
                        columnNumber: 35
                      }, void 0),
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-xs text-gray-400", children: [
                        (config.availableVersions || []).length,
                        " disponibles"
                      ] }, void 0, true, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                        lineNumber: 554,
                        columnNumber: 35
                      }, void 0)
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                      lineNumber: 550,
                      columnNumber: 33
                    }, void 0),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "relative", children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                        "button",
                        {
                          type: "button",
                          className: `w-full bg-gray-700/80 backdrop-blur-sm border border-gray-600 rounded-xl py-2.5 px-4 text-left flex justify-between items-center transition-all duration-200 ${config.version ? "text-white border-blue-500/50" : "text-gray-400"}`,
                          onClick: () => {
                            setShowVersionOptions((prev) => ({
                              ...prev,
                              [item.id]: !prev[item.id]
                            }));
                            setShowLoaderOptions((prev) => {
                              const newState = { ...prev };
                              Object.keys(newState).forEach((key) => {
                                if (key !== item.id) newState[key] = false;
                              });
                              return newState;
                            });
                          },
                          children: [
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "truncate", children: config.version || "Selecciona una versión..." }, void 0, false, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                              lineNumber: 579,
                              columnNumber: 37
                            }, void 0),
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                              "svg",
                              {
                                className: `w-5 h-5 flex-shrink-0 ml-2 transition-transform duration-200 ${showVersionOptions[item.id] ? "rotate-180" : ""}`,
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24",
                                children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" }, void 0, false, {
                                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                                  lineNumber: 590,
                                  columnNumber: 39
                                }, void 0)
                              },
                              void 0,
                              false,
                              {
                                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                                lineNumber: 582,
                                columnNumber: 37
                              },
                              void 0
                            )
                          ]
                        },
                        void 0,
                        true,
                        {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                          lineNumber: 559,
                          columnNumber: 35
                        },
                        void 0
                      ),
                      showVersionOptions[item.id] && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "absolute z-20 w-full mt-2 bg-gray-700/95 backdrop-blur-sm border border-gray-600 rounded-xl shadow-2xl max-h-60 overflow-y-auto", children: (config.availableVersions || []).length > 0 ? (config.availableVersions || []).map((version, idx) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                        "div",
                        {
                          className: `flex items-center px-4 py-3 cursor-pointer hover:bg-gray-600/60 transition-colors duration-150 ${config.version === version ? "bg-blue-600/30" : ""}`,
                          onClick: async () => {
                            updateItemConfig(item.id, { ...config, version, loader: "" });
                            setShowVersionOptions((prev) => ({ ...prev, [item.id]: false }));
                            await filterLoadersForItemVersion(item.id, version);
                          },
                          children: [
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "mr-3 flex-shrink-0", children: config.version === version ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5 text-green-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2.5, d: "M5 13l4 4L19 7" }, void 0, false, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                              lineNumber: 613,
                              columnNumber: 51
                            }, void 0) }, void 0, false, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                              lineNumber: 612,
                              columnNumber: 49
                            }, void 0) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-5 h-5 border-2 border-gray-400 rounded transition-colors duration-150" }, void 0, false, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                              lineNumber: 616,
                              columnNumber: 49
                            }, void 0) }, void 0, false, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                              lineNumber: 610,
                              columnNumber: 45
                            }, void 0),
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: `flex-1 ${config.version === version ? "text-white font-medium" : "text-gray-300"}`, children: version }, void 0, false, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                              lineNumber: 619,
                              columnNumber: 45
                            }, void 0)
                          ]
                        },
                        idx,
                        true,
                        {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                          lineNumber: 598,
                          columnNumber: 43
                        },
                        void 0
                      )) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "px-4 py-3 text-gray-400 text-sm", children: "No hay versiones disponibles" }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                        lineNumber: 625,
                        columnNumber: 41
                      }, void 0) }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                        lineNumber: 595,
                        columnNumber: 37
                      }, void 0)
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                      lineNumber: 558,
                      columnNumber: 33
                    }, void 0)
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                    lineNumber: 549,
                    columnNumber: 31
                  }, void 0),
                  (item.type === "mods" || item.type === "modpacks") && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "dropdown-container", children: [
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-center mb-2", children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300", children: "Loader Compatible" }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                        lineNumber: 636,
                        columnNumber: 37
                      }, void 0),
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-xs text-gray-400", children: loadingLoaders[item.id] ? "Verificando..." : `${(config.filteredLoaders || config.availableLoaders || []).length} disponibles` }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                        lineNumber: 639,
                        columnNumber: 37
                      }, void 0)
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                      lineNumber: 635,
                      columnNumber: 35
                    }, void 0),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "relative", children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                        "button",
                        {
                          type: "button",
                          className: `w-full bg-gray-700/80 backdrop-blur-sm border border-gray-600 rounded-xl py-2.5 px-4 text-left flex justify-between items-center transition-all duration-200 ${config.loader ? "text-white border-blue-500/50" : "text-gray-400"}`,
                          onClick: () => {
                            setShowLoaderOptions((prev) => ({
                              ...prev,
                              [item.id]: !prev[item.id]
                            }));
                            setShowVersionOptions((prev) => {
                              const newState = { ...prev };
                              Object.keys(newState).forEach((key) => {
                                if (key !== item.id) newState[key] = false;
                              });
                              return newState;
                            });
                          },
                          children: [
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "truncate", children: config.loader ? config.loader.charAt(0).toUpperCase() + config.loader.slice(1) : "Selecciona un loader..." }, void 0, false, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                              lineNumber: 666,
                              columnNumber: 39
                            }, void 0),
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                              "svg",
                              {
                                className: `w-5 h-5 flex-shrink-0 ml-2 transition-transform duration-200 ${showLoaderOptions[item.id] ? "rotate-180" : ""}`,
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24",
                                children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" }, void 0, false, {
                                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                                  lineNumber: 679,
                                  columnNumber: 41
                                }, void 0)
                              },
                              void 0,
                              false,
                              {
                                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                                lineNumber: 671,
                                columnNumber: 39
                              },
                              void 0
                            )
                          ]
                        },
                        void 0,
                        true,
                        {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                          lineNumber: 646,
                          columnNumber: 37
                        },
                        void 0
                      ),
                      showLoaderOptions[item.id] && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "absolute z-20 w-full mt-2 bg-gray-700/95 backdrop-blur-sm border border-gray-600 rounded-xl shadow-2xl max-h-60 overflow-y-auto", children: loadingLoaders[item.id] ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "px-4 py-3 text-gray-400 text-center text-sm", children: "Verificando loaders disponibles..." }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                        lineNumber: 686,
                        columnNumber: 43
                      }, void 0) : (config.filteredLoaders || config.availableLoaders || []).length > 0 ? (config.filteredLoaders || config.availableLoaders || []).map((loader, idx) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                        "div",
                        {
                          className: `flex items-center px-4 py-3 cursor-pointer hover:bg-gray-600/60 transition-colors duration-150 ${config.loader === loader ? "bg-blue-600/30" : ""}`,
                          onClick: () => {
                            updateItemConfig(item.id, { ...config, loader });
                            setShowLoaderOptions((prev) => ({ ...prev, [item.id]: false }));
                          },
                          children: [
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "mr-3 flex-shrink-0", children: config.loader === loader ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5 text-green-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2.5, d: "M5 13l4 4L19 7" }, void 0, false, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                              lineNumber: 702,
                              columnNumber: 53
                            }, void 0) }, void 0, false, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                              lineNumber: 701,
                              columnNumber: 51
                            }, void 0) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-5 h-5 border-2 border-gray-400 rounded transition-colors duration-150" }, void 0, false, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                              lineNumber: 705,
                              columnNumber: 51
                            }, void 0) }, void 0, false, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                              lineNumber: 699,
                              columnNumber: 47
                            }, void 0),
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: `flex-1 ${config.loader === loader ? "text-white font-medium" : "text-gray-300"}`, children: loader.charAt(0).toUpperCase() + loader.slice(1) }, void 0, false, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                              lineNumber: 708,
                              columnNumber: 47
                            }, void 0)
                          ]
                        },
                        idx,
                        true,
                        {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                          lineNumber: 689,
                          columnNumber: 45
                        },
                        void 0
                      )) : config.version ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "px-4 py-3 text-gray-400 text-sm", children: [
                        "No hay loaders disponibles para ",
                        config.version
                      ] }, void 0, true, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                        lineNumber: 714,
                        columnNumber: 41
                      }, void 0) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "px-4 py-3 text-gray-400 text-sm", children: "Selecciona una versión primero" }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                        lineNumber: 716,
                        columnNumber: 41
                      }, void 0) }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                        lineNumber: 684,
                        columnNumber: 39
                      }, void 0)
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                      lineNumber: 645,
                      columnNumber: 35
                    }, void 0)
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                    lineNumber: 634,
                    columnNumber: 33
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Carpeta de destino" }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                      lineNumber: 726,
                      columnNumber: 33
                    }, void 0),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex gap-2", children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                        "input",
                        {
                          type: "text",
                          value: config.targetPath || "",
                          onChange: (e) => updateItemConfig(item.id, { ...config, targetPath: e.target.value }),
                          placeholder: globalTargetPath || "Usar destino global...",
                          className: "flex-1 bg-gray-700/80 backdrop-blur-sm border border-gray-600 rounded-xl py-2.5 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
                        },
                        void 0,
                        false,
                        {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                          lineNumber: 730,
                          columnNumber: 35
                        },
                        void 0
                      ),
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                        "button",
                        {
                          type: "button",
                          className: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2.5 px-3 rounded-xl font-medium transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 flex-shrink-0",
                          onClick: async () => {
                            var _a, _b;
                            try {
                              if ((_b = (_a = window.api) == null ? void 0 : _a.dialog) == null ? void 0 : _b.showOpenDialog) {
                                const result = await window.api.dialog.showOpenDialog({
                                  properties: ["openDirectory"],
                                  title: "Seleccionar carpeta de destino",
                                  buttonLabel: "Seleccionar"
                                });
                                if (!result.canceled && result.filePaths.length > 0) {
                                  updateItemConfig(item.id, { ...config, targetPath: result.filePaths[0] });
                                }
                              }
                            } catch (error) {
                              console.error("Error al seleccionar carpeta:", error);
                            }
                          },
                          children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" }, void 0, false, {
                            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                            lineNumber: 758,
                            columnNumber: 39
                          }, void 0) }, void 0, false, {
                            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                            lineNumber: 757,
                            columnNumber: 37
                          }, void 0)
                        },
                        void 0,
                        false,
                        {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                          lineNumber: 737,
                          columnNumber: 35
                        },
                        void 0
                      )
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                      lineNumber: 729,
                      columnNumber: 33
                    }, void 0)
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                    lineNumber: 725,
                    columnNumber: 31
                  }, void 0)
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                  lineNumber: 547,
                  columnNumber: 29
                }, void 0) }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                  lineNumber: 546,
                  columnNumber: 27
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                lineNumber: 518,
                columnNumber: 23
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
              lineNumber: 509,
              columnNumber: 21
            }, void 0)
          },
          item.id,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
            lineNumber: 496,
            columnNumber: 19
          },
          void 0
        );
      }) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
        lineNumber: 482,
        columnNumber: 13
      }, void 0) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
        lineNumber: 473,
        columnNumber: 9
      }, void 0),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-6 border-t border-gray-700/50 bg-gray-800/50", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex flex-col sm:flex-row justify-between items-center gap-4", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-sm text-gray-400 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
            lineNumber: 779,
            columnNumber: 17
          }, void 0) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
            lineNumber: 778,
            columnNumber: 15
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "font-medium", children: selectedItems.size }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
            lineNumber: 781,
            columnNumber: 15
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: "de" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
            lineNumber: 782,
            columnNumber: 15
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "font-medium", children: contentItems.length }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
            lineNumber: 783,
            columnNumber: 15
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: "seleccionados" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
            lineNumber: 784,
            columnNumber: 15
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
          lineNumber: 777,
          columnNumber: 13
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              onClick: onClose,
              className: "px-5 py-2.5 rounded-xl bg-gray-700/80 hover:bg-gray-600/80 text-gray-200 font-medium transition-all duration-200 border border-gray-600/50",
              children: "Cancelar"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
              lineNumber: 787,
              columnNumber: 15
            },
            void 0
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              onClick: handleAddToQueue,
              disabled: selectedItems.size === 0,
              className: "px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-medium transition-all duration-200 shadow-lg shadow-green-500/20 hover:shadow-green-500/30 disabled:shadow-none flex items-center gap-2",
              children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 4v16m8-8H4" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                  lineNumber: 799,
                  columnNumber: 19
                }, void 0) }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
                  lineNumber: 798,
                  columnNumber: 17
                }, void 0),
                "Agregar a cola (",
                selectedItems.size,
                ")"
              ]
            },
            void 0,
            true,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
              lineNumber: 793,
              columnNumber: 15
            },
            void 0
          )
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
          lineNumber: 786,
          columnNumber: 13
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
        lineNumber: 776,
        columnNumber: 11
      }, void 0) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
        lineNumber: 775,
        columnNumber: 9
      }, void 0)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
      lineNumber: 389,
      columnNumber: 7
    }, void 0) }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
      lineNumber: 388,
      columnNumber: 5
    }, void 0)
  ] }, void 0, true, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadModal.tsx",
    lineNumber: 371,
    columnNumber: 5
  }, void 0);
};
const MultipleDownloadQueue = ({
  isVisible,
  onClose
}) => {
  const [queue, setQueue] = reactExports.useState([]);
  const [isStarting, setIsStarting] = reactExports.useState(false);
  const [downloadMode, setDownloadMode] = reactExports.useState("sequential");
  reactExports.useEffect(() => {
    if (!isVisible) return;
    const unsubscribe = multipleDownloadQueueService.subscribe((updatedQueue) => {
      setQueue(updatedQueue);
    });
    return () => {
      unsubscribe();
    };
  }, [isVisible]);
  const removeFromQueue = (id) => {
    multipleDownloadQueueService.removeFromQueue(id);
  };
  const toggleItemEnabled = (id) => {
    multipleDownloadQueueService.toggleItemEnabled(id);
  };
  const clearCompleted = async () => {
    const confirmed = await showModernConfirm(
      "Limpiar cola",
      "¿Estás seguro de que quieres limpiar los elementos completados y con error de la cola?",
      "warning"
    );
    if (confirmed) {
      multipleDownloadQueueService.clearCompletedAndErrors();
    }
  };
  const startDownload = async () => {
    setIsStarting(true);
    const enabledItems = multipleDownloadQueueService.getEnabledItems();
    const downloadItem = async (item) => {
      try {
        multipleDownloadQueueService.updateItemStatus(item.id, "downloading", 0);
        const originalItemId = item.originalId || item.id.split("-")[0];
        const contentType = item.contentType || "mod";
        let compatibleVersions = [];
        try {
          if (item.platform === "modrinth") {
            compatibleVersions = await window.api.modrinth.getCompatibleVersions({
              projectId: originalItemId,
              mcVersion: item.version,
              loader: item.loader || void 0
            });
          } else if (item.platform === "curseforge") {
            compatibleVersions = await window.api.curseforge.getCompatibleVersions({
              projectId: originalItemId,
              mcVersion: item.version,
              loader: item.loader || void 0
            });
          }
        } catch (error) {
          throw new Error(`Error al verificar versiones compatibles: ${error instanceof Error ? error.message : "Error desconocido"}`);
        }
        if (compatibleVersions.length === 0) {
          const loaderText = item.loader ? ` y ${item.loader}` : "";
          throw new Error(`No hay versiones disponibles para ${item.version}${loaderText}. Este contenido no está disponible para esta combinación de versión y loader.`);
        }
        const downloadId = `multiple-${item.id}-${Date.now()}`;
        const startTime = Date.now();
        downloadService.addDownloadToHistory({
          id: downloadId,
          name: item.name,
          url: `content://${item.platform}/${originalItemId}`,
          status: "downloading",
          progress: 0,
          downloadedBytes: 0,
          totalBytes: 1e6,
          startTime,
          speed: 0,
          path: item.targetPath,
          profileUsername: void 0
        });
        multipleDownloadQueueService.updateItemStatus(item.id, "downloading", 10);
        downloadService.addDownloadToHistory({
          id: downloadId,
          name: item.name,
          url: `content://${item.platform}/${originalItemId}`,
          status: "downloading",
          progress: 10,
          downloadedBytes: 1e5,
          totalBytes: 1e6,
          startTime,
          speed: 0,
          path: item.targetPath,
          profileUsername: void 0
        });
        await window.api.instances.installContent({
          instancePath: item.targetPath,
          contentId: originalItemId,
          contentType,
          mcVersion: item.version,
          loader: item.loader || void 0,
          versionId: void 0
        });
        for (let progress = 30; progress < 100; progress += 20) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          multipleDownloadQueueService.updateItemStatus(item.id, "downloading", progress);
          downloadService.addDownloadToHistory({
            id: downloadId,
            name: item.name,
            url: `content://${item.platform}/${originalItemId}`,
            status: "downloading",
            progress,
            downloadedBytes: Math.round(progress / 100 * 1e6),
            totalBytes: 1e6,
            startTime,
            speed: 0,
            path: item.targetPath,
            profileUsername: void 0
          });
        }
        multipleDownloadQueueService.updateItemStatus(item.id, "downloading", 100);
        await new Promise((resolve) => setTimeout(resolve, 300));
        multipleDownloadQueueService.updateItemStatus(item.id, "completed", 100);
        downloadService.addDownloadToHistory({
          id: downloadId,
          name: item.name,
          url: `content://${item.platform}/${originalItemId}`,
          status: "completed",
          progress: 100,
          downloadedBytes: 1e6,
          totalBytes: 1e6,
          startTime,
          endTime: Date.now(),
          speed: 0,
          path: item.targetPath,
          // Ruta donde se descargó
          profileUsername: void 0
        });
      } catch (error) {
        console.error(`Error descargando ${item.name}:`, error);
        const errorMessage = error instanceof Error ? error.message : "Error desconocido";
        multipleDownloadQueueService.updateItemStatus(item.id, "error", void 0, errorMessage);
      }
    };
    if (downloadMode === "sequential") {
      for (const item of enabledItems) {
        await downloadItem(item);
      }
    } else {
      const downloadPromises = enabledItems.map((item) => downloadItem(item));
      await Promise.all(downloadPromises);
    }
    setIsStarting(false);
  };
  const enabledCount = queue.filter((item) => item.enabled && item.status === "pending").length;
  const hasPendingDownloads = queue.some((item) => item.enabled && item.status === "pending");
  const completedDownloads = queue.filter((item) => item.status === "completed").length;
  const errorDownloads = queue.filter((item) => item.status === "error").length;
  const totalDownloads = queue.length;
  if (!isVisible) return null;
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-700/80 shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col", children: [
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-6 border-b border-gray-700/50", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-center", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h2", { className: "text-2xl font-bold text-white", children: "Cola de Descargas Múltiples" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
          lineNumber: 213,
          columnNumber: 15
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-gray-400 mt-1", children: [
          queue.length,
          " elementos en la cola | ",
          completedDownloads,
          " completados"
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
          lineNumber: 214,
          columnNumber: 15
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
        lineNumber: 212,
        columnNumber: 13
      }, void 0),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
        "button",
        {
          onClick: onClose,
          className: "text-gray-400 hover:text-white transition-colors",
          children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
            lineNumber: 223,
            columnNumber: 17
          }, void 0) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
            lineNumber: 222,
            columnNumber: 15
          }, void 0)
        },
        void 0,
        false,
        {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
          lineNumber: 218,
          columnNumber: 13
        },
        void 0
      )
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
      lineNumber: 211,
      columnNumber: 11
    }, void 0) }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
      lineNumber: 210,
      columnNumber: 9
    }, void 0),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-1 overflow-y-auto p-6", children: queue.length === 0 ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-center py-12 text-gray-400", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "mx-auto h-12 w-12 text-gray-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1, d: "M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
        lineNumber: 233,
        columnNumber: 17
      }, void 0) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
        lineNumber: 232,
        columnNumber: 15
      }, void 0),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "mt-2 text-lg font-medium", children: "No hay descargas en cola" }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
        lineNumber: 235,
        columnNumber: 15
      }, void 0),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "mt-1", children: "Agrega elementos desde la vista de contenido para iniciar descargas múltiples" }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
        lineNumber: 236,
        columnNumber: 15
      }, void 0)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
      lineNumber: 231,
      columnNumber: 13
    }, void 0) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-3", children: queue.map((item, index) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
      "div",
      {
        className: `p-4 rounded-xl border transition-all duration-200 ${!item.enabled ? "opacity-50 bg-gray-800/30 border-gray-700/30" : item.status === "completed" ? "bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-500/30" : item.status === "error" ? "bg-gradient-to-r from-red-900/20 to-rose-900/20 border-red-500/30" : item.status === "downloading" ? "bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border-blue-500/30" : "bg-gray-700/30 border-gray-600/30 hover:bg-gray-700/50"}`,
        children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-start gap-3", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-start gap-3 flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                "button",
                {
                  onClick: () => toggleItemEnabled(item.id),
                  className: `mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${item.enabled ? "bg-gradient-to-r from-green-500 to-emerald-500 border-green-400" : "bg-gray-600 border-gray-500"}`,
                  title: item.enabled ? "Desactivar descarga" : "Activar descarga",
                  children: item.enabled && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-3 h-3 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 3, d: "M5 13l4 4L19 7" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
                    lineNumber: 269,
                    columnNumber: 29
                  }, void 0) }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
                    lineNumber: 268,
                    columnNumber: 27
                  }, void 0)
                },
                void 0,
                false,
                {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
                  lineNumber: 258,
                  columnNumber: 23
                },
                void 0
              ),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h4", { className: `font-medium truncate ${item.enabled ? "text-white" : "text-gray-500"}`, children: item.name }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
                    lineNumber: 276,
                    columnNumber: 27
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: `text-xs px-2 py-1 rounded-full flex-shrink-0 ${item.status === "completed" ? "bg-green-500/20 text-green-300" : item.status === "error" ? "bg-red-500/20 text-red-300" : item.status === "downloading" ? "bg-blue-500/20 text-blue-300" : "bg-gray-500/20 text-gray-300"}`, children: [
                    item.status === "pending" && "Pendiente",
                    item.status === "downloading" && "Descargando",
                    item.status === "completed" && "Completado",
                    item.status === "error" && "Error"
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
                    lineNumber: 279,
                    columnNumber: 27
                  }, void 0)
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
                  lineNumber: 275,
                  columnNumber: 25
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex flex-wrap gap-2 mt-2 text-xs text-gray-400", children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "bg-gray-600/30 px-2 py-1 rounded", children: item.version }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
                    lineNumber: 295,
                    columnNumber: 27
                  }, void 0),
                  item.loader && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "bg-blue-500/20 text-blue-300 px-2 py-1 rounded", children: item.loader }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
                    lineNumber: 299,
                    columnNumber: 29
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "bg-purple-500/20 text-purple-300 px-2 py-1 rounded", children: item.platform }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
                    lineNumber: 303,
                    columnNumber: 27
                  }, void 0)
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
                  lineNumber: 294,
                  columnNumber: 25
                }, void 0),
                item.error && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-2 text-sm text-red-400 bg-red-900/20 p-2 rounded-lg", children: [
                  "Error: ",
                  item.error
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
                  lineNumber: 308,
                  columnNumber: 27
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
                lineNumber: 274,
                columnNumber: 23
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
              lineNumber: 256,
              columnNumber: 21
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-2 flex-shrink-0", children: (item.status === "pending" || item.status === "error") && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "button",
              {
                onClick: async () => {
                  const confirmed = await showModernConfirm(
                    "Eliminar de la cola",
                    `¿Estás seguro de que quieres eliminar "${item.name}" de la cola?`,
                    item.status === "error" ? "danger" : "warning"
                  );
                  if (confirmed) {
                    removeFromQueue(item.id);
                  }
                },
                className: `px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${item.status === "error" ? "bg-red-600/80 hover:bg-red-600 text-white" : "text-gray-400 hover:text-red-400"}`,
                title: item.status === "error" ? "Eliminar de la cola" : "Remover de la cola",
                children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
                    lineNumber: 336,
                    columnNumber: 29
                  }, void 0) }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
                    lineNumber: 335,
                    columnNumber: 27
                  }, void 0),
                  item.status === "error" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-sm", children: "Eliminar" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
                    lineNumber: 338,
                    columnNumber: 55
                  }, void 0)
                ]
              },
              void 0,
              true,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
                lineNumber: 317,
                columnNumber: 25
              },
              void 0
            ) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
              lineNumber: 315,
              columnNumber: 21
            }, void 0)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
            lineNumber: 255,
            columnNumber: 19
          }, void 0),
          item.status === "downloading" && item.progress !== void 0 && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-3", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-full bg-gray-600 rounded-full h-2", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "div",
              {
                className: "bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300 ease-out",
                style: { width: `${item.progress}%` }
              },
              void 0,
              false,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
                lineNumber: 347,
                columnNumber: 25
              },
              void 0
            ) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
              lineNumber: 346,
              columnNumber: 23
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-right text-xs text-gray-400 mt-1", children: [
              Math.round(item.progress),
              "%"
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
              lineNumber: 352,
              columnNumber: 23
            }, void 0)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
            lineNumber: 345,
            columnNumber: 21
          }, void 0)
        ]
      },
      `queue-${item.id}-${index}`,
      true,
      {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
        lineNumber: 241,
        columnNumber: 17
      },
      void 0
    )) }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
      lineNumber: 239,
      columnNumber: 13
    }, void 0) }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
      lineNumber: 229,
      columnNumber: 9
    }, void 0),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-6 border-t border-gray-700/50 bg-gray-800/50", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-sm text-gray-400", children: "Modo de descarga:" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
          lineNumber: 367,
          columnNumber: 15
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              onClick: () => setDownloadMode("sequential"),
              className: `px-4 py-2 rounded-lg text-sm font-medium transition-all ${downloadMode === "sequential" ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`,
              children: "En Orden"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
              lineNumber: 369,
              columnNumber: 17
            },
            void 0
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              onClick: () => setDownloadMode("parallel"),
              className: `px-4 py-2 rounded-lg text-sm font-medium transition-all ${downloadMode === "parallel" ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`,
              children: "En Paralelo"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
              lineNumber: 379,
              columnNumber: 17
            },
            void 0
          )
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
          lineNumber: 368,
          columnNumber: 15
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
        lineNumber: 366,
        columnNumber: 13
      }, void 0),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-center", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-sm text-gray-400", children: [
          completedDownloads,
          " de ",
          totalDownloads,
          " completados | ",
          enabledCount,
          " activos"
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
          lineNumber: 393,
          columnNumber: 15
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex gap-3", children: [
          queue.length > 0 && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              onClick: clearCompleted,
              className: "px-4 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium transition-all duration-200",
              disabled: completedDownloads === 0 && errorDownloads === 0,
              children: "Limpiar completados"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
              lineNumber: 398,
              columnNumber: 19
            },
            void 0
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              onClick: onClose,
              className: "px-4 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium transition-all duration-200",
              children: "Cerrar"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
              lineNumber: 406,
              columnNumber: 17
            },
            void 0
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              onClick: startDownload,
              disabled: isStarting || !hasPendingDownloads,
              className: "px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-medium transition-all duration-200 shadow-lg shadow-green-500/20 hover:shadow-green-500/30 disabled:shadow-none",
              children: isStarting ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
                  lineNumber: 419,
                  columnNumber: 23
                }, void 0),
                "Descargando..."
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
                lineNumber: 418,
                columnNumber: 21
              }, void 0) : `Descargar ${enabledCount} ${downloadMode === "sequential" ? "en orden" : "en paralelo"}`
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
              lineNumber: 412,
              columnNumber: 17
            },
            void 0
          )
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
          lineNumber: 396,
          columnNumber: 15
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
        lineNumber: 392,
        columnNumber: 13
      }, void 0)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
      lineNumber: 364,
      columnNumber: 11
    }, void 0) }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
      lineNumber: 363,
      columnNumber: 9
    }, void 0)
  ] }, void 0, true, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
    lineNumber: 209,
    columnNumber: 7
  }, void 0) }, void 0, false, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/MultipleDownloadQueue.tsx",
    lineNumber: 208,
    columnNumber: 5
  }, void 0);
};
const DownloadHistoryModal = ({
  isOpen,
  onClose
}) => {
  const [allDownloads, setAllDownloads] = reactExports.useState([]);
  const [filteredDownloads, setFilteredDownloads] = reactExports.useState([]);
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const [statusFilter, setStatusFilter] = reactExports.useState("all");
  const [multipleQueue, setMultipleQueue] = reactExports.useState([]);
  reactExports.useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = downloadService.subscribe((downloads) => {
      const contentDownloads = downloads.filter((d) => {
        var _a, _b;
        const nameLower = d.name.toLowerCase();
        const urlLower = ((_a = d.url) == null ? void 0 : _a.toLowerCase()) || "";
        const idLower = ((_b = d.id) == null ? void 0 : _b.toLowerCase()) || "";
        return idLower.startsWith("content-") || idLower.startsWith("multiple-") || nameLower.includes(".jar") && (nameLower.includes("mod") || nameLower.includes("fabric") || nameLower.includes("forge") || nameLower.includes("quilt") || nameLower.includes("neoforge")) || nameLower.includes("resourcepack") || nameLower.includes("resource-pack") || nameLower.includes("texture") || nameLower.includes("shader") || nameLower.includes("datapack") || nameLower.includes("data-pack") || urlLower.includes("/mod/") || urlLower.includes("/resourcepack/") || urlLower.includes("/shader/") || urlLower.includes("/datapack/") || urlLower.includes("modrinth.com") || urlLower.includes("curseforge.com") || urlLower.startsWith("content://");
      });
      setAllDownloads(contentDownloads);
    });
    const unsubscribeMultiple = multipleDownloadQueueService.subscribe((queue) => {
      setMultipleQueue(queue);
    });
    return () => {
      unsubscribe();
      unsubscribeMultiple();
    };
  }, [isOpen]);
  reactExports.useEffect(() => {
    let filtered = [...allDownloads];
    if (statusFilter === "completed") {
      filtered = filtered.filter((d) => d.status === "completed");
    } else if (statusFilter === "error") {
      filtered = filtered.filter((d) => d.status === "error");
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (d) => d.name.toLowerCase().includes(term) || d.path && d.path.toLowerCase().includes(term)
      );
    }
    filtered.sort((a, b) => (b.endTime || b.startTime) - (a.endTime || a.startTime));
    setFilteredDownloads(filtered);
  }, [allDownloads, searchTerm, statusFilter]);
  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "text-green-400 bg-green-500/20 border-green-500/30";
      case "error":
        return "text-red-400 bg-red-500/20 border-red-500/30";
      case "downloading":
        return "text-blue-400 bg-blue-500/20 border-blue-500/30";
      case "paused":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
      default:
        return "text-gray-400 bg-gray-500/20 border-gray-500/30";
    }
  };
  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5 text-green-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
          lineNumber: 138,
          columnNumber: 13
        }, void 0) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
          lineNumber: 137,
          columnNumber: 11
        }, void 0);
      case "error":
        return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5 text-red-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
          lineNumber: 144,
          columnNumber: 13
        }, void 0) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
          lineNumber: 143,
          columnNumber: 11
        }, void 0);
      default:
        return null;
    }
  };
  const handleOpenFolder = async (download) => {
    var _a, _b;
    if (download.path) {
      try {
        if ((_b = (_a = window.api) == null ? void 0 : _a.shell) == null ? void 0 : _b.showItemInFolder) {
          await window.api.shell.showItemInFolder(download.path);
        } else {
          await showModernAlert("Error", "No se pudo abrir la carpeta. Ruta: " + download.path, "error");
        }
      } catch (error) {
        console.error("Error opening folder:", error);
        await showModernAlert("Error", "Error al abrir la carpeta: " + error.message, "error");
      }
    }
  };
  const handleClearHistory = async () => {
    const confirmed = await showModernConfirm(
      "Limpiar historial",
      "¿Estás seguro de que quieres limpiar el historial de descargas completadas y con error?",
      "warning"
    );
    if (confirmed) {
      downloadService.clearCompletedAndErrors();
    }
  };
  const handleDeleteDownload = async (downloadId, downloadName) => {
    const confirmed = await showModernConfirm(
      "Eliminar del historial",
      `¿Estás seguro de que quieres eliminar "${downloadName}" del historial?`,
      "danger"
    );
    if (confirmed) {
      downloadService.removeFromHistory(downloadId);
    }
  };
  if (!isOpen) return null;
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/95 backdrop-blur-xl rounded-2xl border border-gray-700/80 shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col", children: [
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-6 border-b border-gray-700/50", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-center mb-4", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h2", { className: "text-2xl font-bold text-white flex items-center gap-2", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-6 h-6 text-purple-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
              lineNumber: 200,
              columnNumber: 19
            }, void 0) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
              lineNumber: 199,
              columnNumber: 17
            }, void 0),
            "Historial de Descargas"
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
            lineNumber: 198,
            columnNumber: 15
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-gray-400 mt-1 text-sm", children: [
            filteredDownloads.length,
            " descarga",
            filteredDownloads.length !== 1 ? "s" : "",
            " encontrada",
            filteredDownloads.length !== 1 ? "s" : ""
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
            lineNumber: 204,
            columnNumber: 15
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
          lineNumber: 197,
          columnNumber: 13
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: onClose,
            className: "text-gray-400 hover:text-white transition-colors p-2",
            children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
              lineNumber: 213,
              columnNumber: 17
            }, void 0) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
              lineNumber: 212,
              columnNumber: 15
            }, void 0)
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
            lineNumber: 208,
            columnNumber: 13
          },
          void 0
        )
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
        lineNumber: 196,
        columnNumber: 11
      }, void 0),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-1 relative", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "h-5 w-5 text-gray-400", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
            lineNumber: 223,
            columnNumber: 19
          }, void 0) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
            lineNumber: 222,
            columnNumber: 17
          }, void 0) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
            lineNumber: 221,
            columnNumber: 15
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "input",
            {
              type: "text",
              placeholder: "Buscar descargas...",
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value),
              className: "block w-full pl-10 pr-3 py-2 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
              lineNumber: 226,
              columnNumber: 15
            },
            void 0
          )
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
          lineNumber: 220,
          columnNumber: 13
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "select",
          {
            value: statusFilter,
            onChange: (e) => setStatusFilter(e.target.value),
            className: "bg-gray-700/50 border border-gray-600 rounded-xl text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "all", children: "Todos" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
                lineNumber: 239,
                columnNumber: 15
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "completed", children: "Completadas" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
                lineNumber: 240,
                columnNumber: 15
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "error", children: "Con error" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
                lineNumber: 241,
                columnNumber: 15
              }, void 0)
            ]
          },
          void 0,
          true,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
            lineNumber: 234,
            columnNumber: 13
          },
          void 0
        ),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: handleClearHistory,
            className: "px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl font-medium transition-all duration-200",
            children: "Limpiar historial"
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
            lineNumber: 243,
            columnNumber: 13
          },
          void 0
        )
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
        lineNumber: 219,
        columnNumber: 11
      }, void 0)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
      lineNumber: 195,
      columnNumber: 9
    }, void 0),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-1 overflow-y-auto p-6", children: filteredDownloads.length === 0 ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-center py-12 text-gray-400", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "mx-auto h-16 w-16 text-gray-500 mb-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1, d: "M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
        lineNumber: 257,
        columnNumber: 17
      }, void 0) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
        lineNumber: 256,
        columnNumber: 15
      }, void 0),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-lg font-medium text-gray-300", children: searchTerm || statusFilter !== "all" ? "No se encontraron descargas" : "No hay historial de descargas" }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
        lineNumber: 259,
        columnNumber: 15
      }, void 0),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-sm mt-2", children: searchTerm || statusFilter !== "all" ? "Intenta con otros filtros" : "Las descargas completadas aparecerán aquí" }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
        lineNumber: 262,
        columnNumber: 15
      }, void 0)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
      lineNumber: 255,
      columnNumber: 13
    }, void 0) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-3", children: filteredDownloads.map((download) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
      "div",
      {
        className: `bg-gray-700/40 rounded-xl p-4 border transition-all ${download.status === "completed" ? "border-green-500/20 hover:border-green-500/40" : download.status === "error" ? "border-red-500/20 hover:border-red-500/40" : "border-gray-600/30 hover:border-gray-500/50"}`,
        children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-start justify-between gap-4", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-2 mb-2", children: [
              getStatusIcon(download.status),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h4", { className: `font-medium truncate ${download.status === "completed" ? "text-green-400" : download.status === "error" ? "text-red-400" : "text-white"}`, children: download.name }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
                lineNumber: 285,
                columnNumber: 25
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: `px-2 py-0.5 text-xs rounded-full border ${getStatusColor(download.status)}`, children: download.status === "completed" ? "Completada" : download.status === "error" ? "Error" : download.status === "downloading" ? "Descargando" : download.status === "paused" ? "Pausada" : "Pendiente" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
                lineNumber: 292,
                columnNumber: 25
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
              lineNumber: 283,
              columnNumber: 23
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-sm text-gray-400 space-y-1", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-4", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: [
                  "Iniciada: ",
                  formatTime(download.startTime)
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
                  lineNumber: 301,
                  columnNumber: 27
                }, void 0),
                download.endTime && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: [
                  "Completada: ",
                  formatTime(download.endTime)
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
                  lineNumber: 303,
                  columnNumber: 29
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
                lineNumber: 300,
                columnNumber: 25
              }, void 0),
              download.path && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-gray-500 truncate", children: download.path }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
                lineNumber: 307,
                columnNumber: 27
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-4", children: [
                download.totalBytes > 0 && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: [
                  "Tamaño: ",
                  formatBytes(download.totalBytes)
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
                  lineNumber: 313,
                  columnNumber: 29
                }, void 0),
                download.progress > 0 && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: [
                  "Progreso: ",
                  Math.round(download.progress),
                  "%"
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
                  lineNumber: 316,
                  columnNumber: 29
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
                lineNumber: 311,
                columnNumber: 25
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
              lineNumber: 299,
              columnNumber: 23
            }, void 0)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
            lineNumber: 282,
            columnNumber: 21
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-2 flex-shrink-0", children: [
            download.path && download.status === "completed" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "button",
              {
                onClick: () => handleOpenFolder(download),
                className: "px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2",
                title: "Abrir carpeta",
                children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
                    lineNumber: 329,
                    columnNumber: 29
                  }, void 0) }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
                    lineNumber: 328,
                    columnNumber: 27
                  }, void 0),
                  "Abrir"
                ]
              },
              void 0,
              true,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
                lineNumber: 323,
                columnNumber: 25
              },
              void 0
            ),
            download.status === "error" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "button",
              {
                onClick: () => handleDeleteDownload(download.id, download.name),
                className: "px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2",
                title: "Eliminar del historial",
                children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
                    lineNumber: 341,
                    columnNumber: 29
                  }, void 0) }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
                    lineNumber: 340,
                    columnNumber: 27
                  }, void 0),
                  "Eliminar"
                ]
              },
              void 0,
              true,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
                lineNumber: 335,
                columnNumber: 25
              },
              void 0
            )
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
            lineNumber: 321,
            columnNumber: 21
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
          lineNumber: 281,
          columnNumber: 19
        }, void 0)
      },
      download.id,
      false,
      {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
        lineNumber: 271,
        columnNumber: 17
      },
      void 0
    )) }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
      lineNumber: 269,
      columnNumber: 13
    }, void 0) }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
      lineNumber: 253,
      columnNumber: 9
    }, void 0)
  ] }, void 0, true, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
    lineNumber: 193,
    columnNumber: 7
  }, void 0) }, void 0, false, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadHistoryModal.tsx",
    lineNumber: 192,
    columnNumber: 5
  }, void 0);
};
const ContentPage = () => {
  const { type = "modpacks", id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [selectedVersion, setSelectedVersion] = reactExports.useState("all");
  const [selectedCategory, setSelectedCategory] = reactExports.useState("all");
  const [sortBy, setSortBy] = reactExports.useState("popular");
  const [selectedInstanceId, setSelectedInstanceId] = reactExports.useState("");
  const [selectedLoader, setSelectedLoader] = reactExports.useState("");
  const [detailVersion, setDetailVersion] = reactExports.useState("");
  const [detailLoader, setDetailLoader] = reactExports.useState("");
  const [compatibleLoaders, setCompatibleLoaders] = reactExports.useState([]);
  const [compatibleVersions, setCompatibleVersions] = reactExports.useState([]);
  const [installationProgress, setInstallationProgress] = reactExports.useState(0);
  const [instances, setInstances] = reactExports.useState([]);
  const [showCustomFolder, setShowCustomFolder] = reactExports.useState(false);
  const [customFolderPath, setCustomFolderPath] = reactExports.useState("");
  const [content, setContent] = reactExports.useState([]);
  const [isLoading, setIsLoading] = reactExports.useState(true);
  const [isDownloading, setIsDownloading] = reactExports.useState({});
  const [downloadProgress, setDownloadProgress] = reactExports.useState({});
  const [selectedContent, setSelectedContent] = reactExports.useState(null);
  const [installedContent, setInstalledContent] = reactExports.useState(/* @__PURE__ */ new Set());
  const [currentPage, setCurrentPage] = reactExports.useState(1);
  const [selectedPlatform, setSelectedPlatform] = reactExports.useState("modrinth");
  reactExports.useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const platformParam = searchParams.get("platform");
    if (platformParam === "curseforge" || platformParam === "modrinth") {
      setSelectedPlatform(platformParam);
    }
  }, [location.search]);
  const [selectedModalProject, setSelectedModalProject] = reactExports.useState(null);
  const [selectedModalMod, setSelectedModalMod] = reactExports.useState(null);
  const [isModalOpen, setIsModalOpen] = reactExports.useState(false);
  const [availableVersions, setAvailableVersions] = reactExports.useState([]);
  const [availableLoaders, setAvailableLoaders] = reactExports.useState([]);
  const itemsPerPage = 20;
  reactExports.useEffect(() => {
    const loadInstancesAndContent = async () => {
      var _a;
      setIsLoading(true);
      try {
        if ((_a = window.api) == null ? void 0 : _a.instances) {
          const userInstances = await window.api.instances.list();
          setInstances(userInstances);
        }
        let results = [];
        if (selectedPlatform === "modrinth") {
          console.log(`Buscando ${type} en Modrinth con término:`, searchQuery);
          results = await window.api.modrinth.search({
            contentType: type,
            search: searchQuery
          });
          console.log("Resultados de Modrinth:", results);
          results = results.map((item) => ({
            ...item,
            platform: "modrinth"
          }));
        } else if (selectedPlatform === "curseforge") {
          console.log(`Buscando ${type} en CurseForge con término:`, searchQuery);
          results = await window.api.curseforge.search({
            contentType: type,
            search: searchQuery
          });
          console.log("Resultados de CurseForge:", results);
          results = results.map((item) => ({
            ...item,
            platform: "curseforge"
          }));
        }
        setContent(results);
        setCurrentPage(1);
      } catch (error) {
        console.error("Error al obtener datos:", error);
        if (error.message && error.message.includes("tiempo")) {
          await showModernAlert("Tiempo de espera agotado", "La solicitud ha tardado demasiado. Por favor, verifica tu conexión e inténtalo de nuevo.", "warning");
        } else {
          await showModernAlert("Error de conexión", "No se pudieron cargar los datos. Por favor, verifica tu conexión e inténtalo de nuevo.", "error");
        }
        setContent([]);
      } finally {
        setIsLoading(false);
      }
    };
    const debounceLoad = setTimeout(() => {
      loadInstancesAndContent();
    }, 500);
    return () => clearTimeout(debounceLoad);
  }, [type, searchQuery, selectedPlatform]);
  const [displayedContent, setDisplayedContent] = reactExports.useState([]);
  const [originalContent, setOriginalContent] = reactExports.useState([]);
  const compatibilityCache = React.useRef(/* @__PURE__ */ new Map());
  const [showDownloadSelectionModal, setShowDownloadSelectionModal] = reactExports.useState(false);
  const [showSingleDownloadModal, setShowSingleDownloadModal] = reactExports.useState(false);
  const [showMultipleDownloadModal, setShowMultipleDownloadModal] = reactExports.useState(false);
  const [showMultipleDownloadQueue, setShowMultipleDownloadQueue] = reactExports.useState(false);
  const [selectedDownloadItem, setSelectedDownloadItem] = reactExports.useState(null);
  const [showDownloadHistoryModal, setShowDownloadHistoryModal] = reactExports.useState(false);
  const handleDownload = (item) => {
    setSelectedDownloadItem(item);
    setShowDownloadSelectionModal(true);
  };
  const handleSingleDownload = async () => {
    var _a, _b, _c, _d;
    if (selectedDownloadItem) {
      setShowDownloadSelectionModal(false);
      try {
        let versionsToUse = [];
        let loadersToUse = [];
        if (selectedPlatform === "modrinth" && ((_b = (_a = window.api) == null ? void 0 : _a.modrinth) == null ? void 0 : _b.getCompatibleVersions)) {
          try {
            console.log("Solicitando versiones de Modrinth para:", selectedDownloadItem.id, "Tipo:", selectedDownloadItem.type);
            const response = await window.api.modrinth.getCompatibleVersions({
              projectId: selectedDownloadItem.id,
              mcVersion: selectedDownloadItem.minecraftVersions[0] || "1.20.1"
            });
            console.log("Respuesta de Modrinth:", response);
            if (response && Array.isArray(response)) {
              const extractedVersionsFromResponse = /* @__PURE__ */ new Set();
              for (const item of response) {
                if (item.game_versions && Array.isArray(item.game_versions)) {
                  for (const version of item.game_versions) {
                    if (typeof version === "string" && version.startsWith("1.") && !version.includes("w") && !version.includes("pre") && !version.includes("rc") && !version.includes("snapshot")) {
                      extractedVersionsFromResponse.add(version);
                    }
                  }
                } else if (item.game_version && typeof item.game_version === "string") {
                  if (item.game_version.startsWith("1.") && !item.game_version.includes("w") && !item.game_version.includes("pre") && !item.game_version.includes("rc") && !item.game_version.includes("snapshot")) {
                    extractedVersionsFromResponse.add(item.game_version);
                  }
                } else if (Array.isArray(item.versions)) {
                  for (const version of item.versions) {
                    if (typeof version === "string" && version.startsWith("1.") && !version.includes("w") && !version.includes("pre") && !version.includes("rc") && !version.includes("snapshot")) {
                      extractedVersionsFromResponse.add(version);
                    }
                  }
                }
              }
              const allPossibleVersions = /* @__PURE__ */ new Set([
                ...extractedVersionsFromResponse,
                ...selectedDownloadItem.minecraftVersions
              ]);
              versionsToUse = Array.from(allPossibleVersions).filter(
                (version) => typeof version === "string" && version.startsWith("1.") && !version.includes("w") && !version.includes("pre") && !version.includes("rc") && !version.includes("snapshot")
              ).sort((a, b) => {
                const aParts = a.split(".").map(Number);
                const bParts = b.split(".").map(Number);
                for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
                  if (aParts[i] !== bParts[i]) {
                    return bParts[i] - aParts[i];
                  }
                }
                return bParts.length - aParts.length;
              });
              console.log("Versiones extraídas de Modrinth (antes de ordenar):", Array.from(extractedVersionsFromResponse));
              console.log("Todas las posibles versiones combinadas:", Array.from(allPossibleVersions));
              console.log("Versiones filtradas finales:", versionsToUse);
              const extractedLoaders = /* @__PURE__ */ new Set();
              for (const item of response) {
                if (item.loaders && Array.isArray(item.loaders)) {
                  for (const loader of item.loaders) {
                    if (typeof loader === "string") {
                      if (selectedDownloadItem.type === "modpacks" || selectedDownloadItem.type === "mods") {
                        if (["forge", "fabric", "quilt", "neoforge"].includes(loader)) {
                          extractedLoaders.add(loader);
                        }
                      } else {
                        extractedLoaders.add(loader);
                      }
                    }
                  }
                } else if (item.loader && typeof item.loader === "string") {
                  if (selectedDownloadItem.type === "modpacks" || selectedDownloadItem.type === "mods") {
                    if (["forge", "fabric", "quilt", "neoforge"].includes(item.loader)) {
                      extractedLoaders.add(item.loader);
                    }
                  } else {
                    extractedLoaders.add(item.loader);
                  }
                }
              }
              loadersToUse = Array.from(extractedLoaders);
              console.log("Loaders extraídos de Modrinth:", loadersToUse);
            }
          } catch (modrinthError) {
            console.error("Error obteniendo datos de Modrinth:", modrinthError);
          }
        } else if (selectedPlatform === "curseforge" && ((_d = (_c = window.api) == null ? void 0 : _c.curseforge) == null ? void 0 : _d.getCompatibleVersions)) {
          try {
            console.log("Solicitando versiones de CurseForge para:", selectedDownloadItem.id, "Tipo:", selectedDownloadItem.type);
            const response = await window.api.curseforge.getCompatibleVersions({
              projectId: selectedDownloadItem.id,
              mcVersion: selectedDownloadItem.minecraftVersions[0] || "1.20.1"
            });
            console.log("Respuesta de CurseForge:", response);
            if (response && Array.isArray(response)) {
              const extractedVersionsFromResponse = /* @__PURE__ */ new Set();
              for (const item of response) {
                if (item.game_versions && Array.isArray(item.game_versions)) {
                  for (const version of item.game_versions) {
                    if (typeof version === "string" && version.startsWith("1.") && !version.includes("w") && !version.includes("pre") && !version.includes("rc") && !version.includes("snapshot")) {
                      extractedVersionsFromResponse.add(version);
                    }
                  }
                } else if (item.gameVersion && typeof item.gameVersion === "string") {
                  if (item.gameVersion.startsWith("1.") && !item.gameVersion.includes("w") && !item.gameVersion.includes("pre") && !item.gameVersion.includes("rc") && !item.gameVersion.includes("snapshot")) {
                    extractedVersionsFromResponse.add(item.gameVersion);
                  }
                } else if (Array.isArray(item.versions)) {
                  for (const version of item.versions) {
                    if (typeof version === "string" && version.startsWith("1.") && !version.includes("w") && !version.includes("pre") && !version.includes("rc") && !version.includes("snapshot")) {
                      extractedVersionsFromResponse.add(version);
                    }
                  }
                }
              }
              const allPossibleVersions = /* @__PURE__ */ new Set([
                ...extractedVersionsFromResponse,
                ...selectedDownloadItem.minecraftVersions
              ]);
              versionsToUse = Array.from(allPossibleVersions).filter(
                (version) => typeof version === "string" && version.startsWith("1.") && !version.includes("w") && !version.includes("pre") && !version.includes("rc") && !version.includes("snapshot")
              ).sort((a, b) => {
                const aParts = a.split(".").map(Number);
                const bParts = b.split(".").map(Number);
                for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
                  if (aParts[i] !== bParts[i]) {
                    return bParts[i] - aParts[i];
                  }
                }
                return bParts.length - aParts.length;
              });
              console.log("Versiones extraídas de CurseForge (antes de ordenar):", Array.from(extractedVersionsFromResponse));
              console.log("Todas las posibles versiones combinadas:", Array.from(allPossibleVersions));
              console.log("Versiones filtradas finales:", versionsToUse);
              const extractedLoaders = /* @__PURE__ */ new Set();
              for (const item of response) {
                if (item.loaders && Array.isArray(item.loaders)) {
                  for (const loader of item.loaders) {
                    if (typeof loader === "string") {
                      if (selectedDownloadItem.type === "modpacks" || selectedDownloadItem.type === "mods") {
                        if (["forge", "fabric", "quilt", "neoforge"].includes(loader)) {
                          extractedLoaders.add(loader);
                        }
                      } else {
                        extractedLoaders.add(loader);
                      }
                    }
                  }
                } else if (item.loader && typeof item.loader === "string") {
                  if (selectedDownloadItem.type === "modpacks" || selectedDownloadItem.type === "mods") {
                    if (["forge", "fabric", "quilt", "neoforge"].includes(item.loader)) {
                      extractedLoaders.add(item.loader);
                    }
                  } else {
                    extractedLoaders.add(item.loader);
                  }
                } else if (item.modLoader && typeof item.modLoader === "string") {
                  const loaderLower = item.modLoader.toLowerCase();
                  if (selectedDownloadItem.type === "modpacks" || selectedDownloadItem.type === "mods") {
                    if (["forge", "fabric", "quilt", "neoforge"].includes(loaderLower)) {
                      extractedLoaders.add(loaderLower);
                    }
                  } else {
                    extractedLoaders.add(loaderLower);
                  }
                }
              }
              loadersToUse = Array.from(extractedLoaders);
              console.log("Loaders extraídos de CurseForge:", loadersToUse);
            }
          } catch (curseError) {
            console.error("Error obteniendo datos de CurseForge:", curseError);
          }
        }
        if (versionsToUse.length === 0) {
          versionsToUse = selectedDownloadItem.minecraftVersions.filter((version) => version.startsWith("1.") && !version.includes("w") && !version.includes("pre") && !version.includes("rc") && !version.includes("snapshot")).sort((a, b) => {
            const [aMajor, aMinor, aPatch] = a.split(".").slice(1).map(Number);
            const [bMajor, bMinor, bPatch] = b.split(".").slice(1).map(Number);
            if (aMajor !== bMajor) return bMajor - aMajor;
            if (aMinor !== bMinor) return bMinor - aMinor;
            return (bPatch || 0) - (aPatch || 0);
          });
        }
        if (loadersToUse.length === 0) {
          loadersToUse = selectedDownloadItem.type === "modpacks" || selectedDownloadItem.type === "mods" ? ["forge", "fabric", "quilt", "neoforge"] : [];
        }
        setAvailableVersions(versionsToUse);
        setAvailableLoaders(loadersToUse);
        console.log("Datos cargados para el modal:", { versions: versionsToUse, loaders: loadersToUse });
        setShowSingleDownloadModal(true);
      } catch (error) {
        console.error("Error general en handleSingleDownload:", error);
        setAvailableVersions(selectedDownloadItem.minecraftVersions.filter((v) => v.startsWith("1.")) || []);
        setAvailableLoaders(["forge", "fabric", "quilt", "neoforge"]);
        setShowSingleDownloadModal(true);
      }
    }
  };
  const handleMultipleDownload = async () => {
    var _a, _b, _c, _d;
    if (selectedDownloadItem) {
      setShowDownloadSelectionModal(false);
      try {
        let versionsToUse = [];
        let loadersToUse = [];
        if (selectedPlatform === "modrinth" && ((_b = (_a = window.api) == null ? void 0 : _a.modrinth) == null ? void 0 : _b.getCompatibleVersions)) {
          try {
            const response = await window.api.modrinth.getCompatibleVersions({
              projectId: selectedDownloadItem.id,
              mcVersion: selectedDownloadItem.minecraftVersions[0] || "1.20.1"
            });
            if (response && Array.isArray(response)) {
              const extractedVersions = /* @__PURE__ */ new Set();
              for (const item of response) {
                if (item.game_versions && Array.isArray(item.game_versions)) {
                  for (const version of item.game_versions) {
                    if (typeof version === "string" && version.startsWith("1.") && !version.includes("w") && !version.includes("pre") && !version.includes("rc") && !version.includes("snapshot")) {
                      extractedVersions.add(version);
                    }
                  }
                } else if (item.game_version && typeof item.game_version === "string") {
                  if (item.game_version.startsWith("1.") && !item.game_version.includes("w") && !item.game_version.includes("pre") && !item.game_version.includes("rc") && !item.game_version.includes("snapshot")) {
                    extractedVersions.add(item.game_version);
                  }
                } else if (Array.isArray(item.versions)) {
                  for (const version of item.versions) {
                    if (typeof version === "string" && version.startsWith("1.") && !version.includes("w") && !version.includes("pre") && !version.includes("rc") && !version.includes("snapshot")) {
                      extractedVersions.add(version);
                    }
                  }
                }
              }
              const allPossibleVersions = /* @__PURE__ */ new Set([
                ...extractedVersions,
                ...selectedDownloadItem.minecraftVersions
              ]);
              versionsToUse = Array.from(allPossibleVersions).filter(
                (version) => typeof version === "string" && version.startsWith("1.") && !version.includes("w") && !version.includes("pre") && !version.includes("rc") && !version.includes("snapshot")
              ).sort((a, b) => {
                const aParts = a.split(".").map(Number);
                const bParts = b.split(".").map(Number);
                for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
                  if (aParts[i] !== bParts[i]) {
                    return bParts[i] - aParts[i];
                  }
                }
                return bParts.length - aParts.length;
              });
              const extractedLoaders = /* @__PURE__ */ new Set();
              for (const item of response) {
                if (item.loaders && Array.isArray(item.loaders)) {
                  for (const loader of item.loaders) {
                    if (typeof loader === "string") {
                      if (selectedDownloadItem.type === "modpacks" || selectedDownloadItem.type === "mods") {
                        if (["forge", "fabric", "quilt", "neoforge"].includes(loader)) {
                          extractedLoaders.add(loader);
                        }
                      } else {
                        extractedLoaders.add(loader);
                      }
                    }
                  }
                } else if (item.loader && typeof item.loader === "string") {
                  if (selectedDownloadItem.type === "modpacks" || selectedDownloadItem.type === "mods") {
                    if (["forge", "fabric", "quilt", "neoforge"].includes(item.loader)) {
                      extractedLoaders.add(item.loader);
                    }
                  } else {
                    extractedLoaders.add(item.loader);
                  }
                }
              }
              loadersToUse = Array.from(extractedLoaders);
            }
          } catch (modrinthError) {
            console.error("Error obteniendo datos de Modrinth para download múltiple:", modrinthError);
          }
        } else if (selectedPlatform === "curseforge" && ((_d = (_c = window.api) == null ? void 0 : _c.curseforge) == null ? void 0 : _d.getCompatibleVersions)) {
          try {
            const response = await window.api.curseforge.getCompatibleVersions({
              projectId: selectedDownloadItem.id,
              mcVersion: selectedDownloadItem.minecraftVersions[0] || "1.20.1"
            });
            if (response && Array.isArray(response)) {
              const processedInfo = extractCurseForgeCompatibilityInfo(response);
              const allPossibleVersions = /* @__PURE__ */ new Set([
                ...processedInfo.gameVersions,
                ...selectedDownloadItem.minecraftVersions
              ]);
              versionsToUse = Array.from(allPossibleVersions).filter((version) => typeof version === "string" && version.startsWith("1.") && !version.includes("w") && !version.includes("pre") && !version.includes("rc") && !version.includes("snapshot")).sort((a, b) => {
                const aParts = a.split(".").map(Number);
                const bParts = b.split(".").map(Number);
                for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
                  if (aParts[i] !== bParts[i]) {
                    return bParts[i] - aParts[i];
                  }
                }
                return bParts.length - aParts.length;
              });
              if (selectedDownloadItem.type === "modpacks" || selectedDownloadItem.type === "mods") {
                loadersToUse = processedInfo.modLoaders.filter(
                  (loader) => ["forge", "fabric", "quilt", "neoforge"].includes(loader)
                );
              } else {
                loadersToUse = processedInfo.modLoaders;
              }
            }
          } catch (curseError) {
            console.error("Error obteniendo datos de CurseForge para download múltiple:", curseError);
          }
        }
        if (versionsToUse.length === 0) {
          versionsToUse = selectedDownloadItem.minecraftVersions.filter((version) => version.startsWith("1.") && !version.includes("w") && !version.includes("pre") && !version.includes("rc") && !version.includes("snapshot")).sort((a, b) => {
            const [aMajor, aMinor, aPatch] = a.split(".").slice(1).map(Number);
            const [bMajor, bMinor, bPatch] = b.split(".").slice(1).map(Number);
            if (aMajor !== bMajor) return bMajor - aMajor;
            if (aMinor !== bMinor) return bMinor - aMinor;
            return (bPatch || 0) - (aPatch || 0);
          });
        }
        if (loadersToUse.length === 0) {
          loadersToUse = selectedDownloadItem.type === "modpacks" || selectedDownloadItem.type === "mods" ? ["forge", "fabric", "quilt", "neoforge"] : [];
        }
        setAvailableVersions(versionsToUse);
        setAvailableLoaders(loadersToUse);
        console.log("Datos cargados para el modal múltiple:", { versions: versionsToUse, loaders: loadersToUse });
        setShowMultipleDownloadModal(true);
      } catch (error) {
        console.error("Error general en handleMultipleDownload:", error);
        setShowMultipleDownloadModal(true);
      }
    }
  };
  const handleStartSingleDownload = async (downloadInfo) => {
    var _a;
    const item = content.find((c) => c.id === downloadInfo.id);
    if (!item) {
      console.error("No se encontró el ítem para descargar:", downloadInfo.id);
      return;
    }
    console.log("Iniciando descarga individual con:", downloadInfo);
    if (downloadInfo.targetPath) {
      if (instances.some((instance) => instance.path === downloadInfo.targetPath)) {
        const instanceId = (_a = instances.find((instance) => instance.path === downloadInfo.targetPath)) == null ? void 0 : _a.id;
        setSelectedInstanceId(instanceId || "");
      } else {
        setSelectedInstanceId("custom");
        setCustomFolderPath(downloadInfo.targetPath);
      }
    } else {
      setSelectedInstanceId("");
    }
    await handleDownloadAndInstallWithParams(item, downloadInfo.version, downloadInfo.loader, downloadInfo.targetPath);
    setShowSingleDownloadModal(false);
  };
  const handleAddToMultipleQueue = (queueItems) => {
    console.log("Agregando a cola múltiple:", queueItems);
    __vitePreload(async () => {
      const { multipleDownloadQueueService: multipleDownloadQueueService2 } = await Promise.resolve().then(() => multipleDownloadQueueService$1);
      return { multipleDownloadQueueService: multipleDownloadQueueService2 };
    }, true ? void 0 : void 0).then(({ multipleDownloadQueueService: multipleDownloadQueueService2 }) => {
      multipleDownloadQueueService2.addToQueue(queueItems);
    });
    setShowMultipleDownloadModal(false);
    setShowMultipleDownloadQueue(true);
  };
  reactExports.useEffect(() => {
    setOriginalContent(content);
    setDisplayedContent(content);
  }, [content, type, selectedPlatform]);
  reactExports.useEffect(() => {
    const checkCompatibility = async () => {
      compatibilityCache.current.clear();
      if (!selectedLoader && selectedVersion === "all") {
        setDisplayedContent([...originalContent]);
        return;
      }
      if (originalContent.length > 0 && (type === "modpacks" || type === "mods")) {
        setIsLoading(true);
        try {
          const versionToCheck = selectedVersion !== "all" ? selectedVersion : null;
          const compatibilityChecks = originalContent.map(async (item) => {
            var _a;
            try {
              const cacheKey = `${item.id}-${item.platform}-${versionToCheck || "any"}-${selectedLoader || "any"}`;
              if (compatibilityCache.current.has(cacheKey)) {
                return compatibilityCache.current.get(cacheKey) ? item : null;
              }
              let compatibleVersions2 = [];
              const mcVersion = versionToCheck || ((_a = item.minecraftVersions) == null ? void 0 : _a[0]) || "1.20.1";
              if (item.platform === "modrinth") {
                compatibleVersions2 = await modrinthAPI.getCompatibleVersions({
                  projectId: item.id,
                  mcVersion,
                  loader: selectedLoader || void 0
                });
              } else if (item.platform === "curseforge") {
                compatibleVersions2 = await window.api.curseforge.getCompatibleVersions({
                  projectId: item.id,
                  mcVersion,
                  loader: selectedLoader || void 0
                });
              }
              const isCompatible = compatibleVersions2.length > 0;
              compatibilityCache.current.set(cacheKey, isCompatible);
              return isCompatible ? item : null;
            } catch (error) {
              console.error(`Error checking compatibility for item ${item.id}:`, error);
              return null;
            }
          });
          const results = await Promise.all(compatibilityChecks);
          const filteredResults = results.filter((item) => item !== null);
          setDisplayedContent(filteredResults);
        } catch (error) {
          console.error("Error en verificación de compatibilidad:", error);
          setDisplayedContent([...originalContent]);
        } finally {
          setIsLoading(false);
        }
      } else {
        if (selectedVersion !== "all") {
          const filtered = originalContent.filter(
            (item) => {
              var _a;
              return (_a = item.minecraftVersions) == null ? void 0 : _a.includes(selectedVersion);
            }
          );
          setDisplayedContent(filtered);
        } else {
          setDisplayedContent([...originalContent]);
        }
      }
    };
    checkCompatibility();
  }, [selectedLoader, selectedVersion, selectedPlatform, originalContent, type]);
  const filteredContent = React.useMemo(() => {
    let result = [...displayedContent];
    if (selectedCategory !== "all") {
      result = result.filter(
        (item) => item.categories && item.categories.includes(selectedCategory)
      );
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) => {
          var _a, _b;
          return item.title.toLowerCase().includes(query) || ((_a = item.description) == null ? void 0 : _a.toLowerCase().includes(query)) || ((_b = item.author) == null ? void 0 : _b.toLowerCase().includes(query));
        }
      );
    }
    result.sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return (b.downloads || 0) - (a.downloads || 0);
        case "recent":
          return new Date(b.lastUpdated || 0).getTime() - new Date(a.lastUpdated || 0).getTime();
        case "name":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
    return result;
  }, [displayedContent, selectedCategory, sortBy, searchQuery]);
  const paginatedContent = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredContent.slice(startIndex, endIndex);
  }, [filteredContent, currentPage, itemsPerPage]);
  const totalPages = Math.ceil(filteredContent.length / itemsPerPage);
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const nextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };
  const prevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };
  reactExports.useEffect(() => {
    const controller = new AbortController();
    const loadSelectedContent = async () => {
      if (id) {
        let item = content.find((item2) => item2.id === id);
        if (item) {
          const updatedItem = { ...item };
          if (item.platform === "curseforge") {
            try {
              const modId = parseInt(item.id, 10);
              if (!isNaN(modId)) {
                const fetchWithTimeout = (promise, timeoutMs) => {
                  return Promise.race([
                    promise,
                    new Promise(
                      (_, reject) => setTimeout(() => reject(new Error("Request timeout")), timeoutMs)
                    )
                  ]);
                };
                const modPromise = fetchWithTimeout(curseForgeAPI.getMod(modId), 1e4);
                const filePromise = fetchWithTimeout(curseForgeAPI.getModFiles(modId), 1e4);
                try {
                  const mod = await modPromise;
                  const modFiles = await filePromise;
                  const allGameVersions = /* @__PURE__ */ new Set();
                  modFiles.forEach((file) => {
                    if (file.gameVersions && Array.isArray(file.gameVersions)) {
                      file.gameVersions.forEach((version) => allGameVersions.add(version));
                    }
                  });
                  const gameVersionsArray = Array.from(allGameVersions);
                  updatedItem.minecraftVersions = gameVersionsArray;
                  updatedItem.description = mod.summary || mod.description || item.description;
                } catch (fetchError) {
                  console.error("CurseForge request timed out or failed:", fetchError);
                }
              }
            } catch (error) {
              console.error("Error processing CurseForge item:", error);
            }
          } else if (item.platform === "modrinth") {
            try {
              const projectId = item.id;
              const fetchWithTimeout = (promise, timeoutMs) => {
                return Promise.race([
                  promise,
                  new Promise(
                    (_, reject) => setTimeout(() => reject(new Error("Request timeout")), timeoutMs)
                  )
                ]);
              };
              try {
                const project = await fetchWithTimeout(modrinthAPI.getProject(projectId), 1e4);
                updatedItem.description = project.description || project.body || item.description;
              } catch (fetchError) {
                console.error("Modrinth request timed out or failed:", fetchError);
              }
            } catch (error) {
              console.error("Error processing Modrinth item:", error);
            }
          }
          setSelectedContent(updatedItem);
          await loadCompatibleVersionsAndLoaders(updatedItem);
        } else {
          setSelectedContent(null);
          setCompatibleVersions([]);
          setCompatibleLoaders([]);
        }
      } else {
        setSelectedContent(null);
        setCompatibleVersions([]);
        setCompatibleLoaders([]);
      }
    };
    loadSelectedContent();
    return () => {
      controller.abort();
    };
  }, [id, content]);
  const loadCompatibleVersionsAndLoaders = async (item) => {
    try {
      if (selectedPlatform === "modrinth" && window.api.modrinth.getCompatibleVersions) {
        let allVersions = [];
        let allLoaders = [];
        allVersions = [...new Set(item.minecraftVersions)];
        try {
          const allCompatibleVersions = await window.api.modrinth.getCompatibleVersions({
            projectId: item.id,
            mcVersion: item.minecraftVersions[0] || "1.20.1"
            // Usamos la primera versión disponible para obtener los datos
            // No especificamos loader para obtener todas las combinaciones posibles
          });
          const gameVersions = /* @__PURE__ */ new Set();
          allCompatibleVersions.forEach((version) => {
            if (version.game_versions) {
              version.game_versions.forEach((v) => gameVersions.add(v));
            }
          });
          allVersions = Array.from(/* @__PURE__ */ new Set([...allVersions, ...gameVersions])).filter((version) => {
            const isStableVersion = /^1\.\d{1,2}(\.\d{1,2})?$/.test(version);
            const isNotPreRelease = !version.includes("pre");
            const isNotReleaseCandidate = !version.includes("rc");
            const isNotSnapshot = !version.includes("snapshot");
            const isNotWeekVersion = !version.includes("w");
            const isNotSpecial = !version.includes("infinite");
            const isNotHyphenated = !version.includes("-");
            return isStableVersion && isNotPreRelease && isNotReleaseCandidate && isNotSnapshot && isNotWeekVersion && isNotSpecial && isNotHyphenated;
          }).sort((a, b) => {
            const [aMajor, aMinor, aPatch] = a.split(".").map(Number);
            const [bMajor, bMinor, bPatch] = b.split(".").map(Number);
            if (aMajor !== bMajor) return bMajor - aMajor;
            if (aMinor !== bMinor) return bMinor - aMinor;
            return (bPatch || 0) - (aPatch || 0);
          });
          const loaderSet = /* @__PURE__ */ new Set();
          allCompatibleVersions.forEach((version) => {
            if (version.loaders) {
              version.loaders.forEach((l) => loaderSet.add(l));
            }
          });
          allLoaders = Array.from(loaderSet);
        } catch (apiError) {
          console.error("Error obteniendo versiones compatibles de Modrinth:", apiError);
          allVersions = item.minecraftVersions.filter((version) => {
            const isStableVersion = /^1\.\d{1,2}(\.\d{1,2})?$/.test(version);
            const isNotPreRelease = !version.includes("pre");
            const isNotReleaseCandidate = !version.includes("rc");
            const isNotSnapshot = !version.includes("snapshot");
            const isNotWeekVersion = !version.includes("w");
            const isNotSpecial = !version.includes("infinite");
            const isNotHyphenated = !version.includes("-");
            return isStableVersion && isNotPreRelease && isNotReleaseCandidate && isNotSnapshot && isNotWeekVersion && isNotSpecial && isNotHyphenated;
          }).sort((a, b) => {
            const [aMajor, aMinor, aPatch] = a.split(".").map(Number);
            const [bMajor, bMinor, bPatch] = b.split(".").map(Number);
            if (aMajor !== bMajor) return bMajor - aMajor;
            if (aMinor !== bMinor) return bMinor - aMinor;
            return (bPatch || 0) - (aPatch || 0);
          });
          allLoaders = ["forge", "fabric", "quilt", "neoforge"];
        }
        setCompatibleVersions(allVersions);
        setCompatibleLoaders(allLoaders);
      } else if (selectedPlatform === "curseforge" && window.api.curseforge.getCompatibleVersions) {
        let allVersions = [];
        let allLoaders = [];
        allVersions = [...new Set(item.minecraftVersions)];
        console.log("DEBUG - CurseForge: Iniciando carga de compatibilidad para item:", item);
        console.log("DEBUG - CurseForge: projectId:", item.id);
        console.log("DEBUG - CurseForge: mcVersions disponibles:", item.minecraftVersions);
        if (!item.minecraftVersions || item.minecraftVersions.length === 0) {
          console.log("DEBUG - CurseForge: No hay versiones en el item original, usando versiones comunes como fallback");
          allVersions = [
            "1.21.1",
            "1.21",
            "1.20.6",
            "1.20.5",
            "1.20.4",
            "1.20.3",
            "1.20.2",
            "1.20.1",
            "1.19.4",
            "1.19.3",
            "1.19.2",
            "1.18.2",
            "1.17.1",
            "1.16.5",
            "1.15.2",
            "1.14.4",
            "1.13.2",
            "1.12.2",
            "1.11.2",
            "1.10.2",
            "1.9.4",
            "1.8.9"
          ];
        }
        try {
          console.log("DEBUG - CurseForge: Intentando llamar a la API para compatibilidad...");
          const mcVersionToUse = item.minecraftVersions && item.minecraftVersions.length > 0 ? item.minecraftVersions[0] : "1.20.1";
          console.log("DEBUG - CurseForge: Llamando API con projectId:", item.id, "y mcVersion:", mcVersionToUse);
          const curseForgeResponse = await window.api.curseforge.getCompatibleVersions({
            projectId: item.id,
            mcVersion: mcVersionToUse
            // No especificamos loader para obtener todos los disponibles
          });
          console.log("DEBUG - CurseForge: Respuesta de la API:", curseForgeResponse);
          if (curseForgeResponse && Array.isArray(curseForgeResponse) && curseForgeResponse.length > 0) {
            console.log("DEBUG - CurseForge: Procesando", curseForgeResponse.length, "elementos de la respuesta");
            const processedInfo = extractCurseForgeCompatibilityInfo(curseForgeResponse);
            console.log("DEBUG - CurseForge: Información procesada:", processedInfo);
            allVersions = processedInfo.gameVersions.filter((version) => {
              const isStableVersion = /^1\.\d{1,2}(\.\d{1,2})?$/.test(version);
              const isNotPreRelease = !version.includes("pre");
              const isNotReleaseCandidate = !version.includes("rc");
              const isNotSnapshot = !version.includes("snapshot");
              const isNotWeekVersion = !version.includes("w");
              const isNotSpecial = !version.includes("infinite");
              const isNotHyphenated = !version.includes("-");
              return isStableVersion && isNotPreRelease && isNotReleaseCandidate && isNotSnapshot && isNotWeekVersion && isNotSpecial && isNotHyphenated;
            }).sort((a, b) => {
              const [aMajor, aMinor, aPatch] = a.split(".").map(Number);
              const [bMajor, bMinor, bPatch] = b.split(".").map(Number);
              if (aMajor !== bMajor) return bMajor - aMajor;
              if (aMinor !== bMinor) return bMinor - aMinor;
              return (bPatch || 0) - (aPatch || 0);
            });
            allLoaders = processedInfo.modLoaders;
            console.log("DEBUG - CurseForge: Versiones finales (filtradas):", allVersions);
            console.log("DEBUG - CurseForge: Loaders finales:", allLoaders);
          } else {
            console.log("DEBUG - CurseForge: No se recibieron datos compatibles, usando info del item original");
            allVersions = item.minecraftVersions.filter((version) => {
              const isStableVersion = /^1\.\d{1,2}(\.\d{1,2})?$/.test(version);
              const isNotPreRelease = !version.includes("pre");
              const isNotReleaseCandidate = !version.includes("rc");
              const isNotSnapshot = !version.includes("snapshot");
              const isNotWeekVersion = !version.includes("w");
              const isNotSpecial = !version.includes("infinite");
              const isNotHyphenated = !version.includes("-");
              return isStableVersion && isNotPreRelease && isNotReleaseCandidate && isNotSnapshot && isNotWeekVersion && isNotSpecial && isNotHyphenated;
            }).sort((a, b) => {
              const [aMajor, aMinor, aPatch] = a.split(".").map(Number);
              const [bMajor, bMinor, bPatch] = b.split(".").map(Number);
              if (aMajor !== bMajor) return bMajor - aMajor;
              if (aMinor !== bMinor) return bMinor - aMinor;
              return (bPatch || 0) - (aPatch || 0);
            });
            if (item.type === "modpacks" || item.type === "mods") {
              allLoaders = ["forge", "fabric", "quilt", "neoforge"];
            } else {
              allLoaders = [];
            }
          }
        } catch (error) {
          console.error("ERROR - CurseForge: Error obteniendo compatibilidad de CurseForge, usando datos del item:", error);
          console.error("ERROR - CurseForge: Detalles del error:", error instanceof Error ? error.message : "Error desconocido");
          allVersions = item.minecraftVersions.filter((version) => {
            const isStableVersion = /^1\.\d{1,2}(\.\d{1,2})?$/.test(version);
            const isNotPreRelease = !version.includes("pre");
            const isNotReleaseCandidate = !version.includes("rc");
            const isNotSnapshot = !version.includes("snapshot");
            const isNotWeekVersion = !version.includes("w");
            const isNotSpecial = !version.includes("infinite");
            const isNotHyphenated = !version.includes("-");
            return isStableVersion && isNotPreRelease && isNotReleaseCandidate && isNotSnapshot && isNotWeekVersion && isNotSpecial && isNotHyphenated;
          }).sort((a, b) => {
            const [aMajor, aMinor, aPatch] = a.split(".").map(Number);
            const [bMajor, bMinor, bPatch] = b.split(".").map(Number);
            if (aMajor !== bMajor) return bMajor - aMajor;
            if (aMinor !== bMinor) return bMinor - aMinor;
            return (bPatch || 0) - (aPatch || 0);
          });
          if (item.type === "modpacks" || item.type === "mods") {
            allLoaders = ["forge", "fabric", "quilt", "neoforge"];
          } else {
            allLoaders = [];
          }
        }
        setCompatibleVersions(allVersions);
        setCompatibleLoaders(allLoaders);
      } else {
        const filteredVersions = item.minecraftVersions.filter((version) => {
          const isStableVersion = /^1\.\d{1,2}(\.\d{1,2})?$/.test(version);
          const isNotPreRelease = !version.includes("pre");
          const isNotReleaseCandidate = !version.includes("rc");
          const isNotSnapshot = !version.includes("snapshot");
          const isNotWeekVersion = !version.includes("w");
          const isNotSpecial = !version.includes("infinite");
          const isNotHyphenated = !version.includes("-");
          return isStableVersion && isNotPreRelease && isNotReleaseCandidate && isNotSnapshot && isNotWeekVersion && isNotSpecial && isNotHyphenated;
        }).sort((a, b) => {
          const [aMajor, aMinor, aPatch] = a.split(".").map(Number);
          const [bMajor, bMinor, bPatch] = b.split(".").map(Number);
          if (aMajor !== bMajor) return bMajor - aMajor;
          if (aMinor !== bMinor) return bMinor - aMinor;
          return (bPatch || 0) - (aPatch || 0);
        });
        setCompatibleVersions(filteredVersions);
        let possibleLoaders = [];
        if (item.type === "modpacks" || item.type === "mods") {
          possibleLoaders = ["forge", "fabric", "quilt", "neoforge"];
        }
        setCompatibleLoaders(possibleLoaders);
      }
    } catch (error) {
      console.error("Error al cargar versiones y loaders compatibles:", error);
      const filteredVersions = item.minecraftVersions.filter((version) => {
        const isStableVersion = /^1\.\d{1,2}(\.\d{1,2})?$/.test(version);
        const isNotPreRelease = !version.includes("pre");
        const isNotReleaseCandidate = !version.includes("rc");
        const isNotSnapshot = !version.includes("snapshot");
        const isNotWeekVersion = !version.includes("w");
        const isNotSpecial = !version.includes("infinite");
        const isNotHyphenated = !version.includes("-");
        return isStableVersion && isNotPreRelease && isNotReleaseCandidate && isNotSnapshot && isNotWeekVersion && isNotSpecial && isNotHyphenated;
      }).sort((a, b) => {
        const [aMajor, aMinor, aPatch] = a.split(".").map(Number);
        const [bMajor, bMinor, bPatch] = b.split(".").map(Number);
        if (aMajor !== bMajor) return bMajor - aMajor;
        if (aMinor !== bMinor) return bMinor - aMinor;
        return (bPatch || 0) - (aPatch || 0);
      });
      setCompatibleVersions(filteredVersions);
      let possibleLoaders = [];
      if (item.type === "modpacks" || item.type === "mods") {
        possibleLoaders = ["forge", "fabric", "quilt", "neoforge"];
      }
      setCompatibleLoaders(possibleLoaders);
    }
  };
  reactExports.useEffect(() => {
    if (selectedInstanceId && selectedContent) {
      if (installedContent.has(`${selectedInstanceId}-${selectedContent.id}`)) ;
    }
  }, [selectedInstanceId, selectedContent, installedContent]);
  reactExports.useEffect(() => {
    if (selectedContent) {
      loadCompatibleVersionsAndLoaders(selectedContent);
    }
  }, [selectedContent, selectedPlatform]);
  const handleContentClick = (itemId) => {
    const item = content.find((i) => i.id === itemId);
    if (!item) return;
    navigate(`/contenido/${type}/${item.id}`);
  };
  const handleBackToList = () => {
    navigate(`/contenido/${type}`);
  };
  const handleDownloadAndInstallWithParams = async (item, mcVersion, loader, targetPathParam) => {
    setIsDownloading((prev) => ({ ...prev, [item.id]: true }));
    setInstallationProgress(0);
    try {
      let contentType;
      switch (item.type) {
        case "resourcepacks":
          contentType = "resourcepack";
          break;
        case "shaders":
          contentType = "shader";
          break;
        case "datapacks":
          contentType = "datapack";
          break;
        case "modpacks":
          contentType = "modpack";
          break;
        default:
          contentType = "mod";
      }
      const hasTargetPath = targetPathParam && targetPathParam.trim() !== "";
      if (!selectedInstanceId && !hasTargetPath) {
        const userChoice = await showModernConfirm(
          "Sin instancia seleccionada",
          `No has seleccionado una instancia.
¿Quieres descargar "${item.title}" directamente a la zona de descargas?

Cancela para seleccionar una instancia en su lugar.`,
          "info"
        );
        if (!userChoice) {
          await showModernAlert("Información", "Por favor, selecciona una instancia para instalar el contenido.", "info");
          return;
        }
        let compatibleVersions2 = [];
        if (selectedPlatform === "modrinth") {
          compatibleVersions2 = await window.api.modrinth.getCompatibleVersions({
            projectId: item.id,
            mcVersion: mcVersion || item.minecraftVersions[0] || "1.20.1",
            loader
          });
        } else if (selectedPlatform === "curseforge") {
          compatibleVersions2 = await window.api.curseforge.getCompatibleVersions({
            projectId: item.id,
            mcVersion: mcVersion || item.minecraftVersions[0] || "1.20.1",
            loader
          });
        }
        if (compatibleVersions2.length === 0) {
          alert("No se encontraron versiones compatibles para descargar");
          return;
        }
        const targetVersion = compatibleVersions2[0];
        let primaryFile = null;
        if (selectedPlatform === "modrinth") {
          primaryFile = targetVersion.files.find((f) => f.primary) || targetVersion.files[0];
        } else if (selectedPlatform === "curseforge") {
          primaryFile = targetVersion.files ? targetVersion.files[0] : null;
        }
        if (!primaryFile) {
          await showModernAlert("Sin archivos", "No se encontraron archivos para descargar", "warning");
          return;
        }
        downloadService.downloadFile(
          primaryFile.url || primaryFile.downloadUrl,
          primaryFile.filename || primaryFile.fileName,
          item.title
        );
        await showModernAlert("Descarga iniciada", `${item.title} se está descargando en la zona de descargas.`, "success");
      } else {
        if (hasTargetPath) {
          if (!mcVersion || mcVersion === "all" || mcVersion === "") {
            await showModernAlert("Campo requerido", "Por favor, selecciona una versión de Minecraft.", "warning");
            return;
          }
          if ((contentType === "mod" || contentType === "modpack") && !loader) {
            await showModernAlert("Campo requerido", "Por favor, selecciona un loader compatible.", "warning");
            return;
          }
          let compatibleVersionsCheck = [];
          if (selectedPlatform === "modrinth" && window.api.modrinth.getCompatibleVersions) {
            compatibleVersionsCheck = await window.api.modrinth.getCompatibleVersions({
              projectId: item.id,
              mcVersion,
              loader: loader || void 0
            });
          } else if (selectedPlatform === "curseforge" && window.api.curseforge.getCompatibleVersions) {
            compatibleVersionsCheck = await window.api.curseforge.getCompatibleVersions({
              projectId: item.id,
              mcVersion,
              loader: loader || void 0
            });
          }
          if (compatibleVersionsCheck.length === 0) {
            await showModernAlert("Versión no compatible", `No se encontró una versión compatible para ${mcVersion} y ${loader || "cualquier loader"}. Por favor selecciona combinaciones diferentes.`, "warning");
            return;
          }
        } else {
          if (selectedInstanceId && selectedInstanceId !== "custom") {
            if (selectedContent && installedContent.has(`${selectedInstanceId}-${selectedContent.id}`)) {
              await showModernAlert("Ya instalado", `El contenido "${item.title}" ya está instalado en la instancia seleccionada.`, "info");
              return;
            }
          }
          if (!mcVersion || mcVersion === "all" || mcVersion === "") {
            await showModernAlert("Campo requerido", "Por favor, selecciona una versión de Minecraft.", "warning");
            return;
          }
          if ((contentType === "mod" || contentType === "modpack") && !loader) {
            await showModernAlert("Campo requerido", "Por favor, selecciona un loader compatible.", "warning");
            return;
          }
          let compatibleVersionsCheck = [];
          if (selectedPlatform === "modrinth" && window.api.modrinth.getCompatibleVersions) {
            compatibleVersionsCheck = await window.api.modrinth.getCompatibleVersions({
              projectId: item.id,
              mcVersion,
              loader: loader || void 0
            });
          } else if (selectedPlatform === "curseforge" && window.api.curseforge.getCompatibleVersions) {
            compatibleVersionsCheck = await window.api.curseforge.getCompatibleVersions({
              projectId: item.id,
              mcVersion,
              loader: loader || void 0
            });
          }
          if (compatibleVersionsCheck.length === 0) {
            await showModernAlert("Versión no compatible", `No se encontró una versión compatible para ${mcVersion} y ${loader || "cualquier loader"}. Por favor selecciona combinaciones diferentes.`, "warning");
            return;
          }
          if (contentType === "modpack") {
            let hasSpecificVersion = false;
            if (selectedPlatform === "modrinth") {
              hasSpecificVersion = compatibleVersionsCheck.some(
                (version) => version.game_versions.includes(mcVersion) && (!loader || version.loaders.includes(loader))
              );
            } else if (selectedPlatform === "curseforge") {
              hasSpecificVersion = compatibleVersionsCheck.length > 0;
            }
            if (!hasSpecificVersion) {
              await showModernAlert("Versión no compatible", `El modpack no tiene una versión compatible para ${mcVersion} y ${loader || "cualquier loader"}. Por favor selecciona combinaciones diferentes.`, "warning");
              return;
            }
          }
        }
        let instancePath = "";
        if (hasTargetPath) {
          instancePath = targetPathParam;
        } else if (selectedInstanceId === "custom") {
          if (customFolderPath) {
            instancePath = customFolderPath;
          } else {
            alert("Por favor, selecciona una carpeta personalizada.");
            return;
          }
        } else {
          const selectedInstance = instances.find((instance) => instance.id === selectedInstanceId);
          if (selectedInstance) {
            instancePath = selectedInstance.path;
          }
        }
        if (!instancePath && !hasTargetPath) {
          alert("No se pudo encontrar la instancia seleccionada.");
          return;
        }
        const versionToUse = mcVersion && mcVersion !== "all" && mcVersion !== "" ? mcVersion : item.minecraftVersions[0] || "1.20.1";
        const requiresLoader = contentType === "mod" || contentType === "modpack";
        const loaderToUse = requiresLoader && loader ? loader : void 0;
        const downloadId = `content-${item.id}-${Date.now()}`;
        const startTime = Date.now();
        downloadService.addDownloadToHistory({
          id: downloadId,
          name: item.title,
          url: `content://${item.platform}/${item.id}`,
          status: "downloading",
          progress: 0,
          downloadedBytes: 0,
          totalBytes: 1e6,
          // Valor estimado
          startTime,
          speed: 0,
          path: instancePath,
          profileUsername: void 0
        });
        const progressInterval = setInterval(() => {
          setInstallationProgress((prev) => {
            const newProgress = prev >= 95 ? 95 : prev + 1;
            const currentDownload = downloadService.getAllDownloads().find((d) => d.id === downloadId);
            if (currentDownload) {
              downloadService.addDownloadToHistory({
                ...currentDownload,
                progress: newProgress,
                downloadedBytes: Math.round(newProgress / 100 * (currentDownload.totalBytes || 1e6))
              });
            }
            return newProgress;
          });
        }, 200);
        try {
          await window.api.instances.installContent({
            instancePath,
            contentId: item.id,
            contentType,
            mcVersion: versionToUse,
            loader: loaderToUse,
            versionId: void 0
          });
          if (selectedInstanceId !== "custom") {
            setInstalledContent((prev) => new Set(prev).add(`${selectedInstanceId}-${item.id}`));
          }
          setInstallationProgress(100);
          clearInterval(progressInterval);
          downloadService.addDownloadToHistory({
            id: downloadId,
            name: item.title,
            url: `content://${item.platform}/${item.id}`,
            status: "completed",
            progress: 100,
            downloadedBytes: 1e6,
            totalBytes: 1e6,
            startTime,
            endTime: Date.now(),
            speed: 0,
            path: instancePath,
            profileUsername: void 0
          });
          await new Promise((resolve) => setTimeout(resolve, 300));
          await showModernAlert("¡Contenido instalado!", `${item.title} ha sido instalado en la ubicación seleccionada.`, "success");
        } catch (error) {
          clearInterval(progressInterval);
          setInstallationProgress(0);
          downloadService.addDownloadToHistory({
            id: downloadId,
            name: item.title,
            url: `content://${item.platform}/${item.id}`,
            status: "error",
            progress: 0,
            downloadedBytes: 0,
            totalBytes: 0,
            startTime,
            endTime: Date.now(),
            speed: 0,
            path: instancePath,
            profileUsername: void 0
          });
          throw error;
        }
      }
    } catch (error) {
      console.error("Error al manejar el contenido:", error);
      await showModernAlert("Error", error instanceof Error ? error.message : "Error desconocido", "error");
    } finally {
      setIsDownloading((prev) => ({ ...prev, [item.id]: false }));
      setInstallationProgress(0);
    }
  };
  ["all", ...Array.from(new Set(content.flatMap((item) => item.minecraftVersions)))];
  ["all", ...Array.from(new Set(content.flatMap((item) => item.categories)))];
  const scrollbarStyles = `
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    ::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      transition: all 0.2s ease;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  `;
  reactExports.useEffect(() => {
    const unsubscribe = downloadService.subscribe((downloads) => {
      setTimeout(() => {
        const newProgress = {};
        const newDownloading = {};
        downloads.forEach((download) => {
          newProgress[download.id] = download.progress;
          if (download.status === "downloading" || download.status === "pending") {
            newDownloading[download.id] = true;
          }
        });
        setDownloadProgress(newProgress);
        setIsDownloading(newDownloading);
      }, 0);
    });
    return () => {
      unsubscribe();
    };
  }, []);
  if (isLoading) {
    return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
      lineNumber: 1942,
      columnNumber: 9
    }, void 0) }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
      lineNumber: 1941,
      columnNumber: 7
    }, void 0);
  }
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-6 max-w-7xl mx-auto", children: [
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("style", { dangerouslySetInnerHTML: { __html: scrollbarStyles } }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
      lineNumber: 1950,
      columnNumber: 7
    }, void 0),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "relative mb-6", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "absolute inset-0 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-2xl -z-10 blur-xl opacity-50" }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
        lineNumber: 1954,
        columnNumber: 9
      }, void 0),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex flex-wrap gap-2 overflow-x-auto pb-2", children: ["modpacks", "mods", "resourcepacks", "datapacks", "shaders"].map((tab) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
        "button",
        {
          onClick: () => navigate(`/contenido/${tab}`),
          className: `px-5 py-2.5 rounded-xl font-medium transition-all duration-300 whitespace-nowrap relative overflow-hidden group ${type === tab ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30" : "bg-gray-800/70 text-gray-300 hover:bg-gray-700/80 hover:text-white"}`,
          children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "relative z-10", children: tab.charAt(0).toUpperCase() + tab.slice(1).replace("packs", " Packs").replace("mods", "Mods") }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
              lineNumber: 1966,
              columnNumber: 15
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: `absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 transition-opacity duration-300 ${type === tab ? "opacity-100" : "opacity-0 group-hover:opacity-100"}` }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
              lineNumber: 1969,
              columnNumber: 15
            }, void 0)
          ]
        },
        tab,
        true,
        {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
          lineNumber: 1957,
          columnNumber: 13
        },
        void 0
      )) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
        lineNumber: 1955,
        columnNumber: 9
      }, void 0)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
      lineNumber: 1953,
      columnNumber: 7
    }, void 0),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex flex-col lg:flex-row gap-6", children: [
      !selectedContent && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "lg:w-72 flex-shrink-0", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/50 backdrop-blur-sm rounded-2xl p-5 border border-gray-700/50 shadow-lg", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex flex-col items-center gap-3 mb-6 overflow-x-auto pb-2 relative", children: [
          ["modrinth", "curseforge"].map((platform) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              onClick: () => setSelectedPlatform(platform),
              className: `flex items-center px-4 py-2 rounded-xl font-medium transition-all duration-300 relative overflow-hidden group w-full ${selectedPlatform === platform ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30" : "bg-gray-800/70 text-gray-300 hover:bg-gray-700/80 hover:text-white"}`,
              children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "flex items-center justify-center relative z-10 w-full", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  "img",
                  {
                    src: platform === "modrinth" ? "https://cdn.modrinth.com/static/logo-cubeonly.5f38e9dd.png" : "https://www.curseforge.com/themes/custom/cf/images/logos/curseforge.svg",
                    alt: platform === "modrinth" ? "Modrinth" : "CurseForge",
                    className: "w-5 h-5 mr-2",
                    onError: (e) => {
                      const target = e.target;
                      target.onerror = null;
                      if (platform === "modrinth") {
                        target.src = "https://modrinth.com/favicon.ico";
                      } else {
                        target.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/CurseForge_Logo.svg/640px-CurseForge_Logo.svg.png";
                      }
                    }
                  },
                  void 0,
                  false,
                  {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 1995,
                    columnNumber: 21
                  },
                  void 0
                ),
                platform === "modrinth" ? "Modrinth" : "CurseForge"
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                lineNumber: 1994,
                columnNumber: 19
              }, void 0)
            },
            platform,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
              lineNumber: 1985,
              columnNumber: 17
            },
            void 0
          )),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "absolute top-0 right-0", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            Tooltip,
            {
              content: `Guía de instalación:

1. Selecciona una plataforma (Modrinth o CurseForge)
2. Elige el tipo de contenido
3. Usa los filtros para encontrar lo que necesitas
4. Haz clic en "Detalles" para ver información adicional
5. Haz clic en "Descargar" para iniciar el proceso
6. En la ventana modal, selecciona la versión y destino
7. Confirma la descarga`,
              position: "left",
              children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("button", { className: "text-gray-400 hover:text-white p-1 rounded-full bg-gray-700/50", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                lineNumber: 2022,
                columnNumber: 23
              }, void 0) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                lineNumber: 2021,
                columnNumber: 21
              }, void 0) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                lineNumber: 2020,
                columnNumber: 19
              }, void 0)
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
              lineNumber: 2016,
              columnNumber: 17
            },
            void 0
          ) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
            lineNumber: 2015,
            columnNumber: 15
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
          lineNumber: 1983,
          columnNumber: 13
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-semibold text-white mb-4 flex items-center", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5 mr-2 text-blue-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
            lineNumber: 2031,
            columnNumber: 17
          }, void 0) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
            lineNumber: 2030,
            columnNumber: 15
          }, void 0),
          "Filtros"
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
          lineNumber: 2029,
          columnNumber: 13
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mb-6", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Buscar" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
            lineNumber: 2038,
            columnNumber: 15
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "relative", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "h-5 w-5 text-gray-400", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
              lineNumber: 2042,
              columnNumber: 21
            }, void 0) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
              lineNumber: 2041,
              columnNumber: 19
            }, void 0) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
              lineNumber: 2040,
              columnNumber: 17
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "input",
              {
                type: "text",
                placeholder: "Buscar contenido...",
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                className: "block w-full pl-10 pr-3 py-2.5 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              },
              void 0,
              false,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                lineNumber: 2045,
                columnNumber: 17
              },
              void 0
            )
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
            lineNumber: 2039,
            columnNumber: 15
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
          lineNumber: 2037,
          columnNumber: 13
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mb-6", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Versión de Minecraft" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
            lineNumber: 2057,
            columnNumber: 15
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "relative", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "select",
              {
                value: selectedVersion,
                onChange: (e) => setSelectedVersion(e.target.value),
                className: "appearance-none w-full bg-gray-700/50 border border-gray-600 rounded-xl text-white pl-3 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200",
                children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "all", children: "Todas las versiones" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2064,
                    columnNumber: 19
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "1.21.10", children: "1.21.10" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2066,
                    columnNumber: 19
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "1.21.9", children: "1.21.9" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2067,
                    columnNumber: 19
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "1.21.8", children: "1.21.8" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2068,
                    columnNumber: 19
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "1.21.7", children: "1.21.7" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2069,
                    columnNumber: 19
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "1.21.6", children: "1.21.6" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2070,
                    columnNumber: 19
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "1.21.5", children: "1.21.5" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2071,
                    columnNumber: 19
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "1.21.4", children: "1.21.4" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2072,
                    columnNumber: 19
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "1.21.3", children: "1.21.3" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2073,
                    columnNumber: 19
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "1.21.2", children: "1.21.2" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2074,
                    columnNumber: 19
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "1.21.1", children: "1.21.1" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2075,
                    columnNumber: 19
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "1.21", children: "1.21" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2076,
                    columnNumber: 19
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "1.20.6", children: "1.20.6" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2077,
                    columnNumber: 19
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "1.20.5", children: "1.20.5" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2078,
                    columnNumber: 19
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "1.20.4", children: "1.20.4" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2079,
                    columnNumber: 19
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "1.20.3", children: "1.20.3" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2080,
                    columnNumber: 19
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "1.20.2", children: "1.20.2" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2081,
                    columnNumber: 19
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "1.20.1", children: "1.20.1" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2082,
                    columnNumber: 19
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "1.19.4", children: "1.19.4" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2083,
                    columnNumber: 19
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "1.19.3", children: "1.19.3" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2084,
                    columnNumber: 19
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "1.19.2", children: "1.19.2" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2085,
                    columnNumber: 19
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "1.18.2", children: "1.18.2" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2086,
                    columnNumber: 19
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "1.17.1", children: "1.17.1" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2087,
                    columnNumber: 19
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "1.16.5", children: "1.16.5" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2088,
                    columnNumber: 19
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "1.15.2", children: "1.15.2" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2089,
                    columnNumber: 19
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "1.14.4", children: "1.14.4" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2090,
                    columnNumber: 19
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "1.13.2", children: "1.13.2" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2091,
                    columnNumber: 19
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "1.12.2", children: "1.12.2" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2092,
                    columnNumber: 19
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "1.11.2", children: "1.11.2" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2093,
                    columnNumber: 19
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "1.10.2", children: "1.10.2" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2094,
                    columnNumber: 19
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "1.9.4", children: "1.9.4" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2095,
                    columnNumber: 19
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "1.8.9", children: "1.8.9" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2096,
                    columnNumber: 19
                  }, void 0)
                ]
              },
              void 0,
              true,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                lineNumber: 2059,
                columnNumber: 17
              },
              void 0
            ),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "h-5 w-5 text-gray-400", fill: "none", viewBox: "0 0 20 20", stroke: "currentColor", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
              lineNumber: 2100,
              columnNumber: 21
            }, void 0) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
              lineNumber: 2099,
              columnNumber: 19
            }, void 0) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
              lineNumber: 2098,
              columnNumber: 17
            }, void 0)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
            lineNumber: 2058,
            columnNumber: 15
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
          lineNumber: 2056,
          columnNumber: 13
        }, void 0),
        type === "modpacks" || type === "mods" ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mb-6", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Loader" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
            lineNumber: 2109,
            columnNumber: 15
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "relative", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "select",
              {
                value: selectedLoader,
                onChange: (e) => setSelectedLoader(e.target.value),
                className: "appearance-none w-full bg-gray-700/50 border border-gray-600 rounded-xl text-white pl-3 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200",
                children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "", children: "Todos los loaders" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2116,
                    columnNumber: 19
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "forge", children: "Forge" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2117,
                    columnNumber: 19
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "fabric", children: "Fabric" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2118,
                    columnNumber: 19
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "quilt", children: "Quilt" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2119,
                    columnNumber: 19
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "neoforge", children: "NeoForge" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2120,
                    columnNumber: 19
                  }, void 0)
                ]
              },
              void 0,
              true,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                lineNumber: 2111,
                columnNumber: 17
              },
              void 0
            ),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "h-5 w-5 text-gray-400", fill: "none", viewBox: "0 0 20 20", stroke: "currentColor", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
              lineNumber: 2124,
              columnNumber: 21
            }, void 0) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
              lineNumber: 2123,
              columnNumber: 19
            }, void 0) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
              lineNumber: 2122,
              columnNumber: 17
            }, void 0)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
            lineNumber: 2110,
            columnNumber: 15
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
          lineNumber: 2108,
          columnNumber: 13
        }, void 0) : null,
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Ordenar por" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
            lineNumber: 2133,
            columnNumber: 15
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "relative", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "select",
              {
                value: sortBy,
                onChange: (e) => setSortBy(e.target.value),
                className: "appearance-none w-full bg-gray-700/50 border border-gray-600 rounded-xl text-white pl-3 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200",
                children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "popular", children: "Más populares" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2140,
                    columnNumber: 19
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "recent", children: "Más recientes" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2141,
                    columnNumber: 19
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "name", children: "Por nombre (A-Z)" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2142,
                    columnNumber: 19
                  }, void 0)
                ]
              },
              void 0,
              true,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                lineNumber: 2135,
                columnNumber: 17
              },
              void 0
            ),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "h-5 w-5 text-gray-400", fill: "none", viewBox: "0 0 20 20", stroke: "currentColor", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
              lineNumber: 2146,
              columnNumber: 21
            }, void 0) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
              lineNumber: 2145,
              columnNumber: 19
            }, void 0) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
              lineNumber: 2144,
              columnNumber: 17
            }, void 0)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
            lineNumber: 2134,
            columnNumber: 15
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
          lineNumber: 2132,
          columnNumber: 13
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
        lineNumber: 1981,
        columnNumber: 11
      }, void 0) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
        lineNumber: 1980,
        columnNumber: 9
      }, void 0),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-1 relative", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "absolute top-0 right-0 z-10 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              onClick: () => setShowDownloadHistoryModal(true),
              className: "relative w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg flex items-center justify-center hover:from-purple-700 hover:to-pink-700 transition-all duration-300 group",
              title: "Historial de Descargas",
              children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                "svg",
                {
                  className: "w-6 h-6 text-white",
                  fill: "none",
                  stroke: "currentColor",
                  viewBox: "0 0 24 24",
                  children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                    "path",
                    {
                      strokeLinecap: "round",
                      strokeLinejoin: "round",
                      strokeWidth: "2",
                      d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    },
                    void 0,
                    false,
                    {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                      lineNumber: 2170,
                      columnNumber: 17
                    },
                    void 0
                  )
                },
                void 0,
                false,
                {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                  lineNumber: 2164,
                  columnNumber: 15
                },
                void 0
              )
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
              lineNumber: 2159,
              columnNumber: 13
            },
            void 0
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              onClick: () => setShowMultipleDownloadQueue(true),
              className: "relative w-12 h-12 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg flex items-center justify-center hover:from-green-700 hover:to-emerald-700 transition-all duration-300 group",
              title: "Iniciar Descargas Múltiples",
              children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                "svg",
                {
                  className: "w-6 h-6 text-white",
                  fill: "none",
                  stroke: "currentColor",
                  viewBox: "0 0 24 24",
                  children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                    "path",
                    {
                      strokeLinecap: "round",
                      strokeLinejoin: "round",
                      strokeWidth: "2",
                      d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    },
                    void 0,
                    false,
                    {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                      lineNumber: 2189,
                      columnNumber: 17
                    },
                    void 0
                  )
                },
                void 0,
                false,
                {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                  lineNumber: 2183,
                  columnNumber: 15
                },
                void 0
              )
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
              lineNumber: 2178,
              columnNumber: 13
            },
            void 0
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            ContentDownloadProgressWidget,
            {
              position: "top-right",
              onShowHistory: () => setShowDownloadHistoryModal(true)
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
              lineNumber: 2197,
              columnNumber: 13
            },
            void 0
          )
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
          lineNumber: 2158,
          columnNumber: 11
        }, void 0),
        selectedContent ? (
          // Detail View
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/50 rounded-xl p-6 mt-16", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "button",
              {
                onClick: handleBackToList,
                className: "mb-4 flex items-center text-blue-400 hover:text-blue-300 transition-colors",
                children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5 mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M10 19l-7-7m0 0l7-7m-7 7h18" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2210,
                    columnNumber: 17
                  }, void 0) }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2209,
                    columnNumber: 15
                  }, void 0),
                  "Volver a la lista"
                ]
              },
              void 0,
              true,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                lineNumber: 2205,
                columnNumber: 13
              },
              void 0
            ),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-6", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden border border-gray-700/50 shadow-2xl", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "md:flex", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "md:w-1/3", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  "img",
                  {
                    src: selectedContent.imageUrl,
                    alt: selectedContent.title,
                    className: "w-full h-64 md:h-full object-cover",
                    loading: "lazy",
                    onError: (e) => {
                      const target = e.target;
                      target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWYyOTM3Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk1pbmVjcmFmdDwvdGV4dD48L3N2Zz4=";
                    }
                  },
                  void 0,
                  false,
                  {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2221,
                    columnNumber: 21
                  },
                  void 0
                ) }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                  lineNumber: 2220,
                  columnNumber: 19
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "md:w-2/3 p-6", children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h2", { className: "text-3xl font-bold text-white mb-2", children: selectedContent.title }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2233,
                    columnNumber: 21
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-blue-400 mb-4", children: [
                    "por ",
                    selectedContent.author
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2234,
                    columnNumber: 21
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex flex-wrap gap-2 mb-4", children: [
                    selectedContent.categories.slice(0, 5).map((category, index) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "bg-blue-500/20 text-blue-300 text-sm px-3 py-1 rounded-full", children: category }, `${category}-${index}-${selectedContent.id}`, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                      lineNumber: 2238,
                      columnNumber: 25
                    }, void 0)),
                    selectedContent.categories.length > 5 && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "bg-gray-600/30 text-gray-400 text-sm px-3 py-1 rounded-full", children: [
                      "+",
                      selectedContent.categories.length - 5
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                      lineNumber: 2243,
                      columnNumber: 25
                    }, void 0)
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2236,
                    columnNumber: 21
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4", children: [
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-gray-400", children: "Versión" }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                        lineNumber: 2251,
                        columnNumber: 25
                      }, void 0),
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-white font-medium", children: selectedContent.version }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                        lineNumber: 2252,
                        columnNumber: 25
                      }, void 0)
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                      lineNumber: 2250,
                      columnNumber: 23
                    }, void 0),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-gray-400", children: "Actualizado" }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                        lineNumber: 2255,
                        columnNumber: 25
                      }, void 0),
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-white font-medium", children: new Date(selectedContent.lastUpdated).toLocaleDateString("es-ES") }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                        lineNumber: 2256,
                        columnNumber: 25
                      }, void 0)
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                      lineNumber: 2254,
                      columnNumber: 23
                    }, void 0),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-gray-400", children: "Descargas" }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                        lineNumber: 2259,
                        columnNumber: 25
                      }, void 0),
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-white font-medium", children: selectedContent.downloads.toLocaleString() }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                        lineNumber: 2260,
                        columnNumber: 25
                      }, void 0)
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                      lineNumber: 2258,
                      columnNumber: 23
                    }, void 0),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-gray-400", children: "Plataforma" }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                        lineNumber: 2263,
                        columnNumber: 25
                      }, void 0),
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-purple-400 font-medium capitalize", children: selectedContent.platform }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                        lineNumber: 2264,
                        columnNumber: 25
                      }, void 0)
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                      lineNumber: 2262,
                      columnNumber: 23
                    }, void 0)
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2249,
                    columnNumber: 21
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-4", children: [
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h4", { className: "font-medium text-gray-300 mb-2", children: "Loaders Compatibles" }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                        lineNumber: 2270,
                        columnNumber: 25
                      }, void 0),
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex flex-wrap gap-2", children: compatibleLoaders.slice(0, 6).map((loader, index) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: `px-3 py-1.5 rounded-full text-sm ${selectedContent.platform === "modrinth" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"}`, children: loader.charAt(0).toUpperCase() + loader.slice(1) }, `${loader}-${index}`, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                        lineNumber: 2273,
                        columnNumber: 29
                      }, void 0)) }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                        lineNumber: 2271,
                        columnNumber: 25
                      }, void 0)
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                      lineNumber: 2269,
                      columnNumber: 23
                    }, void 0),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h4", { className: "font-medium text-gray-300 mb-2", children: "Versiones de Minecraft" }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                        lineNumber: 2285,
                        columnNumber: 25
                      }, void 0),
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex flex-wrap gap-2 max-h-20 overflow-y-auto", children: selectedContent.minecraftVersions.slice(0, 10).map((version, index) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "bg-gray-700/40 text-gray-300 px-2 py-1 rounded-lg text-sm border border-gray-600/30", children: version }, index, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                        lineNumber: 2288,
                        columnNumber: 29
                      }, void 0)) }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                        lineNumber: 2286,
                        columnNumber: 25
                      }, void 0)
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                      lineNumber: 2284,
                      columnNumber: 23
                    }, void 0)
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2268,
                    columnNumber: 21
                  }, void 0)
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                  lineNumber: 2232,
                  columnNumber: 19
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                lineNumber: 2219,
                columnNumber: 17
              }, void 0) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                lineNumber: 2218,
                columnNumber: 15
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-6", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                ModernContentDetail,
                {
                  selectedContent
                },
                void 0,
                false,
                {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                  lineNumber: 2302,
                  columnNumber: 17
                },
                void 0
              ) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                lineNumber: 2301,
                columnNumber: 15
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
              lineNumber: 2216,
              columnNumber: 13
            }, void 0)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
            lineNumber: 2204,
            columnNumber: 11
          }, void 0)
        ) : (
          // List View
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-full mt-16", children: filteredContent.length === 0 ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/50 rounded-xl p-8 text-center", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "mx-auto h-12 w-12 text-gray-500", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1, d: "M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
              lineNumber: 2314,
              columnNumber: 19
            }, void 0) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
              lineNumber: 2313,
              columnNumber: 17
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "mt-2 text-lg font-medium text-white", children: "No se encontraron resultados" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
              lineNumber: 2316,
              columnNumber: 17
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "mt-1 text-gray-400", children: "Intenta con otros filtros o términos de búsqueda." }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
              lineNumber: 2317,
              columnNumber: 17
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "button",
              {
                onClick: () => {
                  setSearchQuery("");
                  setSelectedVersion("all");
                  setSelectedCategory("all");
                },
                className: "mt-4 text-blue-400 hover:text-blue-300 text-sm font-medium",
                children: "Limpiar filtros"
              },
              void 0,
              false,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                lineNumber: 2318,
                columnNumber: 17
              },
              void 0
            )
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
            lineNumber: 2312,
            columnNumber: 15
          }, void 0) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-full", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex flex-col sm:flex-row justify-between items-center mb-4 gap-2", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-sm text-gray-400", children: [
                "Mostrando ",
                (currentPage - 1) * itemsPerPage + 1,
                "-",
                Math.min(currentPage * itemsPerPage, filteredContent.length),
                " de ",
                filteredContent.length,
                " resultados"
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                lineNumber: 2333,
                columnNumber: 19
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  "button",
                  {
                    onClick: prevPage,
                    disabled: currentPage === 1,
                    className: `px-3 py-1.5 rounded-lg ${currentPage === 1 ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-gray-700 hover:bg-gray-600 text-white"}`,
                    children: "Anterior"
                  },
                  void 0,
                  false,
                  {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2337,
                    columnNumber: 21
                  },
                  void 0
                ),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex gap-1", children: totalPages <= 7 ? (
                  // Si hay 7 páginas o menos, mostrar todas
                  Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                    "button",
                    {
                      onClick: () => goToPage(page),
                      className: `w-10 h-10 rounded-full ${currentPage === page ? "bg-blue-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"}`,
                      children: page
                    },
                    page,
                    false,
                    {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                      lineNumber: 2350,
                      columnNumber: 27
                    },
                    void 0
                  ))
                ) : (
                  // Si hay más de 7 páginas, mostrar patrón con puntos suspensivos
                  (() => {
                    const pages = [];
                    const startPage = Math.max(1, currentPage - 2);
                    const endPage = Math.min(totalPages, currentPage + 2);
                    if (startPage > 1) {
                      pages.push(1);
                      if (startPage > 2) pages.push(-1);
                    }
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(i);
                    }
                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) pages.push(-1);
                      pages.push(totalPages);
                    }
                    return pages.map((page, index) => page === -1 ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "w-10 h-10 flex items-center justify-center text-white", children: "..." }, `dots-${index}`, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                      lineNumber: 2381,
                      columnNumber: 31
                    }, void 0) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                      "button",
                      {
                        onClick: () => goToPage(page),
                        className: `w-10 h-10 rounded-full ${currentPage === page ? "bg-blue-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"}`,
                        children: page
                      },
                      page,
                      false,
                      {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                        lineNumber: 2383,
                        columnNumber: 31
                      },
                      void 0
                    ));
                  })()
                ) }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                  lineNumber: 2346,
                  columnNumber: 21
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  "button",
                  {
                    onClick: nextPage,
                    disabled: currentPage === totalPages,
                    className: `px-3 py-1.5 rounded-lg ${currentPage === totalPages ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-gray-700 hover:bg-gray-600 text-white"}`,
                    children: "Siguiente"
                  },
                  void 0,
                  false,
                  {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2396,
                    columnNumber: 21
                  },
                  void 0
                )
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                lineNumber: 2336,
                columnNumber: 19
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
              lineNumber: 2332,
              columnNumber: 17
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4", children: paginatedContent.map((item) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              ContentCard,
              {
                id: item.id,
                title: item.title,
                description: item.description,
                author: item.author,
                downloads: item.downloads,
                lastUpdated: item.lastUpdated,
                imageUrl: item.imageUrl,
                type: item.type,
                platform: item.platform,
                onDownload: () => handleDownload(item),
                onDetails: handleContentClick,
                isDownloading: isDownloading[item.id],
                downloadProgress: downloadProgress[item.id]
              },
              item.id,
              false,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                lineNumber: 2409,
                columnNumber: 21
              },
              void 0
            )) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
              lineNumber: 2407,
              columnNumber: 17
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex flex-col sm:flex-row justify-between items-center mt-4 gap-2", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-sm text-gray-400", children: [
                "Mostrando ",
                (currentPage - 1) * itemsPerPage + 1,
                "-",
                Math.min(currentPage * itemsPerPage, filteredContent.length),
                " de ",
                filteredContent.length,
                " resultados"
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                lineNumber: 2430,
                columnNumber: 19
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  "button",
                  {
                    onClick: prevPage,
                    disabled: currentPage === 1,
                    className: `px-3 py-1.5 rounded-lg ${currentPage === 1 ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-gray-700 hover:bg-gray-600 text-white"}`,
                    children: "Anterior"
                  },
                  void 0,
                  false,
                  {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2434,
                    columnNumber: 21
                  },
                  void 0
                ),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  "button",
                  {
                    onClick: nextPage,
                    disabled: currentPage === totalPages,
                    className: `px-3 py-1.5 rounded-lg ${currentPage === totalPages ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-gray-700 hover:bg-gray-600 text-white"}`,
                    children: "Siguiente"
                  },
                  void 0,
                  false,
                  {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                    lineNumber: 2442,
                    columnNumber: 21
                  },
                  void 0
                )
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
                lineNumber: 2433,
                columnNumber: 19
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
              lineNumber: 2429,
              columnNumber: 17
            }, void 0)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
            lineNumber: 2330,
            columnNumber: 15
          }, void 0) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
            lineNumber: 2310,
            columnNumber: 11
          }, void 0)
        )
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
        lineNumber: 2156,
        columnNumber: 9
      }, void 0)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
      lineNumber: 1977,
      columnNumber: 7
    }, void 0),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
      DownloadSelectionModal,
      {
        isOpen: showDownloadSelectionModal,
        onClose: () => setShowDownloadSelectionModal(false),
        onSingleDownload: handleSingleDownload,
        onMultipleDownload: handleMultipleDownload
      },
      void 0,
      false,
      {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
        lineNumber: 2459,
        columnNumber: 5
      },
      void 0
    ),
    selectedDownloadItem && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
      SingleDownloadModal,
      {
        isOpen: showSingleDownloadModal,
        onClose: () => setShowSingleDownloadModal(false),
        contentItem: selectedDownloadItem,
        availableVersions,
        availableLoaders,
        onDownloadStart: handleStartSingleDownload
      },
      void 0,
      false,
      {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
        lineNumber: 2468,
        columnNumber: 7
      },
      void 0
    ),
    selectedDownloadItem && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
      MultipleDownloadModal,
      {
        isOpen: showMultipleDownloadModal,
        onClose: () => setShowMultipleDownloadModal(false),
        contentItems: [selectedDownloadItem],
        availableVersions,
        availableLoaders,
        onAddToQueue: handleAddToMultipleQueue
      },
      void 0,
      false,
      {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
        lineNumber: 2480,
        columnNumber: 7
      },
      void 0
    ),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
      MultipleDownloadQueue,
      {
        isVisible: showMultipleDownloadQueue,
        onClose: () => setShowMultipleDownloadQueue(false)
      },
      void 0,
      false,
      {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
        lineNumber: 2491,
        columnNumber: 5
      },
      void 0
    ),
    selectedModalProject && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
      DownloadModalModrinth,
      {
        isOpen: isModalOpen,
        onClose: () => setIsModalOpen(false),
        project: selectedModalProject,
        onDownloadComplete: () => console.log("Download completed")
      },
      void 0,
      false,
      {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
        lineNumber: 2498,
        columnNumber: 7
      },
      void 0
    ),
    selectedModalMod && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
      DownloadModalCurseForge,
      {
        isOpen: isModalOpen,
        onClose: () => setIsModalOpen(false),
        mod: selectedModalMod,
        onDownloadComplete: () => console.log("Download completed")
      },
      void 0,
      false,
      {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
        lineNumber: 2507,
        columnNumber: 7
      },
      void 0
    ),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
      DownloadHistoryModal,
      {
        isOpen: showDownloadHistoryModal,
        onClose: () => setShowDownloadHistoryModal(false)
      },
      void 0,
      false,
      {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
        lineNumber: 2516,
        columnNumber: 5
      },
      void 0
    )
  ] }, void 0, true, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ContentPage.tsx",
    lineNumber: 1949,
    columnNumber: 5
  }, void 0);
};
export {
  ContentPage as default
};
