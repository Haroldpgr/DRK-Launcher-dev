import React, { useState, useRef, useEffect } from 'react';

interface ModernSelectOption {
  value: string;
  label: string;
}

interface ModernSelectProps {
  options: ModernSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

const ModernSelect: React.FC<ModernSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Selecciona...',
  disabled = false,
  loading = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className={`
          w-full bg-gradient-to-br from-gray-700/80 to-gray-800/80 backdrop-blur-sm border border-gray-600/70 rounded-xl py-3 px-4 text-white
          focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200
          flex items-center justify-between min-h-[46px] shadow-sm ${
            loading
              ? 'opacity-70 cursor-not-allowed'
              : disabled
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer hover:from-gray-700/90 hover:to-gray-800/90 hover:border-gray-500/80'
          }
        `}
      >
        <span className={`${value ? 'text-white' : 'text-gray-400'} truncate`}>
          {loading ? 'Cargando...' : (selectedOption ? selectedOption.label : placeholder)}
        </span>
        <div className="flex items-center ml-2">
          {loading ? (
            <svg className="animate-spin h-4 w-4 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-gradient-to-b from-gray-800/95 to-gray-900/95 backdrop-blur-xl border border-gray-600/70 rounded-xl shadow-2xl shadow-black/30 overflow-hidden">
          <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {options.map((option, index) => (
              <div
                key={option.value}
                onClick={() => handleOptionClick(option.value)}
                className={`
                  flex items-center px-4 py-3 cursor-pointer transition-all duration-150 relative
                  ${value === option.value
                    ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-200 border-l-4 border-blue-500 pl-3'
                    : 'hover:bg-gray-700/60 text-gray-200 hover:pl-3'
                  }
                  ${index === 0 ? 'pt-4' : ''}
                  ${index === options.length - 1 ? 'pb-4' : ''}
                `}
              >
                <span className="flex-1 truncate">{option.label}</span>
                {value === option.value && (
                  <div className="ml-2 flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernSelect;