// src/services/enhancedInstanceCreationService.ts
// Servicio maestro para orquestar la creación de instancias
// Cada loader tiene su propia lógica separada, este servicio solo coordina

import path from 'node:path';
import fs from 'node:fs';
import { getLauncherDataPath } from '../utils/paths';
import { logProgressService } from './logProgressService';
import { javaDownloadService } from './javaDownloadService';
import { versionService } from './versionService';

// Importar servicios de descarga (cada uno con su lógica separada)
import { downloadVanilla } from './descargas/vanilla/DownloadVanilla';
import { downloadFabric } from './descargas/fabric/DownloadFabric';
import { downloadForge } from './descargas/forge/DownloadForge';
import { downloadQuilt } from './descargas/quilt/DownloadQuilt';
import { downloadNeoForge } from './descargas/neoforge/DownloadNeoForge';

// Importar tipos de estado
import type { 
  InstanceCreationConfig, 
  InstanceCreationProgress
} from './instanceCreationState';
import { InstanceCreationStatus } from './instanceCreationState';
import { instanceDownloadPersistenceService, InstanceDownloadState } from './instanceDownloadPersistenceService';

/**
 * Interfaz para la configuración de una instancia
 */
export interface InstanceConfig {
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

/**
 * Servicio mejorado para la creación de instancias de Minecraft
 * 
 * IMPORTANTE: Este servicio NO implementa la lógica de cada loader.
 * Solo orquesta las llamadas a los servicios especializados de cada loader.
 * Cada loader tiene su propia lógica completamente separada.
 */
export class EnhancedInstanceCreationService {
  private basePath: string;
  private progressCallbacks: Map<string, (progress: InstanceCreationProgress) => void> = new Map();
  private cancellationTokens: Map<string, boolean> = new Map();

  constructor() {
    this.basePath = path.join(getLauncherDataPath(), 'instances');
    this.ensureDir(this.basePath);
  }

  /**
   * Asegura que un directorio exista
   */
  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Genera un ID único para la instancia basado en el nombre
   */
  private generateInstanceId(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Eliminar tildes
      .replace(/[^\w\s-]/g, '') // Eliminar caracteres especiales
      .replace(/\s+/g, '-') // Reemplazar espacios con guiones
      .replace(/-+/g, '-') // Eliminar múltiples guiones seguidos
      .trim();
  }

  /**
   * Registra un callback para recibir actualizaciones de progreso
   */
  onProgress(instanceId: string, callback: (progress: InstanceCreationProgress) => void): void {
    this.progressCallbacks.set(instanceId, callback);
  }

  /**
   * Cancela la creación de una instancia
   */
  cancelInstanceCreation(instanceId: string): void {
    this.cancellationTokens.set(instanceId, true);
  }

  /**
   * Verifica si la creación de la instancia ha sido cancelada
   */
  private isCancelled(instanceId: string): boolean {
    return this.cancellationTokens.get(instanceId) === true;
  }

  /**
   * Actualiza el progreso de la creación de la instancia
   */
  private updateProgress(
    instanceId: string,
    status: InstanceCreationStatus,
    currentStep: number,
    totalSteps: number,
    details?: string
  ): InstanceCreationProgress {
    const progress: InstanceCreationProgress = {
      status,
      progress: totalSteps > 0 ? currentStep / totalSteps : 0,
      step: this.getStatusDescription(status),
      totalSteps,
      currentStep,
      details
    };

    // Actualizar persistencia
    instanceDownloadPersistenceService.updateProgress(
      instanceId,
      progress.progress,
      details || this.getStatusDescription(status),
      Math.floor(currentStep),
      totalSteps
    );

    // Emitir progreso si hay un callback registrado
    const callback = this.progressCallbacks.get(instanceId);
    if (callback) {
      callback(progress);
    }

    return progress;
  }

