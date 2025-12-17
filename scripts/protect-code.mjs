/**
 * Script para proteger el código compilado usando Bytenode
 * Compila JavaScript a bytecode V8 (ilegible y más rápido)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bytenode from 'bytenode';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

async function compileToBytenode(filePath) {
  try {
    await bytenode.compileFile(filePath);
    // Eliminar el archivo .js original y dejar solo el .jsc
    fs.unlinkSync(filePath);
    console.log(`✓ Compilado: ${path.basename(filePath)} → .jsc`);
  } catch (error) {
    console.error(`✗ Error en ${filePath}:`, error.message);
  }
}

async function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      await processDirectory(fullPath);
    } else if (file.endsWith('.js') && !file.includes('.map')) {
      await compileToBytenode(fullPath);
    }
  }
}

console.log('🔒 Compilando a bytecode V8...\n');

// Compilar main.js y preload.js
const mainDir = path.join(rootDir, 'dist-electron');
if (fs.existsSync(mainDir)) {
  console.log('Procesando dist-electron/');
  const mainJs = path.join(mainDir, 'main.js');
  const preloadJs = path.join(mainDir, 'preload.js');
  
  if (fs.existsSync(mainJs)) await compileToBytenode(mainJs);
  if (fs.existsSync(preloadJs)) await compileToBytenode(preloadJs);
}

console.log('\n✅ Código compilado a bytecode');
