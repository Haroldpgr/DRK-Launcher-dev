import path from 'node:path';
import fs from 'node:fs';
import { getLauncherDataPath } from '../utils/paths';
import { downloadQueueService, DownloadInfo } from './downloadQueueService';
import { InstanceCreationProgress } from './instanceCreationState';

/**
 * Tipos de eventos de log
 */
export type LogEventType = 
  | 'info'
  | 'success'
  | 'error'
  | 'warning'
  | 'progress'
  | 'download'
  | 'install'
  | 'launch';

/**
 * Interfaz para un evento de log
 */
export interface LogEvent {
  id: string;
  timestamp: number;
  type: LogEventType;
  message: string;
  details?: any;
  progress?: number; // 0-1
  target?: string; // Qué está siendo descargado/instalado
}

/**
 * Interfaz para el estado de progreso de una operación
 */
export interface ProgressStatus {
  id: string;
  operation: string; // Tipo de operación (download, install, etc.)
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

/**
 * Servicio de logs y progreso para el launcher
 */
export class LogProgressService {
  private logsPath: string;
  private logEvents: LogEvent[] = [];
  private progressStatuses: Map<string, ProgressStatus> = new Map();
  private maxLogEntries: number = 1000; // Limitar número de entradas para evitar consumir demasiada memoria

  constructor() {
    this.logsPath = path.join(getLauncherDataPath(), 'logs');
    this.ensureDir(this.logsPath);
  }

  /**
   * Asegura que un directorio exista, creándolo si es necesario
   * @param dir Directorio a asegurar
   */
  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Registra un nuevo evento de log
   */
  log(type: LogEventType, message: string, details?: any, target?: string): LogEvent {
    const logEvent: LogEvent = {
      id: this.generateId(),
      timestamp: Date.now(),
      type,
      message,
      details,
      target
    };

    // Agregar a la lista de eventos
    this.logEvents.push(logEvent);
    
    // Limitar el número de entradas
    if (this.logEvents.length > this.maxLogEntries) {
      this.logEvents = this.logEvents.slice(-this.maxLogEntries);
    }

    // Si es un evento de progreso, actualizar el estado correspondiente
    if (type === 'progress' && typeof details === 'object' && details.progress !== undefined) {
      this.updateProgressStatus(logEvent.id, {
        id: logEvent.id,
        operation: 'generic',
        target: target || 'unknown',
        progress: details.progress,
        status: 'in-progress',
        current: details.current || 0,
        total: details.total || 1
      });
    }

    console.log(`[${type.toUpperCase()}] ${message}`, details || '');
    
    return logEvent;
  }

  /**
   * Registra un evento de progreso de descarga
   */
  logDownloadProgress(downloadInfo: DownloadInfo): void {
    const progress = downloadInfo.totalBytes && downloadInfo.totalBytes > 0 
      ? (downloadInfo.downloadedBytes || 0) / downloadInfo.totalBytes 
      : 0;
    
    this.log('progress', `Descargando: ${downloadInfo.url}`, {
      progress: progress,
      downloadedBytes: downloadInfo.downloadedBytes,
      totalBytes: downloadInfo.totalBytes,
      speed: this.calculateDownloadSpeed(downloadInfo)
    }, downloadInfo.outputPath);
  }

  /**
   * Registra un evento de creación de instancia
   */
  logInstanceCreationProgress(instanceId: string, progress: InstanceCreationProgress): void {
    this.log('progress', progress.step, {
      progress: progress.progress,
      status: progress.status,
      currentStep: progress.currentStep,
      totalSteps: progress.totalSteps,
      details: progress.details
    }, `instance-${instanceId}`);
  }

  /**
   * Calcula la velocidad de descarga estimada
   */
  private calculateDownloadSpeed(downloadInfo: DownloadInfo): number | undefined {
    // Esta funcionalidad requeriría un seguimiento más detallado del tiempo
    // Simplificando para esta implementación
    return undefined;
  }

  /**
   * Registra un evento de información
   */
  info(message: string, details?: any, target?: string): LogEvent {
    return this.log('info', message, details, target);
  }

  /**
   * Registra un evento de éxito
   */
  success(message: string, details?: any, target?: string): LogEvent {
    return this.log('success', message, details, target);
  }

  /**
   * Registra un evento de error
   */
  error(message: string, details?: any, target?: string): LogEvent {
    return this.log('error', message, details, target);
  }

  /**
   * Registra un evento de advertencia
   */
  warning(message: string, details?: any, target?: string): LogEvent {
    return this.log('warning', message, details, target);
  }

  /**
   * Registra un evento de descarga
   */
  download(message: string, details?: any, target?: string): LogEvent {
    return this.log('download', message, details, target);
  }

