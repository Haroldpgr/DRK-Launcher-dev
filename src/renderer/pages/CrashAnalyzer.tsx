import React, { useEffect, useState, useRef } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { qwenService } from '../services/aiService';
import ConfirmationModal from '../components/ConfirmationModal';
import TutorialOverlay from '../components/TutorialOverlay';
import { crashAnalyzerTutorialSteps } from '../data/tutorialSteps';

type CrashRecord = {
  id: string;
  instanceId: string;
  createdAt: number;
  summary: string;
  logPath: string;
  recommendation?: string
};

type Instance = { id: string; name: string };

type LogLine = {
  timestamp: string;
  level: string;
  message: string;
};

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

// Tipo para almacenar el historial de chat por crash
type ChatHistory = {
  [crashId: string]: Message[];
};

export default function CrashAnalyzer() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('');
  const [crashRecords, setCrashRecords] = useState<CrashRecord[]>([]);
  const [selectedCrash, setSelectedCrash] = useState<CrashRecord | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const [logContent, setLogContent] = useState<string>('');
  const [logLines, setLogLines] = useState<LogLine[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'logs' | 'ai'>('logs');
  const [userInput, setUserInput] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatHistory>({});
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiAvailable, setAiAvailable] = useState<boolean>(true);
  const [messagesCount, setMessagesCount] = useState<number>(0);
  const [maxMessagesCount] = useState<number>(5); // Límite de 5 mensajes por conversación
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    crashId: string | null;
    crashName: string | null;
  }>({
    isOpen: false,
    crashId: null,
    crashName: null
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cargar instancias y crashes al inicio
    window.api.instances.list().then((list: any) => setInstances(list));
    window.api.crash.list().then((list: any) => setCrashRecords(list));

    // Verificar si el servicio de IA está disponible
    setAiAvailable(qwenService.hasApiKey());
  }, []);

  useEffect(() => {
    // Cargar logs cuando se selecciona un crash
    if (selectedCrash) {
      loadLogContent(selectedCrash.logPath);
    }
  }, [selectedCrash]);

  useEffect(() => {
    // Desplazar al final de los mensajes cuando cambian
    scrollToBottom();
  }, [chatHistory, selectedCrash, activeTab]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const loadLogContent = async (logPath: string) => {
    try {
      setIsLoading(true);
      const content = await window.api.logs.readLog(logPath);
      setLogContent(content);

      // Procesar contenido del log en líneas
      const lines = content.split('\n').map((line, index) => {
        // Extraer timestamp y nivel del log si están presentes
        const timestampMatch = line.match(/^\[([^\]]+)\]/);
        const levelMatch = line.match(/INFO|WARN|ERROR|FATAL|DEBUG/);

        return {
          timestamp: timestampMatch ? timestampMatch[1] : `Línea ${index + 1}`,
          level: levelMatch ? levelMatch[0] : 'INFO',
          message: line
        };
      });

      setLogLines(lines);
    } catch (error) {
      console.error('Error al leer el archivo de log:', error);
      setLogContent('Error al cargar el contenido del log');
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
        setCrashRecords(prev => [result, ...prev]);
        setSelectedCrash(result);
        setActiveTab('logs');
      }
    } catch (error) {
      console.error('Error al analizar crash:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCrashSelect = (crash: CrashRecord) => {
    setSelectedCrash(crash);
    const instance = instances.find(i => i.id === crash.instanceId);
    setSelectedInstance(instance || null);
    setActiveTab('logs');
    
    // Reiniciar el contador de mensajes al cambiar de crash
    setMessagesCount(0);
  };

  const handleDeleteCrash = (crashId: string, crashName: string | null, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que se seleccione el crash al hacer clic en eliminar

    // Mostrar el modal de confirmación
    setDeleteConfirmation({
      isOpen: true,
      crashId,
      crashName
    });
  };

  const confirmDeleteCrash = async () => {
    if (!deleteConfirmation.crashId) return;

    try {
      // Eliminar el crash tanto de la lista como del backend
      await window.api.crash.delete(deleteConfirmation.crashId);

      // Eliminar el crash de la lista en memoria
      const updatedRecords = crashRecords.filter(crash => crash.id !== deleteConfirmation.crashId);
      setCrashRecords(updatedRecords);

      // Si se está eliminando el crash seleccionado, limpiar la selección
      if (selectedCrash && selectedCrash.id === deleteConfirmation.crashId) {
        setSelectedCrash(null);
        setSelectedInstance(null);
      }

      // Eliminar también el historial de chat asociado
      setChatHistory(prev => {
        const newHistory = { ...prev };
        delete newHistory[deleteConfirmation.crashId!];
        return newHistory;
      });
    } catch (error) {
      console.error('Error al eliminar el archivo de crash:', error);
      // Mostrar mensaje de error al usuario
      alert('Error al eliminar el archivo de crash: ' + (error as Error).message);
    } finally {
      // Cerrar el modal
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

    // Crear el mensaje del usuario
    const userMessage: Message = {
      id: newMessageId,
      role: 'user',
      content: userInput,
      timestamp: new Date()
    };

    // Actualizar el historial de chat para este crash específico
    const currentChat = chatHistory[selectedCrash.id] || [];
    const updatedChat = [...currentChat, userMessage];
    setChatHistory(prev => ({
      ...prev,
      [selectedCrash.id]: updatedChat
    }));

    const newInput = userInput;
    setUserInput('');
    setIsAnalyzing(true);

    try {
      // Obtener respuesta del asistente Qwen
      const logContext = selectedCrash ? logContent.substring(0, 2000) : ''; // Limitar contexto para la API
      const response = await qwenService.getResponse(newInput, logContext);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      // Agregar la respuesta del asistente al historial
      setChatHistory(prev => ({
        ...prev,
        [selectedCrash.id]: [...updatedChat, assistantMessage]
      }));

      // Incrementar el contador de mensajes
      setMessagesCount(prev => prev + 1);
    } catch (error) {
      console.error('Error en el asistente Qwen:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu solicitud. Por favor, inténtalo de nuevo.',
        timestamp: new Date()
      };

      // Agregar mensaje de error al historial
      setChatHistory(prev => ({
        ...prev,
        [selectedCrash.id]: [...updatedChat, errorMessage]
      }));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR':
      case 'FATAL':
        return 'text-red-400';
      case 'WARN':
        return 'text-yellow-600';
      case 'DEBUG':
        return 'text-blue-400';
      default:
        return 'text-gray-300';
    }
  };

  // Obtener los mensajes actuales para el crash seleccionado
  const currentMessages = selectedCrash ? (chatHistory[selectedCrash.id] || []) : [];

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
          Analizador de Crashes
        </h1>
        <p className="text-gray-400 text-sm">Diagnóstico y resolución de problemas de Minecraft</p>
      </div>

      <div className="flex gap-4 h-[calc(100vh-100px)]">
        {/* Panel de selección */}
        <div className="w-72 flex flex-col gap-4">
          <Card className="p-4 bg-gray-800/70 backdrop-blur-sm border border-gray-700/50">
            <h3 className="font-semibold text-sm mb-2 text-white flex items-center gap-2">
              <span className="bg-blue-500/20 p-1.5 rounded-lg">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12.55a11 11 0 0114.08 0M12 8v4l2 2m4 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </span>
              Seleccionar Instancia
            </h3>
            <div className="flex flex-col gap-2">
              <select
                value={selectedInstanceId}
                onChange={e => setSelectedInstanceId(e.target.value)}
                className="bg-gray-700/60 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Selecciona una instancia</option>
                {instances.map(instance => (
                  <option key={instance.id} value={instance.id} className="bg-gray-700">
                    {instance.name}
                  </option>
                ))}
              </select>
              <Button
                onClick={analyzeCrash}
                disabled={!selectedInstanceId || isLoading}
                className="w-full py-2 text-sm font-medium transition-all"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Analizando...
                  </div>
                ) : (
                  'Analizar Crash'
                )}
              </Button>
            </div>
          </Card>

          <Card className="p-4 bg-gray-800/70 backdrop-blur-sm border border-gray-700/50 flex-1 h-[calc(100vh-200px)]">
            <h3 className="font-semibold text-sm mb-2 text-white flex items-center gap-2">
              <span className="bg-red-500/20 p-1.5 rounded-lg">
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </span>
              Crashes Recientes
            </h3>
            <div className="space-y-2 overflow-y-auto h-[calc(100%-40px)] pr-1">
              {crashRecords.length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-gray-500 text-sm mb-1">No hay crashes registrados</div>
                  <div className="text-xs text-gray-600">Analiza una instancia para detectar crashes</div>
                </div>
              ) : (
                crashRecords.map(crash => {
                  const instance = instances.find(i => i.id === crash.instanceId);
                  return (
                    <div
                      key={crash.id}
                      className={`p-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedCrash?.id === crash.id
                          ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30'
                          : 'bg-gray-700/20 hover:bg-gray-700/40 border border-gray-600/20'
                      }`}
                      onClick={() => handleCrashSelect(crash)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-xs text-white truncate">
                          {instance?.name || 'Instancia desconocida'}
                        </div>
                        <button
                          onClick={(e) => handleDeleteCrash(crash.id, instance?.name || 'Registro de crash', e)}
                          className="text-gray-500 hover:text-red-500 p-1 rounded hover:bg-red-500/10 transition-colors"
                          title="Eliminar crash"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      </div>
                      <div className="text-xs text-gray-400 mt-1 flex items-center justify-between">
                        <span>
                          {new Date(crash.createdAt).toLocaleDateString()}
                        </span>
                        <span>
                          {new Date(crash.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-xs text-gray-300 mt-1 truncate" title={crash.summary}>
                        {crash.summary}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Panel principal */}
        <div className="flex-1 flex flex-col gap-4">
          {selectedCrash ? (
            <>
              {/* Información del crash seleccionado */}
              <Card className="p-3 bg-gray-800/70 backdrop-blur-sm border border-gray-700/50">
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-gray-700/20 p-2 rounded text-center">
                    <div className="text-xs text-gray-400">Instancia</div>
                    <div className="text-xs font-medium text-white truncate">
                      {selectedInstance?.name || 'Desconocida'}
                    </div>
                  </div>
                  <div className="bg-gray-700/20 p-2 rounded text-center">
                    <div className="text-xs text-gray-400">ID</div>
                    <div className="text-xs font-medium text-white truncate">
                      {selectedCrash.instanceId.substring(0, 8)}...
                    </div>
                  </div>
                  <div className="bg-gray-700/20 p-2 rounded text-center">
                    <div className="text-xs text-gray-400">Fecha</div>
                    <div className="text-xs font-medium text-white">
                      {new Date(selectedCrash.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-gray-700/20 p-2 rounded text-center">
                    <div className="text-xs text-gray-400">Estado</div>
                    <div className="text-xs font-medium text-green-400">
                      Analizado
                    </div>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-gray-400">Resumen</div>
                    <div className="text-xs text-white">{selectedCrash.summary}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Recomendación</div>
                    <div className="text-xs text-white">
                      {selectedCrash.recommendation || 'No hay recomendaciones'}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Pestañas */}
              <div className="flex bg-gray-800/50 rounded-lg p-1 border border-gray-700/50">
                <button
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'logs'
                      ? 'bg-blue-600/80 text-white shadow'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('logs')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    Logs
                  </div>
                </button>
                <button
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'ai'
                      ? 'bg-blue-600/80 text-white shadow'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('ai')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                    </svg>
                    IA Qwen
                  </div>
                </button>
              </div>

              {/* Contenido de las pestañas */}
              <div className="flex-1 flex flex-col bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700/50">
                {activeTab === 'logs' ? (
                  <div className="flex-1 overflow-y-auto p-3 bg-gray-900/10">
                    {isLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                          <div className="text-white text-sm">Cargando logs...</div>
                        </div>
                      </div>
                    ) : logLines.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-500">
                          <div className="text-2xl mb-1">📋</div>
                          <div className="text-sm">No hay logs disponibles</div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-0.5 font-mono text-xs bg-gray-900/20 p-3 rounded">
                        {logLines.map((line, index) => (
                          <div key={index} className="flex py-0.5 hover:bg-gray-800/20 px-1 rounded text-[9px]">
                            <span className="text-gray-500 mr-2 w-24 flex-shrink-0 font-normal truncate">
                              {line.timestamp}
                            </span>
                            <span className={`mr-2 w-10 flex-shrink-0 font-semibold ${getLogLevelColor(line.level)} truncate`}>
                              {line.level}
                            </span>
                            <span className="flex-1 break-words text-gray-200 font-light">
                              {line.message}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col bg-gray-900/10">
                    {/* Historial de mensajes con scroll propio */}
                    <div
                      ref={chatContainerRef}
                      className="flex-1 overflow-y-auto p-3 space-y-3"
                    >
                      {currentMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500">
                          <div className="text-center mb-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-2">
                              <span className="text-lg">🤖</span>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-1">Asistente de IA</h3>
                            <p className="text-sm">Pregunta sobre el crash o problemas de Minecraft</p>
                          </div>

                          <div className="grid grid-cols-2 gap-2 max-w-xs w-full">
                            <div className="bg-gray-800/20 p-2 rounded text-center">
                              <div className="text-xs text-gray-400 mb-0.5">¿Qué causó el error?</div>
                            </div>
                            <div className="bg-gray-800/20 p-2 rounded text-center">
                              <div className="text-xs text-gray-400 mb-0.5">¿Cómo lo soluciono?</div>
                            </div>
                            <div className="bg-gray-800/20 p-2 rounded text-center">
                              <div className="text-xs text-gray-400 mb-0.5">Mods conflictivos</div>
                            </div>
                            <div className="bg-gray-800/20 p-2 rounded text-center">
                              <div className="text-xs text-gray-400 mb-0.5">Configuración óptima</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        currentMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-xl p-3 text-sm ${
                                message.role === 'user'
                                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none'
                                  : 'bg-gray-700/50 text-gray-100 rounded-bl-none'
                              }`}
                            >
                              <div className="whitespace-pre-wrap break-words">{message.content}</div>
                              <div className={`text-xs mt-1 opacity-70 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input de usuario */}
                    <div className="border-t border-gray-700 p-3 bg-gray-800/20">
                      <div className="flex gap-2">
                        <div className={`flex-1 rounded-lg overflow-hidden ${
                          messagesCount >= maxMessagesCount
                            ? 'bg-gray-700/30 border border-red-500/50'
                            : 'bg-gray-700/50 border border-gray-600/50'
                        }`}>
                          <textarea
                            value={userInput}
                            onChange={e => setUserInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={messagesCount >= maxMessagesCount
                              ? "Has alcanzado el límite de mensajes"
                              : "Escribe tu pregunta..."}
                            className="w-full bg-transparent text-white py-2 px-3 text-sm focus:outline-none resize-none max-h-20"
                            disabled={isAnalyzing || messagesCount >= maxMessagesCount}
                            rows={1}
                          />
                        </div>
                        <Button
                          onClick={handleSendMessage}
                          disabled={!userInput.trim() || isAnalyzing || !selectedCrash || messagesCount >= maxMessagesCount}
                          className="h-10 px-4 flex items-center justify-center"
                        >
                          {isAnalyzing ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path>
                            </svg>
                          )}
                        </Button>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-gray-500">
                          {messagesCount < maxMessagesCount
                            ? "Asistente IA especializado en problemas de Minecraft"
                            : "Límite de mensajes alcanzado para esta conversación"}
                        </p>
                        <div className="flex gap-1 text-xs">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            messagesCount < 3
                              ? 'bg-green-900/50 text-green-400'
                              : messagesCount < 5
                                ? 'bg-yellow-900/50 text-yellow-400'
                                : 'bg-red-900/50 text-red-400'
                          }`}>
                            {messagesCount}/{maxMessagesCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-800/50 rounded-lg border border-gray-700/50">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">🔍</div>
                <h3 className="text-lg font-semibold text-gray-300 mb-1">Selecciona un crash</h3>
                <p className="text-sm text-gray-400">Elige un crash de la lista para ver detalles</p>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Modal de confirmación para eliminar crash */}
      {deleteConfirmation.isOpen && (
        <ConfirmationModal
          isOpen={deleteConfirmation.isOpen}
          title="Eliminar Registro de Crash"
          message={`¿Estás seguro de que deseas eliminar este registro de crash ${deleteConfirmation.crashName ? `"${deleteConfirmation.crashName}"` : ''}? Esta acción no se puede deshacer.`}
          onConfirm={confirmDeleteCrash}
          onCancel={cancelDeleteCrash}
          confirmText="Eliminar"
          cancelText="Cancelar"
          confirmColor="danger"
        />
      )}

      {/* Tutorial Overlay */}
      <TutorialOverlay pageId="crash-analyzer" steps={crashAnalyzerTutorialSteps} />
    </div>
  );
}