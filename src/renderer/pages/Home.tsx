import React, { useEffect, useMemo, useState } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import IconButton from '../components/IconButton'
import ProfileDropdown from '../components/ProfileDropdown'
import { Profile } from '../services/profileService';

type NewsItem = { id: string; title: string; body: string }
type Instance = { id: string; name: string; version: string; loader?: string }

type HomeProps = {
  onAddAccount: (username: string, type?: 'microsoft' | 'non-premium') => void;
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
  const [modpacks, setModpacks] = useState<any[]>([]); // Estado para almacenar modpacks
  const [shaders, setShaders] = useState<any[]>([]); // Estado para almacenar shaders
  const [servers, setServers] = useState<any[]>([]); // Estado para almacenar servidores
  const last = useMemo(() => instances[instances.length - 1], [instances])

  useEffect(() => {
    setFeed([
      { id: 'welcome', title: 'Bienvenido a DRK Launcher', body: 'Crea tu primera instancia y explora modpacks.' },
      { id: 'tips', title: 'Consejo', body: 'Configura Java y RAM desde Ajustes para mejor rendimiento.' }
    ])
  }, [])

  useEffect(() => {
    // Cargar instancias
    if (window.api?.instances?.list) {
      window.api.instances.list().then((l: any) => setInstances(l));
    }

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
          { id: 'opt', name: 'Optimizado', description: 'Paquete de rendimiento y gráficos suaves', tags: ['Optimización'], imageUrl: 'https://via.placeholder.com/600x300/1f2937/9ca3af?text=Sin+imagen' },
          { id: 'adventure', name: 'Aventura+', description: 'Explora mazmorras y nuevas dimensiones', tags: ['Aventura'], imageUrl: 'https://via.placeholder.com/600x300/1f2937/9ca3af?text=Sin+imagen' },
          { id: 'builder', name: 'Constructor', description: 'Bloques y herramientas para creativos', tags: ['Construcción'], imageUrl: 'https://via.placeholder.com/600x300/1f2937/9ca3af?text=Sin+imagen' }
        ]);
      });
    }

    // Cargar shaders recomendados
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
          { id: 's1', name: 'Oculus', description: 'Shaderpack de alto rendimiento con efectos visuales realistas', imageUrl: 'https://via.placeholder.com/600x300/1f2937/9ca3af?text=Sin+imagen' },
          { id: 's2', name: 'BSL', description: 'Shaderpack con iluminación dinámica y sombras realistas', imageUrl: 'https://via.placeholder.com/600x300/1f2937/9ca3af?text=Sin+imagen' },
          { id: 's3', name: 'SEUS', description: 'Shaderpack con efectos de luz y sombra de alta calidad', imageUrl: 'https://via.placeholder.com/600x300/1f2937/9ca3af?text=Sin+imagen' }
        ]);
      });
    }

    // Cargar servidores recomendados
    // Aquí puedes cargar servidores desde una API o desde una configuración local
    setServers([
      { id: 'server1', name: 'Hypixel', ip: 'mc.hypixel.net' },
      { id: 'server2', name: 'Mineplex', ip: 'us.mineplex.com' },
      { id: 'server3', name: 'CubeCraft', ip: 'play.cubecraft.net' }
    ]);
  }, [])

  const play = async () => { if (!last) return; onPlay(last.id); }

  return (
    <div className="grid grid-cols-4 gap-6">
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
            <div className="text-xl font-semibold text-gray-200">Descubre un modpack</div>
            <Button variant="secondary" onClick={() => location.assign('#/contenido/modpacks')}>Ver más</Button>
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
                    target.src = 'https://via.placeholder.com/600x300/1f2937/9ca3af?text=Sin+imagen';
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

        {/* Sección de shaders */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="text-xl font-semibold text-gray-200">Descubre shaders</div>
            <Button variant="secondary" onClick={() => location.assign('#/contenido/shaders')}>Ver más</Button>
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
                    target.src = 'https://via.placeholder.com/600x300/1f2937/9ca3af?text=Sin+imagen';
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

        {/* Sección de servidores */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="text-xl font-semibold text-gray-200">Servidores recomendados</div>
            <Button variant="secondary" onClick={() => location.assign('#/servers')}>Ver más</Button>
          </div>
          <div className="space-y-3">
            {servers.map(server => (
              <div key={server.id} className="flex items-center justify-between bg-gray-800/60 backdrop-blur-sm p-3 rounded-xl border border-gray-700/50">
                <div>
                  <div className="font-medium text-gray-100">{server.name}</div>
                  <div className="text-sm text-gray-400">{server.ip}</div>
                </div>
                <Button variant="secondary">Conectar</Button>
              </div>
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
            onAddAccount={onAddAccount}
            onDeleteAccount={onDeleteAccount}
            onLoginClick={onLoginClick}
          />
        </Card>
      </div>
    </div>
  )
}