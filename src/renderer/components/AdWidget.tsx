import React, { useEffect, useRef, useState } from 'react';

interface AdWidgetProps {
  /** ID único para el anuncio */
  adId: string;
  /** Tipo de anuncio: 'banner', 'card', 'skyscraper' */
  type?: 'banner' | 'card' | 'skyscraper';
  /** Tamaño personalizado (opcional) */
  width?: number;
  height?: number;
  /** Clase CSS adicional */
  className?: string;
  /** Si es true, muestra un placeholder para desarrollo */
  showPlaceholder?: boolean;
  /** Contenido personalizado del anuncio (HTML o React) */
  customContent?: React.ReactNode;
  /** URL del anuncio (para anuncios propios) */
  adUrl?: string;
  /** Imagen del anuncio (para anuncios propios) */
  adImage?: string;
  /** Título del anuncio (para anuncios propios) */
  adTitle?: string;
  /** Descripción del anuncio (para anuncios propios) */
  adDescription?: string;
}

/**
 * Componente reutilizable para mostrar anuncios
 * Soporta Google AdSense, anuncios propios, o placeholders
 */
export default function AdWidget({ 
  adId, 
  type = 'card',
  width,
  height,
  className = '',
  showPlaceholder = false,
  customContent,
  adUrl,
  adImage,
  adTitle,
  adDescription
}: AdWidgetProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);

  // Dimensiones por defecto según el tipo
  const getDimensions = () => {
    if (width && height) return { width, height };
    
    switch (type) {
      case 'banner':
        return { width: 728, height: 90 };
      case 'skyscraper':
        return { width: 160, height: 600 };
      case 'card':
      default:
        return { width: 300, height: 250 };
    }
  };

  const dimensions = getDimensions();

  useEffect(() => {
    if (showPlaceholder || !adRef.current) return;

    // Cargar script de Google AdSense si está disponible
    if ((window as any).adsbygoogle && !adLoaded) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        setAdLoaded(true);
      } catch (err) {
        console.error('Error cargando anuncio AdSense:', err);
      }
    }
  }, [adId, showPlaceholder, adLoaded]);

  // Si hay contenido personalizado, mostrarlo
  if (customContent) {
    return (
      <div 
        ref={adRef}
        className={`ad-container ${className}`}
        style={{ width: '100%' }}
      >
        {customContent}
      </div>
    );
  }

  // Si hay datos de anuncio propio, mostrarlo
  if (adUrl || adImage || adTitle) {
    return (
      <a
        href={adUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className={`block ${className}`}
        onClick={(e) => {
          if (!adUrl) e.preventDefault();
        }}
      >
        <div 
          ref={adRef}
          className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-700/50 hover:border-blue-600/50 transition-all overflow-hidden group cursor-pointer"
          style={{ minHeight: `${dimensions.height}px`, width: '100%' }}
        >
          {adImage && (
            <div className="w-full h-32 bg-gray-800/50 overflow-hidden">
              <img 
                src={adImage} 
                alt={adTitle || 'Anuncio'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}
          {(adTitle || adDescription) && (
            <div className="p-4">
              {adTitle && (
                <div className="font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
                  {adTitle}
                </div>
              )}
              {adDescription && (
                <div className="text-xs text-gray-400 line-clamp-2">
                  {adDescription}
                </div>
              )}
            </div>
          )}
        </div>
      </a>
    );
  }

  // Placeholder para desarrollo
  if (showPlaceholder) {
    return (
      <div 
        ref={adRef}
        className={`bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-xl p-4 flex items-center justify-center ${className}`}
        style={{ minHeight: `${dimensions.height}px`, width: '100%' }}
      >
        <div className="text-center text-gray-500 text-sm">
          <div className="text-xs uppercase font-semibold mb-2 text-gray-600">Anuncio</div>
          <div className="text-xs">{dimensions.width}x{dimensions.height}px</div>
          <div className="text-[10px] text-gray-600 mt-1">ID: {adId}</div>
        </div>
      </div>
    );
  }

  // Google AdSense
  return (
    <div 
      ref={adRef}
      className={`ad-container ${className}`}
      style={{ 
        width: '100%', 
        minHeight: `${dimensions.height}px`,
        maxWidth: `${dimensions.width}px`,
        margin: '0 auto'
      }}
    >
      {/* Contenedor para Google AdSense */}
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: `${dimensions.height}px` }}
        data-ad-client="ca-pub-TU_PUBLISHER_ID" // Reemplazar con tu ID de AdSense
        data-ad-slot={adId} // ID del slot de anuncio
        data-ad-format={type === 'banner' ? 'horizontal' : 'auto'}
        data-full-width-responsive="true"
      />
      
      {/* Fallback si AdSense no está disponible */}
      <div className="ad-fallback bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl border border-blue-700/30 p-4 flex items-center justify-center h-full">
        <div className="text-center text-gray-400 text-xs">
          <div className="text-[10px] uppercase font-semibold mb-1 text-gray-500">Anuncio</div>
          <div className="text-[10px]">{dimensions.width}x{dimensions.height}px</div>
        </div>
      </div>
    </div>
  );
}

