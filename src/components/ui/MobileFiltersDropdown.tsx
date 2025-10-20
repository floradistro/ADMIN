'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FloraLocation } from '../../services/inventory-service';

interface MobileFiltersDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  // Location
  selectedLocation: string;
  onLocationChange: (locationId: string) => void;
  locations: FloraLocation[];
  // Category
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categoryOptions: Array<{ value: string; label: string }>;
  // Toggles
  hideZeroQuantity: boolean;
  onHideZeroQuantityChange: (hide: boolean) => void;
  showSelectedOnly: boolean;
  onShowSelectedOnlyChange: (show: boolean) => void;
}

export function MobileFiltersDropdown({
  isOpen,
  onClose,
  selectedLocation,
  onLocationChange,
  locations,
  selectedCategory,
  onCategoryChange,
  categoryOptions,
  hideZeroQuantity,
  onHideZeroQuantityChange,
  showSelectedOnly,
  onShowSelectedOnlyChange,
}: MobileFiltersDropdownProps) {
  const [activeSection, setActiveSection] = useState<'location' | 'category' | 'toggles'>('toggles');
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

  const selectedCategoryLabel = selectedCategory
    ? categoryOptions.find(opt => opt.value === selectedCategory)?.label || 'All Categories'
    : 'All Categories';

  const hasActiveFilters = selectedLocation !== '' || selectedCategory !== '' || hideZeroQuantity || showSelectedOnly;

  const clearAllFilters = () => {
    onLocationChange('');
    onCategoryChange('');
    onHideZeroQuantityChange(false);
    onShowSelectedOnlyChange(false);
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[99999] flex items-end" onMouseDown={(e) => { 
      if (e.target === e.currentTarget) {
        e.preventDefault();
        onClose();
      }
    }}>
      <div 
        ref={dropdownRef}
        className="w-full bg-neutral-800/98 border-t border-white/[0.08] rounded-t-2xl shadow-2xl max-h-[70vh] flex flex-col overflow-hidden"
      >
      {/* Header with Clear All */}
      <div className="px-3 py-2.5 border-b border-white/[0.08] flex items-center justify-between flex-shrink-0">
        <span className="text-xs font-semibold text-neutral-300">Filters</span>
        {hasActiveFilters && (
          <button
            onClick={() => {
              clearAllFilters();
            }}
            className="text-[10px] text-neutral-400 hover:text-neutral-300 transition"
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
              <span className="px-2 py-1 bg-white/[0.08] text-neutral-300 text-[10px] rounded-md flex items-center gap-1">
                {selectedLocationName}
                <button
                  onClick={() => {
                    onLocationChange('');
                  }}
                  className="ml-0.5 hover:text-neutral-200"
                >
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            {selectedCategory && (
              <span className="px-2 py-1 bg-white/[0.08] text-neutral-300 text-[10px] rounded-md flex items-center gap-1">
                {selectedCategoryLabel}
                <button
                  onClick={() => {
                    onCategoryChange('');
                  }}
                  className="ml-0.5 hover:text-neutral-200"
                >
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            {hideZeroQuantity && (
              <span className="px-2 py-1 bg-white/[0.08] text-neutral-300 text-[10px] rounded-md">
                Hide Zero
              </span>
            )}
            {showSelectedOnly && (
              <span className="px-2 py-1 bg-white/[0.08] text-neutral-300 text-[10px] rounded-md">
                Selected Only
              </span>
            )}
          </div>
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex border-b border-white/[0.08] flex-shrink-0">
        <button
          onClick={() => {
            setActiveSection('location');
          }}
          className={`flex-1 px-3 py-2.5 text-[11px] font-medium transition touch-manipulation ${
            activeSection === 'location'
              ? 'text-neutral-200 border-b-2 border-white/[0.15]'
              : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.03]'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            Location
            {selectedLocation && (
              <span className="w-1.5 h-1.5 bg-white/[0.4] rounded-full" />
            )}
          </div>
        </button>
        <button
          onClick={() => {
            setActiveSection('category');
          }}
          className={`flex-1 px-3 py-2.5 text-[11px] font-medium transition touch-manipulation ${
            activeSection === 'category'
              ? 'text-neutral-200 border-b-2 border-white/[0.15]'
              : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.03]'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Category
            {selectedCategory && (
              <span className="w-1.5 h-1.5 bg-white/[0.4] rounded-full" />
            )}
          </div>
        </button>
        <button
          onClick={() => {
            setActiveSection('toggles');
          }}
          className={`flex-1 px-3 py-2.5 text-[11px] font-medium transition touch-manipulation ${
            activeSection === 'toggles'
              ? 'text-neutral-200 border-b-2 border-white/[0.15]'
              : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.03]'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Toggles
            {(hideZeroQuantity || showSelectedOnly) && (
              <span className="w-1.5 h-1.5 bg-white/[0.4] rounded-full" />
            )}
          </div>
        </button>
      </div>

      {/* Content Area - Scrollable */}
      <div className="overflow-y-auto flex-1">
        {/* Location Section */}
        {activeSection === 'location' && (
          <div className="p-3 space-y-1">
            <button
              onClick={() => {
                onLocationChange('');
              }}
              className={`w-full text-left px-3 py-2.5 text-xs rounded-md transition touch-manipulation ${
                selectedLocation === ''
                  ? 'bg-white/[0.08] text-neutral-200'
                  : 'text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-300'
              }`}
            >
              All Locations
            </button>

            {locationOptions.map((option) => (
              <button
                key={`mobile-location-${option.id}`}
                onClick={() => {
                  onLocationChange(option.id);
                }}
                className={`w-full text-left px-3 py-2.5 text-xs rounded-md transition touch-manipulation ${
                  selectedLocation === option.id
                    ? 'bg-white/[0.08] text-neutral-200'
                    : 'text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-300'
                } ${option.isChild ? 'pl-6' : ''}`}
              >
                {option.isChild && '└─ '}
                {option.name}
              </button>
            ))}
          </div>
        )}

        {/* Category Section */}
        {activeSection === 'category' && (
          <div className="p-3 space-y-1">
            <button
              onClick={() => {
                onCategoryChange('');
              }}
              className={`w-full text-left px-3 py-2.5 text-xs rounded-md transition touch-manipulation ${
                selectedCategory === ''
                  ? 'bg-white/[0.08] text-neutral-200'
                  : 'text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-300'
              }`}
            >
              All Categories
            </button>

            {categoryOptions.filter(opt => opt.value !== '').length > 0 ? (
              categoryOptions.filter(opt => opt.value !== '').map((option) => (
                <button
                  key={`mobile-category-${option.value}`}
                  onClick={() => {
                    onCategoryChange(option.value);
                  }}
                  className={`w-full text-left px-3 py-2.5 text-xs rounded-md transition touch-manipulation ${
                    selectedCategory === option.value
                      ? 'bg-white/[0.08] text-neutral-200'
                      : 'text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-300'
                  }`}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className="px-3 py-2.5 text-xs text-neutral-600">
                No categories available
              </div>
            )}
          </div>
        )}

        {/* Toggles Section */}
        {activeSection === 'toggles' && (
          <div className="p-3 space-y-1">
            <button
              type="button"
              onClick={() => {
                onHideZeroQuantityChange(!hideZeroQuantity);
              }}
              className={`w-full text-left px-3 py-2.5 text-xs rounded-md transition touch-manipulation flex items-center justify-between ${
                hideZeroQuantity ? 'bg-white/[0.08] text-neutral-200' : 'text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M9.878 9.878l.707-.707M14.121 14.121l.707-.707M14.121 14.121L15.536 15.536M14.121 14.121l.707.707" />
                </svg>
                <div>
                  <div className="font-medium">Hide Zero Stock</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">Hide products with 0 quantity</div>
                </div>
              </div>
              <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                hideZeroQuantity ? 'bg-white/[0.15] border-white/[0.25]' : 'border-neutral-700 bg-neutral-900'
              }`}>
                {hideZeroQuantity && (
                  <svg className="w-3 h-3 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onShowSelectedOnlyChange(!showSelectedOnly);
              }}
              className={`w-full text-left px-3 py-2.5 text-xs rounded-md transition touch-manipulation flex items-center justify-between ${
                showSelectedOnly ? 'bg-white/[0.08] text-neutral-200' : 'text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <div>
                  <div className="font-medium">Selected Only</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">Show only selected products</div>
                </div>
              </div>
              <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                showSelectedOnly ? 'bg-white/[0.15] border-white/[0.25]' : 'border-neutral-700 bg-neutral-900'
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

