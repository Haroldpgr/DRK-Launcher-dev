import path from 'node:path';
import fs from 'node:fs';
import { pipeline } from 'node:stream';
import { promisify } from 'node:util';
import fetch from 'node-fetch';
import { getLauncherDataPath } from '../utils/paths';

const pipelineAsync = promisify(pipeline);

/**
 * Servicio avanzado para descargas concurrentes con alta velocidad
 */
export class HighPerformanceDownloadService {
  private maxConcurrentDownloads: number;
  private timeout: number;
  private retryAttempts: number;

  constructor(maxConcurrentDownloads: number = 32, timeout: number = 30000, retryAttempts: number = 3) {
    this.maxConcurrentDownloads = maxConcurrentDownloads;
    this.timeout = timeout;
    this.retryAttempts = retryAttempts;
  }

  /**
   * Descarga múltiples archivos concurrentemente
   */
  async downloadMultipleFiles<T extends { url: string; path: string }>(
    fileList: T[],
    onProgress?: (progress: { completed: number; total: number; current: number; item: T }) => void
  ): Promise<{ item: T; success: boolean; error?: string }[]> {
    const results: { item: T; success: boolean; error?: string }[] = [];
    const totalFiles = fileList.length;

    // Dividir en lotes para no sobrecargar la red
    const batchSize = this.maxConcurrentDownloads;
    
    for (let i = 0; i < fileList.length; i += batchSize) {
      const batch = fileList.slice(i, i + batchSize);
      
      // Procesar el lote concurrentemente
      const batchResults = await Promise.allSettled(
        batch.map(async (item) => {
          try {
            await this.downloadWithRetry(item.url, item.path);
            
            // Notificar progreso
            const completed = results.length + batch.indexOf(item) + 1;
            onProgress?.({
              completed,
              total: totalFiles,
              current: completed / totalFiles * 100,
              item
            });

            return { item, success: true };
          } catch (error) {
            return { 
              item, 
              success: false, 
              error: (error as Error).message 
            };
          }
        })
      );

      // Procesar resultados del lote
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({ 
            item: batch[batchResults.indexOf(result)], 
            success: false, 
            error: result.reason?.message || 'Unknown error' 
          });
        }
      }
    }

    return results;
  }

  /**
   * Descarga un archivo con reintentos
   */
  private async downloadWithRetry(url: string, outputPath: string): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      try {
        await this.downloadFile(url, outputPath);
        return; // Éxito
      } catch (error) {
        lastError = error as Error;
        
        // Si es el último intento, lanzar el error
        if (attempt === this.retryAttempts - 1) {
          throw lastError;
        }

        // Esperar un poco antes del reintento (con backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw lastError!;
  }

  /**
   * Descarga un archivo con configuraciones optimizadas
   */
  private async downloadFile(url: string, outputPath: string): Promise<void> {
    // Crear directorio si no existe
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Configurar controlador de timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'DRK-Launcher/1.0 (compatible; fetch)'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      // Crear stream de escritura
      const fileStream = fs.createWriteStream(outputPath, {
        flags: 'w',
        autoClose: true
      });

      // Conectar los streams usando pipeline
      await pipelineAsync(
        response.body,
        fileStream
      );

      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Cancelar la solicitud si está pendiente
      if (!controller.signal.aborted) {
        controller.abort();
      }

      throw error;
    }
  }

  /**
   * Configura el número de descargas concurrentes
   */
  setConcurrency(maxConcurrent: number): void {
    this.maxConcurrentDownloads = maxConcurrent;
  }
}

export const highPerformanceDownloadService = new HighPerformanceDownloadService();