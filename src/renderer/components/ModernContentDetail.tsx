import React, { useState, useEffect } from 'react';
import { modrinthAPI } from '../services/ModrinthAPI_Handler';
import { curseForgeAPI } from '../services/CurseForgeAPI_Handler';

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
  type: string;
  version: string;
  downloadUrl?: string;
  platform: 'modrinth' | 'curseforge';
}

const ModernContentDetail: React.FC<{ selectedContent: ContentItem }> = ({ selectedContent }) => {
  const [activeTab, setActiveTab] = useState('description');
  const [contentDetails, setContentDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        if (selectedContent.platform === 'modrinth') {
          // Obtener información real del proyecto de Modrinth
          const project = await modrinthAPI.getProject(selectedContent.id);

          // Obtener también las versiones del proyecto
          const versions = await modrinthAPI.getProjectVersions(selectedContent.id);

          setContentDetails({
            description: project.description || project.body || selectedContent.description,
            screenshots: project.gallery?.map((ss: any) => ({
              url: ss.url,
              title: ss.title || `Screenshot ${ss.id}`
            })) || [],
            changelog: project.changelog || '', // El changelog real del proyecto
            versions: versions.map((version: any) => ({
              id: version.id,
              name: version.version_number || version.name,
              date: version.date_published || version.updated,
              type: version.version_type || 'release',
              files: version.files || [],
              game_versions: version.game_versions || [],
              loaders: version.loaders || []
            }))
          });
        } else if (selectedContent.platform === 'curseforge') {
          // Obtener información real del mod de CurseForge
          const modId = parseInt(selectedContent.id, 10);
          if (isNaN(modId)) {
            throw new Error('ID de mod inválido para CurseForge');
          }

          const mod = await curseForgeAPI.getMod(modId);
          const modFiles = await curseForgeAPI.getModFiles(modId);

          // Obtener también las versiones de juego compatibles desde los archivos
          const allGameVersions = new Set<string>();
          modFiles.forEach(file => {
            if (file.gameVersions && Array.isArray(file.gameVersions)) {
              file.gameVersions.forEach(version => allGameVersions.add(version));
            }
          });
          const gameVersionsArray = Array.from(allGameVersions);

          // Obtener las dependencias reales del mod usando la nueva función
          const modDependenciesInfo = await curseForgeAPI.getModDependencies(modId);
          const modDependencies = modDependenciesInfo.dependencies || [];

          // Procesar las dependencias con la estructura real de CurseForge API
          const processedRelations = modDependencies.map((dep: any) => ({
            id: dep.modId,
            name: dep.name || `Dependencia ${dep.modId}`,
            type: dep.type, // 1 = EmbeddedLibrary, 2 = OptionalDependency, 3 = RequiredDependency, 4 = Tool, 5 = Incompatible, 6 = Include
            addonId: dep.modId,
            mandatory: dep.mandatory || false
          }));

          setContentDetails({
            description: mod.summary || selectedContent.description,
            screenshots: mod.screenshots?.map((ss: any) => ({
              url: ss.url,
              title: ss.title || `Imagen ${ss.id}`
            })) || [],
            minecraftVersions: gameVersionsArray, // Agregar las versiones de Minecraft desde los archivos
            comments: [], // CurseForge tiene una API separada para comentarios
            files: modFiles?.map((file: any) => ({
              id: file.id,
              name: file.displayName || file.fileName,
              version: file.gameVersions?.join(', ') || 'N/A',
              size: `${(file.fileLength / (1024 * 1024)).toFixed(2)} MB`,
              releaseType: file.releaseType // 1 = Release, 2 = Beta, 3 = Alpha
            })) || [],
            relations: processedRelations
          });
        }
      } catch (err) {
        setError('Error al cargar los detalles del contenido');
        console.error('Error fetching content details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [selectedContent.id, selectedContent.platform]);

  const modrinthTabs = [
    { id: 'description', label: 'Descripción' },
    { id: 'gallery', label: 'Galería' },
    { id: 'changelog', label: 'Registro de cambios' },
    { id: 'versions', label: 'Versiones' }
  ];

  const curseforgeTabs = [
    { id: 'description', label: 'Descripción' },
    { id: 'comments', label: 'Comentarios' },
    { id: 'files', label: 'Archivos' },
    { id: 'gallery', label: 'Galería' },
    { id: 'relations', label: 'Relaciones' }
  ];

  const tabs = selectedContent.platform === 'modrinth' ? modrinthTabs : curseforgeTabs;

  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
        <div className="text-red-500 text-center py-8">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-gray-700/50 pb-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 relative ${
              activeTab === tab.id
                ? 'text-blue-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
        {activeTab === 'description' && (
          <div className="prose prose-invert max-w-none">
            <h3 className="text-xl font-bold text-white mb-4">Descripción</h3>
            <div 
              className="text-gray-300 leading-relaxed"
              dangerouslySetInnerHTML={{ 
                __html: contentDetails?.description?.replace(/\n/g, '<br>') || selectedContent.description || 'No hay descripción disponible para este contenido.'
              }}
            />
          </div>
        )}

        {activeTab === 'gallery' && (
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Galería de Imágenes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(contentDetails?.screenshots || []).map((img: any, idx: number) => (
                <div key={idx} className="aspect-video bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl overflow-hidden border border-gray-600/50 shadow-lg">
                  <img
                    src={img.url}
                    alt={img.title || `Galería ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = selectedContent.imageUrl;
                    }}
                  />
                </div>
              ))}
              {(contentDetails?.screenshots?.length === 0 || !contentDetails?.screenshots) && (
                <div className="col-span-full text-center text-gray-400 py-10">
                  No hay imágenes disponibles en la galería.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'changelog' && selectedContent.platform === 'modrinth' && (
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Registro de Cambios</h3>
            <div 
              className="text-gray-300 prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: contentDetails?.changelog?.replace(/\n/g, '<br>').replace(/##/g, '<h4 class="text-lg font-bold text-white mt-4">').replace(/\n-/g, '</h4><ul class="list-disc list-inside ml-4"><li>') + '</li></ul>' || 'No hay registro de cambios disponible.'
              }}
            />
          </div>
        )}

        {activeTab === 'versions' && selectedContent.platform === 'modrinth' && (
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Versiones Disponibles</h3>
            <div className="space-y-3">
              {(contentDetails?.versions || []).map((version: any, idx: number) => (
                <div key={idx} className="p-4 bg-gray-700/30 rounded-xl border border-gray-600/30 hover:bg-gray-700/50 transition-colors">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">{version.name}</span>
                    <span className="text-sm text-blue-400 bg-blue-400/10 px-2 py-1 rounded capitalize">
                      {version.type}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    Publicado: {new Date(version.date).toLocaleDateString('es-ES')}
                  </div>
                </div>
              ))}
              {(contentDetails?.versions?.length === 0 || !contentDetails.versions) && (
                <div className="text-gray-400 text-center py-4">
                  No hay versiones disponibles.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'comments' && selectedContent.platform === 'curseforge' && (
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Comentarios</h3>
            <div className="space-y-4">
              {(contentDetails?.comments || []).map((comment: any, idx: number) => (
                <div key={idx} className="p-4 bg-gray-700/30 rounded-xl border border-gray-600/30">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold mr-3">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-medium text-white">{comment.username}</div>
                      <div className="text-xs text-gray-400">{new Date(comment.date).toLocaleDateString('es-ES')}</div>
                    </div>
                  </div>
                  <p className="text-gray-300 ml-11">{comment.content}</p>
                </div>
              ))}
              {(contentDetails?.comments?.length === 0 || !contentDetails.comments) && (
                <div className="text-gray-400 text-center py-4">
                  No hay comentarios disponibles.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'files' && selectedContent.platform === 'curseforge' && (
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Archivos Disponibles</h3>
            <div className="space-y-3">
              {(contentDetails?.files || []).map((file: any, idx: number) => (
                <div key={idx} className="p-4 bg-gray-700/30 rounded-xl border border-gray-600/30 hover:bg-gray-700/50 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-white">{file.name}</div>
                      <div className="text-sm text-gray-400">Versión: {file.version} · Tamaño: {file.size}</div>
                    </div>
                    <button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-all">
                      Descargar
                    </button>
                  </div>
                </div>
              ))}
              {(contentDetails?.files?.length === 0 || !contentDetails.files) && (
                <div className="text-gray-400 text-center py-4">
                  No hay archivos disponibles.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'relations' && selectedContent.platform === 'curseforge' && (
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Relaciones</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-bold text-blue-400 mb-3">Dependencias Requeridas</h4>
                <div className="space-y-2">
                  {(contentDetails?.relations || []).filter((rel: any) => rel.type === 3).map((dep: any, idx: number) => (
                    <div key={idx} className="p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
                      <div className="font-medium text-white">{dep.name}</div>
                      <div className="text-sm text-gray-400">
                        {dep.type === 1 ? 'Librería Incrustada' :
                         dep.type === 2 ? 'Dependencia Opcional' :
                         dep.type === 3 ? 'Dependencia Requerida' :
                         dep.type === 4 ? 'Herramienta' :
                         dep.type === 5 ? 'Incompatible' :
                         dep.type === 6 ? 'Incluido' : 'Dependencia'}
                      </div>
                    </div>
                  ))}
                  {contentDetails?.relations && contentDetails.relations.filter((rel: any) => rel.type === 3).length === 0 && (
                    <div className="text-gray-400 text-center py-2">
                      No hay dependencias requeridas.
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-bold text-emerald-400 mb-3">Dependencias Opcionales</h4>
                <div className="space-y-2">
                  {(contentDetails?.relations || []).filter((rel: any) => rel.type === 2).map((sug: any, idx: number) => (
                    <div key={idx} className="p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
                      <div className="font-medium text-white">{sug.name}</div>
                      <div className="text-sm text-gray-400">
                        {sug.type === 1 ? 'Librería Incrustada' :
                         sug.type === 2 ? 'Dependencia Opcional' :
                         sug.type === 3 ? 'Dependencia Requerida' :
                         sug.type === 4 ? 'Herramienta' :
                         sug.type === 5 ? 'Incompatible' :
                         sug.type === 6 ? 'Incluido' : 'Sugerencia'}
                      </div>
                    </div>
                  ))}
                  {contentDetails?.relations && contentDetails.relations.filter((rel: any) => rel.type === 2).length === 0 && (
                    <div className="text-gray-400 text-center py-2">
                      No hay dependencias opcionales.
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-bold text-amber-400 mb-3">Otras Relaciones</h4>
                <div className="space-y-2">
                  {(contentDetails?.relations || []).filter((rel: any) => ![2, 3].includes(rel.type)).map((other: any, idx: number) => (
                    <div key={idx} className="p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
                      <div className="font-medium text-white">{other.name}</div>
                      <div className="text-sm text-gray-400">
                        {other.type === 1 ? 'Librería Incrustada' :
                         other.type === 4 ? 'Herramienta' :
                         other.type === 5 ? 'Incompatible' :
                         other.type === 6 ? 'Incluido' : 'Relación'}
                      </div>
                    </div>
                  ))}
                  {contentDetails?.relations && contentDetails.relations.filter((rel: any) => ![2, 3].includes(rel.type)).length === 0 && (
                    <div className="text-gray-400 text-center py-2">
                      No hay otras relaciones.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernContentDetail;