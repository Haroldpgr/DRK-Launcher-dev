import React, { useState, useEffect } from 'react';
import { settingsService, Settings } from '../services/settingsService';
import AppearanceSettings from './AppearanceSettings';
import BehaviorSettings from './BehaviorSettings';
import PrivacySettings from './PrivacySettings';
import LauncherInfoSettings from './LauncherInfoSettings';
import Button from './Button';
import { themeService } from '../services/themeService';
import { privacyService } from '../services/privacyService';
import { processMonitorService } from '../services/processMonitorService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Callback opcional para notificar a la app que las configuraciones cambiaron
   * (por ejemplo, para re-aplicar tema o redetectar Java).
   */
  onSettingsChanged?: (settings: Settings) => void;
}

export default function SettingsModal({ isOpen, onClose, onSettingsChanged }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'appearance' | 'behavior' | 'privacy' | 'info' | 'eventos'>('appearance');
  const [settings, setSettings] = useState<Settings>(settingsService.getSettings());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(settingsService.getSettings());
      setHasUnsavedChanges(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSettingsChange = (updates: Partial<Settings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    setHasUnsavedChanges(true);
  };

  const handleAppearanceChange = (updates: Partial<Settings['appearance']>) => {
    handleSettingsChange({ appearance: { ...settings.appearance, ...updates } });
  };

  const handleBehaviorChange = (updates: Partial<Settings['behavior']>) => {
    handleSettingsChange({ behavior: { ...settings.behavior, ...updates } });
  };

  const handlePrivacyChange = (updates: Partial<Settings['privacy']>) => {
    handleSettingsChange({ privacy: { ...settings.privacy, ...updates } });
  };

  const handleSave = () => {
    // Guardar configuración completa en el servicio de settings
    const persisted = settingsService.updateSettings(settings);

    // Aplicar apariencia inmediatamente (tema, colores, etc.)
    if (persisted.appearance) {
      themeService.initializeTheme(persisted.appearance);
    }

    // Aplicar ajustes de comportamiento a nivel de monitor de procesos
    if (persisted.behavior) {
      processMonitorService.updateSettings(persisted.behavior);
    }

    // Aplicar cambios de privacidad (incluye actualizar telemetría)
    if (persisted.privacy) {
      privacyService.updatePrivacySettings(persisted.privacy);
    }

    // Notificar a la app que la configuración cambió
    if (onSettingsChanged) {
      onSettingsChanged(persisted);
    }

    setHasUnsavedChanges(false);
    onClose();
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmDiscard = window.confirm('¿Estás seguro de que quieres descartar los cambios no guardados?');
      if (confirmDiscard) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const tabs = [
    { id: 'info', label: 'Información', icon: 'ℹ️' },
    { id: 'appearance', label: 'Apariencia', icon: '🎨' },
    { id: 'behavior', label: 'Comportamiento', icon: '⚙️' },
    { id: 'privacy', label: 'Privacidad', icon: '🔒' },
    { id: 'eventos', label: 'Eventos', icon: '📅' },
  ];

  return (
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm" style={{ backgroundColor: 'var(--overlay)' }}>
        <div className="rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col backdrop-blur-md" style={{ 
          background: 'linear-gradient(to bottom right, var(--panel), var(--bg-secondary))',
          border: '1px solid var(--border)'
        }}>
          <div className="flex justify-between items-center p-6" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Configuración</h2>
          <button 
            onClick={handleCancel}
            className="transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 p-2" style={{ 
            backgroundColor: 'var(--panel)', 
            borderRight: '1px solid var(--border)' 
          }}>
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className="w-full flex items-center px-3 py-2.5 rounded-lg text-left transition-colors"
                  style={{
                    backgroundColor: activeTab === tab.id ? 'var(--global-accent-color)' : 'transparent',
                    color: activeTab === tab.id ? '#ffffff' : 'var(--text-secondary)'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.backgroundColor = 'var(--panel-hover)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  <span className="mr-2">{tab.icon}</span>
                  <span className="text-sm">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'info' && (
              <LauncherInfoSettings />
            )}
            
            {activeTab === 'appearance' && (
              <AppearanceSettings 
                settings={settings.appearance} 
                onSettingsChange={handleAppearanceChange} 
              />
            )}
            
            {activeTab === 'behavior' && (
              <BehaviorSettings 
                settings={settings.behavior} 
                onSettingsChange={handleBehaviorChange} 
              />
            )}
            
            {activeTab === 'privacy' && (
              <PrivacySettings 
                settings={settings.privacy} 
                onSettingsChange={handlePrivacyChange} 
              />
            )}
            
            {activeTab === 'eventos' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Eventos</h2>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Gestiona y visualiza los eventos del launcher.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 flex justify-between" style={{ borderTop: '1px solid var(--border)' }}>
          <Button 
            variant="secondary" 
            onClick={handleCancel}
            className="px-6 py-2.5 rounded-xl font-medium"
            style={{ 
              background: 'var(--panel-hover)',
              color: 'var(--text-primary)'
            }}
          >
            Cancelar
          </Button>
          <div className="flex gap-3">
            <Button 
              variant="secondary" 
              onClick={() => {
                setSettings(settingsService.getSettings());
                setHasUnsavedChanges(false);
              }}
              disabled={!hasUnsavedChanges}
              className="px-6 py-2.5 rounded-xl font-medium disabled:opacity-50"
              style={{ 
                background: 'var(--panel-hover)',
                color: 'var(--text-primary)'
              }}
            >
              Restablecer
            </Button>
            <Button 
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl font-medium shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
              style={{ 
                background: `linear-gradient(to right, var(--global-accent-color), var(--accent))`,
                color: '#ffffff'
              }}
            >
              Guardar configuración
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}