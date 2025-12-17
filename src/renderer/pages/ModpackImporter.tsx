import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { Instance } from './Instances';
import { notificationService } from '../services/notificationService';
import { modpackImportService } from '../services/modpackImportService';
import { integratedDownloadService } from '../services/integratedDownloadService';
import TutorialOverlay from '../components/TutorialOverlay';
import { modpackImporterTutorialSteps } from '../data/tutorialSteps';

type ExportType = 'mod' | 'mods' | 'resourcepack' | 'shaderpack' | 'datapack' | 'instance' | 'custom';

// Definir tipos para el modpack
interface ModpackMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  mcVersion: string;
  loader: 'vanilla' | 'forge' | 'fabric' | 'quilt' | 'neoforge';
  modCount?: number;
  fileCount?: number;
  thumbnail?: string;
}

// Definir tipos para el estado de compatibilidad
interface CompatibilityCheck {
  compatible: boolean;
  message: string;
  compatibleInstances: Instance[];
  incompatibleInstances: Instance[];
}

export default function ModpackImporter() {
  const [source, setSource] = useState('');
  const [method, setMethod] = useState<'file' | 'url'>('file');
  const [instances, setInstances] = useState<Instance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const [modpackMetadata, setModpackMetadata] = useState<ModpackMetadata | null>(null);
  const [compatibility, setCompatibility] = useState<CompatibilityCheck | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isGeneratingUrl, setIsGeneratingUrl] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [currentStep, setCurrentStep] = useState<'import' | 'select' | 'compatibility' | 'importing'>('import');
  const [dragActive, setDragActive] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // Estado para exportación
  const [exportType, setExportType] = useState<ExportType>('mods');
  const [exportPath, setExportPath] = useState('');

  // Cargar instancias
  useEffect(() => {
    loadInstances();
  }, []);

  // Monitorear progreso de descarga en tiempo real
  useEffect(() => {
    if (!isImporting) return;

    const progressInterval = setInterval(async () => {
      try {
        const overall = await integratedDownloadService.getOverallProgress();
        if (overall) {
          setImportProgress(overall.progress || 0);
        }
      } catch (err) {
        console.error('Error al obtener progreso:', err);
      }
    }, 500); // Actualizar cada 500ms

    return () => clearInterval(progressInterval);
  }, [isImporting]);

  const loadInstances = async () => {
    try {
      if (window.api?.instances) {
        const instanceList = await window.api.instances.list();
        setInstances(instanceList);
      }
    } catch (error) {
      console.error('Error al cargar instancias:', error);
      notificationService.error('Error al cargar instancias');
    }
  };

  // Analizar el modpack desde archivo o URL
  const analyzeModpack = async (sourcePath: string) => {
    try {
      const metadata = await modpackImportService.analyzeModpack(sourcePath);
      setModpackMetadata(metadata);
      setCurrentStep('select');
    } catch (error) {
      console.error('Error al analizar modpack:', error);
      notificationService.error('Error al analizar el modpack. Verifica que sea un archivo válido.');
    }
  };

  // Verificar compatibilidad
  const checkCompatibility = () => {
    if (!modpackMetadata) return;

    const result = modpackImportService.checkCompatibility(modpackMetadata, instances);
    setCompatibility(result);
    setCurrentStep('compatibility');
  };

  // Importar modpack creando instancia automáticamente
  const importPackAndCreateInstance = async () => {
    if (!modpackMetadata) {
      notificationService.error('No hay modpack para importar');
      return;
    }

    setIsImporting(true);
    setCurrentStep('importing');
    setImportProgress(0);

    try {
      // Usar el nuevo método que crea la instancia automáticamente
      const createdInstance = await modpackImportService.importModpackAndCreateInstance(
        source,
        modpackMetadata,
        (progress) => setImportProgress(progress)
      );

      notificationService.success(`Modpack "${modpackMetadata.name}" importado exitosamente. Instancia creada: ${createdInstance.name}`);
      
      // Recargar la lista de instancias
      await loadInstances();
      
      setCurrentStep('import');
      setSource('');
      setModpackMetadata(null);
      setSelectedInstance(null);
      setCompatibility(null);
    } catch (error) {
      console.error('Error al importar modpack:', error);
      notificationService.error(`Error al importar modpack: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Importar modpack a instancia existente
  const importPack = async () => {
    if (!selectedInstance || !modpackMetadata) {
      notificationService.error('Por favor selecciona una instancia');
      return;
    }

    setIsImporting(true);
    setCurrentStep('importing');
    setImportProgress(0);

    try {
      await modpackImportService.importModpack(
        source,
        selectedInstance,
        (progress) => setImportProgress(progress)
      );

      notificationService.success(`Modpack importado exitosamente a ${instances.find(i => i.id === selectedInstance)?.name}`);
      setCurrentStep('import');
      setSource('');
      setModpackMetadata(null);
      setSelectedInstance(null);
      setCompatibility(null);
    } catch (error) {
      console.error('Error al importar modpack:', error);
      notificationService.error(`Error al importar modpack: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Generar URL temporal
  const generateTemporaryUrl = async () => {
    const pathToUse = exportPath || source; // Priorizar exportPath si está definido

    if (!pathToUse) {
      notificationService.error('Por favor selecciona una carpeta o archivo para exportar');
      return;
    }

    setIsGeneratingUrl(true);
    try {
      const tempUrl = await modpackImportService.generateTemporaryUrl(pathToUse);
      setGeneratedUrl(tempUrl);
      notificationService.success('URL generada exitosamente');
    } catch (error) {
      console.error('Error al generar URL:', error);
      notificationService.error(`Error al generar URL: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsGeneratingUrl(false);
    }
  };

  // Manejar la selección de archivo
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Si el archivo tiene una ruta real (Electron), usarla directamente
        if ((file as any).path) {
          const filePath = (file as any).path;
      setSource(filePath);
      await analyzeModpack(filePath);
        } else {
          // Si es una URL blob, copiar el archivo a un directorio temporal
          console.log('[ModpackImporter] Archivo sin ruta real, procesando como blob...');
          const arrayBuffer = await file.arrayBuffer();
          console.log('[ModpackImporter] ArrayBuffer obtenido, tamaño:', arrayBuffer.byteLength);
          
          // Convertir ArrayBuffer a Uint8Array para transferencia IPC
          const uint8Array = new Uint8Array(arrayBuffer);
          const bufferArray = Array.from(uint8Array);
          console.log('[ModpackImporter] Convertido a array, longitud:', bufferArray.length);
          
          // Verificar disponibilidad de la API
          console.log('[ModpackImporter] window.api disponible:', !!window.api);
          console.log('[ModpackImporter] window.api.modpackImport disponible:', !!window.api?.modpackImport);
          console.log('[ModpackImporter] window.api.modpackImport.saveTemporaryFile disponible:', !!window.api?.modpackImport?.saveTemporaryFile);
          
          // Usar el proceso principal para guardar el archivo temporal
          if (window.api?.modpackImport?.saveTemporaryFile) {
            try {
              console.log('[ModpackImporter] Guardando archivo temporal...');
              const tempPath = await window.api.modpackImport.saveTemporaryFile(
                bufferArray,
                file.name
              );
              console.log('[ModpackImporter] Archivo temporal guardado en:', tempPath);
              setSource(tempPath);
              await analyzeModpack(tempPath);
            } catch (error) {
              console.error('[ModpackImporter] Error al guardar archivo temporal:', error);
              notificationService.error(`Error al procesar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}. Por favor, intenta usar el botón "Seleccionar archivo".`);
            }
          } else {
            console.warn('[ModpackImporter] API saveTemporaryFile no disponible, usando fallback');
            // Fallback: usar el diálogo de archivos de Electron
            if (window.api?.dialog?.showOpenDialog) {
              notificationService.info('Por favor, selecciona el archivo usando el diálogo');
              const result = await window.api.dialog.showOpenDialog({
                properties: ['openFile'],
                filters: [{ name: 'Modpacks', extensions: ['zip', 'mrpack'] }]
              });
              if (!result.canceled && result.filePaths.length > 0) {
                setSource(result.filePaths[0]);
                await analyzeModpack(result.filePaths[0]);
              }
            } else {
              notificationService.error('No se pudo procesar el archivo. Por favor, usa el botón "Seleccionar archivo" en su lugar.');
            }
          }
        }
      } catch (error) {
        console.error('Error al procesar archivo:', error);
        notificationService.error('Error al procesar el archivo. Por favor, intenta de nuevo.');
      }
    }
  };

  // Manejar el drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      try {
        // Si el archivo tiene una ruta real (Electron), usarla directamente
        if ((file as any).path) {
          const filePath = (file as any).path;
      setSource(filePath);
          await analyzeModpack(filePath);
        } else {
          // Si es una URL blob, copiar el archivo a un directorio temporal
          const arrayBuffer = await file.arrayBuffer();
          
          // Convertir ArrayBuffer a Uint8Array para transferencia IPC
          const uint8Array = new Uint8Array(arrayBuffer);
          
          // Usar el proceso principal para guardar el archivo temporal
          if (window.api?.modpackImport?.saveTemporaryFile) {
            try {
              const tempPath = await window.api.modpackImport.saveTemporaryFile(
                Array.from(uint8Array), // Convertir a Array normal para IPC
                file.name
              );
              setSource(tempPath);
              await analyzeModpack(tempPath);
            } catch (error) {
              console.error('Error al guardar archivo temporal:', error);
              notificationService.error('Error al procesar el archivo. Por favor, intenta usar el botón "Seleccionar archivo".');
            }
          } else {
            // Fallback: usar el diálogo de archivos de Electron
            if (window.api?.dialog?.showOpenDialog) {
              const result = await window.api.dialog.showOpenDialog({
                properties: ['openFile'],
                filters: [{ name: 'Modpacks', extensions: ['zip', 'mrpack'] }]
              });
              if (!result.canceled && result.filePaths.length > 0) {
                setSource(result.filePaths[0]);
                await analyzeModpack(result.filePaths[0]);
              }
            } else {
              notificationService.error('No se pudo procesar el archivo arrastrado. Por favor, usa el botón "Seleccionar archivo" en su lugar.');
            }
          }
        }
      } catch (error) {
        console.error('Error al procesar archivo arrastrado:', error);
        notificationService.error('Error al procesar el archivo. Por favor, intenta de nuevo.');
      }
    }
  };

  // Manejar selección de carpeta/archivo para exportar
  const browseExportPath = async () => {
    if (window.api?.dialog?.showOpenDialog) {
      const result = await window.api.dialog.showOpenDialog({
        properties: exportType === 'mod' || exportType === 'resourcepack' || exportType === 'shaderpack' || exportType === 'datapack'
          ? ['openFile']
          : ['openDirectory'],
        filters: exportType === 'mod' ? [{ name: 'Mods', extensions: ['jar', 'zip'] }] : undefined
      });

      if (!result.canceled && result.filePaths.length > 0) {
        setExportPath(result.filePaths[0]);
      }
    }
  };

  // Volver al paso anterior
  const goBack = () => {
    if (currentStep === 'select') {
      setCurrentStep('import');
    } else if (currentStep === 'compatibility') {
      setCurrentStep('select');
    } else if (currentStep === 'importing') {
      setCurrentStep('compatibility');
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <div className="text-2xl font-bold text-white mb-6">Importar o Exportar Modpack</div>

      {/* Navegación de pasos */}
      <div className="mb-6">
        <div className="flex items-center justify-center">
          {['import', 'select', 'compatibility', 'importing'].map((step, index) => (
            <React.Fragment key={step}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === step
                    ? 'bg-blue-600 text-white'
                    : index < ['import', 'select', 'compatibility', 'importing'].indexOf(currentStep)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300'
                }`}
              >
                {index + 1}
              </div>
              {index < 3 && (
                <div className={`h-0.5 w-16 ${index < ['import', 'select', 'compatibility', 'importing'].indexOf(currentStep) ? 'bg-green-600' : 'bg-gray-600'}`}></div>
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>Importar</span>
          <span>Seleccionar</span>
          <span>Compatibilidad</span>
          <span>Importando</span>
        </div>
      </div>

      {/* Vista de importación */}
      {currentStep === 'import' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setMethod('file')}
              className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                method === 'file'
                  ? 'border-blue-500 bg-blue-500/10 text-white'
                  : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600'
              }`}
            >
              <div className="flex flex-col items-center">
                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="font-medium">Desde archivo</span>
                <span className="text-xs text-gray-400 mt-1">ZIP, MRPACK</span>
              </div>
            </button>

            <button
              onClick={() => setMethod('url')}
              className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                method === 'url'
                  ? 'border-blue-500 bg-blue-500/10 text-white'
                  : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600'
              }`}
            >
              <div className="flex flex-col items-center">
                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span className="font-medium">Desde URL</span>
                <span className="text-xs text-gray-400 mt-1">Compartido</span>
              </div>
            </button>
          </div>

          {method === 'file' ? (
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 bg-gray-800/30'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".zip,.mrpack"
                onChange={handleFileSelect}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <div className="text-lg font-medium text-white">Arrastra un modpack aquí</div>
                <div className="text-gray-400 mt-2">o haz clic para seleccionar un archivo</div>
                <div className="text-sm text-gray-500 mt-2">ZIP, MRPACK (MAX. 500MB)</div>
              </label>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">URL del modpack</label>
              <div className="flex gap-2">
                <input
                  value={source}
                  onChange={e => setSource(e.target.value)}
                  placeholder="https://ejemplo.com/modpack.mrpack"
                  className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  onClick={async () => {
                    if (source) {
                      await analyzeModpack(source);
                    }
                  }}
                  disabled={!source}
                >
                  Importar
                </Button>
              </div>
            </div>
          )}

          {/* Sección de exportación mejorada */}
          <div className="mt-8 p-6 bg-gray-800/30 rounded-xl border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Exportar contenido</h3>
            <p className="text-gray-400 mb-4">Selecciona mods, carpetas o archivos para compartir con otros</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de contenido a exportar</label>
                <select
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value as ExportType)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="mod">Mods individuales</option>
                  <option value="mods">Carpeta completa de mods</option>
                  <option value="resourcepack">Resourcepacks</option>
                  <option value="shaderpack">Shaderpacks</option>
                  <option value="datapack">Datapacks</option>
                  <option value="instance">Instancia completa</option>
                  <option value="custom">Carpeta personalizada</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={exportPath}
                  onChange={e => setExportPath(e.target.value)}
                  placeholder="Ruta de la carpeta o archivo a exportar"
                  className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  onClick={browseExportPath}
                  variant="secondary"
                >
                  Explorar
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={generateTemporaryUrl}
                  disabled={isGeneratingUrl || !exportPath}
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  {isGeneratingUrl ? 'Generando...' : `Generar URL temporal (${exportPath ? '500MB+' : '0MB'})`}
                </Button>
              </div>
            </div>

            {generatedUrl && (
              <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-mono text-gray-300 truncate">{generatedUrl}</div>
                  <button
                    onClick={() => navigator.clipboard.writeText(generatedUrl)}
                    className="ml-2 px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm"
                  >
                    Copiar
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Esta URL expirará en 24 horas • Soporta archivos de hasta 5GB
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vista de selección de instancia */}
      {currentStep === 'select' && modpackMetadata && (
        <div className="space-y-6">
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="flex items-start gap-4">
              <div className="bg-gray-700 rounded-lg w-16 h-16 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">{modpackMetadata.name}</h3>
                <p className="text-gray-400 text-sm">{modpackMetadata.description}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs">v{modpackMetadata.version}</span>
                  <span className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded-full text-xs">{modpackMetadata.loader}</span>
                  <span className="px-2 py-1 bg-green-900/50 text-green-300 rounded-full text-xs">MC {modpackMetadata.mcVersion}</span>
                  {modpackMetadata.modCount !== undefined && (
                    <span className="px-2 py-1 bg-purple-900/50 text-purple-300 rounded-full text-xs">{modpackMetadata.modCount} mods</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Opciones de importación</h3>
            
            {/* Opción para crear nueva instancia automáticamente */}
            <div className="mb-4 p-4 rounded-xl border-2 border-blue-500/50 bg-blue-500/10">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="font-semibold text-white mb-1">Crear nueva instancia automáticamente</div>
                  <div className="text-sm text-gray-300">
                    Se creará una instancia llamada "{modpackMetadata.name}" con Minecraft {modpackMetadata.mcVersion} y {modpackMetadata.loader}
                  </div>
                </div>
                <Button
                  onClick={importPackAndCreateInstance}
                  disabled={isImporting}
                >
                  {isImporting ? 'Importando...' : 'Crear e Importar'}
                </Button>
              </div>
            </div>

            {/* Opción para importar a instancia existente */}
            <div className="mb-4">
              <div className="text-sm text-gray-400 mb-2">O importar a una instancia existente:</div>
            <div className="grid gap-3">
              {instances.map(instance => (
                <div
                  key={instance.id}
                  onClick={() => setSelectedInstance(instance.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedInstance === instance.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800/70'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-white">{instance.name}</div>
                      <div className="text-sm text-gray-400">
                        {instance.version} {instance.loader && `• ${instance.loader}`}
                      </div>
                    </div>
                    {selectedInstance === instance.id && (
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="secondary" onClick={goBack}>Volver</Button>
            <Button
              onClick={checkCompatibility}
              disabled={!selectedInstance}
            >
              Verificar compatibilidad
            </Button>
          </div>
        </div>
      )}

      {/* Vista de compatibilidad */}
      {currentStep === 'compatibility' && compatibility && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${
              compatibility.compatible ? 'bg-green-900/20' : 'bg-red-900/20'
            }`}>
              <svg
                className={`w-8 h-8 ${compatibility.compatible ? 'text-green-500' : 'text-red-500'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {compatibility.compatible ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mt-4">
              {compatibility.compatible ? '¡Compatible!' : 'Incompatible'}
            </h3>
            <p className={`text-lg ${compatibility.compatible ? 'text-green-400' : 'text-red-400'}`}>
              {compatibility.message}
            </p>
          </div>

          {compatibility.compatibleInstances.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Instancias compatibles</h3>
              <div className="space-y-3">
                {compatibility.compatibleInstances.map(instance => (
                  <div
                    key={instance.id}
                    className="p-4 rounded-xl border border-gray-700 bg-gray-800/50"
                  >
                    <div className="font-medium text-white">{instance.name}</div>
                    <div className="text-sm text-gray-400">
                      {instance.version} • {instance.loader}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {compatibility.incompatibleInstances.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Instancias incompatibles</h3>
              <div className="space-y-3">
                {compatibility.incompatibleInstances.map(instance => (
                  <div
                    key={instance.id}
                    className="p-4 rounded-xl border border-gray-700 bg-gray-800/30"
                  >
                    <div className="font-medium text-white">{instance.name}</div>
                    <div className="text-sm text-gray-400">
                      {instance.version} • {instance.loader} • Incompatible
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="secondary" onClick={goBack}>Volver</Button>
            <Button onClick={importPack}>
              Importar a la instancia seleccionada
            </Button>
          </div>
        </div>
      )}

      {/* Vista de importación en progreso */}
      {currentStep === 'importing' && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <h3 className="text-xl font-bold text-white">Importando modpack...</h3>
          <p className="text-gray-400 mt-2">Esto puede tardar varios minutos dependiendo del tamaño del modpack</p>
          <div className="mt-6 w-full bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${importProgress}%` }}
            ></div>
          </div>
          <div className="text-sm text-gray-400 mt-2">{importProgress}% completado</div>
        </div>
      )}

      {/* Tutorial Overlay */}
      <TutorialOverlay pageId="modpack-importer" steps={modpackImporterTutorialSteps} />
    </Card>
  );
}
