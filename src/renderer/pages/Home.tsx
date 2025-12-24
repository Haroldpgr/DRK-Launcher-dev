import React, { useEffect, useMemo, useState, useCallback } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import IconButton from '../components/IconButton'
import ProfileDropdown from '../components/ProfileDropdown'
import { Profile } from '../services/profileService';
import HomeServerCard from '../components/HomeServerCard';
import { getDefaultPlaceholder } from '../utils/imagePlaceholder';
import AdWidget from '../components/AdWidget';
import TutorialOverlay from '../components/TutorialOverlay';
import { homeTutorialSteps } from '../data/tutorialSteps';
import FeedbackModal from '../components/FeedbackModal';

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
  const [isLaunching, setIsLaunching] = useState(false); // CRÍTICO: Protección contra dobles clics
  const [runningInstances, setRunningInstances] = useState<Set<string>>(new Set()); // Instancias en ejecución
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
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

  // Memoizar servidores estáticos para evitar re-crearlos en cada render
  const staticServers = useMemo(() => [
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
  ], []);

  // Cargar datos de forma optimizada
  useEffect(() => {
    let isMounted = true; // Flag para evitar actualizaciones de estado si el componente se desmonta

    // Cargar instancias con validación
    autoDetectAndLoadInstances();

    // Cargar modpacks recomendados (solo si no están cargados)
    if (window.api?.modrinth?.search && modpacks.length === 0) {
      window.api.modrinth.search({
        contentType: 'modpacks',
        search: ''
      }).then((modpacksList: any) => {
        if (!isMounted) return;
        const topModpacks = modpacksList.slice(0, 3);
        setModpacks(topModpacks);
      }).catch((error: any) => {
        if (!isMounted) return;
        console.error("Error al cargar modpacks:", error);
        setModpacks([
          { id: 'opt', name: 'Optimizado', description: 'Paquete de rendimiento y gráficos suaves', tags: ['Optimización'], imageUrl: getDefaultPlaceholder() },
          { id: 'adventure', name: 'Aventura+', description: 'Explora mazmorras y nuevas dimensiones', tags: ['Aventura'], imageUrl: getDefaultPlaceholder() },
          { id: 'builder', name: 'Constructor', description: 'Bloques y herramientas para creativos', tags: ['Construcción'], imageUrl: getDefaultPlaceholder() }
        ]);
      });
    }

    // Cargar shaders recomendados de Modrinth (solo si no están cargados)
    if (window.api?.modrinth?.search && shaders.length === 0) {
      window.api.modrinth.search({
        contentType: 'shaders',
        search: ''
      }).then((shadersList: any) => {
        if (!isMounted) return;
        const topShaders = shadersList.slice(0, 3);
        setShaders(topShaders);
      }).catch((error: any) => {
        if (!isMounted) return;
        console.error("Error al cargar shaders:", error);
        setShaders([
          { id: 's1', name: 'Oculus', description: 'Shaderpack de alto rendimiento con efectos visuales realistas', imageUrl: getDefaultPlaceholder() },
          { id: 's2', name: 'BSL', description: 'Shaderpack con iluminación dinámica y sombras realistas', imageUrl: getDefaultPlaceholder() },
          { id: 's3', name: 'SEUS', description: 'Shaderpack con efectos de luz y sombra de alta calidad', imageUrl: getDefaultPlaceholder() }
        ]);
      });
    }

    // Cargar modpacks de CurseForge (solo si no están cargados)
    if (window.api?.curseforge?.search && modpacksCurseForge.length === 0) {
      window.api.curseforge.search({
        contentType: 'modpacks',
        search: ''
      }).then((modpacksList: any) => {
        if (!isMounted) return;
        const topModpacks = modpacksList.slice(0, 3);
        setModpacksCurseForge(topModpacks);
      }).catch((error: any) => {
        if (!isMounted) return;
        console.error("Error al cargar modpacks de CurseForge:", error);
        setModpacksCurseForge([]);
      });
    }

    // Cargar shaders de CurseForge (solo si no están cargados)
    if (window.api?.curseforge?.search && shadersCurseForge.length === 0) {
      window.api.curseforge.search({
        contentType: 'shaders',
        search: ''
      }).then((shadersList: any) => {
        if (!isMounted) return;
        const topShaders = shadersList.slice(0, 3);
        setShadersCurseForge(topShaders);
      }).catch((error: any) => {
        if (!isMounted) return;
        console.error("Error al cargar shaders de CurseForge:", error);
        setShadersCurseForge([]);
      });
    }

    // Cargar servidores estáticos (solo una vez)
    if (servers.length === 0) {
      setServers(staticServers);
    }

    return () => {
      isMounted = false; // Cleanup: evitar actualizaciones después de desmontar
    };
  }, [currentUser, staticServers]) // Agregar currentUser como dependencia para refrescar cuando cambie el perfil

  // Polling para verificar instancias en ejecución
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    const checkRunningGames = async () => {
      if (window.api?.game?.isRunning) {
        try {
          const runningIds = await window.api.game.isRunning();
          setRunningInstances(new Set(runningIds));
        } catch (err) {
          console.error('[Home] Error al verificar juegos en ejecución:', err);
        }
      }
    };

    if (window.api) {
      intervalId = setInterval(checkRunningGames, 3000); // Verificar cada 3 segundos
      checkRunningGames(); // Verificar inmediatamente
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // Función para cancelar el juego
  const handleCancelGame = async (instanceId: string) => {
    if (!window.api?.game?.kill) {
      setNotification({ message: 'La API para cancelar el juego no está disponible.', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    try {
      await window.api.game.kill(instanceId);
      setNotification({ message: 'Juego cancelado exitosamente', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
      setRunningInstances(prev => {
        const newSet = new Set(prev);
        newSet.delete(instanceId);
        return newSet;
      });
    } catch (error) {
      console.error(`[Home] Error al cancelar juego ${instanceId}:`, error);
      setNotification({ message: 'Error al cancelar el juego', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // CRÍTICO: Protección contra dobles clics y ejecuciones múltiples
  const play = useCallback(async () => {
    if (!last) return;
    
    // CRÍTICO: Verificar si ya hay un lanzamiento en progreso o el juego está corriendo
    if (isLaunching || runningInstances.has(last.id)) {
      console.warn(`[Home] ⚠️ BLOQUEADO: Ya hay un lanzamiento en progreso o el juego está corriendo para la instancia ${last.id}. Ignorando doble clic.`);
      return;
    }
    
    // Marcar que hay un lanzamiento en progreso
    setIsLaunching(true);
    console.log(`[Home] Iniciando lanzamiento para instancia: ${last.id}`);
    
    try {
      await onPlay(last.id);
    } catch (error) {
      console.error(`[Home] Error al lanzar instancia ${last.id}:`, error);
    } finally {
      // Limpiar el flag después de un delay para permitir que el proceso se inicie
      setTimeout(() => {
        setIsLaunching(false);
        console.log(`[Home] Flag de lanzamiento limpiado para instancia: ${last.id}`);
      }, 5000); // 5 segundos deberían ser suficientes
    }
  }, [last, isLaunching, onPlay, runningInstances]);

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

        <Card data-tutorial="recent-instances">
          <div className="text-xl font-semibold mb-4 text-gray-200">Continuar</div>
          {last ? (
            <div className="flex items-center justify-between bg-gray-800/60 backdrop-blur-sm p-4 rounded-xl border border-gray-700/50">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                <div className="font-medium text-gray-100">{last.name}</div>
                  {runningInstances.has(last.id) && (
                    <div className="flex items-center gap-1.5 bg-green-500/20 border border-green-500/50 rounded-full px-2 py-0.5">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-400 font-medium">En ejecución</span>
                    </div>
                  )}
                  {isLaunching && !runningInstances.has(last.id) && (
                    <div className="flex items-center gap-1.5 bg-blue-500/20 border border-blue-500/50 rounded-full px-2 py-0.5">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-blue-400 font-medium">Iniciando...</span>
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-400">{last.version} {last.loader}</div>
              </div>
              <div className="flex gap-2">
                {runningInstances.has(last.id) ? (
                  <Button 
                    onClick={() => handleCancelGame(last.id)}
                    variant="danger"
                  >
                    Cancelar
                  </Button>
                ) : (
                <Button onClick={play} disabled={isLaunching || !last}>
                  {isLaunching ? 'Iniciando...' : 'Jugar'}
                </Button>
                )}
                <Button variant="secondary" onClick={() => location.assign('#/instances')}>Más opciones</Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-400 py-4 text-center">No hay instancias aún. Crea una para empezar.</div>
          )}
        </Card>

        <Card data-tutorial="recommended-modpacks">
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
        {/* Botón de Feedback */}
        <Card>
          <Button
            onClick={() => setShowFeedbackModal(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-lg hover:shadow-xl"
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg">💬</span>
              <span>Enviar Recomendación o Feedback</span>
            </div>
          </Button>
        </Card>

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

        {/* Zona de Anuncios */}
        <Card>
          <div className="text-xl font-semibold mb-4 text-gray-200">Anuncios</div>
          <div className="space-y-4">
            {/* Anuncio 1 - Puedes usar anuncios propios o Google AdSense */}
            <AdWidget 
              adId="home-ad-1" 
              type="card"
              showPlaceholder={false} // Cambiar a false cuando tengas anuncios reales
              // Para anuncios propios, descomenta y configura:
              // adUrl="https://tu-sitio.com"
              // adImage="/ruta/a/imagen.jpg"
              // adTitle="Título del Anuncio"
              // adDescription="Descripción del anuncio aquí"
              className="w-full"
            />

            {/* Anuncio 2 */}
            <AdWidget 
              adId="home-ad-2" 
              type="card"
              showPlaceholder={false} // Cambiar a false cuando tengas anuncios reales
              className="w-full"
            />

            {/* Anuncio 3 */}
            <AdWidget 
              adId="home-ad-3" 
              type="card"
              showPlaceholder={false} // Cambiar a false cuando tengas anuncios reales
              className="w-full"
            />
          </div>
        </Card>
      </div>

      {/* Tutorial Overlay */}
      <TutorialOverlay pageId="home" steps={homeTutorialSteps} />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />
    </div>
  )
}