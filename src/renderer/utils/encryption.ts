/**
 * Utilidades de encriptación simple para datos sensibles
 * Usa una encriptación básica basada en XOR y Base64 para el renderer
 */

const ENCRYPTION_KEY = 'drk-launcher-encryption-key-2024'; // Clave de encriptación

/**
 * Encripta un string usando XOR y Base64
 */
export function encrypt(text: string): string {
  if (!text) return '';
  
  try {
    let encrypted = '';
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      encrypted += String.fromCharCode(charCode);
    }
    // Codificar en Base64
    return btoa(encrypted);
  } catch (error) {
    console.error('[Encryption] Error al encriptar:', error);
    return text; // Devolver texto sin encriptar si hay error
  }
}

/**
 * Desencripta un string encriptado
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';
  
  try {
    // Decodificar desde Base64
    const decoded = atob(encryptedText);
    let decrypted = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      decrypted += String.fromCharCode(charCode);
    }
    return decrypted;
  } catch (error) {
    console.error('[Encryption] Error al desencriptar:', error);
    // Si falla la desencriptación, asumir que el texto no estaba encriptado
    return encryptedText;
  }
}

/**
 * Verifica si un string está encriptado (intenta desencriptarlo)
 */
export function isEncrypted(text: string): boolean {
  if (!text) return false;
  
  try {
    // Intentar decodificar Base64
    const decoded = atob(text);
    // Si se puede decodificar y tiene caracteres válidos, probablemente está encriptado
    return decoded.length > 0 && /^[\x00-\xFF]*$/.test(decoded);
  } catch {
    return false;
  }
}

