import React from 'react';
import { settingsService, Settings, JumpBackWorld } from '../services/settingsService';

interface BehaviorSettingsProps {
  settings: Settings['behavior'];
  onSettingsChange: (updates: Partial<Settings['behavior']>) => void;
}

export default function BehaviorSettings({ settings, onSettingsChange }: BehaviorSettingsProps) {
  const handleJumpBackWorlds = () => {
    // Demo worlds for example
    const demoWorlds: JumpBackWorld[] = [
      { id: '1', name: 'Mundo Creativo', lastPlayed: Date.now() - 3600000 }, // 1 hour ago
      { id: '2', name: 'Survival Adventure', lastPlayed: Date.now() - 86400000 }, // 1 day ago
    ];
    settingsService.addJumpBackWorld(demoWorlds[0]);
  };

  const formatDate = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
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
    </div>
  );
}