import React, { useState, useRef, useEffect } from 'react';
import { Profile } from '../services/profileService';

interface ProfileDropdownProps {
  currentUser: string | null;
  profiles: Profile[];
  onSelectAccount: (username: string) => void;
  onAddAccount: (username: string, type?: 'microsoft' | 'non-premium') => void;
  onDeleteAccount: (username: string) => void;
  onLoginClick: () => void; // To open the login modal
}

export default function ProfileDropdown({ 
  currentUser, 
  profiles, 
  onSelectAccount, 
  onAddAccount, 
  onDeleteAccount, 
  onLoginClick 
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
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
    onLoginClick(); // Open the login modal to add a new account
    setIsOpen(false); // Close dropdown after clicking
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-xl border border-gray-600/30 hover:from-gray-600/50 hover:to-gray-700/50 transition-all duration-300"
      >
        {currentUser ? (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
              {currentUser.charAt(0).toUpperCase()}
            </div>
            <div className="text-left">
              <div className="font-semibold text-white">{currentUser}</div>
              <div className="text-xs text-gray-400">
                {profiles.find(p => p.username === currentUser)?.type === 'microsoft' 
                  ? 'Cuenta Microsoft' 
                  : 'Cuenta no premium'}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center text-white font-bold">
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
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-full bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
          <div className="max-h-80 overflow-y-auto">
            {profiles && profiles.slice(0, 3).map((profile) => (
              <div 
                key={profile.id} 
                className={`flex items-center justify-between p-3 border-b border-gray-700 last:border-0 hover:bg-gray-700/50 transition-colors ${
                  profile.username === currentUser ? 'bg-gray-700/70' : ''
                }`}
              >
                <div 
                  className="flex items-center space-x-3 flex-1 cursor-pointer"
                  onClick={() => {
                    onSelectAccount(profile.username);
                    setIsOpen(false);
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                    {profile.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">{profile.username}</div>
                    <div className="text-xs text-gray-400">
                      {profile.type === 'microsoft' ? 'Microsoft' : 'No premium'}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    className="text-gray-400 hover:text-blue-400 transition-colors p-1 rounded-full hover:bg-blue-500/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Show profile information - for now it just logs
                      console.log('Profile info for:', profile);
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                  </button>
                  <button
                    className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-500/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteAccount(profile.username);
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {profiles.length < 3 && (
            <button
              onClick={handleAddAccount}
              className="w-full flex items-center justify-center p-3 text-gray-300 hover:bg-gray-700/50 border-t border-gray-700 transition-colors font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Agregar cuenta
            </button>
          )}
        </div>
      )}
    </div>
  );
}