import React, { useState, useEffect } from 'react';
import { downloadService } from '../services/downloadService';

interface ContentDownloadProgressWidgetProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  onShowHistory?: () => void;
}

interface Download {
  id: string;
  name: string;
  url: string;
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'error';
  progress: number;
  downloadedBytes: number;
  totalBytes: number;
  startTime: number;
  endTime?: number;
  speed: number; // bytes per second
  path?: string;
  profileUsername?: string;
}

interface ProgressStatus {
  id: string;
  operation: string; // download, install, etc.
  target: string; // El objetivo de la operación
  progress: number; // 0-1
  status: 'pending' | 'in-progress' | 'completed' | 'error' | 'cancelled';
  current: number;
  total: number;
  speed?: number; // Bytes por segundo
  elapsedTime?: number; // Milisegundos
  estimatedTimeRemaining?: number; // Milisegundos
  details?: string;
}

const ContentDownloadProgressWidget: React.FC<ContentDownloadProgressWidgetProps> = ({ position = 'top-left', onShowHistory }) => {
  const [activeDownloads, setActiveDownloads] = useState<Download[]>([]);
  const [completedDownloads, setCompletedDownloads] = useState<Download[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'single' | 'multiple'>('single');

  useEffect(() => {
    const unsubscribe = downloadService.subscribe(downloads => {
      // Filtrar SOLO descargas de complementos (mods, resourcepacks, shaders, datapacks)
      // Mejorar el filtro para ser más preciso
      const contentDownloads = downloads.filter(d => {
        const nameLower = d.name.toLowerCase();
        const urlLower = d.url?.toLowerCase() || '';
        
        // Verificar si es un complemento basado en nombre o URL
        return (
          nameLower.includes('.jar') && (
            nameLower.includes('mod') ||
            nameLower.includes('fabric') ||
            nameLower.includes('forge') ||
            nameLower.includes('quilt') ||
            nameLower.includes('neoforge')
          )
        ) ||
        nameLower.includes('resourcepack') ||
        nameLower.includes('resource-pack') ||
        nameLower.includes('texture') ||
        nameLower.includes('shader') ||
        nameLower.includes('datapack') ||
        nameLower.includes('data-pack') ||
        urlLower.includes('/mod/') ||
        urlLower.includes('/resourcepack/') ||
        urlLower.includes('/shader/') ||
        urlLower.includes('/datapack/') ||
        urlLower.includes('modrinth.com') ||
        urlLower.includes('curseforge.com');
      });

      const active = contentDownloads.filter(d =>
        d.status === 'downloading' || d.status === 'pending' || d.status === 'paused'
      );

      const completed = contentDownloads.filter(d =>
        d.status === 'completed'
      );

      setActiveDownloads(active);
      setCompletedDownloads(completed);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  }[position];

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

  const handleOpenFolder = async (download: Download) => {
    if (download.path) {
      try {
        if (window.api?.shell?.showItemInFolder) {
          await window.api.shell.showItemInFolder(download.path);
        } else {
          console.warn('Shell API not available to open folder');
        }
      } catch (error) {
        console.error('Error opening folder:', error);
      }
    }
  };

  return (
    <div className={`fixed z-[100] ${positionClasses} transition-all duration-300`}>
      {/* Main widget button */}
      <div
        className="relative"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <button className="relative w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg flex items-center justify-center hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 group">
          {/* Download icon */}
          <svg 
            className="w-6 h-6 text-white" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            ></path>
          </svg>
          
          {/* Notification indicator */}
          {activeDownloads.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {activeDownloads.length}
            </span>
          )}
        </button>
      </div>

      {/* Expanded view */}
      {isExpanded && (
        <div className={`absolute mt-2 ${position === 'top-left' ? 'left-0' : '-left-96'} w-96 bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700/80 overflow-hidden z-50`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-700/50">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Progreso de Descargas</h3>
              <div className="flex items-center gap-2">
                {onShowHistory && (
                  <button
                    onClick={() => {
                      setIsExpanded(false);
                      onShowHistory();
                    }}
                    className="p-1.5 text-gray-400 hover:text-white transition-colors"
                    title="Ver historial"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                )}
                <button 
                  onClick={() => setIsExpanded(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="mt-3 flex space-x-1">
              <button
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'single'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-black shadow-sm'
                    : 'bg-gray-700/70 text-gray-300'
                }`}
                onClick={() => setActiveTab('single')}
              >
                Descargas Complemento
              </button>
              <button
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'multiple'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-black shadow-sm'
                    : 'bg-gray-700/70 text-gray-300'
                }`}
                onClick={() => setActiveTab('multiple')}
              >
                Descargas Múltiples
              </button>
            </div>
          </div>

          {/* Content based on active tab */}
          <div className="max-h-[500px] overflow-y-auto">
            {activeTab === 'single' ? (
              /* Single Downloads Tab */
              <div className="divide-y divide-gray-700/50">
                {activeDownloads.length === 0 && completedDownloads.length === 0 ? (
                  <div className="p-6 text-center text-gray-400">
                    No hay descargas activas o completadas
                  </div>
                ) : (
                  <>
                    {/* Active downloads */}
                    {activeDownloads.map(download => (
                      <div key={download.id} className="p-3 hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white text-sm truncate">
                              {download.name}
                            </h4>
                            <div className="mt-1">
                              <div className="w-full bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
                                  style={{ width: `${download.progress}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-xs text-gray-400 mt-1">
                                <span>{Math.round(download.progress)}%</span>
                                <span>
                                  {download.downloadedBytes > 0 && download.totalBytes > 0
                                    ? `${formatBytes(download.downloadedBytes)} / ${formatBytes(download.totalBytes)}`
                                    : `${formatBytes(download.downloadedBytes)}`}
                                </span>
                              </div>
                            </div>
                            {download.speed > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                {formatSpeed(download.speed)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Completed downloads */}
                    {completedDownloads.map(download => (
                      <div key={download.id} className="p-3 hover:bg-gray-700/50 transition-colors border-t border-gray-700/50">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {/* Checkmark verde */}
                              <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                              <h4 className="font-medium text-green-400 text-sm truncate">
                                {download.name}
                              </h4>
                            </div>
                            <div className="mt-1">
                              <div className="w-full bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-300 ease-out"
                                  style={{ width: '100%' }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                Completado
                              </div>
                            </div>
                          </div>
                          
                          {/* Open folder button */}
                          {download.path && (
                            <button
                              onClick={() => handleOpenFolder(download)}
                              className="ml-2 p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg text-white hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex-shrink-0"
                              title="Abrir carpeta"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            ) : (
              /* Multiple Downloads Tab */
              <div className="p-6 text-center text-gray-400">
                <div className="text-4xl mb-3">📦</div>
                <h3 className="font-medium text-white mb-2">Descargas Múltiples</h3>
                <p className="text-sm mb-4">
                  Característica en desarrollo.<br />
                  Similar a PrismLauncher u otros launchers avanzados.
                </p>
                <div className="inline-flex items-center px-4 py-2 bg-gray-700/70 rounded-lg text-sm">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Próximamente
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-gray-900/50 border-t border-gray-700/50 text-xs text-gray-400">
            <div className="flex justify-between">
              <span>{activeDownloads.length} activas</span>
              <span>{completedDownloads.length} completadas</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentDownloadProgressWidget;