'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { Product, ColumnConfig } from '../types';
import { FloraLocation } from '../services/inventory-service';
import { useProducts, ProductGridTab } from '../app/modules/products/useProducts';
import { useBulkActions } from '../hooks/useBulkActions';
import { usePagination } from '../hooks/usePagination';

interface ProductContextType {
  // Data
  products: Product[];
  floraLocations: FloraLocation[];
  categories: Array<{id: number, name: string}>;
  categoryOptions: Array<{value: string, label: string}>;
  enrichedProducts: Product[];
  
  // State
  isLoading: boolean;
  error: string | null;
  aggregateChildren: boolean;
  productGridTab: ProductGridTab;
  syncLoading: boolean;
  hasLoadedFieldValues: boolean;
  
  // Pagination
  currentPage: number;
  hasMore: boolean;
  totalProducts: number;
  pagination: ReturnType<typeof usePagination>;
  
  // Bulk Actions
  selectedProducts: Set<number>;
  bulkActions: ReturnType<typeof useBulkActions>;
  
  // Column Management
  columnConfigs: ColumnConfig[];
  visibleColumns: ColumnConfig[];
  toggleColumn: (columnId: string) => void;
  toggleAllBlueprintColumns: (show: boolean) => void;
  getBlueprintFieldValue: (product: Product, fieldName: string) => any;
  formatBlueprintFieldValue: (value: any, fieldType: string) => string;
  isLoadingBlueprintFields: boolean;
  
  // Computed
  getFilteredProducts: (filterState: any, allProducts?: Product[]) => Product[];
  
  // Actions
  setProducts: (products: Product[]) => void;
  setProductGridTab: (tab: ProductGridTab) => void;
  setAggregateChildren: (value: boolean) => void;
  setError: (error: string | null) => void;
  fetchProducts: (page?: number, reset?: boolean, filterState?: any) => Promise<void>;
  fetchLocations: (forceRefresh?: boolean) => Promise<void>;
  fetchCategories: () => Promise<void>;
  handleLoadMore: () => void;
  refreshProducts: () => Promise<void>;
  handleLoadFieldValues: () => Promise<void>;
  handleSyncProducts: () => Promise<void>;
  handleBulkDelete: (products: Product[]) => Promise<void>;
  initializeProducts: () => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

interface ProductProviderProps {
  children: ReactNode;
}

export function ProductProvider({ children }: ProductProviderProps) {
  const productsHook = useProducts();

  return (
    <ProductContext.Provider value={productsHook}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProductContext() {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProductContext must be used within a ProductProvider');
  }
  return context;
}
