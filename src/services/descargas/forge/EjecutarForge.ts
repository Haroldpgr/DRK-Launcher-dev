import { spawn, ChildProcess } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { Profile } from '../../../renderer/services/profileService';
import { logProgressService } from '../../logProgressService';
import { LaunchOptions } from '../../gameLaunchService';
import { gameLaunchService } from '../../gameLaunchService';

export interface ForgeLaunchOptions {
  javaPath: string;
  mcVersion: string;
  loaderVersion: string;
  instancePath: string;
  ramMb?: number;
  jvmArgs?: string[];
  gameArgs?: string[];
  userProfile?: Profile;
  windowSize?: {
    width: number;
    height: number;
  };
  instanceConfig: any;
  onData?: (chunk: string) => void;
  onExit?: (code: number | null) => void;
}

/**
 * Servicio para ejecutar instancias Forge de Minecraft
 */
export class EjecutarForge {
  private gameProcess: ChildProcess | null = null;

  /**
   * Ejecuta una instancia Forge
   */
  async ejecutar(opts: ForgeLaunchOptions): Promise<ChildProcess> {
    try {
      logProgressService.info(`[Forge] Iniciando ejecución de Forge ${opts.loaderVersion} para Minecraft ${opts.mcVersion}...`);

      // Validar archivos
      const clientJarPath = path.join(opts.instancePath, 'client.jar');
      const versionJsonPath = path.join(opts.instancePath, 'loader', 'version.json');
      
      if (!fs.existsSync(clientJarPath) || !fs.existsSync(versionJsonPath)) {
        throw new Error(`Archivos necesarios no encontrados`);
      }

      // Usar el servicio de lanzamiento para construir los argumentos
      const launchOpts: LaunchOptions = {
        javaPath: opts.javaPath,
        mcVersion: opts.mcVersion,
        instancePath: opts.instancePath,
        ramMb: opts.ramMb,
        jvmArgs: opts.jvmArgs,
        gameArgs: opts.gameArgs,
        userProfile: opts.userProfile,
        windowSize: opts.windowSize,
        loader: 'forge',
        loaderVersion: opts.loaderVersion,
        instanceConfig: opts.instanceConfig,
        onData: opts.onData,
        onExit: opts.onExit
      };

      // Ejecutar usando el servicio principal
      this.gameProcess = await gameLaunchService.launchGame(launchOpts);

      return this.gameProcess;
    } catch (error) {
      logProgressService.error(`[Forge] Error al ejecutar:`, error);
      throw error;
    }
  }

  /**
   * Detiene la ejecución del juego
   */
  detener(): void {
    if (this.gameProcess) {
      logProgressService.info(`[Forge] Deteniendo proceso...`);
      this.gameProcess.kill();
      this.gameProcess = null;
    }
  }
}

export const ejecutarForge = new EjecutarForge();