  /**
   * Obtiene la descripción del estado
   */
  private getStatusDescription(status: InstanceCreationStatus): string {
    switch (status) {
      case InstanceCreationStatus.DOWNLOADING_JRE:
        return 'Verificando/Descargando JRE';
      case InstanceCreationStatus.CREATING_STRUCTURE:
        return 'Creando estructura de instancia';
      case InstanceCreationStatus.DOWNLOADING_VERSION_METADATA:
        return 'Descargando metadatos de la versión';
      case InstanceCreationStatus.DOWNLOADING_LIBRARIES:
        return 'Descargando bibliotecas';
      case InstanceCreationStatus.DOWNLOADING_CLIENT:
        return 'Descargando cliente';
      case InstanceCreationStatus.DOWNLOADING_ASSETS:
        return 'Descargando assets';
      case InstanceCreationStatus.INSTALLING_LOADER:
        return 'Instalando mod loader';
      case InstanceCreationStatus.VERIFYING_INTEGRITY:
        return 'Verificando integridad';
      case InstanceCreationStatus.COMPLETED:
        return 'Completado';
      case InstanceCreationStatus.PENDING:
        return 'Pendiente';
      case InstanceCreationStatus.ERROR:
        return 'Error';
      case InstanceCreationStatus.CANCELLED:
        return 'Cancelado';
      default:
        return 'Procesando';
    }
  }

