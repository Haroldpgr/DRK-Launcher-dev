const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/javaDownloadService-CRIVDBp1.js","assets/downloadService-CouTlF8L.js","assets/index-B9ZE2vIj.js","assets/index-C763eF6j.css"])))=>i.map(i=>d[i]);
import { r as reactExports, _ as __vitePreload, j as jsxDevRuntimeExports, p as profileService } from "./index-B9ZE2vIj.js";
import { instanceProfileService } from "./instanceProfileService-BmQP9Q_h.js";
import { C as CreateInstanceModal } from "./CreateInstanceModal-ESCj6SL3.js";
import { A as AnimatePresence, m as motion } from "./proxy-Cddb-DTL.js";
import "./integratedDownloadService-C3tlNEKn.js";
const InstanceEditModal = ({
  instance,
  isOpen,
  onClose,
  onSave,
  onDelete
}) => {
  const [name, setName] = reactExports.useState("");
  const [version, setVersion] = reactExports.useState("");
  const [loader, setLoader] = reactExports.useState("vanilla");
  const [loaderVersion, setLoaderVersion] = reactExports.useState("");
  const [javaPath, setJavaPath] = reactExports.useState("");
  const [javaId, setJavaId] = reactExports.useState("");
  const [maxMemory, setMaxMemory] = reactExports.useState(4096);
  const [minMemory, setMinMemory] = reactExports.useState(1024);
  const [totalMemory, setTotalMemory] = reactExports.useState(8192);
  const [windowWidth, setWindowWidth] = reactExports.useState(1280);
  const [windowHeight, setWindowHeight] = reactExports.useState(720);
  const [jvmArgs, setJvmArgs] = reactExports.useState("");
  const [createdAt, setCreatedAt] = reactExports.useState(null);
  const [instancePath, setInstancePath] = reactExports.useState("");
  const [availableVersions, setAvailableVersions] = reactExports.useState([]);
  const [availableJava, setAvailableJava] = reactExports.useState([]);
  const [error, setError] = reactExports.useState(null);
  const [activeTab, setActiveTab] = reactExports.useState("basic");
  reactExports.useEffect(() => {
    var _a;
    if (isOpen && instance) {
      setName(instance.name);
      setVersion(instance.version);
      setLoader(instance.loader || "vanilla");
      setLoaderVersion(instance.loaderVersion || "");
      setJavaPath(instance.javaPath || "");
      setJavaId(instance.javaId || "");
      setMaxMemory(instance.maxMemory || 4096);
      setWindowWidth(instance.windowWidth || 1280);
      setWindowHeight(instance.windowHeight || 720);
      setJvmArgs(((_a = instance.jvmArgs) == null ? void 0 : _a.join(" ")) || "");
      setCreatedAt(new Date(instance.createdAt));
      setInstancePath(instance.path);
      loadAvailableVersions();
      loadAvailableJava();
    }
  }, [isOpen, instance]);
  reactExports.useEffect(() => {
    if (isOpen && instance && version && version !== instance.version) {
      const updateJavaPathForMinecraftVersion = async () => {
        var _a, _b;
        try {
          if ((_b = (_a = window.api) == null ? void 0 : _a.java) == null ? void 0 : _b.getJavaForMinecraftVersion) {
            const recommendedJavaPath = await window.api.java.getJavaForMinecraftVersion(version);
            if (recommendedJavaPath !== javaPath) {
              setJavaPath(recommendedJavaPath);
              const javaIdMatch = recommendedJavaPath.match(/java(\d+)/i);
              if (javaIdMatch && javaIdMatch[1]) {
                const newJavaId = `java${javaIdMatch[1]}`;
                setJavaId(newJavaId);
              }
            }
          }
        } catch (error2) {
          console.error("Error al actualizar la ruta de Java para la nueva versión de Minecraft:", error2);
        }
      };
      updateJavaPathForMinecraftVersion();
    }
  }, [version, isOpen]);
  const loadAvailableVersions = async () => {
    var _a, _b;
    try {
      if ((_b = (_a = window.api) == null ? void 0 : _a.versions) == null ? void 0 : _b.list) {
        const versions = await window.api.versions.list();
        const releaseVersions = versions.filter((v) => v.type === "release");
        setAvailableVersions(releaseVersions);
      }
    } catch (err) {
      console.error("Error al cargar versiones:", err);
    }
  };
  const loadAvailableJava = async () => {
    var _a, _b;
    try {
      if ((_b = (_a = window.api) == null ? void 0 : _a.java) == null ? void 0 : _b.getAll) {
        const javaInstallations = await window.api.java.getAll();
        setAvailableJava(javaInstallations);
      } else {
        const { javaDownloadService } = await __vitePreload(async () => {
          const { javaDownloadService: javaDownloadService2 } = await import("./javaDownloadService-CRIVDBp1.js");
          return { javaDownloadService: javaDownloadService2 };
        }, true ? __vite__mapDeps([0,1,2,3]) : void 0);
        const systemJava = await javaDownloadService.scanForJavaInstallations();
        setAvailableJava(systemJava.map((j) => ({
          id: j.id,
          path: j.executable,
          version: j.version
        })));
      }
    } catch (err) {
      console.error("Error al cargar Java disponibles:", err);
    }
  };
  const handleSubmit = async (e) => {
    var _a, _b;
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("El nombre de la instancia es obligatorio");
      return;
    }
    if (!version) {
      setError("Debes seleccionar una versión de Minecraft");
      return;
    }
    try {
      let finalJavaPath = javaPath || void 0;
      let finalJavaId = javaId || void 0;
      if (instance && instance.version !== version && !javaPath) {
        if ((_b = (_a = window.api) == null ? void 0 : _a.java) == null ? void 0 : _b.getJavaForMinecraftVersion) {
          finalJavaPath = await window.api.java.getJavaForMinecraftVersion(version);
        } else {
          const { javaDownloadService } = await __vitePreload(async () => {
            const { javaDownloadService: javaDownloadService2 } = await import("./javaDownloadService-CRIVDBp1.js");
            return { javaDownloadService: javaDownloadService2 };
          }, true ? __vite__mapDeps([0,1,2,3]) : void 0);
          finalJavaPath = await javaDownloadService.getJavaForMinecraftVersion(version);
        }
      } else {
        finalJavaPath = javaPath || void 0;
        finalJavaId = javaId || void 0;
      }
      const updatedInstance = {
        ...instance,
        name,
        version,
        loader,
        loaderVersion: loaderVersion || void 0,
        javaPath: finalJavaPath,
        javaId: finalJavaId,
        maxMemory: maxMemory || void 0,
        minMemory: minMemory || void 0,
        windowWidth,
        windowHeight,
        jvmArgs: jvmArgs ? jvmArgs.split(" ").filter((arg) => arg.trim() !== "") : void 0,
        path: instancePath
      };
      onSave(updatedInstance);
      onClose();
    } catch (err) {
      setError(`Error al guardar la instancia: ${err.message || "Error desconocido"}`);
    }
  };
  const handleDelete = () => {
    if (instance && window.confirm(`¿Estás seguro de que quieres eliminar la instancia "${instance.name}"? Esta acción no se puede deshacer.`)) {
      onDelete(instance.id);
      onClose();
    }
  };
  if (!isOpen || !instance) return null;
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
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h2", { className: "text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent", children: [
                "Editar Instancia: ",
                instance.name
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                lineNumber: 236,
                columnNumber: 17
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                "button",
                {
                  onClick: onClose,
                  className: "p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors",
                  children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M6 18L18 6M6 6l12 12" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                    lineNumber: 244,
                    columnNumber: 21
                  }, void 0) }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                    lineNumber: 243,
                    columnNumber: 19
                  }, void 0)
                },
                void 0,
                false,
                {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                  lineNumber: 239,
                  columnNumber: 17
                },
                void 0
              )
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
              lineNumber: 235,
              columnNumber: 15
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("form", { onSubmit: handleSubmit, children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "inline-flex items-center bg-gray-800/80 border border-gray-700/70 rounded-2xl p-1 text-xs text-gray-300 mb-6", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  "button",
                  {
                    type: "button",
                    onClick: () => setActiveTab("basic"),
                    className: `px-4 py-2 rounded-xl transition-all ${activeTab === "basic" ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-black shadow-sm" : "text-gray-400 hover:text-gray-200"}`,
                    children: "Básico"
                  },
                  void 0,
                  false,
                  {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                    lineNumber: 252,
                    columnNumber: 19
                  },
                  void 0
                ),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  "button",
                  {
                    type: "button",
                    onClick: () => setActiveTab("java"),
                    className: `ml-1 px-4 py-2 rounded-xl transition-all ${activeTab === "java" ? "bg-gradient-to-r from-green-500 to-emerald-600 text-black shadow-sm" : "text-gray-400 hover:text-gray-200"}`,
                    children: "Java"
                  },
                  void 0,
                  false,
                  {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                    lineNumber: 263,
                    columnNumber: 19
                  },
                  void 0
                ),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  "button",
                  {
                    type: "button",
                    onClick: () => setActiveTab("advanced"),
                    className: `ml-1 px-4 py-2 rounded-xl transition-all ${activeTab === "advanced" ? "bg-gradient-to-r from-purple-500 to-pink-600 text-black shadow-sm" : "text-gray-400 hover:text-gray-200"}`,
                    children: "Avanzado"
                  },
                  void 0,
                  false,
                  {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                    lineNumber: 274,
                    columnNumber: 19
                  },
                  void 0
                )
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                lineNumber: 251,
                columnNumber: 17
              }, void 0),
              error && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mb-6 p-4 bg-gradient-to-r from-red-900/50 to-red-800/30 border border-red-700/50 rounded-xl text-red-200 flex items-start mb-6", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-6 h-6 mr-3 flex-shrink-0", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                  lineNumber: 290,
                  columnNumber: 23
                }, void 0) }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                  lineNumber: 289,
                  columnNumber: 21
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: error }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                  lineNumber: 292,
                  columnNumber: 21
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                lineNumber: 288,
                columnNumber: 19
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-6", children: [
                activeTab === "basic" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-4", children: [
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Nombre de la instancia" }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                        lineNumber: 302,
                        columnNumber: 27
                      }, void 0),
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                        "input",
                        {
                          type: "text",
                          value: name,
                          onChange: (e) => setName(e.target.value),
                          className: "w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
                          placeholder: "Nombre de la instancia"
                        },
                        void 0,
                        false,
                        {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                          lineNumber: 305,
                          columnNumber: 27
                        },
                        void 0
                      )
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                      lineNumber: 301,
                      columnNumber: 25
                    }, void 0),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Versión de Minecraft" }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                        lineNumber: 315,
                        columnNumber: 27
                      }, void 0),
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                        "select",
                        {
                          value: version,
                          onChange: (e) => setVersion(e.target.value),
                          className: "w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
                          children: [
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "", children: "Selecciona una versión" }, void 0, false, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                              lineNumber: 323,
                              columnNumber: 29
                            }, void 0),
                            availableVersions.map((ver) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: ver.id, children: [
                              ver.id,
                              " (",
                              ver.type,
                              ")"
                            ] }, ver.id, true, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                              lineNumber: 325,
                              columnNumber: 31
                            }, void 0))
                          ]
                        },
                        void 0,
                        true,
                        {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                          lineNumber: 318,
                          columnNumber: 27
                        },
                        void 0
                      )
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                      lineNumber: 314,
                      columnNumber: 25
                    }, void 0),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Tipo de Loader" }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                        lineNumber: 333,
                        columnNumber: 27
                      }, void 0),
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                        "select",
                        {
                          value: loader,
                          onChange: (e) => setLoader(e.target.value),
                          className: "w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
                          children: [
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "vanilla", children: "Vanilla" }, void 0, false, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                              lineNumber: 341,
                              columnNumber: 29
                            }, void 0),
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "forge", children: "Forge" }, void 0, false, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                              lineNumber: 342,
                              columnNumber: 29
                            }, void 0),
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "fabric", children: "Fabric" }, void 0, false, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                              lineNumber: 343,
                              columnNumber: 29
                            }, void 0),
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "quilt", children: "Quilt" }, void 0, false, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                              lineNumber: 344,
                              columnNumber: 29
                            }, void 0),
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "neoforge", children: "NeoForge" }, void 0, false, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                              lineNumber: 345,
                              columnNumber: 29
                            }, void 0)
                          ]
                        },
                        void 0,
                        true,
                        {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                          lineNumber: 336,
                          columnNumber: 27
                        },
                        void 0
                      )
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                      lineNumber: 332,
                      columnNumber: 25
                    }, void 0),
                    loader !== "vanilla" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Versión del Loader" }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                        lineNumber: 351,
                        columnNumber: 29
                      }, void 0),
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                        "input",
                        {
                          type: "text",
                          value: loaderVersion,
                          onChange: (e) => setLoaderVersion(e.target.value),
                          className: "w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
                          placeholder: "Versión del loader (por ejemplo: 47.2.0)"
                        },
                        void 0,
                        false,
                        {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                          lineNumber: 354,
                          columnNumber: 29
                        },
                        void 0
                      )
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                      lineNumber: 350,
                      columnNumber: 27
                    }, void 0)
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                    lineNumber: 300,
                    columnNumber: 23
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-4", children: [
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Fecha de creación" }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                        lineNumber: 367,
                        columnNumber: 27
                      }, void 0),
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-300", children: (createdAt == null ? void 0 : createdAt.toLocaleString()) || "Fecha desconocida" }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                        lineNumber: 370,
                        columnNumber: 27
                      }, void 0)
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                      lineNumber: 366,
                      columnNumber: 25
                    }, void 0),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Ruta de la instancia" }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                        lineNumber: 376,
                        columnNumber: 27
                      }, void 0),
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-300 font-mono text-sm break-all", children: instancePath }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                        lineNumber: 379,
                        columnNumber: 27
                      }, void 0)
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                      lineNumber: 375,
                      columnNumber: 25
                    }, void 0),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "ID de la instancia" }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                        lineNumber: 385,
                        columnNumber: 27
                      }, void 0),
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-300 font-mono text-sm", children: instance.id }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                        lineNumber: 388,
                        columnNumber: 27
                      }, void 0)
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                      lineNumber: 384,
                      columnNumber: 25
                    }, void 0)
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                    lineNumber: 365,
                    columnNumber: 23
                  }, void 0)
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                  lineNumber: 299,
                  columnNumber: 21
                }, void 0),
                activeTab === "java" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-4", children: [
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Versión de Java" }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                        lineNumber: 400,
                        columnNumber: 27
                      }, void 0),
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                        "select",
                        {
                          value: javaId,
                          onChange: (e) => setJavaId(e.target.value),
                          className: "w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
                          children: [
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "", children: "Selecciona una versión de Java" }, void 0, false, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                              lineNumber: 408,
                              columnNumber: 29
                            }, void 0),
                            availableJava.map((j) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: j.id, children: [
                              "Java ",
                              j.version,
                              " - ",
                              j.path
                            ] }, j.id, true, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                              lineNumber: 410,
                              columnNumber: 31
                            }, void 0))
                          ]
                        },
                        void 0,
                        true,
                        {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                          lineNumber: 403,
                          columnNumber: 27
                        },
                        void 0
                      )
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                      lineNumber: 399,
                      columnNumber: 25
                    }, void 0),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Ruta personalizada de Java" }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                        lineNumber: 418,
                        columnNumber: 27
                      }, void 0),
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                        "input",
                        {
                          type: "text",
                          value: javaPath,
                          onChange: (e) => setJavaPath(e.target.value),
                          className: "w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
                          placeholder: "C:/Program Files/Java/jdk/bin/java.exe"
                        },
                        void 0,
                        false,
                        {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                          lineNumber: 421,
                          columnNumber: 27
                        },
                        void 0
                      )
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                      lineNumber: 417,
                      columnNumber: 25
                    }, void 0),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/30 p-4 rounded-xl border border-gray-700/50", children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-3", children: [
                        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5 inline mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" }, void 0, false, {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                          lineNumber: 433,
                          columnNumber: 31
                        }, void 0) }, void 0, false, {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                          lineNumber: 432,
                          columnNumber: 29
                        }, void 0),
                        "Configuración de Memoria"
                      ] }, void 0, true, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                        lineNumber: 431,
                        columnNumber: 27
                      }, void 0),
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-4", children: [
                        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-center mb-2", children: [
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300", children: "Memoria RAM máxima (MB)" }, void 0, false, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                              lineNumber: 440,
                              columnNumber: 33
                            }, void 0),
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full min-w-[70px] text-center", children: [
                              maxMemory,
                              " MB"
                            ] }, void 0, true, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                              lineNumber: 443,
                              columnNumber: 33
                            }, void 0)
                          ] }, void 0, true, {
                            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                            lineNumber: 439,
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
                              className: "w-full h-2 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg appearance-none cursor-pointer"
                            },
                            void 0,
                            false,
                            {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                              lineNumber: 447,
                              columnNumber: 31
                            },
                            void 0
                          ),
                          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between text-xs text-gray-400 mt-1", children: [
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: "1GB" }, void 0, false, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                              lineNumber: 460,
                              columnNumber: 33
                            }, void 0),
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: [
                              Math.min(totalMemory, 16384),
                              "MB"
                            ] }, void 0, true, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                              lineNumber: 461,
                              columnNumber: 33
                            }, void 0)
                          ] }, void 0, true, {
                            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                            lineNumber: 459,
                            columnNumber: 31
                          }, void 0)
                        ] }, void 0, true, {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                          lineNumber: 438,
                          columnNumber: 29
                        }, void 0),
                        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-center mb-2", children: [
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300", children: "Memoria RAM mínima (MB)" }, void 0, false, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                              lineNumber: 467,
                              columnNumber: 33
                            }, void 0),
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-sm font-medium bg-gradient-to-r from-green-600 to-teal-600 text-white px-3 py-1 rounded-full min-w-[70px] text-center", children: [
                              minMemory,
                              " MB"
                            ] }, void 0, true, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                              lineNumber: 470,
                              columnNumber: 33
                            }, void 0)
                          ] }, void 0, true, {
                            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                            lineNumber: 466,
                            columnNumber: 31
                          }, void 0),
                          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                            "input",
                            {
                              type: "range",
                              min: "512",
                              max: maxMemory,
                              value: minMemory,
                              onChange: (e) => setMinMemory(parseInt(e.target.value)),
                              className: "w-full h-2 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg appearance-none cursor-pointer"
                            },
                            void 0,
                            false,
                            {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                              lineNumber: 474,
                              columnNumber: 31
                            },
                            void 0
                          ),
                          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between text-xs text-gray-400 mt-1", children: [
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: "512MB" }, void 0, false, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                              lineNumber: 483,
                              columnNumber: 33
                            }, void 0),
                            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: [
                              maxMemory,
                              "MB"
                            ] }, void 0, true, {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                              lineNumber: 484,
                              columnNumber: 33
                            }, void 0)
                          ] }, void 0, true, {
                            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                            lineNumber: 482,
                            columnNumber: 31
                          }, void 0)
                        ] }, void 0, true, {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                          lineNumber: 465,
                          columnNumber: 29
                        }, void 0)
                      ] }, void 0, true, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                        lineNumber: 437,
                        columnNumber: 27
                      }, void 0)
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                      lineNumber: 430,
                      columnNumber: 25
                    }, void 0)
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                    lineNumber: 398,
                    columnNumber: 23
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-4", children: [
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/30 p-4 rounded-xl border border-gray-700/50", children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Dimensiones de la ventana" }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                        lineNumber: 493,
                        columnNumber: 27
                      }, void 0),
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-2 gap-4", children: [
                        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-xs font-medium text-gray-400 mb-1", children: "Ancho" }, void 0, false, {
                            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                            lineNumber: 498,
                            columnNumber: 31
                          }, void 0),
                          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                            "input",
                            {
                              type: "number",
                              value: windowWidth,
                              onChange: (e) => setWindowWidth(parseInt(e.target.value) || 800),
                              className: "w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
                              min: "800",
                              max: "3840"
                            },
                            void 0,
                            false,
                            {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                              lineNumber: 499,
                              columnNumber: 31
                            },
                            void 0
                          )
                        ] }, void 0, true, {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                          lineNumber: 497,
                          columnNumber: 29
                        }, void 0),
                        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-xs font-medium text-gray-400 mb-1", children: "Alto" }, void 0, false, {
                            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                            lineNumber: 509,
                            columnNumber: 31
                          }, void 0),
                          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                            "input",
                            {
                              type: "number",
                              value: windowHeight,
                              onChange: (e) => setWindowHeight(parseInt(e.target.value) || 600),
                              className: "w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
                              min: "600",
                              max: "2160"
                            },
                            void 0,
                            false,
                            {
                              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                              lineNumber: 510,
                              columnNumber: 31
                            },
                            void 0
                          )
                        ] }, void 0, true, {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                          lineNumber: 508,
                          columnNumber: 29
                        }, void 0)
                      ] }, void 0, true, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                        lineNumber: 496,
                        columnNumber: 27
                      }, void 0)
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                      lineNumber: 492,
                      columnNumber: 25
                    }, void 0),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Argumentos JVM Personalizados" }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                        lineNumber: 523,
                        columnNumber: 27
                      }, void 0),
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                        "textarea",
                        {
                          value: jvmArgs,
                          onChange: (e) => setJvmArgs(e.target.value),
                          className: "w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[100px]",
                          placeholder: "-XX:+UseG1GC -Dfml.earlyprogresswindow=false"
                        },
                        void 0,
                        false,
                        {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                          lineNumber: 526,
                          columnNumber: 27
                        },
                        void 0
                      ),
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-xs text-gray-400 mt-1", children: 'Separa cada argumento con espacio (por ejemplo: "-XX:+UseG1GC -Xmx4G")' }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                        lineNumber: 532,
                        columnNumber: 27
                      }, void 0)
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                      lineNumber: 522,
                      columnNumber: 25
                    }, void 0)
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                    lineNumber: 491,
                    columnNumber: 23
                  }, void 0)
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                  lineNumber: 397,
                  columnNumber: 21
                }, void 0),
                activeTab === "advanced" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-6", children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/30 p-6 rounded-xl border border-gray-700/50", children: [
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-semibold text-gray-200 mb-4", children: "Configuración Avanzada" }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                      lineNumber: 543,
                      columnNumber: 25
                    }, void 0),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Ruta de la instancia" }, void 0, false, {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                          lineNumber: 547,
                          columnNumber: 29
                        }, void 0),
                        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                          "input",
                          {
                            type: "text",
                            value: instancePath,
                            onChange: (e) => setInstancePath(e.target.value),
                            className: "w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
                            readOnly: true
                          },
                          void 0,
                          false,
                          {
                            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                            lineNumber: 550,
                            columnNumber: 29
                          },
                          void 0
                        )
                      ] }, void 0, true, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                        lineNumber: 546,
                        columnNumber: 27
                      }, void 0),
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "ID de Instancia" }, void 0, false, {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                          lineNumber: 560,
                          columnNumber: 29
                        }, void 0),
                        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                          "input",
                          {
                            type: "text",
                            value: instance.id,
                            className: "w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
                            readOnly: true
                          },
                          void 0,
                          false,
                          {
                            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                            lineNumber: 563,
                            columnNumber: 29
                          },
                          void 0
                        )
                      ] }, void 0, true, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                        lineNumber: 559,
                        columnNumber: 27
                      }, void 0)
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                      lineNumber: 545,
                      columnNumber: 25
                    }, void 0),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-4", children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Perfiles asociados" }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                        lineNumber: 573,
                        columnNumber: 27
                      }, void 0),
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex flex-wrap gap-2", children: profileService.getAllProfiles().map((profile) => {
                        const isLinked = instanceProfileService.isInstanceLinkedToProfile(instance.id, profile.username);
                        return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                          "button",
                          {
                            type: "button",
                            onClick: () => {
                              if (isLinked) {
                                instanceProfileService.unlinkInstanceFromProfile(instance.id, profile.username);
                              } else {
                                instanceProfileService.linkInstanceToProfile(instance.id, profile.username);
                              }
                            },
                            className: `px-3 py-1 rounded-full text-sm transition-all ${isLinked ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"}`,
                            children: [
                              profile.username,
                              " ",
                              isLinked ? "✓" : ""
                            ]
                          },
                          profile.id,
                          true,
                          {
                            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                            lineNumber: 580,
                            columnNumber: 33
                          },
                          void 0
                        );
                      }) }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                        lineNumber: 576,
                        columnNumber: 27
                      }, void 0)
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                      lineNumber: 572,
                      columnNumber: 25
                    }, void 0)
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                    lineNumber: 542,
                    columnNumber: 23
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-red-900/20 p-6 rounded-xl border border-red-700/50", children: [
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-semibold text-red-200 mb-4", children: "Acciones Peligrosas" }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                      lineNumber: 605,
                      columnNumber: 25
                    }, void 0),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex gap-4", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                      "button",
                      {
                        type: "button",
                        onClick: handleDelete,
                        className: "px-6 py-3 bg-red-700 hover:bg-red-600 text-white rounded-xl transition-colors font-medium flex items-center",
                        children: [
                          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5 mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" }, void 0, false, {
                            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                            lineNumber: 613,
                            columnNumber: 31
                          }, void 0) }, void 0, false, {
                            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                            lineNumber: 612,
                            columnNumber: 29
                          }, void 0),
                          "Eliminar Instancia"
                        ]
                      },
                      void 0,
                      true,
                      {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                        lineNumber: 607,
                        columnNumber: 27
                      },
                      void 0
                    ) }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                      lineNumber: 606,
                      columnNumber: 25
                    }, void 0),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-sm text-red-400 mt-2", children: "Esta acción eliminará permanentemente la instancia y todos sus archivos." }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                      lineNumber: 618,
                      columnNumber: 25
                    }, void 0)
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                    lineNumber: 604,
                    columnNumber: 23
                  }, void 0)
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                  lineNumber: 541,
                  columnNumber: 21
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                lineNumber: 297,
                columnNumber: 17
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between pt-8 border-t border-gray-700/50", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  "button",
                  {
                    type: "button",
                    onClick: handleDelete,
                    className: "px-6 py-3 bg-red-700 hover:bg-red-600 text-white rounded-xl transition-colors font-medium",
                    children: "Eliminar"
                  },
                  void 0,
                  false,
                  {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                    lineNumber: 627,
                    columnNumber: 19
                  },
                  void 0
                ),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex gap-3", children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                    "button",
                    {
                      type: "button",
                      onClick: onClose,
                      className: "px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors font-medium",
                      children: "Cancelar"
                    },
                    void 0,
                    false,
                    {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                      lineNumber: 636,
                      columnNumber: 21
                    },
                    void 0
                  ),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                    "button",
                    {
                      type: "submit",
                      className: "px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl transition-all font-medium flex items-center shadow-lg shadow-blue-500/20",
                      children: [
                        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5 mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" }, void 0, false, {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                          lineNumber: 648,
                          columnNumber: 25
                        }, void 0) }, void 0, false, {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                          lineNumber: 647,
                          columnNumber: 23
                        }, void 0),
                        "Guardar Cambios"
                      ]
                    },
                    void 0,
                    true,
                    {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                      lineNumber: 643,
                      columnNumber: 21
                    },
                    void 0
                  )
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                  lineNumber: 635,
                  columnNumber: 19
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
                lineNumber: 626,
                columnNumber: 17
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
              lineNumber: 249,
              columnNumber: 15
            }, void 0)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
            lineNumber: 234,
            columnNumber: 13
          }, void 0) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
            lineNumber: 233,
            columnNumber: 11
          }, void 0)
        },
        void 0,
        false,
        {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
          lineNumber: 226,
          columnNumber: 9
        },
        void 0
      )
    },
    void 0,
    false,
    {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
      lineNumber: 220,
      columnNumber: 7
    },
    void 0
  ) }, void 0, false, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/InstanceEditModal.tsx",
    lineNumber: 219,
    columnNumber: 5
  }, void 0);
};
function Instances({ onPlay }) {
  const [instances, setInstances] = reactExports.useState([]);
  const [ownedInstances, setOwnedInstances] = reactExports.useState([]);
  const [importedInstances, setImportedInstances] = reactExports.useState([]);
  const [sharedInstances, setSharedInstances] = reactExports.useState([]);
  const [activeTab, setActiveTab] = reactExports.useState("all");
  const [editing, setEditing] = reactExports.useState(null);
  const [editingFull, setEditingFull] = reactExports.useState(null);
  const [newName, setNewName] = reactExports.useState("");
  const [error, setError] = reactExports.useState(null);
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const [selectedProfile, setSelectedProfile] = reactExports.useState(null);
  const [profiles, setProfiles] = reactExports.useState([]);
  const [selectedInstance, setSelectedInstance] = reactExports.useState(null);
  const [showInstanceDetails, setShowInstanceDetails] = reactExports.useState(false);
  const [showImportModal, setShowImportModal] = reactExports.useState(false);
  const [importSource, setImportSource] = reactExports.useState("");
  const [importType, setImportType] = reactExports.useState("link");
  const [showCreateModal, setShowCreateModal] = reactExports.useState(false);
  const [readyStatus, setReadyStatus] = reactExports.useState({});
  const checkInstanceReady = (instance) => {
    return instance.path && instance.path.length > 0;
  };
  reactExports.useEffect(() => {
    try {
      const allProfiles = profileService.getAllProfiles();
      setProfiles(allProfiles);
      if (allProfiles.length > 0) {
        const currentProfile = profileService.getCurrentProfile();
        if (currentProfile) {
          setSelectedProfile(currentProfile);
        } else {
          setSelectedProfile(allProfiles[0].username);
        }
      }
    } catch (err) {
      console.error("Error al cargar perfiles:", err);
      setError("Error al cargar perfiles");
    }
  }, []);
  const classifyInstances = (instances2) => {
    const owned = instances2.filter((instance) => instance.type === "owned");
    const imported = instances2.filter((instance) => instance.type === "imported");
    const shared = instances2.filter((instance) => instance.type === "shared");
    setOwnedInstances(owned);
    setImportedInstances(imported);
    setSharedInstances(shared);
  };
  const autoDetectInstances = async () => {
    var _a;
    if (!((_a = window.api) == null ? void 0 : _a.instances) || !selectedProfile) return;
    try {
      if (window.api.instances.scanAndRegister) {
        try {
          const scanResult = await window.api.instances.scanAndRegister();
          console.log(`Registro automático completado: ${scanResult.count} instancias nuevas registradas`);
        } catch (scanError) {
          console.error("Error al escanear y registrar instancias:", scanError);
        }
      }
      const allSystemInstances = await window.api.instances.list();
      for (const instance of allSystemInstances) {
        const profileInstanceIds2 = instanceProfileService.getInstancesForProfile(selectedProfile);
        if (!profileInstanceIds2.includes(instance.id)) {
          const otherProfile = instanceProfileService.getProfileForInstance(instance.id);
          if (!otherProfile) {
            instanceProfileService.linkInstanceToProfile(instance.id, selectedProfile);
          }
        }
      }
      const updatedList = await window.api.instances.list();
      const profileInstanceIds = instanceProfileService.getInstancesForProfile(selectedProfile);
      const profileInstances = updatedList.filter(
        (instance) => profileInstanceIds.includes(instance.id)
      );
      const classifiedInstances = profileInstances.map((instance) => {
        let type = "owned";
        if (instance.source) {
          if (instance.source.startsWith("http")) {
            type = "imported";
          } else if (instance.source.includes("\\") || instance.source.includes("/")) {
            type = "imported";
          }
        } else {
          type = "owned";
        }
        const timePlayed = instanceProfileService.getPlayTime(instance.id, selectedProfile);
        return {
          ...instance,
          totalTimePlayed: timePlayed,
          type
        };
      });
      setInstances(classifiedInstances);
      classifyInstances(classifiedInstances);
      setError(null);
    } catch (err) {
      console.error("Error en auto-detección de instancias:", err);
      setError(`Error en auto-detección de instancias: ${err.message || "Error desconocido"}`);
    }
  };
  reactExports.useEffect(() => {
    if (!selectedProfile) {
      setInstances([]);
      setOwnedInstances([]);
      setImportedInstances([]);
      setSharedInstances([]);
      return;
    }
    autoDetectInstances();
  }, [selectedProfile]);
  const remove = async (id) => {
    var _a;
    const instance = instances.find((inst) => inst.id === id);
    if (!instance || !window.confirm(`¿Estás seguro de que quieres eliminar la instancia "${instance.name}"? Esta acción no se puede deshacer y eliminará permanentemente todos los archivos de la instancia.`)) {
      return;
    }
    if (!((_a = window.api) == null ? void 0 : _a.instances)) {
      setError("Servicio de instancias no disponible aún. Esperando inicialización...");
      return;
    }
    try {
      instanceProfileService.unlinkInstance(id);
      await window.api.instances.delete(id);
      autoDetectInstances();
    } catch (err) {
      console.error("Error al eliminar instancia:", err);
      setError(`Error al eliminar instancia: ${err.message || "Error desconocido"}`);
    }
  };
  const open = async (id) => {
    var _a;
    if (!((_a = window.api) == null ? void 0 : _a.instances)) {
      setError("Servicio de instancias no disponible aún. Esperando inicialización...");
      return;
    }
    try {
      await window.api.instances.openFolder(id);
    } catch (err) {
      console.error("Error al abrir carpeta de instancia:", err);
      setError(`Error al abrir carpeta: ${err.message || "Error desconocido"}`);
    }
  };
  const handlePlay = async (id) => {
    onPlay(id);
  };
  const startEdit = (instance) => {
    setEditingFull(instance);
  };
  const closeEdit = () => {
    setEditingFull(null);
  };
  const handleSaveEdit = async (updatedInstance) => {
    var _a, _b;
    try {
      if ((_b = (_a = window.api) == null ? void 0 : _a.instances) == null ? void 0 : _b.update) {
        await window.api.instances.update({
          id: updatedInstance.id,
          patch: {
            name: updatedInstance.name,
            version: updatedInstance.version,
            loader: updatedInstance.loader,
            ramMb: updatedInstance.maxMemory,
            javaPath: updatedInstance.javaPath,
            windowWidth: updatedInstance.windowWidth,
            windowHeight: updatedInstance.windowHeight,
            jvmArgs: updatedInstance.jvmArgs
          }
        });
      }
      autoDetectInstances();
      closeEdit();
    } catch (err) {
      console.error("Error al guardar edición:", err);
      setError(`Error al guardar edición: ${err.message || "Error desconocido"}`);
    }
  };
  const viewInstanceDetails = (instance) => {
    setSelectedInstance(instance);
    setShowInstanceDetails(true);
  };
  const importInstance = async (source) => {
    var _a;
    if (!((_a = window.api) == null ? void 0 : _a.instances)) {
      setError("Servicio de instancias no disponible aún. Esperando inicialización...");
      return;
    }
    try {
      let importResult;
      if (source.startsWith("http")) {
        console.log("Importando desde URL:", source);
      } else {
        console.log("Importando desde carpeta:", source);
      }
      autoDetectInstances();
    } catch (err) {
      console.error("Error al importar instancia:", err);
      setError(`Error al importar instancia: ${err.message || "Error desconocido"}`);
    }
  };
  const getFilteredInstances = () => {
    let instancesToShow = [];
    switch (activeTab) {
      case "owned":
        instancesToShow = ownedInstances;
        break;
      case "imported":
        instancesToShow = importedInstances;
        break;
      case "shared":
        instancesToShow = sharedInstances;
        break;
      case "all":
      default:
        instancesToShow = instances;
        break;
    }
    return instancesToShow.filter(
      (instance) => instance.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };
  const filteredInstances = getFilteredInstances();
  if (error) {
    return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-6", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-red-900/30 border border-red-700/50 rounded-xl p-4 text-red-200", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h2", { className: "text-lg font-bold mb-2", children: "Error" }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
        lineNumber: 352,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { children: error }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
        lineNumber: 353,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
      lineNumber: 351,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
      lineNumber: 350,
      columnNumber: 7
    }, this);
  }
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(jsxDevRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-6", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mb-8", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h1", { className: "text-3xl font-bold text-white mb-2", children: "Instancias de Minecraft" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
          lineNumber: 363,
          columnNumber: 9
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-gray-400", children: "Gestiona tus instancias de juego y perfiles" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
          lineNumber: 364,
          columnNumber: 9
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
        lineNumber: 362,
        columnNumber: 7
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mb-6", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex flex-wrap gap-2 border-b border-gray-700/50", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: () => setActiveTab("all"),
            className: `px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${activeTab === "all" ? "bg-gray-700/50 text-white border-b-2 border-blue-500" : "text-gray-400 hover:text-white hover:bg-gray-700/30"}`,
            children: [
              "Mis Instancias ",
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "bg-gray-600/50 px-2 py-0.5 rounded-full text-xs ml-1", children: instances.length }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                lineNumber: 378,
                columnNumber: 28
              }, this)
            ]
          },
          void 0,
          true,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
            lineNumber: 370,
            columnNumber: 11
          },
          this
        ),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: () => setActiveTab("owned"),
            className: `px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${activeTab === "owned" ? "bg-gray-700/50 text-white border-b-2 border-blue-500" : "text-gray-400 hover:text-white hover:bg-gray-700/30"}`,
            children: [
              "Creadas ",
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "bg-gray-600/50 px-2 py-0.5 rounded-full text-xs ml-1", children: ownedInstances.length }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                lineNumber: 388,
                columnNumber: 21
              }, this)
            ]
          },
          void 0,
          true,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
            lineNumber: 380,
            columnNumber: 11
          },
          this
        ),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: () => setActiveTab("imported"),
            className: `px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${activeTab === "imported" ? "bg-gray-700/50 text-white border-b-2 border-blue-500" : "text-gray-400 hover:text-white hover:bg-gray-700/30"}`,
            children: [
              "Importadas ",
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "bg-gray-600/50 px-2 py-0.5 rounded-full text-xs ml-1", children: importedInstances.length }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                lineNumber: 398,
                columnNumber: 24
              }, this)
            ]
          },
          void 0,
          true,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
            lineNumber: 390,
            columnNumber: 11
          },
          this
        ),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: () => setActiveTab("shared"),
            className: `px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${activeTab === "shared" ? "bg-gray-700/50 text-white border-b-2 border-blue-500" : "text-gray-400 hover:text-white hover:bg-gray-700/30"}`,
            children: [
              "Compartidas ",
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "bg-gray-600/50 px-2 py-0.5 rounded-full text-xs ml-1", children: sharedInstances.length }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                lineNumber: 408,
                columnNumber: 25
              }, this)
            ]
          },
          void 0,
          true,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
            lineNumber: 400,
            columnNumber: 11
          },
          this
        )
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
        lineNumber: 369,
        columnNumber: 9
      }, this) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
        lineNumber: 368,
        columnNumber: 7
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mb-6 flex flex-col sm:flex-row gap-4", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Perfil de usuario" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
            lineNumber: 416,
            columnNumber: 11
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "select",
            {
              value: selectedProfile || "",
              onChange: (e) => setSelectedProfile(e.target.value),
              className: "w-full p-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500",
              children: profiles.map((profile) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: profile.username, children: [
                profile.username,
                " (",
                profile.type === "microsoft" ? "Premium" : "No premium",
                ")"
              ] }, profile.id, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                lineNumber: 423,
                columnNumber: 15
              }, this))
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
              lineNumber: 417,
              columnNumber: 11
            },
            this
          )
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
          lineNumber: 415,
          columnNumber: 9
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Buscar instancia" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
            lineNumber: 432,
            columnNumber: 11
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "relative", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "input",
              {
                type: "text",
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                placeholder: "Buscar por nombre...",
                className: "w-full p-3 pl-10 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              },
              void 0,
              false,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                lineNumber: 434,
                columnNumber: 13
              },
              this
            ),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "svg",
              {
                className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400",
                fill: "none",
                stroke: "currentColor",
                viewBox: "0 0 24 24",
                children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                  lineNumber: 447,
                  columnNumber: 15
                }, this)
              },
              void 0,
              false,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                lineNumber: 441,
                columnNumber: 13
              },
              this
            )
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
            lineNumber: 433,
            columnNumber: 11
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
          lineNumber: 431,
          columnNumber: 9
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
        lineNumber: 413,
        columnNumber: 7
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mb-6 flex flex-wrap gap-3 justify-end", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: () => setShowImportModal(true),
            className: "px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white rounded-xl transition-all duration-300 shadow-lg shadow-yellow-500/20 flex items-center gap-2",
            children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                lineNumber: 460,
                columnNumber: 13
              }, this) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                lineNumber: 459,
                columnNumber: 11
              }, this),
              "Importar Instancia"
            ]
          },
          void 0,
          true,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
            lineNumber: 455,
            columnNumber: 9
          },
          this
        ),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: () => setShowCreateModal(true),
            className: "px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/20 flex items-center gap-2",
            children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 6v6m0 0v6m0-6h6m-6 0H6" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                lineNumber: 469,
                columnNumber: 13
              }, this) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                lineNumber: 468,
                columnNumber: 11
              }, this),
              "Crear Instancia"
            ]
          },
          void 0,
          true,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
            lineNumber: 464,
            columnNumber: 9
          },
          this
        )
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
        lineNumber: 454,
        columnNumber: 7
      }, this),
      filteredInstances.length === 0 ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-center py-12", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mx-auto w-24 h-24 bg-gray-800/50 rounded-full flex items-center justify-center mb-4", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-12 h-12 text-gray-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
          lineNumber: 480,
          columnNumber: 15
        }, this) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
          lineNumber: 479,
          columnNumber: 13
        }, this) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
          lineNumber: 478,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-xl font-semibold text-gray-300 mb-2", children: "No hay instancias" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
          lineNumber: 483,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-gray-500", children: "Crea una nueva instancia para comenzar a jugar" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
          lineNumber: 484,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: () => setShowCreateModal(true),
            className: "mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl transition-all duration-300",
            children: "Crear Primera Instancia"
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
            lineNumber: 485,
            columnNumber: 11
          },
          this
        )
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
        lineNumber: 477,
        columnNumber: 9
      }, this) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
        motion.div,
        {
          layout: true,
          className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
          children: filteredInstances.map((instance) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            motion.div,
            {
              layout: true,
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              exit: { opacity: 0, y: -20 },
              whileHover: { y: -5 },
              className: "bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 transition-all duration-300 hover:bg-gray-800/70 hover:border-gray-600/50",
              children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-start", children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-bold text-white truncate max-w-[70%]", children: instance.name }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                      lineNumber: 509,
                      columnNumber: 19
                    }, this),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-2 mt-1", children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-xs bg-gray-700/50 text-gray-300 px-2 py-1 rounded-full", children: instance.version }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                        lineNumber: 511,
                        columnNumber: 21
                      }, this),
                      instance.loader && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded-full", children: instance.loader }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                        lineNumber: 515,
                        columnNumber: 23
                      }, this),
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: `text-xs px-2 py-1 rounded-full ${instance.type === "owned" ? "bg-green-900/50 text-green-300" : instance.type === "imported" ? "bg-yellow-900/50 text-yellow-300" : "bg-purple-900/50 text-purple-300"}`, children: instance.type === "owned" ? "Creada" : instance.type === "imported" ? "Importada" : "Compartida" }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                        lineNumber: 519,
                        columnNumber: 21
                      }, this)
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                      lineNumber: 510,
                      columnNumber: 19
                    }, this)
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                    lineNumber: 508,
                    columnNumber: 17
                  }, this),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-400", children: new Date(instance.createdAt).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                  }) }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                    lineNumber: 534,
                    columnNumber: 17
                  }, this)
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                  lineNumber: 507,
                  columnNumber: 15
                }, this),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-3 flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-sm text-gray-400", children: [
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                      "Jugado: ",
                      instance.lastPlayed ? new Date(instance.lastPlayed).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric"
                      }) : "Nunca"
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                      lineNumber: 545,
                      columnNumber: 19
                    }, this),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                      "Tiempo total: ",
                      instance.totalTimePlayed ? (() => {
                        const minutes = Math.floor(instance.totalTimePlayed / (1e3 * 60));
                        if (minutes < 60) {
                          return `${minutes} min`;
                        } else if (minutes < 1440) {
                          const hours = Math.floor(minutes / 60);
                          const mins = minutes % 60;
                          return `${hours}h ${mins}min`;
                        } else {
                          const days = Math.floor(minutes / 1440);
                          const hours = Math.floor(minutes % 1440 / 60);
                          return `${days}d ${hours}h`;
                        }
                      })() : "0 min"
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                      lineNumber: 550,
                      columnNumber: 19
                    }, this)
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                    lineNumber: 544,
                    columnNumber: 17
                  }, this),
                  !checkInstanceReady(instance) && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs bg-yellow-900/50 text-yellow-300 px-2 py-1 rounded-full", children: "Pendiente" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                    lineNumber: 568,
                    columnNumber: 19
                  }, this)
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                  lineNumber: 543,
                  columnNumber: 15
                }, this),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-4 flex flex-wrap gap-2", children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                    "button",
                    {
                      onClick: () => handlePlay(instance.id),
                      className: `flex-1 min-w-[70px] px-3 py-2 rounded-lg transition-colors text-sm ${checkInstanceReady(instance) ? "bg-green-600 hover:bg-green-500 text-white" : "bg-gray-700 hover:bg-gray-600 text-gray-400 cursor-not-allowed"}`,
                      disabled: !checkInstanceReady(instance),
                      children: checkInstanceReady(instance) ? "Jugar" : "Pendiente"
                    },
                    void 0,
                    false,
                    {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                      lineNumber: 575,
                      columnNumber: 17
                    },
                    this
                  ),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                    "button",
                    {
                      onClick: () => open(instance.id),
                      className: "flex-1 min-w-[70px] px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm",
                      children: "Carpeta"
                    },
                    void 0,
                    false,
                    {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                      lineNumber: 586,
                      columnNumber: 17
                    },
                    this
                  ),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                    "button",
                    {
                      onClick: () => startEdit(instance),
                      className: "px-3 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm",
                      title: "Editar Instancia",
                      children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                        lineNumber: 598,
                        columnNumber: 21
                      }, this) }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                        lineNumber: 597,
                        columnNumber: 19
                      }, this)
                    },
                    void 0,
                    false,
                    {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                      lineNumber: 592,
                      columnNumber: 17
                    },
                    this
                  ),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                    "button",
                    {
                      onClick: () => viewInstanceDetails(instance),
                      className: "px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm",
                      children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                        lineNumber: 606,
                        columnNumber: 21
                      }, this) }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                        lineNumber: 605,
                        columnNumber: 19
                      }, this)
                    },
                    void 0,
                    false,
                    {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                      lineNumber: 601,
                      columnNumber: 17
                    },
                    this
                  ),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                    "button",
                    {
                      onClick: () => remove(instance.id),
                      className: "px-3 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg transition-colors text-sm",
                      children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                        lineNumber: 614,
                        columnNumber: 21
                      }, this) }, void 0, false, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                        lineNumber: 613,
                        columnNumber: 19
                      }, this)
                    },
                    void 0,
                    false,
                    {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                      lineNumber: 609,
                      columnNumber: 17
                    },
                    this
                  )
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                  lineNumber: 574,
                  columnNumber: 15
                }, this)
              ]
            },
            instance.id,
            true,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
              lineNumber: 498,
              columnNumber: 13
            },
            this
          ))
        },
        void 0,
        false,
        {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
          lineNumber: 493,
          columnNumber: 9
        },
        this
      ),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-8 text-center text-gray-500 text-sm", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { children: [
        filteredInstances.length,
        " instancia",
        filteredInstances.length !== 1 ? "s" : "",
        " encontrada",
        filteredInstances.length !== 1 ? "s" : ""
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
        lineNumber: 624,
        columnNumber: 9
      }, this) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
        lineNumber: 623,
        columnNumber: 7
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
      lineNumber: 361,
      columnNumber: 5
    }, this),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
      InstanceDetailsModal,
      {
        instance: selectedInstance,
        isOpen: showInstanceDetails,
        onClose: () => setShowInstanceDetails(false),
        onPlay: handlePlay,
        onOpenFolder: open
      },
      void 0,
      false,
      {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
        lineNumber: 628,
        columnNumber: 5
      },
      this
    ),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(AnimatePresence, { children: showImportModal && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
      motion.div,
      {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        className: "fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4",
        children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          motion.div,
          {
            initial: { scale: 0.95, y: 20 },
            animate: { scale: 1, y: 0 },
            exit: { scale: 0.95, y: 20 },
            className: "bg-gray-800/90 border border-gray-700/50 rounded-xl p-6 w-full max-w-md",
            children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-xl font-bold text-white mb-4", children: "Importar Instancia" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                lineNumber: 651,
                columnNumber: 13
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mb-4", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Tipo de importación" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                  lineNumber: 654,
                  columnNumber: 15
                }, this),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex gap-4", children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                    "button",
                    {
                      type: "button",
                      onClick: () => setImportType("link"),
                      className: `flex-1 py-2 rounded-lg border ${importType === "link" ? "bg-blue-600 border-blue-500 text-white" : "bg-gray-700/50 border-gray-600 text-gray-300"}`,
                      children: "Link"
                    },
                    void 0,
                    false,
                    {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                      lineNumber: 656,
                      columnNumber: 17
                    },
                    this
                  ),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                    "button",
                    {
                      type: "button",
                      onClick: () => setImportType("folder"),
                      className: `flex-1 py-2 rounded-lg border ${importType === "folder" ? "bg-blue-600 border-blue-500 text-white" : "bg-gray-700/50 border-gray-600 text-gray-300"}`,
                      children: "Carpeta"
                    },
                    void 0,
                    false,
                    {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                      lineNumber: 667,
                      columnNumber: 17
                    },
                    this
                  )
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                  lineNumber: 655,
                  columnNumber: 15
                }, this)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                lineNumber: 653,
                columnNumber: 13
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mb-4", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: importType === "link" ? "URL de la instancia" : "Ruta de la carpeta" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                  lineNumber: 682,
                  columnNumber: 15
                }, this),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  "input",
                  {
                    type: "text",
                    value: importSource,
                    onChange: (e) => setImportSource(e.target.value),
                    placeholder: importType === "link" ? "https://ejemplo.com/instancia.zip" : "C:/ruta/a/la/carpeta",
                    className: "w-full p-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white"
                  },
                  void 0,
                  false,
                  {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                    lineNumber: 685,
                    columnNumber: 15
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                lineNumber: 681,
                columnNumber: 13
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex gap-3 justify-end", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  "button",
                  {
                    onClick: () => {
                      setShowImportModal(false);
                      setImportSource("");
                    },
                    className: "px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors",
                    children: "Cancelar"
                  },
                  void 0,
                  false,
                  {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                    lineNumber: 695,
                    columnNumber: 15
                  },
                  this
                ),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  "button",
                  {
                    onClick: async () => {
                      if (!importSource.trim()) {
                        setError("Por favor, introduce una URL o ruta válida");
                        return;
                      }
                      await importInstance(importSource);
                      setShowImportModal(false);
                      setImportSource("");
                    },
                    className: "px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors",
                    children: "Importar"
                  },
                  void 0,
                  false,
                  {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                    lineNumber: 704,
                    columnNumber: 15
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                lineNumber: 694,
                columnNumber: 13
              }, this)
            ]
          },
          void 0,
          true,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
            lineNumber: 645,
            columnNumber: 11
          },
          this
        )
      },
      void 0,
      false,
      {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
        lineNumber: 639,
        columnNumber: 9
      },
      this
    ) }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
      lineNumber: 637,
      columnNumber: 5
    }, this),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
      CreateInstanceModal,
      {
        isOpen: showCreateModal,
        onClose: () => setShowCreateModal(false),
        onCreated: () => {
          autoDetectInstances();
        }
      },
      void 0,
      false,
      {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
        lineNumber: 726,
        columnNumber: 5
      },
      this
    ),
    editingFull && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
      InstanceEditModal,
      {
        instance: editingFull,
        isOpen: !!editingFull,
        onClose: closeEdit,
        onSave: handleSaveEdit,
        onDelete: remove
      },
      void 0,
      false,
      {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
        lineNumber: 737,
        columnNumber: 7
      },
      this
    )
  ] }, void 0, true, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
    lineNumber: 360,
    columnNumber: 5
  }, this);
}
const InstanceDetailsModal = ({ instance, isOpen, onClose, onPlay, onOpenFolder }) => {
  if (!isOpen || !instance) return null;
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  const formatTime = (milliseconds) => {
    if (!milliseconds) return "0 min";
    const minutes = Math.floor(milliseconds / (1e3 * 60));
    if (minutes < 60) {
      return `${minutes} min`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}min`;
    } else {
      const days = Math.floor(minutes / 1440);
      const hours = Math.floor(minutes % 1440 / 60);
      return `${days}d ${hours}h`;
    }
  };
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(AnimatePresence, { children: isOpen && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    motion.div,
    {
      initial: { opacity: 0, scale: 0.95, y: 20 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.95, y: 20 },
      transition: { type: "spring", damping: 25, stiffness: 300 },
      className: "w-full max-w-2xl",
      children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/95 border border-gray-700/50 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-6", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-start", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h2", { className: "text-2xl font-bold text-white mb-1", children: instance.name }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
              lineNumber: 800,
              columnNumber: 21
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-2 mt-2", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-sm bg-gray-700/50 text-gray-300 px-3 py-1 rounded-full", children: instance.version }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                lineNumber: 802,
                columnNumber: 23
              }, void 0),
              instance.loader && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-sm bg-blue-900/50 text-blue-300 px-3 py-1 rounded-full", children: instance.loader }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                lineNumber: 806,
                columnNumber: 25
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-sm bg-green-900/50 text-green-300 px-3 py-1 rounded-full", children: "Instancia" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                lineNumber: 810,
                columnNumber: 23
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
              lineNumber: 801,
              columnNumber: 21
            }, void 0)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
            lineNumber: 799,
            columnNumber: 19
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              onClick: onClose,
              className: "p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-colors",
              children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M6 18L18 6M6 6l12 12" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                lineNumber: 820,
                columnNumber: 23
              }, void 0) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                lineNumber: 819,
                columnNumber: 21
              }, void 0)
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
              lineNumber: 815,
              columnNumber: 19
            },
            void 0
          )
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
          lineNumber: 798,
          columnNumber: 17
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-6 grid grid-cols-1 md:grid-cols-2 gap-6", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-700/30 p-4 rounded-xl", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-semibold text-white mb-3", children: "Información General" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
              lineNumber: 827,
              columnNumber: 21
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-gray-400", children: "ID:" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                  lineNumber: 830,
                  columnNumber: 25
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-white font-mono text-sm", children: [
                  instance.id.substring(0, 8),
                  "..."
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                  lineNumber: 831,
                  columnNumber: 25
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                lineNumber: 829,
                columnNumber: 23
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-gray-400", children: "Versión:" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                  lineNumber: 834,
                  columnNumber: 25
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-white", children: instance.version }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                  lineNumber: 835,
                  columnNumber: 25
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                lineNumber: 833,
                columnNumber: 23
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-gray-400", children: "Loader:" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                  lineNumber: 838,
                  columnNumber: 25
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-white", children: instance.loader || "Vanilla" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                  lineNumber: 839,
                  columnNumber: 25
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                lineNumber: 837,
                columnNumber: 23
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-gray-400", children: "Creada:" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                  lineNumber: 842,
                  columnNumber: 25
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-white", children: formatDate(instance.createdAt) }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                  lineNumber: 843,
                  columnNumber: 25
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                lineNumber: 841,
                columnNumber: 23
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
              lineNumber: 828,
              columnNumber: 21
            }, void 0)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
            lineNumber: 826,
            columnNumber: 19
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-700/30 p-4 rounded-xl", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-semibold text-white mb-3", children: "Estadísticas de Juego" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
              lineNumber: 849,
              columnNumber: 21
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-gray-400", children: "Última sesión:" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                  lineNumber: 852,
                  columnNumber: 25
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-white", children: instance.lastPlayed ? formatDate(instance.lastPlayed) : "Nunca" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                  lineNumber: 853,
                  columnNumber: 25
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                lineNumber: 851,
                columnNumber: 23
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-gray-400", children: "Tiempo total:" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                  lineNumber: 858,
                  columnNumber: 25
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-white", children: formatTime(instance.totalTimePlayed) }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                  lineNumber: 859,
                  columnNumber: 25
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                lineNumber: 857,
                columnNumber: 23
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
              lineNumber: 850,
              columnNumber: 21
            }, void 0)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
            lineNumber: 848,
            columnNumber: 19
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
          lineNumber: 825,
          columnNumber: 17
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-6 bg-gray-700/30 p-4 rounded-xl", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-semibold text-white mb-3", children: "Ubicación" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
            lineNumber: 866,
            columnNumber: 19
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-gray-300 text-sm font-mono break-all", children: instance.path }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
              lineNumber: 868,
              columnNumber: 21
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "button",
              {
                onClick: () => onOpenFolder(instance.id),
                className: "ml-4 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors text-sm",
                children: "Abrir carpeta"
              },
              void 0,
              false,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                lineNumber: 871,
                columnNumber: 21
              },
              void 0
            )
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
            lineNumber: 867,
            columnNumber: 19
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
          lineNumber: 865,
          columnNumber: 17
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-6 flex justify-end space-x-3", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: () => onPlay(instance.id),
            className: "px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg transition-all flex items-center gap-2",
            children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                  lineNumber: 886,
                  columnNumber: 23
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                  lineNumber: 887,
                  columnNumber: 23
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
                lineNumber: 885,
                columnNumber: 21
              }, void 0),
              "Jugar"
            ]
          },
          void 0,
          true,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
            lineNumber: 881,
            columnNumber: 19
          },
          void 0
        ) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
          lineNumber: 880,
          columnNumber: 17
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
        lineNumber: 797,
        columnNumber: 15
      }, void 0) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
        lineNumber: 796,
        columnNumber: 13
      }, void 0)
    },
    void 0,
    false,
    {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
      lineNumber: 789,
      columnNumber: 11
    },
    void 0
  ) }, void 0, false, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
    lineNumber: 788,
    columnNumber: 9
  }, void 0) }, void 0, false, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Instances.tsx",
    lineNumber: 786,
    columnNumber: 5
  }, void 0);
};
export {
  Instances as default
};
