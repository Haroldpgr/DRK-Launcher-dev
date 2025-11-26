// src/renderer/services/settingsService.ts
export interface Settings {
  appearance: {
    theme: 'dark' | 'light' | 'oled' | 'system';
    accentColor: string;
    advancedRendering: boolean;
    globalFontSize: number;
    enableTransitions: boolean;
    customBackgroundPath?: string;
    backgroundOpacity: number;
    borderRadius: number;
    colorFilter: 'none' | 'sepia' | 'contrast' | 'saturate';
    windowTransparency?: number;
  };
  behavior: {
    minimizeOnLaunch: boolean;
    hideNametag: boolean;
    defaultLandingPage: string;
    jumpBackWorlds: JumpBackWorld[];
    nativeDecorations: boolean;
    showRecentWorlds: boolean;
    closeAfterPlay: boolean;
    systemNotifications: boolean;
    backgroundFPSLimit: number;
  };
  privacy: {
    telemetryEnabled: boolean;
    discordRPC: boolean;
    personalizedAds: boolean;
    logLevel: 'Debug' | 'Info' | 'Error';
    forcedOfflineMode: boolean;
    privacyPolicyUrl: string;
  };
  java: {
    java8Path?: string;
    java17Path?: string;
    java21Path?: string;
    defaultVersion: string;
  };
}

export interface JumpBackWorld {
  id: string;
  name: string;
  lastPlayed: number; // timestamp
  thumbnail?: string;
}

const SETTINGS_KEY = 'launcher_settings';

// Default settings
const DEFAULT_SETTINGS: Settings = {
  appearance: {
    theme: 'dark',
    accentColor: '#3B82F6', // Azul por defecto
    advancedRendering: false,
    globalFontSize: 1.0, // 100% - tamaño base
    enableTransitions: true,
    backgroundOpacity: 0.3,
    borderRadius: 8,
    colorFilter: 'none'
  },
  behavior: {
    minimizeOnLaunch: true,
    hideNametag: false,
    defaultLandingPage: 'home',
    jumpBackWorlds: [],
    nativeDecorations: false,
    showRecentWorlds: true,
    closeAfterPlay: false,
    systemNotifications: true,
    backgroundFPSLimit: 30
  },
  privacy: {
    telemetryEnabled: true,
    discordRPC: true,
    personalizedAds: false,
    logLevel: 'Info',
    forcedOfflineMode: false,
    privacyPolicyUrl: 'https://example.com/privacy'
  },
  java: {
    defaultVersion: '17'
  }
};

function getStoredSettings(): Settings {
  const settingsJson = localStorage.getItem(SETTINGS_KEY);
  if (settingsJson) {
    try {
      const stored = JSON.parse(settingsJson);
      // Merge with defaults to ensure new settings are included
      return { ...DEFAULT_SETTINGS, ...stored };
    } catch (error) {
      console.error('Error parsing settings:', error);
      return DEFAULT_SETTINGS;
    }
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export const settingsService = {
  getSettings(): Settings {
    return getStoredSettings();
  },

  updateSettings(updates: Partial<Settings>): Settings {
    const currentSettings = getStoredSettings();
    const newSettings = { ...currentSettings, ...updates };
    saveSettings(newSettings);
    return newSettings;
  },

  updateAppearance(updates: Partial<Settings['appearance']>): Settings['appearance'] {
    const currentSettings = getStoredSettings();
    const newSettings = {
      ...currentSettings,
      appearance: { ...currentSettings.appearance, ...updates }
    };
    saveSettings(newSettings);
    return newSettings.appearance;
  },

  updateBehavior(updates: Partial<Settings['behavior']>): Settings['behavior'] {
    const currentSettings = getStoredSettings();
    const newSettings = {
      ...currentSettings,
      behavior: { ...currentSettings.behavior, ...updates }
    };
    saveSettings(newSettings);
    return newSettings.behavior;
  },

  updatePrivacy(updates: Partial<Settings['privacy']>): Settings['privacy'] {
    const currentSettings = getStoredSettings();
    const newSettings = {
      ...currentSettings,
      privacy: { ...currentSettings.privacy, ...updates }
    };
    saveSettings(newSettings);
    return newSettings.privacy;
  },

  updateJava(updates: Partial<Settings['java']>): Settings['java'] {
    const currentSettings = getStoredSettings();
    const newSettings = {
      ...currentSettings,
      java: { ...currentSettings.java, ...updates }
    };
    saveSettings(newSettings);
    return newSettings.java;
  },

  updatePrivacy(updates: Partial<Settings['privacy']>): Settings['privacy'] {
    const currentSettings = getStoredSettings();
    const newSettings = {
      ...currentSettings,
      privacy: {
        ...currentSettings.privacy,
        ...updates
      }
    };
    saveSettings(newSettings);
    return newSettings.privacy;
  },

  addJumpBackWorld(world: JumpBackWorld): JumpBackWorld[] {
    const currentSettings = getStoredSettings();
    const existingWorlds = currentSettings.behavior.jumpBackWorlds || [];
    // Remove existing world with same ID
    const filteredWorlds = existingWorlds.filter(w => w.id !== world.id);
    // Add new world
    const newWorlds = [world, ...filteredWorlds].slice(0, 10); // Keep only 10 most recent
    
    const newSettings = {
      ...currentSettings,
      behavior: {
        ...currentSettings.behavior,
        jumpBackWorlds: newWorlds
      }
    };
    saveSettings(newSettings);
    return newSettings.behavior.jumpBackWorlds;
  }
};