  /**
   * Crea una instancia completa con todas las validaciones
   * 
   * IMPORTANTE: Este método solo orquesta. La lógica real está en cada servicio de descarga.
   */
  async createInstance(config: InstanceCreationConfig, instanceId?: string): Promise<InstanceConfig> {
    const id = instanceId || this.generateInstanceId(config.name);
    const progressId = id;
    
    // Verificar si la creación ha sido cancelada
    if (this.isCancelled(progressId)) {
      throw new Error('Creación de instancia cancelada por el usuario');
    }

    // Iniciar seguimiento de la descarga
    const instancePath = config.instancePath || path.join(this.basePath, id);
    const downloadState: InstanceDownloadState = {
      id: progressId,
      instanceName: config.name,
      instancePath,
      loader: config.loader || 'vanilla',
      mcVersion: config.version,
      loaderVersion: config.loaderVersion,
      status: 'pending',
      progress: 0,
      currentStep: 'Iniciando creación de instancia',
      totalSteps: 10,
      completedSteps: 0,
      startedAt: Date.now(),
      lastUpdated: Date.now(),
      downloadedFiles: [],
      pendingFiles: []
    };
    instanceDownloadPersistenceService.startTracking(downloadState);

    this.updateProgress(progressId, InstanceCreationStatus.PENDING, 0, 10, 'Iniciando creación de instancia');

    try {
      console.log(`[Instance Creation] ===== INICIANDO CREACIÓN DE INSTANCIA =====`);
      console.log(`[Instance Creation] Nombre: ${config.name}`);
      console.log(`[Instance Creation] Versión MC: ${config.version}`);
      console.log(`[Instance Creation] Loader: ${config.loader || 'vanilla'}`);
      console.log(`[Instance Creation] Loader Version: ${config.loaderVersion || 'NO ESPECIFICADA'}`);
      console.log(`[Instance Creation] ===========================================`);

      // PASO 1: Verificar y descargar JRE si es necesario
      this.updateProgress(progressId, InstanceCreationStatus.DOWNLOADING_JRE, 1, 10, 'Verificando Java Runtime Environment');
      const javaPath = await javaDownloadService.getJavaForMinecraftVersion(config.version);
      
      if (this.isCancelled(progressId)) {
        throw new Error('Creación de instancia cancelada por el usuario');
      }

      // PASO 2: Crear la estructura de la instancia
      this.updateProgress(progressId, InstanceCreationStatus.CREATING_STRUCTURE, 2, 10, 'Creando estructura de archivos');
      const instanceConfig = await this.createInstanceStructure(config, instancePath, id, javaPath);
      
      // IMPORTANTE: Marcar la instancia como NO lista hasta que todas las descargas terminen
      instanceConfig.ready = false;
      this.saveInstanceConfig(instancePath, instanceConfig);
      logProgressService.info(`[Instance Creation] Instancia marcada como NO lista (ready=false) hasta completar todas las descargas`);
      
      if (this.isCancelled(progressId)) {
        throw new Error('Creación de instancia cancelada por el usuario');
      }

      // PASO 3: Descargar metadatos de la versión (solo para validación, los servicios de descarga lo hacen internamente)
      this.updateProgress(progressId, InstanceCreationStatus.DOWNLOADING_VERSION_METADATA, 3, 10, 'Descargando metadatos de la versión');
      await versionService.getVersionDetails(await versionService.getVersionById(config.version)!);
      
      if (this.isCancelled(progressId)) {
        throw new Error('Creación de instancia cancelada por el usuario');
      }

      // PASO 4-7: Usar los servicios de descarga especializados según el loader
      // Cada servicio maneja su propia lógica completamente separada
      const loader = config.loader || 'vanilla';
      
      console.log(`[Instance Creation] Usando servicio de descarga: ${loader}`);
      
      switch (loader) {
        case 'vanilla':
          this.updateProgress(progressId, InstanceCreationStatus.DOWNLOADING_CLIENT, 4, 10, 'Descargando instancia Vanilla');
          // DownloadVanilla descarga: client.jar, version.json, libraries, assets
          await downloadVanilla.downloadInstance(config.version, instancePath);
          break;
          
        case 'fabric':
          this.updateProgress(progressId, InstanceCreationStatus.INSTALLING_LOADER, 4, 10, 'Instalando Fabric Loader');
          // DownloadFabric descarga vanilla primero, luego instala Fabric Loader
          await downloadFabric.downloadInstance(config.version, config.loaderVersion, instancePath);
          break;
          
        case 'forge':
          this.updateProgress(progressId, InstanceCreationStatus.INSTALLING_LOADER, 4, 10, 'Instalando Forge');
          // CRÍTICO: DownloadForge solo ejecuta el installer.jar oficial.
          // El installer genera el version.json en versions/ (en launcherDir, NO en instancePath).
          // NO descarga vanilla, NO descarga client.jar, NO instala nada en instancePath.
          // Todo lo gestiona el installer: version.json, librerías, etc. están en launcherDir.
          await downloadForge.downloadInstance(config.version, config.loaderVersion, instancePath);
          break;
          
        case 'quilt':
          this.updateProgress(progressId, InstanceCreationStatus.INSTALLING_LOADER, 4, 10, 'Instalando Quilt Loader');
          // DownloadQuilt descarga vanilla primero, luego instala Quilt Loader
          await downloadQuilt.downloadInstance(config.version, config.loaderVersion, instancePath);
          break;
          
        case 'neoforge':
          this.updateProgress(progressId, InstanceCreationStatus.INSTALLING_LOADER, 4, 10, 'Instalando NeoForge');
          // CRÍTICO: DownloadNeoForge solo ejecuta el installer.jar oficial.
          // El installer genera el version.json en versions/ (en launcherDir, NO en instancePath).
          // NO descarga vanilla, NO descarga client.jar, NO instala nada en instancePath.
          // Todo lo gestiona el installer: version.json, librerías, etc. están en launcherDir.
          await downloadNeoForge.downloadInstance(config.version, config.loaderVersion, instancePath);
          break;
      }

      if (this.isCancelled(progressId)) {
        throw new Error('Creación de instancia cancelada por el usuario');
      }

      // PASO 8: Verificar integridad (lógica específica por loader)
      this.updateProgress(progressId, InstanceCreationStatus.VERIFYING_INTEGRITY, 8, 10, 'Verificando integridad de archivos');
      await this.verifyInstanceIntegrity(instancePath, config.version, config.loader);
      
      if (this.isCancelled(progressId)) {
        throw new Error('Creación de instancia cancelada por el usuario');
      }

      // Actualizar estado final
      this.updateProgress(progressId, InstanceCreationStatus.COMPLETED, 10, 10, 'Instancia creada exitosamente');

      // Marcar descarga como completada
      instanceDownloadPersistenceService.markCompleted(progressId);

      // IMPORTANTE: Marcar instancia como lista SOLO cuando TODAS las descargas hayan terminado
      // Esto asegura que el botón de jugar no se active hasta que todo esté listo
      // Esperar un momento para asegurar que todas las descargas se hayan completado
      await new Promise(resolve => setTimeout(resolve, 500));
      
      instanceConfig.ready = true;
      this.saveInstanceConfig(instancePath, instanceConfig);
      
      logProgressService.success(`[Instance Creation] ✓ Todas las descargas completadas - Instancia lista para jugar`);
      logProgressService.info(`[Instance Creation] Instancia marcada como lista (ready=true)`);

      console.log(`[Instance Creation] ===========================================`);
      console.log(`Instancia ${config.name} (ID: ${id}) creada exitosamente en ${instancePath}`);
      console.log(`[Instance Creation] Estado: LISTA PARA JUGAR (ready=true)`);
      console.log(`[Instance Creation] ===========================================`);

      return instanceConfig;
    } catch (error) {
      const errorMessage = (error as Error).message;
      this.updateProgress(progressId, InstanceCreationStatus.ERROR, 0, 10, `Error: ${errorMessage}`);
      
      // Marcar descarga como error
      instanceDownloadPersistenceService.markError(progressId, errorMessage);
      
      console.error(`Error al crear instancia ${config.name}:`, error);
      throw error;
    } finally {
      // Limpiar tokens de cancelación
      this.cancellationTokens.delete(progressId);
    }
  }

