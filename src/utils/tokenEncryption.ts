// ============================================
// ENCRIPTACIÓN DE TOKEN DE GITHUB
// Encripta y desencripta el token de forma segura
// ============================================

import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

/**
 * Genera una clave de encriptación basada en información del sistema
 */
function generateKey(): Buffer {
  // Usar información del sistema para generar una clave única
  const systemInfo = `${process.platform}-${process.arch}-${process.env.USERNAME || process.env.USER || 'default'}`;
  return crypto.createHash('sha256').update(systemInfo).digest();
}

/**
 * Encripta el token de GitHub
 */
export function encryptToken(token: string): string {
  try {
    const key = generateKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Combinar IV y texto encriptado
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('[TokenEncryption] Error al encriptar:', error);
    throw error;
  }
}

/**
 * Desencripta el token de GitHub
 */
export function decryptToken(encryptedToken: string): string {
  try {
    const key = generateKey();
    const parts = encryptedToken.split(':');
    
    if (parts.length !== 2) {
      throw new Error('Formato de token encriptado inválido');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('[TokenEncryption] Error al desencriptar:', error);
    throw error;
  }
}

/**
 * Guarda el token encriptado en un archivo
 */
export function saveToken(token: string, filePath: string): void {
  try {
    const fs = require('fs');
    const path = require('path');
    const encrypted = encryptToken(token);
    const dir = path.dirname(filePath);
    
    // Crear directorio si no existe
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Guardar token encriptado
    fs.writeFileSync(filePath, encrypted, 'utf8');
    console.log('[TokenEncryption] Token guardado encriptado en:', filePath);
  } catch (error) {
    console.error('[TokenEncryption] Error al guardar token:', error);
    throw error;
  }
}

/**
 * Lee y desencripta el token desde un archivo
 */
export function loadToken(filePath: string): string | null {
  try {
    const fs = require('fs');
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const encrypted = fs.readFileSync(filePath, 'utf8');
    return decryptToken(encrypted);
  } catch (error) {
    console.error('[TokenEncryption] Error al cargar token:', error);
    return null;
  }
}

