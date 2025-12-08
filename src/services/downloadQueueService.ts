import path from 'node:path';
import fs from 'node:fs';
import { pipeline } from 'node:stream';
import { promisify } from 'node:util';
import fetch from 'node-fetch';

const pipelineAsync = promisify(pipeline);

/**
 * Interfaz para la información de descarga
 */
export interface DownloadInfo {
  id: string;
  url: string;
  outputPath: string;
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'error' | 'cancelled';
  error?: string;
  totalBytes?: number;
  downloadedBytes?: number;
  expectedHash?: string; // Hash esperado para verificación de integridad
  hashAlgorithm?: string; // Algoritmo de hash (por ejemplo, 'sha1', 'sha256')
  abortController?: AbortController; // Controller para cancelar la descarga
}

/**
 * Servicio para manejar colas de descargas concurrentes
 */
export class DownloadQueueService {
  private downloads: Map<string, DownloadInfo> = new Map();
  private activeDownloads: Set<string> = new Set();
  private maxConcurrentDownloads: number = 3; // Reducir a 3 para evitar sobrecarga
  private timeoutMs: number = 300000; // Aumentar timeout a 5 minutos para descargas lentas

  /**
   * Añade una descarga a la cola
   */
  async addDownload(url: string, outputPath: string, expectedHash?: string, hashAlgorithm: string = 'sha1'): Promise<string> {
    const downloadId = this.generateId();
    const downloadInfo: DownloadInfo = {
      id: downloadId,
      url,
      outputPath,
      progress: 0,
      status: 'pending',
      expectedHash,
      hashAlgorithm
    };

    this.downloads.set(downloadId, downloadInfo);
    this.processQueue();

    return downloadId;
  }

