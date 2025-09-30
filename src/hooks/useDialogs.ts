import { useState, useCallback } from 'react';

interface AlertDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  variant: 'success' | 'error' | 'warning' | 'info';
  onClose?: () => void;
}

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  variant: 'default' | 'danger' | 'warning';
  onConfirm?: () => void;
  onClose?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export function useDialogs() {
  const [alertDialog, setAlertDialog] = useState<AlertDialogState>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'info'
  });

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'default'
  });

  // Alert dialog methods
  const showAlert = useCallback((
    title: string,
    message: string,
    variant: 'success' | 'error' | 'warning' | 'info' = 'info',
    onClose?: () => void
  ) => {
    setAlertDialog({
      isOpen: true,
      title,
      message,
      variant,
      onClose
    });
  }, []);

  const showSuccess = useCallback((title: string, message: string, onClose?: () => void) => {
    showAlert(title, message, 'success', onClose);
  }, [showAlert]);

  const showError = useCallback((title: string, message: string, onClose?: () => void) => {
    showAlert(title, message, 'error', onClose);
  }, [showAlert]);

  const showWarning = useCallback((title: string, message: string, onClose?: () => void) => {
    showAlert(title, message, 'warning', onClose);
  }, [showAlert]);

  const showInfo = useCallback((title: string, message: string, onClose?: () => void) => {
    showAlert(title, message, 'info', onClose);
  }, [showAlert]);

  const closeAlert = useCallback(() => {
    if (alertDialog.onClose) {
      alertDialog.onClose();
    }
    setAlertDialog(prev => ({ ...prev, isOpen: false }));
  }, [alertDialog.onClose]);

  // Confirm dialog methods
  const showConfirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    variant: 'default' | 'danger' | 'warning' = 'default',
    confirmText?: string,
    cancelText?: string,
    onClose?: () => void
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      variant,
      onConfirm,
      onClose,
      confirmText,
      cancelText
    });
  }, []);

  const showDangerConfirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText: string = 'Delete',
    cancelText: string = 'Cancel',
    onClose?: () => void
  ) => {
    showConfirm(title, message, onConfirm, 'danger', confirmText, cancelText, onClose);
  }, [showConfirm]);

  const showWarningConfirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText: string = 'Continue',
    cancelText: string = 'Cancel',
    onClose?: () => void
  ) => {
    showConfirm(title, message, onConfirm, 'warning', confirmText, cancelText, onClose);
  }, [showConfirm]);

  const closeConfirm = useCallback(() => {
    if (confirmDialog.onClose) {
      confirmDialog.onClose();
    }
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  }, [confirmDialog.onClose]);

  const handleConfirm = useCallback(() => {
    if (confirmDialog.onConfirm) {
      confirmDialog.onConfirm();
    }
    closeConfirm();
  }, [confirmDialog.onConfirm, closeConfirm]);

  return {
    // Alert dialog
    alertDialog,
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    closeAlert,

    // Confirm dialog
    confirmDialog,
    showConfirm,
    showDangerConfirm,
    showWarningConfirm,
    closeConfirm,
    handleConfirm
  };
}
