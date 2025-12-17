import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tutorialService } from '../services/tutorialService';

export interface TutorialStep {
  target?: string; // CSS selector del elemento a resaltar
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon?: string;
}

interface TutorialOverlayProps {
  pageId: string;
  steps: TutorialStep[];
  onComplete?: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ pageId, steps, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Solo mostrar si no se ha completado este tutorial
    if (!tutorialService.hasCompletedTutorial(pageId)) {
      // Pequeño delay para asegurar que los elementos estén renderizados
      const timer = setTimeout(() => {
        setIsVisible(true);
        setIsAnimating(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [pageId]);

  useEffect(() => {
    if (isVisible && steps[currentStep]?.target) {
      const updatePosition = () => {
        const element = document.querySelector(steps[currentStep].target!);
        if (element) {
          const rect = element.getBoundingClientRect();
          setTargetRect(rect);
          
          // Scroll suave al elemento si no está visible
          const isInViewport = rect.top >= 0 && rect.bottom <= window.innerHeight;
          if (!isInViewport) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else {
          setTargetRect(null);
        }
      };

      // Delay para animación suave
      const timer = setTimeout(updatePosition, 100);
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition);
      };
    } else {
      setTargetRect(null);
    }
  }, [currentStep, steps, isVisible]);

  const handleNext = useCallback(() => {
    setIsAnimating(true);
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, steps.length]);

  const handleComplete = useCallback(() => {
    tutorialService.markTutorialCompleted(pageId);
    setIsAnimating(false);
    setTimeout(() => setIsVisible(false), 300);
    onComplete?.();
  }, [pageId, onComplete]);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  if (!isVisible || steps.length === 0) return null;

  const step = steps[currentStep];
  const position = step.position || 'center';

  // Calcular posición del tooltip
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect || position === 'center') {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      };
    }

    const padding = 24;
    const tooltipWidth = 380;

