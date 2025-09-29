'use client';

import React, { useState } from 'react';
import { SearchInput, IconButton, Divider, AuditDropdown, ViewsDropdown, FilesDropdown, SettingsDropdown } from '../ui';
import { TabBar, Tab } from '../ui/TabBar';
import { FilterState, ViewState } from '../../types';


interface HeaderProps {
  filterState: FilterState;
  viewState: ViewState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onViewChange: (views: Partial<ViewState>) => void;
  onAuditToggle?: () => void;
  onSettingsToggle?: () => void;
  activeSettingsTab?: string;
  onSettingsTabChange?: (tab: string) => void;
  onNavigateToSettings?: (tab: string) => void;
  onProductsToggle?: () => void;
  onCustomersToggle?: () => void;
  onCoaToggle?: () => void;
  onMediaToggle?: () => void;
  onReportsToggle?: () => void;
  onRefresh?: () => void;
  tabs?: Tab[];
  onTabClick?: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
  onTabMinimize?: (tabId: string) => void;
  activeTabId?: string;
}

export function Header({ filterState, viewState, onFilterChange, onViewChange, onAuditToggle, onSettingsToggle, activeSettingsTab, onSettingsTabChange, onNavigateToSettings, onProductsToggle, onCustomersToggle, onCoaToggle, onMediaToggle, onReportsToggle, onRefresh, tabs = [], onTabClick, onTabClose, onTabMinimize, activeTabId }: HeaderProps) {
  const [isAuditDropdownOpen, setIsAuditDropdownOpen] = useState(false);
  const [isViewsDropdownOpen, setIsViewsDropdownOpen] = useState(false);
  const [isFilesDropdownOpen, setIsFilesDropdownOpen] = useState(false);
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  return (
    <div className="app-header">
      <div className="header-nav bg-neutral-900 flex-shrink-0 sticky top-0 z-30 font-tiempos ios-header-extension h-10">
        <div className="flex items-center justify-between h-full">
        {/* Left section - Tabs */}
        <div className="flex items-stretch flex-shrink-0 h-full pl-4 pt-1">
          {tabs.length > 0 && onTabClick && onTabClose && onTabMinimize && (
            <TabBar
              tabs={tabs}
              onTabClick={onTabClick}
              onTabClose={onTabClose}
              onTabMinimize={onTabMinimize}
            />
          )}
        </div>
        
        {/* Center section - Search and Navigation Icons */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-4">
          <SearchInput
            value={filterState.searchQuery}
            onChange={(value) => onFilterChange({ searchQuery: value })}
            className="w-80"
          />
          
          {/* Navigation Icons - Right of Search */}
          <div className="flex items-center">
            {/* Views Dropdown */}
            <div className="relative">
              <IconButton
                onClick={() => setIsViewsDropdownOpen(!isViewsDropdownOpen)}
                variant={isViewsDropdownOpen ? 'active' : 'default'}
                title="Views"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </IconButton>
              
              <ViewsDropdown
                isOpen={isViewsDropdownOpen}
                onClose={() => setIsViewsDropdownOpen(false)}
                onProductsToggle={onProductsToggle}
                onCustomersToggle={onCustomersToggle}
                onOrdersToggle={() => {
                  onViewChange({
                    isOrdersViewOpen: !viewState.isOrdersViewOpen,
                    showOverview: false
                  });
                }}
                onReportsToggle={onReportsToggle}
                isOrdersViewOpen={viewState.isOrdersViewOpen}
                isReportsViewOpen={viewState.isReportsViewOpen}
              />
            </div>

            <Divider className="mx-2" />

            {/* Files Dropdown */}
            <div className="relative">
              <IconButton
                onClick={() => setIsFilesDropdownOpen(!isFilesDropdownOpen)}
                variant={isFilesDropdownOpen ? 'active' : 'default'}
                title="Files"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </IconButton>
              
              <FilesDropdown
                isOpen={isFilesDropdownOpen}
                onClose={() => setIsFilesDropdownOpen(false)}
                onMediaToggle={onMediaToggle}
                onCoaToggle={onCoaToggle}
              />
            </div>
          </div>
        </div>
        
        {/* Right section - Remaining Controls */}
        <div className="flex items-center flex-shrink-0 px-4 pt-1">

          {/* Settings Dropdown */}
          <div className="relative">
            <IconButton
              onClick={() => {
                setIsSettingsDropdownOpen(!isSettingsDropdownOpen);
                setIsAuditDropdownOpen(false);
                setIsViewsDropdownOpen(false);
                setIsFilesDropdownOpen(false);
              }}
              variant={isSettingsDropdownOpen ? 'active' : 'default'}
              title="Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </IconButton>
            
            <SettingsDropdown
              isOpen={isSettingsDropdownOpen}
              onClose={() => setIsSettingsDropdownOpen(false)}
              activeTab={activeSettingsTab || 'locations'}
              onTabChange={onSettingsTabChange || (() => {})}
              onNavigateToSettings={onNavigateToSettings || (() => {})}
            />
          </div>

          {/* Audit History Dropdown */}
          <div className="relative">
            <IconButton
              onClick={() => {
                setIsAuditDropdownOpen(!isAuditDropdownOpen);
                setIsSettingsDropdownOpen(false);
              }}
              variant={isAuditDropdownOpen ? 'active' : 'default'}
              title="Audit History"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </IconButton>
            
            <AuditDropdown
              isOpen={isAuditDropdownOpen}
              onClose={() => setIsAuditDropdownOpen(false)}
            />
          </div>

          <Divider className="mx-2" />

          {/* Refresh Button */}
          <IconButton
            onClick={async () => {
              if (!onRefresh || isRefreshing) return;
              
              setIsRefreshing(true);
              try {
                await onRefresh();
              } catch (error) {
                console.error('Refresh error:', error);
              } finally {
                // Keep animation for at least 800ms to make it visible
                setTimeout(() => setIsRefreshing(false), 800);
              }
            }}
            variant="default"
            disabled={!onRefresh || isRefreshing}
            title={isRefreshing ? "Refreshing..." : "Refresh"}
          >
            <svg 
              className={`w-5 h-5 transition-transform duration-200 ${
                isRefreshing ? 'animate-spin' : ''
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </IconButton>

        </div>
      </div>
    </div>
    </div>
  );
}