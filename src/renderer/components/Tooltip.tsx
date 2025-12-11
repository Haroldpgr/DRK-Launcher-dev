import React, { useState } from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
  delay?: number;
}

const Tooltip: React.FC<TooltipProps> = ({ 
  children, 
  content, 
  position = 'top',
  delay = 500
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setIsVisible(false);
  };

  // Determine tooltip position classes
  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    right: 'top-1/2 left-full transform -translate-y-1/2 ml-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'top-1/2 right-full transform -translate-y-1/2 mr-2'
  }[position];

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="cursor-pointer"
      >
        {children}
      </div>
      {isVisible && (
        <div className={`absolute z-50 ${positionClasses} w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg border border-gray-700/80`}>
          <div className="relative">
            {content}
            <div className={`absolute w-0 h-0 border-8 ${position === 'top' ? 'border-t-gray-900 border-r-gray-900/0 border-l-gray-900/0 border-b-gray-900/0 top-full left-1/2 transform -translate-x-1/2' : 
                           position === 'bottom' ? 'border-b-gray-900 border-r-gray-900/0 border-l-gray-900/0 border-t-gray-900/0 bottom-full left-1/2 transform -translate-x-1/2' : 
                           position === 'left' ? 'border-l-gray-900 border-t-gray-900/0 border-b-gray-900/0 border-r-gray-900/0 right-full top-1/2 transform -translate-y-1/2' : 
                           'border-r-gray-900 border-t-gray-900/0 border-b-gray-900/0 border-l-gray-900/0 left-full top-1/2 transform -translate-y-1/2'}`}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;