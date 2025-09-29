import React, { useState, useRef, useEffect } from 'react';
import { AuditPanel } from '../features/AuditPanel';

interface AuditDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuditDropdown({ isOpen, onClose }: AuditDropdownProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      {/* Elegant backdrop with subtle blur */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 pointer-events-auto" onClick={onClose} />
      
      <div 
        ref={modalRef}
        className="w-[600px] h-[600px] bg-gradient-to-br from-black/95 via-black/90 to-black/95 border border-white/[0.08] rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.02),inset_0_1px_0_rgba(255,255,255,0.05)] overflow-hidden animate-in zoom-in-95 fade-in slide-in-from-bottom-4 duration-300 ease-out pointer-events-auto transform-gpu"
        style={{
          boxShadow: `
            0 25px 50px -12px rgba(0, 0, 0, 0.8),
            0 10px 25px -5px rgba(0, 0, 0, 0.6),
            0 0 0 1px rgba(255, 255, 255, 0.02),
            inset 0 1px 0 rgba(255, 255, 255, 0.05),
            inset 0 -1px 0 rgba(255, 255, 255, 0.02)
          `
        }}
      >
        {/* Subtle inner glow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/[0.02] via-transparent to-white/[0.01] pointer-events-none" />
        
        {/* Modal content - reuse AuditPanel */}
        <div className="h-full overflow-y-auto scrollable-container relative z-10">
          <AuditPanel
            isOpen={true}
            onClose={onClose}
            isDropdown={true}
          />
        </div>
      </div>
    </div>
  );
}