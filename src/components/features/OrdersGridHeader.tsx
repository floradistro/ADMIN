import React from 'react';
import { IconButton, LocationSelector } from '../ui';
import { FloraLocation } from '../../services/inventory-service';

interface OrdersGridHeaderProps {
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  totalOrders: number;
  selectedOrdersCount: number;
  onClearSelection?: () => void;
  selectedLocationId?: string;
  onLocationChange?: (locationId: string) => void;
  locations?: FloraLocation[];
  selectedEmployee?: string;
  onEmployeeChange?: (employee: string) => void;
  employeeOptions?: Array<{ value: string; label: string }>;
  dateFrom?: string;
  dateTo?: string;
  onDateFromChange?: (date: string) => void;
  onDateToChange?: (date: string) => void;
  showSelectedOnly?: boolean;
  onShowSelectedOnlyChange?: (show: boolean) => void;
}

export function OrdersGridHeader({
  statusFilter,
  onStatusFilterChange,
  totalOrders,
  selectedOrdersCount,
  onClearSelection,
  selectedLocationId = '',
  onLocationChange,
  locations = [],
  selectedEmployee = '',
  onEmployeeChange,
  employeeOptions = [],
  dateFrom = '',
  dateTo = '',
  onDateFromChange,
  onDateToChange,
  showSelectedOnly = false,
  onShowSelectedOnlyChange,
}: OrdersGridHeaderProps) {
  return (
    <div className="px-4 py-2 border-b border-white/[0.04] bg-neutral-900 flex-shrink-0">
      <div className="flex items-center justify-between w-full gap-4">
        {/* Left - Counts */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="px-2 py-1 bg-white/[0.05] text-neutral-400 text-xs rounded product-text">
            {totalOrders} total
          </span>
          {selectedOrdersCount > 0 && (
            <span className="px-2 py-1 bg-white/[0.08] text-neutral-300 text-xs rounded product-text">
              {selectedOrdersCount} selected
            </span>
          )}
        </div>

        {/* Center - Filters (scrollable on mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent hover:scrollbar-thumb-neutral-600 flex-1 justify-center">
          {/* Location */}
          <LocationSelector
            selectedLocation={selectedLocationId}
            onLocationChange={onLocationChange || (() => {})}
            locations={locations}
            showAggregation={false}
            className="min-w-[140px] flex-shrink-0"
          />

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-3 py-1.5 bg-neutral-800/50 border border-white/[0.06] rounded text-xs text-neutral-400 focus:border-white/[0.12] focus:outline-none product-text transition-all min-w-[120px] flex-shrink-0"
          >
            <option value="any">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
          </select>

          {/* Date From */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange?.(e.target.value)}
            className="px-2 py-1.5 bg-neutral-800/50 border border-white/[0.06] rounded text-neutral-400 text-xs focus:border-white/[0.12] focus:outline-none product-text transition-all flex-shrink-0"
          />

          {/* Date To */}
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange?.(e.target.value)}
            className="px-2 py-1.5 bg-neutral-800/50 border border-white/[0.06] rounded text-neutral-400 text-xs focus:border-white/[0.12] focus:outline-none product-text transition-all flex-shrink-0"
          />
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Clear Selection */}
          {selectedOrdersCount > 0 && onClearSelection && (
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
