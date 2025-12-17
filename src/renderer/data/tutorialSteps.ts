import { TutorialStep } from '../components/TutorialOverlay';

export const homeTutorialSteps: TutorialStep[] = [
  {
    icon: '🏠',
    title: '¡Bienvenido a Home!',
    description: 'Esta es tu página principal. Aquí verás tus instancias recientes, modpacks recomendados y podrás acceder rápidamente a todas las funciones del launcher.',
    position: 'center'
  },
  {
    target: '[data-tutorial="recent-instances"]',
    icon: '🎮',
    title: 'Instancias Recientes',
    description: 'Aquí aparecerán tus instancias de Minecraft más usadas. Haz clic en "Jugar" para iniciar rápidamente.',
    position: 'bottom'
  },
  {
    target: '[data-tutorial="recommended-modpacks"]',
    icon: '📦',
    title: 'Modpacks Recomendados',
    description: 'Descubre modpacks populares de Modrinth. Haz clic en cualquiera para ver más detalles e instalarlo.',
    position: 'top'
  },
  {
    target: '[data-tutorial="sidebar"]',
    icon: '📋',
    title: 'Menú de Navegación',
    description: 'Usa este menú lateral para navegar entre las diferentes secciones del launcher.',
    position: 'right'
  }
];

export const contentTutorialSteps: TutorialStep[] = [
  {
    icon: '📦',
    title: 'Centro de Contenido',
    description: 'Aquí puedes buscar y descargar mods, modpacks, shaders, resource packs y más desde Modrinth y CurseForge.',
    position: 'center'
  },
  {
    target: '[data-tutorial="content-tabs"]',
    icon: '🏷️',
    title: 'Categorías de Contenido',
    description: 'Filtra el contenido por tipo: Mods, Modpacks, Shaders, Resource Packs, etc.',
    position: 'bottom'
  },
  {
    target: '[data-tutorial="content-platforms"]',
    icon: '🌐',
    title: 'Plataformas',
    description: 'Elige entre Modrinth y CurseForge para buscar contenido. Cada plataforma tiene su propia biblioteca de mods y modpacks.',
    position: 'right'
  },
  {
    target: '[data-tutorial="content-search"]',
    icon: '🔍',
    title: 'Búsqueda',
    description: 'Usa la barra de búsqueda para encontrar contenido específico. Puedes buscar por nombre o palabras clave.',
    position: 'right'
  },
  {
    target: '[data-tutorial="content-sort"]',
    icon: '📊',
    title: 'Ordenar Resultados',
    description: 'Ordena los resultados por popularidad, fecha o nombre para encontrar más fácilmente lo que buscas.',
    position: 'right'
  },
  {
    target: '[data-tutorial="content-actions"]',
    icon: '🎯',
    title: 'Botones de Acción',
    description: 'Usa "Detalles" para ver más información del contenido, o "Descargar" para agregarlo directamente a una instancia.',
    position: 'top'
  }
];

export const skinsTutorialSteps: TutorialStep[] = [
  {
    icon: '👤',
    title: 'Gestor de Skins',
    description: 'Esta sección te permite visualizar y gestionar tus skins de Minecraft.',
    position: 'center'
  },
  {
    icon: '🚧',
    title: 'En Desarrollo',
    description: 'Esta funcionalidad aún está en desarrollo. Pronto podrás cambiar tu skin, ver tu capa y personalizar tu personaje.',
    position: 'center'
  }
];

export const instancesTutorialSteps: TutorialStep[] = [
  {
    icon: '🎮',
    title: 'Gestión de Instancias',
    description: 'Aquí puedes ver, editar y gestionar todas tus instancias de Minecraft.',
    position: 'center'
  },
  {
    target: '[data-tutorial="create-instance-btn"]',
    icon: '➕',
    title: 'Crear Nueva Instancia',
    description: 'Usa este botón para crear una nueva instancia de Minecraft con la versión y mods que desees.',
    position: 'bottom'
  },
  {
    target: '[data-tutorial="instances-list"]',
    icon: '📋',
    title: 'Lista de Instancias',
    description: 'Cada tarjeta representa una instancia. Puedes ver la versión, loader y estado de cada una.',
    position: 'top'
  },
  {
    target: '[data-tutorial="instance-play"]',
    icon: '▶️',
    title: 'Iniciar Juego',
    description: 'Haz clic en el botón "Jugar" para iniciar Minecraft con esa instancia.',
    position: 'left'
  },
  {
    target: '[data-tutorial="instance-edit"]',
    icon: '✏️',
    title: 'Editar Instancia',
    description: 'Haz clic en el ícono de editar para cambiar configuraciones como RAM, argumentos JVM y más.',
    position: 'left'
  }
];

