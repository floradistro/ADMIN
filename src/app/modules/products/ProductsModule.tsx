import React, { useState, useCallback } from 'react';
import { ProductList } from '../../../components';
import { ListFeature } from '../../../components/features/ListFeature';

import { FilterState, ViewState, Product } from '../../../types';
import { FloraLocation } from '../../../services/inventory-service';
import { useColumnManager } from '../../../hooks/useColumnManager';
import { useProductContext, useAppContext } from '../../../contexts';
import { ProductGridTab } from './useProducts';

interface ProductsModuleProps {
  // Data props
  products: Product[];
  floraLocations: FloraLocation[];
  categoryOptions: Array<{ value: string; label: string }>;
  // State props
  filterState: FilterState;
  viewState: ViewState;
  // Handlers
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onViewChange: (newViews: Partial<ViewState>) => void;
  onToggleExpand: (id: number) => void;
  onBulkExpandCollapse: (ids: number[], expand: boolean) => void;
  onEditProduct: (product: Product) => void;
  onManageInventory: (product: Product) => void;
  onBulkInventory: () => void;
  onBulkAction: (action: 'update' | 'transfer' | 'convert', selectedProductsList: Product[]) => void;
  onBulkEdit?: (selectedProductIds: number[]) => void;
  onBulkSave?: () => void;
  onBulkJsonEdit?: () => void;
  onLoadMore: () => void;
  onRefresh: () => void;
  onSyncProducts: () => void;
  onBulkDelete: (products: Product[]) => void;
  fetchProductsWithFilters?: (filterState: FilterState) => Promise<void>;
  // Loading states
  isLoading: boolean;
  hasMore: boolean;
  syncLoading: boolean;
}

export function ProductsModule({
  // Data props
  products,
  floraLocations,
  categoryOptions,
  // State props  
  filterState,
  viewState,
  // Handlers
  onFilterChange,
  onViewChange,
  onToggleExpand,
  onBulkExpandCollapse,
  onEditProduct,
  onManageInventory,
  onBulkInventory,
  onBulkAction,
  onBulkEdit,
  onBulkSave,
  onBulkJsonEdit,
  onLoadMore,
  onRefresh,
  onSyncProducts,
  onBulkDelete,
  fetchProductsWithFilters,
  // Loading states
  isLoading,
  hasMore,
  syncLoading,
}: ProductsModuleProps) {
  // Get state from context
  const { 
    productGridTab, 
    setProductGridTab,
    selectedProducts,
    bulkActions: { setSelectedProducts },
    getFilteredProducts
  } = useProductContext();
  
  // Get bulk edit state from AppContext
  const { bulkEditProductIds } = useAppContext();
  
  // Local state for ProductsModule
  const [aggregateChildren, setAggregateChildren] = useState(false);
  const [enrichedProducts, setEnrichedProducts] = useState<Product[]>([]);
  const [hasLoadedFieldValues, setHasLoadedFieldValues] = useState(false);


  // Column management for products table
  const {
    columnConfigs,
    visibleColumns,
    toggleColumn,
    toggleAllBlueprintColumns,
    getBlueprintFieldValue,
    formatBlueprintFieldValue,
    loadFieldValuesForProducts,
    isLoadingBlueprintFields,
  } = useColumnManager({ products });



  // Handle loading field values for products
  const handleLoadFieldValues = useCallback(async () => {
    try {
      const productsWithFieldValues = await loadFieldValuesForProducts(products);
      setEnrichedProducts(productsWithFieldValues);
      setHasLoadedFieldValues(true);
    } catch (error) {
      // console.error('Failed to load field values:', error);
    }
  }, [loadFieldValuesForProducts, products]);

  // Apply filters to either enriched or regular products - ALWAYS filter!
  const sourceProducts = hasLoadedFieldValues ? enrichedProducts : products;
  const displayProducts = getFilteredProducts(filterState, sourceProducts);

  const handleBulkActionFromHeader = (action: 'update' | 'transfer' | 'convert' | 'delete' | 'edit') => {
    const selectedProductsList = products.filter(p => selectedProducts.has(p.id));
    if (action === 'delete') {
      onBulkDelete(selectedProductsList);
    } else if (action === 'edit') {
      // Handle bulk edit - pass selected product IDs to the edit handler
      onBulkEdit?.(Array.from(selectedProducts));
    } else {
      onBulkAction(action, selectedProductsList);
    }
    
    // Don't clear selection for edit action, as user needs to see which products are being edited
    if (action !== 'edit') {
      setSelectedProducts(new Set());
    }
  };

  const clearSelection = () => {
    setSelectedProducts(new Set());
  };




  // Get selected products as array
  const selectedProductsArray = products.filter(p => selectedProducts.has(p.id));

  // Show full-screen loading on initial load
  const isInitialLoading = isLoading && products.length === 0;

  return (
    <div className="w-full h-full bg-neutral-900 flex flex-col relative overflow-hidden">
      {/* Full Screen Loading Overlay */}
      {isInitialLoading && (
        <div className="fixed inset-0 bg-neutral-900 flex items-center justify-center z-50" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/20 mx-auto mb-2"></div>
            <p className="text-neutral-400">Loading products...</p>
          </div>
        </div>
      )}
      
      {/* ProductGridHeader is now integrated into the main Header component */}
      
      {/* Tab Content - Only Products View */}
      <ProductList
        products={displayProducts}
        expandedItems={viewState.expandedItems}
        onToggleExpand={onToggleExpand}
        onBulkExpandCollapse={onBulkExpandCollapse}
        onEditProduct={onEditProduct}
        onManageInventory={onManageInventory}
        onBulkInventory={onBulkInventory}
        onBulkAction={onBulkAction}
        selectedCategory={filterState.selectedCategory}
        selectedLocationId={filterState.selectedLocationId}
        onCategoryChange={(category) => {
          onFilterChange({ selectedCategory: category });
        }}
        onLoadMore={onLoadMore}
        isLoading={isLoading}
        hasMore={hasMore}
        onRefresh={onRefresh}
        locations={floraLocations}
        selectedProducts={selectedProducts}
        onSelectedProductsChange={setSelectedProducts}
        bulkEditProductIds={bulkEditProductIds}
      />

      {/* List Feature */}
      <ListFeature
        selectedProducts={selectedProductsArray}
        availableColumns={columnConfigs}
        onClearSelection={clearSelection}
      />
    </div>
  );
}
