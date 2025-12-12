import React, { useEffect, useMemo, useState } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import IconButton from '../components/IconButton'
import ProfileDropdown from '../components/ProfileDropdown'
import { Profile } from '../services/profileService';
import HomeServerCard from '../components/HomeServerCard';
import { getDefaultPlaceholder } from '../utils/imagePlaceholder';

type NewsItem = { id: string; title: string; body: string }
type Instance = { id: string; name: string; version: string; loader?: string }

type HomeProps = {
  onAddAccount: (username: string, type?: 'microsoft' | 'non-premium' | 'elyby' | 'yggdrasil') => void;
  onDeleteAccount: (username: string) => void;
  onSelectAccount: (username: string) => void;
  onLoginClick: () => void;
  onPlay: (instanceId: string) => void;
  currentUser: string | null;
  accounts: Profile[];
}

export default function Home({ onAddAccount, onDeleteAccount, onSelectAccount, onLoginClick, onPlay, currentUser, accounts }: HomeProps) {
  const [feed, setFeed] = useState<NewsItem[]>([])
  const [instances, setInstances] = useState<Instance[]>([])
  const [modpacks, setModpacks] = useState<any[]>([]); // Estado para almacenar modpacks de Modrinth
  const [modpacksCurseForge, setModpacksCurseForge] = useState<any[]>([]); // Estado para almacenar modpacks de CurseForge
  const [shaders, setShaders] = useState<any[]>([]); // Estado para almacenar shaders de Modrinth
  const [shadersCurseForge, setShadersCurseForge] = useState<any[]>([]); // Estado para almacenar shaders de CurseForge
  const [servers, setServers] = useState<any[]>([]); // Estado para almacenar servidores
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const last = useMemo(() => instances[instances.length - 1], [instances])

  useEffect(() => {
    setFeed([
      { id: 'welcome', title: '🎮 ¡Bienvenido a DRK Launcher!', body: 'Explora miles de mods, modpacks, shaders y más. Crea tu primera instancia y comienza tu aventura.' },
      { id: 'update', title: '✨ Nueva Actualización Disponible', body: 'Mejoras de rendimiento, nuevas funciones y correcciones de errores. ¡Actualiza ahora desde Ajustes!' },
      { id: 'tips', title: '💡 Consejo del Día', body: 'Configura Java y RAM desde Ajustes para mejor rendimiento. Usa al menos 4GB de RAM para modpacks grandes.' },
      { id: 'community', title: '👥 Únete a la Comunidad', body: 'Comparte tus creaciones, pide ayuda y descubre nuevas formas de jugar con otros jugadores.' }
    ])
  }, [])

  // Función para cargar instancias
  const loadInstances = async () => {
    try {
      // Cargar instancias
      if (window.api?.instances?.list) {
        const allInstances = await window.api.instances.list();

        // Importar y usar el servicio de perfil para filtrar instancias
        // Filtrar instancias que pertenecen al perfil actual del usuario
        // Usamos una lógica similar a la de Instances.tsx
        if (currentUser) {
          // Si hay un perfil actual, filtrar instancias asociadas a ese perfil
          // (esto requiere usar el servicio de perfil que se usa en la página de instancias)
          import('../services/instanceProfileService').then(({ instanceProfileService }) => {
            const profileInstanceIds = instanceProfileService.getInstancesForProfile(currentUser);
            const profileInstances = allInstances.filter(instance =>
              profileInstanceIds.includes(instance.id)
            );
            setInstances(profileInstances);
          }).catch(() => {
            // Si no se puede importar el servicio de perfil, usar todas las instancias como fallback
            setInstances(allInstances);
          });
        } else {
          // Si no hay perfil actual, usar todas las instancias como fallback
          setInstances(allInstances);
        }
      }
    } catch (error) {
      console.error("Error al cargar instancias:", error);
    }
  };

  // Función para auto-detectar y validar instancias
  const autoDetectAndLoadInstances = async () => {
    try {
      // Primero, escanear el directorio y registrar instancias que no están en la base de datos
      if (window.api?.instances?.scanAndRegister) {
        try {
          const scanResult = await window.api.instances.scanAndRegister();
          console.log(`Registro automático en Home completado: ${scanResult.count} instancias nuevas registradas`);
        } catch (scanError) {
          console.error('Error al escanear y registrar instancias en Home:', scanError);
        }
      }

      // Cargar instancias
      if (window.api?.instances?.list) {
        const allInstances = await window.api.instances.list();

        // Si hay un perfil actual, filtrar instancias asociadas a ese perfil
        if (currentUser) {
          // Importar y usar el servicio de perfil para filtrar instancias
          import('../services/instanceProfileService').then(({ instanceProfileService }) => {
            // Verificar si hay instancias en el directorio de instancias que no están registradas
            // para el perfil actual
            for (const instance of allInstances) {
              const profileInstanceIds = instanceProfileService.getInstancesForProfile(currentUser);
              if (!profileInstanceIds.includes(instance.id)) {
                // La instancia no está asociada al perfil actual
                const otherProfile = instanceProfileService.getProfileForInstance(instance.id);
                if (!otherProfile) {
                  // La instancia no está asociada a ningún perfil, asociarla al perfil actual
                  instanceProfileService.linkInstanceToProfile(instance.id, currentUser);
                }
              }
            }

            // Ahora cargar instancias filtradas para este perfil
            const profileInstanceIds = instanceProfileService.getInstancesForProfile(currentUser);
            const profileInstances = allInstances.filter(instance =>
              profileInstanceIds.includes(instance.id)
            );
            setInstances(profileInstances);
          }).catch(() => {
            // Si no se puede importar el servicio de perfil, usar todas las instancias como fallback
            setInstances(allInstances);
          });
        } else {
          // Si no hay perfil actual, usar todas las instancias como fallback
          setInstances(allInstances);
        }
      }
    } catch (error) {
      console.error("Error al cargar instancias:", error);
    }
  };

  useEffect(() => {
    // Cargar instancias con validación
    autoDetectAndLoadInstances();

    // Cargar modpacks recomendados
    if (window.api?.modrinth?.search) {
      window.api.modrinth.search({
        contentType: 'modpacks',
        search: ''
      }).then((modpacksList: any) => {
        // Tomar solo los primeros 3 modpacks
        const topModpacks = modpacksList.slice(0, 3);
        setModpacks(topModpacks);
      }).catch((error: any) => {
        console.error("Error al cargar modpacks:", error);
        // En caso de error, usar datos de respaldo
        setModpacks([
          { id: 'opt', name: 'Optimizado', description: 'Paquete de rendimiento y gráficos suaves', tags: ['Optimización'], imageUrl: getDefaultPlaceholder() },
          { id: 'adventure', name: 'Aventura+', description: 'Explora mazmorras y nuevas dimensiones', tags: ['Aventura'], imageUrl: getDefaultPlaceholder() },
          { id: 'builder', name: 'Constructor', description: 'Bloques y herramientas para creativos', tags: ['Construcción'], imageUrl: getDefaultPlaceholder() }
        ]);
      });
    }

    // Cargar shaders recomendados de Modrinth
    if (window.api?.modrinth?.search) {
      window.api.modrinth.search({
        contentType: 'shaders',
        search: ''
      }).then((shadersList: any) => {
        // Tomar solo los primeros 3 shaders
        const topShaders = shadersList.slice(0, 3);
        setShaders(topShaders);
      }).catch((error: any) => {
        console.error("Error al cargar shaders:", error);
        // En caso de error, usar datos de respaldo
        setShaders([
          { id: 's1', name: 'Oculus', description: 'Shaderpack de alto rendimiento con efectos visuales realistas', imageUrl: getDefaultPlaceholder() },
          { id: 's2', name: 'BSL', description: 'Shaderpack con iluminación dinámica y sombras realistas', imageUrl: getDefaultPlaceholder() },
          { id: 's3', name: 'SEUS', description: 'Shaderpack con efectos de luz y sombra de alta calidad', imageUrl: getDefaultPlaceholder() }
        ]);
      });
    }

    // Cargar modpacks de CurseForge (usando la misma lógica que ContentPage)
    if (window.api?.curseforge?.search) {
      window.api.curseforge.search({
        contentType: 'modpacks',
        search: ''
      }).then((modpacksList: any) => {
        // Los resultados ya vienen mapeados desde curseforgeService con imageUrl correcto
        // Tomar solo los primeros 3 modpacks
        const topModpacks = modpacksList.slice(0, 3);
        setModpacksCurseForge(topModpacks);
      }).catch((error: any) => {
        console.error("Error al cargar modpacks de CurseForge:", error);
        setModpacksCurseForge([]);
      });
    }

    // Cargar shaders de CurseForge (usando la misma lógica que ContentPage)
    if (window.api?.curseforge?.search) {
      window.api.curseforge.search({
        contentType: 'shaders',
        search: ''
      }).then((shadersList: any) => {
        // Los resultados ya vienen mapeados desde curseforgeService con imageUrl correcto
        // Tomar solo los primeros 3 shaders
        const topShaders = shadersList.slice(0, 3);
        setShadersCurseForge(topShaders);
      }).catch((error: any) => {
        console.error("Error al cargar shaders de CurseForge:", error);
        setShadersCurseForge([]);
      });
    }

    // Cargar servidores recomendados
    // Aquí puedes cargar servidores desde una API o desde una configuración local
    setServers([
      {
        id: 'server1',
        name: 'Hypixel',
        ip: 'mc.hypixel.net',
        description: 'El servidor multijugador más grande de Minecraft con minijuegos, SkyBlock y más',
        category: 'Minijuegos',
        thumbnail: 'https://api.minetools.eu/favicon/mc.hypixel.net'
      },
      {
        id: 'server2',
        name: 'Minecade',
        ip: 'play.minecade.net',
        description: 'Minijuegos competitivos con torneos regulares y modos únicos',
        category: 'Minijuegos',
        thumbnail: 'https://api.minetools.eu/favicon/play.minecade.net'
      },
      {
        id: 'server3',
        name: 'Empire Minecraft',
        ip: 'play.emc.gs',
        description: 'Uno de los servidores de survival más grandes con economía y facciones',
        category: 'Factions',
        thumbnail: 'https://api.minetools.eu/favicon/play.emc.gs'
      }
    ]);
  }, [currentUser]) // Agregar currentUser como dependencia para refrescar cuando cambie el perfil

  const play = async () => { if (!last) return; onPlay(last.id); }

  const connectToServer = (ip: string) => {
    navigator.clipboard.writeText(ip)
      .then(() => {
        setNotification({ message: `IP copiada: ${ip}`, type: 'success' });
        setTimeout(() => setNotification(null), 3000);
      })
      .catch(() => {
        setNotification({ message: 'Error al copiar la IP', type: 'error' });
        setTimeout(() => setNotification(null), 3000);
      });
  }

  return (
    <div className="grid grid-cols-4 gap-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          notification.type === 'success'
            ? 'bg-green-600 text-white'
            : 'bg-red-600 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="col-span-3 space-y-6">
        <Card>
          <div className="text-2xl font-bold text-gray-100">¡Bienvenido, {currentUser || 'Usuario'}!</div>
        </Card>

        <Card>
          <div className="text-xl font-semibold mb-4 text-gray-200">Continuar</div>
          {last ? (
            <div className="flex items-center justify-between bg-gray-800/60 backdrop-blur-sm p-4 rounded-xl border border-gray-700/50">
              <div>
                <div className="font-medium text-gray-100">{last.name}</div>
                <div className="text-sm text-gray-400">{last.version} {last.loader}</div>
              </div>
              <div className="flex gap-2">
                <Button onClick={play}>Jugar</Button>
                <Button variant="secondary" onClick={() => location.assign('#/instances')}>Más opciones</Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-400 py-4 text-center">No hay instancias aún. Crea una para empezar.</div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="text-xl font-semibold text-gray-200">Descubre un modpack de Modrinth</div>
            <Button variant="secondary" onClick={() => location.assign('#/contenido/modpacks?platform=modrinth')}>Ver más</Button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {modpacks.map(m => (
              <div key={m.id} className="rounded-xl overflow-hidden bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 transition-transform hover:scale-[1.02]">
                <img
                  src={m.imageUrl || m.img}
                  alt={m.name}
                  className="w-full h-32 object-cover"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = getDefaultPlaceholder();
                  }}
                />
                <div className="p-3">
                  <div className="font-medium mb-1 text-gray-100">{m.title || m.name}</div>
                  <div className="text-sm text-gray-400 mb-2">{m.description}</div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => location.assign(`#/contenido/modpacks/${m.id}`)}
                    >
                      Ver
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Sección de modpacks de CurseForge */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="text-xl font-semibold text-gray-200">Descubre un modpack de CurseForge</div>
            <Button variant="secondary" onClick={() => {
              window.location.hash = '/contenido/modpacks?platform=curseforge';
            }}>Ver más</Button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {modpacksCurseForge.length > 0 ? modpacksCurseForge.map(m => (
              <div key={m.id} className="rounded-xl overflow-hidden bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 transition-transform hover:scale-[1.02]">
                <img
                  src={m.imageUrl || getDefaultPlaceholder()}
                  alt={m.name || m.title}
                  className="w-full h-32 object-cover"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = getDefaultPlaceholder();
                  }}
                />
                <div className="p-3">
                  <div className="font-medium mb-1 text-gray-100">{m.title || m.name}</div>
                  <div className="text-sm text-gray-400 mb-2">{m.description || 'Sin descripción disponible'}</div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        window.location.hash = `/contenido/modpacks/${m.id}?platform=curseforge`;
                      }}
                    >
                      Ver
                    </Button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-3 text-center text-gray-400 py-8">Cargando modpacks de CurseForge...</div>
            )}
          </div>
        </Card>

        {/* Sección de shaders de Modrinth */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="text-xl font-semibold text-gray-200">Descubre shaders de Modrinth</div>
            <Button variant="secondary" onClick={() => location.assign('#/contenido/shaders?platform=modrinth')}>Ver más</Button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {shaders.map(s => (
              <div key={s.id} className="rounded-xl overflow-hidden bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 transition-transform hover:scale-[1.02]">
                <img
                  src={s.imageUrl || s.img}
                  alt={s.name}
                  className="w-full h-32 object-cover"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = getDefaultPlaceholder();
                  }}
                />
                <div className="p-3">
                  <div className="font-medium mb-1 text-gray-100">{s.title || s.name}</div>
                  <div className="text-sm text-gray-400 mb-2">{s.description}</div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => location.assign(`#/contenido/shaders/${s.id}`)}
                    >
                      Ver
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Sección de shaders de CurseForge */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="text-xl font-semibold text-gray-200">Descubre shaders de CurseForge</div>
            <Button variant="secondary" onClick={() => {
              window.location.hash = '/contenido/shaders?platform=curseforge';
            }}>Ver más</Button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {shadersCurseForge.length > 0 ? shadersCurseForge.map(s => (
              <div key={s.id} className="rounded-xl overflow-hidden bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 transition-transform hover:scale-[1.02]">
                <img
                  src={s.imageUrl || getDefaultPlaceholder()}
                  alt={s.title || s.name || 'Shader'}
                  className="w-full h-32 object-cover"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== getDefaultPlaceholder()) {
                      target.src = getDefaultPlaceholder();
                    }
                  }}
                />
                <div className="p-3">
                  <div className="font-medium mb-1 text-gray-100">{s.title || s.name || 'Sin nombre'}</div>
                  <div className="text-sm text-gray-400 mb-2">{s.description || 'Sin descripción disponible'}</div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        window.location.hash = `/contenido/shaders/${s.id}?platform=curseforge`;
                      }}
                    >
                      Ver
                    </Button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-3 text-center text-gray-400 py-8">Cargando shaders de CurseForge...</div>
            )}
          </div>
        </Card>

        {/* Sección de servidores */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="text-xl font-semibold text-gray-200">Servidores recomendados</div>
            <Button variant="secondary" onClick={() => location.assign('#/servers')}>Ver más</Button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {servers.map(server => (
              <HomeServerCard
                key={server.id}
                id={server.id}
                name={server.name}
                ip={server.ip}
                description={server.description}
                thumbnail={server.thumbnail}
                category={server.category}
                onConnect={connectToServer}
              />
            ))}
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <div className="text-xl font-semibold mb-2 text-gray-200">Noticias</div>
          <div className="space-y-2">
            {feed.map(x => (
              <div key={x.id} className="p-3 bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700/50">
                <div className="font-medium text-gray-100">{x.title}</div>
                <div className="text-sm text-gray-400">{x.body}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="text-xl font-semibold mb-2 text-gray-200">Cumplimiento</div>
          <div className="text-sm text-gray-400">DRK Launcher no distribuye contenido protegido. Necesitas una copia legítima de Minecraft para jugar.</div>
        </Card>
        <Card>
          <div className="text-xl font-semibold mb-2 text-gray-200">Perfil</div>
          <ProfileDropdown
            currentUser={currentUser}
            profiles={accounts}
            onSelectAccount={onSelectAccount}
            onAddAccount={() => onLoginClick()}
            onDeleteAccount={onDeleteAccount}
            onLoginClick={onLoginClick}
          />
        </Card>

        {/* Recuadros de anuncios */}
        <Card>
          <div className="text-xl font-semibold mb-4 text-gray-200">Anuncios</div>
          <div className="space-y-3">
            {/* Anuncio 1 */}
            <div className="p-4 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 backdrop-blur-sm rounded-xl border border-blue-700/30 hover:border-blue-600/50 transition-all cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white">¡Nueva Actualización!</div>
                  <div className="text-xs text-blue-300">Descubre las últimas mejoras</div>
                </div>
              </div>
            </div>

            {/* Anuncio 2 */}
            <div className="p-4 bg-gradient-to-r from-purple-900/40 to-pink-900/40 backdrop-blur-sm rounded-xl border border-purple-700/30 hover:border-purple-600/50 transition-all cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white">Modpacks Destacados</div>
                  <div className="text-xs text-purple-300">Explora los más populares</div>
                </div>
              </div>
            </div>

            {/* Anuncio 3 */}
            <div className="p-4 bg-gradient-to-r from-green-900/40 to-emerald-900/40 backdrop-blur-sm rounded-xl border border-green-700/30 hover:border-green-600/50 transition-all cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white">Soporte Premium</div>
                  <div className="text-xs text-green-300">Obtén ayuda prioritaria</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}