'use client';

import React, { useState, useCallback } from 'react';
import { Location } from '../../services/locations-service';
import { Button, IconButton } from '../ui';
import { LocationCard } from './LocationCard';

interface LocationTableProps {
  locations: Location[];
  expandedItems: Set<number>;
  onToggleExpand: (id: number) => void;
  onBulkExpandCollapse?: (ids: number[], expand: boolean) => void;
  onEditLocation: (location: Location) => void;
  onRefresh?: () => void;
  selectedLocations?: Set<number>;
  onSelectedLocationsChange?: (selected: Set<number>) => void;
  isLoading?: boolean;
  onAddLocation?: () => void;
}

export function LocationTable({ 
  locations, 
  expandedItems, 
  onToggleExpand, 
  onBulkExpandCollapse,
  onEditLocation,
  onRefresh,
  selectedLocations: externalSelectedLocations,
  onSelectedLocationsChange,
  isLoading = false,
  onAddLocation
}: LocationTableProps) {
  
  const [internalSelectedLocations, setInternalSelectedLocations] = useState<Set<number>>(new Set());
  
  // Use external state if provided, otherwise use internal state
  const selectedLocations = externalSelectedLocations ?? internalSelectedLocations;
  const setSelectedLocations = onSelectedLocationsChange ?? setInternalSelectedLocations;

  const handleSelectAll = () => {
    if (selectedLocations.size === locations.length) {
      setSelectedLocations(new Set());
    } else {
      setSelectedLocations(new Set(locations.map(l => l.id)));
    }
  };

  const handleSelectLocation = (locationId: number) => {
    const newSelected = new Set(selectedLocations);
    if (newSelected.has(locationId)) {
      newSelected.delete(locationId);
    } else {
      newSelected.add(locationId);
    }
    setSelectedLocations(newSelected);
  };

  const clearSelection = () => {
    setSelectedLocations(new Set());
  };

  const allSelectedExpanded = selectedLocations && selectedLocations.size > 0
    ? Array.from(selectedLocations).every(id => expandedItems.has(id))
    : false;

  const handleBulkToggleExpand = () => {
    if (!selectedLocations || selectedLocations.size === 0) return;
    const ids = Array.from(selectedLocations);
    if (onBulkExpandCollapse) {
      onBulkExpandCollapse(ids, !allSelectedExpanded);
    } else {
      // Fallback to per-item toggles if bulk handler not provided
      if (allSelectedExpanded) {
        ids.forEach((id) => expandedItems.has(id) && onToggleExpand(id));
      } else {
        ids.forEach((id) => !expandedItems.has(id) && onToggleExpand(id));
      }
    }
  };

  return (
    <div className="flex-1 h-full min-h-0 overflow-y-auto scrollable-container p-0 bg-neutral-900">
      {/* Table View */}
      <div className="min-w-full h-full">
        {/* Table Header */}
        <div className="sticky top-0 bg-neutral-900 backdrop-blur border-b border-white/[0.08] px-4 py-2 z-10">
          <div className="flex items-center gap-3 text-xs font-medium text-neutral-400 relative">
            {/* Select All Icon */}
            <div className="w-6 flex items-center justify-center">
              <button
                onClick={handleSelectAll}
                className="w-4 h-4 flex items-center justify-center rounded border border-neutral-600/30 bg-neutral-800/50 hover:border-neutral-500 hover:bg-neutral-800/70 transition-colors focus:outline-none focus:ring-1 focus:ring-neutral-500/20"
                title="Select all locations"
              >
                {selectedLocations.size === locations.length && locations.length > 0 ? (
                  // All selected - subtle filled square
                  <svg className="w-3 h-3 text-neutral-400" fill="currentColor" viewBox="0 0 16 16">
                    <rect width="16" height="16" rx="1"/>
                  </svg>
                ) : selectedLocations.size > 0 ? (
                  // Some selected - dash/minus
                  <svg className="w-3 h-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 16 16" strokeWidth="2">
                    <line x1="4" y1="8" x2="12" y2="8"/>
                  </svg>
                ) : (
                  // None selected - empty
                  <div className="w-3 h-3"></div>
                )}
              </button>
            </div>

            <div className="w-6 flex items-center">
              <button
                onClick={handleBulkToggleExpand}
                disabled={!selectedLocations || selectedLocations.size === 0}
                className="w-6 h-6 flex items-center justify-center bg-neutral-800/50 text-neutral-400 rounded border border-neutral-600/30 hover:bg-neutral-800/70 hover:text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed"
                title={allSelectedExpanded ? 'Collapse selected' : 'Expand selected'}
              >
                {allSelectedExpanded ? (
                  <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                  </svg>
                ) : (
                  <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 15l7-7 7 7" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* Table Column Headers */}
            <div className="flex-1 min-w-0">
              Location Name
            </div>
            <div className="w-32">
              Status
            </div>
            <div className="w-48">
              Address
            </div>
            <div className="w-24">
              Default
            </div>
            
          </div>
        </div>
        
        {/* Table Rows - Fills remaining height */}
        <div className="min-h-[calc(100vh-200px)] px-4 pb-4">
          {locations.map((location) => (
            <LocationCard
              key={location.id}
              location={location}
              isExpanded={expandedItems.has(location.id)}
              onToggleExpand={() => onToggleExpand(location.id)}
              onEdit={() => onEditLocation(location)}
              onRefresh={onRefresh}
              isSelected={selectedLocations.has(location.id)}
              onSelect={() => handleSelectLocation(location.id)}
            />
          ))}
        </div>
      </div>
      
      {/* Loading State */}
      {isLoading && locations.length === 0 && (
        <div className="flex justify-center py-12">
          <div className="text-white/60">Loading locations...</div>
        </div>
      )}
      
      {/* Empty State */}
      {!isLoading && locations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <svg className="w-16 h-16 text-neutral-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div className="text-white/60 text-lg mb-2">No locations found</div>
          <div className="text-neutral-500 text-sm mb-4">Locations must be created in WordPress admin panel</div>
          <div className="text-neutral-600 text-xs max-w-md mx-auto">
            Go to WordPress admin → Flora IM → Locations to create new locations. 
            Once created, they will appear here for management.
          </div>
        </div>
      )}
    </div>
  );
}