  /**
   * Inicia una descarga individual con manejo de errores y timeouts
   */
  private async startDownload(downloadId: string): Promise<void> {
    const download = this.downloads.get(downloadId);
    if (!download || download.status !== 'pending') {
      return;
    }

    this.activeDownloads.add(downloadId);
    download.status = 'downloading';

    let controller: AbortController;
    try {
      // Crear directorio si no existe
      const dir = path.dirname(download.outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Crear controller de aborto y guardarlo para posibilidad de cancelación
      controller = new AbortController();
      download.abortController = controller;

      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      // Agregar headers para mejorar la estabilidad de la conexión
      const response = await fetch(download.url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'DRK-Launcher/1.0 (compatible; Fetch)',
          'Accept': '*/*',
          'Accept-Encoding': 'identity', // Evitar compresión para poder medir progreso
          'Connection': 'keep-alive'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok || !response.body) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Obtener tamaño total
      const totalBytes = parseInt(response.headers.get('content-length') || '0', 10);
      download.totalBytes = totalBytes;
      download.downloadedBytes = 0;

      // Crear stream de escritura
      const fileStream = fs.createWriteStream(download.outputPath);

      // Controlar progreso
      const progressStream = new (require('stream').Transform)({
        transform(chunk: Buffer, encoding: string, callback: (error: Error | null, data?: Buffer) => void) {
          download.downloadedBytes = (download.downloadedBytes || 0) + chunk.length;
          download.progress = totalBytes > 0 ? download.downloadedBytes! / totalBytes : 0;
          callback(null, chunk);
        }
      });

      // Conectar streams
      response.body
        .on('error', (err) => {
          if (err.name === 'AbortError') {
            // La descarga fue cancelada
            download.status = 'cancelled';
            download.error = 'Download cancelled';
            fileStream.destroy();
            progressStream.destroy();
            // Eliminar archivo parcial
            if (fs.existsSync(download.outputPath)) {
              try {
                fs.unlinkSync(download.outputPath);
              } catch (unlinkError) {
                console.error('Error removing cancelled download file:', unlinkError);
              }
            }
          } else {
            fileStream.destroy(err);
            progressStream.destroy(err);
          }
        })
        .pipe(progressStream)
        .pipe(fileStream);

      await new Promise((resolve, reject) => {
        fileStream.on('finish', resolve);
        fileStream.on('error', reject);
        progressStream.on('error', reject);
      });

      if (download.status !== 'cancelled') {
        // Validar que el archivo se haya descargado completamente
        const finalFileSize = fs.statSync(download.outputPath).size;

        // Si conocemos el tamaño total, verificar que coincida
        if (download.totalBytes && download.totalBytes > 0) {
          if (finalFileSize !== download.totalBytes) {
            console.warn(`Tamaño del archivo descargado (${finalFileSize}) no coincide con el tamaño esperado (${download.totalBytes})`);
            // Considerar como error si hay una gran discrepancia
            if (finalFileSize < download.totalBytes * 0.95) { // Permitir un 5% de diferencia por posibles redondeos
              throw new Error(`Archivo descargado incompleto: tamaño esperado ${download.totalBytes}, tamaño real ${finalFileSize}`);
            }
          }
        }

        // Si se proporcionó un hash esperado, verificar la integridad del archivo
        if (download.expectedHash) {
          const calculatedHash = await this.calculateFileHash(download.outputPath, download.hashAlgorithm || 'sha1');
          if (calculatedHash.toLowerCase() !== download.expectedHash.toLowerCase()) {
            throw new Error(`Hash del archivo no coincide: esperado ${download.expectedHash}, obtenido ${calculatedHash}`);
          }
        }

        download.status = 'completed';
        download.progress = 1;
      }
    } catch (error: any) {
      if (download.status === 'cancelled') {
        // Ya manejamos la cancelación en el evento on('error')
      } else {
        download.status = 'error';
        download.error = error.message || 'Unknown error';
        download.progress = 0;

        // Limpiar archivo si hubo error
        if (fs.existsSync(download.outputPath)) {
          try {
            fs.unlinkSync(download.outputPath);
          } catch (unlinkError) {
            console.error('Error removing failed download file:', unlinkError);
          }
        }
      }
    } finally {
      // Limpiar el controller de la descarga
      delete download.abortController;
      this.activeDownloads.delete(downloadId);
      this.processQueue(); // Procesar siguiente descarga en la cola
    }
  }

  /**
   * Procesa la cola de descargas
   */
  private processQueue(): void {
    // Obtener descargas pendientes que no estén activas
    const pendingDownloads = Array.from(this.downloads.entries())
      .filter(([_, info]) => info.status === 'pending' && !this.activeDownloads.has(info.id))
      .slice(0, this.maxConcurrentDownloads - this.activeDownloads.size);

    for (const [_, download] of pendingDownloads) {
      if (this.activeDownloads.size < this.maxConcurrentDownloads) {
        // Iniciar descarga en segundo plano
        this.startDownload(download.id).catch(error => {
          console.error(`Error in download ${download.id}:`, error);
          const downloadInfo = this.downloads.get(download.id);
          if (downloadInfo) {
            downloadInfo.status = 'error';
            downloadInfo.error = error.message;
          }
          this.activeDownloads.delete(download.id);
        });
      }
    }
  }

  /**
   * Obtiene el estado de una descarga
   */
  getDownloadStatus(downloadId: string): DownloadInfo | undefined {
    return this.downloads.get(downloadId);
  }

  /**
   * Cancela una descarga en progreso
   */
  cancelDownload(downloadId: string): boolean {
    const download = this.downloads.get(downloadId);
    if (!download) {
      return false;
    }

    if (download.status === 'pending') {
      download.status = 'error';
      download.error = 'Download cancelled';
      return true;
    }

    // Para descargas activas, no podemos cancelarlas fácilmente
    // pero podemos marcarlas para que se ignoren
    if (download.status === 'downloading') {
      // La descarga seguirá hasta completar o fallar, pero no se procesará después
      return true;
    }

    return false;
  }

  /**
   * Reinicia una descarga fallida
   */
  async restartDownload(downloadId: string): Promise<string | null> {
    const download = this.downloads.get(downloadId);
    if (!download || download.status !== 'error') {
      return null;
    }

    // Cambiar estado a pendiente para reiniciar
    download.status = 'pending';
    download.progress = 0;
    download.error = undefined;

    this.processQueue();
    return downloadId;
  }

  /**
   * Obtiene todas las descargas
   */
  getAllDownloads(): DownloadInfo[] {
    return Array.from(this.downloads.values());
  }

  /**
   * Calcula el hash de un archivo
   */
  private async calculateFileHash(filePath: string, algorithm: string): Promise<string> {
    const crypto = await import('node:crypto');
    const fs = await import('node:fs');
    const stream = await import('node:stream');

    return new Promise((resolve, reject) => {
      const hash = crypto.createHash(algorithm);
      const input = fs.createReadStream(filePath);

      input.on('error', reject);
      input.on('data', chunk => hash.update(chunk));
      input.on('close', () => resolve(hash.digest('hex')));
    });
  }

  /**
   * Genera un ID único para la descarga
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  /**
   * Obtiene el número de descargas activas
   */
  getActiveDownloadCount(): number {
    return this.activeDownloads.size;
  }

  /**
   * Establece el número máximo de descargas concurrentes
   */
  setMaxConcurrentDownloads(max: number): void {
    this.maxConcurrentDownloads = max;
    // Procesar la cola con el nuevo límite
    this.processQueue();
  }

  /**
   * Cancela una descarga activa
   */
  cancelDownloadById(downloadId: string): boolean {
    const download = this.downloads.get(downloadId);
    if (!download) {
      return false;
    }

    if (download.status === 'downloading' && download.abortController) {
      // Abortar la descarga actual
      download.abortController.abort();
      download.status = 'cancelled';
      download.error = 'Download cancelled by user';
      download.progress = 0;

      // Eliminar de las descargas activas
      this.activeDownloads.delete(downloadId);

      // Procesar la cola para iniciar otras descargas
      this.processQueue();

      return true;
    } else if (download.status === 'pending') {
      // Si la descarga aún está pendiente, simplemente cambiar el estado
      download.status = 'cancelled';
      download.error = 'Download cancelled before start';

      // Procesar la cola para iniciar otras descargas
      this.processQueue();

      return true;
    }

    return false;
  }

  /**
   * Cancela todas las descargas activas
   */
  cancelAllDownloads(): number {
    let cancelledCount = 0;

    for (const [downloadId, download] of this.downloads.entries()) {
      if (download.status === 'downloading' || download.status === 'pending') {
        const wasCancelled = this.cancelDownloadById(downloadId);
        if (wasCancelled) {
          cancelledCount++;
        }
      }
    }

    return cancelledCount;
  }

  /**
   * Obtiene el número total de descargas en cola
   */
  getTotalDownloadCount(): number {
    return this.downloads.size;
  }
}

export const downloadQueueService = new DownloadQueueService();

// Exportar también los métodos necesarios para acceso externo
export { DownloadInfo };