'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FloraLocation } from '../../services/inventory-service';

interface IntegratedSearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedLocation: string;
  onLocationChange: (locationId: string, aggregateChildren?: boolean) => void;
  locations: FloraLocation[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categoryOptions: Array<{ value: string; label: string }>;
  showAggregation?: boolean;
}

export function IntegratedSearchBar({
  searchQuery,
  onSearchChange,
  selectedLocation,
  onLocationChange,
  locations,
  selectedCategory,
  onCategoryChange,
  categoryOptions,
  showAggregation = false
}: IntegratedSearchBarProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [aggregateChildren, setAggregateChildren] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFiltersOpen(false);
      }
    };

    if (isFiltersOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isFiltersOpen]);

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
  const selectedLocationData = locations.find(loc => loc.id.toString() === selectedLocation);
  const canShowAggregation = selectedLocationData?.is_parent && showAggregation;
  
  const selectedLocationName = selectedLocation 
    ? locationOptions.find(opt => opt.id === selectedLocation)?.name || 'All Locations'
    : 'All Locations';

  const selectedCategoryLabel = selectedCategory
    ? categoryOptions.find(opt => opt.value === selectedCategory)?.label || 'All Categories'
    : 'All Categories';

  const handleLocationSelect = (locationId: string) => {
    onLocationChange(locationId, aggregateChildren);
  };

  const handleCategorySelect = (category: string) => {
    onCategoryChange(category);
  };

  const handleAggregationToggle = () => {
    const newState = !aggregateChildren;
    setAggregateChildren(newState);
    onLocationChange(selectedLocation, newState);
  };

  const hasActiveFilters = selectedLocation !== '' || selectedCategory !== '';

  return (
    <div className="relative flex-1 max-w-[320px]" ref={dropdownRef}>
      <div className="relative">
        {/* Search Input with Filters Button */}
        <div className="flex items-center h-6 bg-neutral-800/60 border border-white/[0.08] rounded-md overflow-hidden hover:border-white/[0.12] transition-colors">
          {/* Filters Trigger */}
          <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className={`flex items-center gap-1 px-2 h-full border-r border-white/[0.08] hover:bg-white/[0.05] transition-colors ${
              hasActiveFilters ? 'text-blue-300' : 'text-neutral-400'
            }`}
            title="Filter by location and category"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {hasActiveFilters && (
              <span className="w-1 h-1 bg-blue-400 rounded-full" />
            )}
          </button>

          {/* Search Icon */}
          <div className="flex items-center justify-center px-2">
            <svg className="w-3 h-3 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Search Input */}
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products..."
            className="flex-1 h-full bg-transparent text-[10px] text-neutral-300 placeholder-neutral-600 outline-none pr-2"
          />

          {/* Clear button */}
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="flex items-center justify-center px-2 h-full hover:bg-white/[0.05] text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filters Dropdown */}
        {isFiltersOpen && (
          <div className="absolute top-full left-0 mt-1 w-full min-w-[280px] bg-neutral-800 border border-white/[0.08] rounded-lg shadow-xl z-[9999]">
            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="px-3 py-2 border-b border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedLocation && (
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[9px] rounded flex items-center gap-1">
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {selectedLocationName}
                    </span>
                  )}
                  {selectedCategory && (
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-[9px] rounded flex items-center gap-1">
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      {selectedCategoryLabel}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    handleLocationSelect('');
                    handleCategorySelect('');
                  }}
                  className="text-[9px] text-neutral-400 hover:text-neutral-300"
                >
                  Clear
                </button>
              </div>
            )}

            <div className="p-2 space-y-3">
              {/* Location Filter Section */}
              <div>
                <div className="px-2 py-1 text-[9px] font-semibold text-neutral-500 uppercase tracking-wide">
                  Location
                </div>
                <div className="space-y-0.5 max-h-48 overflow-y-auto">
                  <button
                    onClick={() => handleLocationSelect('')}
                    className={`w-full text-left px-2 py-1.5 text-[10px] rounded transition ${
                      selectedLocation === '' 
                        ? 'bg-blue-500/20 text-blue-300' 
                        : 'text-neutral-400 hover:bg-white/[0.05] hover:text-neutral-300'
                    }`}
                  >
                    All Locations
                  </button>

                  {locationOptions.map((option) => (
                    <button
                      key={`search-location-${option.id}`}
                      onClick={() => {
                        handleLocationSelect(option.id);
                        setIsFiltersOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 text-[10px] rounded transition ${
                        selectedLocation === option.id
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'text-neutral-400 hover:bg-white/[0.05] hover:text-neutral-300'
                      } ${option.isChild ? 'pl-5' : ''}`}
                    >
                      {option.isChild && '└─ '}
                      {option.name}
                    </button>
                  ))}
                </div>

                {canShowAggregation && (
                  <div className="mt-2 px-2">
                    <button
                      onClick={handleAggregationToggle}
                      className="flex items-center gap-2 w-full text-left text-[10px] text-neutral-400 hover:text-neutral-300"
                    >
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                        aggregateChildren 
                          ? 'bg-blue-500/20 border-blue-500/50' 
                          : 'border-white/20 bg-neutral-800/50'
                      }`}>
                        {aggregateChildren && (
                          <svg className="w-2.5 h-2.5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span>Include child locations</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-white/[0.08]" />

              {/* Category Filter Section */}
              <div>
                <div className="px-2 py-1 text-[9px] font-semibold text-neutral-500 uppercase tracking-wide">
                  Category
                </div>
                <div className="space-y-0.5 max-h-48 overflow-y-auto">
                  {categoryOptions.filter(opt => opt.value !== '').length > 0 ? (
                    <>
                      <button
                        onClick={() => {
                          handleCategorySelect('');
                          setIsFiltersOpen(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 text-[10px] rounded transition ${
                          selectedCategory === ''
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'text-neutral-400 hover:bg-white/[0.05] hover:text-neutral-300'
                        }`}
                      >
                        All Categories
                      </button>

                      {categoryOptions.filter(opt => opt.value !== '').map((option) => (
                        <button
                          key={`search-category-${option.value}`}
                          onClick={() => {
                            handleCategorySelect(option.value);
                            setIsFiltersOpen(false);
                          }}
                          className={`w-full text-left px-2 py-1.5 text-[10px] rounded transition ${
                            selectedCategory === option.value
                              ? 'bg-purple-500/20 text-purple-300'
                              : 'text-neutral-400 hover:bg-white/[0.05] hover:text-neutral-300'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </>
                  ) : (
                    <div className="px-2 py-1.5 text-[10px] text-neutral-600">No categories available</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

