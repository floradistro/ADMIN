import React, { useState, useCallback } from 'react';
import { ProductList, ProductGridHeader } from '../../../components';

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

  // Use enriched products if available, otherwise use filtered products
  const filteredProducts = getFilteredProducts(filterState);
  const displayProducts = hasLoadedFieldValues ? enrichedProducts : filteredProducts;

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




  return (
    <div className="w-full h-full bg-neutral-900 flex flex-col overflow-hidden">
      {/* Shared Header with Tabs */}
      <ProductGridHeader
        selectedCategory={filterState.selectedCategory}
        onCategoryChange={(category) => onFilterChange({ selectedCategory: category })}
        categoryOptions={categoryOptions}
        selectedLocationId={filterState.selectedLocationId}
        onLocationChange={(locationId, aggregateChildrenValue) => {
          onFilterChange({ selectedLocationId: locationId });
          if (aggregateChildrenValue !== undefined) {
            setAggregateChildren(aggregateChildrenValue);
          }
        }}
        hideZeroQuantity={filterState.hideZeroQuantity}
        onHideZeroQuantityChange={(hide) => onFilterChange({ hideZeroQuantity: hide })}
        showSelectedOnly={filterState.showSelectedOnly}
        onShowSelectedOnlyChange={(show) => onFilterChange({ showSelectedOnly: show })}
        onBulkInventory={onBulkInventory}
        selectedProductsCount={selectedProducts.size}
        onBulkAction={handleBulkActionFromHeader}
        onClearSelection={clearSelection}
        onBulkSave={onBulkSave}
        onBulkJsonEdit={onBulkJsonEdit}
        bulkEditCount={bulkEditProductIds.size}
        activeTab={productGridTab}
        onTabChange={setProductGridTab}
        onBlueprintCreate={() => {
          // Trigger blueprint creation
          const event = new CustomEvent('blueprintCreate');
          window.dispatchEvent(event);
        }}
        onBlueprintRefresh={() => {
          // Trigger blueprint refresh
          const event = new CustomEvent('blueprintRefresh');
          window.dispatchEvent(event);
        }}
        locations={floraLocations}
        onCreateProduct={() => {
          // Refresh the product list after creation
          onRefresh();
        }}
        onBulkImport={() => {/* TODO: Implement bulk import */}}
        onSyncProducts={onSyncProducts}
        syncLoading={syncLoading}
        selectedProductIds={Array.from(selectedProducts)}
        columnConfigs={columnConfigs}
        onToggleColumn={toggleColumn}
        onToggleAllBlueprints={toggleAllBlueprintColumns}
        onLoadFieldValues={handleLoadFieldValues}
        isLoadingBlueprintFields={isLoadingBlueprintFields}
        bulkEditProductIds={bulkEditProductIds}
      />
      
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
        onCategoryChange={(category) => onFilterChange({ selectedCategory: category })}
        onLoadMore={onLoadMore}
        isLoading={isLoading}
        hasMore={hasMore}
        onRefresh={onRefresh}
        locations={floraLocations}
        selectedProducts={selectedProducts}
        onSelectedProductsChange={setSelectedProducts}
        bulkEditProductIds={bulkEditProductIds}
      />

    </div>
  );
}
