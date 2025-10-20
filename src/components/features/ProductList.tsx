'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Product } from '../../types';
import { Button, Select, IconButton, ColumnSelector } from '../ui';

import { ProductTableRow } from './ProductTableRow';
import { ProductCardMobile } from './ProductCardMobile';
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
  
  // Mobile FAB menu state
  const [isMobileFabOpen, setIsMobileFabOpen] = useState(false);
  
  // Prevent body scroll when mobile FAB menu is open
  useEffect(() => {
    if (isMobileFabOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileFabOpen]);
  
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
            {/* Table Header - Desktop only */}
            <div className="hidden md:block sticky top-0 bg-neutral-900 backdrop-blur border-b border-white/[0.08] z-10">
              <div className="px-3 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSelectAll}
                    className="w-7 h-7 flex items-center justify-center rounded border border-neutral-500 bg-neutral-800/50 active:bg-neutral-700/50 transition touch-manipulation"
                    title="Select all products"
                  >
                    {selectedProducts.size === products.length && products.length > 0 ? (
                      // All selected - subtle filled square
                      <svg className="w-4 h-4 text-neutral-400" fill="currentColor" viewBox="0 0 16 16">
                        <rect width="16" height="16" rx="1"/>
                      </svg>
                    ) : selectedProducts.size > 0 ? (
                      <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 16 16" strokeWidth="2">
                        <line x1="4" y1="8" x2="12" y2="8"/>
                      </svg>
                    ) : (
                      <div className="w-4 h-4"></div>
                    )}
                  </button>

                  <button
                    onClick={handleBulkToggleExpand}
                    disabled={!selectedProducts || selectedProducts.size === 0}
                    className="w-7 h-7 flex items-center justify-center bg-white/[0.05] text-neutral-300 rounded active:bg-white/[0.12] disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
                    title={allSelectedExpanded ? 'Collapse selected' : 'Expand selected'}
                  >
                    {allSelectedExpanded ? (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 15l7-7 7 7" />
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

        {/* Mobile Floating Action Button */}
        <button
          onClick={() => setIsMobileFabOpen(true)}
          className="md:hidden fixed bottom-6 left-6 z-40 w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all active:scale-95 bg-neutral-800/95 backdrop-blur-xl border border-white/[0.1] mobile-fab-menu"
        >
          {selectedProducts.size > 0 ? (
            <div className="relative">
              <svg className="w-6 h-6 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-white/[0.15] text-neutral-300 text-[10px] font-bold rounded-full flex items-center justify-center border border-white/[0.1]">
                {selectedProducts.size}
              </span>
            </div>
          ) : (
            <svg className="w-6 h-6 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        {/* Mobile List Options Bottom Sheet */}
        {isMobileFabOpen && (
          <div className="fixed inset-0 z-50 md:hidden mobile-fab-menu">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setIsMobileFabOpen(false)}
            />
            
            {/* Sheet */}
            <div className="absolute bottom-0 left-0 right-0 bg-neutral-900 rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-hidden flex flex-col">
              {/* Handle */}
              <div className="flex justify-center py-3">
                <div className="w-10 h-1 bg-white/[0.2] rounded-full" />
              </div>

              {/* Header */}
              <div className="px-6 pb-4 border-b border-white/[0.06]">
                <h3 className="text-xl font-semibold text-white">List Options</h3>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 pb-safe">
                {/* Select All / Deselect All */}
                <div>
                  <button
                    onClick={() => {
                      handleSelectAll();
                      setIsMobileFabOpen(false);
                    }}
                    className="w-full px-4 py-3.5 rounded-xl text-left text-[15px] font-medium transition-all bg-white/[0.05] text-neutral-300 hover:bg-white/[0.08] active:scale-[0.98]"
                  >
                    {selectedProducts.size === products.length && products.length > 0 ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                {/* Expand/Collapse Selected */}
                {selectedProducts.size > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-neutral-400 mb-2.5 uppercase tracking-wider">
                      Selection Actions ({selectedProducts.size})
                    </label>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          handleBulkToggleExpand();
                          setIsMobileFabOpen(false);
                        }}
                        className="w-full px-4 py-3.5 rounded-xl text-left text-[15px] font-medium transition-all bg-white/[0.05] text-neutral-300 hover:bg-white/[0.08] active:scale-[0.98]"
                      >
                        {allSelectedExpanded ? 'Collapse Selected' : 'Expand Selected'}
                      </button>
                      
                      <button
                        onClick={() => {
                          clearSelection();
                          setIsMobileFabOpen(false);
                        }}
                        className="w-full px-4 py-3.5 rounded-xl text-left text-[15px] font-medium transition-all bg-white/[0.05] text-neutral-300 hover:bg-white/[0.08] active:scale-[0.98]"
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  );
}