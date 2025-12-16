import { r as reactExports, j as jsxDevRuntimeExports, p as profileService } from "./index-BxElvc04.js";
import { i as integratedDownloadService } from "./integratedDownloadService-qgbuKPpj.js";
import { instanceProfileService } from "./instanceProfileService-BvkLeFez.js";
import { platform } from "os";
import { A as AnimatePresence } from "./index-B4dq9Pr6.js";
import { m as motion } from "./proxy-u-UZHDC4.js";
class JavaConfigService {
  /**
   * Obtiene los parámetros JVM estándar para un loader específico
   */
  static getStandardJvmArgs(loader, ramMb) {
    const minMem = Math.max(512, Math.floor(ramMb / 4));
    const os = platform();
    const baseArgs = [
      `-Xms${minMem}M`,
      `-Xmx${ramMb}M`,
      "-XX:+UseG1GC",
      "-XX:+UnlockExperimentalVMOptions",
      "-XX:MaxGCPauseMillis=100",
      "-XX:+DisableExplicitGC",
      "-XX:+AlwaysPreTouch",
      "-XX:+ParallelRefProcEnabled"
    ];
    const osSpecificArgs = [];
    if (os === "win32") {
      osSpecificArgs.push(
        "-XX:+UseStringDeduplication",
        "-Djava.awt.headless=false"
      );
    } else if (os === "darwin") {
      osSpecificArgs.push(
        "-XstartOnFirstThread",
        "-Djava.awt.headless=false"
      );
    } else {
      osSpecificArgs.push(
        "-XX:+UseStringDeduplication"
      );
    }
    const loaderSpecificArgs = [];
    switch (loader) {
      case "vanilla":
        loaderSpecificArgs.push(
          "-XX:TargetSurvivorRatio=90",
          "-XX:G1NewSizePercent=50",
          "-XX:G1MaxNewSizePercent=80",
          "-XX:G1MixedGCLiveThresholdPercent=35"
        );
        break;
      case "fabric":
      case "quilt":
        loaderSpecificArgs.push(
          "-XX:TargetSurvivorRatio=90",
          "-XX:G1NewSizePercent=40",
          "-XX:G1MaxNewSizePercent=70",
          "-XX:G1MixedGCLiveThresholdPercent=30",
          "-Dfabric.dli.config=",
          "-Dfabric.dli.main=net.fabricmc.loader.impl.launch.knot.KnotClient"
        );
        break;
      case "forge":
      case "neoforge":
        loaderSpecificArgs.push(
          "-XX:TargetSurvivorRatio=85",
          "-XX:G1NewSizePercent=30",
          "-XX:G1MaxNewSizePercent=60",
          "-XX:G1MixedGCLiveThresholdPercent=25",
          "-Dforge.logging.console.level=info",
          "-Dfml.earlyprogresswindow=false",
          "--add-opens",
          "java.base/java.util.jar=cpw.mods.securejarhandler",
          "--add-opens",
          "java.base/java.lang.invoke=cpw.mods.securejarhandler",
          "--add-opens",
          "java.base/java.lang.reflect=cpw.mods.securejarhandler",
          "--add-opens",
          "java.base/java.text=cpw.mods.securejarhandler",
          "--add-opens",
          "java.base/java.util=cpw.mods.securejarhandler",
          "--add-opens",
          "java.base/java.util.concurrent=cpw.mods.securejarhandler",
          "--add-opens",
          "java.base/java.util.concurrent.atomic=cpw.mods.securejarhandler",
          "--add-opens",
          "java.base/java.util.jar=cpw.mods.securejarhandler",
          "--add-opens",
          "java.base/java.util.regex=cpw.mods.securejarhandler",
          "--add-opens",
          "java.base/java.util.zip=cpw.mods.securejarhandler"
        );
        break;
    }
    return [...baseArgs, ...osSpecificArgs, ...loaderSpecificArgs];
  }
  /**
   * Obtiene la versión de Java recomendada para un loader
   */
  static getRecommendedJavaVersion(loader, mcVersion) {
    const majorVersion = parseInt(mcVersion.split(".")[1] || "0");
    if (loader === "vanilla") {
      if (majorVersion >= 17) return "17";
      if (majorVersion >= 8) return "8";
      return "8";
    }
    if (loader === "fabric" || loader === "quilt") {
      if (majorVersion >= 21) return "21";
      if (majorVersion >= 17) return "17";
      return "17";
    }
    if (loader === "forge" || loader === "neoforge") {
      if (majorVersion >= 21) return "21";
      if (majorVersion >= 17) return "17";
      return "17";
    }
    return "17";
  }
  /**
   * Obtiene la memoria recomendada para un loader
   */
  static getRecommendedMemory(loader, totalSystemMemory) {
    const maxMem = Math.min(
      totalSystemMemory,
      loader === "vanilla" ? 4096 : loader === "fabric" || loader === "quilt" ? 6144 : 8192
      // Forge/NeoForge
    );
    const minMem = Math.max(1024, Math.floor(maxMem / 4));
    return { min: minMem, max: maxMem };
  }
}
const CreateInstanceModal = ({ isOpen, onClose, onCreated }) => {
  const [instanceName, setInstanceName] = reactExports.useState("");
  const [loaderType, setLoaderType] = reactExports.useState("vanilla");
  const [mcVersion, setMcVersion] = reactExports.useState("");
  const [loaderVersion, setLoaderVersion] = reactExports.useState("");
  const [showAdvanced, setShowAdvanced] = reactExports.useState(false);
  const [minMemory, setMinMemory] = reactExports.useState(2048);
  const [maxMemory, setMaxMemory] = reactExports.useState(4096);
  const [totalMemory, setTotalMemory] = reactExports.useState(8192);
  const [vanillaVersions, setVanillaVersions] = reactExports.useState([]);
  const [forgeVersions, setForgeVersions] = reactExports.useState({});
  const [fabricVersions, setFabricVersions] = reactExports.useState({});
  const [quiltVersions, setQuiltVersions] = reactExports.useState({});
  const [neoforgeVersions, setNeoforgeVersions] = reactExports.useState({});
  const [loading, setLoading] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const [javaArgs, setJavaArgs] = reactExports.useState("");
  const [javaPath, setJavaPath] = reactExports.useState("");
  const [javaVersion, setJavaVersion] = reactExports.useState("17");
  const [canCreateInstance, setCanCreateInstance] = reactExports.useState(false);
  const [currentProgress, setCurrentProgress] = reactExports.useState(null);
  const [overallProgress, setOverallProgress] = reactExports.useState(null);
  reactExports.useEffect(() => {
    const loadSystemMemory = async () => {
      var _a;
      try {
        const api = window.api;
        if ((_a = api == null ? void 0 : api.system) == null ? void 0 : _a.getTotalMemory) {
          const memory = await api.system.getTotalMemory();
          const memoryInMB = Math.floor(memory / (1024 * 1024));
          setTotalMemory(memoryInMB);
          const recommended = JavaConfigService.getRecommendedMemory(loaderType, memoryInMB);
          setMinMemory(recommended.min);
          setMaxMemory(recommended.max);
        } else {
          const deviceMemory = navigator.deviceMemory;
          const estimatedMemory = Math.min(16384, Math.max(4096, deviceMemory ? deviceMemory * 1024 : 8192));
          setTotalMemory(estimatedMemory);
          const recommended = JavaConfigService.getRecommendedMemory(loaderType, estimatedMemory);
          setMinMemory(recommended.min);
          setMaxMemory(recommended.max);
        }
      } catch (error2) {
        console.warn("No se pudo obtener la memoria total del sistema:", error2);
        const deviceMemory = navigator.deviceMemory;
        const memoryGuess = deviceMemory ? deviceMemory * 1024 : 8192;
        setTotalMemory(memoryGuess);
        const recommended = JavaConfigService.getRecommendedMemory(loaderType, memoryGuess);
        setMinMemory(recommended.min);
        setMaxMemory(recommended.max);
      }
    };
    loadSystemMemory();
  }, [loaderType]);
  reactExports.useEffect(() => {
    if (mcVersion) {
      const recommendedJava = JavaConfigService.getRecommendedJavaVersion(loaderType, mcVersion);
      setJavaVersion(recommendedJava);
      const standardArgs = JavaConfigService.getStandardJvmArgs(loaderType, maxMemory);
      setJavaArgs(standardArgs.join(" "));
    }
  }, [loaderType, mcVersion, maxMemory]);
  reactExports.useEffect(() => {
    const canCreate = instanceName.trim() !== "" && mcVersion !== "" && (loaderType === "vanilla" || loaderVersion !== "");
    setCanCreateInstance(canCreate);
  }, [instanceName, mcVersion, loaderType, loaderVersion]);
  reactExports.useEffect(() => {
    if (isOpen) {
      loadVersions();
    }
  }, [isOpen]);
  const loadVersions = async () => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    try {
      const versions = await integratedDownloadService.getMinecraftVersions();
      const releaseVersions = versions.filter((v) => v.type === "release");
      setVanillaVersions(releaseVersions);
    } catch (err) {
      console.error("Error al cargar versiones:", err);
      setError("Error al cargar las versiones disponibles. Por favor, inténtalo de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    if (mcVersion) {
      const majorVersion = parseInt(mcVersion.split(".")[1] || "0", 10);
      if (majorVersion >= 21) {
        setJavaVersion("21");
      } else if (majorVersion >= 17) {
        setJavaVersion("17");
      } else if (majorVersion >= 16) {
        setJavaVersion("16");
      } else {
        setJavaVersion("8");
      }
    }
  }, [mcVersion]);
  reactExports.useEffect(() => {
    if (mcVersion && loaderType !== "vanilla") {
      loadLoaderVersions();
    }
  }, [loaderType, mcVersion]);
  const loadLoaderVersions = async () => {
    if (!mcVersion) return;
    console.log(`[CreateInstanceModal] Cargando versiones de ${loaderType} para MC ${mcVersion}`);
    setLoading(true);
    setError(null);
    try {
      switch (loaderType) {
        case "fabric":
          if (!fabricVersions[mcVersion]) {
            console.log(`[CreateInstanceModal] Obteniendo versiones de Fabric...`);
            const fabricVers = await integratedDownloadService.getFabricVersions(mcVersion);
            console.log(`[CreateInstanceModal] Versiones de Fabric obtenidas:`, fabricVers);
            setFabricVersions((prev) => ({ ...prev, [mcVersion]: fabricVers }));
          }
          break;
        case "forge":
          if (!forgeVersions[mcVersion]) {
            console.log(`[CreateInstanceModal] Obteniendo versiones de Forge...`);
            const forgeVers = await integratedDownloadService.getForgeVersions(mcVersion);
            console.log(`[CreateInstanceModal] Versiones de Forge obtenidas:`, forgeVers);
            setForgeVersions((prev) => ({ ...prev, [mcVersion]: forgeVers }));
            if (forgeVers.length > 0 && !loaderVersion) {
              setLoaderVersion(forgeVers[0].version);
            }
          }
          break;
        case "quilt":
          if (!quiltVersions[mcVersion]) {
            console.log(`[CreateInstanceModal] Obteniendo versiones de Quilt...`);
            const quiltVers = await integratedDownloadService.getQuiltVersions(mcVersion);
            console.log(`[CreateInstanceModal] Versiones de Quilt obtenidas:`, quiltVers);
            setQuiltVersions((prev) => ({ ...prev, [mcVersion]: quiltVers }));
          }
          break;
        case "neoforge":
          if (!neoforgeVersions[mcVersion]) {
            console.log(`[CreateInstanceModal] Obteniendo versiones de NeoForge...`);
            const neoforgeVers = await integratedDownloadService.getNeoForgeVersions(mcVersion);
            console.log(`[CreateInstanceModal] Versiones de NeoForge obtenidas:`, neoforgeVers);
            setNeoforgeVersions((prev) => ({ ...prev, [mcVersion]: neoforgeVers }));
            if (neoforgeVers.length > 0 && !loaderVersion) {
              setLoaderVersion(neoforgeVers[0].version);
            }
          }
          break;
      }
    } catch (err) {
      console.error(`[CreateInstanceModal] Error al cargar versiones de ${loaderType}:`, err);
      setError(`Error al cargar las versiones de ${loaderType}: ${err.message || "Error desconocido"}`);
    } finally {
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    if (!isOpen) return;
    const progressInterval = setInterval(async () => {
      try {
        const progress = await integratedDownloadService.getAllProgressStatuses();
        if (progress.length > 0) {
          const current = progress[0];
          setCurrentProgress(current);
        }
        const overall = await integratedDownloadService.getOverallProgress();
        setOverallProgress(overall);
      } catch (err) {
      }
    }, 1e3);
    return () => clearInterval(progressInterval);
  }, [isOpen]);
  const handleSubmit = async (e) => {
    var _a, _b;
    e.preventDefault();
    if (!instanceName.trim()) {
      setError("Por favor, introduce un nombre para la instancia");
      return;
    }
    if (!mcVersion) {
      setError("Por favor, selecciona una versión de Minecraft");
      return;
    }
    if (loaderType !== "vanilla" && !loaderVersion) {
      setError("Por favor, selecciona una versión del loader");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let finalLoaderVersion = loaderVersion;
      if (loaderType !== "vanilla" && !finalLoaderVersion) {
        switch (loaderType) {
          case "fabric":
            const fabricVersionsForMc = fabricVersions[mcVersion] || [];
            if (fabricVersionsForMc.length > 0) {
              finalLoaderVersion = ((_a = fabricVersionsForMc[0].loader) == null ? void 0 : _a.version) || fabricVersionsForMc[0].version;
            }
            break;
          case "forge":
            const forgeVersionsForMc = forgeVersions[mcVersion] || [];
            if (forgeVersionsForMc.length > 0) {
              finalLoaderVersion = forgeVersionsForMc[0].version;
            }
            break;
          case "quilt":
            const quiltVersionsForMc = quiltVersions[mcVersion] || [];
            if (quiltVersionsForMc.length > 0) {
              finalLoaderVersion = ((_b = quiltVersionsForMc[0].loader) == null ? void 0 : _b.version) || quiltVersionsForMc[0].version;
            }
            break;
          case "neoforge":
            const neoforgeVersionsForMc = neoforgeVersions[mcVersion] || [];
            if (neoforgeVersionsForMc.length > 0) {
              finalLoaderVersion = neoforgeVersionsForMc[0].version;
            }
            break;
        }
      }
      const standardJvmArgs = JavaConfigService.getStandardJvmArgs(loaderType, maxMemory);
      console.log(`[CreateInstanceModal] Creando instancia con loaderVersion: ${finalLoaderVersion || "NO ESPECIFICADA"}`);
      const createdInstance = await integratedDownloadService.createInstance({
        name: instanceName,
        version: mcVersion,
        loader: loaderType,
        loaderVersion: finalLoaderVersion,
        // IMPORTANTE: Pasar la versión del loader
        javaVersion: javaVersion || JavaConfigService.getRecommendedJavaVersion(loaderType, mcVersion),
        maxMemory,
        minMemory,
        jvmArgs: standardJvmArgs
        // Usar parámetros estándar, no los del usuario
      });
      const currentProfile = profileService.getCurrentProfile();
      if (currentProfile) {
        instanceProfileService.linkInstanceToProfile(createdInstance.id, currentProfile);
      } else {
        const profiles = profileService.getAllProfiles();
        if (profiles.length > 0) {
          instanceProfileService.linkInstanceToProfile(createdInstance.id, profiles[0].username);
        }
      }
      if (onCreated) {
        onCreated();
      }
      onClose();
    } catch (err) {
      console.error("Error al crear instancia:", err);
      setError(`Error al crear la instancia: ${err.message || "Error desconocido"}`);
    } finally {
      setLoading(false);
    }
  };
  const getMcVersions = () => {
    return vanillaVersions.map((v) => ({ id: v.id, name: `${v.id}` }));
  };
  const getLoaderVersions = () => {
    switch (loaderType) {
      case "fabric":
        return fabricVersions[mcVersion] || [];
      case "forge":
        return forgeVersions[mcVersion] || [];
      case "quilt":
        return quiltVersions[mcVersion] || [];
      case "neoforge":
        return neoforgeVersions[mcVersion] || [];
      default:
        return [];
    }
  };
  if (!isOpen) return null;
  const loaderVersions = getLoaderVersions();
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(AnimatePresence, { children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    motion.div,
    {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      className: "fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 z-50 flex items-center justify-center p-4",
      children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
        motion.div,
        {
          initial: { scale: 0.95, y: 20, opacity: 0 },
          animate: { scale: 1, y: 0, opacity: 1 },
          exit: { scale: 0.95, y: 20, opacity: 0 },
          transition: { type: "spring", damping: 25, stiffness: 300 },
          className: "bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-1 w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl shadow-blue-500/10",
          children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-1 rounded-2xl", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-900 rounded-2xl p-6 max-h-[calc(90vh-1rem)] overflow-y-auto custom-scrollbar", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-center mb-6", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h2", { className: "text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent", children: "Crear Nueva Instancia" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                lineNumber: 389,
                columnNumber: 17
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                "button",
                {
                  onClick: onClose,
                  className: "p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors",
                  children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M6 18L18 6M6 6l12 12" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                    lineNumber: 397,
                    columnNumber: 21
                  }, void 0) }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                    lineNumber: 396,
                    columnNumber: 19
                  }, void 0)
                },
                void 0,
                false,
                {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                  lineNumber: 392,
                  columnNumber: 17
                },
                void 0
              )
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
              lineNumber: 388,
              columnNumber: 15
            }, void 0),
            error && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mb-6 p-4 bg-gradient-to-r from-red-900/50 to-red-800/30 border border-red-700/50 rounded-xl text-red-200 flex items-start", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-6 h-6 mr-3 flex-shrink-0", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                lineNumber: 405,
                columnNumber: 21
              }, void 0) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                lineNumber: 404,
                columnNumber: 19
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: error }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                lineNumber: 407,
                columnNumber: 19
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
              lineNumber: 403,
              columnNumber: 17
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(AnimatePresence, { children: overallProgress && overallProgress.progress > 0 && overallProgress.activeOperations > 0 && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              motion.div,
              {
                initial: { opacity: 0, height: 0 },
                animate: { opacity: 1, height: "auto" },
                exit: { opacity: 0, height: 0 },
                transition: { duration: 0.3 },
                className: "mb-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-4 rounded-xl border border-blue-700/50 shadow-lg shadow-blue-500/10",
                children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-center mb-2", children: [
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-sm font-medium text-gray-200 flex items-center gap-2", children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-2 h-2 bg-blue-400 rounded-full animate-pulse" }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                        lineNumber: 423,
                        columnNumber: 25
                      }, void 0),
                      "Progreso general:"
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                      lineNumber: 422,
                      columnNumber: 23
                    }, void 0),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-sm font-semibold text-blue-400", children: [
                      Math.round(overallProgress.progress * 100),
                      "%"
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                      lineNumber: 426,
                      columnNumber: 23
                    }, void 0)
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                    lineNumber: 421,
                    columnNumber: 21
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-full bg-gray-700/50 rounded-full h-3 overflow-hidden", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                    motion.div,
                    {
                      initial: { width: 0 },
                      animate: { width: `${overallProgress.progress * 100}%` },
                      transition: { duration: 0.5, ease: "easeOut" },
                      className: "bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 h-3 rounded-full relative overflow-hidden",
                      children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                        motion.div,
                        {
                          animate: { x: ["-100%", "100%"] },
                          transition: { repeat: Infinity, duration: 1.5, ease: "linear" },
                          className: "absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        },
                        void 0,
                        false,
                        {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                          lineNumber: 435,
                          columnNumber: 25
                        },
                        void 0
                      )
                    },
                    void 0,
                    false,
                    {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                      lineNumber: 429,
                      columnNumber: 23
                    },
                    void 0
                  ) }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                    lineNumber: 428,
                    columnNumber: 21
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-2 text-xs text-gray-300 flex justify-between", children: [
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: overallProgress.statusText }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                      lineNumber: 443,
                      columnNumber: 23
                    }, void 0),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-blue-400", children: [
                      overallProgress.activeOperations,
                      " operaciones activas"
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                      lineNumber: 444,
                      columnNumber: 23
                    }, void 0)
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                    lineNumber: 442,
                    columnNumber: 21
                  }, void 0)
                ]
              },
              void 0,
              true,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                lineNumber: 414,
                columnNumber: 19
              },
              void 0
            ) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
              lineNumber: 412,
              columnNumber: 15
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(AnimatePresence, { children: currentProgress && currentProgress.status !== "completed" && currentProgress.status !== "error" && currentProgress.progress > 0 && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              motion.div,
              {
                initial: { opacity: 0, y: -10 },
                animate: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: -10 },
                transition: { duration: 0.3 },
                className: "mb-6 bg-gradient-to-br from-blue-900/20 to-indigo-900/20 p-4 rounded-xl border border-blue-700/50 shadow-lg",
                children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center text-blue-200 text-sm mb-2", children: [
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                      motion.svg,
                      {
                        animate: { rotate: 360 },
                        transition: { repeat: Infinity, duration: 1, ease: "linear" },
                        className: "mr-3 h-5 w-5 text-blue-400",
                        xmlns: "http://www.w3.org/2000/svg",
                        fill: "none",
                        viewBox: "0 0 24 24",
                        children: [
                          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }, void 0, false, {
                            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                            lineNumber: 469,
                            columnNumber: 25
                          }, void 0),
                          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" }, void 0, false, {
                            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                            lineNumber: 470,
                            columnNumber: 25
                          }, void 0)
                        ]
                      },
                      void 0,
                      true,
                      {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                        lineNumber: 461,
                        columnNumber: 23
                      },
                      void 0
                    ),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "font-medium", children: currentProgress.target }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                      lineNumber: 472,
                      columnNumber: 23
                    }, void 0)
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                    lineNumber: 460,
                    columnNumber: 21
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-1 text-xs text-blue-300 mb-3", children: currentProgress.details || currentProgress.operation }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                    lineNumber: 474,
                    columnNumber: 21
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-full bg-blue-900/30 rounded-full h-2.5 overflow-hidden", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                    motion.div,
                    {
                      initial: { width: 0 },
                      animate: { width: `${currentProgress.progress * 100}%` },
                      transition: { duration: 0.5, ease: "easeOut" },
                      className: "bg-gradient-to-r from-blue-500 to-cyan-500 h-2.5 rounded-full relative",
                      children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                        motion.div,
                        {
                          animate: { x: ["-100%", "100%"] },
                          transition: { repeat: Infinity, duration: 1, ease: "linear" },
                          className: "absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        },
                        void 0,
                        false,
                        {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                          lineNumber: 484,
                          columnNumber: 25
                        },
                        void 0
                      )
                    },
                    void 0,
                    false,
                    {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                      lineNumber: 478,
                      columnNumber: 23
                    },
                    void 0
                  ) }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                    lineNumber: 477,
                    columnNumber: 21
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-2 text-xs text-blue-300 text-right font-medium", children: [
                    currentProgress.current,
                    " / ",
                    currentProgress.total
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                    lineNumber: 491,
                    columnNumber: 21
                  }, void 0)
                ]
              },
              void 0,
              true,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                lineNumber: 453,
                columnNumber: 19
              },
              void 0
            ) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
              lineNumber: 451,
              columnNumber: 15
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("form", { onSubmit: handleSubmit, children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-6", children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/30 p-5 rounded-xl border border-gray-700/30", children: [
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-3", children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5 inline mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                        lineNumber: 505,
                        columnNumber: 27
                      }, void 0) }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                        lineNumber: 504,
                        columnNumber: 25
                      }, void 0),
                      "Nombre de la instancia"
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                      lineNumber: 503,
                      columnNumber: 23
                    }, void 0),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                      "input",
                      {
                        type: "text",
                        value: instanceName,
                        onChange: (e) => setInstanceName(e.target.value),
                        className: "w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
                        placeholder: "Mi Mundo Creativo 1.20.1",
                        disabled: loading
                      },
                      void 0,
                      false,
                      {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                        lineNumber: 509,
                        columnNumber: 23
                      },
                      void 0
                    )
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                    lineNumber: 502,
                    columnNumber: 21
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/30 p-6 rounded-xl border border-gray-700/30", children: [
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-4", children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5 inline mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                        lineNumber: 522,
                        columnNumber: 27
                      }, void 0) }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                        lineNumber: 521,
                        columnNumber: 25
                      }, void 0),
                      "Tipo de Loader"
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                      lineNumber: 520,
                      columnNumber: 23
                    }, void 0),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-2 sm:grid-cols-5 gap-2", children: ["vanilla", "fabric", "forge", "quilt", "neoforge"].map((type) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                      motion.button,
                      {
                        type: "button",
                        onClick: () => {
                          setLoaderType(type);
                          if (type === "vanilla") {
                            setLoaderVersion("");
                          }
                        },
                        whileHover: { scale: 1.05 },
                        whileTap: { scale: 0.95 },
                        animate: {
                          scale: loaderType === type ? 1.05 : 1,
                          boxShadow: loaderType === type ? "0 10px 25px rgba(59, 130, 246, 0.4)" : "0 0 0 rgba(0, 0, 0, 0)"
                        },
                        transition: { type: "spring", stiffness: 300, damping: 20 },
                        className: `py-2 px-1 rounded-lg border transition-all duration-300 min-h-[50px] flex flex-col justify-center items-center ${loaderType === type ? "bg-gradient-to-br from-blue-600 to-purple-600 border-blue-500 text-white shadow-lg shadow-blue-500/30" : "bg-gray-700/50 border-gray-600/50 text-gray-300 hover:bg-gray-600/50 disabled:opacity-50"}`,
                        disabled: loading,
                        children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-[0.65rem] sm:text-xs font-medium text-center leading-tight", children: type === "neoforge" ? "Neo\nForge" : type.charAt(0).toUpperCase() + type.slice(1) }, void 0, false, {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                          lineNumber: 554,
                          columnNumber: 29
                        }, void 0)
                      },
                      type,
                      false,
                      {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                        lineNumber: 528,
                        columnNumber: 27
                      },
                      void 0
                    )) }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                      lineNumber: 526,
                      columnNumber: 23
                    }, void 0)
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                    lineNumber: 519,
                    columnNumber: 21
                  }, void 0)
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                  lineNumber: 501,
                  columnNumber: 19
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-6", children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/30 p-5 rounded-xl border border-gray-700/30", children: [
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-3", children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5 inline mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                        lineNumber: 566,
                        columnNumber: 27
                      }, void 0) }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                        lineNumber: 565,
                        columnNumber: 25
                      }, void 0),
                      "Versión de Minecraft"
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                      lineNumber: 564,
                      columnNumber: 23
                    }, void 0),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                      "select",
                      {
                        value: mcVersion,
                        onChange: (e) => setMcVersion(e.target.value),
                        className: "w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
                        disabled: loading,
                        children: [
                          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "", children: "Selecciona una versión" }, void 0, false, {
                            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                            lineNumber: 576,
                            columnNumber: 25
                          }, void 0),
                          getMcVersions().map((version) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: version.id, children: version.name }, version.id, false, {
                            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                            lineNumber: 578,
                            columnNumber: 27
                          }, void 0))
                        ]
                      },
                      void 0,
                      true,
                      {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                        lineNumber: 570,
                        columnNumber: 23
                      },
                      void 0
                    )
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                    lineNumber: 563,
                    columnNumber: 21
                  }, void 0),
                  loaderType !== "vanilla" && mcVersion && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/30 p-5 rounded-xl border border-gray-700/30", children: [
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-3", children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5 inline mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: [
                        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" }, void 0, false, {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                          lineNumber: 590,
                          columnNumber: 29
                        }, void 0),
                        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" }, void 0, false, {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                          lineNumber: 591,
                          columnNumber: 29
                        }, void 0)
                      ] }, void 0, true, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                        lineNumber: 589,
                        columnNumber: 27
                      }, void 0),
                      "Versión del Loader"
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                      lineNumber: 588,
                      columnNumber: 25
                    }, void 0),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                      "select",
                      {
                        value: loaderVersion,
                        onChange: (e) => setLoaderVersion(e.target.value),
                        className: "w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
                        disabled: loading,
                        children: [
                          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "", children: "Selecciona una versión" }, void 0, false, {
                            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                            lineNumber: 601,
                            columnNumber: 27
                          }, void 0),
                          loaderVersions.map((version, index) => {
                            var _a;
                            let displayVersion = "";
                            let versionValue = "";
                            if (loaderType === "fabric" || loaderType === "quilt") {
                              displayVersion = ((_a = version.loader) == null ? void 0 : _a.version) || version.version;
                              versionValue = displayVersion;
                            } else if (loaderType === "forge" || loaderType === "neoforge") {
                              const fullVersion = version.version || "";
                              const parts = fullVersion.split("-");
                              displayVersion = parts.length > 1 ? parts[1] : fullVersion;
                              versionValue = fullVersion;
                            }
                            const isRecommended = index === 0;
                            return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: versionValue || displayVersion, children: isRecommended ? `⭐ ${displayVersion} (Recomendada)` : displayVersion }, index, false, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                              lineNumber: 622,
                              columnNumber: 31
                            }, void 0);
                          })
                        ]
                      },
                      void 0,
                      true,
                      {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                        lineNumber: 595,
                        columnNumber: 25
                      },
                      void 0
                    )
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                    lineNumber: 587,
                    columnNumber: 23
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/30 p-5 rounded-xl border border-gray-700/30", children: [
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                      "button",
                      {
                        type: "button",
                        onClick: () => setShowAdvanced(!showAdvanced),
                        className: "w-full py-3 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 rounded-xl text-white flex items-center justify-between transition-all duration-300",
                        disabled: loading,
                        children: [
                          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center", children: [
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5 mr-3", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" }, void 0, false, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                              lineNumber: 640,
                              columnNumber: 29
                            }, void 0) }, void 0, false, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                              lineNumber: 639,
                              columnNumber: 27
                            }, void 0),
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "font-medium", children: "Opciones Avanzadas" }, void 0, false, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                              lineNumber: 642,
                              columnNumber: 27
                            }, void 0)
                          ] }, void 0, true, {
                            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                            lineNumber: 638,
                            columnNumber: 25
                          }, void 0),
                          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                            "svg",
                            {
                              className: `w-5 h-5 transition-transform duration-300 ${showAdvanced ? "rotate-180" : ""}`,
                              fill: "none",
                              stroke: "currentColor",
                              viewBox: "0 0 24 24",
                              children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M19 9l-7 7-7-7" }, void 0, false, {
                                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                                lineNumber: 650,
                                columnNumber: 27
                              }, void 0)
                            },
                            void 0,
                            false,
                            {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                              lineNumber: 644,
                              columnNumber: 25
                            },
                            void 0
                          )
                        ]
                      },
                      void 0,
                      true,
                      {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                        lineNumber: 632,
                        columnNumber: 23
                      },
                      void 0
                    ),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(AnimatePresence, { children: showAdvanced && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                      motion.div,
                      {
                        initial: { height: 0, opacity: 0 },
                        animate: { height: "auto", opacity: 1 },
                        exit: { height: 0, opacity: 0 },
                        className: "mt-4 space-y-4 p-4 bg-gray-700/30 rounded-xl border border-gray-600/30",
                        children: [
                          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-center mb-2", children: [
                              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300", children: "Memoria RAM a usar (MB)" }, void 0, false, {
                                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                                lineNumber: 664,
                                columnNumber: 33
                              }, void 0),
                              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full min-w-[70px] text-center", children: [
                                maxMemory,
                                " MB"
                              ] }, void 0, true, {
                                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                                lineNumber: 667,
                                columnNumber: 33
                              }, void 0)
                            ] }, void 0, true, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                              lineNumber: 663,
                              columnNumber: 31
                            }, void 0),
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                              "input",
                              {
                                type: "range",
                                min: "1024",
                                max: Math.min(totalMemory, 16384),
                                value: maxMemory,
                                onChange: (e) => {
                                  const newMax = parseInt(e.target.value);
                                  setMaxMemory(newMax);
                                  setMinMemory(Math.max(1024, Math.floor(newMax / 4)));
                                },
                                className: "w-full h-2 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg appearance-none cursor-pointer slider",
                                disabled: loading
                              },
                              void 0,
                              false,
                              {
                                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                                lineNumber: 671,
                                columnNumber: 31
                              },
                              void 0
                            ),
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between text-xs text-gray-400 mt-1", children: [
                              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: "1GB" }, void 0, false, {
                                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                                lineNumber: 685,
                                columnNumber: 33
                              }, void 0),
                              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: [
                                Math.min(totalMemory, 16384),
                                "MB"
                              ] }, void 0, true, {
                                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                                lineNumber: 686,
                                columnNumber: 33
                              }, void 0)
                            ] }, void 0, true, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                              lineNumber: 684,
                              columnNumber: 31
                            }, void 0)
                          ] }, void 0, true, {
                            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                            lineNumber: 662,
                            columnNumber: 29
                          }, void 0),
                          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Versión de Java (Configuración Automática)" }, void 0, false, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                              lineNumber: 691,
                              columnNumber: 31
                            }, void 0),
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-full px-3 py-2 bg-gray-600/30 border border-gray-500/30 rounded-lg text-gray-400 text-sm", children: [
                              javaVersion,
                              " (Recomendada para ",
                              loaderType === "vanilla" ? "Vanilla" : loaderType === "fabric" ? "Fabric" : loaderType === "forge" ? "Forge" : loaderType === "quilt" ? "Quilt" : "NeoForge",
                              ")"
                            ] }, void 0, true, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                              lineNumber: 694,
                              columnNumber: 31
                            }, void 0),
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-xs text-gray-500 mt-1", children: "La versión de Java se configura automáticamente según el loader seleccionado" }, void 0, false, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                              lineNumber: 697,
                              columnNumber: 31
                            }, void 0)
                          ] }, void 0, true, {
                            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                            lineNumber: 690,
                            columnNumber: 29
                          }, void 0),
                          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Parámetros de Java (Configuración Automática)" }, void 0, false, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                              lineNumber: 701,
                              columnNumber: 31
                            }, void 0),
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-full px-3 py-2 bg-gray-600/30 border border-gray-500/30 rounded-lg text-gray-400 text-sm max-h-20 overflow-y-auto", children: javaArgs || "Configurando parámetros optimizados..." }, void 0, false, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                              lineNumber: 704,
                              columnNumber: 31
                            }, void 0),
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-xs text-gray-500 mt-1", children: "Los parámetros se configuran automáticamente para optimizar el rendimiento" }, void 0, false, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                              lineNumber: 707,
                              columnNumber: 31
                            }, void 0)
                          ] }, void 0, true, {
                            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                            lineNumber: 700,
                            columnNumber: 29
                          }, void 0)
                        ]
                      },
                      void 0,
                      true,
                      {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                        lineNumber: 656,
                        columnNumber: 27
                      },
                      void 0
                    ) }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                      lineNumber: 654,
                      columnNumber: 23
                    }, void 0)
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                    lineNumber: 631,
                    columnNumber: 21
                  }, void 0)
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                  lineNumber: 562,
                  columnNumber: 19
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                lineNumber: 499,
                columnNumber: 17
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-end space-x-4 pt-6 border-t border-gray-700/50", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  "button",
                  {
                    type: "button",
                    onClick: onClose,
                    disabled: loading,
                    className: "px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all duration-300 disabled:opacity-50 font-medium",
                    children: "Cancelar"
                  },
                  void 0,
                  false,
                  {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                    lineNumber: 717,
                    columnNumber: 19
                  },
                  void 0
                ),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  motion.button,
                  {
                    type: "submit",
                    disabled: loading || !canCreateInstance,
                    whileHover: canCreateInstance && !loading ? { scale: 1.05 } : {},
                    whileTap: canCreateInstance && !loading ? { scale: 0.95 } : {},
                    animate: {
                      opacity: canCreateInstance ? 1 : 0.5,
                      boxShadow: canCreateInstance && !loading ? "0 10px 25px rgba(59, 130, 246, 0.4)" : "0 0 0 rgba(0, 0, 0, 0)"
                    },
                    className: "px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl transition-all duration-300 disabled:opacity-50 font-medium flex items-center shadow-lg shadow-blue-500/20",
                    children: [
                      loading && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "animate-spin -ml-1 mr-3 h-5 w-5 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [
                        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }, void 0, false, {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                          lineNumber: 740,
                          columnNumber: 25
                        }, void 0),
                        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" }, void 0, false, {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                          lineNumber: 741,
                          columnNumber: 25
                        }, void 0)
                      ] }, void 0, true, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                        lineNumber: 739,
                        columnNumber: 23
                      }, void 0),
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5 mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 6v6m0 0v6m0-6h6m-6 0H6" }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                        lineNumber: 745,
                        columnNumber: 23
                      }, void 0) }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                        lineNumber: 744,
                        columnNumber: 21
                      }, void 0),
                      loading ? "Creando y descargando..." : canCreateInstance ? `Crear Instancia de ${loaderType === "vanilla" ? "Vanilla" : loaderType === "fabric" ? "Fabric" : loaderType === "forge" ? "Forge" : loaderType === "quilt" ? "Quilt" : "NeoForge"}` : "Completa los campos requeridos"
                    ]
                  },
                  void 0,
                  true,
                  {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                    lineNumber: 725,
                    columnNumber: 19
                  },
                  void 0
                )
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                lineNumber: 716,
                columnNumber: 17
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
              lineNumber: 498,
              columnNumber: 15
            }, void 0)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
            lineNumber: 387,
            columnNumber: 13
          }, void 0) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
            lineNumber: 386,
            columnNumber: 11
          }, void 0)
        },
        void 0,
        false,
        {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
          lineNumber: 379,
          columnNumber: 9
        },
        void 0
      )
    },
    void 0,
    false,
    {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
      lineNumber: 373,
      columnNumber: 7
    },
    void 0
  ) }, void 0, false, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
    lineNumber: 372,
    columnNumber: 5
  }, void 0);
};
export {
  CreateInstanceModal as C
};
