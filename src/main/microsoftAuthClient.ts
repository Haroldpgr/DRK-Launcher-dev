/**
 * Cliente de Autenticación de Microsoft usando MSAL directamente
 * Implementa el flujo completo de autenticación:
 * 1. Azure AD OAuth (con PKCE y ventana de Electron)
 * 2. Xbox Live Authentication
 * 3. Minecraft Authentication
 */

import { BrowserWindow } from 'electron';
import { PublicClientApplication, InteractionType, AccountInfo } from '@azure/msal-node';
import { URL } from 'node:url';
import fetch from 'node-fetch';
import crypto from 'node:crypto';

// ===== Configuración =====

const CLIENT_ID = "2fe6caea-adc3-44c5-9a09-f8f9afa3d223";
const REDIRECT_URI = "https://login.microsoftonline.com/common/oauth2/nativeclient";
const AUTHORITY = "https://login.microsoftonline.com/consumers";
const SCOPES = ["XboxLive.signin", "offline_access"];

// Endpoints
const XBOX_LIVE_AUTH_URL = "https://user.auth.xboxlive.com/user/authenticate";
const XSTS_AUTH_URL = "https://xsts.auth.xboxlive.com/xsts/authorize";
const MINECRAFT_AUTH_URL = "https://api.minecraftservices.com/authentication/login_with_xbox";
const MINECRAFT_PROFILE_URL = "https://api.minecraftservices.com/minecraft/profile";

// ===== Interfaces TypeScript =====

export interface MicrosoftAuthResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  selectedProfile: {
    id: string; // UUID
    name: string; // Nombre de usuario de Minecraft
  };
  user?: {
    id: string;
    username: string;
  };
}

// ===== Clase MicrosoftAuthClient =====

export class MicrosoftAuthClient {
  private msalApp: PublicClientApplication;

  constructor() {
    // Configurar MSAL
    const msalConfig = {
      auth: {
        clientId: CLIENT_ID,
        authority: AUTHORITY,
      },
    };

    this.msalApp = new PublicClientApplication(msalConfig);
  }

  /**
   * Inicia el flujo completo de autenticación de Microsoft
   * Abre una ventana de Electron para el login y luego
   * encadena los tokens: Azure -> Xbox Live -> Minecraft
   */
  async authenticate(): Promise<MicrosoftAuthResponse> {
    console.log('[Microsoft Auth] Iniciando flujo de autenticación...');

    try {
      // Paso 1: Obtener código de autorización con ventana de Electron
      const { code, codeVerifier } = await this.getAuthorizationCode();
      console.log('[Microsoft Auth] Código de autorización recibido');

      // Paso 2: Intercambiar código por token de Azure AD
      const azureToken = await this.exchangeCodeForToken(code, codeVerifier);
      console.log('[Microsoft Auth] Token de Azure AD obtenido');

      // Paso 3: Autenticar con Xbox Live
      const xboxToken = await this.authenticateWithXbox(azureToken.access_token);
      console.log('[Microsoft Auth] Autenticación con Xbox Live exitosa');

      // Paso 4: Obtener token XSTS de Xbox
      const xstsToken = await this.getXSTSToken(xboxToken.Token);
      console.log('[Microsoft Auth] Token XSTS obtenido');

      // Paso 5: Autenticar con Minecraft usando token XSTS
      const minecraftToken = await this.authenticateWithMinecraft(xstsToken.Token, xstsToken.DisplayClaims.xui[0].uhs);
      console.log('[Microsoft Auth] Autenticación con Minecraft exitosa');

      // Paso 6: Obtener perfil de Minecraft
      const profile = await this.getMinecraftProfile(minecraftToken.access_token);
      console.log('[Microsoft Auth] ✓ Autenticación exitosa para usuario:', profile.name);

      return {
        accessToken: minecraftToken.access_token,
        refreshToken: azureToken.refresh_token,
        expiresIn: minecraftToken.expires_in || 86400,
        selectedProfile: {
          id: profile.id,
          name: profile.name
        },
        user: {
          id: profile.id,
          username: profile.name
        }
      };
    } catch (error: any) {
      console.error('[Microsoft Auth] Error en authenticate:', error);
      throw new Error(`Error de autenticación: ${error.message || 'Error desconocido'}`);
    }
  }

  /**
   * Genera un par de código verifier y challenge para PKCE
   */
  private generatePKCE(): { codeVerifier: string; codeChallenge: string } {
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    return { codeVerifier, codeChallenge };
  }

