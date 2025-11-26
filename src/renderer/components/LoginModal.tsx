import React, { useState } from 'react';
import Button from './Button'; // Assuming Button component is available

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onMicrosoftLogin: () => void;
  onNonPremiumLogin: (username: string) => void;
};

export default function LoginModal({ isOpen, onClose, onMicrosoftLogin, onNonPremiumLogin }: LoginModalProps) {
  const [nonPremiumUsername, setNonPremiumUsername] = useState('');
  const [selectedLoginType, setSelectedLoginType] = useState<'none' | 'microsoft' | 'non-premium'>('none');

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
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700/50 relative backdrop-blur-md">
        <h2 className="text-3xl font-extrabold text-white mb-6 text-center">Iniciar Sesión</h2>

        <div className="space-y-4">
          <p className="text-gray-300 text-center mb-4 font-medium">Selecciona tu método de inicio de sesión:</p>

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
            className={`w-full cursor-pointer p-4 rounded-xl transition-all duration-300 shadow-lg border-2 ${
              selectedLoginType === 'non-premium'
                ? 'border-emerald-500 bg-emerald-900/30'
                : 'border-gray-700 bg-gray-700/50 hover:border-gray-600 hover:bg-gray-700/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-emerald-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                </svg>
                <div className="text-left">
                  <div className="text-white font-semibold">Iniciar sesión no premium</div>
                  <div className="text-xs text-gray-400">Para usuarios sin cuenta premium</div>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedLoginType === 'non-premium' ? 'border-emerald-500 bg-emerald-500' : 'border-gray-500'
              }`}>
                {selectedLoginType === 'non-premium' && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                  </svg>
                )}
              </div>
            </div>
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

          {(selectedLoginType === 'microsoft' || selectedLoginType === 'non-premium') && (
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