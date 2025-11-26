// src/renderer/services/settingsService.ts
export interface Settings {
  appearance: {
    theme: 'dark' | 'light' | 'oled' | 'system';
    advancedRendering: boolean;
    windowTransparency?: number;
  };
  behavior: {
    minimizeOnLaunch: boolean;
    hideNametag: boolean;
    defaultLandingPage: string;
    jumpBackWorlds: JumpBackWorld[];
  };
  privacy: {
    telemetryEnabled: boolean;
    discordRPC: boolean;
    personalizedAds: boolean;
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
    advancedRendering: false
  },
  behavior: {
    minimizeOnLaunch: true,
    hideNametag: false,
    defaultLandingPage: 'home',
    jumpBackWorlds: []
  },
  privacy: {
    telemetryEnabled: true,
    discordRPC: true,
    personalizedAds: false
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