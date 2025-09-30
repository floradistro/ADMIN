import React, { useRef, useState, useEffect } from 'react';
import { IconButton, Select, LocationSelector } from '../ui';
import { FloraLocation } from '../../services/inventory-service';

interface CustomersGridHeaderProps {
  totalCustomers: number;
  selectedCustomersCount: number;
  onClearSelection?: () => void;
  
  // Location filter
  selectedLocationId?: string;
  onLocationChange?: (locationId: string) => void;
  locations?: FloraLocation[];
  
  // Show selected filter
  showSelectedOnly?: boolean;
  onShowSelectedOnlyChange?: (show: boolean) => void;
  
  // Add customer action
  onAddCustomer?: () => void;
  
  // Refresh action
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
    <div className="px-4 py-1 border-b border-white/[0.04] bg-neutral-900 flex-shrink-0">
      <div className="flex items-center justify-between w-full relative">
        {/* Left section - Customer counts */}
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-white/[0.05] text-neutral-400 text-xs rounded">
            {totalCustomers} total
          </span>
          {selectedCustomersCount > 0 && (
            <span className="px-2 py-1 bg-white/[0.08] text-neutral-300 text-xs rounded">
              {selectedCustomersCount} selected
            </span>
          )}
        </div>

        {/* Center section - Filters */}
        <div className="flex items-center gap-3">
          {/* Location Filter */}
          <LocationSelector
            selectedLocation={selectedLocationId}
            onLocationChange={onLocationChange || (() => {})}
            locations={locations}
            showAggregation={false}
            className="min-w-[180px]"
          />

          {/* Show Selected Only Filter Toggle */}
          <button
            onClick={() => onShowSelectedOnlyChange?.(!showSelectedOnly)}
            className={`px-2 py-1.5 rounded-lg transition text-xs ${
              showSelectedOnly 
                ? 'bg-white/[0.05] text-blue-400 hover:bg-white/[0.08]' 
                : 'bg-white/[0.05] text-neutral-300 hover:bg-white/[0.08]'
            }`}
            title={showSelectedOnly ? 'Show all customers' : 'Show only selected customers'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </button>
        </div>

        {/* Right section - Refresh, Add Customer and Clear Selection Buttons */}
        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          {onRefresh && (
            <IconButton
              onClick={onRefresh}
              variant="ghost"
              title="Refresh Customers"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </IconButton>
          )}
          
          {/* Add Customer Button */}
          {onAddCustomer && (
            <IconButton
              onClick={onAddCustomer}
              variant="default"
              title="Add Customer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </IconButton>
          )}
          
          {/* Clear Selection Button */}
          {selectedCustomersCount > 0 && onClearSelection && (
            <IconButton
              onClick={onClearSelection}
              variant="ghost"
              size="sm"
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
