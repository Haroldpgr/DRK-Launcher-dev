import path from 'node:path';
import fs from 'node:fs';
import { instanceService, InstanceConfig } from './instanceService';
import { javaDownloadService } from './javaDownloadService';
import { minecraftDownloadService } from './minecraftDownloadService';
import { modrinthDownloadService } from './modrinthDownloadService';
import { downloadQueueService, DownloadInfo } from './downloadQueueService';
import { getLauncherDataPath } from '../utils/paths';

/**
 * Servicio maestro para manejar la creación completa de instancias
 * Sigue el proceso de 3 fases descrito en la especificación
 */
export class InstanceCreationService {
  
  /**
   * Crea una instancia completa paso a paso
   * @param name Nombre de la instancia
   * @param version Versión de Minecraft (ej. '1.20.1')
   * @param loader Loader a usar ('vanilla', 'fabric', 'forge', etc.)
   * @param javaVersion Versión de Java a usar (por defecto '17')
   * @param maxMemory Memoria máxima en MB (por defecto 4096)
   * @param minMemory Memoria mínima en MB (por defecto 1024)
   * @param jvmArgs Argumentos JVM adicionales
   */
  async createFullInstance(
    name: string,
    version: string,
    loader: InstanceConfig['loader'] = 'vanilla',
    javaVersion: string = '17',
    maxMemory?: number,
    minMemory?: number,
    jvmArgs?: string[]
  ): Promise<InstanceConfig> {
    console.log(`Iniciando creación de instancia: ${name} (${version}, ${loader})`);

    // FASE 1: Preparación del entorno - Descarga de Java
    console.log('FASE 1: Preparando entorno (descargando Java si es necesario)...');
    const javaPath = await this.setupJavaEnvironment(javaVersion);

    // PASO 2.1: Crear la estructura de la instancia
    console.log('PASO 2.1: Creando estructura de instancia...');
    const instance = instanceService.createInstance({
      name,
      version,
      loader,
      maxMemory,
      javaPath,
      jvmArgs,
      id: undefined  // The service will generate an ID if not provided
    });

    // PASO 2.2: Descarga de archivos base de Minecraft
    console.log('PASO 2.2: Descargando metadata y librerías de Minecraft...');
    await this.downloadMinecraftBase(version);

    // PASO 2.3: Descarga del cliente y loader
    console.log('PASO 2.3: Descargando cliente de Minecraft...');
    await this.downloadClientForInstance(version, loader, instance.path);

    // PASO 2.4: Asegurar que todos los assets estén disponibles
    console.log('PASO 2.4: Asegurando la disponibilidad de assets...');
    await this.ensureAssetsAvailability(version);

    // PASO 2.5: Asegurar que la carpeta de assets esté correctamente configurada
    console.log('PASO 2.5: Verificando configuración de carpeta de assets...');
    await this.validateAssetsConfiguration(instance.path, version);

    console.log(`Instancia ${name} (ID: ${instance.id}) creada exitosamente en ${instance.path}`);

    return instance;
  }

  /**
   * Asegura la disponibilidad de todos los assets necesarios para una versión
   */
  private async ensureAssetsAvailability(version: string): Promise<void> {
    console.log(`Asegurando disponibilidad de assets para Minecraft ${version}...`);

    try {
      // 1. Descargar el metadata de la versión que contiene la información de assets
      const versionJsonPath = await minecraftDownloadService.downloadVersionMetadata(version);
      const versionMetadata = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));

      // 2. Verificar el asset index para esta versión
      const assetIndex = versionMetadata.assetIndex;
      if (!assetIndex) {
        console.log(`No se encontró información de asset index para la versión ${version}, omitiendo assets...`);
        return;
      }

      console.log(`Descargando asset index ${assetIndex.id} para la versión ${version}...`);

      // 3. Asegurar que los assets estén completamente descargados
      await minecraftDownloadService.downloadVersionAssets(version);

      // 4. Asegurar que la carpeta de assets compartida esté completamente lista
      const launcherPath = getLauncherDataPath();
      const assetsPath = path.join(launcherPath, 'assets');
      const indexesPath = path.join(assetsPath, 'indexes');
      const objectsPath = path.join(assetsPath, 'objects');

      // Asegurar que existan las carpetas esenciales
      if (!fs.existsSync(assetsPath)) {
        fs.mkdirSync(assetsPath, { recursive: true });
        console.log(`Carpeta de assets creada: ${assetsPath}`);
      }

