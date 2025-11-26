// src/main/javaService.js
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { pipeline } = require('stream');
const { promisify } = require('util');
const { createWriteStream, createReadStream } = require('fs');
const { createHash } = require('crypto');
const { Extract } = require('unzip-stream');
const tar = require('tar');

// Promisify para usar async/await
const pipelineAsync = promisify(pipeline);

class JavaService {
  constructor(runtimePath = './runtime') {
    this.runtimePath = runtimePath;
    this.config = this.loadConfig();
    this.installedJavas = this.config.installedJavas || [];
    this.defaultJavaId = this.config.defaultJavaId || null;
  }

  // Cargar configuración de Java
  loadConfig() {
    const configPath = path.join(this.runtimePath, 'java.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    return {
      installedJavas: [],
      defaultJavaId: null
    };
  }

  // Guardar configuración de Java
  saveConfig() {
    const configPath = path.join(this.runtimePath, 'java.json');
    // Ensure runtime directory exists
    if (!fs.existsSync(this.runtimePath)) {
      fs.mkdirSync(this.runtimePath, { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
  }

  // Detección de Java instalado globalmente
  detectGlobalJava() {
    const detectedJavas = [];
    
    // En Windows
    if (process.platform === 'win32') {
      detectedJavas.push(...this.detectWindowsJava());
    }
    // En Linux
    else if (process.platform === 'linux') {
      detectedJavas.push(...this.detectLinuxJava());
    }
    // En macOS
    else if (process.platform === 'darwin') {
      detectedJavas.push(...this.detectMacOSJava());
    }

    // Detectar JAVA_HOME
    if (process.env.JAVA_HOME) {
      const javaPath = path.join(process.env.JAVA_HOME, 'bin', 'java');
      if (fs.existsSync(javaPath)) {
        const version = this.getJavaVersion(javaPath);
        detectedJavas.push({
          id: `JAVA_HOME_${version}`,
          path: javaPath,
          version: version,
          isWorking: true,
          source: 'JAVA_HOME'
        });
      }
    }

    // Detectar java en PATH
    try {
      const javaInPath = execSync('which java || where java', { encoding: 'utf8' }).trim();
      if (javaInPath) {
        const version = this.getJavaVersion(javaInPath);
        detectedJavas.push({
          id: `PATH_${version}`,
          path: javaInPath,
          version: version,
          isWorking: true,
          source: 'PATH'
        });
      }
    } catch (e) {
      // No java in PATH
    }

    // Eliminar duplicados
    const uniqueJavas = detectedJavas.filter((java, index, self) =>
      index === self.findIndex(j => j.path === java.path)
    );

    return uniqueJavas;
  }

  detectWindowsJava() {
    const javas = [];
    const commonPaths = [
      'C:/Program Files/Java/',
      'C:/Program Files/Eclipse Adoptium/',
      'C:/Program Files/Amazon Corretto/',
      'C:/Program Files/JavaSoft/',
      'C:/Program Files/OpenJDK/',
    ];

    commonPaths.forEach(basePath => {
      if (fs.existsSync(basePath)) {
        const folders = fs.readdirSync(basePath);
        folders.forEach(folder => {
          const fullPath = path.join(basePath, folder);
          if (fs.statSync(fullPath).isDirectory()) {
            const javaPath = path.join(fullPath, 'bin', 'java.exe');
            if (fs.existsSync(javaPath)) {
              const version = this.getJavaVersion(javaPath);
              javas.push({
                id: `${folder.replace(/\s+/g, '_')}_${version}`,
                path: javaPath,
                version: version,
                isWorking: true,
                source: 'global'
              });
            }
          }
        });
      }
    });

    return javas;
  }

  detectLinuxJava() {
    const javas = [];
    const commonPaths = [
      '/usr/lib/jvm/',
      '/usr/java/',
      '/opt/java/',
    ];

    commonPaths.forEach(basePath => {
      if (fs.existsSync(basePath)) {
        const folders = fs.readdirSync(basePath);
        folders.forEach(folder => {
          const fullPath = path.join(basePath, folder);
          if (fs.statSync(fullPath).isDirectory()) {
            const javaPath = path.join(fullPath, 'bin', 'java');
            if (fs.existsSync(javaPath)) {
              const version = this.getJavaVersion(javaPath);
              javas.push({
                id: `${folder.replace(/\s+/g, '_')}_${version}`,
                path: javaPath,
                version: version,
                isWorking: true,
                source: 'global'
              });
            }
          }
        });
      }
    });

    return javas;
  }

  detectMacOSJava() {
    const javas = [];
    const commonPaths = [
      '/Library/Java/JavaVirtualMachines/',
      '/System/Library/Java/JavaVirtualMachines/',
    ];

    commonPaths.forEach(basePath => {
      if (fs.existsSync(basePath)) {
        const folders = fs.readdirSync(basePath);
        folders.forEach(folder => {
          const fullPath = path.join(basePath, folder, 'Contents', 'Home');
          if (fs.existsSync(fullPath)) {
            const javaPath = path.join(fullPath, 'bin', 'java');
            if (fs.existsSync(javaPath)) {
              const version = this.getJavaVersion(javaPath);
              javas.push({
                id: `${folder.replace(/\s+/g, '_')}_${version}`,
                path: javaPath,
                version: version,
                isWorking: true,
                source: 'global'
              });
            }
          }
        });
      }
    });

    return javas;
  }

  // Obtener la versión de Java
  getJavaVersion(javaPath) {
    try {
      const result = execSync(`"${javaPath}" -version 2>&1`, { encoding: 'utf8' });
      const versionMatch = result.match(/version "([^"]+)"/);
      if (versionMatch) {
        const fullVersion = versionMatch[1];
        // Extraer solo el número principal (8, 11, 17, etc.)
        const majorVersion = fullVersion.split('.')[0];
        return majorVersion;
      }
      return 'unknown';
    } catch (e) {
      console.error('Error getting Java version:', e.message);
      return 'unknown';
    }
  }

  // Verificar si un binario de Java funciona
  testJavaBinary(javaPath) {
    try {
      const result = execSync(`"${javaPath}" -version 2>&1`, { encoding: 'utf8' });
      return {
        isWorking: true,
        version: this.getJavaVersion(javaPath),
        output: result
      };
    } catch (e) {
      return {
        isWorking: false,
        error: e.message
      };
    }
  }

  // Obtener URL de descarga de Java recomendado
  async getRecommendedJavaUrl(version) {
    // URL de la API de Adoptium
    const architecture = process.arch === 'x64' ? 'x64' : process.arch;
    const os = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'mac' : 'linux';
    
    const url = `https://api.adoptium.net/v3/binary/latest/${version}/hotspot/${os}/${architecture}/jdk/hotspot/normal/eclipse?project=jdk`;
    
    return new Promise((resolve, reject) => {
      const client = os === 'windows' ? http : https;
      client.get(url, { headers: { 'User-Agent': 'DRK-Launcher' } }, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          resolve(res.headers.location);
        } else {
          reject(new Error(`Failed to get download URL: ${res.statusCode}`));
        }
      }).on('error', reject);
    });
  }

