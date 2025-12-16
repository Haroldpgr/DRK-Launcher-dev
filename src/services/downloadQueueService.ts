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
  private maxConcurrentDownloads: number = 50; // 50 descargas simultáneas para balance entre velocidad y estabilidad
  private baseTimeoutMs: number = 60000; // Timeout base de 1 minuto

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
    let tempPath: string = ''; // Declarar fuera del try para acceso en catch
    
    try {
      // Crear directorio si no existe
      const dir = path.dirname(download.outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Crear controller de aborto y guardarlo para posibilidad de cancelación
      controller = new AbortController();
      download.abortController = controller;

      const timeoutId = setTimeout(() => controller.abort(), this.baseTimeoutMs);

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

      // Validar Content-Type básico (advertencia, no bloqueo)
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        console.warn(`[DownloadQueue] Content-Type es HTML para ${download.url}, puede ser un error 404`);
        // No bloquear aquí, la validación de hash/tamaño detectará el problema
      }

      // Obtener tamaño total y validar antes de escribir
      const contentLengthHeader = response.headers.get('content-length');
      const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;
      download.totalBytes = totalBytes;
      download.downloadedBytes = 0;

      // Validar que Content-Length sea razonable
      if (totalBytes === 0) {
        // Si no hay Content-Length, advertir pero continuar (algunos servidores no lo envían)
        console.warn(`[DownloadQueue] Content-Length no disponible o es 0 para ${download.url}`);
      } else if (totalBytes < 0) {
        throw new Error(`Content-Length inválido: ${totalBytes}`);
      }

      // Calcular timeout dinámico basado en el tamaño del archivo
      // Para archivos grandes (modpacks), usar timeout más largo
      // Base: 60s, +30s por cada 50MB, máximo 10 minutos
      let dynamicTimeout = this.baseTimeoutMs;
      if (totalBytes > 0) {
        const sizeMB = totalBytes / (1024 * 1024);
        if (sizeMB > 50) {
          // Archivos grandes: timeout más largo
          dynamicTimeout = Math.min(
            this.baseTimeoutMs + Math.floor(sizeMB / 50) * 30000, // +30s por cada 50MB
            600000 // Máximo 10 minutos
          );
        }
      }

      // DESCARGA ATÓMICA: Escribir a archivo temporal primero
      const tempPath = `${download.outputPath}.tmp.${Date.now()}`;
      
      // Limpiar archivo temporal si existe de una descarga anterior fallida
      if (fs.existsSync(tempPath)) {
        try {
          fs.unlinkSync(tempPath);
        } catch {}
      }

      // Crear stream de escritura al archivo temporal
      const fileStream = fs.createWriteStream(tempPath, { flags: 'w' });

      // Controlar progreso y reiniciar timeout cuando hay actividad
      let lastActivityTime = Date.now();
      let streamTimeout: NodeJS.Timeout | null = null;

      const resetTimeout = () => {
        if (streamTimeout) {
          clearTimeout(streamTimeout);
        }
        lastActivityTime = Date.now();
        streamTimeout = setTimeout(() => {
          const timeSinceLastActivity = Date.now() - lastActivityTime;
          // Solo timeout si no ha habido actividad en el tiempo especificado
          if (timeSinceLastActivity >= dynamicTimeout && !streamEnded && download.status === 'downloading') {
            streamError = new Error('Download stream timeout - connection may have been interrupted');
            fileStream.destroy();
            progressStream.destroy();
            if (fileStream.listenerCount('finish') > 0) {
              // Rechazar la promesa si el stream aún está activo
              const finishListeners = fileStream.listeners('finish');
              if (finishListeners.length > 0) {
                // El reject se manejará en el handler de 'error'
              }
            }
          }
        }, dynamicTimeout);
      };

      const progressStream = new (require('stream').Transform)({
        transform(chunk: Buffer, encoding: string, callback: (error: Error | null, data?: Buffer) => void) {
          download.downloadedBytes = (download.downloadedBytes || 0) + chunk.length;
          download.progress = totalBytes > 0 ? download.downloadedBytes! / totalBytes : 0;
          // Reiniciar timeout cuando hay datos (actividad en el stream)
          lastActivityTime = Date.now();
          if (streamTimeout) {
            clearTimeout(streamTimeout);
            resetTimeout();
          }
          callback(null, chunk);
        }
      });

      // Conectar streams con mejor manejo de errores
      let streamEnded = false;
      let streamError: Error | null = null;

      // Iniciar el timeout
      resetTimeout();

      response.body
        .on('error', (err) => {
          if (streamTimeout) clearTimeout(streamTimeout);
          if (err.name === 'AbortError') {
            download.status = 'cancelled';
            download.error = 'Download cancelled';
            fileStream.destroy();
            progressStream.destroy();
            // Limpiar archivo temporal y final si existe
            const tempPattern = `${download.outputPath}.tmp.*`;
            try {
              const dir = path.dirname(download.outputPath);
              const baseName = path.basename(download.outputPath);
              if (fs.existsSync(dir)) {
                const files = fs.readdirSync(dir);
                for (const file of files) {
                  if (file.startsWith(`${baseName}.tmp.`)) {
                    try {
                      fs.unlinkSync(path.join(dir, file));
                    } catch {}
                  }
                }
              }
            } catch {}
            
            if (fs.existsSync(download.outputPath)) {
              try {
                fs.unlinkSync(download.outputPath);
              } catch (unlinkError) {
                console.error('Error removing cancelled download file:', unlinkError);
              }
            }
          } else {
            streamError = err;
            fileStream.destroy(err);
            progressStream.destroy(err);
          }
        })
        .on('end', () => {
          streamEnded = true;
          if (streamTimeout) clearTimeout(streamTimeout);
        })
        .on('data', () => {
          // Reiniciar timeout cuando hay datos
          lastActivityTime = Date.now();
          if (streamTimeout) {
            clearTimeout(streamTimeout);
            resetTimeout();
          }
        })
        .pipe(progressStream)
        .pipe(fileStream);

      await new Promise((resolve, reject) => {

        fileStream.on('finish', () => {
          if (streamTimeout) clearTimeout(streamTimeout);
          if (!streamError) {
            resolve(undefined);
          } else {
            reject(streamError);
          }
        });
        fileStream.on('error', (err) => {
          if (streamTimeout) clearTimeout(streamTimeout);
          streamError = err;
          // Limpiar archivo temporal en caso de error
          if (fs.existsSync(tempPath)) {
            try {
              fs.unlinkSync(tempPath);
            } catch {}
          }
          reject(err);
        });
        progressStream.on('error', (err) => {
          if (streamTimeout) clearTimeout(streamTimeout);
          streamError = err;
          // Limpiar archivo temporal en caso de error
          if (fs.existsSync(tempPath)) {
            try {
              fs.unlinkSync(tempPath);
            } catch {}
          }
          reject(err);
        });
      });

      // Validar que el archivo temporal se haya descargado completamente
      if (download.status === 'downloading' || download.status === 'completed') {
        // Verificar que el archivo temporal existe
        if (!fs.existsSync(tempPath)) {
          throw new Error(`Archivo temporal no existe después de la descarga: ${tempPath}`);
        }

        const finalFileSize = fs.statSync(tempPath).size;

        // Si conocemos el tamaño total, verificar que coincida EXACTAMENTE
        if (download.totalBytes && download.totalBytes > 0) {
          if (finalFileSize !== download.totalBytes) {
            // Eliminar archivo temporal incompleto
            try {
              fs.unlinkSync(tempPath);
            } catch {}
            throw new Error(`Archivo descargado incompleto: tamaño esperado ${download.totalBytes}, tamaño real ${finalFileSize}`);
          }
        }

        // Si se proporcionó un hash esperado, verificar la integridad del archivo TEMPORAL
        if (download.expectedHash) {
          const calculatedHash = await this.calculateFileHash(tempPath, download.hashAlgorithm || 'sha1');
          if (calculatedHash.toLowerCase() !== download.expectedHash.toLowerCase()) {
            // Eliminar archivo temporal corrupto antes de lanzar error
            if (fs.existsSync(tempPath)) {
              try {
                fs.unlinkSync(tempPath);
              } catch (unlinkError) {
                console.error('Error removing corrupted temp file:', unlinkError);
              }
            }
            throw new Error(`Hash del archivo no coincide: esperado ${download.expectedHash}, obtenido ${calculatedHash}`);
          }
        }

        // DESCARGA ATÓMICA: Mover archivo temporal al destino final
        // Eliminar archivo final si existe (por si acaso)
        if (fs.existsSync(download.outputPath)) {
          try {
            fs.unlinkSync(download.outputPath);
          } catch (unlinkError) {
            // Si no se puede eliminar, intentar renombrar el temporal con un nombre único
            console.warn(`No se pudo eliminar archivo existente, usando nombre único para temporal`);
          }
        }

        // Mover archivo temporal al destino final (operación atómica en la mayoría de sistemas)
        try {
          fs.renameSync(tempPath, download.outputPath);
        } catch (renameError) {
          // Si rename falla (por ejemplo, en diferentes volúmenes), copiar y luego eliminar
          const fileBuffer = fs.readFileSync(tempPath);
          fs.writeFileSync(download.outputPath, fileBuffer);
          fs.unlinkSync(tempPath);
        }

        download.status = 'completed';
        download.progress = 1;
      }
    } catch (error: any) {
      // Solo marcar como error si no fue cancelado
      // Usar una verificación más amplia para evitar problemas de tipos
      const currentStatus = this.downloads.get(downloadId)?.status;
      if (currentStatus && currentStatus !== 'cancelled') {
        download.status = 'error';
        download.error = error.message || 'Unknown error';
        download.progress = 0;

        // Limpiar archivos temporales y finales si hubo error
        // Limpiar el archivo temporal específico si existe
        if (tempPath && fs.existsSync(tempPath)) {
          try {
            fs.unlinkSync(tempPath);
          } catch {}
        }
        
        // Buscar y eliminar otros archivos temporales relacionados (por si acaso)
        try {
          const dir = path.dirname(download.outputPath);
          const baseName = path.basename(download.outputPath);
          if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir);
            for (const file of files) {
              if (file.startsWith(`${baseName}.tmp.`)) {
                try {
                  fs.unlinkSync(path.join(dir, file));
                } catch {}
              }
            }
          }
        } catch {}

        // Limpiar archivo final si existe y está corrupto
        if (fs.existsSync(download.outputPath)) {
          try {
            const stats = fs.statSync(download.outputPath);
            // Si el archivo está vacío o es muy pequeño, eliminarlo
            if (stats.size === 0 || (download.totalBytes && stats.size < download.totalBytes * 0.1)) {
              fs.unlinkSync(download.outputPath);
            }
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
    this.maxConcurrentDownloads = Math.max(1, Math.min(200, max)); // Limitar entre 1 y 200 para seguridad
    // Procesar la cola con el nuevo límite
    this.processQueue();
  }

  /**
   * Obtiene el número máximo de descargas concurrentes actual
   */
  getMaxConcurrentDownloads(): number {
    return this.maxConcurrentDownloads;
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