// src/renderer/services/processMonitorService.ts
import { Settings } from './settingsService';

type ProcessCallback = (code: number | null) => void;

class ProcessMonitorService {
  private monitoredProcesses: Map<string, ProcessCallback> = new Map();
  private settings: Settings['behavior'];

  constructor() {
    this.settings = {
      minimizeOnLaunch: true,
      hideNametag: false,
      defaultLandingPage: 'home',
      jumpBackWorlds: [],
      nativeDecorations: false,
      showRecentWorlds: true,
      closeAfterPlay: false,
      systemNotifications: true,
      backgroundFPSLimit: 30
    };
  }

  updateSettings(settings: Settings['behavior']) {
    this.settings = settings;
  }

  // Este método simula el monitoreo de procesos del juego
  monitorGameProcess(processId: string, onExit: ProcessCallback) {
    this.monitoredProcesses.set(processId, onExit);
    
    // Simulamos el proceso del juego con un timeout
    // En una implementación real, esto vendría del API de Electron
    setTimeout(() => {
      // Simular finalización del proceso
      this.handleProcessExit(processId, 0);
    }, 10000); // Simular finalización después de 10 segundos
  }

  private handleProcessExit(processId: string, code: number | null) {
    const callback = this.monitoredProcesses.get(processId);
    if (callback) {
      callback(code);
      this.monitoredProcesses.delete(processId);
      
      // Si está habilitado, enviar notificación de sistema
      if (this.settings.systemNotifications) {
        this.sendSystemNotification('Juego finalizado', `La sesión de juego ha terminado con código ${code}`);
      }
    }
  }

  private sendSystemNotification(title: string, body: string) {
    // En una implementación real, usar la API de notificaciones de Electron
    console.log(`Notificación del sistema: ${title} - ${body}`);
    
    // Verificar si las notificaciones están permitidas
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(title, { body });
          }
        });
      }
    }
  }

  async launchGameAndMonitor(instanceId: string, processCommand: string[]) {
    try {
      // En una implementación real, usaríamos el API de Electron
      // para lanzar el proceso de juego
      console.log(`Lanzando juego para instancia ${instanceId} con comando:`, processCommand);
      
      // Verificar si se debe minimizar el launcher
      if (this.settings.minimizeOnLaunch) {
        // En una implementación real, usar el API de Electron:
        // window.api.window.minimize();
        console.log('Minimizando launcher al iniciar el juego');
      }
      
      // Crear un ID simulado para el proceso
      const processId = `game-${instanceId}-${Date.now()}`;
      
      // Monitorear el proceso
      this.monitorGameProcess(processId, (exitCode) => {
        console.log(`Proceso de juego finalizado con código: ${exitCode}`);
        
        // Si está habilitado, cerrar el launcher
        if (this.settings.closeAfterPlay) {
          console.log('Cerrando launcher tras finalización del juego');
          // En una implementación real, usar: window.api.app.quit();
        } else {
          // En una implementación real, restaurar la ventana si está minimizada
          console.log('Juego finalizado, launcher permanece abierto');
        }
      });
      
      return { success: true, processId };
    } catch (error) {
      console.error('Error lanzando juego:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  getProcessCount() {
    return this.monitoredProcesses.size;
  }
}

export const processMonitorService = new ProcessMonitorService();