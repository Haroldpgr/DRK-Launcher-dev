import React, { useState, useEffect } from 'react';
import { downloadService, Download } from '../services/downloadService';

interface DownloadProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowHistory: () => void;
}

const DownloadProgressModal: React.FC<DownloadProgressModalProps> = ({
  isOpen,
  onClose,
  onShowHistory
}) => {
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [activeDownloads, setActiveDownloads] = useState<Download[]>([]);
  const [completedDownloads, setCompletedDownloads] = useState<Download[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = downloadService.subscribe((allDownloads) => {
      setDownloads(allDownloads);
      setActiveDownloads(allDownloads.filter(d => 
        d.status === 'downloading' || d.status === 'pending' || d.status === 'paused'
      ));
      setCompletedDownloads(allDownloads.filter(d => d.status === 'completed'));
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond === 0) return '0 B/s';
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
    return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleOpenFolder = async (download: Download) => {
    if (download.path) {
      try {
        if (window.api?.shell?.showItemInFolder) {
          await window.api.shell.showItemInFolder(download.path);
        } else {
          alert('No se pudo abrir la carpeta. Ruta: ' + download.path);
        }
      } catch (error) {
        console.error('Error opening folder:', error);
        alert('Error al abrir la carpeta: ' + (error as Error).message);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-gray-800/95 backdrop-blur-xl rounded-2xl border border-gray-700/80 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Progreso de Descargas
              </h2>
              <p className="text-gray-400 mt-1 text-sm">
                {activeDownloads.length} activas • {completedDownloads.length} completadas
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onShowHistory}
                className="px-4 py-2 bg-gray-700/80 hover:bg-gray-600/80 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Historial
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {downloads.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <svg className="mx-auto h-16 w-16 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-medium text-gray-300">No hay descargas</p>
              <p className="text-sm mt-2">Las descargas aparecerán aquí cuando se inicien</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Active Downloads */}
              {activeDownloads.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    Descargas Activas ({activeDownloads.length})
                  </h3>
                  <div className="space-y-3">
                    {activeDownloads.map(download => (
                      <div
                        key={download.id}
                        className="bg-gray-700/40 rounded-xl p-4 border border-gray-600/30 hover:border-gray-500/50 transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-white truncate">{download.name}</h4>
                              {download.status === 'paused' && (
                                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                                  Pausada
                                </span>
                              )}
                            </div>
                            <div className="w-full bg-gray-600/50 rounded-full h-2.5 mb-2">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${download.progress}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <div className="flex items-center gap-4 text-gray-400">
                                <span>{Math.round(download.progress)}%</span>
                                <span>
                                  {download.downloadedBytes > 0 && download.totalBytes > 0
                                    ? `${formatBytes(download.downloadedBytes)} / ${formatBytes(download.totalBytes)}`
                                    : formatBytes(download.downloadedBytes)}
                                </span>
                                {download.speed > 0 && (
                                  <span className="text-blue-400">{formatSpeed(download.speed)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Downloads */}
              {completedDownloads.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Completadas ({completedDownloads.length})
                  </h3>
                  <div className="space-y-3">
                    {completedDownloads.map(download => (
                      <div
                        key={download.id}
                        className="bg-gray-700/30 rounded-xl p-4 border border-green-500/20 hover:border-green-500/40 transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <h4 className="font-medium text-green-400 truncate">{download.name}</h4>
                            </div>
                            <div className="w-full bg-gray-600/50 rounded-full h-2.5 mb-2">
                              <div
                                className="bg-gradient-to-r from-green-500 to-emerald-600 h-2.5 rounded-full"
                                style={{ width: '100%' }}
                              ></div>
                            </div>
                            <div className="text-sm text-gray-400">
                              {download.endTime && (
                                <span>Completado: {formatTime(download.endTime)}</span>
                              )}
                              {download.path && (
                                <span className="ml-4 text-gray-500 truncate block mt-1">
                                  {download.path}
                                </span>
                              )}
                            </div>
                          </div>
                          {download.path && (
                            <button
                              onClick={() => handleOpenFolder(download)}
                              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2 flex-shrink-0"
                              title="Abrir carpeta"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                              </svg>
                              Abrir carpeta
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DownloadProgressModal;

