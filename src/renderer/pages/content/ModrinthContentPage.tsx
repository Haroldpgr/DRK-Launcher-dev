import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { downloadService } from '../../services/downloadService';

type ContentType = 'modpacks' | 'mods' | 'resourcepacks' | 'datapacks' | 'shaders';
type SortBy = 'popular' | 'recent' | 'name';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  author: string;
  downloads: number;
  lastUpdated: string;
  minecraftVersions: string[];
  categories: string[];
  imageUrl: string;
  type: ContentType;
  version: string;
  downloadUrl?: string;
}

const ModrinthContentPage: React.FC = () => {
  const { type = 'mods' } = useParams<{ type?: ContentType }>();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedGameVersion, setSelectedGameVersion] = useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('');
  const [showCustomFolder, setShowCustomFolder] = useState<boolean>(false);
  const [customFolderPath, setCustomFolderPath] = useState<string>('');
  const [instances, setInstances] = useState<any[]>([]);

  // Cargar instancias
  useEffect(() => {
    const loadInstances = async () => {
      if (window.api?.instances) {
        const userInstances = await window.api.instances.list();
        setInstances(userInstances);
      }
    };
    loadInstances();
  }, []);

  // Cargar contenido de Modrinth
  useEffect(() => {
    const loadContent = async () => {
      setIsLoading(true);
      try {
        const results: ContentItem[] = await window.api.modrinth.search({
          contentType: type,
          search: searchQuery
        });
        setContent(results);
      } catch (error) {
        console.error('Error al cargar contenido de Modrinth:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (searchQuery || type) {
      loadContent();
    }
  }, [type, searchQuery]);

  const handleContentClick = (item: ContentItem) => {
    setSelectedContent(item);
  };

  const openDownloadModal = (item: ContentItem) => {
    setSelectedContent(item);
    setShowDownloadModal(true);
  };

  const handleDownload = async () => {
    if (!selectedContent) return;

    // Lógica de descarga para Modrinth
    if (!selectedInstanceId) {
      // Descarga directa
      try {
        // Obtener versiones disponibles
        const versions = await window.api.modrinth.getVersions(selectedContent.id);
        const targetVersion = versions.find((v: any) => 
          selectedGameVersion ? v.game_versions.includes(selectedGameVersion) : true
        ) || versions[0];

        if (targetVersion) {
          const primaryFile = targetVersion.files.find((f: any) => f.primary) || targetVersion.files[0];
          if (primaryFile) {
            downloadService.downloadFile(
              primaryFile.url,
              primaryFile.filename,
              selectedContent.title
            );
            alert(`Descarga iniciada para: ${selectedContent.title}`);
          }
        }
      } catch (error) {
        console.error('Error al descargar contenido de Modrinth:', error);
        alert('Error al descargar el contenido');
      }
    } else {
      // Instalación en instancia
      try {
        let instancePath = '';
        if (selectedInstanceId === 'custom') {
          instancePath = customFolderPath;
        } else {
          const selectedInstance = instances.find(instance => instance.id === selectedInstanceId);
          if (selectedInstance) {
            instancePath = selectedInstance.path;
          }
        }

        await window.api.instances.installContent({
          instancePath,
          contentId: selectedContent.id,
          contentType: selectedContent.type === 'resourcepacks' ? 'resourcepack' :
                     selectedContent.type === 'shaders' ? 'shader' :
                     selectedContent.type === 'datapacks' ? 'datapack' : 'mod',
          mcVersion: selectedGameVersion || '1.20.1',
          loader: selectedPlatform,
          platform: 'modrinth'
        });

        alert(`Contenido instalado en la instancia`);
      } catch (error) {
        console.error('Error al instalar contenido:', error);
        alert('Error al instalar el contenido');
      }
    }

    setShowDownloadModal(false);
  };

  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white capitalize">{type}</h1>
          <input
            type="text"
            placeholder={`Buscar ${type}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg w-64"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.map((item) => (
              <div 
                key={item.id} 
                className="bg-gray-800 rounded-xl p-4 hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
                onClick={() => handleContentClick(item)}
              >
                <div className="flex items-center space-x-4">
                  <img 
                    src={item.imageUrl} 
                    alt={item.title} 
                    className="w-16 h-16 rounded-lg object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzFmMjkzNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5NPC90ZXh0Pjwvc3ZnPg==';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate">{item.title}</h3>
                    <p className="text-gray-400 text-sm truncate">{item.author}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-gray-300 text-sm line-clamp-2">{item.description}</p>
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-xs text-gray-500">{item.downloads?.toLocaleString()} descargas</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      openDownloadModal(item);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm transition-colors duration-200"
                  >
                    Descargar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de descarga */}
      {showDownloadModal && selectedContent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <img 
                    src={selectedContent.imageUrl} 
                    alt={selectedContent.title} 
                    className="w-8 h-8 rounded mr-2 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzFmMjkzNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iOCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk08L3RleHQ+PC9zdmc+';
                    }}
                  />
                  {selectedContent.title}
                </h2>
                <button 
                  onClick={() => setShowDownloadModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {/* Seleccionar versión del juego */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Seleccionar la versión del juego
                  </label>
                  <div className="relative">
                    <select
                      value={selectedGameVersion}
                      onChange={(e) => setSelectedGameVersion(e.target.value)}
                      className="w-full bg-gray-700/80 backdrop-blur-sm border border-gray-600 rounded-xl py-3 px-4 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 appearance-none"
                    >
                      <option value="">Todas las versiones del juego</option>
                      {selectedContent.minecraftVersions.map((version, idx) => (
                        <option key={idx} value={version}>{version}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-300">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Seleccionar plataforma */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Seleccionar plataforma
                  </label>
                  <div className="relative">
                    <select
                      value={selectedPlatform}
                      onChange={(e) => setSelectedPlatform(e.target.value)}
                      className="w-full bg-gray-700/80 backdrop-blur-sm border border-gray-600 rounded-xl py-3 px-4 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 appearance-none"
                    >
                      <option value="">Seleccionar plataforma</option>
                      <option value="fabric">Fabric</option>
                      <option value="forge">Forge</option>
                      <option value="quilt">Quilt</option>
                      <option value="neoforge">NeoForge</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-300">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Destino de instalación */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Destino de instalación
                  </label>
                  <div className="relative">
                    <select
                      value={selectedInstanceId}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSelectedInstanceId(value);
                        setShowCustomFolder(value === 'custom');
                      }}
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Opción para carpeta personalizada */}
                {showCustomFolder && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Ruta personalizada:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customFolderPath}
                        onChange={(e) => setCustomFolderPath(e.target.value)}
                        placeholder="Selecciona una carpeta..."
                        className="flex-1 bg-gray-700/80 backdrop-blur-sm border border-gray-600 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                      />
                      <button
                        className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-medium transition-all duration-200"
                        onClick={async () => {
                          try {
                            if (window.api?.dialog?.showOpenDialog) {
                              const result = await window.api.dialog.showOpenDialog({
                                properties: ['openDirectory'],
                                title: 'Seleccionar carpeta de destino',
                                buttonLabel: 'Seleccionar'
                              });
                              if (!result.canceled && result.filePaths.length > 0) {
                                setCustomFolderPath(result.filePaths[0]);
                              }
                            }
                          } catch (error) {
                            console.error('Error al seleccionar carpeta:', error);
                          }
                        }}
                      >
                        Explorar
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowDownloadModal(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDownload}
                  disabled={!selectedGameVersion || !selectedInstanceId}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  Descargar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModrinthContentPage;