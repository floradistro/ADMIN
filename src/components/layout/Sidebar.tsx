'use client';

import React from 'react';
import { Product } from '../../types';

interface SidebarProps {
  editingProduct: Product | null;
  onClose: () => void;
  children: React.ReactNode;
}

export function Sidebar({ editingProduct, onClose, children }: SidebarProps) {
  if (!editingProduct) {
    return (
      <div className="w-80 bg-neutral-900 border-l border-neutral-800/60 flex flex-col backdrop-blur-sm">
        <div className="p-6 border-b border-neutral-800/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neutral-700 to-neutral-800 flex items-center justify-center">
              <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-neutral-500">Portal Panel</h2>
          </div>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Select any product and click &quot;Edit&quot; to access the advanced product editor interface.
          </p>
        </div>
        
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center max-w-xs">
            <div className="relative mb-6">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-neutral-800/60 to-neutral-900/80 flex items-center justify-center border border-neutral-700/50 shadow-xl">
                <svg className="w-9 h-9 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-neutral-600 to-neutral-700 flex items-center justify-center border-2 border-neutral-900">
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-400"></div>
              </div>
            </div>
            <h3 className="text-neutral-500 font-medium mb-2 text-base">Product Editor</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Advanced editing capabilities will appear here when you select a product from the main grid.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-neutral-900 border-l border-neutral-800/60 flex flex-col backdrop-blur-sm">
      <div className="h-full flex flex-col bg-neutral-900">
        {/* Header */}
        <div className="flex items-center justify-between px-2 py-3 border-b border-white/[0.1] bg-neutral-900">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            <span className="text-sm font-medium text-neutral-400 truncate">
              {editingProduct.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="p-1 hover:bg-white/[0.1] rounded text-neutral-500 hover:text-neutral-400 smooth-hover"
              title="Reset changes"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              className="p-1 hover:bg-white/[0.1] rounded text-neutral-500 hover:text-neutral-400 smooth-hover"
              title="Save changes"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/[0.1] rounded text-neutral-500 hover:text-neutral-400 smooth-hover"
              title="Close editor"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}