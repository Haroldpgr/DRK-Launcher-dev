import path from 'node:path';
import fs from 'node:fs';
import { getLauncherDataPath } from '../utils/paths';
import { InstanceCreationProgress, InstanceCreationStatus, InstanceCreationConfig } from './instanceCreationState';
import { javaDownloadService } from './javaDownloadService';
import { versionService } from './versionService';
import { minecraftDownloadService } from './minecraftDownloadService';

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
   */
  async createInstance(config: InstanceCreationConfig, instanceId?: string): Promise<InstanceConfig> {
    const id = instanceId || this.generateInstanceId(config.name);
    const progressId = id;
    
    // Verificar si la creación ha sido cancelada
    if (this.isCancelled(progressId)) {
      throw new Error('Creación de instancia cancelada por el usuario');
    }

    this.updateProgress(progressId, InstanceCreationStatus.PENDING, 0, 10, 'Iniciando creación de instancia');

    try {
      console.log(`Iniciando creación de instancia: ${config.name} (${config.version}) con ${config.loader || 'vanilla'}`);

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

      // PASO 4: Descargar bibliotecas
      this.updateProgress(progressId, InstanceCreationStatus.DOWNLOADING_LIBRARIES, 4, 10, 'Descargando bibliotecas del juego');
      await minecraftDownloadService.downloadVersionLibraries(config.version);
      
      if (this.isCancelled(progressId)) {
        throw new Error('Creación de instancia cancelada por el usuario');
      }

      // PASO 5: Descargar cliente
      this.updateProgress(progressId, InstanceCreationStatus.DOWNLOADING_CLIENT, 5, 10, 'Descargando cliente de Minecraft');
      await minecraftDownloadService.downloadClientJar(config.version, instancePath);
      
      if (this.isCancelled(progressId)) {
        throw new Error('Creación de instancia cancelada por el usuario');
      }

      // PASO 6: Descargar assets
      this.updateProgress(progressId, InstanceCreationStatus.DOWNLOADING_ASSETS, 6, 10, 'Descargando y validando assets del juego');
      // Usar la nueva función que valida y descarga assets faltantes
      await minecraftDownloadService.validateAndDownloadAssets(config.version);

      // Asegurar que assets críticos como los de idioma estén presentes
      this.updateProgress(progressId, InstanceCreationStatus.DOWNLOADING_ASSETS, 6.5, 10, 'Asegurando assets críticos (idiomas, texturas, etc.)');
      await minecraftDownloadService.ensureCriticalAssets(config.version);

      if (this.isCancelled(progressId)) {
        throw new Error('Creación de instancia cancelada por el usuario');
      }

      // PASO 7: Si hay loader, instalarlo
      if (config.loader && config.loader !== 'vanilla') {
        this.updateProgress(progressId, InstanceCreationStatus.INSTALLING_LOADER, 7, 10, `Instalando ${config.loader}`);
        await this.installLoader(config.loader, config.version, config.loaderVersion, instancePath);
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

      // Marcar instancia como lista para usar
      instanceConfig.ready = true;
      this.saveInstanceConfig(instancePath, instanceConfig);

      console.log(`Instancia ${config.name} (ID: ${id}) creada exitosamente en ${instancePath}`);

      return instanceConfig;
    } catch (error) {
      this.updateProgress(progressId, InstanceCreationStatus.ERROR, 0, 10, `Error: ${(error as Error).message}`);
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
   */
  private async installForge(
    mcVersion: string,
    loaderVersion: string | undefined,
    instancePath: string
  ): Promise<void> {
    try {
      console.log(`Descargando Forge para Minecraft ${mcVersion}...`);

      // Para Forge, necesitamos encontrar la versión compatible
      // Usamos el API de Forge para obtener la lista de versiones
      const forgeApiUrl = `https://maven.minecraftforge.net/net/minecraftforge/forge/maven-metadata.json`;
      const response = await fetch(forgeApiUrl);
      const forgeMetadata = await response.json();

      // Buscar una versión compatible con la versión de Minecraft
      let forgeVersion = loaderVersion;
      if (!forgeVersion) {
        const versions = forgeMetadata.versioning.versions;
        
        // Buscar la versión más reciente compatible con la versión de Minecraft
        for (let i = versions.length - 1; i >= 0; i--) {
          const v = versions[i];
          if (v.startsWith(`${mcVersion}-`)) {
            forgeVersion = v;
            break;
          }
        }
      }

      if (!forgeVersion) {
        throw new Error(`No se encontró versión compatible de Forge para Minecraft ${mcVersion}`);
      }

      console.log(`Usando Forge ${forgeVersion} para Minecraft ${mcVersion}`);

      // Crear carpeta para el loader
      const loaderDir = path.join(instancePath, 'loader');
      this.ensureDir(loaderDir);

      // Descargar el JAR del instalador de Forge (o el universal si está disponible)
      const forgeUniversalUrl = `https://maven.minecraftforge.net/net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}-universal.jar`;
      const forgeUniversalPath = path.join(loaderDir, `forge-${forgeVersion}-universal.jar`);

      // Intentar descargar el universal JAR
      const responseUniversal = await fetch(forgeUniversalUrl);
      if (responseUniversal.ok) {
        const buffer = Buffer.from(await responseUniversal.arrayBuffer());
        fs.writeFileSync(forgeUniversalPath, buffer);
        console.log(`Forge Universal JAR descargado en: ${forgeUniversalPath}`);
      } else {
        // Si no está disponible el universal, intentar con el instalador
        console.log(`Forge Universal no disponible, descargando instalador...`);
        const forgeInstallerUrl = `https://maven.minecraftforge.net/net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}-installer.jar`;
        const forgeInstallerPath = path.join(loaderDir, `forge-${forgeVersion}-installer.jar`);

        const responseInstaller = await fetch(forgeInstallerUrl);
        if (!responseInstaller.ok) {
          throw new Error(`No se pudo descargar Forge para ${mcVersion}`);
        }

        const buffer = Buffer.from(await responseInstaller.arrayBuffer());
        fs.writeFileSync(forgeInstallerPath, buffer);
        console.log(`Forge Installer descargado en: ${forgeInstallerPath}`);
      }
    } catch (error) {
      console.error(`Error al instalar Forge:`, error);
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
}

export const enhancedInstanceCreationService = new EnhancedInstanceCreationService();