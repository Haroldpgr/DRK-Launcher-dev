// src/services/descargas/vanilla/EjecutarVanilla.ts

import path from 'node:path';
import { ChildProcess, spawn } from 'node:child_process';
import fs from 'node:fs';
import { logProgressService } from '../../logProgressService';
import { minecraftDownloadService } from '../../minecraftDownloadService';
import { getLauncherDataPath } from '../../../utils/paths';

// Definición de las opciones de ejecución (compatible con GameLaunchOptions)
export interface EjecutarVanillaOptions {
  javaPath: string;
  mcVersion: string;
  instancePath: string;
  ramMb?: number;
  jvmArgs?: string[];
  gameArgs?: string[];
    userProfile?: { accessToken: string; uuid: string; username: string };
    windowSize?: { width: number; height: number };
  onData?: (chunk: string) => void;
  onExit?: (code: number | null) => void;
}

export class EjecutarVanilla {

    /**
     * Construye la Classpath (cadena de librerías separadas por el delimitador del OS)
     */
    private async buildClasspath(mcVersion: string): Promise<string> {
        const versionsPath = path.join(getLauncherDataPath(), 'versions');
        const librariesPath = path.join(getLauncherDataPath(), 'libraries');
        // CRÍTICO: El archivo se guarda como 'version.json', no '{version}.json'
        const versionJsonPath = path.join(versionsPath, mcVersion, 'version.json');
        
        if (!fs.existsSync(versionJsonPath)) {
            throw new Error(`Metadata file not found: ${versionJsonPath}`);
        }
        
        const metadata = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));
        const libraries = metadata.libraries || [];
        
        const jarPaths: string[] = [];
        const separator = path.delimiter; // Delimitador: ';' en Windows, ':' en Linux/Mac
        
        for (const library of libraries) {
            // Asume que tienes un método similar a isLibraryAllowed o replica la lógica aquí
            if (!this.isLibraryAllowed(library.rules)) {
                  continue;
            }

            // Ignorar nativos, ya que solo necesitamos los JARs para la Classpath
            if (library.natives) {
                continue;
            }
            
            if (library.downloads?.artifact) {
                const artifact = library.downloads.artifact;
                const libPath = path.join(librariesPath, artifact.path);
                
                // CRÍTICO: Solo añadir a la Classpath si el archivo existe
                if (fs.existsSync(libPath)) {
                    jarPaths.push(libPath);
                        } else {
                    logProgressService.warning(`[Classpath] Librería faltante y no añadida: ${libPath}`);
                }
            }
        }
        
        // CRÍTICO: Añadir el JAR del cliente (client.jar) que está en la carpeta de la instancia
        const clientJarPath = path.join(this.options.instancePath, 'client.jar');
        if (fs.existsSync(clientJarPath)) {
            jarPaths.push(clientJarPath);
                  } else {
            logProgressService.error(`[Classpath] client.jar no encontrado en la instancia.`);
            throw new Error('Client JAR is missing from instance directory.');
        }

        return jarPaths.join(separator);
    }
    
    /**
     * Lógica simplificada para verificar si una librería está permitida (para reusar en buildClasspath)
     */
    private isLibraryAllowed(rules: any[]): boolean {
        if (!rules) return true;
        let allowed = true;
        for (const rule of rules) {
            const osMatch = !rule.os || rule.os.name === process.platform;
            if (rule.action === 'allow' && osMatch) allowed = true;
            else if (rule.action === 'disallow' && osMatch) { allowed = false; break; }
        }
        return allowed;
    }
    
    // Almacenar las opciones en el scope de la clase para acceso en métodos privados
    private options: EjecutarVanillaOptions;

    /**
     * Lanza el proceso de Java para la instancia Vanilla
     */
    public async ejecutar(opts: EjecutarVanillaOptions): Promise<ChildProcess> {
        this.options = opts;
        
        logProgressService.info(`[Vanilla Exec] Preparando lanzamiento de Minecraft ${opts.mcVersion}`);
        
        // --- PASO 1: OBTENER METADATA PARA ASSET INDEX ---
        // Necesitamos el ID del assetIndex, no la versión
        const versionsPath = path.join(getLauncherDataPath(), 'versions');
        const versionJsonPath = path.join(versionsPath, opts.mcVersion, 'version.json');
        
        if (!fs.existsSync(versionJsonPath)) {
            throw new Error(`Metadata file not found: ${versionJsonPath}`);
        }
        
        const versionMetadata = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));
        const assetIndexId = versionMetadata.assetIndex?.id || opts.mcVersion; // Fallback a versión si no hay assetIndex
        
        logProgressService.info(`[Vanilla Exec] Asset Index ID: ${assetIndexId}`);
        
        // --- PASO 2: CONSTRUIR ARGUMENTOS ---
        const classpath = await this.buildClasspath(opts.mcVersion);
        
        const gameArguments = opts.gameArgs || [];
        const jvmArguments = opts.jvmArgs || [];
        
        const maxRam = opts.ramMb || 2048; // Default 2GB
        const mainClass = 'net.minecraft.client.main.Main'; // Clase principal de Vanilla
        
        // --- PASO 3: ARGUMENTOS JVM CRÍTICOS ---
        const standardJvmArgs = [
            // 1. Memory arguments
            `-Xmx${maxRam}M`,
            `-Xms${maxRam}M`,
            
            // 2. Classpath (todos los JARs de librerías + client.jar)
            '-cp', classpath,
            
            // 3. RUTA NATIVA CRÍTICA (SOLUCIÓN AL UNSATISFIEDLINKERROR)
            // Esto le dice a LWJGL dónde buscar los archivos DLLs/SOs extraídos
            `-Dorg.lwjgl.librarypath=${path.join(opts.instancePath, 'natives')}`, 
            
            // 4. Main Class
            mainClass,
        ];
        
        const allJvmArgs = [...standardJvmArgs, ...jvmArguments];
        
        // --- PASO 4: ARGUMENTOS DE MINECRAFT ---
        // Parámetros de la sesión
        const uuid = opts.userProfile?.uuid || '00000000-0000-0000-0000-000000000000';
        const accessToken = opts.userProfile?.accessToken || 'NO_AUTH';
        const username = opts.userProfile?.username || 'Player';
        
        const standardGameArgs = [
      '--version', opts.mcVersion,
      '--gameDir', opts.instancePath,
      '--assetsDir', path.join(getLauncherDataPath(), 'assets'),
            '--assetIndex', assetIndexId, // CRÍTICO: Usar el ID del assetIndex, no la versión
            '--uuid', uuid,
      '--accessToken', accessToken,
            '--userType', 'mojang',
            '--versionType', 'launcher',
            '--width', (opts.windowSize?.width || 854).toString(),
            '--height', (opts.windowSize?.height || 480).toString(),
        ];
        
        const allGameArgs = [...standardGameArgs, ...gameArguments];
        
        // --- PASO 4: EJECUTAR ---
        const finalArgs = [...allJvmArgs, ...allGameArgs];

        logProgressService.info(`[Vanilla Exec] Comando Java: ${opts.javaPath}`);
        logProgressService.info(`[Vanilla Exec] Arguments: ${finalArgs.join(' ')}`);

        const child = spawn(opts.javaPath, finalArgs, {
            cwd: opts.instancePath,
            stdio: ['ignore', 'pipe', 'pipe']
        });

        child.stdout?.on('data', (data) => {
            const chunk = data.toString();
            logProgressService.info(`[Minecraft] ${chunk.trim()}`);
            if (opts.onData) opts.onData(chunk);
        });

        child.stderr?.on('data', (data) => {
            const chunk = data.toString();
            logProgressService.error('Minecraft (Error):', chunk.trim());
            if (opts.onData) opts.onData(chunk); // A menudo los errores JVM son útiles
        });

        child.on('close', (code) => {
            logProgressService.info(`[Vanilla Exec] Proceso de Minecraft cerrado con código ${code}`);
            if (opts.onExit) opts.onExit(code);
        });

        return child;
  }
}

export const ejecutarVanilla = new EjecutarVanilla();
