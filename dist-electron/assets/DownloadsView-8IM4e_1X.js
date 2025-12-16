import { r as reactExports, j as jsxDevRuntimeExports, n as notificationService } from "./index-DCN5ppN-.js";
import { C as Card } from "./Card-B_zN5Lyn.js";
import { B as Button } from "./Button-CWZnMI0W.js";
import { i as integratedDownloadService } from "./integratedDownloadService-qgbuKPpj.js";
import { m as motion } from "./proxy-BzxWFDJy.js";
const DownloadsView = () => {
  const [activeDownloads, setActiveDownloads] = reactExports.useState([]);
  const [completedDownloads, setCompletedDownloads] = reactExports.useState([]);
  const [logs, setLogs] = reactExports.useState([]);
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const [activeTab, setActiveTab] = reactExports.useState("active");
  const [overallProgress, setOverallProgress] = reactExports.useState(null);
  const [stats, setStats] = reactExports.useState(null);
  const [incompleteDownloads, setIncompleteDownloads] = reactExports.useState([]);
  const [resumingDownload, setResumingDownload] = reactExports.useState(null);
  reactExports.useEffect(() => {
    loadInitialData();
    loadIncompleteDownloads();
    const progressInterval = setInterval(async () => {
      try {
        const progressStatuses = await integratedDownloadService.getDownloadStatuses();
        const active = progressStatuses.filter(
          (d) => d.status === "in-progress" || d.status === "pending"
        );
        setActiveDownloads(active);
        const overall = await integratedDownloadService.getOverallProgress();
        setOverallProgress(overall);
        const statsData = await integratedDownloadService.getLogStats();
        setStats(statsData);
      } catch (err) {
        console.error("Error updating progress:", err);
      }
    }, 1e3);
    const logsInterval = setInterval(async () => {
      try {
        const recentLogs = await integratedDownloadService.getRecentLogs(50);
        setLogs(recentLogs);
        const completedEvents = recentLogs.filter(
          (log) => log.type === "download" || log.type === "install" || log.type === "success"
        );
        setCompletedDownloads(completedEvents);
      } catch (err) {
        console.error("Error updating logs:", err);
      }
    }, 2e3);
    return () => {
      clearInterval(progressInterval);
      clearInterval(logsInterval);
    };
  }, []);
  const loadIncompleteDownloads = async () => {
    try {
      const incomplete = await integratedDownloadService.getIncompleteDownloads();
      setIncompleteDownloads(incomplete);
      if (incomplete.length > 0) {
        console.log(`[DownloadsView] Encontradas ${incomplete.length} descargas incompletas`);
      }
    } catch (err) {
      console.error("Error cargando descargas incompletas:", err);
    }
  };
  const handleResumeDownload = async (downloadId) => {
    try {
      setResumingDownload(downloadId);
      await integratedDownloadService.resumeDownload(downloadId);
      await loadIncompleteDownloads();
      notificationService.showNotification({
        type: "success",
        title: "Descarga reanudada",
        message: "La descarga se ha reanudado correctamente.",
        duration: 3e3
      });
    } catch (error) {
      console.error("Error al reanudar descarga:", error);
      notificationService.showNotification({
        type: "error",
        title: "Error al reanudar",
        message: `No se pudo reanudar la descarga: ${error.message}`,
        duration: 4e3
      });
    } finally {
      setResumingDownload(null);
    }
  };
  const loadInitialData = async () => {
    try {
      const progressStatuses = await integratedDownloadService.getDownloadStatuses();
      const active = progressStatuses.filter(
        (d) => d.status === "in-progress" || d.status === "pending"
      );
      setActiveDownloads(active);
      const overall = await integratedDownloadService.getOverallProgress();
      setOverallProgress(overall);
      const recentLogs = await integratedDownloadService.getRecentLogs(50);
      setLogs(recentLogs);
      const statsData = await integratedDownloadService.getLogStats();
      setStats(statsData);
      const completedEvents = recentLogs.filter(
        (log) => log.type === "download" || log.type === "install" || log.type === "success"
      );
      setCompletedDownloads(completedEvents);
    } catch (err) {
      console.error("Error loading initial data:", err);
    }
  };
  const filteredLogs = logs.filter(
    (log) => log.message.toLowerCase().includes(searchTerm.toLowerCase()) || log.target && log.target.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredCompleted = completedDownloads.filter(
    (log) => log.message.toLowerCase().includes(searchTerm.toLowerCase()) || log.target && log.target.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const handleClearCompleted = () => {
    setCompletedDownloads([]);
  };
  const formatSpeed = (bytesPerSecond) => {
    if (bytesPerSecond === 0) return "0 B/s";
    const k = 1024;
    const sizes = ["B/s", "KB/s", "MB/s", "GB/s"];
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
    return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };
  const formatTimeRemaining = (ms) => {
    if (!ms || ms <= 0) return "";
    const seconds = Math.floor(ms / 1e3);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "text-green-500";
      case "error":
        return "text-red-500";
      case "in-progress":
        return "text-blue-500";
      case "pending":
        return "text-yellow-500";
      case "cancelled":
        return "text-gray-500";
      default:
        return "text-gray-500";
    }
  };
  const getLogTypeColor = (type) => {
    switch (type) {
      case "success":
        return "text-green-500";
      case "error":
        return "text-red-500";
      case "warning":
        return "text-yellow-500";
      case "info":
        return "text-blue-500";
      case "progress":
        return "text-purple-500";
      case "download":
        return "text-cyan-500";
      case "install":
        return "text-emerald-500";
      case "launch":
        return "text-orange-500";
      default:
        return "text-gray-500";
    }
  };
  const getLogTypeIcon = (type) => {
    switch (type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      case "progress":
        return "🔄";
      case "download":
        return "📥";
      case "install":
        return "⚙️";
      case "launch":
        return "🚀";
      default:
        return "📄";
    }
  };
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-6", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Card, { children: [
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex flex-col gap-4 mb-6", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h2", { className: "text-2xl font-bold text-gray-200 flex items-center gap-2", children: [
            "Progreso y Descargas",
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-xs font-semibold text-gray-400 bg-gray-800/80 px-2 py-0.5 rounded-full", children: [
              activeDownloads.length,
              " activas · ",
              completedDownloads.length,
              " completadas"
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
              lineNumber: 277,
              columnNumber: 17
            }, void 0)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 275,
            columnNumber: 15
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-xs text-gray-500 mt-1", children: "Seguimiento en tiempo real de todas las operaciones" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 281,
            columnNumber: 15
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
          lineNumber: 274,
          columnNumber: 13
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "input",
            {
              type: "text",
              placeholder: "Buscar en registros...",
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value),
              className: "px-4 py-2 rounded-lg bg-gray-800/80 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
              lineNumber: 286,
              columnNumber: 15
            },
            void 0
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            Button,
            {
              variant: "secondary",
              onClick: handleClearCompleted,
              disabled: completedDownloads.length === 0,
              children: "Limpiar historial"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
              lineNumber: 293,
              columnNumber: 15
            },
            void 0
          )
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
          lineNumber: 285,
          columnNumber: 13
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
        lineNumber: 273,
        columnNumber: 11
      }, void 0),
      overallProgress && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/50 p-4 rounded-xl border border-gray-700/50", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-center mb-2", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-sm font-medium text-gray-300", children: "Progreso general:" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 307,
            columnNumber: 17
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-sm font-semibold text-blue-400", children: [
            Math.round(overallProgress.progress * 100),
            "%"
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 308,
            columnNumber: 17
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
          lineNumber: 306,
          columnNumber: 15
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-full bg-gray-700 rounded-full h-3", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "div",
          {
            className: "bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300 ease-out",
            style: { width: `${overallProgress.progress * 100}%` }
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 311,
            columnNumber: 17
          },
          void 0
        ) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
          lineNumber: 310,
          columnNumber: 15
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-2 text-xs text-gray-400 flex justify-between", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: overallProgress.statusText }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 317,
            columnNumber: 17
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: [
            overallProgress.activeOperations,
            " operaciones activas"
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 318,
            columnNumber: 17
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
          lineNumber: 316,
          columnNumber: 15
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
        lineNumber: 305,
        columnNumber: 13
      }, void 0),
      stats && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/40 p-3 rounded-lg border border-gray-700/50 text-center", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-lg font-bold text-blue-400", children: stats.totalLogs }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 327,
            columnNumber: 17
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-400", children: "Registros" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 328,
            columnNumber: 17
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
          lineNumber: 326,
          columnNumber: 15
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/40 p-3 rounded-lg border border-gray-700/50 text-center", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-lg font-bold text-purple-400", children: stats.activeDownloads }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 331,
            columnNumber: 17
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-400", children: "Descargas activas" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 332,
            columnNumber: 17
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
          lineNumber: 330,
          columnNumber: 15
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/40 p-3 rounded-lg border border-gray-700/50 text-center", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-lg font-bold text-emerald-400", children: stats.recentLogs }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 335,
            columnNumber: 17
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-400", children: "Recientes" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 336,
            columnNumber: 17
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
          lineNumber: 334,
          columnNumber: 15
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/40 p-3 rounded-lg border border-gray-700/50 text-center", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-lg font-bold text-amber-400", children: stats.totalProgressUpdates }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 339,
            columnNumber: 17
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-400", children: "Actualizaciones" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 340,
            columnNumber: 17
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
          lineNumber: 338,
          columnNumber: 15
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
        lineNumber: 325,
        columnNumber: 13
      }, void 0),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "inline-flex items-center bg-gray-900/80 border border-gray-700/70 rounded-2xl p-1 text-xs text-gray-300 self-start", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: () => setActiveTab("active"),
            className: `px-3 py-1 rounded-xl transition-all ${activeTab === "active" ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-black shadow-sm" : "text-gray-400 hover:text-gray-200"}`,
            children: "Activas"
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 346,
            columnNumber: 13
          },
          void 0
        ),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: () => setActiveTab("completed"),
            className: `ml-1 px-3 py-1 rounded-xl transition-all ${activeTab === "completed" ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-black shadow-sm" : "text-gray-400 hover:text-gray-200"}`,
            children: "Completadas"
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 356,
            columnNumber: 13
          },
          void 0
        ),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: () => setActiveTab("logs"),
            className: `ml-1 px-3 py-1 rounded-xl transition-all ${activeTab === "logs" ? "bg-gradient-to-r from-purple-500 to-pink-600 text-black shadow-sm" : "text-gray-400 hover:text-gray-200"}`,
            children: "Registros"
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 366,
            columnNumber: 13
          },
          void 0
        )
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
        lineNumber: 345,
        columnNumber: 11
      }, void 0)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
      lineNumber: 272,
      columnNumber: 9
    }, void 0),
    activeTab === "active" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mb-8", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between mb-4", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-xl font-semibold text-gray-200 flex items-center", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "mr-2", children: "📥" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 384,
            columnNumber: 17
          }, void 0),
          " Descargas Activas",
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "ml-2 text-sm text-gray-400 bg-gray-700/50 py-0.5 px-2 rounded-full", children: activeDownloads.length + incompleteDownloads.length }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 385,
            columnNumber: 17
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
          lineNumber: 383,
          columnNumber: 15
        }, void 0),
        incompleteDownloads.length > 0 && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: loadIncompleteDownloads,
            className: "text-xs text-blue-400 hover:text-blue-300 transition-colors",
            children: "Actualizar"
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 390,
            columnNumber: 17
          },
          void 0
        )
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
        lineNumber: 382,
        columnNumber: 13
      }, void 0),
      incompleteDownloads.length > 0 && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mb-6 space-y-4", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h4", { className: "text-sm font-medium text-yellow-400 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: "⚠️" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 403,
            columnNumber: 19
          }, void 0),
          " Descargas Incompletas (",
          incompleteDownloads.length,
          ")"
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
          lineNumber: 402,
          columnNumber: 17
        }, void 0),
        incompleteDownloads.map((download) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          motion.div,
          {
            initial: { opacity: 0, x: -20 },
            animate: { opacity: 1, x: 0 },
            className: "p-5 bg-gradient-to-br from-yellow-900/20 to-orange-900/20 backdrop-blur-sm rounded-xl border border-yellow-700/50 hover:border-yellow-500/50 transition-all duration-300 shadow-lg",
            children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-start mb-3", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-2 mb-1", children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "font-semibold text-gray-100 truncate", children: download.instanceName }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                    lineNumber: 415,
                    columnNumber: 27
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-xs px-2.5 py-1 rounded-full font-medium text-yellow-400 bg-yellow-500/20 border border-yellow-500/30", children: [
                    download.loader,
                    " ",
                    download.mcVersion
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                    lineNumber: 416,
                    columnNumber: 27
                  }, void 0)
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                  lineNumber: 414,
                  columnNumber: 25
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-sm text-gray-400 mt-1", children: download.currentStep }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                  lineNumber: 420,
                  columnNumber: 25
                }, void 0),
                download.error && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-red-400 mt-1", children: [
                  "Error: ",
                  download.error
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                  lineNumber: 424,
                  columnNumber: 27
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                lineNumber: 413,
                columnNumber: 23
              }, void 0) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                lineNumber: 412,
                columnNumber: 21
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mb-3", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-full bg-gray-700/50 rounded-full h-3.5 overflow-hidden", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  motion.div,
                  {
                    initial: { width: 0 },
                    animate: { width: `${download.progress * 100}%` },
                    className: "bg-gradient-to-r from-yellow-500 to-orange-500 h-3.5 rounded-full"
                  },
                  void 0,
                  false,
                  {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                    lineNumber: 433,
                    columnNumber: 25
                  },
                  void 0
                ) }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                  lineNumber: 432,
                  columnNumber: 23
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-center text-xs text-gray-400 mt-2", children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: [
                    Math.round(download.progress * 100),
                    "%"
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                    lineNumber: 440,
                    columnNumber: 25
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: [
                    download.completedSteps,
                    " / ",
                    download.totalSteps,
                    " pasos"
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                    lineNumber: 441,
                    columnNumber: 25
                  }, void 0)
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                  lineNumber: 439,
                  columnNumber: 23
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                lineNumber: 431,
                columnNumber: 21
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-center pt-2 border-t border-gray-700/50", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-500", children: [
                  "Iniciada: ",
                  new Date(download.startedAt).toLocaleString()
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                  lineNumber: 446,
                  columnNumber: 23
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  motion.button,
                  {
                    whileHover: { scale: 1.05 },
                    whileTap: { scale: 0.95 },
                    onClick: () => handleResumeDownload(download.id),
                    disabled: resumingDownload === download.id,
                    className: "px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-all text-sm font-medium border border-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2",
                    children: resumingDownload === download.id ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(jsxDevRuntimeExports.Fragment, { children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "animate-spin h-4 w-4", fill: "none", viewBox: "0 0 24 24", children: [
                        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }, void 0, false, {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                          lineNumber: 459,
                          columnNumber: 31
                        }, void 0),
                        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" }, void 0, false, {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                          lineNumber: 460,
                          columnNumber: 31
                        }, void 0)
                      ] }, void 0, true, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                        lineNumber: 458,
                        columnNumber: 29
                      }, void 0),
                      "Reanudando..."
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                      lineNumber: 457,
                      columnNumber: 27
                    }, void 0) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(jsxDevRuntimeExports.Fragment, { children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: [
                        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" }, void 0, false, {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                          lineNumber: 467,
                          columnNumber: 31
                        }, void 0),
                        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }, void 0, false, {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                          lineNumber: 468,
                          columnNumber: 31
                        }, void 0)
                      ] }, void 0, true, {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                        lineNumber: 466,
                        columnNumber: 29
                      }, void 0),
                      "Reanudar Descarga"
                    ] }, void 0, true, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                      lineNumber: 465,
                      columnNumber: 27
                    }, void 0)
                  },
                  void 0,
                  false,
                  {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                    lineNumber: 449,
                    columnNumber: 23
                  },
                  void 0
                )
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                lineNumber: 445,
                columnNumber: 21
              }, void 0)
            ]
          },
          download.id,
          true,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 406,
            columnNumber: 19
          },
          void 0
        ))
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
        lineNumber: 401,
        columnNumber: 15
      }, void 0),
      activeDownloads.length === 0 ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
        motion.div,
        {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          className: "text-center py-12 text-gray-500 bg-gradient-to-br from-gray-800/30 to-gray-900/30 rounded-xl border border-dashed border-gray-700/50",
          children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-4xl mb-3", children: "📭" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
              lineNumber: 485,
              columnNumber: 17
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-gray-400", children: "No hay descargas activas en este momento" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
              lineNumber: 486,
              columnNumber: 17
            }, void 0)
          ]
        },
        void 0,
        true,
        {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
          lineNumber: 480,
          columnNumber: 15
        },
        void 0
      ) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-4", children: activeDownloads.map((download, index) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
        motion.div,
        {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { delay: index * 0.1 },
          className: "p-5 bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 shadow-lg hover:shadow-blue-500/10",
          children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-2 mb-1", children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "font-semibold text-gray-100 truncate", children: download.target || download.operation }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                    lineNumber: 501,
                    columnNumber: 27
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                    motion.span,
                    {
                      animate: { scale: [1, 1.1, 1] },
                      transition: { repeat: Infinity, duration: 2 },
                      className: `text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(download.status)} bg-opacity-20 border border-current border-opacity-30`,
                      children: download.status === "in-progress" ? "Descargando..." : download.status
                    },
                    void 0,
                    false,
                    {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                      lineNumber: 502,
                      columnNumber: 27
                    },
                    void 0
                  )
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                  lineNumber: 500,
                  columnNumber: 25
                }, void 0),
                download.details && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-sm text-gray-400 mt-1 truncate", children: download.details }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                  lineNumber: 511,
                  columnNumber: 27
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                lineNumber: 499,
                columnNumber: 23
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-right text-sm text-blue-400 whitespace-nowrap ml-4 font-medium", children: download.speed && formatSpeed(download.speed) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                lineNumber: 514,
                columnNumber: 23
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
              lineNumber: 498,
              columnNumber: 21
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mb-3", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-full bg-gray-700/50 rounded-full h-3.5 overflow-hidden", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                motion.div,
                {
                  initial: { width: 0 },
                  animate: { width: `${download.progress * 100}%` },
                  transition: { duration: 0.5, ease: "easeOut" },
                  className: `h-3.5 rounded-full relative ${download.status === "completed" ? "bg-gradient-to-r from-green-500 to-emerald-500" : download.status === "error" ? "bg-gradient-to-r from-red-500 to-rose-500" : download.status === "pending" ? "bg-gradient-to-r from-yellow-500 to-amber-500" : "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600"}`,
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
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                      lineNumber: 532,
                      columnNumber: 27
                    },
                    void 0
                  )
                },
                void 0,
                false,
                {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                  lineNumber: 521,
                  columnNumber: 25
                },
                void 0
              ) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                lineNumber: 520,
                columnNumber: 23
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-center text-xs text-gray-400 mt-2", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: [
                  Math.round(download.progress * 100),
                  "%"
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                  lineNumber: 540,
                  columnNumber: 25
                }, void 0),
                download.estimatedTimeRemaining && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-blue-400", children: [
                  "Quedan: ",
                  formatTimeRemaining(download.estimatedTimeRemaining)
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                  lineNumber: 542,
                  columnNumber: 27
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                lineNumber: 539,
                columnNumber: 23
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
              lineNumber: 519,
              columnNumber: 21
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-gray-700/50", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-gray-400", children: [
                  download.current,
                  " / ",
                  download.total
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                  lineNumber: 551,
                  columnNumber: 25
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-gray-600", children: "•" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                  lineNumber: 552,
                  columnNumber: 25
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-gray-400", children: download.operation }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                  lineNumber: 553,
                  columnNumber: 25
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                lineNumber: 550,
                columnNumber: 23
              }, void 0),
              download.status === "error" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                motion.button,
                {
                  whileHover: { scale: 1.05 },
                  whileTap: { scale: 0.95 },
                  onClick: () => {
                    console.log("Reanudar descarga:", download.id);
                  },
                  className: "px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-all text-xs font-medium border border-blue-500/30",
                  children: "Reintentar"
                },
                void 0,
                false,
                {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                  lineNumber: 556,
                  columnNumber: 25
                },
                void 0
              )
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
              lineNumber: 549,
              columnNumber: 21
            }, void 0)
          ]
        },
        download.id,
        true,
        {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
          lineNumber: 491,
          columnNumber: 19
        },
        void 0
      )) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
        lineNumber: 489,
        columnNumber: 15
      }, void 0)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
      lineNumber: 381,
      columnNumber: 11
    }, void 0),
    activeTab === "completed" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-xl font-semibold text-gray-200 mb-4 flex items-center", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "mr-2", children: "✅" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
          lineNumber: 580,
          columnNumber: 15
        }, void 0),
        " Tareas Completadas",
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "ml-2 text-sm text-gray-400 bg-gray-700/50 py-0.5 px-2 rounded-full", children: completedDownloads.length }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
          lineNumber: 581,
          columnNumber: 15
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
        lineNumber: 579,
        columnNumber: 13
      }, void 0),
      filteredCompleted.length === 0 ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-center py-10 text-gray-500 border border-dashed border-gray-700/70 rounded-2xl bg-gray-900/40", children: "No hay tareas completadas todavía." }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
        lineNumber: 586,
        columnNumber: 15
      }, void 0) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: filteredCompleted.map((log) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
        "div",
        {
          className: "p-4 bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/70 shadow-sm flex flex-col gap-3",
          children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-start justify-between gap-2", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "min-w-0", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-start gap-2", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-lg", children: getLogTypeIcon(log.type) }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                  lineNumber: 599,
                  columnNumber: 27
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h4", { className: "font-medium text-gray-100 truncate", title: log.message, children: log.message }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                    lineNumber: 601,
                    columnNumber: 29
                  }, void 0),
                  log.target && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-400 mt-1", children: [
                    "Objetivo: ",
                    log.target
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                    lineNumber: 603,
                    columnNumber: 31
                  }, void 0)
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                  lineNumber: 600,
                  columnNumber: 27
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                lineNumber: 598,
                columnNumber: 25
              }, void 0) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                lineNumber: 597,
                columnNumber: 23
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: `inline-flex items-center justify-center w-6 h-6 rounded-full ${getLogTypeColor(log.type)}/20 ${getLogTypeColor(log.type)} text-xs`, children: "✓" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                lineNumber: 610,
                columnNumber: 23
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
              lineNumber: 596,
              columnNumber: 21
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between text-xs text-gray-500", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: new Date(log.timestamp).toLocaleString() }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
              lineNumber: 615,
              columnNumber: 23
            }, void 0) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
              lineNumber: 614,
              columnNumber: 21
            }, void 0)
          ]
        },
        log.id,
        true,
        {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
          lineNumber: 592,
          columnNumber: 19
        },
        void 0
      )) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
        lineNumber: 590,
        columnNumber: 15
      }, void 0)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
      lineNumber: 578,
      columnNumber: 11
    }, void 0),
    activeTab === "logs" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-xl font-semibold text-gray-200 mb-4 flex items-center", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "mr-2", children: "📋" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
          lineNumber: 630,
          columnNumber: 15
        }, void 0),
        " Registros de Actividad",
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "ml-2 text-sm text-gray-400 bg-gray-700/50 py-0.5 px-2 rounded-full", children: logs.length }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
          lineNumber: 631,
          columnNumber: 15
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
        lineNumber: 629,
        columnNumber: 13
      }, void 0),
      filteredLogs.length === 0 ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-center py-10 text-gray-500 border border-dashed border-gray-700/70 rounded-2xl bg-gray-900/40", children: "No hay registros de actividad todavía." }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
        lineNumber: 636,
        columnNumber: 15
      }, void 0) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-2 max-h-96 overflow-y-auto", children: filteredLogs.map((log) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
        "div",
        {
          className: `p-3 rounded-lg border-l-4 ${log.type === "error" ? "border-red-500 bg-red-900/20" : log.type === "success" ? "border-green-500 bg-green-900/20" : log.type === "warning" ? "border-yellow-500 bg-yellow-900/20" : log.type === "info" ? "border-blue-500 bg-blue-900/20" : log.type === "progress" ? "border-purple-500 bg-purple-900/20" : log.type === "download" ? "border-cyan-500 bg-cyan-900/20" : log.type === "install" ? "border-emerald-500 bg-emerald-900/20" : log.type === "launch" ? "border-orange-500 bg-orange-900/20" : "border-gray-500 bg-gray-900/20"}`,
          children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-start", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "mr-3 text-lg", children: getLogTypeIcon(log.type) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
              lineNumber: 657,
              columnNumber: 23
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: `font-medium ${getLogTypeColor(log.type)}`, children: log.message }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                  lineNumber: 660,
                  columnNumber: 27
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-xs text-gray-500", children: new Date(log.timestamp).toLocaleTimeString() }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                  lineNumber: 663,
                  columnNumber: 27
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                lineNumber: 659,
                columnNumber: 25
              }, void 0),
              log.target && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-sm text-gray-400 mt-1", children: log.target }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                lineNumber: 668,
                columnNumber: 27
              }, void 0),
              log.details && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-500 mt-1 bg-black/20 p-2 rounded", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("pre", { className: "whitespace-pre-wrap break-words", children: JSON.stringify(log.details, null, 2) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                lineNumber: 674,
                columnNumber: 29
              }, void 0) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                lineNumber: 673,
                columnNumber: 27
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
              lineNumber: 658,
              columnNumber: 23
            }, void 0)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 656,
            columnNumber: 21
          }, void 0)
        },
        log.id,
        false,
        {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
          lineNumber: 642,
          columnNumber: 19
        },
        void 0
      )) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
        lineNumber: 640,
        columnNumber: 15
      }, void 0)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
      lineNumber: 628,
      columnNumber: 11
    }, void 0)
  ] }, void 0, true, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
    lineNumber: 271,
    columnNumber: 7
  }, void 0) }, void 0, false, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
    lineNumber: 270,
    columnNumber: 5
  }, void 0);
};
export {
  DownloadsView as default
};
