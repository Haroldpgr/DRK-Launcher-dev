// Servicio para manejar el estado del tutorial y primera vez del usuario

export interface TutorialState {
  hasSeenWelcome: boolean;
  completedTutorials: string[];
  version: string;
}

const TUTORIAL_STORAGE_KEY = 'drk_launcher_tutorial_state';
const CURRENT_VERSION = '0.1.0';

class TutorialService {
  private state: TutorialState;

  constructor() {
    this.state = this.loadState();
    
    // Exponer función de reset en window para testing (usar en consola: resetTutorial())
    (window as any).resetTutorial = () => {
      this.resetTutorials();
      console.log('✅ Tutorial reseteado. Recarga la página para verlo de nuevo.');
    };
  }

  private loadState(): TutorialState {
    try {
      const saved = localStorage.getItem(TUTORIAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Si la versión cambió, mostrar bienvenida de nuevo
        if (parsed.version !== CURRENT_VERSION) {
          return {
            hasSeenWelcome: false,
            completedTutorials: parsed.completedTutorials || [],
            version: CURRENT_VERSION
          };
        }
        return parsed;
      }
    } catch (e) {
      console.error('[TutorialService] Error loading state:', e);
    }
    return {
      hasSeenWelcome: false,
      completedTutorials: [],
      version: CURRENT_VERSION
    };
  }

  private saveState(): void {
    try {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('[TutorialService] Error saving state:', e);
    }
  }

  hasSeenWelcome(): boolean {
    return this.state.hasSeenWelcome;
  }

  markWelcomeSeen(): void {
    this.state.hasSeenWelcome = true;
    this.saveState();
  }

  hasCompletedTutorial(pageId: string): boolean {
    return this.state.completedTutorials.includes(pageId);
  }

  markTutorialCompleted(pageId: string): void {
    if (!this.state.completedTutorials.includes(pageId)) {
      this.state.completedTutorials.push(pageId);
      this.saveState();
    }
  }

  resetTutorials(): void {
    this.state = {
      hasSeenWelcome: false,
      completedTutorials: [],
      version: CURRENT_VERSION
    };
    this.saveState();
  }

  getCurrentVersion(): string {
    return CURRENT_VERSION;
  }
}

export const tutorialService = new TutorialService();

