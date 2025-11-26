import React, { useState } from 'react';
import { settingsService, Settings } from '../services/settingsService';

interface PrivacySettingsProps {
  settings: Settings['privacy'];
  onSettingsChange: (updates: Partial<Settings['privacy']>) => void;
}

export default function PrivacySettings({ settings, onSettingsChange }: PrivacySettingsProps) {
  const [showTelemetryDetails, setShowTelemetryDetails] = useState(false);

  const toggleTelemetryDetails = () => {
    setShowTelemetryDetails(!showTelemetryDetails);
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
    </div>
  );
}