'use client';

import React, { useEffect, useCallback, lazy, Suspense, useRef, useState } from 'react';
import { Header } from '../components';
import { StatusBar } from '../components/layout/StatusBar';
import { LoadingSpinner, ErrorBoundary } from '../components/ui';
import { useAppContext, useFilterContext, useProductContext } from '../contexts';
import { BulkJsonEditor } from '../components/features/BulkJsonEditor';
import { BulkEditFieldProvider } from '../contexts/BulkEditFieldContext';

// Dynamic imports
const SettingsView = lazy(() => import('../components/features/SettingsView').then(module => ({ default: module.SettingsView })));

// Module imports
import { DashboardView } from './modules/dashboard/DashboardView';
import { ProductsModule } from './modules/products/ProductsModule';
import { CustomersModule, CustomersModuleRef } from './modules/customers/CustomersModule';
import { OrdersModule, OrdersModuleRef } from './modules/orders/OrdersModule';
import { CoaModule, CoaModuleRef } from './modules/coa/CoaModule';
import { MediaModule, MediaModuleRef } from './modules/media/MediaModule';
import { ReportsModule, ReportsModuleRef } from './modules/reports/ReportsModule';
import { Tab } from '../components/ui/TabBar';

import { ProtectedRoute } from '../components/auth';
import { Product } from '../types';

