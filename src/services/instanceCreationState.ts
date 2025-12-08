/**
 * Estados posibles durante la creación de una instancia
 */
export enum InstanceCreationStatus {
  PENDING = 'pending',
  DOWNLOADING_JRE = 'downloading_jre',
  CREATING_STRUCTURE = 'creating_structure',
  DOWNLOADING_VERSION_METADATA = 'downloading_version_metadata',
  DOWNLOADING_LIBRARIES = 'downloading_libraries',
  DOWNLOADING_CLIENT = 'downloading_client',
  DOWNLOADING_ASSETS = 'downloading_assets',
  INSTALLING_LOADER = 'installing_loader',
  VERIFYING_INTEGRITY = 'verifying_integrity',
  COMPLETED = 'completed',
  ERROR = 'error',
  CANCELLED = 'cancelled'
}

/**
 * Progreso de la creación de instancia
 */
export interface InstanceCreationProgress {
  status: InstanceCreationStatus;
  progress: number; // 0-1
  step: string; // Descripción del paso actual
  totalSteps: number;
  currentStep: number;
  details?: string; // Información adicional sobre el estado actual
  error?: string; // Mensaje de error si status es ERROR
}

/**
 * Configuración para la creación de instancias
 */
export interface InstanceCreationConfig {
  name: string;
  version: string;
  loader?: 'vanilla' | 'forge' | 'fabric' | 'quilt' | 'neoforge';
  loaderVersion?: string;
  javaVersion?: string;
  maxMemory?: number;
  minMemory?: number;
  jvmArgs?: string[];
  instancePath?: string; // Ruta personalizada, si no se usará la predeterminada
}