import React, { useState, useEffect } from 'react';
import { Download } from '../types/download';
import { downloadService } from '../services/downloadService';

interface DownloadProgressWidgetProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const DownloadProgressWidget: React.FC<DownloadProgressWidgetProps> = ({ position = 'top-right' }) => {
  const [activeDownloads, setActiveDownloads] = useState<Download[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const unsubscribe = downloadService.subscribe(downloads => {
      // Filtrar solo descargas de contenido (mods, resourcepacks, shaders, datapacks)
      const active = downloads.filter(d =>
        (d.status === 'downloading' || d.status === 'pending') &&
        (d.name.toLowerCase().includes('mod') ||
         d.name.toLowerCase().includes('resourcepack') ||
         d.name.toLowerCase().includes('shader') ||
         d.name.toLowerCase().includes('datapack') ||
         d.name.toLowerCase().includes('texture') ||
         d.name.toLowerCase().includes('pack'))
      );

      setActiveDownloads(active);
      setIsVisible(active.length > 0);
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

  if (!isVisible) {
    return null;
  }

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
        <button className="relative w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg flex items-center justify-center hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 group">
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
          
          {/* Progress circle */}
          {activeDownloads.length > 0 && (
            <div className="absolute inset-0 rounded-full border-4 border-blue-300/30"></div>
          )}
        </button>
      </div>

      {/* Expanded view */}
      {isExpanded && (
        <div className="absolute mt-2 w-80 bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700/80 overflow-hidden z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-700/50">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Descargas Activas</h3>
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

          {/* Download list */}
          <div className="max-h-96 overflow-y-auto">
            {activeDownloads.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                No hay descargas activas
              </div>
            ) : (
              <div className="divide-y divide-gray-700/50">
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
                                ? `${(download.downloadedBytes / 1024 / 1024).toFixed(1)}MB / ${(download.totalBytes / 1024 / 1024).toFixed(1)}MB`
                                : `${(download.downloadedBytes / 1024 / 1024).toFixed(1)}MB`}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {download.status === 'completed' && download.path && (
                        <button 
                          onClick={() => handleOpenFolder(download)}
                          className="ml-2 p-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-gray-300 hover:text-white"
                          title="Abrir carpeta"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                        </button>
                      )}
                    </div>
                    
                    {download.speed > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {Math.round(download.speed / 1024)} KB/s
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer with completed downloads stats */}
          <div className="p-3 bg-gray-900/50 border-t border-gray-700/50 text-xs text-gray-400">
            {activeDownloads.length === 0 ? (
              <div className="text-center">No hay descargas activas</div>
            ) : (
              <div className="flex justify-between">
                <span>{activeDownloads.length} activas</span>
                <span>{downloadService.getCompletedDownloads().filter(d =>
                  d.name.toLowerCase().includes('mod') ||
                  d.name.toLowerCase().includes('resourcepack') ||
                  d.name.toLowerCase().includes('shader') ||
                  d.name.toLowerCase().includes('datapack') ||
                  d.name.toLowerCase().includes('texture') ||
                  d.name.toLowerCase().includes('pack')
                ).length} completadas</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DownloadProgressWidget;