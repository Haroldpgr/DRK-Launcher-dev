import React, { useState } from 'react';
import { settingsService, Settings, JumpBackWorld } from '../services/settingsService';

interface BehaviorSettingsProps {
  settings: Settings['behavior'];
  onSettingsChange: (updates: Partial<Settings['behavior']>) => void;
}

export default function BehaviorSettings({ settings, onSettingsChange }: BehaviorSettingsProps) {
  const [showNotificationHelp, setShowNotificationHelp] = useState(false);

  const formatDate = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const handleLimitFPSChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 60) {
      onSettingsChange({ backgroundFPSLimit: numValue });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-200">Minimizar launcher al iniciar</h3>
            <p className="text-sm text-gray-400">Minimiza el launcher cuando se inicia un juego</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.minimizeOnLaunch}
              onChange={(e) => onSettingsChange({ minimizeOnLaunch: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-200">Ocultar nametag</h3>
            <p className="text-sm text-gray-400">Oculta las etiquetas de nombre en la interfaz</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.hideNametag}
              onChange={(e) => onSettingsChange({ hideNametag: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-200">Decoraciones nativas</h3>
            <p className="text-sm text-gray-400">Usar el marco de ventana nativo del sistema (requiere reinicio)</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.nativeDecorations}
              onChange={(e) => onSettingsChange({ nativeDecorations: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-200">Cerrar después de jugar</h3>
            <p className="text-sm text-gray-400">Cerrar el launcher cuando el proceso de Minecraft termina</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.closeAfterPlay}
              onChange={(e) => onSettingsChange({ closeAfterPlay: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-200">Saltar a mundos recientes</h3>
            <p className="text-sm text-gray-400">Mostrar mundos jugados recientemente en la página de inicio</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showRecentWorlds}
              onChange={(e) => onSettingsChange({ showRecentWorlds: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-200">Notificaciones de sistema</h3>
            <p className="text-sm text-gray-400">Recibir notificaciones del sistema operativo para eventos importantes</p>
          </div>
          <div className="flex items-center space-x-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.systemNotifications}
                onChange={(e) => onSettingsChange({ systemNotifications: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            <button
              onClick={() => setShowNotificationHelp(!showNotificationHelp)}
              className="text-gray-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </button>
          </div>
        </div>

        {showNotificationHelp && (
          <div className="p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg text-sm text-blue-200">
            Las notificaciones se mostrarán para eventos como: finalización de descargas, actualizaciones completadas, o finalización de sesiones de juego.
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-200 mb-3">Página de inicio predeterminada</h3>
        <div className="grid grid-cols-2 gap-3">
          {['home', 'instances', 'servers', 'settings'].map((page) => (
            <button
              key={page}
              onClick={() => onSettingsChange({ defaultLandingPage: page })}
              className={`p-3 rounded-lg border-2 transition-all duration-300 capitalize ${
                settings.defaultLandingPage === page
                  ? 'border-blue-500 bg-blue-900/30 text-white'
                  : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-200 mb-3">Volver a mundos</h3>
        <div className="space-y-2">
          {settings.jumpBackWorlds.slice(0, 5).map((world) => (
            <div
              key={world.id}
              className="flex items-center p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:bg-gray-700/50 transition-colors"
            >
              <div className="w-10 h-10 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm mr-3">
                {world.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="text-white font-medium">{world.name}</div>
                <div className="text-xs text-gray-400">Jugado hace {formatDate(world.lastPlayed)}</div>
              </div>
              <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors">
                Jugar
              </button>
            </div>
          ))}
          {settings.jumpBackWorlds.length === 0 && (
            <div className="text-center py-6 text-gray-500">
              No hay mundos recientes
            </div>
          )}
        </div>
      </div>

      <div className="pt-2">
        <h3 className="text-lg font-semibold text-gray-200 mb-3">Rendimiento</h3>
        <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h4 className="font-medium text-gray-200">Límite de FPS en segundo plano</h4>
              <p className="text-sm text-gray-400">FPS máximos cuando la ventana está minimizada o no está en primer plano</p>
            </div>
            <div className="flex items-center">
              <input
                type="number"
                min="1"
                max="60"
                value={settings.backgroundFPSLimit}
                onChange={(e) => handleLimitFPSChange(e.target.value)}
                className="w-20 p-2 rounded-lg bg-gray-700/80 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
              />
              <span className="ml-2 text-gray-400">FPS</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>1</span>
              <span>{settings.backgroundFPSLimit} FPS</span>
              <span>60</span>
            </div>
            <input
              type="range"
              min="1"
              max="60"
              step="1"
              value={settings.backgroundFPSLimit}
              onChange={(e) => handleLimitFPSChange(e.target.value)}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Limitar los FPS en segundo plano puede reducir el uso de CPU y GPU cuando no estás usando activamente el launcher
          </p>
        </div>
      </div>
    </div>
  );
}