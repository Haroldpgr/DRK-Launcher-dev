import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { profileService } from '../services/profileService';
import { ReactSkinview3d } from 'react-skinview3d';
import { modernSkins } from "../data/skins";
import { WalkingAnimation, RunningAnimation, IdleAnimation } from 'skinview3d';
import * as THREE from 'three';
import { showModernAlert, showModernConfirm } from '../utils/uiUtils';

// Añadir estilos CSS para renderizado pixelado
const customStyles = `
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
  const [drkSkins, setDrkSkins] = useState<Array<{ id: string; name: string; url: string; previewUrl: string }>>([]);
  const [isLoadingDrkSkins, setIsLoadingDrkSkins] = useState(false);
  const [selectedDrkSkin, setSelectedDrkSkin] = useState<string | null>(null);
  const [hasDrkAccount, setHasDrkAccount] = useState(false);
  const [currentDrkProfile, setCurrentDrkProfile] = useState<string | null>(null);

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
    const checkDrkAccount = () => {
      const currentUsername = profileService.getCurrentProfile();
      if (currentUsername) {
        const currentProfile = profileService.getProfileByUsername(currentUsername);
        
        // Verificar si el perfil actual es de tipo DRK
        const isDrk = currentProfile && currentProfile.type === 'drkauth';
        setHasDrkAccount(isDrk);
        setCurrentDrkProfile(isDrk ? currentUsername : null);
        
        // Cargar la skin del perfil local (puede ser URL o base64)
        const userSkin = profileService.getSkinForProfile(currentUsername);
        if (userSkin) {
          // Validar que la skin no sea una imagen de cuerpo renderizada
          if (!userSkin.includes('mc-heads.net/body') && !userSkin.includes('/body/')) {
            console.log('[SkinsPage] Skin local encontrada:', userSkin.substring(0, 50) + '...');
            setCurrentSkin(userSkin);
            setSkinPreview(userSkin);
          }
        }
      } else {
        setHasDrkAccount(false);
        setCurrentDrkProfile(null);
      }
    };

    checkDrkAccount();
    
    // Escuchar cambios en los perfiles
    const handleProfileUpdate = () => {
      checkDrkAccount();
    };
    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  // Función para actualizar la skin activa en el backend
  const updateActiveSkinInBackend = useCallback(async (skinUrl: string, accessToken: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/user/skin/active', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          skinUrl: skinUrl
        })
      });

      if (response.ok) {
        console.log('[SkinsPage] Skin activa sincronizada con el backend');
        return true;
      }
      return false;
    } catch (error) {
      console.error('[SkinsPage] Error al sincronizar skin con el backend:', error);
      return false;
    }
  }, []);

  // Función para cargar la skin activa desde el backend
  const loadActiveSkinFromBackend = useCallback(async () => {
    const currentUsername = profileService.getCurrentProfile();
    if (!currentUsername) return;

    const currentProfile = profileService.getProfileByUsername(currentUsername);
    if (!currentProfile || currentProfile.type !== 'drkauth') {
      return;
    }

    // Obtener el accessToken del perfil o del localStorage
    let accessToken = currentProfile.accessToken;
    
    if (!accessToken) {
      console.log('[SkinsPage] No hay accessToken en el perfil, buscando en localStorage...');
      const savedAuthData = localStorage.getItem('drkAuthData');
      if (savedAuthData) {
        try {
          const authData = JSON.parse(savedAuthData);
          accessToken = authData.accessToken;
          
          // Si encontramos el token en localStorage, actualizar el perfil
          if (accessToken) {
            console.log('[SkinsPage] Actualizando token en el perfil desde localStorage');
            const updatedProfile = profileService.addProfile(
              currentProfile.username,
              'drkauth',
              {
                accessToken: accessToken,
                clientToken: authData.clientToken
              }
            );
            accessToken = updatedProfile.accessToken;
          }
        } catch (e) {
          console.error('[SkinsPage] Error al parsear drkAuthData:', e);
        }
      }
    }

    if (!accessToken) {
      console.warn('[SkinsPage] No se encontró accessToken para cargar skin activa');
      return;
    }

    try {
      // Primero, verificar si hay una skin local que no esté en el backend
      const localSkin = profileService.getSkinForProfile(currentUsername);
      
      const response = await fetch('http://localhost:3000/api/user/skin/active', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.skinUrl) {
          console.log('[SkinsPage] Skin activa cargada desde el backend:', data.skinUrl.substring(0, 50) + '...');
          // Actualizar la skin en el perfil local y en el preview
          profileService.setSkinForProfile(currentUsername, data.skinUrl);
          setCurrentSkin(data.skinUrl);
          setSkinPreview(data.skinUrl);
        } else if (data.success && !data.skinUrl) {
          // Si no hay skin activa en el backend, pero hay una en el perfil local, sincronizar
          if (localSkin) {
            console.log('[SkinsPage] Sincronizando skin local con el backend:', localSkin.substring(0, 50) + '...');
            const success = await updateActiveSkinInBackend(localSkin, accessToken);
            if (success) {
              // Actualizar el preview con la skin local
              setCurrentSkin(localSkin);
              setSkinPreview(localSkin);
              console.log('[SkinsPage] Skin local sincronizada exitosamente con el backend');
            } else {
              console.warn('[SkinsPage] No se pudo sincronizar la skin local con el backend');
            }
          } else {
            console.log('[SkinsPage] No hay skin activa en el backend ni en el perfil local');
          }
        }
      } else if (response.status === 401) {
        console.warn('[SkinsPage] Token inválido, no se puede sincronizar');
      }
    } catch (error) {
      console.error('[SkinsPage] Error al cargar skin activa desde el backend:', error);
    }
  }, [updateActiveSkinInBackend]);

  // Función para sincronizar el token desde localStorage al perfil
  const syncTokenFromLocalStorage = useCallback((username: string) => {
    const savedAuthData = localStorage.getItem('drkAuthData');
    if (savedAuthData) {
      try {
        const authData = JSON.parse(savedAuthData);
        // Verificar que el usuario del localStorage coincida
        if (authData.selectedProfile?.name === username && authData.accessToken) {
          console.log('[SkinsPage] Sincronizando token desde localStorage al perfil...');
          profileService.addProfile(username, 'drkauth', {
            accessToken: authData.accessToken,
            clientToken: authData.clientToken
          });
          console.log('[SkinsPage] Token sincronizado exitosamente');
          return authData.accessToken;
        }
      } catch (e) {
        console.error('[SkinsPage] Error al sincronizar token:', e);
      }
    }
    return null;
  }, []);

  // Efecto separado para cargar skins cuando el usuario tiene cuenta DRK
  useEffect(() => {
    if (hasDrkAccount && currentDrkProfile) {
      // Primero, asegurarse de que la skin local se muestre
      const currentUsername = profileService.getCurrentProfile();
      if (currentUsername) {
        const localSkin = profileService.getSkinForProfile(currentUsername);
        if (localSkin && !localSkin.includes('/body/') && !localSkin.includes('mc-heads.net/body')) {
          console.log('[SkinsPage] Mostrando skin local:', localSkin.substring(0, 50) + '...');
          setCurrentSkin(localSkin);
          setSkinPreview(localSkin);
        }
      }
      
      // Función para verificar y sincronizar token
      const checkAndSyncToken = () => {
        if (currentUsername) {
          const token = syncTokenFromLocalStorage(currentUsername);
          if (token) {
            console.log('[SkinsPage] Token sincronizado desde localStorage');
            return true;
          }
        }
        return false;
      };
      
      // Verificar token inicialmente
      const hasToken = checkAndSyncToken();
      const currentProfile = profileService.getProfileByUsername(currentDrkProfile);
      const tokenAvailable = hasToken || currentProfile?.accessToken || localStorage.getItem('drkAuthData');
      
      if (tokenAvailable) {
        loadDrkSkins();
        loadActiveSkinFromBackend();
      }
      
      // Sincronizar periódicamente (cada 5 segundos para detectar nuevos tokens más rápido)
      const syncInterval = setInterval(() => {
        const tokenSynced = checkAndSyncToken();
        if (tokenSynced) {
          // Si se sincronizó un nuevo token, cargar datos del backend
          loadDrkSkins();
          loadActiveSkinFromBackend();
        } else {
          // Si ya había token, solo actualizar skin activa
          const profile = profileService.getProfileByUsername(currentDrkProfile);
          if (profile?.accessToken) {
            loadActiveSkinFromBackend();
          }
        }
      }, 5000); // Verificar cada 5 segundos en lugar de 30
      
      // También escuchar eventos de almacenamiento (si el usuario abre la página web en otra ventana)
      const storageListener = (e: StorageEvent) => {
        if (e.key === 'drkAuthData' && e.newValue) {
          console.log('[SkinsPage] Detectado cambio en drkAuthData, sincronizando token...');
          checkAndSyncToken();
          loadDrkSkins();
          loadActiveSkinFromBackend();
        }
      };
      
      // Escuchar cambios en localStorage (solo funciona si la página web está en la misma ventana)
      window.addEventListener('storage', storageListener);
      
      return () => {
        clearInterval(syncInterval);
        window.removeEventListener('storage', storageListener);
      };
    }
  }, [hasDrkAccount, currentDrkProfile, loadActiveSkinFromBackend, syncTokenFromLocalStorage]);

  const loadDrkSkins = async () => {
    const currentUsername = profileService.getCurrentProfile();
    if (!currentUsername) {
      console.log('[SkinsPage] No hay usuario actual');
      setIsLoadingDrkSkins(false);
      return;
    }

    const currentProfile = profileService.getProfileByUsername(currentUsername);
    if (!currentProfile || currentProfile.type !== 'drkauth') {
      console.log('[SkinsPage] No hay perfil DRK válido:', {
        hasProfile: !!currentProfile,
        profileType: currentProfile?.type
      });
      setIsLoadingDrkSkins(false);
      return;
    }

    console.log('[SkinsPage] Cargando skins DRK para:', currentProfile.username);
    console.log('[SkinsPage] Perfil completo:', {
      username: currentProfile.username,
      type: currentProfile.type,
      hasAccessToken: !!currentProfile.accessToken,
      accessTokenLength: currentProfile.accessToken?.length
    });

    setIsLoadingDrkSkins(true);
    try {
      // Obtener el accessToken del perfil o del localStorage
      let accessToken = currentProfile.accessToken;
      
      if (!accessToken) {
        console.log('[SkinsPage] No hay accessToken en el perfil, buscando en localStorage...');
        // Intentar obtenerlo del localStorage como fallback
        const savedAuthData = localStorage.getItem('drkAuthData');
        console.log('[SkinsPage] Datos en localStorage:', {
          hasData: !!savedAuthData,
          dataLength: savedAuthData?.length
        });
        
        if (savedAuthData) {
          try {
            const authData = JSON.parse(savedAuthData);
            console.log('[SkinsPage] Datos parseados de localStorage:', {
              hasAccessToken: !!authData.accessToken,
              accessTokenLength: authData.accessToken?.length,
              hasClientToken: !!authData.clientToken,
              hasSelectedProfile: !!authData.selectedProfile,
              selectedProfileName: authData.selectedProfile?.name
            });
            
            accessToken = authData.accessToken;
            console.log('[SkinsPage] Token encontrado en localStorage:', {
              hasToken: !!accessToken,
              tokenLength: accessToken?.length,
              tokenPreview: accessToken ? accessToken.substring(0, 20) + '...' : 'NO HAY'
            });
            
            // Si encontramos el token en localStorage, actualizar el perfil SIEMPRE
            if (accessToken) {
              console.log('[SkinsPage] Actualizando token en el perfil desde localStorage');
              const updatedProfile = profileService.addProfile(
                currentProfile.username,
                'drkauth',
                {
                  accessToken: accessToken,
                  clientToken: authData.clientToken
                }
              );
              console.log('[SkinsPage] Perfil actualizado:', {
                username: updatedProfile.username,
                type: updatedProfile.type,
                hasAccessToken: !!updatedProfile.accessToken,
                accessTokenLength: updatedProfile.accessToken?.length
              });
              
              // Usar el token del perfil actualizado
              accessToken = updatedProfile.accessToken;
            }
          } catch (e) {
            console.error('[SkinsPage] Error al parsear drkAuthData:', e);
          }
        } else {
          console.warn('[SkinsPage] No hay datos en localStorage (drkAuthData)');
        }
      }

      if (!accessToken) {
        console.warn('[SkinsPage] No se encontró accessToken para cargar skins');
        setIsLoadingDrkSkins(false);
        return;
      }

      console.log('[SkinsPage] Enviando solicitud con token:', {
        tokenLength: accessToken.length,
        tokenPreview: accessToken.substring(0, 20) + '...'
      });

      const response = await fetch('http://localhost:3000/api/user/skins', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('[SkinsPage] Respuesta del servidor:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[SkinsPage] Datos recibidos:', data);
        if (data.success && data.skins) {
          // Convertir las skins al formato esperado
          const formattedSkins = data.skins.map((skin: any) => ({
            id: skin.id,
            name: skin.name,
            url: skin.url,
            previewUrl: `https://minotar.net/skin/${currentProfile.username || 'Steve'}` // Usar minotar para preview
          }));
          setDrkSkins(formattedSkins);
          console.log('[SkinsPage] Skins cargadas exitosamente:', formattedSkins.length);
        }
      } else if (response.status === 401) {
        const errorData = await response.json().catch(() => ({}));
        console.warn('[SkinsPage] Token expirado o inválido:', errorData);
        console.warn('[SkinsPage] Perfil actual:', {
          username: currentProfile.username,
          hasAccessToken: !!currentProfile.accessToken
        });
        // Limpiar el token inválido del perfil
        if (currentProfile.accessToken) {
          console.log('[SkinsPage] Limpiando token inválido del perfil');
          profileService.addProfile(
            currentProfile.username,
            'drkauth',
            {
              accessToken: undefined,
              clientToken: undefined
            }
          );
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('[SkinsPage] Error al cargar skins:', {
          status: response.status,
          error: errorData
        });
      }
    } catch (error) {
      console.error('[SkinsPage] Error al cargar skins desde DRK:', error);
    } finally {
      setIsLoadingDrkSkins(false);
    }
  };

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

