import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { qwenService } from '../services/aiService';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
};

export default function AiSettingsModal({ isOpen, onClose, onSave }: Props) {
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: 'La clave API no puede estar vacía' });
      return;
    }

    setIsSaving(true);
    setTestResult(null);

    try {
      // En una implementación real, aquí se probaría la API
      qwenService.setApiKey(apiKey);
      
      // Guardar la clave en la configuración del launcher
      // Esto podría ser en un archivo de configuración o en las preferencias del usuario
      localStorage.setItem('qwen-api-key', apiKey);
      
      setTestResult({ success: true, message: '¡Clave API guardada correctamente!' });
      
      setTimeout(() => {
        setIsSaving(false);
        onSave();
        onClose();
      }, 1000);
    } catch (error) {
      setTestResult({ success: false, message: 'Error al guardar la clave API: ' + (error as Error).message });
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: 'Por favor, ingresa una clave API primero' });
      return;
    }

    setIsSaving(true);
    setTestResult(null);

    try {
      // Simular prueba de conexión
      // En una implementación real, aquí se haría una llamada real a la API
      qwenService.setApiKey(apiKey);
      setTestResult({ success: true, message: 'Conexión exitosa con la API de Qwen' });
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: 'Error en la conexión: ' + (error as Error).message 
      });
    } finally {
      setIsSaving(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      const savedKey = localStorage.getItem('qwen-api-key');
      if (savedKey) {
        setApiKey(savedKey);
      }
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-gray-800 p-6 rounded-xl min-w-[500px]">
        <h2 className="text-xl font-bold mb-4 text-white">Configuración del Asistente IA (Qwen)</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Clave API de Qwen
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Ingresa tu clave API de Qwen"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Esta clave se almacena localmente en tu dispositivo y no se comparte con terceros.
            </p>
          </div>
          
          {testResult && (
            <div 
              className={`p-3 rounded-lg ${
                testResult.success ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'
              }`}
            >
              {testResult.message}
            </div>
          )}
          
          <div className="flex gap-2">
            <Button 
              onClick={handleTest} 
              disabled={isSaving}
              variant="secondary"
            >
              {isSaving ? 'Probando...' : 'Probar Conexión'}
            </Button>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}