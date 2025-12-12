import { r as reactExports, j as jsxDevRuntimeExports, p as profileService } from "./index-CBCIeQaY.js";
import { i as integratedDownloadService } from "./integratedDownloadService-C3tlNEKn.js";
import { instanceProfileService } from "./instanceProfileService-Dmgqw-qH.js";
import { A as AnimatePresence, m as motion } from "./proxy-BM0Pp9st.js";
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
  const [currentProgress, setCurrentProgress] = reactExports.useState(null);
  const [overallProgress, setOverallProgress] = reactExports.useState(null);
  reactExports.useEffect(() => {
    const loadSystemMemory = async () => {
      var _a, _b;
      try {
        if ((_b = (_a = window.api) == null ? void 0 : _a.system) == null ? void 0 : _b.getTotalMemory) {
          const memory = await window.api.system.getTotalMemory();
          const memoryInMB = Math.floor(memory / (1024 * 1024));
          setTotalMemory(memoryInMB);
          setMinMemory(Math.min(2048, Math.floor(memoryInMB / 4)));
          setMaxMemory(Math.min(8192, Math.floor(memoryInMB / 2)));
        } else {
          const estimatedMemory = Math.min(16384, Math.max(4096, navigator.deviceMemory ? navigator.deviceMemory * 1024 : 8192));
          setTotalMemory(estimatedMemory);
        }
      } catch (error2) {
        console.warn("No se pudo obtener la memoria total del sistema:", error2);
        const memoryGuess = navigator.deviceMemory ? navigator.deviceMemory * 1024 : 8192;
        setTotalMemory(memoryGuess);
      }
    };
    loadSystemMemory();
  }, []);
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
    if (mcVersion) {
      loadLoaderVersions();
    }
  }, [loaderType, mcVersion]);
  const loadLoaderVersions = async () => {
    if (!mcVersion) return;
    setLoading(true);
    try {
      switch (loaderType) {
        case "fabric":
          if (!fabricVersions[mcVersion]) {
            const versions = await integratedDownloadService.getFabricVersions(mcVersion);
            setFabricVersions((prev) => ({ ...prev, [mcVersion]: versions }));
          }
          break;
        case "forge":
          if (!forgeVersions[mcVersion]) {
            const versions = await integratedDownloadService.getForgeVersions(mcVersion);
            setForgeVersions((prev) => ({ ...prev, [mcVersion]: versions }));
          }
          break;
        case "quilt":
          if (!quiltVersions[mcVersion]) {
            const versions = await integratedDownloadService.getQuiltVersions(mcVersion);
            setQuiltVersions((prev) => ({ ...prev, [mcVersion]: versions }));
          }
          break;
        case "neoforge":
          if (!neoforgeVersions[mcVersion]) {
            const versions = await integratedDownloadService.getNeoForgeVersions(mcVersion);
            setNeoforgeVersions((prev) => ({ ...prev, [mcVersion]: versions }));
          }
          break;
      }
    } catch (err) {
      console.error(`Error al cargar versiones de ${loaderType}:`, err);
      setError(`Error al cargar las versiones de ${loaderType}.`);
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
      const createdInstance = await integratedDownloadService.createInstance({
        name: instanceName,
        version: mcVersion,
        loader: loaderType,
        javaVersion: javaVersion || "17",
        maxMemory,
        minMemory,
        jvmArgs: javaArgs ? javaArgs.split(" ") : void 0
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
    switch (loaderType) {
      case "vanilla":
        return vanillaVersions.map((v) => ({ id: v.id, name: `${v.id}` }));
      case "forge":
        return Object.keys(forgeVersions).map((version) => ({ id: version, name: version }));
      case "fabric":
        return Object.keys(fabricVersions).map((version) => ({ id: version, name: version }));
      case "quilt":
        return Object.keys(quiltVersions).map((version) => ({ id: version, name: version }));
      case "neoforge":
        return Object.keys(neoforgeVersions).map((version) => ({ id: version, name: version }));
      default:
        return [];
    }
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
                lineNumber: 340,
                columnNumber: 17
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                "button",
                {
                  onClick: onClose,
                  className: "p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors",
                  children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M6 18L18 6M6 6l12 12" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                    lineNumber: 348,
                    columnNumber: 21
                  }, void 0) }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                    lineNumber: 347,
                    columnNumber: 19
                  }, void 0)
                },
                void 0,
                false,
                {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                  lineNumber: 343,
                  columnNumber: 17
                },
                void 0
              )
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
              lineNumber: 339,
              columnNumber: 15
            }, void 0),
            error && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mb-6 p-4 bg-gradient-to-r from-red-900/50 to-red-800/30 border border-red-700/50 rounded-xl text-red-200 flex items-start", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-6 h-6 mr-3 flex-shrink-0", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                lineNumber: 356,
                columnNumber: 21
              }, void 0) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                lineNumber: 355,
                columnNumber: 19
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: error }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                lineNumber: 358,
                columnNumber: 19
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
              lineNumber: 354,
              columnNumber: 17
            }, void 0),
            overallProgress && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mb-6 bg-gray-800/50 p-4 rounded-xl border border-gray-700/50", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-center mb-2", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-sm font-medium text-gray-300", children: "Progreso general:" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                  lineNumber: 366,
                  columnNumber: 21
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-sm font-semibold text-blue-400", children: [
                  Math.round(overallProgress.progress * 100),
                  "%"
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                  lineNumber: 367,
                  columnNumber: 21
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                lineNumber: 365,
                columnNumber: 19
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-full bg-gray-700 rounded-full h-2.5", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                "div",
                {
                  className: "bg-gradient-to-r from-blue-500 to-purple-600 h-2.5 rounded-full transition-all duration-300 ease-out",
                  style: { width: `${overallProgress.progress * 100}%` }
                },
                void 0,
                false,
                {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                  lineNumber: 370,
                  columnNumber: 21
                },
                void 0
              ) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                lineNumber: 369,
                columnNumber: 19
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-2 text-xs text-gray-400 flex justify-between", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: overallProgress.statusText }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                  lineNumber: 376,
                  columnNumber: 21
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: [
                  overallProgress.activeOperations,
                  " operaciones activas"
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                  lineNumber: 377,
                  columnNumber: 21
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                lineNumber: 375,
                columnNumber: 19
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
              lineNumber: 364,
              columnNumber: 17
            }, void 0),
            currentProgress && currentProgress.status !== "completed" && currentProgress.status !== "error" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mb-6 bg-blue-900/20 p-3 rounded-lg border border-blue-700/50", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center text-blue-300 text-sm", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "animate-spin -ml-1 mr-3 h-4 w-4 text-blue-400", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                    lineNumber: 387,
                    columnNumber: 23
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                    lineNumber: 388,
                    columnNumber: 23
                  }, void 0)
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                  lineNumber: 386,
                  columnNumber: 21
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "font-medium", children: currentProgress.target }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                  lineNumber: 390,
                  columnNumber: 21
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                lineNumber: 385,
                columnNumber: 19
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-1 text-xs text-blue-400", children: currentProgress.details || currentProgress.operation }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                lineNumber: 392,
                columnNumber: 19
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-2 w-full bg-blue-800/50 rounded-full h-1.5", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                "div",
                {
                  className: "bg-blue-500 h-1.5 rounded-full transition-all duration-300 ease-out",
                  style: { width: `${currentProgress.progress * 100}%` }
                },
                void 0,
                false,
                {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                  lineNumber: 396,
                  columnNumber: 21
                },
                void 0
              ) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                lineNumber: 395,
                columnNumber: 19
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-1 text-xs text-blue-300 text-right", children: [
                currentProgress.current,
                " / ",
                currentProgress.total
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                lineNumber: 401,
                columnNumber: 19
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
              lineNumber: 384,
              columnNumber: 17
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("form", { onSubmit: handleSubmit, children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-6", children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/30 p-5 rounded-xl border border-gray-700/30", children: [
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-3", children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5 inline mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                        lineNumber: 414,
                        columnNumber: 27
                      }, void 0) }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                        lineNumber: 413,
                        columnNumber: 25
                      }, void 0),
                      "Nombre de la instancia"
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                      lineNumber: 412,
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
                        lineNumber: 418,
                        columnNumber: 23
                      },
                      void 0
                    )
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                    lineNumber: 411,
                    columnNumber: 21
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/30 p-6 rounded-xl border border-gray-700/30", children: [
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-4", children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5 inline mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                        lineNumber: 431,
                        columnNumber: 27
                      }, void 0) }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                        lineNumber: 430,
                        columnNumber: 25
                      }, void 0),
                      "Tipo de Loader"
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                      lineNumber: 429,
                      columnNumber: 23
                    }, void 0),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-2 sm:grid-cols-5 gap-2", children: ["vanilla", "fabric", "forge", "quilt", "neoforge"].map((type) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                      "button",
                      {
                        type: "button",
                        onClick: () => setLoaderType(type),
                        className: `py-2 px-1 rounded-lg border transition-all duration-300 transform hover:scale-105 min-h-[50px] flex flex-col justify-center items-center ${loaderType === type ? "bg-gradient-to-br from-blue-600 to-purple-600 border-blue-500 text-white shadow-lg shadow-blue-500/30" : "bg-gray-700/50 border-gray-600/50 text-gray-300 hover:bg-gray-600/50 disabled:opacity-50"}`,
                        disabled: loading,
                        children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-[0.65rem] sm:text-xs font-medium text-center leading-tight", children: type === "neoforge" ? "Neo\nForge" : type.charAt(0).toUpperCase() + type.slice(1) }, void 0, false, {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                          lineNumber: 448,
                          columnNumber: 29
                        }, void 0)
                      },
                      type,
                      false,
                      {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                        lineNumber: 437,
                        columnNumber: 27
                      },
                      void 0
                    )) }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                      lineNumber: 435,
                      columnNumber: 23
                    }, void 0)
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                    lineNumber: 428,
                    columnNumber: 21
                  }, void 0)
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                  lineNumber: 410,
                  columnNumber: 19
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-6", children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/30 p-5 rounded-xl border border-gray-700/30", children: [
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-3", children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5 inline mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                        lineNumber: 460,
                        columnNumber: 27
                      }, void 0) }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                        lineNumber: 459,
                        columnNumber: 25
                      }, void 0),
                      "Versión de Minecraft"
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                      lineNumber: 458,
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
                            lineNumber: 470,
                            columnNumber: 25
                          }, void 0),
                          getMcVersions().map((version) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: version.id, children: version.name }, version.id, false, {
                            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                            lineNumber: 472,
                            columnNumber: 27
                          }, void 0))
                        ]
                      },
                      void 0,
                      true,
                      {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                        lineNumber: 464,
                        columnNumber: 23
                      },
                      void 0
                    )
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                    lineNumber: 457,
                    columnNumber: 21
                  }, void 0),
                  loaderType !== "vanilla" && mcVersion && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/30 p-5 rounded-xl border border-gray-700/30", children: [
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-3", children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5 inline mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: [
                        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" }, void 0, false, {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                          lineNumber: 484,
                          columnNumber: 29
                        }, void 0),
                        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" }, void 0, false, {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                          lineNumber: 485,
                          columnNumber: 29
                        }, void 0)
                      ] }, void 0, true, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                        lineNumber: 483,
                        columnNumber: 27
                      }, void 0),
                      "Versión del Loader"
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                      lineNumber: 482,
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
                            lineNumber: 495,
                            columnNumber: 27
                          }, void 0),
                          loaderVersions.map((version, index) => {
                            var _a;
                            let displayVersion = "";
                            if (loaderType === "fabric" || loaderType === "quilt") {
                              displayVersion = ((_a = version.loader) == null ? void 0 : _a.version) || version.version;
                            } else if (loaderType === "forge" || loaderType === "neoforge") {
                              displayVersion = version.version;
                            }
                            return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: displayVersion, children: displayVersion }, index, false, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                              lineNumber: 506,
                              columnNumber: 31
                            }, void 0);
                          })
                        ]
                      },
                      void 0,
                      true,
                      {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                        lineNumber: 489,
                        columnNumber: 25
                      },
                      void 0
                    )
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                    lineNumber: 481,
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
                              lineNumber: 524,
                              columnNumber: 29
                            }, void 0) }, void 0, false, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                              lineNumber: 523,
                              columnNumber: 27
                            }, void 0),
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "font-medium", children: "Opciones Avanzadas" }, void 0, false, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                              lineNumber: 526,
                              columnNumber: 27
                            }, void 0)
                          ] }, void 0, true, {
                            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                            lineNumber: 522,
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
                                lineNumber: 534,
                                columnNumber: 27
                              }, void 0)
                            },
                            void 0,
                            false,
                            {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                              lineNumber: 528,
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
                        lineNumber: 516,
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
                                lineNumber: 548,
                                columnNumber: 33
                              }, void 0),
                              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full min-w-[70px] text-center", children: [
                                maxMemory,
                                " MB"
                              ] }, void 0, true, {
                                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                                lineNumber: 551,
                                columnNumber: 33
                              }, void 0)
                            ] }, void 0, true, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                              lineNumber: 547,
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
                                lineNumber: 555,
                                columnNumber: 31
                              },
                              void 0
                            ),
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between text-xs text-gray-400 mt-1", children: [
                              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: "1GB" }, void 0, false, {
                                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                                lineNumber: 569,
                                columnNumber: 33
                              }, void 0),
                              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: [
                                Math.min(totalMemory, 16384),
                                "MB"
                              ] }, void 0, true, {
                                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                                lineNumber: 570,
                                columnNumber: 33
                              }, void 0)
                            ] }, void 0, true, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                              lineNumber: 568,
                              columnNumber: 31
                            }, void 0)
                          ] }, void 0, true, {
                            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                            lineNumber: 546,
                            columnNumber: 29
                          }, void 0),
                          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Versión de Java" }, void 0, false, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                              lineNumber: 575,
                              columnNumber: 31
                            }, void 0),
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                              "select",
                              {
                                value: javaVersion,
                                onChange: (e) => setJavaVersion(e.target.value),
                                className: "w-full px-3 py-2 bg-gray-600/50 border border-gray-500/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
                                disabled: loading,
                                children: [
                                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "8", children: "Java 8" }, void 0, false, {
                                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                                    lineNumber: 584,
                                    columnNumber: 33
                                  }, void 0),
                                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "11", children: "Java 11" }, void 0, false, {
                                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                                    lineNumber: 585,
                                    columnNumber: 33
                                  }, void 0),
                                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "17", children: "Java 17" }, void 0, false, {
                                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                                    lineNumber: 586,
                                    columnNumber: 33
                                  }, void 0),
                                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "21", children: "Java 21" }, void 0, false, {
                                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                                    lineNumber: 587,
                                    columnNumber: 33
                                  }, void 0)
                                ]
                              },
                              void 0,
                              true,
                              {
                                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                                lineNumber: 578,
                                columnNumber: 31
                              },
                              void 0
                            )
                          ] }, void 0, true, {
                            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                            lineNumber: 574,
                            columnNumber: 29
                          }, void 0),
                          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Parámetros de Java" }, void 0, false, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                              lineNumber: 592,
                              columnNumber: 31
                            }, void 0),
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                              "input",
                              {
                                type: "text",
                                value: javaArgs,
                                onChange: (e) => setJavaArgs(e.target.value),
                                className: "w-full px-3 py-2 bg-gray-600/50 border border-gray-500/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
                                placeholder: "-XX:+UseG1GC -Dfml.earlyprogresswindow=false",
                                disabled: loading
                              },
                              void 0,
                              false,
                              {
                                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                                lineNumber: 595,
                                columnNumber: 31
                              },
                              void 0
                            )
                          ] }, void 0, true, {
                            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                            lineNumber: 591,
                            columnNumber: 29
                          }, void 0),
                          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Ruta de Java (opcional)" }, void 0, false, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                              lineNumber: 606,
                              columnNumber: 31
                            }, void 0),
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                              "input",
                              {
                                type: "text",
                                value: javaPath,
                                onChange: (e) => setJavaPath(e.target.value),
                                className: "w-full px-3 py-2 bg-gray-600/50 border border-gray-500/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
                                placeholder: "C:/Program Files/Java/jdk/bin/java.exe",
                                disabled: loading
                              },
                              void 0,
                              false,
                              {
                                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                                lineNumber: 609,
                                columnNumber: 31
                              },
                              void 0
                            )
                          ] }, void 0, true, {
                            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                            lineNumber: 605,
                            columnNumber: 29
                          }, void 0)
                        ]
                      },
                      void 0,
                      true,
                      {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                        lineNumber: 540,
                        columnNumber: 27
                      },
                      void 0
                    ) }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                      lineNumber: 538,
                      columnNumber: 23
                    }, void 0)
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                    lineNumber: 515,
                    columnNumber: 21
                  }, void 0)
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                  lineNumber: 456,
                  columnNumber: 19
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                lineNumber: 408,
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
                    lineNumber: 626,
                    columnNumber: 19
                  },
                  void 0
                ),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  "button",
                  {
                    type: "submit",
                    disabled: loading,
                    className: "px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl transition-all duration-300 disabled:opacity-50 font-medium flex items-center shadow-lg shadow-blue-500/20",
                    children: [
                      loading && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "animate-spin -ml-1 mr-3 h-5 w-5 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [
                        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }, void 0, false, {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                          lineNumber: 641,
                          columnNumber: 25
                        }, void 0),
                        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" }, void 0, false, {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                          lineNumber: 642,
                          columnNumber: 25
                        }, void 0)
                      ] }, void 0, true, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                        lineNumber: 640,
                        columnNumber: 23
                      }, void 0),
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5 mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 6v6m0 0v6m0-6h6m-6 0H6" }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                        lineNumber: 646,
                        columnNumber: 23
                      }, void 0) }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                        lineNumber: 645,
                        columnNumber: 21
                      }, void 0),
                      loading ? "Creando y descargando..." : "Crear Instancia"
                    ]
                  },
                  void 0,
                  true,
                  {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                    lineNumber: 634,
                    columnNumber: 19
                  },
                  void 0
                )
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
                lineNumber: 625,
                columnNumber: 17
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
              lineNumber: 407,
              columnNumber: 15
            }, void 0)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
            lineNumber: 338,
            columnNumber: 13
          }, void 0) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
            lineNumber: 337,
            columnNumber: 11
          }, void 0)
        },
        void 0,
        false,
        {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
          lineNumber: 330,
          columnNumber: 9
        },
        void 0
      )
    },
    void 0,
    false,
    {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
      lineNumber: 324,
      columnNumber: 7
    },
    void 0
  ) }, void 0, false, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/CreateInstanceModal.tsx",
    lineNumber: 323,
    columnNumber: 5
  }, void 0);
};
export {
  CreateInstanceModal as C
};
