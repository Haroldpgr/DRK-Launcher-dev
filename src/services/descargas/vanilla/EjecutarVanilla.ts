import { spawn, ChildProcess } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { Profile } from '../../../renderer/services/profileService';
import { logProgressService } from '../../logProgressService';

export interface VanillaLaunchOptions {
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
  onData?: (chunk: string) => void;
  onExit?: (code: number | null) => void;
}

/**
 * Servicio para ejecutar instancias Vanilla de Minecraft
 */
export class EjecutarVanilla {
  private gameProcess: ChildProcess | null = null;

  /**
   * Ejecuta una instancia Vanilla
   * @param opts Opciones de lanzamiento
   */
  async ejecutar(opts: VanillaLaunchOptions): Promise<ChildProcess> {
    try {
      logProgressService.info(`[Vanilla] Iniciando ejecución de Minecraft ${opts.mcVersion}...`);

      // Validar que el client.jar existe
      const clientJarPath = path.join(opts.instancePath, 'client.jar');
      if (!fs.existsSync(clientJarPath)) {
        throw new Error(`client.jar no encontrado en ${clientJarPath}`);
      }

      // Construir argumentos JVM
      const jvmArgs: string[] = [
        `-Xmx${opts.ramMb || 4096}M`,
        `-Xms${Math.floor((opts.ramMb || 4096) * 0.5)}M`,
        ...(opts.jvmArgs || [])
      ];

      // Construir argumentos del juego
      const gameArgs: string[] = [
        '--username', opts.userProfile?.username || 'Player',
        '--version', opts.mcVersion,
        '--gameDir', opts.instancePath,
        '--assetsDir', path.join(opts.instancePath, 'assets'),
        '--assetIndex', opts.mcVersion,
        ...(opts.windowSize ? [
          '--width', opts.windowSize.width.toString(),
          '--height', opts.windowSize.height.toString()
        ] : []),
        ...(opts.gameArgs || [])
      ];

      // Clase principal de Vanilla
      const mainClass = 'net.minecraft.client.main.Main';

      // Construir classpath
      const classpath = [clientJarPath].join(path.delimiter);

      // Ejecutar el juego
      logProgressService.info(`[Vanilla] Ejecutando: ${opts.javaPath} ${jvmArgs.join(' ')} -cp ${classpath} ${mainClass} ${gameArgs.join(' ')}`);

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
          const output = data.toString();
          if (opts.onData) {
            opts.onData(output);
          }
        });
      }

      if (this.gameProcess.stderr) {
        this.gameProcess.stderr.on('data', (data) => {
          const output = data.toString();
          if (opts.onData) {
            opts.onData(output);
          }
        });
      }

      // Manejar cierre
      this.gameProcess.on('exit', (code) => {
        logProgressService.info(`[Vanilla] Proceso terminado con código ${code}`);
        if (opts.onExit) {
          opts.onExit(code);
        }
        this.gameProcess = null;
      });

      return this.gameProcess;
    } catch (error) {
      logProgressService.error(`[Vanilla] Error al ejecutar:`, error);
      throw error;
    }
  }

  /**
   * Detiene la ejecución del juego
   */
  detener(): void {
    if (this.gameProcess) {
      logProgressService.info(`[Vanilla] Deteniendo proceso...`);
      this.gameProcess.kill();
      this.gameProcess = null;
    }
  }
}

export const ejecutarVanilla = new EjecutarVanilla();

