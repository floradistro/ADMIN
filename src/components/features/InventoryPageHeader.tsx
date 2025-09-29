'use client';

import React from 'react';

interface InventoryPageHeaderProps {
  itemCount: number;
  locationCount: number;
  onAddInventory: () => void;
  onRefresh: () => void;
  hideZeroQuantity?: boolean;
  onHideZeroQuantityChange?: (hide: boolean) => void;
}

export function InventoryPageHeader({
  itemCount,
  locationCount,
  onAddInventory,
  onRefresh,
  hideZeroQuantity = false,
  onHideZeroQuantityChange
}: InventoryPageHeaderProps) {
  return (
    <div className="bg-neutral-900 shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Inventory Management</h1>
            <p className="text-sm text-neutral-500 mt-1">
              {itemCount} items across {locationCount} locations
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => onHideZeroQuantityChange?.(!hideZeroQuantity)}
              className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                hideZeroQuantity 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-white/[0.05] text-neutral-300 hover:bg-white/[0.08]'
              }`}
              title={hideZeroQuantity ? 'Show all inventory (including zero quantity)' : 'Hide inventory with zero quantity'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M9.878 9.878l.707-.707M14.121 14.121l.707-.707M14.121 14.121L15.536 15.536M14.121 14.121l.707.707" />
              </svg>
              {hideZeroQuantity ? 'Show All' : 'Hide Zero'}
            </button>
            <button
              onClick={onAddInventory}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              + Add Inventory
            </button>
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-white/[0.05] text-neutral-300 rounded-lg hover:bg-white/[0.08] transition"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}