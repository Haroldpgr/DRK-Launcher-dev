// src/renderer/services/telemetryService.ts
import { settingsService } from './settingsService';

// Generar un ID anónimo único si no existe
function generateAnonymousId(): string {
  if (typeof window !== 'undefined' && window.localStorage) {
    let anonId = localStorage.getItem('anonId');
    if (!anonId) {
      anonId = 'anon_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      localStorage.setItem('anonId', anonId);
    }
    return anonId;
  }
  return 'anon_unknown';
}

const ANONYMOUS_ID = generateAnonymousId();
let telemetryEnabled = true; // Valor inicial que se actualizará al cargar configuración

// Actualizar el estado de telemetría cuando se carguen las configuraciones
export function updateTelemetryStatus() {
  const settings = settingsService.getSettings();
  // Respeta tanto la casilla de telemetría como el modo offline forzado
  telemetryEnabled = settings.privacy.telemetryEnabled && !settings.privacy.forcedOfflineMode;
}

// Función que se llama a lo largo del código para registrar eventos
export function trackEvent(eventName: string, eventData: Record<string, any> = {}) {
  if (!telemetryEnabled) {
    console.log(`[PRIVACIDAD] Evento "${eventName}" bloqueado por la configuración del usuario.`);
    return; // Bloquea la ejecución si está desactivado
  }

  // 1. Recolección de datos anónimos
  const payload = {
    userId: ANONYMOUS_ID,
    event: eventName,
    timestamp: new Date().toISOString(),
    ...eventData
  };

  // Simular envío asíncrono (en implementación real iría a un servidor de telemetría)
  console.log('[TELEMETRÍA] Enviando datos:', payload);
  
  // En una implementación real, se haría una llamada asíncrona:
  // fetch('https://telemetry.tu-launcher.com/api/v1/track', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(payload)
  // });
}

// Función para verificar si la telemetría está activa
export function isTelemetryActive(): boolean {
  return telemetryEnabled;
}

// Inicializar el estado de telemetría
updateTelemetryStatus();