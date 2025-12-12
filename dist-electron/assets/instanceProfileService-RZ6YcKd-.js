import { p as profileService } from "./index-o4fEJNsq.js";
const INSTANCE_PROFILE_LINK_KEY = "instance_profile_links";
function getLinks() {
  const linksJson = localStorage.getItem(INSTANCE_PROFILE_LINK_KEY);
  return linksJson ? JSON.parse(linksJson) : [];
}
function saveLinks(links) {
  localStorage.setItem(INSTANCE_PROFILE_LINK_KEY, JSON.stringify(links));
}
const instanceProfileService = {
  // Asocia una instancia a un perfil
  linkInstanceToProfile(instanceId, profileUsername) {
    const links = getLinks();
    const existingLinkIndex = links.findIndex((link) => link.instanceId === instanceId);
    if (existingLinkIndex !== -1) {
      links[existingLinkIndex].profileUsername = profileUsername;
    } else {
      links.push({ instanceId, profileUsername });
    }
    saveLinks(links);
    const profile = profileService.getProfileByUsername(profileUsername);
    if (profile) {
      const profileInstances = profile.instances || [];
      if (!profileInstances.includes(instanceId)) {
        profileService.updateProfile(profileUsername, { instances: [...profileInstances, instanceId] });
      }
    }
    return true;
  },
  // Desvincula una instancia de un perfil
  unlinkInstance(instanceId) {
    const links = getLinks();
    const initialLength = links.length;
    const updatedLinks = links.filter((link) => link.instanceId !== instanceId);
    if (updatedLinks.length !== initialLength) {
      saveLinks(updatedLinks);
      const profiles = profileService.getAllProfiles();
      profiles.forEach((profile) => {
        if (profile.instances && profile.instances.includes(instanceId)) {
          const updatedInstances = profile.instances.filter((id) => id !== instanceId);
          profileService.updateProfile(profile.username, { ...profile, instances: updatedInstances });
        }
      });
      return true;
    }
    return false;
  },
  // Desvincula una instancia de un perfil específico
  unlinkInstanceFromProfile(instanceId, profileUsername) {
    const links = getLinks();
    const initialLength = links.length;
    const updatedLinks = links.filter(
      (link) => !(link.instanceId === instanceId && link.profileUsername === profileUsername)
    );
    if (updatedLinks.length !== initialLength) {
      saveLinks(updatedLinks);
      const profile = profileService.getProfileByUsername(profileUsername);
      if (profile && profile.instances && profile.instances.includes(instanceId)) {
        const updatedInstances = profile.instances.filter((id) => id !== instanceId);
        profileService.updateProfile(profileUsername, { ...profile, instances: updatedInstances });
      }
      return true;
    }
    return false;
  },
  // Verifica si una instancia está vinculada a un perfil específico
  isInstanceLinkedToProfile(instanceId, profileUsername) {
    const links = getLinks();
    return links.some(
      (link) => link.instanceId === instanceId && link.profileUsername === profileUsername
    );
  },
  // Obtiene el perfil asociado a una instancia
  getProfileForInstance(instanceId) {
    const links = getLinks();
    const link = links.find((link2) => link2.instanceId === instanceId);
    return link == null ? void 0 : link.profileUsername;
  },
  // Obtiene las instancias asociadas a un perfil
  getInstancesForProfile(profileUsername) {
    const links = getLinks();
    return links.filter((link) => link.profileUsername === profileUsername).map((link) => link.instanceId);
  },
  // Actualiza el tiempo de juego para una instancia y perfil
  updatePlayTime(instanceId, profileUsername, timePlayed) {
    const links = getLinks();
    const linkIndex = links.findIndex(
      (link) => link.instanceId === instanceId && link.profileUsername === profileUsername
    );
    if (linkIndex !== -1) {
      links[linkIndex].timePlayed = (links[linkIndex].timePlayed || 0) + timePlayed;
      links[linkIndex].lastPlayed = Date.now();
    } else {
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
  getPlayTime(instanceId, profileUsername) {
    const links = getLinks();
    const link = links.find(
      (link2) => link2.instanceId === instanceId && link2.profileUsername === profileUsername
    );
    return (link == null ? void 0 : link.timePlayed) || 0;
  },
  // Obtiene todas las instancias con información de perfil
  getInstancesWithProfileInfo() {
    return getLinks();
  }
};
export {
  instanceProfileService
};
