import React, { useState, useEffect } from 'react';
import { multipleDownloadQueueService, QueuedDownloadItem } from '../services/multipleDownloadQueueService';
import { downloadService } from '../services/downloadService';

// Interfaz extendida para incluir información del contenido original
interface ExtendedQueuedItem extends QueuedDownloadItem {
  originalItemId?: string; // ID original del contenido (sin el timestamp)
  contentType?: 'mod' | 'resourcepack' | 'shader' | 'datapack' | 'modpack';
}

interface MultipleDownloadQueueProps {
  isVisible: boolean;
  onClose: () => void;
}

const MultipleDownloadQueue: React.FC<MultipleDownloadQueueProps> = ({ 
  isVisible, 
  onClose 
}) => {
  const [queue, setQueue] = useState<QueuedDownloadItem[]>([]);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [downloadMode, setDownloadMode] = useState<'sequential' | 'parallel'>('sequential');

  useEffect(() => {
    if (!isVisible) return;
    
    const unsubscribe = multipleDownloadQueueService.subscribe((updatedQueue) => {
      setQueue(updatedQueue);
    });

    return () => {
      unsubscribe();
    };
  }, [isVisible]);

  const removeFromQueue = (id: string) => {
    multipleDownloadQueueService.removeFromQueue(id);
  };

  const toggleItemEnabled = (id: string) => {
    multipleDownloadQueueService.toggleItemEnabled(id);
  };

  const clearCompleted = () => {
    multipleDownloadQueueService.clearCompleted();
  };

  const startDownload = async () => {
    setIsStarting(true);
    const enabledItems = multipleDownloadQueueService.getEnabledItems();
    
    const downloadItem = async (item: QueuedDownloadItem) => {
      try {
        multipleDownloadQueueService.updateItemStatus(item.id, 'downloading', 0);
        
        // Usar el ID original y tipo de contenido del item
        const originalItemId = (item as any).originalId || item.id.split('-')[0];
        const contentType = item.contentType || 'mod';
        
        // Verificar nuevamente que haya versiones compatibles antes de descargar
        let compatibleVersions: any[] = [];
        try {
          if (item.platform === 'modrinth') {
            compatibleVersions = await window.api.modrinth.getCompatibleVersions({
              projectId: originalItemId,
              mcVersion: item.version,
              loader: item.loader || undefined
            });
          } else if (item.platform === 'curseforge') {
            compatibleVersions = await window.api.curseforge.getCompatibleVersions({
              projectId: originalItemId,
              mcVersion: item.version,
              loader: item.loader || undefined
            });
          }
        } catch (error) {
          throw new Error(`Error al verificar versiones compatibles: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
        
        if (compatibleVersions.length === 0) {
          const loaderText = item.loader ? ` y ${item.loader}` : '';
          throw new Error(`No hay versiones disponibles para ${item.version}${loaderText}. Este contenido no está disponible para esta combinación de versión y loader.`);
        }
        
        // Crear entrada de descarga al inicio
        const downloadId = `multiple-${item.id}-${Date.now()}`;
        const startTime = Date.now();
        
        // Agregar entrada inicial
        downloadService.addDownloadToHistory({
          id: downloadId,
          name: item.name,
          url: `content://${item.platform}/${originalItemId}`,
          status: 'downloading',
          progress: 0,
          downloadedBytes: 0,
          totalBytes: 1000000,
          startTime: startTime,
          speed: 0,
          path: item.targetPath,
          profileUsername: undefined
        });
        
        // Actualizar progreso inicial
        multipleDownloadQueueService.updateItemStatus(item.id, 'downloading', 10);
        downloadService.addDownloadToHistory({
          id: downloadId,
          name: item.name,
          url: `content://${item.platform}/${originalItemId}`,
          status: 'downloading',
          progress: 10,
          downloadedBytes: 100000,
          totalBytes: 1000000,
          startTime: startTime,
          speed: 0,
          path: item.targetPath,
          profileUsername: undefined
        });
        
        // Realizar la descarga usando la API
        await window.api.instances.installContent({
          instancePath: item.targetPath,
          contentId: originalItemId,
          contentType: contentType,
          mcVersion: item.version,
          loader: item.loader || undefined,
          versionId: undefined
        });
        
        // Actualizar progreso durante la descarga
        for (let progress = 30; progress < 100; progress += 20) {
          await new Promise(resolve => setTimeout(resolve, 100));
          multipleDownloadQueueService.updateItemStatus(item.id, 'downloading', progress);
          downloadService.addDownloadToHistory({
            id: downloadId,
            name: item.name,
            url: `content://${item.platform}/${originalItemId}`,
            status: 'downloading',
            progress: progress,
            downloadedBytes: Math.round((progress / 100) * 1000000),
            totalBytes: 1000000,
            startTime: startTime,
            speed: 0,
            path: item.targetPath,
            profileUsername: undefined
          });
        }
        
        // Actualizar progreso final
        multipleDownloadQueueService.updateItemStatus(item.id, 'downloading', 100);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        multipleDownloadQueueService.updateItemStatus(item.id, 'completed', 100);
        
        // Marcar como completada
        downloadService.addDownloadToHistory({
          id: downloadId,
          name: item.name,
          url: `content://${item.platform}/${originalItemId}`,
          status: 'completed',
          progress: 100,
          downloadedBytes: 1000000,
          totalBytes: 1000000,
          startTime: startTime,
          endTime: Date.now(),
          speed: 0,
          path: item.targetPath, // Ruta donde se descargó
          profileUsername: undefined
        });
      } catch (error) {
        console.error(`Error descargando ${item.name}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        multipleDownloadQueueService.updateItemStatus(item.id, 'error', undefined, errorMessage);
      }
    };
    
    if (downloadMode === 'sequential') {
      // Descargar en orden
      for (const item of enabledItems) {
        await downloadItem(item);
      }
    } else {
      // Descargar en paralelo
      const downloadPromises = enabledItems.map(item => downloadItem(item));
      await Promise.all(downloadPromises);
    }
    
    setIsStarting(false);
  };

  const enabledCount = queue.filter(item => item.enabled && item.status === 'pending').length;
  const hasPendingDownloads = queue.some(item => item.enabled && item.status === 'pending');
  const completedDownloads = queue.filter(item => item.status === 'completed').length;
  const totalDownloads = queue.length;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-700/80 shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">Cola de Descargas Múltiples</h2>
              <p className="text-gray-400 mt-1">
                {queue.length} elementos en la cola | {completedDownloads} completados
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {queue.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <svg className="mx-auto h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium">No hay descargas en cola</h3>
              <p className="mt-1">Agrega elementos desde la vista de contenido para iniciar descargas múltiples</p>
            </div>
          ) : (
            <div className="space-y-3">
              {queue.map((item, index) => (
                <div 
                  key={`queue-${item.id}-${index}`} 
                  className={`p-4 rounded-xl border transition-all duration-200 ${
                    !item.enabled
                      ? 'opacity-50 bg-gray-800/30 border-gray-700/30'
                      : item.status === 'completed' 
                        ? 'bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-500/30' 
                        : item.status === 'error'
                          ? 'bg-gradient-to-r from-red-900/20 to-rose-900/20 border-red-500/30' 
                          : item.status === 'downloading'
                            ? 'bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border-blue-500/30' 
                            : 'bg-gray-700/30 border-gray-600/30 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Toggle para activar/desactivar */}
                      <button
                        onClick={() => toggleItemEnabled(item.id)}
                        className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          item.enabled
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 border-green-400'
                            : 'bg-gray-600 border-gray-500'
                        }`}
                        title={item.enabled ? 'Desactivar descarga' : 'Activar descarga'}
                      >
                        {item.enabled && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-medium truncate ${item.enabled ? 'text-white' : 'text-gray-500'}`}>
                            {item.name}
                          </h4>
                          <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                            item.status === 'completed' 
                              ? 'bg-green-500/20 text-green-300' 
                              : item.status === 'error'
                                ? 'bg-red-500/20 text-red-300' 
                                : item.status === 'downloading'
                                  ? 'bg-blue-500/20 text-blue-300' 
                                  : 'bg-gray-500/20 text-gray-300'
                          }`}>
                            {item.status === 'pending' && 'Pendiente'}
                            {item.status === 'downloading' && 'Descargando'}
                            {item.status === 'completed' && 'Completado'}
                            {item.status === 'error' && 'Error'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-400">
                          <span className="bg-gray-600/30 px-2 py-1 rounded">
                            {item.version}
                          </span>
                          {item.loader && (
                            <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                              {item.loader}
                            </span>
                          )}
                          <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                            {item.platform}
                          </span>
                        </div>
                        {item.error && (
                          <div className="mt-2 text-sm text-red-400 bg-red-900/20 p-2 rounded-lg">
                            Error: {item.error}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {item.status === 'pending' && (
                      <button
                        onClick={() => removeFromQueue(item.id)}
                        className="text-gray-400 hover:text-red-400 transition-colors p-1 flex-shrink-0"
                        title="Remover de la cola"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {item.status === 'downloading' && item.progress !== undefined && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${item.progress}%` }}
                        ></div>
                      </div>
                      <div className="text-right text-xs text-gray-400 mt-1">
                        {Math.round(item.progress)}%
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-700/50 bg-gray-800/50">
          <div className="space-y-4">
            {/* Selector de modo de descarga */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">Modo de descarga:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setDownloadMode('sequential')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    downloadMode === 'sequential'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  En Orden
                </button>
                <button
                  onClick={() => setDownloadMode('parallel')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    downloadMode === 'parallel'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  En Paralelo
                </button>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-400">
                {completedDownloads} de {totalDownloads} completados | {enabledCount} activos
              </div>
              <div className="flex gap-3">
                {queue.length > 0 && (
                  <button
                    onClick={clearCompleted}
                    className="px-4 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium transition-all duration-200"
                    disabled={completedDownloads === 0}
                  >
                    Limpiar completados
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium transition-all duration-200"
                >
                  Cerrar
                </button>
                <button
                  onClick={startDownload}
                  disabled={isStarting || !hasPendingDownloads}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-medium transition-all duration-200 shadow-lg shadow-green-500/20 hover:shadow-green-500/30 disabled:shadow-none"
                >
                  {isStarting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Descargando...
                    </div>
                  ) : (
                    `Descargar ${enabledCount} ${downloadMode === 'sequential' ? 'en orden' : 'en paralelo'}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultipleDownloadQueue;
