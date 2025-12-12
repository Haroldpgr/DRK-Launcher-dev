/**
 * Componente de Pantalla de Login para Drk Launcher
 * Diseño limpio y moderno para autenticación
 */

import React, { useState } from 'react';
import { drkAuthService } from '../services/drkAuthService';
import { profileService } from '../services/profileService';
import { showModernAlert } from '../utils/uiUtils';
import Button from './Button';

type DrkLoginScreenProps = {
  onLoginSuccess?: (username: string) => void;
  onClose?: () => void;
};

export default function DrkLoginScreen({ onLoginSuccess, onClose }: DrkLoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      await showModernAlert(
        'Campos requeridos',
        'Por favor, ingresa tu usuario y contraseña.',
        'warning'
      );
      return;
    }

    setIsLoading(true);

    try {
      const result = await drkAuthService.authenticate(username.trim(), password);

      if (result && result.success && result.selectedProfile) {
        // Autenticación exitosa
        // Guardar tokens si están disponibles
        profileService.addProfile(
          result.selectedProfile.name,
          'drkauth',
          {
            accessToken: result.accessToken,
            clientToken: result.clientToken
          }
        );

        await showModernAlert(
          '¡Bienvenido!',
          `Has iniciado sesión como ${result.selectedProfile.name}`,
          'success'
        );

        // Limpiar campos
        setUsername('');
        setPassword('');

        // Llamar callback de éxito
        if (onLoginSuccess) {
          onLoginSuccess(result.selectedProfile.name);
        }
      } else {
        const errorMessage = result?.error || 'Credenciales incorrectas. Por favor, verifica tu usuario y contraseña.';
        await showModernAlert(
          'Error de autenticación',
          errorMessage,
          'error'
        );
      }
    } catch (error: any) {
      console.error('Error al autenticar con Drk Launcher:', error);
      await showModernAlert(
        'Error de conexión',
        'No se pudo conectar con el servidor de autenticación. Por favor, verifica tu conexión e inténtalo de nuevo.',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && username.trim() && password.trim()) {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo y Título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl mb-4 shadow-lg shadow-cyan-500/50">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Drk Launcher</h1>
          <p className="text-gray-400">Inicia sesión para continuar</p>
        </div>

        {/* Card de Login */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 p-8">
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
            {/* Campo Usuario/Email */}
            <div className="mb-6">
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Usuario o Email
              </label>
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  placeholder="Ingresa tu usuario o email"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  autoComplete="username"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
              </div>
            </div>

            {/* Campo Contraseña */}
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  placeholder="Ingresa tu contraseña"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Botón de Login */}
            <Button
              type="submit"
              onClick={handleLogin}
              disabled={isLoading || !username.trim() || !password.trim()}
              className={`w-full py-3 px-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg ${
                isLoading || !username.trim() || !password.trim()
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 text-white shadow-cyan-500/40 hover:shadow-cyan-500/50 transform hover:-translate-y-0.5'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Autenticando...
                </span>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>

          {/* Información adicional */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              ¿No tienes cuenta?{' '}
              <a href="#" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                Regístrate aquí
              </a>
            </p>
          </div>

          {/* Botón de cerrar (si se proporciona) */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-300 transition-colors"
              aria-label="Cerrar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            © 2024 Drk Launcher. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}

