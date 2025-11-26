import React, { useState, useEffect } from 'react';
import { settingsService, Settings } from '../services/settingsService';
import { themeService } from '../services/themeService';

interface AppearanceSettingsProps {
  settings: Settings['appearance'];
  onSettingsChange: (updates: Partial<Settings['appearance']>) => void;
}

export default function AppearanceSettings({ settings, onSettingsChange }: AppearanceSettingsProps) {
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('dark');
  const [customBackgroundPath, setCustomBackgroundPath] = useState(settings.customBackgroundPath || '');

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

  const handleAccentColorChange = (color: string) => {
    onSettingsChange({ accentColor: color });
  };

  const handleFontSizeChange = (value: number) => {
    onSettingsChange({ globalFontSize: value });
  };

  const handleBorderRadiusChange = (value: number) => {
    onSettingsChange({ borderRadius: value });
  };

  const handleBackgroundOpacityChange = (value: number) => {
    onSettingsChange({ backgroundOpacity: value });
  };

  const handleColorFilterChange = (filter: 'none' | 'sepia' | 'contrast' | 'saturate') => {
    onSettingsChange({ colorFilter: filter });
  };

  const handleBrowseBackground = async () => {
    if (window.api && window.api.java) { // Reusing java api since it has file dialog
      try {
        const result = await window.api.java.explore(); // This opens file dialog
        if (result) {
          setCustomBackgroundPath(result);
          onSettingsChange({ customBackgroundPath: result });
        }
      } catch (error) {
        console.error('Error selecting background:', error);
        alert('Error al seleccionar la imagen de fondo');
      }
    } else {
      alert('API no disponible');
    }
  };

  const handleResetThemes = () => {
    themeService.resetToDefaults();
    // Also update the parent component's state to reflect the reset
    onSettingsChange({
      theme: 'dark',
      accentColor: '#3B82F6',
      advancedRendering: false,
      globalFontSize: 1.0,
      enableTransitions: true,
      backgroundOpacity: 0.3,
      borderRadius: 8,
      colorFilter: 'none'
    });
    setCustomBackgroundPath('');
  };

  // Función para generar un color aleatorio para el selector de ejemplo
  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
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

      <div>
        <h3 className="text-lg font-semibold text-gray-200 mb-3">Color de Énfasis</h3>
        <div className="flex items-center gap-4">
          <div className="flex flex-wrap gap-2">
            {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'].map((color) => (
              <button
                key={color}
                onClick={() => handleAccentColorChange(color)}
                className={`w-8 h-8 rounded-full border-2 ${
                  settings.accentColor === color ? 'border-white ring-2 ring-offset-2 ring-offset-gray-900 ring-white' : 'border-gray-600'
                }`}
                style={{ backgroundColor: color }}
                title={`Color ${color}`}
              ></button>
            ))}
            <div className="relative">
              <input
                type="color"
                value={settings.accentColor}
                onChange={(e) => handleAccentColorChange(e.target.value)}
                className="w-8 h-8 rounded-full border border-gray-600 cursor-pointer"
                title="Selector de color personalizado"
              />
              <button
                onClick={() => handleAccentColorChange(getRandomColor())}
                className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-gray-700 text-white text-xs flex items-center justify-center"
                title="Color aleatorio"
              >
                ?
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-400 ml-2">
            {settings.accentColor}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-200 mb-3">Tamaño de Fuente</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Pequeño</span>
              <span>{Math.round(settings.globalFontSize * 100)}%</span>
              <span>Grande</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.5"
              step="0.05"
              value={settings.globalFontSize}
              onChange={(e) => handleFontSizeChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-200 mb-3">Esquinas Redondeadas</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>0px</span>
              <span>{settings.borderRadius}px</span>
              <span>20px</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={settings.borderRadius}
              onChange={(e) => handleBorderRadiusChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
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
          <div className="p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-lg">
            <p className="text-sm text-yellow-200 flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
              </svg>
              Esta opción puede afectar el rendimiento en sistemas bajos
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-200">Animaciones de Transición</h3>
            <p className="text-sm text-gray-400">Habilita/deshabilita las transiciones CSS suaves</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enableTransitions}
              onChange={(e) => onSettingsChange({ enableTransitions: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-200 mb-3">Filtro de Color</h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { value: 'none', label: 'Ninguno' },
            { value: 'sepia', label: 'Sepia' },
            { value: 'contrast', label: 'Contraste' },
            { value: 'saturate', label: 'Saturar' }
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => handleColorFilterChange(filter.value as any)}
              className={`p-3 rounded-lg border transition-all ${
                settings.colorFilter === filter.value
                  ? 'border-blue-500 bg-blue-900/30 text-white'
                  : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-200">Fondo Personalizado</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={customBackgroundPath}
            onChange={(e) => {
              setCustomBackgroundPath(e.target.value);
              onSettingsChange({ customBackgroundPath: e.target.value });
            }}
            placeholder="Ruta a la imagen de fondo"
            className="flex-1 p-2 rounded-lg bg-gray-700/80 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleBrowseBackground}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Explorar
          </button>
        </div>
        {customBackgroundPath && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Opacidad: {Math.round(settings.backgroundOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.backgroundOpacity}
              onChange={(e) => handleBackgroundOpacityChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-gray-700">
        <button
          onClick={handleResetThemes}
          className="px-5 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white font-medium rounded-lg transition-all"
        >
          Reiniciar temas
        </button>
      </div>
    </div>
  );
}