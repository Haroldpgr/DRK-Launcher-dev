import React, { useEffect, useState, Suspense, lazy, useCallback, useMemo } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import { profileService, type Profile } from './services/profileService' // Import the actual profile service
import { themeService } from './services/themeService';
import { processMonitorService } from './services/processMonitorService';
import NotificationContainer from './components/NotificationContainer';
import DownloadProgressWidget from './components/DownloadProgressWidget';

// Lazy loading de componentes pesados para optimizar memoria
const Home = lazy(() => import('./pages/Home'));
const ContentPage = lazy(() => import('./pages/ContentPage'));
const SkinsPage = lazy(() => import('./pages/SkinsPage'));
const Instances = lazy(() => import('./pages/Instances'));
const CreateInstance = lazy(() => import('./pages/CreateInstance'));
const Servers = lazy(() => import('./pages/Servers'));
const CrashAnalyzer = lazy(() => import('./pages/CrashAnalyzer'));
const ModpackImporter = lazy(() => import('./pages/ModpackImporter'));
const DownloadsView = lazy(() => import('./components/DownloadsView'));
const SettingsModal = lazy(() => import('./components/SettingsModal'));
const LoginModal = lazy(() => import('./components/LoginModal'));

// Componente de carga optimizado
const LoadingFallback = React.memo(() => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
  </div>
));
LoadingFallback.displayName = 'LoadingFallback';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light' | 'oled'>('dark')
  const [isSettingsOpen, setSettingsOpen] = useState(false) // State for the modal
  const [isLoginModalOpen, setLoginModalOpen] = useState(false); // State for LoginModal
  const [javaInstallations, setJavaInstallations] = useState([]) // State for Java installations
  const [accounts, setAccounts] = useState<Profile[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // Escuchar eventos de actualización de perfiles
  useEffect(() => {
    const handleProfileUpdate = () => {
      const updatedProfiles = profileService.getAllProfiles();
      setAccounts(updatedProfiles);
      const current = profileService.getCurrentProfile();
      if (current) {
        setCurrentUser(current);
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);
  const nav = useNavigate()
  const loc = useLocation()

  useEffect(() => {
    // Load profiles and current user from service
    const initialProfiles = profileService.getAllProfiles();
    setAccounts(initialProfiles);

    const initialCurrentUser = profileService.getCurrentProfile();
    setCurrentUser(initialCurrentUser);

    // Load settings and initialize theme
    const a: any = (window as any).api;
    if (a) {
      if (a.settings) {
        a.settings.get().then((s: any) => {
          // Initialize theme service with appearance settings
          themeService.initializeTheme(s.appearance || {
            theme: 'dark',
            accentColor: '#3B82F6',
            advancedRendering: false,
            globalFontSize: 1.0,
            enableTransitions: true,
            backgroundOpacity: 0.3,
            borderRadius: 8,
            colorFilter: 'none'
          });
        })
      }
      if (a.java && typeof a.java.detect === 'function') {
        a.java.detect().then((installations: any) => {
          setJavaInstallations(installations);
        }).catch((err: any) => {
          console.error("Error detecting Java:", err);
        });
      }
    }
  }, [])

  useEffect(() => {
    // Remover todas las clases de tema
    document.documentElement.classList.remove('dark', 'light', 'oled');

    // Añadir la clase correspondiente al tema actual
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'oled') {
      // El tema OLED requiere la clase 'dark' también para activar los estilos oscuros
      document.documentElement.classList.add('dark');
      // Añadimos una clase específica para estilos OLED si es necesario
      document.body.classList.add('oled-theme');
    } else {
      // Para el tema claro, no añadimos 'dark', pero aseguramos que no tenga clases de tema oscuro
      document.body.classList.remove('oled-theme');
    }
  }, [theme])

  const handleNavigation = (path: string) => {
    if (path === '/settings') {
      setSettingsOpen(true)
    } else {
      nav(path)
    }
  }

  const handleSettingsChanged = (settings: any) => {
    // Handle appearance settings changes
    if (settings.appearance) {
      themeService.initializeTheme(settings.appearance);
    }
    // Re-detect Java installations if settings changed (e.g., javaPath might have been set manually)
    if (settings.javaPath) {
      const a: any = (window as any).api;
      if (a.java && typeof a.java.detect === 'function') {
        a.java.detect().then((installations: any) => {
          setJavaInstallations(installations);
        }).catch((err: any) => {
          console.error("Error detecting Java:", err);
        });
      }
    }
  };

  const handleJavaDetect = () => {
    const a: any = (window as any).api;
    if (a.java && typeof a.java.detect === 'function') {
      a.java.detect().then((installations: any) => {
        setJavaInstallations(installations);
      }).catch((err: any) => {
        console.error("Error detecting Java:", err);
      });
    }
  };

  const handleAddAccount = (username: string, type: 'microsoft' | 'non-premium' | 'elyby' = 'non-premium') => {
    const newProfile = profileService.addProfile(username, type);
    console.log('[App] Perfil agregado:', newProfile);
    const updatedProfiles = profileService.getAllProfiles();
    console.log('[App] Todos los perfiles actualizados:', updatedProfiles.map(p => ({ username: p.username, type: p.type })));
    setAccounts(updatedProfiles);
    setCurrentUser(username);
  }, []);

  const handleDeleteAccount = async (username: string) => {
    // Verificar si la cuenta a eliminar es de tipo DRK
    const profileToDelete = profileService.getProfileByUsername(username);
    const isDrkAccount = profileToDelete && profileToDelete.type === 'drkauth';
    const accessToken = profileToDelete?.accessToken;
    
    const success = profileService.deleteProfile(username);
    if (success) {
      // Si es una cuenta DRK, cerrar sesión en la web también
      if (isDrkAccount && accessToken) {
        try {
          // Cerrar sesión en el backend
          await fetch('http://localhost:3000/api/user/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }).catch(err => {
            console.error('[App] Error al cerrar sesión en el backend:', err);
          });
          
          // Limpiar localStorage de la sesión web si existe
          const savedAuthData = localStorage.getItem('drkAuthData');
          if (savedAuthData) {
            try {
              const authData = JSON.parse(savedAuthData);
              if (authData.selectedProfile && authData.selectedProfile.name === username) {
                // Limpiar la sesión local
                localStorage.removeItem('drkAuthData');
                console.log('[App] Sesión DRK cerrada localmente');
              }
            } catch (e) {
              console.error('[App] Error al parsear datos de sesión:', e);
            }
          }
        } catch (error) {
          console.error('[App] Error al cerrar sesión DRK:', error);
        }
      }
      
      const updatedProfiles = profileService.getAllProfiles();
      setAccounts(updatedProfiles);
      setCurrentUser(profileService.getCurrentProfile());
    }
  };

  const handleSelectAccount = useCallback((username: string) => {
    const success = profileService.setCurrentProfile(username);
    if (success) {
      setCurrentUser(username);
      // Update accounts to reflect last used time
      setAccounts(profileService.getAllProfiles());
    }
  }, []);

  const handleLoginClick = () => {
    setLoginModalOpen(true);
  };

  const handleCloseLoginModal = () => {
    setLoginModalOpen(false);
  };

  const handleMicrosoftLogin = () => {
    console.log("Microsoft Login attempt - currently under maintenance.");
    // No additional logic here, modal component will show maintenance message
  };

  const handleNonPremiumLogin = useCallback((username: string) => {
    const newProfile = profileService.addProfile(username, 'non-premium');
    const updatedProfiles = profileService.getAllProfiles();
    setAccounts(updatedProfiles);
    setCurrentUser(username);
    profileService.setCurrentProfile(username); // Ensure the newly added profile is set as current
    handleCloseLoginModal();
  }, []);

  const handleElyByLogin = useCallback((username: string) => {
    console.log('[App] handleElyByLogin llamado con:', username);
    // Verificar si el perfil ya existe antes de agregarlo
    const existingProfile = profileService.getProfileByUsername(username);
    if (existingProfile) {
      console.log('[App] Perfil ya existe, no se agregará de nuevo. Tipo actual:', existingProfile.type);
      // Solo actualizar el perfil actual si no es drkauth
      if (existingProfile.type !== 'drkauth') {
        console.log('[App] Actualizando tipo de perfil existente a drkauth');
        const updatedProfile = profileService.addProfile(username, 'drkauth');
        console.log('[App] Perfil actualizado:', updatedProfile);
      }
    } else {
      // Solo agregar si no existe
      const newProfile = profileService.addProfile(username, 'drkauth');
      console.log('[App] Perfil agregado:', newProfile);
    }
    const updatedProfiles = profileService.getAllProfiles();
    console.log('[App] Todos los perfiles:', updatedProfiles.map(p => ({ username: p.username, type: p.type })));
    setAccounts(updatedProfiles);
    setCurrentUser(username);
    profileService.setCurrentProfile(username); // Ensure the newly added profile is set as current
    handleCloseLoginModal();
  }, []);

  const handlePlay = async (instanceId: string) => {
    try {
      // Usar la API de Electron para lanzar el juego
      if (window.api?.game?.launch) {
        // Pasar también el perfil de usuario actual
        await window.api.game.launch({
          instanceId,
          userProfile: currentUser ? profileService.getProfileByUsername(currentUser) : undefined
        });
        console.log(`Juego iniciado para la instancia: ${instanceId}`);
      } else {
        console.error('La API de juego no está disponible');
      }
    } catch (error) {
      console.error('Error al iniciar el juego:', error);
    }
  };

  return (
    <div className="h-full flex">
      <Sidebar
        currentPath={loc.pathname}
        onNavigate={handleNavigation}
        accounts={accounts}
        currentUser={currentUser}
        onAddAccount={handleAddAccount}
        onDeleteAccount={handleDeleteAccount}
        onSelectAccount={handleSelectAccount}
      />
      <main className={`flex-1 p-6 bg-gray-900/30 dark:bg-gray-900/50 transition-all duration-300 ${isSettingsOpen || isLoginModalOpen ? 'filter blur-sm' : ''} overflow-y-auto custom-scrollbar`}>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home onAddAccount={handleAddAccount} onDeleteAccount={handleDeleteAccount} onSelectAccount={handleSelectAccount} onLoginClick={handleLoginClick} onPlay={handlePlay} currentUser={currentUser} accounts={accounts} />} />
            <Route path="/instances" element={<Instances onPlay={handlePlay} />} />
            <Route path="/create" element={<CreateInstance />} />
            {/* <Route path="/settings" element={<Settings />} /> */} {/* The route is no longer needed */}
            <Route path="/servers" element={<Servers />} />
            <Route path="/contenido" element={<ContentPage />} />
            <Route path="/contenido/:type" element={<ContentPage />} />
            <Route path="/contenido/:type/:id" element={<ContentPage />} />
            <Route path="/skins" element={<SkinsPage />} />
            <Route path="/crash" element={<CrashAnalyzer />} />
            <Route path="/import" element={<ModpackImporter />} />
            <Route path="/downloads" element={<DownloadsView />} />
          </Routes>
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setSettingsOpen(false)}
          onSettingsChanged={handleSettingsChanged}
        />
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={handleCloseLoginModal}
          onMicrosoftLogin={handleMicrosoftLogin}
          onNonPremiumLogin={handleNonPremiumLogin}
          onElyByLogin={handleElyByLogin}
        />
      </Suspense>
      <NotificationContainer />
    </div>
  )
}