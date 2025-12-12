// Servicio para interactuar con la API de autenticación Drk Launcher
// Protocolo Yggdrasil (Mojang Legacy Auth)

export interface DrkAuthAuthenticateResult {
  success: boolean;
  accessToken?: string;
  clientToken?: string;
  selectedProfile?: {
    id: string; // UUID sin guiones
    name: string; // Nombre de usuario
  };
  availableProfiles?: Array<{
    id: string;
    name: string;
  }>;
  user?: any;
  error?: string;
}

export interface DrkAuthRefreshResult {
  success: boolean;
  accessToken?: string;
  clientToken?: string;
  selectedProfile?: {
    id: string;
    name: string;
  };
  user?: any;
  error?: string;
}

export interface DrkAuthValidateResult {
  success: boolean;
  isValid: boolean;
  error?: string;
}

class DrkAuthService {
  /**
   * Autentica un usuario con Drk Launcher usando username y contraseña
   * Usa el proceso principal de Electron para evitar CORS
   * @param username Nombre de usuario o email
   * @param password Contraseña
   * @returns Información del usuario autenticado
   */
  async authenticate(username: string, password: string): Promise<DrkAuthAuthenticateResult> {
    try {
      // Usar el proceso principal de Electron para evitar CORS
      if (window.api?.drkauth?.authenticate) {
        const result = await window.api.drkauth.authenticate(username, password);
        return result;
      }
      
      console.warn('IPC handler para autenticación de Drk Launcher no está disponible');
      return { success: false, error: 'IPC handler no disponible' };
    } catch (error: any) {
      console.error('Error al autenticar usuario con Drk Launcher:', error);
      return { success: false, error: error.message || 'Error desconocido' };
    }
  }

  /**
   * Refresca los tokens de acceso de Drk Launcher
   * @param accessToken Token de acceso actual
   * @param clientToken Token del cliente
   * @returns Nuevos tokens y perfil
   */
  async refresh(accessToken: string, clientToken: string): Promise<DrkAuthRefreshResult> {
    try {
      if (window.api?.drkauth?.refresh) {
        const result = await window.api.drkauth.refresh(accessToken, clientToken);
        return result;
      }
      
      console.warn('IPC handler para refresh de Drk Launcher no está disponible');
      return { success: false, error: 'IPC handler no disponible' };
    } catch (error: any) {
      console.error('Error al refrescar tokens de Drk Launcher:', error);
      return { success: false, error: error.message || 'Error desconocido' };
    }
  }

  /**
   * Valida si un token de acceso es válido
   * @param accessToken Token de acceso a validar
   * @returns true si el token es válido
   */
  async validate(accessToken: string): Promise<DrkAuthValidateResult> {
    try {
      if (window.api?.drkauth?.validate) {
        const result = await window.api.drkauth.validate(accessToken);
        return result;
      }
      
      console.warn('IPC handler para validación de Drk Launcher no está disponible');
      return { success: false, isValid: false, error: 'IPC handler no disponible' };
    } catch (error: any) {
      console.error('Error al validar token de Drk Launcher:', error);
      return { success: false, isValid: false, error: error.message || 'Error desconocido' };
    }
  }
}

export const drkAuthService = new DrkAuthService();

