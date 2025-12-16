import { platform } from 'os';

/**
 * Servicio para obtener parámetros Java estándar optimizados por loader y sistema operativo
 */
export class JavaConfigService {
  /**
   * Obtiene los parámetros JVM estándar para un loader específico
   */
  static getStandardJvmArgs(
    loader: 'vanilla' | 'fabric' | 'forge' | 'quilt' | 'neoforge',
    ramMb: number
  ): string[] {
    const minMem = Math.max(512, Math.floor(ramMb / 4));
    const os = platform();
    
    // Parámetros base comunes para todos los loaders
    // Basados en flags optimizadas para Minecraft con mods
    // IMPORTANTE: TieredStopAtLevel=1 fue eliminado porque reduce el JIT y empeora el CodeCache con mods
    const baseArgs = [
      // CRÍTICO: Desbloquear opciones experimentales PRIMERO (debe estar antes de cualquier opción experimental)
      '-XX:+UnlockExperimentalVMOptions',
      
      // Memoria
      `-Xms${minMem}M`,
      `-Xmx${ramMb}M`,
      
      // Garbage Collector optimizado (G1GC)
      // NOTA: Algunas opciones de G1GC son experimentales y requieren UnlockExperimentalVMOptions
      '-XX:+UseG1GC',
      '-XX:MaxGCPauseMillis=120',
      '-XX:G1HeapRegionSize=8M',
      '-XX:G1NewSizePercent=30',
      '-XX:G1MaxNewSizePercent=40',
      '-XX:G1ReservePercent=20',
      '-XX:G1HeapWastePercent=5',
      '-XX:G1MixedGCCountTarget=4',
      '-XX:InitiatingHeapOccupancyPercent=15',
      '-XX:G1MixedGCLiveThresholdPercent=90',
      '-XX:G1RSetUpdatingPauseTimePercent=5',
      
      // CodeCache aumentado (OBLIGATORIO para mods)
      '-XX:ReservedCodeCacheSize=768M',
      '-XX:InitialCodeCacheSize=128M',
      
      // Optimizaciones de memoria
      '-XX:+ParallelRefProcEnabled',
      '-XX:+DisableExplicitGC',
      '-XX:+AlwaysPreTouch',
      '-XX:+UseStringDeduplication',
      '-XX:+UseCompressedOops',
      '-XX:+UseCompressedClassPointers',
      '-XX:+PerfDisableSharedMem',
      
      // Optimizaciones de red y I/O
      '-Djava.net.preferIPv4Stack=true',
      '-Dfile.encoding=UTF-8',
      
      // Optimizaciones de renderizado
      '-Dfml.ignoreInvalidMinecraftCertificates=true',
      '-Dfml.ignorePatchDiscrepancies=true',
    ];

    // Parámetros específicos por SO
    const osSpecificArgs: string[] = [];
    if (os === 'win32') {
      osSpecificArgs.push(
        '-Djava.awt.headless=false'
        // Nota: UseLargePages y UseTransparentHugePages no están disponibles
        // en todas las versiones de Java en Windows y pueden causar errores
      );
    } else if (os === 'darwin') {
      osSpecificArgs.push(
        '-XstartOnFirstThread',
        '-Djava.awt.headless=false'
      );
    } else {
      // Linux - Optimizaciones específicas (solo si están disponibles)
      // UseLargePages y UseTransparentHugePages pueden no estar disponibles en todas las JVM
      // Se omiten para evitar errores de "Unrecognized VM option"
    }

    // Parámetros específicos por loader
    const loaderSpecificArgs: string[] = [];
    
    switch (loader) {
      case 'vanilla':
        loaderSpecificArgs.push(
          // Optimizaciones específicas para Vanilla
          '-XX:TargetSurvivorRatio=90'
        );
        break;
        
      case 'fabric':
      case 'quilt':
        loaderSpecificArgs.push(
          // Optimizaciones específicas para Fabric/Quilt
          '-XX:TargetSurvivorRatio=90',
          '-Dfabric.dli.config=',
          '-Dfabric.dli.main=net.fabricmc.loader.impl.launch.knot.KnotClient',
          // Optimizaciones adicionales para mods
          '-Dfabric.log.disableAnsi=false',
          '-Dfabric.log.level=INFO'
        );
        break;
        
      case 'forge':
      case 'neoforge':
        loaderSpecificArgs.push(
          // Optimizaciones específicas para Forge/NeoForge
          '-XX:TargetSurvivorRatio=85',
          '-Dforge.logging.console.level=info',
          '-Dfml.earlyprogresswindow=false',
          // Módulos necesarios para Forge/NeoForge (usar ALL-UNNAMED para evitar warnings si los módulos no están disponibles)
          '--add-opens', 'java.base/java.util.jar=ALL-UNNAMED',
          '--add-opens', 'java.base/java.lang.invoke=ALL-UNNAMED',
          '--add-opens', 'java.base/java.lang.reflect=ALL-UNNAMED',
          '--add-opens', 'java.base/java.text=ALL-UNNAMED',
          '--add-opens', 'java.base/java.util=ALL-UNNAMED',
          '--add-opens', 'java.base/java.util.concurrent=ALL-UNNAMED',
          '--add-opens', 'java.base/java.util.concurrent.atomic=ALL-UNNAMED',
          '--add-opens', 'java.base/java.util.regex=ALL-UNNAMED',
          '--add-opens', 'java.base/java.util.zip=ALL-UNNAMED'
        );
        break;
    }

    return [...baseArgs, ...osSpecificArgs, ...loaderSpecificArgs];
  }

  /**
   * Obtiene la versión de Java recomendada para un loader
   */
  static getRecommendedJavaVersion(
    loader: 'vanilla' | 'fabric' | 'forge' | 'quilt' | 'neoforge',
    mcVersion: string
  ): string {
    // Determinar versión de MC
    const majorVersion = parseInt(mcVersion.split('.')[1] || '0');
    
    if (loader === 'vanilla') {
      if (majorVersion >= 17) return '17';
      if (majorVersion >= 8) return '8';
      return '8';
    }
    
    if (loader === 'fabric' || loader === 'quilt') {
      if (majorVersion >= 21) return '21';
      if (majorVersion >= 17) return '17';
      return '17';
    }
    
    if (loader === 'forge' || loader === 'neoforge') {
      if (majorVersion >= 21) return '21';
      if (majorVersion >= 17) return '17';
      return '17';
    }
    
    return '17'; // Por defecto
  }

  /**
   * Obtiene la memoria recomendada para un loader
   */
  static getRecommendedMemory(
    loader: 'vanilla' | 'fabric' | 'forge' | 'quilt' | 'neoforge',
    totalSystemMemory: number
  ): { min: number; max: number } {
    const maxMem = Math.min(
      totalSystemMemory,
      loader === 'vanilla' ? 4096 : 
      loader === 'fabric' || loader === 'quilt' ? 6144 :
      8192 // Forge/NeoForge
    );
    
    const minMem = Math.max(1024, Math.floor(maxMem / 4));
    
    return { min: minMem, max: maxMem };
  }
}

