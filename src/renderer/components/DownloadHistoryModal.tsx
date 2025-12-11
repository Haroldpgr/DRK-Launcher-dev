import React, { useState, useEffect } from 'react';
import { downloadService, Download } from '../services/downloadService';
import { multipleDownloadQueueService, QueuedDownloadItem } from '../services/multipleDownloadQueueService';
import { showModernConfirm, showModernAlert } from '../utils/uiUtils';

interface DownloadHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DownloadHistoryModal: React.FC<DownloadHistoryModalProps> = ({
  isOpen,
  onClose
}) => {
  const [allDownloads, setAllDownloads] = useState<Download[]>([]);
  const [filteredDownloads, setFilteredDownloads] = useState<Download[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'error'>('all');
  const [multipleQueue, setMultipleQueue] = useState<QueuedDownloadItem[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = downloadService.subscribe((downloads) => {
      // Filtrar SOLO descargas de complementos (mods, resourcepacks, shaders, datapacks)
      const contentDownloads = downloads.filter(d => {
        const nameLower = d.name.toLowerCase();
        const urlLower = d.url?.toLowerCase() || '';
        const idLower = d.id?.toLowerCase() || '';
        
        // Verificar si es un complemento basado en:
        // 1. ID que empiece con "content-" o "multiple-" (descargas de contenido)
        // 2. Nombre o URL que contenga palabras clave de complementos
        return (
          idLower.startsWith('content-') ||
          idLower.startsWith('multiple-') ||
          (nameLower.includes('.jar') && (
            nameLower.includes('mod') ||
            nameLower.includes('fabric') ||
            nameLower.includes('forge') ||
            nameLower.includes('quilt') ||
            nameLower.includes('neoforge')
          )) ||
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
          urlLower.includes('curseforge.com') ||
          urlLower.startsWith('content://')
        );
      });
      
      setAllDownloads(contentDownloads);
    });

    // Suscribirse a la cola de descargas múltiples
    const unsubscribeMultiple = multipleDownloadQueueService.subscribe((queue) => {
      setMultipleQueue(queue);
    });

    return () => {
      unsubscribe();
      unsubscribeMultiple();
    };
  }, [isOpen]);

  useEffect(() => {
    let filtered = [...allDownloads];

    // Filtrar por estado
    if (statusFilter === 'completed') {
      filtered = filtered.filter(d => d.status === 'completed');
    } else if (statusFilter === 'error') {
      filtered = filtered.filter(d => d.status === 'error');
    }

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(d => 
        d.name.toLowerCase().includes(term) ||
        (d.path && d.path.toLowerCase().includes(term))
      );
    }

    // Ordenar por fecha (más recientes primero)
    filtered.sort((a, b) => (b.endTime || b.startTime) - (a.endTime || a.startTime));

    setFilteredDownloads(filtered);
  }, [allDownloads, searchTerm, statusFilter]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  const getStatusColor = (status: Download['status']): string => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'error':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'downloading':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'paused':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: Download['status']) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  const handleOpenFolder = async (download: Download) => {
    if (download.path) {
      try {
        if (window.api?.shell?.showItemInFolder) {
          await window.api.shell.showItemInFolder(download.path);
        } else {
          await showModernAlert('Error', 'No se pudo abrir la carpeta. Ruta: ' + download.path, 'error');
        }
      } catch (error) {
        console.error('Error opening folder:', error);
        await showModernAlert('Error', 'Error al abrir la carpeta: ' + (error as Error).message, 'error');
      }
    }
  };

  const handleClearHistory = async () => {
    const confirmed = await showModernConfirm(
      'Limpiar historial',
      '¿Estás seguro de que quieres limpiar el historial de descargas completadas y con error?',
      'warning'
    );
    if (confirmed) {
      downloadService.clearCompletedAndErrors();
    }
  };

  const handleDeleteDownload = async (downloadId: string, downloadName: string) => {
    const confirmed = await showModernConfirm(
      'Eliminar del historial',
      `¿Estás seguro de que quieres eliminar "${downloadName}" del historial?`,
      'danger'
    );
    if (confirmed) {
      downloadService.removeFromHistory(downloadId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-gray-800/95 backdrop-blur-xl rounded-2xl border border-gray-700/80 shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Historial de Descargas
              </h2>
              <p className="text-gray-400 mt-1 text-sm">
                {filteredDownloads.length} descarga{filteredDownloads.length !== 1 ? 's' : ''} encontrada{filteredDownloads.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar descargas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'completed' | 'error')}
              className="bg-gray-700/50 border border-gray-600 rounded-xl text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              <option value="completed">Completadas</option>
              <option value="error">Con error</option>
            </select>
            <button
              onClick={handleClearHistory}
              className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl font-medium transition-all duration-200"
            >
              Limpiar historial
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredDownloads.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <svg className="mx-auto h-16 w-16 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-medium text-gray-300">
                {searchTerm || statusFilter !== 'all' ? 'No se encontraron descargas' : 'No hay historial de descargas'}
              </p>
              <p className="text-sm mt-2">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Intenta con otros filtros' 
                  : 'Las descargas completadas aparecerán aquí'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDownloads.map(download => (
                <div
                  key={download.id}
                  className={`bg-gray-700/40 rounded-xl p-4 border transition-all ${
                    download.status === 'completed' 
                      ? 'border-green-500/20 hover:border-green-500/40' 
                      : download.status === 'error'
                      ? 'border-red-500/20 hover:border-red-500/40'
                      : 'border-gray-600/30 hover:border-gray-500/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(download.status)}
                        <h4 className={`font-medium truncate ${
                          download.status === 'completed' ? 'text-green-400' : 
                          download.status === 'error' ? 'text-red-400' : 
                          'text-white'
                        }`}>
                          {download.name}
                        </h4>
                        <span className={`px-2 py-0.5 text-xs rounded-full border ${getStatusColor(download.status)}`}>
                          {download.status === 'completed' ? 'Completada' :
                           download.status === 'error' ? 'Error' :
                           download.status === 'downloading' ? 'Descargando' :
                           download.status === 'paused' ? 'Pausada' : 'Pendiente'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400 space-y-1">
                        <div className="flex items-center gap-4">
                          <span>Iniciada: {formatTime(download.startTime)}</span>
                          {download.endTime && (
                            <span>Completada: {formatTime(download.endTime)}</span>
                          )}
                        </div>
                        {download.path && (
                          <div className="text-gray-500 truncate">
                            {download.path}
                          </div>
                        )}
                        <div className="flex items-center gap-4">
                          {download.totalBytes > 0 && (
                            <span>Tamaño: {formatBytes(download.totalBytes)}</span>
                          )}
                          {download.progress > 0 && (
                            <span>Progreso: {Math.round(download.progress)}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {download.path && download.status === 'completed' && (
                        <button
                          onClick={() => handleOpenFolder(download)}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
                          title="Abrir carpeta"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                          Abrir
                        </button>
                      )}
                      {download.status === 'error' && (
                        <button
                          onClick={() => handleDeleteDownload(download.id, download.name)}
                          className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
                          title="Eliminar del historial"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DownloadHistoryModal;

