import React, { useState } from 'react';
import { settingsService, Settings } from '../services/settingsService';

interface JavaSettingsProps {
  settings: Settings['java'];
  onSettingsChange: (updates: Partial<Settings['java']>) => void;
}

export default function JavaSettings({ settings, onSettingsChange }: JavaSettingsProps) {
  const [java8Path, setJava8Path] = useState(settings.java8Path || '');
  const [java17Path, setJava17Path] = useState(settings.java17Path || '');
  const [java21Path, setJava21Path] = useState(settings.java21Path || '');
  const [java8Status, setJava8Status] = useState<'idle' | 'detecting' | 'success' | 'error'>('idle');
  const [java17Status, setJava17Status] = useState<'idle' | 'detecting' | 'success' | 'error'>('idle');
  const [java21Status, setJava21Status] = useState<'idle' | 'detecting' | 'success' | 'error'>('idle');

  const detectJava = async (version: string) => {
    // Simulate Java detection process
    if (version === '8') {
      setJava8Status('detecting');
      setTimeout(() => {
        setJava8Status('success');
        setJava8Path('C:/Program Files/Java/jdk8/bin/java.exe');
        onSettingsChange({ java8Path: 'C:/Program Files/Java/jdk8/bin/java.exe' });
      }, 1500);
    } else if (version === '17') {
      setJava17Status('detecting');
      setTimeout(() => {
        setJava17Status('success');
        setJava17Path('C:/Program Files/Eclipse Adoptium/jdk-17/bin/java.exe');
        onSettingsChange({ java17Path: 'C:/Program Files/Eclipse Adoptium/jdk-17/bin/java.exe' });
      }, 1500);
    } else if (version === '21') {
      setJava21Status('detecting');
      setTimeout(() => {
        setJava21Status('success');
        setJava21Path('C:/Program Files/Eclipse Adoptium/jdk-21/bin/java.exe');
        onSettingsChange({ java21Path: 'C:/Program Files/Eclipse Adoptium/jdk-21/bin/java.exe' });
      }, 1500);
    }
  };

  const testJava = async (path: string) => {
    // Simulate Java testing
    if (!path) return false;
    return new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(true), 800);
    });
  };

  const installJava = async (version: string) => {
    // Simulate Java installation process
    alert(`Iniciando descarga e instalación de Java ${version}...`);
  };

  const handlePathChange = (version: '8' | '17' | '21', path: string) => {
    if (version === '8') {
      setJava8Path(path);
      onSettingsChange({ java8Path: path });
    } else if (version === '17') {
      setJava17Path(path);
      onSettingsChange({ java17Path: path });
    } else if (version === '21') {
      setJava21Path(path);
      onSettingsChange({ java21Path: path });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-200 mb-4">Configuración de Java</h3>
        
        <div className="space-y-4">
          {/* Java 8 */}
          <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-200">Java 8</h4>
              <button 
                onClick={() => installJava('8')}
                className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded text-sm transition-all"
              >
                Instalar recomendado
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={java8Path}
                onChange={(e) => handlePathChange('8', e.target.value)}
                placeholder="Ruta al ejecutable de Java 8"
                className="flex-1 p-2 rounded-lg bg-gray-700/80 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button 
                onClick={() => detectJava('8')}
                disabled={java8Status === 'detecting'}
                className={`px-3 py-2 rounded-lg transition-all ${
                  java8Status === 'detecting' 
                    ? 'bg-blue-800 text-blue-200' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {java8Status === 'detecting' ? (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Detectar'}
              </button>
              <button 
                onClick={async () => {
                  const isValid = await testJava(java8Path);
                  if (isValid) {
                    alert('Java 8 probado exitosamente');
                  } else {
                    alert('Error al probar Java 8');
                  }
                }}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all"
              >
                Probar
              </button>
            </div>
            {java8Status === 'error' && (
              <div className="mt-2 text-sm text-red-400">No se encontró Java 8 en el sistema</div>
            )}
            {java8Status === 'success' && (
              <div className="mt-2 text-sm text-emerald-400">Java 8 encontrado correctamente</div>
            )}
          </div>

          {/* Java 17 */}
          <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-200">Java 17</h4>
              <button 
                onClick={() => installJava('17')}
                className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded text-sm transition-all"
              >
                Instalar recomendado
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={java17Path}
                onChange={(e) => handlePathChange('17', e.target.value)}
                placeholder="Ruta al ejecutable de Java 17"
                className="flex-1 p-2 rounded-lg bg-gray-700/80 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button 
                onClick={() => detectJava('17')}
                disabled={java17Status === 'detecting'}
                className={`px-3 py-2 rounded-lg transition-all ${
                  java17Status === 'detecting' 
                    ? 'bg-blue-800 text-blue-200' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {java17Status === 'detecting' ? (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Detectar'}
              </button>
              <button 
                onClick={async () => {
                  const isValid = await testJava(java17Path);
                  if (isValid) {
                    alert('Java 17 probado exitosamente');
                  } else {
                    alert('Error al probar Java 17');
                  }
                }}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all"
              >
                Probar
              </button>
            </div>
            {java17Status === 'error' && (
              <div className="mt-2 text-sm text-red-400">No se encontró Java 17 en el sistema</div>
            )}
            {java17Status === 'success' && (
              <div className="mt-2 text-sm text-emerald-400">Java 17 encontrado correctamente</div>
            )}
          </div>

          {/* Java 21 */}
          <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-200">Java 21</h4>
              <button 
                onClick={() => installJava('21')}
                className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded text-sm transition-all"
              >
                Instalar recomendado
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={java21Path}
                onChange={(e) => handlePathChange('21', e.target.value)}
                placeholder="Ruta al ejecutable de Java 21"
                className="flex-1 p-2 rounded-lg bg-gray-700/80 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button 
                onClick={() => detectJava('21')}
                disabled={java21Status === 'detecting'}
                className={`px-3 py-2 rounded-lg transition-all ${
                  java21Status === 'detecting' 
                    ? 'bg-blue-800 text-blue-200' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {java21Status === 'detecting' ? (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Detectar'}
              </button>
              <button 
                onClick={async () => {
                  const isValid = await testJava(java21Path);
                  if (isValid) {
                    alert('Java 21 probado exitosamente');
                  } else {
                    alert('Error al probar Java 21');
                  }
                }}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all"
              >
                Probar
              </button>
            </div>
            {java21Status === 'error' && (
              <div className="mt-2 text-sm text-red-400">No se encontró Java 21 en el sistema</div>
            )}
            {java21Status === 'success' && (
              <div className="mt-2 text-sm text-emerald-400">Java 21 encontrado correctamente</div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-700">
          <h4 className="font-medium text-gray-200 mb-2">Versión predeterminada</h4>
          <div className="grid grid-cols-3 gap-2">
            {[
              { version: '8', path: settings.java8Path },
              { version: '17', path: settings.java17Path },
              { version: '21', path: settings.java21Path }
            ].map((item) => (
              <button
                key={item.version}
                onClick={() => onSettingsChange({ defaultVersion: item.version })}
                disabled={!item.path}
                className={`p-2 rounded-lg border transition-all ${
                  settings.defaultVersion === item.version 
                    ? 'border-blue-500 bg-blue-900/30 text-white' 
                    : item.path 
                      ? 'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600' 
                      : 'border-gray-800 bg-gray-900 text-gray-600 cursor-not-allowed'
                }`}
              >
                Java {item.version}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}