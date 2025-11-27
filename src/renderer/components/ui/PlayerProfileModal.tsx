import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Profile } from '../../services/profileService';

interface PlayerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile & {
    joinedDate: string;
  };
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  isOpen,
  onClose,
  profile
}) => {
  if (!isOpen || !profile) return null;

  const formatGameTime = (milliseconds: number | undefined): string => {
    if (!milliseconds) return '0 min';

    // Convertir de milisegundos a minutos
    const minutes = Math.floor(milliseconds / (1000 * 60));

    if (minutes < 60) {
      return `${minutes} min`;
    } else if (minutes < 1440) { // menos de un día
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}min`;
    } else {
      const days = Math.floor(minutes / 1440);
      const hours = Math.floor((minutes % 1440) / 60);
      return `${days}d ${hours}h`;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-4xl"
          >
            <div className="bg-gray-800/95 border border-gray-700/50 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm">
              <div className="p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <img
                        src={profile.skinUrl || `https://crafatar.com/avatars/${profile.username}?overlay`}
                        alt={`${profile.username}'s avatar`}
                        className="w-24 h-24 rounded-full border-2 border-gray-600"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://crafatar.com/avatars/steve?overlay`;
                        }}
                      />
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gray-900/80 px-2 py-1 rounded-full text-xs text-white">
                        {profile.type === 'microsoft' ? 'Premium' : 'No premium'}
                      </div>
                    </div>
                  </div>
                  <div className="ml-6 flex-1">
                    <h3 className="text-2xl font-bold text-white flex items-center">
                      {profile.username}
                      <span className="ml-3 text-sm font-normal bg-blue-900/30 text-blue-300 px-2 py-1 rounded-full">
                        Miembro desde {profile.joinedDate}
                      </span>
                    </h3>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-700/30 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Tiempo de Juego</h4>
                        <p className="text-xl font-bold text-green-400">{formatGameTime(profile.gameTime)}</p>
                      </div>
                      <div className="bg-gray-700/30 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Instancias Asociadas</h4>
                        <p className="text-xl font-bold text-blue-400">{profile.instances.length}</p>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h4 className="text-lg font-semibold text-white mb-3">Instancias Recientes</h4>
                      {profile.instances && profile.instances.length > 0 ? (
                        <div className="space-y-2">
                          {profile.instances.map((instance, index) => (
                            <div key={instance.id} className="flex justify-between items-center bg-gray-700/30 p-3 rounded-lg">
                              <div>
                                <span className="text-white font-medium">{instance.name}</span>
                                <div className="text-xs text-gray-400">Última sesión: {instance.lastPlayed}</div>
                              </div>
                              <button className="text-sm bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded-lg transition-colors">
                                Abrir
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400">No hay instancias asociadas a esta cuenta</p>
                      )}
                    </div>

                    <div className="mt-6">
                      <h4 className="text-lg font-semibold text-white mb-3">Skin del Jugador</h4>
                      <div className="flex items-center space-x-4">
                        <img
                          src={profile.skinUrl || `https://crafatar.com/skins/${profile.username}`}
                          alt={`${profile.username}'s skin`}
                          className="w-32 h-32 object-contain border border-gray-600 rounded"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://crafatar.com/skins/steve`;
                          }}
                        />
                        <div>
                          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
                            Descargar Skin
                          </button>
                          <p className="mt-2 text-sm text-gray-400">
                            Skin actualizada por última vez: {profile.joinedDate}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700/50 hover:bg-gray-600/50 rounded-lg border border-gray-600/50 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};