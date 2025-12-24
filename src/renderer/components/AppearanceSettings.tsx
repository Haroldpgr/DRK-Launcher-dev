import React, { useState, useEffect } from 'react';
import { settingsService, Settings } from '../services/settingsService';
import { themeService } from '../services/themeService';
import ToggleSwitch from './ToggleSwitch';

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
        <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Tema</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'dark', label: 'Oscuro', color: '#1c1d1f' },
            { id: 'light', label: 'Claro', color: '#ffffff' },
            { id: 'oled', label: 'OLED', color: '#000000' },
            { id: 'system', label: 'Sistema', color: systemTheme === 'dark' ? '#1c1d1f' : '#ffffff' }
          ].map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme.id as any)}
              className="p-4 rounded-xl border-2 transition-all duration-300"
              style={{
                borderColor: settings.theme === theme.id ? 'var(--global-accent-color)' : 'var(--border)',
                backgroundColor: settings.theme === theme.id 
                  ? `color-mix(in srgb, var(--global-accent-color) 20%, transparent)` 
                  : 'var(--panel)',
                color: 'var(--text-primary)'
              }}
              onMouseEnter={(e) => {
                if (settings.theme !== theme.id) {
                  e.currentTarget.style.borderColor = 'var(--border-light)';
                  e.currentTarget.style.backgroundColor = 'var(--panel-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (settings.theme !== theme.id) {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.backgroundColor = 'var(--panel)';
                }
              }}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: theme.color }}
                ></div>
                <span>{theme.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Color de Énfasis</h3>
        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
          Este color se aplicará a botones, enlaces y elementos destacados
        </p>
        <div className="flex items-center gap-4">
          <div className="flex flex-wrap gap-2">
            {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'].map((color) => (
              <button
                key={color}
                onClick={() => handleAccentColorChange(color)}
                className="w-10 h-10 rounded-full border-2 transition-all"
                style={{ 
                  backgroundColor: color,
                  borderColor: settings.accentColor === color ? '#ffffff' : 'var(--border)',
                  boxShadow: settings.accentColor === color ? `0 0 0 2px var(--bg), 0 0 0 4px ${color}` : 'none'
                }}
                title={`Color ${color}`}
              ></button>
            ))}
            <div className="relative">
              <input
                type="color"
                value={settings.accentColor}
                onChange={(e) => handleAccentColorChange(e.target.value)}
                className="w-10 h-10 rounded-full border cursor-pointer"
                style={{ borderColor: 'var(--border)' }}
                title="Selector de color personalizado"
              />
              <button
                onClick={() => handleAccentColorChange(getRandomColor())}
                className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full text-xs flex items-center justify-center transition-all"
                style={{ 
                  backgroundColor: 'var(--panel-hover)',
                  color: 'var(--text-primary)'
                }}
                title="Color aleatorio"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--global-accent-color)';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--panel-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
              >
                🎲
              </button>
            </div>
          </div>
          <div className="text-sm ml-2 font-mono" style={{ color: 'var(--text-secondary)' }}>
            {settings.accentColor}
          </div>
        </div>
        {/* Vista previa del color de énfasis */}
        <div className="mt-4 p-4 rounded-lg" style={{ 
          backgroundColor: 'var(--panel)',
          border: '1px solid var(--border)'
        }}>
          <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Vista previa:</p>
          <div className="flex gap-2">
            <button 
              className="px-4 py-2 rounded-lg font-medium transition-all"
              style={{ 
                backgroundColor: settings.accentColor,
                color: '#ffffff'
              }}
            >
              Botón de ejemplo
            </button>
            <span 
              className="px-4 py-2 rounded-lg font-medium"
              style={{ 
                color: settings.accentColor,
                border: `2px solid ${settings.accentColor}`
              }}
            >
              Texto destacado
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Tamaño de Fuente</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
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
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                backgroundColor: 'var(--panel-hover)',
                accentColor: 'var(--global-accent-color)'
              }}
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Esquinas Redondeadas</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
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
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                backgroundColor: 'var(--panel-hover)',
                accentColor: 'var(--global-accent-color)'
              }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Renderizado Avanzado</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Mejora la apariencia visual pero puede afectar el rendimiento</p>
          </div>
          <ToggleSwitch
            checked={settings.advancedRendering}
            onChange={(checked) => onSettingsChange({ advancedRendering: checked })}
          />
        </div>
        {settings.advancedRendering && (
          <div className="p-3 rounded-lg" style={{
            backgroundColor: `color-mix(in srgb, #F59E0B 20%, transparent)`,
            border: `1px solid #F59E0B`
          }}>
            <p className="text-sm flex items-start" style={{ color: 'var(--text-primary)' }}>
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
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Animaciones de Transición</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Habilita/deshabilita las transiciones CSS suaves</p>
          </div>
          <ToggleSwitch
            checked={settings.enableTransitions}
            onChange={(checked) => onSettingsChange({ enableTransitions: checked })}
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Filtro de Color</h3>
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
              className="p-3 rounded-lg border transition-all"
              style={{
                borderColor: settings.colorFilter === filter.value ? 'var(--global-accent-color)' : 'var(--border)',
                backgroundColor: settings.colorFilter === filter.value 
                  ? `color-mix(in srgb, var(--global-accent-color) 20%, transparent)` 
                  : 'var(--panel)',
                color: 'var(--text-primary)'
              }}
              onMouseEnter={(e) => {
                if (settings.colorFilter !== filter.value) {
                  e.currentTarget.style.borderColor = 'var(--border-light)';
                  e.currentTarget.style.backgroundColor = 'var(--panel-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (settings.colorFilter !== filter.value) {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.backgroundColor = 'var(--panel)';
                }
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Fondo Personalizado</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={customBackgroundPath}
            onChange={(e) => {
              setCustomBackgroundPath(e.target.value);
              onSettingsChange({ customBackgroundPath: e.target.value });
            }}
            placeholder="Ruta a la imagen de fondo"
            className="flex-1 p-2 rounded-lg border focus:outline-none focus:ring-2"
            style={{
              backgroundColor: 'var(--panel-hover)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)'
            }}
          />
          <button
            onClick={handleBrowseBackground}
            className="px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: 'var(--global-accent-color)',
              color: '#ffffff'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            Explorar
          </button>
        </div>
        {customBackgroundPath && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
              <span>Opacidad: {Math.round(settings.backgroundOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.backgroundOpacity}
              onChange={(e) => handleBackgroundOpacityChange(parseFloat(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                backgroundColor: 'var(--panel-hover)',
                accentColor: 'var(--global-accent-color)'
              }}
            />
          </div>
        )}
      </div>

      <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
        <button
          onClick={handleResetThemes}
          className="px-5 py-2.5 font-medium rounded-lg transition-all"
          style={{
            background: 'var(--panel-hover)',
            color: 'var(--text-primary)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--border)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--panel-hover)';
          }}
        >
          Reiniciar temas
        </button>
      </div>
    </div>
  );
}