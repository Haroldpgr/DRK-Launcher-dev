import { r as reactExports, n as notificationService, j as jsxDevRuntimeExports, R as React } from "./index-fZOSeWy0.js";
import { C as Card } from "./Card-CVE030mL.js";
import { B as Button } from "./Button-D1NocfUR.js";
class ModpackImportService {
  /**
   * Analiza un modpack desde archivo o URL
   */
  async analyzeModpack(source) {
    var _a, _b;
    if (source.startsWith("http")) {
      if (!((_a = window.api) == null ? void 0 : _a.modpackImport)) {
        throw new Error("API de importación de modpacks no disponible");
      }
      return await window.api.modpackImport.analyzeUrl(source);
    } else {
      if (!((_b = window.api) == null ? void 0 : _b.modpackImport)) {
        throw new Error("API de importación de modpacks no disponible");
      }
      return await window.api.modpackImport.analyzeFile(source);
    }
  }
  /**
   * Verifica la compatibilidad del modpack con instancias existentes
   */
  checkCompatibility(modpackMetadata, instances) {
    const compatibleInstances = instances.filter(
      (instance) => instance.version === modpackMetadata.mcVersion && instance.loader === modpackMetadata.loader
    );
    const incompatibleInstances = instances.filter(
      (instance) => instance.version !== modpackMetadata.mcVersion || instance.loader !== modpackMetadata.loader
    );
    const isCompatible = compatibleInstances.length > 0;
    return {
      compatible: isCompatible,
      message: isCompatible ? "Compatible con algunas instancias existentes" : "No compatible con ninguna instancia existente",
      compatibleInstances,
      incompatibleInstances
    };
  }
  /**
   * Importa un modpack a una instancia específica
   */
  async importModpack(source, targetInstanceId, onProgress) {
    var _a, _b;
    try {
      if (!((_a = window.api) == null ? void 0 : _a.modpackImport)) {
        throw new Error("API de importación de modpacks no disponible");
      }
      if (!((_b = window.api) == null ? void 0 : _b.instances)) {
        throw new Error("API de instancias no disponible");
      }
      const instance = await window.api.instances.list().then((instances) => instances.find((inst) => inst.id === targetInstanceId));
      if (!instance) {
        throw new Error("Instancia de destino no encontrada");
      }
      if (source.startsWith("http")) {
        await window.api.modpackImport.downloadAndExtractFromUrl(source, instance.path, onProgress);
      } else {
        await window.api.modpackImport.extractAndInstall(source, instance.path);
      }
    } catch (error) {
      console.error("Error al importar modpack:", error);
      throw error;
    }
  }
  /**
   * Genera una URL temporal para compartir un modpack o carpeta
   */
  async generateTemporaryUrl(filePath) {
    var _a;
    if (!((_a = window.api) == null ? void 0 : _a.modpack)) {
      throw new Error("API de modpacks no disponible");
    }
    return await window.api.modpack.createTemporary(filePath);
  }
  /**
   * Valida si una URL de modpack es válida y accesible
   */
  async validateModpackUrl(url) {
    try {
      const response = await fetch(url, { method: "HEAD" });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}
const modpackImportService = new ModpackImportService();
function ModpackImporter() {
  const [source, setSource] = reactExports.useState("");
  const [method, setMethod] = reactExports.useState("file");
  const [instances, setInstances] = reactExports.useState([]);
  const [selectedInstance, setSelectedInstance] = reactExports.useState(null);
  const [modpackMetadata, setModpackMetadata] = reactExports.useState(null);
  const [compatibility, setCompatibility] = reactExports.useState(null);
  const [isImporting, setIsImporting] = reactExports.useState(false);
  const [isGeneratingUrl, setIsGeneratingUrl] = reactExports.useState(false);
  const [generatedUrl, setGeneratedUrl] = reactExports.useState("");
  const [currentStep, setCurrentStep] = reactExports.useState("import");
  const [dragActive, setDragActive] = reactExports.useState(false);
  const [importProgress, setImportProgress] = reactExports.useState(0);
  const [exportType, setExportType] = reactExports.useState("mods");
  const [exportPath, setExportPath] = reactExports.useState("");
  reactExports.useEffect(() => {
    loadInstances();
  }, []);
  const loadInstances = async () => {
    var _a;
    try {
      if ((_a = window.api) == null ? void 0 : _a.instances) {
        const instanceList = await window.api.instances.list();
        setInstances(instanceList);
      }
    } catch (error) {
      console.error("Error al cargar instancias:", error);
      notificationService.error("Error al cargar instancias");
    }
  };
  const analyzeModpack = async (sourcePath) => {
    try {
      const metadata = await modpackImportService.analyzeModpack(sourcePath);
      setModpackMetadata(metadata);
      setCurrentStep("select");
    } catch (error) {
      console.error("Error al analizar modpack:", error);
      notificationService.error("Error al analizar el modpack. Verifica que sea un archivo válido.");
    }
  };
  const checkCompatibility = () => {
    if (!modpackMetadata) return;
    const result = modpackImportService.checkCompatibility(modpackMetadata, instances);
    setCompatibility(result);
    setCurrentStep("compatibility");
  };
  const importPack = async () => {
    var _a;
    if (!selectedInstance || !modpackMetadata) {
      notificationService.error("Por favor selecciona una instancia");
      return;
    }
    setIsImporting(true);
    setCurrentStep("importing");
    setImportProgress(0);
    try {
      await modpackImportService.importModpack(
        source,
        selectedInstance,
        (progress) => setImportProgress(progress)
      );
      notificationService.success(`Modpack importado exitosamente a ${(_a = instances.find((i) => i.id === selectedInstance)) == null ? void 0 : _a.name}`);
      setCurrentStep("import");
      setSource("");
      setModpackMetadata(null);
      setSelectedInstance(null);
      setCompatibility(null);
    } catch (error) {
      console.error("Error al importar modpack:", error);
      notificationService.error(`Error al importar modpack: ${error instanceof Error ? error.message : "Error desconocido"}`);
    } finally {
      setIsImporting(false);
    }
  };
  const generateTemporaryUrl = async () => {
    const pathToUse = exportPath || source;
    if (!pathToUse) {
      notificationService.error("Por favor selecciona una carpeta o archivo para exportar");
      return;
    }
    setIsGeneratingUrl(true);
    try {
      const tempUrl = await modpackImportService.generateTemporaryUrl(pathToUse);
      setGeneratedUrl(tempUrl);
      notificationService.success("URL generada exitosamente");
    } catch (error) {
      console.error("Error al generar URL:", error);
      notificationService.error(`Error al generar URL: ${error instanceof Error ? error.message : "Error desconocido"}`);
    } finally {
      setIsGeneratingUrl(false);
    }
  };
  const handleFileSelect = async (e) => {
    var _a;
    const file = (_a = e.target.files) == null ? void 0 : _a[0];
    if (file) {
      const filePath = file.path || URL.createObjectURL(file);
      setSource(filePath);
      await analyzeModpack(filePath);
    }
  };
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const filePath = file.path || URL.createObjectURL(file);
      setSource(filePath);
      analyzeModpack(filePath);
    }
  };
  const browseExportPath = async () => {
    var _a, _b;
    if ((_b = (_a = window.api) == null ? void 0 : _a.dialog) == null ? void 0 : _b.showOpenDialog) {
      const result = await window.api.dialog.showOpenDialog({
        properties: exportType === "mod" || exportType === "resourcepack" || exportType === "shaderpack" || exportType === "datapack" ? ["openFile"] : ["openDirectory"],
        filters: exportType === "mod" ? [{ name: "Mods", extensions: ["jar", "zip"] }] : void 0
      });
      if (!result.canceled && result.filePaths.length > 0) {
        setExportPath(result.filePaths[0]);
      }
    }
  };
  const goBack = () => {
    if (currentStep === "select") {
      setCurrentStep("import");
    } else if (currentStep === "compatibility") {
      setCurrentStep("select");
    } else if (currentStep === "importing") {
      setCurrentStep("compatibility");
    }
  };
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Card, { className: "max-w-4xl mx-auto", children: [
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-2xl font-bold text-white mb-6", children: "Importar o Exportar Modpack" }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
      lineNumber: 205,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-center", children: ["import", "select", "compatibility", "importing"].map((step, index) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(React.Fragment, { children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "div",
          {
            className: `w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === step ? "bg-blue-600 text-white" : index < ["import", "select", "compatibility", "importing"].indexOf(currentStep) ? "bg-green-600 text-white" : "bg-gray-700 text-gray-300"}`,
            children: index + 1
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
            lineNumber: 212,
            columnNumber: 15
          },
          this
        ),
        index < 3 && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: `h-0.5 w-16 ${index < ["import", "select", "compatibility", "importing"].indexOf(currentStep) ? "bg-green-600" : "bg-gray-600"}` }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
          lineNumber: 224,
          columnNumber: 17
        }, this)
      ] }, step, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
        lineNumber: 211,
        columnNumber: 13
      }, this)) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
        lineNumber: 209,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between text-xs text-gray-400 mt-2", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: "Importar" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
          lineNumber: 230,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: "Seleccionar" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
          lineNumber: 231,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: "Compatibilidad" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
          lineNumber: 232,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: "Importando" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
          lineNumber: 233,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
        lineNumber: 229,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
      lineNumber: 208,
      columnNumber: 7
    }, this),
    currentStep === "import" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: () => setMethod("file"),
            className: `p-6 rounded-xl border-2 transition-all duration-300 ${method === "file" ? "border-blue-500 bg-blue-500/10 text-white" : "border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600"}`,
            children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex flex-col items-center", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-8 h-8 mb-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
                lineNumber: 251,
                columnNumber: 19
              }, this) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
                lineNumber: 250,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "font-medium", children: "Desde archivo" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
                lineNumber: 253,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-xs text-gray-400 mt-1", children: "ZIP, MRPACK" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
                lineNumber: 254,
                columnNumber: 17
              }, this)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
              lineNumber: 249,
              columnNumber: 15
            }, this)
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
            lineNumber: 241,
            columnNumber: 13
          },
          this
        ),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: () => setMethod("url"),
            className: `p-6 rounded-xl border-2 transition-all duration-300 ${method === "url" ? "border-blue-500 bg-blue-500/10 text-white" : "border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600"}`,
            children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex flex-col items-center", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-8 h-8 mb-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
                lineNumber: 268,
                columnNumber: 19
              }, this) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
                lineNumber: 267,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "font-medium", children: "Desde URL" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
                lineNumber: 270,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-xs text-gray-400 mt-1", children: "Compartido" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
                lineNumber: 271,
                columnNumber: 17
              }, this)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
              lineNumber: 266,
              columnNumber: 15
            }, this)
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
            lineNumber: 258,
            columnNumber: 13
          },
          this
        )
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
        lineNumber: 240,
        columnNumber: 11
      }, this),
      method === "file" ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
        "div",
        {
          className: `border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragActive ? "border-blue-500 bg-blue-500/10" : "border-gray-700 bg-gray-800/30"}`,
          onDragEnter: handleDrag,
          onDragLeave: handleDrag,
          onDragOver: handleDrag,
          onDrop: handleDrop,
          children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "input",
              {
                type: "file",
                id: "file-upload",
                className: "hidden",
                accept: ".zip,.mrpack",
                onChange: handleFileSelect
              },
              void 0,
              false,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
                lineNumber: 286,
                columnNumber: 15
              },
              this
            ),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { htmlFor: "file-upload", className: "cursor-pointer", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-12 h-12 mx-auto mb-4 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
                lineNumber: 295,
                columnNumber: 19
              }, this) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
                lineNumber: 294,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-lg font-medium text-white", children: "Arrastra un modpack aquí" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
                lineNumber: 297,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-gray-400 mt-2", children: "o haz clic para seleccionar un archivo" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
                lineNumber: 298,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-sm text-gray-500 mt-2", children: "ZIP, MRPACK (MAX. 500MB)" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
                lineNumber: 299,
                columnNumber: 17
              }, this)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
              lineNumber: 293,
              columnNumber: 15
            }, this)
          ]
        },
        void 0,
        true,
        {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
          lineNumber: 277,
          columnNumber: 13
        },
        this
      ) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "URL del modpack" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
          lineNumber: 304,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "input",
            {
              value: source,
              onChange: (e) => setSource(e.target.value),
              placeholder: "https://ejemplo.com/modpack.mrpack",
              className: "flex-1 p-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
              lineNumber: 306,
              columnNumber: 17
            },
            this
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            Button,
            {
              onClick: async () => {
                if (source) {
                  await analyzeModpack(source);
                }
              },
              disabled: !source,
              children: "Importar"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
              lineNumber: 312,
              columnNumber: 17
            },
            this
          )
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
          lineNumber: 305,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
        lineNumber: 303,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-8 p-6 bg-gray-800/30 rounded-xl border border-gray-700", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-semibold text-white mb-4", children: "Exportar contenido" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
          lineNumber: 328,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-gray-400 mb-4", children: "Selecciona mods, carpetas o archivos para compartir con otros" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
          lineNumber: 329,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Tipo de contenido a exportar" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
              lineNumber: 333,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "select",
              {
                value: exportType,
                onChange: (e) => setExportType(e.target.value),
                className: "w-full p-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500",
                children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "mod", children: "Mods individuales" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
                    lineNumber: 339,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "mods", children: "Carpeta completa de mods" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
                    lineNumber: 340,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "resourcepack", children: "Resourcepacks" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
                    lineNumber: 341,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "shaderpack", children: "Shaderpacks" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
                    lineNumber: 342,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "datapack", children: "Datapacks" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
                    lineNumber: 343,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "instance", children: "Instancia completa" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
                    lineNumber: 344,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "custom", children: "Carpeta personalizada" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
                    lineNumber: 345,
                    columnNumber: 19
                  }, this)
                ]
              },
              void 0,
              true,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
                lineNumber: 334,
                columnNumber: 17
              },
              this
            )
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
            lineNumber: 332,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex flex-col sm:flex-row gap-3", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "input",
              {
                type: "text",
                value: exportPath,
                onChange: (e) => setExportPath(e.target.value),
                placeholder: "Ruta de la carpeta o archivo a exportar",
                className: "flex-1 p-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              },
              void 0,
              false,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
                lineNumber: 350,
                columnNumber: 17
              },
              this
            ),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              Button,
              {
                onClick: browseExportPath,
                variant: "secondary",
                children: "Explorar"
              },
              void 0,
              false,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
                lineNumber: 357,
                columnNumber: 17
              },
              this
            )
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
            lineNumber: 349,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex flex-col sm:flex-row gap-3", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            Button,
            {
              onClick: generateTemporaryUrl,
              disabled: isGeneratingUrl || !exportPath,
              variant: "secondary",
              className: "w-full sm:w-auto",
              children: isGeneratingUrl ? "Generando..." : `Generar URL temporal (${exportPath ? "500MB+" : "0MB"})`
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
              lineNumber: 366,
              columnNumber: 17
            },
            this
          ) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
            lineNumber: 365,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
          lineNumber: 331,
          columnNumber: 13
        }, this),
        generatedUrl && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-4 p-3 bg-gray-700/50 rounded-lg", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-sm font-mono text-gray-300 truncate", children: generatedUrl }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
              lineNumber: 380,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "button",
              {
                onClick: () => navigator.clipboard.writeText(generatedUrl),
                className: "ml-2 px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm",
                children: "Copiar"
              },
              void 0,
              false,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
                lineNumber: 381,
                columnNumber: 19
              },
              this
            )
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
            lineNumber: 379,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-xs text-gray-500 mt-2", children: "Esta URL expirará en 24 horas • Soporta archivos de hasta 5GB" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
            lineNumber: 388,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
          lineNumber: 378,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
        lineNumber: 327,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
      lineNumber: 239,
      columnNumber: 9
    }, this),
    currentStep === "select" && modpackMetadata && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/50 rounded-xl p-4 border border-gray-700", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-start gap-4", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-700 rounded-lg w-16 h-16 flex items-center justify-center", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-8 h-8 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
          lineNumber: 404,
          columnNumber: 19
        }, this) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
          lineNumber: 403,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
          lineNumber: 402,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-xl font-bold text-white", children: modpackMetadata.name }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
            lineNumber: 408,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-gray-400 text-sm", children: modpackMetadata.description }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
            lineNumber: 409,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex flex-wrap gap-2 mt-2", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs", children: [
              "v",
              modpackMetadata.version
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
              lineNumber: 411,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "px-2 py-1 bg-blue-900/50 text-blue-300 rounded-full text-xs", children: modpackMetadata.loader }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
              lineNumber: 412,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "px-2 py-1 bg-green-900/50 text-green-300 rounded-full text-xs", children: [
              "MC ",
              modpackMetadata.mcVersion
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
              lineNumber: 413,
              columnNumber: 19
            }, this),
            modpackMetadata.modCount !== void 0 && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "px-2 py-1 bg-purple-900/50 text-purple-300 rounded-full text-xs", children: [
              modpackMetadata.modCount,
              " mods"
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
              lineNumber: 415,
              columnNumber: 21
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
            lineNumber: 410,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
          lineNumber: 407,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
        lineNumber: 401,
        columnNumber: 13
      }, this) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
        lineNumber: 400,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-semibold text-white mb-3", children: "Seleccionar instancia de destino" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
          lineNumber: 423,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid gap-3", children: instances.map((instance) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "div",
          {
            onClick: () => setSelectedInstance(instance.id),
            className: `p-4 rounded-xl border cursor-pointer transition-all ${selectedInstance === instance.id ? "border-blue-500 bg-blue-500/10" : "border-gray-700 bg-gray-800/50 hover:bg-gray-800/70"}`,
            children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-center", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "font-medium text-white", children: instance.name }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
                  lineNumber: 437,
                  columnNumber: 23
                }, this),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-sm text-gray-400", children: [
                  instance.version,
                  " ",
                  instance.loader && `• ${instance.loader}`
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
                  lineNumber: 438,
                  columnNumber: 23
                }, this)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
                lineNumber: 436,
                columnNumber: 21
              }, this),
              selectedInstance === instance.id && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-6 h-6 text-blue-500", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M5 13l4 4L19 7" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
                lineNumber: 444,
                columnNumber: 25
              }, this) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
                lineNumber: 443,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
              lineNumber: 435,
              columnNumber: 19
            }, this)
          },
          instance.id,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
            lineNumber: 426,
            columnNumber: 17
          },
          this
        )) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
          lineNumber: 424,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
        lineNumber: 422,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Button, { variant: "secondary", onClick: goBack, children: "Volver" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
          lineNumber: 454,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          Button,
          {
            onClick: checkCompatibility,
            disabled: !selectedInstance,
            children: "Verificar compatibilidad"
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
            lineNumber: 455,
            columnNumber: 13
          },
          this
        )
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
        lineNumber: 453,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
      lineNumber: 399,
      columnNumber: 9
    }, this),
    currentStep === "compatibility" && compatibility && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-center mb-6", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: `inline-flex items-center justify-center w-16 h-16 rounded-full ${compatibility.compatible ? "bg-green-900/20" : "bg-red-900/20"}`, children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "svg",
          {
            className: `w-8 h-8 ${compatibility.compatible ? "text-green-500" : "text-red-500"}`,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
            children: compatibility.compatible ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
              lineNumber: 479,
              columnNumber: 19
            }, this) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
              lineNumber: 481,
              columnNumber: 19
            }, this)
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
            lineNumber: 472,
            columnNumber: 15
          },
          this
        ) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
          lineNumber: 469,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-xl font-bold text-white mt-4", children: compatibility.compatible ? "¡Compatible!" : "Incompatible" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
          lineNumber: 485,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: `text-lg ${compatibility.compatible ? "text-green-400" : "text-red-400"}`, children: compatibility.message }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
          lineNumber: 488,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
        lineNumber: 468,
        columnNumber: 11
      }, this),
      compatibility.compatibleInstances.length > 0 && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-semibold text-white mb-3", children: "Instancias compatibles" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
          lineNumber: 495,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-3", children: compatibility.compatibleInstances.map((instance) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "div",
          {
            className: "p-4 rounded-xl border border-gray-700 bg-gray-800/50",
            children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "font-medium text-white", children: instance.name }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
                lineNumber: 502,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-sm text-gray-400", children: [
                instance.version,
                " • ",
                instance.loader
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
                lineNumber: 503,
                columnNumber: 21
              }, this)
            ]
          },
          instance.id,
          true,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
            lineNumber: 498,
            columnNumber: 19
          },
          this
        )) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
          lineNumber: 496,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
        lineNumber: 494,
        columnNumber: 13
      }, this),
      compatibility.incompatibleInstances.length > 0 && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-semibold text-white mb-3", children: "Instancias incompatibles" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
          lineNumber: 514,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-3", children: compatibility.incompatibleInstances.map((instance) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "div",
          {
            className: "p-4 rounded-xl border border-gray-700 bg-gray-800/30",
            children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "font-medium text-white", children: instance.name }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
                lineNumber: 521,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-sm text-gray-400", children: [
                instance.version,
                " • ",
                instance.loader,
                " • Incompatible"
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
                lineNumber: 522,
                columnNumber: 21
              }, this)
            ]
          },
          instance.id,
          true,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
            lineNumber: 517,
            columnNumber: 19
          },
          this
        )) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
          lineNumber: 515,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
        lineNumber: 513,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Button, { variant: "secondary", onClick: goBack, children: "Volver" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
          lineNumber: 532,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Button, { onClick: importPack, children: "Importar a la instancia seleccionada" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
          lineNumber: 533,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
        lineNumber: 531,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
      lineNumber: 467,
      columnNumber: 9
    }, this),
    currentStep === "importing" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-center py-8", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4" }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
        lineNumber: 543,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-xl font-bold text-white", children: "Importando modpack..." }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
        lineNumber: 544,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-gray-400 mt-2", children: "Esto puede tardar varios minutos dependiendo del tamaño del modpack" }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
        lineNumber: 545,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-6 w-full bg-gray-700 rounded-full h-2.5", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
        "div",
        {
          className: "bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out",
          style: { width: `${importProgress}%` }
        },
        void 0,
        false,
        {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
          lineNumber: 547,
          columnNumber: 13
        },
        this
      ) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
        lineNumber: 546,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-sm text-gray-400 mt-2", children: [
        importProgress,
        "% completado"
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
        lineNumber: 552,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
      lineNumber: 542,
      columnNumber: 9
    }, this)
  ] }, void 0, true, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/ModpackImporter.tsx",
    lineNumber: 204,
    columnNumber: 5
  }, this);
}
export {
  ModpackImporter as default
};
