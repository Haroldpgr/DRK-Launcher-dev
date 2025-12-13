import { spawn, ChildProcess } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { Profile } from '../../../renderer/services/profileService';
import { logProgressService } from '../../logProgressService';

export interface QuiltLaunchOptions {
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
  onData?: (chunk: string) => void;
  onExit?: (code: number | null) => void;
}

/**
 * Servicio para ejecutar instancias Quilt de Minecraft
 */
export class EjecutarQuilt {
  private gameProcess: ChildProcess | null = null;

  /**
   * Ejecuta una instancia Quilt
   */
  async ejecutar(opts: QuiltLaunchOptions): Promise<ChildProcess> {
    try {
      logProgressService.info(`[Quilt] Iniciando ejecución de Quilt ${opts.loaderVersion} para Minecraft ${opts.mcVersion}...`);

      // Validar archivos
      const clientJarPath = path.join(opts.instancePath, 'client.jar');
      const loaderJarPath = path.join(opts.instancePath, 'loader', `quilt-loader-${opts.loaderVersion}.jar`);
      
      if (!fs.existsSync(clientJarPath) || !fs.existsSync(loaderJarPath)) {
        throw new Error(`Archivos necesarios no encontrados`);
      }

      // Construir argumentos JVM
      const jvmArgs: string[] = [
        `-Xmx${opts.ramMb || 4096}M`,
        `-Xms${Math.floor((opts.ramMb || 4096) * 0.5)}M`,
        ...(opts.jvmArgs || [])
      ];

      // Clase principal de Quilt (similar a Fabric)
      const mainClass = 'org.quiltmc.loader.impl.launch.knot.KnotClient';

      // Construir classpath
      const classpath = [clientJarPath, loaderJarPath].join(path.delimiter);

      // Construir argumentos del juego
      const gameArgs: string[] = [
        '--username', opts.userProfile?.username || 'Player',
        '--version', opts.mcVersion,
        '--gameDir', opts.instancePath,
        ...(opts.windowSize ? [
          '--width', opts.windowSize.width.toString(),
          '--height', opts.windowSize.height.toString()
        ] : []),
        ...(opts.gameArgs || [])
      ];

      logProgressService.info(`[Quilt] Ejecutando Quilt...`);

      this.gameProcess = spawn(opts.javaPath, [
        ...jvmArgs,
        '-cp', classpath,
        mainClass,
        ...gameArgs
      ], {
        cwd: opts.instancePath,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      // Manejar salida
      if (this.gameProcess.stdout) {
        this.gameProcess.stdout.on('data', (data) => {
          if (opts.onData) {
            opts.onData(data.toString());
          }
        });
      }

      if (this.gameProcess.stderr) {
        this.gameProcess.stderr.on('data', (data) => {
          if (opts.onData) {
            opts.onData(data.toString());
          }
        });
      }

      // Manejar cierre
      this.gameProcess.on('exit', (code) => {
        logProgressService.info(`[Quilt] Proceso terminado con código ${code}`);
        if (opts.onExit) {
          opts.onExit(code);
        }
        this.gameProcess = null;
      });

      return this.gameProcess;
    } catch (error) {
      logProgressService.error(`[Quilt] Error al ejecutar:`, error);
      throw error;
    }
  }

  /**
   * Detiene la ejecución del juego
   */
  detener(): void {
    if (this.gameProcess) {
      logProgressService.info(`[Quilt] Deteniendo proceso...`);
      this.gameProcess.kill();
      this.gameProcess = null;
    }
  }
}

export const ejecutarQuilt = new EjecutarQuilt();

