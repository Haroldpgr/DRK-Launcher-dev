import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { ModrinthAPI_Handler, ModrinthProject, ModrinthVersion } from '../services/ModrinthAPI_Handler';
import { downloadService } from '../services/downloadService';

interface DownloadModalModrinthProps {
  isOpen: boolean;
  onClose: () => void;
  project: ModrinthProject;
  onDownloadComplete?: () => void;
}

const DownloadModalModrinth: React.FC<DownloadModalModrinthProps> = ({ 
  isOpen, 
  onClose, 
  project, 
  onDownloadComplete 
}) => {
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [selectedLoader, setSelectedLoader] = useState<string>('fabric'); // Default to Fabric
  const [customPath, setCustomPath] = useState<string>('');
  const [isCustomPathSelected, setIsCustomPathSelected] = useState<boolean>(false);
  const [versions, setVersions] = useState<ModrinthVersion[]>([]);
  const [compatibleVersions, setCompatibleVersions] = useState<ModrinthVersion[]>([]);
  const [selectedFileVersion, setSelectedFileVersion] = useState<ModrinthVersion | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [instances, setInstances] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && project) {
      loadProjectData();
    }
  }, [isOpen, project]);

  const loadProjectData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load instances
      if (window.api?.instances) {
        const userInstances = await window.api.instances.list();
        setInstances(userInstances);
      }

      // Load all versions for the project
      const allVersions = await new ModrinthAPI_Handler().getProjectVersions(project.id);
      setVersions(allVersions);
      
      // Set default compatible versions (all versions initially)
      setCompatibleVersions(allVersions);
      
      // Set first version as default if available
      if (allVersions.length > 0) {
        setSelectedVersion(allVersions[0].version_number);
        setSelectedFileVersion(allVersions[0]);
      }
    } catch (err) {
      console.error('Error loading project data:', err);
      setError('Error al cargar los datos del proyecto. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleVersionChange = (versionNumber: string) => {
    setSelectedVersion(versionNumber);
    const version = versions.find(v => v.version_number === versionNumber);
    if (version) {
      setSelectedFileVersion(version);
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
    if (!selectedFileVersion) {
      setError('Por favor, selecciona una versión para descargar.');
      return;
    }

    try {
      // Find the primary file or first file in the version
      const primaryFile = selectedFileVersion.files.find(f => f.primary) || selectedFileVersion.files[0];
      
      if (!primaryFile) {
        setError('No se encontró un archivo para descargar.');
        return;
      }

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
        primaryFile.url,
        primaryFile.filename,
        `${project.title} ${selectedFileVersion.version_number}`
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

  // Filter compatible versions based on selected loader
  useEffect(() => {
    if (versions.length > 0) {
      const filtered = versions.filter(version => 
        !selectedLoader || version.loaders.includes(selectedLoader)
      );
      setCompatibleVersions(filtered);
      
      // Update selected file version if it's no longer compatible
      if (selectedFileVersion && !filtered.some(v => v.id === selectedFileVersion.id)) {
        const newSelected = filtered[0] || null;
        setSelectedFileVersion(newSelected);
        if (newSelected) {
          setSelectedVersion(newSelected.version_number);
        }
      }
    }
  }, [versions, selectedLoader, selectedFileVersion]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="w-full max-w-2xl bg-gray-800 rounded-xl border border-gray-700 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              {project.icon_url && (
                <img 
                  src={project.icon_url} 
                  alt={project.title} 
                  className="w-16 h-16 rounded-lg object-cover border border-gray-600" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzFmMjkzNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5NPC90ZXh0Pjwvc3ZnPg==';
                  }}
                />
              )}
              <div>
                <h2 className="text-xl font-bold text-white">{project.title}</h2>
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
                    {compatibleVersions.map(version => (
                      <option key={version.id} value={version.version_number}>
                        {version.game_versions.join(', ')} - {version.version_number} ({version.version_type})
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
                  Plataforma (Loader):
                </label>
                <div className="flex flex-wrap gap-2">
                  {['fabric', 'forge', 'quilt', 'neoforge'].map(loader => (
                    <button
                      key={loader}
                      onClick={() => setSelectedLoader(loader)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        selectedLoader === loader
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                          : 'bg-gray-700/70 text-gray-300 hover:bg-gray-600/80'
                      }`}
                    >
                      {loader.charAt(0).toUpperCase() + loader.slice(1)}
                    </button>
                  ))}
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
              {selectedFileVersion && (
                <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                  <h4 className="font-medium text-gray-200 mb-2">Detalles del Archivo Seleccionado:</h4>
                  <div className="flex items-start space-x-3">
                    {project.icon_url && (
                      <img 
                        src={project.icon_url} 
                        alt={project.title} 
                        className="w-10 h-10 rounded object-cover border border-gray-500" 
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzFmMjkzNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5GPC90ZXh0Pjwvc3ZnPg==';
                        }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {selectedFileVersion.name}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Versión: {selectedFileVersion.version_number}
                      </div>
                      <div className="text-xs text-gray-400">
                        {selectedFileVersion.loaders.join(', ')} - {selectedFileVersion.game_versions.join(', ')}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {selectedFileVersion.downloads} descargas
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
              disabled={loading || !selectedFileVersion}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium transition-all duration-200 shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              Descargar Contenido
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DownloadModalModrinth;