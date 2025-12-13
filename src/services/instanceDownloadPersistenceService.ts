import path from 'node:path';
import fs from 'node:fs';
import { getLauncherDataPath, ensureDir } from '../utils/paths';

/**
 * Estado de una descarga de instancia
 */
export interface InstanceDownloadState {
  id: string;
  instanceName: string;
  instancePath: string;
  loader: 'vanilla' | 'fabric' | 'forge' | 'quilt' | 'neoforge';
  mcVersion: string;
  loaderVersion?: string;
  status: 'pending' | 'downloading' | 'completed' | 'error' | 'cancelled';
  progress: number; // 0-1
  currentStep: string;
  totalSteps: number;
  completedSteps: number;
  startedAt: number;
  lastUpdated: number;
  error?: string;
  // Información de archivos descargados para poder reanudar
  downloadedFiles: string[]; // Rutas de archivos ya descargados
  pendingFiles: string[]; // Archivos que faltan por descargar
}

/**
 * Servicio para persistir y recuperar el estado de descargas de instancias
 */
export class InstanceDownloadPersistenceService {
  private stateFilePath: string;
  private downloads: Map<string, InstanceDownloadState> = new Map();

  constructor() {
    const launcherPath = getLauncherDataPath();
    ensureDir(launcherPath);
    this.stateFilePath = path.join(launcherPath, 'instance-downloads-state.json');
    this.loadState();
  }

  /**
   * Carga el estado guardado desde el disco
   */
  private loadState(): void {
    try {
      if (fs.existsSync(this.stateFilePath)) {
        const data = fs.readFileSync(this.stateFilePath, 'utf-8');
        const states: InstanceDownloadState[] = JSON.parse(data);
        
        // Filtrar solo descargas incompletas (no completadas ni canceladas)
        const incompleteStates = states.filter(
          state => state.status !== 'completed' && state.status !== 'cancelled'
        );
        
        this.downloads = new Map(incompleteStates.map(state => [state.id, state]));
        
        if (incompleteStates.length > 0) {
          console.log(`[DownloadPersistence] Cargadas ${incompleteStates.length} descargas incompletas`);
        }
      }
    } catch (error) {
      console.error('[DownloadPersistence] Error al cargar estado:', error);
      this.downloads = new Map();
    }
  }

  /**
   * Guarda el estado actual al disco
   */
  private saveState(): void {
    try {
      // Asegurar que el directorio existe antes de escribir
      const dir = path.dirname(this.stateFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const states = Array.from(this.downloads.values());
      fs.writeFileSync(this.stateFilePath, JSON.stringify(states, null, 2), 'utf-8');
    } catch (error) {
      console.error('[DownloadPersistence] Error al guardar estado:', error);
    }
  }

  /**
   * Inicia el seguimiento de una descarga de instancia
   */
  startTracking(downloadState: InstanceDownloadState): void {
    this.downloads.set(downloadState.id, downloadState);
    this.saveState();
    console.log(`[DownloadPersistence] Iniciando seguimiento de descarga: ${downloadState.instanceName}`);
  }

  /**
   * Actualiza el progreso de una descarga
   */
  updateProgress(
    id: string,
    progress: number,
    currentStep: string,
    completedSteps: number,
    totalSteps: number
  ): void {
    const state = this.downloads.get(id);
    if (!state) return;

    state.progress = progress;
    state.currentStep = currentStep;
    state.completedSteps = completedSteps;
    state.totalSteps = totalSteps;
    state.lastUpdated = Date.now();
    state.status = 'downloading';

    this.saveState();
  }

  /**
   * Marca un archivo como descargado
   */
  markFileDownloaded(id: string, filePath: string): void {
    const state = this.downloads.get(id);
    if (!state) return;

    if (!state.downloadedFiles.includes(filePath)) {
      state.downloadedFiles.push(filePath);
    }
    
    // Remover de pendientes si estaba ahí
    state.pendingFiles = state.pendingFiles.filter(f => f !== filePath);
    
    this.saveState();
  }

  /**
   * Agrega archivos pendientes
   */
  addPendingFiles(id: string, filePaths: string[]): void {
    const state = this.downloads.get(id);
    if (!state) return;

    filePaths.forEach(filePath => {
      if (!state.pendingFiles.includes(filePath) && !state.downloadedFiles.includes(filePath)) {
        state.pendingFiles.push(filePath);
      }
    });

    this.saveState();
  }

  /**
   * Marca una descarga como completada
   */
  markCompleted(id: string): void {
    const state = this.downloads.get(id);
    if (!state) return;

    state.status = 'completed';
    state.progress = 1;
    state.lastUpdated = Date.now();

    this.saveState();
    
    // Eliminar después de un tiempo para limpiar
    setTimeout(() => {
      this.downloads.delete(id);
      this.saveState();
    }, 60000); // Eliminar después de 1 minuto
  }

  /**
   * Marca una descarga como error
   */
  markError(id: string, error: string): void {
    const state = this.downloads.get(id);
    if (!state) return;

    state.status = 'error';
    state.error = error;
    state.lastUpdated = Date.now();

    this.saveState();
  }

  /**
   * Cancela una descarga
   */
  cancel(id: string): void {
    const state = this.downloads.get(id);
    if (!state) return;

    state.status = 'cancelled';
    state.lastUpdated = Date.now();

    this.saveState();
    
    // Eliminar después de un tiempo
    setTimeout(() => {
      this.downloads.delete(id);
      this.saveState();
    }, 300000); // Eliminar después de 5 minutos
  }

  /**
   * Obtiene todas las descargas incompletas
   */
  getIncompleteDownloads(): InstanceDownloadState[] {
    return Array.from(this.downloads.values()).filter(
      state => state.status !== 'completed' && state.status !== 'cancelled'
    );
  }

  /**
   * Obtiene una descarga por ID
   */
  getDownload(id: string): InstanceDownloadState | undefined {
    return this.downloads.get(id);
  }

  /**
   * Elimina una descarga del seguimiento
   */
  removeDownload(id: string): void {
    this.downloads.delete(id);
    this.saveState();
  }

  /**
   * Verifica si una instancia está siendo descargada
   */
  isDownloading(instancePath: string): boolean {
    return Array.from(this.downloads.values()).some(
      state => state.instancePath === instancePath && 
               (state.status === 'downloading' || state.status === 'pending')
    );
  }
}

export const instanceDownloadPersistenceService = new InstanceDownloadPersistenceService();

