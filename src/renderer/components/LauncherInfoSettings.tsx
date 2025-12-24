// ============================================
// CONFIGURACIÓN DE INFORMACIÓN DEL LAUNCHER
// Muestra información del launcher, versión, contacto, etc.
// ============================================

import React, { useState, useEffect } from 'react';
import { updaterService } from '../services/updaterService';
import { showModernAlert } from '../utils/uiUtils';

interface LauncherInfoSettingsProps {
  onClearData?: () => void;
}

export default function LauncherInfoSettings({ onClearData }: LauncherInfoSettingsProps) {
  const [versionInfo, setVersionInfo] = useState<{ currentVersion: string; updateAvailable: boolean }>({
    currentVersion: '0.1.0',
    updateAvailable: false
  });
  const [systemInfo, setSystemInfo] = useState<{ platform: string; arch: string }>({
    platform: 'Desconocido',
    arch: 'Desconocido'
  });
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    // Obtener versión actual
    updaterService.getVersion().then(setVersionInfo);

    // Obtener información del sistema
    const loadSystemInfo = async () => {
      try {
        const api = (window as any).api;
        if (api?.os) {
          const platform = await api.os.platform() || 'Desconocido';
          const arch = await api.os.arch() || 'Desconocido';
          setSystemInfo({ platform, arch });
        } else {
          // Fallback a navigator
          setSystemInfo({ 
            platform: navigator.platform || 'Desconocido', 
            arch: navigator.userAgent.includes('x64') ? 'x64' : 'Desconocido' 
          });
        }
      } catch (error) {
        console.error('Error al obtener información del sistema:', error);
        setSystemInfo({ platform: navigator.platform, arch: 'Desconocido' });
      }
    };
    
    loadSystemInfo();
  }, []);

  const handleClearData = () => {
    if (showClearConfirm) {
      // Limpiar localStorage
      localStorage.clear();
      
      // Limpiar datos de instancias (si hay API para eso)
      if (window.api?.instances) {
        // Opcional: limpiar instancias también
      }
      
      // Recargar la aplicación
      window.location.reload();
    } else {
      setShowClearConfirm(true);
    }
  };

  const handleOpenWebsite = () => {
    const websiteUrl = 'https://github.com/Haroldpgr/DRK-Launcher-dev';
    if (window.api?.shell?.openExternal) {
      window.api.shell.openExternal(websiteUrl);
    } else {
      window.open(websiteUrl, '_blank');
    }
  };

  const handleSendEmail = () => {
    const email = 'darkyvastudio@gmail.com';
    const subject = 'Consulta sobre DRK Launcher';
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    
    if (window.api?.shell?.openExternal) {
      window.api.shell.openExternal(mailtoUrl);
    } else {
      window.location.href = mailtoUrl;
    }
  };

  const handleCheckUpdates = async () => {
    const result = await updaterService.checkForUpdates();
    if (result.success) {
      await showModernAlert(
        'Verificando Actualizaciones',
        'Se está verificando si hay actualizaciones disponibles. Si hay una actualización disponible, se mostrará un modal con los detalles.',
        'info'
      );
    } else {
      await showModernAlert(
        'Error al Verificar Actualizaciones',
        result.error || 'Error desconocido al verificar actualizaciones. Por favor, intenta de nuevo más tarde.',
        'error'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Información del Launcher */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <span className="mr-2">ℹ️</span>
          Información del Launcher
        </h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-gray-700/50">
            <span className="text-gray-300">Nombre:</span>
            <span className="text-white font-medium">DRK Launcher</span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-700/50">
            <span className="text-gray-300">Versión Actual:</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">{versionInfo.currentVersion}</span>
              {versionInfo.updateAvailable && (
                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                  Actualización disponible
                </span>
              )}
            </div>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-700/50">
            <span className="text-gray-300">Sistema Operativo:</span>
            <span className="text-white font-medium">{systemInfo.platform}</span>
          </div>
          
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-300">Arquitectura:</span>
            <span className="text-white font-medium">{systemInfo.arch}</span>
          </div>
        </div>
      </div>

      {/* Contacto y Soporte */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <span className="mr-2">📧</span>
          Contacto y Soporte
        </h3>
        
        <div className="space-y-3">
          <button
            onClick={handleSendEmail}
            className="w-full flex items-center justify-between p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors group"
          >
            <div className="flex items-center">
              <span className="text-2xl mr-3">✉️</span>
              <div className="text-left">
                <div className="text-white font-medium">Correo de Soporte</div>
                <div className="text-gray-400 text-sm">darkyvastudio@gmail.com</div>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          <button
            onClick={handleOpenWebsite}
            className="w-full flex items-center justify-between p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors group"
          >
            <div className="flex items-center">
              <span className="text-2xl mr-3">🌐</span>
              <div className="text-left">
                <div className="text-white font-medium">Página Oficial</div>
                <div className="text-gray-400 text-sm">GitHub Repository</div>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
        </div>
      </div>

      {/* Créditos y Propiedad */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-6 border border-blue-500/30">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <span className="mr-2">©️</span>
          Propiedad y Desarrollo
        </h3>
        
        <div className="space-y-3">
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="text-white font-semibold text-lg mb-2">DRK ARES</div>
            <div className="text-gray-300">Dueño y Desarrollador</div>
            <div className="text-gray-400 text-sm mt-2">Todos los derechos reservados</div>
          </div>
          
          <div className="flex items-center text-gray-400 text-sm">
            <span className="mr-2">⚡</span>
            Desarrollado con Electron, React y TypeScript
          </div>
        </div>
      </div>

      {/* Actualizaciones */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <span className="mr-2">🔄</span>
          Actualizaciones
        </h3>
        
        <div className="space-y-3">
          <button
            onClick={handleCheckUpdates}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Verificar Actualizaciones
          </button>
          
          <div className="text-gray-400 text-sm">
            El launcher verifica automáticamente las actualizaciones al iniciar y cada 4 horas.
          </div>
        </div>
      </div>

      {/* Zona de Peligro - Borrar Datos */}
      <div className="bg-red-900/20 rounded-xl p-6 border border-red-700/50">
        <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center">
          <span className="mr-2">⚠️</span>
          Zona de Peligro
        </h3>
        
        <div className="space-y-3">
          <p className="text-gray-300 text-sm">
            Esta acción eliminará todos los datos guardados del launcher, incluyendo:
          </p>
          <ul className="text-gray-400 text-sm list-disc list-inside space-y-1 ml-2">
            <li>Configuraciones guardadas</li>
            <li>Perfiles de usuario</li>
            <li>Preferencias de apariencia</li>
            <li>Datos de sesión</li>
          </ul>
          
          {!showClearConfirm ? (
            <button
              onClick={handleClearData}
              className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors mt-4"
            >
              Borrar Todos los Datos
            </button>
          ) : (
            <div className="space-y-2 mt-4">
              <p className="text-yellow-400 font-medium text-sm">
                ⚠️ ¿Estás seguro? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleClearData}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                >
                  Confirmar Borrado
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