  /**
   * Crea la estructura básica de la instancia
   */
  private async createInstanceStructure(
    config: InstanceCreationConfig,
    instancePath: string,
    id: string,
    javaPath: string
  ): Promise<InstanceConfig> {
    // Crear la carpeta de la instancia
    this.ensureDir(instancePath);

    // Crear la estructura de carpetas necesaria para una instancia de Minecraft
    const requiredFolders = [
      'mods',           // Mods de juego
      'resourcepacks',  // Paquetes de recursos
      'shaderpacks',    // Shaders (para OptiFine/Iris)
      'config',         // Configuración de mods y loader
      'saves',          // Mundos guardados
      'logs',           // Registros del cliente
      'natives'         // Bibliotecas nativas
    ];

    requiredFolders.forEach(folder => {
      const folderPath = path.join(instancePath, folder);
      this.ensureDir(folderPath);
    });

    // Crear el archivo de configuración de la instancia
    const instanceConfig: InstanceConfig = {
      id,
      name: config.name,
      version: config.version,
      loader: config.loader,
      loaderVersion: config.loaderVersion,
      javaPath,
      maxMemory: config.maxMemory,
      jvmArgs: config.jvmArgs,
      createdAt: Date.now(),
      path: instancePath,
      ready: false
    };

    this.saveInstanceConfig(instancePath, instanceConfig);

    return instanceConfig;
  }

  /**
   * Guarda la configuración de la instancia
   */
  private saveInstanceConfig(instancePath: string, config: InstanceConfig): void {
    const configPath = path.join(instancePath, 'instance.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }

  /**
   * Verifica la integridad de los archivos de la instancia
   * 
   * IMPORTANTE: Cada loader tiene diferentes requisitos:
   * - Vanilla/Fabric/Quilt: Requieren client.jar en la instancia (se descarga en instancePath/client.jar)
   * - Forge/NeoForge: NO requieren client.jar en la instancia. 
   *                   Solo validan que el installer haya generado el version.json en launcherDir/versions/
   *                   El installer NO instala nada en instancePath, todo está en launcherDir
   */
  private async verifyInstanceIntegrity(
    instancePath: string, 
    mcVersion: string, 
    loader?: 'vanilla' | 'forge' | 'fabric' | 'quilt' | 'neoforge'
  ): Promise<void> {
    console.log(`Verificando integridad de la instancia en ${instancePath} para Minecraft ${mcVersion} (loader: ${loader || 'vanilla'})`);

    // Leer configuración de la instancia
    const config = this.getInstanceConfig(instancePath);
    if (!config) {
      throw new Error(`Configuración de instancia no encontrada: ${instancePath}`);
    }

    // Verificación específica por loader
    if (loader === 'forge' || loader === 'neoforge') {
      // Forge/NeoForge: Validar SOLO que el installer haya generado el version.json
      // CRÍTICO: NO existe client.jar en instancePath - Forge NO lo necesita ni lo instala ahí.
      // El installer trabaja desde launcherDir y genera todo ahí (versions/, libraries/, etc.)
      if (!config.loaderVersion) {
        throw new Error(`Configuración de instancia incompleta: falta loaderVersion`);
      }

      // Normalizar loaderVersion
      let normalizedLoaderVersion = config.loaderVersion;
      if (config.loaderVersion.includes('-')) {
        const parts = config.loaderVersion.split('-');
        if (parts.length > 1) {
          normalizedLoaderVersion = parts[parts.length - 1];
        }
      }

      const launcherDataPath = getLauncherDataPath();
      const versionName = `${mcVersion}-${loader}-${normalizedLoaderVersion}`;
      const versionJsonPath = path.join(launcherDataPath, 'versions', versionName, `${versionName}.json`);
      
      if (!fs.existsSync(versionJsonPath)) {
        throw new Error(`Version.json de ${loader} no encontrado en: ${versionJsonPath}`);
      }

      // Validar que el version.json es válido
      try {
        const versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));
        if (!versionData.mainClass || !versionData.libraries) {
          throw new Error(`Version.json de ${loader} es inválido`);
        }
        console.log(`[${loader}] Version.json validado correctamente: ${versionName}`);
        console.log(`[${loader}] NOTA: Forge/NeoForge NO usa client.jar en la instancia. Todo está en launcherDir/versions/`);
      } catch (error) {
        throw new Error(`Error al validar version.json de ${loader}: ${error}`);
      }
    } else {
      // Vanilla/Fabric/Quilt: Validar client.jar en la instancia
      // Estos loaders SÍ necesitan client.jar descargado en instancePath/client.jar
      const clientJarPath = path.join(instancePath, 'client.jar');
      if (!fs.existsSync(clientJarPath)) {
        throw new Error(`client.jar no encontrado en ${clientJarPath}`);
      }

      const stats = fs.statSync(clientJarPath);
      if (stats.size < 1024 * 1024) { // Menos de 1MB
        throw new Error(`client.jar tiene tamaño inusualmente pequeño: ${stats.size} bytes`);
      }

      console.log(`[${loader || 'vanilla'}] client.jar validado: ${clientJarPath} (${stats.size} bytes)`);
    }

    // Verificar que el archivo de configuración exista y sea válido
    const configPath = path.join(instancePath, 'instance.json');
    if (!fs.existsSync(configPath)) {
      throw new Error(`Archivo de configuración no encontrado: ${configPath}`);
    }

    try {
      const configContent = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configContent) as InstanceConfig;
      
      if (!config.version || config.version !== mcVersion) {
        throw new Error(`Versión de la instancia no coincide con la versión esperada`);
      }
    } catch (error) {
      throw new Error(`Archivo de configuración dañado o inválido: ${error}`);
    }

    console.log(`Verificación de integridad completada para la instancia en ${instancePath}`);
  }

  /**
   * Obtiene la configuración de una instancia existente
   */
  public getInstanceConfig(instancePath: string): InstanceConfig | null {
    const configPath = path.join(instancePath, 'instance.json');
    if (!fs.existsSync(configPath)) {
      return null;
    }

    try {
      const configContent = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(configContent) as InstanceConfig;
    } catch (error) {
      console.error(`Error al leer la configuración de la instancia: ${error}`);
      return null;
    }
  }

  /**
   * Actualiza la configuración de una instancia existente
   */
  public updateInstanceConfig(instancePath: string, updates: Partial<InstanceConfig>): void {
    const config = this.getInstanceConfig(instancePath);
    if (!config) {
      throw new Error(`No se encontró la configuración de la instancia: ${instancePath}`);
    }

    const updatedConfig = { ...config, ...updates };
    this.saveInstanceConfig(instancePath, updatedConfig);
  }

  /**
   * Reanuda una descarga de instancia incompleta
   */
  async resumeInstanceDownload(downloadState: InstanceDownloadState): Promise<InstanceConfig> {
    console.log(`[Instance Creation] Reanudando descarga de instancia: ${downloadState.instanceName}`);
    
    // Verificar que la instancia no esté completa
    if (downloadState.status === 'completed') {
      throw new Error('La instancia ya está completa');
    }

    // Crear configuración desde el estado guardado
    const config: InstanceCreationConfig = {
      name: downloadState.instanceName,
      version: downloadState.mcVersion,
      loader: downloadState.loader,
      loaderVersion: downloadState.loaderVersion,
      instancePath: downloadState.instancePath
    };

    // Actualizar estado a downloading
    instanceDownloadPersistenceService.updateProgress(
      downloadState.id,
      downloadState.progress,
      'Reanudando descarga...',
      downloadState.completedSteps,
      downloadState.totalSteps
    );

    // Continuar desde donde se quedó
    try {
      return await this.createInstance(config, downloadState.id);
    } catch (error) {
      instanceDownloadPersistenceService.markError(downloadState.id, (error as Error).message);
      throw error;
    }
  }

  /**
   * Obtiene todas las descargas incompletas
   */
  getIncompleteDownloads(): InstanceDownloadState[] {
    return instanceDownloadPersistenceService.getIncompleteDownloads();
  }
}

export const enhancedInstanceCreationService = new EnhancedInstanceCreationService();

