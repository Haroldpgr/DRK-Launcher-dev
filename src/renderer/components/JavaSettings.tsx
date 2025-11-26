import React, { useState, useEffect } from 'react';
import { settingsService, Settings } from '../services/settingsService';
import { javaDownloadService } from '../services/javaDownloadService';

interface JavaSettingsProps {
  settings: Settings['java'];
  onSettingsChange: (updates: Partial<Settings['java']>) => void;
}

export default function JavaSettings({ settings, onSettingsChange }: JavaSettingsProps) {
  const [allJavas, setAllJavas] = useState<Window['api']['java']['getDefault'] extends () => Promise<infer T> ? T : any[]>([]);
  const [java8Status, setJava8Status] = useState<'idle' | 'detecting' | 'success' | 'error'>('idle');
  const [java17Status, setJava17Status] = useState<'idle' | 'detecting' | 'success' | 'error'>('idle');
  const [java21Status, setJava21Status] = useState<'idle' | 'detecting' | 'success' | 'error'>('idle');
  const [installProgress, setInstallProgress] = useState<Record<string, { received: number; total: number; percentage: number } | null>>({});

  useEffect(() => {
    loadJavaInstallations();
  }, []);

  const loadJavaInstallations = async () => {
    try {
      if (window.api && window.api.java) {
        const javaList = await window.api.java.getAll();
        setAllJavas(javaList);
      }
    } catch (error) {
      console.error('Error loading Java installations:', error);
    }
  };

  const detectJava = async (version: string) => {
    if (!window.api || !window.api.java) {
      alert('API de Java no disponible');
      return;
    }

    if (version === '8') setJava8Status('detecting');
    else if (version === '17') setJava17Status('detecting');
    else if (version === '21') setJava21Status('detecting');

    try {
      const detected = await window.api.java.detect();
      setAllJavas(detected);

      if (version === '8') setJava8Status('success');
      else if (version === '17') setJava17Status('success');
      else if (version === '21') setJava21Status('success');

      // Actualizar la configuración con las rutas detectadas
      const java8 = detected.find(j => j.version === '8' || j.path.includes('8'));
      const java17 = detected.find(j => j.version === '17' || j.path.includes('17'));
      const java21 = detected.find(j => j.version === '21' || j.path.includes('21'));

      if (java8) onSettingsChange({ java8Path: java8.path });
      if (java17) onSettingsChange({ java17Path: java17.path });
      if (java21) onSettingsChange({ java21Path: java21.path });
    } catch (error) {
      console.error(`Error detecting Java ${version}:`, error);
      if (version === '8') setJava8Status('error');
      else if (version === '17') setJava17Status('error');
      else if (version === '21') setJava21Status('error');
    }
  };

  const testJava = async (path: string, versionLabel: string) => {
    if (!window.api || !window.api.java) {
      alert('API de Java no disponible');
      return;
    }

    try {
      const result = await window.api.java.test(path);
      if (result.isWorking) {
        alert(`Java ${versionLabel} probado exitosamente. Versión: ${result.version || 'desconocida'}`);
      } else {
        alert(`Error al probar Java ${versionLabel}: ${result.error || 'No se pudo ejecutar'}`);
      }
    } catch (error) {
      console.error(`Error testing Java ${versionLabel}:`, error);
      alert(`Error al probar Java ${versionLabel}: ${(error as Error).message}`);
    }
  };

  const installJava = async (version: string) => {
    try {
      // Mostrar indicador de instalación en progreso
      setInstallProgress(prev => ({ ...prev, [version]: { received: 0, total: 100, percentage: 0 } }));

      // Usar el nuevo servicio de descarga de Java
      await javaDownloadService.installJava(version);

      alert(`Iniciando descarga de Java ${version}. Puedes ver el progreso en la sección de Descargas.`);
      setInstallProgress(prev => ({ ...prev, [version]: null }));
      // Recargar la lista de Java
      loadJavaInstallations();
    } catch (error) {
      console.error(`Error installing Java ${version}:`, error);
      alert(`Error al instalar Java ${version}: ${(error as Error).message}`);
      setInstallProgress(prev => ({ ...prev, [version]: null }));
    }
  };

  const handlePathChange = (version: '8' | '17' | '21', path: string) => {
    if (version === '8') {
      onSettingsChange({ java8Path: path });
    } else if (version === '17') {
      onSettingsChange({ java17Path: path });
    } else if (version === '21') {
      onSettingsChange({ java21Path: path });
    }
  };

  const handleSetDefault = async (javaId: string) => {
    if (!window.api || !window.api.java) {
      alert('API de Java no disponible');
      return;
    }

    try {
      const result = await window.api.java.setDefault(javaId);
      if (result) {
        alert('Versión de Java predeterminada actualizada');
        loadJavaInstallations(); // Recargar para reflejar el cambio
      } else {
        alert('Error al establecer Java predeterminado');
      }
    } catch (error) {
      console.error('Error setting default Java:', error);
      alert(`Error al establecer Java predeterminado: ${(error as Error).message}`);
    }
  };

  const handleRemove = async (javaId: string) => {
    if (!window.api || !window.api.java) {
      alert('API de Java no disponible');
      return;
    }

    const confirm = window.confirm('¿Estás seguro de que quieres eliminar esta instalación de Java?');
    if (!confirm) return;

    try {
      const result = await window.api.java.remove(javaId);
      if (result) {
        alert('Instalación de Java eliminada');
        loadJavaInstallations(); // Recargar la lista
      } else {
        alert('Error al eliminar la instalación de Java');
      }
    } catch (error) {
      console.error('Error removing Java:', error);
      alert(`Error al eliminar Java: ${(error as Error).message}`);
    }
  };

  const getJavaForVersion = (version: string) => {
    return allJavas.find(j => j.version === version || (j.path && j.path.includes(version)));
  };

  const java8 = getJavaForVersion('8');
  const java17 = getJavaForVersion('17');
  const java21 = getJavaForVersion('21');

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
                disabled={!!installProgress['8']}
                className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded text-sm transition-all disabled:opacity-50"
              >
                {installProgress['8'] ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {installProgress['8']?.percentage}%
                  </span>
                ) : (
                  'Instalar recomendado'
                )}
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={java8?.path || settings.java8Path || ''}
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
                onClick={() => testJava(java8?.path || settings.java8Path || '', '8')}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all"
              >
                Probar
              </button>
            </div>
            {java8 && (
              <div className="mt-2 flex items-center justify-between text-sm">
                <div className="text-gray-400">
                  Versión: {java8.version} • {java8.isWorking ? 'Funcional' : 'No funcional'}
                  {java8.isDefault && <span className="ml-2 text-blue-400">• Predeterminado</span>}
                </div>
                {java8.source === 'installed' && (
                  <button
                    onClick={() => handleRemove(java8.id)}
                    className="text-red-500 hover:text-red-400"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            )}
            {java8Status === 'error' && (
              <div className="mt-2 text-sm text-red-400">No se encontró Java 8 en el sistema</div>
            )}
            {java8Status === 'success' && (
              <div className="mt-2 text-sm text-emerald-400">Java 8 detectado correctamente</div>
            )}
          </div>

          {/* Java 17 */}
          <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-200">Java 17</h4>
              <button
                onClick={() => installJava('17')}
                disabled={!!installProgress['17']}
                className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded text-sm transition-all disabled:opacity-50"
              >
                {installProgress['17'] ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {installProgress['17']?.percentage}%
                  </span>
                ) : (
                  'Instalar recomendado'
                )}
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={java17?.path || settings.java17Path || ''}
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
                onClick={() => testJava(java17?.path || settings.java17Path || '', '17')}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all"
              >
                Probar
              </button>
            </div>
            {java17 && (
              <div className="mt-2 flex items-center justify-between text-sm">
                <div className="text-gray-400">
                  Versión: {java17.version} • {java17.isWorking ? 'Funcional' : 'No funcional'}
                  {java17.isDefault && <span className="ml-2 text-blue-400">• Predeterminado</span>}
                </div>
                {java17.source === 'installed' && (
                  <button
                    onClick={() => handleRemove(java17.id)}
                    className="text-red-500 hover:text-red-400"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            )}
            {java17Status === 'error' && (
              <div className="mt-2 text-sm text-red-400">No se encontró Java 17 en el sistema</div>
            )}
            {java17Status === 'success' && (
              <div className="mt-2 text-sm text-emerald-400">Java 17 detectado correctamente</div>
            )}
          </div>

          {/* Java 21 */}
          <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-200">Java 21</h4>
              <button
                onClick={() => installJava('21')}
                disabled={!!installProgress['21']}
                className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded text-sm transition-all disabled:opacity-50"
              >
                {installProgress['21'] ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {installProgress['21']?.percentage}%
                  </span>
                ) : (
                  'Instalar recomendado'
                )}
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={java21?.path || settings.java21Path || ''}
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
                onClick={() => testJava(java21?.path || settings.java21Path || '', '21')}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all"
              >
                Probar
              </button>
            </div>
            {java21 && (
              <div className="mt-2 flex items-center justify-between text-sm">
                <div className="text-gray-400">
                  Versión: {java21.version} • {java21.isWorking ? 'Funcional' : 'No funcional'}
                  {java21.isDefault && <span className="ml-2 text-blue-400">• Predeterminado</span>}
                </div>
                {java21.source === 'installed' && (
                  <button
                    onClick={() => handleRemove(java21.id)}
                    className="text-red-500 hover:text-red-400"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            )}
            {java21Status === 'error' && (
              <div className="mt-2 text-sm text-red-400">No se encontró Java 21 en el sistema</div>
            )}
            {java21Status === 'success' && (
              <div className="mt-2 text-sm text-emerald-400">Java 21 detectado correctamente</div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-700">
          <h4 className="font-medium text-gray-200 mb-3">Todas las Instalaciones de Java</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2">
            {allJavas.map((java) => (
              <div
                key={java.id}
                className={`p-3 rounded-lg border ${
                  java.isDefault
                    ? 'border-blue-500 bg-blue-900/20'
                    : 'border-gray-700 bg-gray-800/50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-white">{java.id}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Versión: {java.version} • {java.source} • {java.isWorking ? 'Funcional' : 'No funcional'}
                    </div>
                    <div className="text-xs text-gray-500 truncate mt-1">{java.path}</div>
                  </div>
                  <div className="flex gap-1">
                    {java.source === 'installed' && (
                      <button
                        onClick={() => handleRemove(java.id)}
                        className="text-red-500 hover:text-red-400 p-1"
                        title="Eliminar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleSetDefault(java.id)}
                      className={`p-1 ${java.isDefault ? 'text-blue-400' : 'text-gray-400 hover:text-blue-400'}`}
                      title={java.isDefault ? 'Java predeterminado' : 'Establecer como predeterminado'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        {java.isDefault ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        )}
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-700">
          <h4 className="font-medium text-gray-200 mb-2">Versión predeterminada</h4>
          <div className="grid grid-cols-3 gap-2">
            {[
              { version: '8', java: java8 },
              { version: '17', java: java17 },
              { version: '21', java: java21 }
            ].map((item) => (
              <button
                key={item.version}
                onClick={() => item.java && handleSetDefault(item.java.id)}
                disabled={!item.java}
                className={`p-2 rounded-lg border transition-all ${
                  settings.defaultVersion === item.version
                    ? 'border-blue-500 bg-blue-900/30 text-white'
                    : item.java
                      ? 'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600'
                      : 'border-gray-800 bg-gray-900 text-gray-600 cursor-not-allowed'
                }`}
              >
                Java {item.version} {item.java?.isDefault && '*'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}