import React, { useEffect, useState, useRef, ErrorInfo } from 'react'
import { Profile, profileService } from '../services/profileService'
import { instanceProfileService } from '../services/instanceProfileService'
import CreateInstanceModal from '../components/CreateInstanceModal'
import InstanceEditModal from '../components/InstanceEditModal'
import ConfirmationModal from '../components/ConfirmationModal'
import GameLogsModal from '../components/GameLogsModal'
import { notificationService } from '../services/notificationService'
import TutorialOverlay from '../components/TutorialOverlay'
import { instancesTutorialSteps } from '../data/tutorialSteps'

// Error Boundary Component simplificado
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('[ErrorBoundary] Error capturado:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Error en componente Instances:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      console.log('[ErrorBoundary] Renderizando pantalla de error');
      return (
        <div className="p-6" style={{ minHeight: '400px', backgroundColor: '#0f0f10' }}>
          <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-4 text-red-200">
            <h2 className="text-lg font-bold mb-2">Error al cargar Instancias</h2>
            <p className="mb-4">{this.state.error?.message || 'Error desconocido'}</p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              Recargar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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
  ready?: boolean; // Indica si la instancia está lista para jugar
}

type InstancesProps = {
  onPlay: (id: string) => void;
};

export default function Instances({ onPlay }: InstancesProps) {
  console.log('[Instances] Componente montado');
  
  const [instances, setInstances] = useState<Instance[]>([])
  const [ownedInstances, setOwnedInstances] = useState<Instance[]>([])
  const [importedInstances, setImportedInstances] = useState<Instance[]>([])
  const [sharedInstances, setSharedInstances] = useState<Instance[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'owned' | 'imported' | 'shared'>('all')
  const [editing, setEditing] = useState<Instance | null>(null)
  const [editingFull, setEditingFull] = useState<any | null>(null) // Para el nuevo modal de edición completa
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
  const [instanceToDelete, setInstanceToDelete] = useState<Instance | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showLogsModal, setShowLogsModal] = useState(false)
  const [selectedInstanceForLogs, setSelectedInstanceForLogs] = useState<Instance | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Ref para rastrear si los perfiles ya se cargaron
  const profilesLoadedRef = useRef(false)
  
  // Ref para evitar múltiples ejecuciones de autoDetectInstances
  const isDetectingRef = useRef(false)

  // Estado para rastrear si las instancias están listas para jugar
  const [readyStatus, setReadyStatus] = useState<Record<string, boolean>>({});
  
  // Estado para rastrear instancias en ejecución
  const [runningInstances, setRunningInstances] = useState<Set<string>>(new Set());
  const [launchingInstances, setLaunchingInstances] = useState<Set<string>>(new Set()); // Usar useState para que el renderizado se actualice

  // Función para verificar si una instancia está lista para jugar
  // Verifica si los archivos esenciales están presentes y si la creación fue completada
  const checkInstanceReady = async (instance: Instance): Promise<boolean> => {
    // Si ya tenemos el estado en caché, usarlo
    if (readyStatus[instance.id] !== undefined) {
      return readyStatus[instance.id];
    }

    // Verificar que tenga path
    if (!instance.path || instance.path.length === 0) {
      setReadyStatus(prev => ({ ...prev, [instance.id]: false }));
      return false;
    }

    // Verificar el estado ready de la instancia desde la API
    try {
      if (window.api?.instances) {
        // Intentar obtener la configuración de la instancia para verificar el estado ready
        const instanceConfig = await (window.api.instances as any).getConfig?.(instance.id);
        if (instanceConfig?.ready === false) {
          setReadyStatus(prev => ({ ...prev, [instance.id]: false }));
          return false;
        }
        
        // Verificar si hay descargas incompletas para esta instancia
        const incompleteDownloads = await (window.api.instance as any)?.getIncompleteDownloads?.();
        if (incompleteDownloads && Array.isArray(incompleteDownloads)) {
          const hasIncomplete = incompleteDownloads.some((dl: any) => 
            dl.instanceId === instance.id && dl.status !== 'completed'
          );
          if (hasIncomplete) {
            setReadyStatus(prev => ({ ...prev, [instance.id]: false }));
            return false;
          }
        }
      }
    } catch (err) {
      console.warn('[Instances] Error al verificar estado de instancia:', err);
    }

    // Si instance.ready está explícitamente en false, no está lista
    if (instance.ready === false) {
      setReadyStatus(prev => ({ ...prev, [instance.id]: false }));
      return false;
    }

    // Por defecto, si tiene path y no está marcada como no lista, asumir que está lista
    const isReady = instance.ready !== false;
    setReadyStatus(prev => ({ ...prev, [instance.id]: isReady }));
    return isReady;
  };

  // Función para cargar perfiles
  const loadProfiles = () => {
    try {
      const allProfiles = profileService.getAllProfiles()
      setProfiles(allProfiles)
      let profileToSet: string | null = null;
      
      if (allProfiles.length > 0) {
        const currentProfile = profileService.getCurrentProfile()
        if (currentProfile) {
          profileToSet = currentProfile
        } else {
          profileToSet = allProfiles[0].username
        }
      }
      
      // Establecer el perfil seleccionado
      // El useEffect que depende de selectedProfile se encargará de cargar las instancias
      console.log('[Instances] Estableciendo perfil seleccionado:', profileToSet);
      profilesLoadedRef.current = true; // Marcar que los perfiles se cargaron
      setSelectedProfile(profileToSet);
    } catch (err) {
      console.error('[Instances] Error al cargar perfiles:', err)
      setError('Error al cargar perfiles')
      setIsLoading(false);
    }
  };

  // Esperar a que window.api esté disponible (especialmente importante en primera carga)
  useEffect(() => {
    console.log('[Instances] Verificando disponibilidad de window.api...');
    
    const checkApiAvailability = () => {
      // Verificar que window existe, luego api, luego instances
      if (typeof window !== 'undefined' && window.api && window.api.instances) {
        console.log('[Instances] window.api está disponible');
        return true;
      }
      return false;
    };

    // Si la API ya está disponible, cargar perfiles inmediatamente
    if (checkApiAvailability()) {
      console.log('[Instances] API disponible inmediatamente, cargando perfiles');
      loadProfiles();
      // No retornar aquí, continuar para también cargar instancias si no hay perfil
      return; // Pero sí retornar para evitar ejecutar las estrategias de espera
    }

    console.log('[Instances] API no disponible aún, esperando...');

    // Intentar múltiples estrategias para detectar cuando window.api esté disponible
    
    // Estrategia 1: Verificar en el siguiente tick del event loop
    const nextTickCheck = setTimeout(() => {
      if (checkApiAvailability()) {
        console.log('[Instances] API disponible en nextTick');
        loadProfiles();
        return;
      }
    }, 0);

    // Estrategia 2: Verificar periódicamente con intervalo
    let attempts = 0;
    const maxAttempts = 200; // 20 segundos máximo (200 * 100ms)
    const interval = setInterval(() => {
      attempts++;
      if (checkApiAvailability()) {
        console.log(`[Instances] API disponible después de ${attempts} intentos`);
        clearInterval(interval);
        clearTimeout(nextTickCheck);
        clearTimeout(timeout);
        loadProfiles();
        // No retornar, el useEffect de carga de instancias se encargará
      } else if (attempts >= maxAttempts) {
        console.error('[Instances] Timeout esperando window.api');
        clearInterval(interval);
        clearTimeout(nextTickCheck);
        clearTimeout(timeout);
        setError('La API del launcher no está disponible. Por favor, recarga la aplicación.');
        setIsLoading(false);
      }
    }, 100); // Verificar cada 100ms

    // Estrategia 3: Timeout de seguridad después de 20 segundos
    const timeout = setTimeout(() => {
      clearInterval(interval);
      clearTimeout(nextTickCheck);
      if (!checkApiAvailability()) {
        console.error('[Instances] Timeout final: window.api no disponible');
        setError('La API del launcher no está disponible después de 20 segundos. Por favor, recarga la aplicación.');
        setIsLoading(false);
      }
    }, 20000);

    // Estrategia 4: Escuchar evento de DOMContentLoaded si aún no se ha cargado
    const handleDOMReady = () => {
      if (checkApiAvailability()) {
        console.log('[Instances] API disponible en DOMContentLoaded');
        clearInterval(interval);
        clearTimeout(nextTickCheck);
        clearTimeout(timeout);
        loadProfiles();
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', handleDOMReady);
    } else {
      // DOM ya está listo, verificar inmediatamente
      handleDOMReady();
    }

    return () => {
      clearInterval(interval);
      clearTimeout(nextTickCheck);
      clearTimeout(timeout);
      document.removeEventListener('DOMContentLoaded', handleDOMReady);
    };
  }, [])

  // Clasificar instancias por tipo
  const classifyInstances = (instances: Instance[]) => {
    const owned = instances.filter(instance => instance.type === 'owned');
    const imported = instances.filter(instance => instance.type === 'imported');
    const shared = instances.filter(instance => instance.type === 'shared');

    setOwnedInstances(owned);
    setImportedInstances(imported);
    setSharedInstances(shared);
  };

  // Función para auto-detectar y validar instancias existentes
  const autoDetectInstances = async () => {
    // Evitar múltiples ejecuciones simultáneas
    if (isDetectingRef.current) {
      console.log('[Instances] autoDetectInstances ya está en ejecución, omitiendo...');
      return;
    }
    
    isDetectingRef.current = true;
    console.log('[Instances] autoDetectInstances iniciado');
    setIsLoading(true);
    setError(null);

    // Timeout de seguridad: si la carga tarda más de 30 segundos, mostrar error
    const safetyTimeout = setTimeout(() => {
      console.error('[Instances] Timeout: autoDetectInstances tardó más de 30 segundos');
      setError('La carga de instancias está tardando demasiado. Por favor, intenta recargar la página.');
      setIsLoading(false);
    }, 30000);

    // Verificar que window.api esté disponible
    if (!window.api) {
      console.error('[Instances] window.api no está disponible');
      clearTimeout(safetyTimeout);
      setError('La API del launcher no está disponible. Por favor, recarga la aplicación.');
      setIsLoading(false);
      return;
    }

    if (!window.api.instances) {
      console.error('[Instances] window.api.instances no está disponible');
      clearTimeout(safetyTimeout);
      setError('El servicio de instancias no está disponible. Por favor, recarga la aplicación.');
      setIsLoading(false);
      return;
    }

    try {
      // Si no hay perfil seleccionado, intentar cargar todas las instancias sin filtrar
      if (!selectedProfile) {
        console.log('[Instances] No hay perfil seleccionado, cargando todas las instancias');
        // Escanear y registrar instancias
        if ((window.api.instances as any).scanAndRegister) {
          try {
            await (window.api.instances as any).scanAndRegister();
          } catch (scanError) {
            console.error('Error al escanear instancias:', scanError);
          }
        }

        // Obtener todas las instancias sin filtrar por perfil
        const allSystemInstances = await window.api.instances.list();
        
        const classifiedInstances = allSystemInstances.map(instance => {
          let type: InstanceType = 'owned';
          if (instance.source) {
            if (instance.source.startsWith('http')) {
              type = 'imported';
            } else if (instance.source.includes('\\') || instance.source.includes('/')) {
              type = 'imported';
            }
          }

          return {
            ...instance,
            totalTimePlayed: 0,
            type: type
          };
        });

        setInstances(classifiedInstances);
        classifyInstances(classifiedInstances);
        
        // Verificar el estado ready de cada instancia
        for (const inst of classifiedInstances) {
          await checkInstanceReady(inst);
        }
        
        setError(null);
        clearTimeout(safetyTimeout);
        setIsLoading(false);
        isDetectingRef.current = false;
        console.log('[Instances] Instancias cargadas sin perfil:', classifiedInstances.length);
        return;
      }

      console.log('[Instances] Iniciando detección de instancias para perfil:', selectedProfile);
      // Primero, escanear el directorio y registrar instancias que no están en la base de datos
      // Verificar si el método existe antes de llamarlo (puede no estar en los tipos)
      if ((window.api.instances as any).scanAndRegister) {
        try {
          const scanResult = await (window.api.instances as any).scanAndRegister();
          console.log(`Registro automático completado: ${scanResult.count} instancias nuevas registradas`);
        } catch (scanError) {
          console.error('Error al escanear y registrar instancias:', scanError);
          // Continuar aunque falle el escaneo
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

      console.log('[Instances] Instancias clasificadas:', classifiedInstances.length);
      setInstances(classifiedInstances);
      classifyInstances(classifiedInstances);
      setError(null); // Limpiar error si todo funciona
      clearTimeout(safetyTimeout);
      console.log('[Instances] autoDetectInstances completado exitosamente');
    } catch (err) {
      console.error('[Instances] Error en auto-detección de instancias:', err);
      console.error('[Instances] Stack trace:', (err as Error).stack);
      clearTimeout(safetyTimeout);
      setError(`Error en auto-detección de instancias: ${(err as Error).message || 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
      isDetectingRef.current = false; // Limpiar la bandera
      console.log('[Instances] autoDetectInstances finalizado, isLoading = false');
    }
  };

  // Cargar instancias cuando window.api esté disponible o cuando cambie el perfil seleccionado
  useEffect(() => {
    // Evitar múltiples ejecuciones simultáneas
    if (isDetectingRef.current) {
      console.log('[Instances] autoDetectInstances ya está en ejecución, omitiendo...');
      return;
    }

    // Verificar que window.api esté disponible antes de cargar
    if (!window.api || !window.api.instances) {
      console.warn('[Instances] window.api no está disponible aún, esperando...');
      setIsLoading(true);
      
      // Timeout de seguridad: si después de 5 segundos window.api no está disponible, mostrar error
      const timeout = setTimeout(() => {
        if (!window.api || !window.api.instances) {
          console.error('[Instances] Timeout: window.api no disponible después de 5 segundos');
          setError('La API del launcher no está disponible. Por favor, recarga la aplicación.');
          setIsLoading(false);
        }
      }, 5000);
      
      return () => clearTimeout(timeout);
    }

    // Si los perfiles aún no se han cargado, esperar máximo 3 segundos
    if (!profilesLoadedRef.current) {
      console.log('[Instances] Esperando a que los perfiles se carguen...');
      
      // Timeout de seguridad: si después de 3 segundos los perfiles no se cargaron, continuar sin perfil
      const timeout = setTimeout(() => {
        if (!profilesLoadedRef.current) {
          console.warn('[Instances] Timeout esperando perfiles, continuando sin perfil');
          profilesLoadedRef.current = true; // Forzar continuar
        }
      }, 3000);
      
      return () => clearTimeout(timeout);
    }

    // Esperar un pequeño delay para asegurar que el estado se haya actualizado
    const timer = setTimeout(() => {
      // Si no hay perfil seleccionado, aún así cargar todas las instancias
      // Esto permite que el componente funcione incluso sin perfiles
      console.log('[Instances] Iniciando carga de instancias, perfil seleccionado:', selectedProfile || 'ninguno');
      
      // Asegurarse de que isLoading esté en true antes de cargar
      setIsLoading(true);
      
      // autoDetectInstances ya maneja isDetectingRef internamente
      autoDetectInstances();
    }, 100); // Pequeño delay para asegurar que el estado se haya actualizado

    return () => clearTimeout(timer);
  }, [selectedProfile]);

  const remove = async (id: string) => {
    const instance = instances.find(inst => inst.id === id);
    if (!instance) return;
    
    setInstanceToDelete(instance);
    setShowDeleteModal(true);
  }

  const confirmDelete = async () => {
    if (!instanceToDelete) return;

    // Verificar que la API esté completamente disponible
    if (!window.api?.instances) {
      setError('Servicio de instancias no disponible aún. Esperando inicialización...');
      setShowDeleteModal(false);
      setInstanceToDelete(null);
      return;
    }

    try {
      // Desvincular la instancia del perfil antes de eliminarla
      instanceProfileService.unlinkInstance(instanceToDelete.id)

      await window.api.instances.delete(instanceToDelete.id)
      
      // Mostrar notificación de éxito
      notificationService.show({
        type: 'success',
        title: 'Instancia eliminada',
        message: `La instancia "${instanceToDelete.name}" ha sido eliminada correctamente.`
      });
      
      autoDetectInstances(); // Recargar instancias después de eliminar
      setShowDeleteModal(false);
      setInstanceToDelete(null);
    } catch (err) {
      console.error('Error al eliminar instancia:', err)
      setError(`Error al eliminar instancia: ${(err as Error).message || 'Error desconocido'}`)
      notificationService.show({
        type: 'error',
        title: 'Error al eliminar',
        message: `No se pudo eliminar la instancia "${instanceToDelete.name}".`
      });
      setShowDeleteModal(false);
      setInstanceToDelete(null);
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
    // CRÍTICO: Verificar si ya hay un lanzamiento en progreso para esta instancia
    if (launchingInstances.has(id) || runningInstances.has(id)) {
      console.warn(`[Instances] ⚠️ BLOQUEADO: Ya hay un lanzamiento o juego en progreso para la instancia ${id}.`);
      return;
    }
    
    // Marcar que hay un lanzamiento en progreso
    setLaunchingInstances(prev => new Set(prev).add(id));
    console.log(`[Instances] Iniciando lanzamiento para instancia: ${id}`);
    
    try {
      // Usar la función onPlay pasada como prop
      await onPlay(id);
      
      // El polling de runningInstances detectará cuando el juego esté corriendo
      // Limpiar el flag de lanzamiento después de un delay
      setTimeout(() => {
        setLaunchingInstances(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }, 5000); // Dar tiempo para que el juego se registre como "running"
    } catch (error) {
      console.error(`[Instances] Error al lanzar instancia ${id}:`, error);
      setLaunchingInstances(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  }

  const handleCancelGame = async (id: string) => {
    try {
      if (window.api?.game?.kill) {
        await window.api.game.kill(id);
        setRunningInstances(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
        notificationService.success('Juego cancelado exitosamente');
      } else {
        console.warn('[Instances] API para cancelar juego no disponible');
        notificationService.error('No se pudo cancelar el juego. La funcionalidad no está disponible.');
      }
    } catch (error) {
      console.error(`[Instances] Error al cancelar juego ${id}:`, error);
      notificationService.error('Error al cancelar el juego');
    }
  }

  // Verificar periódicamente el estado de las instancias en ejecución
  useEffect(() => {
    const checkRunningInstances = async () => {
      if (window.api?.game?.isRunning) {
        const running = await window.api.game.isRunning();
        if (Array.isArray(running)) {
          setRunningInstances(new Set(running));
        }
      }
    };

    const interval = setInterval(checkRunningInstances, 3000); // Verificar cada 3 segundos
    checkRunningInstances(); // Verificar inmediatamente

    return () => clearInterval(interval);
  }, []);

  const startEdit = (instance: Instance) => {
    setEditingFull(instance)
  }

  const closeEdit = () => {
    setEditingFull(null)
  }

  const handleSaveEdit = async (updatedInstance: any) => {
    try {
      // Actualizar la instancia en el backend
      if (window.api?.instances?.update) {
        await window.api.instances.update({ 
          id: updatedInstance.id, 
          patch: {
            name: updatedInstance.name,
            version: updatedInstance.version,
            loader: updatedInstance.loader,
            ramMb: updatedInstance.maxMemory,
            javaPath: updatedInstance.javaPath,
            windowWidth: updatedInstance.windowWidth,
            windowHeight: updatedInstance.windowHeight,
            jvmArgs: updatedInstance.jvmArgs
          }
        })
      }

      // Actualizar la lista de instancias
      autoDetectInstances(); // Recargar instancias después de guardar
      
      closeEdit();
    } catch (err) {
      console.error('Error al guardar edición:', err)
      setError(`Error al guardar edición: ${(err as Error).message || 'Error desconocido'}`)
    }
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
      autoDetectInstances(); // Recargar instancias después de importar

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
      autoDetectInstances(); // Recargar instancias después de editar
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

  console.log('[Instances] Estado actual:', {
    isLoading,
    error,
    instancesCount: instances.length,
    filteredCount: filteredInstances.length,
    selectedProfile,
    profilesCount: profiles.length,
    apiAvailable: typeof window !== 'undefined' && !!window.api,
    instancesApiAvailable: typeof window !== 'undefined' && !!window.api?.instances
  });

  // Mostrar estado de carga
  if (isLoading) {
    console.log('[Instances] Renderizando estado de carga');
    const apiStatus = typeof window !== 'undefined' && window.api 
      ? (window.api.instances ? 'Disponible' : 'Parcialmente disponible')
      : 'No disponible';
    
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
          <p className="text-gray-400">Cargando instancias...</p>
          {(!window.api || !window.api.instances) && (
            <div className="flex flex-col items-center gap-2 mt-2">
              <p className="text-yellow-400 text-sm">Esperando inicialización de la API...</p>
              <p className="text-gray-500 text-xs">Estado: {apiStatus}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    console.log('[Instances] Renderizando estado de error:', error);
    return (
      <div className="p-6">
        <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-4 text-red-200">
          <h2 className="text-lg font-bold mb-2">Error</h2>
          <p>{error}</p>
          <button
            onClick={() => {
              setError(null);
              autoDetectInstances();
            }}
            className="mt-4 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  console.log('[Instances] Renderizando contenido principal');

  return (
    <ErrorBoundary>
    <>
    <div className="p-6" style={{ minHeight: '100%', backgroundColor: '#0f0f10' }}>
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
          data-tutorial="create-instance-btn"
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/20 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Crear Instancia
        </button>
      </div>

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
          <button 
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl transition-all duration-300"
          >
            Crear Primera Instancia
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-tutorial="instances-list">
          {filteredInstances.map(instance => {
            const isReady = readyStatus[instance.id] ?? (instance.ready !== false && instance.path && instance.path.length > 0);
            const isLaunching = launchingInstances.has(instance.id);
            const isRunning = runningInstances.has(instance.id);
            const canPlay = isReady && !isLaunching && !isRunning;

            return (
            <div
              key={instance.id}
              className="group relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-5 transition-all duration-300 hover:from-gray-800/80 hover:to-gray-900/80 hover:border-gray-600/70 hover:shadow-xl hover:shadow-blue-500/10"
            >
              {/* Indicador de estado en la esquina superior derecha */}
              {isRunning && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-green-500/20 border border-green-500/50 rounded-full px-2 py-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400 font-medium">En ejecución</span>
                </div>
              )}
              {isLaunching && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-blue-500/20 border border-blue-500/50 rounded-full px-2 py-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-blue-400 font-medium">Iniciando...</span>
                </div>
              )}
              {!isReady && !isLaunching && !isRunning && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-yellow-500/20 border border-yellow-500/50 rounded-full px-2 py-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-xs text-yellow-400 font-medium">Pendiente</span>
                </div>
              )}

              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-white truncate mb-2 group-hover:text-blue-400 transition-colors">
                    {instance.name}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs bg-gray-700/70 text-gray-300 px-2.5 py-1 rounded-lg font-medium">
                      {instance.version}
                    </span>
                    {instance.loader && (
                      <span className="text-xs bg-blue-600/30 text-blue-300 px-2.5 py-1 rounded-lg font-medium border border-blue-500/30">
                        {instance.loader}
                      </span>
                    )}
                    <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                      instance.type === 'owned'
                        ? 'bg-green-600/30 text-green-300 border border-green-500/30'
                        : instance.type === 'imported'
                          ? 'bg-yellow-600/30 text-yellow-300 border border-yellow-500/30'
                          : 'bg-purple-600/30 text-purple-300 border border-purple-500/30'
                    }`}>
                      {instance.type === 'owned'
                        ? 'Creada'
                        : instance.type === 'imported'
                          ? 'Importada'
                          : 'Compartida'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700/50">
                <div className="grid grid-cols-2 gap-3 text-xs text-gray-400 mb-4">
                  <div>
                    <div className="text-gray-500 mb-1">Última vez</div>
                    <div className="text-white font-medium">
                      {instance.lastPlayed ? new Date(instance.lastPlayed).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      }) : 'Nunca'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">Tiempo total</div>
                    <div className="text-white font-medium">
                      {instance.totalTimePlayed ? (
                        (() => {
                          const minutes = Math.floor(instance.totalTimePlayed / (1000 * 60));
                          if (minutes < 60) {
                            return `${minutes} min`;
                          } else if (minutes < 1440) {
                            const hours = Math.floor(minutes / 60);
                            const mins = minutes % 60;
                            return `${hours}h ${mins}min`;
                          } else {
                            const days = Math.floor(minutes / 1440);
                            const hours = Math.floor((minutes % 1440) / 60);
                            return `${days}d ${hours}h`;
                          }
                        })()
                      ) : '0 min'}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {isRunning ? (
                    <button
                      onClick={() => handleCancelGame(instance.id)}
                      className="flex-1 min-w-[120px] px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all duration-200 font-medium flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancelar
                    </button>
                  ) : (
                    <button
                      data-tutorial="instance-play"
                      onClick={() => handlePlay(instance.id)}
                      className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl transition-all duration-200 font-medium flex items-center justify-center gap-2 ${
                        canPlay
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/20' 
                          : 'bg-gray-700/50 hover:bg-gray-700 text-gray-400 cursor-not-allowed'
                      }`}
                      disabled={!canPlay}
                    >
                      {isLaunching ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Iniciando...
                        </>
                      ) : isReady ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Jugar
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Pendiente
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => open(instance.id)}
                    className="px-3 py-2 bg-gray-700/50 hover:bg-gray-700 text-white rounded-xl transition-all duration-200 text-sm"
                    title="Abrir carpeta"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </button>
                  <button
                    data-tutorial="instance-edit"
                    onClick={() => startEdit(instance)}
                    className="px-3 py-2 bg-blue-600/50 hover:bg-blue-600 text-white rounded-xl transition-all duration-200 text-sm"
                    title="Editar Instancia"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedInstanceForLogs(instance);
                      setShowLogsModal(true);
                    }}
                    className="px-3 py-2 bg-purple-600/50 hover:bg-purple-600 text-white rounded-xl transition-all duration-200 text-sm"
                    title="Ver Logs"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => viewInstanceDetails(instance)}
                    className="px-3 py-2 bg-gray-700/50 hover:bg-gray-700 text-white rounded-xl transition-all duration-200 text-sm"
                    title="Ver Detalles"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => remove(instance.id)}
                    className="px-3 py-2 bg-red-600/50 hover:bg-red-600 text-white rounded-xl transition-all duration-200 text-sm"
                    title="Eliminar Instancia"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>{filteredInstances.length} instancia{filteredInstances.length !== 1 ? 's' : ''} encontrada{filteredInstances.length !== 1 ? 's' : ''}</p>
      </div>
    </div>

    <InstanceDetailsModal
      instance={selectedInstance}
      isOpen={showInstanceDetails}
      onClose={() => setShowInstanceDetails(false)}
      onPlay={handlePlay}
      onOpenFolder={open}
    />

    {/* Modal para importar instancias */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800/90 border border-gray-700/50 rounded-xl p-6 w-full max-w-md">
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
          </div>
        </div>
      )}

    {/* Modal para crear instancias */}
    <CreateInstanceModal
      isOpen={showCreateModal}
      onClose={() => {
        // Solo permitir cerrar si no hay una creación en progreso
        if (!showCreateModal) return;
        setShowCreateModal(false);
      }}
      onCreated={() => {
        // Refrescar la lista de instancias después de crear una nueva
        autoDetectInstances();
        // Mostrar notificación de éxito
        notificationService.show({
          type: 'success',
          title: 'Instancia creada',
          message: 'La instancia se está descargando. Aparecerá cuando termine la descarga.'
        });
      }}
    />

    {/* Modal de confirmación para eliminar */}
    <ConfirmationModal
      isOpen={showDeleteModal}
      title="Eliminar Instancia"
      message={`¿Estás seguro de que quieres eliminar la instancia "${instanceToDelete?.name}"? Esta acción no se puede deshacer y eliminará permanentemente todos los archivos de la instancia.`}
      confirmText="Eliminar"
      cancelText="Cancelar"
      confirmColor="danger"
      onConfirm={confirmDelete}
      onCancel={() => {
        setShowDeleteModal(false);
        setInstanceToDelete(null);
      }}
    />

    {/* Modal de edición de instancia avanzado */}
    {editingFull && (
      <InstanceEditModal
        instance={editingFull}
        isOpen={!!editingFull}
        onClose={closeEdit}
        onSave={handleSaveEdit}
        onDelete={remove}
      />
    )}

    {/* Modal de logs del juego */}
    {selectedInstanceForLogs && (
      <GameLogsModal
        instanceId={selectedInstanceForLogs.id}
        instanceName={selectedInstanceForLogs.name}
        isOpen={showLogsModal}
        onClose={() => {
          setShowLogsModal(false);
          setSelectedInstanceForLogs(null);
        }}
      />
    )}
    </>
    </ErrorBoundary>
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

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  if (!isOpen || !instance) return null;

  return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl">
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
        </div>

        {/* Tutorial Overlay */}
        <TutorialOverlay pageId="instances" steps={instancesTutorialSteps} />
        </div>
  )
}