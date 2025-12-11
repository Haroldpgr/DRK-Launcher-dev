import React, { useState, useEffect } from 'react';
import { ContentItem } from '../types/content';

interface MultipleDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentItems: ContentItem[];
  onAddToQueue: (queueItems: Array<{
    id: string;
    name: string;
    version: string;
    loader?: string;
    targetPath: string;
    platform: string;
  }>) => void;
}

const MultipleDownloadModal: React.FC<MultipleDownloadModalProps> = ({
  isOpen,
  onClose,
  contentItems,
  onAddToQueue
}) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [downloadConfigs, setDownloadConfigs] = useState<Record<string, { version: string; loader?: string; targetPath: string }>>({});
  const [globalTargetPath, setGlobalTargetPath] = useState<string>('');
  const [isCustomGlobalPath, setIsCustomGlobalPath] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Inicializar configuraciones por defecto para cada ítem
  useEffect(() => {
    if (isOpen) {
      const initialConfigs: Record<string, { version: string; loader?: string; targetPath: string }> = {};
      contentItems.forEach(item => {
        initialConfigs[item.id] = {
          version: item.minecraftVersions[0] || '',
          loader: '',
          targetPath: globalTargetPath || ''
        };
      });
      setDownloadConfigs(initialConfigs);
    }
  }, [isOpen, contentItems, globalTargetPath]);

  const toggleItemSelection = (id: string) => {
    const newSelectedItems = new Set(selectedItems);
    if (newSelectedItems.has(id)) {
      newSelectedItems.delete(id);
    } else {
      newSelectedItems.add(id);
    }
    setSelectedItems(newSelectedItems);
  };

  const updateItemConfig = (id: string, config: { version: string; loader?: string; targetPath: string }) => {
    setDownloadConfigs(prev => ({
      ...prev,
      [id]: config
    }));
  };

  const handleAddToQueue = () => {
    const queueItems = Array.from(selectedItems).map(id => {
      const item = contentItems.find(i => i.id === id);
      const config = downloadConfigs[id];
      if (!item || !config) return null;
      
      return {
        id: item.id,
        name: item.title,
        version: config.version,
        loader: config.loader,
        targetPath: config.targetPath,
        platform: item.platform
      };
    }).filter(Boolean) as Array<{
      id: string;
      name: string;
      version: string;
      loader?: string;
      targetPath: string;
      platform: string;
    }>;

    onAddToQueue(queueItems);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-700/80 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white">Descarga Múltiple</h2>
              <p className="text-gray-400 mt-1">
                Selecciona múltiples items para descargar en cola
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Configuración global */}
          <div className="mt-6 p-4 bg-gray-700/30 rounded-xl border border-gray-600/30">
            <h3 className="font-medium text-white mb-3">Configuración Global</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Carpeta de destino global
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={globalTargetPath}
                    onChange={(e) => setGlobalTargetPath(e.target.value)}
                    placeholder="Ruta predeterminada para descargas..."
                    className="flex-1 bg-gray-700/80 backdrop-blur-sm border border-gray-600 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
                  />
                  <button
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-4 rounded-xl font-medium transition-all duration-200"
                    onClick={async () => {
                      try {
                        if (window.api?.dialog?.showOpenDialog) {
                          const result = await window.api.dialog.showOpenDialog({
                            properties: ['openDirectory'],
                            title: 'Seleccionar carpeta de destino global',
                            buttonLabel: 'Seleccionar'
                          });
                          if (!result.canceled && result.filePaths.length > 0) {
                            setGlobalTargetPath(result.filePaths[0]);
                          }
                        } else {
                          alert('La función de selección de carpetas no está disponible.');
                        }
                      } catch (error) {
                        console.error('Error al seleccionar carpeta:', error);
                        alert('Error al seleccionar la carpeta: ' + (error as Error).message);
                      }
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    const updatedConfigs = { ...downloadConfigs };
                    Object.keys(updatedConfigs).forEach(id => {
                      updatedConfigs[id] = { ...updatedConfigs[id], targetPath: globalTargetPath };
                    });
                    setDownloadConfigs(updatedConfigs);
                  }}
                  className="w-full bg-gray-600 hover:bg-gray-500 text-white py-3 px-4 rounded-xl font-medium transition-all duration-200"
                >
                  Aplicar a todos
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {contentItems.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No hay elementos disponibles para descargar
            </div>
          ) : (
            <div className="space-y-4">
              {contentItems.map((item) => {
                const isSelected = selectedItems.has(item.id);
                const config = downloadConfigs[item.id] || { version: '', loader: '', targetPath: '' };
                
                return (
                  <div 
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all duration-200 ${
                      isSelected 
                        ? 'bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-blue-500/50' 
                        : 'bg-gray-700/20 border-gray-600/30 hover:bg-gray-700/30'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleItemSelection(item.id)}
                        className="mt-1 w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-white truncate">{item.title}</h3>
                            <p className="text-sm text-gray-400 mt-1">por {item.author}</p>
                          </div>
                          <span className="text-xs px-2 py-1 bg-gray-600/30 text-gray-300 rounded-full ml-2">
                            {item.platform}
                          </span>
                        </div>

                        {isSelected && (
                          <div className="mt-4 pt-4 border-t border-gray-600/30 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Selección de versión */}
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  Versión de Minecraft
                                </label>
                                <select
                                  value={config.version}
                                  onChange={(e) => updateItemConfig(item.id, { ...config, version: e.target.value })}
                                  className="w-full bg-gray-700/80 backdrop-blur-sm border border-gray-600 rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
                                >
                                  <option value="">Selecciona...</option>
                                  {item.minecraftVersions.map((version, idx) => (
                                    <option key={idx} value={version}>
                                      {version}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Selección de loader (si aplica) */}
                              {(item.type === 'mods' || item.type === 'modpacks') && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Loader
                                  </label>
                                  <select
                                    value={config.loader}
                                    onChange={(e) => updateItemConfig(item.id, { ...config, loader: e.target.value })}
                                    className="w-full bg-gray-700/80 backdrop-blur-sm border border-gray-600 rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
                                  >
                                    <option value="">Cualquiera</option>
                                    <option value="forge">Forge</option>
                                    <option value="fabric">Fabric</option>
                                    <option value="quilt">Quilt</option>
                                    <option value="neoforge">NeoForge</option>
                                  </select>
                                </div>
                              )}

                              {/* Carpeta de destino específica */}
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  Carpeta de destino
                                </label>
                                <input
                                  type="text"
                                  value={config.targetPath}
                                  onChange={(e) => updateItemConfig(item.id, { ...config, targetPath: e.target.value })}
                                  placeholder="Usar destino global..."
                                  className="w-full bg-gray-700/80 backdrop-blur-sm border border-gray-600 rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-700/50 bg-gray-800/50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              {selectedItems.size} de {contentItems.length} seleccionados
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddToQueue}
                disabled={selectedItems.size === 0}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-medium transition-all duration-200 shadow-lg shadow-green-500/20 hover:shadow-green-500/30 disabled:shadow-none"
              >
                Agregar a cola ({selectedItems.size})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultipleDownloadModal;