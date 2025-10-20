'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Product } from '../../types';
import { Button, Select, IconButton, ColumnSelector } from '../ui';

import { ProductTableRow } from './ProductTableRow';
import { BulkActionPanel } from './BulkActionPanel';
import { FloraLocation } from '../../services/inventory-service';
import { useColumnManager } from '../../hooks/useColumnManager';
import { useProductContext } from '../../contexts/ProductContext';


interface ProductListProps {
  products: Product[];
  expandedItems: Set<number>;
  onToggleExpand: (id: number) => void;
  onBulkExpandCollapse?: (ids: number[], expand: boolean) => void;
  onEditProduct: (product: Product) => void;
  onManageInventory?: (product: Product) => void;
  onBulkInventory?: () => void;
  onBulkAction?: (action: 'update' | 'transfer' | 'convert', selectedProducts: Product[]) => void;
  selectedCategory: string;
  selectedLocationId?: string;
  onCategoryChange: (category: string) => void;
  onLoadMore?: () => void;
  isLoading?: boolean;
  hasMore?: boolean;
  onRefresh?: () => void;
  locations?: FloraLocation[];
  selectedProducts?: Set<number>;
  onSelectedProductsChange?: (selected: Set<number>) => void;
  bulkEditProductIds?: Set<number>;
  onBulkEditChange?: (bulkEditIds: Set<number>) => void;
}

export function ProductList({ 
  products, 
  expandedItems, 
  onToggleExpand, 
  onBulkExpandCollapse,
  onEditProduct,
  onManageInventory,
  onBulkInventory,
  onBulkAction,
  selectedCategory,
  selectedLocationId,
  onCategoryChange,
  onLoadMore,
  isLoading = false,
  hasMore = false,
  onRefresh,
  locations = [],
  selectedProducts: externalSelectedProducts,
  onSelectedProductsChange,
  bulkEditProductIds,
  onBulkEditChange
}: ProductListProps) {
  
  // Get dialogs from product context
  const { dialogs } = useProductContext();
  
  // Column management (passed from parent)
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
  const [internalSelectedProducts, setInternalSelectedProducts] = useState<Set<number>>(new Set());
  
  // Handle loading field values for products
  const handleLoadFieldValues = useCallback(async () => {
    try {
      await loadFieldValuesForProducts(products);
    } catch (error) {
    }
  }, [loadFieldValuesForProducts, products]);
  const [bulkAction, setBulkAction] = useState<'update' | 'transfer' | 'convert' | null>(null);




  // Use external state if provided, otherwise use internal state
  const selectedProducts = externalSelectedProducts ?? internalSelectedProducts;
  const setSelectedProducts = onSelectedProductsChange ?? setInternalSelectedProducts;

  const handleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)));
    }
  };

  const handleSelectProduct = (productId: number) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const clearSelection = () => {
    setSelectedProducts(new Set());
    setBulkAction(null);
  };

  const allSelectedExpanded = selectedProducts && selectedProducts.size > 0
    ? Array.from(selectedProducts).every(id => expandedItems.has(id))
    : false;

  // Preload blueprint data for visible products when expanded
  // Products are already filtered by parent component


  const handleBulkToggleExpand = () => {
    if (!selectedProducts || selectedProducts.size === 0) return;
    const ids = Array.from(selectedProducts);
    if (onBulkExpandCollapse) {
      onBulkExpandCollapse(ids, !allSelectedExpanded);
    } else {
      // Fallback to per-item toggles if bulk handler not provided
      if (allSelectedExpanded) {
        ids.forEach((id) => expandedItems.has(id) && onToggleExpand(id));
      } else {
        ids.forEach((id) => !expandedItems.has(id) && onToggleExpand(id));
      }
    }
  };

  const handleBulkActionClick = (action: 'update' | 'transfer' | 'convert') => {
    if (selectedProducts.size === 0) {
      dialogs.showWarning('No Selection', 'Please select products first');
      return;
    }
    
    const selectedProductsList = products.filter(p => selectedProducts.has(p.id));
    onBulkAction?.(action, selectedProductsList);
    clearSelection();
  };

  // Collect all unique blueprint fields from available blueprint fields (same as column manager)
  const getAvailableBulkFields = React.useMemo(() => {
    if (!selectedProducts || selectedProducts.size === 0) return [];
    
    const fieldsMap = new Map<string, { 
      field_name: string; 
      field_label: string; 
      field_type: string; 
      count: number; 
      blueprint_name?: string;
      is_blueprint_field: boolean;
    }>();
    
    
    // Get all selected products
    const selectedProductsList = products.filter(p => selectedProducts.has(p.id));
    
    // Add standard WooCommerce fields
    fieldsMap.set('description', {
      field_name: 'description',
      field_label: 'Description',
      field_type: 'textarea',
      count: selectedProducts.size,
      is_blueprint_field: false
    });
    fieldsMap.set('short_description', {
      field_name: 'short_description', 
      field_label: 'Short Description',
      field_type: 'textarea',
      count: selectedProducts.size,
      is_blueprint_field: false
    });
    
    // First, collect blueprint fields that exist on selected products
    const productBlueprintFields = new Map<string, {
      field_name: string;
      field_label: string;
      field_type: string;
      blueprint_name: string;
      count: number;
    }>();
    
    selectedProductsList.forEach(product => {
      
      if (product.blueprint_fields && Array.isArray(product.blueprint_fields)) {
        product.blueprint_fields.forEach(field => {
          const fieldKey = field.field_name;
          
          if (productBlueprintFields.has(fieldKey)) {
            // Increment count for existing field
            const existing = productBlueprintFields.get(fieldKey)!;
            existing.count++;
          } else {
            // Add new field
            productBlueprintFields.set(fieldKey, {
              field_name: field.field_name,
              field_label: field.field_label || field.field_name,
              field_type: field.field_type || 'text',
              blueprint_name: field.blueprint_name || 'Blueprint',
              count: 1
            });
          }
        });
      }
    });
    
    // Second, add ALL available blueprint fields from column manager (even if not on products)
    columnConfigs.forEach(config => {
      if (config.type === 'blueprint' && config.blueprint_field_name) {
        const fieldKey = config.blueprint_field_name;
        
        if (!productBlueprintFields.has(fieldKey)) {
          // This field exists in the system but not on selected products
          productBlueprintFields.set(fieldKey, {
            field_name: fieldKey,
            field_label: config.label,
            field_type: config.blueprint_field_type || 'text',
            blueprint_name: 'Blueprint Field',
            count: 0 // Not on any selected products yet
          });
        }
      }
    });
    
    // Add all blueprint fields to the main fields map
    productBlueprintFields.forEach((field, fieldKey) => {
      fieldsMap.set(fieldKey, {
        field_name: field.field_name,
        field_label: field.field_label,
        field_type: field.field_type,
        count: field.count,
        blueprint_name: field.blueprint_name,
        is_blueprint_field: true
      });
    });
    
    const allFields = Array.from(fieldsMap.values());
    
    return allFields.sort((a, b) => {
      // Sort blueprint fields first, then WooCommerce fields
      if (a.is_blueprint_field && !b.is_blueprint_field) return -1;
      if (!a.is_blueprint_field && b.is_blueprint_field) return 1;
      return a.field_label.localeCompare(b.field_label);
    });
  }, [selectedProducts, products, columnConfigs]);



  return (
    <div 
      className="flex-1 min-h-0 overflow-y-scroll overflow-x-hidden scrollable-container p-0 bg-neutral-900 relative"
      style={{ 
        WebkitOverflowScrolling: 'touch', 
        overscrollBehavior: 'contain',
        height: '100%',
        position: 'relative'
      }}
    >
      {/* Table View */}
      <div className="min-w-full">
            {/* Table Header - Hide on mobile */}
            <div className="hidden md:block sticky top-0 bg-neutral-900 backdrop-blur border-b border-white/[0.08] px-4 py-2 z-10">
              <div className="flex items-center gap-3 text-xs font-medium text-neutral-400 relative">
                {/* Select All Icon */}
                <div className="w-6 flex items-center justify-center">
                  <button
                    onClick={handleSelectAll}
                    className="w-4 h-4 flex items-center justify-center rounded border border-neutral-500 bg-neutral-800/50 hover:border-neutral-400 hover:bg-neutral-700/50 transition-colors focus:outline-none focus:ring-1 focus:ring-white/20"
                    title="Select all products"
                  >
                    {selectedProducts.size === products.length && products.length > 0 ? (
                      // All selected - subtle filled square
                      <svg className="w-3 h-3 text-neutral-400" fill="currentColor" viewBox="0 0 16 16">
                        <rect width="16" height="16" rx="1"/>
                      </svg>
                    ) : selectedProducts.size > 0 ? (
                      // Some selected - dash/minus
                      <svg className="w-3 h-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 16 16" strokeWidth="2">
                        <line x1="4" y1="8" x2="12" y2="8"/>
                      </svg>
                    ) : (
                      // None selected - empty
                      <div className="w-3 h-3"></div>
                    )}
                  </button>
                </div>

                <div className="w-6 flex items-center">
                  <button
                    onClick={handleBulkToggleExpand}
                    disabled={!selectedProducts || selectedProducts.size === 0}
                    className="w-6 h-6 flex items-center justify-center bg-white/[0.05] text-neutral-300 rounded hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed"
                    title={allSelectedExpanded ? 'Collapse selected' : 'Expand selected'}
                  >
                    {allSelectedExpanded ? (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </button>
                </div>
                

                
                {/* Table Column Headers */}
                <>
                  {visibleColumns.map(column => (
                    <div 
                      key={column.id} 
                      className={column.width || 'flex-1'}
                    >
                      {column.label}
                    </div>
                  ))}
                </>
                


                
                {/* Column Selector Icon - Far Right */}
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
                  <ColumnSelector
                    columnConfigs={columnConfigs}
                    onToggleColumn={toggleColumn}
                    onToggleAllBlueprints={toggleAllBlueprintColumns}
                    onLoadFieldValues={handleLoadFieldValues}
                    isLoadingBlueprintFields={isLoadingBlueprintFields}
                  />
                </div>
              </div>
            </div>
            
            {/* Table Rows */}
            <div>
              {products.map((product) => (
                <ProductTableRow
                  key={product.id}
                  product={product}
                  selectedLocationId={selectedLocationId}
                  isExpanded={expandedItems.has(product.id)}
                  onToggleExpand={() => onToggleExpand(product.id)}
                  onEdit={() => onEditProduct(product)}
                  onManageInventory={onManageInventory ? () => onManageInventory(product) : undefined}
                  onRefresh={onRefresh}
                  isSelected={selectedProducts.has(product.id)}
                  onSelect={() => handleSelectProduct(product.id)}
                  visibleColumns={visibleColumns}
                  getBlueprintFieldValue={getBlueprintFieldValue}
                  formatBlueprintFieldValue={formatBlueprintFieldValue}
                  isBulkEditMode={bulkEditProductIds?.has(product.id) ?? false}
                />
              ))}
            </div>
          </div>
        
        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center py-8">
            <Button 
              variant="secondary" 
              size="md"
              onClick={onLoadMore}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Load More Products'}
            </Button>
          </div>
        )}
        
        {/* Empty State - only show when not loading */}
        {!isLoading && products.length === 0 && (
          <div className="flex justify-center py-12">
            <div className="text-white/60">No products found</div>
          </div>
        )}
    </div>
  );
}