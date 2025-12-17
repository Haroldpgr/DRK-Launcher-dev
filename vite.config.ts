import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'

// Configuración para resolver módulos de Node.js correctamente
export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        entry: 'src/main/main.ts'
      },
      preload: {
        input: {
          preload: 'src/main/preload.ts'
        }
      }
    }),
    renderer()
  ],
  server: {
    port: 5173
  },
  build: {
    chunkSizeWarningLimit: 500, // Mantener el límite estándar de 500KB
    sourcemap: false, // Desactivar sourcemaps en producción para reducir tamaño
    minify: 'esbuild', // Usar esbuild (más rápido y viene incluido)
    rollupOptions: {
      // NO externalizar estos módulos para el renderer - deben ser polyfills
      // external: ['path', 'fs', 'os', 'stream', 'crypto', 'child_process', 'util', 'net', 'tls', 'zlib'],
      output: {
        // Code splitting manual mejorado para optimizar el tamaño de los chunks
        manualChunks: (id) => {
          // Separar Three.js en su propio chunk (librería muy grande ~500KB+)
          if (id.includes('node_modules/three')) {
            return 'three';
          }
          
          // Separar skinview3d en su propio chunk
          if (id.includes('node_modules/skinview3d') || id.includes('node_modules/react-skinview3d')) {
            return 'skinview3d';
          }
          
          // Separar React y React-DOM en su propio chunk
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          
          // Separar React Router en su propio chunk
          if (id.includes('node_modules/react-router')) {
            return 'react-router';
          }
          
          // Separar Framer Motion en su propio chunk (librería grande)
          if (id.includes('node_modules/framer-motion')) {
            return 'framer-motion';
          }
          
          // Separar librerías de archivos/compresión
          if (id.includes('node_modules/archiver') || 
              id.includes('node_modules/tar') || 
              id.includes('node_modules/unzip-stream') ||
              id.includes('node_modules/node-stream-zip')) {
            return 'archive-vendor';
          }
          
          // Separar node-fetch en su propio chunk
          if (id.includes('node_modules/node-fetch')) {
            return 'fetch-vendor';
          }
          
          // Separar otras librerías grandes de node_modules
          if (id.includes('node_modules')) {
            // Agrupar librerías de UI pequeñas
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            // Agrupar el resto de vendor en chunks más pequeños
            return 'vendor';
          }
        }
      }
    }
  },
  define: {
    global: 'globalThis'
  },
  resolve: {
    alias: {
      // Asegurar que los módulos de Node.js se resuelvan adecuadamente
      // En el renderer, estos módulos deben ser polyfills o vacíos
      'path': 'path-browserify',
      'fs': path.resolve(__dirname, 'src/utils/empty-module.js'),
      'os': path.resolve(__dirname, 'src/utils/os-polyfill.ts'),
      'stream': 'stream-browserify',
      'crypto': 'crypto-browserify',
      // También manejar imports de node:os
      'node:os': path.resolve(__dirname, 'src/utils/os-polyfill.ts'),
      'node:path': 'path-browserify',
      'node:fs': path.resolve(__dirname, 'src/utils/empty-module.js')
    }
  },
  optimizeDeps: {
    include: ['path-browserify', 'os-browserify', 'stream-browserify', 'crypto-browserify'],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  ssr: {
    noExternal: ['os-browserify', 'path-browserify', 'stream-browserify', 'crypto-browserify']
  }
})

