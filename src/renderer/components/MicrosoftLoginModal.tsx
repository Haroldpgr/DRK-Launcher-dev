import React from 'react';
import Modal from './Modal';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (token: string) => void;
};

export default function MicrosoftLoginModal({ isOpen, onClose, onLogin }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Login with Microsoft">
      <div className="p-4">
        <p className="text-center">Microsoft login is not yet implemented.</p>
      </div>
    </Modal>
  );
}
