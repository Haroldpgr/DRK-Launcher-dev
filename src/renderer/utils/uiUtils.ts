import React from 'react';
import ReactDOM from 'react-dom/client';
import ModernAlert from '../components/ui/ModernAlert';

// Función para mostrar una alerta moderna (reemplaza alert())
export const showModernAlert = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): Promise<boolean> => {
  return new Promise((resolve) => {
    // Verificar si ya existe un contenedor
    let container = document.getElementById('modern-alert-container');
    if (container) {
      container.remove();
    }
    
    // Crear un contenedor temporal para el modal
    container = document.createElement('div');
    container.id = 'modern-alert-container';
    document.body.appendChild(container);
    
    const root = ReactDOM.createRoot(container);
    
    const handleClose = () => {
      setTimeout(() => {
        root.unmount();
        if (container && container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }, 100);
      resolve(false);
    };
    
    const handleConfirm = () => {
      setTimeout(() => {
        root.unmount();
        if (container && container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }, 100);
      resolve(true);
    };
    
    root.render(
      React.createElement(ModernAlert, {
        title: title,
        message: message,
        type: type,
        onConfirm: handleConfirm,
        onCancel: type === 'info' || type === 'success' ? undefined : handleClose,
        confirmText: "Aceptar"
      })
    );
  });
};

// Función para mostrar un diálogo de confirmación moderno (reemplaza confirm())
export const showModernConfirm = (title: string, message: string, type: 'danger' | 'warning' | 'info' = 'warning'): Promise<boolean> => {
  return new Promise((resolve) => {
    // Verificar si ya existe un contenedor
    let container = document.getElementById('modern-confirm-container');
    if (container) {
      container.remove();
    }
    
    // Crear un contenedor temporal para el modal
    container = document.createElement('div');
    container.id = 'modern-confirm-container';
    document.body.appendChild(container);
    
    const root = ReactDOM.createRoot(container);
    
    const handleClose = () => {
      setTimeout(() => {
        root.unmount();
        if (container && container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }, 100);
      resolve(false);
    };
    
    const handleConfirm = () => {
      setTimeout(() => {
        root.unmount();
        if (container && container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }, 100);
      resolve(true);
    };
    
    const alertType = type === 'danger' ? 'error' : type === 'warning' ? 'warning' : 'info';
    
    root.render(
      React.createElement(ModernAlert, {
        title: title,
        message: message,
        type: alertType,
        onConfirm: handleConfirm,
        onCancel: handleClose,
        confirmText: "Sí",
        cancelText: "Cancelar"
      })
    );
  });
};