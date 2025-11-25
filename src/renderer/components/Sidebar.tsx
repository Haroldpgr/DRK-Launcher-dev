import React from 'react'
import Profile from './Profile'

type Props = {
  currentPath: string;
  onNavigate: (p: string) => void;
  accounts: { username: string }[];
  currentUser: string | null;
  onAddAccount: (username: string) => void;
  onDeleteAccount: (username: string) => void;
  onSelectAccount: (username: string) => void;
}

export function Icon({ name }: { name: 'home' | 'instances' | 'create' | 'servers' | 'crash' | 'import' | 'settings' | 'contenido' | 'skins' | 'privacy' | 'appearance' | 'resources' | 'java' }) {
  const isSolid = ['privacy', 'appearance', 'resources', 'java', 'instances'].includes(name);
  const commonProps = {
    className: "w-5 h-5", // Slightly smaller icons
    viewBox: "0 0 20 20",
    fill: isSolid ? "currentColor" : "none",
    strokeWidth: isSolid ? 0 : "1.5",
    stroke: isSolid ? "none" : "currentColor",
  };

  if (name === 'home') {
    return (
      <svg {...commonProps} stroke="currentColor" fill="none" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    )
  }
  // Keep other non-settings icons as they were...
  if (name === 'contenido') {
    return (
      <svg {...commonProps} stroke="currentColor" fill="none" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75h16.5m-16.5 0A2.25 2.25 0 0 1 5.25 7.5h13.5a2.25 2.25 0 0 1 2.25 2.25m-16.5 0v6.75a2.25 2.25 0 0 0 2.25 2.25h12a2.25 2.25 0 0 0 2.25-2.25v-6.75m-16.5 0h16.5" />
      </svg>
    )
  }
  if (name === 'skins') {
    return (
      <svg {...commonProps} stroke="currentColor" fill="none" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402a3.75 3.75 0 0 0-5.304-5.304L4.098 14.6c-.996.996-1.55 2.32-1.55 3.714v.001l.002.002.001.002.002.001.002.001.001.002h.001l.002.001.001.002.002.001.001.001a3.75 3.75 0 0 0 3.714-1.55l.298-.447M9 15a6 6 0 1 0-8.485-8.485 6 6 0 0 0 8.485 8.485Z" />
      </svg>
    )
  }
  if (name === 'create') {
    return (
      <svg {...commonProps} stroke="currentColor" fill="none" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    )
  }
  if (name === 'servers') {
    return (
      <svg {...commonProps} stroke="currentColor" fill="none" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 .75.75v9a.75.75 0 0 1-.75.75h-9a.75.75 0 0 1-.75-.75v-9Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 9a.75.75 0 0 0-.75.75v9.19c0 .514.418.939.938.939h9.19a.75.75 0 0 0 .75-.75v-1.5" />
      </svg>
    )
  }
  if (name === 'crash') {
    return (
      <svg {...commonProps} stroke="currentColor" fill="none" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
    )
  }
  if (name === 'import') {
    return (
      <svg {...commonProps} stroke="currentColor" fill="none" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    )
  }
  if (name === 'settings') {
    return (
      <svg {...commonProps} stroke="currentColor" fill="none" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
      </svg>
    )
  }

  // Solid icons for settings
  if (name === 'privacy') {
    return (
      <svg {...commonProps} viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
      </svg>
    )
  }
  if (name === 'appearance') {
    return (
      <svg {...commonProps} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.106a.75.75 0 010 1.06l-1.591 1.59a.75.75 0 11-1.06-1.06l1.59-1.59a.75.75 0 011.06 0zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.849 16.243a.75.75 0 011.06 0l1.59 1.591a.75.75 0 11-1.06 1.06l-1.59-1.59a.75.75 0 010-1.061zM12 18a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.757 17.849a.75.75 0 010-1.06l-1.59-1.591a.75.75 0 01-1.061 1.06l1.59 1.59a.75.75 0 011.06 0zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.106 7.151a.75.75 0 011.06 0l1.59 1.591a.75.75 0 11-1.06 1.06l-1.59-1.59a.75.75 0 010-1.06z" />
      </svg>
    )
  }
  if (name === 'resources') {
    return (
      <svg {...commonProps} viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M10.5 3.75a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0V5.06l-4.72 4.72a.75.75 0 01-1.06 0l-1.5-1.5a.75.75 0 010-1.06l4.72-4.72h-1.69a.75.75 0 010-1.5h4.5zm4.72 4.72a.75.75 0 011.06 0l1.5 1.5a.75.75 0 010 1.06l-4.72 4.72v1.69a.75.75 0 01-1.5 0v-4.5a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-1.69l4.72-4.72a.75.75 0 010-1.06l-1.5-1.5a.75.75 0 01-1.06 0L15.22 8.47z" clipRule="evenodd" />
      </svg>
    )
  }
  if (name === 'java') {
    return (
      <svg {...commonProps} viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M2.25 6a3 3 0 013-3h13.5a3 3 0 013 3v12a3 3 0 01-3 3H5.25a3 3 0 01-3-3V6zm3.97.97a.75.75 0 011.06 0l2.25 2.25a.75.75 0 010 1.06l-2.25 2.25a.75.75 0 01-1.06-1.06L7.69 11.5l-1.47-1.47a.75.75 0 010-1.06zm5.25 4.5a.75.75 0 010-1.06l2.25-2.25a.75.75 0 011.06 1.06L13.81 11.5l1.47 1.47a.75.75 0 01-1.06 1.06l-2.25-2.25z" clipRule="evenodd" />
      </svg>
    )
  }
  if (name === 'instances') {
    return (
      <svg {...commonProps} viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 2.25a.75.75 0 01.75.75v1.5h.75a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9a3 3 0 013-3h.75V3a.75.75 0 01.75-.75zm6 6a.75.75 0 00-1.5 0v3a.75.75 0 001.5 0v-3z" clipRule="evenodd" />
      </svg>
    )
  }
  
  return (
    <svg {...commonProps} fill="currentColor">
      <circle cx="10" cy="10" r="8" />
    </svg>
  )
}