  // Descargar archivo con barra de progreso
  async downloadFile(url, onProgress) {
    const tempPath = path.join(this.runtimePath, 'temp', path.basename(url));
    
    // Crear directorio temporal si no existe
    if (!fs.existsSync(path.dirname(tempPath))) {
      fs.mkdirSync(path.dirname(tempPath), { recursive: true });
    }

    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      
      client.get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Download failed: ${res.statusCode}`));
          return;
        }

        const totalLength = parseInt(res.headers['content-length'].toString());
        let downloadedLength = 0;

        const writeStream = createWriteStream(tempPath);
        
        res.on('data', (chunk) => {
          downloadedLength += chunk.length;
          if (totalLength && onProgress) {
            onProgress({ 
              received: downloadedLength, 
              total: totalLength, 
              percentage: Math.round((downloadedLength / totalLength) * 100) 
            });
          }
        });

        res.pipe(writeStream);

        writeStream.on('finish', () => resolve(tempPath));
        writeStream.on('error', reject);
      }).on('error', reject);
    });
  }

  // Verificar SHA256
  verifySHA256(filePath, expectedSHA256) {
    const hash = createHash('sha256');
    const input = createReadStream(filePath);

    return new Promise((resolve, reject) => {
      input.on('readable', () => {
        const data = input.read();
        if (data) {
          hash.update(data);
        } else {
          const actualSHA256 = hash.digest('hex').toLowerCase();
          resolve(actualSHA256 === expectedSHA256.toLowerCase());
        }
      });
      input.on('error', reject);
    });
  }

  // Instalar Java
  async installRecommendedJava(version, onProgress) {
    try {
      // Obtener URL de descarga
      const downloadUrl = await this.getRecommendedJavaUrl(version);
      
      // Descargar archivo
      const tempPath = await this.downloadFile(downloadUrl, onProgress);
      
      // Verificar integridad del archivo (en este ejemplo, no verificamos SHA256 real)
      // En un entorno real, la API de Adoptium debería proporcionar el SHA256
      
      // Crear directorio de destino
      const targetDir = path.join(this.runtimePath, `java${version}`);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // Determinar tipo de archivo y extraer
      if (downloadUrl.endsWith('.zip')) {
        await this.extractZip(tempPath, targetDir);
      } else if (downloadUrl.endsWith('.tar.gz')) {
        await this.extractTarGz(tempPath, targetDir);
      }
      
      // Eliminar archivo temporal
      fs.unlinkSync(tempPath);
      
      // Encontrar la ruta del binario java
      const javaPath = this.findJavaBinary(targetDir, version);
      
      // Actualizar configuración
      const javaInfo = {
        id: `installed_java${version}`,
        path: javaPath,
        version: version,
        isWorking: true,
        source: 'installed',
        downloadDate: new Date().toISOString()
      };
      
      this.installedJavas.push(javaInfo);
      this.config.installedJavas = this.installedJavas;
      this.saveConfig();
      
      return javaInfo;
    } catch (e) {
      throw new Error(`Error installing Java ${version}: ${e.message}`);
    }
  }

  // Extraer archivo ZIP
  async extractZip(zipPath, targetDir) {
    return new Promise((resolve, reject) => {
      const extractor = new Extract({ path: targetDir });
      const readStream = createReadStream(zipPath);
      
      readStream.pipe(extractor);
      
      extractor.on('close', resolve);
      extractor.on('error', reject);
    });
  }

  // Extraer archivo TAR.GZ
  async extractTarGz(tarPath, targetDir) {
    return tar.extract({
      file: tarPath,
      cwd: targetDir,
      gzip: true
    });
  }

  // Encontrar binario java en carpeta extraída
  findJavaBinary(extractedDir, version) {
    const searchPaths = [
      path.join(extractedDir, 'bin', 'java.exe'), // Windows
      path.join(extractedDir, 'bin', 'java'),     // Linux/Mac
      path.join(extractedDir, 'Contents', 'Home', 'bin', 'java') // macOS
    ];
    
    for (const searchPath of searchPaths) {
      if (fs.existsSync(searchPath)) {
        return searchPath;
      }
    }
    
    throw new Error(`Could not find java executable in ${extractedDir}`);
  }

  // Eliminar versión de Java
  removeInstalledJava(javaId) {
    const javaToRemove = this.installedJavas.find(j => j.id === javaId);
    if (javaToRemove) {
      // Eliminar directorio de la instalación
      const javaDir = path.dirname(path.dirname(javaToRemove.path)); // Subir dos niveles desde bin/java
      if (fs.existsSync(javaDir)) {
        fs.rmSync(javaDir, { recursive: true, force: true });
      }
      
      // Eliminar de la configuración
      this.installedJavas = this.installedJavas.filter(j => j.id !== javaId);
      this.config.installedJavas = this.installedJavas;
      
      // Si se eliminó el Java por defecto, resetearlo
      if (this.defaultJavaId === javaId) {
        this.defaultJavaId = null;
        this.config.defaultJavaId = null;
      }
      
      this.saveConfig();
      return true;
    }
    return false;
  }

  // Compatibilidad con versiones de Minecraft
  getMinecraftJavaCompatibility(minecraftVersion) {
    if (!minecraftVersion) return null;
    
    const versionNum = parseInt(minecraftVersion.split('.')[1] || minecraftVersion.split('.')[0]);
    
    if (versionNum < 17) {
      return {
        requiredVersion: '8',
        recommendedVersion: '8',
        note: 'Minecraft versions before 1.17 require Java 8'
      };
    } else if (versionNum >= 17 && versionNum < 21) {
      return {
        requiredVersion: '17',
        recommendedVersion: '17',
        note: 'Minecraft 1.17+ requires Java 17 or higher'
      };
    } else {
      return {
        requiredVersion: '21',
        recommendedVersion: '21',
        note: 'Latest Minecraft versions work best with Java 21'
      };
    }
  }

  // Obtener todos los entornos Java disponibles
  getAllJavas(includeGlobal = true) {
    let allJavas = [...this.installedJavas];
    
    if (includeGlobal) {
      const globalJavas = this.detectGlobalJava();
      allJavas = [...allJavas, ...globalJavas];
    }
    
    return allJavas.map(java => ({
      ...java,
      isDefault: java.id === this.defaultJavaId
    }));
  }

  // Establecer Java por defecto
  setDefaultJava(javaId) {
    this.defaultJavaId = javaId;
    this.config.defaultJavaId = javaId;
    this.saveConfig();
    return true;
  }

  // Obtener Java por defecto
  getDefaultJava() {
    const allJavas = this.getAllJavas();
    return allJavas.find(j => j.isDefault) || allJavas[0] || null;
  }
}

// Exportar como singleton
const javaService = new JavaService();
module.exports = javaService;