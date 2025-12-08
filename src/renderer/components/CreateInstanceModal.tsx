import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { integratedDownloadService } from '../services/integratedDownloadService';
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

const CreateInstanceModal: React.FC<CreateInstanceModalProps> = ({ isOpen, onClose }) => {
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

  // Estados para progreso
  const [currentProgress, setCurrentProgress] = useState<ProgressStatus | null>(null);
  const [overallProgress, setOverallProgress] = useState<{ progress: number; statusText: string; activeOperations: number } | null>(null);

  // Cargar la memoria total del sistema
  useEffect(() => {
    const loadSystemMemory = async () => {
      try {
        if (window.api?.system?.getTotalMemory) {
          const memory = await window.api.system.getTotalMemory();
          const memoryInMB = Math.floor(memory / (1024 * 1024));
          setTotalMemory(memoryInMB);
          setMinMemory(Math.min(2048, Math.floor(memoryInMB / 4)));
          setMaxMemory(Math.min(8192, Math.floor(memoryInMB / 2)));
        } else {
          const estimatedMemory = Math.min(16384, Math.max(4096, navigator.deviceMemory ? navigator.deviceMemory * 1024 : 8192));
          setTotalMemory(estimatedMemory);
        }
      } catch (error) {
        console.warn('No se pudo obtener la memoria total del sistema:', error);
        const memoryGuess = navigator.deviceMemory ? navigator.deviceMemory * 1024 : 8192;
        setTotalMemory(memoryGuess);
      }
    };

    loadSystemMemory();
  }, []);

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

  // Cargar versiones específicas del loader cuando se selecciona una versión de MC
  useEffect(() => {
    if (mcVersion) {
      loadLoaderVersions();
    }
  }, [loaderType, mcVersion]);

  const loadLoaderVersions = async () => {
    if (!mcVersion) return;

    setLoading(true);
    
    try {
      switch (loaderType) {
        case 'fabric':
          if (!fabricVersions[mcVersion]) {
            const versions = await integratedDownloadService.getFabricVersions(mcVersion);
            setFabricVersions(prev => ({ ...prev, [mcVersion]: versions }));
          }
          break;
        case 'forge':
          if (!forgeVersions[mcVersion]) {
            const versions = await integratedDownloadService.getForgeVersions(mcVersion);
            setForgeVersions(prev => ({ ...prev, [mcVersion]: versions }));
          }
          break;
        case 'quilt':
          if (!quiltVersions[mcVersion]) {
            const versions = await integratedDownloadService.getQuiltVersions(mcVersion);
            setQuiltVersions(prev => ({ ...prev, [mcVersion]: versions }));
          }
          break;
        case 'neoforge':
          if (!neoforgeVersions[mcVersion]) {
            const versions = await integratedDownloadService.getNeoForgeVersions(mcVersion);
            setNeoforgeVersions(prev => ({ ...prev, [mcVersion]: versions }));
          }
          break;
      }
    } catch (err) {
      console.error(`Error al cargar versiones de ${loaderType}:`, err);
      setError(`Error al cargar las versiones de ${loaderType}.`);
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

      // Crear la instancia con el nuevo servicio
      const createdInstance = await integratedDownloadService.createInstance({
        name: instanceName,
        version: mcVersion,
        loader: loaderType,
        javaVersion: javaVersion || '17',
        maxMemory,
        minMemory,
        jvmArgs: javaArgs ? javaArgs.split(' ') : undefined
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
      onClose();
    } catch (err) {
      console.error('Error al crear instancia:', err);
      setError(`Error al crear la instancia: ${(err as Error).message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const getMcVersions = () => {
    switch (loaderType) {
      case 'vanilla':
        return vanillaVersions.map(v => ({ id: v.id, name: `${v.id}` }));
      case 'forge':
        return Object.keys(forgeVersions).map(version => ({ id: version, name: version }));
      case 'fabric':
        return Object.keys(fabricVersions).map(version => ({ id: version, name: version }));
      case 'quilt':
        return Object.keys(quiltVersions).map(version => ({ id: version, name: version }));
      case 'neoforge':
        return Object.keys(neoforgeVersions).map(version => ({ id: version, name: version }));
      default:
        return [];
    }
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

              {error && (
                <div className="mb-6 p-4 bg-gradient-to-r from-red-900/50 to-red-800/30 border border-red-700/50 rounded-xl text-red-200 flex items-start">
                  <svg className="w-6 h-6 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Indicador de progreso global */}
              {overallProgress && (
                <div className="mb-6 bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-300">Progreso general:</span>
                    <span className="text-sm font-semibold text-blue-400">{Math.round(overallProgress.progress * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
                      style={{ width: `${overallProgress.progress * 100}%` }}
                    ></div>
                  </div>
                  <div className="mt-2 text-xs text-gray-400 flex justify-between">
                    <span>{overallProgress.statusText}</span>
                    <span>{overallProgress.activeOperations} operaciones activas</span>
                  </div>
                </div>
              )}

              {/* Estado de progreso actual */}
              {currentProgress && currentProgress.status !== 'completed' && currentProgress.status !== 'error' && (
                <div className="mb-6 bg-blue-900/20 p-3 rounded-lg border border-blue-700/50">
                  <div className="flex items-center text-blue-300 text-sm">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="font-medium">{currentProgress.target}</span>
                  </div>
                  <div className="mt-1 text-xs text-blue-400">
                    {currentProgress.details || currentProgress.operation}
                  </div>
                  <div className="mt-2 w-full bg-blue-800/50 rounded-full h-1.5">
                    <div 
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-300 ease-out" 
                      style={{ width: `${currentProgress.progress * 100}%` }}
                    ></div>
                  </div>
                  <div className="mt-1 text-xs text-blue-300 text-right">
                    {currentProgress.current} / {currentProgress.total}
                  </div>
                </div>
              )}

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
                          <button
                            key={type}
                            type="button"
                            onClick={() => setLoaderType(type)}
                            className={`py-2 px-1 rounded-lg border transition-all duration-300 transform hover:scale-105 min-h-[50px] flex flex-col justify-center items-center ${
                              loaderType === type
                                ? 'bg-gradient-to-br from-blue-600 to-purple-600 border-blue-500 text-white shadow-lg shadow-blue-500/30'
                                : 'bg-gray-700/50 border-gray-600/50 text-gray-300 hover:bg-gray-600/50 disabled:opacity-50'
                            }`}
                            disabled={loading}
                          >
                            <div className="text-[0.65rem] sm:text-xs font-medium text-center leading-tight">{type === 'neoforge' ? 'Neo\nForge' : type.charAt(0).toUpperCase() + type.slice(1)}</div>
                          </button>
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
                            if (loaderType === 'fabric' || loaderType === 'quilt') {
                              displayVersion = version.loader?.version || version.version;
                            } else if (loaderType === 'forge' || loaderType === 'neoforge') {
                              displayVersion = version.version;
                            }
                            
                            return (
                              <option key={index} value={displayVersion}>
                                {displayVersion}
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
                                Versión de Java
                              </label>
                              <select
                                value={javaVersion}
                                onChange={(e) => setJavaVersion(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-600/50 border border-gray-500/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                disabled={loading}
                              >
                                <option value="8">Java 8</option>
                                <option value="11">Java 11</option>
                                <option value="17" selected>Java 17</option>
                                <option value="21">Java 21</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Parámetros de Java
                              </label>
                              <input
                                type="text"
                                value={javaArgs}
                                onChange={(e) => setJavaArgs(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-600/50 border border-gray-500/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="-XX:+UseG1GC -Dfml.earlyprogresswindow=false"
                                disabled={loading}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Ruta de Java (opcional)
                              </label>
                              <input
                                type="text"
                                value={javaPath}
                                onChange={(e) => setJavaPath(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-600/50 border border-gray-500/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="C:/Program Files/Java/jdk/bin/java.exe"
                                disabled={loading}
                              />
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
                  <button
                    type="submit"
                    disabled={loading}
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
                    {loading ? 'Creando y descargando...' : 'Crear Instancia'}
                  </button>
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