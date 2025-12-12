import { r as reactExports, j as jsxDevRuntimeExports } from "./index-Cl6Nxn3O.js";
import { i as imageService } from "./imageService-Czw5glVT.js";
import { B as Button } from "./Button-CNFTDiHh.js";
const ServerCard = ({
  server,
  onCopyIP,
  onVisitWebsite,
  onPing,
  onToggleFavorite,
  onDelete,
  status
}) => {
  const [isHovered, setIsHovered] = reactExports.useState(false);
  const [pingLoading, setPingLoading] = reactExports.useState(false);
  const [imageSrc, setImageSrc] = reactExports.useState(server.thumbnail || imageService.getPlaceholderImage(server.name));
  const handlePing = () => {
    setPingLoading(true);
    onPing(server.id, server.ip);
  };
  const handleCopyIP = () => {
    onCopyIP(server.ip);
  };
  const statusText = status ? status.online ? `Online • ${status.players} jugadores • ${status.version || server.requiredVersion || "Versión Desconocida"}` : "Offline" : server.online !== void 0 ? server.online ? `Online • ${server.playerCount || 0}/${server.maxPlayers || "?"} jugadores • ${server.version || server.requiredVersion || "Versión Desconocida"}` : "Offline" : "Haga ping para ver estado";
  const statusColor = status ? status.online ? "text-green-400" : "text-red-400" : server.online !== void 0 ? server.online ? "text-green-400" : "text-red-400" : "text-gray-400";
  const handleImageError = () => {
    setImageSrc(imageService.getPlaceholderImage(server.name));
  };
  const handleDelete = () => {
    onDelete(server.id);
  };
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "div",
    {
      className: "bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group",
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false),
      children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "relative h-32 overflow-hidden", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "img",
            {
              src: imageSrc,
              alt: server.name,
              className: "w-full h-full object-cover transition-transform duration-500 group-hover:scale-110",
              onError: handleImageError
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ServerCard.tsx",
              lineNumber: 93,
              columnNumber: 9
            },
            void 0
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ServerCard.tsx",
            lineNumber: 99,
            columnNumber: 9
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              onClick: () => onToggleFavorite(server.id),
              className: `absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${server.favorite ? "bg-yellow-500 text-yellow-900 hover:bg-yellow-400" : "bg-gray-900/70 text-gray-300 hover:bg-yellow-500 hover:text-yellow-900"}`,
              "aria-label": server.favorite ? "Eliminar de favoritos" : "Agregar a favoritos",
              children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                "svg",
                {
                  className: "w-4 h-4",
                  fill: "currentColor",
                  viewBox: "0 0 20 20",
                  xmlns: "http://www.w3.org/2000/svg",
                  children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { d: "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ServerCard.tsx",
                    lineNumber: 117,
                    columnNumber: 13
                  }, void 0)
                },
                void 0,
                false,
                {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ServerCard.tsx",
                  lineNumber: 111,
                  columnNumber: 11
                },
                void 0
              )
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ServerCard.tsx",
              lineNumber: 102,
              columnNumber: 9
            },
            void 0
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              onClick: handleDelete,
              className: "absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 bg-red-600/80 text-white hover:bg-red-500",
              "aria-label": "Eliminar servidor",
              children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                "svg",
                {
                  className: "w-4 h-4",
                  fill: "none",
                  stroke: "currentColor",
                  viewBox: "0 0 24 24",
                  xmlns: "http://www.w3.org/2000/svg",
                  children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ServerCard.tsx",
                    lineNumber: 134,
                    columnNumber: 13
                  }, void 0)
                },
                void 0,
                false,
                {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ServerCard.tsx",
                  lineNumber: 127,
                  columnNumber: 11
                },
                void 0
              )
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ServerCard.tsx",
              lineNumber: 122,
              columnNumber: 9
            },
            void 0
          )
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ServerCard.tsx",
          lineNumber: 92,
          columnNumber: 7
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-4", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-start", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-bold text-white truncate max-w-[70%]", title: server.name, children: server.name }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ServerCard.tsx",
              lineNumber: 143,
              columnNumber: 13
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-sm text-gray-300 font-mono bg-gray-900/50 px-2 py-1 rounded mt-1 inline-block", children: server.ip }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ServerCard.tsx",
              lineNumber: 146,
              columnNumber: 13
            }, void 0)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ServerCard.tsx",
            lineNumber: 142,
            columnNumber: 11
          }, void 0) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ServerCard.tsx",
            lineNumber: 141,
            columnNumber: 9
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-3 text-xs", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: `font-medium ${statusColor}`, children: statusText }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ServerCard.tsx",
            lineNumber: 154,
            columnNumber: 11
          }, void 0) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ServerCard.tsx",
            lineNumber: 153,
            columnNumber: 9
          }, void 0),
          server.description && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "mt-2 text-sm text-gray-400 line-clamp-2", children: server.description }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ServerCard.tsx",
            lineNumber: 161,
            columnNumber: 11
          }, void 0),
          server.category && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "inline-block mt-2 px-2 py-1 text-xs bg-indigo-900/50 text-indigo-200 rounded-full", children: server.category }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ServerCard.tsx",
            lineNumber: 168,
            columnNumber: 11
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: `mt-4 flex gap-2 transition-all duration-300 ${isHovered ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`, children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "button",
              {
                onClick: handlePing,
                disabled: pingLoading,
                className: "flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors duration-200 flex items-center justify-center gap-1",
                children: pingLoading ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(jsxDevRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "animate-spin h-4 w-4 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ServerCard.tsx",
                      lineNumber: 183,
                      columnNumber: 19
                    }, void 0),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ServerCard.tsx",
                      lineNumber: 184,
                      columnNumber: 19
                    }, void 0)
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ServerCard.tsx",
                    lineNumber: 182,
                    columnNumber: 17
                  }, void 0),
                  "Ping..."
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ServerCard.tsx",
                  lineNumber: 181,
                  columnNumber: 15
                }, void 0) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(jsxDevRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M13 10V3L4 14h7v7l9-11h-7z" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ServerCard.tsx",
                    lineNumber: 191,
                    columnNumber: 19
                  }, void 0) }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ServerCard.tsx",
                    lineNumber: 190,
                    columnNumber: 17
                  }, void 0),
                  "Ping"
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ServerCard.tsx",
                  lineNumber: 189,
                  columnNumber: 15
                }, void 0)
              },
              void 0,
              false,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ServerCard.tsx",
                lineNumber: 175,
                columnNumber: 11
              },
              void 0
            ),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "button",
              {
                onClick: handleCopyIP,
                className: "flex-1 py-2 px-3 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors duration-200 flex items-center justify-center gap-1",
                children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ServerCard.tsx",
                    lineNumber: 203,
                    columnNumber: 15
                  }, void 0) }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ServerCard.tsx",
                    lineNumber: 202,
                    columnNumber: 13
                  }, void 0),
                  "Copiar IP"
                ]
              },
              void 0,
              true,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ServerCard.tsx",
                lineNumber: 198,
                columnNumber: 11
              },
              void 0
            ),
            server.website && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "button",
              {
                onClick: () => onVisitWebsite(server.website),
                className: "flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-colors duration-200 flex items-center justify-center gap-1",
                children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ServerCard.tsx",
                    lineNumber: 214,
                    columnNumber: 17
                  }, void 0) }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ServerCard.tsx",
                    lineNumber: 213,
                    columnNumber: 15
                  }, void 0),
                  "Web"
                ]
              },
              void 0,
              true,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ServerCard.tsx",
                lineNumber: 209,
                columnNumber: 13
              },
              void 0
            )
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ServerCard.tsx",
            lineNumber: 174,
            columnNumber: 9
          }, void 0)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ServerCard.tsx",
          lineNumber: 140,
          columnNumber: 7
        }, void 0)
      ]
    },
    void 0,
    true,
    {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/ServerCard.tsx",
      lineNumber: 86,
      columnNumber: 5
    },
    void 0
  );
};
function Servers() {
  const [list, setList] = reactExports.useState([]);
  const [status, setStatus] = reactExports.useState({});
  const [notification, setNotification] = reactExports.useState(null);
  const [showAddModal, setShowAddModal] = reactExports.useState(false);
  const [editingServer, setEditingServer] = reactExports.useState(null);
  const [serverToDelete, setServerToDelete] = reactExports.useState(null);
  reactExports.useEffect(() => {
    window.api.servers.list().then((servers) => {
      if (servers.length === 0) {
        const sampleServers = [
          {
            id: "hypixel-" + Date.now(),
            name: "Hypixel",
            ip: "mc.hypixel.net",
            description: "El servidor multijugador más grande de Minecraft con minijuegos, SkyBlock y más",
            category: "Minijuegos",
            website: "https://hypixel.net",
            thumbnail: "https://api.minetools.eu/favicon/mc.hypixel.net"
          },
          {
            id: "mineplex-" + Date.now(),
            name: "Mineplex",
            ip: "us.mineplex.com",
            description: "Servidor de minijuegos premium con modos únicos y eventos de temporada",
            category: "Minijuegos",
            website: "https://www.mineplex.com",
            thumbnail: "https://api.minetools.eu/favicon/us.mineplex.com"
          },
          {
            id: "cubecraft-" + Date.now(),
            name: "CubeCraft",
            ip: "play.cubecraft.net",
            description: "Popular servidor de SkyWars, SkyBlock y otros minijuegos de calidad",
            category: "Minijuegos",
            website: "https://www.cubecraft.net",
            thumbnail: "https://api.minetools.eu/favicon/play.cubecraft.net"
          },
          {
            id: "minehq-" + Date.now(),
            name: "MineHQ",
            ip: "play.minehq.net",
            description: "Servidor de minijuegos con SkyBlock, survival y más",
            category: "Minijuegos",
            website: "https://www.minehq.net",
            thumbnail: "https://api.minetools.eu/favicon/play.minehq.net"
          },
          {
            id: "gommehd-" + Date.now(),
            name: "GommeHD",
            ip: "eu.gommehd.net",
            description: "Servidor de minijuegos de alta calidad en Europa",
            category: "Minijuegos",
            website: "https://gommehd.net",
            thumbnail: "https://api.minetools.eu/favicon/eu.gommehd.net"
          },
          {
            id: "2b2t-" + Date.now(),
            name: "2B2T",
            ip: "2b2t.org",
            description: "El servidor anárquico más antiguo de Minecraft",
            category: "Survival Anarquía",
            website: "https://2b2t.org",
            thumbnail: "https://api.minetools.eu/favicon/2b2t.org"
          },
          {
            id: "mccentral-" + Date.now(),
            name: "MCCentral",
            ip: "play.mccentral.org",
            description: "Servidor de survival con comunidades activas y eventos frecuentes",
            category: "Survival",
            website: "https://www.mccentral.org",
            thumbnail: "https://api.minetools.eu/favicon/play.mccentral.org"
          },
          {
            id: "minecade-" + Date.now(),
            name: "MineCade",
            ip: "play.minecade.net",
            description: "Minijuegos competitivos con torneos regulares y modos únicos",
            category: "Minijuegos",
            website: "https://www.minecade.net",
            thumbnail: "https://api.minetools.eu/favicon/play.minecade.net"
          },
          {
            id: "playmc-" + Date.now(),
            name: "PlayMC",
            ip: "mc.play.net",
            description: "Servidor multijugador con minijuegos clásicos y comunidad activa",
            category: "Minijuegos",
            website: "https://play.net",
            thumbnail: "https://api.minetools.eu/favicon/mc.play.net"
          },
          {
            id: "dragonrealms-" + Date.now(),
            name: "DragonRealms",
            ip: "mc.dragonrealms.net",
            description: "RPG con mazmorras, dragones y progresión de clases épica",
            category: "RPG",
            website: "https://www.dragonrealms.net",
            thumbnail: "https://api.minetools.eu/favicon/mc.dragonrealms.net"
          },
          {
            id: "empireminecraft-" + Date.now(),
            name: "Empire Minecraft",
            ip: "play.emc.gs",
            description: "Uno de los servidores de survival más grandes con economía y facciones",
            category: "Factions",
            website: "https://www.empireminecraft.com",
            thumbnail: "https://api.minetools.eu/favicon/play.emc.gs"
          },
          {
            id: "minekraft-" + Date.now(),
            name: "MineKraft",
            ip: "eu.minekraft.com",
            description: "Servidor europeo con minijuegos y modos de juego únicos",
            category: "Minijuegos",
            website: "https://www.minekraft.com",
            thumbnail: "https://api.minetools.eu/favicon/eu.minekraft.com"
          },
          {
            id: "oc.tc-" + Date.now(),
            name: "Overcast Network",
            ip: "oc.tc",
            description: "Servidor especializado en PvP y juegos competitivos",
            category: "PvP",
            website: "https://oc.tc",
            thumbnail: "https://api.minetools.eu/favicon/oc.tc"
          },
          {
            id: "mineplex-" + Date.now(),
            name: "Build Battle",
            ip: "us.buildbattle.net",
            description: "Competiciones de construcción con temas semanales y temporadas",
            category: "Construcción",
            website: "https://buildbattle.net",
            thumbnail: "https://api.minetools.eu/favicon/us.buildbattle.net"
          },
          {
            id: "pixelart-" + Date.now(),
            name: "PixelArt Server",
            ip: "play.pixelart.io",
            description: "Servidor dedicado a creaciones artísticas y proyectos comunitarios",
            category: "Creativo",
            website: "https://pixelart.io",
            thumbnail: "https://api.minetools.eu/favicon/play.pixelart.io"
          },
          {
            id: "westeroscraft-" + Date.now(),
            name: "WesterosCraft",
            ip: "play.westeroscraft.com",
            description: "Mundo épico basado en Game of Thrones con construcción y roles",
            category: "Roleplay",
            website: "https://www.westeroscraft.com",
            thumbnail: "https://api.minetools.eu/favicon/play.westeroscraft.com"
          }
        ];
        setList(sampleServers);
        window.api.servers.save(sampleServers);
      } else {
        const currentServerNames = servers.map((s) => s.name);
        const sampleServers = [
          {
            id: "hypixel-" + Date.now() + "-backup",
            name: "Hypixel",
            ip: "mc.hypixel.net",
            description: "El servidor multijugador más grande de Minecraft con minijuegos, SkyBlock y más",
            category: "Minijuegos",
            website: "https://hypixel.net",
            thumbnail: "https://api.minetools.eu/favicon/mc.hypixel.net"
          },
          {
            id: "mineplex-" + Date.now() + "-backup",
            name: "Mineplex",
            ip: "us.mineplex.com",
            description: "Servidor de minijuegos premium con modos únicos y eventos de temporada",
            category: "Minijuegos",
            website: "https://www.mineplex.com",
            thumbnail: "https://api.minetools.eu/favicon/us.mineplex.com"
          },
          {
            id: "cubecraft-" + Date.now() + "-backup",
            name: "CubeCraft",
            ip: "play.cubecraft.net",
            description: "Popular servidor de SkyWars, SkyBlock y otros minijuegos de calidad",
            category: "Minijuegos",
            website: "https://www.cubecraft.net",
            thumbnail: "https://api.minetools.eu/favicon/play.cubecraft.net"
          },
          {
            id: "minehq-" + Date.now() + "-backup",
            name: "MineHQ",
            ip: "play.minehq.net",
            description: "Servidor de minijuegos con SkyBlock, survival y más",
            category: "Minijuegos",
            website: "https://www.minehq.net",
            thumbnail: "https://api.minetools.eu/favicon/play.minehq.net"
          },
          {
            id: "gommehd-" + Date.now() + "-backup",
            name: "GommeHD",
            ip: "eu.gommehd.net",
            description: "Servidor de minijuegos de alta calidad en Europa",
            category: "Minijuegos",
            website: "https://gommehd.net",
            thumbnail: "https://api.minetools.eu/favicon/eu.gommehd.net"
          },
          {
            id: "2b2t-" + Date.now() + "-backup",
            name: "2B2T",
            ip: "2b2t.org",
            description: "El servidor anárquico más antiguo de Minecraft",
            category: "Survival Anarquía",
            website: "https://2b2t.org",
            thumbnail: "https://api.minetools.eu/favicon/2b2t.org"
          },
          {
            id: "mccentral-" + Date.now() + "-backup",
            name: "MCCentral",
            ip: "play.mccentral.org",
            description: "Servidor de survival con comunidades activas y eventos frecuentes",
            category: "Survival",
            website: "https://www.mccentral.org",
            thumbnail: "https://api.minetools.eu/favicon/play.mccentral.org"
          },
          {
            id: "minecade-" + Date.now() + "-backup",
            name: "MineCade",
            ip: "play.minecade.net",
            description: "Minijuegos competitivos con torneos regulares y modos únicos",
            category: "Minijuegos",
            website: "https://www.minecade.net",
            thumbnail: "https://api.minetools.eu/favicon/play.minecade.net"
          },
          {
            id: "playmc-" + Date.now() + "-backup",
            name: "PlayMC",
            ip: "mc.play.net",
            description: "Servidor multijugador con minijuegos clásicos y comunidad activa",
            category: "Minijuegos",
            website: "https://play.net",
            thumbnail: "https://api.minetools.eu/favicon/mc.play.net"
          },
          {
            id: "dragonrealms-" + Date.now() + "-backup",
            name: "DragonRealms",
            ip: "mc.dragonrealms.net",
            description: "RPG con mazmorras, dragones y progresión de clases épica",
            category: "RPG",
            website: "https://www.dragonrealms.net",
            thumbnail: "https://api.minetools.eu/favicon/mc.dragonrealms.net"
          },
          {
            id: "empireminecraft-" + Date.now() + "-backup",
            name: "Empire Minecraft",
            ip: "play.emc.gs",
            description: "Uno de los servidores de survival más grandes con economía y facciones",
            category: "Factions",
            website: "https://www.empireminecraft.com",
            thumbnail: "https://api.minetools.eu/favicon/play.emc.gs"
          },
          {
            id: "minekraft-" + Date.now() + "-backup",
            name: "MineKraft",
            ip: "eu.minekraft.com",
            description: "Servidor europeo con minijuegos y modos de juego únicos",
            category: "Minijuegos",
            website: "https://www.minekraft.com",
            thumbnail: "https://api.minetools.eu/favicon/eu.minekraft.com"
          },
          {
            id: "oc.tc-" + Date.now() + "-backup",
            name: "Overcast Network",
            ip: "oc.tc",
            description: "Servidor especializado en PvP y juegos competitivos",
            category: "PvP",
            website: "https://oc.tc",
            thumbnail: "https://api.minetools.eu/favicon/oc.tc"
          },
          {
            id: "mineplex-" + Date.now() + "-backup",
            name: "Build Battle",
            ip: "us.buildbattle.net",
            description: "Competiciones de construcción con temas semanales y temporadas",
            category: "Construcción",
            website: "https://buildbattle.net",
            thumbnail: "https://api.minetools.eu/favicon/us.buildbattle.net"
          },
          {
            id: "pixelart-" + Date.now() + "-backup",
            name: "PixelArt Server",
            ip: "play.pixelart.io",
            description: "Servidor dedicado a creaciones artísticas y proyectos comunitarios",
            category: "Creativo",
            website: "https://pixelart.io",
            thumbnail: "https://api.minetools.eu/favicon/play.pixelart.io"
          },
          {
            id: "westeroscraft-" + Date.now() + "-backup",
            name: "WesterosCraft",
            ip: "play.westeroscraft.com",
            description: "Mundo épico basado en Game of Thrones con construcción y roles",
            category: "Roleplay",
            website: "https://www.westeroscraft.com",
            thumbnail: "https://api.minetools.eu/favicon/play.westeroscraft.com"
          }
        ];
        const missingServers = sampleServers.filter(
          (sampleServer) => !currentServerNames.includes(sampleServer.name)
        );
        if (missingServers.length > 0) {
          const updatedServers = [...servers, ...missingServers];
          setList(updatedServers);
          window.api.servers.save(updatedServers);
        } else {
          setList(servers);
        }
      }
    });
  }, []);
  const [newServer, setNewServer] = reactExports.useState({
    name: "",
    ip: "",
    description: "",
    category: "",
    website: "",
    thumbnail: ""
  });
  const handleAddServer = (serverData) => {
    const newServer2 = {
      ...serverData,
      id: Math.random().toString(36).slice(2)
    };
    setList((prev) => [...prev, newServer2]);
    setShowAddModal(false);
    setNewServer({
      name: "",
      ip: "",
      description: "",
      category: "",
      website: "",
      thumbnail: ""
    });
  };
  const handleDeleteServer = (id) => {
    setList((prev) => prev.filter((server) => server.id !== id));
    setServerToDelete(null);
  };
  const save = async () => {
    try {
      await window.api.servers.save(list);
      setNotification({ message: "Servidores guardados correctamente", type: "success" });
      setTimeout(() => setNotification(null), 3e3);
    } catch (error) {
      setNotification({ message: "Error al guardar servidores", type: "error" });
      setTimeout(() => setNotification(null), 3e3);
    }
  };
  const ping = async (id, ip) => {
    try {
      const s = await window.api.servers.ping(ip);
      setStatus((prev) => ({ ...prev, [id]: s }));
    } catch (error) {
      setNotification({ message: "Error al hacer ping al servidor", type: "error" });
      setTimeout(() => setNotification(null), 3e3);
    }
  };
  const copyIP = (ip) => {
    navigator.clipboard.writeText(ip).then(() => {
      setNotification({ message: "IP copiada al portapapeles", type: "success" });
      setTimeout(() => setNotification(null), 3e3);
    }).catch(() => {
      setNotification({ message: "Error al copiar IP", type: "error" });
      setTimeout(() => setNotification(null), 3e3);
    });
  };
  const visitWebsite = (website) => {
    if (website) {
      window.open(website, "_blank");
    }
  };
  const toggleFavorite = (id) => {
    setList(
      (prev) => prev.map(
        (server) => server.id === id ? { ...server, favorite: !server.favorite } : server
      )
    );
  };
  const AddServerModal = () => {
    const [formData, setFormData] = reactExports.useState({
      name: newServer.name,
      ip: newServer.ip,
      description: newServer.description,
      category: newServer.category,
      website: newServer.website,
      thumbnail: newServer.thumbnail
    });
    const handleSubmit = (e) => {
      e.preventDefault();
      handleAddServer(formData);
    };
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    };
    return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/90 backdrop-blur-md rounded-xl border border-gray-700/50 w-full max-w-md p-6", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h2", { className: "text-xl font-bold text-white mb-4", children: "Añadir Servidor" }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
        lineNumber: 462,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-1", children: "Nombre" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
            lineNumber: 465,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "input",
            {
              type: "text",
              name: "name",
              value: formData.name,
              onChange: handleChange,
              className: "w-full px-3 py-2 bg-gray-700/70 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500",
              required: true
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
              lineNumber: 466,
              columnNumber: 15
            },
            this
          )
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
          lineNumber: 464,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-1", children: "IP del Servidor" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
            lineNumber: 476,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "input",
            {
              type: "text",
              name: "ip",
              value: formData.ip,
              onChange: handleChange,
              className: "w-full px-3 py-2 bg-gray-700/70 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500",
              required: true
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
              lineNumber: 477,
              columnNumber: 15
            },
            this
          )
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
          lineNumber: 475,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-1", children: "Descripción" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
            lineNumber: 487,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "textarea",
            {
              name: "description",
              value: formData.description,
              onChange: handleChange,
              rows: 3,
              className: "w-full px-3 py-2 bg-gray-700/70 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
              lineNumber: 488,
              columnNumber: 15
            },
            this
          )
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
          lineNumber: 486,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-1", children: "Categoría" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
            lineNumber: 497,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "input",
            {
              type: "text",
              name: "category",
              value: formData.category,
              onChange: handleChange,
              className: "w-full px-3 py-2 bg-gray-700/70 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
              lineNumber: 498,
              columnNumber: 15
            },
            this
          )
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
          lineNumber: 496,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-1", children: "URL del Sitio Web" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
            lineNumber: 507,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "input",
            {
              type: "text",
              name: "website",
              value: formData.website,
              onChange: handleChange,
              className: "w-full px-3 py-2 bg-gray-700/70 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
              lineNumber: 508,
              columnNumber: 15
            },
            this
          )
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
          lineNumber: 506,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-sm font-medium text-gray-300 mb-1", children: "URL de la Imagen" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
            lineNumber: 517,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "input",
            {
              type: "text",
              name: "thumbnail",
              value: formData.thumbnail,
              onChange: handleChange,
              className: "w-full px-3 py-2 bg-gray-700/70 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
              lineNumber: 518,
              columnNumber: 15
            },
            this
          )
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
          lineNumber: 516,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex gap-3 pt-2", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              type: "submit",
              className: "flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors",
              children: "Añadir"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
              lineNumber: 527,
              columnNumber: 15
            },
            this
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              type: "button",
              onClick: () => setShowAddModal(false),
              className: "flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors",
              children: "Cancelar"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
              lineNumber: 533,
              columnNumber: 15
            },
            this
          )
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
          lineNumber: 526,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
        lineNumber: 463,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
      lineNumber: 461,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
      lineNumber: 460,
      columnNumber: 7
    }, this);
  };
  const DeleteConfirmationModal = () => {
    const serverToBeDeleted = list.find((server) => server.id === serverToDelete);
    return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/90 backdrop-blur-md rounded-xl border border-gray-700/50 w-full max-w-md p-6", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h2", { className: "text-xl font-bold text-white mb-2", children: "Confirmar Eliminación" }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
        lineNumber: 553,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-gray-300 mb-4", children: [
        "¿Estás seguro de que deseas eliminar el servidor ",
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("strong", { children: serverToBeDeleted == null ? void 0 : serverToBeDeleted.name }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
          lineNumber: 555,
          columnNumber: 62
        }, this),
        "?"
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
        lineNumber: 554,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-gray-400 text-sm mb-6", children: "Esta acción no se puede deshacer y el servidor será eliminado permanentemente." }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
        lineNumber: 557,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: () => handleDeleteServer(serverToDelete),
            className: "flex-1 py-2 px-4 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors",
            children: "Eliminar"
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
            lineNumber: 561,
            columnNumber: 13
          },
          this
        ),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: () => setServerToDelete(null),
            className: "flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors",
            children: "Cancelar"
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
            lineNumber: 567,
            columnNumber: 13
          },
          this
        )
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
        lineNumber: 560,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
      lineNumber: 552,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
      lineNumber: 551,
      columnNumber: 7
    }, this);
  };
  const add = () => {
    setNewServer({
      name: "",
      ip: "",
      description: "",
      category: "",
      website: "",
      thumbnail: ""
    });
    setShowAddModal(true);
  };
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h1", { className: "text-2xl font-bold text-white", children: "Servidores de Minecraft" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
          lineNumber: 596,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-gray-400", children: "Accede rápidamente a tus servidores favoritos" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
          lineNumber: 597,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
        lineNumber: 595,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Button, { onClick: add, className: "bg-indigo-600 hover:bg-indigo-500", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-4 h-4 mr-1", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 6v6m0 0v6m0-6h6m-6 0H6" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
            lineNumber: 602,
            columnNumber: 15
          }, this) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
            lineNumber: 601,
            columnNumber: 13
          }, this),
          "Añadir Servidor"
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
          lineNumber: 600,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Button, { onClick: save, className: "bg-green-600 hover:bg-green-500", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-4 h-4 mr-1", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M5 13l4 4L19 7" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
            lineNumber: 608,
            columnNumber: 15
          }, this) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
            lineNumber: 607,
            columnNumber: 13
          }, this),
          "Guardar"
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
          lineNumber: 606,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
        lineNumber: 599,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
      lineNumber: 594,
      columnNumber: 7
    }, this),
    notification && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${notification.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`, children: notification.message }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
      lineNumber: 617,
      columnNumber: 9
    }, this),
    list.length === 0 ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex flex-col items-center justify-center py-12 text-center", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/50 p-6 rounded-xl border border-gray-700/50 w-full max-w-md", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-16 h-16 mx-auto text-gray-500", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
        lineNumber: 631,
        columnNumber: 15
      }, this) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
        lineNumber: 630,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-medium text-white mt-4", children: "No hay servidores" }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
        lineNumber: 633,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-gray-400 mt-2", children: "Añade tu primer servidor para comenzar" }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
        lineNumber: 634,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
        "button",
        {
          onClick: add,
          className: "mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors",
          children: "Añadir Servidor"
        },
        void 0,
        false,
        {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
          lineNumber: 635,
          columnNumber: 13
        },
        this
      )
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
      lineNumber: 629,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
      lineNumber: 628,
      columnNumber: 9
    }, this) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: list.map((server) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
      ServerCard,
      {
        server,
        status: status[server.id] || null,
        onCopyIP: copyIP,
        onVisitWebsite: visitWebsite,
        onPing: ping,
        onToggleFavorite: toggleFavorite,
        onDelete: () => setServerToDelete(server.id)
      },
      server.id,
      false,
      {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
        lineNumber: 646,
        columnNumber: 13
      },
      this
    )) }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
      lineNumber: 644,
      columnNumber: 9
    }, this),
    showAddModal && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(AddServerModal, {}, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
      lineNumber: 661,
      columnNumber: 24
    }, this),
    serverToDelete && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(DeleteConfirmationModal, {}, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
      lineNumber: 662,
      columnNumber: 26
    }, this)
  ] }, void 0, true, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/Servers.tsx",
    lineNumber: 592,
    columnNumber: 5
  }, this);
}
export {
  Servers as default
};
