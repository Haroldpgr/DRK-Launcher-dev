import React from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onViewProfile: () => void;
  onAddAccount: () => void;
  onDelete: () => void;
  accounts: { username: string }[];
  onSelectAccount: (username: string) => void;
};

export default function DropdownMenu({
  isOpen,
  onClose,
  onViewProfile,
  onAddAccount,
  onDelete,
  accounts,
  onSelectAccount,
}: Props) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="absolute top-12 right-0 bg-gray-800 text-white rounded-lg shadow-lg w-48">
      <ul>
        {accounts.map(account => (
          <li key={account.username}>
            <button
              onClick={() => {
                onSelectAccount(account.username);
                onClose();
              }}
              className="block w-full text-left p-2 hover:bg-gray-700"
            >
              {account.username}
            </button>
          </li>
        ))}
        <li>
          <button onClick={onAddAccount} className="block w-full text-left p-2 hover:bg-gray-700">
            Add Account
          </button>
        </li>
        <li>
          <button onClick={onDelete} className="block w-full text-left p-2 hover:bg-gray-700 text-red-500">
            Delete Current Account
          </button>
        </li>
      </ul>
    </div>
  );
}
