import React, { useState } from 'react';
import Card from '../components/Card';
import CreateInstanceModal from '../components/CreateInstanceModal';

export default function CreateInstance() {
  const [showCreateModal, setShowCreateModal] = useState(true);

  // Si no se debe mostrar el modal (por ejemplo, después de cerrarlo y redirigir),
  // podemos manejarlo aquí, pero para esta implementación simplemente mostramos el modal
  return (
    <Card className="p-6">
      <div className="text-xl font-bold text-white mb-4">Crear Nueva Instancia</div>
      <p className="text-gray-400 mb-6">Usa el formulario a continuación para crear una nueva instancia de Minecraft</p>

      <div className="flex justify-center items-center h-[300px]">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <p className="text-gray-500">Abriendo formulario de creación...</p>
        </div>
      </div>

      <CreateInstanceModal
        isOpen={showCreateModal}
        onClose={() => {
          // Cerrar y redirigir al usuario a la página de instancias
          window.location.hash = '#/instances';
        }}
      />
    </Card>
  );
}

