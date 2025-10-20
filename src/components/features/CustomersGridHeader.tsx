import React from 'react';
import { IconButton, LocationSelector } from '../ui';
import { FloraLocation } from '../../services/inventory-service';

interface CustomersGridHeaderProps {
  totalCustomers: number;
  selectedCustomersCount: number;
  onClearSelection?: () => void;
  selectedLocationId?: string;
  onLocationChange?: (locationId: string) => void;
  locations?: FloraLocation[];
  showSelectedOnly?: boolean;
  onShowSelectedOnlyChange?: (show: boolean) => void;
  onAddCustomer?: () => void;
  onRefresh?: () => void;
}

export function CustomersGridHeader({
  totalCustomers,
  selectedCustomersCount,
  onClearSelection,
  selectedLocationId = '',
  onLocationChange,
  locations = [],
  showSelectedOnly = false,
  onShowSelectedOnlyChange,
  onAddCustomer,
  onRefresh,
}: CustomersGridHeaderProps) {
  return (
    <div className="px-4 py-2 border-b border-white/[0.04] bg-neutral-900 flex-shrink-0">
      <div className="flex items-center justify-between w-full gap-4">
        {/* Left - Counts */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="px-2 py-1 bg-white/[0.05] text-neutral-400 text-xs rounded product-text">
            {totalCustomers} total
          </span>
          {selectedCustomersCount > 0 && (
            <span className="px-2 py-1 bg-white/[0.08] text-neutral-300 text-xs rounded product-text">
              {selectedCustomersCount} selected
            </span>
          )}
        </div>

        {/* Center - Filters */}
        <div className="flex items-center gap-2 flex-1 justify-center">
          <LocationSelector
            selectedLocation={selectedLocationId}
            onLocationChange={onLocationChange || (() => {})}
            locations={locations}
            showAggregation={false}
            className="min-w-[140px]"
          />
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Refresh */}
          {onRefresh && (
            <IconButton
              onClick={onRefresh}
              variant="ghost"
              title="Refresh"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </IconButton>
          )}

          {/* Add Customer */}
          {onAddCustomer && (
            <IconButton
              onClick={onAddCustomer}
              variant="default"
              title="Add Customer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </IconButton>
          )}

          {/* Clear Selection */}
          {selectedCustomersCount > 0 && onClearSelection && (
            <IconButton
              onClick={onClearSelection}
              variant="ghost"
              title="Clear Selection"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </IconButton>
          )}
        </div>
      </div>
    </div>
  );
}
