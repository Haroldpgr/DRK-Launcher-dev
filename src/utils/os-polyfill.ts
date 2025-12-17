// Polyfill para el módulo 'os' que funciona en el renderer de Electron
// En Electron, process.platform está disponible en el renderer

export function platform(): string {
  if (typeof process !== 'undefined' && process.platform) {
    return process.platform;
  }
  
  // Fallback para navegadores
  if (typeof navigator !== 'undefined') {
    const platformStr = navigator.platform || navigator.userAgent || '';
    if (platformStr.includes('Win')) return 'win32';
    if (platformStr.includes('Mac')) return 'darwin';
    if (platformStr.includes('Linux')) return 'linux';
  }
  
  return 'win32'; // Default
}

export function arch(): string {
  if (typeof process !== 'undefined' && process.arch) {
    return process.arch;
  }
  return 'x64'; // Default
}

export function homedir(): string {
  if (typeof process !== 'undefined' && process.env && process.env.HOME) {
    return process.env.HOME;
  }
  if (typeof process !== 'undefined' && process.env && process.env.USERPROFILE) {
    return process.env.USERPROFILE;
  }
  return '/';
}

export function tmpdir(): string {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.TMPDIR || process.env.TMP || process.env.TEMP || '/tmp';
  }
  return '/tmp';
}

export const EOL = '\n';

// Exportar un objeto similar al módulo 'os' de Node.js
export default {
  platform,
  arch,
  homedir,
  tmpdir,
  EOL,
  endianness: () => 'LE',
  hostname: () => typeof location !== 'undefined' ? location.hostname : '',
  loadavg: () => [],
  uptime: () => 0,
  freemem: () => Number.MAX_VALUE,
  totalmem: () => Number.MAX_VALUE,
  cpus: () => [],
  type: () => 'Browser',
  release: () => typeof navigator !== 'undefined' ? navigator.appVersion : '',
  networkInterfaces: () => ({}),
  getNetworkInterfaces: () => ({})
};

