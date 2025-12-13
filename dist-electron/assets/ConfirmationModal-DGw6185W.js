import { j as jsxDevRuntimeExports } from "./index-CI5celIq.js";
import { A as AnimatePresence } from "./index-CvbDc4Yn.js";
import { m as motion } from "./proxy-DjxwFqeL.js";
const ConfirmationModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  confirmColor = "danger"
}) => {
  const colorClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 shadow-blue-500/50",
    danger: "bg-red-600 hover:bg-red-700 focus:ring-red-500 shadow-red-500/50",
    warning: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500 shadow-yellow-500/50",
    success: "bg-green-600 hover:bg-green-700 focus:ring-green-500 shadow-green-500/50"
  };
  const iconColors = {
    primary: "text-blue-400 bg-blue-500/20",
    danger: "text-red-400 bg-red-500/20",
    warning: "text-yellow-400 bg-yellow-500/20",
    success: "text-green-400 bg-green-500/20"
  };
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(AnimatePresence, { children: isOpen && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(jsxDevRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
      motion.div,
      {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2 },
        className: "fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm",
        onClick: onCancel
      },
      void 0,
      false,
      {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ConfirmationModal.tsx",
        lineNumber: 43,
        columnNumber: 11
      },
      void 0
    ),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
      motion.div,
      {
        initial: { opacity: 0, scale: 0.9, y: 20 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.9, y: 20 },
        transition: { type: "spring", damping: 25, stiffness: 300 },
        className: "fixed inset-0 z-50 flex items-center justify-center p-4",
        onClick: (e) => e.stopPropagation(),
        children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between mb-4", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              motion.h3,
              {
                initial: { x: -10, opacity: 0 },
                animate: { x: 0, opacity: 1 },
                transition: { delay: 0.1 },
                className: "text-xl font-bold text-white flex items-center gap-3",
                children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                    motion.span,
                    {
                      initial: { scale: 0 },
                      animate: { scale: 1 },
                      transition: { type: "spring", delay: 0.2 },
                      className: `${iconColors[confirmColor]} p-2.5 rounded-xl`,
                      children: [
                        confirmColor === "danger" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" }, void 0, false, {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ConfirmationModal.tsx",
                          lineNumber: 75,
                          columnNumber: 25
                        }, void 0) }, void 0, false, {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ConfirmationModal.tsx",
                          lineNumber: 74,
                          columnNumber: 23
                        }, void 0),
                        confirmColor === "success" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" }, void 0, false, {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ConfirmationModal.tsx",
                          lineNumber: 80,
                          columnNumber: 25
                        }, void 0) }, void 0, false, {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ConfirmationModal.tsx",
                          lineNumber: 79,
                          columnNumber: 23
                        }, void 0),
                        confirmColor === "warning" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" }, void 0, false, {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ConfirmationModal.tsx",
                          lineNumber: 85,
                          columnNumber: 25
                        }, void 0) }, void 0, false, {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ConfirmationModal.tsx",
                          lineNumber: 84,
                          columnNumber: 23
                        }, void 0),
                        confirmColor === "primary" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }, void 0, false, {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ConfirmationModal.tsx",
                          lineNumber: 90,
                          columnNumber: 25
                        }, void 0) }, void 0, false, {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ConfirmationModal.tsx",
                          lineNumber: 89,
                          columnNumber: 23
                        }, void 0)
                      ]
                    },
                    void 0,
                    true,
                    {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ConfirmationModal.tsx",
                      lineNumber: 67,
                      columnNumber: 19
                    },
                    void 0
                  ),
                  title
                ]
              },
              void 0,
              true,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ConfirmationModal.tsx",
                lineNumber: 61,
                columnNumber: 17
              },
              void 0
            ),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              motion.button,
              {
                whileHover: { scale: 1.1, rotate: 90 },
                whileTap: { scale: 0.9 },
                onClick: onCancel,
                className: "text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-gray-700/50 transition-colors",
                children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M6 18L18 6M6 6l12 12" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ConfirmationModal.tsx",
                  lineNumber: 103,
                  columnNumber: 21
                }, void 0) }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ConfirmationModal.tsx",
                  lineNumber: 102,
                  columnNumber: 19
                }, void 0)
              },
              void 0,
              false,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ConfirmationModal.tsx",
                lineNumber: 96,
                columnNumber: 17
              },
              void 0
            )
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ConfirmationModal.tsx",
            lineNumber: 60,
            columnNumber: 15
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            motion.div,
            {
              initial: { y: 10, opacity: 0 },
              animate: { y: 0, opacity: 1 },
              transition: { delay: 0.2 },
              className: "mb-6",
              children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-gray-300 leading-relaxed", children: message }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ConfirmationModal.tsx",
                lineNumber: 114,
                columnNumber: 17
              }, void 0)
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ConfirmationModal.tsx",
              lineNumber: 108,
              columnNumber: 15
            },
            void 0
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            motion.div,
            {
              initial: { y: 10, opacity: 0 },
              animate: { y: 0, opacity: 1 },
              transition: { delay: 0.3 },
              className: "flex justify-end gap-3",
              children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  motion.button,
                  {
                    whileHover: { scale: 1.05 },
                    whileTap: { scale: 0.95 },
                    onClick: onCancel,
                    className: "px-5 py-2.5 bg-gray-700/50 text-gray-300 rounded-xl hover:bg-gray-600/50 transition-all font-medium border border-gray-600/50",
                    children: cancelText
                  },
                  void 0,
                  false,
                  {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ConfirmationModal.tsx",
                    lineNumber: 123,
                    columnNumber: 17
                  },
                  void 0
                ),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  motion.button,
                  {
                    whileHover: { scale: 1.05 },
                    whileTap: { scale: 0.95 },
                    onClick: onConfirm,
                    className: `px-5 py-2.5 text-white rounded-xl transition-all font-medium shadow-lg ${colorClasses[confirmColor]}`,
                    children: confirmText
                  },
                  void 0,
                  false,
                  {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ConfirmationModal.tsx",
                    lineNumber: 131,
                    columnNumber: 17
                  },
                  void 0
                )
              ]
            },
            void 0,
            true,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ConfirmationModal.tsx",
              lineNumber: 117,
              columnNumber: 15
            },
            void 0
          )
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ConfirmationModal.tsx",
          lineNumber: 59,
          columnNumber: 13
        }, void 0)
      },
      void 0,
      false,
      {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ConfirmationModal.tsx",
        lineNumber: 51,
        columnNumber: 11
      },
      void 0
    )
  ] }, void 0, true, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ConfirmationModal.tsx",
    lineNumber: 42,
    columnNumber: 9
  }, void 0) }, void 0, false, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ConfirmationModal.tsx",
    lineNumber: 40,
    columnNumber: 5
  }, void 0);
};
export {
  ConfirmationModal as C
};
