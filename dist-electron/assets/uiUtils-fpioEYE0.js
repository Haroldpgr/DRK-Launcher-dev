import { r as reactExports, j as jsxDevRuntimeExports, c as client, R as React } from "./index-C3fgt0AJ.js";
const ModernAlert = ({
  title,
  message,
  type = "info",
  onConfirm,
  onCancel,
  confirmText = "Aceptar",
  cancelText = "Cancelar"
}) => {
  reactExports.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);
  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return {
          bg: "bg-gradient-to-br from-green-900/90 via-emerald-900/80 to-green-800/90",
          border: "border-green-500/50",
          iconBg: "bg-green-500/20",
          iconColor: "text-green-400"
        };
      case "warning":
        return {
          bg: "bg-gradient-to-br from-yellow-900/90 via-amber-900/80 to-yellow-800/90",
          border: "border-yellow-500/50",
          iconBg: "bg-yellow-500/20",
          iconColor: "text-yellow-400"
        };
      case "error":
        return {
          bg: "bg-gradient-to-br from-red-900/90 via-rose-900/80 to-red-800/90",
          border: "border-red-500/50",
          iconBg: "bg-red-500/20",
          iconColor: "text-red-400"
        };
      case "info":
      default:
        return {
          bg: "bg-gradient-to-br from-blue-900/90 via-indigo-900/80 to-blue-800/90",
          border: "border-blue-500/50",
          iconBg: "bg-blue-500/20",
          iconColor: "text-blue-400"
        };
    }
  };
  const getTypeIcon = () => {
    const styles2 = getTypeStyles();
    switch (type) {
      case "success":
        return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: `${styles2.iconBg} rounded-full p-3`, children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: `w-8 h-8 ${styles2.iconColor}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2.5", d: "M5 13l4 4L19 7" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ModernAlert.tsx",
          lineNumber: 71,
          columnNumber: 15
        }, void 0) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ModernAlert.tsx",
          lineNumber: 70,
          columnNumber: 13
        }, void 0) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ModernAlert.tsx",
          lineNumber: 69,
          columnNumber: 11
        }, void 0);
      case "warning":
        return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: `${styles2.iconBg} rounded-full p-3`, children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: `w-8 h-8 ${styles2.iconColor}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2.5", d: "M12 9v2m0 4h.01m-6.938 4h13.816c1.546 0 2.078-.669 1.752-1.79L14.397 7.45c-.326-1.121-.858-1.79-1.752-1.79H8.603c-.894 0-1.426.669-1.752 1.79L5.397 15.65c-.326 1.121.206 1.79 1.752 1.79z" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ModernAlert.tsx",
          lineNumber: 79,
          columnNumber: 15
        }, void 0) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ModernAlert.tsx",
          lineNumber: 78,
          columnNumber: 13
        }, void 0) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ModernAlert.tsx",
          lineNumber: 77,
          columnNumber: 11
        }, void 0);
      case "error":
        return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: `${styles2.iconBg} rounded-full p-3`, children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: `w-8 h-8 ${styles2.iconColor}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2.5", d: "M6 18L18 6M6 6l12 12" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ModernAlert.tsx",
          lineNumber: 87,
          columnNumber: 15
        }, void 0) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ModernAlert.tsx",
          lineNumber: 86,
          columnNumber: 13
        }, void 0) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ModernAlert.tsx",
          lineNumber: 85,
          columnNumber: 11
        }, void 0);
      case "info":
      default:
        return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: `${styles2.iconBg} rounded-full p-3`, children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: `w-8 h-8 ${styles2.iconColor}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2.5", d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ModernAlert.tsx",
          lineNumber: 96,
          columnNumber: 15
        }, void 0) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ModernAlert.tsx",
          lineNumber: 95,
          columnNumber: 13
        }, void 0) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ModernAlert.tsx",
          lineNumber: 94,
          columnNumber: 11
        }, void 0);
    }
  };
  const getButtonStyles = () => {
    switch (type) {
      case "success":
        return "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/30";
      case "warning":
        return "bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white shadow-lg shadow-yellow-500/30";
      case "error":
        return "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-500/30";
      case "info":
      default:
        return "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/30";
    }
  };
  const styles = getTypeStyles();
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "div",
    {
      className: "fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fadeIn",
      onClick: (e) => {
        if (e.target === e.currentTarget && onCancel) {
          onCancel();
        }
      },
      children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "div",
          {
            className: `border-2 ${styles.border} ${styles.bg} rounded-2xl shadow-2xl w-full max-w-md overflow-hidden backdrop-blur-xl animate-scaleIn`,
            style: {
              animation: "scaleIn 0.3s ease-out"
            },
            children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-6", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-start gap-4", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-shrink-0 animate-bounceIn", children: getTypeIcon() }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ModernAlert.tsx",
                  lineNumber: 136,
                  columnNumber: 13
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-xl font-bold text-white mb-2", children: title }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ModernAlert.tsx",
                    lineNumber: 140,
                    columnNumber: 15
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-gray-200 leading-relaxed whitespace-pre-line", children: message }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ModernAlert.tsx",
                    lineNumber: 141,
                    columnNumber: 15
                  }, void 0)
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ModernAlert.tsx",
                  lineNumber: 139,
                  columnNumber: 13
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ModernAlert.tsx",
                lineNumber: 135,
                columnNumber: 11
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-6 flex justify-end gap-3", children: [
                onCancel && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  "button",
                  {
                    onClick: onCancel,
                    className: "px-5 py-2.5 rounded-xl bg-gray-700/80 hover:bg-gray-600/80 text-gray-200 font-medium transition-all duration-200 border border-gray-600/50 hover:border-gray-500/50",
                    children: cancelText
                  },
                  void 0,
                  false,
                  {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ModernAlert.tsx",
                    lineNumber: 146,
                    columnNumber: 15
                  },
                  void 0
                ),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  "button",
                  {
                    onClick: onConfirm,
                    className: `px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${getButtonStyles()}`,
                    children: confirmText
                  },
                  void 0,
                  false,
                  {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ModernAlert.tsx",
                    lineNumber: 153,
                    columnNumber: 13
                  },
                  void 0
                )
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ModernAlert.tsx",
                lineNumber: 144,
                columnNumber: 11
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ModernAlert.tsx",
              lineNumber: 134,
              columnNumber: 9
            }, void 0)
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ModernAlert.tsx",
            lineNumber: 128,
            columnNumber: 7
          },
          void 0
        ),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("style", { children: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.9) translateY(-10px);
          }
          to { 
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .animate-bounceIn {
          animation: bounceIn 0.6s ease-out;
        }
      ` }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ModernAlert.tsx",
          lineNumber: 162,
          columnNumber: 7
        }, void 0)
      ]
    },
    void 0,
    true,
    {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ModernAlert.tsx",
      lineNumber: 120,
      columnNumber: 5
    },
    void 0
  );
};
const showModernAlert = (title, message, type = "info") => {
  return new Promise((resolve) => {
    let container = document.getElementById("modern-alert-container");
    if (container) {
      container.remove();
    }
    container = document.createElement("div");
    container.id = "modern-alert-container";
    document.body.appendChild(container);
    const root = client.createRoot(container);
    const handleClose = () => {
      setTimeout(() => {
        root.unmount();
        if (container && container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }, 100);
      resolve(false);
    };
    const handleConfirm = () => {
      setTimeout(() => {
        root.unmount();
        if (container && container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }, 100);
      resolve(true);
    };
    root.render(
      React.createElement(ModernAlert, {
        title,
        message,
        type,
        onConfirm: handleConfirm,
        onCancel: type === "info" || type === "success" ? void 0 : handleClose,
        confirmText: "Aceptar"
      })
    );
  });
};
const showModernConfirm = (title, message, type = "warning") => {
  return new Promise((resolve) => {
    let container = document.getElementById("modern-confirm-container");
    if (container) {
      container.remove();
    }
    container = document.createElement("div");
    container.id = "modern-confirm-container";
    document.body.appendChild(container);
    const root = client.createRoot(container);
    const handleClose = () => {
      setTimeout(() => {
        root.unmount();
        if (container && container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }, 100);
      resolve(false);
    };
    const handleConfirm = () => {
      setTimeout(() => {
        root.unmount();
        if (container && container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }, 100);
      resolve(true);
    };
    const alertType = type === "danger" ? "error" : type === "warning" ? "warning" : "info";
    root.render(
      React.createElement(ModernAlert, {
        title,
        message,
        type: alertType,
        onConfirm: handleConfirm,
        onCancel: handleClose,
        confirmText: "Sí",
        cancelText: "Cancelar"
      })
    );
  });
};
export {
  showModernConfirm as a,
  showModernAlert as s
};
