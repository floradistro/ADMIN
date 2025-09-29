'use client';

import React from 'react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: string;
}

export function Drawer({ isOpen, onClose, title, children, width = 'w-80' }: DrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 opacity-hover"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className={`fixed left-0 top-0 h-full ${width} bg-neutral-900 backdrop-blur-sm border-r border-white/[0.08] z-50 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          transition: 'transform 0.12s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-white/[0.08] bg-neutral-900">
            <h2 className="text-lg font-medium text-neutral-300">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-neutral-800/60 rounded smooth-hover"
            >
              <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className="p-2 h-full overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}