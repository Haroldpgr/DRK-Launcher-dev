import { ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { createHash } from 'crypto';
import { getLauncherDataPath } from '../utils/paths';

// Interfaz para el modpack temporal
interface TemporaryModpack {
  id: string;
  originalPath: string;
  tempPath: string;
  uploadDate: number;
  expirationDate: number;
  downloadCount: number;
  maxDownloads: number;
}

// Servicio para manejar modpacks temporales
class TemporaryModpackService {
  private tempModpacks: Map<string, TemporaryModpack> = new Map();
  private dataPath: string;
  
  constructor() {
    this.dataPath = path.join(getLauncherDataPath(), 'temp-modpacks');
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }
    this.loadTempModpacks();
    // Limpiar modpacks expirados periódicamente
    setInterval(() => this.cleanupExpired(), 3600000); // Cada hora
  }

  /**
   * Crea un modpack temporal y devuelve una URL para compartir
   */
  public async createTemporaryModpack(originalPath: string): Promise<string> {
    // Generar un ID único para el modpack temporal
    const id = this.generateId();
    
    // Copiar el archivo a la carpeta de modpacks temporales
    const extension = path.extname(originalPath);
    const tempPath = path.join(this.dataPath, `${id}${extension}`);
    
    // Copiar archivo original al temporal
    await fs.promises.copyFile(originalPath, tempPath);
    
    // Crear registro del modpack temporal
    const expirationDate = Date.now() + (24 * 60 * 60 * 1000); // 24 horas
    
    const tempModpack: TemporaryModpack = {
      id,
      originalPath,
      tempPath,
      uploadDate: Date.now(),
      expirationDate,
      downloadCount: 0,
      maxDownloads: 100 // Límite máximo de descargas
    };
    
    this.tempModpacks.set(id, tempModpack);
    this.saveTempModpacks();
    
    // Devolver URL para compartir
    return `https://drklauncher.local/modpack/${id}`;
  }

  /**
   * Obtiene un modpack temporal por su ID
   */
  public getModpackById(id: string): TemporaryModpack | null {
    const modpack = this.tempModpacks.get(id);
    
    if (!modpack) return null;
    
    // Verificar si ha expirado
    if (Date.now() > modpack.expirationDate) {
      this.deleteModpack(id);
      return null;
    }
    
    // Incrementar contador de descargas
    modpack.downloadCount++;
    this.saveTempModpacks();
    
    return modpack;
  }

  /**
   * Elimina un modpack temporal
   */
  public deleteModpack(id: string): void {
    const modpack = this.tempModpacks.get(id);
    if (modpack) {
      // Eliminar archivo físico
      if (fs.existsSync(modpack.tempPath)) {
        fs.unlinkSync(modpack.tempPath);
      }
      this.tempModpacks.delete(id);
      this.saveTempModpacks();
    }
  }

  /**
   * Genera un ID único para el modpack temporal
   */
  private generateId(): string {
    return createHash('md5')
      .update(`${Date.now()}-${Math.random()}`)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Carga los modpacks temporales desde el disco
   */
  private loadTempModpacks(): void {
    const filePath = path.join(this.dataPath, 'modpacks.json');
    if (fs.existsSync(filePath)) {
      try {
        const data = fs.readFileSync(filePath, 'utf-8');
        const modpacks = JSON.parse(data);
        
        for (const [id, modpack] of Object.entries(modpacks)) {
          // Convertir el objeto a TemporaryModpack
          const tempModpack: TemporaryModpack = {
            id,
            ...modpack as Omit<TemporaryModpack, 'id'>
          };
          
          // Verificar si no ha expirado
          if (Date.now() <= tempModpack.expirationDate) {
            this.tempModpacks.set(id, tempModpack);
          } else {
            // Eliminar archivo físico si ha expirado
            if (fs.existsSync(tempModpack.tempPath)) {
              fs.unlinkSync(tempModpack.tempPath);
            }
          }
        }
      } catch (error) {
        console.error('Error loading temporary modpacks:', error);
      }
    }
  }

  /**
   * Guarda los modpacks temporales en el disco
   */
  private saveTempModpacks(): void {
    const filePath = path.join(this.dataPath, 'modpacks.json');
    const data = Object.fromEntries(this.tempModpacks);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  /**
   * Elimina modpacks expirados
   */
  private cleanupExpired(): void {
    const now = Date.now();
    for (const [id, modpack] of this.tempModpacks) {
      if (now > modpack.expirationDate) {
        this.deleteModpack(id);
      }
    }
  }
}

export const tempModpackService = new TemporaryModpackService();

// IPC handlers para Electron
ipcMain.handle('modpack:create-temporary', async (_, originalPath: string) => {
  return await tempModpackService.createTemporaryModpack(originalPath);
});

ipcMain.handle('modpack:get-temporary', async (_, id: string) => {
  return tempModpackService.getModpackById(id);
});