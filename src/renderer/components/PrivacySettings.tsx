import React, { useState } from 'react';
import { settingsService, Settings } from '../services/settingsService';
import { privacyService } from '../services/privacyService';
import ToggleSwitch from './ToggleSwitch';

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
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Telemetría</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Permitir que la aplicación envíe datos anónimos de uso para mejorar la experiencia
            </p>
            {showTelemetryDetails && (
              <div className="mt-3 p-4 rounded-lg border" style={{
                backgroundColor: 'var(--panel)',
                borderColor: 'var(--border)'
              }}>
                <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Datos recopilados:</h4>
                <ul className="text-sm space-y-1 list-disc pl-5" style={{ color: 'var(--text-secondary)' }}>
                  <li>Tiempo de inicio de la aplicación</li>
                  <li>Errores no identificables</li>
                  <li>Versiones de sistema operativo</li>
                  <li>Configuración de hardware general (sin identificadores únicos)</li>
                </ul>
                <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>No se recopila información personal ni credenciales.</p>
              </div>
            )}
          </div>
          <div className="ml-4">
            <ToggleSwitch
              checked={settings.telemetryEnabled}
              onChange={(checked) => onSettingsChange({ telemetryEnabled: checked })}
            />
          </div>
        </div>

        {settings.telemetryEnabled && (
          <button
            onClick={toggleTelemetryDetails}
            className="text-sm transition-colors"
            style={{ color: 'var(--global-accent-color)' }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            {showTelemetryDetails ? 'Ocultar detalles' : 'Mostrar qué datos se recopilan'}
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Rich Presence en Discord</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Mostrar tu actividad en Discord</p>
          </div>
          <ToggleSwitch
            checked={settings.discordRPC}
            onChange={(checked) => onSettingsChange({ discordRPC: checked })}
          />
        </div>
        {settings.discordRPC && (
          <div className="p-3 rounded-lg" style={{
            backgroundColor: `color-mix(in srgb, var(--global-accent-color) 20%, transparent)`,
            border: `1px solid var(--global-accent-color)`
          }}>
            <p className="text-sm flex items-start" style={{ color: 'var(--text-primary)' }}>
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
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Anuncios personalizados</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Mostrar anuncios basados en tus preferencias</p>
          </div>
          <ToggleSwitch
            checked={settings.personalizedAds}
            onChange={(checked) => onSettingsChange({ personalizedAds: checked })}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Modo Offline Forzado</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Impedir conexiones de red no esenciales</p>
          </div>
          <ToggleSwitch
            checked={settings.forcedOfflineMode}
            onChange={(checked) => onSettingsChange({ forcedOfflineMode: checked })}
          />
        </div>
        {settings.forcedOfflineMode && (
          <div className="p-3 rounded-lg" style={{
            backgroundColor: `color-mix(in srgb, #F59E0B 20%, transparent)`,
            border: `1px solid #F59E0B`
          }}>
            <p className="text-sm flex items-start" style={{ color: 'var(--text-primary)' }}>
              <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
              </svg>
              Esta opción puede afectar la funcionalidad del launcher
            </p>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Nivel de Registro</h3>
        <div className="grid grid-cols-3 gap-2">
          {(['Debug', 'Info', 'Error'] as const).map((level) => (
            <button
              key={level}
              onClick={() => handleLogLevelChange(level)}
              className="p-2 rounded-lg border transition-all"
              style={{
                borderColor: settings.logLevel === level ? 'var(--global-accent-color)' : 'var(--border)',
                backgroundColor: settings.logLevel === level 
                  ? `color-mix(in srgb, var(--global-accent-color) 20%, transparent)` 
                  : 'var(--panel)',
                color: 'var(--text-primary)'
              }}
              onMouseEnter={(e) => {
                if (settings.logLevel !== level) {
                  e.currentTarget.style.borderColor = 'var(--border-light)';
                  e.currentTarget.style.backgroundColor = 'var(--panel-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (settings.logLevel !== level) {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.backgroundColor = 'var(--panel)';
                }
              }}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Política de Privacidad</h3>
        <div className="space-y-2">
          <input
            type="url"
            value={settings.privacyPolicyUrl}
            onChange={(e) => handlePrivacyPolicyUrlChange(e.target.value)}
            placeholder="https://example.com/privacy"
            className="w-full p-2 rounded-lg border focus:outline-none focus:ring-2"
            style={{
              backgroundColor: 'var(--panel-hover)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)'
            }}
          />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            URL de la política de privacidad que se mostrará al usuario
          </p>
        </div>
      </div>

      <div className="pt-4 space-y-4" style={{ borderTop: '1px solid var(--border)' }}>
        <div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Herramientas de Privacidad</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={handleClearCache}
              disabled={cacheClearing}
              className="p-3 rounded-lg shadow transition-all flex items-center justify-center"
              style={{
                background: 'linear-gradient(to right, #DC2626, #B91C1C)',
                color: '#ffffff',
                opacity: cacheClearing ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!cacheClearing) {
                  e.currentTarget.style.background = 'linear-gradient(to right, #B91C1C, #991B1B)';
                }
              }}
              onMouseLeave={(e) => {
                if (!cacheClearing) {
                  e.currentTarget.style.background = 'linear-gradient(to right, #DC2626, #B91C1C)';
                }
              }}
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
              className="p-3 rounded-lg shadow transition-all flex items-center justify-center"
              style={{
                background: 'linear-gradient(to right, #10B981, #059669)',
                color: '#ffffff',
                opacity: exporting ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!exporting) {
                  e.currentTarget.style.background = 'linear-gradient(to right, #059669, #047857)';
                }
              }}
              onMouseLeave={(e) => {
                if (!exporting) {
                  e.currentTarget.style.background = 'linear-gradient(to right, #10B981, #059669)';
                }
              }}
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
            <div className="mt-2 p-2 rounded text-center" style={{
              backgroundColor: `color-mix(in srgb, #10B981 20%, transparent)`,
              border: `1px solid #10B981`,
              color: 'var(--text-primary)'
            }}>
              Configuración exportada exitosamente
            </div>
          )}
        </div>
      </div>
    </div>
  );
}