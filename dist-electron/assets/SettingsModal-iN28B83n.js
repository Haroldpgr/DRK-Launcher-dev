var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { r as reactExports, j as jsxDevRuntimeExports, t as themeService, _ as __vitePreload } from "./index-Cab6GusZ.js";
import { javaDownloadService } from "./javaDownloadService-DfEudafe.js";
import { B as Button } from "./Button-CaIHDZQ5.js";
import "./downloadService-K7cBrIid.js";
const SETTINGS_KEY = "launcher_settings";
const DEFAULT_SETTINGS = {
  appearance: {
    theme: "dark",
    accentColor: "#3B82F6",
    // Azul por defecto
    advancedRendering: false,
    globalFontSize: 1,
    // 100% - tamaño base
    enableTransitions: true,
    backgroundOpacity: 0.3,
    borderRadius: 8,
    colorFilter: "none"
  },
  behavior: {
    minimizeOnLaunch: true,
    hideNametag: false,
    defaultLandingPage: "home",
    jumpBackWorlds: [],
    nativeDecorations: false,
    showRecentWorlds: true,
    closeAfterPlay: false,
    systemNotifications: true,
    backgroundFPSLimit: 30
  },
  privacy: {
    telemetryEnabled: true,
    discordRPC: true,
    personalizedAds: false,
    logLevel: "Info",
    forcedOfflineMode: false,
    privacyPolicyUrl: "https://example.com/privacy"
  },
  java: {
    defaultVersion: "17"
  }
};
function getStoredSettings() {
  const settingsJson = localStorage.getItem(SETTINGS_KEY);
  if (settingsJson) {
    try {
      const stored = JSON.parse(settingsJson);
      return deepMerge(DEFAULT_SETTINGS, stored);
    } catch (error) {
      console.error("Error parsing settings:", error);
      return DEFAULT_SETTINGS;
    }
  }
  return DEFAULT_SETTINGS;
}
function deepMerge(target, source) {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else if (Array.isArray(source[key]) && Array.isArray(target[key])) {
        output[key] = [...target[key], ...source[key]];
      } else if (source[key] !== void 0) {
        output[key] = source[key];
      }
    });
  }
  return output;
}
function isObject(item) {
  return item && typeof item === "object" && !Array.isArray(item);
}
function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
const settingsService = {
  getSettings() {
    return getStoredSettings();
  },
  updateSettings(updates) {
    const currentSettings = getStoredSettings();
    const newSettings = { ...currentSettings, ...updates };
    saveSettings(newSettings);
    return newSettings;
  },
  updateAppearance(updates) {
    const currentSettings = getStoredSettings();
    const newSettings = {
      ...currentSettings,
      appearance: { ...currentSettings.appearance, ...updates }
    };
    saveSettings(newSettings);
    return newSettings.appearance;
  },
  updateBehavior(updates) {
    const currentSettings = getStoredSettings();
    const newSettings = {
      ...currentSettings,
      behavior: { ...currentSettings.behavior, ...updates }
    };
    saveSettings(newSettings);
    return newSettings.behavior;
  },
  updatePrivacy(updates) {
    const currentSettings = getStoredSettings();
    const newSettings = {
      ...currentSettings,
      privacy: deepMerge(currentSettings.privacy, updates)
    };
    saveSettings(newSettings);
    return newSettings.privacy;
  },
  updateJava(updates) {
    const currentSettings = getStoredSettings();
    const newSettings = {
      ...currentSettings,
      java: { ...currentSettings.java, ...updates }
    };
    saveSettings(newSettings);
    return newSettings.java;
  },
  addJumpBackWorld(world) {
    const currentSettings = getStoredSettings();
    const existingWorlds = currentSettings.behavior.jumpBackWorlds || [];
    const filteredWorlds = existingWorlds.filter((w) => w.id !== world.id);
    const newWorlds = [world, ...filteredWorlds].slice(0, 10);
    const newSettings = {
      ...currentSettings,
      behavior: {
        ...currentSettings.behavior,
        jumpBackWorlds: newWorlds
      }
    };
    saveSettings(newSettings);
    return newSettings.behavior.jumpBackWorlds;
  }
};
function AppearanceSettings({ settings, onSettingsChange }) {
  const [systemTheme, setSystemTheme] = reactExports.useState("dark");
  const [customBackgroundPath, setCustomBackgroundPath] = reactExports.useState(settings.customBackgroundPath || "");
  reactExports.useEffect(() => {
    if (settings.theme === "system") {
      const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setSystemTheme(isDarkMode ? "dark" : "light");
    }
  }, [settings.theme]);
  const handleThemeChange = (theme) => {
    onSettingsChange({ theme });
  };
  const handleAccentColorChange = (color) => {
    onSettingsChange({ accentColor: color });
  };
  const handleFontSizeChange = (value) => {
    onSettingsChange({ globalFontSize: value });
  };
  const handleBorderRadiusChange = (value) => {
    onSettingsChange({ borderRadius: value });
  };
  const handleBackgroundOpacityChange = (value) => {
    onSettingsChange({ backgroundOpacity: value });
  };
  const handleColorFilterChange = (filter) => {
    onSettingsChange({ colorFilter: filter });
  };
  const handleBrowseBackground = async () => {
    if (window.api && window.api.java) {
      try {
        const result = await window.api.java.explore();
        if (result) {
          setCustomBackgroundPath(result);
          onSettingsChange({ customBackgroundPath: result });
        }
      } catch (error) {
        console.error("Error selecting background:", error);
        alert("Error al seleccionar la imagen de fondo");
      }
    } else {
      alert("API no disponible");
    }
  };
  const handleResetThemes = () => {
    themeService.resetToDefaults();
    onSettingsChange({
      theme: "dark",
      accentColor: "#3B82F6",
      advancedRendering: false,
      globalFontSize: 1,
      enableTransitions: true,
      backgroundOpacity: 0.3,
      borderRadius: 8,
      colorFilter: "none"
    });
    setCustomBackgroundPath("");
  };
  const getRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-semibold text-gray-200 mb-3", children: "Tema" }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
        lineNumber: 92,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: () => handleThemeChange("dark"),
            className: `p-4 rounded-xl border-2 transition-all duration-300 ${settings.theme === "dark" ? "border-blue-500 bg-blue-900/30" : "border-gray-700 bg-gray-800/50 hover:border-gray-600"}`,
            children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-4 h-4 rounded-full bg-gray-700" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
                lineNumber: 103,
                columnNumber: 15
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-white", children: "Oscuro" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
                lineNumber: 104,
                columnNumber: 15
              }, this)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
              lineNumber: 102,
              columnNumber: 13
            }, this)
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
            lineNumber: 94,
            columnNumber: 11
          },
          this
        ),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: () => handleThemeChange("light"),
            className: `p-4 rounded-xl border-2 transition-all duration-300 ${settings.theme === "light" ? "border-blue-500 bg-blue-900/30" : "border-gray-700 bg-gray-800/50 hover:border-gray-600"}`,
            children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-4 h-4 rounded-full bg-gray-300" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
                lineNumber: 116,
                columnNumber: 15
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-white", children: "Claro" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
                lineNumber: 117,
                columnNumber: 15
              }, this)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
              lineNumber: 115,
              columnNumber: 13
            }, this)
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
            lineNumber: 107,
            columnNumber: 11
          },
          this
        ),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: () => handleThemeChange("oled"),
            className: `p-4 rounded-xl border-2 transition-all duration-300 ${settings.theme === "oled" ? "border-blue-500 bg-blue-900/30" : "border-gray-700 bg-gray-800/50 hover:border-gray-600"}`,
            children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-4 h-4 rounded-full bg-black" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
                lineNumber: 129,
                columnNumber: 15
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-white", children: "OLED" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
                lineNumber: 130,
                columnNumber: 15
              }, this)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
              lineNumber: 128,
              columnNumber: 13
            }, this)
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
            lineNumber: 120,
            columnNumber: 11
          },
          this
        ),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: () => handleThemeChange("system"),
            className: `p-4 rounded-xl border-2 transition-all duration-300 ${settings.theme === "system" ? "border-blue-500 bg-blue-900/30" : "border-gray-700 bg-gray-800/50 hover:border-gray-600"}`,
            children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: `w-4 h-4 rounded-full ${systemTheme === "dark" ? "bg-gray-700" : "bg-gray-300"}` }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
                lineNumber: 142,
                columnNumber: 15
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-white", children: "Sistema" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
                lineNumber: 143,
                columnNumber: 15
              }, this)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
              lineNumber: 141,
              columnNumber: 13
            }, this)
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
            lineNumber: 133,
            columnNumber: 11
          },
          this
        )
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
        lineNumber: 93,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
      lineNumber: 91,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-semibold text-gray-200 mb-3", children: "Color de Énfasis" }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
        lineNumber: 150,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex flex-wrap gap-2", children: [
          ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"].map((color) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              onClick: () => handleAccentColorChange(color),
              className: `w-8 h-8 rounded-full border-2 ${settings.accentColor === color ? "border-white ring-2 ring-offset-2 ring-offset-gray-900 ring-white" : "border-gray-600"}`,
              style: { backgroundColor: color },
              title: `Color ${color}`
            },
            color,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
              lineNumber: 154,
              columnNumber: 15
            },
            this
          )),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "relative", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "input",
              {
                type: "color",
                value: settings.accentColor,
                onChange: (e) => handleAccentColorChange(e.target.value),
                className: "w-8 h-8 rounded-full border border-gray-600 cursor-pointer",
                title: "Selector de color personalizado"
              },
              void 0,
              false,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
                lineNumber: 165,
                columnNumber: 15
              },
              this
            ),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "button",
              {
                onClick: () => handleAccentColorChange(getRandomColor()),
                className: "absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-gray-700 text-white text-xs flex items-center justify-center",
                title: "Color aleatorio",
                children: "?"
              },
              void 0,
              false,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
                lineNumber: 172,
                columnNumber: 15
              },
              this
            )
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
            lineNumber: 164,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
          lineNumber: 152,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-sm text-gray-400 ml-2", children: settings.accentColor }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
          lineNumber: 181,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
        lineNumber: 151,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
      lineNumber: 149,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-semibold text-gray-200 mb-3", children: "Tamaño de Fuente" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
          lineNumber: 189,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between text-sm text-gray-400", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: "Pequeño" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
              lineNumber: 192,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: [
              Math.round(settings.globalFontSize * 100),
              "%"
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
              lineNumber: 193,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: "Grande" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
              lineNumber: 194,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
            lineNumber: 191,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "input",
            {
              type: "range",
              min: "0.8",
              max: "1.5",
              step: "0.05",
              value: settings.globalFontSize,
              onChange: (e) => handleFontSizeChange(parseFloat(e.target.value)),
              className: "w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
              lineNumber: 196,
              columnNumber: 13
            },
            this
          )
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
          lineNumber: 190,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
        lineNumber: 188,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-semibold text-gray-200 mb-3", children: "Esquinas Redondeadas" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
          lineNumber: 209,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between text-sm text-gray-400", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: "0px" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
              lineNumber: 212,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: [
              settings.borderRadius,
              "px"
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
              lineNumber: 213,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: "20px" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
              lineNumber: 214,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
            lineNumber: 211,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "input",
            {
              type: "range",
              min: "0",
              max: "20",
              step: "1",
              value: settings.borderRadius,
              onChange: (e) => handleBorderRadiusChange(parseInt(e.target.value)),
              className: "w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
              lineNumber: 216,
              columnNumber: 13
            },
            this
          )
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
          lineNumber: 210,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
        lineNumber: 208,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
      lineNumber: 187,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-semibold text-gray-200", children: "Renderizado Avanzado" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
            lineNumber: 232,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-sm text-gray-400", children: "Mejora la apariencia visual pero puede afectar el rendimiento" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
            lineNumber: 233,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
          lineNumber: 231,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "relative inline-flex items-center cursor-pointer", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "input",
            {
              type: "checkbox",
              checked: settings.advancedRendering,
              onChange: (e) => onSettingsChange({ advancedRendering: e.target.checked }),
              className: "sr-only peer"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
              lineNumber: 236,
              columnNumber: 13
            },
            this
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
            lineNumber: 242,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
          lineNumber: 235,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
        lineNumber: 230,
        columnNumber: 9
      }, this),
      settings.advancedRendering && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-lg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-sm text-yellow-200 flex items-start", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-4 h-4 mr-2 mt-0.5 flex-shrink-0", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z", clipRule: "evenodd" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
          lineNumber: 249,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
          lineNumber: 248,
          columnNumber: 15
        }, this),
        "Esta opción puede afectar el rendimiento en sistemas bajos"
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
        lineNumber: 247,
        columnNumber: 13
      }, this) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
        lineNumber: 246,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
      lineNumber: 229,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-4", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-semibold text-gray-200", children: "Animaciones de Transición" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
          lineNumber: 260,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-sm text-gray-400", children: "Habilita/deshabilita las transiciones CSS suaves" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
          lineNumber: 261,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
        lineNumber: 259,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "relative inline-flex items-center cursor-pointer", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "input",
          {
            type: "checkbox",
            checked: settings.enableTransitions,
            onChange: (e) => onSettingsChange({ enableTransitions: e.target.checked }),
            className: "sr-only peer"
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
            lineNumber: 264,
            columnNumber: 13
          },
          this
        ),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
          lineNumber: 270,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
        lineNumber: 263,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
      lineNumber: 258,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
      lineNumber: 257,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-semibold text-gray-200 mb-3", children: "Filtro de Color" }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
        lineNumber: 276,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-4 gap-3", children: [
        { value: "none", label: "Ninguno" },
        { value: "sepia", label: "Sepia" },
        { value: "contrast", label: "Contraste" },
        { value: "saturate", label: "Saturar" }
      ].map((filter) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
        "button",
        {
          onClick: () => handleColorFilterChange(filter.value),
          className: `p-3 rounded-lg border transition-all ${settings.colorFilter === filter.value ? "border-blue-500 bg-blue-900/30 text-white" : "border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600"}`,
          children: filter.label
        },
        filter.value,
        false,
        {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
          lineNumber: 284,
          columnNumber: 13
        },
        this
      )) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
        lineNumber: 277,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
      lineNumber: 275,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-semibold text-gray-200", children: "Fondo Personalizado" }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
        lineNumber: 300,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex flex-col sm:flex-row gap-3", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "input",
          {
            type: "text",
            value: customBackgroundPath,
            onChange: (e) => {
              setCustomBackgroundPath(e.target.value);
              onSettingsChange({ customBackgroundPath: e.target.value });
            },
            placeholder: "Ruta a la imagen de fondo",
            className: "flex-1 p-2 rounded-lg bg-gray-700/80 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
            lineNumber: 302,
            columnNumber: 11
          },
          this
        ),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: handleBrowseBackground,
            className: "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors",
            children: "Explorar"
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
            lineNumber: 312,
            columnNumber: 11
          },
          this
        )
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
        lineNumber: 301,
        columnNumber: 9
      }, this),
      customBackgroundPath && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between text-sm text-gray-400", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: [
          "Opacidad: ",
          Math.round(settings.backgroundOpacity * 100),
          "%"
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
          lineNumber: 322,
          columnNumber: 15
        }, this) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
          lineNumber: 321,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "input",
          {
            type: "range",
            min: "0",
            max: "1",
            step: "0.05",
            value: settings.backgroundOpacity,
            onChange: (e) => handleBackgroundOpacityChange(parseFloat(e.target.value)),
            className: "w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
            lineNumber: 324,
            columnNumber: 13
          },
          this
        )
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
        lineNumber: 320,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
      lineNumber: 299,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "pt-4 border-t border-gray-700", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
      "button",
      {
        onClick: handleResetThemes,
        className: "px-5 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white font-medium rounded-lg transition-all",
        children: "Reiniciar temas"
      },
      void 0,
      false,
      {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
        lineNumber: 338,
        columnNumber: 9
      },
      this
    ) }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
      lineNumber: 337,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/AppearanceSettings.tsx",
    lineNumber: 90,
    columnNumber: 5
  }, this);
}
function BehaviorSettings({ settings, onSettingsChange }) {
  const [showNotificationHelp, setShowNotificationHelp] = reactExports.useState(false);
  const formatDate = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / 36e5);
    const days = Math.floor(diff / 864e5);
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };
  const handleLimitFPSChange = (value) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 60) {
      onSettingsChange({ backgroundFPSLimit: numValue });
    }
  };
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-semibold text-gray-200", children: "Minimizar launcher al iniciar" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
            lineNumber: 34,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-sm text-gray-400", children: "Minimiza el launcher cuando se inicia un juego" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
            lineNumber: 35,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
          lineNumber: 33,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "relative inline-flex items-center cursor-pointer", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "input",
            {
              type: "checkbox",
              checked: settings.minimizeOnLaunch,
              onChange: (e) => onSettingsChange({ minimizeOnLaunch: e.target.checked }),
              className: "sr-only peer"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
              lineNumber: 38,
              columnNumber: 13
            },
            this
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
            lineNumber: 44,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
          lineNumber: 37,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
        lineNumber: 32,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-semibold text-gray-200", children: "Ocultar nametag" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
            lineNumber: 50,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-sm text-gray-400", children: "Oculta las etiquetas de nombre en la interfaz" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
            lineNumber: 51,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
          lineNumber: 49,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "relative inline-flex items-center cursor-pointer", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "input",
            {
              type: "checkbox",
              checked: settings.hideNametag,
              onChange: (e) => onSettingsChange({ hideNametag: e.target.checked }),
              className: "sr-only peer"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
              lineNumber: 54,
              columnNumber: 13
            },
            this
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
            lineNumber: 60,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
          lineNumber: 53,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
        lineNumber: 48,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-semibold text-gray-200", children: "Decoraciones nativas" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
            lineNumber: 66,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-sm text-gray-400", children: "Usar el marco de ventana nativo del sistema (requiere reinicio)" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
            lineNumber: 67,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
          lineNumber: 65,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "relative inline-flex items-center cursor-pointer", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "input",
            {
              type: "checkbox",
              checked: settings.nativeDecorations,
              onChange: (e) => onSettingsChange({ nativeDecorations: e.target.checked }),
              className: "sr-only peer"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
              lineNumber: 70,
              columnNumber: 13
            },
            this
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
            lineNumber: 76,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
          lineNumber: 69,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
        lineNumber: 64,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-semibold text-gray-200", children: "Cerrar después de jugar" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
            lineNumber: 82,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-sm text-gray-400", children: "Cerrar el launcher cuando el proceso de Minecraft termina" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
            lineNumber: 83,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
          lineNumber: 81,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "relative inline-flex items-center cursor-pointer", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "input",
            {
              type: "checkbox",
              checked: settings.closeAfterPlay,
              onChange: (e) => onSettingsChange({ closeAfterPlay: e.target.checked }),
              className: "sr-only peer"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
              lineNumber: 86,
              columnNumber: 13
            },
            this
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
            lineNumber: 92,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
          lineNumber: 85,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
        lineNumber: 80,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-semibold text-gray-200", children: "Saltar a mundos recientes" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
            lineNumber: 98,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-sm text-gray-400", children: "Mostrar mundos jugados recientemente en la página de inicio" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
            lineNumber: 99,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
          lineNumber: 97,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "relative inline-flex items-center cursor-pointer", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "input",
            {
              type: "checkbox",
              checked: settings.showRecentWorlds,
              onChange: (e) => onSettingsChange({ showRecentWorlds: e.target.checked }),
              className: "sr-only peer"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
              lineNumber: 102,
              columnNumber: 13
            },
            this
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
            lineNumber: 108,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
          lineNumber: 101,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
        lineNumber: 96,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-semibold text-gray-200", children: "Notificaciones de sistema" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
            lineNumber: 114,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-sm text-gray-400", children: "Recibir notificaciones del sistema operativo para eventos importantes" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
            lineNumber: 115,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
          lineNumber: 113,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center space-x-3", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "relative inline-flex items-center cursor-pointer", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "input",
              {
                type: "checkbox",
                checked: settings.systemNotifications,
                onChange: (e) => onSettingsChange({ systemNotifications: e.target.checked }),
                className: "sr-only peer"
              },
              void 0,
              false,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
                lineNumber: 119,
                columnNumber: 15
              },
              this
            ),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
              lineNumber: 125,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
            lineNumber: 118,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              onClick: () => setShowNotificationHelp(!showNotificationHelp),
              className: "text-gray-400 hover:text-white",
              children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
                lineNumber: 132,
                columnNumber: 17
              }, this) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
                lineNumber: 131,
                columnNumber: 15
              }, this)
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
              lineNumber: 127,
              columnNumber: 13
            },
            this
          )
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
          lineNumber: 117,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
        lineNumber: 112,
        columnNumber: 9
      }, this),
      showNotificationHelp && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg text-sm text-blue-200", children: "Las notificaciones se mostrarán para eventos como: finalización de descargas, actualizaciones completadas, o finalización de sesiones de juego." }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
        lineNumber: 139,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
      lineNumber: 31,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-semibold text-gray-200 mb-3", children: "Página de inicio predeterminada" }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
        lineNumber: 146,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-2 gap-3", children: ["home", "instances", "servers", "settings"].map((page) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
        "button",
        {
          onClick: () => onSettingsChange({ defaultLandingPage: page }),
          className: `p-3 rounded-lg border-2 transition-all duration-300 capitalize ${settings.defaultLandingPage === page ? "border-blue-500 bg-blue-900/30 text-white" : "border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600"}`,
          children: page
        },
        page,
        false,
        {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
          lineNumber: 149,
          columnNumber: 13
        },
        this
      )) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
        lineNumber: 147,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
      lineNumber: 145,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-semibold text-gray-200 mb-3", children: "Volver a mundos" }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
        lineNumber: 165,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-2", children: [
        settings.jumpBackWorlds.slice(0, 5).map((world) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "div",
          {
            className: "flex items-center p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:bg-gray-700/50 transition-colors",
            children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-10 h-10 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm mr-3", children: world.name.charAt(0) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
                lineNumber: 172,
                columnNumber: 15
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-white font-medium", children: world.name }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
                  lineNumber: 176,
                  columnNumber: 17
                }, this),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-400", children: [
                  "Jugado hace ",
                  formatDate(world.lastPlayed)
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
                  lineNumber: 177,
                  columnNumber: 17
                }, this)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
                lineNumber: 175,
                columnNumber: 15
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("button", { className: "px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors", children: "Jugar" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
                lineNumber: 179,
                columnNumber: 15
              }, this)
            ]
          },
          world.id,
          true,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
            lineNumber: 168,
            columnNumber: 13
          },
          this
        )),
        settings.jumpBackWorlds.length === 0 && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-center py-6 text-gray-500", children: "No hay mundos recientes" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
          lineNumber: 185,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
        lineNumber: 166,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
      lineNumber: 164,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "pt-2", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-semibold text-gray-200 mb-3", children: "Rendimiento" }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
        lineNumber: 193,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-4 bg-gray-800/50 rounded-xl border border-gray-700", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-center mb-2", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h4", { className: "font-medium text-gray-200", children: "Límite de FPS en segundo plano" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
              lineNumber: 197,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-sm text-gray-400", children: "FPS máximos cuando la ventana está minimizada o no está en primer plano" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
              lineNumber: 198,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
            lineNumber: 196,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "input",
              {
                type: "number",
                min: "1",
                max: "60",
                value: settings.backgroundFPSLimit,
                onChange: (e) => handleLimitFPSChange(e.target.value),
                className: "w-20 p-2 rounded-lg bg-gray-700/80 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
              },
              void 0,
              false,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
                lineNumber: 201,
                columnNumber: 15
              },
              this
            ),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "ml-2 text-gray-400", children: "FPS" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
              lineNumber: 209,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
            lineNumber: 200,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
          lineNumber: 195,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between text-sm text-gray-400", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: "1" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
              lineNumber: 214,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: [
              settings.backgroundFPSLimit,
              " FPS"
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
              lineNumber: 215,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: "60" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
              lineNumber: 216,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
            lineNumber: 213,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "input",
            {
              type: "range",
              min: "1",
              max: "60",
              step: "1",
              value: settings.backgroundFPSLimit,
              onChange: (e) => handleLimitFPSChange(e.target.value),
              className: "w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
              lineNumber: 218,
              columnNumber: 13
            },
            this
          )
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
          lineNumber: 212,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-xs text-gray-500 mt-2", children: "Limitar los FPS en segundo plano puede reducir el uso de CPU y GPU cuando no estás usando activamente el launcher" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
          lineNumber: 228,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
        lineNumber: 194,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
      lineNumber: 192,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/BehaviorSettings.tsx",
    lineNumber: 30,
    columnNumber: 5
  }, this);
}
function generateAnonymousId() {
  if (typeof window !== "undefined" && window.localStorage) {
    let anonId = localStorage.getItem("anonId");
    if (!anonId) {
      anonId = "anon_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      localStorage.setItem("anonId", anonId);
    }
    return anonId;
  }
  return "anon_unknown";
}
const ANONYMOUS_ID = generateAnonymousId();
let telemetryEnabled = true;
function updateTelemetryStatus() {
  const settings = settingsService.getSettings();
  telemetryEnabled = settings.privacy.telemetryEnabled && !settings.privacy.forcedOfflineMode;
}
function trackEvent(eventName, eventData = {}) {
  if (!telemetryEnabled) {
    console.log(`[PRIVACIDAD] Evento "${eventName}" bloqueado por la configuración del usuario.`);
    return;
  }
  const payload = {
    userId: ANONYMOUS_ID,
    event: eventName,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    ...eventData
  };
  console.log("[TELEMETRÍA] Enviando datos:", payload);
}
function isTelemetryActive() {
  return telemetryEnabled;
}
updateTelemetryStatus();
const telemetryService = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  isTelemetryActive,
  trackEvent,
  updateTelemetryStatus
}, Symbol.toStringTag, { value: "Module" }));
class PrivacyService {
  // Limpieza de caché
  async clearCache() {
    try {
      console.log("Limpiando caché...");
      trackEvent("cache_cleared", { method: "manual" });
      return true;
    } catch (error) {
      console.error("Error al limpiar la caché:", error);
      trackEvent("cache_clear_error", { error: error.message });
      return false;
    }
  }
  // Exportar datos de configuración
  async exportSettings() {
    try {
      console.log("Exportando configuración...");
      const currentSettings = settingsService.getSettings();
      const settingsBlob = new Blob([JSON.stringify(currentSettings, null, 2)], {
        type: "application/json"
      });
      const url = URL.createObjectURL(settingsBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "configuracion-launcher.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      trackEvent("settings_exported", { method: "manual" });
      return true;
    } catch (error) {
      console.error("Error al exportar configuración:", error);
      trackEvent("settings_export_error", { error: error.message });
      return false;
    }
  }
  // Actualizar configuración de privacidad
  updatePrivacySettings(updates) {
    const newSettings = settingsService.updatePrivacy(updates);
    if (updates.telemetryEnabled !== void 0) {
      __vitePreload(() => Promise.resolve().then(() => telemetryService), true ? void 0 : void 0).then((module) => {
        module.updateTelemetryStatus();
      });
    }
    return newSettings;
  }
  // Obtener configuración actual de privacidad
  getPrivacySettings() {
    return settingsService.getSettings().privacy;
  }
  // Validar URL de política de privacidad
  validatePrivacyPolicyUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === "https:" || urlObj.protocol === "http:";
    } catch {
      return false;
    }
  }
}
const privacyService = new PrivacyService();
function PrivacySettings({ settings, onSettingsChange }) {
  const [showTelemetryDetails, setShowTelemetryDetails] = reactExports.useState(false);
  const [cacheClearing, setCacheClearing] = reactExports.useState(false);
  const [exporting, setExporting] = reactExports.useState(false);
  const [showExportSuccess, setShowExportSuccess] = reactExports.useState(false);
  const toggleTelemetryDetails = () => {
    setShowTelemetryDetails(!showTelemetryDetails);
  };
  const handleClearCache = async () => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar la caché? Esto eliminará descargas temporales y puede afectar el rendimiento futuro.")) {
      return;
    }
    setCacheClearing(true);
    try {
      const success = await privacyService.clearCache();
      if (success) {
        alert("Caché limpiada exitosamente");
      } else {
        alert("Error al limpiar la caché");
      }
    } catch (error) {
      console.error("Error al limpiar la caché:", error);
      alert("Error al limpiar la caché");
    } finally {
      setCacheClearing(false);
    }
  };
  const handleExportSettings = async () => {
    setExporting(true);
    try {
      const success = await privacyService.exportSettings();
      if (success) {
        setShowExportSuccess(true);
        setTimeout(() => setShowExportSuccess(false), 3e3);
      } else {
        alert("Error al exportar la configuración");
      }
    } catch (error) {
      console.error("Error al exportar la configuración:", error);
      alert("Error al exportar la configuración");
    } finally {
      setExporting(false);
    }
  };
  const handleLogLevelChange = (level) => {
    onSettingsChange({ logLevel: level });
  };
  const handlePrivacyPolicyUrlChange = (url) => {
    if (privacyService.validatePrivacyPolicyUrl(url) || url === "") {
      onSettingsChange({ privacyPolicyUrl: url });
    }
  };
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-start justify-between", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-semibold text-gray-200", children: "Telemetría" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
            lineNumber: 74,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-sm text-gray-400 mt-1", children: "Permitir que la aplicación envíe datos anónimos de uso para mejorar la experiencia" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
            lineNumber: 75,
            columnNumber: 13
          }, this),
          showTelemetryDetails && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h4", { className: "font-medium text-gray-300 mb-2", children: "Datos recopilados:" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
              lineNumber: 80,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("ul", { className: "text-sm text-gray-400 space-y-1 list-disc pl-5", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("li", { children: "Tiempo de inicio de la aplicación" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
                lineNumber: 82,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("li", { children: "Errores no identificables" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
                lineNumber: 83,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("li", { children: "Versiones de sistema operativo" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
                lineNumber: 84,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("li", { children: "Configuración de hardware general (sin identificadores únicos)" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
                lineNumber: 85,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
              lineNumber: 81,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-xs text-gray-500 mt-2", children: "No se recopila información personal ni credenciales." }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
              lineNumber: 87,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
            lineNumber: 79,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
          lineNumber: 73,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "relative inline-flex items-center cursor-pointer ml-4", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "input",
            {
              type: "checkbox",
              checked: settings.telemetryEnabled,
              onChange: (e) => onSettingsChange({ telemetryEnabled: e.target.checked }),
              className: "sr-only peer"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
              lineNumber: 92,
              columnNumber: 13
            },
            this
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
            lineNumber: 98,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
          lineNumber: 91,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
        lineNumber: 72,
        columnNumber: 9
      }, this),
      settings.telemetryEnabled && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
        "button",
        {
          onClick: toggleTelemetryDetails,
          className: "text-sm text-blue-400 hover:text-blue-300 transition-colors",
          children: showTelemetryDetails ? "Ocultar detalles" : "Mostrar qué datos se recopilan"
        },
        void 0,
        false,
        {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
          lineNumber: 103,
          columnNumber: 11
        },
        this
      )
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
      lineNumber: 71,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-semibold text-gray-200", children: "Rich Presence en Discord" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
            lineNumber: 115,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-sm text-gray-400", children: "Mostrar tu actividad en Discord" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
            lineNumber: 116,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
          lineNumber: 114,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "relative inline-flex items-center cursor-pointer", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "input",
            {
              type: "checkbox",
              checked: settings.discordRPC,
              onChange: (e) => onSettingsChange({ discordRPC: e.target.checked }),
              className: "sr-only peer"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
              lineNumber: 119,
              columnNumber: 13
            },
            this
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
            lineNumber: 125,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
          lineNumber: 118,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
        lineNumber: 113,
        columnNumber: 9
      }, this),
      settings.discordRPC && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-sm text-blue-200 flex items-start", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-4 h-4 mr-2 mt-0.5 flex-shrink-0", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z", clipRule: "evenodd" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
          lineNumber: 132,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
          lineNumber: 131,
          columnNumber: 15
        }, this),
        "Requiere reiniciar la aplicación para activarse"
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
        lineNumber: 130,
        columnNumber: 13
      }, this) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
        lineNumber: 129,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
      lineNumber: 112,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-4", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-semibold text-gray-200", children: "Anuncios personalizados" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
          lineNumber: 143,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-sm text-gray-400", children: "Mostrar anuncios basados en tus preferencias" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
          lineNumber: 144,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
        lineNumber: 142,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "relative inline-flex items-center cursor-pointer", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "input",
          {
            type: "checkbox",
            checked: settings.personalizedAds,
            onChange: (e) => onSettingsChange({ personalizedAds: e.target.checked }),
            className: "sr-only peer"
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
            lineNumber: 147,
            columnNumber: 13
          },
          this
        ),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
          lineNumber: 153,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
        lineNumber: 146,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
      lineNumber: 141,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
      lineNumber: 140,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-semibold text-gray-200", children: "Modo Offline Forzado" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
            lineNumber: 161,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-sm text-gray-400", children: "Impedir conexiones de red no esenciales" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
            lineNumber: 162,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
          lineNumber: 160,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "relative inline-flex items-center cursor-pointer", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "input",
            {
              type: "checkbox",
              checked: settings.forcedOfflineMode,
              onChange: (e) => onSettingsChange({ forcedOfflineMode: e.target.checked }),
              className: "sr-only peer"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
              lineNumber: 165,
              columnNumber: 13
            },
            this
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
            lineNumber: 171,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
          lineNumber: 164,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
        lineNumber: 159,
        columnNumber: 9
      }, this),
      settings.forcedOfflineMode && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-lg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-sm text-yellow-200 flex items-start", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-4 h-4 mr-2 mt-0.5 flex-shrink-0", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z", clipRule: "evenodd" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
          lineNumber: 178,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
          lineNumber: 177,
          columnNumber: 15
        }, this),
        "Esta opción puede afectar la funcionalidad del launcher"
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
        lineNumber: 176,
        columnNumber: 13
      }, this) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
        lineNumber: 175,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
      lineNumber: 158,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-semibold text-gray-200 mb-2", children: "Nivel de Registro" }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
        lineNumber: 187,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-3 gap-2", children: ["Debug", "Info", "Error"].map((level) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
        "button",
        {
          onClick: () => handleLogLevelChange(level),
          className: `p-2 rounded-lg border transition-all ${settings.logLevel === level ? "border-blue-500 bg-blue-900/30 text-white" : "border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600"}`,
          children: level
        },
        level,
        false,
        {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
          lineNumber: 190,
          columnNumber: 13
        },
        this
      )) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
        lineNumber: 188,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
      lineNumber: 186,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-semibold text-gray-200 mb-2", children: "Política de Privacidad" }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
        lineNumber: 206,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "input",
          {
            type: "url",
            value: settings.privacyPolicyUrl,
            onChange: (e) => handlePrivacyPolicyUrlChange(e.target.value),
            placeholder: "https://example.com/privacy",
            className: "w-full p-2 rounded-lg bg-gray-700/80 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
            lineNumber: 208,
            columnNumber: 11
          },
          this
        ),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-sm text-gray-400", children: "URL de la política de privacidad que se mostrará al usuario" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
          lineNumber: 215,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
        lineNumber: 207,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
      lineNumber: 205,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "pt-4 border-t border-gray-700 space-y-4", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-semibold text-gray-200 mb-2", children: "Herramientas de Privacidad" }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
        lineNumber: 223,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: handleClearCache,
            disabled: cacheClearing,
            className: "p-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg shadow transition-all flex items-center justify-center",
            children: [
              cacheClearing ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "animate-spin -ml-1 mr-2 h-4 w-4 text-white", fill: "none", viewBox: "0 0 24 24", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
                  lineNumber: 232,
                  columnNumber: 19
                }, this),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
                  lineNumber: 233,
                  columnNumber: 19
                }, this)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
                lineNumber: 231,
                columnNumber: 17
              }, this) : null,
              cacheClearing ? "Limpiando..." : "Limpiar Caché"
            ]
          },
          void 0,
          true,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
            lineNumber: 225,
            columnNumber: 13
          },
          this
        ),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: handleExportSettings,
            disabled: exporting,
            className: "p-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-lg shadow transition-all flex items-center justify-center",
            children: [
              exporting ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "animate-spin -ml-1 mr-2 h-4 w-4 text-white", fill: "none", viewBox: "0 0 24 24", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
                  lineNumber: 246,
                  columnNumber: 19
                }, this),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
                  lineNumber: 247,
                  columnNumber: 19
                }, this)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
                lineNumber: 245,
                columnNumber: 17
              }, this) : null,
              exporting ? "Exportando..." : "Exportar Configuración"
            ]
          },
          void 0,
          true,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
            lineNumber: 239,
            columnNumber: 13
          },
          this
        )
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
        lineNumber: 224,
        columnNumber: 11
      }, this),
      showExportSuccess && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-2 p-2 bg-emerald-900/30 border border-emerald-700/50 rounded text-emerald-200 text-center", children: "Configuración exportada exitosamente" }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
        lineNumber: 254,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
      lineNumber: 222,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
      lineNumber: 221,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/PrivacySettings.tsx",
    lineNumber: 70,
    columnNumber: 5
  }, this);
}
function JavaSettings({ settings, onSettingsChange }) {
  var _a, _b, _c;
  const [allJavas, setAllJavas] = reactExports.useState([]);
  const [java8, setJava8] = reactExports.useState(null);
  const [java17, setJava17] = reactExports.useState(null);
  const [java21, setJava21] = reactExports.useState(null);
  const [java8Status, setJava8Status] = reactExports.useState("idle");
  const [java17Status, setJava17Status] = reactExports.useState("idle");
  const [java21Status, setJava21Status] = reactExports.useState("idle");
  const [installProgress, setInstallProgress] = reactExports.useState({});
  reactExports.useEffect(() => {
    loadJavaInstallations();
  }, []);
  const loadJavaInstallations = async () => {
    if (window.api && window.api.java) {
      try {
        const javas = await window.api.java.getAll();
        setAllJavas(javas);
      } catch (error) {
        console.error("Error loading Java installations:", error);
      }
    }
  };
  const detectJava = async (version) => {
    if (version === "8") setJava8Status("detecting");
    else if (version === "17") setJava17Status("detecting");
    else if (version === "21") setJava21Status("detecting");
    try {
      if (window.api && window.api.java && window.api.java.detectSimple) {
        const detected = await window.api.java.detectSimple();
        setAllJavas(detected);
        const foundJava = detected.find(
          (j) => j.version === version || j.path.includes(version) || version === "8" && (j.version.includes("8") || j.path.includes("8")) || version === "17" && (j.version.includes("17") || j.path.includes("17")) || version === "21" && (j.version.includes("21") || j.path.includes("21"))
        );
        if (foundJava) {
          if (version === "8") {
            setJava8(foundJava);
            setJava8Status("success");
            onSettingsChange({ java8Path: foundJava.path });
          } else if (version === "17") {
            setJava17(foundJava);
            setJava17Status("success");
            onSettingsChange({ java17Path: foundJava.path });
          } else if (version === "21") {
            setJava21(foundJava);
            setJava21Status("success");
            onSettingsChange({ java21Path: foundJava.path });
          }
          alert(`Java ${version} detectado en: ${foundJava.path}`);
        } else {
          if (version === "8") setJava8Status("error");
          else if (version === "17") setJava17Status("error");
          else if (version === "21") setJava21Status("error");
          alert(`Java ${version} no encontrado en C:\\Program Files\\Java\\. Puedes instalarlo.`);
        }
      } else {
        console.warn("API de Java no disponible, intentando con servicio alternativo...");
        const simulatedDetection = await simulateJavaDetection(version);
        if (simulatedDetection) {
          const javaInfo = {
            id: `simulated_java_${version}`,
            path: simulatedDetection.path,
            version,
            isWorking: true,
            source: "simulated"
          };
          const updatedJavas = [...allJavas, javaInfo].filter(
            (java, index, self) => index === self.findIndex((j) => j.id === java.id)
          );
          setAllJavas(updatedJavas);
          if (version === "8") {
            setJava8(javaInfo);
            setJava8Status("success");
            onSettingsChange({ java8Path: javaInfo.path });
          } else if (version === "17") {
            setJava17(javaInfo);
            setJava17Status("success");
            onSettingsChange({ java17Path: javaInfo.path });
          } else if (version === "21") {
            setJava21(javaInfo);
            setJava21Status("success");
            onSettingsChange({ java21Path: javaInfo.path });
          }
          alert(`Java ${version} detectado en: ${javaInfo.path}`);
        } else {
          if (version === "8") setJava8Status("error");
          else if (version === "17") setJava17Status("error");
          else if (version === "21") setJava21Status("error");
          alert(`Java ${version} no encontrado en C:\\Program Files\\Java\\. Instálalo en ese directorio o usa el instalador.`);
        }
      }
    } catch (error) {
      console.error(`Error detecting Java ${version}:`, error);
      if (version === "8") setJava8Status("error");
      else if (version === "17") setJava17Status("error");
      else if (version === "21") setJava21Status("error");
    }
  };
  const simulateJavaDetection = async (version) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const isWindows = navigator.userAgent.includes("Win");
        const isMac = navigator.userAgent.includes("Mac");
        const isLinux = navigator.userAgent.includes("Linux");
        let commonPaths = [];
        if (isWindows) {
          commonPaths = [
            `C:/Program Files/Java/jdk${version}/bin/java.exe`,
            `C:/Program Files/Eclipse Adoptium/jdk-${version}.0.0-hotspot/bin/java.exe`,
            `C:/Program Files/Java/openjdk${version}/bin/java.exe`
          ];
        } else if (isMac) {
          commonPaths = [
            `/Library/Java/JavaVirtualMachines/openjdk-${version}.jdk/Contents/Home/bin/java`,
            `/Library/Java/JavaVirtualMachines/adoptopenjdk-${version}.jdk/Contents/Home/bin/java`
          ];
        } else if (isLinux) {
          commonPaths = [
            `/usr/lib/jvm/java-${version}-openjdk/bin/java`,
            `/usr/lib/jvm/default-java/bin/java`,
            `/opt/java/openjdk/bin/java`
          ];
        } else {
          commonPaths = [
            `java`
            // Caso genérico, esperar que esté en PATH
          ];
        }
        const foundPath = commonPaths.find((path) => {
          if (version === "8" && path.toLowerCase().includes("jdk8")) return true;
          if (version === "17" && path.toLowerCase().includes("jdk-17")) return true;
          if (version === "21" && path.toLowerCase().includes("jdk-21")) return true;
          return false;
        });
        if (foundPath) {
          resolve({ path: foundPath });
        } else {
          resolve(null);
        }
      }, 300);
    });
  };
  const testJava = async (path, versionLabel) => {
    if (!window.api || !window.api.java) {
      alert("API de Java no disponible");
      return false;
    }
    try {
      const result = await window.api.java.test(path);
      if (result.isWorking) {
        alert(`Java ${versionLabel} probado exitosamente. Versión: ${result.version}`);
        return true;
      } else {
        alert(`Error al probar Java ${versionLabel}: ${result.error || "No se pudo ejecutar"}`);
        return false;
      }
    } catch (error) {
      console.error(`Error testing Java ${versionLabel}:`, error);
      alert(`Error al probar Java ${versionLabel}: ${error.message}`);
      return false;
    }
  };
  const installJava = async (version) => {
    if (!window.api || !window.api.java) {
      alert("API de Java no disponible");
      return;
    }
    try {
      setInstallProgress((prev) => ({ ...prev, [version]: { received: 0, total: 100, percentage: 0 } }));
      await javaDownloadService.installJava(version);
      alert(`Iniciando descarga de Java ${version}. Puedes ver el progreso en la sección de Descargas.`);
      setInstallProgress((prev) => ({ ...prev, [version]: null }));
      loadJavaInstallations();
    } catch (error) {
      console.error(`Error installing Java ${version}:`, error);
      alert(`Error al instalar Java ${version}: ${error.message}`);
      setInstallProgress((prev) => ({ ...prev, [version]: null }));
    }
  };
  const handlePathChange = (version, path) => {
    if (version === "8") {
      onSettingsChange({ java8Path: path });
    } else if (version === "17") {
      onSettingsChange({ java17Path: path });
    } else if (version === "21") {
      onSettingsChange({ java21Path: path });
    }
  };
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-6", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-xl font-semibold text-gray-200 mb-4", children: "Configuración de Java" }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
      lineNumber: 248,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-4 bg-gray-800/50 rounded-xl border border-gray-700", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between mb-3", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h4", { className: "font-medium text-gray-200", children: "Java 8" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
            lineNumber: 254,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              onClick: () => installJava("8"),
              disabled: !!installProgress["8"] || java8 && java8.isWorking,
              className: "px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded text-sm transition-all disabled:opacity-50",
              children: installProgress["8"] ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "flex items-center", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "animate-spin -ml-1 mr-2 h-4 w-4 text-white", fill: "none", viewBox: "0 0 24 24", children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
                    lineNumber: 263,
                    columnNumber: 23
                  }, this),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
                    lineNumber: 264,
                    columnNumber: 23
                  }, this)
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
                  lineNumber: 262,
                  columnNumber: 21
                }, this),
                (_a = installProgress["8"]) == null ? void 0 : _a.percentage,
                "%"
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
                lineNumber: 261,
                columnNumber: 19
              }, this) : java8 && java8.isWorking ? "Java 8 Detectado" : "Instalar recomendado"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
              lineNumber: 255,
              columnNumber: 15
            },
            this
          )
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
          lineNumber: 253,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "input",
            {
              type: "text",
              value: settings.java8Path || "",
              onChange: (e) => handlePathChange("8", e.target.value),
              placeholder: "Ruta al ejecutable de Java 8",
              className: "flex-1 p-2 rounded-lg bg-gray-700/80 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
              lineNumber: 276,
              columnNumber: 15
            },
            this
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              onClick: () => detectJava("8"),
              disabled: java8Status === "detecting",
              className: `px-3 py-2 rounded-lg transition-all ${java8Status === "detecting" ? "bg-blue-800 text-blue-200" : java8 && java8.isWorking ? "bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`,
              children: java8Status === "detecting" ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "animate-spin h-4 w-4", fill: "none", viewBox: "0 0 24 24", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
                  lineNumber: 296,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
                  lineNumber: 297,
                  columnNumber: 21
                }, this)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
                lineNumber: 295,
                columnNumber: 19
              }, this) : "Detectar"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
              lineNumber: 283,
              columnNumber: 15
            },
            this
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              onClick: async () => {
                if (settings.java8Path) {
                  await testJava(settings.java8Path, "8");
                }
              },
              className: "px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all",
              children: "Probar"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
              lineNumber: 301,
              columnNumber: 15
            },
            this
          )
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
          lineNumber: 275,
          columnNumber: 13
        }, this),
        java8Status === "error" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-2 text-sm text-red-400", children: "No se encontró Java 8 en el sistema" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
          lineNumber: 313,
          columnNumber: 15
        }, this),
        java8 && java8.isWorking && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-2 text-sm text-emerald-400", children: [
          "Java 8 detectado correctamente: ",
          java8.path
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
          lineNumber: 316,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
        lineNumber: 252,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-4 bg-gray-800/50 rounded-xl border border-gray-700", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between mb-3", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h4", { className: "font-medium text-gray-200", children: "Java 17" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
            lineNumber: 323,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              onClick: () => installJava("17"),
              disabled: !!installProgress["17"] || java17 && java17.isWorking,
              className: "px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded text-sm transition-all disabled:opacity-50",
              children: installProgress["17"] ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "flex items-center", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "animate-spin -ml-1 mr-2 h-4 w-4 text-white", fill: "none", viewBox: "0 0 24 24", children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
                    lineNumber: 332,
                    columnNumber: 23
                  }, this),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
                    lineNumber: 333,
                    columnNumber: 23
                  }, this)
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
                  lineNumber: 331,
                  columnNumber: 21
                }, this),
                (_b = installProgress["17"]) == null ? void 0 : _b.percentage,
                "%"
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
                lineNumber: 330,
                columnNumber: 19
              }, this) : java17 && java17.isWorking ? "Java 17 Detectado" : "Instalar recomendado"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
              lineNumber: 324,
              columnNumber: 15
            },
            this
          )
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
          lineNumber: 322,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "input",
            {
              type: "text",
              value: settings.java17Path || "",
              onChange: (e) => handlePathChange("17", e.target.value),
              placeholder: "Ruta al ejecutable de Java 17",
              className: "flex-1 p-2 rounded-lg bg-gray-700/80 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
              lineNumber: 345,
              columnNumber: 15
            },
            this
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              onClick: () => detectJava("17"),
              disabled: java17Status === "detecting",
              className: `px-3 py-2 rounded-lg transition-all ${java17Status === "detecting" ? "bg-blue-800 text-blue-200" : java17 && java17.isWorking ? "bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`,
              children: java17Status === "detecting" ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "animate-spin h-4 w-4", fill: "none", viewBox: "0 0 24 24", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
                  lineNumber: 365,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
                  lineNumber: 366,
                  columnNumber: 21
                }, this)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
                lineNumber: 364,
                columnNumber: 19
              }, this) : "Detectar"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
              lineNumber: 352,
              columnNumber: 15
            },
            this
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              onClick: async () => {
                if (settings.java17Path) {
                  await testJava(settings.java17Path, "17");
                }
              },
              className: "px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all",
              children: "Probar"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
              lineNumber: 370,
              columnNumber: 15
            },
            this
          )
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
          lineNumber: 344,
          columnNumber: 13
        }, this),
        java17Status === "error" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-2 text-sm text-red-400", children: "No se encontró Java 17 en el sistema" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
          lineNumber: 382,
          columnNumber: 15
        }, this),
        java17 && java17.isWorking && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-2 text-sm text-emerald-400", children: [
          "Java 17 detectado correctamente: ",
          java17.path
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
          lineNumber: 385,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
        lineNumber: 321,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-4 bg-gray-800/50 rounded-xl border border-gray-700", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between mb-3", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h4", { className: "font-medium text-gray-200", children: "Java 21" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
            lineNumber: 392,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              onClick: () => installJava("21"),
              disabled: !!installProgress["21"] || java21 && java21.isWorking,
              className: "px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded text-sm transition-all disabled:opacity-50",
              children: installProgress["21"] ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "flex items-center", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "animate-spin -ml-1 mr-2 h-4 w-4 text-white", fill: "none", viewBox: "0 0 24 24", children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
                    lineNumber: 401,
                    columnNumber: 23
                  }, this),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
                    lineNumber: 402,
                    columnNumber: 23
                  }, this)
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
                  lineNumber: 400,
                  columnNumber: 21
                }, this),
                (_c = installProgress["21"]) == null ? void 0 : _c.percentage,
                "%"
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
                lineNumber: 399,
                columnNumber: 19
              }, this) : java21 && java21.isWorking ? "Java 21 Detectado" : "Instalar recomendado"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
              lineNumber: 393,
              columnNumber: 15
            },
            this
          )
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
          lineNumber: 391,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "input",
            {
              type: "text",
              value: settings.java21Path || "",
              onChange: (e) => handlePathChange("21", e.target.value),
              placeholder: "Ruta al ejecutable de Java 21",
              className: "flex-1 p-2 rounded-lg bg-gray-700/80 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
              lineNumber: 414,
              columnNumber: 15
            },
            this
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              onClick: () => detectJava("21"),
              disabled: java21Status === "detecting",
              className: `px-3 py-2 rounded-lg transition-all ${java21Status === "detecting" ? "bg-blue-800 text-blue-200" : java21 && java21.isWorking ? "bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`,
              children: java21Status === "detecting" ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "animate-spin h-4 w-4", fill: "none", viewBox: "0 0 24 24", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
                  lineNumber: 434,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
                  lineNumber: 435,
                  columnNumber: 21
                }, this)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
                lineNumber: 433,
                columnNumber: 19
              }, this) : "Detectar"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
              lineNumber: 421,
              columnNumber: 15
            },
            this
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              onClick: async () => {
                if (settings.java21Path) {
                  await testJava(settings.java21Path, "21");
                }
              },
              className: "px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all",
              children: "Probar"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
              lineNumber: 439,
              columnNumber: 15
            },
            this
          )
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
          lineNumber: 413,
          columnNumber: 13
        }, this),
        java21Status === "error" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-2 text-sm text-red-400", children: "No se encontró Java 21 en el sistema" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
          lineNumber: 451,
          columnNumber: 15
        }, this),
        java21 && java21.isWorking && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-2 text-sm text-emerald-400", children: [
          "Java 21 detectado correctamente: ",
          java21.path
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
          lineNumber: 454,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
        lineNumber: 390,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
      lineNumber: 250,
      columnNumber: 9
    }, this)
  ] }, void 0, true, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
    lineNumber: 247,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/JavaSettings.tsx",
    lineNumber: 246,
    columnNumber: 5
  }, this);
}
class ProcessMonitorService {
  constructor() {
    __publicField(this, "monitoredProcesses", /* @__PURE__ */ new Map());
    __publicField(this, "settings");
    this.settings = {
      minimizeOnLaunch: true,
      hideNametag: false,
      defaultLandingPage: "home",
      jumpBackWorlds: [],
      nativeDecorations: false,
      showRecentWorlds: true,
      closeAfterPlay: false,
      systemNotifications: true,
      backgroundFPSLimit: 30
    };
  }
  updateSettings(settings) {
    this.settings = settings;
  }
  // Este método simula el monitoreo de procesos del juego
  monitorGameProcess(processId, onExit) {
    this.monitoredProcesses.set(processId, onExit);
    setTimeout(() => {
      this.handleProcessExit(processId, 0);
    }, 1e4);
  }
  handleProcessExit(processId, code) {
    const callback = this.monitoredProcesses.get(processId);
    if (callback) {
      callback(code);
      this.monitoredProcesses.delete(processId);
      if (this.settings.systemNotifications) {
        this.sendSystemNotification("Juego finalizado", `La sesión de juego ha terminado con código ${code}`);
      }
    }
  }
  sendSystemNotification(title, body) {
    console.log(`Notificación del sistema: ${title} - ${body}`);
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(title, { body });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification(title, { body });
          }
        });
      }
    }
  }
  async launchGameAndMonitor(instanceId, processCommand) {
    try {
      console.log(`Lanzando juego para instancia ${instanceId} con comando:`, processCommand);
      if (this.settings.minimizeOnLaunch) {
        console.log("Minimizando launcher al iniciar el juego");
      }
      const processId = `game-${instanceId}-${Date.now()}`;
      this.monitorGameProcess(processId, (exitCode) => {
        console.log(`Proceso de juego finalizado con código: ${exitCode}`);
        if (this.settings.closeAfterPlay) {
          console.log("Cerrando launcher tras finalización del juego");
        } else {
          console.log("Juego finalizado, launcher permanece abierto");
        }
      });
      return { success: true, processId };
    } catch (error) {
      console.error("Error lanzando juego:", error);
      return { success: false, error: error.message };
    }
  }
  getProcessCount() {
    return this.monitoredProcesses.size;
  }
}
const processMonitorService = new ProcessMonitorService();
function SettingsModal({ isOpen, onClose, onSettingsChanged }) {
  const [activeTab, setActiveTab] = reactExports.useState("appearance");
  const [settings, setSettings] = reactExports.useState(settingsService.getSettings());
  const [hasUnsavedChanges, setHasUnsavedChanges] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (isOpen) {
      setSettings(settingsService.getSettings());
      setHasUnsavedChanges(false);
    }
  }, [isOpen]);
  if (!isOpen) {
    return null;
  }
  const handleSettingsChange = (updates) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    setHasUnsavedChanges(true);
  };
  const handleAppearanceChange = (updates) => {
    handleSettingsChange({ appearance: { ...settings.appearance, ...updates } });
  };
  const handleBehaviorChange = (updates) => {
    handleSettingsChange({ behavior: { ...settings.behavior, ...updates } });
  };
  const handlePrivacyChange = (updates) => {
    handleSettingsChange({ privacy: { ...settings.privacy, ...updates } });
  };
  const handleJavaChange = (updates) => {
    handleSettingsChange({ java: { ...settings.java, ...updates } });
  };
  const handleSave = () => {
    const persisted = settingsService.updateSettings(settings);
    if (persisted.appearance) {
      themeService.initializeTheme(persisted.appearance);
    }
    if (persisted.behavior) {
      processMonitorService.updateSettings(persisted.behavior);
    }
    if (persisted.privacy) {
      privacyService.updatePrivacySettings(persisted.privacy);
    }
    if (onSettingsChanged) {
      onSettingsChanged(persisted);
    }
    setHasUnsavedChanges(false);
    onClose();
  };
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmDiscard = window.confirm("¿Estás seguro de que quieres descartar los cambios no guardados?");
      if (confirmDiscard) {
        onClose();
      }
    } else {
      onClose();
    }
  };
  const tabs = [
    { id: "appearance", label: "Apariencia", icon: "🎨" },
    { id: "behavior", label: "Comportamiento", icon: "⚙️" },
    { id: "privacy", label: "Privacidad", icon: "🔒" },
    { id: "java", label: "Java", icon: "☕" }
  ];
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col border border-gray-700/50 backdrop-blur-md", children: [
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-center p-6 border-b border-gray-700", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h2", { className: "text-2xl font-bold text-white", children: "Configuración" }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SettingsModal.tsx",
        lineNumber: 110,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
        "button",
        {
          onClick: handleCancel,
          className: "text-gray-400 hover:text-white transition-colors",
          children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M6 18L18 6M6 6l12 12" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SettingsModal.tsx",
            lineNumber: 116,
            columnNumber: 15
          }, this) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SettingsModal.tsx",
            lineNumber: 115,
            columnNumber: 13
          }, this)
        },
        void 0,
        false,
        {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SettingsModal.tsx",
          lineNumber: 111,
          columnNumber: 11
        },
        this
      )
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SettingsModal.tsx",
      lineNumber: 109,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex flex-1 overflow-hidden", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-48 bg-gray-800/50 border-r border-gray-700 p-2", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("nav", { className: "space-y-1", children: tabs.map((tab) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
        "button",
        {
          onClick: () => setActiveTab(tab.id),
          className: `w-full flex items-center px-3 py-2.5 rounded-lg text-left transition-colors ${activeTab === tab.id ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700/50 hover:text-white"}`,
          children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "mr-2", children: tab.icon }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SettingsModal.tsx",
              lineNumber: 135,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-sm", children: tab.label }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SettingsModal.tsx",
              lineNumber: 136,
              columnNumber: 19
            }, this)
          ]
        },
        tab.id,
        true,
        {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SettingsModal.tsx",
          lineNumber: 126,
          columnNumber: 17
        },
        this
      )) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SettingsModal.tsx",
        lineNumber: 124,
        columnNumber: 13
      }, this) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SettingsModal.tsx",
        lineNumber: 123,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-1 overflow-y-auto p-6", children: [
        activeTab === "appearance" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          AppearanceSettings,
          {
            settings: settings.appearance,
            onSettingsChange: handleAppearanceChange
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SettingsModal.tsx",
            lineNumber: 145,
            columnNumber: 15
          },
          this
        ),
        activeTab === "behavior" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          BehaviorSettings,
          {
            settings: settings.behavior,
            onSettingsChange: handleBehaviorChange
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SettingsModal.tsx",
            lineNumber: 152,
            columnNumber: 15
          },
          this
        ),
        activeTab === "privacy" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          PrivacySettings,
          {
            settings: settings.privacy,
            onSettingsChange: handlePrivacyChange
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SettingsModal.tsx",
            lineNumber: 159,
            columnNumber: 15
          },
          this
        ),
        activeTab === "java" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          JavaSettings,
          {
            settings: settings.java,
            onSettingsChange: handleJavaChange
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SettingsModal.tsx",
            lineNumber: 166,
            columnNumber: 15
          },
          this
        )
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SettingsModal.tsx",
        lineNumber: 143,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SettingsModal.tsx",
      lineNumber: 121,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-4 border-t border-gray-700 flex justify-between", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
        Button,
        {
          variant: "secondary",
          onClick: handleCancel,
          className: "px-6 py-2.5 rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 text-gray-200 font-medium",
          children: "Cancelar"
        },
        void 0,
        false,
        {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SettingsModal.tsx",
          lineNumber: 176,
          columnNumber: 11
        },
        this
      ),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          Button,
          {
            variant: "secondary",
            onClick: () => {
              setSettings(settingsService.getSettings());
              setHasUnsavedChanges(false);
            },
            disabled: !hasUnsavedChanges,
            className: "px-6 py-2.5 rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 text-gray-200 font-medium disabled:opacity-50",
            children: "Restablecer"
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SettingsModal.tsx",
            lineNumber: 184,
            columnNumber: 13
          },
          this
        ),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          Button,
          {
            onClick: handleSave,
            className: "px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-medium shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-300 transform hover:-translate-y-0.5",
            children: "Guardar configuración"
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SettingsModal.tsx",
            lineNumber: 195,
            columnNumber: 13
          },
          this
        )
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SettingsModal.tsx",
        lineNumber: 183,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SettingsModal.tsx",
      lineNumber: 175,
      columnNumber: 9
    }, this)
  ] }, void 0, true, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SettingsModal.tsx",
    lineNumber: 108,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/SettingsModal.tsx",
    lineNumber: 107,
    columnNumber: 5
  }, this);
}
export {
  SettingsModal as default
};
