import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tutorialService } from '../services/tutorialService';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  const version = tutorialService.getCurrentVersion();

  const handleAccept = () => {
    tutorialService.markWelcomeSeen();
    onClose();
  };

  const features = [
    {
      icon: '🎮',
      title: 'Gestión de Instancias',
      description: 'Crea y administra múltiples instancias de Minecraft con diferentes versiones y mods.'
    },
    {
      icon: '📦',
      title: 'Descarga de Contenido',
      description: 'Descarga mods, modpacks, shaders y resource packs desde Modrinth y CurseForge.'
    },
    {
      icon: '👤',
      title: 'Personalización de Skins',
      description: 'Visualiza y gestiona tus skins de Minecraft en 3D.'
    },
    {
      icon: '🌐',
      title: 'Servidores',
      description: 'Conecta directamente a servidores de Minecraft y ve su estado en tiempo real.'
    },
    {
      icon: '📥',
      title: 'Importar Modpacks',
      description: 'Importa modpacks desde archivos .mrpack o .zip fácilmente.'
    },
    {
      icon: '🔧',
      title: 'Analizador de Crashes',
      description: 'Analiza logs de errores con IA para solucionar problemas rápidamente.'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl mx-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-cyan-500/30 overflow-hidden"
          >
            {/* Header con efecto de brillo */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20 animate-pulse" />
              <div className="relative px-8 py-6 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="inline-block mb-4"
                >
                  <span className="text-6xl">🚀</span>
                </motion.div>
                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"
                >
                  ¡Bienvenido a DRK Launcher!
                </motion.h1>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-400 mt-2"
                >
                  Versión {version} <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-semibold rounded-full ml-2">BETA</span>
                </motion.p>
              </div>
            </div>

            {/* Contenido */}
            <div className="px-8 py-6 max-h-[50vh] overflow-y-auto custom-scrollbar">
              <motion.h2
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-lg font-semibold text-white mb-4"
              >
                ✨ Características principales:
              </motion.h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ x: -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:border-cyan-500/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{feature.icon}</span>
                      <div>
                        <h3 className="font-medium text-white">{feature.title}</h3>
                        <p className="text-sm text-gray-400 mt-1">{feature.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.1 }}
                className="mt-6 p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/30"
              >
                <p className="text-cyan-300 text-sm">
                  💡 <strong>Tip:</strong> Después de cerrar este mensaje, te guiaremos con un tutorial interactivo en cada sección del launcher.
                </p>
              </motion.div>
            </div>

            {/* Footer */}
            <div className="px-8 py-6 bg-gray-900/50 border-t border-gray-700/50">
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.2 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAccept}
                className="w-full py-3 px-6 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 transition-all"
              >
                ¡Comenzar a explorar! 🎮
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeModal;

