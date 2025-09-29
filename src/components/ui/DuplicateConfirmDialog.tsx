import React, { useState } from 'react';
import { Button } from './Button';

interface DuplicateConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newName: string, newLabel: string) => void;
  title: string;
  message: string;
  originalName: string;
  originalLabel: string;
  confirmText?: string;
  cancelText?: string;
}

export function DuplicateConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  originalName,
  originalLabel,
  confirmText = 'Duplicate',
  cancelText = 'Cancel'
}: DuplicateConfirmDialogProps) {
  const [newName, setNewName] = useState(`${originalName}_copy`);
  const [newLabel, setNewLabel] = useState(`${originalLabel} (Copy)`);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (newName.trim() && newLabel.trim()) {
      onConfirm(newName.trim(), newLabel.trim());
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setNewName(`${originalName}_copy`);
    setNewLabel(`${originalLabel} (Copy)`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-neutral-900/40 border border-blue-500/30 rounded-lg shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center gap-3 p-4">
          <div className="flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-neutral-400 text-xs">Create a copy with new name</p>
          </div>
          <button
            onClick={handleClose}
            className="text-neutral-400 hover:text-white smooth-hover"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="px-4 pb-4">
          <div className="bg-black rounded p-3 border border-white/[0.1] mb-4">
            <p className="text-neutral-300 text-xs mb-3">{message}</p>
            
            {/* Form fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-neutral-400 text-xs mb-1">Blueprint Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-2 py-1 bg-neutral-800 border border-white/[0.1] rounded text-neutral-300 focus:border-blue-400 focus:outline-none text-xs"
                  placeholder="blueprint_name"
                  pattern="^[a-zA-Z_][a-zA-Z0-9_]*$"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Unique identifier (letters, numbers, underscores only)
                </p>
              </div>
              
              <div>
                <label className="block text-neutral-400 text-xs mb-1">Display Label</label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full px-2 py-1 bg-neutral-800 border border-white/[0.1] rounded text-neutral-300 focus:border-blue-400 focus:outline-none text-xs"
                  placeholder="Display Label"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 pb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
          >
            {cancelText}
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={!newName.trim() || !newLabel.trim()}
            className="!bg-blue-500 hover:!bg-blue-600 text-white border-blue-500"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}