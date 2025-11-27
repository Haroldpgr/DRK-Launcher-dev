import React, { useState, useRef, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { profileService } from '../services/profileService';
import { ReactSkinview3d } from 'react-skinview3d';
import { modernSkins } from "../data/skins";
import { WalkingAnimation, RunningAnimation, IdleAnimation } from 'skinview3d';
import * as THREE from 'three';

// Añadir estilos CSS para los scrolls personalizados y renderizado pixelado
const customStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(26, 32, 44, 0.5);
    border-radius: 4px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(to bottom, #4f46e5, #7c3aed);
    border-radius: 4px;
    transition: all 0.3s ease;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(to bottom, #6366f1, #8b5cf6);
  }

  .pixelated {
    image-rendering: pixelated;
    image-rendering: -moz-crisp-edges;
    image-rendering: crisp-edges;
  }
`;

// Añadir los estilos al documento cuando el componente se monta
if (typeof document !== 'undefined') {
  let styleElement = document.getElementById('custom-skin-styles');
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = 'custom-skin-styles';
    styleElement.textContent = customStyles;
    document.head.appendChild(styleElement);
  }
}

interface Skin {
  id: string;
  name: string;
  url: string;
  previewUrl: string;
  isPublic: boolean;
}

const SkinsPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSkinUrl, setSelectedSkinUrl] = useState<string>('');
  // Default to Steve if no skin is selected
  const [skinPreview, setSkinPreview] = useState<string>('https://minotar.net/skin/MHF_Steve');
  const [selectedPublicSkin, setSelectedPublicSkin] = useState<Skin | null>(null);
  const [skinCategory, setSkinCategory] = useState<'basic' | 'modern'>('basic');
  const [currentSkin, setCurrentSkin] = useState<string | null>(null);
  const [animationState, setAnimationState] = useState<'idle' | 'walk' | 'run'>('idle');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [viewerSize, setViewerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const skinViewerRef = useRef<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (containerRef.current) {
        setViewerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    // Initial size
    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const currentUser = profileService.getCurrentProfile();
    if (currentUser) {
      const userSkin = profileService.getSkinForProfile(currentUser);
      // Validate that the skin is not a rendered body image (which causes 180x432 error)
      if (userSkin && !userSkin.includes('mc-heads.net/body')) {
        setCurrentSkin(userSkin);
        setSkinPreview(userSkin);
      }
    }
  }, []);

  // Effect to update animation without remounting
  useEffect(() => {
    if (skinViewerRef.current) {
      const viewer = skinViewerRef.current;
      viewer.animation = animationState === 'idle' ? new IdleAnimation() :
        animationState === 'walk' ? new WalkingAnimation() :
          new RunningAnimation();
    }
  }, [animationState]);

  // Effect to update autoRotate without remounting
  useEffect(() => {
    if (skinViewerRef.current) {
      skinViewerRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Lista de skins básicas (5 skins)
  const basicSkins: Skin[] = [
    {
      id: '1',
      name: 'Classic Steve',
      url: 'https://minotar.net/skin/MHF_Steve',
      previewUrl: 'https://minotar.net/body/MHF_Steve',
      isPublic: true
    },
    {
      id: '2',
      name: 'Classic Alex',
      url: 'https://minotar.net/skin/MHF_Alex',
      previewUrl: 'https://minotar.net/body/MHF_Alex',
      isPublic: true
    },
    {
      id: '3',
      name: 'Technoblade',
      url: 'https://minotar.net/skin/Technoblade',
      previewUrl: 'https://minotar.net/body/Technoblade',
      isPublic: true
    },
    {
      id: '4',
      name: 'Dream',
      url: 'https://minotar.net/skin/Dream',
      previewUrl: 'https://minotar.net/body/Dream',
      isPublic: true
    },
    {
      id: '5',
      name: 'TommyInnit',
      url: 'https://minotar.net/skin/TommyInnit',
      previewUrl: 'https://minotar.net/body/TommyInnit',
      isPublic: true
    }
  ];
  
  // Combinar con modernSkins
  const allSkins = [...basicSkins, ...modernSkins];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file && file.type.startsWith('image/')) {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setSkinPreview(result);
      setSelectedPublicSkin(null); // Clear public selection
    };
    reader.readAsDataURL(file);
  }
};

const handleUrlChange = () => {
  if (selectedSkinUrl) {
    setSkinPreview(selectedSkinUrl);
    setSelectedPublicSkin(null);
  }
};

const handleUsePublicSkin = (skin: Skin) => {
  setSelectedPublicSkin(skin);
  setSkinPreview(skin.url); // Use the actual texture URL for 3D view
};

const handleSaveSkin = () => {
  const currentUser = profileService.getCurrentProfile();
  if (skinPreview && currentUser) {
    profileService.setSkinForProfile(currentUser, skinPreview);
    setCurrentSkin(skinPreview);
    alert('¡Skin guardada exitosamente en tu perfil!');
  } else if (!currentUser) {
    alert('Por favor inicia sesión con un perfil antes de guardar una skin.');
  } else {
    alert('Por favor selecciona una skin antes de guardar.');
  }
};

const handleUploadClick = () => {
  fileInputRef.current?.click();
};

return (
  <div className="h-full flex flex-col p-6 max-w-[1600px] mx-auto">
    {/* Fondo decorativo */}
    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-900/10 to-purple-900/10 -z-10"></div>

    {/* Header */}
    <div className="mb-8">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
        Personalización de Skin
      </h1>
      <p className="text-gray-400 mt-2">
        Visualiza y personaliza tu apariencia en el juego con nuestro editor 3D
      </p>
    </div>

    <div className="flex flex-col lg:flex-row gap-8 h-full min-h-[600px]">
      {/* Panel Izquierdo: Vista Previa 3D */}
      <div className="lg:w-5/12 flex flex-col gap-4">
        <Card className="flex-1 p-0 overflow-hidden relative bg-gray-900/50 border-gray-700/50 backdrop-blur-xl">
          <div ref={containerRef} className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-gray-800/20 to-gray-900/80">
            {viewerSize.width > 0 && viewerSize.height > 0 && (
              <ReactSkinview3d
                skinUrl={skinPreview}
                height={viewerSize.height}
                width={viewerSize.width}
                onReady={({ viewer }) => {
                  skinViewerRef.current = viewer;
                  // Configuración inicial
                  viewer.animation = animationState === 'idle' ? new IdleAnimation() :
                    animationState === 'walk' ? new WalkingAnimation() :
                      new RunningAnimation();
                  viewer.autoRotate = autoRotate;
                }}
                // Only re-mount if dimensions change significantly or skin changes (though skin change might be handled by prop update)
                // Removing animation and rotation from key to prevent re-mounts
                key={`${viewerSize.width}-${viewerSize.height}`}
              />
            )}
          </div>

          {/* Controles de Vista Previa */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900/80 backdrop-blur-md rounded-full px-6 py-3 border border-gray-700 flex items-center gap-4 shadow-2xl">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`p-2 rounded-full transition-all ${autoRotate ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
              title="Auto Rotar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            </button>

            <div className="h-6 w-px bg-gray-700"></div>

            <div className="flex gap-2">
              <button
                onClick={() => setAnimationState('idle')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${animationState === 'idle' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 'text-gray-400 hover:text-white'}`}
              >
                Quieto
              </button>
              <button
                onClick={() => setAnimationState('walk')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${animationState === 'walk' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 'text-gray-400 hover:text-white'}`}
              >
                Caminar
              </button>
              <button
                onClick={() => setAnimationState('run')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${animationState === 'run' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 'text-gray-400 hover:text-white'}`}
              >
                Correr
              </button>
            </div>
          </div>
        </Card>

        <Button
          onClick={handleSaveSkin}
          className="w-full py-4 text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-500/20"
        >
          Aplicar Skin al Perfil
        </Button>
      </div>

      {/* Panel Derecho: Selección y Carga */}
      <div className="lg:w-7/12 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">

        {/* Carga de Archivos */}
        <Card className="p-6 bg-gray-800/50 border-gray-700/50">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
            Subir tu propia Skin
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={handleUploadClick}
              className="border-2 border-dashed border-gray-600 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-gray-700/30 transition-all group"
            >
              <div className="p-3 bg-gray-700 rounded-full mb-3 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                <svg className="w-8 h-8 text-gray-400 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              </div>
              <span className="text-gray-300 font-medium">Seleccionar archivo</span>
              <span className="text-gray-500 text-sm mt-1">.png (64x64 o 64x32)</span>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

            <div className="flex flex-col gap-3">
              <label className="text-sm text-gray-400">O cargar desde URL:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://..."
                  value={selectedSkinUrl}
                  onChange={(e) => setSelectedSkinUrl(e.target.value)}
                  className="flex-1 bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <Button onClick={handleUrlChange} className="px-4 bg-gray-700 hover:bg-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-auto">
                Asegúrate de que la URL apunte directamente a la imagen de la skin.
              </p>
            </div>
          </div>
        </Card>

        {/* Galería de Skins */}
        <Card className="p-6 bg-gray-800/50 border-gray-700/50 flex-1">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              Galería de Skins
            </h3>

            <div className="flex bg-gray-900/50 rounded-lg p-1">
              <button
                onClick={() => setSkinCategory('basic')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${skinCategory === 'basic' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
              >
                Básicas
              </button>
              <button
                onClick={() => setSkinCategory('modern')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${skinCategory === 'modern' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
              >
                Modernas
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {(skinCategory === 'basic' ? basicSkins : modernSkins).map((skin) => (
              <div
                key={skin.id}
                onClick={() => handleUsePublicSkin(skin)}
                className={`group relative bg-gray-900/40 border rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] ${selectedPublicSkin?.id === skin.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-700 hover:border-gray-500'}`}
              >
                <div className="aspect-square bg-gray-800/50 p-4 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-end justify-center pb-3">
                    <span className="text-white text-xs font-bold px-2 py-1 bg-blue-600 rounded-full">Probar</span>
                  </div>
                  <img
                    src={skin.previewUrl}
                    alt={skin.name}
                    className="w-full h-full object-contain pixelated filter drop-shadow-xl transform group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="p-3 bg-gray-900/80">
                  <h4 className="text-sm font-medium text-gray-200 truncate">{skin.name}</h4>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  </div>
);
};

export default SkinsPage;