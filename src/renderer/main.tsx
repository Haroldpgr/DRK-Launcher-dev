import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import '../styles/index.css'

// Verificar que window.api esté disponible antes de renderizar
const waitForApi = (): Promise<void> => {
  return new Promise((resolve) => {
    // Si ya está disponible, resolver inmediatamente
    if (typeof window !== 'undefined' && window.api) {
      console.log('[main] window.api disponible inmediatamente');
      resolve();
      return;
    }

    // Esperar a que window.api esté disponible
    let attempts = 0;
    const maxAttempts = 100; // 10 segundos máximo
    
    const checkInterval = setInterval(() => {
      attempts++;
      if (typeof window !== 'undefined' && window.api) {
        console.log(`[main] window.api disponible después de ${attempts} intentos`);
        clearInterval(checkInterval);
        resolve();
      } else if (attempts >= maxAttempts) {
        console.warn('[main] Timeout esperando window.api, renderizando de todas formas');
        clearInterval(checkInterval);
        resolve(); // Resolver de todas formas para no bloquear la app
      }
    }, 100);
  });
};

// Esperar a que la API esté disponible antes de renderizar
waitForApi().then(() => {
  const root = createRoot(document.getElementById('root') as HTMLElement)
  root.render(
    <HashRouter>
      <App />
    </HashRouter>
  )
}).catch((error) => {
  console.error('[main] Error esperando window.api:', error);
  // Renderizar de todas formas
const root = createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <HashRouter>
    <App />
  </HashRouter>
)
})
