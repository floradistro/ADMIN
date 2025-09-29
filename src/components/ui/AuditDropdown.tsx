import React, { useState, useRef, useEffect } from 'react';
import { AuditPanel } from '../features/AuditPanel';

interface AuditDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuditDropdown({ isOpen, onClose }: AuditDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 top-full mt-1 w-[480px] max-h-[70vh] bg-black/95 border border-white/[0.05] rounded-lg shadow-2xl backdrop-blur-sm z-50 overflow-hidden"
    >
      {/* Dropdown content - reuse AuditPanel but styled for dropdown */}
      <div className="p-0 h-full max-h-[70vh] overflow-y-auto scrollable-container">
        <AuditPanel
          isOpen={true}
          onClose={onClose}
          isDropdown={true}
        />
      </div>
    </div>
  );
}