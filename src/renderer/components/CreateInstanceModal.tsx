import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { integratedDownloadService } from '../services/integratedDownloadService';
import { profileService } from '../services/profileService';
import { instanceProfileService } from '../services/instanceProfileService';
import { JavaConfigService } from '../../services/javaConfigService';
import '../components/slider.css';

interface CreateInstanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void; // Callback opcional para notificar cuando se crea una instancia
}

interface Version {
  id: string;
  type: string;
  url?: string;
  releaseTime?: string;
}

interface ProgressStatus {
  id: string;
  operation: string;
  target: string;
  progress: number;
  status: 'pending' | 'in-progress' | 'completed' | 'error' | 'cancelled';
  current: number;
  total: number;
  details?: string;
}

const CreateInstanceModal: React.FC<CreateInstanceModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [instanceName, setInstanceName] = useState('');
  const [loaderType, setLoaderType] = useState<'vanilla' | 'forge' | 'fabric' | 'quilt' | 'neoforge'>('vanilla');
  const [mcVersion, setMcVersion] = useState('');
  const [loaderVersion, setLoaderVersion] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [minMemory, setMinMemory] = useState(2048);
  const [maxMemory, setMaxMemory] = useState(4096);
  const [totalMemory, setTotalMemory] = useState(8192);

  // Estados para versiones
  const [vanillaVersions, setVanillaVersions] = useState<Version[]>([]);
  const [forgeVersions, setForgeVersions] = useState<Record<string, any[]>>({});
  const [fabricVersions, setFabricVersions] = useState<Record<string, any[]>>({});
  const [quiltVersions, setQuiltVersions] = useState<Record<string, any[]>>({});
  const [neoforgeVersions, setNeoforgeVersions] = useState<Record<string, any[]>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [javaArgs, setJavaArgs] = useState('');
  const [javaPath, setJavaPath] = useState('');
  const [javaVersion, setJavaVersion] = useState<string>('17');
  const [canCreateInstance, setCanCreateInstance] = useState(false);

  // Estados para progreso
  const [currentProgress, setCurrentProgress] = useState<ProgressStatus | null>(null);
  const [overallProgress, setOverallProgress] = useState<{ progress: number; statusText: string; activeOperations: number } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [currentInstanceId, setCurrentInstanceId] = useState<string | null>(null);

  // Cargar la memoria total del sistema y configurar Java estándar
  useEffect(() => {
    const loadSystemMemory = async () => {
      try {
        const api = (window as any).api;
        if (api?.system?.getTotalMemory) {
          const memory = await api.system.getTotalMemory();
          const memoryInMB = Math.floor(memory / (1024 * 1024));
          setTotalMemory(memoryInMB);
          
          // Usar configuración recomendada según el loader
          const recommended = JavaConfigService.getRecommendedMemory(loaderType, memoryInMB);
          setMinMemory(recommended.min);
          setMaxMemory(recommended.max);
        } else {
          const deviceMemory = (navigator as any).deviceMemory;
          const estimatedMemory = Math.min(16384, Math.max(4096, deviceMemory ? deviceMemory * 1024 : 8192));
          setTotalMemory(estimatedMemory);
          const recommended = JavaConfigService.getRecommendedMemory(loaderType, estimatedMemory);
          setMinMemory(recommended.min);
          setMaxMemory(recommended.max);
        }
      } catch (error) {
        console.warn('No se pudo obtener la memoria total del sistema:', error);
        const deviceMemory = (navigator as any).deviceMemory;
        const memoryGuess = deviceMemory ? deviceMemory * 1024 : 8192;
        setTotalMemory(memoryGuess);
        const recommended = JavaConfigService.getRecommendedMemory(loaderType, memoryGuess);
        setMinMemory(recommended.min);
        setMaxMemory(recommended.max);
      }
    };

    loadSystemMemory();
  }, [loaderType]);

  // Actualizar versión de Java recomendada cuando cambia el loader o versión MC
  useEffect(() => {
    if (mcVersion) {
      const recommendedJava = JavaConfigService.getRecommendedJavaVersion(loaderType, mcVersion);
      setJavaVersion(recommendedJava);
      
      // Configurar parámetros Java estándar
      const standardArgs = JavaConfigService.getStandardJvmArgs(loaderType, maxMemory);
      setJavaArgs(standardArgs.join(' '));
    }
  }, [loaderType, mcVersion, maxMemory]);

  // Verificar si se puede crear la instancia
  useEffect(() => {
    const canCreate = 
      instanceName.trim() !== '' &&
      mcVersion !== '' &&
      (loaderType === 'vanilla' || loaderVersion !== '');
    setCanCreateInstance(canCreate);
  }, [instanceName, mcVersion, loaderType, loaderVersion]);

  // Cargar versiones cuando se abra el modal
  useEffect(() => {
    if (isOpen) {
      loadVersions();
    }
  }, [isOpen]);

  const loadVersions = async () => {
    if (!isOpen) return;

    setLoading(true);
    setError(null);

    try {
      // Cargar versiones de Vanilla
      const versions = await integratedDownloadService.getMinecraftVersions();
      // Filtrar solo releases
      const releaseVersions = versions.filter(v => v.type === 'release');
      setVanillaVersions(releaseVersions);
    } catch (err) {
      console.error('Error al cargar versiones:', err);
      setError('Error al cargar las versiones disponibles. Por favor, inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Actualizar la versión de Java cuando se cambia la versión de Minecraft (solo visualmente, sin descargar)
  useEffect(() => {
    if (mcVersion) {
      // Fallback: usar lógica local simple para mostrar la versión recomendada
      const majorVersion = parseInt(mcVersion.split('.')[1] || '0', 10);
      if (majorVersion >= 21) {
        setJavaVersion('21');
      } else if (majorVersion >= 17) {
        setJavaVersion('17');
      } else if (majorVersion >= 16) {
        setJavaVersion('16');
      } else {
        setJavaVersion('8');
      }
    }
  }, [mcVersion]);

  // Cargar versiones específicas del loader cuando se selecciona una versión de MC o se cambia el loader
  useEffect(() => {
    if (mcVersion && loaderType !== 'vanilla') {
      loadLoaderVersions();
    }
  }, [loaderType, mcVersion]);

  const loadLoaderVersions = async () => {
    if (!mcVersion) return;

    console.log(`[CreateInstanceModal] Cargando versiones de ${loaderType} para MC ${mcVersion}`);
    setLoading(true);
    setError(null);
    
    try {
      switch (loaderType) {
        case 'fabric':
          if (!fabricVersions[mcVersion]) {
            console.log(`[CreateInstanceModal] Obteniendo versiones de Fabric...`);
            const fabricVers = await integratedDownloadService.getFabricVersions(mcVersion);
            console.log(`[CreateInstanceModal] Versiones de Fabric obtenidas:`, fabricVers);
            setFabricVersions(prev => ({ ...prev, [mcVersion]: fabricVers }));
          }
          break;
        case 'forge':
          if (!forgeVersions[mcVersion]) {
            console.log(`[CreateInstanceModal] Obteniendo versiones de Forge...`);
            const forgeVers = await integratedDownloadService.getForgeVersions(mcVersion);
            console.log(`[CreateInstanceModal] Versiones de Forge obtenidas:`, forgeVers);
            setForgeVersions(prev => ({ ...prev, [mcVersion]: forgeVers }));
            
            // Si hay versiones y no hay una seleccionada, seleccionar la primera automáticamente
            if (forgeVers.length > 0 && !loaderVersion) {
              setLoaderVersion(forgeVers[0].version);
            }
          }
          break;
        case 'quilt':
          if (!quiltVersions[mcVersion]) {
            console.log(`[CreateInstanceModal] Obteniendo versiones de Quilt...`);
            const quiltVers = await integratedDownloadService.getQuiltVersions(mcVersion);
            console.log(`[CreateInstanceModal] Versiones de Quilt obtenidas:`, quiltVers);
            setQuiltVersions(prev => ({ ...prev, [mcVersion]: quiltVers }));
          }
          break;
        case 'neoforge':
          if (!neoforgeVersions[mcVersion]) {
            console.log(`[CreateInstanceModal] Obteniendo versiones de NeoForge...`);
            const neoforgeVers = await integratedDownloadService.getNeoForgeVersions(mcVersion);
            console.log(`[CreateInstanceModal] Versiones de NeoForge obtenidas:`, neoforgeVers);
            setNeoforgeVersions(prev => ({ ...prev, [mcVersion]: neoforgeVers }));
            
            // Si hay versiones y no hay una seleccionada, seleccionar la primera automáticamente
            if (neoforgeVers.length > 0 && !loaderVersion) {
              setLoaderVersion(neoforgeVers[0].version);
            }
          }
          break;
      }
    } catch (err: any) {
      console.error(`[CreateInstanceModal] Error al cargar versiones de ${loaderType}:`, err);
      setError(`Error al cargar las versiones de ${loaderType}: ${err.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  // Actualizar progreso periódicamente
  useEffect(() => {
    if (!isOpen) return;

    const progressInterval = setInterval(async () => {
      try {
        const progress = await integratedDownloadService.getAllProgressStatuses();
        if (progress.length > 0) {
          const current = progress[0]; // Tomar el primero activo
          setCurrentProgress(current);
        }

        const overall = await integratedDownloadService.getOverallProgress();
        setOverallProgress(overall);
      } catch (err) {
        // No hacer nada si falla, continuar con el intervalo
      }
    }, 1000); // Actualizar cada segundo

    return () => clearInterval(progressInterval);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!instanceName.trim()) {
      setError('Por favor, introduce un nombre para la instancia');
      return;
    }

    if (!mcVersion) {
      setError('Por favor, selecciona una versión de Minecraft');
      return;
    }

    if (loaderType !== 'vanilla' && !loaderVersion) {
      setError('Por favor, selecciona una versión del loader');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Obtener la versión del loader si es necesario
      let finalLoaderVersion = loaderVersion;
      if (loaderType !== 'vanilla' && !finalLoaderVersion) {
        // Seleccionar la mejor versión si no se ha seleccionado
        switch (loaderType) {
          case 'fabric':
            const fabricVersionsForMc = fabricVersions[mcVersion] || [];
            if (fabricVersionsForMc.length > 0) {
              finalLoaderVersion = fabricVersionsForMc[0].loader?.version || fabricVersionsForMc[0].version;
            }
            break;
          case 'forge':
            const forgeVersionsForMc = forgeVersions[mcVersion] || [];
            if (forgeVersionsForMc.length > 0) {
              finalLoaderVersion = forgeVersionsForMc[0].version;
            }
            break;
          case 'quilt':
            const quiltVersionsForMc = quiltVersions[mcVersion] || [];
            if (quiltVersionsForMc.length > 0) {
              finalLoaderVersion = quiltVersionsForMc[0].loader?.version || quiltVersionsForMc[0].version;
            }
            break;
          case 'neoforge':
            const neoforgeVersionsForMc = neoforgeVersions[mcVersion] || [];
            if (neoforgeVersionsForMc.length > 0) {
              finalLoaderVersion = neoforgeVersionsForMc[0].version;
            }
            break;
        }
      }

      // Obtener parámetros Java estándar para el loader
      const standardJvmArgs = JavaConfigService.getStandardJvmArgs(loaderType, maxMemory);

      // Crear la instancia con el nuevo servicio
      console.log(`[CreateInstanceModal] Creando instancia con loaderVersion: ${finalLoaderVersion || 'NO ESPECIFICADA'}`);
      const createdInstance = await integratedDownloadService.createInstance({
        name: instanceName,
        version: mcVersion,
        loader: loaderType,
        loaderVersion: finalLoaderVersion, // IMPORTANTE: Pasar la versión del loader
        javaVersion: javaVersion || JavaConfigService.getRecommendedJavaVersion(loaderType, mcVersion),
        maxMemory,
        minMemory,
        jvmArgs: standardJvmArgs // Usar parámetros estándar, no los del usuario
      });

      // Enlazar la instancia recién creada con el perfil actual del usuario
      const currentProfile = profileService.getCurrentProfile();
      if (currentProfile) {
        instanceProfileService.linkInstanceToProfile(createdInstance.id, currentProfile);
      } else {
        // Si no hay perfil actual, usar el primer perfil disponible
        const profiles = profileService.getAllProfiles();
        if (profiles.length > 0) {
          instanceProfileService.linkInstanceToProfile(createdInstance.id, profiles[0].username);
        }
      }

      // Notificar al componente padre que se ha creado una instancia
      if (onCreated) {
        onCreated();
      }
      
      // Limpiar estados
      setIsCreating(false);
      setCurrentInstanceId(null);
      onClose();
    } catch (err) {
      console.error('Error al crear instancia:', err);
      const errorMessage = (err as Error).message || 'Error desconocido';
      
      // Si el error es por cancelación, no mostrar error
      if (errorMessage.includes('cancelada')) {
        setError(null);
      } else {
        setError(`Error al crear la instancia: ${errorMessage}`);
      }
      
      setIsCreating(false);
      setCurrentInstanceId(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelCreation = async () => {
    if (!currentInstanceId) return;
    
    try {
      // Cancelar la creación de la instancia
      if (window.api?.instance?.cancelCreation) {
        await window.api.instance.cancelCreation(currentInstanceId);
      } else {
        // Fallback: usar el servicio directamente
        // Usar el servicio ya importado estáticamente
        await integratedDownloadService.cancelInstanceCreation(currentInstanceId);
      }
      
      setIsCreating(false);
      setCurrentInstanceId(null);
      setLoading(false);
      setError(null);
      setCurrentProgress(null);
      setOverallProgress(null);
      
      // No cerrar el modal, solo limpiar el estado
    } catch (err) {
      console.error('Error al cancelar creación:', err);
      setError('Error al cancelar la creación de la instancia');
    }
  };

  const getMcVersions = () => {
    // Para todos los loaders (incluyendo vanilla), mostrar las versiones vanilla disponibles
    // Los loaders soportan las mismas versiones de MC que vanilla
    return vanillaVersions.map(v => ({ id: v.id, name: `${v.id}` }));
  };

  const getLoaderVersions = () => {
    switch (loaderType) {
      case 'fabric':
        return fabricVersions[mcVersion] || [];
      case 'forge':
        return forgeVersions[mcVersion] || [];
      case 'quilt':
        return quiltVersions[mcVersion] || [];
      case 'neoforge':
        return neoforgeVersions[mcVersion] || [];
      default:
        return [];
    }
  };

  if (!isOpen) return null;

  const loaderVersions = getLoaderVersions();
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 20, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-1 w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl shadow-blue-500/10"
        >
          <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-1 rounded-2xl">
            <div className="bg-gray-900 rounded-2xl p-6 max-h-[calc(90vh-1rem)] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Crear Nueva Instancia
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Indicador de creación en progreso */}
              {isCreating && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-900/50 to-purple-900/30 border border-blue-700/50 rounded-xl text-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 animate-spin text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <div>
                        <div className="font-semibold text-blue-300">Creando instancia...</div>
                        <div className="text-sm text-blue-400/80">Por favor, espera mientras se descargan los archivos necesarios</div>
                      </div>
                    </div>
                    <button
                      onClick={handleCancelCreation}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancelar creación
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-gradient-to-r from-red-900/50 to-red-800/30 border border-red-700/50 rounded-xl text-red-200 flex items-start">
                  <svg className="w-6 h-6 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Indicador de progreso global - Solo mostrar cuando hay descarga activa */}
              <AnimatePresence>
                {overallProgress && overallProgress.progress > 0 && overallProgress.activeOperations > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-4 rounded-xl border border-blue-700/50 shadow-lg shadow-blue-500/10"
                  >
                  <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-200 flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        Progreso general:
                      </span>
                    <span className="text-sm font-semibold text-blue-400">{Math.round(overallProgress.progress * 100)}%</span>
                  </div>
                    <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${overallProgress.progress * 100}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 h-3 rounded-full relative overflow-hidden"
                      >
                        <motion.div
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        />
                      </motion.div>
                  </div>
                    <div className="mt-2 text-xs text-gray-300 flex justify-between">
                    <span>{overallProgress.statusText}</span>
                      <span className="text-blue-400">{overallProgress.activeOperations} operaciones activas</span>
                  </div>
                  </motion.div>
              )}
              </AnimatePresence>

              {/* Estado de progreso actual - Solo mostrar cuando hay descarga activa */}
              <AnimatePresence>
                {currentProgress && currentProgress.status !== 'completed' && currentProgress.status !== 'error' && currentProgress.progress > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="mb-6 bg-gradient-to-br from-blue-900/20 to-indigo-900/20 p-4 rounded-xl border border-blue-700/50 shadow-lg"
                  >
                    <div className="flex items-center text-blue-200 text-sm mb-2">
                      <motion.svg
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="mr-3 h-5 w-5 text-blue-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </motion.svg>
                    <span className="font-medium">{currentProgress.target}</span>
                  </div>
                    <div className="mt-1 text-xs text-blue-300 mb-3">
                    {currentProgress.details || currentProgress.operation}
                  </div>
                    <div className="w-full bg-blue-900/30 rounded-full h-2.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${currentProgress.progress * 100}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2.5 rounded-full relative"
                      >
                        <motion.div
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        />
                      </motion.div>
                  </div>
                    <div className="mt-2 text-xs text-blue-300 text-right font-medium">
                    {currentProgress.current} / {currentProgress.total}
                  </div>
                  </motion.div>
              )}
              </AnimatePresence>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Columna izquierda */}
                  <div className="space-y-6">
                    <div className="bg-gray-800/30 p-5 rounded-xl border border-gray-700/30">
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                        Nombre de la instancia
                      </label>
                      <input
                        type="text"
                        value={instanceName}
                        onChange={(e) => setInstanceName(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Mi Mundo Creativo 1.20.1"
                        disabled={loading}
                      />
                    </div>

                    <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700/30">
                      <label className="block text-sm font-medium text-gray-300 mb-4">
                        <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Tipo de Loader
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {(['vanilla', 'fabric', 'forge', 'quilt', 'neoforge'] as const).map(type => (
                          <motion.button
                            key={type}
                            type="button"
                            onClick={() => {
                              setLoaderType(type);
                              // Si cambiamos a vanilla, limpiar la versión del loader
                              if (type === 'vanilla') {
                                setLoaderVersion('');
                              }
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            animate={{
                              scale: loaderType === type ? 1.05 : 1,
                              boxShadow: loaderType === type 
                                ? '0 10px 25px rgba(59, 130, 246, 0.4)' 
                                : '0 0 0 rgba(0, 0, 0, 0)'
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className={`py-2 px-1 rounded-lg border transition-all duration-300 min-h-[50px] flex flex-col justify-center items-center ${
                              loaderType === type
                                ? 'bg-gradient-to-br from-blue-600 to-purple-600 border-blue-500 text-white shadow-lg shadow-blue-500/30'
                                : 'bg-gray-700/50 border-gray-600/50 text-gray-300 hover:bg-gray-600/50 disabled:opacity-50'
                            }`}
                            disabled={loading}
                          >
                            <div className="text-[0.65rem] sm:text-xs font-medium text-center leading-tight">{type === 'neoforge' ? 'Neo\nForge' : type.charAt(0).toUpperCase() + type.slice(1)}</div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Columna derecha */}
                  <div className="space-y-6">
                    <div className="bg-gray-800/30 p-5 rounded-xl border border-gray-700/30">
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        Versión de Minecraft
                      </label>
                      <select
                        value={mcVersion}
                        onChange={(e) => setMcVersion(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        disabled={loading}
                      >
                        <option value="">Selecciona una versión</option>
                        {getMcVersions().map(version => (
                          <option key={version.id} value={version.id}>
                            {version.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Versión del loader */}
                    {loaderType !== 'vanilla' && mcVersion && (
                      <div className="bg-gray-800/30 p-5 rounded-xl border border-gray-700/30">
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                          <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Versión del Loader
                        </label>
                        <select
                          value={loaderVersion}
                          onChange={(e) => setLoaderVersion(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          disabled={loading}
                        >
                          <option value="">Selecciona una versión</option>
                          {loaderVersions.map((version: any, index: number) => {
                            // Esto depende de la estructura de datos de cada loader
                            let displayVersion = '';
                            let versionValue = '';
                            
                            if (loaderType === 'fabric' || loaderType === 'quilt') {
                              displayVersion = version.loader?.version || version.version;
                              versionValue = displayVersion;
                            } else if (loaderType === 'forge' || loaderType === 'neoforge') {
                              // Para Forge y NeoForge, mostrar solo la versión del loader (después del guión)
                              const fullVersion = version.version || '';
                              const parts = fullVersion.split('-');
                              displayVersion = parts.length > 1 ? parts[1] : fullVersion;
                              versionValue = fullVersion; // Guardar la versión completa para el valor
                            }
                            
                            // La primera versión (índice 0) es la recomendada
                            const isRecommended = index === 0;
                            
                            return (
                              <option key={index} value={versionValue || displayVersion}>
                                {isRecommended ? `⭐ ${displayVersion} (Recomendada)` : displayVersion}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    )}

                    <div className="bg-gray-800/30 p-5 rounded-xl border border-gray-700/30">
                      <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="w-full py-3 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 rounded-xl text-white flex items-center justify-between transition-all duration-300"
                        disabled={loading}
                      >
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          </svg>
                          <span className="font-medium">Opciones Avanzadas</span>
                        </div>
                        <svg
                          className={`w-5 h-5 transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      <AnimatePresence>
                        {showAdvanced && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-4 space-y-4 p-4 bg-gray-700/30 rounded-xl border border-gray-600/30"
                          >
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-300">
                                  Memoria RAM a usar (MB)
                                </label>
                                <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full min-w-[70px] text-center">
                                  {maxMemory} MB
                                </span>
                              </div>
                              <input
                                type="range"
                                min="1024"
                                max={Math.min(totalMemory, 16384)}
                                value={maxMemory}
                                onChange={(e) => {
                                  const newMax = parseInt(e.target.value);
                                  setMaxMemory(newMax);
                                  setMinMemory(Math.max(1024, Math.floor(newMax / 4)));
                                }}
                                className="w-full h-2 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg appearance-none cursor-pointer slider"
                                disabled={loading}
                              />
                              <div className="flex justify-between text-xs text-gray-400 mt-1">
                                <span>1GB</span>
                                <span>{Math.min(totalMemory, 16384)}MB</span>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Versión de Java (Configuración Automática)
                              </label>
                              <div className="w-full px-3 py-2 bg-gray-600/30 border border-gray-500/30 rounded-lg text-gray-400 text-sm">
                                {javaVersion} (Recomendada para {loaderType === 'vanilla' ? 'Vanilla' : loaderType === 'fabric' ? 'Fabric' : loaderType === 'forge' ? 'Forge' : loaderType === 'quilt' ? 'Quilt' : 'NeoForge'})
                              </div>
                              <p className="text-xs text-gray-500 mt-1">La versión de Java se configura automáticamente según el loader seleccionado</p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Parámetros de Java (Configuración Automática)
                              </label>
                              <div className="w-full px-3 py-2 bg-gray-600/30 border border-gray-500/30 rounded-lg text-gray-400 text-sm max-h-20 overflow-y-auto">
                                {javaArgs || 'Configurando parámetros optimizados...'}
                            </div>
                              <p className="text-xs text-gray-500 mt-1">Los parámetros se configuran automáticamente para optimizar el rendimiento</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700/50">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all duration-300 disabled:opacity-50 font-medium"
                  >
                    Cancelar
                  </button>
                  <motion.button
                    type="submit"
                    disabled={loading || !canCreateInstance || isCreating}
                    whileHover={canCreateInstance && !loading && !isCreating ? { scale: 1.05 } : {}}
                    whileTap={canCreateInstance && !loading && !isCreating ? { scale: 0.95 } : {}}
                    animate={{
                      opacity: canCreateInstance ? 1 : 0.5,
                      boxShadow: canCreateInstance && !loading 
                        ? '0 10px 25px rgba(59, 130, 246, 0.4)' 
                        : '0 0 0 rgba(0, 0, 0, 0)'
                    }}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl transition-all duration-300 disabled:opacity-50 font-medium flex items-center shadow-lg shadow-blue-500/20"
                  >
                    {loading && (
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {loading 
                      ? 'Creando y descargando...' 
                      : canCreateInstance
                        ? `Crear Instancia de ${loaderType === 'vanilla' ? 'Vanilla' : loaderType === 'fabric' ? 'Fabric' : loaderType === 'forge' ? 'Forge' : loaderType === 'quilt' ? 'Quilt' : 'NeoForge'}`
                        : 'Completa los campos requeridos'}
                  </motion.button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateInstanceModal;