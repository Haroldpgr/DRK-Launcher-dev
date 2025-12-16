const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/instanceProfileService-HVjlAa90.js","assets/index-fUlblEM8.js","assets/index-DbpeiShv.css"])))=>i.map(i=>d[i]);
import { j as jsxDevRuntimeExports, r as reactExports, R as React, _ as __vitePreload } from "./index-fUlblEM8.js";
import { C as Card } from "./Card-Cu7YrKyS.js";
import { B as Button } from "./Button-DWhhjYdR.js";
import { A as AnimatePresence } from "./index-DXAdDOch.js";
import { m as motion } from "./proxy-CtUJvkBi.js";
import { i as imageService } from "./imageService-Czw5glVT.js";
const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  type = "info"
}) => {
  if (!isOpen) return null;
  const typeStyles = {
    danger: {
      bg: "bg-red-900/20 border-red-800/30",
      icon: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-6 h-6 text-red-500", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ConfirmDialog.tsx",
        lineNumber: 32,
        columnNumber: 11
      }, void 0) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ConfirmDialog.tsx",
        lineNumber: 31,
        columnNumber: 9
      }, void 0),
      button: "bg-red-600 hover:bg-red-500 text-white"
    },
    warning: {
      bg: "bg-yellow-900/20 border-yellow-800/30",
      icon: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-6 h-6 text-yellow-500", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ConfirmDialog.tsx",
        lineNumber: 41,
        columnNumber: 11
      }, void 0) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ConfirmDialog.tsx",
        lineNumber: 40,
        columnNumber: 9
      }, void 0),
      button: "bg-yellow-600 hover:bg-yellow-500 text-white"
    },
    info: {
      bg: "bg-blue-900/20 border-blue-800/30",
      icon: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-6 h-6 text-blue-400", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ConfirmDialog.tsx",
        lineNumber: 50,
        columnNumber: 11
      }, void 0) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ConfirmDialog.tsx",
        lineNumber: 49,
        columnNumber: 9
      }, void 0),
      button: "bg-blue-600 hover:bg-blue-500 text-white"
    },
    success: {
      bg: "bg-green-900/20 border-green-800/30",
      icon: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-6 h-6 text-green-500", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ConfirmDialog.tsx",
        lineNumber: 59,
        columnNumber: 11
      }, void 0) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ConfirmDialog.tsx",
        lineNumber: 58,
        columnNumber: 9
      }, void 0),
      button: "bg-green-600 hover:bg-green-500 text-white"
    }
  };
  const currentType = typeStyles[type];
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(AnimatePresence, { children: isOpen && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    motion.div,
    {
      initial: { opacity: 0, scale: 0.95, y: 20 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.95, y: 20 },
      transition: { type: "spring", damping: 25, stiffness: 300 },
      className: "w-full max-w-md",
      children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: `rounded-xl overflow-hidden border ${currentType.bg} border-gray-700/50 shadow-2xl`, children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-6", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-start", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-shrink-0", children: currentType.icon }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ConfirmDialog.tsx",
            lineNumber: 82,
            columnNumber: 19
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "ml-4", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-bold text-white", children: title }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ConfirmDialog.tsx",
              lineNumber: 86,
              columnNumber: 21
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-2", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-sm text-gray-300", children: message }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ConfirmDialog.tsx",
              lineNumber: 88,
              columnNumber: 23
            }, void 0) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ConfirmDialog.tsx",
              lineNumber: 87,
              columnNumber: 21
            }, void 0)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ConfirmDialog.tsx",
            lineNumber: 85,
            columnNumber: 19
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ConfirmDialog.tsx",
          lineNumber: 81,
          columnNumber: 17
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-6 flex justify-end space-x-3", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              type: "button",
              onClick: onCancel,
              className: "px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700/50 hover:bg-gray-600/50 rounded-lg border border-gray-600/50 transition-colors",
              children: cancelText
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ConfirmDialog.tsx",
              lineNumber: 93,
              columnNumber: 19
            },
            void 0
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              type: "button",
              onClick: onConfirm,
              className: `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${currentType.button}`,
              children: confirmText
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ConfirmDialog.tsx",
              lineNumber: 100,
              columnNumber: 19
            },
            void 0
          )
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ConfirmDialog.tsx",
          lineNumber: 92,
          columnNumber: 17
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ConfirmDialog.tsx",
        lineNumber: 80,
        columnNumber: 15
      }, void 0) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ConfirmDialog.tsx",
        lineNumber: 79,
        columnNumber: 13
      }, void 0)
    },
    void 0,
    false,
    {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ConfirmDialog.tsx",
      lineNumber: 72,
      columnNumber: 11
    },
    void 0
  ) }, void 0, false, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ConfirmDialog.tsx",
    lineNumber: 71,
    columnNumber: 9
  }, void 0) }, void 0, false, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/ConfirmDialog.tsx",
    lineNumber: 69,
    columnNumber: 5
  }, void 0);
};
const PlayerProfileModal = ({
  isOpen,
  onClose,
  profile
}) => {
  if (!isOpen || !profile) return null;
  const formatGameTime = (milliseconds) => {
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
      className: "w-full max-w-4xl",
      children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/95 border border-gray-700/50 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-6", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-start", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "relative", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "img",
              {
                src: profile.skinUrl || `https://crafatar.com/avatars/${profile.username}?overlay`,
                alt: `${profile.username}'s avatar`,
                className: "w-24 h-24 rounded-full border-2 border-gray-600",
                onError: (e) => {
                  const target = e.target;
                  target.src = `https://crafatar.com/avatars/steve?overlay`;
                }
              },
              void 0,
              false,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/PlayerProfileModal.tsx",
                lineNumber: 55,
                columnNumber: 23
              },
              void 0
            ),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gray-900/80 px-2 py-1 rounded-full text-xs text-white", children: profile.type === "microsoft" ? "Premium" : "No premium" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/PlayerProfileModal.tsx",
              lineNumber: 64,
              columnNumber: 23
            }, void 0)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/PlayerProfileModal.tsx",
            lineNumber: 54,
            columnNumber: 21
          }, void 0) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/PlayerProfileModal.tsx",
            lineNumber: 53,
            columnNumber: 19
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "ml-6 flex-1", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-2xl font-bold text-white flex items-center", children: [
              profile.username,
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "ml-3 text-sm font-normal bg-blue-900/30 text-blue-300 px-2 py-1 rounded-full", children: [
                "Miembro desde ",
                profile.joinedDate
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/PlayerProfileModal.tsx",
                lineNumber: 72,
                columnNumber: 23
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/PlayerProfileModal.tsx",
              lineNumber: 70,
              columnNumber: 21
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-4 grid grid-cols-1 md:grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-700/30 p-4 rounded-lg", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h4", { className: "text-sm font-medium text-gray-400 mb-2", children: "Tiempo de Juego" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/PlayerProfileModal.tsx",
                  lineNumber: 78,
                  columnNumber: 25
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-xl font-bold text-green-400", children: formatGameTime(profile.gameTime) }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/PlayerProfileModal.tsx",
                  lineNumber: 79,
                  columnNumber: 25
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/PlayerProfileModal.tsx",
                lineNumber: 77,
                columnNumber: 23
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-700/30 p-4 rounded-lg", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h4", { className: "text-sm font-medium text-gray-400 mb-2", children: "Instancias Asociadas" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/PlayerProfileModal.tsx",
                  lineNumber: 82,
                  columnNumber: 25
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-xl font-bold text-blue-400", children: profile.instances.length }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/PlayerProfileModal.tsx",
                  lineNumber: 83,
                  columnNumber: 25
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/PlayerProfileModal.tsx",
                lineNumber: 81,
                columnNumber: 23
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/PlayerProfileModal.tsx",
              lineNumber: 76,
              columnNumber: 21
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-6", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h4", { className: "text-lg font-semibold text-white mb-3", children: "Instancias Recientes" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/PlayerProfileModal.tsx",
                lineNumber: 88,
                columnNumber: 23
              }, void 0),
              profile.instances && profile.instances.length > 0 ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-2", children: profile.instances.map((instance, index) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-center bg-gray-700/30 p-3 rounded-lg", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-white font-medium", children: instance.name }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/PlayerProfileModal.tsx",
                    lineNumber: 94,
                    columnNumber: 33
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-400", children: [
                    "Última sesión: ",
                    instance.lastPlayed
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/PlayerProfileModal.tsx",
                    lineNumber: 95,
                    columnNumber: 33
                  }, void 0)
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/PlayerProfileModal.tsx",
                  lineNumber: 93,
                  columnNumber: 31
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("button", { className: "text-sm bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded-lg transition-colors", children: "Abrir" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/PlayerProfileModal.tsx",
                  lineNumber: 97,
                  columnNumber: 31
                }, void 0)
              ] }, instance.id, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/PlayerProfileModal.tsx",
                lineNumber: 92,
                columnNumber: 29
              }, void 0)) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/PlayerProfileModal.tsx",
                lineNumber: 90,
                columnNumber: 25
              }, void 0) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-gray-400", children: "No hay instancias asociadas a esta cuenta" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/PlayerProfileModal.tsx",
                lineNumber: 104,
                columnNumber: 25
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/PlayerProfileModal.tsx",
              lineNumber: 87,
              columnNumber: 21
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-6", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h4", { className: "text-lg font-semibold text-white mb-3", children: "Skin del Jugador" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/PlayerProfileModal.tsx",
                lineNumber: 109,
                columnNumber: 23
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center space-x-4", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  "img",
                  {
                    src: profile.skinUrl || `https://crafatar.com/skins/${profile.username}`,
                    alt: `${profile.username}'s skin`,
                    className: "w-32 h-32 object-contain border border-gray-600 rounded",
                    onError: (e) => {
                      const target = e.target;
                      target.src = `https://crafatar.com/skins/steve`;
                    }
                  },
                  void 0,
                  false,
                  {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/PlayerProfileModal.tsx",
                    lineNumber: 111,
                    columnNumber: 25
                  },
                  void 0
                ),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("button", { className: "px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors", children: "Descargar Skin" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/PlayerProfileModal.tsx",
                    lineNumber: 121,
                    columnNumber: 27
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "mt-2 text-sm text-gray-400", children: [
                    "Skin actualizada por última vez: ",
                    profile.joinedDate
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/PlayerProfileModal.tsx",
                    lineNumber: 124,
                    columnNumber: 27
                  }, void 0)
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/PlayerProfileModal.tsx",
                  lineNumber: 120,
                  columnNumber: 25
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/PlayerProfileModal.tsx",
                lineNumber: 110,
                columnNumber: 23
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/PlayerProfileModal.tsx",
              lineNumber: 108,
              columnNumber: 21
            }, void 0)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/PlayerProfileModal.tsx",
            lineNumber: 69,
            columnNumber: 19
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/PlayerProfileModal.tsx",
          lineNumber: 52,
          columnNumber: 17
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-8 flex justify-end", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: onClose,
            className: "px-6 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700/50 hover:bg-gray-600/50 rounded-lg border border-gray-600/50 transition-colors",
            children: "Cerrar"
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/PlayerProfileModal.tsx",
            lineNumber: 134,
            columnNumber: 19
          },
          void 0
        ) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/PlayerProfileModal.tsx",
          lineNumber: 133,
          columnNumber: 17
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/PlayerProfileModal.tsx",
        lineNumber: 51,
        columnNumber: 15
      }, void 0) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/PlayerProfileModal.tsx",
        lineNumber: 50,
        columnNumber: 13
      }, void 0)
    },
    void 0,
    false,
    {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/PlayerProfileModal.tsx",
      lineNumber: 43,
      columnNumber: 11
    },
    void 0
  ) }, void 0, false, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/PlayerProfileModal.tsx",
    lineNumber: 42,
    columnNumber: 9
  }, void 0) }, void 0, false, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ui/PlayerProfileModal.tsx",
    lineNumber: 40,
    columnNumber: 5
  }, void 0);
};
const ProfileImage = ({
  username,
  size,
  className = ""
}) => {
  const initials = username.charAt(0).toUpperCase();
  const bgColor = `hsl(${username.length * 137.5} 60% 60%)`;
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "div",
    {
      className: `rounded-full flex items-center justify-center text-white font-bold ${className}`,
      style: {
        width: size,
        height: size,
        backgroundColor: bgColor
      },
      children: initials
    },
    void 0,
    false,
    {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
      lineNumber: 25,
      columnNumber: 5
    },
    void 0
  );
};
function ProfileDropdown({
  currentUser,
  profiles,
  onSelectAccount,
  onAddAccount,
  onDeleteAccount,
  onLoginClick
}) {
  var _a, _b;
  const [isOpen, setIsOpen] = reactExports.useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = reactExports.useState(false);
  const [accountToDelete, setAccountToDelete] = reactExports.useState(null);
  const [showProfileModal, setShowProfileModal] = reactExports.useState(false);
  const [profileToView, setProfileToView] = reactExports.useState(null);
  const dropdownRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const handleAddAccount = () => {
    if (onAddAccount) {
      onAddAccount();
    } else {
      onLoginClick();
    }
    setIsOpen(false);
  };
  const handleDeleteClick = (username, e) => {
    e.stopPropagation();
    setAccountToDelete(username);
    setShowConfirmDialog(true);
    setIsOpen(false);
  };
  const confirmDelete = () => {
    if (accountToDelete) {
      onDeleteAccount(accountToDelete);
      setShowConfirmDialog(false);
      setAccountToDelete(null);
    }
  };
  const cancelDelete = () => {
    setShowConfirmDialog(false);
    setAccountToDelete(null);
  };
  const handleViewProfile = (profile, e) => {
    e.stopPropagation();
    setProfileToView(profile);
    setShowProfileModal(true);
    setIsOpen(false);
  };
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "relative", ref: dropdownRef, children: [
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
      "button",
      {
        onClick: () => setIsOpen(!isOpen),
        className: "w-full flex items-center justify-between p-3 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700/50 hover:from-gray-700/50 hover:to-gray-800/50 transition-all duration-300",
        children: [
          currentUser ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center space-x-3", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-10 h-10", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(ProfileImage, { username: currentUser, size: 40, className: "w-full h-full" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
              lineNumber: 112,
              columnNumber: 15
            }, this) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
              lineNumber: 111,
              columnNumber: 13
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-left", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "font-semibold text-white", children: currentUser }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
                lineNumber: 115,
                columnNumber: 15
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-400", children: ((_a = profiles.find((p) => p.username === currentUser)) == null ? void 0 : _a.type) === "microsoft" ? "Cuenta Microsoft" : ((_b = profiles.find((p) => p.username === currentUser)) == null ? void 0 : _b.type) === "elyby" ? "Cuenta Ely.by" : "Cuenta no premium" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
                lineNumber: 116,
                columnNumber: 15
              }, this)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
              lineNumber: 114,
              columnNumber: 13
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
            lineNumber: 110,
            columnNumber: 11
          }, this) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center space-x-3", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white font-bold", children: "?" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
              lineNumber: 127,
              columnNumber: 13
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-left", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "font-semibold text-gray-300", children: "No conectado" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
                lineNumber: 131,
                columnNumber: 15
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-400", children: "Iniciar sesión" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
                lineNumber: 132,
                columnNumber: 15
              }, this)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
              lineNumber: 130,
              columnNumber: 13
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
            lineNumber: 126,
            columnNumber: 11
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "svg",
            {
              className: `w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`,
              fill: "none",
              viewBox: "0 0 24 24",
              stroke: "currentColor",
              children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M19 9l-7 7-7-7" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
                lineNumber: 142,
                columnNumber: 11
              }, this)
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
              lineNumber: 136,
              columnNumber: 9
            },
            this
          )
        ]
      },
      void 0,
      true,
      {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
        lineNumber: 105,
        columnNumber: 7
      },
      this
    ),
    isOpen && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "absolute z-10 mt-2 w-full bg-gray-800/95 border border-gray-700/50 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "max-h-80 overflow-y-auto custom-scrollbar", children: [
      profiles && profiles.slice(0, 3).map((profile) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
        "div",
        {
          className: `flex items-center justify-between p-3 border-b border-gray-700/30 last:border-0 hover:bg-gray-700/50 transition-colors ${profile.username === currentUser ? "bg-gray-700/30" : ""}`,
          children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "div",
              {
                className: "flex items-center space-x-3 flex-1 cursor-pointer",
                onClick: () => {
                  onSelectAccount(profile.username);
                  setIsOpen(false);
                },
                children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-8 h-8", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(ProfileImage, { username: profile.username, size: 32, className: "w-full h-full" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
                    lineNumber: 164,
                    columnNumber: 21
                  }, this) }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
                    lineNumber: 163,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-white text-sm font-medium", children: profile.username }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
                      lineNumber: 167,
                      columnNumber: 21
                    }, this),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-400", children: profile.type === "microsoft" ? "Microsoft" : profile.type === "elyby" ? "Ely.by" : "No premium" }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
                      lineNumber: 168,
                      columnNumber: 21
                    }, this)
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
                    lineNumber: 166,
                    columnNumber: 19
                  }, this)
                ]
              },
              void 0,
              true,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
                lineNumber: 156,
                columnNumber: 17
              },
              this
            ),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex space-x-2", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                "button",
                {
                  onClick: (e) => handleViewProfile(profile, e),
                  className: "p-1 text-gray-400 hover:text-blue-400 transition-colors",
                  title: "Ver perfil",
                  children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: [
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
                      lineNumber: 184,
                      columnNumber: 23
                    }, this),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
                      lineNumber: 185,
                      columnNumber: 23
                    }, this)
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
                    lineNumber: 183,
                    columnNumber: 21
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
                  lineNumber: 178,
                  columnNumber: 19
                },
                this
              ),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                "button",
                {
                  onClick: (e) => handleDeleteClick(profile.username, e),
                  className: "p-1 text-gray-400 hover:text-red-400 transition-colors",
                  title: "Eliminar cuenta",
                  children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
                    lineNumber: 194,
                    columnNumber: 23
                  }, this) }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
                    lineNumber: 193,
                    columnNumber: 21
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
                  lineNumber: 188,
                  columnNumber: 19
                },
                this
              )
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
              lineNumber: 177,
              columnNumber: 17
            }, this)
          ]
        },
        profile.id,
        true,
        {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
          lineNumber: 150,
          columnNumber: 15
        },
        this
      )),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
        "button",
        {
          onClick: handleAddAccount,
          className: "w-full p-3 text-left text-blue-400 hover:bg-gray-700/50 transition-colors flex items-center space-x-3",
          children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center border border-dashed border-gray-600/50", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 6v6m0 0v6m0-6h6m-6 0H6" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
              lineNumber: 206,
              columnNumber: 19
            }, this) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
              lineNumber: 205,
              columnNumber: 17
            }, this) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
              lineNumber: 204,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: "Agregar cuenta" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
              lineNumber: 209,
              columnNumber: 15
            }, this)
          ]
        },
        void 0,
        true,
        {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
          lineNumber: 200,
          columnNumber: 13
        },
        this
      )
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
      lineNumber: 148,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
      lineNumber: 147,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
      ConfirmDialog,
      {
        isOpen: showConfirmDialog,
        title: "Eliminar cuenta",
        message: "¿Estás seguro de que deseas eliminar esta cuenta? Esta acción no se puede deshacer.",
        confirmText: "Eliminar",
        cancelText: "Cancelar",
        type: "danger",
        onConfirm: confirmDelete,
        onCancel: cancelDelete
      },
      void 0,
      false,
      {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
        lineNumber: 215,
        columnNumber: 7
      },
      this
    ),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
      PlayerProfileModal,
      {
        isOpen: showProfileModal,
        onClose: () => setShowProfileModal(false),
        profile: {
          ...profileToView,
          gameTime: (profileToView == null ? void 0 : profileToView.gameTime) || 0,
          instances: (profileToView == null ? void 0 : profileToView.instances) || [],
          skinUrl: (profileToView == null ? void 0 : profileToView.skinUrl) || "",
          joinedDate: (profileToView == null ? void 0 : profileToView.lastUsed) ? new Date(profileToView.lastUsed).toLocaleDateString() : (/* @__PURE__ */ new Date()).toLocaleDateString()
        }
      },
      void 0,
      false,
      {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
        lineNumber: 226,
        columnNumber: 7
      },
      this
    )
  ] }, void 0, true, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ProfileDropdown.tsx",
    lineNumber: 104,
    columnNumber: 5
  }, this);
}
const ProfileDropdown$1 = reactExports.memo(ProfileDropdown);
const HomeServerCard = ({
  name,
  ip,
  description,
  thumbnail,
  category,
  onConnect
}) => {
  const [imageSrc, setImageSrc] = React.useState(thumbnail || imageService.getPlaceholderImage(name));
  const handleImageError = () => {
    setImageSrc(imageService.getPlaceholderImage(name));
  };
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "rounded-xl overflow-hidden bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 transition-transform hover:scale-[1.02]", children: [
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
      "img",
      {
        src: imageSrc,
        alt: name,
        className: "w-full h-32 object-cover",
        loading: "lazy",
        onError: handleImageError
      },
      void 0,
      false,
      {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/HomeServerCard.tsx",
        lineNumber: 31,
        columnNumber: 7
      },
      void 0
    ),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-3", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "font-medium mb-1 text-gray-100", children: name }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/HomeServerCard.tsx",
        lineNumber: 39,
        columnNumber: 9
      }, void 0),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-sm text-gray-400 mb-2", children: description || "Servidor de Minecraft multijugador" }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/HomeServerCard.tsx",
        lineNumber: 40,
        columnNumber: 9
      }, void 0),
      category && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-indigo-300 mb-2", children: category }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/HomeServerCard.tsx",
        lineNumber: 42,
        columnNumber: 11
      }, void 0),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs font-mono bg-gray-900/50 px-2 py-1 rounded mb-2 inline-block", children: ip }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/HomeServerCard.tsx",
        lineNumber: 44,
        columnNumber: 9
      }, void 0),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex gap-2", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
        Button,
        {
          variant: "secondary",
          onClick: () => onConnect(ip),
          children: "Conectar"
        },
        void 0,
        false,
        {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/HomeServerCard.tsx",
          lineNumber: 48,
          columnNumber: 11
        },
        void 0
      ) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/HomeServerCard.tsx",
        lineNumber: 47,
        columnNumber: 9
      }, void 0)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/HomeServerCard.tsx",
      lineNumber: 38,
      columnNumber: 7
    }, void 0)
  ] }, void 0, true, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/HomeServerCard.tsx",
    lineNumber: 30,
    columnNumber: 5
  }, void 0);
};
const getDefaultPlaceholder = () => {
  return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWYyOTM3Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk1pbmVjcmFmdDwvdGV4dD48L3N2Zz4=";
};
function Home({ onAddAccount, onDeleteAccount, onSelectAccount, onLoginClick, onPlay, currentUser, accounts }) {
  const [feed, setFeed] = reactExports.useState([]);
  const [instances, setInstances] = reactExports.useState([]);
  const [modpacks, setModpacks] = reactExports.useState([]);
  const [modpacksCurseForge, setModpacksCurseForge] = reactExports.useState([]);
  const [shaders, setShaders] = reactExports.useState([]);
  const [shadersCurseForge, setShadersCurseForge] = reactExports.useState([]);
  const [servers, setServers] = reactExports.useState([]);
  const [notification, setNotification] = reactExports.useState(null);
  const last = reactExports.useMemo(() => instances[instances.length - 1], [instances]);
  reactExports.useEffect(() => {
    setFeed([
      { id: "welcome", title: "🎮 ¡Bienvenido a DRK Launcher!", body: "Explora miles de mods, modpacks, shaders y más. Crea tu primera instancia y comienza tu aventura." },
      { id: "update", title: "✨ Nueva Actualización Disponible", body: "Mejoras de rendimiento, nuevas funciones y correcciones de errores. ¡Actualiza ahora desde Ajustes!" },
      { id: "tips", title: "💡 Consejo del Día", body: "Configura Java y RAM desde Ajustes para mejor rendimiento. Usa al menos 4GB de RAM para modpacks grandes." },
      { id: "community", title: "👥 Únete a la Comunidad", body: "Comparte tus creaciones, pide ayuda y descubre nuevas formas de jugar con otros jugadores." }
    ]);
  }, []);
  const autoDetectAndLoadInstances = async () => {
    var _a, _b, _c, _d;
    try {
      if ((_b = (_a = window.api) == null ? void 0 : _a.instances) == null ? void 0 : _b.scanAndRegister) {
        try {
          const scanResult = await window.api.instances.scanAndRegister();
          console.log(`Registro automático en Home completado: ${scanResult.count} instancias nuevas registradas`);
        } catch (scanError) {
          console.error("Error al escanear y registrar instancias en Home:", scanError);
        }
      }
      if ((_d = (_c = window.api) == null ? void 0 : _c.instances) == null ? void 0 : _d.list) {
        const allInstances = await window.api.instances.list();
        if (currentUser) {
          __vitePreload(async () => {
            const { instanceProfileService } = await import("./instanceProfileService-HVjlAa90.js");
            return { instanceProfileService };
          }, true ? __vite__mapDeps([0,1,2]) : void 0).then(({ instanceProfileService }) => {
            for (const instance of allInstances) {
              const profileInstanceIds2 = instanceProfileService.getInstancesForProfile(currentUser);
              if (!profileInstanceIds2.includes(instance.id)) {
                const otherProfile = instanceProfileService.getProfileForInstance(instance.id);
                if (!otherProfile) {
                  instanceProfileService.linkInstanceToProfile(instance.id, currentUser);
                }
              }
            }
            const profileInstanceIds = instanceProfileService.getInstancesForProfile(currentUser);
            const profileInstances = allInstances.filter(
              (instance) => profileInstanceIds.includes(instance.id)
            );
            setInstances(profileInstances);
          }).catch(() => {
            setInstances(allInstances);
          });
        } else {
          setInstances(allInstances);
        }
      }
    } catch (error) {
      console.error("Error al cargar instancias:", error);
    }
  };
  const staticServers = reactExports.useMemo(() => [
    {
      id: "server1",
      name: "Hypixel",
      ip: "mc.hypixel.net",
      description: "El servidor multijugador más grande de Minecraft con minijuegos, SkyBlock y más",
      category: "Minijuegos",
      thumbnail: "https://api.minetools.eu/favicon/mc.hypixel.net"
    },
    {
      id: "server2",
      name: "Minecade",
      ip: "play.minecade.net",
      description: "Minijuegos competitivos con torneos regulares y modos únicos",
      category: "Minijuegos",
      thumbnail: "https://api.minetools.eu/favicon/play.minecade.net"
    },
    {
      id: "server3",
      name: "Empire Minecraft",
      ip: "play.emc.gs",
      description: "Uno de los servidores de survival más grandes con economía y facciones",
      category: "Factions",
      thumbnail: "https://api.minetools.eu/favicon/play.emc.gs"
    }
  ], []);
  reactExports.useEffect(() => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    let isMounted = true;
    autoDetectAndLoadInstances();
    if (((_b = (_a = window.api) == null ? void 0 : _a.modrinth) == null ? void 0 : _b.search) && modpacks.length === 0) {
      window.api.modrinth.search({
        contentType: "modpacks",
        search: ""
      }).then((modpacksList) => {
        if (!isMounted) return;
        const topModpacks = modpacksList.slice(0, 3);
        setModpacks(topModpacks);
      }).catch((error) => {
        if (!isMounted) return;
        console.error("Error al cargar modpacks:", error);
        setModpacks([
          { id: "opt", name: "Optimizado", description: "Paquete de rendimiento y gráficos suaves", tags: ["Optimización"], imageUrl: getDefaultPlaceholder() },
          { id: "adventure", name: "Aventura+", description: "Explora mazmorras y nuevas dimensiones", tags: ["Aventura"], imageUrl: getDefaultPlaceholder() },
          { id: "builder", name: "Constructor", description: "Bloques y herramientas para creativos", tags: ["Construcción"], imageUrl: getDefaultPlaceholder() }
        ]);
      });
    }
    if (((_d = (_c = window.api) == null ? void 0 : _c.modrinth) == null ? void 0 : _d.search) && shaders.length === 0) {
      window.api.modrinth.search({
        contentType: "shaders",
        search: ""
      }).then((shadersList) => {
        if (!isMounted) return;
        const topShaders = shadersList.slice(0, 3);
        setShaders(topShaders);
      }).catch((error) => {
        if (!isMounted) return;
        console.error("Error al cargar shaders:", error);
        setShaders([
          { id: "s1", name: "Oculus", description: "Shaderpack de alto rendimiento con efectos visuales realistas", imageUrl: getDefaultPlaceholder() },
          { id: "s2", name: "BSL", description: "Shaderpack con iluminación dinámica y sombras realistas", imageUrl: getDefaultPlaceholder() },
          { id: "s3", name: "SEUS", description: "Shaderpack con efectos de luz y sombra de alta calidad", imageUrl: getDefaultPlaceholder() }
        ]);
      });
    }
    if (((_f = (_e = window.api) == null ? void 0 : _e.curseforge) == null ? void 0 : _f.search) && modpacksCurseForge.length === 0) {
      window.api.curseforge.search({
        contentType: "modpacks",
        search: ""
      }).then((modpacksList) => {
        if (!isMounted) return;
        const topModpacks = modpacksList.slice(0, 3);
        setModpacksCurseForge(topModpacks);
      }).catch((error) => {
        if (!isMounted) return;
        console.error("Error al cargar modpacks de CurseForge:", error);
        setModpacksCurseForge([]);
      });
    }
    if (((_h = (_g = window.api) == null ? void 0 : _g.curseforge) == null ? void 0 : _h.search) && shadersCurseForge.length === 0) {
      window.api.curseforge.search({
        contentType: "shaders",
        search: ""
      }).then((shadersList) => {
        if (!isMounted) return;
        const topShaders = shadersList.slice(0, 3);
        setShadersCurseForge(topShaders);
      }).catch((error) => {
        if (!isMounted) return;
        console.error("Error al cargar shaders de CurseForge:", error);
        setShadersCurseForge([]);
      });
    }
    if (servers.length === 0) {
      setServers(staticServers);
    }
    return () => {
      isMounted = false;
    };
  }, [currentUser, staticServers]);
  const play = async () => {
    if (!last) return;
    onPlay(last.id);
  };
  const connectToServer = (ip) => {
    navigator.clipboard.writeText(ip).then(() => {
      setNotification({ message: `IP copiada: ${ip}`, type: "success" });
      setTimeout(() => setNotification(null), 3e3);
    }).catch(() => {
      setNotification({ message: "Error al copiar la IP", type: "error" });
      setTimeout(() => setNotification(null), 3e3);
    });
  };
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-4 gap-6", children: [
    notification && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${notification.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`, children: notification.message }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
      lineNumber: 266,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "col-span-3 space-y-6", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Card, { children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-2xl font-bold text-gray-100", children: [
        "¡Bienvenido, ",
        currentUser || "Usuario",
        "!"
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
        lineNumber: 277,
        columnNumber: 11
      }, this) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
        lineNumber: 276,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Card, { children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xl font-semibold mb-4 text-gray-200", children: "Continuar" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
          lineNumber: 281,
          columnNumber: 11
        }, this),
        last ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between bg-gray-800/60 backdrop-blur-sm p-4 rounded-xl border border-gray-700/50", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "font-medium text-gray-100", children: last.name }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
              lineNumber: 285,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-sm text-gray-400", children: [
              last.version,
              " ",
              last.loader
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
              lineNumber: 286,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
            lineNumber: 284,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Button, { onClick: play, children: "Jugar" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
              lineNumber: 289,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Button, { variant: "secondary", onClick: () => location.assign("#/instances"), children: "Más opciones" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
              lineNumber: 290,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
            lineNumber: 288,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
          lineNumber: 283,
          columnNumber: 13
        }, this) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-sm text-gray-400 py-4 text-center", children: "No hay instancias aún. Crea una para empezar." }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
          lineNumber: 294,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
        lineNumber: 280,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Card, { children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between mb-4", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xl font-semibold text-gray-200", children: "Descubre un modpack de Modrinth" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
            lineNumber: 300,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Button, { variant: "secondary", onClick: () => location.assign("#/contenido/modpacks?platform=modrinth"), children: "Ver más" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
            lineNumber: 301,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
          lineNumber: 299,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-3 gap-4", children: modpacks.map((m) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "rounded-xl overflow-hidden bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 transition-transform hover:scale-[1.02]", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "img",
            {
              src: m.imageUrl || m.img,
              alt: m.name,
              className: "w-full h-32 object-cover",
              loading: "lazy",
              onError: (e) => {
                const target = e.target;
                target.src = getDefaultPlaceholder();
              }
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
              lineNumber: 306,
              columnNumber: 17
            },
            this
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-3", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "font-medium mb-1 text-gray-100", children: m.title || m.name }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
              lineNumber: 317,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-sm text-gray-400 mb-2", children: m.description }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
              lineNumber: 318,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex gap-2", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              Button,
              {
                variant: "secondary",
                onClick: () => location.assign(`#/contenido/modpacks/${m.id}`),
                children: "Ver"
              },
              void 0,
              false,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
                lineNumber: 320,
                columnNumber: 21
              },
              this
            ) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
              lineNumber: 319,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
            lineNumber: 316,
            columnNumber: 17
          }, this)
        ] }, m.id, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
          lineNumber: 305,
          columnNumber: 15
        }, this)) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
          lineNumber: 303,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
        lineNumber: 298,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Card, { children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between mb-4", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xl font-semibold text-gray-200", children: "Descubre un modpack de CurseForge" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
            lineNumber: 336,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Button, { variant: "secondary", onClick: () => {
            window.location.hash = "/contenido/modpacks?platform=curseforge";
          }, children: "Ver más" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
            lineNumber: 337,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
          lineNumber: 335,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-3 gap-4", children: modpacksCurseForge.length > 0 ? modpacksCurseForge.map((m) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "rounded-xl overflow-hidden bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 transition-transform hover:scale-[1.02]", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "img",
            {
              src: m.imageUrl || getDefaultPlaceholder(),
              alt: m.name || m.title,
              className: "w-full h-32 object-cover",
              loading: "lazy",
              onError: (e) => {
                const target = e.target;
                target.src = getDefaultPlaceholder();
              }
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
              lineNumber: 344,
              columnNumber: 17
            },
            this
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-3", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "font-medium mb-1 text-gray-100", children: m.title || m.name }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
              lineNumber: 355,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-sm text-gray-400 mb-2", children: m.description || "Sin descripción disponible" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
              lineNumber: 356,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex gap-2", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              Button,
              {
                variant: "secondary",
                onClick: () => {
                  window.location.hash = `/contenido/modpacks/${m.id}?platform=curseforge`;
                },
                children: "Ver"
              },
              void 0,
              false,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
                lineNumber: 358,
                columnNumber: 21
              },
              this
            ) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
              lineNumber: 357,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
            lineNumber: 354,
            columnNumber: 17
          }, this)
        ] }, m.id, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
          lineNumber: 343,
          columnNumber: 15
        }, this)) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "col-span-3 text-center text-gray-400 py-8", children: "Cargando modpacks de CurseForge..." }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
          lineNumber: 370,
          columnNumber: 15
        }, this) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
          lineNumber: 341,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
        lineNumber: 334,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Card, { children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between mb-4", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xl font-semibold text-gray-200", children: "Descubre shaders de Modrinth" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
            lineNumber: 378,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Button, { variant: "secondary", onClick: () => location.assign("#/contenido/shaders?platform=modrinth"), children: "Ver más" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
            lineNumber: 379,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
          lineNumber: 377,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-3 gap-4", children: shaders.map((s) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "rounded-xl overflow-hidden bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 transition-transform hover:scale-[1.02]", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "img",
            {
              src: s.imageUrl || s.img,
              alt: s.name,
              className: "w-full h-32 object-cover",
              loading: "lazy",
              onError: (e) => {
                const target = e.target;
                target.src = getDefaultPlaceholder();
              }
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
              lineNumber: 384,
              columnNumber: 17
            },
            this
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-3", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "font-medium mb-1 text-gray-100", children: s.title || s.name }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
              lineNumber: 395,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-sm text-gray-400 mb-2", children: s.description }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
              lineNumber: 396,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex gap-2", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              Button,
              {
                variant: "secondary",
                onClick: () => location.assign(`#/contenido/shaders/${s.id}`),
                children: "Ver"
              },
              void 0,
              false,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
                lineNumber: 398,
                columnNumber: 21
              },
              this
            ) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
              lineNumber: 397,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
            lineNumber: 394,
            columnNumber: 17
          }, this)
        ] }, s.id, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
          lineNumber: 383,
          columnNumber: 15
        }, this)) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
          lineNumber: 381,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
        lineNumber: 376,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Card, { children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between mb-4", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xl font-semibold text-gray-200", children: "Descubre shaders de CurseForge" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
            lineNumber: 414,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Button, { variant: "secondary", onClick: () => {
            window.location.hash = "/contenido/shaders?platform=curseforge";
          }, children: "Ver más" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
            lineNumber: 415,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
          lineNumber: 413,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-3 gap-4", children: shadersCurseForge.length > 0 ? shadersCurseForge.map((s) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "rounded-xl overflow-hidden bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 transition-transform hover:scale-[1.02]", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "img",
            {
              src: s.imageUrl || getDefaultPlaceholder(),
              alt: s.title || s.name || "Shader",
              className: "w-full h-32 object-cover",
              loading: "lazy",
              onError: (e) => {
                const target = e.target;
                if (target.src !== getDefaultPlaceholder()) {
                  target.src = getDefaultPlaceholder();
                }
              }
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
              lineNumber: 422,
              columnNumber: 17
            },
            this
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-3", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "font-medium mb-1 text-gray-100", children: s.title || s.name || "Sin nombre" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
              lineNumber: 435,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-sm text-gray-400 mb-2", children: s.description || "Sin descripción disponible" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
              lineNumber: 436,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex gap-2", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              Button,
              {
                variant: "secondary",
                onClick: () => {
                  window.location.hash = `/contenido/shaders/${s.id}?platform=curseforge`;
                },
                children: "Ver"
              },
              void 0,
              false,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
                lineNumber: 438,
                columnNumber: 21
              },
              this
            ) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
              lineNumber: 437,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
            lineNumber: 434,
            columnNumber: 17
          }, this)
        ] }, s.id, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
          lineNumber: 421,
          columnNumber: 15
        }, this)) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "col-span-3 text-center text-gray-400 py-8", children: "Cargando shaders de CurseForge..." }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
          lineNumber: 450,
          columnNumber: 15
        }, this) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
          lineNumber: 419,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
        lineNumber: 412,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Card, { children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between mb-4", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xl font-semibold text-gray-200", children: "Servidores recomendados" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
            lineNumber: 458,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Button, { variant: "secondary", onClick: () => location.assign("#/servers"), children: "Ver más" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
            lineNumber: 459,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
          lineNumber: 457,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-3 gap-4", children: servers.map((server) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          HomeServerCard,
          {
            id: server.id,
            name: server.name,
            ip: server.ip,
            description: server.description,
            thumbnail: server.thumbnail,
            category: server.category,
            onConnect: connectToServer
          },
          server.id,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
            lineNumber: 463,
            columnNumber: 15
          },
          this
        )) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
          lineNumber: 461,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
        lineNumber: 456,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
      lineNumber: 275,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Card, { children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xl font-semibold mb-2 text-gray-200", children: "Noticias" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
          lineNumber: 480,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-2", children: feed.map((x) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-3 bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700/50", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "font-medium text-gray-100", children: x.title }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
            lineNumber: 484,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-sm text-gray-400", children: x.body }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
            lineNumber: 485,
            columnNumber: 17
          }, this)
        ] }, x.id, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
          lineNumber: 483,
          columnNumber: 15
        }, this)) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
          lineNumber: 481,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
        lineNumber: 479,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Card, { children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xl font-semibold mb-2 text-gray-200", children: "Cumplimiento" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
          lineNumber: 491,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-sm text-gray-400", children: "DRK Launcher no distribuye contenido protegido. Necesitas una copia legítima de Minecraft para jugar." }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
          lineNumber: 492,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
        lineNumber: 490,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Card, { children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xl font-semibold mb-2 text-gray-200", children: "Perfil" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
          lineNumber: 495,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          ProfileDropdown$1,
          {
            currentUser,
            profiles: accounts,
            onSelectAccount,
            onAddAccount: () => onLoginClick(),
            onDeleteAccount,
            onLoginClick
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
            lineNumber: 496,
            columnNumber: 11
          },
          this
        )
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
        lineNumber: 494,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Card, { children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xl font-semibold mb-4 text-gray-200", children: "Anuncios" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
          lineNumber: 508,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-4 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 backdrop-blur-sm rounded-xl border border-blue-700/30 hover:border-blue-600/50 transition-all cursor-pointer", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-3 mb-2", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-6 h-6 text-blue-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13 10V3L4 14h7v7l9-11h-7z" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
              lineNumber: 515,
              columnNumber: 21
            }, this) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
              lineNumber: 514,
              columnNumber: 19
            }, this) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
              lineNumber: 513,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "font-semibold text-white", children: "¡Nueva Actualización!" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
                lineNumber: 519,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-blue-300", children: "Descubre las últimas mejoras" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
                lineNumber: 520,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
              lineNumber: 518,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
            lineNumber: 512,
            columnNumber: 15
          }, this) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
            lineNumber: 511,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-4 bg-gradient-to-r from-purple-900/40 to-pink-900/40 backdrop-blur-sm rounded-xl border border-purple-700/30 hover:border-purple-600/50 transition-all cursor-pointer", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-3 mb-2", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-6 h-6 text-purple-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
              lineNumber: 530,
              columnNumber: 21
            }, this) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
              lineNumber: 529,
              columnNumber: 19
            }, this) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
              lineNumber: 528,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "font-semibold text-white", children: "Modpacks Destacados" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
                lineNumber: 534,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-purple-300", children: "Explora los más populares" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
                lineNumber: 535,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
              lineNumber: 533,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
            lineNumber: 527,
            columnNumber: 15
          }, this) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
            lineNumber: 526,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-4 bg-gradient-to-r from-green-900/40 to-emerald-900/40 backdrop-blur-sm rounded-xl border border-green-700/30 hover:border-green-600/50 transition-all cursor-pointer", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-3 mb-2", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-6 h-6 text-green-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
              lineNumber: 545,
              columnNumber: 21
            }, this) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
              lineNumber: 544,
              columnNumber: 19
            }, this) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
              lineNumber: 543,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "font-semibold text-white", children: "Soporte Premium" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
                lineNumber: 549,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-green-300", children: "Obtén ayuda prioritaria" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
                lineNumber: 550,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
              lineNumber: 548,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
            lineNumber: 542,
            columnNumber: 15
          }, this) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
            lineNumber: 541,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
          lineNumber: 509,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
        lineNumber: 507,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
      lineNumber: 478,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Home.tsx",
    lineNumber: 263,
    columnNumber: 5
  }, this);
}
export {
  Home as default
};