  /**
   * Obtiene el código de autorización abriendo una ventana de Electron
   */
  private async getAuthorizationCode(): Promise<{ code: string; codeVerifier: string }> {
    const { codeVerifier, codeChallenge } = this.generatePKCE();
    const state = crypto.randomBytes(16).toString('hex');

    // Construir URL de autorización
    const authUrl = new URL(`${AUTHORITY}/oauth2/v2.0/authorize`);
    authUrl.searchParams.set('client_id', CLIENT_ID);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('response_mode', 'query');
    authUrl.searchParams.set('scope', SCOPES.join(' '));
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    authUrl.searchParams.set('state', state);

    console.log('[Microsoft Auth] Abriendo ventana de login...');

    // Crear ventana modal
    const mainWindow = BrowserWindow.getFocusedWindow();
    const authWindow = new BrowserWindow({
      width: 800,
      height: 600,
      show: false,
      parent: mainWindow || undefined,
      modal: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    authWindow.show();
    authWindow.loadURL(authUrl.toString());

    // Esperar el callback
    return new Promise((resolve, reject) => {
      authWindow.on('closed', () => {
        reject(new Error('Ventana de login cerrada por el usuario.'));
      });

      const handleNavigation = (url: string) => {
        try {
          console.log('[Microsoft Auth] Navegando a:', url);
          const parsedUrl = new URL(url);
          const redirectUrl = new URL(REDIRECT_URI);

          console.log('[Microsoft Auth] Comparando URLs:');
          console.log('  - URL actual:', parsedUrl.origin + parsedUrl.pathname);
          console.log('  - Redirect URI:', redirectUrl.origin + redirectUrl.pathname);

          // Verificar si es el redirect URI o si contiene parámetros de error/código
          const isRedirectUri = parsedUrl.origin + parsedUrl.pathname === redirectUrl.origin + redirectUrl.pathname;
          const hasError = parsedUrl.searchParams.has('error');
          const hasCode = parsedUrl.searchParams.has('code');

          if (isRedirectUri || hasError || hasCode) {
            const code = parsedUrl.searchParams.get('code');
            const error = parsedUrl.searchParams.get('error');
            const errorDescription = parsedUrl.searchParams.get('error_description');
            const errorUri = parsedUrl.searchParams.get('error_uri');
            const receivedState = parsedUrl.searchParams.get('state');

            console.log('[Microsoft Auth] Parámetros encontrados:', {
              code: code ? code.substring(0, 20) + '...' : null,
              error,
              errorDescription,
              errorUri,
              state: receivedState,
              expectedState: state
            });

            if (error) {
              authWindow.close();
              const fullError = errorDescription 
                ? `${error}: ${errorDescription}${errorUri ? ` (${errorUri})` : ''}`
                : error;
              console.error('[Microsoft Auth] Error de autenticación:', fullError);
              reject(new Error(fullError));
              return;
            }

            if (code) {
              if (receivedState !== state) {
                authWindow.close();
                console.error('[Microsoft Auth] State no coincide:', {
                  received: receivedState,
                  expected: state
                });
                reject(new Error('El state no coincide. Posible ataque CSRF.'));
                return;
              }
              authWindow.close();
              console.log('[Microsoft Auth] Código de autorización recibido correctamente');
              resolve({ code, codeVerifier });
              return;
            }
          }
        } catch (err: any) {
          console.error('[Microsoft Auth] Error al procesar navegación:', err);
          // Continuar navegación normal si no es nuestro redirect
        }
      };

        // Interceptar redirecciones
      authWindow.webContents.on('will-redirect', (event, url) => {
        console.log('[Microsoft Auth] will-redirect a:', url);
        try {
          const parsedUrl = new URL(url);
          const redirectUrl = new URL(REDIRECT_URI);
          const isRedirectUri = parsedUrl.origin + parsedUrl.pathname === redirectUrl.origin + redirectUrl.pathname;
          if (isRedirectUri || parsedUrl.searchParams.has('error') || parsedUrl.searchParams.has('code')) {
            event.preventDefault();
          }
        } catch (err) {
          // Continuar navegación normal
        }
        handleNavigation(url);
      });

      // Interceptar navegaciones
      authWindow.webContents.on('did-navigate', (event, url) => {
        console.log('[Microsoft Auth] did-navigate a:', url);
        handleNavigation(url);
      });

      // También interceptar cuando la URL cambia (para capturar errores en la misma página)
      authWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error('[Microsoft Auth] Error al cargar:', {
          errorCode,
          errorDescription,
          url: validatedURL
        });
      });

      // Timeout
      setTimeout(() => {
        if (!authWindow.isDestroyed()) {
          authWindow.close();
        }
        reject(new Error('Timeout: No se recibió respuesta del servidor de autenticación'));
      }, 300000);
    });
  }

