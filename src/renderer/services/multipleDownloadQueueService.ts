// Servicio para manejar la cola de descargas múltiples
export interface QueuedDownloadItem {
  id: string; // ID único generado (con timestamp)
  originalId: string; // ID original del contenido (para la API)
  name: string;
  version: string;
  loader?: string;
  targetPath: string;
  platform: string;
  contentType?: 'mod' | 'resourcepack' | 'shader' | 'datapack' | 'modpack';
  status: 'pending' | 'downloading' | 'completed' | 'error' | 'disabled';
  progress?: number;
  error?: string;
  enabled: boolean; // Para activar/desactivar descargas
  downloadMode?: 'sequential' | 'parallel'; // Modo de descarga
}

class MultipleDownloadQueueService {
  private queue: QueuedDownloadItem[] = [];
  private observers: Array<(queue: QueuedDownloadItem[]) => void> = [];
  private readonly STORAGE_KEY = 'multipleDownloadQueue_v2';
  private idCounter: number = 0; // Contador para IDs únicos

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.queue = parsed;
        this.notifyObservers();
      }
    } catch (e) {
      console.error('Error cargando cola de descargas múltiples:', e);
    }
  }

  private persistQueue() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
    } catch (e) {
      console.error('Error guardando cola de descargas múltiples:', e);
    }
  }

  private notifyObservers() {
    this.observers.forEach(observer => observer([...this.queue]));
  }

  subscribe(callback: (queue: QueuedDownloadItem[]) => void) {
    this.observers.push(callback);
    callback([...this.queue]);
    return () => {
      this.observers = this.observers.filter(obs => obs !== callback);
    };
  }

  addToQueue(items: Array<{
    originalId: string;
    name: string;
    version: string;
    loader?: string;
    targetPath: string;
    platform: string;
    contentType?: 'mod' | 'resourcepack' | 'shader' | 'datapack' | 'modpack';
  }>) {
    const newItems: QueuedDownloadItem[] = items.map(item => {
      this.idCounter++;
      return {
        ...item,
        id: `${item.originalId}-${Date.now()}-${this.idCounter}-${Math.random().toString(36).substr(2, 9)}`, // ID único para React
        originalId: item.originalId, // ID original del contenido
        status: 'pending' as const,
        enabled: true
      };
    });
    
    this.queue = [...this.queue, ...newItems];
    this.persistQueue();
    this.notifyObservers();
    return newItems;
  }

  removeFromQueue(id: string) {
    this.queue = this.queue.filter(item => item.id !== id);
    this.persistQueue();
    this.notifyObservers();
  }

  toggleItemEnabled(id: string) {
    this.queue = this.queue.map(item =>
      item.id === id ? { ...item, enabled: !item.enabled } : item
    );
    this.persistQueue();
    this.notifyObservers();
  }

  clearCompleted() {
    this.queue = this.queue.filter(item => item.status !== 'completed');
    this.persistQueue();
    this.notifyObservers();
  }

  getQueue(): QueuedDownloadItem[] {
    return [...this.queue];
  }

  getEnabledItems(): QueuedDownloadItem[] {
    return this.queue.filter(item => item.enabled && item.status === 'pending');
  }

  updateItemStatus(id: string, status: QueuedDownloadItem['status'], progress?: number, error?: string) {
    this.queue = this.queue.map(item =>
      item.id === id
        ? { ...item, status, progress, error }
        : item
    );
    this.persistQueue();
    this.notifyObservers();
  }
}

export const multipleDownloadQueueService = new MultipleDownloadQueueService();

