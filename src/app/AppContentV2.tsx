'use client';

import React, { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { Header } from '../components';
import { StatusBar } from '../components/layout/StatusBar';
import { useAppContext, useFilterContext, useProductContext } from '../contexts';
import { BulkJsonEditor } from '../components/features/BulkJsonEditor';
import { BulkEditFieldProvider } from '../contexts/BulkEditFieldContext';
import { useTabManagementV2 } from '../hooks/useTabManagementV2';
import { TabViewManager, createTabRegistry, TAB_COMPONENTS } from '../components/features/TabViewManager';
import { Tab } from '../components/ui/TabBar';
import { ProtectedRoute } from '../components/auth';
import { Product } from '../types';

// Tab configuration registry
const TAB_CONFIGS = {
  products: {
    title: 'Products',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
    keepAlive: true,
    preload: true,
  },
  customers: {
    title: 'Customers',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>,
    keepAlive: false,
    preload: false,
  },
  orders: {
    title: 'Orders',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
    keepAlive: false,
    preload: false,
  },
  coa: {
    title: 'COA Manager',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    keepAlive: false,
    preload: false,
  },
  media: {
    title: 'Media Manager',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    keepAlive: false,
    preload: false,
  },
  reports: {
    title: 'Reports',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    keepAlive: false,
    preload: false,
  },
  settings: {
    title: 'Settings',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    keepAlive: false,
    preload: false,
  },
} as const;

export function AppContent() {
  const [mounted, setMounted] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<string>('locations');
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Create tab registry
  const tabRegistry = useMemo(() => createTabRegistry(), []);
  
  // Get contexts
  const {
    viewState,
    setViewState,
    handleViewChange,
    handleToggleExpand,
    handleBulkExpandCollapse,
    handleEditProduct,
    handleManageInventory,
    handleBulkInventory,
    handleBulkAction,
    bulkEditProductIds,
    handleBulkEdit,
    clearBulkEdit,
    handleBulkSave,
    handleBulkJsonEdit,
    isBulkJsonEditorOpen,
    setBulkJsonEditorOpen,
  } = useAppContext();

  const { filterState, updateFilter } = useFilterContext();

  const {
    products,
    floraLocations,
    categoryOptions,
    isLoading,
    hasMore,
    syncLoading,
    initializeProducts,
    fetchProducts,
    fetchProductsWithFilters,
    fetchLocations,
    handleSyncProducts,
    handleBulkDelete,
    selectedProducts,
    bulkActions: { setSelectedProducts },
  } = useProductContext();

  // Enhanced tab management - only initialize after hydration
  const {
    tabs,
    activeTabId,
    openTabsSet,
    visibleTabs,
    minimizedTabs,
    openTab,
    closeTab,
    activateTab,
    toggleMinimize,
    togglePin,
    forceCloseAllTabs,
  } = useTabManagementV2({
    defaultTab: undefined,
    persistState: isHydrated, // Only persist after hydration
    maxTabs: 10,
  });

  // Handle view state updates when active tab changes (moved to useEffect to avoid render issues)
  useEffect(() => {
    if (activeTabId) {
      setViewState(prev => {
        const newState = { ...prev };
        // Reset all view flags
        Object.keys(newState).forEach(key => {
          if (key.includes('View') || key.includes('Open')) {
            (newState as any)[key] = false;
          }
        });
        
        // Set the appropriate flag for the active tab
        switch (activeTabId) {
          case 'products':
            break; // Products is the default view
          case 'customers':
            newState.isCustomerViewOpen = true;
            break;
          case 'orders':
            newState.isOrdersViewOpen = true;
            break;
          case 'settings':
            newState.isSettingsOpen = true;
            break;
          case 'coa':
            newState.isCoaViewOpen = true;
            break;
          case 'media':
            newState.isMediaViewOpen = true;
            break;
          case 'reports':
            newState.isReportsViewOpen = true;
            break;
        }
        
        return newState;
      });
    }
  }, [activeTabId, setViewState]);

  // Set mounted and hydrated after hydration
  useEffect(() => {
    setMounted(true);
    setIsHydrated(true);
  }, []);

  // Add keyboard shortcut for closing all tabs (Cmd/Ctrl + Shift + W)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'W') {
        e.preventDefault();
        forceCloseAllTabs();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [forceCloseAllTabs]);

  // Initialize data - but don't load products if filters are already set
  useEffect(() => {
    // Only initialize if we haven't set filters yet
    if (!filterState.selectedCategory && !filterState.selectedLocationId) {
      initializeProducts();
    }
  }, []);

  // Get props for each tab type
  const getTabProps = useCallback((tabId: string) => {
    const baseProps = {
      floraLocations,
      onClose: () => closeTab(tabId),
    };

    switch (tabId) {
      case 'products':
        return {
          ...baseProps,
          products,
          categoryOptions,
          filterState,
          viewState,
          onFilterChange: updateFilter,
          onViewChange: handleViewChange,
          onToggleExpand: handleToggleExpand,
          onBulkExpandCollapse: handleBulkExpandCollapse,
          onEditProduct: handleEditProduct,
          onManageInventory: handleManageInventory,
          onBulkInventory: handleBulkInventory,
          onBulkAction: handleBulkAction,
          onBulkEdit: handleBulkEdit,
          onBulkSave: handleBulkSave,
          onBulkJsonEdit: handleBulkJsonEdit,
          onLoadMore: () => {},
          onRefresh: () => fetchProducts(1, true),
          onSyncProducts: handleSyncProducts,
          onBulkDelete: handleBulkDelete,
          fetchProductsWithFilters,
          isLoading,
          hasMore,
          syncLoading,
        };
      case 'settings':
        return {
          ...baseProps,
          activeTab: activeSettingsTab,
          onTabChange: setActiveSettingsTab,
        };
      case 'reports':
        return {
          ...baseProps,
        };
      default:
        return baseProps;
    }
  }, [
    floraLocations, products, categoryOptions, filterState, viewState,
    updateFilter, handleViewChange, handleToggleExpand, handleBulkExpandCollapse,
    handleEditProduct, handleManageInventory, handleBulkInventory, handleBulkAction,
    handleBulkEdit, handleBulkSave, handleBulkJsonEdit, fetchProducts,
    handleSyncProducts, handleBulkDelete, isLoading, hasMore, syncLoading,
    closeTab, activeSettingsTab
  ]);

  // Register tab configurations (memoized to prevent unnecessary re-registrations)
  const tabConfigs = useMemo(() => {
    const configs = new Map();
    Object.entries(TAB_CONFIGS).forEach(([id, config]) => {
      configs.set(id, {
        id,
        component: TAB_COMPONENTS[id as keyof typeof TAB_COMPONENTS],
        keepAlive: config.keepAlive,
        preload: config.preload,
        props: getTabProps(id),
      });
    });
    return configs;
  }, [getTabProps]);

  // Register configurations with the registry
  useEffect(() => {
    tabConfigs.forEach((config, id) => {
      tabRegistry.registerTab(id, config);
    });
  }, [tabRegistry, tabConfigs]);

  // Convert tabs to Tab objects for the header (prevent hydration mismatch)
  const generateTabs = useCallback((): Tab[] => {
    if (!isHydrated) {
      return []; // Return empty array on server to match initial client state
    }
    return visibleTabs.map(tab => ({
      id: tab.id,
      title: tab.title,
      isActive: tab.isActive,
      isMinimized: tab.isMinimized,
      icon: TAB_CONFIGS[tab.id as keyof typeof TAB_CONFIGS]?.icon || null,
    }));
  }, [visibleTabs, isHydrated]);

  // Tab toggle handlers
  const handleTabToggle = useCallback((tabId: string) => {
    const config = TAB_CONFIGS[tabId as keyof typeof TAB_CONFIGS];
    if (config) {
      if (openTabsSet.has(tabId)) {
        if (activeTabId === tabId) {
          closeTab(tabId);
        } else {
          activateTab(tabId);
        }
      } else {
        openTab(tabId, config.title);
      }
    }
  }, [openTabsSet, activeTabId, openTab, closeTab, activateTab]);

  // Specific toggle handlers
  const handleProductsToggle = useCallback(() => handleTabToggle('products'), [handleTabToggle]);
  const handleCustomersToggle = useCallback(() => handleTabToggle('customers'), [handleTabToggle]);
  const handleOrdersToggle = useCallback(() => handleTabToggle('orders'), [handleTabToggle]);
  const handleSettingsToggle = useCallback(() => handleTabToggle('settings'), [handleTabToggle]);
  const handleCoaToggle = useCallback(() => handleTabToggle('coa'), [handleTabToggle]);
  const handleMediaToggle = useCallback(() => handleTabToggle('media'), [handleTabToggle]);
  const handleReportsToggle = useCallback(() => handleTabToggle('reports'), [handleTabToggle]);

  // Handle direct navigation to settings sections
  const handleNavigateToSettings = useCallback((tab: string) => {
    setActiveSettingsTab(tab);
    if (!openTabsSet.has('settings')) {
      openTab('settings', 'Settings');
    } else {
      activateTab('settings');
    }
  }, [openTabsSet, openTab, activateTab]);

  // Dashboard props
  const dashboardProps = useMemo(() => ({
    onOpenProducts: handleProductsToggle,
    onOpenSettings: handleSettingsToggle,
    onOpenCustomers: handleCustomersToggle,
    onOpenOrders: handleOrdersToggle,
    onOpenAudit: () => {/* TODO: Implement audit functionality */},
    onOpenCoa: handleCoaToggle,
    onOpenMedia: handleMediaToggle,
    onOpenReports: handleReportsToggle,
  }), [
    handleProductsToggle, handleSettingsToggle, handleCustomersToggle,
    handleOrdersToggle, handleCoaToggle, handleMediaToggle, handleReportsToggle
  ]);

  // Show dashboard when no tabs are open
  const showDashboard = openTabsSet.size === 0;

  return (
    <BulkEditFieldProvider>
      <div className="h-screen bg-neutral-900 w-full flex flex-col app-container">
        <Header
          filterState={filterState}
          viewState={viewState}
          onFilterChange={updateFilter}
          onViewChange={(newViews) => {
            if (newViews.isOrdersViewOpen !== undefined) {
              if (newViews.isOrdersViewOpen) {
                handleOrdersToggle();
              } else {
                closeTab('orders');
              }
            } else {
              handleViewChange(newViews);
            }
          }}
          onAuditToggle={() => {/* TODO: Implement audit toggle */}}
          onSettingsToggle={handleSettingsToggle}
          activeSettingsTab={activeSettingsTab}
          onSettingsTabChange={setActiveSettingsTab}
          onNavigateToSettings={handleNavigateToSettings}
          onProductsToggle={handleProductsToggle}
          onCustomersToggle={handleCustomersToggle}
          onCoaToggle={handleCoaToggle}
          onMediaToggle={handleMediaToggle}
          onReportsToggle={handleReportsToggle}
          onRefresh={() => fetchProducts(1, true)}
          tabs={generateTabs()}
          onTabClick={activateTab}
          onTabClose={closeTab}
          onTabMinimize={toggleMinimize}
          onCloseAllTabs={forceCloseAllTabs}
          activeTabId={activeTabId || ''}
          floraLocations={floraLocations}
          categoryOptions={categoryOptions}
          selectedProductsCount={selectedProducts.size}
          bulkEditCount={bulkEditProductIds.size}
          totalProductsCount={products.length}
          onBulkAction={handleBulkAction}
          onClearSelection={() => setSelectedProducts(new Set())}
          onBulkSave={handleBulkSave}
          onBulkJsonEdit={handleBulkJsonEdit}
          onSyncProducts={handleSyncProducts}
          syncLoading={syncLoading}
          bulkEditProductIds={bulkEditProductIds}
          onLocationChange={(locationId) => {
            updateFilter({ selectedLocationId: locationId });
          }}
          onCategoryChange={(category) => {
            updateFilter({ selectedCategory: category });
          }}
          onHideZeroQuantityChange={(hide) => updateFilter({ hideZeroQuantity: hide })}
          onShowSelectedOnlyChange={(show) => updateFilter({ showSelectedOnly: show })}
        />

        <div className="app-content">
          <TabViewManager
            activeTabId={activeTabId || ''}
            openTabs={openTabsSet}
            tabConfigs={tabConfigs}
            showDashboard={showDashboard}
            dashboardProps={dashboardProps}
          />
        </div>

        <div className="app-footer">
          <StatusBar
            userInfo={{ name: "Admin User", role: "Administrator" }}
            currentLocation={filterState.selectedLocationId ? floraLocations.find(loc => loc.id.toString() === filterState.selectedLocationId)?.name || 'Unknown Location' : undefined}
            totalProducts={products.length}
            selectedCount={0}
            lastSync={new Date()}
          />
        </div>

        {/* Bulk JSON Editor */}
        <BulkJsonEditor
          isOpen={isBulkJsonEditorOpen}
          onClose={() => setBulkJsonEditorOpen(false)}
          productIds={Array.from(bulkEditProductIds)}
        />
      </div>
    </BulkEditFieldProvider>
  );
}
