'use client';

import React from 'react';
import { TableToolbar } from './TableToolbar';
import { FloraLocation } from '../../services/inventory-service';

interface ProductToolsProps {
  totalProducts: number;
  selectedCount: number;
  bulkEditCount: number;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categoryOptions: Array<{ value: string; label: string }>;
  selectedLocationId: string;
  onLocationChange: (locationId: string) => void;
  locations: FloraLocation[];
  hideZeroQuantity: boolean;
  onHideZeroQuantityChange: (hide: boolean) => void;
  showSelectedOnly: boolean;
  onShowSelectedOnlyChange: (show: boolean) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateProduct: () => void;
  onBulkImport: () => void;
  onSyncProducts: () => void;
  onBulkAction: (action: 'update' | 'transfer' | 'convert' | 'delete' | 'edit') => void;
  onBulkSave: () => void;
  onBulkJsonEdit: () => void;
  onClearSelection: () => void;
  syncLoading?: boolean;
}

export function ProductTools({
  totalProducts,
  selectedCount,
  bulkEditCount,
  selectedCategory,
  onCategoryChange,
  categoryOptions,
  selectedLocationId,
  onLocationChange,
  locations,
  hideZeroQuantity,
  onHideZeroQuantityChange,
  showSelectedOnly,
  onShowSelectedOnlyChange,
  searchQuery,
  onSearchChange,
  onCreateProduct,
  onBulkImport,
  onSyncProducts,
  onBulkAction,
  onBulkSave,
  onBulkJsonEdit,
  onClearSelection,
  syncLoading = false
}: ProductToolsProps) {
  const stats = [
    { label: '', value: totalProducts, variant: 'default' as const },
    ...(selectedCount > 0 ? [{ label: 'sel', value: selectedCount, variant: 'primary' as const }] : []),
    ...(bulkEditCount > 0 ? [{ label: 'edit', value: bulkEditCount, variant: 'accent' as const }] : [])
  ];

  const filters = [
    {
      id: 'search',
      type: 'search' as const,
      value: searchQuery,
      onChange: onSearchChange,
      placeholder: 'Search products...'
    },
    {
      id: 'location',
      type: 'location' as const,
      label: 'Location',
      value: selectedLocationId,
      onChange: onLocationChange,
      locations
    },
    {
      id: 'category',
      type: 'select' as const,
      label: 'Category',
      value: selectedCategory,
      onChange: onCategoryChange,
      options: categoryOptions
    },
    {
      id: 'hideZero',
      type: 'toggle' as const,
      label: hideZeroQuantity ? 'Show all' : 'Hide zero stock',
      value: hideZeroQuantity,
      onChange: onHideZeroQuantityChange,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M9.878 9.878l.707-.707M14.121 14.121l.707-.707M14.121 14.121L15.536 15.536M14.121 14.121l.707.707" />
        </svg>
      )
    },
    {
      id: 'selectedOnly',
      type: 'toggle' as const,
      label: showSelectedOnly ? 'Show all' : 'Selected only',
      value: showSelectedOnly,
      onChange: onShowSelectedOnlyChange,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      )
    }
  ];

  const actions = [
    ...(bulkEditCount > 0 ? [
      {
        id: 'bulkJson',
        label: 'JSON Editor',
        onClick: onBulkJsonEdit,
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        ),
        variant: 'default' as const
      },
      {
        id: 'bulkSave',
        label: 'Save All',
        onClick: onBulkSave,
        badge: bulkEditCount,
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
        ),
        variant: 'primary' as const
      }
    ] : []),
    ...(selectedCount > 0 ? [
      {
        id: 'sync',
        label: 'Sync Selected',
        onClick: onSyncProducts,
        disabled: syncLoading,
        icon: (
          <svg className={`w-4 h-4 ${syncLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        ),
        variant: 'default' as const
      },
      {
        id: 'bulkEdit',
        label: 'Bulk Edit',
        onClick: () => onBulkAction('edit'),
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        ),
        variant: 'default' as const
      },
      {
        id: 'bulkTransfer',
        label: 'Transfer',
        onClick: () => onBulkAction('transfer'),
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        ),
        variant: 'default' as const
      },
      {
        id: 'bulkDelete',
        label: 'Delete Selected',
        onClick: () => onBulkAction('delete'),
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        ),
        variant: 'danger' as const
      },
      {
        id: 'clearSelection',
        label: 'Clear Selection',
        onClick: onClearSelection,
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ),
        variant: 'default' as const
      }
    ] : []),
    {
      id: 'create',
      label: 'Create Product',
      onClick: onCreateProduct,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      variant: 'primary' as const,
      hidden: selectedCount > 0 || bulkEditCount > 0
    },
    {
      id: 'import',
      label: 'Bulk Import',
      onClick: onBulkImport,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
      variant: 'default' as const,
      hidden: selectedCount > 0 || bulkEditCount > 0
    }
  ];

  return <TableToolbar stats={stats} filters={filters} actions={actions} />;
}


