'use client';

import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { ViewState, Product } from '../types';

interface AppContextType {
  // View State
  viewState: ViewState;
  setViewState: React.Dispatch<React.SetStateAction<ViewState>>;
  handleViewChange: (newViews: Partial<ViewState>) => void;
  
  // Expansion Management
  handleToggleExpand: (id: number) => void;
  handleBulkExpandCollapse: (ids: number[], expand: boolean) => void;
  
  // Action Handlers
  handleEditProduct: (product: Product) => void;
  handleManageInventory: (product: Product) => void;
  handleBulkInventory: () => void;
  handleBulkAction: (action: 'update' | 'transfer' | 'convert' | 'delete' | 'edit') => void;
  
  // Bulk Edit State
  bulkEditProductIds: Set<number>;
  handleBulkEdit: (selectedProductIds: number[]) => void;
  clearBulkEdit: () => void;
  handleBulkSave: () => void;
  handleBulkJsonEdit: () => void;
  
  // Bulk JSON Editor State
  isBulkJsonEditorOpen: boolean;
  setBulkJsonEditorOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  // View state management
  const [viewState, setViewState] = useState<ViewState>({
    isMenuOpen: false,
    isCustomerViewOpen: false,
    showOverview: false,
    isOrdersViewOpen: false,
    isSettingsOpen: false,
    isCoaViewOpen: false,
    isMediaViewOpen: false,
    isReportsViewOpen: false,
    expandedItems: new Set<number>(),
    editingProduct: null,
    activeTab: 'basic'
  });

  // Bulk edit state
  const [bulkEditProductIds, setBulkEditProductIds] = useState<Set<number>>(new Set());
  const [isBulkJsonEditorOpen, setIsBulkJsonEditorOpen] = useState(false);

  // View change handler
  const handleViewChange = useCallback((newViews: Partial<ViewState>) => {
    setViewState(prev => ({ ...prev, ...newViews }));
  }, []);

  // Expansion handlers
  const handleToggleExpand = useCallback((id: number) => {
    const newExpanded = new Set(viewState.expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setViewState(prev => ({ ...prev, expandedItems: newExpanded }));
  }, [viewState.expandedItems]);

  const handleBulkExpandCollapse = useCallback((ids: number[], expand: boolean) => {
    setViewState(prev => {
      const newExpanded = new Set(prev.expandedItems);
      ids.forEach(id => expand ? newExpanded.add(id) : newExpanded.delete(id));
      return { ...prev, expandedItems: newExpanded };
    });
  }, []);

  // Action handlers
  const handleEditProduct = useCallback((product: Product) => {
    // TODO: Implement edit product functionality
  }, []);

  const handleManageInventory = useCallback((product: Product) => {
    // TODO: Implement manage inventory functionality
  }, []);

  const handleBulkInventory = useCallback(() => {
    // TODO: Implement bulk inventory functionality
  }, []);

  const handleBulkAction = useCallback((action: 'update' | 'transfer' | 'convert' | 'delete' | 'edit') => {
    // TODO: Implement bulk action functionality
  }, []);

  // Bulk edit handlers
  const handleBulkEdit = useCallback((selectedProductIds: number[]) => {
    setBulkEditProductIds(new Set(selectedProductIds));
    // Auto-expand selected products to show edit mode
    handleBulkExpandCollapse(selectedProductIds, true);
  }, [handleBulkExpandCollapse]);

  const clearBulkEdit = useCallback(() => {
    setBulkEditProductIds(new Set());
  }, []);

  // Bulk save handler
  const handleBulkSave = useCallback(async () => {
    if (bulkEditProductIds.size === 0) return;
    
    // Trigger a custom event that ProductTableRow components can listen to
    const event = new CustomEvent('bulkSaveRequested', {
      detail: { productIds: Array.from(bulkEditProductIds) }
    });
    window.dispatchEvent(event);
    
    // Clear bulk edit state after a short delay to allow saves to complete
    setTimeout(() => {
      setBulkEditProductIds(new Set());
    }, 2000);
  }, [bulkEditProductIds]);

  // Bulk JSON edit handler
  const handleBulkJsonEdit = useCallback(() => {
    if (bulkEditProductIds.size === 0) return;
    setIsBulkJsonEditorOpen(true);
  }, [bulkEditProductIds]);

  // Bulk JSON editor state handler
  const setBulkJsonEditorOpen = useCallback((open: boolean) => {
    setIsBulkJsonEditorOpen(open);
  }, []);



  const contextValue: AppContextType = {
    // View State
    viewState,
    setViewState,
    handleViewChange,
    
    // Expansion Management
    handleToggleExpand,
    handleBulkExpandCollapse,
    
    // Action Handlers
    handleEditProduct,
    handleManageInventory,
    handleBulkInventory,
    handleBulkAction,
    
    // Bulk Edit State
    bulkEditProductIds,
    handleBulkEdit,
    clearBulkEdit,
    handleBulkSave,
    handleBulkJsonEdit,
    
    // Bulk JSON Editor State
    isBulkJsonEditorOpen,
    setBulkJsonEditorOpen,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
