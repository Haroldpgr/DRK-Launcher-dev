import React from 'react';

interface ModernAlertProps {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

const ModernAlert: React.FC<ModernAlertProps> = ({
  title,
  message,
  type = 'info',
  onConfirm,
  onCancel,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar'
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-br from-green-900/50 to-emerald-900/50 border-green-600/50';
      case 'warning':
        return 'bg-gradient-to-br from-yellow-900/50 to-amber-900/50 border-yellow-600/50';
      case 'error':
        return 'bg-gradient-to-br from-red-900/50 to-rose-900/50 border-red-600/50';
      case 'info':
      default:
        return 'bg-gradient-to-br from-blue-900/50 to-indigo-900/50 border-blue-600/50';
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.816c1.546 0 2.078-.669 1.752-1.79L14.397 7.45c-.326-1.121-.858-1.79-1.752-1.79H8.603c-.894 0-1.426.669-1.752 1.79L5.397 15.65c-.326 1.121.206 1.79 1.752 1.79z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className={`border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden ${getTypeStyles()}`}>
        <div className="p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getTypeIcon()}
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-bold text-white">{title}</h3>
              <p className="mt-2 text-gray-300">{message}</p>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-gray-200 font-medium transition-all duration-200"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={onConfirm}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                type === 'success' 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white' 
                  : type === 'warning' 
                    ? 'bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white'
                    : type === 'error' 
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernAlert;