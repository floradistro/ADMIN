'use client';

import React from 'react';
import { ColumnConfig, Product } from '../../types';
import { ProductTableRow } from './ProductTableRow';
import { BulkActionsState } from '../../hooks/useBulkActions';

interface DataGridProps {
  products: Product[];
  visibleColumns: ColumnConfig[];
  selectedLocationId?: string;
  expandedItems: Set<number>;
  bulkActions: BulkActionsState & {
    toggleProductSelection: (productId: number) => void;
    selectAllProducts: () => void;
  };
  onToggleExpand: (id: number) => void;
  onEdit: (product: Product) => void;
  onManageInventory?: (product: Product) => void;
  onRefresh?: () => void;
  getBlueprintFieldValue?: (product: Product, fieldName: string) => any;
  formatBlueprintFieldValue?: (value: any, fieldType: string) => string;
  isLoading?: boolean;
  className?: string;
}

export function DataGrid({
  products,
  visibleColumns,
  selectedLocationId,
  expandedItems,
  bulkActions,
  onToggleExpand,
  onEdit,
  onManageInventory,
  onRefresh,
  getBlueprintFieldValue,
  formatBlueprintFieldValue,
  isLoading = false,
  className = '',
}: DataGridProps) {
  const renderHeaderContent = (column: ColumnConfig) => {
    switch (column.id) {
      case 'select':
        return (
          <input
            type="checkbox"
            checked={bulkActions.isSelectAllChecked}
            ref={(input) => {
              if (input) input.indeterminate = bulkActions.isIndeterminate;
            }}
            onChange={bulkActions.selectAllProducts}
            className="rounded border-neutral-600 bg-neutral-800 text-blue-500 focus:ring-blue-500/50"
          />
        );
      case 'product':
        return 'Product';
      case 'category':
        return 'Category';
      case 'stock':
        return selectedLocationId ? 'Location Stock' : 'Total Stock';
      default:
        return column.label;
    }
  };

  if (isLoading && products.length === 0) {
    return (
      <div className={`flex-1 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-neutral-600 border-t-neutral-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-400">Loading products...</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={`flex-1 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-neutral-800/50 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-neutral-300 mb-2">No Products Found</h3>
          <p className="text-neutral-500 mb-4">Try adjusting your filters or search terms.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col min-h-0 ${className}`}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-neutral-800/80 backdrop-blur border-b border-white/[0.08]">
        <div className="flex items-center gap-3 px-4 py-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">
          {/* Selection Column */}
          <div className="w-8 flex items-center justify-center">
            {renderHeaderContent({ id: 'select' } as ColumnConfig)}
          </div>

          {/* Expand Column */}
          <div className="w-6"></div>

          {/* Dynamic Columns */}
          {visibleColumns.map(column => (
            <div key={column.id} className={column.width || 'flex-1'}>
              {renderHeaderContent(column)}
            </div>
          ))}
        </div>
      </div>

      {/* Data Rows */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {products.map((product) => (
          <ProductTableRow
            key={product.id}
            product={product}
            selectedLocationId={selectedLocationId}
            isExpanded={expandedItems.has(product.id)}
            onToggleExpand={() => onToggleExpand(product.id)}
            onEdit={() => onEdit(product)}
            onManageInventory={onManageInventory ? () => onManageInventory(product) : undefined}
            onRefresh={onRefresh}
            isSelected={bulkActions.selectedProducts.has(product.id)}
            onSelect={() => bulkActions.toggleProductSelection(product.id)}
            visibleColumns={visibleColumns}
            getBlueprintFieldValue={getBlueprintFieldValue}
            formatBlueprintFieldValue={formatBlueprintFieldValue}
          />
        ))}
      </div>

      {/* Loading More Indicator */}
      {isLoading && products.length > 0 && (
        <div className="flex items-center justify-center p-4 border-t border-white/[0.08]">
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <div className="w-4 h-4 border-2 border-neutral-600 border-t-neutral-400 rounded-full animate-spin"></div>
            Loading more products...
          </div>
        </div>
      )}
    </div>
  );
}
