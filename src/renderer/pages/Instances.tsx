import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Profile, profileService } from '../services/profileService'
import { instanceProfileService } from '../services/instanceProfileService'
import CreateInstanceModal from '../components/CreateInstanceModal'

type InstanceType = 'owned' | 'imported' | 'shared';

type Instance = {
  id: string
  name: string
  version: string
  loader?: 'vanilla' | 'forge' | 'fabric' | 'quilt' | 'liteloader'
  createdAt: number
  path: string
  lastPlayed?: number
  totalTimePlayed?: number // en milisegundos
  type: InstanceType; // Tipo de instancia: owned (creada), imported (importada), shared (compartida)
  source?: string; // Origen de la instancia (path, url, etc.) para las importadas/compartidas
}

interface InstanceCardProps {
  instance: Instance
  onPlay: (id: string) => void
  onOpenFolder: (id: string) => void
  onEdit: (instance: Instance) => void
  onDelete: (id: string) => void
  onViewDetails: (instance: Instance) => void
  isReady?: (instance: Instance) => boolean
}

const InstanceCard: React.FC<InstanceCardProps> = ({ instance, onPlay, onOpenFolder, onEdit, onDelete, onViewDetails, isReady }) => {
  const formatTime = (milliseconds: number | undefined) => {
    if (!milliseconds) return '0 min';
    const minutes = Math.floor(milliseconds / (1000 * 60));
    if (minutes < 60) {
      return `${minutes} min`;
    } else if (minutes < 1440) { // menos de un día
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}min`;
    } else {
      const days = Math.floor(minutes / 1440);
      const hours = Math.floor((minutes % 1440) / 60);
      return `${days}d ${hours}h`;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -5 }}
      className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 transition-all duration-300 hover:bg-gray-800/70 hover:border-gray-600/50"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-white truncate max-w-[70%]">{instance.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-gray-700/50 text-gray-300 px-2 py-1 rounded-full">
              {instance.version}
            </span>
            {instance.loader && (
              <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded-full">
                {instance.loader}
              </span>
            )}
            <span className={`text-xs px-2 py-1 rounded-full ${
              instance.type === 'owned'
                ? 'bg-green-900/50 text-green-300'
                : instance.type === 'imported'
                  ? 'bg-yellow-900/50 text-yellow-300'
                  : 'bg-purple-900/50 text-purple-300'
            }`}>
              {instance.type === 'owned'
                ? 'Creada'
                : instance.type === 'imported'
                  ? 'Importada'
                  : 'Compartida'}
            </span>
          </div>
        </div>
        <div className="text-xs text-gray-400">
          {formatDate(instance.createdAt)}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm text-gray-400">
          <div>Jugado: {instance.lastPlayed ? formatDate(instance.lastPlayed) : 'Nunca'}</div>
          <div>Tiempo total: {formatTime(instance.totalTimePlayed)}</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => onPlay(instance.id)}
          className="flex-1 min-w-[70px] px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors text-sm"
        >
          Jugar
        </button>
        <button
          onClick={() => onOpenFolder(instance.id)}
          className="flex-1 min-w-[70px] px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
        >
          Carpeta
        </button>
        <button
          onClick={() => onViewDetails(instance)}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        <button
          onClick={() => onEdit(instance)}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(instance.id)}
          className="px-3 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </motion.div>
  )
}

type InstancesProps = {
  onPlay: (id: string) => void;
};

export default function Instances({ onPlay }: InstancesProps) {
  const [instances, setInstances] = useState<Instance[]>([])
  const [ownedInstances, setOwnedInstances] = useState<Instance[]>([])
  const [importedInstances, setImportedInstances] = useState<Instance[]>([])
  const [sharedInstances, setSharedInstances] = useState<Instance[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'owned' | 'imported' | 'shared'>('all')
  const [editing, setEditing] = useState<Instance | null>(null)
  const [newName, setNewName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null)
  const [showInstanceDetails, setShowInstanceDetails] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importSource, setImportSource] = useState('')
  const [importType, setImportType] = useState<'link' | 'folder'>('link')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Estado para rastrear si las instancias están listas para jugar
  const [readyStatus, setReadyStatus] = useState<Record<string, boolean>>({});

  // Función para verificar si una instancia está lista para jugar
  // Verifica si los archivos esenciales están presentes
  const checkInstanceReady = (instance: Instance): boolean => {
    // En una implementación completa, se verificaría la existencia de client.jar u otros archivos
    // En esta versión, asumimos que está lista si tiene un path y no está marcada como incompleta
    return instance.path && instance.path.length > 0;
  };

  // Función para refrescar la lista de instancias
  const refreshInstances = async () => {
    if (!selectedProfile) return;

    // Asegurarse de que window.api y window.api.instances estén disponibles
    if (!window.api?.instances) {
      setError('Servicio de instancias no disponible aún. Esperando inicialización...');
      return;
    }

    try {
      const allInstances = await window.api.instances.list();

      // Filtrar instancias que pertenecen al perfil seleccionado
      const profileInstanceIds = instanceProfileService.getInstancesForProfile(selectedProfile);
      const profileInstances = allInstances.filter(instance =>
        profileInstanceIds.includes(instance.id)
      );

      // Determinar el tipo de instancia
      const classifiedInstances = profileInstances.map(instance => {
        // Si la instancia tiene una propiedad que indica que fue importada o compartida
        // o si tiene una URL o path externo, se clasifica como importada
        let type: InstanceType = 'owned'; // Por defecto, asumimos que es propia

        // Si la instancia fue creada a través de importación o compartición
        if (instance.source) {
          if (instance.source.startsWith('http')) {
            // Si el origen es una URL, probablemente sea importada o compartida
            type = 'imported';
          } else if (instance.source.includes('\\') || instance.source.includes('/')) {
            // Si el origen es una ruta de archivo, podría ser importada
            type = 'imported';
          }
        } else {
          // Si no tiene origen definido, probablemente sea una instancia creada localmente
          type = 'owned';
        }

        const timePlayed = instanceProfileService.getPlayTime(instance.id, selectedProfile);
        return {
          ...instance,
          totalTimePlayed: timePlayed,
          type: type
        };
      });

      setInstances(classifiedInstances);
      classifyInstances(classifiedInstances);
      setError(null); // Limpiar error si todo funciona
    } catch (err) {
      console.error('Error al cargar las instancias:', err);
      setError(`Error al cargar las instancias: ${(err as Error).message || 'Error desconocido'}`);
    }
  };

  // Cargar perfiles y validar instancias
  useEffect(() => {
    try {
      const allProfiles = profileService.getAllProfiles()
      setProfiles(allProfiles)
      if (allProfiles.length > 0) {
        // Selecciona el perfil actual o el primero
        const currentProfile = profileService.getCurrentProfile()
        if (currentProfile) {
          setSelectedProfile(currentProfile)
        } else {
          setSelectedProfile(allProfiles[0].username)
        }
      }
    } catch (err) {
      console.error('Error al cargar perfiles:', err)
      setError('Error al cargar perfiles')
    }
  }, [])

  // Función para auto-detectar y validar instancias existentes
  const autoDetectInstances = async () => {
    if (!window.api?.instances || !selectedProfile) return;

    try {
      // Primero, escanear el directorio y registrar instancias que no están en la base de datos
      if (window.api.instances.scanAndRegister) {
        try {
          const scanResult = await window.api.instances.scanAndRegister();
          console.log(`Registro automático completado: ${scanResult.count} instancias nuevas registradas`);
        } catch (scanError) {
          console.error('Error al escanear y registrar instancias:', scanError);
        }
      }

      // Obtener todas las instancias existentes en el sistema (después del escaneo)
      const allSystemInstances = await window.api.instances.list();

      // Verificar si hay instancias en el directorio de instancias que no están registradas
      // Esto ayuda a detectar instancias que pudieron haber sido creadas anteriormente
      // pero no registradas en el perfil actual

      // Para cada instancia del sistema, verificar si está asociada a este perfil
      // y si no lo está, preguntar al usuario si quiere asociarlas
      for (const instance of allSystemInstances) {
        const profileInstanceIds = instanceProfileService.getInstancesForProfile(selectedProfile);
        if (!profileInstanceIds.includes(instance.id)) {
          // La instancia no está asociada al perfil actual, preguntar si se debe asociar
          // o si ya existe en otro perfil
          const otherProfile = instanceProfileService.getProfileForInstance(instance.id);
          if (!otherProfile) {
            // La instancia no está asociada a ningún perfil, podríamos preguntar al usuario
            // Por ahora, simplemente asociamos las instancias que no tienen perfil a este perfil
            instanceProfileService.linkInstanceToProfile(instance.id, selectedProfile);
          }
        }
      }

      // Recargar instancias con los vínculos actualizados
      const updatedList = await window.api.instances.list();
      // Filtrar instancias que pertenecen al perfil seleccionado
      const profileInstanceIds = instanceProfileService.getInstancesForProfile(selectedProfile);
      const profileInstances = updatedList.filter(instance =>
        profileInstanceIds.includes(instance.id)
      )

      // Determinar el tipo de instancia y actualizar las listas
      const classifiedInstances = profileInstances.map(instance => {
        let type: InstanceType = 'owned'; // Por defecto, asumimos que es propia

        // Si la instancia fue creada a través de importación o compartición
        if (instance.source) {
          if (instance.source.startsWith('http')) {
            // Si el origen es una URL, probablemente sea importada o compartida
            type = 'imported';
          } else if (instance.source.includes('\\') || instance.source.includes('/')) {
            // Si el origen es una ruta de archivo, podría ser importada
            type = 'imported';
          }
        } else {
          // Si no tiene origen definido, probablemente sea una instancia creada localmente
          type = 'owned';
        }

        const timePlayed = instanceProfileService.getPlayTime(instance.id, selectedProfile);
        return {
          ...instance,
          totalTimePlayed: timePlayed,
          type: type
        };
      });

      setInstances(classifiedInstances);
      classifyInstances(classifiedInstances);
      setError(null); // Limpiar error si todo funciona
    } catch (err) {
      console.error('Error en auto-detección de instancias:', err);
      setError(`Error en auto-detección de instancias: ${(err as Error).message || 'Error desconocido'}`);
    }
  };

  // Ejecutar auto-detección cuando se selecciona un perfil
  useEffect(() => {
    if (selectedProfile) {
      autoDetectInstances();
    }
  }, [selectedProfile]); // Solo se ejecuta cuando selectedProfile cambia

  // Clasificar instancias por tipo
  const classifyInstances = (instances: Instance[]) => {
    const owned = instances.filter(instance => instance.type === 'owned');
    const imported = instances.filter(instance => instance.type === 'imported');
    const shared = instances.filter(instance => instance.type === 'shared');

    setOwnedInstances(owned);
    setImportedInstances(imported);
    setSharedInstances(shared);
  };

  // Cargar instancias cuando se seleccione un perfil
  useEffect(() => {
    if (!selectedProfile) {
      setInstances([]);
      setOwnedInstances([]);
      setImportedInstances([]);
      setSharedInstances([]);
      return;
    }

    const fetchInstances = async () => {
      // Asegurarse de que window.api y window.api.instances estén disponibles
      if (!window.api?.instances) {
        setError('Servicio de instancias no disponible aún. Esperando inicialización...');
        // Reintentar después de un corto periodo
        setTimeout(() => {
          if (selectedProfile) fetchInstances();
        }, 1000);
        return;
      }

      try {
        const allInstances = await window.api.instances.list();

        // Filtrar instancias que pertenecen al perfil seleccionado
        const profileInstanceIds = instanceProfileService.getInstancesForProfile(selectedProfile);
        const profileInstances = allInstances.filter(instance =>
          profileInstanceIds.includes(instance.id)
        );

        // Determinar el tipo de instancia
        const classifiedInstances = profileInstances.map(instance => {
          // Si la instancia tiene una propiedad que indica que fue importada o compartida
          // o si tiene una URL o path externo, se clasifica como importada
          let type: InstanceType = 'owned'; // Por defecto, asumimos que es propia

          // Si la instancia fue creada a través de importación o compartición
          if (instance.source) {
            if (instance.source.startsWith('http')) {
              // Si el origen es una URL, probablemente sea importada o compartida
              type = 'imported';
            } else if (instance.source.includes('\\') || instance.source.includes('/')) {
              // Si el origen es una ruta de archivo, podría ser importada
              type = 'imported';
            }
          } else {
            // Si no tiene origen definido, probablemente sea una instancia creada localmente
            type = 'owned';
          }

          const timePlayed = instanceProfileService.getPlayTime(instance.id, selectedProfile);
          return {
            ...instance,
            totalTimePlayed: timePlayed,
            type: type
          };
        });

        setInstances(classifiedInstances);
        classifyInstances(classifiedInstances);
        setError(null); // Limpiar error si todo funciona
      } catch (err) {
        console.error('Error al cargar las instancias:', err);
        setError(`Error al cargar las instancias: ${(err as Error).message || 'Error desconocido'}`);
      }
    };

    fetchInstances();
  }, [selectedProfile]);

  const remove = async (id: string) => {
    // Verificar que la API esté completamente disponible
    if (!window.api?.instances) {
      setError('Servicio de instancias no disponible aún. Esperando inicialización...');
      return;
    }

    try {
      // Desvincular la instancia del perfil antes de eliminarla
      instanceProfileService.unlinkInstance(id)

      await window.api.instances.delete(id)
      const updatedList = await window.api.instances.list()
      // Filtrar instancias que pertenecen al perfil seleccionado
      const profileInstanceIds = instanceProfileService.getInstancesForProfile(selectedProfile || '')
      const profileInstances = updatedList.filter(instance =>
        profileInstanceIds.includes(instance.id)
      )

      // Determinar el tipo de instancia y actualizar las listas
      const classifiedInstances = profileInstances.map(instance => {
        let type: InstanceType = 'owned'; // Por defecto, asumimos que es propia

        // Si la instancia fue creada a través de importación o compartición
        if (instance.source) {
          if (instance.source.startsWith('http')) {
            // Si el origen es una URL, probablemente sea importada o compartida
            type = 'imported';
          } else if (instance.source.includes('\\') || instance.source.includes('/')) {
            // Si el origen es una ruta de archivo, podría ser importada
            type = 'imported';
          }
        } else {
          // Si no tiene origen definido, probablemente sea una instancia creada localmente
          type = 'owned';
        }

        const timePlayed = instanceProfileService.getPlayTime(instance.id, selectedProfile || '');
        return {
          ...instance,
          totalTimePlayed: timePlayed,
          type: type
        };
      });

      setInstances(classifiedInstances);
      classifyInstances(classifiedInstances);
    } catch (err) {
      console.error('Error al eliminar instancia:', err)
      setError(`Error al eliminar instancia: ${(err as Error).message || 'Error desconocido'}`)
    }
  }

  const open = async (id: string) => {
    // Verificar que la API esté completamente disponible
    if (!window.api?.instances) {
      setError('Servicio de instancias no disponible aún. Esperando inicialización...');
      return;
    }

    try {
      await window.api.instances.openFolder(id)
    } catch (err) {
      console.error('Error al abrir carpeta de instancia:', err)
      setError(`Error al abrir carpeta: ${(err as Error).message || 'Error desconocido'}`)
    }
  }

  const handlePlay = async (id: string) => {
    // Usar la función onPlay pasada como prop
    onPlay(id);
  }

  const startEdit = (instance: Instance) => {
    setEditing(instance)
    setNewName(instance.name)
  }

  const viewInstanceDetails = (instance: Instance) => {
    setSelectedInstance(instance)
    setShowInstanceDetails(true)
  }

  // Función para importar una instancia desde un link o carpeta
  const importInstance = async (source: string) => {
    // Verificar que la API esté completamente disponible
    if (!window.api?.instances) {
      setError('Servicio de instancias no disponible aún. Esperando inicialización...');
      return;
    }

    try {
      // Aquí se implementaría la lógica para importar la instancia
      // dependiendo de si es un link o una carpeta
      let importResult;

      if (source.startsWith('http')) {
        // Si es un enlace, intentar importar desde URL
        // importResult = await window.api.instances.importFromUrl(source);
        console.log("Importando desde URL:", source);
      } else {
        // Si es una ruta local, intentar importar desde carpeta
        // importResult = await window.api.instances.importFromPath(source);
        console.log("Importando desde carpeta:", source);
      }

      // Actualizar la lista de instancias
      const updatedList = await window.api.instances.list();
      // Filtrar instancias que pertenecen al perfil seleccionado
      const profileInstanceIds = instanceProfileService.getInstancesForProfile(selectedProfile || '');
      const profileInstances = updatedList.filter(instance =>
        profileInstanceIds.includes(instance.id)
      );

      // Determinar el tipo de instancia y actualizar las listas
      const classifiedInstances = profileInstances.map(instance => {
        let type: InstanceType = 'owned'; // Por defecto, asumimos que es propia

        // Si la instancia fue creada a través de importación o compartición
        if (instance.source) {
          if (instance.source.startsWith('http')) {
            // Si el origen es una URL, probablemente sea importada o compartida
            type = 'imported';
          } else if (instance.source.includes('\\') || instance.source.includes('/')) {
            // Si el origen es una ruta de archivo, podría ser importada
            type = 'imported';
          }
        } else {
          // Si no tiene origen definido, probablemente sea una instancia creada localmente
          type = 'owned';
        }

        const timePlayed = instanceProfileService.getPlayTime(instance.id, selectedProfile || '');
        return {
          ...instance,
          totalTimePlayed: timePlayed,
          type: type
        };
      });

      setInstances(classifiedInstances);
      classifyInstances(classifiedInstances);

    } catch (err) {
      console.error('Error al importar instancia:', err);
      setError(`Error al importar instancia: ${(err as Error).message || 'Error desconocido'}`);
    }
  };

  const saveEdit = async (id: string) => {
    // Verificar que la API esté completamente disponible
    if (!window.api?.instances) {
      setError('Servicio de instancias no disponible aún. Esperando inicialización...');
      return;
    }

    try {
      await window.api.instances.update({ id, patch: { name: newName } })
      const updatedList = await window.api.instances.list()

      // Filtrar instancias que pertenecen al perfil seleccionado
      const profileInstanceIds = instanceProfileService.getInstancesForProfile(selectedProfile || '')
      const profileInstances = updatedList.filter(instance =>
        profileInstanceIds.includes(instance.id)
      )

      // Determinar el tipo de instancia y actualizar las listas
      const classifiedInstances = profileInstances.map(instance => {
        let type: InstanceType = 'owned'; // Por defecto, asumimos que es propia

        // Si la instancia fue creada a través de importación o compartición
        if (instance.source) {
          if (instance.source.startsWith('http')) {
            // Si el origen es una URL, probablemente sea importada o compartida
            type = 'imported';
          } else if (instance.source.includes('\\') || instance.source.includes('/')) {
            // Si el origen es una ruta de archivo, podría ser importada
            type = 'imported';
          }
        } else {
          // Si no tiene origen definido, probablemente sea una instancia creada localmente
          type = 'owned';
        }

        const timePlayed = instanceProfileService.getPlayTime(instance.id, selectedProfile || '');
        return {
          ...instance,
          totalTimePlayed: timePlayed,
          type: type
        };
      });

      setInstances(classifiedInstances);
      classifyInstances(classifiedInstances);
      setEditing(null)
      setNewName('')
    } catch (err) {
      console.error('Error al guardar edición:', err)
      setError(`Error al guardar edición: ${(err as Error).message || 'Error desconocido'}`)
    }
  }

  // Filtrar instancias según término de búsqueda y pestaña activa
  const getFilteredInstances = () => {
    let instancesToShow: Instance[] = [];

    switch(activeTab) {
      case 'owned':
        instancesToShow = ownedInstances;
        break;
      case 'imported':
        instancesToShow = importedInstances;
        break;
      case 'shared':
        instancesToShow = sharedInstances;
        break;
      case 'all':
      default:
        instancesToShow = instances;
        break;
    }

    return instancesToShow.filter(instance =>
      instance.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredInstances = getFilteredInstances();

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-4 text-red-200">
          <h2 className="text-lg font-bold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Instancias de Minecraft</h1>
        <p className="text-gray-400">Gestiona tus instancias de juego y perfiles</p>
      </div>

      {/* Selector de pestañas */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 border-b border-gray-700/50">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-gray-700/50 text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
            }`}
          >
            Mis Instancias <span className="bg-gray-600/50 px-2 py-0.5 rounded-full text-xs ml-1">{instances.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('owned')}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              activeTab === 'owned'
                ? 'bg-gray-700/50 text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
            }`}
          >
            Creadas <span className="bg-gray-600/50 px-2 py-0.5 rounded-full text-xs ml-1">{ownedInstances.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('imported')}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              activeTab === 'imported'
                ? 'bg-gray-700/50 text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
            }`}
          >
            Importadas <span className="bg-gray-600/50 px-2 py-0.5 rounded-full text-xs ml-1">{importedInstances.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('shared')}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              activeTab === 'shared'
                ? 'bg-gray-700/50 text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
            }`}
          >
            Compartidas <span className="bg-gray-600/50 px-2 py-0.5 rounded-full text-xs ml-1">{sharedInstances.length}</span>
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Selector de perfil */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-300 mb-2">Perfil de usuario</label>
          <select
            value={selectedProfile || ''}
            onChange={(e) => setSelectedProfile(e.target.value)}
            className="w-full p-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {profiles.map(profile => (
              <option key={profile.id} value={profile.username}>
                {profile.username} ({profile.type === 'microsoft' ? 'Premium' : 'No premium'})
              </option>
            ))}
          </select>
        </div>

        {/* Barra de búsqueda */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-300 mb-2">Buscar instancia</label>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full p-3 pl-10 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Botones para crear/importar nueva instancia */}
      <div className="mb-6 flex flex-wrap gap-3 justify-end">
        <button
          onClick={() => setShowImportModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white rounded-xl transition-all duration-300 shadow-lg shadow-yellow-500/20 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Importar Instancia
        </button>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/20 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Crear Instancia
        </button>
      </div>

      {/* Modal de edición */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-gray-800/90 border border-gray-700/50 rounded-xl p-6 w-full max-w-md"
            >
              <h3 className="text-xl font-bold text-white mb-4">Editar Instancia</h3>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full p-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white mb-4"
                placeholder="Nombre de la instancia"
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => saveEdit(editing.id)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                  Guardar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de instancias */}
      {filteredInstances.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No hay instancias</h3>
          <p className="text-gray-500">Crea una nueva instancia para comenzar a jugar</p>
          <button className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl transition-all duration-300">
            Crear Primera Instancia
          </button>
        </div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {filteredInstances.map(instance => (
              <InstanceCard
                key={instance.id}
                instance={instance}
                onPlay={handlePlay}
                onOpenFolder={open}
                onEdit={startEdit}
                onDelete={remove}
                onViewDetails={viewInstanceDetails}
                isReady={checkInstanceReady}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>{filteredInstances.length} instancia{filteredInstances.length !== 1 ? 's' : ''} encontrada{filteredInstances.length !== 1 ? 's' : ''}</p>
      </div>

      <InstanceDetailsModal
        instance={selectedInstance}
        isOpen={showInstanceDetails}
        onClose={() => setShowInstanceDetails(false)}
        onPlay={handlePlay}
        onOpenFolder={open}
      />

      {/* Modal para importar instancias */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-gray-800/90 border border-gray-700/50 rounded-xl p-6 w-full max-w-md"
            >
              <h3 className="text-xl font-bold text-white mb-4">Importar Instancia</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de importación</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setImportType('link')}
                    className={`flex-1 py-2 rounded-lg border ${
                      importType === 'link'
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-gray-700/50 border-gray-600 text-gray-300'
                    }`}
                  >
                    Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportType('folder')}
                    className={`flex-1 py-2 rounded-lg border ${
                      importType === 'folder'
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-gray-700/50 border-gray-600 text-gray-300'
                    }`}
                  >
                    Carpeta
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {importType === 'link' ? 'URL de la instancia' : 'Ruta de la carpeta'}
                </label>
                <input
                  type="text"
                  value={importSource}
                  onChange={(e) => setImportSource(e.target.value)}
                  placeholder={importType === 'link' ? 'https://ejemplo.com/instancia.zip' : 'C:/ruta/a/la/carpeta'}
                  className="w-full p-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportSource('');
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    if (!importSource.trim()) {
                      setError('Por favor, introduce una URL o ruta válida');
                      return;
                    }

                    await importInstance(importSource);
                    setShowImportModal(false);
                    setImportSource('');
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                  Importar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal para crear instancias */}
      <CreateInstanceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => {
          // Refrescar la lista de instancias después de crear una nueva
          refreshInstances();
        }}
      />
    </div>
  )
}

// Componente para ver detalles de instancia
const InstanceDetailsModal: React.FC<{
  instance: Instance | null;
  isOpen: boolean;
  onClose: () => void;
  onPlay: (id: string) => void;
  onOpenFolder: (id: string) => void;
}> = ({ instance, isOpen, onClose, onPlay, onOpenFolder }) => {
  if (!isOpen || !instance) return null;

  const formatTime = (milliseconds: number | undefined) => {
    if (!milliseconds) return '0 min';
    const minutes = Math.floor(milliseconds / (1000 * 60));
    if (minutes < 60) {
      return `${minutes} min`;
    } else if (minutes < 1440) { // menos de un día
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}min`;
    } else {
      const days = Math.floor(minutes / 1440);
      const hours = Math.floor((minutes % 1440) / 60);
      return `${days}d ${hours}h`;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-2xl"
          >
            <div className="bg-gray-800/95 border border-gray-700/50 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">{instance.name}</h2>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm bg-gray-700/50 text-gray-300 px-3 py-1 rounded-full">
                        {instance.version}
                      </span>
                      {instance.loader && (
                        <span className="text-sm bg-blue-900/50 text-blue-300 px-3 py-1 rounded-full">
                          {instance.loader}
                        </span>
                      )}
                      <span className="text-sm bg-green-900/50 text-green-300 px-3 py-1 rounded-full">
                        Instancia
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-700/30 p-4 rounded-xl">
                    <h3 className="text-lg font-semibold text-white mb-3">Información General</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">ID:</span>
                        <span className="text-white font-mono text-sm">{instance.id.substring(0, 8)}...</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Versión:</span>
                        <span className="text-white">{instance.version}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Loader:</span>
                        <span className="text-white">{instance.loader || 'Vanilla'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Creada:</span>
                        <span className="text-white">{formatDate(instance.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-700/30 p-4 rounded-xl">
                    <h3 className="text-lg font-semibold text-white mb-3">Estadísticas de Juego</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Última sesión:</span>
                        <span className="text-white">
                          {instance.lastPlayed ? formatDate(instance.lastPlayed) : 'Nunca'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Tiempo total:</span>
                        <span className="text-white">{formatTime(instance.totalTimePlayed)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-gray-700/30 p-4 rounded-xl">
                  <h3 className="text-lg font-semibold text-white mb-3">Ubicación</h3>
                  <div className="flex items-center justify-between">
                    <div className="text-gray-300 text-sm font-mono break-all">
                      {instance.path}
                    </div>
                    <button
                      onClick={() => onOpenFolder(instance.id)}
                      className="ml-4 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors text-sm"
                    >
                      Abrir carpeta
                    </button>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => onPlay(instance.id)}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg transition-all flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Jugar
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}