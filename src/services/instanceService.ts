// src/services/instanceService.ts
// Servicio para gestionar la configuración y estructura de instancias
// IMPORTANTE: No mezcla lógica entre loaders, cada uno tiene validaciones específicas

import path from 'node:path';
import fs from 'node:fs';
import { getLauncherDataPath } from '../utils/paths';

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
  minMemory?: number;
  windowWidth?: number;
  windowHeight?: number;
  jvmArgs?: string[];
  createdAt: number;
  path: string;
  ready?: boolean;
}

/**
 * Servicio para manejar la creación y estructura de instancias de Minecraft
 */
export class InstanceService {
  private basePath: string;

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
   * Crea una nueva instancia con la estructura de carpetas básica
   */
  createInstance(config: {
    name: string;
    version: string;
    loader?: 'vanilla' | 'forge' | 'fabric' | 'quilt' | 'neoforge';
    loaderVersion?: string;
    javaPath?: string;
    maxMemory?: number;
    minMemory?: number;
    jvmArgs?: string[];
    id?: string;
  }): InstanceConfig {
    const id = config.id || this.generateInstanceId(config.name);
    const instancePath = path.join(this.basePath, id);

    // Crear la estructura de carpetas necesaria
    const requiredFolders = [
      'mods',
      'config',
      'saves',
      'logs',
      'resourcepacks',
      'shaderpacks',
      'screenshots'
    ];

    this.ensureDir(instancePath);
    requiredFolders.forEach(folder => {
      this.ensureDir(path.join(instancePath, folder));
    });

    // Crear la configuración de la instancia
    const instanceConfig: InstanceConfig = {
      id,
      name: config.name,
      version: config.version,
      loader: config.loader,
      loaderVersion: config.loaderVersion,
      javaPath: config.javaPath,
      maxMemory: config.maxMemory,
      minMemory: config.minMemory,
      jvmArgs: config.jvmArgs,
      createdAt: Date.now(),
      path: instancePath,
      ready: false
    };

    // Guardar la configuración
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
   * Verifica si una instancia está lista para jugar
   * 
   * IMPORTANTE: Cada loader tiene diferentes requisitos:
   * - Vanilla/Fabric/Quilt: Requieren client.jar en la instancia
   * - Forge/NeoForge: NO requieren client.jar, usan version.json en versions/
   */
  public isInstanceReady(instancePath: string): boolean {
    try {
      // Verificar que exista la configuración
      const config = this.getInstanceConfig(instancePath);
      if (!config) {
        console.log(`[VERIFICACIÓN] Configuración de instancia no encontrada: ${instancePath}`);
        return false;
      }

      const loader = config.loader || 'vanilla';

      // Verificación específica por loader
      if (loader === 'forge' || loader === 'neoforge') {
        // Forge/NeoForge: Validar version.json en versions/
        // NO existe client.jar en la instancia
        if (!config.loaderVersion) {
          console.log(`[VERIFICACIÓN] Configuración de instancia incompleta: falta loaderVersion para ${loader}`);
          return false;
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
        const versionName = `${config.version}-${loader}-${normalizedLoaderVersion}`;
        const versionJsonPath = path.join(launcherDataPath, 'versions', versionName, `${versionName}.json`);

        if (!fs.existsSync(versionJsonPath)) {
          console.log(`[VERIFICACIÓN] Version.json de ${loader} no encontrado: ${versionJsonPath}`);
          return false;
        }

        // Validar que el version.json es válido
        try {
          const versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));
          if (!versionData.mainClass || !versionData.libraries) {
            console.log(`[VERIFICACIÓN] Version.json de ${loader} es inválido`);
            return false;
          }
        } catch (error) {
          console.log(`[VERIFICACIÓN] Error al validar version.json de ${loader}: ${error}`);
          return false;
        }

        console.log(`[VERIFICACIÓN] Instancia ${loader} lista: version.json válido`);
        return true;
      } else {
        // Vanilla/Fabric/Quilt: Validar client.jar en la instancia
        const clientJarPath = path.join(instancePath, 'client.jar');
        if (!fs.existsSync(clientJarPath)) {
          console.log(`[VERIFICACIÓN] client.jar no encontrado: ${clientJarPath}`);
          return false;
        }

        const stats = fs.statSync(clientJarPath);
        if (stats.size < 1024 * 1024) { // Menos de 1MB
          console.log(`[VERIFICACIÓN] client.jar tiene tamaño inusualmente pequeño: ${stats.size} bytes`);
          return false;
        }

        console.log(`[VERIFICACIÓN] Instancia ${loader || 'vanilla'} lista: client.jar válido (${stats.size} bytes)`);
        return true;
      }
    } catch (error) {
      console.error(`[VERIFICACIÓN] Error al verificar instancia: ${error}`);
      return false;
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
   * Lista todas las instancias disponibles
   */
  public listInstances(): InstanceConfig[] {
    if (!fs.existsSync(this.basePath)) {
      return [];
    }

    const instances: InstanceConfig[] = [];
    const dirs = fs.readdirSync(this.basePath, { withFileTypes: true });

    for (const dir of dirs) {
      if (dir.isDirectory()) {
        const instancePath = path.join(this.basePath, dir.name);
        const config = this.getInstanceConfig(instancePath);
        if (config) {
          instances.push(config);
        }
      }
    }

    return instances;
  }

  /**
   * Elimina una instancia
   */
  public deleteInstance(instancePath: string): void {
    if (fs.existsSync(instancePath)) {
      fs.rmSync(instancePath, { recursive: true, force: true });
    }
  }
}

export const instanceService = new InstanceService();