      if (!fs.existsSync(indexesPath)) {
        fs.mkdirSync(indexesPath, { recursive: true });
        console.log(`Carpeta de índices de assets creada: ${indexesPath}`);
      }

      if (!fs.existsSync(objectsPath)) {
        fs.mkdirSync(objectsPath, { recursive: true });
        console.log(`Carpeta de objetos de assets creada: ${objectsPath}`);
      }

      console.log(`Disponibilidad de assets asegurada para Minecraft ${version}`);
    } catch (error) {
      console.error(`Error al asegurar la disponibilidad de assets para ${version}:`, error);
      // No lanzar error, ya que los assets pueden descargarse en tiempo de ejecución
      // Sin embargo, registramos el problema para que sea resuelto más tarde
      console.log(`CONTINUANDO CREACIÓN DE INSTANCIA AÚN CON PROBLEMAS EN LA DESCARGA DE ASSETS`);
    }
  }

  /**
   * Valida la configuración de assets para una instancia específica
   */
  private async validateAssetsConfiguration(instancePath: string, version: string): Promise<void> {
    console.log(`Validando configuración de assets para instancia en ${instancePath}...`);

    try {
      // Verificar que exista el archivo de metadata de la versión
      const versionJsonPath = path.join(getLauncherDataPath(), 'versions', version, `${version}.json`);
      if (!fs.existsSync(versionJsonPath)) {
        throw new Error(`Metadata de la versión ${version} no encontrado`);
      }

      // Verificar la estructura de assets en la carpeta compartida
      const launcherAssetsPath = path.join(getLauncherDataPath(), 'assets');
      if (!fs.existsSync(launcherAssetsPath)) {
        throw new Error(`Carpeta de assets compartida no existe: ${launcherAssetsPath}`);
      }

      // Verificar que existan carpetas esenciales
      const indexesPath = path.join(launcherAssetsPath, 'indexes');
      const objectsPath = path.join(launcherAssetsPath, 'objects');

      if (!fs.existsSync(indexesPath)) {
        throw new Error(`Carpeta de índices de assets no existe: ${indexesPath}`);
      }

      if (!fs.existsSync(objectsPath)) {
        throw new Error(`Carpeta de objetos de assets no existe: ${objectsPath}`);
      }

      // Verificar que haya al menos archivos de índice
      const indexFiles = fs.readdirSync(indexesPath);
      if (indexFiles.length === 0) {
        console.warn(`Advertencia: No se encontraron archivos de índice de assets`);
      } else {
        console.log(`Se encontraron ${indexFiles.length} archivos de índice de assets`);
      }

      // Verificar que haya directorios de objetos
      const objectFolders = fs.readdirSync(objectsPath);
      if (objectFolders.length === 0) {
        console.warn(`Advertencia: No se encontraron directorios de objetos de assets`);
      } else {
        console.log(`Se encontraron ${objectFolders.length} directorios de objetos de assets`);
      }

      console.log(`Configuración de assets validada para instancia en ${instancePath}`);
    } catch (error) {
      console.error(`Error al validar configuración de assets:`, error);
      // Lanzamos el error para asegurar que la instancia no se considere lista si los assets no están bien configurados
      throw error;
    }
  }

  /**
   * FASE 1: Preparación del entorno - Descarga de Java
   */
  private async setupJavaEnvironment(javaVersion: string): Promise<string> {
    try {
      const javaPath = await javaDownloadService.downloadJava(javaVersion);
      console.log(`Java ${javaVersion} listo en: ${javaPath}`);
      return javaPath;
    } catch (error) {
      console.error('Error al preparar el entorno de Java:', error);
      throw error;
    }
  }
  
  /**
   * PASO 2.2: Descarga de archivos base de Minecraft (metadata y librerías)
   */
  private async downloadMinecraftBase(version: string): Promise<void> {
    try {
      // Descargar metadata de la versión
      await minecraftDownloadService.downloadVersionMetadata(version);
      
      // Descargar librerías base (esto puede tomar tiempo)
      await minecraftDownloadService.downloadVersionLibraries(version);
      
      console.log(`Archivos base de Minecraft ${version} descargados`);
    } catch (error) {
      console.error(`Error al descargar archivos base de Minecraft ${version}:`, error);
      throw error;
    }
  }
  
  /**
   * PASO 2.3: Descarga del cliente y loader para la instancia específica
   */
  private async downloadClientForInstance(
    version: string,
    loader: InstanceConfig['loader'],
    instancePath: string
  ): Promise<void> {
    try {
      // Si es vanilla, descargar todos los archivos necesarios (cliente, librerías, assets)
      if (loader === 'vanilla') {
        await minecraftDownloadService.downloadCompleteVersion(version, instancePath);
      } else {
        // Para otros loaders (fabric, forge, etc.), necesitamos descargar el loader
        // y combinarlo con el cliente base
        await this.downloadLoaderAndMerge(version, loader, instancePath);
        // Asegurarse de que también se descarguen los componentes base
        await minecraftDownloadService.downloadCompleteVersion(version, instancePath);
      }

      // Crear enlace simbólico para la carpeta de assets
      const assetsSourcePath = path.join(getLauncherDataPath(), 'assets');
      const assetsDestPath = path.join(instancePath, 'assets');

      try {
        // Asegurarse de que la carpeta de assets de la instancia esté vacía antes de crear el enlace
        if (fs.existsSync(assetsDestPath)) {
          const files = fs.readdirSync(assetsDestPath);
          if (files.length > 0) {
            console.warn(`La carpeta de assets en ${instancePath} no está vacía, no se creará el enlace simbólico.`);
          } else {
            fs.rmdirSync(assetsDestPath); // Eliminar la carpeta vacía para poder crear el enlace
          }
        }

        // Solo crear el enlace simbólico si la carpeta principal de assets existe
        if (fs.existsSync(assetsSourcePath)) {
          // Crear el enlace simbólico
          fs.symlinkSync(assetsSourcePath, assetsDestPath, 'junction'); // 'junction' es para Windows
          console.log(`Enlace simbólico para assets creado en ${instancePath}`);
        } else {
          console.log(`Carpeta de assets principal no existe en ${assetsSourcePath}, creando estructura vacía`);
          // Si no existen los assets principales, crear la carpeta assets base en la instancia
          fs.mkdirSync(assetsDestPath, { recursive: true });
        }
      } catch (error) {
        console.error(`Error al crear el enlace simbólico de assets en ${instancePath}:`, error);
        // Si falla el enlace simbólico, crear carpeta vacía como fallback
        fs.mkdirSync(assetsDestPath, { recursive: true });
      }

      console.log(`Cliente de Minecraft ${version} con ${loader} listo en ${instancePath}`);
    } catch (error) {
      console.error(`Error al descargar cliente para ${version} con ${loader}:`, error);
      throw error;
    }
  }
  
  /**
   * Descarga y combina un mod loader con el cliente base
   */
  private async downloadLoaderAndMerge(
    version: string, 
    loader: InstanceConfig['loader'], 
    instancePath: string
  ): Promise<void> {
    // Esta lógica dependerá del loader específico
    // Por ejemplo, para Fabric:
    if (loader === 'fabric') {
      await this.downloadFabricLoader(version, instancePath);
    } else if (loader === 'forge') {
      await this.downloadForgeLoader(version, instancePath);
    } else if (loader === 'quilt') {
      await this.downloadQuiltLoader(version, instancePath);
    } else {
      // Si no es un loader conocido, usar vanilla
      await minecraftDownloadService.downloadClientJar(version, instancePath);
    }
  }
  
  /**
   * Descarga el loader de Fabric
   */
  private async downloadFabricLoader(version: string, instancePath: string): Promise<void> {
    try {
      console.log(`Descargando Fabric para Minecraft ${version}...`);

      // Obtener la versión compatible de Fabric Loader
      const fabricApiUrl = `https://meta.fabricmc.net/v2/versions/loader/${version}`;
      const response = await fetch(fabricApiUrl);
      const fabricVersions = await response.json();

      // Tomar la última versión estable
      const latestFabric = fabricVersions.find((v: any) => v.loader.stable);
      if (!latestFabric) {
        throw new Error(`No se encontró versión estable de Fabric para Minecraft ${version}`);
      }

      const fabricLoaderVersion = latestFabric.loader.version;
      console.log(`Usando Fabric Loader ${fabricLoaderVersion} para Minecraft ${version}`);

      // Descargar el JAR del loader de Fabric
      const fabricLoaderUrl = `https://maven.fabricmc.net/net/fabricmc/fabric-loader/${fabricLoaderVersion}/fabric-loader-${fabricLoaderVersion}.jar`;
      const fabricLoaderPath = path.join(instancePath, 'loader', `fabric-loader-${fabricLoaderVersion}.jar`);

      // Asegurar que la carpeta loader exista
      const loaderDir = path.join(instancePath, 'loader');
      if (!fs.existsSync(loaderDir)) {
        fs.mkdirSync(loaderDir, { recursive: true });
      }

      // Descargar el archivo
      const responseLoader = await fetch(fabricLoaderUrl);
      if (!responseLoader.ok) {
        throw new Error(`Error al descargar Fabric Loader: ${responseLoader.status} ${responseLoader.statusText}`);
      }

      // Guardar el archivo
      const buffer = Buffer.from(await responseLoader.arrayBuffer());
      fs.writeFileSync(fabricLoaderPath, buffer);

      console.log(`Fabric Loader descargado en: ${fabricLoaderPath}`);
    } catch (error) {
      console.error(`Error al descargar Fabric Loader:`, error);
      // De todas formas, descargar el client.jar base como fallback
      await minecraftDownloadService.downloadClientJar(version, instancePath);
      throw error;
    }
  }

  /**
   * Descarga el loader de Forge
   */
  private async downloadForgeLoader(version: string, instancePath: string): Promise<void> {
    try {
      console.log(`Descargando Forge para Minecraft ${version}...`);

      // Para Forge, necesitamos encontrar la versión compatible
      // Usamos el API de Forge para obtener la lista de versiones
      const forgeApiUrl = 'https://files.minecraftforge.net/net/minecraftforge/forge/maven-metadata.json';
      const response = await fetch(forgeApiUrl);
      const forgeMetadata = await response.json();

      // Buscar una versión compatible con la versión de Minecraft
      // Esto es una simplificación: en realidad, se necesitaría una búsqueda más detallada
      let forgeVersion = null;
      const versions = forgeMetadata.versioning.versions;

      // Buscar la versión más reciente compatible con la versión de Minecraft
      for (let i = versions.length - 1; i >= 0; i--) {
        const v = versions[i];
        if (v.startsWith(`${version}-`)) {
          forgeVersion = v;
          break;
        }
      }

      if (!forgeVersion) {
        throw new Error(`No se encontró versión compatible de Forge para Minecraft ${version}`);
      }

      console.log(`Usando Forge ${forgeVersion} para Minecraft ${version}`);

      // Descargar el cliente de Forge (no el instalador, sino el universal)
      const forgeClientUrl = `https://maven.minecraftforge.net/net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}-client.jar`;
      const forgeClientPath = path.join(instancePath, 'loader', `forge-${forgeVersion}-client.jar`);

      // Asegurar que la carpeta loader exista
      const loaderDir = path.join(instancePath, 'loader');
      if (!fs.existsSync(loaderDir)) {
        fs.mkdirSync(loaderDir, { recursive: true });
      }

      // Descargar el archivo
      const responseClient = await fetch(forgeClientUrl);
      if (!responseClient.ok) {
        // Si el cliente no está disponible, usar un fallback
        console.log(`Cliente de Forge no disponible, usando fallback...`);
        await minecraftDownloadService.downloadClientJar(version, instancePath);
        return;
      }

      // Guardar el archivo
      const buffer = Buffer.from(await responseClient.arrayBuffer());
      fs.writeFileSync(forgeClientPath, buffer);

      console.log(`Forge Client descargado en: ${forgeClientPath}`);
    } catch (error) {
      console.error(`Error al descargar Forge:`, error);
      // De todas formas, descargar el client.jar base como fallback
      await minecraftDownloadService.downloadClientJar(version, instancePath);
      throw error;
    }
  }

  /**
   * Descarga el loader de Quilt
   */
  private async downloadQuiltLoader(version: string, instancePath: string): Promise<void> {
    try {
      console.log(`Descargando Quilt para Minecraft ${version}...`);

      // Obtener la versión compatible de Quilt Loader
      const quiltApiUrl = `https://meta.quiltmc.org/v3/versions/loader/${version}`;
      const response = await fetch(quiltApiUrl);
      const quiltVersions = await response.json();

      // Tomar la primera versión (la más reciente o estable)
      if (!quiltVersions || quiltVersions.length === 0) {
        throw new Error(`No se encontró versión de Quilt para Minecraft ${version}`);
      }

      const quiltEntry = quiltVersions[0]; // La primera es la más reciente
      const quiltLoaderVersion = quiltEntry.loader.version;
      console.log(`Usando Quilt Loader ${quiltLoaderVersion} para Minecraft ${version}`);

      // Descargar el JAR del loader de Quilt
      const quiltLoaderUrl = `https://maven.quiltmc.org/repository/release/org/quiltmc/quilt-loader/${quiltLoaderVersion}/quilt-loader-${quiltLoaderVersion}.jar`;
      const quiltLoaderPath = path.join(instancePath, 'loader', `quilt-loader-${quiltLoaderVersion}.jar`);

      // Asegurar que la carpeta loader exista
      const loaderDir = path.join(instancePath, 'loader');
      if (!fs.existsSync(loaderDir)) {
        fs.mkdirSync(loaderDir, { recursive: true });
      }

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
      console.error(`Error al descargar Quilt:`, error);
      // De todas formas, descargar el client.jar base como fallback
      await minecraftDownloadService.downloadClientJar(version, instancePath);
      throw error;
    }
  }
  
  /**
   * Instala contenido adicional (mods, resourcepacks, etc.) en una instancia existente
   */
  async installContentToInstance(
    instancePath: string,
    contentId: string, 
    contentType: 'mod' | 'resourcepack' | 'shader' | 'datapack' | 'modpack',
    mcVersion: string,
    loader?: string
  ): Promise<void> {
    if (!fs.existsSync(instancePath)) {
      throw new Error(`La instancia no existe: ${instancePath}`);
    }
    
    try {
      if (contentType === 'modpack') {
        // Instalar modpack
        await modrinthDownloadService.downloadModpack(contentId, instancePath, mcVersion, loader);
      } else {
        // Instalar contenido individual
        await modrinthDownloadService.downloadContent(contentId, instancePath, mcVersion, loader, contentType);
      }
      
      console.log(`Contenido ${contentType} ${contentId} instalado en ${instancePath}`);
    } catch (error) {
      console.error(`Error al instalar ${contentType} ${contentId}:`, error);
      throw error;
    }
  }
  
  /**
   * Verifica si una instancia está completamente lista para ejecutarse
   */
  isInstanceComplete(instancePath: string): boolean {
    // Verificar que exista el archivo client.jar
    const clientJarPath = path.join(instancePath, 'client.jar');
    if (!fs.existsSync(clientJarPath)) {
      console.log(`[Verificación] client.jar no encontrado en ${clientJarPath}`);
      try {
        const files = fs.readdirSync(instancePath);
        console.log(`[Verificación] Archivos en la instancia:`, files.join(', '));
      } catch (dirError) {
        console.log(`[Verificación] No se pudo leer el directorio de la instancia:`, dirError);
      }
      return false;
    }

    // Verificar si podemos acceder al archivo y obtener su tamaño
    let clientJarStats;
    try {
      clientJarStats = fs.statSync(clientJarPath);
    } catch (statError) {
      console.log(`[Verificación] No se pudo acceder al archivo client.jar: ${statError}`);
      return false;
    }

    // Verificar si el client.jar tiene un tamaño razonable (al menos 1MB para ser considerado válido)
    if (clientJarStats.size < 1024 * 1024) { // 1MB en bytes
      console.log(`[Verificación] client.jar es demasiado pequeño (${clientJarStats.size} bytes), probablemente no esté completamente descargado`);
      return false;
    }

    console.log(`[Verificación] client.jar encontrado y válido: ${clientJarPath} (${clientJarStats.size} bytes)`);

    // Verificar que exista la carpeta de assets o que exista en la ubicación compartida
    const launcherPath = getLauncherDataPath();
    const launcherAssetsPath = path.join(launcherPath, 'assets');

    // Solo verificamos que exista la carpeta compartida donde están los assets
    if (!fs.existsSync(launcherAssetsPath)) {
      console.log(`[Verificación] No se encontró la carpeta de assets compartida en (${launcherAssetsPath})`);
      return false;
    }

    // Verificar que exista la estructura de carpetas básica
    const requiredFolders = ['mods', 'config', 'saves', 'logs'];
    for (const folder of requiredFolders) {
      const folderPath = path.join(instancePath, folder);
      if (!fs.existsSync(folderPath)) {
        // Creamos la carpeta si no existe
        try {
          fs.mkdirSync(folderPath, { recursive: true });
          console.log(`[Verificación] Carpeta creada: ${folderPath}`);
        } catch (mkdirErr) {
          console.log(`[Verificación] No se pudo crear carpeta ${folder}:`, mkdirErr);
          return false;
        }
      }
    }

    return true;
  }
}

export const instanceCreationService = new InstanceCreationService();