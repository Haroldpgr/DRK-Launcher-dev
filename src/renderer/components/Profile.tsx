import React, { useState } from 'react';
import MicrosoftLoginModal from './MicrosoftLoginModal';
import PremiumLoginModal from './PremiumLoginModal';
import DropdownMenu from './DropdownMenu';

type Props = {
  accounts: { username: string }[];
  currentUser: string | null;
  onAddAccount: (username: string) => void;
  onDeleteAccount: (username: string) => void;
  onSelectAccount: (username: string) => void;
};

export default function Profile({
  accounts,
  currentUser,
  onAddAccount,
  onDeleteAccount,
  onSelectAccount,
}: Props) {
  const [isMicrosoftLoginOpen, setMicrosoftLoginOpen] = useState(false);
  const [isPremiumLoginOpen, setPremiumLoginOpen] = useState(false);
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  const handleMicrosoftLogin = (token: string) => {
    // For now, we'll just set a dummy username.
    onAddAccount('Microsoft User');
  };

  const handlePremiumLogin = (username: string) => {
    onAddAccount(username);
  };

  return (
    <>
      <div className="mt-auto p-4">
        {currentUser ? (
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-white font-bold">{currentUser}</p>
            </div>
            <div className="relative">
              <button onClick={() => setDropdownOpen(!isDropdownOpen)} className="text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <DropdownMenu
                isOpen={isDropdownOpen}
                onClose={() => setDropdownOpen(false)}
                onViewProfile={() => {}}
                onAddAccount={() => setPremiumLoginOpen(true)}
                onDelete={() => onDeleteAccount(currentUser)}
                accounts={accounts}
                onSelectAccount={onSelectAccount}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <button onClick={() => setMicrosoftLoginOpen(true)} className="bg-blue-600 text-white p-2 rounded-lg">
              Login with Microsoft
            </button>
            <button onClick={() => setPremiumLoginOpen(true)} className="bg-gray-700 text-white p-2 rounded-lg">
              Login with Premium
            </button>
          </div>
        )}
      </div>
      <MicrosoftLoginModal
        isOpen={isMicrosoftLoginOpen}
        onClose={() => setMicrosoftLoginOpen(false)}
        onLogin={handleMicrosoftLogin}
      />
      <PremiumLoginModal
        isOpen={isPremiumLoginOpen}
        onClose={() => setPremiumLoginOpen(false)}
        onLogin={handlePremiumLogin}
      />
    </>
  );
}
