'use client';

import React, { useState, useEffect } from 'react';

interface StatusBarProps {
  userInfo?: {
    name: string;
    role: string;
  };
  currentLocation?: string;
  totalProducts?: number;
  selectedCount?: number;
  lastSync?: Date;
}

export function StatusBar({ 
  userInfo,
  currentLocation,
  totalProducts = 0,
  selectedCount = 0,
  lastSync
}: StatusBarProps) {
  // Initialize with null to avoid hydration mismatch
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  // Set initial time and update every second
  useEffect(() => {
    setMounted(true);
    // Set initial time after mount
    setCurrentTime(new Date());
    
    // Update time every second
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date | null) => {
    if (!date || !mounted) return '--:--'; // Show placeholder during SSR and initial render
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };



  return (
    <div 
      className="bg-transparent border-t border-white/[0.04] h-8 md:h-7 flex items-center justify-between text-[10px] md:text-xs text-neutral-500 flex-shrink-0 font-tiempos sticky bottom-0 z-20"
      style={{
        paddingLeft: 'max(env(safe-area-inset-left), 8px)',
        paddingRight: 'max(env(safe-area-inset-right), 8px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 4px)'
      }}
    >
      {/* Left section */}
      <div className="flex items-center space-x-2 md:space-x-4 min-w-0">
        {/* Product count - always show if exists */}
        {totalProducts > 0 && (
          <div className="text-neutral-500 font-mono">
            <span>{totalProducts.toLocaleString()} items</span>
          </div>
        )}
        
        {/* Selected count - only show when items are selected */}
        {selectedCount > 0 && (
          <div className="flex items-center space-x-1 bg-blue-600/80 px-2 py-0.5 rounded text-white text-[10px] md:text-xs">
            <span>{selectedCount} sel</span>
          </div>
        )}

        {/* Current location - hide on mobile */}
        {currentLocation && (
          <div className="hidden md:flex items-center space-x-1 hover:bg-neutral-800/40 px-2 py-0.5 rounded text-neutral-400 hover:text-neutral-300 transition-all duration-200">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span>{currentLocation}</span>
          </div>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
        {/* Last sync - hide on mobile, show on desktop */}
        {mounted && lastSync && currentTime && (
          <div className="hidden md:block text-neutral-500 hover:text-neutral-400 transition-colors duration-200">
            <span>Synced {formatTime(lastSync)}</span>
          </div>
        )}

        {/* Current time */}
        <div className="text-neutral-400 hover:text-neutral-300 transition-colors duration-200 font-mono">
          <span suppressHydrationWarning>{formatTime(currentTime)}</span>
        </div>
      </div>
    </div>
  );
}