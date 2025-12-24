import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Profile } from '../services/profileService';
import AddProfileModal from './AddProfileModal';
// import MicrosoftLoginModal from './MicrosoftLoginModal'; // Not directly used in Sidebar, but can be managed by AddProfileModal
// import PremiumLoginModal from './PremiumLoginModal'; // Not directly used in Sidebar, but can be managed by AddProfileModal
import ProfileComponent from './Profile'; // Renamed to avoid conflict with Profile type
import ProfileViewModal from './ProfileViewModal';
import DropdownMenu from './DropdownMenu'; // Assuming DropdownMenu is now a dedicated component

type Props = {
  currentPath: string;
  onNavigate: (path: string) => void;
  accounts: Profile[];
  currentUser: string | null;
  onAddAccount: (username: string, type?: 'microsoft' | 'non-premium' | 'elyby' | 'yggdrasil') => void;
  onDeleteAccount: (username: string) => void;
  onSelectAccount: (username: string) => void;
};

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
      <svg {...commonProps} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    )
  }
  // Keep other non-settings icons as they were...
  if (name === 'contenido') {
    return (
      <svg {...commonProps} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    )
  }
  if (name === 'skins') {
    return (
      <svg {...commonProps} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.556-4.03-8.25-9-8.25a9.764 9.764 0 00-2.555.325L9 6.75m0 0l3 3m-3-3l-3 3" />
      </svg>
    )
  }
  if (name === 'create') {
    return (
      <svg {...commonProps} stroke="currentColor" fill="none" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    )
  }
  if (name === 'servers') {
    return (
      <svg {...commonProps} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3V6.75a3 3 0 013-3h13.5a3 3 0 013 3v4.5a3 3 0 01-3 3m-16.5 0a3 3 0 00-3 3v2.25a3 3 0 003 3h13.5a3 3 0 003-3v-2.25a3 3 0 00-3-3m-16.5 0v1.5m0-1.5h13.5m-13.5 0v-1.5m0 1.5h13.5m-13.5 0h13.5" />
      </svg>
    )
  }
  if (name === 'crash') {
    return (
      <svg {...commonProps} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
    )
  }
  if (name === 'import') {
    return (
      <svg {...commonProps} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    )
  }
  if (name === 'settings') {
    return (
      <svg {...commonProps} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  }

  // Solid icons for settings
  if (name === 'privacy') {
    return (
      <svg {...commonProps}>
        <path fillRule="evenodd" d="M12 1.5a7.5 7.5 0 0 0-6.75 10.563.75.75 0 0 0 1.172.66l.5-.666A5.25 5.25 0 0 1 12 2.25a5.25 5.25 0 0 1 4.422 7.834l.5.666a.75.75 0 0 0 1.172-.66A7.5 7.5 0 0 0 12 1.5ZM9.75 15.063V12a3 3 0 1 1 4.5 2.59V15a.75.75 0 0 1-1.5 0v-.528a3 3 0 1 1 1.5 0v.528a.75.75 0 0 1-1.5 0v-.528a3 3 0 1 1 1.5 0v.528a.75.75 0 0 1-1.28.53l-2.22-2.22a.75.75 0 0 1 1.06-1.06l2.22 2.22a.75.75 0 0 1-.53 1.28Z" clipRule="evenodd" />
      </svg>
    )
  }
  if (name === 'appearance') {
    return (
      <svg {...commonProps}>
        <path fillRule="evenodd" d="M18 5.25a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-15a1.5 1.5 0 0 1-1.5-1.5v-9a1.5 1.5 0 0 1 1.5-1.5h15ZM12 10.5a4.5 4.5 0 1 0-9 0 4.5 4.5 0 0 0 9 0ZM12 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm6-3a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" clipRule="evenodd" />
      </svg>
    )
  }
  if (name === 'resources') {
    return (
      <svg {...commonProps}>
        <path fillRule="evenodd" d="M8.25 3.75H19.5a.75.75 0 0 1 .75.75v11.25a.75.75 0 0 1-.75.75h-11.25A.75.75 0 0 1 7.5 15.75V3.75a.75.75 0 0 1 .75-.75ZM18 15V4.5H9v10.5h9ZM4.5 7.5a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-3 0V9A1.5 1.5 0 0 1 4.5 7.5ZM1.5 13.5a1.5 1.5 0 0 1 3 0v1.5a1.5 1.5 0 0 1-3 0v-1.5ZM9 13.5a1.5 1.5 0 0 1 1.5 1.5v1.5a1.5 1.5 0 0 1-3 0v-1.5A1.5 1.5 0 0 1 9 13.5ZM16.5 13.5a1.5 1.5 0 0 1 1.5 1.5v1.5a1.5 1.5 0 0 1-3 0v-1.5a1.5 1.5 0 0 1 1.5-1.5Z" clipRule="evenodd" />
      </svg>
    )
  }
  if (name === 'java') {
    return (
      <svg {...commonProps}>
        <path d="M2.136 14.748a.75.75 0 0 1 1.018.854c-.17.832-.364 1.501-.55 1.978a.75.75 0 0 1-1.39-.587c.14-.338.28-.76.412-1.266l.008-.032c.02-.08.04-.168.063-.265a.75.75 0 0 1 .854-1.018ZM14.25 8.25a.75.75 0 0 0-1.5 0v.252a4.26 4.26 0 0 0-.175-.002 4.3 4.3 0 0 0-4.3 4.3c0 .31.037.61.105.9.002.01.003.02.005.03l.005.022c.02.08.04.168.063.265a.75.75 0 0 0 1.43.502c-.02-.076-.04-.148-.06-.215l-.007-.025c-.06-.22-.095-.45-.095-.68v-.252A2.25 2.25 0 0 1 12 10.5v-.252ZM7.5 7.5a.75.75 0 0 1 .75.75v.252c.31.037.61.037.9 0 .23-.018.45-.053.66-.115a.75.75 0 1 1 .47 1.42c-.3.09-.62.145-.96.145a2.25 2.25 0 0 1-2.25-2.25v-.252a.75.75 0 0 1 .75-.75Z" />
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM16.5 9a4.5 4.5 0 0 1-9 0 4.5 4.5 0 0 1 9 0Z" clipRule="evenodd" />
      </svg>
    )
  }
  if (name === 'instances') {
    return (
      <svg {...commonProps} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
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
      className={`relative w-10 h-10 flex items-center justify-center rounded-2xl mb-2 shadow-lg border border-gray-700/60 overflow-hidden group transition-all duration-300 ease-out ${
        current
          ? 'bg-gradient-to-br from-primary via-blue-500 to-indigo-600 text-black scale-105 ring-2 ring-blue-400/70'
          : 'bg-gray-900/90 text-primary hover:bg-gradient-to-br hover:from-blue-500 hover:via-indigo-500 hover:to-primary hover:text-black hover:shadow-blue-500/40 hover:scale-105'
      }`}
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-40 bg-gradient-to-b from-white/20 via-transparent to-transparent" />
      <div className="relative flex items-center justify-center w-full h-full">
        <Icon name={icon} />
      </div>
    </button>
  )
}

export default function Sidebar({ currentPath, onNavigate }: Props) {
  return (
    <div data-tutorial="sidebar" className="w-16 bg-gray-900/90 backdrop-blur-sm border-r border-gray-800 p-2 flex flex-col items-center">
      <div 
        className="w-12 h-12 rounded-2xl mb-4 shadow-lg border border-gray-700/60 overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200 relative logo-glow"
        onClick={() => onNavigate('/')}
        title="DRK Launcher"
        style={{
          background: 'linear-gradient(135deg, #0f0f10 0%, #1a1a1a 50%, #0f0f10 100%)',
          position: 'relative',
        }}
      >
        {/* Efecto de brillo suave - optimizado con GPU acceleration */}
        <div 
          className="absolute inset-0 rounded-2xl logo-glow"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(99, 102, 241, 0.1) 50%, rgba(59, 130, 246, 0.15) 100%)',
            animation: 'softGlow 3s ease-in-out infinite',
          }}
        />
        {/* Letra D */}
        <div 
          className="w-full h-full flex items-center justify-center relative z-10"
          style={{
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: 700,
            fontSize: '28px',
            color: '#3B82F6',
            textShadow: '0 0 8px rgba(59, 130, 246, 0.4), 0 0 16px rgba(59, 130, 246, 0.2)',
            userSelect: 'none',
            willChange: 'auto',
          }}
        >
          D
        </div>
      </div>
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
      </div>
      <div className="mt-4 w-full flex justify-center">
        <button
          title="Descargas"
          aria-label="Descargas"
          onClick={() => onNavigate('/downloads')}
          className={`relative w-10 h-10 flex items-center justify-center rounded-2xl shadow-lg border border-gray-700/60 overflow-hidden group transition-all duration-300 ease-out ${
            currentPath === '/downloads'
              ? 'bg-gradient-to-br from-primary via-blue-500 to-indigo-600 text-black scale-105 ring-2 ring-blue-400/70'
              : 'bg-gray-900/90 text-primary hover:bg-gradient-to-br hover:from-blue-500 hover:via-indigo-500 hover:to-primary hover:text-black hover:shadow-blue-500/40 hover:scale-105'
          }`}
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {/* brillo superior */}
          <div className="pointer-events-none absolute inset-0 opacity-40 bg-gradient-to-b from-white/20 via-transparent to-transparent" />
          <div className="relative flex items-center justify-center w-full h-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </div>
        </button>
      </div>
    </div>
  )
}
