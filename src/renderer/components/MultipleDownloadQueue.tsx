import React, { useState, useEffect } from 'react';

interface QueuedDownloadItem {
  id: string;
  name: string;
  version: string;
  loader?: string;
  targetPath: string;
  platform: string;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  progress?: number;
  error?: string;
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
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});

  // Cargar la cola de descargas desde localStorage o estado global
  useEffect(() => {
    if (isVisible) {
      const savedQueue = localStorage.getItem('multipleDownloadQueue');
      if (savedQueue) {
        try {
          const parsedQueue = JSON.parse(savedQueue);
          setQueue(parsedQueue);
        } catch (error) {
          console.error('Error parsing download queue:', error);
          setQueue([]);
        }
      }
    }
  }, [isVisible]);

  const addToQueue = (items: Array<Omit<QueuedDownloadItem, 'status'>>) => {
    const newItems = items.map(item => ({
      ...item,
      status: 'pending' as const
    }));
    
    setQueue(prev => [...prev, ...newItems]);
    // Guardar en localStorage
    localStorage.setItem('multipleDownloadQueue', JSON.stringify([...queue, ...newItems]));
  };

  const removeFromQueue = (id: string) => {
    const updatedQueue = queue.filter(item => item.id !== id);
    setQueue(updatedQueue);
    localStorage.setItem('multipleDownloadQueue', JSON.stringify(updatedQueue));
  };

  const clearCompleted = () => {
    const updatedQueue = queue.filter(item => item.status !== 'completed');
    setQueue(updatedQueue);
    localStorage.setItem('multipleDownloadQueue', JSON.stringify(updatedQueue));
  };

  const startDownload = async () => {
    setIsStarting(true);
    
    // Simular descarga de cada elemento en la cola
    for (const item of queue) {
      if (item.status === 'pending') {
        try {
          // Actualizar estado a descargando
          setQueue(prev => prev.map(qItem => 
            qItem.id === item.id ? { ...qItem, status: 'downloading' } : qItem
          ));
          
          // Simular progreso de descarga
          for (let progress = 0; progress <= 100; progress += 10) {
            await new Promise(resolve => setTimeout(resolve, 200)); // Simular tiempo de descarga
            setDownloadProgress(prev => ({ ...prev, [item.id]: progress }));
          }
          
          // Marcar como completado
          setQueue(prev => prev.map(qItem => 
            qItem.id === item.id ? { ...qItem, status: 'completed', progress: 100 } : qItem
          ));
          
          // Remover de la cola después de completar (opcional)
          // setQueue(prev => prev.filter(qItem => qItem.id !== item.id));
        } catch (error) {
          // Marcar como error
          setQueue(prev => prev.map(qItem => 
            qItem.id === item.id ? { ...qItem, status: 'error', error: (error as Error).message } : qItem
          ));
        }
      }
    }
    
    setIsStarting(false);
  };

  const hasPendingDownloads = queue.some(item => item.status === 'pending');
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
              {queue.map((item) => (
                <div 
                  key={item.id} 
                  className={`p-4 rounded-xl border transition-all duration-200 ${
                    item.status === 'completed' 
                      ? 'bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-500/30' 
                      : item.status === 'error'
                        ? 'bg-gradient-to-r from-red-900/20 to-rose-900/20 border-red-500/30' 
                        : item.status === 'downloading'
                          ? 'bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border-blue-500/30' 
                          : 'bg-gray-700/30 border-gray-600/30 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-white truncate">{item.name}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${
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
                    {item.status === 'pending' && (
                      <button
                        onClick={() => removeFromQueue(item.id)}
                        className="ml-4 text-gray-400 hover:text-red-400 transition-colors p-1"
                        title="Remover de la cola"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {item.status === 'downloading' && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${downloadProgress[item.id] || 0}%` }}
                        ></div>
                      </div>
                      <div className="text-right text-xs text-gray-400 mt-1">
                        {Math.round(downloadProgress[item.id] || 0)}%
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-700/50 bg-gray-800/50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              {completedDownloads} de {totalDownloads} completados
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
                    {isStarting ? 'Iniciando...' : 'Iniciar descargas'}
                  </div>
                ) : (
                  `Iniciar ${queue.filter(item => item.status === 'pending').length} descargas`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultipleDownloadQueue;