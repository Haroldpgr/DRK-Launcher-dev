import path from 'node:path';
import fs from 'node:fs';
import { getLauncherDataPath } from '../utils/paths';
import { InstanceCreationProgress, InstanceCreationStatus, InstanceCreationConfig } from './instanceCreationState';
import { javaDownloadService } from './javaDownloadService';
import { versionService } from './versionService';
import { minecraftDownloadService } from './minecraftDownloadService';
import { gameLaunchService } from './gameLaunchService';
import { instanceDownloadPersistenceService, InstanceDownloadState } from './instanceDownloadPersistenceService';
// Importar servicios de descarga organizados
import { downloadVanilla } from './descargas/vanilla/DownloadVanilla';
import { downloadFabric } from './descargas/fabric/DownloadFabric';
import { downloadForge } from './descargas/forge/DownloadForge';
import { downloadQuilt } from './descargas/quilt/DownloadQuilt';
import { downloadNeoForge } from './descargas/neoforge/DownloadNeoForge';

/**
 * Interfaz para el estado de la instancia
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
   * Asegura que un directorio exista, creándolo si es necesario
   * @param dir Directorio a asegurar
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
    // Convertir el nombre a un formato seguro para usar como nombre de carpeta
    return name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Eliminar tildes
      .replace(/[^\w\s-]/g, '') // Eliminar caracteres especiales
      .replace(/\s+/g, '-') // Reemplazar espacios con guiones
      .replace(/-+/g, '-') // Eliminar múltiples guiones seguidos
      .trim(); // Eliminar espacios al inicio y final
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

    // Actualizar persistencia
    instanceDownloadPersistenceService.updateProgress(
      instanceId,
      progress.progress,
      details || this.getStatusDescription(status),
      Math.floor(currentStep),
      totalSteps
    );

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
      console.log(`[Instance Creation] Java Version: ${config.javaVersion || 'NO ESPECIFICADA'}`);
      console.log(`[Instance Creation] ===========================================`);

      // PASO 1: Verificar y descargar JRE si es necesario
      this.updateProgress(progressId, InstanceCreationStatus.DOWNLOADING_JRE, 1, 10, 'Verificando Java Runtime Environment');
      const javaPath = await javaDownloadService.getJavaForMinecraftVersion(config.version);
      
      if (this.isCancelled(progressId)) {
        throw new Error('Creación de instancia cancelada por el usuario');
      }

      // PASO 2: Crear la estructura de la instancia
      this.updateProgress(progressId, InstanceCreationStatus.CREATING_STRUCTURE, 2, 10, 'Creando estructura de archivos');
      const instancePath = config.instancePath || path.join(this.basePath, id);
      const instanceConfig = await this.createInstanceStructure(config, instancePath, id, javaPath);
      
      if (this.isCancelled(progressId)) {
        throw new Error('Creación de instancia cancelada por el usuario');
      }

      // PASO 3: Descargar metadatos de la versión
      this.updateProgress(progressId, InstanceCreationStatus.DOWNLOADING_VERSION_METADATA, 3, 10, 'Descargando metadatos de la versión');
      await versionService.getVersionDetails(await versionService.getVersionById(config.version)!);
      
      if (this.isCancelled(progressId)) {
        throw new Error('Creación de instancia cancelada por el usuario');
      }

      // PASO 4-7: Usar los servicios de descarga organizados según el loader
      // Cada servicio de descarga maneja: client.jar, assets, librerías base y loader específico
      const loader = config.loader || 'vanilla';
      
      console.log(`[Instance Creation] Usando servicio de descarga: ${loader}`);
      
      switch (loader) {
        case 'vanilla':
          this.updateProgress(progressId, InstanceCreationStatus.DOWNLOADING_CLIENT, 4, 10, 'Descargando instancia Vanilla');
          await downloadVanilla.downloadInstance(config.version, instancePath);
          // downloadVanilla ya descarga: client.jar, assets y librerías
          break;
          
        case 'fabric':
          this.updateProgress(progressId, InstanceCreationStatus.DOWNLOADING_CLIENT, 4, 10, 'Descargando instancia Fabric');
          await downloadFabric.downloadInstance(config.version, config.loaderVersion, instancePath);
          // downloadFabric ya descarga: client.jar, assets, librerías base y Fabric Loader
          break;
          
        case 'forge':
          this.updateProgress(progressId, InstanceCreationStatus.DOWNLOADING_CLIENT, 4, 10, 'Descargando instancia Forge');
          await downloadForge.downloadInstance(config.version, config.loaderVersion, instancePath);
          // downloadForge ya descarga: client.jar, assets, librerías base y Forge (con todas sus dependencias)
          break;
          
        case 'quilt':
          this.updateProgress(progressId, InstanceCreationStatus.DOWNLOADING_CLIENT, 4, 10, 'Descargando instancia Quilt');
          await downloadQuilt.downloadInstance(config.version, config.loaderVersion, instancePath);
          // downloadQuilt ya descarga: client.jar, assets, librerías base y Quilt Loader
          break;
          
        case 'neoforge':
          this.updateProgress(progressId, InstanceCreationStatus.DOWNLOADING_CLIENT, 4, 10, 'Descargando instancia NeoForge');
          await downloadNeoForge.downloadInstance(config.version, config.loaderVersion, instancePath);
          // downloadNeoForge ya descarga: client.jar, assets, librerías base y NeoForge (con todas sus dependencias)
          break;
      }

      if (this.isCancelled(progressId)) {
        throw new Error('Creación de instancia cancelada por el usuario');
      }

      // PASO 8: Verificar integridad
      this.updateProgress(progressId, InstanceCreationStatus.VERIFYING_INTEGRITY, 8, 10, 'Verificando integridad de archivos');
      await this.verifyInstanceIntegrity(instancePath, config.version);
      
      if (this.isCancelled(progressId)) {
        throw new Error('Creación de instancia cancelada por el usuario');
      }

      // Actualizar estado final
      this.updateProgress(progressId, InstanceCreationStatus.COMPLETED, 10, 10, 'Instancia creada exitosamente');

      // Marcar descarga como completada
      instanceDownloadPersistenceService.markCompleted(progressId);

      // Marcar instancia como lista para usar
      instanceConfig.ready = true;
      this.saveInstanceConfig(instancePath, instanceConfig);

      console.log(`Instancia ${config.name} (ID: ${id}) creada exitosamente en ${instancePath}`);

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
   * Instala un loader (Forge, Fabric, etc.) en la instancia
   */
  private async installLoader(
    loader: 'forge' | 'fabric' | 'quilt' | 'neoforge',
    mcVersion: string,
    loaderVersion: string | undefined,
    instancePath: string
  ): Promise<void> {
    console.log(`Instalando ${loader} para Minecraft ${mcVersion} en ${instancePath}`);
    
    switch (loader) {
      case 'fabric':
        await this.installFabric(mcVersion, loaderVersion, instancePath);
        break;
      case 'forge':
        await this.installForge(mcVersion, loaderVersion, instancePath);
        break;
      case 'quilt':
        await this.installQuilt(mcVersion, loaderVersion, instancePath);
        break;
      case 'neoforge':
        await this.installNeoForge(mcVersion, loaderVersion, instancePath);
        break;
      default:
        throw new Error(`Loader no soportado: ${loader}`);
    }
  }

  /**
   * Instala Fabric
   */
  private async installFabric(
    mcVersion: string,
    loaderVersion: string | undefined,
    instancePath: string
  ): Promise<void> {
    try {
      // Obtener la versión compatible de Fabric Loader
      const fabricApiUrl = `https://meta.fabricmc.net/v2/versions/loader/${mcVersion}`;
      const response = await fetch(fabricApiUrl);
      const fabricVersions = await response.json();

      // Tomar la última versión estable
      const fabricEntry = fabricVersions.find((v: any) => v.loader.stable) || fabricVersions[0];
      if (!fabricEntry) {
        throw new Error(`No se encontró versión compatible de Fabric para Minecraft ${mcVersion}`);
      }

      const finalLoaderVersion = loaderVersion || fabricEntry.loader.version;
      console.log(`Usando Fabric Loader ${finalLoaderVersion} para Minecraft ${mcVersion}`);

      // Crear carpeta para el loader
      const loaderDir = path.join(instancePath, 'loader');
      this.ensureDir(loaderDir);

      // Descargar el JAR del loader de Fabric
      const fabricLoaderUrl = `https://maven.fabricmc.net/net/fabricmc/fabric-loader/${finalLoaderVersion}/fabric-loader-${finalLoaderVersion}.jar`;
      const fabricLoaderPath = path.join(loaderDir, `fabric-loader-${finalLoaderVersion}.jar`);

      // Descargar el archivo
      const responseLoader = await fetch(fabricLoaderUrl);
      if (!responseLoader.ok) {
        throw new Error(`Error al descargar Fabric Loader: ${responseLoader.status} ${responseLoader.statusText}`);
      }

      // Guardar el archivo
      const buffer = Buffer.from(await responseLoader.arrayBuffer());
      fs.writeFileSync(fabricLoaderPath, buffer);

      console.log(`Fabric Loader ${finalLoaderVersion} descargado en: ${fabricLoaderPath}`);
    } catch (error) {
      console.error(`Error al instalar Fabric:`, error);
      throw error;
    }
  }

  /**
   * Instala Forge
   * NOTA: Este método solo valida la versión del loader.
   * La instalación real se hace en ensureForgeCompleteInstallation usando el nuevo método basado en Maven.
   */
  private async installForge(
    mcVersion: string,
    loaderVersion: string | undefined,
    instancePath: string
  ): Promise<void> {
    try {
      console.log(`[Forge Install] Preparando instalación de Forge para Minecraft ${mcVersion}...`);

      // Solo validar/obtener la versión del loader si no está especificada
      // NO descargar nada aquí - eso lo hace ensureForgeCompleteInstallation con el nuevo método
      if (!loaderVersion) {
        console.log(`[Forge Install] Versión del loader no especificada, se obtendrá en ensureForgeCompleteInstallation`);
      } else {
        console.log(`[Forge Install] Versión del loader especificada: ${loaderVersion}`);
      }

      // Crear carpeta para el loader (por si acaso)
      const loaderDir = path.join(instancePath, 'loader');
      this.ensureDir(loaderDir);

      // NO descargar nada aquí - el nuevo método installForgeLoader lo hará
      console.log(`[Forge Install] Preparación completada. La instalación real se hará en ensureForgeCompleteInstallation usando el método basado en Maven.`);
    } catch (error) {
      console.error(`[Forge Install] Error al preparar instalación de Forge:`, error);
      throw error;
    }
  }

  /**
   * Instala Quilt
   */
  private async installQuilt(
    mcVersion: string,
    loaderVersion: string | undefined,
    instancePath: string
  ): Promise<void> {
    try {
      console.log(`Descargando Quilt para Minecraft ${mcVersion}...`);

      // Obtener la versión compatible de Quilt Loader
      const quiltApiUrl = `https://meta.quiltmc.org/v3/versions/loader/${mcVersion}`;
      const response = await fetch(quiltApiUrl);
      const quiltVersions = await response.json();

      // Tomar la primera versión (la más reciente o estable)
      if (!quiltVersions || quiltVersions.length === 0) {
        throw new Error(`No se encontró versión de Quilt para Minecraft ${mcVersion}`);
      }

      const quiltEntry = quiltVersions[0]; // La primera es la más reciente
      const finalLoaderVersion = loaderVersion || quiltEntry.loader.version;
      console.log(`Usando Quilt Loader ${finalLoaderVersion} para Minecraft ${mcVersion}`);

      // Crear carpeta para el loader
      const loaderDir = path.join(instancePath, 'loader');
      this.ensureDir(loaderDir);

      // Descargar el JAR del loader de Quilt
      const quiltLoaderUrl = `https://maven.quiltmc.org/repository/release/org/quiltmc/quilt-loader/${finalLoaderVersion}/quilt-loader-${finalLoaderVersion}.jar`;
      const quiltLoaderPath = path.join(loaderDir, `quilt-loader-${finalLoaderVersion}.jar`);

      // Descargar el archivo
      const responseLoader = await fetch(quiltLoaderUrl);
      if (!responseLoader.ok) {
        throw new Error(`Error al descargar Quilt Loader: ${responseLoader.status} ${responseLoader.statusText}`);
      }

      // Guardar el archivo
      const buffer = Buffer.from(await responseLoader.arrayBuffer());
      fs.writeFileSync(quiltLoaderPath, buffer);

      console.log(`Quilt Loader descargado en: ${quiltLoaderPath}`);
    } catch (error) {
      console.error(`Error al instalar Quilt:`, error);
      throw error;
    }
  }

  /**
   * Instala NeoForge
   */
  private async installNeoForge(
    mcVersion: string,
    loaderVersion: string | undefined,
    instancePath: string
  ): Promise<void> {
    try {
      console.log(`Descargando NeoForge para Minecraft ${mcVersion}...`);

      // Buscar versión de NeoForge compatible con la versión de Minecraft
      let neoForgeVersion = loaderVersion;
      if (!neoForgeVersion) {
        // Buscar la última versión compatible
        const neoForgeApiUrl = `https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge`;
        const response = await fetch(neoForgeApiUrl);
        const versions = await response.json();
        
        // Filtrar versiones compatibles con la versión de Minecraft
        const compatibleVersions = versions.filter((v: any) => v.version.startsWith(`${mcVersion}-`));
        if (compatibleVersions.length > 0) {
          neoForgeVersion = compatibleVersions[0].version; // Tomar la más reciente
        }
      }

      if (!neoForgeVersion) {
        throw new Error(`No se encontró versión compatible de NeoForge para Minecraft ${mcVersion}`);
      }

      console.log(`Usando NeoForge ${neoForgeVersion} para Minecraft ${mcVersion}`);

      // Crear carpeta para el loader
      const loaderDir = path.join(instancePath, 'loader');
      this.ensureDir(loaderDir);

      // Descargar el JAR de NeoForge
      const neoForgeUrl = `https://maven.neoforged.net/releases/net/neoforged/neoforge/${neoForgeVersion}/neoforge-${neoForgeVersion}.jar`;
      const neoForgePath = path.join(loaderDir, `neoforge-${neoForgeVersion}.jar`);

      // Descargar el archivo
      const responseNeo = await fetch(neoForgeUrl);
      if (!responseNeo.ok) {
        throw new Error(`Error al descargar NeoForge: ${responseNeo.status} ${responseNeo.statusText}`);
      }

      // Guardar el archivo
      const buffer = Buffer.from(await responseNeo.arrayBuffer());
      fs.writeFileSync(neoForgePath, buffer);

      console.log(`NeoForge descargado en: ${neoForgePath}`);
    } catch (error) {
      console.error(`Error al instalar NeoForge:`, error);
      throw error;
    }
  }

  /**
   * Verifica la integridad de los archivos de la instancia
   */
  private async verifyInstanceIntegrity(instancePath: string, mcVersion: string): Promise<void> {
    console.log(`Verificando integridad de la instancia en ${instancePath} para Minecraft ${mcVersion}`);

    // Verificar que exista el archivo client.jar
    const clientJarPath = path.join(instancePath, 'client.jar');
    if (!fs.existsSync(clientJarPath)) {
      throw new Error(`client.jar no encontrado en ${clientJarPath}`);
    }

    const stats = fs.statSync(clientJarPath);
    if (stats.size < 1024 * 1024) { // Menos de 1MB
      throw new Error(`client.jar tiene tamaño inusualmente pequeño: ${stats.size} bytes`);
    }

    // Verificar que existan las carpetas esenciales
    const requiredFolders = ['mods', 'config', 'saves', 'logs', 'resourcepacks', 'shaderpacks'];
    for (const folder of requiredFolders) {
      const folderPath = path.join(instancePath, folder);
      if (!fs.existsSync(folderPath)) {
        throw new Error(`Carpeta requerida no encontrada: ${folderPath}`);
      }
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
   * Asegura que Forge esté completamente instalado: ejecuta el instalador y descarga todas las librerías
   */
  private async ensureForgeCompleteInstallation(
    loader: 'forge' | 'neoforge',
    mcVersion: string,
    loaderVersion: string | undefined,
    instancePath: string
  ): Promise<void> {
    console.log(`[Forge Complete Install] Iniciando instalación completa de ${loader} para Minecraft ${mcVersion}`);
    console.log(`[Forge Complete Install] loaderVersion proporcionada: ${loaderVersion || 'NO ESPECIFICADA'}`);
    const launcherDataPath = getLauncherDataPath();
    
    // Si no hay loaderVersion, intentar obtenerla
    if (!loaderVersion) {
      console.log(`[Forge Complete Install] Obteniendo versión de ${loader} automáticamente...`);
      const forgeApiUrls = [
        `https://maven.minecraftforge.net/net/minecraftforge/forge/maven-metadata.xml`,
      ];
      
      for (const url of forgeApiUrls) {
        try {
          const response = await fetch(url, { headers: { 'User-Agent': 'DRK-Launcher/1.0' } });
          if (response.ok) {
            const xmlText = await response.text();
            const versionMatches = xmlText.match(/<version[^>]*>([^<]+)<\/version>/gi);
            if (versionMatches) {
              const compatibleVersions = versionMatches
                .map(m => m.match(/>([^<]+)</)?.[1]?.trim())
                .filter(v => v && v.startsWith(`${mcVersion}-`));
              if (compatibleVersions.length > 0) {
                compatibleVersions.sort((a, b) => {
                  const forgeVersionA = a.split('-')[1] || '';
                  const forgeVersionB = b.split('-')[1] || '';
                  return forgeVersionB.localeCompare(forgeVersionA, undefined, { numeric: true, sensitivity: 'base' });
                });
                loaderVersion = compatibleVersions[0];
                console.log(`[Forge Complete Install] Versión de ${loader} obtenida automáticamente: ${loaderVersion}`);
                break;
              }
            }
          }
        } catch (err) {
          console.warn(`[Forge Complete Install] Error al obtener versión de ${loader}:`, err);
        }
      }
    }
    
    if (!loaderVersion) {
      console.error(`[Forge Complete Install] ERROR: No se pudo obtener versión de ${loader} para Minecraft ${mcVersion}`);
      throw new Error(`No se pudo obtener versión de Forge para Minecraft ${mcVersion}`);
    }
    
    console.log(`[Forge Complete Install] Usando versión de ${loader}: ${loaderVersion}`);
    
    // MODELO MODRINTH: Verificar si ya existe un version.json válido
    // Si existe, reutilizarlo en lugar de ejecutar el instalador
    const versionName = `${mcVersion}-forge-${loaderVersion}`;
    const versionsDir = path.join(launcherDataPath, 'versions', versionName);
    const versionJsonPath = path.join(versionsDir, `${versionName}.json`);
    
    let versionJsonExists = false;
    if (fs.existsSync(versionJsonPath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));
        if (existing.mainClass && existing.libraries && Array.isArray(existing.libraries) && existing.libraries.length > 0) {
          versionJsonExists = true;
          console.log(`[Forge Install] Version.json ya existe y es válido, reutilizando...`);
        }
      } catch (err) {
        console.warn(`[Forge Install] Version.json existente es inválido, reconstruyendo...`);
      }
    }
    
    if (!versionJsonExists) {
      // Intentar construir el version.json sin usar el instalador (modelo Modrinth)
      try {
        console.log(`[Forge Complete Install] Version.json no existe, construyendo directamente desde Maven (modelo Modrinth)...`);
        await this.buildForgeVersionJsonDirectly(mcVersion, loaderVersion);
        console.log(`[Forge Complete Install] Version.json construido exitosamente desde Maven`);
      } catch (error) {
        console.warn(`[Forge Install] Error al construir version.json directamente: ${error}`);
        console.log(`[Forge Install] Usando instalador como fallback...`);
        
        // Fallback: usar el instalador tradicional (solo si es necesario)
        const loaderDir = path.join(instancePath, 'loader');
        const installerPath = path.join(loaderDir, `forge-${loaderVersion}-installer.jar`);
        
        if (!fs.existsSync(installerPath)) {
          const forgeInstallerUrl = `https://maven.minecraftforge.net/net/minecraftforge/forge/${loaderVersion}/forge-${loaderVersion}-installer.jar`;
          console.log(`[Forge Install] Descargando instalador desde: ${forgeInstallerUrl}`);
          
          try {
            const response = await fetch(forgeInstallerUrl, {
              headers: { 'User-Agent': 'DRK-Launcher/1.0' }
            });
            
            if (!response.ok) {
              throw new Error(`No se pudo descargar instalador de Forge (${response.status})`);
            }
            
            this.ensureDir(loaderDir);
            const buffer = Buffer.from(await response.arrayBuffer());
            fs.writeFileSync(installerPath, buffer);
            console.log(`[Forge Install] Instalador descargado exitosamente`);
          } catch (err) {
            throw new Error(`Error al descargar instalador de Forge: ${err}`);
          }
        }
        
        await this.runForgeInstaller(installerPath, instancePath, mcVersion, loaderVersion);
        
        // Después de ejecutar el instalador, actualizar el mainClass a modlauncher.Launcher
        // si el instalador generó ForgeBootstrap
        if (fs.existsSync(versionJsonPath)) {
          try {
            const versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));
            if (versionData.mainClass && (versionData.mainClass.includes('ForgeBootstrap') || versionData.mainClass.includes('Bootstrap'))) {
              versionData.mainClass = 'cpw.mods.modlauncher.Launcher';
              fs.writeFileSync(versionJsonPath, JSON.stringify(versionData, null, 2));
              console.log(`[Forge Install] MainClass actualizado a modlauncher.Launcher (JPMS-compatible)`);
            }
          } catch (err) {
            console.warn(`[Forge Install] Error al actualizar mainClass: ${err}`);
          }
        }
      }
    }
    
    // Descargar todas las librerías del version.json (ya sea construido o generado por instalador)
    await this.downloadAllForgeLibraries(mcVersion, loaderVersion);
  }

  /**
   * Construye el version.json de Forge directamente desde Maven (modelo Modrinth/Prism)
   * Sin usar el instalador.jar
   * Usa installForgeLoader del gameLaunchService
   */
  private async buildForgeVersionJsonDirectly(
    mcVersion: string,
    loaderVersion: string
  ): Promise<void> {
    console.log(`[Forge Build] Iniciando construcción directa de version.json para Forge ${loaderVersion} en Minecraft ${mcVersion}`);
    const launcherDataPath = getLauncherDataPath();
    const versionName = `${mcVersion}-forge-${loaderVersion}`;
    const versionDir = path.join(launcherDataPath, 'versions', versionName);
    this.ensureDir(versionDir);
    
    const versionJsonPath = path.join(versionDir, `${versionName}.json`);
    
    // Si ya existe, verificar que sea válido
    if (fs.existsSync(versionJsonPath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));
        if (existing.mainClass && existing.libraries) {
          console.log(`[Forge Build] Version.json ya existe y es válido en: ${versionJsonPath}`);
          return;
        }
      } catch (err) {
        console.warn(`[Forge Build] Version.json existente es inválido, reconstruyendo...`);
      }
    }
    
    // Usar installForgeLoader del gameLaunchService para instalación basada en Maven
    console.log(`[Forge Build] Llamando a gameLaunchService.installForgeLoader(${mcVersion}, 'forge', ${loaderVersion})...`);
    try {
      await gameLaunchService.installForgeLoader(mcVersion, 'forge', loaderVersion);
      console.log(`[Forge Build] ✓ Version.json construido exitosamente usando installForgeLoader (Maven)`);
    } catch (error) {
      console.error(`[Forge Build] ✗ Error al usar installForgeLoader: ${error}`);
      console.warn(`[Forge Build] Usando método alternativo (legacy)...`);
      // Continuar con el método anterior como fallback
      await this.buildForgeVersionJsonDirectlyLegacy(mcVersion, loaderVersion);
    }
  }

  /**
   * Método legacy para construir version.json (fallback)
   */
  private async buildForgeVersionJsonDirectlyLegacy(
    mcVersion: string,
    loaderVersion: string
  ): Promise<void> {
    const launcherDataPath = getLauncherDataPath();
    const versionName = `${mcVersion}-forge-${loaderVersion}`;
    const versionDir = path.join(launcherDataPath, 'versions', versionName);
    this.ensureDir(versionDir);
    
    const versionJsonPath = path.join(versionDir, `${versionName}.json`);
    
    // Si ya existe, verificar que sea válido
    if (fs.existsSync(versionJsonPath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));
        if (existing.mainClass && existing.libraries) {
          console.log(`[Forge Install] Version.json ya existe y es válido`);
          return;
        }
      } catch (err) {
        console.warn(`[Forge Install] Version.json existente es inválido, reconstruyendo...`);
      }
    }
    
    // 1. Descargar el version.json base de Minecraft
    const { minecraftDownloadService } = require('./minecraftDownloadService');
    const baseVersionJsonPath = await minecraftDownloadService.downloadVersionMetadata(mcVersion);
    const baseVersionData = JSON.parse(fs.readFileSync(baseVersionJsonPath, 'utf-8'));
    
    // 2. Descargar el POM de Forge para obtener las dependencias
    const forgePomUrl = `https://maven.minecraftforge.net/net/minecraftforge/forge/${loaderVersion}/forge-${loaderVersion}.pom`;
    console.log(`[Forge Install] Descargando POM de Forge desde: ${forgePomUrl}`);
    
    const pomResponse = await fetch(forgePomUrl, {
      headers: { 'User-Agent': 'DRK-Launcher/1.0' }
    });
    
    if (!pomResponse.ok) {
      throw new Error(`No se pudo descargar POM de Forge (${pomResponse.status})`);
    }
    
    const pomText = await pomResponse.text();
    
    // 3. Extraer dependencias del POM (simplificado - en producción usar un parser XML)
    // Por ahora, usaremos las librerías conocidas de Forge y las del version.json base
    const forgeLibraries: any[] = [];
    
    // Librerías conocidas de Forge que siempre están presentes
    const knownForgeLibraries = [
      {
        name: 'net.minecraftforge:forge:' + loaderVersion,
        downloads: {
          artifact: {
            path: `net/minecraftforge/forge/${loaderVersion}/forge-${loaderVersion}-client.jar`,
            url: `https://maven.minecraftforge.net/net/minecraftforge/forge/${loaderVersion}/forge-${loaderVersion}-client.jar`,
            sha1: '', // Se puede obtener del POM o omitir
            size: 0
          }
        }
      },
      {
        name: 'cpw.mods:modlauncher:9.1.3',
        downloads: {
          artifact: {
            path: `cpw/mods/modlauncher/9.1.3/modlauncher-9.1.3.jar`,
            url: `https://maven.minecraftforge.net/cpw/mods/modlauncher/9.1.3/modlauncher-9.1.3.jar`,
            sha1: '',
            size: 0
          }
        }
      },
      {
        name: 'net.minecraftforge:fmlcore:' + loaderVersion,
        downloads: {
          artifact: {
            path: `net/minecraftforge/fmlcore/${loaderVersion}/fmlcore-${loaderVersion}.jar`,
            url: `https://maven.minecraftforge.net/net/minecraftforge/fmlcore/${loaderVersion}/fmlcore-${loaderVersion}.jar`,
            sha1: '',
            size: 0
          }
        }
      },
      {
        name: 'net.minecraftforge:fmlloader:' + loaderVersion,
        downloads: {
          artifact: {
            path: `net/minecraftforge/fmlloader/${loaderVersion}/fmlloader-${loaderVersion}.jar`,
            url: `https://maven.minecraftforge.net/net/minecraftforge/fmlloader/${loaderVersion}/fmlloader-${loaderVersion}.jar`,
            sha1: '',
            size: 0
          }
        }
      },
      {
        name: 'cpw.mods:bootstraplauncher:2.1.7',
        downloads: {
          artifact: {
            path: `cpw/mods/bootstraplauncher/2.1.7/bootstraplauncher-2.1.7.jar`,
            url: `https://maven.minecraftforge.net/cpw/mods/bootstraplauncher/2.1.7/bootstraplauncher-2.1.7.jar`,
            sha1: '',
            size: 0
          }
        }
      },
      {
        name: 'cpw.mods:securejarhandler:2.1.10',
        downloads: {
          artifact: {
            path: `cpw/mods/securejarhandler/2.1.10/securejarhandler-2.1.10.jar`,
            url: `https://maven.minecraftforge.net/cpw/mods/securejarhandler/2.1.10/securejarhandler-2.1.10.jar`,
            sha1: '',
            size: 0
          }
        }
      }
    ];
    
    forgeLibraries.push(...knownForgeLibraries);
    
    // 4. Combinar librerías base de Minecraft con librerías de Forge
    // Filtrar duplicados por nombre
    const allLibraries: any[] = [];
    const seenLibraryNames = new Set<string>();
    
    // Primero añadir librerías base de Minecraft
    if (baseVersionData.libraries && Array.isArray(baseVersionData.libraries)) {
      for (const lib of baseVersionData.libraries) {
        if (lib.name && !seenLibraryNames.has(lib.name)) {
          allLibraries.push(lib);
          seenLibraryNames.add(lib.name);
        }
      }
    }
    
    // Luego añadir librerías de Forge (evitando duplicados)
    for (const lib of forgeLibraries) {
      if (lib.name && !seenLibraryNames.has(lib.name)) {
        allLibraries.push(lib);
        seenLibraryNames.add(lib.name);
      }
    }
    
    // 5. Construir el version.json final
    const forgeVersionData = {
      id: versionName,
      time: new Date().toISOString(),
      releaseTime: new Date().toISOString(),
      type: 'release',
      mainClass: 'cpw.mods.modlauncher.Launcher', // MODELO MODRINTH: Usar modlauncher directamente
      inheritsFrom: mcVersion,
      logging: baseVersionData.logging || {},
      arguments: {
        game: baseVersionData.arguments?.game || [],
        jvm: [
          '--add-modules=ALL-MODULE-PATH',
          '--add-opens', 'java.base/java.lang=ALL-UNNAMED',
          '--add-opens', 'java.base/java.util=ALL-UNNAMED',
          '--add-opens', 'java.base/java.lang.invoke=ALL-UNNAMED',
          '--add-opens', 'java.base/java.util.concurrent.atomic=ALL-UNNAMED',
          '--add-opens', 'java.base/java.net=ALL-UNNAMED',
          '--add-opens', 'java.base/java.io=ALL-UNNAMED',
          ...(baseVersionData.arguments?.jvm || [])
        ]
      },
      libraries: allLibraries,
      downloads: baseVersionData.downloads || {},
      assetIndex: baseVersionData.assetIndex || {},
      assets: baseVersionData.assets || mcVersion
    };
    
    // 6. Guardar el version.json
    fs.writeFileSync(versionJsonPath, JSON.stringify(forgeVersionData, null, 2));
    console.log(`[Forge Install] Version.json construido y guardado en: ${versionJsonPath}`);
  }

  /**
   * Ejecuta el instalador de Forge
   */
  private async runForgeInstaller(
    installerPath: string,
    instancePath: string,
    mcVersion: string,
    loaderVersion: string
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const { spawn } = require('child_process');
      const { javaDownloadService } = require('./javaDownloadService');
      
      try {
        // Obtener la ruta de Java usando el método correcto
        const javaPath = await javaDownloadService.getJavaForMinecraftVersion(mcVersion);
        if (!javaPath) {
          reject(new Error('No se encontró Java para ejecutar el instalador'));
          return;
        }

        console.log(`[Forge Install] Ejecutando instalador: ${installerPath}`);
        
        const launcherDataPath = getLauncherDataPath();
        
        // Crear un perfil de launcher falso antes de ejecutar el instalador
        this.createFakeLauncherProfile(launcherDataPath);
        
        console.log(`[Forge Install] Ejecutando instalador en: ${launcherDataPath}`);
        console.log(`[Forge Install] Comando: ${javaPath} -jar ${installerPath} --installClient ${launcherDataPath}`);
        
        const installerProcess = spawn(javaPath, ['-jar', installerPath, '--installClient', launcherDataPath], {
          cwd: path.dirname(installerPath),
          stdio: 'pipe'
        });

        let stdout = '';
        let stderr = '';

        installerProcess.stdout.on('data', (data: Buffer) => {
          stdout += data.toString();
          console.log(`[Instalador] ${data.toString().trim()}`);
        });

        installerProcess.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
          console.warn(`[Instalador] ${data.toString().trim()}`);
        });

        installerProcess.on('close', (code: number) => {
          if (code === 0) {
            console.log(`[Forge Install] Instalador ejecutado exitosamente`);
            resolve();
          } else {
            reject(new Error(`Instalador de Forge falló con código ${code}\nSTDOUT: ${stdout}\nSTDERR: ${stderr}`));
          }
        });

        installerProcess.on('error', (error: Error) => {
          reject(new Error(`Error al ejecutar instalador de Forge: ${error.message}`));
        });
      } catch (error: any) {
        reject(new Error(`Error al obtener Java para el instalador: ${error.message || error}`));
      }
    });
  }

  /**
   * Crea un perfil de launcher falso para que el instalador de Forge funcione
   */
  private createFakeLauncherProfile(launcherDataPath: string): void {
    const launcherProfilesPath = path.join(launcherDataPath, 'launcher_profiles.json');
    
    if (!fs.existsSync(launcherProfilesPath)) {
      const fakeProfile = {
        profiles: {},
        settings: {
          crashUploadEnabled: false,
          enableSnapshots: false
        },
        version: 2
      };
      
      this.ensureDir(path.dirname(launcherProfilesPath));
      fs.writeFileSync(launcherProfilesPath, JSON.stringify(fakeProfile, null, 2));
      console.log(`[Forge Install] Perfil de launcher creado en: ${launcherProfilesPath}`);
    }
  }

  /**
   * Descarga todas las librerías del version.json generado por el instalador de Forge
   */
  private async downloadAllForgeLibraries(
    mcVersion: string,
    loaderVersion: string
  ): Promise<void> {
    const launcherDataPath = getLauncherDataPath();
    const versionsDir = path.join(launcherDataPath, 'versions');
    
    // El instalador de Forge puede crear el version.json con diferentes nombres
    // Buscar en múltiples ubicaciones posibles
    const possibleVersionNames = [
      `${mcVersion}-forge-${loaderVersion}`, // Formato estándar: 1.21.11-forge-61.0.2
      `${mcVersion}-forge-${mcVersion}-${loaderVersion}`, // Formato alternativo: 1.21.11-forge-1.21.11-61.0.2
      `forge-${mcVersion}-${loaderVersion}`, // Formato alternativo: forge-1.21.11-61.0.2
    ];
    
    let versionJsonPath: string | null = null;
    let foundVersionName: string | null = null;
    
    // Buscar el version.json en las ubicaciones posibles
    for (const versionName of possibleVersionNames) {
      const possiblePath = path.join(versionsDir, versionName, `${versionName}.json`);
      if (fs.existsSync(possiblePath)) {
        versionJsonPath = possiblePath;
        foundVersionName = versionName;
        console.log(`[Forge Libraries] Version.json encontrado: ${versionName}`);
        break;
      }
    }
    
    // Si no se encontró con los nombres esperados, buscar cualquier version.json de Forge para esta versión
    if (!versionJsonPath && fs.existsSync(versionsDir)) {
      const dirs = fs.readdirSync(versionsDir, { withFileTypes: true });
      for (const dir of dirs) {
        if (dir.isDirectory() && dir.name.includes(mcVersion) && dir.name.includes('forge')) {
          const possibleJson = path.join(versionsDir, dir.name, `${dir.name}.json`);
          if (fs.existsSync(possibleJson)) {
            versionJsonPath = possibleJson;
            foundVersionName = dir.name;
            console.log(`[Forge Libraries] Version.json encontrado (búsqueda alternativa): ${dir.name}`);
            break;
          }
        }
      }
    }
    
    if (!versionJsonPath) {
      throw new Error(`Version.json de Forge no encontrado después de ejecutar el instalador. Buscado en: ${possibleVersionNames.join(', ')}`);
    }
    
    try {
      const versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));
      
      // Descargar todas las librerías del version.json con descargas paralelas para mayor velocidad
      if (versionData.libraries && Array.isArray(versionData.libraries)) {
        // Filtrar librerías permitidas primero
        const librariesToDownload: Array<{ lib: any; libPath: string }> = [];
        let skipped = 0;
        
        for (const lib of versionData.libraries) {
          // Verificar reglas de aplicabilidad
          let libraryAllowed = true;
          if (lib.rules) {
            libraryAllowed = false;
            const osName = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'osx' : 'linux';
            for (const rule of lib.rules) {
              if (rule.action === 'allow') {
                if (!rule.os || rule.os.name === osName) {
                  libraryAllowed = true;
                }
              } else if (rule.action === 'disallow') {
                if (rule.os && rule.os.name === osName) {
                  libraryAllowed = false;
                  break;
                }
              }
            }
          }
          
          if (!libraryAllowed) {
            skipped++;
            continue;
          }
          
          if (lib.downloads && lib.downloads.artifact) {
            let libPath;
            if (lib.downloads.artifact.path) {
              libPath = path.join(launcherDataPath, 'libraries', lib.downloads.artifact.path);
            } else {
              const nameParts = lib.name.split(':');
              const [group, artifact, version] = nameParts;
              const parts = group.split('.');
              libPath = path.join(launcherDataPath, 'libraries', ...parts, artifact, version, `${artifact}-${version}.jar`);
            }
            
            // Solo añadir si no existe
            if (!fs.existsSync(libPath)) {
              librariesToDownload.push({ lib, libPath });
            }
          }
        }
        
        const total = versionData.libraries.length;
        const toDownload = librariesToDownload.length;
        const alreadyExists = total - toDownload - skipped;
        
        console.log(`[Forge Libraries] Iniciando descarga de ${toDownload} librerías (${alreadyExists} ya existen, ${skipped} omitidas)...`);
        
        // Descargar en paralelo (aumentado para mayor velocidad)
        const CONCURRENT_DOWNLOADS = 70;
        let downloaded = 0;
        let failed = 0;
        
        for (let i = 0; i < librariesToDownload.length; i += CONCURRENT_DOWNLOADS) {
          const batch = librariesToDownload.slice(i, i + CONCURRENT_DOWNLOADS);
          
          await Promise.all(
            batch.map(async ({ lib, libPath }) => {
              try {
                this.ensureDir(path.dirname(libPath));
                const response = await fetch(lib.downloads.artifact.url, {
                  headers: { 'User-Agent': 'DRK-Launcher/1.0' }
                });
                if (response.ok) {
                  const buffer = Buffer.from(await response.arrayBuffer());
                  fs.writeFileSync(libPath, buffer);
                  downloaded++;
                  if (downloaded % 5 === 0 || downloaded === toDownload) {
                    console.log(`[Forge Libraries] Descargadas: ${downloaded}/${toDownload} librerías`);
                  }
                } else {
                  failed++;
                  console.warn(`[Forge Libraries] Error al descargar ${lib.name}: HTTP ${response.status}`);
                }
              } catch (err) {
                failed++;
                console.warn(`[Forge Libraries] Error al descargar ${lib.name}:`, err);
              }
            })
          );
        }
        
        const totalDownloaded = downloaded + alreadyExists;
        console.log(`[Forge Libraries] Descarga completada: ${totalDownloaded}/${total} librerías (${downloaded} nuevas, ${alreadyExists} existentes, ${skipped} omitidas, ${failed} fallidas)`);
        
        if (failed > 0) {
          console.warn(`[Forge Libraries] Advertencia: ${failed} librerías no se pudieron descargar`);
        }
      }
    } catch (error) {
      throw new Error(`Error al procesar version.json de Forge: ${error}`);
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