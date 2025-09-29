import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import styles from './TabBar.module.css';

export interface Tab {
  id: string;
  title: string;
  isActive: boolean;
  isDirty?: boolean;
  isMinimized?: boolean;
  icon?: React.ReactNode;
}

interface TabBarProps {
  tabs: Tab[];
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabMinimize: (tabId: string) => void;
}

export function TabBar({ tabs, onTabClick, onTabClose, onTabMinimize }: TabBarProps) {
  if (tabs.length === 0) return null;

  // Ref to track click timing for double-click detection
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickTimeRef = useRef<number>(0);
  const lastClickedTabRef = useRef<string>('');

  // Memoize event handlers to prevent unnecessary re-renders
  const handleTabClick = useCallback((tabId: string) => {
    const now = Date.now();
    const timeDiff = now - lastClickTimeRef.current;
    
    // Double-click detection (within 300ms)
    if (timeDiff < 300 && lastClickedTabRef.current === tabId) {
      // Clear any pending single-click timeout
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      
      // Double-click on any tab - close it
      console.log('Double-tap detected, closing tab:', tabId);
      onTabClose(tabId);
    } else {
      // Single click - set a timeout to handle it after double-click window
      lastClickTimeRef.current = now;
      lastClickedTabRef.current = tabId;
      
      // Clear any existing timeout
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      
      // Set timeout for single-click action
      clickTimeoutRef.current = setTimeout(() => {
        onTabClick(tabId);
        clickTimeoutRef.current = null;
      }, 300);
    }
  }, [onTabClick, onTabClose, onTabMinimize]);

  const handleTabClose = useCallback((tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onTabClose(tabId);
  }, [onTabClose]);

  const handleTabMinimize = useCallback((tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onTabMinimize(tabId);
  }, [onTabMinimize]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  // Memoize tab elements to prevent unnecessary re-renders
  const tabElements = useMemo(() => 
    tabs.map((tab) => {
      // Pre-compute classes for maximum performance
      const baseClasses = `${styles.tab} flex items-center px-1.5 py-0.5 text-sm cursor-pointer rounded-lg relative group min-w-0 border border-white/[0.08] select-none`;
      const stateClasses = tab.isActive 
        ? `${styles.active} bg-neutral-800/60 text-neutral-300` 
        : "bg-neutral-900/60 text-neutral-500";
      const opacityClass = tab.isMinimized ? "opacity-60" : "opacity-100";
      
      return (
        <div
          key={tab.id}
          className={`${baseClasses} ${stateClasses} ${opacityClass}`}
          onClick={() => handleTabClick(tab.id)}
          title={`${tab.title} (double-click to close)`}
        >
          <div className="flex items-center justify-center w-full relative pointer-events-none">
            {tab.icon && (
              <div className="flex-shrink-0 relative">
                {tab.icon}
                {tab.isDirty && <span className="absolute -top-1 -right-1 text-orange-400 text-xs">•</span>}
                {tab.isMinimized && <span className="absolute -bottom-1 -right-1 text-neutral-500 text-xs">—</span>}
              </div>
            )}
            
            {/* Minimize button - positioned absolutely in top right */}
            <button
              className={`${styles.tabButton} p-0.5 rounded opacity-0 absolute top-0 right-0 pointer-events-auto`}
              onClick={(e) => handleTabMinimize(tab.id, e)}
              title={tab.isMinimized ? 'Restore tab' : 'Minimize tab'}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {tab.isMinimized ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2m8-16h2a2 2 0 012 2v2m-4 12h2a2 2 0 002-2v-2" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                )}
              </svg>
            </button>
          </div>
        </div>
      );
    }), 
    [tabs, handleTabClick, handleTabClose, handleTabMinimize]
  );

  return (
    <div className={`${styles.tabContainer} flex items-stretch gap-1 h-full`}>
      {tabElements}
    </div>
  );
}