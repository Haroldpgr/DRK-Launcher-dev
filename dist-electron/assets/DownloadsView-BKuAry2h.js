import { r as reactExports, j as jsxDevRuntimeExports } from "./index-E8XQzyG6.js";
import { C as Card } from "./Card--eQnLex7.js";
import { B as Button } from "./Button-CIFNF4_r.js";
import { i as integratedDownloadService } from "./integratedDownloadService-C3tlNEKn.js";
const DownloadsView = () => {
  const [activeDownloads, setActiveDownloads] = reactExports.useState([]);
  const [completedDownloads, setCompletedDownloads] = reactExports.useState([]);
  const [logs, setLogs] = reactExports.useState([]);
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const [activeTab, setActiveTab] = reactExports.useState("active");
  const [overallProgress, setOverallProgress] = reactExports.useState(null);
  const [stats, setStats] = reactExports.useState(null);
  reactExports.useEffect(() => {
    loadInitialData();
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
              lineNumber: 212,
              columnNumber: 17
            }, void 0)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 210,
            columnNumber: 15
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-xs text-gray-500 mt-1", children: "Seguimiento en tiempo real de todas las operaciones" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 216,
            columnNumber: 15
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
          lineNumber: 209,
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
              lineNumber: 221,
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
              lineNumber: 228,
              columnNumber: 15
            },
            void 0
          )
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
          lineNumber: 220,
          columnNumber: 13
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
        lineNumber: 208,
        columnNumber: 11
      }, void 0),
      overallProgress && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/50 p-4 rounded-xl border border-gray-700/50", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-center mb-2", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-sm font-medium text-gray-300", children: "Progreso general:" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 242,
            columnNumber: 17
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-sm font-semibold text-blue-400", children: [
            Math.round(overallProgress.progress * 100),
            "%"
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 243,
            columnNumber: 17
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
          lineNumber: 241,
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
            lineNumber: 246,
            columnNumber: 17
          },
          void 0
        ) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
          lineNumber: 245,
          columnNumber: 15
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-2 text-xs text-gray-400 flex justify-between", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: overallProgress.statusText }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 252,
            columnNumber: 17
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: [
            overallProgress.activeOperations,
            " operaciones activas"
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 253,
            columnNumber: 17
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
          lineNumber: 251,
          columnNumber: 15
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
        lineNumber: 240,
        columnNumber: 13
      }, void 0),
      stats && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/40 p-3 rounded-lg border border-gray-700/50 text-center", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-lg font-bold text-blue-400", children: stats.totalLogs }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 262,
            columnNumber: 17
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-400", children: "Registros" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 263,
            columnNumber: 17
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
          lineNumber: 261,
          columnNumber: 15
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/40 p-3 rounded-lg border border-gray-700/50 text-center", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-lg font-bold text-purple-400", children: stats.activeDownloads }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 266,
            columnNumber: 17
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-400", children: "Descargas activas" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 267,
            columnNumber: 17
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
          lineNumber: 265,
          columnNumber: 15
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/40 p-3 rounded-lg border border-gray-700/50 text-center", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-lg font-bold text-emerald-400", children: stats.recentLogs }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 270,
            columnNumber: 17
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-400", children: "Recientes" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 271,
            columnNumber: 17
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
          lineNumber: 269,
          columnNumber: 15
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/40 p-3 rounded-lg border border-gray-700/50 text-center", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-lg font-bold text-amber-400", children: stats.totalProgressUpdates }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 274,
            columnNumber: 17
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-400", children: "Actualizaciones" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 275,
            columnNumber: 17
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
          lineNumber: 273,
          columnNumber: 15
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
        lineNumber: 260,
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
            lineNumber: 281,
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
            lineNumber: 291,
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
            lineNumber: 301,
            columnNumber: 13
          },
          void 0
        )
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
        lineNumber: 280,
        columnNumber: 11
      }, void 0)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
      lineNumber: 207,
      columnNumber: 9
    }, void 0),
    activeTab === "active" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mb-8", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-xl font-semibold text-gray-200 mb-4 flex items-center", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "mr-2", children: "📥" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
          lineNumber: 318,
          columnNumber: 15
        }, void 0),
        " Descargas Activas",
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "ml-2 text-sm text-gray-400 bg-gray-700/50 py-0.5 px-2 rounded-full", children: activeDownloads.length }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
          lineNumber: 319,
          columnNumber: 15
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
        lineNumber: 317,
        columnNumber: 13
      }, void 0),
      activeDownloads.length === 0 ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-center py-8 text-gray-500 bg-gray-800/30 rounded-xl border border-dashed border-gray-700/50", children: "No hay descargas activas en este momento" }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
        lineNumber: 324,
        columnNumber: 15
      }, void 0) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-4", children: activeDownloads.map((download) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
        "div",
        {
          className: "p-4 bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700/50 transition-all duration-300",
          children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-start mb-2", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "font-medium text-gray-100 truncate", children: download.target || download.operation }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                    lineNumber: 337,
                    columnNumber: 27
                  }, void 0),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: `text-xs px-2 py-1 rounded-full ${getStatusColor(download.status)} bg-opacity-20`, children: download.status }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                    lineNumber: 338,
                    columnNumber: 27
                  }, void 0)
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                  lineNumber: 336,
                  columnNumber: 25
                }, void 0),
                download.details && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-sm text-gray-400 mt-1 truncate", children: download.details }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                  lineNumber: 343,
                  columnNumber: 27
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                lineNumber: 335,
                columnNumber: 23
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-right text-sm text-gray-400 whitespace-nowrap ml-4", children: download.speed && formatSpeed(download.speed) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                lineNumber: 346,
                columnNumber: 23
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
              lineNumber: 334,
              columnNumber: 21
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mb-2", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-full bg-gray-700 rounded-full h-3", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                "div",
                {
                  className: `h-3 rounded-full ${download.status === "completed" ? "bg-green-500" : download.status === "error" ? "bg-red-500" : download.status === "pending" ? "bg-yellow-500" : "bg-gradient-to-r from-blue-500 to-indigo-600"}`,
                  style: { width: `${download.progress * 100}%` }
                },
                void 0,
                false,
                {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                  lineNumber: 353,
                  columnNumber: 25
                },
                void 0
              ) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                lineNumber: 352,
                columnNumber: 23
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-right text-xs text-gray-400 mt-1", children: [
                Math.round(download.progress * 100),
                "%"
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                lineNumber: 363,
                columnNumber: 23
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
              lineNumber: 351,
              columnNumber: 21
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-center text-xs text-gray-500", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                download.current,
                " / ",
                download.total,
                " - ",
                download.operation
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                lineNumber: 369,
                columnNumber: 23
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex gap-2", children: download.estimatedTimeRemaining && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-gray-400", children: [
                "Quedan: ",
                formatTimeRemaining(download.estimatedTimeRemaining)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                lineNumber: 374,
                columnNumber: 27
              }, void 0) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                lineNumber: 372,
                columnNumber: 23
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
              lineNumber: 368,
              columnNumber: 21
            }, void 0)
          ]
        },
        download.id,
        true,
        {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
          lineNumber: 330,
          columnNumber: 19
        },
        void 0
      )) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
        lineNumber: 328,
        columnNumber: 15
      }, void 0)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
      lineNumber: 316,
      columnNumber: 11
    }, void 0),
    activeTab === "completed" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-xl font-semibold text-gray-200 mb-4 flex items-center", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "mr-2", children: "✅" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
          lineNumber: 391,
          columnNumber: 15
        }, void 0),
        " Tareas Completadas",
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "ml-2 text-sm text-gray-400 bg-gray-700/50 py-0.5 px-2 rounded-full", children: completedDownloads.length }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
          lineNumber: 392,
          columnNumber: 15
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
        lineNumber: 390,
        columnNumber: 13
      }, void 0),
      filteredCompleted.length === 0 ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-center py-10 text-gray-500 border border-dashed border-gray-700/70 rounded-2xl bg-gray-900/40", children: "No hay tareas completadas todavía." }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
        lineNumber: 397,
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
                  lineNumber: 410,
                  columnNumber: 27
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h4", { className: "font-medium text-gray-100 truncate", title: log.message, children: log.message }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                    lineNumber: 412,
                    columnNumber: 29
                  }, void 0),
                  log.target && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-400 mt-1", children: [
                    "Objetivo: ",
                    log.target
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                    lineNumber: 414,
                    columnNumber: 31
                  }, void 0)
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                  lineNumber: 411,
                  columnNumber: 27
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                lineNumber: 409,
                columnNumber: 25
              }, void 0) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                lineNumber: 408,
                columnNumber: 23
              }, void 0),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: `inline-flex items-center justify-center w-6 h-6 rounded-full ${getLogTypeColor(log.type)}/20 ${getLogTypeColor(log.type)} text-xs`, children: "✓" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                lineNumber: 421,
                columnNumber: 23
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
              lineNumber: 407,
              columnNumber: 21
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between text-xs text-gray-500", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: new Date(log.timestamp).toLocaleString() }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
              lineNumber: 426,
              columnNumber: 23
            }, void 0) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
              lineNumber: 425,
              columnNumber: 21
            }, void 0)
          ]
        },
        log.id,
        true,
        {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
          lineNumber: 403,
          columnNumber: 19
        },
        void 0
      )) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
        lineNumber: 401,
        columnNumber: 15
      }, void 0)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
      lineNumber: 389,
      columnNumber: 11
    }, void 0),
    activeTab === "logs" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-xl font-semibold text-gray-200 mb-4 flex items-center", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "mr-2", children: "📋" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
          lineNumber: 441,
          columnNumber: 15
        }, void 0),
        " Registros de Actividad",
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "ml-2 text-sm text-gray-400 bg-gray-700/50 py-0.5 px-2 rounded-full", children: logs.length }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
          lineNumber: 442,
          columnNumber: 15
        }, void 0)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
        lineNumber: 440,
        columnNumber: 13
      }, void 0),
      filteredLogs.length === 0 ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-center py-10 text-gray-500 border border-dashed border-gray-700/70 rounded-2xl bg-gray-900/40", children: "No hay registros de actividad todavía." }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
        lineNumber: 447,
        columnNumber: 15
      }, void 0) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-2 max-h-96 overflow-y-auto", children: filteredLogs.map((log) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
        "div",
        {
          className: `p-3 rounded-lg border-l-4 ${log.type === "error" ? "border-red-500 bg-red-900/20" : log.type === "success" ? "border-green-500 bg-green-900/20" : log.type === "warning" ? "border-yellow-500 bg-yellow-900/20" : log.type === "info" ? "border-blue-500 bg-blue-900/20" : log.type === "progress" ? "border-purple-500 bg-purple-900/20" : log.type === "download" ? "border-cyan-500 bg-cyan-900/20" : log.type === "install" ? "border-emerald-500 bg-emerald-900/20" : log.type === "launch" ? "border-orange-500 bg-orange-900/20" : "border-gray-500 bg-gray-900/20"}`,
          children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-start", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "mr-3 text-lg", children: getLogTypeIcon(log.type) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
              lineNumber: 468,
              columnNumber: 23
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: `font-medium ${getLogTypeColor(log.type)}`, children: log.message }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                  lineNumber: 471,
                  columnNumber: 27
                }, void 0),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-xs text-gray-500", children: new Date(log.timestamp).toLocaleTimeString() }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                  lineNumber: 474,
                  columnNumber: 27
                }, void 0)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                lineNumber: 470,
                columnNumber: 25
              }, void 0),
              log.target && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-sm text-gray-400 mt-1", children: log.target }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                lineNumber: 479,
                columnNumber: 27
              }, void 0),
              log.details && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-500 mt-1 bg-black/20 p-2 rounded", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("pre", { className: "whitespace-pre-wrap break-words", children: JSON.stringify(log.details, null, 2) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                lineNumber: 485,
                columnNumber: 29
              }, void 0) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
                lineNumber: 484,
                columnNumber: 27
              }, void 0)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
              lineNumber: 469,
              columnNumber: 23
            }, void 0)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
            lineNumber: 467,
            columnNumber: 21
          }, void 0)
        },
        log.id,
        false,
        {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
          lineNumber: 453,
          columnNumber: 19
        },
        void 0
      )) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
        lineNumber: 451,
        columnNumber: 15
      }, void 0)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
      lineNumber: 439,
      columnNumber: 11
    }, void 0)
  ] }, void 0, true, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
    lineNumber: 206,
    columnNumber: 7
  }, void 0) }, void 0, false, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/DownloadsView.tsx",
    lineNumber: 205,
    columnNumber: 5
  }, void 0);
};
export {
  DownloadsView as default
};
