'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { Drawer } from '../ui/Drawer';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NavigationDrawer({ isOpen, onClose }: NavigationDrawerProps) {
  const { data: session } = useSession();

  return (
    <Drawer isOpen={isOpen} onClose={onClose} width="w-72">
      <div className="space-y-2">
        {/* Header with logo and close button */}
        <div className="flex items-center justify-between mb-4">
          <img
            src="/logo.png"
            alt="Logo"
            width={32}
            height={32}
            className="w-8 h-8 object-contain"
          />
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-900/60 rounded-lg smooth-hover"
          >
            <svg className="w-5 h-5 text-neutral-400 hover:text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User Info Card */}
        {session?.user && (
          <div className="bg-neutral-900/40 border border-white/[0.08] rounded p-3 smooth-hover hover:bg-neutral-900/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-neutral-900/40 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-neutral-400 text-sm font-medium">
                  {session.user.username || session.user.name}
                </div>
                <div className="text-neutral-500 text-xs">
                  Logged in
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}