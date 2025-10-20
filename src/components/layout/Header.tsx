'use client';

import React, { useState, useRef, useEffect } from 'react';
import { IntegratedSearchBar, IconButton, Divider, AuditDropdown, ViewsDropdown, FilesDropdown, SettingsDropdown, ProductCreateDropdown, BulkActionsDropdown } from '../ui';
import { TabBar, Tab } from '../ui/TabBar';
import { FilterState, ViewState } from '../../types';
import { FloraLocation } from '../../services/inventory-service';
import { BulkFieldSelector } from '../features/BulkFieldSelector';


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
  onCloseAllTabs?: () => void;
  activeTabId?: string;
  
  // Product-specific props
  floraLocations?: FloraLocation[];
  categoryOptions?: Array<{ value: string; label: string }>;
  selectedProductsCount?: number;
  bulkEditCount?: number;
  totalProductsCount?: number;
  onBulkAction?: (action: 'update' | 'transfer' | 'convert' | 'delete' | 'edit') => void;
  onClearSelection?: () => void;
  onBulkSave?: () => void;
  onBulkJsonEdit?: () => void;
  onSyncProducts?: () => void;
  syncLoading?: boolean;
  bulkEditProductIds?: Set<number>;
  onLocationChange?: (locationId: string, aggregateChildren?: boolean) => void;
  onCategoryChange?: (category: string) => void;
  onHideZeroQuantityChange?: (hide: boolean) => void;
  onShowSelectedOnlyChange?: (show: boolean) => void;
}

