import React, { useEffect, useState } from 'react';

const SplashScreen: React.FC = () => {
  const [currentLetter, setCurrentLetter] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(true);
  const letters = ['D', 'R', 'K'];

  useEffect(() => {
    // Iniciar la animación después de un breve delay
    const startDelay = setTimeout(() => {
      setIsAnimating(true);
    }, 300);

    // Animación de la línea pasando por cada letra
    const interval = setInterval(() => {
      setCurrentLetter((prev) => {
        if (prev >= letters.length - 1) {
          // Mantener en la última letra
          return prev;
        }
        return prev + 1;
      });
    }, 500); // Velocidad de la animación (500ms por letra)

    // Limpiar después de que termine la animación completa
    const cleanup = setTimeout(() => {
      clearInterval(interval);
    }, 500 * letters.length + 1000);

    return () => {
      clearTimeout(startDelay);
      clearTimeout(cleanup);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-[#0f0f10] flex flex-col items-center justify-center z-50">
      {/* Logo/Ícono arriba: igual al loader actual del launcher */}
      <div className="mb-12">
        <div className="w-24 h-24 rounded-2xl bg-[#0b1a2f] flex items-center justify-center shadow-lg shadow-blue-500/40">
          <div className="w-16 h-16 border-4 border-blue-500 border-b-transparent rounded-xl animate-spin"></div>
        </div>
      </div>

      {/* Texto DRK con animación de línea */}
      <div className="relative flex items-center gap-6">
        {letters.map((letter, index) => (
          <div key={index} className="relative inline-block">
            <span
              className={`text-7xl font-bold transition-all duration-500 ${
                index <= currentLetter
                  ? 'text-blue-500'
                  : 'text-gray-700'
              }`}
              style={{
                textShadow: index <= currentLetter 
                  ? '0 0 30px rgba(59, 130, 246, 1), 0 0 60px rgba(59, 130, 246, 0.5)' 
                  : 'none',
                transition: 'all 0.5s ease-in-out',
                transform: index <= currentLetter ? 'scale(1.05)' : 'scale(1)'
              }}
            >
              {letter}
            </span>
            
            {/* Línea azul que pasa por cada letra */}
            {index === currentLetter && (
              <div
                className="absolute -bottom-3 left-0 h-2 bg-blue-500 rounded-full"
                style={{
                  boxShadow: '0 0 15px rgba(59, 130, 246, 1), 0 0 30px rgba(59, 130, 246, 0.6)',
                  animation: 'slideLine 0.5s ease-in-out forwards',
                  width: '100%'
                }}
              />
            )}
            
            {/* Mantener la línea visible en letras ya animadas */}
            {index < currentLetter && (
              <div
                className="absolute -bottom-3 left-0 right-0 h-2 bg-blue-500 rounded-full"
                style={{
                  boxShadow: '0 0 10px rgba(59, 130, 246, 0.8)',
                  opacity: 0.8
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Estilos CSS para la animación */}
      <style>{`
        @keyframes slideLine {
          0% {
            width: 0;
            opacity: 0;
            transform: scaleX(0);
          }
          50% {
            opacity: 1;
          }
          100% {
            width: 100%;
            opacity: 1;
            transform: scaleX(1);
          }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;

