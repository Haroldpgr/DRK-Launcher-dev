// src/renderer/services/privacyService.ts
import { settingsService, Settings } from './settingsService';
// Usar solo imports dinámicos de telemetryService para evitar advertencias de Vite

class PrivacyService {
  // Limpieza de caché
  async clearCache(): Promise<boolean> {
    try {
      // En una implementación real, usaríamos la API de Electron para acceder al sistema de archivos
      // Por ahora, simulamos la operación
      console.log('Limpiando caché...');
      
      // En una implementación real:
      // const result = await window.api.privacy.clearCache();
      // return result.success;
      
      // Simulación
      const telemetry = await import('./telemetryService');
      telemetry.trackEvent('cache_cleared', { method: 'manual' });
      return true;
    } catch (error) {
      console.error('Error al limpiar la caché:', error);
      const telemetry = await import('./telemetryService');
      telemetry.trackEvent('cache_clear_error', { error: (error as Error).message });
      return false;
    }
  }

  // Exportar datos de configuración
  async exportSettings(): Promise<boolean> {
    try {
      // En una implementación real, crearíamos un archivo ZIP con la configuración
      // Por ahora, simulamos la operación
      console.log('Exportando configuración...');
      
      // Obtener la configuración actual
      const currentSettings = settingsService.getSettings();
      
      // Simular creación de archivo
      const settingsBlob = new Blob([JSON.stringify(currentSettings, null, 2)], {
        type: 'application/json'
      });
      
      // Crear enlace de descarga simulado
      const url = URL.createObjectURL(settingsBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'configuracion-launcher.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      const telemetry = await import('./telemetryService');
      telemetry.trackEvent('settings_exported', { method: 'manual' });
      return true;
    } catch (error) {
      console.error('Error al exportar configuración:', error);
      const telemetry = await import('./telemetryService');
      telemetry.trackEvent('settings_export_error', { error: (error as Error).message });
      return false;
    }
  }

  // Actualizar configuración de privacidad
  updatePrivacySettings(updates: Partial<Settings['privacy']>): Settings['privacy'] {
    const newSettings = settingsService.updatePrivacy(updates);
    
    // Si se actualizó el estado de telemetría, actualizar el servicio de telemetría
    if (updates.telemetryEnabled !== undefined) {
      import('./telemetryService').then(module => {
        module.updateTelemetryStatus();
      });
    }
    
    return newSettings;
  }

  // Obtener configuración actual de privacidad
  getPrivacySettings(): Settings['privacy'] {
    return settingsService.getSettings().privacy;
  }

  // Validar URL de política de privacidad
  validatePrivacyPolicyUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'https:' || urlObj.protocol === 'http:';
    } catch {
      return false;
    }
  }
}

export const privacyService = new PrivacyService();