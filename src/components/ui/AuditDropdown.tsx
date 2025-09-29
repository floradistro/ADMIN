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
      <div 
        ref={modalRef}
        className="w-[500px] h-[500px] bg-black/95 border border-white/[0.05] rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 pointer-events-auto"
      >
        {/* Modal content - reuse AuditPanel */}
        <div className="h-full overflow-y-auto scrollable-container">
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