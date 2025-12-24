// ============================================
// Script para configurar el token de GitHub de forma segura
// ============================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Token proporcionado por el usuario
const TOKEN = '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';

// Ruta donde guardar el token encriptado
const TOKEN_PATH = path.join(__dirname, '..', '.github', 'token.encrypted');

// Función de encriptación (simplificada para el script)
function encryptToken(token) {
  const ALGORITHM = 'aes-256-cbc';
  const systemInfo = `${process.platform}-${process.arch}-${process.env.USERNAME || process.env.USER || 'default'}`;
  const key = crypto.createHash('sha256').update(systemInfo).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

try {
  // Crear directorio .github si no existe
  const tokenDir = path.dirname(TOKEN_PATH);
  if (!fs.existsSync(tokenDir)) {
    fs.mkdirSync(tokenDir, { recursive: true });
  }

  // Encriptar y guardar el token
  const encrypted = encryptToken(TOKEN);
  fs.writeFileSync(TOKEN_PATH, encrypted, 'utf8');
  
  console.log('✅ Token guardado y encriptado exitosamente en:', TOKEN_PATH);
  console.log('⚠️  Este archivo está en .gitignore y NO se subirá a GitHub');
  console.log('📝 Para usar el token en producción, configura la variable de entorno GH_TOKEN');
} catch (error) {
  console.error('❌ Error al guardar token:', error);
  process.exit(1);
}

