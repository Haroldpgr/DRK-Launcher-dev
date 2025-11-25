import React, { useState } from 'react';
import Modal from './Modal';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (username: string) => void;
};

export default function PremiumLoginModal({ isOpen, onClose, onLogin }: Props) {
  const [username, setUsername] = useState('');

  const handleLogin = () => {
    if (username.trim()) {
      onLogin(username.trim());
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Login with Premium">
      <div className="p-4">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          className="w-full p-2 border border-gray-700 rounded-lg bg-gray-900 text-white"
        />
        <button
          onClick={handleLogin}
          className="w-full mt-4 p-2 bg-primary text-white rounded-lg"
        >
          Login
        </button>
      </div>
    </Modal>
  );
}
