'use client';

import React from 'react';
import { TableToolbar } from './TableToolbar';

interface Location {
  id: number;
  name: string;
  slug: string;
}

interface InventoryToolsProps {
  totalItems: number;
  locationCount: number;
  selectedLocationId: string;
  onLocationChange: (locationId: string) => void;
  locations: Location[];
  hideZeroQuantity: boolean;
  onHideZeroQuantityChange: (hide: boolean) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddInventory: () => void;
  onRefresh: () => void;
  onExport?: () => void;
}

export function InventoryTools({
  totalItems,
  locationCount,
  selectedLocationId,
  onLocationChange,
  locations,
  hideZeroQuantity,
  onHideZeroQuantityChange,
  searchQuery,
  onSearchChange,
  onAddInventory,
  onRefresh,
  onExport
}: InventoryToolsProps) {
  const stats = [
    { label: 'items', value: totalItems, variant: 'default' as const },
    { label: 'loc', value: locationCount, variant: 'default' as const }
  ];

  const filters = [
    {
      id: 'search',
      type: 'search' as const,
      value: searchQuery,
      onChange: onSearchChange,
      placeholder: 'Search inventory...'
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
    }
  ];

  const actions = [
    {
      id: 'add',
      label: 'Add Inventory',
      onClick: onAddInventory,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      variant: 'primary' as const
    },
    ...(onExport ? [{
      id: 'export',
      label: 'Export',
      onClick: onExport,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      ),
      variant: 'default' as const
    }] : []),
    {
      id: 'refresh',
      label: 'Refresh',
      onClick: onRefresh,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      variant: 'default' as const
    }
  ];

  return <TableToolbar stats={stats} filters={filters} actions={actions} />;
}

