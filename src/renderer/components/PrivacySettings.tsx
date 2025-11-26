import React, { useState } from 'react';
import { settingsService, Settings } from '../services/settingsService';
import { privacyService } from '../services/privacyService';

interface PrivacySettingsProps {
  settings: Settings['privacy'];
  onSettingsChange: (updates: Partial<Settings['privacy']>) => void;
}

export default function PrivacySettings({ settings, onSettingsChange }: PrivacySettingsProps) {
  const [showTelemetryDetails, setShowTelemetryDetails] = useState(false);
  const [cacheClearing, setCacheClearing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showExportSuccess, setShowExportSuccess] = useState(false);

  const toggleTelemetryDetails = () => {
    setShowTelemetryDetails(!showTelemetryDetails);
  };

  const handleClearCache = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar la caché? Esto eliminará descargas temporales y puede afectar el rendimiento futuro.')) {
      return;
    }

    setCacheClearing(true);
    try {
      const success = await privacyService.clearCache();
      if (success) {
        alert('Caché limpiada exitosamente');
      } else {
        alert('Error al limpiar la caché');
      }
    } catch (error) {
      console.error('Error al limpiar la caché:', error);
      alert('Error al limpiar la caché');
    } finally {
      setCacheClearing(false);
    }
  };

  const handleExportSettings = async () => {
    setExporting(true);
    try {
      const success = await privacyService.exportSettings();
      if (success) {
        setShowExportSuccess(true);
        setTimeout(() => setShowExportSuccess(false), 3000); // Ocultar mensaje después de 3 segundos
      } else {
        alert('Error al exportar la configuración');
      }
    } catch (error) {
      console.error('Error al exportar la configuración:', error);
      alert('Error al exportar la configuración');
    } finally {
      setExporting(false);
    }
  };

  const handleLogLevelChange = (level: 'Debug' | 'Info' | 'Error') => {
    onSettingsChange({ logLevel: level });
  };

  const handlePrivacyPolicyUrlChange = (url: string) => {
    if (privacyService.validatePrivacyPolicyUrl(url) || url === '') {
      onSettingsChange({ privacyPolicyUrl: url });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-200">Telemetría</h3>
            <p className="text-sm text-gray-400 mt-1">
              Permitir que la aplicación envíe datos anónimos de uso para mejorar la experiencia
            </p>
            {showTelemetryDetails && (
              <div className="mt-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <h4 className="font-medium text-gray-300 mb-2">Datos recopilados:</h4>
                <ul className="text-sm text-gray-400 space-y-1 list-disc pl-5">
                  <li>Tiempo de inicio de la aplicación</li>
                  <li>Errores no identificables</li>
                  <li>Versiones de sistema operativo</li>
                  <li>Configuración de hardware general (sin identificadores únicos)</li>
                </ul>
                <p className="text-xs text-gray-500 mt-2">No se recopila información personal ni credenciales.</p>
              </div>
            )}
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-4">
            <input
              type="checkbox"
              checked={settings.telemetryEnabled}
              onChange={(e) => onSettingsChange({ telemetryEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {settings.telemetryEnabled && (
          <button
            onClick={toggleTelemetryDetails}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            {showTelemetryDetails ? 'Ocultar detalles' : 'Mostrar qué datos se recopilan'}
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-200">Rich Presence en Discord</h3>
            <p className="text-sm text-gray-400">Mostrar tu actividad en Discord</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.discordRPC}
              onChange={(e) => onSettingsChange({ discordRPC: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        {settings.discordRPC && (
          <div className="p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg">
            <p className="text-sm text-blue-200 flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
              </svg>
              Requiere reiniciar la aplicación para activarse
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-200">Anuncios personalizados</h3>
            <p className="text-sm text-gray-400">Mostrar anuncios basados en tus preferencias</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.personalizedAds}
              onChange={(e) => onSettingsChange({ personalizedAds: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-200">Modo Offline Forzado</h3>
            <p className="text-sm text-gray-400">Impedir conexiones de red no esenciales</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.forcedOfflineMode}
              onChange={(e) => onSettingsChange({ forcedOfflineMode: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        {settings.forcedOfflineMode && (
          <div className="p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-lg">
            <p className="text-sm text-yellow-200 flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
              </svg>
              Esta opción puede afectar la funcionalidad del launcher
            </p>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-200 mb-2">Nivel de Registro</h3>
        <div className="grid grid-cols-3 gap-2">
          {(['Debug', 'Info', 'Error'] as const).map((level) => (
            <button
              key={level}
              onClick={() => handleLogLevelChange(level)}
              className={`p-2 rounded-lg border transition-all ${
                settings.logLevel === level
                  ? 'border-blue-500 bg-blue-900/30 text-white'
                  : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-200 mb-2">Política de Privacidad</h3>
        <div className="space-y-2">
          <input
            type="url"
            value={settings.privacyPolicyUrl}
            onChange={(e) => handlePrivacyPolicyUrlChange(e.target.value)}
            placeholder="https://example.com/privacy"
            className="w-full p-2 rounded-lg bg-gray-700/80 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-400">
            URL de la política de privacidad que se mostrará al usuario
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-700 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-200 mb-2">Herramientas de Privacidad</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={handleClearCache}
              disabled={cacheClearing}
              className="p-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg shadow transition-all flex items-center justify-center"
            >
              {cacheClearing ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {cacheClearing ? 'Limpiando...' : 'Limpiar Caché'}
            </button>

            <button
              onClick={handleExportSettings}
              disabled={exporting}
              className="p-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-lg shadow transition-all flex items-center justify-center"
            >
              {exporting ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {exporting ? 'Exportando...' : 'Exportar Configuración'}
            </button>
          </div>
          {showExportSuccess && (
            <div className="mt-2 p-2 bg-emerald-900/30 border border-emerald-700/50 rounded text-emerald-200 text-center">
              Configuración exportada exitosamente
            </div>
          )}
        </div>
      </div>
    </div>
  );
}