export function AppContent() {
  const [mounted, setMounted] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<string>('locations');

  // Get contexts
  const {
    viewState,
    setViewState,
    handleViewChange,
    openTabs,
    activeTabId,
    showDashboard,
    generateTabsData,
    handleTabClick,
    handleTabMinimize,
    handleTabClose,
    toggleTab,
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

  // Set mounted after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

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
    fetchLocations,
    handleSyncProducts,
    handleBulkDelete,
  } = useProductContext();

  // Convert tab data to Tab objects with icons
  const generateTabs = useCallback((viewState: any): Tab[] => {
    const tabsData = generateTabsData(viewState);
    return tabsData.map(tabData => {
      let icon;
      switch (tabData.id) {
        case 'products':
          icon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
          break;
        case 'customers':
          icon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
          break;
        case 'orders':
          icon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
          break;
        case 'coa':
          icon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>;
          break;
        case 'media':
          icon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
          break;
        case 'reports':
          icon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
          break;
        case 'settings':
          icon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
          break;
        default:
          icon = null;
      }
      return { ...tabData, icon };
    });
  }, [generateTabsData]);

  // Initialize data
  useEffect(() => {
    initializeProducts();
  }, [initializeProducts]);

  // Handlers
  const handleLoadMore = useCallback(() => {}, []);
  
  // Refs for different module views
  const customersViewRef = useRef<CustomersModuleRef>(null);
  const ordersViewRef = useRef<OrdersModuleRef>(null);
  const coaViewRef = useRef<CoaModuleRef>(null);
  const mediaViewRef = useRef<MediaModuleRef>(null);
  const reportsViewRef = useRef<ReportsModuleRef>(null);
  
  const handleRefresh = useCallback(async () => {
    switch (activeTabId) {
      case 'products':
        await fetchProducts(1, true);
        break;
      case 'customers':
        customersViewRef.current?.handleRefresh?.();
        // Add a small delay to show the animation
        await new Promise(resolve => setTimeout(resolve, 300));
        break;
        case 'orders':
        ordersViewRef.current?.handleRefresh?.();
        // Add a small delay to show the animation
        await new Promise(resolve => setTimeout(resolve, 300));
        break;
      case 'coa':
        coaViewRef.current?.handleRefresh?.();
        // Add a small delay to show the animation
        await new Promise(resolve => setTimeout(resolve, 300));
        break;
      case 'media':
        mediaViewRef.current?.handleRefresh?.();
        // Add a small delay to show the animation
        await new Promise(resolve => setTimeout(resolve, 300));
        break;
      case 'reports':
        reportsViewRef.current?.handleRefresh?.();
        // Add a small delay to show the animation
        await new Promise(resolve => setTimeout(resolve, 300));
        break;
      case 'settings':
        // Settings doesn't need refresh - it's mostly configuration
        await new Promise(resolve => setTimeout(resolve, 200));
        break;
      default:
        // For dashboard or other tabs, refresh products as fallback
        await fetchProducts(1, true);
        break;
    }
  }, [activeTabId, fetchProducts]);

  const handleSuccess = useCallback(() => {
    fetchProducts(1, true);
    fetchLocations(true);
  }, [fetchProducts, fetchLocations]);

  // Tab toggle handlers
  const handleProductsToggle = useCallback(() => toggleTab('products', setViewState), [toggleTab, setViewState]);
  const handleCustomersToggle = useCallback(() => toggleTab('customers', setViewState), [toggleTab, setViewState]);
  const handleOrdersToggle = useCallback(() => toggleTab('orders', setViewState), [toggleTab, setViewState]);
  const handleSettingsToggle = useCallback(() => toggleTab('settings', setViewState), [toggleTab, setViewState]);
  const handleCoaToggle = useCallback(() => toggleTab('coa', setViewState), [toggleTab, setViewState]);
  const handleMediaToggle = useCallback(() => toggleTab('media', setViewState), [toggleTab, setViewState]);
  const handleReportsToggle = useCallback(() => toggleTab('reports', setViewState), [toggleTab, setViewState]);

  // Handle direct navigation to settings sections
  const handleNavigateToSettings = useCallback((tab: string) => {
    setActiveSettingsTab(tab);
    if (!viewState.isSettingsOpen) {
      toggleTab('settings', setViewState);
    }
  }, [viewState.isSettingsOpen, toggleTab, setViewState]);

  // Don't show different content during hydration - let it render normally
  // The mounted state is only used for dynamic content that needs client-side data

  return (
    <BulkEditFieldProvider>
      <div className="h-screen bg-neutral-900 w-full flex flex-col app-container">
      <Header
        filterState={filterState}
        viewState={viewState}
        onFilterChange={updateFilter}
        onViewChange={(newViews) => {
          if (newViews.isOrdersViewOpen !== undefined) {
            newViews.isOrdersViewOpen ? toggleTab('orders', setViewState) : handleTabClose('orders', setViewState);
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
        onRefresh={handleRefresh}
        tabs={generateTabs(viewState)}
        onTabClick={(tabId) => handleTabClick(tabId, setViewState)}
        onTabClose={(tabId) => handleTabClose(tabId, setViewState)}
        onTabMinimize={(tabId) => handleTabMinimize(tabId, setViewState)}
        activeTabId={activeTabId}
      />

      <div className="app-content">
        <div className="flex-1 min-h-0 flex fixed-content-area" suppressHydrationWarning>
        {/* Dashboard */}
        {showDashboard && (
          <DashboardView
            onOpenProducts={() => toggleTab('products', setViewState)}
            onOpenSettings={() => toggleTab('settings', setViewState)}
            onOpenCustomers={() => toggleTab('customers', setViewState)}
            onOpenOrders={() => toggleTab('orders', setViewState)}
            onOpenAudit={() => {/* TODO: Implement audit functionality */}}
            onOpenCoa={() => toggleTab('coa', setViewState)}
            onOpenMedia={() => toggleTab('media', setViewState)}
            onOpenReports={() => toggleTab('reports', setViewState)}
          />
        )}

        {/* Products View */}
        {openTabs.has('products') && activeTabId === 'products' && (
          <ProductsModule
            // Data props
            products={products}
            floraLocations={floraLocations}
            categoryOptions={categoryOptions}
            // State props
            filterState={filterState}
            viewState={viewState}
            // Handlers
            onFilterChange={updateFilter}
            onViewChange={handleViewChange}
            onToggleExpand={handleToggleExpand}
            onBulkExpandCollapse={handleBulkExpandCollapse}
            onEditProduct={handleEditProduct}
            onManageInventory={handleManageInventory}
            onBulkInventory={handleBulkInventory}
            onBulkAction={handleBulkAction}
            onBulkEdit={handleBulkEdit}
            onBulkSave={handleBulkSave}
            onBulkJsonEdit={handleBulkJsonEdit}
            onLoadMore={handleLoadMore}
            onRefresh={handleRefresh}
            onSyncProducts={handleSyncProducts}
            onBulkDelete={handleBulkDelete}
            // Loading states
            isLoading={isLoading}
            hasMore={hasMore}
            syncLoading={syncLoading}
          />
        )}

        {/* Customers View */}
        {openTabs.has('customers') && activeTabId === 'customers' && (
          <CustomersModule 
            ref={customersViewRef}
            floraLocations={floraLocations} 
            onClose={() => handleTabClose('customers', setViewState)} 
          />
        )}

        {/* Orders View */}
        {openTabs.has('orders') && activeTabId === 'orders' && (
          <OrdersModule 
            ref={ordersViewRef}
            floraLocations={floraLocations} 
            onClose={() => handleTabClose('orders', setViewState)} 
          />
        )}

        {/* Settings View */}
        {openTabs.has('settings') && activeTabId === 'settings' && (
          <ErrorBoundary fallback={
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-neutral-400 mb-4">Failed to load Settings</p>
                <button onClick={() => window.location.reload()} className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded transition-colors">
                  Reload Page
                </button>
              </div>
            </div>
          }>
            <Suspense fallback={<div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>}>
              <SettingsView 
                onClose={() => handleTabClose('settings', setViewState)} 
                activeTab={activeSettingsTab as any}
                onTabChange={setActiveSettingsTab as any}
              />
            </Suspense>
          </ErrorBoundary>
        )}

        {/* COA Manager View */}
        {openTabs.has('coa') && activeTabId === 'coa' && (
          <CoaModule 
            ref={coaViewRef}
            onClose={() => handleTabClose('coa', setViewState)} 
          />
        )}

        {/* Media Manager View */}
        {openTabs.has('media') && activeTabId === 'media' && (
          <MediaModule 
            ref={mediaViewRef}
            onClose={() => handleTabClose('media', setViewState)} 
          />
        )}

        {/* Reports View */}
        {openTabs.has('reports') && activeTabId === 'reports' && (
          <ReportsModule 
            ref={reportsViewRef}
            onClose={() => handleTabClose('reports', setViewState)} 
          />
        )}
        </div>
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
