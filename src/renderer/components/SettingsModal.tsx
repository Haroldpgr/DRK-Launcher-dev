import React, { useState, useEffect } from 'react';
import { settingsService, Settings } from '../services/settingsService';
import AppearanceSettings from './AppearanceSettings';
import BehaviorSettings from './BehaviorSettings';
import PrivacySettings from './PrivacySettings';
import JavaSettings from './JavaSettings';
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
  const [activeTab, setActiveTab] = useState<'appearance' | 'behavior' | 'privacy' | 'java'>('appearance');
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

  const handleJavaChange = (updates: Partial<Settings['java']>) => {
    handleSettingsChange({ java: { ...settings.java, ...updates } });
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
    { id: 'appearance', label: 'Apariencia', icon: '🎨' },
    { id: 'behavior', label: 'Comportamiento', icon: '⚙️' },
    { id: 'privacy', label: 'Privacidad', icon: '🔒' },
    { id: 'java', label: 'Java', icon: '☕' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col border border-gray-700/50 backdrop-blur-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Configuración</h2>
          <button 
            onClick={handleCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 bg-gray-800/50 border-r border-gray-700 p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  <span className="text-sm">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
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
            
            {activeTab === 'java' && (
              <JavaSettings 
                settings={settings.java} 
                onSettingsChange={handleJavaChange} 
              />
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex justify-between">
          <Button 
            variant="secondary" 
            onClick={handleCancel}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 text-gray-200 font-medium"
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
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 text-gray-200 font-medium disabled:opacity-50"
            >
              Restablecer
            </Button>
            <Button 
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-medium shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Guardar configuración
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}