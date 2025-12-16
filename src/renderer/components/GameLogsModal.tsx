import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GameLogsModalProps {
  instanceId: string;
  instanceName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function GameLogsModal({ instanceId, instanceName, isOpen, onClose }: GameLogsModalProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Cargar logs iniciales
  useEffect(() => {
    if (isOpen && instanceId) {
      // Esperar un poco para asegurar que la API esté disponible
      const timeout = setTimeout(() => {
        loadLogs();
      }, 100);

      // Suscribirse a logs en tiempo real
      const interval = setInterval(() => {
        loadLogs();
      }, 1000); // Actualizar cada segundo

      return () => {
        clearTimeout(timeout);
        clearInterval(interval);
      };
    }
  }, [isOpen, instanceId]);

  // Auto-scroll cuando hay nuevos logs
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const loadLogs = async () => {
    try {
      // Verificar que la API esté disponible con múltiples verificaciones
      if (!window.api) {
        setError('API no disponible. Por favor, recarga la aplicación.');
        return;
      }

      if (!window.api.game) {
        setError('API de juego no disponible. Por favor, recarga la aplicación.');
        return;
      }

      if (typeof window.api.game.getLogs !== 'function') {
        console.warn('[GameLogsModal] window.api.game.getLogs no es una función', typeof window.api.game.getLogs);
        console.log('[GameLogsModal] window.api.game disponible:', window.api.game);
        console.log('[GameLogsModal] Métodos disponibles en window.api.game:', Object.keys(window.api.game || {}));
        setError('Método getLogs no disponible. Por favor, recarga la aplicación.');
        return;
      }

      const gameLogs = await window.api.game.getLogs(instanceId);
      if (gameLogs && Array.isArray(gameLogs)) {
        setLogs(gameLogs);
        setError(null);
      } else {
        // Si no hay logs, simplemente mostrar array vacío
        setLogs([]);
        setError(null);
      }
    } catch (err) {
      console.error('Error al cargar logs:', err);
      setError(`Error al cargar logs: ${(err as Error).message || 'Error desconocido'}`);
    }
  };

  const handleScroll = () => {
    if (logsContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = logsContainerRef.current;
      // Si está cerca del final (dentro de 100px), mantener auto-scroll
      setAutoScroll(scrollHeight - scrollTop - clientHeight < 100);
    }
  };

  const scrollToBottom = () => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setAutoScroll(true);
    }
  };

  const clearLogs = async () => {
    try {
      if (window.api?.game?.clearLogs) {
        await window.api.game.clearLogs(instanceId);
        setLogs([]);
      }
    } catch (err) {
      console.error('Error al limpiar logs:', err);
    }
  };

  const copyLogs = () => {
    const logsText = logs.join('\n');
    navigator.clipboard.writeText(logsText).then(() => {
      // Mostrar notificación temporal
      const notification = document.createElement('div');
      notification.textContent = 'Logs copiados al portapapeles';
      notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg z-50';
      document.body.appendChild(notification);
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 2000);
    });
  };

  const getLogColor = (log: string): string => {
    const lowerLog = log.toLowerCase();
    if (lowerLog.includes('error') || lowerLog.includes('exception') || lowerLog.includes('failed')) {
      return 'text-red-400';
    } else if (lowerLog.includes('warn') || lowerLog.includes('warning')) {
      return 'text-yellow-400';
    } else if (lowerLog.includes('info') || lowerLog.includes('loading')) {
      return 'text-blue-400';
    } else if (lowerLog.includes('success') || lowerLog.includes('done')) {
      return 'text-green-400';
    }
    return 'text-gray-300';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-4xl h-[80vh] bg-gray-800/95 border border-gray-700/50 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700/50 bg-gray-900/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Logs del Juego</h2>
                <p className="text-sm text-gray-400">{instanceName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyLogs}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                title="Copiar logs"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copiar
              </button>
              <button
                onClick={clearLogs}
                className="px-3 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                title="Limpiar logs"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Limpiar
              </button>
              {!autoScroll && (
                <button
                  onClick={scrollToBottom}
                  className="px-3 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                  title="Ir al final"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Logs Container */}
          <div
            ref={logsContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 bg-gray-900/50 font-mono text-sm"
          >
            {error ? (
              <div className="text-red-400 p-4 bg-red-900/20 rounded-lg border border-red-700/50">
                <p className="font-semibold mb-2">{error}</p>
                {error.includes('no disponible') && (
                  <div className="text-sm text-red-300 mt-2">
                    <p className="mb-1">Por favor, intenta:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Recargar la aplicación (Ctrl+R o Cmd+R)</li>
                      <li>Reiniciar el launcher</li>
                      <li>Verificar que el juego se haya ejecutado al menos una vez</li>
                    </ul>
                  </div>
                )}
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg font-semibold mb-2">No hay logs disponibles</p>
                <p className="text-sm">Los logs aparecerán aquí cuando ejecutes el juego</p>
              </div>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className={`${getLogColor(log)} break-words whitespace-pre-wrap`}
                  >
                    {log}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-gray-700/50 bg-gray-900/50 text-xs text-gray-400">
            <div className="flex items-center gap-4">
              <span>{logs.length} líneas</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="rounded"
                />
                <span>Auto-scroll</span>
              </label>
            </div>
            <button
              onClick={loadLogs}
              disabled={isLoading}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Cargando...' : 'Actualizar'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

