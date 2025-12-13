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
    const baseArgs = [
      `-Xms${minMem}M`,
      `-Xmx${ramMb}M`,
      '-XX:+UseG1GC',
      '-XX:+UnlockExperimentalVMOptions',
      '-XX:MaxGCPauseMillis=100',
      '-XX:+DisableExplicitGC',
      '-XX:+AlwaysPreTouch',
      '-XX:+ParallelRefProcEnabled',
    ];

    // Parámetros específicos por SO
    const osSpecificArgs: string[] = [];
    if (os === 'win32') {
      osSpecificArgs.push(
        '-XX:+UseStringDeduplication',
        '-Djava.awt.headless=false'
      );
    } else if (os === 'darwin') {
      osSpecificArgs.push(
        '-XstartOnFirstThread',
        '-Djava.awt.headless=false'
      );
    } else {
      // Linux
      osSpecificArgs.push(
        '-XX:+UseStringDeduplication'
      );
    }

    // Parámetros específicos por loader
    const loaderSpecificArgs: string[] = [];
    
    switch (loader) {
      case 'vanilla':
        loaderSpecificArgs.push(
          '-XX:TargetSurvivorRatio=90',
          '-XX:G1NewSizePercent=50',
          '-XX:G1MaxNewSizePercent=80',
          '-XX:G1MixedGCLiveThresholdPercent=35'
        );
        break;
        
      case 'fabric':
      case 'quilt':
        loaderSpecificArgs.push(
          '-XX:TargetSurvivorRatio=90',
          '-XX:G1NewSizePercent=40',
          '-XX:G1MaxNewSizePercent=70',
          '-XX:G1MixedGCLiveThresholdPercent=30',
          '-Dfabric.dli.config=',
          '-Dfabric.dli.main=net.fabricmc.loader.impl.launch.knot.KnotClient'
        );
        break;
        
      case 'forge':
      case 'neoforge':
        loaderSpecificArgs.push(
          '-XX:TargetSurvivorRatio=85',
          '-XX:G1NewSizePercent=30',
          '-XX:G1MaxNewSizePercent=60',
          '-XX:G1MixedGCLiveThresholdPercent=25',
          '-Dforge.logging.console.level=info',
          '-Dfml.earlyprogresswindow=false',
          '--add-opens', 'java.base/java.util.jar=cpw.mods.securejarhandler',
          '--add-opens', 'java.base/java.lang.invoke=cpw.mods.securejarhandler',
          '--add-opens', 'java.base/java.lang.reflect=cpw.mods.securejarhandler',
          '--add-opens', 'java.base/java.text=cpw.mods.securejarhandler',
          '--add-opens', 'java.base/java.util=cpw.mods.securejarhandler',
          '--add-opens', 'java.base/java.util.concurrent=cpw.mods.securejarhandler',
          '--add-opens', 'java.base/java.util.concurrent.atomic=cpw.mods.securejarhandler',
          '--add-opens', 'java.base/java.util.jar=cpw.mods.securejarhandler',
          '--add-opens', 'java.base/java.util.regex=cpw.mods.securejarhandler',
          '--add-opens', 'java.base/java.util.zip=cpw.mods.securejarhandler'
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

