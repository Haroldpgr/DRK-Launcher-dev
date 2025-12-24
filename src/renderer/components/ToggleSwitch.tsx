import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export default function ToggleSwitch({ checked, onChange, disabled = false }: ToggleSwitchProps) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only peer"
      />
      <div 
        className="w-11 h-6 rounded-full transition-all relative"
        style={{
          backgroundColor: checked ? 'var(--global-accent-color)' : 'var(--panel-hover)',
          border: `1px solid ${checked ? 'var(--global-accent-color)' : 'var(--border)'}`,
          opacity: disabled ? 0.5 : 1
        }}
      >
        <div 
          className="absolute top-[2px] left-[2px] w-5 h-5 rounded-full transition-all"
          style={{
            backgroundColor: '#ffffff',
            transform: checked ? 'translateX(1.25rem)' : 'translateX(0)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        ></div>
      </div>
    </label>
  );
}

