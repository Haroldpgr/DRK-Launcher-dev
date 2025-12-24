// src/renderer/services/themeService.ts
import { Settings } from './settingsService';

class ThemeService {
  private settings: Settings['appearance'];

  constructor() {
    this.settings = {
      theme: 'dark',
      accentColor: '#3B82F6',
      advancedRendering: false,
      globalFontSize: 1.0,
      enableTransitions: true,
      backgroundOpacity: 0.3,
      borderRadius: 8,
      colorFilter: 'none'
    };
  }

  initializeTheme(settings: Settings['appearance']) {
    this.settings = settings;
    this.applyTheme();
  }

  applyTheme() {
    const root = document.documentElement;
    
    // 1. Aplica la clase del tema (dark, light, oled, system)
    this.applyThemeClass();
    
    // 2. Aplica el color de énfasis dinámico (con mejor contraste)
    const accentColor = this.settings.accentColor || '#3B82F6';
    root.style.setProperty('--global-accent-color', accentColor);
    
    // Aplicar color de énfasis también a --accent para consistencia
    root.style.setProperty('--accent', accentColor);
    
    // 3. Aplica el tamaño de fuente global
    root.style.setProperty('--global-font-size', `${this.settings.globalFontSize}`);
    
    // 4. Manejo de Renderizado Avanzado (blur y efectos)
    if (this.settings.advancedRendering) {
      root.classList.add('enable-blur-effects');
    } else {
      root.classList.remove('enable-blur-effects');
    }
    
    // 5. Aplica transiciones
    if (this.settings.enableTransitions) {
      root.classList.remove('disable-transitions');
    } else {
      root.classList.add('disable-transitions');
    }
    
    // 6. Aplica opacidad del fondo si hay imagen personalizada
    if (this.settings.customBackgroundPath) {
      root.style.setProperty('--background-opacity', `${this.settings.backgroundOpacity}`);
    } else {
      root.style.setProperty('--background-opacity', '0');
    }
    
    // 7. Aplica border radius global
    root.style.setProperty('--global-border-radius', `${this.settings.borderRadius}px`);
    
    // 8. Aplica filtro de color
    this.applyColorFilter();
    
    // 9. Forzar actualización de todos los elementos con clases de Tailwind
    this.forceThemeUpdate();
  }
  
  private forceThemeUpdate() {
    // Forzar re-renderizado de elementos con clases de Tailwind
    const event = new CustomEvent('theme-changed', { detail: { theme: this.settings.theme } });
    window.dispatchEvent(event);
  }

  private applyThemeClass() {
    const root = document.documentElement;
    
    // Remover clases de tema anteriores
    root.classList.remove('theme-dark', 'theme-light', 'theme-oled', 'theme-system');
    
    if (this.settings.theme === 'system') {
      // Detecta tema del sistema
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const systemTheme = isSystemDark ? 'dark' : 'light';
      root.classList.add(`theme-${systemTheme}`, 'theme-system');
    } else {
      root.classList.add(`theme-${this.settings.theme}`);
    }
  }

  private applyColorFilter() {
    const root = document.documentElement;
    let filter = 'none';
    
    switch (this.settings.colorFilter) {
      case 'sepia':
        filter = 'sepia(50%)';
        break;
      case 'contrast':
        filter = 'contrast(120%)';
        break;
      case 'saturate':
        filter = 'saturate(150%)';
        break;
      case 'none':
      default:
        filter = 'none';
        break;
    }
    
    root.style.setProperty('--global-filter', filter);
  }

  updateSetting(key: keyof Settings['appearance'], value: any) {
    this.settings[key] = value;
    this.applyTheme();
    
    // Guardar en localStorage también
    const currentSettings = JSON.parse(localStorage.getItem('launcher_settings') || '{}');
    if (!currentSettings.appearance) currentSettings.appearance = {};
    currentSettings.appearance[key] = value;
    localStorage.setItem('launcher_settings', JSON.stringify(currentSettings));
  }

  getSetting(key: keyof Settings['appearance']) {
    return this.settings[key];
  }

  resetToDefaults() {
    this.settings = {
      theme: 'dark',
      accentColor: '#3B82F6',
      advancedRendering: false,
      globalFontSize: 1.0,
      enableTransitions: true,
      backgroundOpacity: 0.3,
      borderRadius: 8,
      colorFilter: 'none'
    };
    this.applyTheme();
    
    // Resetear en localStorage
    const currentSettings = JSON.parse(localStorage.getItem('launcher_settings') || '{}');
    if (!currentSettings.appearance) currentSettings.appearance = {};
    currentSettings.appearance = this.settings;
    localStorage.setItem('launcher_settings', JSON.stringify(currentSettings));
  }
}

export const themeService = new ThemeService();