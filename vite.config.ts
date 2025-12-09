import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

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
    rollupOptions: {
      external: ['path', 'fs', 'os', 'stream', 'crypto', 'child_process', 'util', 'net', 'tls', 'zlib'],
      output: {
        globals: {
          path: 'require("path")',
          fs: 'require("fs")',
          os: 'require("os")',
          stream: 'require("stream")',
          crypto: 'require("crypto")',
          child_process: 'require("child_process")',
          util: 'require("util")',
          net: 'require("net")',
          tls: 'require("tls")',
          zlib: 'require("zlib")'
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
      path: 'path-browserify',
      fs: 'empty-module',
      os: 'os-browserify/browser',
      stream: 'stream-browserify',
      crypto: 'crypto-browserify'
    }
  },
  optimizeDeps: {
    include: ['path-browserify', 'os-browserify', 'stream-browserify', 'crypto-browserify']
  }
})