// Función auxiliar para obtener el token del perfil o localStorage
// Siempre intenta sincronizar desde localStorage primero para obtener el token más reciente
const getAccessTokenForProfile = (username: string): string | null => {
  const currentProfile = profileService.getProfileByUsername(username);
  
  // Primero intentar obtener de localStorage (puede tener un token más reciente)
  if (currentProfile?.type === 'drkauth') {
    const savedAuthData = localStorage.getItem('drkAuthData');
    if (savedAuthData) {
      try {
        const authData = JSON.parse(savedAuthData);
        
        // Verificar que el usuario del localStorage coincida con el perfil actual
        if (authData.selectedProfile?.name === username && authData.accessToken) {
          // Si el token en localStorage es diferente al del perfil, actualizar el perfil
          if (currentProfile.accessToken !== authData.accessToken) {
            console.log('[SkinsPage] Token actualizado desde localStorage al perfil');
            profileService.addProfile(username, 'drkauth', {
              accessToken: authData.accessToken,
              clientToken: authData.clientToken
            });
          }
          return authData.accessToken;
        }
      } catch (e) {
        console.error('[SkinsPage] Error al parsear drkAuthData:', e);
      }
    }
  }
  
  // Si no hay en localStorage, usar el token del perfil
  return currentProfile?.accessToken || null;
};

