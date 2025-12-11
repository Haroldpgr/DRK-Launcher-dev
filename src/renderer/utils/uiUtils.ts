import React from 'react';
import ReactDOM from 'react-dom/client';
import ModernAlert from '../components/ui/ModernAlert';

// Función para mostrar una alerta moderna
export const showModernAlert = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): Promise<boolean> => {
  return new Promise((resolve) => {
    // Crear un contenedor temporal para el modal
    const container = document.createElement('div');
    container.id = 'modern-alert-container';
    document.body.appendChild(container);
    
    const root = ReactDOM.createRoot(container);
    
    const handleClose = () => {
      root.unmount();
      document.body.removeChild(container);
      resolve(false);
    };
    
    const handleConfirm = () => {
      root.unmount();
      document.body.removeChild(container);
      resolve(true);
    };
    
    root.render(
      <ModernAlert
        title={title}
        message={message}
        type={type}
        onConfirm={handleConfirm}
        onCancel={handleClose}
        confirmText={type === 'warning' || type === 'error' ? 'Aceptar' : 'Aceptar'}
      />
    );
  });
};

// Función para mostrar un diálogo de confirmación moderno
export const showModernConfirm = (title: string, message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    // Crear un contenedor temporal para el modal
    const container = document.createElement('div');
    container.id = 'modern-confirm-container';
    document.body.appendChild(container);
    
    const root = ReactDOM.createRoot(container);
    
    const handleClose = () => {
      root.unmount();
      document.body.removeChild(container);
      resolve(false);
    };
    
    const handleConfirm = () => {
      root.unmount();
      document.body.removeChild(container);
      resolve(true);
    };
    
    root.render(
      <ModernAlert
        title={title}
        message={message}
        type="warning"
        onConfirm={handleConfirm}
        onCancel={handleClose}
        confirmText="Sí"
        cancelText="No"
      />
    );
  });
};