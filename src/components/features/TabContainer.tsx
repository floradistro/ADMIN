'use client';

import React from 'react';
import { TabBar, Tab } from '../ui/TabBar';

interface TabContainerProps {
  tabs: Tab[];
  activeTabId: string;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabMinimize: (tabId: string) => void;
  showDashboard?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function TabContainer({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  onTabMinimize,
  showDashboard = false,
  children,
  className = '',
}: TabContainerProps) {
  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Tab Bar */}
      {tabs.length > 0 && (
        <TabBar
          tabs={tabs}
          onTabClick={onTabClick}
          onTabClose={onTabClose}
          onTabMinimize={onTabMinimize}
        />
      )}

      {/* Content Area */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {children}
      </div>
    </div>
  );
}
