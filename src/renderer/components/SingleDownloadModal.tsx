import React, { useState, useEffect } from 'react';
import { ContentItem } from '../types/content';
import { showModernAlert } from '../utils/uiUtils';

interface SingleDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentItem: ContentItem;
  availableVersions?: string[];
  availableLoaders?: string[];
  onDownloadStart: (downloadInfo: {
    id: string;
    name: string;
    version: string;
    loader?: string;
    targetPath: string;
    platform: string;
  }) => void;
}

const SingleDownloadModal: React.FC<SingleDownloadModalProps> = ({
  isOpen,
  onClose,
  contentItem,
  availableVersions: propsAvailableVersions = [],
  availableLoaders: propsAvailableLoaders = [],
  onDownloadStart
}) => {
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [selectedLoader, setSelectedLoader] = useState<string>('');
  const [targetPath, setTargetPath] = useState<string>('');
  const [availableVersions, setAvailableVersions] = useState<string[]>(propsAvailableVersions);
  const [availableLoaders, setAvailableLoaders] = useState<string[]>(propsAvailableLoaders);
  const [filteredLoaders, setFilteredLoaders] = useState<string[]>(propsAvailableLoaders);
  const [isCustomPath, setIsCustomPath] = useState<boolean>(false);
  const [showVersionOptions, setShowVersionOptions] = useState<boolean>(false);
  const [showLoaderOptions, setShowLoaderOptions] = useState<boolean>(false);
  const [loadingLoaders, setLoadingLoaders] = useState<boolean>(false);

  // Actualizar estados locales cuando cambian las props
  useEffect(() => {
    setAvailableVersions(propsAvailableVersions);
  }, [propsAvailableVersions]);

  useEffect(() => {
    setAvailableLoaders(propsAvailableLoaders);
    if (!selectedVersion) {
      setFilteredLoaders(propsAvailableLoaders);
    }
  }, [propsAvailableLoaders]);

  // Filtrar loaders disponibles cuando se selecciona una versión
  useEffect(() => {
    const filterLoadersForVersion = async () => {
      if (!selectedVersion || (contentItem.type !== 'mods' && contentItem.type !== 'modpacks')) {
        setFilteredLoaders(availableLoaders);
        return;
      }

      setLoadingLoaders(true);
      const compatibleLoaders: string[] = [];
      const allLoaders = ['forge', 'fabric', 'quilt', 'neoforge'];

      // Verificar cada loader para ver si tiene versiones disponibles
      for (const loader of allLoaders) {
        try {
          let compatibleVersions: any[] = [];
          
          if (contentItem.platform === 'modrinth') {
            compatibleVersions = await window.api.modrinth.getCompatibleVersions({
              projectId: contentItem.id,
              mcVersion: selectedVersion,
              loader: loader
            });
            
            // Para Modrinth, verificar que haya versiones que coincidan con versión y loader
            if (Array.isArray(compatibleVersions) && compatibleVersions.length > 0) {
              // Verificar que al menos una versión tenga la versión de Minecraft seleccionada y el loader
              const matchingVersions = compatibleVersions.filter((v: any) => {
                const versionMatch = v.game_versions && Array.isArray(v.game_versions) && v.game_versions.includes(selectedVersion);
                const loaderMatch = v.loaders && Array.isArray(v.loaders) && v.loaders.includes(loader);
                return versionMatch && loaderMatch;
              });
              
              if (matchingVersions.length > 0) {
                compatibleLoaders.push(loader);
              }
            }
          } else if (contentItem.platform === 'curseforge') {
            compatibleVersions = await window.api.curseforge.getCompatibleVersions({
              projectId: contentItem.id,
              mcVersion: selectedVersion,
              loader: loader
            });
            
            // Para CurseForge, verificar que haya versiones que coincidan exactamente con versión y loader
            if (Array.isArray(compatibleVersions) && compatibleVersions.length > 0) {
              const matchingVersions = compatibleVersions.filter((v: any) => {
                // Verificar game_versions (array) o gameVersion (string)
                const versionMatch = (v.game_versions && Array.isArray(v.game_versions) && v.game_versions.includes(selectedVersion)) ||
                                     (v.gameVersion === selectedVersion);
                // Verificar loaders (array) o modLoader (string)
                const loaderMatch = (v.loaders && Array.isArray(v.loaders) && v.loaders.includes(loader)) ||
                                    (v.modLoader && v.modLoader.toLowerCase() === loader.toLowerCase());
                return versionMatch && loaderMatch;
              });
              
              if (matchingVersions.length > 0) {
                compatibleLoaders.push(loader);
              }
            }
          }
        } catch (error) {
          console.error(`Error verificando loader ${loader}:`, error);
        }
      }

      setFilteredLoaders(compatibleLoaders);
      setLoadingLoaders(false);

      // Si el loader seleccionado no está disponible, limpiarlo
      if (selectedLoader && !compatibleLoaders.includes(selectedLoader)) {
        setSelectedLoader('');
      }
    };

    filterLoadersForVersion();
  }, [selectedVersion, contentItem.id, contentItem.platform, contentItem.type]);

  const handleStartDownload = async () => {
    if (!selectedVersion || (contentItem.type === 'mods' && !selectedLoader) || (!targetPath && !isCustomPath)) {
      await showModernAlert('Campos requeridos', 'Por favor, completa todos los campos requeridos', 'warning');
      return;
    }

    onDownloadStart({
      id: contentItem.id,
      name: contentItem.title,
      version: selectedVersion,
      loader: selectedLoader,
      targetPath: targetPath,
      platform: contentItem.platform
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-700/80 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Descarga Individual</h2>
              <p className="text-gray-400">Configura la descarga de "{contentItem.title}"</p>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="md:col-span-1 flex justify-center">
              <img
                src={contentItem.imageUrl}
                alt={contentItem.title}
                className="w-32 h-32 object-cover rounded-xl border border-gray-600 shadow-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/128x128/1f2937/9ca3af?text=Sin+imagen';
                }}
              />
            </div>
            <div className="md:col-span-2">
              <h3 className="text-xl font-bold text-white mb-2">{contentItem.title}</h3>
              <p className="text-gray-300 mb-4">{contentItem.description}</p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Autor</p>
                  <p className="text-white">{contentItem.author}</p>
                </div>
                <div>
                  <p className="text-gray-400">Tipo</p>
                  <p className="text-white capitalize">{contentItem.type}</p>
                </div>
                <div>
                  <p className="text-gray-400">Descargas</p>
                  <p className="text-white">{contentItem.downloads.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-400">Plataforma</p>
                  <p className="text-purple-400 capitalize">{contentItem.platform}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Selección de versión moderna con checkboxes */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Versión de Minecraft
                </label>
                <span className="text-xs text-gray-400">{availableVersions.length} disponibles</span>
              </div>
              
              <div className="relative">
                <button
                  type="button"
                  className={`w-full bg-gray-700/80 backdrop-blur-sm border border-gray-600 rounded-xl py-3 px-4 text-left flex justify-between items-center ${
                    selectedVersion ? 'text-white' : 'text-gray-400'
                  }`}
                  onClick={() => setShowVersionOptions(!showVersionOptions)}
                >
                  <span>{selectedVersion || 'Selecciona una versión...'}</span>
                  <svg 
                    className={`w-5 h-5 transition-transform duration-200 ${showVersionOptions ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showVersionOptions && (
                  <div className="absolute z-10 w-full mt-2 bg-gray-700/90 backdrop-blur-sm border border-gray-600 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {availableVersions.length > 0 ? (
                      availableVersions.map((version) => (
                        <div
                          key={version}
                          className={`flex items-center px-4 py-3 cursor-pointer hover:bg-gray-600/50 ${
                            selectedVersion === version ? 'bg-blue-600/30' : ''
                          }`}
                          onClick={async () => {
                            setSelectedVersion(version);
                            setShowVersionOptions(false);
                            // Limpiar loader seleccionado cuando cambia la versión
                            setSelectedLoader('');
                          }}
                        >
                          <span className="mr-3">
                            {selectedVersion === version ? (
                              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <div className="w-5 h-5 border border-gray-400 rounded"></div>
                            )}
                          </span>
                          <span className={selectedVersion === version ? 'text-white font-medium' : 'text-gray-300'}>
                            {version}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-gray-400">No hay versiones disponibles</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Selección de loader moderna con checkboxes (solo si aplica) */}
            {(contentItem.type === 'mods' || contentItem.type === 'modpacks') && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Loader Compatible
                  </label>
                  <span className="text-xs text-gray-400">
                    {loadingLoaders ? 'Verificando...' : `${filteredLoaders.length} disponibles`}
                  </span>
                </div>
                
                <div className="relative">
                  <button
                    type="button"
                    className={`w-full bg-gray-700/80 backdrop-blur-sm border border-gray-600 rounded-xl py-3 px-4 text-left flex justify-between items-center ${
                      selectedLoader ? 'text-white' : 'text-gray-400'
                    }`}
                    onClick={() => setShowLoaderOptions(!showLoaderOptions)}
                  >
                    <span>{selectedLoader ? selectedLoader.charAt(0).toUpperCase() + selectedLoader.slice(1) : 'Selecciona un loader...'}</span>
                    <svg 
                      className={`w-5 h-5 transition-transform duration-200 ${showLoaderOptions ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showLoaderOptions && (
                    <div className="absolute z-10 w-full mt-2 bg-gray-700/90 backdrop-blur-sm border border-gray-600 rounded-xl shadow-lg">
                      {loadingLoaders ? (
                        <div className="px-4 py-3 text-gray-400 text-center">Verificando loaders disponibles...</div>
                      ) : filteredLoaders.length > 0 ? (
                        filteredLoaders.map((loader) => (
                          <div
                            key={loader}
                            className={`flex items-center px-4 py-3 cursor-pointer hover:bg-gray-600/50 ${
                              selectedLoader === loader ? 'bg-blue-600/30' : ''
                            }`}
                            onClick={() => {
                              setSelectedLoader(loader);
                              setShowLoaderOptions(false);
                            }}
                          >
                            <span className="mr-3">
                              {selectedLoader === loader ? (
                                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <div className="w-5 h-5 border border-gray-400 rounded"></div>
                              )}
                            </span>
                            <span className={selectedLoader === loader ? 'text-white font-medium' : 'text-gray-300'}>
                              {loader.charAt(0).toUpperCase() + loader.slice(1)}
                            </span>
                          </div>
                        ))
                      ) : selectedVersion ? (
                        <div className="px-4 py-3 text-gray-400">No hay loaders disponibles para {selectedVersion}</div>
                      ) : (
                        <div className="px-4 py-3 text-gray-400">Selecciona una versión primero</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Selección de destino */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Destino de la descarga
              </label>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="folder-custom"
                    checked={isCustomPath}
                    onChange={() => setIsCustomPath(true)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
                  />
                  <label htmlFor="folder-custom" className="ml-2 text-gray-300">
                    Carpeta personalizada
                  </label>
                </div>

                {isCustomPath && (
                  <div className="ml-6 space-y-2">
                    <input
                      type="text"
                      value={targetPath}
                      onChange={(e) => setTargetPath(e.target.value)}
                      placeholder="Selecciona una carpeta..."
                      className="w-full bg-gray-700/80 backdrop-blur-sm border border-gray-600 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
                    />
                    <button
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-4 rounded-xl font-medium transition-all duration-200"
                      onClick={async () => {
                        try {
                          if (window.api?.dialog?.showOpenDialog) {
                            const result = await window.api.dialog.showOpenDialog({
                              properties: ['openDirectory'],
                              title: 'Seleccionar carpeta de destino',
                              buttonLabel: 'Seleccionar'
                            });
                            if (!result.canceled && result.filePaths.length > 0) {
                              setTargetPath(result.filePaths[0]);
                            }
                          } else {
                            await showModernAlert('Función no disponible', 'La función de selección de carpetas no está disponible.', 'warning');
                          }
                        } catch (error) {
                          console.error('Error al seleccionar carpeta:', error);
                          await showModernAlert('Error', 'Error al seleccionar la carpeta: ' + (error as Error).message, 'error');
                        }
                      }}
                    >
                      <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      Seleccionar carpeta
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Botón iniciar descarga */}
            <div className="pt-4">
              <button
                onClick={handleStartDownload}
                disabled={!selectedVersion || (contentItem.type === 'mods' && !selectedLoader) || (!targetPath && !isCustomPath)}
                className="w-full relative overflow-hidden rounded-xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
              >
                Iniciar Descarga Individual
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleDownloadModal;