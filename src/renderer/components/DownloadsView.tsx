import React, { useState, useEffect } from 'react';
import Card from './Card';
import Button from './Button';
import { integratedDownloadService } from '../services/integratedDownloadService';

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

interface LogEvent {
  id: string;
  timestamp: number;
  type: 'info' | 'success' | 'error' | 'warning' | 'progress' | 'download' | 'install' | 'launch';
  message: string;
  details?: any;
  progress?: number; // 0-1
  target?: string;
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

const DownloadsView = () => {
  const [activeDownloads, setActiveDownloads] = useState<ProgressStatus[]>([]);
  const [completedDownloads, setCompletedDownloads] = useState<LogEvent[]>([]);
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'logs'>('active');
  const [overallProgress, setOverallProgress] = useState<{ progress: number; statusText: string; activeOperations: number } | null>(null);
  const [stats, setStats] = useState<{ totalLogs: number, recentLogs: number, activeDownloads: number, totalProgressUpdates: number } | null>(null);

  useEffect(() => {
    // Cargar datos iniciales
    loadInitialData();

    // Configurar intervalos de actualización
    const progressInterval = setInterval(async () => {
      try {
        const progressStatuses = await integratedDownloadService.getDownloadStatuses();
        const active = progressStatuses.filter(d => 
          d.status === 'in-progress' || d.status === 'pending'
        );
        setActiveDownloads(active);

        const overall = await integratedDownloadService.getOverallProgress();
        setOverallProgress(overall);

        const statsData = await integratedDownloadService.getLogStats();
        setStats(statsData);
      } catch (err) {
        console.error('Error updating progress:', err);
      }
    }, 1000);

    const logsInterval = setInterval(async () => {
      try {
        const recentLogs = await integratedDownloadService.getRecentLogs(50);
        setLogs(recentLogs);

        // Actualizar las descargas completadas solo con eventos relevantes
        const completedEvents = recentLogs.filter(log => 
          log.type === 'download' || log.type === 'install' || log.type === 'success'
        );
        setCompletedDownloads(completedEvents);
      } catch (err) {
        console.error('Error updating logs:', err);
      }
    }, 2000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(logsInterval);
    };
  }, []);

  const loadInitialData = async () => {
    try {
      const progressStatuses = await integratedDownloadService.getDownloadStatuses();
      const active = progressStatuses.filter(d => 
        d.status === 'in-progress' || d.status === 'pending'
      );
      setActiveDownloads(active);

      const overall = await integratedDownloadService.getOverallProgress();
      setOverallProgress(overall);

      const recentLogs = await integratedDownloadService.getRecentLogs(50);
      setLogs(recentLogs);

      const statsData = await integratedDownloadService.getLogStats();
      setStats(statsData);

      // Filtrar logs completados
      const completedEvents = recentLogs.filter(log => 
        log.type === 'download' || log.type === 'install' || log.type === 'success'
      );
      setCompletedDownloads(completedEvents);
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  const filteredLogs = logs.filter(log =>
    log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.target && log.target.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredCompleted = completedDownloads.filter(log =>
    log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.target && log.target.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleClearCompleted = () => {
    setCompletedDownloads([]);
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

  const formatTimeRemaining = (ms?: number): string => {
    if (!ms || ms <= 0) return '';
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const getStatusColor = (status: ProgressStatus['status']): string => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'error': return 'text-red-500';
      case 'in-progress': return 'text-blue-500';
      case 'pending': return 'text-yellow-500';
      case 'cancelled': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getLogTypeColor = (type: LogEvent['type']): string => {
    switch (type) {
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      case 'info': return 'text-blue-500';
      case 'progress': return 'text-purple-500';
      case 'download': return 'text-cyan-500';
      case 'install': return 'text-emerald-500';
      case 'launch': return 'text-orange-500';
      default: return 'text-gray-500';
    }
  };

  const getLogTypeIcon = (type: LogEvent['type']): string => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'progress': return '🔄';
      case 'download': return '📥';
      case 'install': return '⚙️';
      case 'launch': return '🚀';
      default: return '📄';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-200 flex items-center gap-2">
                Progreso y Descargas
                <span className="text-xs font-semibold text-gray-400 bg-gray-800/80 px-2 py-0.5 rounded-full">
                  {activeDownloads.length} activas · {completedDownloads.length} completadas
                </span>
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Seguimiento en tiempo real de todas las operaciones
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Buscar en registros..."
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

          {/* Indicador de progreso general */}
          {overallProgress && (
            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-300">Progreso general:</span>
                <span className="text-sm font-semibold text-blue-400">{Math.round(overallProgress.progress * 100)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300 ease-out" 
                  style={{ width: `${overallProgress.progress * 100}%` }}
                ></div>
              </div>
              <div className="mt-2 text-xs text-gray-400 flex justify-between">
                <span>{overallProgress.statusText}</span>
                <span>{overallProgress.activeOperations} operaciones activas</span>
              </div>
            </div>
          )}

          {/* Estadísticas */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-700/50 text-center">
                <div className="text-lg font-bold text-blue-400">{stats.totalLogs}</div>
                <div className="text-xs text-gray-400">Registros</div>
              </div>
              <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-700/50 text-center">
                <div className="text-lg font-bold text-purple-400">{stats.activeDownloads}</div>
                <div className="text-xs text-gray-400">Descargas activas</div>
              </div>
              <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-700/50 text-center">
                <div className="text-lg font-bold text-emerald-400">{stats.recentLogs}</div>
                <div className="text-xs text-gray-400">Recientes</div>
              </div>
              <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-700/50 text-center">
                <div className="text-lg font-bold text-amber-400">{stats.totalProgressUpdates}</div>
                <div className="text-xs text-gray-400">Actualizaciones</div>
              </div>
            </div>
          )}

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
              Completadas
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`ml-1 px-3 py-1 rounded-xl transition-all ${
                activeTab === 'logs'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-black shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Registros
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
            {activeDownloads.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-800/30 rounded-xl border border-dashed border-gray-700/50">
                No hay descargas activas en este momento
              </div>
            ) : (
              <div className="space-y-4">
                {activeDownloads.map(download => (
                  <div
                    key={download.id}
                    className="p-4 bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700/50 transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-100 truncate">{download.target || download.operation}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(download.status)} bg-opacity-20`}>
                            {download.status}
                          </span>
                        </div>
                        {download.details && (
                          <div className="text-sm text-gray-400 mt-1 truncate">{download.details}</div>
                        )}
                      </div>
                      <div className="text-right text-sm text-gray-400 whitespace-nowrap ml-4">
                        {download.speed && formatSpeed(download.speed)}
                      </div>
                    </div>

                    <div className="mb-2">
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${
                            download.status === 'completed' ? 'bg-green-500' :
                            download.status === 'error' ? 'bg-red-500' :
                            download.status === 'pending' ? 'bg-yellow-500' :
                            'bg-gradient-to-r from-blue-500 to-indigo-600'
                          }`}
                          style={{ width: `${download.progress * 100}%` }}
                        ></div>
                      </div>
                      <div className="text-right text-xs text-gray-400 mt-1">
                        {Math.round(download.progress * 100)}%
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <div>
                        {download.current} / {download.total} - {download.operation}
                      </div>
                      <div className="flex gap-2">
                        {download.estimatedTimeRemaining && (
                          <span className="text-gray-400">
                            Quedan: {formatTimeRemaining(download.estimatedTimeRemaining)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Descargas Completadas */}
        {activeTab === 'completed' && (
          <div>
            <h3 className="text-xl font-semibold text-gray-200 mb-4 flex items-center">
              <span className="mr-2">✅</span> Tareas Completadas
              <span className="ml-2 text-sm text-gray-400 bg-gray-700/50 py-0.5 px-2 rounded-full">
                {completedDownloads.length}
              </span>
            </h3>
            {filteredCompleted.length === 0 ? (
              <div className="text-center py-10 text-gray-500 border border-dashed border-gray-700/70 rounded-2xl bg-gray-900/40">
                No hay tareas completadas todavía.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCompleted.map(log => (
                  <div
                    key={log.id}
                    className="p-4 bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/70 shadow-sm flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-start gap-2">
                          <span className="text-lg">{getLogTypeIcon(log.type)}</span>
                          <div>
                            <h4 className="font-medium text-gray-100 truncate" title={log.message}>{log.message}</h4>
                            {log.target && (
                              <div className="text-xs text-gray-400 mt-1">
                                Objetivo: {log.target}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${getLogTypeColor(log.type)}/20 ${getLogTypeColor(log.type)} text-xs`}>
                          ✓
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Registros Completos */}
        {activeTab === 'logs' && (
          <div>
            <h3 className="text-xl font-semibold text-gray-200 mb-4 flex items-center">
              <span className="mr-2">📋</span> Registros de Actividad
              <span className="ml-2 text-sm text-gray-400 bg-gray-700/50 py-0.5 px-2 rounded-full">
                {logs.length}
              </span>
            </h3>
            {filteredLogs.length === 0 ? (
              <div className="text-center py-10 text-gray-500 border border-dashed border-gray-700/70 rounded-2xl bg-gray-900/40">
                No hay registros de actividad todavía.
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredLogs.map(log => (
                  <div
                    key={log.id}
                    className={`p-3 rounded-lg border-l-4 ${
                      log.type === 'error' ? 'border-red-500 bg-red-900/20' :
                      log.type === 'success' ? 'border-green-500 bg-green-900/20' :
                      log.type === 'warning' ? 'border-yellow-500 bg-yellow-900/20' :
                      log.type === 'info' ? 'border-blue-500 bg-blue-900/20' :
                      log.type === 'progress' ? 'border-purple-500 bg-purple-900/20' :
                      log.type === 'download' ? 'border-cyan-500 bg-cyan-900/20' :
                      log.type === 'install' ? 'border-emerald-500 bg-emerald-900/20' :
                      log.type === 'launch' ? 'border-orange-500 bg-orange-900/20' :
                      'border-gray-500 bg-gray-900/20'
                    }`}
                  >
                    <div className="flex items-start">
                      <span className="mr-3 text-lg">{getLogTypeIcon(log.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <span className={`font-medium ${getLogTypeColor(log.type)}`}>
                            {log.message}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        {log.target && (
                          <div className="text-sm text-gray-400 mt-1">
                            {log.target}
                          </div>
                        )}
                        {log.details && (
                          <div className="text-xs text-gray-500 mt-1 bg-black/20 p-2 rounded">
                            <pre className="whitespace-pre-wrap break-words">{JSON.stringify(log.details, null, 2)}</pre>
                          </div>
                        )}
                      </div>
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