// ============================================
// MODAL DE ACTUALIZACIONES
// Muestra información de actualizaciones con carrusel de cambios
// ============================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface UpdateInfo {
  version: string;
  releaseDate?: string;
  releaseNotes?: string;
  changes?: string[];
}

interface UpdateModalProps {
  isOpen: boolean;
  updateInfo: UpdateInfo | null;
  downloadProgress?: {
    percent: number;
    transferred: number;
    total: number;
    bytesPerSecond: number;
    delta?: boolean;
  };
  isDownloading: boolean;
  isDownloaded: boolean;
  hasInternet: boolean;
  updateStatus?: string; // 'validating' | 'configuring' | 'ready'
  onUpdate: () => void;
  onLater: () => void;
  onClose?: () => void;
}

export default function UpdateModal({
  isOpen,
  updateInfo,
  downloadProgress,
  isDownloading,
  isDownloaded,
  hasInternet,
  updateStatus = '',
  onUpdate,
  onLater,
  onClose
}: UpdateModalProps) {
  const [currentChangeIndex, setCurrentChangeIndex] = useState(0);
  const [autoInstallTimer, setAutoInstallTimer] = useState<number | null>(null);

  // Debug: Log cuando cambia el estado de descarga
  useEffect(() => {
    console.log('[UpdateModal] Estado actualizado:', {
      isOpen,
      isDownloading,
      isDownloaded,
      hasInternet,
      updateInfo: updateInfo?.version
    });
  }, [isOpen, isDownloading, isDownloaded, hasInternet, updateInfo]);

  // Parsear release notes en cambios individuales
  const changes = React.useMemo(() => {
    if (!updateInfo?.releaseNotes) {
      return updateInfo?.changes || [
        'Mejoras de rendimiento',
        'Corrección de errores',
        'Nuevas características'
      ];
    }

    // Intentar parsear markdown o texto plano
    const notes = updateInfo.releaseNotes;
    const lines = notes.split('\n').filter(line => line.trim());
    
    // Buscar listas con -, *, o números
    const listItems = lines
      .filter(line => /^[-*•]\s/.test(line) || /^\d+\.\s/.test(line))
      .map(line => line.replace(/^[-*•\d.\s]+/, '').trim())
      .filter(line => line.length > 0);

    return listItems.length > 0 ? listItems : [notes];
  }, [updateInfo]);

  // Auto-avanzar carrusel
  useEffect(() => {
    if (isOpen && changes.length > 1) {
      const interval = setInterval(() => {
        setCurrentChangeIndex((prev) => (prev + 1) % changes.length);
      }, 4000); // Cambiar cada 4 segundos

      return () => clearInterval(interval);
    }
  }, [isOpen, changes.length]);

  // Auto-instalar después de 5 minutos si eligió "Más tarde"
  useEffect(() => {
    if (isDownloaded && autoInstallTimer === null) {
      const timer = setTimeout(() => {
        onUpdate(); // Instalar automáticamente
      }, 5 * 60 * 1000); // 5 minutos

      setAutoInstallTimer(timer as any);
      return () => clearTimeout(timer);
    }
  }, [isDownloaded, autoInstallTimer, onUpdate]);

  if (!isOpen || !updateInfo) return null;

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    return formatBytes(bytesPerSecond) + '/s';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    🎉 Actualización Disponible
                  </h2>
                  <p className="text-blue-100">
                    Versión {updateInfo.version}
                  </p>
                </div>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {/* Carrusel de Cambios */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  ✨ ¿Qué hay de nuevo?
                </h3>
                
                <div className="relative bg-gray-800/50 rounded-lg p-4 min-h-[120px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentChangeIndex}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center space-x-3"
                    >
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"></div>
                      <p className="text-gray-200 text-base leading-relaxed">
                        {changes[currentChangeIndex]}
                      </p>
                    </motion.div>
                  </AnimatePresence>

                  {/* Indicadores del carrusel */}
                  {changes.length > 1 && (
                    <div className="flex justify-center space-x-2 mt-4">
                      {changes.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentChangeIndex(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentChangeIndex
                              ? 'bg-blue-500 w-6'
                              : 'bg-gray-600 hover:bg-gray-500'
                          }`}
                          aria-label={`Cambio ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Progreso de Descarga */}
              {isDownloading && downloadProgress && (
                <div className="mb-6 bg-gray-800/50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-300">
                      Descargando actualización...
                      {downloadProgress.delta && (
                        <span className="ml-2 text-xs text-blue-400">(Actualización diferencial - solo cambios)</span>
                      )}
                    </span>
                    <span className="text-sm text-gray-400">
                      {Math.round(downloadProgress.percent)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5 mb-2">
                    <motion.div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${downloadProgress.percent}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>
                      {formatBytes(downloadProgress.transferred)} / {formatBytes(downloadProgress.total)}
                      {downloadProgress.delta && (
                        <span className="ml-1 text-blue-400">(solo cambios, no archivo completo)</span>
                      )}
                    </span>
                    <span>{formatSpeed(downloadProgress.bytesPerSecond)}</span>
                  </div>
                </div>
              )}

              {/* Estado: Validando */}
              {updateStatus === 'validating' && (
                <div className="mb-6 bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                    <div className="flex-1">
                      <p className="text-blue-400 font-medium text-lg">Validando actualización...</p>
                      <p className="text-blue-300/80 text-sm mt-1">
                        Verificando integridad de los archivos descargados...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Estado: Configurando */}
              {updateStatus === 'configuring' && (
                <div className="mb-6 bg-purple-500/10 border border-purple-500/50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400"></div>
                    <div className="flex-1">
                      <p className="text-purple-400 font-medium text-lg">Configurando actualización...</p>
                      <p className="text-purple-300/80 text-sm mt-1">
                        Preparando la instalación y verificando datos del usuario...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Estado: Descargado y Listo */}
              {isDownloaded && !isDownloading && updateStatus === 'ready' && (
                <div className="mb-6 bg-green-500/10 border border-green-500/50 rounded-lg p-4 animate-pulse">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400 text-xl">✓</span>
                    <div className="flex-1">
                      <p className="text-green-400 font-medium text-lg">Actualización Lista para Instalar</p>
                      <p className="text-green-300/80 text-sm mt-1">
                        La actualización se ha descargado, validado y configurado correctamente. Haz clic en "Instalar y Reiniciar" para aplicar los cambios y reiniciar el launcher.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Sin Internet - Solo mostrar si NO está descargado */}
              {!hasInternet && !isDownloaded && (
                <div className="mb-6 bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-400 text-xl">⚠</span>
                    <div>
                      <p className="text-yellow-400 font-medium">Sin conexión a internet</p>
                      <p className="text-yellow-300/80 text-sm mt-1">
                        La actualización se descargará cuando tengas conexión.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Información adicional */}
              {updateInfo.releaseDate && (
                <div className="text-sm text-gray-400">
                  Fecha de lanzamiento: {new Date(updateInfo.releaseDate).toLocaleDateString('es-ES')}
                </div>
              )}
            </div>

            {/* Footer con Botones */}
            <div className="bg-gray-800/50 p-6 border-t border-gray-700">
              <div className="flex gap-3">
                {!isDownloaded || updateStatus !== 'ready' ? (
                  <>
                    <button
                      onClick={() => {
                        // Prevenir múltiples clics
                        if (isDownloading || updateStatus === 'validating' || updateStatus === 'configuring') {
                          console.log('[UpdateModal] Proceso en progreso, ignorando clic');
                          return;
                        }
                        console.log('[UpdateModal] Iniciando descarga...');
                        onUpdate();
                      }}
                      disabled={!hasInternet || isDownloading || updateStatus === 'validating' || updateStatus === 'configuring'}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:scale-100"
                    >
                      {isDownloading ? 'Descargando...' : updateStatus === 'validating' ? 'Validando...' : updateStatus === 'configuring' ? 'Configurando...' : 'Actualizar Ahora'}
                    </button>
                    <button
                      onClick={onLater}
                      disabled={isDownloading || updateStatus === 'validating' || updateStatus === 'configuring'}
                      className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-gray-200 font-medium rounded-lg transition-colors"
                    >
                      Más Tarde
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      console.log('[UpdateModal] Instalando actualización...');
                      onUpdate();
                    }}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-green-500/50"
                  >
                    🚀 Instalar y Reiniciar
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

