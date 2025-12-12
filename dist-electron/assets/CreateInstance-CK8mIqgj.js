import { r as reactExports, j as jsxDevRuntimeExports } from "./index-BU0XOqXY.js";
import { C as Card } from "./Card-BhM1WpYw.js";
import { C as CreateInstanceModal } from "./CreateInstanceModal-DO5AtMn1.js";
import "./integratedDownloadService-C3tlNEKn.js";
import "./instanceProfileService-6wYWkvox.js";
import "./proxy-DdTLO9BF.js";
function CreateInstance() {
  const [showCreateModal, setShowCreateModal] = reactExports.useState(true);
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Card, { className: "p-6", children: [
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xl font-bold text-white mb-4", children: "Crear Nueva Instancia" }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CreateInstance.tsx",
      lineNumber: 12,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-gray-400 mb-6", children: "Usa el formulario a continuación para crear una nueva instancia de Minecraft" }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CreateInstance.tsx",
      lineNumber: 13,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-center items-center h-[300px]", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mx-auto w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mb-4", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-8 h-8 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 6v6m0 0v6m0-6h6m-6 0H6" }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CreateInstance.tsx",
        lineNumber: 19,
        columnNumber: 15
      }, this) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CreateInstance.tsx",
        lineNumber: 18,
        columnNumber: 13
      }, this) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CreateInstance.tsx",
        lineNumber: 17,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-gray-500", children: "Abriendo formulario de creación..." }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CreateInstance.tsx",
        lineNumber: 22,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CreateInstance.tsx",
      lineNumber: 16,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CreateInstance.tsx",
      lineNumber: 15,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
      CreateInstanceModal,
      {
        isOpen: showCreateModal,
        onClose: () => {
          window.location.hash = "#/instances";
        }
      },
      void 0,
      false,
      {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CreateInstance.tsx",
        lineNumber: 26,
        columnNumber: 7
      },
      this
    )
  ] }, void 0, true, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CreateInstance.tsx",
    lineNumber: 11,
    columnNumber: 5
  }, this);
}
export {
  CreateInstance as default
};
