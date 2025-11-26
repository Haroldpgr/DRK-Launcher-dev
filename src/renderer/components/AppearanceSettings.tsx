import React, { useState, useEffect } from 'react';
import { settingsService, Settings } from '../services/settingsService';

interface AppearanceSettingsProps {
  settings: Settings['appearance'];
  onSettingsChange: (updates: Partial<Settings['appearance']>) => void;
}

export default function AppearanceSettings({ settings, onSettingsChange }: AppearanceSettingsProps) {
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('dark');
  
  // Detect system theme for the sync option
  useEffect(() => {
    if (settings.theme === 'system') {
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setSystemTheme(isDarkMode ? 'dark' : 'light');
    }
  }, [settings.theme]);

  const handleThemeChange = (theme: 'dark' | 'light' | 'oled' | 'system') => {
    onSettingsChange({ theme });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-200 mb-3">Tema</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleThemeChange('dark')}
            className={`p-4 rounded-xl border-2 transition-all duration-300 ${
              settings.theme === 'dark'
                ? 'border-blue-500 bg-blue-900/30'
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gray-700"></div>
              <span className="text-white">Oscuro</span>
            </div>
          </button>
          <button
            onClick={() => handleThemeChange('light')}
            className={`p-4 rounded-xl border-2 transition-all duration-300 ${
              settings.theme === 'light'
                ? 'border-blue-500 bg-blue-900/30'
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gray-300"></div>
              <span className="text-white">Claro</span>
            </div>
          </button>
          <button
            onClick={() => handleThemeChange('oled')}
            className={`p-4 rounded-xl border-2 transition-all duration-300 ${
              settings.theme === 'oled'
                ? 'border-blue-500 bg-blue-900/30'
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-black"></div>
              <span className="text-white">OLED</span>
            </div>
          </button>
          <button
            onClick={() => handleThemeChange('system')}
            className={`p-4 rounded-xl border-2 transition-all duration-300 ${
              settings.theme === 'system'
                ? 'border-blue-500 bg-blue-900/30'
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full ${systemTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
              <span className="text-white">Sistema</span>
            </div>
          </button>
        </div>
      </div>

      <div className="pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-200">Renderizado Avanzado</h3>
            <p className="text-sm text-gray-400">Mejora la apariencia visual pero puede afectar el rendimiento</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.advancedRendering}
              onChange={(e) => onSettingsChange({ advancedRendering: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        {settings.advancedRendering && (
          <div className="mt-3 p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-lg">
            <p className="text-sm text-yellow-200 flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
              </svg>
              Esta opción puede afectar el rendimiento en sistemas bajos
            </p>
          </div>
        )}
      </div>
    </div>
  );
}