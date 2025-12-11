import React, { useState } from 'react';
import { ContentItem } from '../types/content';

interface DownloadSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSingleDownload: () => void;
  onMultipleDownload: () => void;
}

const DownloadSelectionModal: React.FC<DownloadSelectionModalProps> = ({
  isOpen,
  onClose,
  onSingleDownload,
  onMultipleDownload
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-700/80 shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Seleccionar Tipo de Descarga</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => {
                onSingleDownload();
                onClose();
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
            >
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Descarga Individual
              </div>
              <p className="text-sm text-blue-200 mt-1">Descargar un solo contenido con configuración específica</p>
            </button>

            <button
              onClick={() => {
                onMultipleDownload();
                onClose();
              }}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
            >
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Descarga Múltiple
              </div>
              <p className="text-sm text-purple-200 mt-1">Agregar múltiples contenidos a una cola de descargas</p>
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-gray-400">
            Selecciona el modo de descarga que mejor se adapte a tus necesidades
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadSelectionModal;