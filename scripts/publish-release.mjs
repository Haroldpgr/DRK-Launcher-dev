// Script para publicar automáticamente en GitHub Releases
import { readFileSync, existsSync, writeFileSync, unlinkSync, statSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Leer package.json para obtener la versión
const packageJson = JSON.parse(readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
const version = packageJson.version;

// Leer CHANGELOG.md para obtener las release notes
let releaseNotes = '';
const changelogPath = path.join(rootDir, 'CHANGELOG.md');
if (existsSync(changelogPath)) {
  const changelog = readFileSync(changelogPath, 'utf-8');
  
  // Buscar la sección de la versión actual
  const versionRegex = new RegExp(`## \\[${version.replace(/\./g, '\\.')}\\][\\s\\S]*?(?=##|$)`);
  const match = changelog.match(versionRegex);
  
  if (match) {
    releaseNotes = match[0]
      .replace(/## \[.*?\] - .*?\n\n/, '') // Remover header de versión
      .trim();
  } else {
    // Si no encuentra la versión específica, usar la sección "Sin Publicar"
    const sinPublicarMatch = changelog.match(/## \[Sin Publicar\][\s\S]*?(?=##|$)/);
    if (sinPublicarMatch) {
      releaseNotes = sinPublicarMatch[0]
        .replace(/## \[Sin Publicar\]\n\n/, '')
        .trim();
    }
  }
}

if (!releaseNotes) {
  releaseNotes = `## 🎉 Nueva Versión ${version}\n\nMejoras y correcciones generales.`;
}

console.log(`📦 Publicando versión ${version} en GitHub Releases...`);
console.log(`📝 Release Notes:\n${releaseNotes.substring(0, 200)}...\n`);

// Configurar token de GitHub
const tokenPath = path.join(rootDir, '.github', 'token.encrypted');
let githubToken = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

if (!githubToken && existsSync(tokenPath)) {
  // Intentar desencriptar el token
  try {
    // Leer token encriptado
    const encryptedToken = readFileSync(tokenPath, 'utf-8').trim();
    
    // Desencriptar usando la misma lógica que tokenEncryption.ts
    const algorithm = 'aes-256-cbc';
    const parts = encryptedToken.split(':');
    if (parts.length === 2) {
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = Buffer.from(parts[1], 'hex');
      
      // Derivar clave del sistema (misma lógica que en tokenEncryption.ts)
      const systemInfo = `${os.platform()}-${os.arch()}-${process.env.USERNAME || process.env.USER || 'default'}`;
      const key = crypto.createHash('sha256').update(systemInfo).digest();
      
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      githubToken = decrypted;
    }
  } catch (error) {
    console.warn('⚠️  No se pudo desencriptar el token. Usa la variable de entorno GH_TOKEN o GITHUB_TOKEN.');
    console.warn('   Error:', error.message);
  }
}

if (!githubToken) {
  console.error('❌ Error: No se encontró el token de GitHub.');
  console.error('   Configura la variable de entorno GH_TOKEN o GITHUB_TOKEN');
  console.error('   Ejemplo: $env:GH_TOKEN="tu_token_aqui" (PowerShell)');
  process.exit(1);
}

// Configurar variable de entorno para electron-builder
process.env.GH_TOKEN = githubToken;
process.env.GITHUB_TOKEN = githubToken;

// Ejecutar electron-builder con publicación automática
try {
  console.log('🚀 Iniciando build y publicación...');
  
  // Configurar variables de entorno
  const env = {
    ...process.env,
    GH_TOKEN: githubToken,
    GITHUB_TOKEN: githubToken
  };
  
  // Primero hacer el build completo del launcher
  console.log('🔨 Compilando launcher...');
  execSync('npm run build', { 
    stdio: 'inherit',
    cwd: rootDir,
    env: env
  });
  
  // Generar el paquete completo del launcher (esto crea release/win-unpacked)
  console.log('📦 Generando paquete del launcher...');
  execSync('npx electron-builder', {
    stdio: 'inherit',
    cwd: rootDir,
    env: env
  });
  
  // Verificar que se generó release/win-unpacked
  const launcherUnpackedPath = path.join(rootDir, 'release', 'win-unpacked');
  if (!existsSync(launcherUnpackedPath)) {
    console.error('❌ Error: No se generó release/win-unpacked después del build');
    console.error('   El instalador no se puede actualizar sin esta carpeta.');
    process.exit(1);
  }
  console.log('✅ Paquete del launcher generado correctamente');
  
  // Crear tag de Git antes de publicar (si no existe)
  const tagName = `v${version}`;
  try {
    // Verificar si el tag ya existe
    execSync(`git rev-parse -q --verify "refs/tags/${tagName}"`, {
      stdio: 'ignore',
      cwd: rootDir
    });
    console.log(`📌 Tag ${tagName} ya existe, usando el existente...`);
  } catch {
    // El tag no existe, crearlo
    console.log(`📌 Creando tag ${tagName}...`);
    try {
      execSync(`git tag -a ${tagName} -m "Release ${tagName}"`, {
        stdio: 'inherit',
        cwd: rootDir,
        env: env
      });
      console.log(`✅ Tag ${tagName} creado localmente`);
      
      // Intentar hacer push del tag (opcional, electron-builder también lo hace)
      try {
        execSync(`git push origin ${tagName}`, {
          stdio: 'inherit',
          cwd: rootDir,
          env: env
        });
        console.log(`✅ Tag ${tagName} enviado a GitHub`);
      } catch (pushError) {
        console.warn(`⚠️  No se pudo enviar el tag (puede que electron-builder lo haga):`, pushError.message);
      }
    } catch (tagError) {
      console.warn(`⚠️  No se pudo crear el tag localmente:`, tagError.message);
      console.warn(`   electron-builder intentará crearlo automáticamente`);
    }
  }
  
  // Luego publicar con electron-builder (ya tiene el paquete generado, solo publica)
  console.log('📤 Publicando en GitHub Releases...');
  
  // Publicar con electron-builder
  // --publish always: publica siempre, incluso si ya existe
  // releaseType: "release" en package.json asegura que no sea draft
  execSync('npx electron-builder --publish always', {
    stdio: 'inherit',
    cwd: rootDir,
    env: env
  });
  
  console.log(`\n✅ Versión ${version} publicada exitosamente en GitHub Releases!`);
  console.log(`🔗 Ver en: https://github.com/Haroldpgr/DRK-Launcher-dev/releases/tag/v${version}`);
  console.log(`\n💡 Verifica que el release esté marcado como "Latest release" en GitHub`);
  console.log(`   Si no lo está, márcalo manualmente en la página del release`);
  
  // Actualizar el instalador automáticamente con el launcher recién compilado
  console.log(`\n🔧 Actualizando instalador con las nuevas mejoras del launcher...`);
  const installerDir = path.join(rootDir, 'Instalador');
  
  // La carpeta ya fue verificada antes, así que debería existir
  if (!existsSync(launcherUnpackedPath)) {
    console.error(`❌ Error: La carpeta ${launcherUnpackedPath} no existe`);
    console.error(`   Esto no debería pasar. El instalador no se actualizará.`);
    process.exit(1);
  } else if (!existsSync(installerDir)) {
    console.warn(`⚠️  No se encontró la carpeta del instalador: ${installerDir}`);
  } else {
    try {
      // Verificar archivos críticos del launcher antes de empaquetar
      console.log(`🔍 Verificando archivos críticos del launcher...`);
      const criticalFiles = [
        path.join(launcherUnpackedPath, 'resources', 'app.asar'),
        path.join(launcherUnpackedPath, 'resources', 'app-update.yml'),
        path.join(launcherUnpackedPath, 'resources', 'elevate.exe'),
        path.join(launcherUnpackedPath, 'DRK Launcher.exe')
      ];
      
      let allFilesExist = true;
      for (const file of criticalFiles) {
        if (existsSync(file)) {
          console.log(`   ✅ ${path.basename(file)}`);
        } else {
          console.warn(`   ⚠️  ${path.basename(file)} no encontrado`);
          allFilesExist = false;
        }
      }
      
      if (!allFilesExist) {
        console.warn(`⚠️  Algunos archivos críticos no se encontraron, pero continuando...`);
      }
      
      console.log(`📦 Generando instalador actualizado con todas las mejoras...`);
      
      // Limpiar dist anterior del instalador si existe
      const installerDistPath = path.join(installerDir, 'dist');
      if (existsSync(installerDistPath)) {
        try {
          execSync(`Remove-Item -Path "${installerDistPath}\\*" -Recurse -Force -ErrorAction SilentlyContinue`, {
            shell: 'powershell.exe',
            stdio: 'ignore',
            cwd: installerDir
          });
          console.log(`   🧹 Carpeta dist limpiada`);
        } catch (cleanError) {
          // Ignorar errores de limpieza
        }
      }
      
      // Generar el instalador (esto empaquetará release/win-unpacked en el instalador)
      execSync('npm run dist', {
        stdio: 'inherit',
        cwd: installerDir,
        env: env
      });
      
      // Verificar que se generó el instalador
      const installerExePath = path.join(installerDir, 'dist', 'DRK Launcher Installer 1.0.0.exe');
      if (existsSync(installerExePath)) {
        const stats = statSync(installerExePath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`\n✅ Instalador actualizado exitosamente!`);
        console.log(`📁 Ubicación: ${installerExePath}`);
        console.log(`📊 Tamaño: ${sizeMB} MB`);
        console.log(`✨ Incluye todas las mejoras de la versión ${version}`);
      } else {
        console.warn(`⚠️  El instalador no se encontró en la ubicación esperada`);
      }
    } catch (installerError) {
      console.error(`\n❌ Error al actualizar el instalador:`, installerError.message);
      console.error(`   Puedes actualizarlo manualmente ejecutando: cd Instalador && npm run dist`);
      // No salir con error, ya que el launcher se publicó correctamente
    }
  }
} catch (error) {
  console.error('❌ Error al publicar:', error.message);
  process.exit(1);
}

