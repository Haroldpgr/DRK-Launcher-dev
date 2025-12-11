import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { CurseForgeAPI_Handler, CurseForgeMod, CurseForgeFile } from '../services/CurseForgeAPI_Handler';
import { downloadService } from '../services/downloadService';

interface DownloadModalCurseForgeProps {
  isOpen: boolean;
  onClose: () => void;
  mod: CurseForgeMod;
  onDownloadComplete?: () => void;
}

const DownloadModalCurseForge: React.FC<DownloadModalCurseForgeProps> = ({ 
  isOpen, 
  onClose, 
  mod, 
  onDownloadComplete 
}) => {
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [selectedLoader, setSelectedLoader] = useState<string>('');
  const [customPath, setCustomPath] = useState<string>('');
  const [isCustomPathSelected, setIsCustomPathSelected] = useState<boolean>(false);
  const [files, setFiles] = useState<CurseForgeFile[]>([]);
  const [compatibleFiles, setCompatibleFiles] = useState<CurseForgeFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<CurseForgeFile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [instances, setInstances] = useState<any[]>([]);
  const [manualDownloadUrl, setManualDownloadUrl] = useState<string>('');

  useEffect(() => {
    if (isOpen && mod) {
      loadModData();
    }
  }, [isOpen, mod]);

  const loadModData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load instances
      if (window.api?.instances) {
        const userInstances = await window.api.instances.list();
        setInstances(userInstances);
      }

      // Load all files for the mod
      const modFiles = await new CurseForgeAPI_Handler().getModFiles(mod.id);
      setFiles(modFiles);
      
      // Set default compatible files (all files initially)
      setCompatibleFiles(modFiles);
      
      // Set first file as default if available
      if (modFiles.length > 0) {
        setSelectedFile(modFiles[0]);
        setManualDownloadUrl(modFiles[0].downloadUrl);
      }
    } catch (err) {
      console.error('Error loading mod data:', err);
      setError('Error al cargar los datos del mod. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleVersionChange = (version: string) => {
    setSelectedVersion(version);
    // In CurseForge, versions are stored in each file's gameVersions array
    const filteredFiles = files.filter(file => 
      file.gameVersions.includes(version) && 
      (!selectedLoader || 
        (selectedLoader === 'forge' && file.gameVersionTypIds.includes(1)) ||
        (selectedLoader === 'fabric' && file.gameVersionTypIds.includes(4)) ||
        (selectedLoader === 'quilt' && file.gameVersionTypIds.includes(5)) ||
        (selectedLoader === 'neoforge' && file.gameVersionTypIds.includes(6))
      )
    );
    
    setCompatibleFiles(filteredFiles);
    if (filteredFiles.length > 0) {
      setSelectedFile(filteredFiles[0]);
      setManualDownloadUrl(filteredFiles[0].downloadUrl);
    }
  };

  const handleLoaderChange = (loader: string) => {
    setSelectedLoader(loader);
    
    // Filter files based on selected loader
    const loaderMap: Record<string, number> = {
      'forge': 1,
      'fabric': 4,
      'quilt': 5,
      'neoforge': 6
    };
    
    const expectedLoaderId = loaderMap[loader];
    const filteredFiles = files.filter(file => 
      !expectedLoaderId || file.gameVersionTypIds.includes(expectedLoaderId)
    );
    
    setCompatibleFiles(filteredFiles);
    if (filteredFiles.length > 0) {
      setSelectedFile(filteredFiles[0]);
      setManualDownloadUrl(filteredFiles[0].downloadUrl);
    }
  };

  const handleSelectCustomPath = async () => {
    try {
      if (window.api?.dialog?.showOpenDialog) {
        const result = await window.api.dialog.showOpenDialog({
          properties: ['openDirectory'],
          title: 'Seleccionar carpeta de destino',
          buttonLabel: 'Seleccionar'
        });
        
        if (!result.canceled && result.filePaths.length > 0) {
          setCustomPath(result.filePaths[0]);
          setIsCustomPathSelected(true);
        }
      }
    } catch (error) {
      console.error('Error selecting custom path:', error);
      setError('Error al seleccionar la carpeta personalizada.');
    }
  };

  const handleDownload = async () => {
    if (!selectedFile) {
      setError('Por favor, selecciona un archivo para descargar.');
      return;
    }

    try {
      // Determine the target path
      let targetPath = '';
      if (isCustomPathSelected && customPath) {
        targetPath = customPath;
      } else {
        // Use selected instance path if available
        const selectedInstanceId = document.querySelector('select[name="instance-select"]')?.value;
        if (selectedInstanceId && selectedInstanceId !== 'custom') {
          const selectedInstance = instances.find(instance => instance.id === selectedInstanceId);
          if (selectedInstance) {
            targetPath = selectedInstance.path;
          }
        }
      }

      if (!targetPath) {
        setError('Por favor, selecciona una instancia o carpeta personalizada para la descarga.');
        return;
      }

      // Create download using the download service
      downloadService.downloadFile(
        selectedFile.downloadUrl,
        selectedFile.fileName,
        `${mod.name} ${selectedFile.displayName}`
      );

      // Close the modal and call completion callback if provided
      onClose();
      if (onDownloadComplete) {
        onDownloadComplete();
      }
    } catch (error) {
      console.error('Error starting download:', error);
      setError('Error al iniciar la descarga. Por favor, inténtalo de nuevo.');
    }
  };

  const handleManualDownload = () => {
    if (manualDownloadUrl) {
      window.open(manualDownloadUrl, '_blank');
    }
  };

  // Extract unique game versions and loaders from the files
  const gameVersions = Array.from(
    new Set(files.flatMap(file => file.gameVersions))
  ).sort((a, b) => b.localeCompare(a)); // Sort in descending order

  const loaderOptions = [
    { id: 1, name: 'Forge', value: 'forge' },
    { id: 4, name: 'Fabric', value: 'fabric' },
    { id: 5, name: 'Quilt', value: 'quilt' },
    { id: 6, name: 'NeoForge', value: 'neoforge' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="w-full max-w-2xl bg-gray-800 rounded-xl border border-gray-700 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              {mod.logo && mod.logo.url ? (
                <img 
                  src={mod.logo.url} 
                  alt={mod.name} 
                  className="w-16 h-16 rounded-lg object-cover border border-gray-600" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzFmMjkzNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5NPC90ZXh0Pjwvc3ZnPg==';
                  }}
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gray-700 flex items-center justify-center border border-gray-600">
                  <span className="text-gray-400 text-xs font-bold">CF</span>
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-white">{mod.name}</h2>
                <p className="text-sm text-gray-400 mt-1">Descargar contenido</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-8">{error}</div>
          ) : (
            <div className="space-y-6">
              {/* Manual Download Option */}
              <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                <h3 className="font-medium text-gray-200 mb-2">Opción Manual:</h3>
                <button
                  onClick={handleManualDownload}
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  Descargar el archivo manualmente
                </button>
              </div>

              {/* Game Version Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Versión del Juego:
                </label>
                <div className="relative">
                  <select
                    value={selectedVersion}
                    onChange={(e) => handleVersionChange(e.target.value)}
                    className="w-full bg-gray-700/80 backdrop-blur-sm border border-gray-600 rounded-xl py-3 px-4 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 appearance-none"
                  >
                    <option value="">Seleccionar versión...</option>
                    {gameVersions.map(version => (
                      <option key={version} value={version}>
                        {version}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Loader Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Selector de Loader:
                </label>
                <div className="relative">
                  <select
                    value={selectedLoader}
                    onChange={(e) => handleLoaderChange(e.target.value)}
                    className="w-full bg-gray-700/80 backdrop-blur-sm border border-gray-600 rounded-xl py-3 px-4 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 appearance-none"
                  >
                    <option value="">Seleccionar loader...</option>
                    {loaderOptions.map(loader => (
                      <option key={loader.id} value={loader.value}>
                        {loader.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Destination Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Destino de Instalación:
                </label>
                <div className="relative">
                  <select
                    name="instance-select"
                    className="w-full bg-gray-700/80 backdrop-blur-sm border border-gray-600 rounded-xl py-3 px-4 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 appearance-none"
                  >
                    <option value="">Seleccionar instancia...</option>
                    {instances.map(instance => (
                      <option key={instance.id} value={instance.id}>
                        {instance.name} ({instance.version}) {instance.loader && ` - ${instance.loader}`}
                      </option>
                    ))}
                    <option value="custom">Carpeta personalizada...</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                {isCustomPathSelected || (
                  <button
                    onClick={handleSelectCustomPath}
                    className="mt-2 w-full bg-gray-700/70 hover:bg-gray-600/80 text-gray-300 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors"
                  >
                    Carpeta personalizada...
                  </button>
                )}
                
                {isCustomPathSelected && (
                  <div className="mt-2 p-3 bg-gray-700/50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300 truncate">{customPath}</span>
                      <button
                        onClick={() => setIsCustomPathSelected(false)}
                        className="text-red-500 hover:text-red-400 ml-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Selected File Details */}
              {selectedFile && (
                <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                  <h4 className="font-medium text-gray-200 mb-2">Detalles del Archivo Seleccionado:</h4>
                  <div className="flex items-start space-x-3">
                    {mod.logo && mod.logo.url ? (
                      <img 
                        src={mod.logo.url} 
                        alt={mod.name} 
                        className="w-10 h-10 rounded object-cover border border-gray-500" 
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzFmMjkzNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5GPC90ZXh0Pjwvc3ZnPg==';
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-gray-600 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">CF</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {selectedFile.displayName}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Versión: {selectedFile.displayName} - ID: {selectedFile.id}
                      </div>
                      <div className="text-xs text-gray-400">
                        {selectedFile.gameVersions.join(', ')}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {selectedFile.downloadCount} descargas • {Math.round(selectedFile.fileLength / 1024 / 1024)} MB
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-gray-700 bg-gray-800/80">
          {error && (
            <div className="text-red-500 text-sm mb-4">{error}</div>
          )}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDownload}
              disabled={loading || !selectedFile}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium transition-all duration-200 shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              Descargar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DownloadModalCurseForge;