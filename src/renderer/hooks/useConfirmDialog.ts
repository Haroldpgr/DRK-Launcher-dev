import { useState } from 'react';

export const useConfirmDialog = () => {
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: (() => void) | null;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText: string = 'Aceptar',
    cancelText: string = 'Cancelar'
  ) => {
    setDialog({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm,
    });
  };

  const handleConfirm = () => {
    dialog.onConfirm?.();
    setDialog(prev => ({ ...prev, isOpen: false }));
  };

  const handleCancel = () => {
    setDialog(prev => ({ ...prev, isOpen: false }));
  };

  return {
    showConfirm,
    dialogProps: {
      ...dialog,
      onConfirm: handleConfirm,
      onCancel: handleCancel,
    },
  };
};
