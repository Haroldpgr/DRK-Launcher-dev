import React, { useState } from 'react';
import Button from './Button'; // Assuming Button component is available
import { elyByService } from '../services/elyByService';
import { yggdrasilService } from '../services/yggdrasilService';
import { drkAuthService } from '../services/drkAuthService';
import { showModernAlert } from '../utils/uiUtils';

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onMicrosoftLogin: () => void;
  onNonPremiumLogin: (username: string) => void;
  onElyByLogin?: (username: string) => void;
};

export default function LoginModal({ isOpen, onClose, onMicrosoftLogin, onNonPremiumLogin, onElyByLogin }: LoginModalProps) {
  const [nonPremiumUsername, setNonPremiumUsername] = useState('');
  const [elyByUsername, setElyByUsername] = useState('');
  const [elyByPassword, setElyByPassword] = useState('');
  const [elyByTotpToken, setElyByTotpToken] = useState('');
  const [elyByRequires2FA, setElyByRequires2FA] = useState(false);
  const [elyByClientToken, setElyByClientToken] = useState<string | null>(null);
  const [isElyByAuthenticating, setIsElyByAuthenticating] = useState(false);
  const [selectedLoginType, setSelectedLoginType] = useState<'none' | 'microsoft' | 'non-premium' | 'elyby' | 'littleskin' | 'yggdrasil' | 'drkauth'>('none');
  const [isLittleSkinAuthenticating, setIsLittleSkinAuthenticating] = useState(false);
  const [showOtherMethods, setShowOtherMethods] = useState(false);
  const [yggdrasilUsername, setYggdrasilUsername] = useState('');
  const [yggdrasilPassword, setYggdrasilPassword] = useState('');
  const [isYggdrasilAuthenticating, setIsYggdrasilAuthenticating] = useState(false);
  const [drkAuthUsername, setDrkAuthUsername] = useState('');
  const [drkAuthPassword, setDrkAuthPassword] = useState('');
  const [isDrkAuthAuthenticating, setIsDrkAuthAuthenticating] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleNonPremiumSubmit = () => {
    if (nonPremiumUsername.trim()) {
      onNonPremiumLogin(nonPremiumUsername.trim());
      setNonPremiumUsername(''); // Clear input after submission
      setSelectedLoginType('none'); // Reset selection after login
    }
  };

  const handleMicrosoftClick = () => {
    setSelectedLoginType('microsoft');
  };

  const handleMicrosoftLoginConfirm = () => {
    onMicrosoftLogin(); // Call parent handler to initiate Microsoft login flow
  };

  const handleBack = () => {
    setSelectedLoginType('none');
    setNonPremiumUsername(''); // Clear input when going back
    setElyByUsername('');
    setElyByPassword('');
    setElyByTotpToken('');
    setElyByRequires2FA(false);
    setElyByClientToken(null);
    setIsElyByAuthenticating(false);
    setYggdrasilUsername('');
    setYggdrasilPassword('');
    setIsYggdrasilAuthenticating(false);
    setDrkAuthUsername('');
    setDrkAuthPassword('');
    setIsDrkAuthAuthenticating(false);
  };

  const handleDrkAuthLogin = async () => {
    if (!drkAuthUsername.trim() || !drkAuthPassword.trim() || isDrkAuthAuthenticating) {
      return;
    }

    setIsDrkAuthAuthenticating(true);
    
    try {
      const result = await drkAuthService.authenticate(
        drkAuthUsername.trim(),
        drkAuthPassword
      );
      
      if (result && result.success && result.selectedProfile) {
        // Autenticación exitosa, agregar al perfil
        const profileService = await import('../services/profileService');
        profileService.profileService.addProfile(
          result.selectedProfile.name,
          'drkauth',
          {
            accessToken: result.accessToken,
            clientToken: result.clientToken
          }
        );
        
        if (onElyByLogin) {
          onElyByLogin(result.selectedProfile.name);
        }
        
        setDrkAuthUsername('');
        setDrkAuthPassword('');
        setSelectedLoginType('none');
        setIsDrkAuthAuthenticating(false);
      } else {
        const errorMessage = result?.error || 'Credenciales incorrectas. Por favor, verifica tu usuario y contraseña.';
        await showModernAlert(
          'Error de autenticación',
          errorMessage,
          'error'
        );
        setIsDrkAuthAuthenticating(false);
      }
    } catch (error: any) {
      console.error('Error al autenticar con Drk Launcher:', error);
      await showModernAlert(
        'Error de conexión',
        'No se pudo conectar con el servidor de autenticación. Por favor, verifica que el servidor esté ejecutándose en http://localhost:3000',
        'error'
      );
      setIsDrkAuthAuthenticating(false);
    }
  };

  const handleYggdrasilLogin = async () => {
    if (!yggdrasilUsername.trim() || !yggdrasilPassword.trim() || isYggdrasilAuthenticating) {
      return;
    }

    setIsYggdrasilAuthenticating(true);
    
    try {
      const result = await yggdrasilService.authenticate(
        yggdrasilUsername.trim(),
        yggdrasilPassword
      );
      
      if (result && result.success && result.selectedProfile) {
        // Autenticación exitosa, agregar al perfil
        // Guardar tokens si están disponibles
        const profileService = await import('../services/profileService');
        profileService.profileService.addProfile(
          result.selectedProfile.name,
          'yggdrasil',
          {
            accessToken: result.accessToken,
            clientToken: result.clientToken
          }
        );
        // Usar el mismo handler que Ely.by ya que ambos agregan perfiles
        if (onElyByLogin) {
          onElyByLogin(result.selectedProfile.name);
        }
        setYggdrasilUsername('');
        setYggdrasilPassword('');
        setSelectedLoginType('none');
        setIsYggdrasilAuthenticating(false);
      } else {
        const errorMessage = result?.error || 'Credenciales incorrectas. Por favor, verifica tu usuario y contraseña.';
        await showModernAlert(
          'Error de autenticación',
          errorMessage,
          'error'
        );
        setIsYggdrasilAuthenticating(false);
      }
    } catch (error: any) {
      console.error('Error al autenticar con Yggdrasil:', error);
      await showModernAlert(
        'Error de conexión',
        'No se pudo conectar con el servidor Yggdrasil. Por favor, verifica tu conexión e inténtalo de nuevo.',
        'error'
      );
      setIsYggdrasilAuthenticating(false);
    }
  };

  const handleElyByLogin = async () => {
    if (!elyByUsername.trim() || !elyByPassword.trim() || isElyByAuthenticating || !onElyByLogin) {
      return;
    }

    // Si requiere 2FA pero no se ha ingresado el token
    if (elyByRequires2FA && !elyByTotpToken.trim()) {
      await showModernAlert(
        'Token requerido',
        'Por favor, ingresa el código de verificación de dos factores.',
        'warning'
      );
      return;
    }

    setIsElyByAuthenticating(true);
    
    try {
      // Autenticar con Ely.by usando username/email y contraseña
      // Si requiere 2FA, incluir el token TOTP
      const result = await elyByService.authenticate(
        elyByUsername.trim(), 
        elyByPassword,
        elyByRequires2FA ? elyByTotpToken.trim() : undefined
      );
      
      if (result && result.success && result.selectedProfile) {
        // Autenticación exitosa, agregar al perfil usando el nombre de usuario del perfil
        onElyByLogin(result.selectedProfile.name);
        setElyByUsername('');
        setElyByPassword('');
        setElyByTotpToken('');
        setElyByRequires2FA(false);
        setElyByClientToken(null);
        setSelectedLoginType('none');
        setIsElyByAuthenticating(false);
      } else if (result && result.requires2FA) {
        // La cuenta requiere autenticación de dos factores
        setElyByRequires2FA(true);
        setElyByClientToken(result.clientToken || null);
        setIsElyByAuthenticating(false);
        await showModernAlert(
          'Autenticación de dos factores',
          'Esta cuenta está protegida con autenticación de dos factores. Por favor, ingresa el código de verificación de tu aplicación de autenticación.',
          'info'
        );
      } else {
        // Error en la autenticación
        const errorMessage = result?.error || 'Credenciales incorrectas. Por favor, verifica tu correo/nombre de usuario y contraseña.';
        await showModernAlert(
          'Error de autenticación',
          errorMessage,
          'error'
        );
        setIsElyByAuthenticating(false);
        // Si había un intento de 2FA fallido, resetear
        if (elyByRequires2FA) {
          setElyByRequires2FA(false);
          setElyByTotpToken('');
          setElyByClientToken(null);
        }
      }
    } catch (error: any) {
      console.error('Error al autenticar usuario en Ely.by:', error);
      await showModernAlert(
        'Error de conexión',
        'No se pudo conectar con Ely.by. Por favor, verifica tu conexión e inténtalo de nuevo.',
        'error'
      );
      setIsElyByAuthenticating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto custom-scrollbar">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700/50 relative backdrop-blur-md my-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
        
        <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-4 md:mb-6 text-center pr-8">Iniciar Sesión</h2>

        <div className="space-y-3 md:space-y-4">
          <p className="text-gray-300 text-center mb-3 md:mb-4 font-medium text-sm md:text-base">Selecciona tu método de inicio de sesión:</p>

          {/* Microsoft Option */}
          <div
            onClick={handleMicrosoftClick}
            className={`w-full cursor-pointer p-4 rounded-xl transition-all duration-300 shadow-lg border-2 ${
              selectedLoginType === 'microsoft'
                ? 'border-blue-500 bg-blue-900/30'
                : 'border-gray-700 bg-gray-700/50 hover:border-gray-600 hover:bg-gray-700/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm10 0a2 2 0 012 2v6a2 2 0 01-2 2h-2V5h2z"></path>
                </svg>
                <div className="text-left">
                  <div className="text-white font-semibold">Iniciar sesión con Microsoft</div>
                  <div className="text-xs text-gray-400">Próximamente disponible</div>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedLoginType === 'microsoft' ? 'border-blue-500 bg-blue-500' : 'border-gray-500'
              }`}>
                {selectedLoginType === 'microsoft' && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                  </svg>
                )}
              </div>
            </div>
          </div>

          {/* Non-Premium Option */}
          <div
            onClick={() => setSelectedLoginType('non-premium')}
            className={`w-full cursor-pointer p-3 md:p-4 rounded-xl transition-all duration-300 shadow-lg border-2 ${
              selectedLoginType === 'non-premium'
                ? 'border-emerald-500 bg-emerald-900/30'
                : 'border-gray-700 bg-gray-700/50 hover:border-gray-600 hover:bg-gray-700/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                </svg>
                <div className="text-left">
                  <div className="text-white font-semibold text-sm md:text-base">Iniciar sesión no premium</div>
                  <div className="text-xs text-gray-400">Para usuarios sin cuenta premium</div>
                </div>
              </div>
              <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full border-2 flex items-center justify-center ${
                selectedLoginType === 'non-premium' ? 'border-emerald-500 bg-emerald-500' : 'border-gray-500'
              }`}>
                {selectedLoginType === 'non-premium' && (
                  <svg className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                  </svg>
                )}
              </div>
            </div>
          </div>

          {/* Botón "Otros métodos de inicio de sesión" */}
          <div className="mt-3 pt-3 border-t border-gray-700/50">
            <button
              onClick={() => setShowOtherMethods(!showOtherMethods)}
              className="w-full p-3 rounded-xl transition-all duration-300 shadow-lg border-2 border-gray-700 bg-gray-700/50 hover:border-gray-600 hover:bg-gray-700/70 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                <span className="text-white font-semibold text-sm md:text-base">Otros métodos de inicio de sesión</span>
              </div>
              <svg 
                className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${showOtherMethods ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>

            {/* Métodos alternativos (colapsable) */}
            {showOtherMethods && (
              <div className="mt-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
                {/* LittleSkin Option */}
                <div
                  onClick={() => setSelectedLoginType('littleskin')}
                  className={`w-full cursor-pointer p-3 md:p-4 rounded-xl transition-all duration-300 shadow-lg border-2 ${
                    selectedLoginType === 'littleskin'
                      ? 'border-green-500 bg-green-900/30'
                      : 'border-gray-700 bg-gray-700/50 hover:border-gray-600 hover:bg-gray-700/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 md:w-6 md:h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                      </svg>
                      <div className="text-left">
                        <div className="text-white font-semibold text-sm md:text-base">Iniciar sesión con LittleSkin</div>
                        <div className="text-xs text-gray-400">OAuth 2.0 - Alternativa estable</div>
                      </div>
                    </div>
                    <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedLoginType === 'littleskin' ? 'border-green-500 bg-green-500' : 'border-gray-500'
                    }`}>
                      {selectedLoginType === 'littleskin' && (
                        <svg className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                        </svg>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ely.by Option */}
                <div
                  onClick={() => setSelectedLoginType('elyby')}
                  className={`w-full cursor-pointer p-3 md:p-4 rounded-xl transition-all duration-300 shadow-lg border-2 ${
                    selectedLoginType === 'elyby'
                      ? 'border-purple-500 bg-purple-900/30'
                      : 'border-gray-700 bg-gray-700/50 hover:border-gray-600 hover:bg-gray-700/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 md:w-6 md:h-6 text-purple-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                      </svg>
                      <div className="text-left">
                        <div className="text-white font-semibold text-sm md:text-base">Iniciar sesión con Ely.by</div>
                        <div className="text-xs text-gray-400">Sistema alternativo de skins y autenticación</div>
                      </div>
                    </div>
                    <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedLoginType === 'elyby' ? 'border-purple-500 bg-purple-500' : 'border-gray-500'
                    }`}>
                      {selectedLoginType === 'elyby' && (
                        <svg className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                        </svg>
                      )}
                    </div>
                  </div>
                </div>

                {/* Drk Launcher Option */}
                <div
                  onClick={() => setSelectedLoginType('drkauth')}
                  className={`w-full cursor-pointer p-3 md:p-4 rounded-xl transition-all duration-300 shadow-lg border-2 ${
                    selectedLoginType === 'drkauth'
                      ? 'border-cyan-500 bg-cyan-900/30'
                      : 'border-gray-700 bg-gray-700/50 hover:border-gray-600 hover:bg-gray-700/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 md:w-6 md:h-6 text-cyan-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                      </svg>
                      <div className="text-left">
                        <div className="text-white font-semibold text-sm md:text-base">Iniciar sesión con Drk Launcher</div>
                        <div className="text-xs text-gray-400">Servidor de autenticación oficial</div>
                      </div>
                    </div>
                    <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedLoginType === 'drkauth' ? 'border-cyan-500 bg-cyan-500' : 'border-gray-500'
                    }`}>
                      {selectedLoginType === 'drkauth' && (
                        <svg className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Additional content based on selection - with consistent container */}
          {selectedLoginType === 'non-premium' && (
            <div className="space-y-4 mt-2">
              <div className="relative mx-auto max-w-full">
                <input
                  type="text"
                  placeholder="Nombre de usuario"
                  className="w-full p-4 rounded-xl bg-gray-800/80 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-lg text-lg transition-all duration-300"
                  value={nonPremiumUsername}
                  onChange={(e) => setNonPremiumUsername(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleNonPremiumSubmit();
                    }
                  }}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
              </div>
              <Button
                onClick={handleNonPremiumSubmit}
                disabled={!nonPremiumUsername.trim()}
                className={`w-full py-4 px-4 rounded-xl transition-all duration-300 shadow-lg text-lg font-semibold ${
                  nonPremiumUsername.trim()
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/40 hover:shadow-emerald-500/50 transform hover:-translate-y-0.5'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                Iniciar sesión
              </Button>
            </div>
          )}

          {selectedLoginType === 'microsoft' && (
            <div className="space-y-4 mt-2">
              <div className="bg-gradient-to-br from-blue-900/90 to-indigo-900/90 text-white p-5 rounded-xl shadow-xl border border-blue-700/40 backdrop-blur-sm">
                <div className="flex justify-center mb-3">
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm10 0a2 2 0 012 2v6a2 2 0 01-2 2h-2V5h2z"></path>
                  </svg>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold mb-2">Inicio de Sesión con Microsoft</h3>
                  <p className="text-blue-200 text-sm mb-3">Esta funcionalidad está en desarrollo</p>
                  <div className="inline-block bg-blue-700/80 text-blue-100 px-4 py-1.5 rounded-full text-sm font-semibold mx-auto">
                    Próximamente
                  </div>
                </div>
              </div>
              <Button
                onClick={handleMicrosoftLoginConfirm}
                className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-lg shadow-blue-500/40 hover:shadow-blue-500/50 transition-all duration-300 transform hover:-translate-y-0.5 rounded-xl"
              >
                Iniciar sesión con Microsoft
              </Button>
            </div>
          )}

          {selectedLoginType === 'littleskin' && (
            <div className="space-y-4 mt-2">
              <div className="bg-gradient-to-br from-green-900/90 to-emerald-900/90 text-white p-5 rounded-xl shadow-xl border border-green-700/40 backdrop-blur-sm">
                <div className="flex justify-center mb-3">
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                </div>
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold mb-2">Inicio de Sesión con LittleSkin</h3>
                  <p className="text-green-200 text-sm mb-3">Usa OAuth 2.0 para una autenticación segura</p>
                  <a 
                    href="https://littleskin.cn/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block bg-green-700/80 text-green-100 px-4 py-1.5 rounded-full text-sm font-semibold mx-auto hover:bg-green-600/80 transition-colors mb-3"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    Visitar LittleSkin
                  </a>
                </div>
              </div>
              
              {/* Explicación del flujo OAuth */}
              <div className="mb-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-200 text-center">
                  <span className="font-semibold">💡 Método OAuth 2.0:</span> Al hacer clic, se abrirá tu navegador 
                  para que inicies sesión directamente en la página de LittleSkin. No necesitas escribir nada aquí.
                </p>
              </div>
              
              <Button
                onClick={async () => {
                  if (isLittleSkinAuthenticating) return;
                  
                  setIsLittleSkinAuthenticating(true);
                  try {
                    const result = await window.api.littleskin.startOAuth();
                    
                    if (result && result.success && result.selectedProfile) {
                      if (onElyByLogin) {
                        onElyByLogin(result.selectedProfile.name);
                      }
                      setSelectedLoginType('none');
                      setIsLittleSkinAuthenticating(false);
                    } else {
                      await showModernAlert(
                        'Error de autenticación',
                        result?.error || 'No se pudo completar la autenticación con LittleSkin.',
                        'error'
                      );
                      setIsLittleSkinAuthenticating(false);
                    }
                  } catch (error: any) {
                    console.error('Error al autenticar con LittleSkin:', error);
                    await showModernAlert(
                      'Error de conexión',
                      'No se pudo conectar con LittleSkin. Por favor, verifica tu conexión e inténtalo de nuevo.',
                      'error'
                    );
                    setIsLittleSkinAuthenticating(false);
                  }
                }}
                disabled={isLittleSkinAuthenticating}
                className={`w-full py-4 px-4 rounded-xl transition-all duration-300 shadow-lg text-lg font-semibold ${
                  !isLittleSkinAuthenticating
                    ? 'bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white shadow-green-500/40 hover:shadow-green-500/50 transform hover:-translate-y-0.5'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLittleSkinAuthenticating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Abriendo navegador...
                  </span>
                ) : (
                  'Iniciar sesión con OAuth 2.0'
                )}
              </Button>
            </div>
          )}

          {selectedLoginType === 'elyby' && (
            <div className="space-y-4 mt-2">
              <div className="bg-gradient-to-br from-purple-900/90 to-pink-900/90 text-white p-5 rounded-xl shadow-xl border border-purple-700/40 backdrop-blur-sm">
                <div className="flex justify-center mb-3">
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                </div>
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold mb-2">Inicio de Sesión con Ely.by</h3>
                  <p className="text-purple-200 text-sm mb-3">Usa OAuth 2.0 para una autenticación segura</p>
                  <a 
                    href="https://ely.by/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block bg-purple-700/80 text-purple-100 px-4 py-1.5 rounded-full text-sm font-semibold mx-auto hover:bg-purple-600/80 transition-colors mb-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open('https://ely.by/', '_blank');
                    }}
                  >
                    Visitar Ely.by
                  </a>
                </div>
              </div>
              
              {/* Explicación del flujo OAuth */}
              <div className="mb-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                <p className="text-sm text-purple-200 text-center">
                  <span className="font-semibold">💡 Método OAuth 2.0:</span> Al hacer clic, se abrirá tu navegador 
                  para que inicies sesión directamente en la página de Ely.by. No necesitas escribir nada aquí.
                </p>
              </div>
              
              <Button
                onClick={async () => {
                  if (isElyByAuthenticating) return;
                  
                  setIsElyByAuthenticating(true);
                  
                  try {
                    // Usar OAuth 2.0 con PKCE (método recomendado)
                    if (window.api?.elyby?.startOAuth) {
                      const result = await window.api.elyby.startOAuth();
                      
                      if (result && result.success && result.selectedProfile) {
                        // Autenticación exitosa, agregar al perfil
                        onElyByLogin(result.selectedProfile.name);
                        setElyByUsername('');
                        setElyByPassword('');
                        setElyByTotpToken('');
                        setElyByRequires2FA(false);
                        setElyByClientToken(null);
                        setSelectedLoginType('none');
                        setIsElyByAuthenticating(false);
                      } else {
                        const errorMessage = result?.error || 'Error al autenticar con OAuth';
                        await showModernAlert(
                          'Error de autenticación',
                          errorMessage,
                          'error'
                        );
                        setIsElyByAuthenticating(false);
                      }
                    } else {
                      await showModernAlert(
                        'Error',
                        'OAuth 2.0 no está disponible. Por favor, usa el método directo.',
                        'error'
                      );
                      setIsElyByAuthenticating(false);
                    }
                  } catch (error: any) {
                    console.error('Error al iniciar OAuth de Ely.by:', error);
                    await showModernAlert(
                      'Error de conexión',
                      error.message || 'No se pudo iniciar la autenticación OAuth. Por favor, verifica tu conexión e inténtalo de nuevo.',
                      'error'
                    );
                    setIsElyByAuthenticating(false);
                  }
                }}
                disabled={isElyByAuthenticating}
                className={`w-full py-4 px-4 rounded-xl transition-all duration-300 shadow-lg text-lg font-semibold ${
                  !isElyByAuthenticating
                    ? 'bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800 text-white shadow-purple-500/40 hover:shadow-purple-500/50 transform hover:-translate-y-0.5'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isElyByAuthenticating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Abriendo navegador...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                    Iniciar sesión con OAuth 2.0 (PKCE)
                  </span>
                )}
              </Button>
              
              {/* Botón alternativo para método directo (oculto por defecto) */}
              <div className="mt-3 pt-3 border-t border-gray-700 hidden">
                <p className="text-center text-xs text-gray-400 mb-3">
                  ¿Prefieres usar usuario y contraseña directamente?
                </p>
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Correo o nombre de usuario"
                      className="w-full p-3 rounded-xl bg-gray-800/80 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-lg text-base transition-all duration-300"
                      value={elyByUsername}
                      onChange={(e) => setElyByUsername(e.target.value)}
                      disabled={isElyByAuthenticating}
                    />
                  </div>
                  
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="Contraseña"
                      className="w-full p-3 rounded-xl bg-gray-800/80 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-lg text-base transition-all duration-300"
                      value={elyByPassword}
                      onChange={(e) => setElyByPassword(e.target.value)}
                      disabled={isElyByAuthenticating || elyByRequires2FA}
                      onKeyPress={async (e) => {
                        if (e.key === 'Enter' && elyByUsername.trim() && elyByPassword.trim() && !isElyByAuthenticating) {
                          await handleElyByLogin();
                        }
                      }}
                    />
                  </div>
                  
                  {/* Campo para token de autenticación de dos factores */}
                  {elyByRequires2FA && (
                    <div className="relative">
                      <div className="mb-2 text-sm text-purple-300 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                        </svg>
                        Código de verificación (2FA)
                      </div>
                      <input
                        type="text"
                        placeholder="Ingresa el código de 6 dígitos"
                        className="w-full p-3 rounded-xl bg-gray-800/80 text-white border-2 border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-lg text-base transition-all duration-300"
                        value={elyByTotpToken}
                        onChange={(e) => setElyByTotpToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        disabled={isElyByAuthenticating}
                        maxLength={6}
                        autoFocus
                        onKeyPress={async (e) => {
                          if (e.key === 'Enter' && elyByTotpToken.trim().length === 6 && !isElyByAuthenticating) {
                            await handleElyByLogin();
                          }
                        }}
                      />
                    </div>
                  )}
                  
                  <Button
                    onClick={handleElyByLogin}
                    disabled={
                      !elyByUsername.trim() || 
                      !elyByPassword.trim() || 
                      isElyByAuthenticating || 
                      (elyByRequires2FA && elyByTotpToken.trim().length !== 6)
                    }
                    variant="secondary"
                    className="w-full py-2 px-4 text-sm"
                  >
                    {isElyByAuthenticating 
                      ? (elyByRequires2FA ? 'Verificando código...' : 'Autenticando...') 
                      : (elyByRequires2FA ? 'Verificar código' : 'Método directo (usuario/contraseña)')
                    }
                  </Button>
                </div>
              </div>
            </div>
          )}


          {selectedLoginType === 'drkauth' && (
            <div className="space-y-4 mt-2">
              <div className="bg-gradient-to-br from-cyan-900/90 to-blue-900/90 text-white p-5 rounded-xl shadow-xl border border-cyan-700/40 backdrop-blur-sm">
                <div className="flex justify-center mb-3">
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                </div>
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold mb-2">Inicio de Sesión con Drk Launcher</h3>
                  <p className="text-cyan-200 text-sm mb-3">Usa la página web para registrarte o iniciar sesión</p>
                  <a 
                    href="http://localhost:3000/login" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block bg-cyan-700/80 text-cyan-100 px-4 py-1.5 rounded-full text-sm font-semibold mx-auto hover:bg-cyan-600/80 transition-colors mb-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open('http://localhost:3000/login', '_blank');
                    }}
                  >
                    Visitar página de Drk Launcher
                  </a>
                </div>
              </div>
              
              {/* Explicación del flujo */}
              <div className="mb-4 p-3 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                <p className="text-sm text-cyan-200 text-center">
                  <span className="font-semibold">💡 Método Web:</span> Al hacer clic en el botón, se abrirá tu navegador 
                  para que puedas registrarte o iniciar sesión directamente en la página de Drk Launcher.
                </p>
              </div>
              
              <Button
                onClick={async () => {
                  if (isDrkAuthAuthenticating) return;
                  
                  setIsDrkAuthAuthenticating(true);
                  
                  try {
                    // Abrir la página web en una nueva ventana
                    const authWindow = window.open('http://localhost:3000/login', 'drkAuth', 'width=500,height=700,resizable=yes,scrollbars=yes');
                    
                    if (!authWindow) {
                      throw new Error('No se pudo abrir la ventana. Verifica que los popups estén permitidos.');
                    }

                    // Función para procesar el éxito de autenticación
                    const handleAuthSuccess = async (authData: any) => {
                      console.log('[LoginModal] handleAuthSuccess llamado con:', {
                        hasAuthData: !!authData,
                        hasSelectedProfile: !!authData?.selectedProfile,
                        hasAccessToken: !!authData?.accessToken,
                        hasClientToken: !!authData?.clientToken,
                        accessTokenLength: authData?.accessToken?.length,
                        clientTokenLength: authData?.clientToken?.length,
                        authDataKeys: authData ? Object.keys(authData) : []
                      });
                      
                      // Cerrar la ventana de autenticación
                      if (authWindow && !authWindow.closed) {
                        authWindow.close();
                      }
                      
                      // Remover el listener
                      window.removeEventListener('message', messageHandler);
                      
                      // Verificar que tenemos los datos necesarios
                      if (!authData || !authData.selectedProfile || !authData.selectedProfile.name) {
                        console.error('[LoginModal] Datos de autenticación incompletos:', authData);
                        await showModernAlert(
                          'Error',
                          'Datos de autenticación incompletos. Por favor, intenta de nuevo.',
                          'error'
                        );
                        setIsDrkAuthAuthenticating(false);
                        return;
                      }
                      
                      // Agregar el perfil al launcher
                      try {
                        const profileService = await import('../services/profileService');
                        console.log('[LoginModal] Agregando perfil DRK:', authData.selectedProfile.name);
                        console.log('[LoginModal] Tokens disponibles:', {
                          accessToken: authData.accessToken ? `${authData.accessToken.substring(0, 20)}...` : 'NO HAY',
                          clientToken: authData.clientToken ? `${authData.clientToken.substring(0, 20)}...` : 'NO HAY'
                        });
                        
                        const newProfile = profileService.profileService.addProfile(
                          authData.selectedProfile.name,
                          'drkauth', // Asegurar que el tipo sea 'drkauth'
                          {
                            accessToken: authData.accessToken,
                            clientToken: authData.clientToken
                          }
                        );
                        console.log('[LoginModal] Perfil agregado:', newProfile);
                        console.log('[LoginModal] Tipo del perfil:', newProfile.type);
                        console.log('[LoginModal] Token guardado en perfil:', {
                          hasAccessToken: !!newProfile.accessToken,
                          accessTokenLength: newProfile.accessToken?.length,
                          hasClientToken: !!newProfile.clientToken,
                          clientTokenLength: newProfile.clientToken?.length
                        });
                        
                        // También guardar en localStorage como respaldo
                        if (authData.accessToken) {
                          try {
                            localStorage.setItem('drkAuthData', JSON.stringify({
                              accessToken: authData.accessToken,
                              clientToken: authData.clientToken,
                              selectedProfile: authData.selectedProfile,
                              availableProfiles: authData.availableProfiles,
                              user: authData.user
                            }));
                            console.log('[LoginModal] Token guardado también en localStorage como respaldo');
                          } catch (e) {
                            console.error('[LoginModal] Error al guardar en localStorage:', e);
                          }
                        }
                        
                        // Forzar actualización de la lista de perfiles en App.tsx
                        // Esto asegura que el componente se re-renderice con el tipo correcto
                        window.dispatchEvent(new CustomEvent('profileUpdated'));
                        
                        // NO llamar a onElyByLogin porque ya agregamos el perfil con el tipo correcto
                        // onElyByLogin agregaría el perfil de nuevo y podría cambiar el tipo
                        // Solo cerrar el modal
                        setSelectedLoginType('none');
                        setIsDrkAuthAuthenticating(false);
                        
                        // Cerrar el modal de login
                        onClose();
                        
                        await showModernAlert(
                          '¡Éxito!',
                          `Has iniciado sesión como ${authData.selectedProfile.name}`,
                          'success'
                        );
                      } catch (error: any) {
                        console.error('Error al agregar perfil:', error);
                        await showModernAlert(
                          'Error',
                          'Error al agregar la cuenta al launcher: ' + (error.message || 'Error desconocido'),
                          'error'
                        );
                        setIsDrkAuthAuthenticating(false);
                      }
                    };

                    // Escuchar mensajes de la página de autenticación
                    const messageHandler = async (event: MessageEvent) => {
                      console.log('[LoginModal] Mensaje recibido:', {
                        origin: event.origin,
                        type: event.data?.type,
                        hasData: !!event.data?.data,
                        fullEventData: event.data
                      });
                      
                      // Verificar origen por seguridad (en desarrollo local)
                      // Permitir localhost y 127.0.0.1, y también 'null' para file:// protocol
                      const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000', 'null', 'file://'];
                      const isAllowedOrigin = allowedOrigins.some(origin => 
                        event.origin.includes(origin) || event.origin === origin || event.origin.startsWith('file://')
                      );
                      
                      if (!isAllowedOrigin) {
                        console.warn('[LoginModal] Origen no permitido:', event.origin);
                        return;
                      }

                      if (event.data && event.data.type === 'DRK_AUTH_SUCCESS') {
                        const authData = event.data.data;
                        console.log('[LoginModal] Datos de autenticación recibidos:', {
                          hasAuthData: !!authData,
                          keys: authData ? Object.keys(authData) : [],
                          hasAccessToken: !!authData?.accessToken,
                          hasClientToken: !!authData?.clientToken,
                          hasSelectedProfile: !!authData?.selectedProfile
                        });
                        await handleAuthSuccess(authData);
                      } else {
                        console.log('[LoginModal] Mensaje recibido pero no es DRK_AUTH_SUCCESS:', event.data);
                      }
                    };

                    // Agregar listener para mensajes
                    window.addEventListener('message', messageHandler);
                    
                    // Verificar si la ventana se cerró manualmente y cerrar sesión si es necesario
                    const checkClosed = setInterval(async () => {
                      if (authWindow.closed) {
                        clearInterval(checkClosed);
                        window.removeEventListener('message', messageHandler);
                        setIsDrkAuthAuthenticating(false);
                        
                        // Si la ventana se cerró sin autenticación exitosa, 
                        // intentar cerrar la sesión en la web si existe
                        try {
                          const { profileService } = await import('../services/profileService');
                          const currentProfile = profileService.getCurrentProfile();
                          if (currentProfile) {
                            const profile = profileService.getProfileByUsername(currentProfile);
                            if (profile && profile.type === 'drkauth' && profile.accessToken) {
                              // Intentar cerrar sesión en el backend
                              fetch('http://localhost:3000/api/user/logout', {
                                method: 'POST',
                                headers: {
                                  'Authorization': `Bearer ${profile.accessToken}`,
                                  'Content-Type': 'application/json'
                                }
                              }).catch(err => {
                                console.error('[LoginModal] Error al cerrar sesión:', err);
                              });
                            }
                          }
                        } catch (error) {
                          console.error('[LoginModal] Error al importar profileService:', error);
                        }
                      }
                    }, 1000);
                    
                    // Mostrar mensaje informativo
                    await showModernAlert(
                      'Página abierta',
                      'Se ha abierto la página de Drk Launcher. Puedes registrarte o iniciar sesión allí. La cuenta se agregará automáticamente al launcher.',
                      'info'
                    );
                  } catch (error: any) {
                    console.error('Error al abrir página de Drk Launcher:', error);
                    await showModernAlert(
                      'Error',
                      'No se pudo abrir la página. Por favor, verifica que el servidor esté ejecutándose en http://localhost:3000',
                      'error'
                    );
                    setIsDrkAuthAuthenticating(false);
                  }
                }}
                disabled={isDrkAuthAuthenticating}
                className={`w-full py-4 px-4 rounded-xl transition-all duration-300 shadow-lg text-lg font-semibold ${
                  !isDrkAuthAuthenticating
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 text-white shadow-cyan-500/40 hover:shadow-cyan-500/50 transform hover:-translate-y-0.5'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isDrkAuthAuthenticating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Abriendo navegador...
                  </span>
                ) : (
                  'Iniciar sesión con Drk'
                )}
              </Button>
            </div>
          )}

          {(selectedLoginType === 'microsoft' || selectedLoginType === 'non-premium' || selectedLoginType === 'elyby' || selectedLoginType === 'littleskin' || selectedLoginType === 'drkauth') && (
            <div className="pt-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedLoginType('none');
                  setNonPremiumUsername('');
                }}
                className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white transition-all duration-300 shadow-lg shadow-gray-500/20 rounded-xl"
              >
                Volver
              </Button>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-700/50">
          <Button
            variant="secondary"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-gray-300 font-medium shadow-lg shadow-gray-500/20 transition-all duration-300"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}