export const createInstanceTutorialSteps: TutorialStep[] = [
  {
    icon: '🆕',
    title: 'Crear Nueva Instancia',
    description: 'Aquí puedes crear una nueva instancia de Minecraft personalizada.',
    position: 'center'
  },
  {
    target: '[data-tutorial="instance-name"]',
    icon: '📝',
    title: 'Nombre de la Instancia',
    description: 'Dale un nombre único a tu instancia para identificarla fácilmente.',
    position: 'bottom'
  },
  {
    target: '[data-tutorial="version-select"]',
    icon: '🎯',
    title: 'Versión de Minecraft',
    description: 'Selecciona la versión de Minecraft que deseas usar.',
    position: 'bottom'
  },
  {
    target: '[data-tutorial="loader-select"]',
    icon: '⚙️',
    title: 'Mod Loader',
    description: 'Elige un mod loader como Forge, Fabric o Quilt para poder instalar mods.',
    position: 'bottom'
  }
];

export const serversTutorialSteps: TutorialStep[] = [
  {
    icon: '🌐',
    title: 'Servidores de Minecraft',
    description: 'Aquí puedes ver y conectarte a servidores de Minecraft.',
    position: 'center'
  },
  {
    target: '[data-tutorial="servers-list"]',
    icon: '📋',
    title: 'Lista de Servidores',
    description: 'Ve el estado de los servidores, jugadores conectados y versión requerida.',
    position: 'bottom'
  },
  {
    target: '[data-tutorial="add-server"]',
    icon: '➕',
    title: 'Agregar Servidor',
    description: 'Agrega nuevos servidores introduciendo su dirección IP.',
    position: 'bottom'
  }
];

export const crashAnalyzerTutorialSteps: TutorialStep[] = [
  {
    icon: '🔧',
    title: 'Analizador de Crashes',
    description: 'Esta herramienta usa IA para analizar logs de errores y ayudarte a solucionar problemas.',
    position: 'center'
  },
  {
    target: '[data-tutorial="crash-input"]',
    icon: '📋',
    title: 'Pegar Log de Error',
    description: 'Pega aquí el contenido del log de crash o error de Minecraft.',
    position: 'bottom'
  },
  {
    target: '[data-tutorial="crash-analyze"]',
    icon: '🤖',
    title: 'Analizar con IA',
    description: 'La IA analizará el log y te dará sugerencias para solucionar el problema.',
    position: 'bottom'
  }
];

export const modpackImporterTutorialSteps: TutorialStep[] = [
  {
    icon: '📥',
    title: 'Importar Modpacks',
    description: 'Importa modpacks desde archivos .mrpack (Modrinth) o .zip (CurseForge).',
    position: 'center'
  },
  {
    target: '[data-tutorial="import-dropzone"]',
    icon: '📁',
    title: 'Zona de Arrastre',
    description: 'Arrastra y suelta tu archivo de modpack aquí, o haz clic para seleccionarlo.',
    position: 'bottom'
  },
  {
    target: '[data-tutorial="import-url"]',
    icon: '🔗',
    title: 'Importar desde URL',
    description: 'También puedes pegar un enlace de Modrinth para importar directamente.',
    position: 'bottom'
  }
];

export const downloadsTutorialSteps: TutorialStep[] = [
  {
    icon: '📥',
    title: 'Centro de Descargas',
    description: 'Aquí puedes ver el progreso de todas tus descargas activas e historial.',
    position: 'center'
  },
  {
    target: '[data-tutorial="downloads-active"]',
    icon: '⏳',
    title: 'Descargas Activas',
    description: 'Ve el progreso en tiempo real de las descargas en curso.',
    position: 'bottom'
  },
  {
    target: '[data-tutorial="downloads-history"]',
    icon: '📜',
    title: 'Historial',
    description: 'Revisa el historial de descargas completadas.',
    position: 'bottom'
  }
];