  /**
   * Registra un evento de instalación
   */
  install(message: string, details?: any, target?: string): LogEvent {
    return this.log('install', message, details, target);
  }

  /**
   * Registra un evento de lanzamiento del juego
   */
  launch(message: string, details?: any, target?: string): LogEvent {
    return this.log('launch', message, details, target);
  }

  /**
   * Obtiene los últimos eventos de log
   */
  getRecentLogs(count: number = 50): LogEvent[] {
    return this.logEvents.slice(-count);
  }

  /**
   * Obtiene los eventos de log filtrados por tipo
   */
  getLogsByType(type: LogEventType, count: number = 50): LogEvent[] {
    return this.logEvents
      .filter(log => log.type === type)
      .slice(-count);
  }

  /**
   * Limpia los logs antiguos
   */
  clearOldLogs(): void {
    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000); // Una semana en milisegundos
    
    this.logEvents = this.logEvents.filter(log => log.timestamp > oneWeekAgo);
  }

  /**
   * Guarda los logs a un archivo (útil para depuración)
   */
  saveLogsToFile(filename?: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFilename = filename || `launcher-log-${timestamp}.json`;
    const logFilePath = path.join(this.logsPath, logFilename);
    
    const logData = {
      timestamp: new Date().toISOString(),
      logs: this.getRecentLogs(1000) // Guardar los últimos 1000 eventos
    };
    
    fs.writeFileSync(logFilePath, JSON.stringify(logData, null, 2));
    return logFilePath;
  }

  /**
   * Actualiza el estado de progreso de una operación
   */
  updateProgressStatus(id: string, status: ProgressStatus): void {
    this.progressStatuses.set(id, status);
  }

  /**
   * Obtiene el estado de progreso de una operación específica
   */
  getProgressStatus(id: string): ProgressStatus | undefined {
    return this.progressStatuses.get(id);
  }

  /**
   * Obtiene todos los estados de progreso
   */
  getAllProgressStatuses(): ProgressStatus[] {
    return Array.from(this.progressStatuses.values());
  }

  /**
   * Elimina un estado de progreso
   */
  removeProgressStatus(id: string): void {
    this.progressStatuses.delete(id);
  }

  /**
   * Obtiene estadísticas generales
   */
  getStats(): { totalLogs: number, recentLogs: number, activeDownloads: number, totalProgressUpdates: number } {
    return {
      totalLogs: this.logEvents.length,
      recentLogs: this.getRecentLogs(50).length,
      activeDownloads: downloadQueueService.getActiveDownloadCount(),
      totalProgressUpdates: this.progressStatuses.size
    };
  }

  /**
   * Genera un ID único
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  /**
   * Obtiene los estados de descarga actuales del servicio de descargas
   */
  getCurrentDownloadStatuses(): ProgressStatus[] {
    const downloads = downloadQueueService.getAllDownloads();
    
    return downloads.map(download => ({
      id: download.id,
      operation: 'download',
      target: download.outputPath,
      progress: download.progress,
      status: download.status as 'pending' | 'in-progress' | 'completed' | 'error' | 'cancelled',
      current: download.downloadedBytes || 0,
      total: download.totalBytes || 0,
      details: download.error
    }));
  }

  /**
   * Obtiene el progreso combinado de todas las operaciones
   */
  getOverallProgress(): { progress: number, statusText: string, activeOperations: number } {
    const allStatuses = this.getAllProgressStatuses();
    const currentDownloads = this.getCurrentDownloadStatuses();
    
    const allProgress = [...allStatuses, ...currentDownloads];
    
    if (allProgress.length === 0) {
      return { progress: 0, statusText: 'Esperando operaciones...', activeOperations: 0 };
    }

    const totalProgress = allProgress.reduce((sum, status) => sum + status.progress, 0);
    const overallProgress = totalProgress / allProgress.length;

    // Determinar el estado general basado en los estados individuales
    const hasErrors = allProgress.some(status => status.status === 'error');
    const hasPending = allProgress.some(status => status.status === 'pending');
    const hasInProgress = allProgress.some(status => status.status === 'in-progress');

    let statusText = 'Procesando...';
    if (hasErrors) {
      statusText = 'Algunas operaciones fallaron';
    } else if (hasPending) {
      statusText = 'Esperando para comenzar...';
    } else if (hasInProgress) {
      statusText = 'Procesando operaciones...';
    } else if (overallProgress >= 1) {
      statusText = '¡Completado!';
    }

    return {
      progress: Math.min(overallProgress, 1),
      statusText,
      activeOperations: allProgress.filter(status => 
        status.status === 'in-progress' || status.status === 'pending'
      ).length
    };
  }
}

export const logProgressService = new LogProgressService();