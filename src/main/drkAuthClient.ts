/**
 * Cliente de Autenticación Drk Launcher
 * Implementa el protocolo Yggdrasil (Mojang Legacy Auth)
 * Comunicación con el servidor de autenticación de Drk Launcher
 */

import fetch from 'node-fetch';

// ===== Interfaces TypeScript =====

/**
 * Respuesta de autenticación exitosa
 */
export interface DrkAuthenticateResponse {
  accessToken: string;
  clientToken: string;
  selectedProfile: {
    id: string; // UUID sin guiones
    name: string; // Nombre de usuario
  };
  availableProfiles?: Array<{
    id: string;
    name: string;
  }>;
  user?: {
    id: string;
    username: string;
    properties?: Array<{
      name: string;
      value: string;
    }>;
  };
}

/**
 * Respuesta de refresh exitosa
 */
export interface DrkRefreshResponse {
  accessToken: string;
  clientToken: string;
  selectedProfile: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    username: string;
    properties?: Array<{
      name: string;
      value: string;
    }>;
  };
}

/**
 * Error de Drk Launcher Auth
 */
export interface DrkAuthError {
  error: string;
  errorMessage: string;
  cause?: string;
}

// ===== Clase DrkAuthClient =====

export class DrkAuthClient {
  private baseUrl: string;

  /**
   * Constructor del cliente de autenticación Drk Launcher
   * @param baseUrl URL base del servidor de autenticación (ej: https://api.drklauncher.com/authserver)
   */
  constructor(baseUrl: string = 'https://api.drklauncher.com/authserver') {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  /**
   * Iniciar sesión con credenciales de usuario
   * @param username Nombre de usuario o email
   * @param password Contraseña del usuario
   * @returns Objeto con accessToken, clientToken y selectedProfile
   * @throws Error si la autenticación falla
   */
  async authenticate(username: string, password: string): Promise<DrkAuthenticateResponse> {
    const url = `${this.baseUrl}/authenticate`;
    
    // Generar un clientToken único para esta sesión
    const clientToken = this.generateClientToken();
    
    const requestBody = {
      agent: {
        name: 'Minecraft',
        version: 1
      },
      username: username,
      password: password,
      clientToken: clientToken,
      requestUser: true
    };

    console.log(`[DrkAuth] Autenticando usuario: ${username}`);
    console.log(`[DrkAuth] Endpoint: ${url}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        let errorData: DrkAuthError;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = {
            error: 'UnknownError',
            errorMessage: responseText || `HTTP error! status: ${response.status}`
          };
        }
        
        console.error(`[DrkAuth] Error de autenticación:`, errorData);
        throw new Error(errorData.errorMessage || errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = JSON.parse(responseText);
      
      // Validar que la respuesta tenga los campos requeridos
      if (!data.accessToken || !data.clientToken || !data.selectedProfile) {
        throw new Error('Respuesta de autenticación incompleta. Faltan campos requeridos.');
      }

      console.log(`[DrkAuth] ✓ Autenticación exitosa para usuario: ${data.selectedProfile.name}`);
      
      return {
        accessToken: data.accessToken,
        clientToken: data.clientToken || clientToken,
        selectedProfile: {
          id: data.selectedProfile.id,
          name: data.selectedProfile.name
        },
        availableProfiles: data.availableProfiles || [],
        user: data.user || undefined
      };
    } catch (error: any) {
      console.error('[DrkAuth] Error en authenticate:', error);
      if (error.message) {
        throw error;
      }
      throw new Error(`Error de conexión: ${error.message || 'Error desconocido'}`);
    }
  }

  /**
   * Refrescar tokens de acceso
   * @param accessToken Token de acceso actual
   * @param clientToken Token del cliente
   * @returns Nuevo accessToken y selectedProfile
   * @throws Error si el refresh falla
   */
  async refresh(accessToken: string, clientToken: string): Promise<DrkRefreshResponse> {
    const url = `${this.baseUrl}/refresh`;
    
    const requestBody = {
      accessToken: accessToken,
      clientToken: clientToken,
      requestUser: true
    };

    console.log(`[DrkAuth] Refrescando tokens...`);
    console.log(`[DrkAuth] Endpoint: ${url}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        let errorData: DrkAuthError;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = {
            error: 'UnknownError',
            errorMessage: responseText || `HTTP error! status: ${response.status}`
          };
        }
        
        console.error(`[DrkAuth] Error al refrescar tokens:`, errorData);
        throw new Error(errorData.errorMessage || errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = JSON.parse(responseText);
      
      // Validar que la respuesta tenga los campos requeridos
      if (!data.accessToken || !data.clientToken || !data.selectedProfile) {
        throw new Error('Respuesta de refresh incompleta. Faltan campos requeridos.');
      }

      console.log(`[DrkAuth] ✓ Tokens refrescados exitosamente para usuario: ${data.selectedProfile.name}`);
      
      return {
        accessToken: data.accessToken,
        clientToken: data.clientToken,
        selectedProfile: {
          id: data.selectedProfile.id,
          name: data.selectedProfile.name
        },
        user: data.user || undefined
      };
    } catch (error: any) {
      console.error('[DrkAuth] Error en refresh:', error);
      if (error.message) {
        throw error;
      }
      throw new Error(`Error de conexión: ${error.message || 'Error desconocido'}`);
    }
  }

  /**
   * Validar si un accessToken es válido
   * @param accessToken Token de acceso a validar
   * @returns true si el token es válido, false si no lo es
   * @throws Error si hay un problema de conexión
   */
  async validate(accessToken: string): Promise<boolean> {
    const url = `${this.baseUrl}/validate`;
    
    const requestBody = {
      accessToken: accessToken
    };

    console.log(`[DrkAuth] Validando token...`);
    console.log(`[DrkAuth] Endpoint: ${url}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      // El endpoint /validate devuelve 204 No Content si el token es válido
      // Cualquier otro código significa que el token es inválido
      if (response.status === 204) {
        console.log(`[DrkAuth] ✓ Token válido`);
        return true;
      } else {
        console.log(`[DrkAuth] ✗ Token inválido (status: ${response.status})`);
        return false;
      }
    } catch (error: any) {
      console.error('[DrkAuth] Error en validate:', error);
      // En caso de error de conexión, asumimos que el token no es válido
      return false;
    }
  }

  /**
   * Genera un clientToken único para esta sesión
   * @returns String hexadecimal de 32 caracteres
   */
  private generateClientToken(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(16).toString('hex');
  }
}

// ===== Instancia por defecto =====

// Crear una instancia por defecto con la URL de producción
export const drkAuthClient = new DrkAuthClient('https://api.drklauncher.com/authserver');

