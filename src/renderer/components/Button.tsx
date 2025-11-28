import React from 'react'

export default function Button({ children, onClick, variant = 'primary', className = '', disabled = false }: { children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary'; className?: string; disabled?: boolean }) {
  const base = 'inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/80 focus-visible:ring-offset-0 disabled:opacity-40 disabled:cursor-not-allowed';
  const variantClasses =
    variant === 'primary'
      ? 'bg-gradient-to-r from-primary via-blue-500 to-indigo-600 text-black shadow-lg hover:shadow-blue-500/40 hover:translate-y-0.5'
      : 'bg-gray-800/90 text-gray-100 border border-gray-700 hover:bg-gray-700';

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`${base} ${variantClasses} ${className}`}
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {children}
    </button>
  )
}

