/**
 * Tipos TypeScript para el protocolo de autenticación Drk Launcher
 * Basado en el protocolo Yggdrasil (Mojang Legacy Auth)
 */

export interface AuthenticateRequest {
  agent: {
    name: string; // "Minecraft"
    version: number; // 1
  };
  username: string; // Email o nombre de usuario
  password: string; // Contraseña en texto plano
  clientToken?: string; // Token único del cliente (opcional)
  requestUser?: boolean; // Si se solicita información del usuario
}

export interface AuthenticateResponse {
  accessToken: string; // Token de acceso
  clientToken: string; // Token del cliente
  selectedProfile: {
    id: string; // UUID sin guiones
    name: string; // Nombre de usuario
  };
  availableProfiles?: Array<{
    id: string;
    name: string;
  }>;
  user?: {
    id: string; // UUID del usuario
    username: string;
    properties?: Array<{
      name: string;
      value: string;
    }>;
  };
}

export interface RefreshRequest {
  accessToken: string;
  clientToken: string;
  selectedProfile?: {
    id: string;
    name: string;
  };
  requestUser?: boolean;
}

export interface RefreshResponse {
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

export interface ValidateRequest {
  accessToken: string;
  clientToken?: string;
}

export interface ErrorResponse {
  error: string;
  errorMessage: string;
  cause?: string;
}

export interface User {
  id: string; // UUID
  username: string;
  email: string;
  passwordHash: string; // Hash bcrypt
  createdAt: Date;
  lastLogin?: Date;
}

export interface Session {
  accessToken: string;
  clientToken: string;
  userId: string;
  username: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface Profile {
  id: string; // UUID
  userId: string;
  name: string; // Nombre de usuario de Minecraft
  createdAt: Date;
}

