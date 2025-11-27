import { spawn } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'

export type LaunchOptions = {
  javaPath: string
  mcVersion: string
  instancePath: string
  ramMb?: number
  jvmArgs?: string[]
}

// Verificar si una instancia está completamente descargada y lista para jugar
export function isInstanceReady(instancePath: string): boolean {
  try {
    // Verificar que exista el archivo client.jar principal
    const clientJarPath = path.join(instancePath, 'client.jar');
    if (!fs.existsSync(clientJarPath)) {
      console.log(`client.jar no encontrado en ${clientJarPath}`);
      return false;
    }

    // Si llega aquí, se considera que hay los archivos básicos necesarios
    return true;
  } catch (error) {
    console.error('Error al verificar si la instancia está lista:', error);
    return false;
  }
}

export function buildArgs(opts: LaunchOptions) {
  const mem = Math.max(512, opts.ramMb || 2048)
  const args = [
    `-Xms${mem}m`,
    `-Xmx${mem}m`,
    ...(opts.jvmArgs || []),
    '-jar',
    path.join(opts.instancePath, 'client.jar'),
    '--version', opts.mcVersion
  ]
  return args
}

export function launchJava(opts: LaunchOptions, onData: (chunk: string) => void, onExit: (code: number | null) => void) {
  const args = buildArgs(opts)
  const child = spawn(opts.javaPath || 'java', args, { cwd: opts.instancePath })
  child.stdout.on('data', d => onData(d.toString()))
  child.stderr.on('data', d => onData(d.toString()))
  child.on('close', c => onExit(c))
  return child
}

