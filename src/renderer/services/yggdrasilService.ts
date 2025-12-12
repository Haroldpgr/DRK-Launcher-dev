// Servicio para interactuar con la API Yggdrasil
// Protocolo Mojang Legacy Authentication

export interface YggdrasilAuthenticateResult {
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

export interface YggdrasilRefreshResult {
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

export interface YggdrasilValidateResult {
  success: boolean;
  isValid: boolean;
  error?: string;
}

class YggdrasilService {
  /**
   * Autentica un usuario con Yggdrasil usando username y contraseña
   * Usa el proceso principal de Electron para evitar CORS
   * @param username Nombre de usuario o email
   * @param password Contraseña
   * @returns Información del usuario autenticado
   */
  async authenticate(username: string, password: string): Promise<YggdrasilAuthenticateResult> {
    try {
      // Usar el proceso principal de Electron para evitar CORS
      if (window.api?.yggdrasil?.authenticate) {
        const result = await window.api.yggdrasil.authenticate(username, password);
        return result;
      }
      
      console.warn('IPC handler para autenticación de Yggdrasil no está disponible');
      return { success: false, error: 'IPC handler no disponible' };
    } catch (error: any) {
      console.error('Error al autenticar usuario con Yggdrasil:', error);
      return { success: false, error: error.message || 'Error desconocido' };
    }
  }

  /**
   * Refresca los tokens de acceso de Yggdrasil
   * @param accessToken Token de acceso actual
   * @param clientToken Token del cliente
   * @returns Nuevos tokens y perfil
   */
  async refresh(accessToken: string, clientToken: string): Promise<YggdrasilRefreshResult> {
    try {
      if (window.api?.yggdrasil?.refresh) {
        const result = await window.api.yggdrasil.refresh(accessToken, clientToken);
        return result;
      }
      
      console.warn('IPC handler para refresh de Yggdrasil no está disponible');
      return { success: false, error: 'IPC handler no disponible' };
    } catch (error: any) {
      console.error('Error al refrescar tokens de Yggdrasil:', error);
      return { success: false, error: error.message || 'Error desconocido' };
    }
  }

  /**
   * Valida si un token de acceso es válido
   * @param accessToken Token de acceso a validar
   * @returns true si el token es válido
   */
  async validate(accessToken: string): Promise<YggdrasilValidateResult> {
    try {
      if (window.api?.yggdrasil?.validate) {
        const result = await window.api.yggdrasil.validate(accessToken);
        return result;
      }
      
      console.warn('IPC handler para validación de Yggdrasil no está disponible');
      return { success: false, isValid: false, error: 'IPC handler no disponible' };
    } catch (error: any) {
      console.error('Error al validar token de Yggdrasil:', error);
      return { success: false, isValid: false, error: error.message || 'Error desconocido' };
    }
  }
}

export const yggdrasilService = new YggdrasilService();

