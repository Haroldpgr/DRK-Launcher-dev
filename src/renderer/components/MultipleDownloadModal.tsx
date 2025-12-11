import React, { useState, useEffect } from 'react';

// Definir ContentItem localmente o importarlo desde donde esté definido
interface ContentItem {
  id: string;
  title: string;
  type: string;
  platform: string;
  minecraftVersions?: string[];
  [key: string]: any;
}

interface MultipleDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentItems: ContentItem[];
  availableVersions?: string[]; // Prop opcional para versiones disponibles
  availableLoaders?: string[];  // Prop opcional para loaders disponibles
  onAddToQueue: (queueItems: Array<{
    originalId: string;
    name: string;
    version: string;
    loader?: string;
    targetPath: string;
    platform: string;
    contentType?: 'mod' | 'resourcepack' | 'shader' | 'datapack' | 'modpack';
  }>) => void;
}

const MultipleDownloadModal: React.FC<MultipleDownloadModalProps> = ({
  isOpen,
  onClose,
  contentItems,
  availableVersions: propsAvailableVersions = [],
  availableLoaders: propsAvailableLoaders = [],
  onAddToQueue
}) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [downloadConfigs, setDownloadConfigs] = useState<Record<string, { version: string; loader?: string; targetPath: string; availableVersions: string[]; availableLoaders: string[] }>>({});
  const [showVersionOptions, setShowVersionOptions] = useState<Record<string, boolean>>({});
  const [showLoaderOptions, setShowLoaderOptions] = useState<Record<string, boolean>>({});
  const [globalTargetPath, setGlobalTargetPath] = useState<string>('');
  const [isCustomGlobalPath, setIsCustomGlobalPath] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [itemDetailsLoaded, setItemDetailsLoaded] = useState<Set<string>>(new Set());
  const [animatingItems, setAnimatingItems] = useState<Set<string>>(new Set());

  // Inicializar configuraciones por defecto para cada ítem
  useEffect(() => {
    if (isOpen) {
      const initialConfigs: Record<string, { version: string; loader?: string; targetPath: string; availableVersions: string[]; availableLoaders: string[] }> = {};
      const initialShowVersionOptions: Record<string, boolean> = {};
      const initialShowLoaderOptions: Record<string, boolean> = {};

      contentItems.forEach(item => {
        // Usar las versiones y loaders pasados como props si están disponibles,
        // de lo contrario usar los del item
        const itemVersions = propsAvailableVersions.length > 0 
          ? propsAvailableVersions 
          : (item.minecraftVersions || []);
        
        const itemLoaders = propsAvailableLoaders.length > 0 
          ? propsAvailableLoaders 
          : (item.type === 'mods' || item.type === 'modpacks' 
            ? ['forge', 'fabric', 'quilt', 'neoforge'] 
            : []);
        
        initialConfigs[item.id] = {
          version: itemVersions[0] || '',
          loader: '',
          targetPath: globalTargetPath || '',
          availableVersions: itemVersions,
          availableLoaders: itemLoaders
        };
        initialShowVersionOptions[item.id] = false;
        initialShowLoaderOptions[item.id] = false;
      });

      setDownloadConfigs(initialConfigs);
      setShowVersionOptions(initialShowVersionOptions);
      setShowLoaderOptions(initialShowLoaderOptions);
    }
  }, [isOpen, contentItems, globalTargetPath, propsAvailableVersions, propsAvailableLoaders]);

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Si el clic fue fuera de los dropdowns, cerrarlos todos
      if (!target.closest('.dropdown-container')) {
        setShowVersionOptions({});
        setShowLoaderOptions({});
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

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
      [id]: {
        ...prev[id],
        ...config
      }
    }));
  };

  const handleAddToQueue = async () => {
    setIsProcessing(true);
    
    // Validar versiones compatibles antes de agregar a la cola
    const validItems: Array<{
      originalId: string;
      name: string;
      version: string;
      loader?: string;
      targetPath: string;
      platform: string;
      contentType?: 'mod' | 'resourcepack' | 'shader' | 'datapack' | 'modpack';
    }> = [];
    
    const invalidItems: Array<{ name: string; reason: string }> = [];
    
    for (const id of selectedItems) {
      const item = contentItems.find(i => i.id === id);
      const config = downloadConfigs[id];
      if (!item || !config) continue;
      
      // Determinar el tipo de contenido
      let contentType: 'mod' | 'resourcepack' | 'shader' | 'datapack' | 'modpack' = 'mod';
      if (item.type === 'resourcepacks') {
        contentType = 'resourcepack';
      } else if (item.type === 'shaders') {
        contentType = 'shader';
      } else if (item.type === 'datapacks') {
        contentType = 'datapack';
      } else if (item.type === 'modpacks') {
        contentType = 'modpack';
      }
      
      // Validar que haya versiones compatibles
      try {
        let compatibleVersions: any[] = [];
        
        if (item.platform === 'modrinth') {
          compatibleVersions = await window.api.modrinth.getCompatibleVersions({
            projectId: item.id,
            mcVersion: config.version,
            loader: config.loader || undefined
          });
        } else if (item.platform === 'curseforge') {
          compatibleVersions = await window.api.curseforge.getCompatibleVersions({
            projectId: item.id,
            mcVersion: config.version,
            loader: config.loader || undefined
          });
        }
        
        if (compatibleVersions.length === 0) {
          const loaderText = config.loader ? ` y ${config.loader}` : '';
          invalidItems.push({
            name: item.title,
            reason: `No hay versiones disponibles para ${config.version}${loaderText}`
          });
          continue;
        }
        
        // Si hay versiones compatibles, agregar a la lista válida
        validItems.push({
          originalId: item.id,
          name: item.title,
          version: config.version,
          loader: config.loader,
          targetPath: config.targetPath,
          platform: item.platform,
          contentType: contentType
        });
      } catch (error) {
        console.error(`Error validando ${item.title}:`, error);
        invalidItems.push({
          name: item.title,
          reason: error instanceof Error ? error.message : 'Error al verificar compatibilidad'
        });
      }
    }
    
    setIsProcessing(false);
    
    // Mostrar mensajes de error si hay items inválidos
    if (invalidItems.length > 0) {
      const errorMessages = invalidItems.map(item => `• ${item.name}: ${item.reason}`).join('\n');
      alert(`Los siguientes items no se pudieron agregar a la cola:\n\n${errorMessages}\n\n${validItems.length > 0 ? 'Los items válidos se agregarán a la cola.' : 'Por favor, selecciona versiones y loaders compatibles.'}`);
    }
    
    if (validItems.length === 0) {
      return; // No hay items válidos para agregar
    }

    if (validItems.length > 0) {
      // Iniciar animación de envío
      setAnimatingItems(new Set(selectedItems));
      
      // Animar cada item con un pequeño delay para efecto cascada
      validItems.forEach((item, index) => {
        setTimeout(() => {
          // Remover del set de animación después de la animación
          setTimeout(() => {
            setAnimatingItems(prev => {
              const newSet = new Set(prev);
              newSet.delete(item.originalId);
              return newSet;
            });
          }, 600); // Duración de la animación
        }, index * 50); // Delay escalonado
      });
      
      // Llamar al callback después de un pequeño delay para que se vea la animación
      setTimeout(() => {
        onAddToQueue(validItems);
        // Solo remover los items válidos de la selección
        setSelectedItems(prev => {
          const newSet = new Set(prev);
          validItems.forEach(item => newSet.delete(item.originalId));
          return newSet;
        });
        if (invalidItems.length === 0) {
          onClose();
        }
      }, validItems.length * 50 + 300);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes slideOut {
          0% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
          50% {
            opacity: 0.7;
            transform: translateX(20px) scale(0.98);
          }
          100% {
            opacity: 0;
            transform: translateX(100px) scale(0.95);
          }
        }
      `}</style>
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-700/80 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex justify-between items-start mb-6">
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

          {/* Configuración global - Diseño mejorado similar a SingleDownloadModal */}
          <div className="p-4 bg-gradient-to-br from-gray-700/40 to-gray-800/40 rounded-xl border border-gray-600/50 shadow-lg">
            <h3 className="font-semibold text-white mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Configuración Global
            </h3>
            <div className="space-y-3">
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
                    className="flex-1 bg-gray-700/80 backdrop-blur-sm border border-gray-600 rounded-xl py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
                  />
                  <button
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-4 rounded-xl font-medium transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
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
              <button
                onClick={() => {
                  const updatedConfigs = { ...downloadConfigs };
                  Object.keys(updatedConfigs).forEach(id => {
                    updatedConfigs[id] = { ...updatedConfigs[id], targetPath: globalTargetPath };
                  });
                  setDownloadConfigs(updatedConfigs);
                }}
                className="w-full bg-gray-600/80 hover:bg-gray-500/80 text-white py-2.5 px-4 rounded-xl font-medium transition-all duration-200 border border-gray-500/50"
              >
                Aplicar destino global a todos los items seleccionados
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {contentItems.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <svg className="mx-auto h-12 w-12 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-medium text-gray-300">No hay elementos disponibles para descargar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {contentItems.map((item) => {
                const isSelected = selectedItems.has(item.id);
                const isAnimating = animatingItems.has(item.id);
                const config = downloadConfigs[item.id] || { 
                  version: '', 
                  loader: '', 
                  targetPath: '',
                  availableVersions: propsAvailableVersions.length > 0 ? propsAvailableVersions : item.minecraftVersions,
                  availableLoaders: propsAvailableLoaders
                };
                
                return (
                  <div 
                    key={item.id}
                    className={`p-5 rounded-xl border transition-all duration-300 ${
                      isAnimating
                        ? 'animate-pulse bg-gradient-to-br from-green-900/60 to-emerald-900/60 border-green-500/80 shadow-lg shadow-green-500/30 transform scale-105'
                        : isSelected 
                          ? 'bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border-blue-500/60 shadow-lg shadow-blue-500/10' 
                          : 'bg-gray-700/30 border-gray-600/40 hover:bg-gray-700/40 hover:border-gray-500/50'
                    }`}
                    style={isAnimating ? {
                      animation: 'slideOut 0.6s ease-out forwards'
                    } : {}}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleItemSelection(item.id)}
                          className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-16 h-16 object-cover rounded-lg border border-gray-600/50 flex-shrink-0"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://via.placeholder.com/64x64/1f2937/9ca3af?text=Sin+imagen';
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-white truncate text-lg">{item.title}</h3>
                              <p className="text-sm text-gray-400 mt-1">por {item.author}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs px-2 py-1 bg-gray-600/40 text-gray-300 rounded-full">
                                  {item.platform}
                                </span>
                                <span className="text-xs px-2 py-1 bg-blue-600/20 text-blue-300 rounded-full capitalize">
                                  {item.type}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="mt-4 pt-4 border-t border-gray-600/40 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Selección de versión - Expandible moderno con checkmark */}
                              <div className="dropdown-container">
                                <div className="flex justify-between items-center mb-2">
                                  <label className="block text-sm font-medium text-gray-300">
                                    Versión de Minecraft
                                  </label>
                                  <span className="text-xs text-gray-400">
                                    {(config.availableVersions || []).length} disponibles
                                  </span>
                                </div>
                                <div className="relative">
                                  <button
                                    type="button"
                                    className={`w-full bg-gray-700/80 backdrop-blur-sm border border-gray-600 rounded-xl py-2.5 px-4 text-left flex justify-between items-center transition-all duration-200 ${
                                      config.version ? 'text-white border-blue-500/50' : 'text-gray-400'
                                    }`}
                                    onClick={() => {
                                      setShowVersionOptions(prev => ({
                                        ...prev,
                                        [item.id]: !prev[item.id]
                                      }));
                                      // Cerrar otros dropdowns
                                      setShowLoaderOptions(prev => {
                                        const newState = { ...prev };
                                        Object.keys(newState).forEach(key => {
                                          if (key !== item.id) newState[key] = false;
                                        });
                                        return newState;
                                      });
                                    }}
                                  >
                                    <span className="truncate">
                                      {config.version || 'Selecciona una versión...'}
                                    </span>
                                    <svg 
                                      className={`w-5 h-5 flex-shrink-0 ml-2 transition-transform duration-200 ${
                                        showVersionOptions[item.id] ? 'rotate-180' : ''
                                      }`} 
                                      fill="none" 
                                      stroke="currentColor" 
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>

                                  {showVersionOptions[item.id] && (
                                    <div className="absolute z-20 w-full mt-2 bg-gray-700/95 backdrop-blur-sm border border-gray-600 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                                      {(config.availableVersions || []).length > 0 ? (
                                        (config.availableVersions || []).map((version, idx) => (
                                          <div
                                            key={idx}
                                            className={`flex items-center px-4 py-3 cursor-pointer hover:bg-gray-600/60 transition-colors duration-150 ${
                                              config.version === version ? 'bg-blue-600/30' : ''
                                            }`}
                                            onClick={() => {
                                              updateItemConfig(item.id, { ...config, version });
                                              setShowVersionOptions(prev => ({ ...prev, [item.id]: false }));
                                            }}
                                          >
                                            <span className="mr-3 flex-shrink-0">
                                              {config.version === version ? (
                                                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                </svg>
                                              ) : (
                                                <div className="w-5 h-5 border-2 border-gray-400 rounded transition-colors duration-150"></div>
                                              )}
                                            </span>
                                            <span className={`flex-1 ${config.version === version ? 'text-white font-medium' : 'text-gray-300'}`}>
                                              {version}
                                            </span>
                                          </div>
                                        ))
                                      ) : (
                                        <div className="px-4 py-3 text-gray-400 text-sm">No hay versiones disponibles</div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Selección de loader - Expandible moderno con checkmark */}
                              {(item.type === 'mods' || item.type === 'modpacks') && (
                                <div className="dropdown-container">
                                  <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-300">
                                      Loader Compatible
                                    </label>
                                    <span className="text-xs text-gray-400">
                                      {(config.availableLoaders || []).length} disponibles
                                    </span>
                                  </div>
                                  <div className="relative">
                                    <button
                                      type="button"
                                      className={`w-full bg-gray-700/80 backdrop-blur-sm border border-gray-600 rounded-xl py-2.5 px-4 text-left flex justify-between items-center transition-all duration-200 ${
                                        config.loader ? 'text-white border-blue-500/50' : 'text-gray-400'
                                      }`}
                                      onClick={() => {
                                        setShowLoaderOptions(prev => ({
                                          ...prev,
                                          [item.id]: !prev[item.id]
                                        }));
                                        // Cerrar otros dropdowns
                                        setShowVersionOptions(prev => {
                                          const newState = { ...prev };
                                          Object.keys(newState).forEach(key => {
                                            if (key !== item.id) newState[key] = false;
                                          });
                                          return newState;
                                        });
                                      }}
                                    >
                                      <span className="truncate">
                                        {config.loader 
                                          ? config.loader.charAt(0).toUpperCase() + config.loader.slice(1)
                                          : 'Selecciona un loader...'}
                                      </span>
                                      <svg 
                                        className={`w-5 h-5 flex-shrink-0 ml-2 transition-transform duration-200 ${
                                          showLoaderOptions[item.id] ? 'rotate-180' : ''
                                        }`} 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </button>

                                    {showLoaderOptions[item.id] && (
                                      <div className="absolute z-20 w-full mt-2 bg-gray-700/95 backdrop-blur-sm border border-gray-600 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                                        {(config.availableLoaders || []).length > 0 ? (
                                          (config.availableLoaders || []).map((loader, idx) => (
                                            <div
                                              key={idx}
                                              className={`flex items-center px-4 py-3 cursor-pointer hover:bg-gray-600/60 transition-colors duration-150 ${
                                                config.loader === loader ? 'bg-blue-600/30' : ''
                                              }`}
                                              onClick={() => {
                                                updateItemConfig(item.id, { ...config, loader });
                                                setShowLoaderOptions(prev => ({ ...prev, [item.id]: false }));
                                              }}
                                            >
                                              <span className="mr-3 flex-shrink-0">
                                                {config.loader === loader ? (
                                                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                  </svg>
                                                ) : (
                                                  <div className="w-5 h-5 border-2 border-gray-400 rounded transition-colors duration-150"></div>
                                                )}
                                              </span>
                                              <span className={`flex-1 ${config.loader === loader ? 'text-white font-medium' : 'text-gray-300'}`}>
                                                {loader.charAt(0).toUpperCase() + loader.slice(1)}
                                              </span>
                                            </div>
                                          ))
                                        ) : (
                                          <div className="px-4 py-3 text-gray-400 text-sm">No hay loaders disponibles</div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Carpeta de destino específica */}
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  Carpeta de destino
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={config.targetPath || ''}
                                    onChange={(e) => updateItemConfig(item.id, { ...config, targetPath: e.target.value })}
                                    placeholder={globalTargetPath || "Usar destino global..."}
                                    className="flex-1 bg-gray-700/80 backdrop-blur-sm border border-gray-600 rounded-xl py-2.5 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
                                  />
                                  <button
                                    type="button"
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2.5 px-3 rounded-xl font-medium transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 flex-shrink-0"
                                    onClick={async () => {
                                      try {
                                        if (window.api?.dialog?.showOpenDialog) {
                                          const result = await window.api.dialog.showOpenDialog({
                                            properties: ['openDirectory'],
                                            title: 'Seleccionar carpeta de destino',
                                            buttonLabel: 'Seleccionar'
                                          });
                                          if (!result.canceled && result.filePaths.length > 0) {
                                            updateItemConfig(item.id, { ...config, targetPath: result.filePaths[0] });
                                          }
                                        }
                                      } catch (error) {
                                        console.error('Error al seleccionar carpeta:', error);
                                      }
                                    }}
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                    </svg>
                                  </button>
                                </div>
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
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-400 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="font-medium">{selectedItems.size}</span>
              <span>de</span>
              <span className="font-medium">{contentItems.length}</span>
              <span>seleccionados</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-gray-700/80 hover:bg-gray-600/80 text-gray-200 font-medium transition-all duration-200 border border-gray-600/50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddToQueue}
                disabled={selectedItems.size === 0}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-medium transition-all duration-200 shadow-lg shadow-green-500/20 hover:shadow-green-500/30 disabled:shadow-none flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar a cola ({selectedItems.size})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default MultipleDownloadModal;