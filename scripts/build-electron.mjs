import { build } from 'esbuild'
import { rmSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

const outDir = 'build-electron'
rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

const isProduction = process.env.NODE_ENV === 'production' || !process.env.NODE_ENV

await build({
  entryPoints: ['src/main/main.ts'],
  outfile: join(outDir, 'main.cjs'),
  platform: 'node',
  format: 'cjs',
  bundle: true,
  sourcemap: !isProduction,
  minify: isProduction,
  external: ['electron', 'electron-updater', '@electron/remote']
})

await build({
  entryPoints: ['src/main/preload.ts'],
  outfile: join(outDir, 'preload.cjs'),
  platform: 'node',
  format: 'cjs',
  bundle: true,
  sourcemap: !isProduction,
  minify: isProduction,
  external: ['electron']
})

console.log('Built Electron main/preload to dist-electron')