export function Header({ 
  filterState, 
  viewState, 
  onFilterChange, 
  onViewChange, 
  onAuditToggle, 
  onSettingsToggle, 
  activeSettingsTab, 
  onSettingsTabChange, 
  onNavigateToSettings, 
  onProductsToggle, 
  onCustomersToggle, 
  onCoaToggle, 
  onMediaToggle, 
  onReportsToggle, 
  onRefresh, 
  tabs = [], 
  onTabClick, 
  onTabClose, 
  onTabMinimize, 
  onCloseAllTabs, 
  activeTabId,
  floraLocations = [],
  categoryOptions = [],
  selectedProductsCount = 0,
  bulkEditCount = 0,
  totalProductsCount = 0,
  onBulkAction,
  onClearSelection,
  onBulkSave,
  onBulkJsonEdit,
  onSyncProducts,
  syncLoading = false,
  bulkEditProductIds,
  onLocationChange,
  onCategoryChange,
  onHideZeroQuantityChange,
  onShowSelectedOnlyChange,
}: HeaderProps) {
  const [isAuditDropdownOpen, setIsAuditDropdownOpen] = useState(false);
  const [isViewsDropdownOpen, setIsViewsDropdownOpen] = useState(false);
  const [isFilesDropdownOpen, setIsFilesDropdownOpen] = useState(false);
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateDropdownOpen, setIsCreateDropdownOpen] = useState(false);
  const [isFiltersDropdownOpen, setIsFiltersDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const filtersDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const isProductsTab = activeTabId === 'products';

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMobileMenuOpen]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtersDropdownRef.current && !filtersDropdownRef.current.contains(event.target as Node)) {
        setIsFiltersDropdownOpen(false);
      }
    };

    if (isFiltersDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isFiltersDropdownOpen]);

  return (
    <div className="app-header">
      <div className="header-nav bg-neutral-900 flex-shrink-0 sticky top-0 z-30 font-tiempos ios-header-extension h-12">
        <div className="relative flex items-center h-full px-3 py-2">
          
          {/* MOBILE LAYOUT (< 768px) */}
          <div className="md:hidden flex items-center w-full gap-2">
            {/* Left: Menu */}
            <IconButton
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              variant={isMobileMenuOpen ? 'active' : 'default'}
              title="Menu"
              size="sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </IconButton>
            
            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
              <div ref={mobileMenuRef} className="absolute top-full left-0 mt-1 bg-neutral-800/98 border border-white/[0.08] rounded-lg shadow-2xl z-[9999] w-56 backdrop-blur-sm">
                <div className="p-2 space-y-1">
                  <div className="px-2 py-1 text-[10px] text-neutral-600 uppercase font-bold">Views</div>
                  <button onClick={() => { onProductsToggle?.(); setIsMobileMenuOpen(false); }} className="w-full text-left px-3 py-2.5 text-sm text-neutral-300 hover:bg-white/[0.05] rounded transition flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    Products
                  </button>
                  <button onClick={() => { onCustomersToggle?.(); setIsMobileMenuOpen(false); }} className="w-full text-left px-3 py-2.5 text-sm text-neutral-300 hover:bg-white/[0.05] rounded transition flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>
                    Customers
                  </button>
                  <button onClick={() => { onViewChange({ isOrdersViewOpen: !viewState.isOrdersViewOpen }); setIsMobileMenuOpen(false); }} className="w-full text-left px-3 py-2.5 text-sm text-neutral-300 hover:bg-white/[0.05] rounded transition flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                    Orders
                  </button>
                  <button onClick={() => { onReportsToggle?.(); setIsMobileMenuOpen(false); }} className="w-full text-left px-3 py-2.5 text-sm text-neutral-300 hover:bg-white/[0.05] rounded transition flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    Reports
                  </button>
                  
                  <div className="my-1 border-t border-white/[0.08]"></div>
                  
                  <div className="px-2 py-1 text-[10px] text-neutral-600 uppercase font-bold">Files</div>
                  <button onClick={() => { onMediaToggle?.(); setIsMobileMenuOpen(false); }} className="w-full text-left px-3 py-2.5 text-sm text-neutral-300 hover:bg-white/[0.05] rounded transition flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Media
                  </button>
                  <button onClick={() => { onCoaToggle?.(); setIsMobileMenuOpen(false); }} className="w-full text-left px-3 py-2.5 text-sm text-neutral-300 hover:bg-white/[0.05] rounded transition flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    COA Files
                  </button>
                  <button onClick={() => { onSettingsToggle?.(); setIsMobileMenuOpen(false); }} className="w-full text-left px-3 py-2.5 text-sm text-neutral-300 hover:bg-white/[0.05] rounded transition flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Settings
                  </button>
                </div>
              </div>
            )}

            {/* Center: Search */}
            <div className="flex-1 min-w-0">
              <div className="relative h-8 bg-neutral-800/40 border border-white/[0.06] rounded-lg flex items-center">
                <svg className="w-3.5 h-3.5 text-neutral-600 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={filterState.searchQuery}
                  onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
                  placeholder="Search..."
                  className="flex-1 h-full bg-transparent text-xs text-neutral-300 placeholder-neutral-700 outline-none px-2 product-text"
                />
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Filters (for products) */}
              {isProductsTab && (
                <div className="relative flex-shrink-0" ref={filtersDropdownRef}>
                  <IconButton
                    onClick={() => setIsFiltersDropdownOpen(!isFiltersDropdownOpen)}
                    variant={filterState.hideZeroQuantity || filterState.showSelectedOnly ? 'active' : 'default'}
                    title="Filters"
                    size="sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                  </IconButton>
                  
                  {isFiltersDropdownOpen && (
                    <div className="absolute top-full right-2 mt-2 bg-neutral-800/98 border border-white/[0.08] rounded-lg shadow-2xl z-[99999] w-40 backdrop-blur-sm pointer-events-auto">
                      <div className="p-1.5 space-y-0.5">
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            const newValue = !filterState.hideZeroQuantity;
                            console.log('🔍 Hide Zero:', newValue);
                            onHideZeroQuantityChange?.(newValue);
                          }}
                          className={`w-full text-left px-2.5 py-2 text-xs rounded transition product-text flex items-center justify-between touch-manipulation ${
                            filterState.hideZeroQuantity ? 'bg-white/[0.1] text-neutral-300' : 'text-neutral-400 hover:bg-white/[0.05]'
                          }`}
                        >
                          <span>Hide Zero</span>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                            filterState.hideZeroQuantity ? 'bg-neutral-400 border-neutral-400' : 'border-neutral-600 bg-neutral-800'
                          }`}>
                            {filterState.hideZeroQuantity && (
                              <svg className="w-2.5 h-2.5 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            const newValue = !filterState.showSelectedOnly;
                            console.log('🔍 Selected Only:', newValue);
                            onShowSelectedOnlyChange?.(newValue);
                          }}
                          className={`w-full text-left px-2.5 py-2 text-xs rounded transition product-text flex items-center justify-between touch-manipulation ${
                            filterState.showSelectedOnly ? 'bg-white/[0.1] text-neutral-300' : 'text-neutral-400 hover:bg-white/[0.05]'
                          }`}
                        >
                          <span>Selected Only</span>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                            filterState.showSelectedOnly ? 'bg-neutral-400 border-neutral-400' : 'border-neutral-600 bg-neutral-800'
                          }`}>
                            {filterState.showSelectedOnly && (
                              <svg className="w-2.5 h-2.5 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Products Tools */}
              {isProductsTab && selectedProductsCount > 0 && (
                <>
                  <BulkActionsDropdown
                    selectedCount={selectedProductsCount}
                    onAction={onBulkAction || (() => {})}
                    onClearSelection={onClearSelection || (() => {})}
                  />
                  
                  {bulkEditCount > 0 && (
                    <IconButton onClick={onBulkSave} title="Save" size="sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                    </IconButton>
                  )}
                </>
              )}
              
              {/* Add Product (always visible for products) */}
              {isProductsTab && (
                <div className="relative">
                  <IconButton
                    onClick={() => setIsCreateDropdownOpen(!isCreateDropdownOpen)}
                    variant={isCreateDropdownOpen ? 'active' : 'default'}
                    title="Add"
                    size="sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </IconButton>
                  
                  <ProductCreateDropdown
                    isOpen={isCreateDropdownOpen}
                    onClose={() => setIsCreateDropdownOpen(false)}
                    onCreateProduct={() => {}}
                    onBulkImport={() => {}}
                  />
                </div>
              )}
              
              {/* Refresh */}
              <IconButton
                onClick={async () => {
                  if (!onRefresh || isRefreshing) return;
                  setIsRefreshing(true);
                  try {
                    await onRefresh();
                  } finally {
                    setTimeout(() => setIsRefreshing(false), 800);
                  }
                }}
                variant="default"
                disabled={!onRefresh || isRefreshing}
                title="Refresh"
                size="sm"
              >
                <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </IconButton>
            </div>
          </div>
          
          {/* DESKTOP LAYOUT (>= 768px) */}
          <div className="hidden md:flex items-center w-full pr-2">
            {/* LEFT SECTION - Tabs & Stats */}
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              {/* Tabs */}
              {tabs.length > 0 && onTabClick && onTabClose && (
                <>
                  <div className="flex items-center flex-shrink-0">
                    <TabBar
                      tabs={tabs}
                      onTabClick={onTabClick}
                      onTabClose={onTabClose}
                      onTabMinimize={onTabMinimize}
                    />
                  </div>
                  <Divider className="mx-0.5" />
                </>
              )}
              
              {/* Stats - Product Section */}
              {isProductsTab && (totalProductsCount > 0 || selectedProductsCount > 0 || bulkEditCount > 0) && (
                <div className="flex items-center gap-0.5">
                  {totalProductsCount > 0 && (
                    <span className="px-1 py-0.5 bg-white/[0.05] text-neutral-500 text-[9px] rounded font-mono">
                      {totalProductsCount}
                    </span>
                  )}
                  {selectedProductsCount > 0 && (
                    <span className="px-1 py-0.5 bg-white/[0.08] text-neutral-300 text-[9px] rounded font-mono">
                      {selectedProductsCount}
                    </span>
                  )}
                  {bulkEditCount > 0 && (
                    <span className="px-1 py-0.5 bg-blue-500/20 text-blue-300 text-[9px] rounded font-mono">
                      {bulkEditCount}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {/* CENTER SECTION - Search Bar (Absolutely Centered) */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
              <div className="pointer-events-auto">
                {/* Integrated Search Bar with Location/Category Filters */}
                {isProductsTab && (
                  <IntegratedSearchBar
                    searchQuery={filterState.searchQuery}
                    onSearchChange={(value) => onFilterChange({ searchQuery: value })}
                    selectedLocation={filterState.selectedLocationId}
                    onLocationChange={onLocationChange || (() => {})}
                    locations={floraLocations}
                    selectedCategory={filterState.selectedCategory}
                    onCategoryChange={onCategoryChange || (() => {})}
                    categoryOptions={categoryOptions}
                    showAggregation={false}
                  />
                )}
                
                {/* Standard Search for non-products tabs */}
                {!isProductsTab && (
                  <div className="w-[320px]">
                    <div className="relative h-6 bg-neutral-800/60 border border-white/[0.08] rounded-md overflow-hidden hover:border-white/[0.12] transition-colors flex items-center">
                      <div className="flex items-center justify-center px-2">
                        <svg className="w-3 h-3 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={filterState.searchQuery}
                        onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
                        placeholder="Search..."
                        className="flex-1 h-full bg-transparent text-[10px] text-neutral-300 placeholder-neutral-600 outline-none pr-2"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* RIGHT SECTION - Actions & System Controls */}
            <div className="flex items-center gap-1 flex-shrink-0 flex-1 justify-end">
            {/* Product-specific filters */}
            {isProductsTab && (
              <div className="relative" ref={filtersDropdownRef}>
                <IconButton
                  onClick={() => setIsFiltersDropdownOpen(!isFiltersDropdownOpen)}
                  variant={filterState.hideZeroQuantity || filterState.showSelectedOnly ? 'active' : 'default'}
                  title="Filters"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                </IconButton>
                
                {isFiltersDropdownOpen && (
                  <div className="absolute top-full right-0 mt-1 bg-neutral-800 border border-white/[0.08] rounded-lg shadow-xl z-50 w-36">
                    <div className="p-1 space-y-0.5">
                      <button
                        onClick={() => {
                          onHideZeroQuantityChange?.(!filterState.hideZeroQuantity);
                          setIsFiltersDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2 py-1 text-[10px] rounded transition ${
                          filterState.hideZeroQuantity ? 'bg-blue-500/20 text-blue-300' : 'text-neutral-400 hover:bg-white/[0.05]'
                        }`}
                      >
                        Hide Zero
                      </button>
                      <button
                        onClick={() => {
                          onShowSelectedOnlyChange?.(!filterState.showSelectedOnly);
                          setIsFiltersDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2 py-1 text-[10px] rounded transition ${
                          filterState.showSelectedOnly ? 'bg-green-500/20 text-green-300' : 'text-neutral-400 hover:bg-white/[0.05]'
                        }`}
                      >
                        Selected
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Product Actions */}
            {isProductsTab && (
              <>
                {bulkEditCount > 0 && (
                  <>
                    <IconButton onClick={onBulkJsonEdit} title={`JSON (${bulkEditCount})`}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </IconButton>
                    <IconButton onClick={onBulkSave} title={`Save (${bulkEditCount})`}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                    </IconButton>
                  </>
                )}
                
                {selectedProductsCount > 0 && (
                  <IconButton onClick={onSyncProducts} disabled={syncLoading} title={`Sync ${selectedProductsCount}`}>
                    <svg className={`w-3 h-3 ${syncLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </IconButton>
                )}
                
                <div className="relative">
                  <IconButton
                    onClick={() => setIsCreateDropdownOpen(!isCreateDropdownOpen)}
                    variant={isCreateDropdownOpen ? 'active' : 'default'}
                    title="Add"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </IconButton>
                  
                  <ProductCreateDropdown
                    isOpen={isCreateDropdownOpen}
                    onClose={() => setIsCreateDropdownOpen(false)}
                    onCreateProduct={() => {}}
                    onBulkImport={() => {}}
                  />
                </div>
                
                <BulkActionsDropdown
                  selectedCount={selectedProductsCount}
                  onAction={onBulkAction || (() => {})}
                  onClearSelection={onClearSelection || (() => {})}
                />
              </>
            )}
            
            {/* System Controls */}
            <Divider className="mx-0.5" />
            
            <div className="relative">
              <IconButton
                onClick={() => setIsViewsDropdownOpen(!isViewsDropdownOpen)}
                variant={isViewsDropdownOpen ? 'active' : 'default'}
                title="Views"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </IconButton>
              
              <ViewsDropdown
                isOpen={isViewsDropdownOpen}
                onClose={() => setIsViewsDropdownOpen(false)}
                onProductsToggle={onProductsToggle}
                onCustomersToggle={onCustomersToggle}
                onOrdersToggle={() => onViewChange({ isOrdersViewOpen: !viewState.isOrdersViewOpen })}
                onReportsToggle={onReportsToggle}
                isOrdersViewOpen={viewState.isOrdersViewOpen}
                isReportsViewOpen={viewState.isReportsViewOpen}
              />
            </div>

            <div className="relative">
              <IconButton
                onClick={() => setIsFilesDropdownOpen(!isFilesDropdownOpen)}
                variant={isFilesDropdownOpen ? 'active' : 'default'}
                title="Files"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

            <div className="relative">
              <IconButton
                onClick={() => setIsSettingsDropdownOpen(!isSettingsDropdownOpen)}
                variant={isSettingsDropdownOpen ? 'active' : 'default'}
                title="Settings"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

            <div className="relative">
              <IconButton
                onClick={() => setIsAuditDropdownOpen(!isAuditDropdownOpen)}
                variant={isAuditDropdownOpen ? 'active' : 'default'}
                title="Audit"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </IconButton>
              
              <AuditDropdown
                isOpen={isAuditDropdownOpen}
                onClose={() => setIsAuditDropdownOpen(false)}
              />
            </div>

              <IconButton
                onClick={async () => {
                  if (!onRefresh || isRefreshing) return;
                  setIsRefreshing(true);
                  try {
                    await onRefresh();
                  } catch (error) {
                    console.error('Refresh error:', error);
                  } finally {
                    setTimeout(() => setIsRefreshing(false), 800);
                  }
                }}
                variant="default"
                disabled={!onRefresh || isRefreshing}
                title="Refresh"
              >
                <svg className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </IconButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
