'use client';

import React, { memo, useMemo, Suspense, lazy, useCallback, ReactNode } from 'react';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Product } from '../../types';

// Lazy load all modules for better code splitting
const ProductsModule = lazy(() => import('../../app/modules/products/ProductsModule').then(m => ({ default: m.ProductsModule })));
const CustomersModule = lazy(() => import('../../app/modules/customers/CustomersModule').then(m => ({ default: m.CustomersModule })));
const OrdersModule = lazy(() => import('../../app/modules/orders/OrdersModule').then(m => ({ default: m.OrdersModule })));
const SettingsView = lazy(() => import('./SettingsView').then(m => ({ default: m.SettingsView })));
const CoaModule = lazy(() => import('../../app/modules/coa/CoaModule').then(m => ({ default: m.CoaModule })));
const MediaModule = lazy(() => import('../../app/modules/media/MediaModule').then(m => ({ default: m.MediaModule })));
const ReportsModule = lazy(() => import('../../app/modules/reports/ReportsModule').then(m => ({ default: m.ReportsModule })));
const DashboardView = lazy(() => import('../../app/modules/dashboard/DashboardView').then(m => ({ default: m.DashboardView })));

// Tab configuration type
interface TabConfig {
  id: string;
  component: React.LazyExoticComponent<React.ComponentType<any>> | React.ComponentType<any>;
  props?: Record<string, any>;
  keepAlive?: boolean;
  preload?: boolean;
}

// View container that ensures complete isolation
const ViewContainer = memo(({ 
  children, 
  isActive, 
  keepAlive = false 
}: { 
  children: ReactNode; 
  isActive: boolean; 
  keepAlive?: boolean;
}) => {
  // Don't render at all if not active and not keeping alive
  if (!isActive && !keepAlive) {
    return null;
  }

  return (
    <div 
      className="tab-view-container" 
      data-active={isActive}
      style={{
        display: isActive ? 'flex' : (keepAlive ? 'flex' : 'none'),
      }}
    >
      {children}
    </div>
  );
});

ViewContainer.displayName = 'ViewContainer';

// Loading fallback component
const TabLoadingFallback = memo(() => (
  <div className="flex-1 flex items-center justify-center bg-neutral-900">
    <div className="flex flex-col items-center gap-4">
      <LoadingSpinner />
      <p className="text-neutral-400 text-sm">Loading view...</p>
    </div>
  </div>
));

TabLoadingFallback.displayName = 'TabLoadingFallback';


interface TabViewManagerProps {
  activeTabId: string;
  openTabs: Set<string>;
  tabConfigs: Map<string, TabConfig>;
  showDashboard: boolean;
  dashboardProps?: any;
}

export const TabViewManager = memo(({
  activeTabId,
  openTabs,
  tabConfigs,
  showDashboard,
  dashboardProps
}: TabViewManagerProps) => {
  // Preload critical tabs
  const preloadedTabs = useMemo(() => {
    const toPreload = new Set<string>();
    tabConfigs.forEach((config, id) => {
      if (config.preload && openTabs.has(id)) {
        toPreload.add(id);
      }
    });
    return toPreload;
  }, [tabConfigs, openTabs]);

  // Render a single tab view
  const renderTabView = useCallback((tabId: string) => {
    const config = tabConfigs.get(tabId);
    if (!config) return null;

    const Component = config.component;
    const isActive = activeTabId === tabId;
    const shouldKeepAlive = config.keepAlive || preloadedTabs.has(tabId);

    return (
      <ViewContainer 
        key={tabId} 
        isActive={isActive} 
        keepAlive={shouldKeepAlive}
      >
        <ErrorBoundary 
          fallback={
            <div className="flex-1 flex items-center justify-center bg-neutral-900">
              <div className="text-center max-w-md">
                <p className="text-red-400 mb-2">Failed to load view</p>
                <p className="text-neutral-500 text-sm mb-4">An error occurred while loading this tab</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded transition-colors"
                >
                  Reload Page
                </button>
              </div>
            </div>
          }
        >
          <Suspense fallback={<TabLoadingFallback />}>
            <Component {...config.props} />
          </Suspense>
        </ErrorBoundary>
      </ViewContainer>
    );
  }, [activeTabId, tabConfigs, preloadedTabs]);

  // If no tabs are open, show dashboard
  if (openTabs.size === 0) {
    return (
      <div className="flex-1 min-h-0 flex relative overflow-hidden">
        <DashboardView {...dashboardProps} />
      </div>
    );
  }

  // Otherwise render tabs
  return (
    <div className="flex-1 min-h-0 flex relative overflow-hidden">
      {Array.from(openTabs).map(tabId => renderTabView(tabId))}
    </div>
  );
});

TabViewManager.displayName = 'TabViewManager';

// Export tab registry for centralized configuration
export const createTabRegistry = () => {
  const registry = new Map<string, TabConfig>();

  const registerTab = (id: string, config: TabConfig) => {
    registry.set(id, { ...config, id });
  };

  const getTabConfig = (id: string) => registry.get(id);
  
  const getAllTabs = () => Array.from(registry.values());

  return {
    registerTab,
    getTabConfig,
    getAllTabs,
    registry
  };
};

// Pre-configured tab components with optimizations
export const TAB_COMPONENTS = {
  products: ProductsModule,
  customers: CustomersModule,
  orders: OrdersModule,
  settings: SettingsView,
  coa: CoaModule,
  media: MediaModule,
  reports: ReportsModule,
  dashboard: DashboardView
} as const;

export type TabId = keyof typeof TAB_COMPONENTS;
