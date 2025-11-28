// src/renderer/components/DownloadsView.tsx
import React, { useState, useEffect } from 'react';
import Card from './Card';
import Button from './Button';
import { downloadService, Download } from '../services/downloadService';
import { profileService } from '../services/profileService';

const DownloadsView = () => {
  const [allDownloads, setAllDownloads] = useState<Download[]>([]);
  const [activeDownloads, setActiveDownloads] = useState<Download[]>([]);
  const [completedDownloads, setCompletedDownloads] = useState<Download[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [currentProfile, setCurrentProfile] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = downloadService.subscribe((downloads) => {
      setAllDownloads(downloads);
      setActiveDownloads(downloads.filter(d => d.status === 'downloading' || d.status === 'paused'));
      setCompletedDownloads(downloads.filter(d => d.status === 'completed'));
    });

    // Cargar estado inicial
    const initialDownloads = downloadService.getAllDownloads();
    setAllDownloads(initialDownloads);
    setActiveDownloads(downloadService.getActiveDownloads());
    setCompletedDownloads(downloadService.getCompletedDownloads());
    setCurrentProfile(profileService.getCurrentProfile());

    // Cleanup
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const filteredActive = activeDownloads.filter(download =>
    download.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCompleted = completedDownloads.filter(download =>
    download.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleClearCompleted = () => {
    downloadService.clearCompleted();
  };

  const handleRemoveFromHistory = (id: string) => {
    downloadService.removeFromHistory(id);
  };

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

  const getStatusColor = (status: Download['status']): string => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'error': return 'text-red-500';
      case 'downloading': return 'text-blue-500';
      case 'paused': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = (status: Download['status']): string => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'downloading': return 'Descargando';
      case 'paused': return 'En pausa';
      case 'completed': return 'Completado';
      case 'error': return 'Error';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-200 flex items-center gap-2">
                Historial de descargas
                <span className="text-xs font-semibold text-gray-400 bg-gray-800/80 px-2 py-0.5 rounded-full">
                  {activeDownloads.length} activas · {completedDownloads.length} completadas
                </span>
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {currentProfile ? `Perfil actual: ${currentProfile}` : 'Sin perfil seleccionado: se muestran todas las descargas.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Buscar descargas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 rounded-lg bg-gray-800/80 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <Button
                variant="secondary"
                onClick={handleClearCompleted}
                disabled={completedDownloads.length === 0}
              >
                Limpiar historial
              </Button>
            </div>
          </div>

          <div className="inline-flex items-center bg-gray-900/80 border border-gray-700/70 rounded-2xl p-1 text-xs text-gray-300 self-start">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1 rounded-xl transition-all ${
                activeTab === 'active'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-black shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Activas
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`ml-1 px-3 py-1 rounded-xl transition-all ${
                activeTab === 'completed'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-black shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Historial
            </button>
          </div>
        </div>

        {/* Descargas Activas */}
        {activeTab === 'active' && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-200 mb-4 flex items-center">
              <span className="mr-2">📥</span> Descargas Activas
              <span className="ml-2 text-sm text-gray-400 bg-gray-700/50 py-0.5 px-2 rounded-full">
                {activeDownloads.length}
              </span>
            </h3>
            {filteredActive.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay descargas activas
              </div>
            ) : (
              <div className="space-y-4">
                {filteredActive.map(download => (
                  <div 
                    key={download.id} 
                    className="p-4 bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700/50 transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-100 truncate">{download.name}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(download.status)} bg-opacity-20`}>
                            {getStatusText(download.status)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          {formatBytes(download.downloadedBytes)} / {formatBytes(download.totalBytes)}
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-400 whitespace-nowrap ml-4">
                        {download.speed > 0 ? formatSpeed(download.speed) : ''}
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full ${
                            download.status === 'completed' ? 'bg-green-500' : 
                            download.status === 'error' ? 'bg-red-500' : 
                            'bg-gradient-to-r from-blue-500 to-indigo-600'
                          }`}
                          style={{ width: `${download.progress}%` }}
                        ></div>
                      </div>
                      <div className="text-right text-xs text-gray-400 mt-1">
                        {download.progress}%
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <div>
                        Inicio: {new Date(download.startTime).toLocaleTimeString()}
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="hover:text-blue-400 transition-colors"
                          title="Abrir carpeta"
                        >
                          📁
                        </button>
                        <button
                          className="hover:text-red-400 transition-colors"
                          title="Cancelar"
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Descargas Completadas / Historial */}
        {activeTab === 'completed' && (
          <div>
            <h3 className="text-xl font-semibold text-gray-200 mb-4 flex items-center">
              <span className="mr-2">✅</span> Historial de descargas
              <span className="ml-2 text-sm text-gray-400 bg-gray-700/50 py-0.5 px-2 rounded-full">
                {completedDownloads.length}
              </span>
            </h3>
            {filteredCompleted.length === 0 ? (
              <div className="text-center py-10 text-gray-500 border border-dashed border-gray-700/70 rounded-2xl bg-gray-900/40">
                No hay descargas completadas todavía.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCompleted.map(download => (
                  <div 
                    key={download.id} 
                    className="p-4 bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/70 shadow-sm flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-medium text-gray-100 truncate" title={download.name}>{download.name}</h4>
                        <div className="text-xs text-gray-400 mt-1">
                          Tamaño: {formatBytes(download.totalBytes)}
                        </div>
                      </div>
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600/20 text-emerald-400 text-xs">
                        ✓
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        Finalizado: {download.endTime ? new Date(download.endTime).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-end mt-1">
                      <Button
                        variant="secondary"
                        className="!px-3 !py-1 text-[11px]"
                        onClick={() => handleRemoveFromHistory(download.id)}
                      >
                        Eliminar del historial
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default DownloadsView;