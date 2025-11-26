// src/renderer/components/DownloadsView.tsx
import React from 'react';
import Card from './Card';

const DownloadsView = () => {
  return (
    <div className="space-y-6">
      <Card>
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-200 mb-4">Área de Descargas</h2>
          <p className="text-gray-400 mb-6">
            Esta sección mostrará la información de descargas en tiempo real.
            <br />
            La funcionalidad será implementada en una futura actualización.
          </p>
          <div className="bg-gray-800/50 rounded-xl p-6 max-w-md mx-auto">
            <div className="text-blue-400 mb-3">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
            </div>
            <p className="text-gray-300">
              El sistema de descargas en tiempo real se integrará más adelante en el proceso
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DownloadsView;