const handleSaveSkin = async () => {
  const currentUser = profileService.getCurrentProfile();
  if (skinPreview && currentUser) {
    // Guardar en el perfil local (puede ser URL o base64)
    profileService.setSkinForProfile(currentUser, skinPreview);
    setCurrentSkin(skinPreview);
    
    console.log('[SkinsPage] Skin guardada localmente:', {
      username: currentUser,
      skinType: skinPreview.startsWith('data:') ? 'base64' : 'URL',
      skinPreview: skinPreview.substring(0, 50) + '...'
    });
    
    // Obtener el token usando la función auxiliar
    const currentProfile = profileService.getProfileByUsername(currentUser);
    const accessToken = getAccessTokenForProfile(currentUser);
    
    console.log('[SkinsPage] Token obtenido para sincronización:', {
      hasToken: !!accessToken,
      tokenLength: accessToken?.length,
      tokenPreview: accessToken ? accessToken.substring(0, 20) + '...' : 'NO HAY',
      profileType: currentProfile?.type,
      isDrk: currentProfile?.type === 'drkauth'
    });
    
    // Si es una cuenta DRK, intentar sincronizar con el backend en segundo plano
    // No interrumpimos al usuario si no hay token o si falla la sincronización
    if (currentProfile && currentProfile.type === 'drkauth' && accessToken) {
      // Sincronizar en segundo plano sin bloquear la UI
      (async () => {
        try {
          console.log('[SkinsPage] Sincronizando skin con el backend en segundo plano...', {
            username: currentUser,
            tokenLength: accessToken.length,
            tokenPreview: accessToken.substring(0, 20) + '...',
            skinType: skinPreview.startsWith('data:') ? 'base64' : 'URL',
            skinLength: skinPreview.length,
            skinPreview: skinPreview.substring(0, 50) + '...'
          });
          
          const response = await fetch('http://localhost:3000/api/user/skin/active', {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              skinUrl: skinPreview
            })
          });

          if (response.ok) {
            const data = await response.json();
            console.log('[SkinsPage] Skin sincronizada exitosamente con el backend:', {
              success: data.success,
              message: data.message
            });
          } else if (response.status === 401) {
            console.warn('[SkinsPage] Token inválido o expirado. El usuario necesita iniciar sesión de nuevo en la página web.');
          } else {
            console.warn('[SkinsPage] Error al sincronizar con el backend:', response.status);
          }
        } catch (error: any) {
          console.error('[SkinsPage] Error de conexión al sincronizar con el backend:', error);
          // No mostrar error al usuario, solo loguear
        }
      })();
    } else if (currentProfile && currentProfile.type === 'drkauth' && !accessToken) {
      console.log('[SkinsPage] No hay token disponible. La skin se guardó localmente. Para sincronizar, inicia sesión en la página web.');
    }
    
    // Mostrar mensaje de éxito siempre (la skin siempre se guarda localmente)
    await showModernAlert(
      '¡Éxito!', 
      '¡Skin guardada exitosamente en tu perfil!' + 
      (currentProfile && currentProfile.type === 'drkauth' && accessToken 
        ? ' Se está sincronizando con el servidor en segundo plano.' 
        : currentProfile && currentProfile.type === 'drkauth' && !accessToken
        ? '\n\nPara sincronizar con el servidor, inicia sesión en la página web de DRK Launcher (http://localhost:3000) y luego guarda la skin de nuevo.'
        : ''),
      'success'
    );
  } else if (!currentUser) {
    await showModernAlert('Acción requerida', 'Por favor inicia sesión con un perfil antes de guardar una skin.', 'warning');
  } else {
    await showModernAlert('Información', 'Por favor selecciona una skin antes de guardar.', 'info');
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

        <div className="flex flex-col gap-3">
          <Button
            onClick={handleSaveSkin}
            className="w-full py-4 text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-500/20"
          >
            Aplicar Skin al Perfil
          </Button>
          <Button
            onClick={async () => {
              const currentUsername = profileService.getCurrentProfile();
              if (currentUsername) {
                // Primero sincronizar el token desde localStorage
                const tokenSynced = syncTokenFromLocalStorage(currentUsername);
                if (tokenSynced) {
                  console.log('[SkinsPage] Token sincronizado manualmente');
                }
                // Luego cargar la skin activa
                await loadActiveSkinFromBackend();
                // También recargar las skins
                await loadDrkSkins();
                await showModernAlert('¡Actualizado!', 'Token sincronizado y skin activa cargada desde el servidor.', 'success');
              } else {
                await showModernAlert('Error', 'No hay usuario actual seleccionado.', 'error');
              }
            }}
            className="w-full py-3 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sincronizar Token y Actualizar Skin
          </Button>
        </div>
      </div>

      {/* Panel Derecho: Selección y Carga */}
      <div className="lg:w-7/12 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">

        {/* Skins desde DRK */}
        <Card className="p-6 bg-gray-800/50 border-gray-700/50">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
            Skins desde DRK
          </h3>
          
          {isLoadingDrkSkins ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
              <span className="ml-3 text-gray-400">Cargando skins...</span>
            </div>
          ) : drkSkins.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {drkSkins.map((skin) => (
                <div
                  key={skin.id}
                  onClick={() => {
                    setSelectedDrkSkin(skin.id);
                    setSkinPreview(skin.url);
                    setSelectedPublicSkin(null);
                  }}
                  className={`group relative bg-gray-900/40 border rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] ${selectedDrkSkin === skin.id ? 'border-cyan-500 ring-1 ring-cyan-500' : 'border-gray-700 hover:border-cyan-500/50'}`}
                >
                  <div className="aspect-square bg-gray-800/50 p-4 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-end justify-center pb-3">
                      <span className="text-white text-xs font-bold px-2 py-1 bg-cyan-600 rounded-full">Usar</span>
                    </div>
                    <img
                      src={skin.previewUrl || skin.url}
                      alt={skin.name}
                      className="w-full h-full object-contain pixelated filter drop-shadow-xl transform group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://minotar.net/skin/MHF_Steve';
                      }}
                    />
                  </div>
                  <div className="p-3 bg-gray-900/80">
                    <h4 className="text-sm font-medium text-gray-200 truncate">{skin.name}</h4>
                  </div>
                </div>
              ))}
            </div>
          ) : !hasDrkAccount ? (
            <div className="text-center py-8">
              <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-200 font-semibold mb-2">⚠️ Inicia sesión con DRK primero</p>
                <p className="text-yellow-300/80 text-sm">
                  Necesitas tener una cuenta DRK iniciada para acceder al gestor de skins. Ve a la sección de perfiles e inicia sesión con DRK.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No tienes skins guardadas en DRK</p>
              <button
                onClick={() => window.open('http://localhost:3000/skins', '_blank')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                Abrir Gestor de Skins DRK
              </button>
            </div>
          )}
        </Card>

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