    switch (position) {
      case 'top':
        return {
          position: 'fixed',
          bottom: window.innerHeight - targetRect.top + padding,
          left: Math.max(20, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - 20)),
        };
      case 'bottom':
        return {
          position: 'fixed',
          top: targetRect.bottom + padding,
          left: Math.max(20, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - 20)),
        };
      case 'left':
        return {
          position: 'fixed',
          top: Math.max(20, targetRect.top + targetRect.height / 2 - 100),
          right: window.innerWidth - targetRect.left + padding,
        };
      case 'right':
        return {
          position: 'fixed',
          top: Math.max(20, targetRect.top + targetRect.height / 2 - 100),
          left: targetRect.right + padding,
        };
      default:
        return {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        };
    }
  };

  // Animación de la flecha
  const getArrowAnimation = () => {
    switch (position) {
      case 'top': return { y: [0, -8, 0] };
      case 'bottom': return { y: [0, 8, 0] };
      case 'left': return { x: [0, -8, 0] };
      case 'right': return { x: [0, 8, 0] };
      default: return {};
    }
  };

  const getArrowPosition = () => {
    if (!targetRect) return {};
    switch (position) {
      case 'top':
        return { left: targetRect.left + targetRect.width / 2 - 16, top: targetRect.top - 45 };
      case 'bottom':
        return { left: targetRect.left + targetRect.width / 2 - 16, top: targetRect.bottom + 8 };
      case 'left':
        return { left: targetRect.left - 45, top: targetRect.top + targetRect.height / 2 - 16 };
      case 'right':
        return { left: targetRect.right + 8, top: targetRect.top + targetRect.height / 2 - 16 };
      default:
        return {};
    }
  };

  const getArrowIcon = () => {
    switch (position) {
      case 'top': return '👇';
      case 'bottom': return '👆';
      case 'left': return '👉';
      case 'right': return '👈';
      default: return '✨';
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed inset-0 z-[90] pointer-events-none"
        >
          {/* Overlay oscuro con transición suave */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 pointer-events-auto"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
          />

          {/* Recorte iluminado para el elemento objetivo */}
          {targetRect && (
            <motion.div
              key={`highlight-${currentStep}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="absolute pointer-events-none"
              style={{
                left: targetRect.left - 12,
                top: targetRect.top - 12,
                width: targetRect.width + 24,
                height: targetRect.height + 24,
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.05)',
                boxShadow: `
                  0 0 0 4000px rgba(0, 0, 0, 0.75),
                  0 0 30px rgba(6, 182, 212, 0.6),
                  0 0 60px rgba(6, 182, 212, 0.3),
                  inset 0 0 30px rgba(6, 182, 212, 0.2)
                `,
                border: '2px solid rgba(6, 182, 212, 0.8)',
              }}
            >
              {/* Efecto de brillo pulsante */}
              <motion.div
                animate={{
                  opacity: [0.5, 1, 0.5],
                  scale: [1, 1.02, 1],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-xl"
                style={{
                  border: '2px solid rgba(6, 182, 212, 0.5)',
                  boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)',
                }}
              />
              
              {/* Efecto de partículas/destellos */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0"
                style={{
                  background: 'conic-gradient(from 0deg, transparent, rgba(6, 182, 212, 0.1), transparent, rgba(168, 85, 247, 0.1), transparent)',
                  borderRadius: '16px',
                }}
              />
            </motion.div>
          )}

          {/* Flecha animada apuntando al elemento */}
          {targetRect && position !== 'center' && (
            <motion.div
              key={`arrow-${currentStep}`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1, ...getArrowAnimation() }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ 
                opacity: { duration: 0.3 },
                scale: { duration: 0.3, type: 'spring' },
                x: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' },
                y: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' }
              }}
              className="absolute text-3xl pointer-events-none z-[95]"
              style={{
                ...getArrowPosition(),
                filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.8))',
              }}
            >
              {getArrowIcon()}
            </motion.div>
          )}

          {/* Tooltip con información */}
          <motion.div
            key={`tooltip-${currentStep}`}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ 
              duration: 0.5, 
              ease: [0.4, 0, 0.2, 1],
              delay: 0.1
            }}
            className="pointer-events-auto w-[380px] z-[100]"
            style={getTooltipStyle()}
          >
            <div className="bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 rounded-2xl shadow-2xl border border-cyan-500/40 overflow-hidden backdrop-blur-xl">
              {/* Header con gradiente animado */}
              <div className="relative px-6 py-5 overflow-hidden">
                <motion.div
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.2), rgba(168, 85, 247, 0.2), rgba(6, 182, 212, 0.2))',
                    backgroundSize: '200% 100%',
                  }}
                />
                <div className="relative flex items-center gap-4">
                  {step.icon && (
                    <motion.span 
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                      className="text-4xl"
                    >
                      {step.icon}
                    </motion.span>
                  )}
                  <div>
                    <motion.h3 
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.25 }}
                      className="font-bold text-white text-xl"
                    >
                      {step.title}
                    </motion.h3>
                    <motion.p 
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-sm text-cyan-300/80 mt-1"
                    >
                      Paso {currentStep + 1} de {steps.length}
                    </motion.p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="px-6 py-5"
              >
                <p className="text-gray-300 text-sm leading-relaxed">{step.description}</p>
              </motion.div>

              {/* Progress bar con animación */}
              <div className="px-6 pb-3">
                <div className="h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: `${(currentStep / steps.length) * 100}%` }}
                    animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, #06b6d4, #a855f7)',
                    }}
                  />
                </div>
              </div>

              {/* Footer con botones */}
              <div className="px-6 py-4 bg-gray-900/50 border-t border-gray-700/50 flex justify-between items-center">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSkip}
                  className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-700/50"
                >
                  Saltar tutorial
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-semibold rounded-xl shadow-lg transition-all text-sm"
                >
                  {currentStep < steps.length - 1 ? (
                    <span className="flex items-center gap-2">
                      Siguiente
                      <motion.span
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        →
                      </motion.span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      ¡Entendido!
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      >
                        ✓
                      </motion.span>
                    </span>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TutorialOverlay;