function Item({ path, current, onClick, icon, title }: { path: string; current: boolean; onClick: () => void; icon: React.ComponentProps<typeof Icon>['name']; title: string }) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`w-9 h-9 flex items-center justify-center rounded-lg mb-2 shadow transition-all duration-300 ease-out transform hover:scale-105 hover:bg-gradient-to-br hover:from-blue-500 hover:to-primary ${current ? 'bg-primary text-black scale-105' : 'bg-gray-800 text-primary'}`}
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div className="flex items-center justify-center w-full h-full">
        <Icon name={icon} />
      </div>
    </button>
  )
}

export default function Sidebar({
  currentPath,
  onNavigate,
  accounts,
  currentUser,
  onAddAccount,
  onDeleteAccount,
  onSelectAccount,
}: Props) {
  return (
    <div className="w-16 bg-gray-900/90 backdrop-blur-sm border-r border-gray-800 p-2 flex flex-col items-center">
      <div className="w-8 h-8 rounded-lg bg-primary text-black flex items-center justify-center mb-3 text-xs font-bold">DRK</div>
      <Item title="Inicio" path="/" current={currentPath === '/'} onClick={() => onNavigate('/')} icon="home" />
      <Item title="Contenido" path="/contenido" current={currentPath === '/contenido'} onClick={() => onNavigate('/contenido')} icon="contenido" />
      <Item title="Skins" path="/skins" current={currentPath === '/skins'} onClick={() => onNavigate('/skins')} icon="skins" />
      <Item title="Instancias" path="/instances" current={currentPath === '/instances'} onClick={() => onNavigate('/instances')} icon="instances" />
      <div className="w-10 border-b border-gray-700/50 my-2" />
      <Item title="Crear" path="/create" current={currentPath === '/create'} onClick={() => onNavigate('/create')} icon="create" />
      <Item title="Servidores" path="/servers" current={currentPath === '/servers'} onClick={() => onNavigate('/servers')} icon="servers" />
      <div className="mt-auto w-full flex flex-col items-center gap-1 pb-1">
        <Item title="Crashes" path="/crash" current={currentPath === '/crash'} onClick={() => onNavigate('/crash')} icon="crash" />
        <Item title="Importar" path="/import" current={currentPath === '/import'} onClick={() => onNavigate('/import')} icon="import" />
        <Item title="Ajustes" path="/settings" current={currentPath === '/settings'} onClick={() => onNavigate('/settings')} icon="settings" />
        <Profile
          accounts={accounts}
          currentUser={currentUser}
          onAddAccount={onAddAccount}
          onDeleteAccount={onDeleteAccount}
          onSelectAccount={onSelectAccount}
        />
      </div>
    </div>
  )
}
