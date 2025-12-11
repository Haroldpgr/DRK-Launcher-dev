var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
class MultipleDownloadQueueService {
  constructor() {
    __publicField(this, "queue", []);
    __publicField(this, "observers", []);
    __publicField(this, "STORAGE_KEY", "multipleDownloadQueue_v2");
    this.loadFromStorage();
  }
  loadFromStorage() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.queue = parsed;
        this.notifyObservers();
      }
    } catch (e) {
      console.error("Error cargando cola de descargas múltiples:", e);
    }
  }
  persistQueue() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
    } catch (e) {
      console.error("Error guardando cola de descargas múltiples:", e);
    }
  }
  notifyObservers() {
    this.observers.forEach((observer) => observer([...this.queue]));
  }
  subscribe(callback) {
    this.observers.push(callback);
    callback([...this.queue]);
    return () => {
      this.observers = this.observers.filter((obs) => obs !== callback);
    };
  }
  addToQueue(items) {
    const newItems = items.map((item) => ({
      ...item,
      status: "pending",
      enabled: true
    }));
    this.queue = [...this.queue, ...newItems];
    this.persistQueue();
    this.notifyObservers();
    return newItems;
  }
  removeFromQueue(id) {
    this.queue = this.queue.filter((item) => item.id !== id);
    this.persistQueue();
    this.notifyObservers();
  }
  toggleItemEnabled(id) {
    this.queue = this.queue.map(
      (item) => item.id === id ? { ...item, enabled: !item.enabled } : item
    );
    this.persistQueue();
    this.notifyObservers();
  }
  clearCompleted() {
    this.queue = this.queue.filter((item) => item.status !== "completed");
    this.persistQueue();
    this.notifyObservers();
  }
  getQueue() {
    return [...this.queue];
  }
  getEnabledItems() {
    return this.queue.filter((item) => item.enabled && item.status === "pending");
  }
  updateItemStatus(id, status, progress, error) {
    this.queue = this.queue.map(
      (item) => item.id === id ? { ...item, status, progress, error } : item
    );
    this.persistQueue();
    this.notifyObservers();
  }
}
const multipleDownloadQueueService = new MultipleDownloadQueueService();
export {
  multipleDownloadQueueService
};
