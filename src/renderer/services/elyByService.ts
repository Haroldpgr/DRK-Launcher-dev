// Servicio para interactuar con la API de Ely.by
// Documentación: https://docs.ely.by/en/api.html

const ELY_BY_API_BASE = 'https://authserver.ely.by';

export interface ElyByUser {
  id: string; // UUID
  name: string; // Username
}

export interface ElyByUsernameHistory {
  name: string;
  changedToAt?: number;
}

class ElyByService {
  /**
   * Obtiene el UUID de un usuario por su nombre de usuario
   * GET /api/users/profiles/minecraft/{username}
   * @param username Nombre de usuario a buscar
   * @returns Información del usuario o null si no existe
   */
  async getUserByUsername(username: string): Promise<ElyByUser | null> {
    try {
      const response = await fetch(`${ELY_BY_API_BASE}/api/users/profiles/minecraft/${encodeURIComponent(username)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 204) {
        // Usuario no encontrado
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ElyByUser = await response.json();
      return data;
    } catch (error) {
      console.error('Error al buscar usuario en Ely.by:', error);
      throw error;
    }
  }

  /**
   * Obtiene el historial de nombres de usuario por UUID
   * GET /api/user/profiles/{uuid}/names
   * @param uuid UUID del usuario
   * @returns Lista de nombres usados por el usuario
   */
  async getUsernameHistory(uuid: string): Promise<ElyByUsernameHistory[]> {
    try {
      // Remover guiones del UUID si los tiene
      const cleanUuid = uuid.replace(/-/g, '');
      
      const response = await fetch(`${ELY_BY_API_BASE}/api/user/profiles/${cleanUuid}/names`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 204) {
        // UUID no encontrado
        return [];
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ElyByUsernameHistory[] = await response.json();
      return data;
    } catch (error) {
      console.error('Error al obtener historial de nombres:', error);
      throw error;
    }
  }

  /**
   * Verifica si un nombre de usuario existe en Ely.by
   * Usa el proceso principal de Electron para evitar CORS
   * @param username Nombre de usuario a verificar
   * @returns true si el usuario existe, false si no
   */
  async verifyUsername(username: string): Promise<boolean> {
    try {
      // Usar el proceso principal de Electron para evitar CORS
      if (window.api?.elyby?.verifyUsername) {
        const result = await window.api.elyby.verifyUsername(username);
        return result.exists;
      }
      
      // Fallback al método directo si no está disponible (puede fallar por CORS)
      const user = await this.getUserByUsername(username);
      return user !== null;
    } catch (error) {
      console.error('Error al verificar usuario:', error);
      return false;
    }
  }
}

export const elyByService = new ElyByService();