  /**
   * Intercambia el código de autorización por un token de acceso de Azure AD
   */
  private async exchangeCodeForToken(code: string, codeVerifier: string): Promise<any> {
    const tokenUrl = `${AUTHORITY}/oauth2/v2.0/token`;
    
    const params = new URLSearchParams();
    params.append('client_id', CLIENT_ID);
    params.append('code', code);
    params.append('redirect_uri', REDIRECT_URI);
    params.append('grant_type', 'authorization_code');
    params.append('code_verifier', codeVerifier);
    params.append('scope', SCOPES.join(' '));

    console.log('[Microsoft Auth] Intercambiando código por token...');
    console.log('[Microsoft Auth] Token URL:', tokenUrl);
    console.log('[Microsoft Auth] Redirect URI:', REDIRECT_URI);

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const responseText = await response.text();
    console.log('[Microsoft Auth] Respuesta del servidor:', response.status, responseText.substring(0, 200));

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { error: 'unknown_error', error_description: responseText };
      }
      console.error('[Microsoft Auth] Error al intercambiar código:', errorData);
      throw new Error(errorData.error_description || errorData.error || `HTTP error! status: ${response.status}`);
    }

    const tokenData = JSON.parse(responseText);
    console.log('[Microsoft Auth] Token obtenido exitosamente');
    return tokenData;
  }

  /**
   * Autentica con Xbox Live usando el token de Azure AD
   */
  private async authenticateWithXbox(azureToken: string): Promise<any> {
    const response = await fetch(XBOX_LIVE_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        Properties: {
          AuthMethod: 'RPS',
          SiteName: 'user.auth.xboxlive.com',
          RpsTicket: `d=${azureToken}`
        },
        RelyingParty: 'http://auth.xboxlive.com',
        TokenType: 'JWT'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al autenticar con Xbox Live: ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Obtiene el token XSTS de Xbox para autenticación con Minecraft
   */
  private async getXSTSToken(xboxToken: string): Promise<any> {
    const response = await fetch(XSTS_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        Properties: {
          SandboxId: 'RETAIL',
          UserTokens: [xboxToken]
        },
        RelyingParty: 'rp://api.minecraftservices.com/',
        TokenType: 'JWT'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al obtener token XSTS: ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Autentica con Minecraft usando el token XSTS
   */
  private async authenticateWithMinecraft(xstsToken: string, userHash: string): Promise<any> {
    console.log('[Microsoft Auth] Autenticando con Minecraft...');
    console.log('[Microsoft Auth] UserHash:', userHash);
    console.log('[Microsoft Auth] XSTS Token (primeros 50 chars):', xstsToken.substring(0, 50) + '...');

    const response = await fetch(MINECRAFT_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'MinecraftLauncher/1.0'
      },
      body: JSON.stringify({
        identityToken: `XBL3.0 x=${userHash};${xstsToken}`
      })
    });

    const responseText = await response.text();
    console.log('[Microsoft Auth] Respuesta de Minecraft:', response.status, responseText.substring(0, 500));

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { errorMessage: responseText };
      }

      // Proporcionar un mensaje de error más útil
      if (errorData.errorMessage && errorData.errorMessage.includes('Invalid app registration')) {
        throw new Error(
          'La aplicación no está correctamente registrada en Azure AD para Minecraft.\n\n' +
          'Para solucionarlo:\n' +
          '1. Ve a https://portal.azure.com\n' +
          '2. Abre tu aplicación en Azure AD\n' +
          '3. Asegúrate de que el tipo de aplicación sea "Pública" o "Nativa"\n' +
          '4. Verifica que el permiso "XboxLive.signin" esté configurado\n' +
          '5. Asegúrate de que la aplicación esté publicada (no en modo desarrollo)\n\n' +
          'Más información: https://aka.ms/AppRegInfo'
        );
      }

      throw new Error(`Error al autenticar con Minecraft: ${errorData.errorMessage || responseText}`);
    }

    const tokenData = JSON.parse(responseText);
    console.log('[Microsoft Auth] Token de Minecraft obtenido exitosamente');
    return tokenData;
  }

  /**
   * Obtiene el perfil de Minecraft del usuario
   */
  private async getMinecraftProfile(accessToken: string): Promise<any> {
    const response = await fetch(MINECRAFT_PROFILE_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al obtener perfil de Minecraft: ${errorText}`);
    }

    return await response.json();
  }
}

// ===== Instancia por defecto =====

export const microsoftAuthClient = new MicrosoftAuthClient();
