import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Profile, profileService } from '../services/profileService';
import '../components/slider.css';

interface CreateInstanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Version {
  id: string;
  type: string;
  url?: string;
  stable?: boolean;
  version?: string;
}

const CreateInstanceModal: React.FC<CreateInstanceModalProps> = ({ isOpen, onClose }) => {
  const [instanceName, setInstanceName] = useState('');
  const [icon, setIcon] = useState<File | null>(null);
  const [iconUrl, setIconUrl] = useState('');
  const [loaderType, setLoaderType] = useState<'vanilla' | 'forge' | 'fabric' | 'quilt' | 'neoforge'>('vanilla');
  const [mcVersion, setMcVersion] = useState('');
  const [loaderVersion, setLoaderVersion] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [minMemory, setMinMemory] = useState(2048);
  const [maxMemory, setMaxMemory] = useState(4096);
  const [totalMemory, setTotalMemory] = useState(8192); // Valor por defecto en MB (8GB)

  // Cargar la memoria total del sistema cuando se monte el componente
  useEffect(() => {
    const loadSystemMemory = async () => {
      try {
        // Intentar obtener la memoria total del sistema a través de la API de Electron
        if (window.api?.system?.getTotalMemory) {
          const memory = await window.api.system.getTotalMemory();
          const memoryInMB = Math.floor(memory / (1024 * 1024)); // Convertir a MB
          setTotalMemory(memoryInMB);

          // Ajustar los valores iniciales basados en la RAM del sistema
          setMinMemory(Math.min(2048, Math.floor(memoryInMB / 4))); // Mínimo 2GB o 1/4 de RAM total
          setMaxMemory(Math.min(8192, Math.floor(memoryInMB / 2))); // Máximo 8GB o 1/2 de RAM total
        } else {
          // Si no está disponible, usar valores por defecto basados en estimación
          const estimatedMemory = Math.min(16384, Math.max(4096, navigator.deviceMemory ? navigator.deviceMemory * 1024 : 8192));
          setTotalMemory(estimatedMemory);
        }
      } catch (error) {
        console.warn('No se pudo obtener la memoria total del sistema:', error);
        // Si falla, usar valores por defecto basados en navegador o valor estándar
        const memoryGuess = navigator.deviceMemory ? navigator.deviceMemory * 1024 : 8192;
        setTotalMemory(memoryGuess);
      }
    };

    loadSystemMemory();
  }, []);
  const [javaArgs, setJavaArgs] = useState('');
  const [javaPath, setJavaPath] = useState('');
  
  // Estados para almacenar las versiones disponibles
  const [vanillaVersions, setVanillaVersions] = useState<Version[]>([]);
  const [forgeVersions, setForgeVersions] = useState<Version[]>([]);
  const [fabricVersions, setFabricVersions] = useState<Version[]>([]);
  const [quiltVersions, setQuiltVersions] = useState<Version[]>([]);
  const [neoforgeVersions, setNeoforgeVersions] = useState<Version[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar las versiones disponibles cuando se abra el modal o cambie el loader
  useEffect(() => {
    if (isOpen) {
      loadVersions();
    }
  }, [isOpen, loaderType]);

  const loadVersions = async () => {
    if (!isOpen) return;

    setLoading(true);
    setError(null);

    try {
      if (loaderType === 'vanilla') {
        // Cargar versiones de Vanilla
        const vanillaResponse = await fetch('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json');
        const vanillaData = await vanillaResponse.json();
        const allVersions = vanillaData.versions;

        // Filtrar versiones desde 1.0 en adelante
        const filteredVersions = allVersions.filter((v: any) =>
          parseFloat(v.id.split('.')[0] + '.' + v.id.split('.')[1]) >= 1.0
        );

        setVanillaVersions(filteredVersions);
        setMcVersion(''); // Reiniciar selección
      } else if (loaderType === 'forge') {
        // Cargar versiones de Forge desde la API correcta
        const forgeResponse = await fetch('https://maven.minecraftforge.net/net/minecraftforge/forge/maven-metadata.json');
        let forgeData;

        // Si la API de Maven falla, usar una alternativa o datos predeterminados
        if (!forgeResponse.ok) {
          // Usar datos alternativos para Forge
          forgeData = {
            versions: [
              { version: '1.20.1-47.3.0', mcversion: '1.20.1' },
              { version: '1.20.1-47.2.29', mcversion: '1.20.1' },
              { version: '1.20.1-47.2.0', mcversion: '1.20.1' },
              { version: '1.19.4-45.2.0', mcversion: '1.19.4' },
              { version: '1.18.2-40.2.10', mcversion: '1.18.2' },
              { version: '1.17.1-37.1.1', mcversion: '1.17.1' },
              { version: '1.16.5-36.2.39', mcversion: '1.16.5' },
              { version: '1.15.2-31.2.57', mcversion: '1.15.2' },
              { version: '1.14.4-28.2.27', mcversion: '1.14.4' },
              { version: '1.12.2-14.23.5.2860', mcversion: '1.12.2' },
              { version: '1.7.10-10.13.4.1614', mcversion: '1.7.10' },
            ]
          };
        } else {
          forgeData = await forgeResponse.json();
        }

        // Procesar las versiones de Forge
        const forgeVersionList = forgeData.versions
          .map((item: any) => {
            // Separar la versión de Forge de la versión de Minecraft (formato: mcversion-forgeversion)
            const parts = item.version ? item.version.split('-') : [];
            if (parts.length >= 2) {
              const mcVersion = parts[0];
              const forgeVersion = parts.slice(1).join('-');
              return {
                id: mcVersion,
                type: 'stable',
                mcVersion: mcVersion,
                forgeVersion: item.version
              };
            }
            return null;
          })
          .filter((item: any) => item !== null);

        setForgeVersions(forgeVersionList);
        setMcVersion(''); // Reiniciar selección
      } else if (loaderType === 'fabric') {
        // Cargar versiones de Fabric
        const fabricResponse = await fetch('https://meta.fabricmc.net/v2/versions/loader');
        const fabricData = await fabricResponse.json();

        // Agrupar por versión de Minecraft
        const fabricVersionMap = new Map();
        fabricData.forEach((entry: any) => {
          // Verificar que entry y entry.loader existan antes de acceder a sus propiedades
          if (entry && entry.loader) {
            const minecraftVersion = entry.minecraft;
            const loaderVersion = entry.loader.version;

            if (!fabricVersionMap.has(minecraftVersion)) {
              fabricVersionMap.set(minecraftVersion, []);
            }
            fabricVersionMap.get(minecraftVersion).push({
              id: loaderVersion,
              type: entry.loader.stable ? 'stable' : 'beta',
              minecraft: minecraftVersion
            });
          }
        });

        // Formatear versiones para que contengan las versiones de MC y Fabric
        const fabricVersionsList = Array.from(fabricVersionMap.entries())
          .map(([mc, loaders]) => loaders.map((loader: any) => ({
            id: mc,
            type: loader.type,
            mcVersion: mc,
            fabricVersion: loader.id
          })))
          .flat();

        setFabricVersions(fabricVersionsList);
        setMcVersion(''); // Reiniciar selección
      } else if (loaderType === 'quilt') {
        // Cargar versiones de Quilt
        const quiltResponse = await fetch('https://meta.quiltmc.org/v3/versions/loader');
        const quiltData = await quiltResponse.json();

        // Agrupar por versión de Minecraft
        const quiltVersionMap = new Map();
        quiltData.forEach((entry: any) => {
          // Verificar que entry y entry.loader existan antes de acceder a sus propiedades
          if (entry && entry.loader) {
            const minecraftVersion = entry.minecraft;
            const loaderVersion = entry.loader.version;

            if (!quiltVersionMap.has(minecraftVersion)) {
              quiltVersionMap.set(minecraftVersion, []);
            }
            quiltVersionMap.get(minecraftVersion).push({
              id: loaderVersion,
              type: entry.loader.stable ? 'stable' : 'beta',
              minecraft: minecraftVersion
            });
          }
        });

        // Formatear versiones para que contengan las versiones de MC y Quilt
        const quiltVersionsList = Array.from(quiltVersionMap.entries())
          .map(([mc, loaders]) => loaders.map((loader: any) => ({
            id: mc,
            type: loader.type,
            mcVersion: mc,
            quiltVersion: loader.id
          })))
          .flat();

        setQuiltVersions(quiltVersionsList);
        setMcVersion(''); // Reiniciar selección
      } else if (loaderType === 'neoforge') {
        // Cargar versiones de NeoForge con manejo de errores para CORS
        let neoforgeData;

        try {
          const neoforgeResponse = await fetch('https://maven.neoforged.net/api/maven/versions/releases');
          if (neoforgeResponse.ok) {
            neoforgeData = await neoforgeResponse.json();
          } else {
            throw new Error('Respuesta no OK');
          }
        } catch (error) {
          // En caso de error (como bloqueo CORS), usar datos predeterminados
          neoforgeData = {
            versions: [
              '20.4.10-beta',
              '20.4.9-beta',
              '1.20.1-47.3.0',
              '1.20.1-47.2.0',
              '1.20.6-20.6.10-beta',
              '1.21.1-999.999.999'
            ]
          };
        }

        // Formatear versiones de NeoForge
        const neoforgeVersionList = neoforgeData.versions
          .filter((version: string) => version.startsWith('1.20') || version.startsWith('1.21'))
          .map((version: string) => {
            // Extraer la versión de MC de la versión de NeoForge
            let mcVersion = '1.20.1'; // Valor por defecto
            if (version.startsWith('1.20')) {
              mcVersion = version.startsWith('1.20.6') ? '1.20.6' :
                         version.startsWith('1.20.4') ? '1.20.4' :
                         version.startsWith('1.20.1') ? '1.20.1' : '1.20.1';
            } else if (version.startsWith('1.21')) {
              mcVersion = '1.21.1';
            }

            return {
              id: mcVersion,
              type: 'stable',
              mcVersion: mcVersion,
              neoforgeVersion: version
            };
          });

        setNeoforgeVersions(neoforgeVersionList);
        setMcVersion(''); // Reiniciar selección
      }
    } catch (err) {
      console.error('Error al cargar versiones:', err);
      setError('Error al cargar las versiones disponibles. Por favor, inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Función para iniciar el proceso de descarga de archivos necesarios
  const startDownloadProcess = async (
    instanceName: string, 
    mcVersion: string, 
    loaderType: 'vanilla' | 'forge' | 'fabric' | 'quilt' | 'neoforge', 
    loaderVersion: string
  ) => {
    try {
      // Obtener información del cliente de Minecraft de la API de Mojang
      const manifestResponse = await fetch('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json');
      const manifest = await manifestResponse.json();
      
      // Encontrar la versión específica
      const versionInfo = manifest.versions.find((v: any) => v.id === mcVersion);
      if (!versionInfo) {
        throw new Error(`Versión ${mcVersion} no encontrada`);
      }
      
      // Obtener metadatos de la versión
      const versionResponse = await fetch(versionInfo.url);
      const versionData = await versionResponse.json();
      
      // Descargar el JAR del cliente
      const clientDownload = {
        url: versionData.downloads.client.url,
        filename: `versions/${mcVersion}/${mcVersion}.jar`,
        itemId: `${instanceName}-client-jar`
      };
      
      window.api.download.start(clientDownload);
      
      // Descargar librerías necesarias
      if (versionData.libraries && Array.isArray(versionData.libraries)) {
        for (const library of versionData.libraries) {
          if (library.downloads && library.downloads.artifact) {
            const libraryDownload = {
              url: library.downloads.artifact.url,
              filename: `libraries/${library.name.replace(':', '/')}.jar`,
              itemId: `${instanceName}-${library.name.replace(':', '-')}`
            };
            
            window.api.download.start(libraryDownload);
          }
        }
      }
      
      // Si es un mod loader, descargar los archivos adicionales
      if (loaderType !== 'vanilla') {
        await downloadLoaderFiles(loaderType, mcVersion, loaderVersion, instanceName);
      }
    } catch (err) {
      console.error('Error en el proceso de descarga:', err);
      throw err;
    }
  };

  // Función para descargar archivos del loader
  const downloadLoaderFiles = async (
    loaderType: 'forge' | 'fabric' | 'quilt' | 'neoforge',
    mcVersion: string,
    loaderVersion: string,
    instanceName: string
  ) => {
    switch (loaderType) {
      case 'fabric':
        // Obtener la versión del loader de Fabric
        const fabricResponse = await fetch(`https://meta.fabricmc.net/v2/versions/loader/${mcVersion}/${loaderVersion}/profile/json`);
        const fabricProfile = await fabricResponse.json();
        
        // Procesar e iniciar descargas de Fabric
        if (fabricProfile.libraries && Array.isArray(fabricProfile.libraries)) {
          for (const library of fabricProfile.libraries) {
            if (library.downloads && library.downloads.artifact) {
              const libraryDownload = {
                url: library.downloads.artifact.url,
                filename: `libraries/${library.name.replace(':', '/')}.jar`,
                itemId: `${instanceName}-fabric-${library.name.replace(':', '-')}`
              };
              
              window.api.download.start(libraryDownload);
            }
          }
        }
        break;
        
      case 'forge':
        // Para Forge, necesitamos encontrar el instalador o la versión específica
        const forgeResponse = await fetch('https://files.minecraftforge.net/net/minecraftforge/forge/promotions_v3.json');
        const forgeData = await forgeResponse.json();
        const forgeVersion = forgeData.promos[`${mcVersion}-latest`] || forgeData.promos[`${mcVersion}-recommended`];
        
        if (forgeVersion && forgeVersion.url) {
          const forgeDownload = {
            url: forgeVersion.url,
            filename: `libraries/net/minecraftforge/forge/${mcVersion}-${forgeVersion.version}/forge-${mcVersion}-${forgeVersion.version}.jar`,
            itemId: `${instanceName}-forge-installer`
          };
          
          window.api.download.start(forgeDownload);
        }
        break;
        
      case 'quilt':
        // Obtener la versión del loader de Quilt
        const quiltResponse = await fetch(`https://meta.quiltmc.org/v3/versions/loader/${mcVersion}/${loaderVersion}/profile/json`);
        const quiltProfile = await quiltResponse.json();
        
        // Procesar e iniciar descargas de Quilt
        if (quiltProfile.libraries && Array.isArray(quiltProfile.libraries)) {
          for (const library of quiltProfile.libraries) {
            if (library.downloads && library.downloads.artifact) {
              const libraryDownload = {
                url: library.downloads.artifact.url,
                filename: `libraries/${library.name.replace(':', '/')}.jar`,
                itemId: `${instanceName}-quilt-${library.name.replace(':', '-')}`
              };
              
              window.api.download.start(libraryDownload);
            }
          }
        }
        break;
        
      case 'neoforge':
        // Obtener versiones de NeoForge
        // Nota: NeoForge usa la API de Forge para obtener información pero con diferencias
        // La implementación específica dependerá de la API oficial de NeoForge
        break;
    }
  };

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
    
    // Simular proceso de creación
    setLoading(true);
    setError(null);
    
    try {
      // Verificar que la API esté disponible
      if (!window.api?.instances) {
        throw new Error('API de instancias no disponible');
      }
      
      // Obtener la versión del loader correspondiente
      const selectedLoaderVersion = loaderType !== 'vanilla' ? getLoaderVersionForMc() : undefined;

      // Crear la instancia con la API
      const instanceData = {
        name: instanceName,
        version: mcVersion,
        loader: loaderType,
        loaderVersion: selectedLoaderVersion,
        icon: iconUrl || undefined,
        config: {
          minMemory: Math.max(512, Math.floor(maxMemory / 4)), // Establecer minMemory como 1/4 de maxMemory
          maxMemory,
          javaArgs,
          javaPath
        },
        type: 'owned' as const // Establecer como instancia propia
      };

      // Crear la carpeta de la instancia y estructura necesaria
      await window.api.instances.create(instanceData);

      // Iniciar el proceso de descarga de archivos necesarios
      await startDownloadProcess(instanceName, mcVersion, loaderType, selectedLoaderVersion || '');
      
      // Cerrar modal después de crear
      onClose();
    } catch (err) {
      console.error('Error al crear instancia:', err);
      setError(`Error al crear la instancia: ${(err as Error).message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const getMcVersions = () => {
    switch(loaderType) {
      case 'vanilla':
        return vanillaVersions.map(v => ({ id: v.id, name: `${v.id} (${v.type})` }));
      case 'forge':
        // Obtener versiones únicas de Minecraft de las versiones de Forge
        const uniqueMcVersions = [...new Set(forgeVersions.map(v => v.mcVersion))];
        return uniqueMcVersions.map(version => ({ id: version, name: version }));
      case 'fabric':
        // Obtener versiones únicas de Minecraft de las versiones de Fabric
        const uniqueFabricMcVersions = [...new Set(fabricVersions.map(v => v.mcVersion))];
        return uniqueFabricMcVersions.map(version => ({ id: version, name: version }));
      case 'quilt':
        // Obtener versiones únicas de Minecraft de las versiones de Quilt
        const uniqueQuiltMcVersions = [...new Set(quiltVersions.map(v => v.mcVersion))];
        return uniqueQuiltMcVersions.map(version => ({ id: version, name: version }));
      case 'neoforge':
        // Obtener versiones únicas de Minecraft de las versiones de NeoForge
        const uniqueNeoforgeMcVersions = [...new Set(neoforgeVersions.map(v => v.mcVersion))];
        return uniqueNeoforgeMcVersions.map(version => ({ id: version, name: version }));
      default:
        return [];
    }
  };

  // Obtener la versión específica del loader para la versión de Minecraft seleccionada
  const getLoaderVersionForMc = () => {
    switch(loaderType) {
      case 'forge':
        const forgeMatch = forgeVersions.find(v => v.mcVersion === mcVersion);
        return forgeMatch ? forgeMatch.forgeVersion : '';
      case 'fabric':
        const fabricMatch = fabricVersions.filter(v => v.mcVersion === mcVersion);
        // Devolver la versión más reciente si hay múltiples
        return fabricMatch.length > 0 ? fabricMatch[0].fabricVersion : '';
      case 'quilt':
        const quiltMatch = quiltVersions.filter(v => v.mcVersion === mcVersion);
        // Devolver la versión más reciente si hay múltiples
        return quiltMatch.length > 0 ? quiltMatch[0].quiltVersion : '';
      case 'neoforge':
        const neoforgeMatch = neoforgeVersions.find(v => v.mcVersion === mcVersion);
        return neoforgeMatch ? neoforgeMatch.neoforgeVersion : '';
      default:
        return '';
    }
  };

  if (!isOpen) return null;

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
          className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-1 w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl shadow-blue-500/10"
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

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  />
                </div>

                <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700/30">
                  <label className="block text-sm font-medium text-gray-300 mb-4">
                    <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Imagen/Icono
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-gray-400">Desde URL</label>
                      <input
                        type="text"
                        value={iconUrl}
                        onChange={(e) => setIconUrl(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="https://ejemplo.com/icono.png"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-gray-400">Desde PC</label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setIcon(e.target.files?.[0] || null)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <button
                          type="button"
                          className="w-full py-2.5 px-4 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 rounded-lg text-white text-sm transition-all duration-300 flex items-center justify-center border-2 border-dashed border-gray-600 hover:border-blue-500/50 group"
                        >
                          <svg className="w-4 h-4 mr-2 text-gray-400 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span className="text-gray-300 group-hover:text-white transition-colors">Cargar archivo</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  {icon && (
                    <div className="mt-3 text-sm text-gray-300 bg-gray-700/30 px-3 py-2 rounded-lg">
                      <span className="font-medium">Archivo seleccionado:</span> {icon.name}
                    </div>
                  )}
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
                            : 'bg-gray-700/50 border-gray-600/50 text-gray-300 hover:bg-gray-600/50'
                        }`}
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
                  >
                    <option value="">Selecciona una versión</option>
                    {getMcVersions().map(version => (
                      <option key={version.id} value={version.id}>
                        {version.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mostrar la versión del loader que se usará (solo para loaders no vanilla) */}
                {loaderType !== 'vanilla' && mcVersion && (
                  <div className="bg-gray-800/30 p-5 rounded-xl border border-gray-700/30">
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Versión del Loader
                    </label>
                    <div className="px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white">
                      {getLoaderVersionForMc() || (
                        <div className="flex items-center text-yellow-400">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Cargando...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-gray-800/30 p-5 rounded-xl border border-gray-700/30">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full py-3 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 rounded-xl text-white flex items-center justify-between transition-all duration-300"
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
                            max={Math.min(totalMemory, 16384)} // Límite de 16GB o la RAM total, lo que sea menor
                            value={maxMemory}
                            onChange={(e) => {
                              const newMax = parseInt(e.target.value);
                              setMaxMemory(newMax);
                              // Mantener minMemory como un valor razonable (1/4 de maxMemory o 1024MB, lo que sea mayor)
                              setMinMemory(Math.max(1024, Math.floor(newMax / 4)));
                            }}
                            className="w-full h-2 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg appearance-none cursor-pointer slider"
                          />
                          <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>1GB</span>
                            <span>{Math.min(totalMemory, 16384)}MB</span>
                          </div>
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
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Ruta de Java
                          </label>
                          <input
                            type="text"
                            value={javaPath}
                            onChange={(e) => setJavaPath(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-600/50 border border-gray-500/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="C:/Program Files/Java/jdk/bin/java.exe"
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
                {loading ? 'Creando...' : 'Crear Instancia'}
              </button>
            </div>
          </form>
        </div> {/* Cierre del div de contenido principal */}
      </div> {/* Cierre del div con gradiente */}
    </motion.div> {/* Cierre del motion.div principal */}
  </motion.div> {/* Cierre del contenedor exterior */}
</AnimatePresence>
  );
};

export default CreateInstanceModal;