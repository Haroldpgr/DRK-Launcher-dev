import React, { useState, useRef, useEffect, memo } from 'react';
import { Profile, profileService } from '../services/profileService';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { PlayerProfileModal } from './ui/PlayerProfileModal';

interface ProfileDropdownProps {
  currentUser: string | null;
  profiles: Profile[];
  onSelectAccount: (username: string) => void;
  onAddAccount?: () => void;
  onDeleteAccount: (username: string) => void;
  onLoginClick: () => void;
}

// Componente para mostrar imagen de perfil personalizada
const ProfileImage: React.FC<{ username: string; size: number; className?: string }> = ({ 
  username, 
  size, 
  className = '' 
}) => {
  const initials = username.charAt(0).toUpperCase();
  const bgColor = `hsl(${username.length * 137.5} 60% 60%)`;
  
  return (
    <div 
      className={`rounded-full flex items-center justify-center text-white font-bold ${className}`}
      style={{ 
        width: size, 
        height: size, 
        backgroundColor: bgColor 
      }}
    >
      {initials}
    </div>
  );
};

function ProfileDropdown({
  currentUser,
  profiles,
  onSelectAccount,
  onAddAccount,
  onDeleteAccount,
  onLoginClick
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileToView, setProfileToView] = useState<Profile | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar el menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAddAccount = () => {
    if (onAddAccount) {
      onAddAccount();
    } else {
      onLoginClick();
    }
    setIsOpen(false);
  };

  const handleDeleteClick = (username: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAccountToDelete(username);
    setShowConfirmDialog(true);
    setIsOpen(false);
  };

  const confirmDelete = () => {
    if (accountToDelete) {
      onDeleteAccount(accountToDelete);
      setShowConfirmDialog(false);
      setAccountToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowConfirmDialog(false);
    setAccountToDelete(null);
  };

  const handleViewProfile = (profile: Profile, e: React.MouseEvent) => {
    e.stopPropagation();
    setProfileToView(profile);
    setShowProfileModal(true);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700/50 hover:from-gray-700/50 hover:to-gray-800/50 transition-all duration-300"
      >
        {currentUser ? (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10">
              <ProfileImage username={currentUser} size={40} className="w-full h-full" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-white">{currentUser}</div>
              <div className="text-xs text-gray-400">
                {(() => {
                  const currentProfile = profiles.find(p => p.username === currentUser);
                  const profileType = currentProfile?.type;
                  
                  // Logs de depuración
                  console.log('[ProfileDropdown] Renderizando tipo de cuenta:', {
                    currentUser,
                    profileType,
                    allProfiles: profiles.map(p => ({ username: p.username, type: p.type })),
                    currentProfile: currentProfile ? { username: currentProfile.username, type: currentProfile.type, id: currentProfile.id } : null
                  });
                  
                  if (profileType === 'microsoft') return 'Cuenta Microsoft';
                  if (profileType === 'drkauth') return 'Cuenta Drk';
                  if (profileType === 'elyby') return 'Cuenta Ely.by';
                  if (profileType === 'littleskin') return 'Cuenta LittleSkin';
                  if (profileType === 'yggdrasil') return 'Cuenta Yggdrasil';
                  return 'Cuenta no premium';
                })()}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white font-bold">
              ?
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-300">No conectado</div>
              <div className="text-xs text-gray-400">Iniciar sesión</div>
            </div>
          </div>
        )}
        <svg 
          className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-full bg-gray-800/95 border border-gray-700/50 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm">
          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {profiles && profiles.slice(0, 3).map((profile) => (
              <div 
                key={profile.id} 
                className={`flex items-center justify-between p-3 border-b border-gray-700/30 last:border-0 hover:bg-gray-700/50 transition-colors ${
                  profile.username === currentUser ? 'bg-gray-700/30' : ''
                }`}
              >
                <div 
                  className="flex items-center space-x-3 flex-1 cursor-pointer"
                  onClick={() => {
                    onSelectAccount(profile.username);
                    setIsOpen(false);
                  }}
                >
                  <div className="w-8 h-8">
                    <ProfileImage username={profile.username} size={32} className="w-full h-full" />
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">{profile.username}</div>
                    <div className="text-xs text-gray-400">
                      {(() => {
                        console.log('[ProfileDropdown] Renderizando perfil en lista:', {
                          username: profile.username,
                          type: profile.type,
                          id: profile.id
                        });
                        
                        if (profile.type === 'microsoft') return 'Microsoft';
                        if (profile.type === 'drkauth') return 'Drk';
                        if (profile.type === 'elyby') return 'Ely.by';
                        if (profile.type === 'littleskin') return 'LittleSkin';
                        if (profile.type === 'yggdrasil') return 'Yggdrasil';
                        return 'No premium';
                      })()}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => handleViewProfile(profile, e)}
                    className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                    title="Ver perfil"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(profile.username, e)}
                    className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                    title="Eliminar cuenta"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={handleAddAccount}
              className="w-full p-3 text-left text-blue-400 hover:bg-gray-700/50 transition-colors flex items-center space-x-3"
            >
              <div className="w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center border border-dashed border-gray-600/50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span>Agregar cuenta</span>
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Eliminar cuenta"
        message="¿Estás seguro de que deseas eliminar esta cuenta? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      <PlayerProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profile={{
          ...profileToView!,
          gameTime: profileToView?.gameTime || 0,
          instances: profileToView?.instances || [],
          skinUrl: profileToView?.skinUrl || '',
          joinedDate: profileToView?.lastUsed ? new Date(profileToView.lastUsed).toLocaleDateString() : new Date().toLocaleDateString(),
        }}
      />
    </div>
  );
}

export default memo(ProfileDropdown);