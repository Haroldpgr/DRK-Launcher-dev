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
      
      // Si no está disponible el IPC, retornar false
      console.warn('IPC handler para Ely.by no está disponible');
      return false;
    } catch (error) {
      console.error('Error al verificar usuario:', error);
      return false;
    }
  }

  /**
   * Autentica un usuario con Ely.by usando correo/username y contraseña
   * Usa el proceso principal de Electron para evitar CORS
   * @param username Correo electrónico o nombre de usuario
   * @param password Contraseña
   * @param totpToken Token TOTP para autenticación de dos factores (opcional)
   * @returns Información del usuario autenticado o información sobre 2FA requerido
   */
  async authenticate(username: string, password: string, totpToken?: string): Promise<{ success: boolean; requires2FA?: boolean; accessToken?: string; clientToken?: string; selectedProfile?: { id: string; name: string }; availableProfiles?: Array<{ id: string; name: string }>; user?: any; error?: string } | null> {
    try {
      // Usar el proceso principal de Electron para evitar CORS
      if (window.api?.elyby?.authenticate) {
        const result = await window.api.elyby.authenticate(username, password, totpToken);
        return result;
      }
      
      console.warn('IPC handler para autenticación de Ely.by no está disponible');
      return { success: false, error: 'IPC handler no disponible' };
    } catch (error: any) {
      console.error('Error al autenticar usuario:', error);
      return { success: false, error: error.message || 'Error desconocido' };
    }
  }
}

export const elyByService = new ElyByService();

