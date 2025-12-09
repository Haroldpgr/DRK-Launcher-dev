import React, { useEffect, useState } from 'react';
import ServerCard from '../components/ServerCard';
import Button from '../components/Button';

interface ServerInfo {
  id: string;
  name: string;
  ip: string;
  country?: string;
  category?: string;
  thumbnail?: string;
  requiredVersion?: string;
  modsHint?: string;
  favorite?: boolean;
  description?: string;
  website?: string;
  playerCount?: number;
  maxPlayers?: number;
  version?: string;
  online?: boolean;
}

export default function Servers() {
  const [list, setList] = useState<ServerInfo[]>([]);
  const [status, setStatus] = useState<Record<string, { online: boolean; players: number; version: string }>>({});
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingServer, setEditingServer] = useState<ServerInfo | null>(null);
  const [serverToDelete, setServerToDelete] = useState<string | null>(null);

  useEffect(() => {
    window.api.servers.list().then((servers) => {
      // If no servers exist, add all sample servers
      if (servers.length === 0) {
        const sampleServers: ServerInfo[] = [
          {
            id: 'hypixel-' + Date.now(),
            name: 'Hypixel',
            ip: 'mc.hypixel.net',
            description: 'El servidor multijugador más grande de Minecraft con minijuegos, SkyBlock y más',
            category: 'Minijuegos',
            website: 'https://hypixel.net',
            thumbnail: 'https://api.minetools.eu/favicon/mc.hypixel.net'
          },
          {
            id: 'mineplex-' + Date.now(),
            name: 'Mineplex',
            ip: 'us.mineplex.com',
            description: 'Servidor de minijuegos premium con modos únicos y eventos de temporada',
            category: 'Minijuegos',
            website: 'https://www.mineplex.com',
            thumbnail: 'https://api.minetools.eu/favicon/us.mineplex.com'
          },
          {
            id: 'cubecraft-' + Date.now(),
            name: 'CubeCraft',
            ip: 'play.cubecraft.net',
            description: 'Popular servidor de SkyWars, SkyBlock y otros minijuegos de calidad',
            category: 'Minijuegos',
            website: 'https://www.cubecraft.net',
            thumbnail: 'https://api.minetools.eu/favicon/play.cubecraft.net'
          },
          {
            id: 'minehq-' + Date.now(),
            name: 'MineHQ',
            ip: 'play.minehq.net',
            description: 'Servidor de minijuegos con SkyBlock, survival y más',
            category: 'Minijuegos',
            website: 'https://www.minehq.net',
            thumbnail: 'https://api.minetools.eu/favicon/play.minehq.net'
          },
          {
            id: 'gommehd-' + Date.now(),
            name: 'GommeHD',
            ip: 'eu.gommehd.net',
            description: 'Servidor de minijuegos de alta calidad en Europa',
            category: 'Minijuegos',
            website: 'https://gommehd.net',
            thumbnail: 'https://api.minetools.eu/favicon/eu.gommehd.net'
          },
          {
            id: '2b2t-' + Date.now(),
            name: '2B2T',
            ip: '2b2t.org',
            description: 'El servidor anárquico más antiguo de Minecraft',
            category: 'Survival Anarquía',
            website: 'https://2b2t.org',
            thumbnail: 'https://api.minetools.eu/favicon/2b2t.org'
          },
          {
            id: 'mccentral-' + Date.now(),
            name: 'MCCentral',
            ip: 'play.mccentral.org',
            description: 'Servidor de survival con comunidades activas y eventos frecuentes',
            category: 'Survival',
            website: 'https://www.mccentral.org',
            thumbnail: 'https://api.minetools.eu/favicon/play.mccentral.org'
          },
          {
            id: 'minecade-' + Date.now(),
            name: 'MineCade',
            ip: 'play.minecade.net',
            description: 'Minijuegos competitivos con torneos regulares y modos únicos',
            category: 'Minijuegos',
            website: 'https://www.minecade.net',
            thumbnail: 'https://api.minetools.eu/favicon/play.minecade.net'
          },
          {
            id: 'playmc-' + Date.now(),
            name: 'PlayMC',
            ip: 'mc.play.net',
            description: 'Servidor multijugador con minijuegos clásicos y comunidad activa',
            category: 'Minijuegos',
            website: 'https://play.net',
            thumbnail: 'https://api.minetools.eu/favicon/mc.play.net'
          },
          {
            id: 'dragonrealms-' + Date.now(),
            name: 'DragonRealms',
            ip: 'mc.dragonrealms.net',
            description: 'RPG con mazmorras, dragones y progresión de clases épica',
            category: 'RPG',
            website: 'https://www.dragonrealms.net',
            thumbnail: 'https://api.minetools.eu/favicon/mc.dragonrealms.net'
          },
          {
            id: 'empireminecraft-' + Date.now(),
            name: 'Empire Minecraft',
            ip: 'play.emc.gs',
            description: 'Uno de los servidores de survival más grandes con economía y facciones',
            category: 'Factions',
            website: 'https://www.empireminecraft.com',
            thumbnail: 'https://api.minetools.eu/favicon/play.emc.gs'
          },
          {
            id: 'minekraft-' + Date.now(),
            name: 'MineKraft',
            ip: 'eu.minekraft.com',
            description: 'Servidor europeo con minijuegos y modos de juego únicos',
            category: 'Minijuegos',
            website: 'https://www.minekraft.com',
            thumbnail: 'https://api.minetools.eu/favicon/eu.minekraft.com'
          },
          {
            id: 'oc.tc-' + Date.now(),
            name: 'Overcast Network',
            ip: 'oc.tc',
            description: 'Servidor especializado en PvP y juegos competitivos',
            category: 'PvP',
            website: 'https://oc.tc',
            thumbnail: 'https://api.minetools.eu/favicon/oc.tc'
          },
          {
            id: 'mineplex-' + Date.now(),
            name: 'Build Battle',
            ip: 'us.buildbattle.net',
            description: 'Competiciones de construcción con temas semanales y temporadas',
            category: 'Construcción',
            website: 'https://buildbattle.net',
            thumbnail: 'https://api.minetools.eu/favicon/us.buildbattle.net'
          },
          {
            id: 'pixelart-' + Date.now(),
            name: 'PixelArt Server',
            ip: 'play.pixelart.io',
            description: 'Servidor dedicado a creaciones artísticas y proyectos comunitarios',
            category: 'Creativo',
            website: 'https://pixelart.io',
            thumbnail: 'https://api.minetools.eu/favicon/play.pixelart.io'
          },
          {
            id: 'westeroscraft-' + Date.now(),
            name: 'WesterosCraft',
            ip: 'play.westeroscraft.com',
            description: 'Mundo épico basado en Game of Thrones con construcción y roles',
            category: 'Roleplay',
            website: 'https://www.westeroscraft.com',
            thumbnail: 'https://api.minetools.eu/favicon/play.westeroscraft.com'
          }
        ];
        setList(sampleServers);
        window.api.servers.save(sampleServers);
      } else {
        // Si ya existen servidores, verificar si faltan servidores de ejemplo
        const currentServerNames = servers.map(s => s.name);
        const sampleServers: ServerInfo[] = [
          {
            id: 'hypixel-' + Date.now() + '-backup',
            name: 'Hypixel',
            ip: 'mc.hypixel.net',
            description: 'El servidor multijugador más grande de Minecraft con minijuegos, SkyBlock y más',
            category: 'Minijuegos',
            website: 'https://hypixel.net',
            thumbnail: 'https://api.minetools.eu/favicon/mc.hypixel.net'
          },
          {
            id: 'mineplex-' + Date.now() + '-backup',
            name: 'Mineplex',
            ip: 'us.mineplex.com',
            description: 'Servidor de minijuegos premium con modos únicos y eventos de temporada',
            category: 'Minijuegos',
            website: 'https://www.mineplex.com',
            thumbnail: 'https://api.minetools.eu/favicon/us.mineplex.com'
          },
          {
            id: 'cubecraft-' + Date.now() + '-backup',
            name: 'CubeCraft',
            ip: 'play.cubecraft.net',
            description: 'Popular servidor de SkyWars, SkyBlock y otros minijuegos de calidad',
            category: 'Minijuegos',
            website: 'https://www.cubecraft.net',
            thumbnail: 'https://api.minetools.eu/favicon/play.cubecraft.net'
          },
          {
            id: 'minehq-' + Date.now() + '-backup',
            name: 'MineHQ',
            ip: 'play.minehq.net',
            description: 'Servidor de minijuegos con SkyBlock, survival y más',
            category: 'Minijuegos',
            website: 'https://www.minehq.net',
            thumbnail: 'https://api.minetools.eu/favicon/play.minehq.net'
          },
          {
            id: 'gommehd-' + Date.now() + '-backup',
            name: 'GommeHD',
            ip: 'eu.gommehd.net',
            description: 'Servidor de minijuegos de alta calidad en Europa',
            category: 'Minijuegos',
            website: 'https://gommehd.net',
            thumbnail: 'https://api.minetools.eu/favicon/eu.gommehd.net'
          },
          {
            id: '2b2t-' + Date.now() + '-backup',
            name: '2B2T',
            ip: '2b2t.org',
            description: 'El servidor anárquico más antiguo de Minecraft',
            category: 'Survival Anarquía',
            website: 'https://2b2t.org',
            thumbnail: 'https://api.minetools.eu/favicon/2b2t.org'
          },
          {
            id: 'mccentral-' + Date.now() + '-backup',
            name: 'MCCentral',
            ip: 'play.mccentral.org',
            description: 'Servidor de survival con comunidades activas y eventos frecuentes',
            category: 'Survival',
            website: 'https://www.mccentral.org',
            thumbnail: 'https://api.minetools.eu/favicon/play.mccentral.org'
          },
          {
            id: 'minecade-' + Date.now() + '-backup',
            name: 'MineCade',
            ip: 'play.minecade.net',
            description: 'Minijuegos competitivos con torneos regulares y modos únicos',
            category: 'Minijuegos',
            website: 'https://www.minecade.net',
            thumbnail: 'https://api.minetools.eu/favicon/play.minecade.net'
          },
          {
            id: 'playmc-' + Date.now() + '-backup',
            name: 'PlayMC',
            ip: 'mc.play.net',
            description: 'Servidor multijugador con minijuegos clásicos y comunidad activa',
            category: 'Minijuegos',
            website: 'https://play.net',
            thumbnail: 'https://api.minetools.eu/favicon/mc.play.net'
          },
          {
            id: 'dragonrealms-' + Date.now() + '-backup',
            name: 'DragonRealms',
            ip: 'mc.dragonrealms.net',
            description: 'RPG con mazmorras, dragones y progresión de clases épica',
            category: 'RPG',
            website: 'https://www.dragonrealms.net',
            thumbnail: 'https://api.minetools.eu/favicon/mc.dragonrealms.net'
          },
          {
            id: 'empireminecraft-' + Date.now() + '-backup',
            name: 'Empire Minecraft',
            ip: 'play.emc.gs',
            description: 'Uno de los servidores de survival más grandes con economía y facciones',
            category: 'Factions',
            website: 'https://www.empireminecraft.com',
            thumbnail: 'https://api.minetools.eu/favicon/play.emc.gs'
          },
          {
            id: 'minekraft-' + Date.now() + '-backup',
            name: 'MineKraft',
            ip: 'eu.minekraft.com',
            description: 'Servidor europeo con minijuegos y modos de juego únicos',
            category: 'Minijuegos',
            website: 'https://www.minekraft.com',
            thumbnail: 'https://api.minetools.eu/favicon/eu.minekraft.com'
          },
          {
            id: 'oc.tc-' + Date.now() + '-backup',
            name: 'Overcast Network',
            ip: 'oc.tc',
            description: 'Servidor especializado en PvP y juegos competitivos',
            category: 'PvP',
            website: 'https://oc.tc',
            thumbnail: 'https://api.minetools.eu/favicon/oc.tc'
          },
          {
            id: 'mineplex-' + Date.now() + '-backup',
            name: 'Build Battle',
            ip: 'us.buildbattle.net',
            description: 'Competiciones de construcción con temas semanales y temporadas',
            category: 'Construcción',
            website: 'https://buildbattle.net',
            thumbnail: 'https://api.minetools.eu/favicon/us.buildbattle.net'
          },
          {
            id: 'pixelart-' + Date.now() + '-backup',
            name: 'PixelArt Server',
            ip: 'play.pixelart.io',
            description: 'Servidor dedicado a creaciones artísticas y proyectos comunitarios',
            category: 'Creativo',
            website: 'https://pixelart.io',
            thumbnail: 'https://api.minetools.eu/favicon/play.pixelart.io'
          },
          {
            id: 'westeroscraft-' + Date.now() + '-backup',
            name: 'WesterosCraft',
            ip: 'play.westeroscraft.com',
            description: 'Mundo épico basado en Game of Thrones con construcción y roles',
            category: 'Roleplay',
            website: 'https://www.westeroscraft.com',
            thumbnail: 'https://api.minetools.eu/favicon/play.westeroscraft.com'
          }
        ];

        // Filtrar servidores de ejemplo que aún no existen
        const missingServers = sampleServers.filter(sampleServer =>
          !currentServerNames.includes(sampleServer.name)
        );

        if (missingServers.length > 0) {
          const updatedServers = [...servers, ...missingServers];
          setList(updatedServers);
          window.api.servers.save(updatedServers);
        } else {
          setList(servers);
        }
      }
    });
  }, []);

  const [newServer, setNewServer] = useState<Omit<ServerInfo, 'id'>>({
    name: '',
    ip: '',
    description: '',
    category: '',
    website: '',
    thumbnail: ''
  });

  const handleAddServer = (serverData: Omit<ServerInfo, 'id'>) => {
    const newServer: ServerInfo = {
      ...serverData,
      id: Math.random().toString(36).slice(2)
    };
    setList(prev => [...prev, newServer]);
    setShowAddModal(false);
    setNewServer({
      name: '',
      ip: '',
      description: '',
      category: '',
      website: '',
      thumbnail: ''
    });
  };

  const handleUpdateServer = (serverData: ServerInfo) => {
    setList(prev =>
      prev.map(server =>
        server.id === editingServer?.id ? serverData : server
      )
    );
    setEditingServer(null);
  };

  const handleDeleteServer = (id: string) => {
    setList(prev => prev.filter(server => server.id !== id));
    setServerToDelete(null);
  };

  const save = async () => {
    try {
      await window.api.servers.save(list);
      setNotification({ message: 'Servidores guardados correctamente', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      setNotification({ message: 'Error al guardar servidores', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const ping = async (id: string, ip: string) => {
    try {
      const s = await window.api.servers.ping(ip);
      setStatus(prev => ({ ...prev, [id]: s }));
    } catch (error) {
      setNotification({ message: 'Error al hacer ping al servidor', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const copyIP = (ip: string) => {
    navigator.clipboard.writeText(ip)
      .then(() => {
        setNotification({ message: 'IP copiada al portapapeles', type: 'success' });
        setTimeout(() => setNotification(null), 3000);
      })
      .catch(() => {
        setNotification({ message: 'Error al copiar IP', type: 'error' });
        setTimeout(() => setNotification(null), 3000);
      });
  };

  const visitWebsite = (website: string) => {
    if (website) {
      window.open(website, '_blank');
    }
  };

  const toggleFavorite = (id: string) => {
    setList(prev =>
      prev.map(server =>
        server.id === id ? { ...server, favorite: !server.favorite } : server
      )
    );
  };

  const AddServerModal = () => {
    const [formData, setFormData] = useState<Omit<ServerInfo, 'id'>>({
      name: newServer.name,
      ip: newServer.ip,
      description: newServer.description,
      category: newServer.category,
      website: newServer.website,
      thumbnail: newServer.thumbnail
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleAddServer(formData);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    };

    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800/90 backdrop-blur-md rounded-xl border border-gray-700/50 w-full max-w-md p-6">
          <h2 className="text-xl font-bold text-white mb-4">Añadir Servidor</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700/70 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">IP del Servidor</label>
              <input
                type="text"
                name="ip"
                value={formData.ip}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700/70 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Descripción</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 bg-gray-700/70 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Categoría</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700/70 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">URL del Sitio Web</label>
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700/70 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">URL de la Imagen</label>
              <input
                type="text"
                name="thumbnail"
                value={formData.thumbnail}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700/70 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
              >
                Añadir
              </button>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const DeleteConfirmationModal = () => {
    const serverToBeDeleted = list.find(server => server.id === serverToDelete);

    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800/90 backdrop-blur-md rounded-xl border border-gray-700/50 w-full max-w-md p-6">
          <h2 className="text-xl font-bold text-white mb-2">Confirmar Eliminación</h2>
          <p className="text-gray-300 mb-4">
            ¿Estás seguro de que deseas eliminar el servidor <strong>{serverToBeDeleted?.name}</strong>?
          </p>
          <p className="text-gray-400 text-sm mb-6">
            Esta acción no se puede deshacer y el servidor será eliminado permanentemente.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => handleDeleteServer(serverToDelete!)}
              className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
            >
              Eliminar
            </button>
            <button
              onClick={() => setServerToDelete(null)}
              className="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  };

  const add = () => {
    setNewServer({
      name: '',
      ip: '',
      description: '',
      category: '',
      website: '',
      thumbnail: ''
    });
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Servidores de Minecraft</h1>
          <p className="text-gray-400">Accede rápidamente a tus servidores favoritos</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={add} className="bg-indigo-600 hover:bg-indigo-500">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Añadir Servidor
          </Button>
          <Button onClick={save} className="bg-green-600 hover:bg-green-500">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Guardar
          </Button>
        </div>
      </div>

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

      {/* Server Grid */}
      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50 w-full max-w-md">
            <svg className="w-16 h-16 mx-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
            </svg>
            <h3 className="text-lg font-medium text-white mt-4">No hay servidores</h3>
            <p className="text-gray-400 mt-2">Añade tu primer servidor para comenzar</p>
            <button
              onClick={add}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
            >
              Añadir Servidor
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map(server => (
            <ServerCard
              key={server.id}
              server={server}
              status={status[server.id] || null}
              onCopyIP={copyIP}
              onVisitWebsite={visitWebsite}
              onPing={ping}
              onToggleFavorite={toggleFavorite}
              onDelete={() => setServerToDelete(server.id)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showAddModal && <AddServerModal />}
      {serverToDelete && <DeleteConfirmationModal />}
    </div>
  );
}
