// src/renderer/services/instanceProfileService.ts
import { profileService, Profile } from './profileService';

// Este servicio gestionará la asociación entre instancias y perfiles
export interface InstanceProfileLink {
  instanceId: string;
  profileUsername: string;
  lastPlayed?: number;
  timePlayed?: number; // en milisegundos
}

const INSTANCE_PROFILE_LINK_KEY = 'instance_profile_links';

function getLinks(): InstanceProfileLink[] {
  const linksJson = localStorage.getItem(INSTANCE_PROFILE_LINK_KEY);
  return linksJson ? JSON.parse(linksJson) : [];
}

function saveLinks(links: InstanceProfileLink[]): void {
  localStorage.setItem(INSTANCE_PROFILE_LINK_KEY, JSON.stringify(links));
}

export const instanceProfileService = {
  // Asocia una instancia a un perfil
  linkInstanceToProfile(instanceId: string, profileUsername: string): boolean {
    const links = getLinks();
    const existingLinkIndex = links.findIndex(link => link.instanceId === instanceId);
    
    if (existingLinkIndex !== -1) {
      // Actualiza la asociación existente
      links[existingLinkIndex].profileUsername = profileUsername;
    } else {
      // Crea una nueva asociación
      links.push({ instanceId, profileUsername });
    }
    
    saveLinks(links);
    
    // Actualiza el perfil para incluir esta instancia
    const profile = profileService.getProfileByUsername(profileUsername);
    if (profile) {
      const profileInstances = profile.instances || [];
      if (!profileInstances.includes(instanceId)) {
        profileService.updateProfile(profileUsername, { ...profile, instances: [...profileInstances, instanceId] });
      }
    }
    
    return true;
  },

  // Desvincula una instancia de un perfil
  unlinkInstance(instanceId: string): boolean {
    const links = getLinks();
    const initialLength = links.length;
    const updatedLinks = links.filter(link => link.instanceId !== instanceId);
    
    if (updatedLinks.length !== initialLength) {
      saveLinks(updatedLinks);
      
      // Remueve la instancia de todos los perfiles que la tenían
      const profiles = profileService.getAllProfiles();
      profiles.forEach(profile => {
        if (profile.instances && profile.instances.includes(instanceId)) {
          const updatedInstances = profile.instances.filter(id => id !== instanceId);
          profileService.updateProfile(profile.username, { ...profile, instances: updatedInstances });
        }
      });
      
      return true;
    }
    
    return false;
  },

  // Obtiene el perfil asociado a una instancia
  getProfileForInstance(instanceId: string): string | undefined {
    const links = getLinks();
    const link = links.find(link => link.instanceId === instanceId);
    return link?.profileUsername;
  },

  // Obtiene las instancias asociadas a un perfil
  getInstancesForProfile(profileUsername: string): string[] {
    const links = getLinks();
    return links
      .filter(link => link.profileUsername === profileUsername)
      .map(link => link.instanceId);
  },
  
  // Actualiza el tiempo de juego para una instancia y perfil
  updatePlayTime(instanceId: string, profileUsername: string, timePlayed: number): void {
    const links = getLinks();
    const linkIndex = links.findIndex(link => 
      link.instanceId === instanceId && link.profileUsername === profileUsername
    );
    
    if (linkIndex !== -1) {
      links[linkIndex].timePlayed = (links[linkIndex].timePlayed || 0) + timePlayed;
      links[linkIndex].lastPlayed = Date.now();
    } else {
      // Si no existe la asociación, créala
      links.push({
        instanceId,
        profileUsername,
        timePlayed,
        lastPlayed: Date.now()
      });
    }
    
    saveLinks(links);
  },
  
  // Obtiene el tiempo de juego para una instancia y perfil específico
  getPlayTime(instanceId: string, profileUsername: string): number {
    const links = getLinks();
    const link = links.find(link => 
      link.instanceId === instanceId && link.profileUsername === profileUsername
    );
    return link?.timePlayed || 0;
  },
  
  // Obtiene todas las instancias con información de perfil
  getInstancesWithProfileInfo(): Array<{
    instanceId: string;
    profileUsername: string;
    lastPlayed?: number;
    timePlayed?: number;
  }> {
    return getLinks();
  }
};

// Agregar método para actualizar perfiles en el servicio de perfiles
(profileService as any).updateProfile = function(username: string, updatedProfile: Partial<Profile>): boolean {
  const profiles = getProfiles();
  const profileIndex = profiles.findIndex(p => p.username === username);
  
  if (profileIndex !== -1) {
    profiles[profileIndex] = { ...profiles[profileIndex], ...updatedProfile };
    saveProfiles(profiles);
    return true;
  }
  
  return false;
};