var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { r as reactExports, j as jsxDevRuntimeExports } from "./index-DjhV90hH.js";
import { C as Card } from "./Card-Bk7oAHPi.js";
import { B as Button } from "./Button-BNVPG3Tp.js";
import { C as ConfirmationModal } from "./ConfirmationModal-CGyV_l0g.js";
import "./index-ngR8kLqd.js";
import "./proxy-CAAup1AM.js";
class QwenAIService {
  // 30 segundos de enfriamiento tras error 429
  constructor() {
    __publicField(this, "apiKey", null);
    __publicField(this, "baseURL", "https://openrouter.ai/api/v1/chat/completions");
    __publicField(this, "currentConversationId", null);
    __publicField(this, "maxMessagesPerConversation", 5);
    // Límite de 5 mensajes por conversación
    __publicField(this, "conversationTimeout", 36e5);
    // 1 hora de inactividad antes de cerrar conversación
    __publicField(this, "last429ErrorTime", 0);
    // Momento del último error 429
    __publicField(this, "cooldownPeriod", 3e4);
    const storedKey = localStorage.getItem("openrouter-api-key");
    if (storedKey) {
      this.apiKey = storedKey;
    } else {
      const defaultKey = "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";
      localStorage.setItem("openrouter-api-key", defaultKey);
      this.apiKey = defaultKey;
    }
    this.startNewConversation();
  }
  startNewConversation() {
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newConversation = {
      id: conversationId,
      messages: [],
      createdAt: Date.now(),
      lastActive: Date.now(),
      isActive: true
    };
    this.currentConversationId = conversationId;
    this.saveConversation(newConversation);
  }
  getConversation(conversationId) {
    const conversationsStr = localStorage.getItem("ai_conversations") || "{}";
    let conversations = {};
    try {
      conversations = JSON.parse(conversationsStr);
    } catch (e) {
      console.error("Error al parsear conversaciones:", e);
    }
    return conversations[conversationId] || null;
  }
  saveConversation(conversation) {
    const conversationsStr = localStorage.getItem("ai_conversations") || "{}";
    let conversations = {};
    try {
      conversations = JSON.parse(conversationsStr);
    } catch (e) {
      conversations = {};
    }
    conversations[conversation.id] = conversation;
    localStorage.setItem("ai_conversations", JSON.stringify(conversations));
  }
  updateConversationLastActive() {
    if (!this.currentConversationId) return;
    const conversation = this.getConversation(this.currentConversationId);
    if (conversation) {
      conversation.lastActive = Date.now();
      this.saveConversation(conversation);
    }
  }
  checkConversationTimeout() {
    if (!this.currentConversationId) return false;
    const conversation = this.getConversation(this.currentConversationId);
    if (conversation && Date.now() - conversation.lastActive > this.conversationTimeout) {
      conversation.isActive = false;
      this.saveConversation(conversation);
      return true;
    }
    return false;
  }
  async makeRequest(prompt, context = "") {
    if (this.checkConversationTimeout()) {
      return "Esta conversación ha expirado por inactividad. Por favor, inicia una nueva conversación.";
    }
    if (!this.currentConversationId) {
      this.startNewConversation();
    }
    const conversation = this.getConversation(this.currentConversationId);
    if (!conversation) {
      this.startNewConversation();
      return await this.makeRequest(prompt, context);
    }
    if (conversation.messages.length >= this.maxMessagesPerConversation * 2) {
      return `Has alcanzado el límite de ${this.maxMessagesPerConversation} interacciones (10 mensajes totales) en esta conversación.`;
    }
    const now = Date.now();
    if (now - this.last429ErrorTime < this.cooldownPeriod) {
      const remainingCooldown = Math.ceil((this.cooldownPeriod - (now - this.last429ErrorTime)) / 1e3);
      return `La IA está temporalmente ocupada. Por favor, espera ${remainingCooldown} segundos antes de enviar otra pregunta.`;
    }
    const currentApiKey = this.apiKey || localStorage.getItem("openrouter-api-key");
    if (!currentApiKey) {
      return "Por favor, configura tu clave de API de OpenRouter.";
    }
    try {
      const response = await this.getAIResponseFromAPI(prompt, context);
      const userMessage = {
        id: `msg_user_${Date.now()}`,
        role: "user",
        content: prompt,
        timestamp: Date.now()
      };
      const aiMessage = {
        id: `msg_ai_${Date.now()}`,
        role: "assistant",
        content: response,
        timestamp: Date.now()
      };
      conversation.messages.push(userMessage, aiMessage);
      conversation.lastActive = Date.now();
      this.saveConversation(conversation);
      return response;
    } catch (error) {
      console.error("Error al llamar a la API de OpenRouter:", error);
      if (error.message) {
        if (error.message.includes("401") || error.message.includes("Unauthorized")) {
          return "Clave de API inválida. Por favor, verifica tu clave de API.";
        }
        if (error.message.includes("429")) {
          this.last429ErrorTime = Date.now();
          return "Demasiadas solicitudes al proveedor. La IA está temporalmente ocupada, por favor espera un momento.";
        }
      }
      return `Error: ${error.message || "Error desconocido"}`;
    }
  }
  async getAIResponseFromAPI(prompt, context = "") {
    var _a;
    const currentApiKey = this.apiKey || localStorage.getItem("openrouter-api-key");
    if (!currentApiKey) {
      throw new Error("No se encontró la clave de API.");
    }
    const messages = [
      {
        role: "system",
        content: `Eres un asistente de IA experto en Minecraft. ANALIZA CUIDADOSAMENTE cada entrada.
        Comprende completamente el problema antes de responder.
        Proporciona respuestas precisas, detalladas y directamente relacionadas con la pregunta.`
      },
      ...context ? [{
        role: "system",
        content: `ANÁLISIS DEL CONTEXTO:

${context}`
      }] : [],
      {
        role: "user",
        content: `Analiza y responde detalladamente:

${prompt}`
      }
    ];
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45e3);
    try {
      const response = await fetch(this.baseURL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${currentApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "qwen/qwen3-235b-a22b:free",
          // Modelo Qwen gratuito correcto según tu ejemplo
          messages,
          temperature: 0.7,
          max_tokens: 1500,
          top_p: 0.9
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = ((_a = errorData.error) == null ? void 0 : _a.message) || response.statusText;
        const errorCode = response.status;
        if (errorCode === 429) {
          return "Demasiadas solicitudes al proveedor de IA. La IA está temporalmente ocupada, por favor intenta de nuevo en unos momentos.";
        }
        throw new Error(`${errorCode} - ${errorMessage}`);
      }
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        return "Tiempo de espera agotado. La solicitud tardó demasiado en procesarse.";
      }
      throw error;
    }
  }
  async getResponse(userInput, context = "") {
    try {
      return await this.makeRequest(userInput, context);
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }
  setApiKey(apiKey) {
    this.apiKey = apiKey;
    localStorage.setItem("openrouter-api-key", apiKey);
  }
  hasApiKey() {
    return this.apiKey !== null;
  }
  resetMessageCount() {
    this.messageCount = 0;
  }
  getMessageCount() {
    return this.messageCount;
  }
}
const qwenService = new QwenAIService();
function CrashAnalyzer() {
  const [instances, setInstances] = reactExports.useState([]);
  const [selectedInstanceId, setSelectedInstanceId] = reactExports.useState("");
  const [crashRecords, setCrashRecords] = reactExports.useState([]);
  const [selectedCrash, setSelectedCrash] = reactExports.useState(null);
  const [selectedInstance, setSelectedInstance] = reactExports.useState(null);
  const [logContent, setLogContent] = reactExports.useState("");
  const [logLines, setLogLines] = reactExports.useState([]);
  const [isLoading, setIsLoading] = reactExports.useState(false);
  const [activeTab, setActiveTab] = reactExports.useState("logs");
  const [userInput, setUserInput] = reactExports.useState("");
  const [chatHistory, setChatHistory] = reactExports.useState({});
  const [isAnalyzing, setIsAnalyzing] = reactExports.useState(false);
  const [aiAvailable, setAiAvailable] = reactExports.useState(true);
  const [messagesCount, setMessagesCount] = reactExports.useState(0);
  const [maxMessagesCount] = reactExports.useState(5);
  const [deleteConfirmation, setDeleteConfirmation] = reactExports.useState({
    isOpen: false,
    crashId: null,
    crashName: null
  });
  const messagesEndRef = reactExports.useRef(null);
  const chatContainerRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    window.api.instances.list().then((list) => setInstances(list));
    window.api.crash.list().then((list) => setCrashRecords(list));
    setAiAvailable(qwenService.hasApiKey());
  }, []);
  reactExports.useEffect(() => {
    if (selectedCrash) {
      loadLogContent(selectedCrash.logPath);
    }
  }, [selectedCrash]);
  reactExports.useEffect(() => {
    scrollToBottom();
  }, [chatHistory, selectedCrash, activeTab]);
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };
  const loadLogContent = async (logPath) => {
    try {
      setIsLoading(true);
      const content = await window.api.logs.readLog(logPath);
      setLogContent(content);
      const lines = content.split("\n").map((line, index) => {
        const timestampMatch = line.match(/^\[([^\]]+)\]/);
        const levelMatch = line.match(/INFO|WARN|ERROR|FATAL|DEBUG/);
        return {
          timestamp: timestampMatch ? timestampMatch[1] : `Línea ${index + 1}`,
          level: levelMatch ? levelMatch[0] : "INFO",
          message: line
        };
      });
      setLogLines(lines);
    } catch (error) {
      console.error("Error al leer el archivo de log:", error);
      setLogContent("Error al cargar el contenido del log");
      setLogLines([]);
    } finally {
      setIsLoading(false);
    }
  };
  const analyzeCrash = async () => {
    if (!selectedInstanceId) return;
    try {
      setIsLoading(true);
      const result = await window.api.crash.analyze({ instanceId: selectedInstanceId });
      if (result) {
        setCrashRecords((prev) => [result, ...prev]);
        setSelectedCrash(result);
        setActiveTab("logs");
      }
    } catch (error) {
      console.error("Error al analizar crash:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleCrashSelect = (crash) => {
    setSelectedCrash(crash);
    const instance = instances.find((i) => i.id === crash.instanceId);
    setSelectedInstance(instance || null);
    setActiveTab("logs");
    setMessagesCount(0);
  };
  const handleDeleteCrash = (crashId, crashName, e) => {
    e.stopPropagation();
    setDeleteConfirmation({
      isOpen: true,
      crashId,
      crashName
    });
  };
  const confirmDeleteCrash = async () => {
    if (!deleteConfirmation.crashId) return;
    try {
      await window.api.crash.delete(deleteConfirmation.crashId);
      const updatedRecords = crashRecords.filter((crash) => crash.id !== deleteConfirmation.crashId);
      setCrashRecords(updatedRecords);
      if (selectedCrash && selectedCrash.id === deleteConfirmation.crashId) {
        setSelectedCrash(null);
        setSelectedInstance(null);
      }
      setChatHistory((prev) => {
        const newHistory = { ...prev };
        delete newHistory[deleteConfirmation.crashId];
        return newHistory;
      });
    } catch (error) {
      console.error("Error al eliminar el archivo de crash:", error);
      alert("Error al eliminar el archivo de crash: " + error.message);
    } finally {
      setDeleteConfirmation({
        isOpen: false,
        crashId: null,
        crashName: null
      });
    }
  };
  const cancelDeleteCrash = () => {
    setDeleteConfirmation({
      isOpen: false,
      crashId: null,
      crashName: null
    });
  };
  const handleSendMessage = async () => {
    if (!userInput.trim() || !selectedCrash || messagesCount >= maxMessagesCount) return;
    const newMessageId = Date.now().toString();
    const userMessage = {
      id: newMessageId,
      role: "user",
      content: userInput,
      timestamp: /* @__PURE__ */ new Date()
    };
    const currentChat = chatHistory[selectedCrash.id] || [];
    const updatedChat = [...currentChat, userMessage];
    setChatHistory((prev) => ({
      ...prev,
      [selectedCrash.id]: updatedChat
    }));
    const newInput = userInput;
    setUserInput("");
    setIsAnalyzing(true);
    try {
      const logContext = selectedCrash ? logContent.substring(0, 2e3) : "";
      const response = await qwenService.getResponse(newInput, logContext);
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: /* @__PURE__ */ new Date()
      };
      setChatHistory((prev) => ({
        ...prev,
        [selectedCrash.id]: [...updatedChat, assistantMessage]
      }));
      setMessagesCount((prev) => prev + 1);
    } catch (error) {
      console.error("Error en el asistente Qwen:", error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Lo siento, hubo un error al procesar tu solicitud. Por favor, inténtalo de nuevo.",
        timestamp: /* @__PURE__ */ new Date()
      };
      setChatHistory((prev) => ({
        ...prev,
        [selectedCrash.id]: [...updatedChat, errorMessage]
      }));
    } finally {
      setIsAnalyzing(false);
    }
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  const getLogLevelColor = (level) => {
    switch (level) {
      case "ERROR":
      case "FATAL":
        return "text-red-400";
      case "WARN":
        return "text-yellow-600";
      case "DEBUG":
        return "text-blue-400";
      default:
        return "text-gray-300";
    }
  };
  const currentMessages = selectedCrash ? chatHistory[selectedCrash.id] || [] : [];
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex flex-col h-full bg-gradient-to-br from-gray-900 to-gray-800 p-4", children: [
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h1", { className: "text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent", children: "Analizador de Crashes" }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
        lineNumber: 296,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-gray-400 text-sm", children: "Diagnóstico y resolución de problemas de Minecraft" }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
        lineNumber: 299,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
      lineNumber: 295,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex gap-4 h-[calc(100vh-100px)]", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-72 flex flex-col gap-4", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Card, { className: "p-4 bg-gray-800/70 backdrop-blur-sm border border-gray-700/50", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "font-semibold text-sm mb-2 text-white flex items-center gap-2", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "bg-blue-500/20 p-1.5 rounded-lg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-4 h-4 text-blue-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M5 12.55a11 11 0 0114.08 0M12 8v4l2 2m4 0a9 9 0 11-18 0 9 9 0 0118 0z" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
              lineNumber: 309,
              columnNumber: 19
            }, this) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
              lineNumber: 308,
              columnNumber: 17
            }, this) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
              lineNumber: 307,
              columnNumber: 15
            }, this),
            "Seleccionar Instancia"
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
            lineNumber: 306,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex flex-col gap-2", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "select",
              {
                value: selectedInstanceId,
                onChange: (e) => setSelectedInstanceId(e.target.value),
                className: "bg-gray-700/60 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
                children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "", children: "Selecciona una instancia" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                    lineNumber: 320,
                    columnNumber: 17
                  }, this),
                  instances.map((instance) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: instance.id, className: "bg-gray-700", children: instance.name }, instance.id, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                    lineNumber: 322,
                    columnNumber: 19
                  }, this))
                ]
              },
              void 0,
              true,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                lineNumber: 315,
                columnNumber: 15
              },
              this
            ),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              Button,
              {
                onClick: analyzeCrash,
                disabled: !selectedInstanceId || isLoading,
                className: "w-full py-2 text-sm font-medium transition-all",
                children: isLoading ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-center gap-2", children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                    lineNumber: 334,
                    columnNumber: 21
                  }, this),
                  "Analizando..."
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                  lineNumber: 333,
                  columnNumber: 19
                }, this) : "Analizar Crash"
              },
              void 0,
              false,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                lineNumber: 327,
                columnNumber: 15
              },
              this
            )
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
            lineNumber: 314,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
          lineNumber: 305,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Card, { className: "p-4 bg-gray-800/70 backdrop-blur-sm border border-gray-700/50 flex-1 h-[calc(100vh-200px)]", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "font-semibold text-sm mb-2 text-white flex items-center gap-2", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "bg-red-500/20 p-1.5 rounded-lg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-4 h-4 text-red-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
              lineNumber: 348,
              columnNumber: 19
            }, this) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
              lineNumber: 347,
              columnNumber: 17
            }, this) }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
              lineNumber: 346,
              columnNumber: 15
            }, this),
            "Crashes Recientes"
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
            lineNumber: 345,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-2 overflow-y-auto h-[calc(100%-40px)] pr-1", children: crashRecords.length === 0 ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-center py-6", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-gray-500 text-sm mb-1", children: "No hay crashes registrados" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
              lineNumber: 356,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-600", children: "Analiza una instancia para detectar crashes" }, void 0, false, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
              lineNumber: 357,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
            lineNumber: 355,
            columnNumber: 17
          }, this) : crashRecords.map((crash) => {
            const instance = instances.find((i) => i.id === crash.instanceId);
            return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "div",
              {
                className: `p-2.5 rounded-lg cursor-pointer transition-all duration-200 ${(selectedCrash == null ? void 0 : selectedCrash.id) === crash.id ? "bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30" : "bg-gray-700/20 hover:bg-gray-700/40 border border-gray-600/20"}`,
                onClick: () => handleCrashSelect(crash),
                children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between", children: [
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "font-medium text-xs text-white truncate", children: (instance == null ? void 0 : instance.name) || "Instancia desconocida" }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                      lineNumber: 373,
                      columnNumber: 25
                    }, this),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                      "button",
                      {
                        onClick: (e) => handleDeleteCrash(crash.id, (instance == null ? void 0 : instance.name) || "Registro de crash", e),
                        className: "text-gray-500 hover:text-red-500 p-1 rounded hover:bg-red-500/10 transition-colors",
                        title: "Eliminar crash",
                        children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-3 h-3", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" }, void 0, false, {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                          lineNumber: 382,
                          columnNumber: 29
                        }, this) }, void 0, false, {
                          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                          lineNumber: 381,
                          columnNumber: 27
                        }, this)
                      },
                      void 0,
                      false,
                      {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                        lineNumber: 376,
                        columnNumber: 25
                      },
                      this
                    )
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                    lineNumber: 372,
                    columnNumber: 23
                  }, this),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-400 mt-1 flex items-center justify-between", children: [
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: new Date(crash.createdAt).toLocaleDateString() }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                      lineNumber: 387,
                      columnNumber: 25
                    }, this),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: new Date(crash.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                      lineNumber: 390,
                      columnNumber: 25
                    }, this)
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                    lineNumber: 386,
                    columnNumber: 23
                  }, this),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-300 mt-1 truncate", title: crash.summary, children: crash.summary }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                    lineNumber: 394,
                    columnNumber: 23
                  }, this)
                ]
              },
              crash.id,
              true,
              {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                lineNumber: 363,
                columnNumber: 21
              },
              this
            );
          }) }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
            lineNumber: 353,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
          lineNumber: 344,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
        lineNumber: 304,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-1 flex flex-col gap-4", children: selectedCrash ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(jsxDevRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Card, { className: "p-3 bg-gray-800/70 backdrop-blur-sm border border-gray-700/50", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-4 gap-2", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-700/20 p-2 rounded text-center", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-400", children: "Instancia" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                lineNumber: 413,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs font-medium text-white truncate", children: (selectedInstance == null ? void 0 : selectedInstance.name) || "Desconocida" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                lineNumber: 414,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
              lineNumber: 412,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-700/20 p-2 rounded text-center", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-400", children: "ID" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                lineNumber: 419,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs font-medium text-white truncate", children: [
                selectedCrash.instanceId.substring(0, 8),
                "..."
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                lineNumber: 420,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
              lineNumber: 418,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-700/20 p-2 rounded text-center", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-400", children: "Fecha" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                lineNumber: 425,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs font-medium text-white", children: new Date(selectedCrash.createdAt).toLocaleString() }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                lineNumber: 426,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
              lineNumber: 424,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-700/20 p-2 rounded text-center", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-400", children: "Estado" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                lineNumber: 431,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs font-medium text-green-400", children: "Analizado" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                lineNumber: 432,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
              lineNumber: 430,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
            lineNumber: 411,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-2 grid grid-cols-2 gap-2", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-400", children: "Resumen" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                lineNumber: 439,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-white", children: selectedCrash.summary }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                lineNumber: 440,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
              lineNumber: 438,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-400", children: "Recomendación" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                lineNumber: 443,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-white", children: selectedCrash.recommendation || "No hay recomendaciones" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                lineNumber: 444,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
              lineNumber: 442,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
            lineNumber: 437,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
          lineNumber: 410,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex bg-gray-800/50 rounded-lg p-1 border border-gray-700/50", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              className: `flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${activeTab === "logs" ? "bg-blue-600/80 text-white shadow" : "text-gray-400 hover:text-gray-300"}`,
              onClick: () => setActiveTab("logs"),
              children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-center gap-1", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                  lineNumber: 463,
                  columnNumber: 23
                }, this) }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                  lineNumber: 462,
                  columnNumber: 21
                }, this),
                "Logs"
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                lineNumber: 461,
                columnNumber: 19
              }, this)
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
              lineNumber: 453,
              columnNumber: 17
            },
            this
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              className: `flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${activeTab === "ai" ? "bg-blue-600/80 text-white shadow" : "text-gray-400 hover:text-gray-300"}`,
              onClick: () => setActiveTab("ai"),
              children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-center gap-1", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                  lineNumber: 478,
                  columnNumber: 23
                }, this) }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                  lineNumber: 477,
                  columnNumber: 21
                }, this),
                "IA Qwen"
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                lineNumber: 476,
                columnNumber: 19
              }, this)
            },
            void 0,
            false,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
              lineNumber: 468,
              columnNumber: 17
            },
            this
          )
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
          lineNumber: 452,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-1 flex flex-col bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700/50", children: activeTab === "logs" ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-1 overflow-y-auto p-3 bg-gray-900/10", children: isLoading ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-center h-full", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex flex-col items-center gap-2", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
            lineNumber: 492,
            columnNumber: 27
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-white text-sm", children: "Cargando logs..." }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
            lineNumber: 493,
            columnNumber: 27
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
          lineNumber: 491,
          columnNumber: 25
        }, this) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
          lineNumber: 490,
          columnNumber: 23
        }, this) : logLines.length === 0 ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-center h-full", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-center text-gray-500", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-2xl mb-1", children: "📋" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
            lineNumber: 499,
            columnNumber: 27
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-sm", children: "No hay logs disponibles" }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
            lineNumber: 500,
            columnNumber: 27
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
          lineNumber: 498,
          columnNumber: 25
        }, this) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
          lineNumber: 497,
          columnNumber: 23
        }, this) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-0.5 font-mono text-xs bg-gray-900/20 p-3 rounded", children: logLines.map((line, index) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex py-0.5 hover:bg-gray-800/20 px-1 rounded text-[9px]", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-gray-500 mr-2 w-24 flex-shrink-0 font-normal truncate", children: line.timestamp }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
            lineNumber: 507,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: `mr-2 w-10 flex-shrink-0 font-semibold ${getLogLevelColor(line.level)} truncate`, children: line.level }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
            lineNumber: 510,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "flex-1 break-words text-gray-200 font-light", children: line.message }, void 0, false, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
            lineNumber: 513,
            columnNumber: 29
          }, this)
        ] }, index, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
          lineNumber: 506,
          columnNumber: 27
        }, this)) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
          lineNumber: 504,
          columnNumber: 23
        }, this) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
          lineNumber: 488,
          columnNumber: 19
        }, this) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-1 flex flex-col bg-gray-900/10", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "div",
            {
              ref: chatContainerRef,
              className: "flex-1 overflow-y-auto p-3 space-y-3",
              children: [
                currentMessages.length === 0 ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "h-full flex flex-col items-center justify-center text-gray-500", children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-center mb-4", children: [
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-2", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-lg", children: "🤖" }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                      lineNumber: 532,
                      columnNumber: 31
                    }, this) }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                      lineNumber: 531,
                      columnNumber: 29
                    }, this),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-semibold text-white mb-1", children: "Asistente de IA" }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                      lineNumber: 534,
                      columnNumber: 29
                    }, this),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-sm", children: "Pregunta sobre el crash o problemas de Minecraft" }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                      lineNumber: 535,
                      columnNumber: 29
                    }, this)
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                    lineNumber: 530,
                    columnNumber: 27
                  }, this),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-2 gap-2 max-w-xs w-full", children: [
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/20 p-2 rounded text-center", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-400 mb-0.5", children: "¿Qué causó el error?" }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                      lineNumber: 540,
                      columnNumber: 31
                    }, this) }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                      lineNumber: 539,
                      columnNumber: 29
                    }, this),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/20 p-2 rounded text-center", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-400 mb-0.5", children: "¿Cómo lo soluciono?" }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                      lineNumber: 543,
                      columnNumber: 31
                    }, this) }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                      lineNumber: 542,
                      columnNumber: 29
                    }, this),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/20 p-2 rounded text-center", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-400 mb-0.5", children: "Mods conflictivos" }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                      lineNumber: 546,
                      columnNumber: 31
                    }, this) }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                      lineNumber: 545,
                      columnNumber: 29
                    }, this),
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-gray-800/20 p-2 rounded text-center", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-gray-400 mb-0.5", children: "Configuración óptima" }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                      lineNumber: 549,
                      columnNumber: 31
                    }, this) }, void 0, false, {
                      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                      lineNumber: 548,
                      columnNumber: 29
                    }, this)
                  ] }, void 0, true, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                    lineNumber: 538,
                    columnNumber: 27
                  }, this)
                ] }, void 0, true, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                  lineNumber: 529,
                  columnNumber: 25
                }, this) : currentMessages.map((message) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  "div",
                  {
                    className: `flex ${message.role === "user" ? "justify-end" : "justify-start"}`,
                    children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                      "div",
                      {
                        className: `max-w-[85%] rounded-xl p-3 text-sm ${message.role === "user" ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none" : "bg-gray-700/50 text-gray-100 rounded-bl-none"}`,
                        children: [
                          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "whitespace-pre-wrap break-words", children: message.content }, void 0, false, {
                            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                            lineNumber: 566,
                            columnNumber: 31
                          }, this),
                          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: `text-xs mt-1 opacity-70 ${message.role === "user" ? "text-blue-100" : "text-gray-400"}`, children: message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }, void 0, false, {
                            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                            lineNumber: 567,
                            columnNumber: 31
                          }, this)
                        ]
                      },
                      void 0,
                      true,
                      {
                        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                        lineNumber: 559,
                        columnNumber: 29
                      },
                      this
                    )
                  },
                  message.id,
                  false,
                  {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                    lineNumber: 555,
                    columnNumber: 27
                  },
                  this
                )),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { ref: messagesEndRef }, void 0, false, {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                  lineNumber: 574,
                  columnNumber: 23
                }, this)
              ]
            },
            void 0,
            true,
            {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
              lineNumber: 524,
              columnNumber: 21
            },
            this
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "border-t border-gray-700 p-3 bg-gray-800/20", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: `flex-1 rounded-lg overflow-hidden ${messagesCount >= maxMessagesCount ? "bg-gray-700/30 border border-red-500/50" : "bg-gray-700/50 border border-gray-600/50"}`, children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                "textarea",
                {
                  value: userInput,
                  onChange: (e) => setUserInput(e.target.value),
                  onKeyDown: handleKeyDown,
                  placeholder: messagesCount >= maxMessagesCount ? "Has alcanzado el límite de mensajes" : "Escribe tu pregunta...",
                  className: "w-full bg-transparent text-white py-2 px-3 text-sm focus:outline-none resize-none max-h-20",
                  disabled: isAnalyzing || messagesCount >= maxMessagesCount,
                  rows: 1
                },
                void 0,
                false,
                {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                  lineNumber: 585,
                  columnNumber: 27
                },
                this
              ) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                lineNumber: 580,
                columnNumber: 25
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                Button,
                {
                  onClick: handleSendMessage,
                  disabled: !userInput.trim() || isAnalyzing || !selectedCrash || messagesCount >= maxMessagesCount,
                  className: "h-10 px-4 flex items-center justify-center",
                  children: isAnalyzing ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                    lineNumber: 603,
                    columnNumber: 29
                  }, this) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M13 5l7 7-7 7M5 5l7 7-7 7" }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                    lineNumber: 606,
                    columnNumber: 31
                  }, this) }, void 0, false, {
                    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                    lineNumber: 605,
                    columnNumber: 29
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                  lineNumber: 597,
                  columnNumber: 25
                },
                this
              )
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
              lineNumber: 579,
              columnNumber: 23
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between items-center mt-1", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-xs text-gray-500", children: messagesCount < maxMessagesCount ? "Asistente IA especializado en problemas de Minecraft" : "Límite de mensajes alcanzado para esta conversación" }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                lineNumber: 612,
                columnNumber: 25
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex gap-1 text-xs", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: `px-2 py-0.5 rounded text-xs ${messagesCount < 3 ? "bg-green-900/50 text-green-400" : messagesCount < 5 ? "bg-yellow-900/50 text-yellow-400" : "bg-red-900/50 text-red-400"}`, children: [
                messagesCount,
                "/",
                maxMessagesCount
              ] }, void 0, true, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                lineNumber: 618,
                columnNumber: 27
              }, this) }, void 0, false, {
                fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
                lineNumber: 617,
                columnNumber: 25
              }, this)
            ] }, void 0, true, {
              fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
              lineNumber: 611,
              columnNumber: 23
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
            lineNumber: 578,
            columnNumber: 21
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
          lineNumber: 522,
          columnNumber: 19
        }, this) }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
          lineNumber: 486,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
        lineNumber: 408,
        columnNumber: 13
      }, this) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-1 flex items-center justify-center bg-gray-800/50 rounded-lg border border-gray-700/50", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-center text-gray-500", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-4xl mb-2", children: "🔍" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
          lineNumber: 637,
          columnNumber: 17
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "text-lg font-semibold text-gray-300 mb-1", children: "Selecciona un crash" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
          lineNumber: 638,
          columnNumber: 17
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-sm text-gray-400", children: "Elige un crash de la lista para ver detalles" }, void 0, false, {
          fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
          lineNumber: 639,
          columnNumber: 17
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
        lineNumber: 636,
        columnNumber: 15
      }, this) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
        lineNumber: 635,
        columnNumber: 13
      }, this) }, void 0, false, {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
        lineNumber: 406,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
      lineNumber: 302,
      columnNumber: 7
    }, this),
    deleteConfirmation.isOpen && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
      ConfirmationModal,
      {
        isOpen: deleteConfirmation.isOpen,
        title: "Eliminar Registro de Crash",
        message: `¿Estás seguro de que deseas eliminar este registro de crash ${deleteConfirmation.crashName ? `"${deleteConfirmation.crashName}"` : ""}? Esta acción no se puede deshacer.`,
        onConfirm: confirmDeleteCrash,
        onCancel: cancelDeleteCrash,
        confirmText: "Eliminar",
        cancelText: "Cancelar",
        confirmColor: "danger"
      },
      void 0,
      false,
      {
        fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
        lineNumber: 647,
        columnNumber: 9
      },
      this
    )
  ] }, void 0, true, {
    fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/pages/CrashAnalyzer.tsx",
    lineNumber: 294,
    columnNumber: 5
  }, this);
}
export {
  CrashAnalyzer as default
};
