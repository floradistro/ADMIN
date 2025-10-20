import React, { useState, useEffect } from 'react';
import { Select, IconButton, LocationSelector, ProductCreateDropdown, ColumnSelector, BulkActionsDropdown } from '../ui';
import { BulkFieldSelector } from './BulkFieldSelector';
import { useBulkEditFieldContext } from '../../contexts/BulkEditFieldContext';
import { useProductContext } from '../../contexts/ProductContext';
import { FloraLocation } from '../../services/inventory-service';
import { ColumnConfig } from '../../types';
import { ProductGridTab } from '../../app/modules/products/useProducts';

interface ProductGridHeaderProps {
  // Product list mode props
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  categoryOptions?: Array<{ value: string; label: string }>;
  selectedLocationId?: string;
  onLocationChange?: (locationId: string, aggregateChildren?: boolean) => void;

  // Filter props
  hideZeroQuantity?: boolean;
  onHideZeroQuantityChange?: (hide: boolean) => void;
  showSelectedOnly?: boolean;
  onShowSelectedOnlyChange?: (show: boolean) => void;

  onBulkInventory?: () => void;
  selectedProductsCount?: number;
  onBulkAction?: (action: 'update' | 'transfer' | 'convert' | 'delete' | 'edit') => void;
  onClearSelection?: () => void;
  onBulkSave?: () => void;
  onBulkJsonEdit?: () => void;
  bulkEditCount?: number;
  
  // Tab navigation props
  activeTab?: ProductGridTab;
  onTabChange?: (tab: ProductGridTab) => void;
  
  // Blueprint actions
  onBlueprintCreate?: () => void;
  onBlueprintRefresh?: () => void;
  blueprintLoading?: boolean;
  
  // Product creation props
  onCreateProduct?: () => void;
  onBulkImport?: () => void;
  
  // Sync props
  onSyncProducts?: () => void;
  syncLoading?: boolean;
  selectedProductIds?: number[];
  
  // Common props
  locations?: FloraLocation[];
  
  // Column management props
  columnConfigs?: ColumnConfig[];
  onToggleColumn?: (columnId: string) => void;
  onToggleAllBlueprints?: (visible: boolean) => void;
  onLoadFieldValues?: () => void;
  isLoadingBlueprintFields?: boolean;
  
  // Bulk edit product IDs
  bulkEditProductIds?: Set<number>;
}

