// src/services/gameLaunchService.ts
// Servicio orquestador para lanzar el juego según el loader
// Delega la ejecución real a los servicios EjecutarX específicos de cada loader

import { ChildProcess } from 'node:child_process';
import { Profile } from '../renderer/services/profileService';
import { logProgressService } from './logProgressService';
import { ejecutarVanilla } from './descargas/vanilla/EjecutarVanilla';
import { ejecutarFabric } from './descargas/fabric/EjecutarFabric';
import { ejecutarQuilt } from './descargas/quilt/EjecutarQuilt';
import { ejecutarForge } from './descargas/forge/EjecutarForge';
import { ejecutarNeoForge } from './descargas/neoforge/EjecutarNeoForge';

/**
 * Opciones unificadas para lanzar el juego
 * Compatible con todos los loaders
 */
export interface GameLaunchOptions {
  javaPath: string;
  mcVersion: string;
  instancePath: string;
  ramMb?: number;
  jvmArgs?: string[];
  gameArgs?: string[];
  userProfile?: Profile;
  windowSize?: {
    width: number;
    height: number;
  };
  loader?: 'vanilla' | 'forge' | 'fabric' | 'quilt' | 'neoforge';
  loaderVersion?: string; // Requerido para Forge/Fabric/Quilt/NeoForge
  instanceConfig?: any; // Requerido para Forge/NeoForge
  onData?: (chunk: string) => void;
  onExit?: (code: number | null) => void;
}

/**
 * Servicio orquestador para lanzar Minecraft
 * 
 * IMPORTANTE: Este servicio NO implementa la lógica de ejecución.
 * Solo detecta el loader y delega a los servicios EjecutarX específicos.
 * Cada loader tiene su propia lógica completamente separada.
 */
export class GameLaunchService {
  /**
   * Lanza el juego según el loader especificado
   * 
   * @param opts Opciones de lanzamiento
   * @returns ChildProcess del juego ejecutándose
   */
  async launchGame(opts: GameLaunchOptions): Promise<ChildProcess> {
    const loader = opts.loader || 'vanilla';

    logProgressService.info(`[GameLaunch] Iniciando lanzamiento con loader: ${loader}`);

    try {
      switch (loader) {
        case 'vanilla':
          return await this.launchVanilla(opts);

        case 'fabric':
          return await this.launchFabric(opts);

        case 'quilt':
          return await this.launchQuilt(opts);

        case 'forge':
          return await this.launchForge(opts);

        case 'neoforge':
          return await this.launchNeoForge(opts);

        default:
          throw new Error(`Loader desconocido: ${loader}`);
      }
    } catch (error) {
      logProgressService.error(`[GameLaunch] Error al lanzar juego con loader ${loader}:`, error);
      throw error;
    }
  }

  /**
   * Lanza una instancia Vanilla
   */
  private async launchVanilla(opts: GameLaunchOptions): Promise<ChildProcess> {
    if (!opts.loaderVersion) {
      // Vanilla no requiere loaderVersion
    }

          return await ejecutarVanilla.ejecutar({
        javaPath: opts.javaPath,
            mcVersion: opts.mcVersion,
            instancePath: opts.instancePath,
            ramMb: opts.ramMb,
            jvmArgs: opts.jvmArgs,
            gameArgs: opts.gameArgs,
            userProfile: opts.userProfile,
            windowSize: opts.windowSize,
            onData: opts.onData,
            onExit: opts.onExit
          });
        }
        
  /**
   * Lanza una instancia Fabric
   */
  private async launchFabric(opts: GameLaunchOptions): Promise<ChildProcess> {
    if (!opts.loaderVersion) {
      throw new Error('Fabric requiere loaderVersion');
    }

          return await ejecutarFabric.ejecutar({
            javaPath: opts.javaPath,
            mcVersion: opts.mcVersion,
      loaderVersion: opts.loaderVersion,
            instancePath: opts.instancePath,
            ramMb: opts.ramMb,
            jvmArgs: opts.jvmArgs,
            gameArgs: opts.gameArgs,
            userProfile: opts.userProfile,
            windowSize: opts.windowSize,
            onData: opts.onData,
            onExit: opts.onExit
          });
        }
        
  /**
   * Lanza una instancia Quilt
   */
  private async launchQuilt(opts: GameLaunchOptions): Promise<ChildProcess> {
    if (!opts.loaderVersion) {
      throw new Error('Quilt requiere loaderVersion');
    }

          return await ejecutarQuilt.ejecutar({
            javaPath: opts.javaPath,
            mcVersion: opts.mcVersion,
      loaderVersion: opts.loaderVersion,
            instancePath: opts.instancePath,
            ramMb: opts.ramMb,
            jvmArgs: opts.jvmArgs,
            gameArgs: opts.gameArgs,
            userProfile: opts.userProfile,
            windowSize: opts.windowSize,
            onData: opts.onData,
            onExit: opts.onExit
          });
        }
        
  /**
   * Lanza una instancia Forge
   */
  private async launchForge(opts: GameLaunchOptions): Promise<ChildProcess> {
    if (!opts.loaderVersion) {
      throw new Error('Forge requiere loaderVersion');
    }

    if (!opts.instanceConfig) {
      throw new Error('Forge requiere instanceConfig');
    }

          return await ejecutarForge.ejecutar({
            javaPath: opts.javaPath,
            mcVersion: opts.mcVersion,
      loaderVersion: opts.loaderVersion,
            instancePath: opts.instancePath,
            ramMb: opts.ramMb,
            jvmArgs: opts.jvmArgs,
            gameArgs: opts.gameArgs,
            userProfile: opts.userProfile,
            windowSize: opts.windowSize,
            instanceConfig: opts.instanceConfig,
            onData: opts.onData,
            onExit: opts.onExit
          });
        }
        
  /**
   * Lanza una instancia NeoForge
   */
  private async launchNeoForge(opts: GameLaunchOptions): Promise<ChildProcess> {
    if (!opts.loaderVersion) {
      throw new Error('NeoForge requiere loaderVersion');
    }

    if (!opts.instanceConfig) {
      throw new Error('NeoForge requiere instanceConfig');
    }

          return await ejecutarNeoForge.ejecutar({
            javaPath: opts.javaPath,
            mcVersion: opts.mcVersion,
      loaderVersion: opts.loaderVersion,
            instancePath: opts.instancePath,
            ramMb: opts.ramMb,
            jvmArgs: opts.jvmArgs,
            gameArgs: opts.gameArgs,
            userProfile: opts.userProfile,
            windowSize: opts.windowSize,
            instanceConfig: opts.instanceConfig,
            onData: opts.onData,
            onExit: opts.onExit
          });
  }
}

// Exportar solo la instancia (patrón singleton)
export const gameLaunchService = new GameLaunchService();

