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
          <div className={`${styles.iconBg} rounded-2xl p-4 shadow-lg ${styles.iconColor}/20`}>
            <svg className={`w-10 h-10 ${styles.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className={`${styles.iconBg} rounded-2xl p-4 shadow-lg ${styles.iconColor}/20`}>
            <svg className={`w-10 h-10 ${styles.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.816c1.546 0 2.078-.669 1.752-1.79L14.397 7.45c-.326-1.121-.858-1.79-1.752-1.79H8.603c-.894 0-1.426.669-1.752 1.79L5.397 15.65c-.326 1.121.206 1.79 1.752 1.79z" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className={`${styles.iconBg} rounded-2xl p-4 shadow-lg ${styles.iconColor}/20`}>
            <svg className={`w-10 h-10 ${styles.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'info':
      default:
        return (
          <div className={`${styles.iconBg} rounded-2xl p-4 shadow-lg ${styles.iconColor}/20`}>
            <svg className={`w-10 h-10 ${styles.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getButtonStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-400 hover:via-emerald-400 hover:to-green-500 text-white shadow-xl shadow-green-500/40 hover:shadow-green-500/50';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 hover:from-yellow-400 hover:via-amber-400 hover:to-yellow-500 text-white shadow-xl shadow-yellow-500/40 hover:shadow-yellow-500/50';
      case 'error':
        return 'bg-gradient-to-r from-red-500 via-rose-500 to-red-600 hover:from-red-400 hover:via-rose-400 hover:to-red-500 text-white shadow-xl shadow-red-500/40 hover:shadow-red-500/50';
      case 'info':
      default:
        return 'bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 hover:from-blue-400 hover:via-indigo-400 hover:to-blue-500 text-white shadow-xl shadow-blue-500/40 hover:shadow-blue-500/50';
    }
  };

  const styles = getTypeStyles();

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-lg z-[9999] flex items-center justify-center p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && onCancel) {
          onCancel();
        }
      }}
    >
      <div 
        className={`relative border ${styles.border} ${styles.bg} rounded-3xl shadow-2xl w-full max-w-md overflow-hidden backdrop-blur-2xl animate-scaleIn`}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Efecto de brillo sutil */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none"></div>
        
        <div className="relative p-8">
          <div className="flex items-start gap-5">
            <div className="flex-shrink-0 animate-bounceIn">
              {getTypeIcon()}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{title}</h3>
              <p className="text-gray-300 leading-relaxed whitespace-pre-line text-base">{message}</p>
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-3">
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-6 py-3 rounded-xl bg-gray-800/60 hover:bg-gray-700/80 text-gray-200 font-semibold transition-all duration-200 border border-gray-700/50 hover:border-gray-600/50 hover:scale-105 active:scale-95"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={onConfirm}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 ${getButtonStyles()}`}
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
            transform: scale(0.85) translateY(-20px);
          }
          to { 
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0) rotate(-180deg);
          }
          50% {
            opacity: 1;
            transform: scale(1.1) rotate(10deg);
          }
          70% {
            transform: scale(0.95) rotate(-5deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
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