import React, { useEffect } from 'react';

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
  useEffect(() => {
    // Prevenir scroll del body cuando el modal está abierto
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-gradient-to-br from-green-900/90 via-emerald-900/80 to-green-800/90',
          border: 'border-green-500/50',
          iconBg: 'bg-green-500/20',
          iconColor: 'text-green-400'
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-br from-yellow-900/90 via-amber-900/80 to-yellow-800/90',
          border: 'border-yellow-500/50',
          iconBg: 'bg-yellow-500/20',
          iconColor: 'text-yellow-400'
        };
      case 'error':
        return {
          bg: 'bg-gradient-to-br from-red-900/90 via-rose-900/80 to-red-800/90',
          border: 'border-red-500/50',
          iconBg: 'bg-red-500/20',
          iconColor: 'text-red-400'
        };
      case 'info':
      default:
        return {
          bg: 'bg-gradient-to-br from-blue-900/90 via-indigo-900/80 to-blue-800/90',
          border: 'border-blue-500/50',
          iconBg: 'bg-blue-500/20',
          iconColor: 'text-blue-400'
        };
    }
  };

  const getTypeIcon = () => {
    const styles = getTypeStyles();
    switch (type) {
      case 'success':
        return (
          <div className={`${styles.iconBg} rounded-full p-3`}>
            <svg className={`w-8 h-8 ${styles.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className={`${styles.iconBg} rounded-full p-3`}>
            <svg className={`w-8 h-8 ${styles.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.816c1.546 0 2.078-.669 1.752-1.79L14.397 7.45c-.326-1.121-.858-1.79-1.752-1.79H8.603c-.894 0-1.426.669-1.752 1.79L5.397 15.65c-.326 1.121.206 1.79 1.752 1.79z" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className={`${styles.iconBg} rounded-full p-3`}>
            <svg className={`w-8 h-8 ${styles.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'info':
      default:
        return (
          <div className={`${styles.iconBg} rounded-full p-3`}>
            <svg className={`w-8 h-8 ${styles.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getButtonStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/30';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white shadow-lg shadow-yellow-500/30';
      case 'error':
        return 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-500/30';
      case 'info':
      default:
        return 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/30';
    }
  };

  const styles = getTypeStyles();

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && onCancel) {
          onCancel();
        }
      }}
    >
      <div 
        className={`border-2 ${styles.border} ${styles.bg} rounded-2xl shadow-2xl w-full max-w-md overflow-hidden backdrop-blur-xl animate-scaleIn`}
        style={{
          animation: 'scaleIn 0.3s ease-out',
        }}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 animate-bounceIn">
              {getTypeIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
              <p className="text-gray-200 leading-relaxed whitespace-pre-line">{message}</p>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-5 py-2.5 rounded-xl bg-gray-700/80 hover:bg-gray-600/80 text-gray-200 font-medium transition-all duration-200 border border-gray-600/50 hover:border-gray-500/50"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={onConfirm}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${getButtonStyles()}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.9) translateY(-10px);
          }
          to { 
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .animate-bounceIn {
          animation: bounceIn 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ModernAlert;