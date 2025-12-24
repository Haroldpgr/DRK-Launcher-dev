import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { feedbackService } from '../services/feedbackService';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FEEDBACK_SUBJECTS = [
  {
    id: 'bug',
    label: '🐛 Reportar un Error',
    subject: '[DRK Launcher] Reporte de Error - ',
    description: 'Encontré un problema o error en el launcher'
  },
  {
    id: 'feature',
    label: '💡 Sugerencia de Funcionalidad',
    subject: '[DRK Launcher] Sugerencia de Funcionalidad - ',
    description: 'Tengo una idea para mejorar el launcher'
  },
  {
    id: 'improvement',
    label: '✨ Mejora de Funcionalidad Existente',
    subject: '[DRK Launcher] Mejora Sugerida - ',
    description: 'Quiero mejorar algo que ya existe'
  },
  {
    id: 'modpack',
    label: '📦 Solicitud de Modpack',
    subject: '[DRK Launcher] Solicitud de Modpack - ',
    description: 'Quiero que agreguen un modpack específico'
  },
  {
    id: 'performance',
    label: '⚡ Problema de Rendimiento',
    subject: '[DRK Launcher] Problema de Rendimiento - ',
    description: 'El launcher va lento o consume muchos recursos'
  },
  {
    id: 'ui',
    label: '🎨 Mejora de Interfaz',
    subject: '[DRK Launcher] Mejora de Interfaz - ',
    description: 'Sugerencia para mejorar el diseño o usabilidad'
  },
  {
    id: 'other',
    label: '📝 Otro Asunto',
    subject: '[DRK Launcher] Consulta General - ',
    description: 'Otro tipo de consulta o comentario'
  }
];

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [customSubject, setCustomSubject] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSubject) {
      setErrorMessage('Por favor, selecciona un tipo de asunto');
      return;
    }

    if (!message.trim()) {
      setErrorMessage('Por favor, escribe tu mensaje');
      return;
    }

    if (!userEmail.trim()) {
      setErrorMessage('Por favor, ingresa tu correo electrónico');
      return;
    }

    // Validar formato de correo básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail.trim())) {
      setErrorMessage('Por favor, ingresa un correo electrónico válido');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const subjectData = FEEDBACK_SUBJECTS.find(s => s.id === selectedSubject);
      const finalSubject = subjectData 
        ? `${subjectData.subject}${customSubject.trim() || 'Sin título específico'}`
        : `[DRK Launcher] ${customSubject.trim() || 'Consulta'}`;

      const success = await feedbackService.sendFeedback({
        subject: finalSubject,
        message: message.trim(),
        type: selectedSubject,
        userEmail: userEmail.trim()
      });

      if (success) {
        setSubmitStatus('success');
      // Limpiar formulario
      setSelectedSubject('');
      setCustomSubject('');
      setUserEmail('');
      setMessage('');
        // Cerrar después de 2 segundos
        setTimeout(() => {
          onClose();
          setSubmitStatus('idle');
        }, 2000);
      } else {
        setSubmitStatus('error');
        setErrorMessage('No se pudo enviar el mensaje. Por favor, intenta de nuevo.');
      }
    } catch (error: any) {
      console.error('Error al enviar feedback:', error);
      setSubmitStatus('error');
      setErrorMessage(error.message || 'Ocurrió un error al enviar el mensaje.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedSubject('');
      setCustomSubject('');
      setUserEmail('');
      setMessage('');
      setSubmitStatus('idle');
      setErrorMessage('');
      onClose();
    }
  };

  const selectedSubjectData = FEEDBACK_SUBJECTS.find(s => s.id === selectedSubject);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Enviar Recomendación o Feedback">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selección de tipo de asunto */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Tipo de Asunto <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-2">
            {FEEDBACK_SUBJECTS.map((subject) => (
              <button
                key={subject.id}
                type="button"
                onClick={() => {
                  setSelectedSubject(subject.id);
                  setCustomSubject('');
                  setErrorMessage('');
                }}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  selectedSubject === subject.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                <div className="font-medium text-gray-200">{subject.label}</div>
                <div className="text-xs text-gray-400 mt-1">{subject.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Título específico (opcional) */}
        {selectedSubject && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Título Específico (Opcional)
            </label>
            <input
              type="text"
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              placeholder={`Ej: ${selectedSubjectData?.id === 'bug' ? 'El juego no inicia' : selectedSubjectData?.id === 'feature' ? 'Agregar modo oscuro' : 'Título breve'}`}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={100}
            />
            <div className="text-xs text-gray-500 mt-1">
              El asunto final será: <span className="text-gray-400">{selectedSubjectData?.subject}{customSubject || 'Sin título específico'}</span>
            </div>
          </div>
        )}

        {/* Correo electrónico del usuario */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tu Correo Electrónico <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            value={userEmail}
            onChange={(e) => {
              setUserEmail(e.target.value);
              setErrorMessage('');
            }}
            placeholder="tu@correo.com"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <div className="text-xs text-gray-500 mt-1">
            Necesitamos tu correo para poder responderte si es necesario
          </div>
        </div>

        {/* Mensaje */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tu Mensaje <span className="text-red-400">*</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setErrorMessage('');
            }}
            placeholder="Describe tu recomendación, problema o sugerencia con el mayor detalle posible..."
            rows={8}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            required
          />
          <div className="text-xs text-gray-500 mt-1">
            {message.length} caracteres
          </div>
        </div>

        {/* Mensaje de error */}
        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
            <p className="text-sm text-red-400">{errorMessage}</p>
          </div>
        )}

        {/* Mensaje de éxito */}
        {submitStatus === 'success' && (
          <div className="p-3 bg-green-500/10 border border-green-500/50 rounded-lg">
            <p className="text-sm text-green-400">
              ✓ ¡Mensaje enviado exitosamente! Gracias por tu feedback.
            </p>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-700">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !selectedSubject || !message.trim()}
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

