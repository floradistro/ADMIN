import React, { useState, useRef, useEffect } from 'react';
import { IconButton, LocationSelector, MobileOrderFiltersDropdown } from '../ui';
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
  const [isFiltersDropdownOpen, setIsFiltersDropdownOpen] = useState(false);
  const filtersDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtersDropdownRef.current && !filtersDropdownRef.current.contains(event.target as Node)) {
        setIsFiltersDropdownOpen(false);
      }
    };

    if (isFiltersDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isFiltersDropdownOpen]);

  const hasActiveFilters = selectedLocationId !== '' || statusFilter !== 'any' || dateFrom !== '' || dateTo !== '' || showSelectedOnly;

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

        {/* Center - Filters (Desktop: inline, Mobile: dropdown) */}
        <div className="flex items-center gap-2 flex-1 justify-center">
          {/* Desktop Filters (hidden on mobile) */}
          <div className="hidden md:flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent hover:scrollbar-thumb-neutral-600">
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

          {/* Mobile Filters Button (shown only on mobile) */}
          <div className="md:hidden relative" ref={filtersDropdownRef}>
            <IconButton
              onClick={() => setIsFiltersDropdownOpen(!isFiltersDropdownOpen)}
              variant={hasActiveFilters ? 'active' : 'default'}
              title="Filters"
              size="sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </IconButton>

            <MobileOrderFiltersDropdown
              isOpen={isFiltersDropdownOpen}
              onClose={() => setIsFiltersDropdownOpen(false)}
              selectedLocation={selectedLocationId}
              onLocationChange={(locationId) => {
                onLocationChange?.(locationId);
              }}
              locations={locations}
              statusFilter={statusFilter}
              onStatusFilterChange={onStatusFilterChange}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={(date) => onDateFromChange?.(date)}
              onDateToChange={(date) => onDateToChange?.(date)}
              selectedEmployee={selectedEmployee}
              onEmployeeChange={onEmployeeChange}
              employeeOptions={employeeOptions}
              showSelectedOnly={showSelectedOnly}
              onShowSelectedOnlyChange={onShowSelectedOnlyChange}
            />
          </div>
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
