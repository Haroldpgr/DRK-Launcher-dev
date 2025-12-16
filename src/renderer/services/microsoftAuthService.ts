// Servicio para interactar con la autenticación de Microsoft
// Flujo completo: Azure AD -> Xbox Live -> Minecraft

export interface MicrosoftAuthResult {
  success: boolean;
  accessToken?: string;
  clientToken?: string;
  selectedProfile?: {
    id: string; // UUID
    name: string; // Nombre de usuario de Minecraft
  };
  user?: {
    id: string;
    username: string;
  };
  error?: string;
}

class MicrosoftAuthService {
  /**
   * Inicia el flujo de autenticación de Microsoft
   * Abre una ventana del navegador para el login de Azure AD y luego
   * encadena los tokens: Azure -> Xbox Live -> Minecraft
   * @returns Información del usuario autenticado de Minecraft
   */
  async authenticate(): Promise<MicrosoftAuthResult> {
    try {
      // Usar el proceso principal de Electron para evitar CORS
      if (window.api?.microsoft?.authenticate) {
        const result = await window.api.microsoft.authenticate();
        return result;
      }
      
      console.warn('IPC handler para autenticación de Microsoft no está disponible');
      return { success: false, error: 'IPC handler no disponible' };
    } catch (error: any) {
      console.error('Error al autenticar usuario con Microsoft:', error);
      return { success: false, error: error.message || 'Error desconocido' };
    }
  }

  /**
   * Refresca los tokens de acceso de Microsoft
   * @param accessToken Token de acceso actual
   * @param clientToken Token del cliente
   * @returns Nuevos tokens y perfil
   */
  async refresh(accessToken: string, clientToken: string): Promise<MicrosoftAuthResult> {
    try {
      if (window.api?.microsoft?.refresh) {
        const result = await window.api.microsoft.refresh(accessToken, clientToken);
        return result;
      }
      
      console.warn('IPC handler para refresh de Microsoft no está disponible');
      return { success: false, error: 'IPC handler no disponible' };
    } catch (error: any) {
      console.error('Error al refrescar tokens de Microsoft:', error);
      return { success: false, error: error.message || 'Error desconocido' };
    }
  }

  /**
   * Valida si un token de acceso es válido
   * @param accessToken Token de acceso a validar
   * @returns true si el token es válido
   */
  async validate(accessToken: string): Promise<{ success: boolean; isValid: boolean; error?: string }> {
    try {
      if (window.api?.microsoft?.validate) {
        const result = await window.api.microsoft.validate(accessToken);
        return result;
      }
      
      console.warn('IPC handler para validación de Microsoft no está disponible');
      return { success: false, isValid: false, error: 'IPC handler no disponible' };
    } catch (error: any) {
      console.error('Error al validar token de Microsoft:', error);
      return { success: false, isValid: false, error: error.message || 'Error desconocido' };
    }
  }
}

export const microsoftAuthService = new MicrosoftAuthService();

