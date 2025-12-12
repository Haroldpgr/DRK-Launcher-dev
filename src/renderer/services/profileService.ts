// src/renderer/services/profileService.ts
// Este servicio gestionará la lógica de perfiles (premium y no-premium)

import { generateValidUUID } from '../utils/uuid';

export interface Profile {
  id: string;
  username: string;
  type: 'microsoft' | 'non-premium' | 'elyby' | 'yggdrasil' | 'drkauth';
  lastUsed: number;
  gameTime?: number; // Tiempo total de juego en milisegundos
  instances?: string[]; // IDs de las instancias asociadas
  skinUrl?: string; // URL de la skin personalizada
  // Tokens para Yggdrasil (opcional, solo para tipo 'yggdrasil')
  accessToken?: string;
  clientToken?: string;
}

const STORAGE_KEY = 'launcher_profiles';
const CURRENT_USER_KEY = 'launcher_current_user';

function getProfiles(): Profile[] {
  const profilesJson = localStorage.getItem(STORAGE_KEY);
  return profilesJson ? JSON.parse(profilesJson) : [];
}

function saveProfiles(profiles: Profile[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export const profileService = {
  getAllProfiles(): Profile[] {
    return getProfiles();
  },

  getProfileByUsername(username: string): Profile | undefined {
    return getProfiles().find(p => p.username === username);
  },

  addProfile(username: string, type: 'microsoft' | 'non-premium' | 'elyby' | 'yggdrasil' | 'drkauth', tokens?: { accessToken?: string; clientToken?: string }): Profile {
    const profiles = getProfiles();
    const existingProfile = profiles.find(p => p.username === username);
    
    if (existingProfile) {
      // Si el perfil ya existe, actualizar su tipo, tokens y última vez usado
      console.log(`[ProfileService] Perfil existente encontrado:`, {
        username: existingProfile.username,
        tipoAnterior: existingProfile.type,
        tipoNuevo: type,
        tieneTokens: !!tokens
      });
      
      const updatedProfiles = profiles.map(p => {
        if (p.username === username) {
          const updated: Profile = { 
            ...p, 
            type, // SIEMPRE actualizar el tipo al nuevo valor
            lastUsed: Date.now(),
            ...(tokens && { accessToken: tokens.accessToken, clientToken: tokens.clientToken })
          };
          console.log(`[ProfileService] Actualizando perfil ${username} de tipo ${p.type} a ${type}`);
          console.log(`[ProfileService] Tokens recibidos:`, {
            hasAccessToken: !!tokens?.accessToken,
            accessTokenLength: tokens?.accessToken?.length,
            hasClientToken: !!tokens?.clientToken,
            clientTokenLength: tokens?.clientToken?.length
          });
          console.log(`[ProfileService] Perfil actualizado completo:`, {
            ...updated,
            accessToken: updated.accessToken ? `${updated.accessToken.substring(0, 20)}...` : 'NO HAY',
            clientToken: updated.clientToken ? `${updated.clientToken.substring(0, 20)}...` : 'NO HAY'
          });
          return updated;
        }
        return p;
      });
      saveProfiles(updatedProfiles);
      this.setCurrentProfile(username);
      const updatedProfile = updatedProfiles.find(p => p.username === username)!;
      console.log(`[ProfileService] Perfil guardado con tipo:`, updatedProfile.type);
      console.log(`[ProfileService] Token guardado en perfil:`, {
        hasAccessToken: !!updatedProfile.accessToken,
        accessTokenLength: updatedProfile.accessToken?.length
      });
      return updatedProfile;
    }
    const newProfile: Profile = {
      id: generateValidUUID(),
      username,
      type,
      lastUsed: Date.now(),
      ...(tokens && { accessToken: tokens.accessToken, clientToken: tokens.clientToken })
    };
    console.log(`[ProfileService] Creando nuevo perfil:`, {
      username,
      type,
      hasAccessToken: !!tokens?.accessToken,
      accessTokenLength: tokens?.accessToken?.length,
      hasClientToken: !!tokens?.clientToken,
      clientTokenLength: tokens?.clientToken?.length
    });
    profiles.push(newProfile);
    saveProfiles(profiles);
    this.setCurrentProfile(username); // Set as current after adding
    console.log(`[ProfileService] Nuevo perfil guardado:`, {
      ...newProfile,
      accessToken: newProfile.accessToken ? `${newProfile.accessToken.substring(0, 20)}...` : 'NO HAY',
      clientToken: newProfile.clientToken ? `${newProfile.clientToken.substring(0, 20)}...` : 'NO HAY'
    });
    return newProfile;
  },

  deleteProfile(username: string): boolean {
    let profiles = getProfiles();
    const initialLength = profiles.length;
    profiles = profiles.filter(p => p.username !== username);
    saveProfiles(profiles);

    // If the deleted profile was the current one, clear current user
    if (this.getCurrentProfile() === username) {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
    return profiles.length < initialLength; // True if a profile was actually deleted
  },

  setCurrentProfile(username: string): boolean {
    const profiles = getProfiles();
    const profileExists = profiles.some(p => p.username === username);
    if (profileExists) {
      localStorage.setItem(CURRENT_USER_KEY, username);
      // Update lastUsed timestamp
      const updatedProfiles = profiles.map(p => 
        p.username === username ? { ...p, lastUsed: Date.now() } : p
      );
      saveProfiles(updatedProfiles);
      return true;
    }
    return false;
  },

  getCurrentProfile(): string | null {
    return localStorage.getItem(CURRENT_USER_KEY);
  },

  // Placeholder for user authentication (e.g., Microsoft OAuth flow)
  authenticateMicrosoft(): Promise<Profile> {
    return new Promise((resolve, reject) => {
      // Simulate OAuth flow
      setTimeout(() => {
        const username = `MicrosoftUser_${Math.random().toString(36).substr(2, 5)}`;
        try {
          const profile = this.addProfile(username, 'microsoft');
          resolve(profile);
        } catch (error) {
          reject(error);
        }
      }, 1000);
    });
  },

  setSkinForProfile(username: string, skinUrl: string): boolean {
    const profiles = getProfiles();
    const profileIndex = profiles.findIndex(p => p.username === username);
    if (profileIndex !== -1) {
      profiles[profileIndex].skinUrl = skinUrl;
      saveProfiles(profiles);
      return true;
    }
    return false;
  },

  getSkinForProfile(username: string): string | undefined {
    const profile = this.getProfileByUsername(username);
    return profile?.skinUrl;
  },

  updateProfile(username: string, updatedProfile: Partial<Profile>): boolean {
    const profiles = getProfiles();
    const profileIndex = profiles.findIndex(p => p.username === username);

    if (profileIndex !== -1) {
      profiles[profileIndex] = { ...profiles[profileIndex], ...updatedProfile };
      saveProfiles(profiles);
      return true;
    }

    return false;
  },
};