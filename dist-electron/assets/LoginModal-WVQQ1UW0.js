const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-rzGcl6iF.js","assets/index-CvJk9QuK.css"])))=>i.map(i=>d[i]);
import { r as reactExports, j as jsxDevRuntimeExports, _ as __vitePreload } from "./index-rzGcl6iF.js";
import { B as Button } from "./Button-D40di_yL.js";
import { s as showModernAlert } from "./uiUtils-SWsC2ENo.js";
const ELY_BY_API_BASE = "https://authserver.ely.by";
class ElyByService {
  /**
   * Obtiene el UUID de un usuario por su nombre de usuario
   * GET /api/users/profiles/minecraft/{username}
   * @param username Nombre de usuario a buscar
   * @returns Información del usuario o null si no existe
   */
  async getUserByUsername(username) {
    try {
      const response = await fetch(`${ELY_BY_API_BASE}/api/users/profiles/minecraft/${encodeURIComponent(username)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (response.status === 204) {
        return null;
      }
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error al buscar usuario en Ely.by:", error);
      throw error;
    }
  }
  /**
   * Obtiene el historial de nombres de usuario por UUID
   * GET /api/user/profiles/{uuid}/names
   * @param uuid UUID del usuario
   * @returns Lista de nombres usados por el usuario
   */
  async getUsernameHistory(uuid) {
    try {
      const cleanUuid = uuid.replace(/-/g, "");
      const response = await fetch(`${ELY_BY_API_BASE}/api/user/profiles/${cleanUuid}/names`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (response.status === 204) {
        return [];
      }
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error al obtener historial de nombres:", error);
      throw error;
    }
  }
  /**
   * Verifica si un nombre de usuario existe en Ely.by
   * Usa el proceso principal de Electron para evitar CORS
   * @param username Nombre de usuario a verificar
   * @returns true si el usuario existe, false si no
   */
  async verifyUsername(username) {
    var _a, _b;
    try {
      if ((_b = (_a = window.api) == null ? void 0 : _a.elyby) == null ? void 0 : _b.verifyUsername) {
        const result = await window.api.elyby.verifyUsername(username);
        return result.exists;
      }
      console.warn("IPC handler para Ely.by no está disponible");
      return false;
    } catch (error) {
      console.error("Error al verificar usuario:", error);
      return false;
    }
  }
  /**
   * Autentica un usuario con Ely.by usando correo/username y contraseña
   * Usa el proceso principal de Electron para evitar CORS
   * @param username Correo electrónico o nombre de usuario
   * @param password Contraseña
   * @param totpToken Token TOTP para autenticación de dos factores (opcional)
   * @returns Información del usuario autenticado o información sobre 2FA requerido
   */
  async authenticate(username, password, totpToken) {
    var _a, _b;
    try {
      if ((_b = (_a = window.api) == null ? void 0 : _a.elyby) == null ? void 0 : _b.authenticate) {
        const result = await window.api.elyby.authenticate(username, password, totpToken);
        return result;
      }
      console.warn("IPC handler para autenticación de Ely.by no está disponible");
      return { success: false, error: "IPC handler no disponible" };
    } catch (error) {
      console.error("Error al autenticar usuario:", error);
      return { success: false, error: error.message || "Error desconocido" };
    }
  }
}
const elyByService = new ElyByService();
class MicrosoftAuthService {
  /**
   * Inicia el flujo de autenticación de Microsoft
   * Abre una ventana del navegador para el login de Azure AD y luego
   * encadena los tokens: Azure -> Xbox Live -> Minecraft
   * @returns Información del usuario autenticado de Minecraft
   */
  async authenticate() {
    var _a, _b;
    try {
      if ((_b = (_a = window.api) == null ? void 0 : _a.microsoft) == null ? void 0 : _b.authenticate) {
        const result = await window.api.microsoft.authenticate();
        return result;
      }
      console.warn("IPC handler para autenticación de Microsoft no está disponible");
      return { success: false, error: "IPC handler no disponible" };
    } catch (error) {
      console.error("Error al autenticar usuario con Microsoft:", error);
      return { success: false, error: error.message || "Error desconocido" };
    }
  }
  /**
   * Refresca los tokens de acceso de Microsoft
   * @param accessToken Token de acceso actual
   * @param clientToken Token del cliente
   * @returns Nuevos tokens y perfil
   */
  async refresh(accessToken, clientToken) {
    var _a, _b;
    try {
      if ((_b = (_a = window.api) == null ? void 0 : _a.microsoft) == null ? void 0 : _b.refresh) {
        const result = await window.api.microsoft.refresh(accessToken, clientToken);
        return result;
      }
      console.warn("IPC handler para refresh de Microsoft no está disponible");
      return { success: false, error: "IPC handler no disponible" };
    } catch (error) {
      console.error("Error al refrescar tokens de Microsoft:", error);
      return { success: false, error: error.message || "Error desconocido" };
    }
  }
  /**
   * Valida si un token de acceso es válido
   * @param accessToken Token de acceso a validar
   * @returns true si el token es válido
   */
  async validate(accessToken) {
    var _a, _b;
    try {
      if ((_b = (_a = window.api) == null ? void 0 : _a.microsoft) == null ? void 0 : _b.validate) {
        const result = await window.api.microsoft.validate(accessToken);
        return result;
      }
      console.warn("IPC handler para validación de Microsoft no está disponible");
      return { success: false, isValid: false, error: "IPC handler no disponible" };
    } catch (error) {
      console.error("Error al validar token de Microsoft:", error);
      return { success: false, isValid: false, error: error.message || "Error desconocido" };
    }
  }
}
const microsoftAuthService = new MicrosoftAuthService();
function LoginModal({ isOpen, onClose, onMicrosoftLogin, onNonPremiumLogin, onElyByLogin }) {
  const [nonPremiumUsername, setNonPremiumUsername] = reactExports.useState("");
  const [elyByUsername, setElyByUsername] = reactExports.useState("");
  const [elyByPassword, setElyByPassword] = reactExports.useState("");
  const [elyByTotpToken, setElyByTotpToken] = reactExports.useState("");
  const [elyByRequires2FA, setElyByRequires2FA] = reactExports.useState(false);
  const [elyByClientToken, setElyByClientToken] = reactExports.useState(null);
  const [isElyByAuthenticating, setIsElyByAuthenticating] = reactExports.useState(false);
  const [selectedLoginType, setSelectedLoginType] = reactExports.useState("none");
  const [isLittleSkinAuthenticating, setIsLittleSkinAuthenticating] = reactExports.useState(false);
  const [showOtherMethods, setShowOtherMethods] = reactExports.useState(false);
  const [yggdrasilUsername, setYggdrasilUsername] = reactExports.useState("");
  const [yggdrasilPassword, setYggdrasilPassword] = reactExports.useState("");
  const [isYggdrasilAuthenticating, setIsYggdrasilAuthenticating] = reactExports.useState(false);
  const [drkAuthUsername, setDrkAuthUsername] = reactExports.useState("");
  const [drkAuthPassword, setDrkAuthPassword] = reactExports.useState("");
  const [isDrkAuthAuthenticating, setIsDrkAuthAuthenticating] = reactExports.useState(false);
  const [isMicrosoftAuthenticating, setIsMicrosoftAuthenticating] = reactExports.useState(false);
  if (!isOpen) {
    return null;
  }
  const handleNonPremiumSubmit = () => {
    if (nonPremiumUsername.trim()) {
      onNonPremiumLogin(nonPremiumUsername.trim());
      setNonPremiumUsername("");
      setSelectedLoginType("none");
    }
  };
  const handleMicrosoftClick = () => {
    setSelectedLoginType("microsoft");
  };
  const handleMicrosoftLoginConfirm = async () => {
    if (isMicrosoftAuthenticating) {
      return;
    }
    setIsMicrosoftAuthenticating(true);
    try {
      const result = await microsoftAuthService.authenticate();
      if (result && result.success && result.selectedProfile) {
        const profileService = await __vitePreload(() => import("./index-rzGcl6iF.js").then((n) => n.d), true ? __vite__mapDeps([0,1]) : void 0);
        profileService.profileService.addProfile(
          result.selectedProfile.name,
          "microsoft",
          {
            accessToken: result.accessToken,
            clientToken: result.clientToken
          }
        );
        if (onElyByLogin) {
          onElyByLogin(result.selectedProfile.name);
        }
        setSelectedLoginType("none");
        setIsMicrosoftAuthenticating(false);
      } else {
        const errorMessage = (result == null ? void 0 : result.error) || "Error al autenticar con Microsoft. Por favor, inténtalo de nuevo.";
        await showModernAlert(
          "Error de autenticación",
          errorMessage,
          "error"
        );
        setIsMicrosoftAuthenticating(false);
      }
    } catch (error) {
      console.error("Error al autenticar con Microsoft:", error);
      await showModernAlert(
        "Error de conexión",
        "No se pudo completar la autenticación con Microsoft. Por favor, verifica tu conexión e inténtalo de nuevo.",
        "error"
      );
      setIsMicrosoftAuthenticating(false);
    }
  };
  const handleElyByLogin = async () => {
    if (!elyByUsername.trim() || !elyByPassword.trim() || isElyByAuthenticating || !onElyByLogin) {
      return;
    }
    if (elyByRequires2FA && !elyByTotpToken.trim()) {
      await showModernAlert(
        "Token requerido",
        "Por favor, ingresa el código de verificación de dos factores.",
        "warning"
      );
      return;
    }
    setIsElyByAuthenticating(true);
    try {
      const result = await elyByService.authenticate(
        elyByUsername.trim(),
        elyByPassword,
        elyByRequires2FA ? elyByTotpToken.trim() : void 0
      );
      if (result && result.success && result.selectedProfile) {
        onElyByLogin(result.selectedProfile.name);
        setElyByUsername("");
        setElyByPassword("");
        setElyByTotpToken("");
        setElyByRequires2FA(false);
        setElyByClientToken(null);
        setSelectedLoginType("none");
        setIsElyByAuthenticating(false);
      } else if (result && result.requires2FA) {
        setElyByRequires2FA(true);
        setElyByClientToken(result.clientToken || null);
        setIsElyByAuthenticating(false);
        await showModernAlert(
          "Autenticación de dos factores",
          "Esta cuenta está protegida con autenticación de dos factores. Por favor, ingresa el código de verificación de tu aplicación de autenticación.",
          "info"
        );
      } else {
        const errorMessage = (result == null ? void 0 : result.error) || "Credenciales incorrectas. Por favor, verifica tu correo/nombre de usuario y contraseña.";
        await showModernAlert(
          "Error de autenticación",
          errorMessage,
          "error"
        );
        setIsElyByAuthenticating(false);
        if (elyByRequires2FA) {
          setElyByRequires2FA(false);
          setElyByTotpToken("");
          setElyByClientToken(null);
        }
      }
    } catch (error) {
      console.error("Error al autenticar usuario en Ely.by:", error);
      await showModernAlert(
        "Error de conexión",
        "No se pudo conectar con Ely.by. Por favor, verifica tu conexión e inténtalo de nuevo.",
        "error"
      );
      setIsElyByAuthenticating(false);
    }
  };
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto custom-scrollbar", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gradient-to-br from-gray-800 to-gray-900 p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700/50 relative backdrop-blur-md my-4 max-h-[90vh] overflow-y-auto custom-scrollbar", children: [
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
      "button",
      {
        onClick: onClose,
        className: "absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10",
        children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M6 18L18 6M6 6l12 12" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
          lineNumber: 304,
          columnNumber: 13
        }, this) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
          lineNumber: 303,
          columnNumber: 11
        }, this)
      },
      void 0,
      false,
      {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
        lineNumber: 299,
        columnNumber: 9
      },
      this
    ),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h2", { className: "text-2xl md:text-3xl font-extrabold text-white mb-4 md:mb-6 text-center pr-8", children: "Iniciar Sesión" }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
      lineNumber: 308,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-3 md:space-y-4", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-gray-300 text-center mb-3 md:mb-4 font-medium text-sm md:text-base", children: "Selecciona tu método de inicio de sesión:" }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
        lineNumber: 311,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
        "div",
        {
          onClick: handleMicrosoftClick,
          className: `w-full cursor-pointer p-4 rounded-xl transition-all duration-300 shadow-lg border-2 ${selectedLoginType === "microsoft" ? "border-blue-500 bg-blue-900/30" : "border-gray-700 bg-gray-700/50 hover:border-gray-600 hover:bg-gray-700/70"}`,
          children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-6 h-6 text-blue-400", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { d: "M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm10 0a2 2 0 012 2v6a2 2 0 01-2 2h-2V5h2z" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                lineNumber: 325,
                columnNumber: 19
              }, this) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                lineNumber: 324,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-left", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-white font-semibold", children: "Iniciar sesión con Microsoft" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                  lineNumber: 328,
                  columnNumber: 19
                }, this),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-400", children: "Autenticación oficial de Minecraft" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                  lineNumber: 329,
                  columnNumber: 19
                }, this)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                lineNumber: 327,
                columnNumber: 17
              }, this)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
              lineNumber: 323,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: `w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedLoginType === "microsoft" ? "border-blue-500 bg-blue-500" : "border-gray-500"}`, children: selectedLoginType === "microsoft" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-3 h-3 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "3", d: "M5 13l4 4L19 7" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
              lineNumber: 337,
              columnNumber: 21
            }, this) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
              lineNumber: 336,
              columnNumber: 19
            }, this) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
              lineNumber: 332,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
            lineNumber: 322,
            columnNumber: 13
          }, this)
        },
        void 0,
        false,
        {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
          lineNumber: 314,
          columnNumber: 11
        },
        this
      ),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
        "div",
        {
          onClick: () => setSelectedLoginType("non-premium"),
          className: `w-full cursor-pointer p-3 md:p-4 rounded-xl transition-all duration-300 shadow-lg border-2 ${selectedLoginType === "non-premium" ? "border-emerald-500 bg-emerald-900/30" : "border-gray-700 bg-gray-700/50 hover:border-gray-600 hover:bg-gray-700/70"}`,
          children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5 md:w-6 md:h-6 text-emerald-400", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { fillRule: "evenodd", d: "M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z", clipRule: "evenodd" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                lineNumber: 356,
                columnNumber: 19
              }, this) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                lineNumber: 355,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-left", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-white font-semibold text-sm md:text-base", children: "Iniciar sesión no premium" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                  lineNumber: 359,
                  columnNumber: 19
                }, this),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-400", children: "Para usuarios sin cuenta premium" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                  lineNumber: 360,
                  columnNumber: 19
                }, this)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                lineNumber: 358,
                columnNumber: 17
              }, this)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
              lineNumber: 354,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: `w-4 h-4 md:w-5 md:h-5 rounded-full border-2 flex items-center justify-center ${selectedLoginType === "non-premium" ? "border-emerald-500 bg-emerald-500" : "border-gray-500"}`, children: selectedLoginType === "non-premium" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-2.5 h-2.5 md:w-3 md:h-3 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "3", d: "M5 13l4 4L19 7" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
              lineNumber: 368,
              columnNumber: 21
            }, this) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
              lineNumber: 367,
              columnNumber: 19
            }, this) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
              lineNumber: 363,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
            lineNumber: 353,
            columnNumber: 13
          }, this)
        },
        void 0,
        false,
        {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
          lineNumber: 345,
          columnNumber: 11
        },
        this
      ),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-3 pt-3 border-t border-gray-700/50", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: () => setShowOtherMethods(!showOtherMethods),
            className: "w-full p-3 rounded-xl transition-all duration-300 shadow-lg border-2 border-gray-700 bg-gray-700/50 hover:border-gray-600 hover:bg-gray-700/70 flex items-center justify-between",
            children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 6v6m0 0v6m0-6h6m-6 0H6" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                  lineNumber: 383,
                  columnNumber: 19
                }, this) }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                  lineNumber: 382,
                  columnNumber: 17
                }, this),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-white font-semibold text-sm md:text-base", children: "Otros métodos de inicio de sesión" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                  lineNumber: 385,
                  columnNumber: 17
                }, this)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                lineNumber: 381,
                columnNumber: 15
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                "svg",
                {
                  className: `w-5 h-5 text-gray-400 transition-transform duration-300 ${showOtherMethods ? "rotate-180" : ""}`,
                  fill: "none",
                  stroke: "currentColor",
                  viewBox: "0 0 24 24",
                  children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M19 9l-7 7-7-7" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                    lineNumber: 393,
                    columnNumber: 17
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                  lineNumber: 387,
                  columnNumber: 15
                },
                this
              )
            ]
          },
          void 0,
          true,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
            lineNumber: 377,
            columnNumber: 13
          },
          this
        ),
        showOtherMethods && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-3 space-y-2 animate-in slide-in-from-top-2 duration-200", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "div",
            {
              onClick: () => setSelectedLoginType("littleskin"),
              className: `w-full cursor-pointer p-3 md:p-4 rounded-xl transition-all duration-300 shadow-lg border-2 ${selectedLoginType === "littleskin" ? "border-green-500 bg-green-900/30" : "border-gray-700 bg-gray-700/50 hover:border-gray-600 hover:bg-gray-700/70"}`,
              children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5 md:w-6 md:h-6 text-green-400", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                    lineNumber: 412,
                    columnNumber: 25
                  }, this) }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                    lineNumber: 411,
                    columnNumber: 23
                  }, this),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-left", children: [
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-white font-semibold text-sm md:text-base", children: "Iniciar sesión con LittleSkin" }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                      lineNumber: 415,
                      columnNumber: 25
                    }, this),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-400", children: "OAuth 2.0 - Alternativa estable" }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                      lineNumber: 416,
                      columnNumber: 25
                    }, this)
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                    lineNumber: 414,
                    columnNumber: 23
                  }, this)
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                  lineNumber: 410,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: `w-4 h-4 md:w-5 md:h-5 rounded-full border-2 flex items-center justify-center ${selectedLoginType === "littleskin" ? "border-green-500 bg-green-500" : "border-gray-500"}`, children: selectedLoginType === "littleskin" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-2.5 h-2.5 md:w-3 md:h-3 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "3", d: "M5 13l4 4L19 7" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                  lineNumber: 424,
                  columnNumber: 27
                }, this) }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                  lineNumber: 423,
                  columnNumber: 25
                }, this) }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                  lineNumber: 419,
                  columnNumber: 21
                }, this)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                lineNumber: 409,
                columnNumber: 19
              }, this)
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
              lineNumber: 401,
              columnNumber: 17
            },
            this
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "div",
            {
              onClick: () => setSelectedLoginType("elyby"),
              className: `w-full cursor-pointer p-3 md:p-4 rounded-xl transition-all duration-300 shadow-lg border-2 ${selectedLoginType === "elyby" ? "border-purple-500 bg-purple-900/30" : "border-gray-700 bg-gray-700/50 hover:border-gray-600 hover:bg-gray-700/70"}`,
              children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5 md:w-6 md:h-6 text-purple-400", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                    lineNumber: 443,
                    columnNumber: 25
                  }, this) }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                    lineNumber: 442,
                    columnNumber: 23
                  }, this),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-left", children: [
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-white font-semibold text-sm md:text-base", children: "Iniciar sesión con Ely.by" }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                      lineNumber: 446,
                      columnNumber: 25
                    }, this),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-400", children: "Sistema alternativo de skins y autenticación" }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                      lineNumber: 447,
                      columnNumber: 25
                    }, this)
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                    lineNumber: 445,
                    columnNumber: 23
                  }, this)
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                  lineNumber: 441,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: `w-4 h-4 md:w-5 md:h-5 rounded-full border-2 flex items-center justify-center ${selectedLoginType === "elyby" ? "border-purple-500 bg-purple-500" : "border-gray-500"}`, children: selectedLoginType === "elyby" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-2.5 h-2.5 md:w-3 md:h-3 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "3", d: "M5 13l4 4L19 7" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                  lineNumber: 455,
                  columnNumber: 27
                }, this) }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                  lineNumber: 454,
                  columnNumber: 25
                }, this) }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                  lineNumber: 450,
                  columnNumber: 21
                }, this)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                lineNumber: 440,
                columnNumber: 19
              }, this)
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
              lineNumber: 432,
              columnNumber: 17
            },
            this
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "div",
            {
              onClick: () => setSelectedLoginType("drkauth"),
              className: `w-full cursor-pointer p-3 md:p-4 rounded-xl transition-all duration-300 shadow-lg border-2 ${selectedLoginType === "drkauth" ? "border-cyan-500 bg-cyan-900/30" : "border-gray-700 bg-gray-700/50 hover:border-gray-600 hover:bg-gray-700/70"}`,
              children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5 md:w-6 md:h-6 text-cyan-400", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                    lineNumber: 474,
                    columnNumber: 25
                  }, this) }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                    lineNumber: 473,
                    columnNumber: 23
                  }, this),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-left", children: [
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-white font-semibold text-sm md:text-base", children: "Iniciar sesión con Drk Launcher" }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                      lineNumber: 477,
                      columnNumber: 25
                    }, this),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-400", children: "Servidor de autenticación oficial" }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                      lineNumber: 478,
                      columnNumber: 25
                    }, this)
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                    lineNumber: 476,
                    columnNumber: 23
                  }, this)
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                  lineNumber: 472,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: `w-4 h-4 md:w-5 md:h-5 rounded-full border-2 flex items-center justify-center ${selectedLoginType === "drkauth" ? "border-cyan-500 bg-cyan-500" : "border-gray-500"}`, children: selectedLoginType === "drkauth" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-2.5 h-2.5 md:w-3 md:h-3 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "3", d: "M5 13l4 4L19 7" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                  lineNumber: 486,
                  columnNumber: 27
                }, this) }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                  lineNumber: 485,
                  columnNumber: 25
                }, this) }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                  lineNumber: 481,
                  columnNumber: 21
                }, this)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                lineNumber: 471,
                columnNumber: 19
              }, this)
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
              lineNumber: 463,
              columnNumber: 17
            },
            this
          )
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
          lineNumber: 399,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
        lineNumber: 376,
        columnNumber: 11
      }, this),
      selectedLoginType === "non-premium" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-4 mt-2", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "relative mx-auto max-w-full", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "input",
            {
              type: "text",
              placeholder: "Nombre de usuario",
              className: "w-full p-4 rounded-xl bg-gray-800/80 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-lg text-lg transition-all duration-300",
              value: nonPremiumUsername,
              onChange: (e) => setNonPremiumUsername(e.target.value),
              onKeyPress: (e) => {
                if (e.key === "Enter") {
                  handleNonPremiumSubmit();
                }
              }
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
              lineNumber: 500,
              columnNumber: 17
            },
            this
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "absolute inset-y-0 right-0 flex items-center pr-3", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
            lineNumber: 514,
            columnNumber: 21
          }, this) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
            lineNumber: 513,
            columnNumber: 19
          }, this) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
            lineNumber: 512,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
          lineNumber: 499,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          Button,
          {
            onClick: handleNonPremiumSubmit,
            disabled: !nonPremiumUsername.trim(),
            className: `w-full py-4 px-4 rounded-xl transition-all duration-300 shadow-lg text-lg font-semibold ${nonPremiumUsername.trim() ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/40 hover:shadow-emerald-500/50 transform hover:-translate-y-0.5" : "bg-gray-700 text-gray-400 cursor-not-allowed"}`,
            children: "Iniciar sesión"
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
            lineNumber: 518,
            columnNumber: 15
          },
          this
        )
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
        lineNumber: 498,
        columnNumber: 13
      }, this),
      selectedLoginType === "microsoft" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-4 mt-2", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gradient-to-br from-blue-900/90 to-indigo-900/90 text-white p-5 rounded-xl shadow-xl border border-blue-700/40 backdrop-blur-sm", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-center mb-3", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-10 h-10", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { d: "M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm10 0a2 2 0 012 2v6a2 2 0 01-2 2h-2V5h2z" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
            lineNumber: 537,
            columnNumber: 21
          }, this) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
            lineNumber: 536,
            columnNumber: 19
          }, this) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
            lineNumber: 535,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-center", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-bold mb-2", children: "Inicio de Sesión con Microsoft" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
              lineNumber: 541,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-blue-200 text-sm mb-3", children: "Inicia sesión con tu cuenta de Microsoft para acceder a Minecraft" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
              lineNumber: 542,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
            lineNumber: 540,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
          lineNumber: 534,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-sm text-blue-200 text-center", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "font-semibold", children: "💡 Autenticación oficial:" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
            lineNumber: 549,
            columnNumber: 19
          }, this),
          " Al hacer clic, se abrirá tu navegador para que inicies sesión con tu cuenta de Microsoft. Este es el método oficial de autenticación de Minecraft."
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
          lineNumber: 548,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
          lineNumber: 547,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          Button,
          {
            onClick: handleMicrosoftLoginConfirm,
            disabled: isMicrosoftAuthenticating,
            className: `w-full py-4 text-lg font-semibold transition-all duration-300 shadow-lg rounded-xl ${!isMicrosoftAuthenticating ? "bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-blue-500/40 hover:shadow-blue-500/50 transform hover:-translate-y-0.5" : "bg-gray-700 text-gray-400 cursor-not-allowed"}`,
            children: isMicrosoftAuthenticating ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "flex items-center justify-center gap-2", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "animate-spin h-5 w-5", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                  lineNumber: 566,
                  columnNumber: 23
                }, this),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                  lineNumber: 567,
                  columnNumber: 23
                }, this)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                lineNumber: 565,
                columnNumber: 21
              }, this),
              "Autenticando..."
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
              lineNumber: 564,
              columnNumber: 19
            }, this) : "Iniciar sesión con Microsoft"
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
            lineNumber: 554,
            columnNumber: 15
          },
          this
        )
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
        lineNumber: 533,
        columnNumber: 13
      }, this),
      selectedLoginType === "littleskin" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-4 mt-2", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gradient-to-br from-green-900/90 to-emerald-900/90 text-white p-5 rounded-xl shadow-xl border border-green-700/40 backdrop-blur-sm", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-center mb-3", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-10 h-10", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
            lineNumber: 583,
            columnNumber: 21
          }, this) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
            lineNumber: 582,
            columnNumber: 19
          }, this) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
            lineNumber: 581,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-center mb-4", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-bold mb-2", children: "Inicio de Sesión con LittleSkin" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
              lineNumber: 587,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-green-200 text-sm mb-3", children: "Usa OAuth 2.0 para una autenticación segura" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
              lineNumber: 588,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "a",
              {
                href: "https://littleskin.cn/",
                target: "_blank",
                rel: "noopener noreferrer",
                className: "inline-block bg-green-700/80 text-green-100 px-4 py-1.5 rounded-full text-sm font-semibold mx-auto hover:bg-green-600/80 transition-colors mb-3",
                onClick: (e) => {
                  e.stopPropagation();
                },
                children: "Visitar LittleSkin"
              },
              void 0,
              false,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                lineNumber: 589,
                columnNumber: 19
              },
              this
            )
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
            lineNumber: 586,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
          lineNumber: 580,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mb-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-sm text-green-200 text-center", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "font-semibold", children: "💡 Método OAuth 2.0:" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
            lineNumber: 606,
            columnNumber: 19
          }, this),
          " Al hacer clic, se abrirá tu navegador para que inicies sesión directamente en la página de LittleSkin. No necesitas escribir nada aquí."
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
          lineNumber: 605,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
          lineNumber: 604,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          Button,
          {
            onClick: async () => {
              if (isLittleSkinAuthenticating) return;
              setIsLittleSkinAuthenticating(true);
              try {
                const result = await window.api.littleskin.startOAuth();
                if (result && result.success && result.selectedProfile) {
                  if (onElyByLogin) {
                    onElyByLogin(result.selectedProfile.name);
                  }
                  setSelectedLoginType("none");
                  setIsLittleSkinAuthenticating(false);
                } else {
                  await showModernAlert(
                    "Error de autenticación",
                    (result == null ? void 0 : result.error) || "No se pudo completar la autenticación con LittleSkin.",
                    "error"
                  );
                  setIsLittleSkinAuthenticating(false);
                }
              } catch (error) {
                console.error("Error al autenticar con LittleSkin:", error);
                await showModernAlert(
                  "Error de conexión",
                  "No se pudo conectar con LittleSkin. Por favor, verifica tu conexión e inténtalo de nuevo.",
                  "error"
                );
                setIsLittleSkinAuthenticating(false);
              }
            },
            disabled: isLittleSkinAuthenticating,
            className: `w-full py-4 px-4 rounded-xl transition-all duration-300 shadow-lg text-lg font-semibold ${!isLittleSkinAuthenticating ? "bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white shadow-green-500/40 hover:shadow-green-500/50 transform hover:-translate-y-0.5" : "bg-gray-700 text-gray-400 cursor-not-allowed"}`,
            children: isLittleSkinAuthenticating ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "flex items-center justify-center gap-2", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "animate-spin h-5 w-5", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                  lineNumber: 653,
                  columnNumber: 23
                }, this),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                  lineNumber: 654,
                  columnNumber: 23
                }, this)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                lineNumber: 652,
                columnNumber: 21
              }, this),
              "Abriendo navegador..."
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
              lineNumber: 651,
              columnNumber: 19
            }, this) : "Iniciar sesión con OAuth 2.0"
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
            lineNumber: 611,
            columnNumber: 15
          },
          this
        )
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
        lineNumber: 579,
        columnNumber: 13
      }, this),
      selectedLoginType === "elyby" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-4 mt-2", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gradient-to-br from-purple-900/90 to-pink-900/90 text-white p-5 rounded-xl shadow-xl border border-purple-700/40 backdrop-blur-sm", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-center mb-3", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-10 h-10", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
            lineNumber: 670,
            columnNumber: 21
          }, this) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
            lineNumber: 669,
            columnNumber: 19
          }, this) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
            lineNumber: 668,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-center mb-4", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-bold mb-2", children: "Inicio de Sesión con Ely.by" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
              lineNumber: 674,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-purple-200 text-sm mb-3", children: "Usa OAuth 2.0 para una autenticación segura" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
              lineNumber: 675,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "a",
              {
                href: "https://ely.by/",
                target: "_blank",
                rel: "noopener noreferrer",
                className: "inline-block bg-purple-700/80 text-purple-100 px-4 py-1.5 rounded-full text-sm font-semibold mx-auto hover:bg-purple-600/80 transition-colors mb-3",
                onClick: (e) => {
                  e.stopPropagation();
                  window.open("https://ely.by/", "_blank");
                },
                children: "Visitar Ely.by"
              },
              void 0,
              false,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                lineNumber: 676,
                columnNumber: 19
              },
              this
            )
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
            lineNumber: 673,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
          lineNumber: 667,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mb-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-sm text-purple-200 text-center", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "font-semibold", children: "💡 Método OAuth 2.0:" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
            lineNumber: 694,
            columnNumber: 19
          }, this),
          " Al hacer clic, se abrirá tu navegador para que inicies sesión directamente en la página de Ely.by. No necesitas escribir nada aquí."
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
          lineNumber: 693,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
          lineNumber: 692,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          Button,
          {
            onClick: async () => {
              var _a, _b;
              if (isElyByAuthenticating) return;
              setIsElyByAuthenticating(true);
              try {
                if ((_b = (_a = window.api) == null ? void 0 : _a.elyby) == null ? void 0 : _b.startOAuth) {
                  const result = await window.api.elyby.startOAuth();
                  if (result && result.success && result.selectedProfile) {
                    onElyByLogin(result.selectedProfile.name);
                    setElyByUsername("");
                    setElyByPassword("");
                    setElyByTotpToken("");
                    setElyByRequires2FA(false);
                    setElyByClientToken(null);
                    setSelectedLoginType("none");
                    setIsElyByAuthenticating(false);
                  } else {
                    const errorMessage = (result == null ? void 0 : result.error) || "Error al autenticar con OAuth";
                    await showModernAlert(
                      "Error de autenticación",
                      errorMessage,
                      "error"
                    );
                    setIsElyByAuthenticating(false);
                  }
                } else {
                  await showModernAlert(
                    "Error",
                    "OAuth 2.0 no está disponible. Por favor, usa el método directo.",
                    "error"
                  );
                  setIsElyByAuthenticating(false);
                }
              } catch (error) {
                console.error("Error al iniciar OAuth de Ely.by:", error);
                await showModernAlert(
                  "Error de conexión",
                  error.message || "No se pudo iniciar la autenticación OAuth. Por favor, verifica tu conexión e inténtalo de nuevo.",
                  "error"
                );
                setIsElyByAuthenticating(false);
              }
            },
            disabled: isElyByAuthenticating,
            className: `w-full py-4 px-4 rounded-xl transition-all duration-300 shadow-lg text-lg font-semibold ${!isElyByAuthenticating ? "bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800 text-white shadow-purple-500/40 hover:shadow-purple-500/50 transform hover:-translate-y-0.5" : "bg-gray-700 text-gray-400 cursor-not-allowed"}`,
            children: isElyByAuthenticating ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "flex items-center justify-center gap-2", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "animate-spin h-5 w-5", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                  lineNumber: 757,
                  columnNumber: 23
                }, this),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                  lineNumber: 758,
                  columnNumber: 23
                }, this)
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                lineNumber: 756,
                columnNumber: 21
              }, this),
              "Abriendo navegador..."
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
              lineNumber: 755,
              columnNumber: 19
            }, this) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "flex items-center justify-center gap-2", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                lineNumber: 765,
                columnNumber: 23
              }, this) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                lineNumber: 764,
                columnNumber: 21
              }, this),
              "Iniciar sesión con OAuth 2.0 (PKCE)"
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
              lineNumber: 763,
              columnNumber: 19
            }, this)
          },
          void 0,
          false,
          {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
            lineNumber: 699,
            columnNumber: 15
          },
          this
        ),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-3 pt-3 border-t border-gray-700 hidden", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-center text-xs text-gray-400 mb-3", children: "¿Prefieres usar usuario y contraseña directamente?" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
            lineNumber: 774,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "relative", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "input",
              {
                type: "text",
                placeholder: "Correo o nombre de usuario",
                className: "w-full p-3 rounded-xl bg-gray-800/80 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-lg text-base transition-all duration-300",
                value: elyByUsername,
                onChange: (e) => setElyByUsername(e.target.value),
                disabled: isElyByAuthenticating
              },
              void 0,
              false,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                lineNumber: 779,
                columnNumber: 21
              },
              this
            ) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
              lineNumber: 778,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "relative", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "input",
              {
                type: "password",
                placeholder: "Contraseña",
                className: "w-full p-3 rounded-xl bg-gray-800/80 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-lg text-base transition-all duration-300",
                value: elyByPassword,
                onChange: (e) => setElyByPassword(e.target.value),
                disabled: isElyByAuthenticating || elyByRequires2FA,
                onKeyPress: async (e) => {
                  if (e.key === "Enter" && elyByUsername.trim() && elyByPassword.trim() && !isElyByAuthenticating) {
                    await handleElyByLogin();
                  }
                }
              },
              void 0,
              false,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                lineNumber: 790,
                columnNumber: 21
              },
              this
            ) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
              lineNumber: 789,
              columnNumber: 19
            }, this),
            elyByRequires2FA && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "relative", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mb-2 text-sm text-purple-300 flex items-center gap-2", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-4 h-4", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z", clipRule: "evenodd" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                  lineNumber: 810,
                  columnNumber: 27
                }, this) }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                  lineNumber: 809,
                  columnNumber: 25
                }, this),
                "Código de verificación (2FA)"
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                lineNumber: 808,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                "input",
                {
                  type: "text",
                  placeholder: "Ingresa el código de 6 dígitos",
                  className: "w-full p-3 rounded-xl bg-gray-800/80 text-white border-2 border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-lg text-base transition-all duration-300",
                  value: elyByTotpToken,
                  onChange: (e) => setElyByTotpToken(e.target.value.replace(/\D/g, "").slice(0, 6)),
                  disabled: isElyByAuthenticating,
                  maxLength: 6,
                  autoFocus: true,
                  onKeyPress: async (e) => {
                    if (e.key === "Enter" && elyByTotpToken.trim().length === 6 && !isElyByAuthenticating) {
                      await handleElyByLogin();
                    }
                  }
                },
                void 0,
                false,
                {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                  lineNumber: 814,
                  columnNumber: 23
                },
                this
              )
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
              lineNumber: 807,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              Button,
              {
                onClick: handleElyByLogin,
                disabled: !elyByUsername.trim() || !elyByPassword.trim() || isElyByAuthenticating || elyByRequires2FA && elyByTotpToken.trim().length !== 6,
                variant: "secondary",
                className: "w-full py-2 px-4 text-sm",
                children: isElyByAuthenticating ? elyByRequires2FA ? "Verificando código..." : "Autenticando..." : elyByRequires2FA ? "Verificar código" : "Método directo (usuario/contraseña)"
              },
              void 0,
              false,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
                lineNumber: 832,
                columnNumber: 19
              },
              this
            )
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
            lineNumber: 777,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
          lineNumber: 773,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
        lineNumber: 666,
        columnNumber: 13
      }, this),
      (selectedLoginType === "microsoft" || selectedLoginType === "non-premium" || selectedLoginType === "elyby" || selectedLoginType === "littleskin") && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "pt-3", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
        Button,
        {
          variant: "secondary",
          onClick: () => {
            setSelectedLoginType("none");
            setNonPremiumUsername("");
          },
          className: "w-full py-4 text-lg font-semibold bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white transition-all duration-300 shadow-lg shadow-gray-500/20 rounded-xl",
          children: "Volver"
        },
        void 0,
        false,
        {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
          lineNumber: 855,
          columnNumber: 15
        },
        this
      ) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
        lineNumber: 854,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
      lineNumber: 310,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-6 pt-4 border-t border-gray-700/50", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
      Button,
      {
        variant: "secondary",
        onClick: onClose,
        className: "w-full py-3 rounded-xl bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-gray-300 font-medium shadow-lg shadow-gray-500/20 transition-all duration-300",
        children: "Cancelar"
      },
      void 0,
      false,
      {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
        lineNumber: 870,
        columnNumber: 11
      },
      this
    ) }, void 0, false, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
      lineNumber: 869,
      columnNumber: 9
    }, this)
  ] }, void 0, true, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
    lineNumber: 298,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/LoginModal.tsx",
    lineNumber: 297,
    columnNumber: 5
  }, this);
}
export {
  LoginModal as default
};