export function ProductGridHeader({
  selectedCategory = '',
  onCategoryChange,
  categoryOptions = [],
  selectedLocationId = '',
  onLocationChange,
  hideZeroQuantity = false,
  onHideZeroQuantityChange,
  showSelectedOnly = false,
  onShowSelectedOnlyChange,
  onBulkInventory,
  selectedProductsCount = 0,
  onBulkAction,
  onClearSelection,
  onBulkSave,
  onBulkJsonEdit,
  bulkEditCount = 0,
  activeTab = 'products',
  onTabChange,
  onBlueprintCreate,
  onBlueprintRefresh,
  blueprintLoading = false,
  onCreateProduct,
  onBulkImport,
  onSyncProducts,
  syncLoading = false,
  selectedProductIds = [],
  locations = [],
  columnConfigs = [],
  onToggleColumn,
  onToggleAllBlueprints,
  onLoadFieldValues,
  isLoadingBlueprintFields = false,
  bulkEditProductIds,
}: ProductGridHeaderProps) {
  const [isCreateDropdownOpen, setIsCreateDropdownOpen] = useState(false);
  
  // Get dialogs from product context
  const { dialogs } = useProductContext();
  
  // Get bulk edit field context
  const {
    availableFields,
    selectedFields,
    setSelectedFields,
    setAvailableFields,
    fetchAvailableFields,
    isLoadingFields
  } = useBulkEditFieldContext();
  
  // Fetch available fields when bulk edit mode is activated
  useEffect(() => {
    if (bulkEditProductIds && bulkEditProductIds.size > 0) {
      const productIds = Array.from(bulkEditProductIds);
      fetchAvailableFields(productIds);
    } else {
      // Clear available fields when bulk edit mode is disabled
      setAvailableFields([]);
    }
  }, [bulkEditProductIds, fetchAvailableFields, setAvailableFields]);

  const handleBulkActionClick = (action: 'update' | 'transfer' | 'convert' | 'delete' | 'edit') => {
    if (selectedProductsCount === 0) {
      dialogs.showWarning('No Selection', 'Please select products first');
      return;
    }
    onBulkAction?.(action);
  };


  return (
    <div className="px-2 md:px-4 py-2 border-b border-white/[0.04] bg-neutral-900 flex-shrink-0 fixed top-10 left-0 right-0 z-20">
      <div className="flex items-center gap-2 w-full overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent hover:scrollbar-thumb-neutral-600">
        {/* Left section - Product counts */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="px-2 py-1 bg-white/[0.05] text-neutral-400 text-xs rounded product-text">
            {selectedProductIds.length}
          </span>
          {selectedProductsCount > 0 && (
            <span className="px-2 py-1 bg-white/[0.08] text-neutral-300 text-xs rounded product-text">
              {selectedProductsCount} sel
            </span>
          )}
          {bulkEditCount > 0 && (
            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded product-text">
              {bulkEditCount} edit
            </span>
          )}
        </div>

        {/* Filters - All in one scrollable row */}
        <div className="flex items-center gap-2 flex-shrink-0">
            {/* Location Filter */}
            <LocationSelector
              selectedLocation={selectedLocationId}
              onLocationChange={onLocationChange || (() => {})}
              locations={locations}
              showAggregation={true}
              className="min-w-[120px] flex-shrink-0"
            />

            {/* Category Filter */}
            <Select
              value={selectedCategory}
              onChange={(e) => {
                onCategoryChange?.(e.target.value);
              }}
              options={categoryOptions}
              className="min-w-[120px] flex-shrink-0"
            />

            {/* Zero Quantity Filter Toggle */}
            <IconButton
              onClick={() => onHideZeroQuantityChange?.(!hideZeroQuantity)}
              variant={hideZeroQuantity ? 'active' : 'default'}
              title={hideZeroQuantity ? 'Show all' : 'Hide zero stock'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M9.878 9.878l.707-.707M14.121 14.121l.707-.707M14.121 14.121L15.536 15.536M14.121 14.121l.707.707" />
              </svg>
            </IconButton>

            {/* Show Selected Only Filter Toggle */}
            <IconButton
              onClick={() => onShowSelectedOnlyChange?.(!showSelectedOnly)}
              variant={showSelectedOnly ? 'active' : 'default'}
              title={showSelectedOnly ? 'Show all' : 'Selected only'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </IconButton>
          </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
            {/* Save All - Only show when products are in bulk edit mode */}
            {bulkEditCount > 0 && (
              <>
                {/* Field Selector for Bulk Edit */}
                <BulkFieldSelector
                  availableFields={availableFields}
                  selectedFields={selectedFields}
                  onFieldSelectionChange={setSelectedFields}
                />
                <button
                  onClick={onBulkJsonEdit}
                  title={`JSON Editor (${bulkEditCount} products)`}
                  className="flex items-center gap-2 px-2 py-1.5 bg-white/[0.05] text-neutral-300 rounded-lg hover:bg-white/[0.08] transition text-xs relative"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </button>
                <button
                  onClick={onBulkSave}
                  title={`Save All (${bulkEditCount} products)`}
                  className="flex items-center gap-2 px-2 py-1.5 bg-white/[0.05] text-neutral-300 rounded-lg hover:bg-white/[0.08] transition text-xs relative"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                </button>
              </>
            )}

            {/* Sync Products - Only show when products are selected */}
            {selectedProductsCount > 0 && (
              <>


                {/* Sync Products */}
                <IconButton
                  onClick={onSyncProducts}
                  variant="default"
                  title={`Sync ${selectedProductsCount} selected products with all locations`}
                  disabled={syncLoading}
                >
                  <svg className={`w-5 h-5 ${syncLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </IconButton>
              </>
            )}

            {/* Add Product Dropdown */}
            <div className="relative">
              <IconButton
                onClick={() => setIsCreateDropdownOpen(!isCreateDropdownOpen)}
                variant={isCreateDropdownOpen ? 'active' : 'default'}
                title="Add Products"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

            {/* Bulk Actions Dropdown */}
            <BulkActionsDropdown
              selectedCount={selectedProductsCount}
              onAction={handleBulkActionClick}
              onClearSelection={onClearSelection || (() => {})}
            />
          </div>

      </div>
    </div>
  );
}