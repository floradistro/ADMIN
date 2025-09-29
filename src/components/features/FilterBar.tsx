'use client';

import React from 'react';
import { FilterState } from '../../types';
import { Select, Input, IconButton } from '../ui';

interface FilterBarProps {
  filterState: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  locationOptions?: Array<{ value: string; label: string }>;
  categoryOptions?: Array<{ value: string; label: string }>;
  onRefresh?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function FilterBar({
  filterState,
  onFilterChange,
  locationOptions = [],
  categoryOptions = [],
  onRefresh,
  isLoading = false,
  className = '',
}: FilterBarProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ searchQuery: e.target.value });
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ selectedLocationId: e.target.value });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ selectedCategory: e.target.value });
  };

  const toggleHideZeroQuantity = () => {
    onFilterChange({ hideZeroQuantity: !filterState.hideZeroQuantity });
  };

  const toggleShowSelectedOnly = () => {
    onFilterChange({ showSelectedOnly: !filterState.showSelectedOnly });
  };

  const clearFilters = () => {
    onFilterChange({
      selectedLocationId: '',
      searchQuery: '',
      selectedCategory: '',
      hideZeroQuantity: false,
      showSelectedOnly: false,
    });
  };

  const hasActiveFilters = filterState.selectedLocationId || 
                          filterState.searchQuery || 
                          filterState.selectedCategory || 
                          filterState.hideZeroQuantity || 
                          filterState.showSelectedOnly;

  return (
    <div className={`bg-neutral-800/30 border-b border-white/[0.08] p-4 ${className}`}>
      <div className="flex flex-wrap gap-4 items-center">
        {/* Search */}
        <div className="flex-1 min-w-[200px] max-w-md">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search products..."
              value={filterState.searchQuery}
              onChange={handleSearchChange}
              className="pl-10"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Location Filter */}
        <div className="min-w-[160px]">
          <Select
            value={filterState.selectedLocationId}
            onChange={handleLocationChange}
            options={[
              { value: '', label: 'All Locations' },
              ...locationOptions,
            ]}
            className="text-sm"
          />
        </div>

        {/* Category Filter */}
        <div className="min-w-[160px]">
          <Select
            value={filterState.selectedCategory}
            onChange={handleCategoryChange}
            options={[
              { value: '', label: 'All Categories' },
              ...categoryOptions,
            ]}
            className="text-sm"
          />
        </div>

        {/* Toggle Filters */}
        <div className="flex gap-2">
          <button
            onClick={toggleHideZeroQuantity}
            className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
              filterState.hideZeroQuantity
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                : 'bg-neutral-800/50 border-neutral-700 text-neutral-400 hover:bg-neutral-700/50'
            }`}
          >
            Hide Zero Stock
          </button>

          <button
            onClick={toggleShowSelectedOnly}
            className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
              filterState.showSelectedOnly
                ? 'bg-green-500/20 border-green-500/50 text-green-400'
                : 'bg-neutral-800/50 border-neutral-700 text-neutral-400 hover:bg-neutral-700/50'
            }`}
          >
            Selected Only
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {hasActiveFilters && (
            <IconButton
              onClick={clearFilters}
              variant="ghost"
              size="sm"
              title="Clear all filters"
              className="text-neutral-400 hover:text-neutral-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </IconButton>
          )}

          {onRefresh && (
            <IconButton
              onClick={onRefresh}
              variant="ghost"
              size="sm"
              disabled={isLoading}
              title="Refresh data"
              className="text-neutral-400 hover:text-neutral-300"
            >
              <svg 
                className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </IconButton>
          )}
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="text-neutral-500">Active filters:</span>
          {filterState.searchQuery && (
            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
              Search: "{filterState.searchQuery}"
            </span>
          )}
          {filterState.selectedLocationId && (
            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
              Location: {locationOptions.find(l => l.value === filterState.selectedLocationId)?.label || 'Unknown'}
            </span>
          )}
          {filterState.selectedCategory && (
            <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded">
              Category: {categoryOptions.find(c => c.value === filterState.selectedCategory)?.label || 'Unknown'}
            </span>
          )}
          {filterState.hideZeroQuantity && (
            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
              Hide Zero Stock
            </span>
          )}
          {filterState.showSelectedOnly && (
            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded">
              Selected Only
            </span>
          )}
        </div>
      )}
    </div>
  );
}
