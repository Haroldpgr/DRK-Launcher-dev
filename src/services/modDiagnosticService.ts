import fs from 'node:fs';
import path from 'node:path';
import { ModDetectionService } from './modDetectionService';

/**
 * Servicio para diagnosticar problemas con mods en instancias de Fabric
 */
export class ModDiagnosticService {
  /**
   * Realiza un diagnóstico completo de los mods en una instancia
   */
  static async diagnoseMods(
    instancePath: string,
    loader: 'vanilla' | 'fabric' | 'forge' | 'quilt' | 'neoforge',
    mcVersion: string
  ): Promise<{
    success: boolean;
    issues: Array<{ severity: 'error' | 'warning' | 'info'; message: string; solution?: string }>;
    modsDetected: number;
    fabricApiInstalled: boolean;
    modsFolderExists: boolean;
    modsFolderPath: string;
    gameDirConfigured: boolean;
  }> {
    const issues: Array<{ severity: 'error' | 'warning' | 'info'; message: string; solution?: string }> = [];
    
    // 1. Verificar que la carpeta mods existe
    const modsFolderPath = path.join(instancePath, 'mods');
    const modsFolderExists = fs.existsSync(modsFolderPath);
    
    if (!modsFolderExists) {
      issues.push({
        severity: 'error',
        message: 'La carpeta "mods" no existe en la instancia',
        solution: 'La carpeta mods debe existir para que los mods se carguen. Se creará automáticamente.'
      });
      
      // Crear la carpeta si no existe
      try {
        fs.mkdirSync(modsFolderPath, { recursive: true });
        issues.push({
          severity: 'info',
          message: 'Carpeta "mods" creada automáticamente'
        });
      } catch (error: any) {
        issues.push({
          severity: 'error',
          message: `No se pudo crear la carpeta mods: ${error.message}`
        });
      }
    }

    // 2. Detectar mods instalados
    const mods = ModDetectionService.detectInstalledMods(instancePath, loader);
    const modsDetected = mods.length;

    if (modsDetected === 0 && modsFolderExists) {
      issues.push({
        severity: 'warning',
        message: 'No se detectaron mods en la carpeta "mods"',
        solution: 'Asegúrate de que los archivos .jar de los mods estén en la carpeta mods de la instancia'
      });
    }

    // 3. Verificar Fabric API específicamente
    let fabricApiInstalled = false;
    if (loader === 'fabric' || loader === 'quilt') {
      fabricApiInstalled = ModDetectionService.hasFabricAPI(instancePath);
      
      if (!fabricApiInstalled) {
        issues.push({
          severity: 'error',
          message: 'Fabric API no está instalado',
          solution: 'Fabric API es requerido para que la mayoría de mods funcionen. Descárgalo desde https://modrinth.com/mod/fabric-api'
        });
      } else {
        // Verificar que el archivo de Fabric API sea válido
        const fabricApiMod = mods.find(m => m.id.toLowerCase() === 'fabric-api');
        if (fabricApiMod) {
          const fileSize = fs.statSync(fabricApiMod.filePath).size;
          if (fileSize < 1000) {
            issues.push({
              severity: 'error',
              message: 'El archivo de Fabric API parece estar corrupto o incompleto',
              solution: 'Elimina el archivo de Fabric API y descárgalo nuevamente desde https://modrinth.com/mod/fabric-api'
            });
          } else {
            issues.push({
              severity: 'info',
              message: `Fabric API detectado: ${path.basename(fabricApiMod.filePath)} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`
            });
          }
        }
      }
    }

    // 4. Verificar archivos .jar en la carpeta mods
    if (modsFolderExists) {
      const files = fs.readdirSync(modsFolderPath);
      const jarFiles = files.filter(f => f.toLowerCase().endsWith('.jar'));
      const nonJarFiles = files.filter(f => !f.toLowerCase().endsWith('.jar') && !f.startsWith('.'));

      if (nonJarFiles.length > 0) {
        issues.push({
          severity: 'warning',
          message: `Se encontraron ${nonJarFiles.length} archivo(s) que no son .jar en la carpeta mods`,
          solution: 'Solo los archivos .jar son cargados como mods. Los otros archivos serán ignorados.'
        });
      }

      // Verificar archivos corruptos o muy pequeños
      for (const jarFile of jarFiles) {
        const jarPath = path.join(modsFolderPath, jarFile);
        try {
          const stats = fs.statSync(jarPath);
          if (stats.size < 100) {
            issues.push({
              severity: 'warning',
              message: `El archivo "${jarFile}" es muy pequeño (${stats.size} bytes) y puede estar corrupto`,
              solution: 'Verifica que el archivo se descargó correctamente'
            });
          }
        } catch (error) {
          issues.push({
            severity: 'error',
            message: `Error al leer el archivo "${jarFile}": ${error}`
          });
        }
      }
    }

    // 5. Verificar que el gameDir esté correctamente configurado
    // Esto se verifica en tiempo de ejecución, pero podemos verificar que la estructura sea correcta
    const requiredFolders = ['mods', 'config', 'saves'];
    for (const folder of requiredFolders) {
      const folderPath = path.join(instancePath, folder);
      if (!fs.existsSync(folderPath)) {
        issues.push({
          severity: 'warning',
          message: `La carpeta "${folder}" no existe`,
          solution: 'Algunas carpetas pueden no ser necesarias, pero es recomendable tenerlas'
        });
      }
    }

    // 6. Verificar compatibilidad de versiones
    if (loader === 'fabric' && mods.length > 0) {
      // Verificar que los mods sean para la versión correcta de Minecraft
      // Esto es difícil sin leer los archivos JAR, pero podemos verificar nombres comunes
      const versionInModNames = mods.some(m => m.name.includes(mcVersion) || m.filePath.includes(mcVersion));
      if (!versionInModNames && mods.length > 1) {
        issues.push({
          severity: 'warning',
          message: 'Algunos mods pueden no ser compatibles con la versión de Minecraft',
          solution: `Asegúrate de que todos los mods sean compatibles con Minecraft ${mcVersion}`
        });
      }
    }

    return {
      success: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      modsDetected,
      fabricApiInstalled,
      modsFolderExists: fs.existsSync(modsFolderPath),
      modsFolderPath,
      gameDirConfigured: true // Se verifica en tiempo de ejecución
    };
  }

  /**
   * Lista todos los archivos en la carpeta mods con detalles
   */
  static listModsFiles(instancePath: string): Array<{
    name: string;
    size: number;
    isJar: boolean;
    lastModified: Date;
  }> {
    const modsFolderPath = path.join(instancePath, 'mods');
    
    if (!fs.existsSync(modsFolderPath)) {
      return [];
    }

    const files = fs.readdirSync(modsFolderPath);
    const fileDetails = files.map(file => {
      const filePath = path.join(modsFolderPath, file);
      const stats = fs.statSync(filePath);
      
      return {
        name: file,
        size: stats.size,
        isJar: file.toLowerCase().endsWith('.jar'),
        lastModified: stats.mtime
      };
    });

    return fileDetails;
  }
}

