'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FloraLocation } from '../../services/inventory-service';

interface MobileOrderFiltersDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  // Location
  selectedLocation: string;
  onLocationChange: (locationId: string) => void;
  locations: FloraLocation[];
  // Status
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  // Date Range
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  // Employee (optional)
  selectedEmployee?: string;
  onEmployeeChange?: (employee: string) => void;
  employeeOptions?: Array<{ value: string; label: string }>;
  // Toggles
  showSelectedOnly?: boolean;
  onShowSelectedOnlyChange?: (show: boolean) => void;
}

export function MobileOrderFiltersDropdown({
  isOpen,
  onClose,
  selectedLocation,
  onLocationChange,
  locations,
  statusFilter,
  onStatusFilterChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  selectedEmployee = '',
  onEmployeeChange,
  employeeOptions = [],
  showSelectedOnly = false,
  onShowSelectedOnlyChange,
}: MobileOrderFiltersDropdownProps) {
  const [activeSection, setActiveSection] = useState<'location' | 'status' | 'date' | 'other'>('status');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const prepareLocationOptions = () => {
    const options: Array<{ id: string; name: string; isChild?: boolean }> = [];
    
    if (!locations || locations.length === 0) {
      return options;
    }
    
    locations.forEach(location => {
      options.push({
        id: location.id.toString(),
        name: location.name,
        isChild: false
      });
      
      if (location.children && location.children.length > 0) {
        location.children.forEach(child => {
          options.push({
            id: child.id.toString(),
            name: child.name,
            isChild: true
          });
        });
      }
    });
    
    return options;
  };

  const locationOptions = prepareLocationOptions();
  const selectedLocationName = selectedLocation 
    ? locationOptions.find(opt => opt.id === selectedLocation)?.name || 'All Locations'
    : 'All Locations';

  const statusOptions = [
    { value: 'any', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'on-hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'refunded', label: 'Refunded' },
    { value: 'failed', label: 'Failed' },
  ];

  const selectedStatusLabel = statusOptions.find(opt => opt.value === statusFilter)?.label || 'All Status';

  const hasActiveFilters = selectedLocation !== '' || statusFilter !== 'any' || dateFrom !== '' || dateTo !== '' || showSelectedOnly;

  const clearAllFilters = () => {
    onLocationChange('');
    onStatusFilterChange('any');
    onDateFromChange('');
    onDateToChange('');
    if (onShowSelectedOnlyChange) onShowSelectedOnlyChange(false);
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[99999] flex items-end" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div 
        ref={dropdownRef}
        className="w-full bg-neutral-800/98 border-t border-white/[0.08] rounded-t-2xl shadow-2xl max-h-[70vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
      {/* Header with Clear All */}
      <div className="px-3 py-2.5 border-b border-white/[0.08] flex items-center justify-between flex-shrink-0">
        <span className="text-xs font-semibold text-neutral-300">Order Filters</span>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-[10px] text-blue-400 hover:text-blue-300 transition"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="px-3 py-2 border-b border-white/[0.08] flex-shrink-0">
          <div className="flex flex-wrap gap-1.5">
            {selectedLocation && (
              <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-[10px] rounded flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {selectedLocationName}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLocationChange('');
                  }}
                  className="ml-1 hover:text-blue-100"
                >
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            {statusFilter !== 'any' && (
              <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-[10px] rounded flex items-center gap-1">
                {selectedStatusLabel}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusFilterChange('any');
                  }}
                  className="ml-1 hover:text-purple-100"
                >
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            {(dateFrom || dateTo) && (
              <span className="px-2 py-1 bg-green-500/20 text-green-300 text-[10px] rounded">
                Date Range
              </span>
            )}
            {showSelectedOnly && (
              <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-[10px] rounded">
                Selected Only
              </span>
            )}
          </div>
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex border-b border-white/[0.08] flex-shrink-0">
        <button
          onClick={() => setActiveSection('location')}
          className={`flex-1 px-3 py-2.5 text-[11px] font-medium transition touch-manipulation ${
            activeSection === 'location'
              ? 'text-blue-300 border-b-2 border-blue-400'
              : 'text-neutral-400 hover:text-neutral-300 hover:bg-white/[0.03]'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            Location
            {selectedLocation && (
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveSection('status')}
          className={`flex-1 px-3 py-2.5 text-[11px] font-medium transition touch-manipulation ${
            activeSection === 'status'
              ? 'text-purple-300 border-b-2 border-purple-400'
              : 'text-neutral-400 hover:text-neutral-300 hover:bg-white/[0.03]'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Status
            {statusFilter !== 'any' && (
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveSection('date')}
          className={`flex-1 px-3 py-2.5 text-[11px] font-medium transition touch-manipulation ${
            activeSection === 'date'
              ? 'text-green-300 border-b-2 border-green-400'
              : 'text-neutral-400 hover:text-neutral-300 hover:bg-white/[0.03]'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Date
            {(dateFrom || dateTo) && (
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            )}
          </div>
        </button>
        {onShowSelectedOnlyChange && (
          <button
            onClick={() => setActiveSection('other')}
            className={`flex-1 px-3 py-2.5 text-[11px] font-medium transition touch-manipulation ${
              activeSection === 'other'
                ? 'text-orange-300 border-b-2 border-orange-400'
                : 'text-neutral-400 hover:text-neutral-300 hover:bg-white/[0.03]'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              More
              {showSelectedOnly && (
                <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
              )}
            </div>
          </button>
        )}
      </div>

      {/* Content Area - Scrollable */}
      <div className="overflow-y-auto flex-1">
        {/* Location Section */}
        {activeSection === 'location' && (
          <div className="p-2 space-y-1">
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                onLocationChange('');
              }}
              className={`w-full text-left px-3 py-2.5 text-xs rounded transition touch-manipulation ${
                selectedLocation === ''
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'text-neutral-300 hover:bg-white/[0.05]'
              }`}
            >
              All Locations
            </button>

            {locationOptions.map((option) => (
              <button
                key={`mobile-order-location-${option.id}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onLocationChange(option.id);
                }}
                className={`w-full text-left px-3 py-2.5 text-xs rounded transition touch-manipulation ${
                  selectedLocation === option.id
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'text-neutral-300 hover:bg-white/[0.05]'
                } ${option.isChild ? 'pl-6' : ''}`}
              >
                {option.isChild && '└─ '}
                {option.name}
              </button>
            ))}
          </div>
        )}

        {/* Status Section */}
        {activeSection === 'status' && (
          <div className="p-2 space-y-1">
            {statusOptions.map((option) => (
              <button
                key={`mobile-status-${option.value}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onStatusFilterChange(option.value);
                }}
                className={`w-full text-left px-3 py-2.5 text-xs rounded transition touch-manipulation ${
                  statusFilter === option.value
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'text-neutral-300 hover:bg-white/[0.05]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        {/* Date Section */}
        {activeSection === 'date' && (
          <div className="p-3 space-y-3">
            <div>
              <label className="block text-[10px] text-neutral-500 mb-1.5 font-medium">
                From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => onDateFromChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-800/50 border border-white/[0.06] rounded text-xs text-neutral-300 focus:border-white/[0.12] focus:outline-none product-text transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] text-neutral-500 mb-1.5 font-medium">
                To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => onDateToChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-800/50 border border-white/[0.06] rounded text-xs text-neutral-300 focus:border-white/[0.12] focus:outline-none product-text transition-all"
              />
            </div>

            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  onDateFromChange('');
                  onDateToChange('');
                }}
                className="w-full px-3 py-2 text-xs text-neutral-400 bg-white/[0.05] hover:bg-white/[0.08] rounded transition touch-manipulation"
              >
                Clear Date Range
              </button>
            )}
          </div>
        )}

        {/* Other Section */}
        {activeSection === 'other' && onShowSelectedOnlyChange && (
          <div className="p-2 space-y-1">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onShowSelectedOnlyChange(!showSelectedOnly);
              }}
              className={`w-full text-left px-3 py-2.5 text-xs rounded transition touch-manipulation flex items-center justify-between ${
                showSelectedOnly ? 'bg-orange-500/20 text-orange-300' : 'text-neutral-300 hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <div>
                  <div className="font-medium">Selected Only</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">Show only selected orders</div>
                </div>
              </div>
              <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                showSelectedOnly ? 'bg-orange-400 border-orange-400' : 'border-neutral-600 bg-neutral-800'
              }`}>
                {showSelectedOnly && (
                  <svg className="w-3 h-3 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2.5 border-t border-white/[0.08] flex justify-end gap-2 flex-shrink-0">
        <button
          onClick={onClose}
          className="px-4 py-2.5 text-xs text-neutral-300 bg-white/[0.05] hover:bg-white/[0.08] active:bg-white/[0.12] rounded transition touch-manipulation"
        >
          Close
        </button>
      </div>
      </div>
    </div>
  );
}

