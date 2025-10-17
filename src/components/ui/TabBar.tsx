'use client';

import React from 'react';

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
  onTabMinimize?: (tabId: string) => void;
}

export function TabBar({ tabs, onTabClick, onTabClose, onTabMinimize }: TabBarProps) {
  if (tabs.length === 0) return null;

  const handleTabClick = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    onTabClick(tabId);
  };

  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    e.preventDefault();
    onTabClose(tabId);
  };

  const handleTabMinimize = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (onTabMinimize) {
      onTabMinimize(tabId);
    }
  };

  return (
    <div className="flex items-center gap-1 h-full">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`
            flex items-center gap-1.5 px-2 h-7 rounded-md
            border transition-all cursor-pointer
            ${tab.isActive 
              ? 'bg-neutral-800/80 border-white/[0.12] text-neutral-200' 
              : 'bg-neutral-900/60 border-white/[0.06] text-neutral-500 hover:bg-neutral-800/60 hover:border-white/[0.08] hover:text-neutral-300'
            }
            ${tab.isMinimized ? 'opacity-50' : ''}
            group relative
          `}
        >
          {/* Tab Content - Clickable Area */}
          <div
            onClick={(e) => handleTabClick(e, tab.id)}
            className="flex items-center gap-1.5 flex-1 min-w-0"
          >
            {/* Tab Icon */}
            {tab.icon && (
              <div className="flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center relative [&>svg]:w-3.5 [&>svg]:h-3.5">
                {tab.icon}
                {tab.isDirty && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-orange-400 rounded-full" />
                )}
              </div>
            )}

            {/* Tab Title */}
            {!tab.isMinimized && tab.title && (
              <span className="text-[10px] font-medium truncate max-w-[70px]">
                {tab.title}
              </span>
            )}
          </div>

          {/* Tab Actions */}
          <div className="flex items-center gap-0.5 ml-0.5 flex-shrink-0">
            {/* Minimize Button */}
            {onTabMinimize && (
              <button
                onClick={(e) => handleTabMinimize(e, tab.id)}
                className="w-3.5 h-3.5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-white/[0.08] transition-opacity"
                title={tab.isMinimized ? 'Restore' : 'Minimize'}
              >
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {tab.isMinimized ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                  )}
                </svg>
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={(e) => handleTabClose(e, tab.id)}
              className="w-3.5 h-3.5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-300 transition-opacity"
              title="Close"
            >
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
