import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Profile, profileService } from '../services/profileService';
import { instanceProfileService } from '../services/instanceProfileService';

interface InstanceConfig {
  id: string;
  name: string;
  version: string;
  loader?: 'vanilla' | 'forge' | 'fabric' | 'quilt' | 'neoforge';
  loaderVersion?: string;
  javaPath?: string;
  javaId?: string;
  maxMemory?: number;
  windowWidth?: number;
  windowHeight?: number;
  jvmArgs?: string[];
  createdAt: number;
  path: string;
  ready?: boolean;
}

interface InstanceEditModalProps {
  instance: InstanceConfig | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedInstance: InstanceConfig) => void;
  onDelete: (id: string) => void;
}

interface Version {
  id: string;
  type: string;
  url?: string;
  releaseTime?: string;
}

const InstanceEditModal: React.FC<InstanceEditModalProps> = ({ 
  instance, 
  isOpen, 
  onClose, 
  onSave, 
  onDelete 
}) => {
  const [name, setName] = useState('');
  const [version, setVersion] = useState('');
  const [loader, setLoader] = useState<'vanilla' | 'forge' | 'fabric' | 'quilt' | 'neoforge'>('vanilla');
  const [loaderVersion, setLoaderVersion] = useState('');
  const [javaPath, setJavaPath] = useState('');
  const [javaId, setJavaId] = useState('');
  const [maxMemory, setMaxMemory] = useState(4096);
  const [minMemory, setMinMemory] = useState(1024);
  const [totalMemory, setTotalMemory] = useState(8192);
  const [windowWidth, setWindowWidth] = useState(1280);
  const [windowHeight, setWindowHeight] = useState(720);
  const [jvmArgs, setJvmArgs] = useState('');
  const [createdAt, setCreatedAt] = useState<Date | null>(null);
  const [instancePath, setInstancePath] = useState('');
  const [availableVersions, setAvailableVersions] = useState<Version[]>([]);
  const [availableJava, setAvailableJava] = useState<{id: string, path: string, version: string}[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'java' | 'advanced'>('basic');

  useEffect(() => {
    if (isOpen && instance) {
      setName(instance.name);
      setVersion(instance.version);
      setLoader(instance.loader || 'vanilla');
      setLoaderVersion(instance.loaderVersion || '');
      setJavaPath(instance.javaPath || '');
      setJavaId(instance.javaId || '');
      setMaxMemory(instance.maxMemory || 4096);
      setWindowWidth(instance.windowWidth || 1280);
      setWindowHeight(instance.windowHeight || 720);
      setJvmArgs(instance.jvmArgs?.join(' ') || '');
      setCreatedAt(new Date(instance.createdAt));
      setInstancePath(instance.path);

      // Cargar versiones disponibles
      loadAvailableVersions();
      // Cargar Java disponibles
      loadAvailableJava();
    }
  }, [isOpen, instance]);

  // Actualizar la ruta de Java cuando se cambia la versión de Minecraft
  useEffect(() => {
    if (isOpen && instance && version && version !== instance.version) {
      const updateJavaPathForMinecraftVersion = async () => {
        try {
          // Usar el API de Java para obtener la ruta recomendada
          if (window.api?.java?.getJavaForMinecraftVersion) {
            const recommendedJavaPath = await window.api.java.getJavaForMinecraftVersion(version);
            // Solo actualizar si la nueva versión de Java es diferente a la actual
            if (recommendedJavaPath !== javaPath) {
              setJavaPath(recommendedJavaPath);

              // Intentar extraer el ID de Java del path para actualizar javaId también
              const javaIdMatch = recommendedJavaPath.match(/java(\d+)/i);
              if (javaIdMatch && javaIdMatch[1]) {
                const newJavaId = `java${javaIdMatch[1]}`;
                setJavaId(newJavaId);
              }
            }
          }
        } catch (error) {
          console.error('Error al actualizar la ruta de Java para la nueva versión de Minecraft:', error);
        }
      };

      updateJavaPathForMinecraftVersion();
    }
  }, [version, isOpen]);

  const loadAvailableVersions = async () => {
    try {
      // Simular carga de versiones, en realidad esto debería venir de tu servicio de versiones
      if (window.api?.versions?.list) {
        const versions = await window.api.versions.list();
        // Filtrar para obtener solo releases
        const releaseVersions = versions.filter((v: any) => v.type === 'release');
        setAvailableVersions(releaseVersions);
      }
    } catch (err) {
      console.error('Error al cargar versiones:', err);
    }
  };

  const loadAvailableJava = async () => {
    try {
      // Si está disponible el API de Java
      if (window.api?.java?.getAll) {
        const javaInstallations = await window.api.java.getAll();
        setAvailableJava(javaInstallations);
      } else {
        // Fallback: cargar Java desde el sistema
        const { javaDownloadService } = await import('../services/javaDownloadService');
        const systemJava = await javaDownloadService.scanForJavaInstallations();
        setAvailableJava(systemJava.map((j: any) => ({
          id: j.id,
          path: j.executable,
          version: j.version
        })));
      }
    } catch (err) {
      console.error('Error al cargar Java disponibles:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('El nombre de la instancia es obligatorio');
      return;
    }

    if (!version) {
      setError('Debes seleccionar una versión de Minecraft');
      return;
    }

    try {
      // Si la versión de Minecraft cambió y no se especificó una ruta de Java personalizada,
      // actualizar automáticamente la ruta de Java a la recomendada para la nueva versión
      let finalJavaPath = javaPath || undefined;
      let finalJavaId = javaId || undefined;

      if (instance && instance.version !== version && !javaPath) {
        // Si cambió la versión de Minecraft y no se tiene una ruta de Java personalizada,
        // obtener la versión de Java recomendada para la nueva versión de Minecraft
        if (window.api?.java?.getJavaForMinecraftVersion) {
          finalJavaPath = await window.api.java.getJavaForMinecraftVersion(version);
        } else {
          // Fallback: usar javaDownloadService directamente
          const { javaDownloadService } = await import('../services/javaDownloadService');
          finalJavaPath = await javaDownloadService.getJavaForMinecraftVersion(version);
        }
      } else {
        // Mantener las rutas de Java existentes o las nuevas si se especificaron
        finalJavaPath = javaPath || undefined;
        finalJavaId = javaId || undefined;
      }

      const updatedInstance: InstanceConfig = {
        ...instance!,
        name,
        version,
        loader: loader,
        loaderVersion: loaderVersion || undefined,
        javaPath: finalJavaPath,
        javaId: finalJavaId,
        maxMemory: maxMemory || undefined,
        minMemory: minMemory || undefined,
        windowWidth: windowWidth,
        windowHeight: windowHeight,
        jvmArgs: jvmArgs ? jvmArgs.split(' ').filter(arg => arg.trim() !== '') : undefined,
        path: instancePath
      };

      onSave(updatedInstance);
      onClose();
    } catch (err) {
      setError(`Error al guardar la instancia: ${(err as Error).message || 'Error desconocido'}`);
    }
  };

  const handleDelete = () => {
    if (instance && window.confirm(`¿Estás seguro de que quieres eliminar la instancia "${instance.name}"? Esta acción no se puede deshacer.`)) {
      onDelete(instance.id);
      onClose();
    }
  };

  if (!isOpen || !instance) return null;

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
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Editar Instancia: {instance.name}
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

              <form onSubmit={handleSubmit}>
                {/* Navegación por pestañas */}
                <div className="inline-flex items-center bg-gray-800/80 border border-gray-700/70 rounded-2xl p-1 text-xs text-gray-300 mb-6">
                  <button
                    type="button"
                    onClick={() => setActiveTab('basic')}
                    className={`px-4 py-2 rounded-xl transition-all ${
                      activeTab === 'basic'
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-black shadow-sm'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    Básico
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('java')}
                    className={`ml-1 px-4 py-2 rounded-xl transition-all ${
                      activeTab === 'java'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-black shadow-sm'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    Java
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('advanced')}
                    className={`ml-1 px-4 py-2 rounded-xl transition-all ${
                      activeTab === 'advanced'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-black shadow-sm'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    Avanzado
                  </button>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-red-900/50 to-red-800/30 border border-red-700/50 rounded-xl text-red-200 flex items-start mb-6">
                    <svg className="w-6 h-6 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                {/* Contenido de las pestañas */}
                <div className="space-y-6">
                  {activeTab === 'basic' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Nombre de la instancia
                          </label>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Nombre de la instancia"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Versión de Minecraft
                          </label>
                          <select
                            value={version}
                            onChange={(e) => setVersion(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          >
                            <option value="">Selecciona una versión</option>
                            {availableVersions.map(ver => (
                              <option key={ver.id} value={ver.id}>
                                {ver.id} ({ver.type})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Tipo de Loader
                          </label>
                          <select
                            value={loader}
                            onChange={(e) => setLoader(e.target.value as any)}
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          >
                            <option value="vanilla">Vanilla</option>
                            <option value="forge">Forge</option>
                            <option value="fabric">Fabric</option>
                            <option value="quilt">Quilt</option>
                            <option value="neoforge">NeoForge</option>
                          </select>
                        </div>

                        {loader !== 'vanilla' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Versión del Loader
                            </label>
                            <input
                              type="text"
                              value={loaderVersion}
                              onChange={(e) => setLoaderVersion(e.target.value)}
                              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              placeholder="Versión del loader (por ejemplo: 47.2.0)"
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Fecha de creación
                          </label>
                          <div className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-300">
                            {createdAt?.toLocaleString() || 'Fecha desconocida'}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Ruta de la instancia
                          </label>
                          <div className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-300 font-mono text-sm break-all">
                            {instancePath}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            ID de la instancia
                          </label>
                          <div className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-300 font-mono text-sm">
                            {instance.id}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'java' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Versión de Java
                          </label>
                          <select
                            value={javaId}
                            onChange={(e) => setJavaId(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          >
                            <option value="">Selecciona una versión de Java</option>
                            {availableJava.map(j => (
                              <option key={j.id} value={j.id}>
                                Java {j.version} - {j.path}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Ruta personalizada de Java
                          </label>
                          <input
                            type="text"
                            value={javaPath}
                            onChange={(e) => setJavaPath(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="C:/Program Files/Java/jdk/bin/java.exe"
                          />
                        </div>

                        <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/50">
                          <label className="block text-sm font-medium text-gray-300 mb-3">
                            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Configuración de Memoria
                          </label>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-300">
                                  Memoria RAM máxima (MB)
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
                                className="w-full h-2 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg appearance-none cursor-pointer"
                              />
                              <div className="flex justify-between text-xs text-gray-400 mt-1">
                                <span>1GB</span>
                                <span>{Math.min(totalMemory, 16384)}MB</span>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-300">
                                  Memoria RAM mínima (MB)
                                </label>
                                <span className="text-sm font-medium bg-gradient-to-r from-green-600 to-teal-600 text-white px-3 py-1 rounded-full min-w-[70px] text-center">
                                  {minMemory} MB
                                </span>
                              </div>
                              <input
                                type="range"
                                min="512"
                                max={maxMemory}
                                value={minMemory}
                                onChange={(e) => setMinMemory(parseInt(e.target.value))}
                                className="w-full h-2 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg appearance-none cursor-pointer"
                              />
                              <div className="flex justify-between text-xs text-gray-400 mt-1">
                                <span>512MB</span>
                                <span>{maxMemory}MB</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/50">
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Dimensiones de la ventana
                          </label>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-400 mb-1">Ancho</label>
                              <input
                                type="number"
                                value={windowWidth}
                                onChange={(e) => setWindowWidth(parseInt(e.target.value) || 800)}
                                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                min="800"
                                max="3840"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-400 mb-1">Alto</label>
                              <input
                                type="number"
                                value={windowHeight}
                                onChange={(e) => setWindowHeight(parseInt(e.target.value) || 600)}
                                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                min="600"
                                max="2160"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Argumentos JVM Personalizados
                          </label>
                          <textarea
                            value={jvmArgs}
                            onChange={(e) => setJvmArgs(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[100px]"
                            placeholder="-XX:+UseG1GC -Dfml.earlyprogresswindow=false"
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            Separa cada argumento con espacio (por ejemplo: "-XX:+UseG1GC -Xmx4G")
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'advanced' && (
                    <div className="space-y-6">
                      <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700/50">
                        <h3 className="text-lg font-semibold text-gray-200 mb-4">Configuración Avanzada</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Ruta de la instancia
                            </label>
                            <input
                              type="text"
                              value={instancePath}
                              onChange={(e) => setInstancePath(e.target.value)}
                              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              readOnly
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              ID de Instancia
                            </label>
                            <input
                              type="text"
                              value={instance.id}
                              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              readOnly
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Perfiles asociados
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {profileService.getAllProfiles().map(profile => {
                              const isLinked = instanceProfileService.isInstanceLinkedToProfile(instance.id, profile.username);
                              return (
                                <button
                                  key={profile.id}
                                  type="button"
                                  onClick={() => {
                                    if (isLinked) {
                                      instanceProfileService.unlinkInstanceFromProfile(instance.id, profile.username);
                                    } else {
                                      instanceProfileService.linkInstanceToProfile(instance.id, profile.username);
                                    }
                                  }}
                                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                                    isLinked
                                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                                  }`}
                                >
                                  {profile.username} {isLinked ? '✓' : ''}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="bg-red-900/20 p-6 rounded-xl border border-red-700/50">
                        <h3 className="text-lg font-semibold text-red-200 mb-4">Acciones Peligrosas</h3>
                        <div className="flex gap-4">
                          <button
                            type="button"
                            onClick={handleDelete}
                            className="px-6 py-3 bg-red-700 hover:bg-red-600 text-white rounded-xl transition-colors font-medium flex items-center"
                          >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Eliminar Instancia
                          </button>
                        </div>
                        <p className="text-sm text-red-400 mt-2">
                          Esta acción eliminará permanentemente la instancia y todos sus archivos.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-8 border-t border-gray-700/50">
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-6 py-3 bg-red-700 hover:bg-red-600 text-white rounded-xl transition-colors font-medium"
                  >
                    Eliminar
                  </button>
                  
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl transition-all font-medium flex items-center shadow-lg shadow-blue-500/20"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      Guardar Cambios
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InstanceEditModal;