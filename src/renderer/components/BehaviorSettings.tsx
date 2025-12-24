import React, { useState } from 'react';
import { settingsService, Settings, JumpBackWorld } from '../services/settingsService';
import ToggleSwitch from './ToggleSwitch';

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
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Minimizar launcher al iniciar</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Minimiza el launcher cuando se inicia un juego</p>
          </div>
          <ToggleSwitch
            checked={settings.minimizeOnLaunch}
            onChange={(checked) => onSettingsChange({ minimizeOnLaunch: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Ocultar nametag</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Oculta las etiquetas de nombre en la interfaz</p>
          </div>
          <ToggleSwitch
            checked={settings.hideNametag}
            onChange={(checked) => onSettingsChange({ hideNametag: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Decoraciones nativas</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Usar el marco de ventana nativo del sistema (requiere reinicio)</p>
          </div>
          <ToggleSwitch
            checked={settings.nativeDecorations}
            onChange={(checked) => onSettingsChange({ nativeDecorations: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Cerrar después de jugar</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Cerrar el launcher cuando el proceso de Minecraft termina</p>
          </div>
          <ToggleSwitch
            checked={settings.closeAfterPlay}
            onChange={(checked) => onSettingsChange({ closeAfterPlay: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Saltar a mundos recientes</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Mostrar mundos jugados recientemente en la página de inicio</p>
          </div>
          <ToggleSwitch
            checked={settings.showRecentWorlds}
            onChange={(checked) => onSettingsChange({ showRecentWorlds: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Notificaciones de sistema</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Recibir notificaciones del sistema operativo para eventos importantes</p>
          </div>
          <div className="flex items-center space-x-3">
            <ToggleSwitch
              checked={settings.systemNotifications}
              onChange={(checked) => onSettingsChange({ systemNotifications: checked })}
            />
            <button
              onClick={() => setShowNotificationHelp(!showNotificationHelp)}
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </button>
          </div>
        </div>

        {showNotificationHelp && (
          <div className="p-3 rounded-lg text-sm" style={{ 
            backgroundColor: `color-mix(in srgb, var(--global-accent-color) 20%, transparent)`,
            border: `1px solid var(--global-accent-color)`,
            color: 'var(--text-primary)'
          }}>
            Las notificaciones se mostrarán para eventos como: finalización de descargas, actualizaciones completadas, o finalización de sesiones de juego.
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Página de inicio predeterminada</h3>
        <div className="grid grid-cols-2 gap-3">
          {['home', 'instances', 'servers', 'settings'].map((page) => (
            <button
              key={page}
              onClick={() => onSettingsChange({ defaultLandingPage: page })}
              className="p-3 rounded-lg border-2 transition-all duration-300 capitalize"
              style={{
                borderColor: settings.defaultLandingPage === page ? 'var(--global-accent-color)' : 'var(--border)',
                backgroundColor: settings.defaultLandingPage === page 
                  ? `color-mix(in srgb, var(--global-accent-color) 20%, transparent)` 
                  : 'var(--panel)',
                color: 'var(--text-primary)'
              }}
              onMouseEnter={(e) => {
                if (settings.defaultLandingPage !== page) {
                  e.currentTarget.style.borderColor = 'var(--border-light)';
                  e.currentTarget.style.backgroundColor = 'var(--panel-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (settings.defaultLandingPage !== page) {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.backgroundColor = 'var(--panel)';
                }
              }}
            >
              {page}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Volver a mundos</h3>
        <div className="space-y-2">
          {settings.jumpBackWorlds.slice(0, 5).map((world) => (
            <div
              key={world.id}
              className="flex items-center p-3 rounded-lg border transition-colors"
              style={{
                backgroundColor: 'var(--panel)',
                borderColor: 'var(--border)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--panel-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--panel)';
              }}
            >
              <div 
                className="w-10 h-10 rounded flex items-center justify-center font-bold text-sm mr-3"
                style={{
                  background: `linear-gradient(to bottom right, var(--global-accent-color), var(--accent))`,
                  color: '#ffffff'
                }}
              >
                {world.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{world.name}</div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Jugado hace {formatDate(world.lastPlayed)}</div>
              </div>
              <button 
                className="px-3 py-1 rounded text-sm transition-colors"
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
                Jugar
              </button>
            </div>
          ))}
          {settings.jumpBackWorlds.length === 0 && (
            <div className="text-center py-6" style={{ color: 'var(--text-tertiary)' }}>
              No hay mundos recientes
            </div>
          )}
        </div>
      </div>

      <div className="pt-2">
        <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Rendimiento</h3>
        <div className="p-4 rounded-xl border" style={{ 
          backgroundColor: 'var(--panel)',
          borderColor: 'var(--border)'
        }}>
          <div className="flex justify-between items-center mb-2">
            <div>
              <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>Límite de FPS en segundo plano</h4>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>FPS máximos cuando la ventana está minimizada o no está en primer plano</p>
            </div>
            <div className="flex items-center">
              <input
                type="number"
                min="1"
                max="60"
                value={settings.backgroundFPSLimit}
                onChange={(e) => handleLimitFPSChange(e.target.value)}
                className="w-20 p-2 rounded-lg border focus:outline-none focus:ring-2 text-center"
                style={{
                  backgroundColor: 'var(--panel-hover)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
              />
              <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>FPS</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
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
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                backgroundColor: 'var(--panel-hover)',
                accentColor: 'var(--global-accent-color)'
              }}
            />
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
            Limitar los FPS en segundo plano puede reducir el uso de CPU y GPU cuando no estás usando activamente el launcher
          </p>
        </div>
      </div>
    </div>
  );
}