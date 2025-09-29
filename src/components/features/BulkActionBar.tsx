'use client';

import React from 'react';
import { Product } from '../../types';
import { Button } from '../ui';
import { BulkActionsState } from '../../hooks/useBulkActions';

interface BulkActionBarProps {
  bulkActions: BulkActionsState & {
    toggleProductSelection: (productId: number) => void;
    selectAllProducts: () => void;
    clearSelection: () => void;
    getSelectedProducts: () => Product[];
    executeBulkAction: (action: string, onBulkAction: (action: string, products: Product[]) => void) => void;
    bulkExpandCollapse: (expand: boolean, onBulkExpandCollapse: (ids: number[], expand: boolean) => void) => void;
  };
  onBulkAction: (action: string, products: Product[]) => void;
  onBulkExpandCollapse: (ids: number[], expand: boolean) => void;
  onBulkInventory?: () => void;
  onSyncProducts?: () => void;
  onBulkDelete?: (products: Product[]) => void;
  syncLoading?: boolean;
  className?: string;
}

export function BulkActionBar({
  bulkActions,
  onBulkAction,
  onBulkExpandCollapse,
  onBulkInventory,
  onSyncProducts,
  onBulkDelete,
  syncLoading = false,
  className = '',
}: BulkActionBarProps) {
  const selectedCount = bulkActions.selectedProducts.size;
  const selectedProducts = bulkActions.getSelectedProducts();

  if (selectedCount === 0) {
    return null;
  }

  const handleBulkExpand = () => {
    bulkActions.bulkExpandCollapse(true, onBulkExpandCollapse);
  };

  const handleBulkCollapse = () => {
    bulkActions.bulkExpandCollapse(false, onBulkExpandCollapse);
  };

  const handleBulkAction = (action: string) => {
    bulkActions.executeBulkAction(action, onBulkAction);
  };

  const handleBulkDelete = () => {
    if (onBulkDelete && selectedProducts.length > 0) {
      onBulkDelete(selectedProducts);
    }
  };

  const handleSync = () => {
    if (onSyncProducts) {
      onSyncProducts();
    }
  };

  return (
    <div className={`bg-blue-500/10 border-b border-blue-500/20 p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-sm text-blue-400">
            {selectedCount} product{selectedCount === 1 ? '' : 's'} selected
          </div>
          
          <Button
            onClick={bulkActions.clearSelection}
            variant="ghost"
            size="sm"
            className="text-xs text-neutral-400 hover:text-neutral-300"
          >
            Clear Selection
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Expand/Collapse Actions */}
          <Button
            onClick={handleBulkExpand}
            variant="ghost"
            size="sm"
            className="text-xs"
          >
            Expand All
          </Button>
          
          <Button
            onClick={handleBulkCollapse}
            variant="ghost"
            size="sm"
            className="text-xs"
          >
            Collapse All
          </Button>

          <div className="w-px h-6 bg-neutral-700 mx-2" />

          {/* Bulk Actions */}
          <Button
            onClick={() => handleBulkAction('edit')}
            variant="ghost"
            size="sm"
            className="text-xs"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </Button>

          {onBulkInventory && (
            <Button
              onClick={onBulkInventory}
              variant="ghost"
              size="sm"
              className="text-xs"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Inventory
            </Button>
          )}

          {onSyncProducts && (
            <Button
              onClick={handleSync}
              variant="ghost"
              size="sm"
              disabled={syncLoading}
              className="text-xs"
            >
              {syncLoading ? (
                <>
                  <svg className="w-4 h-4 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Syncing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sync
                </>
              )}
            </Button>
          )}

          {onBulkDelete && (
            <Button
              onClick={handleBulkDelete}
              variant="ghost"
              size="sm"
              className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
