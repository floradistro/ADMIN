'use client';

import React, { useState, useEffect } from 'react';
import { FloraLocation } from '../../services/inventory-service';

interface LocationSelectorProps {
  selectedLocation: string;
  onLocationChange: (locationId: string, aggregateChildren?: boolean) => void;
  locations: FloraLocation[];
  showAggregation?: boolean;
  className?: string;
}

export function LocationSelector({
  selectedLocation,
  onLocationChange,
  locations,
  showAggregation = true,
  className = ''
}: LocationSelectorProps) {
  const [aggregateChildren, setAggregateChildren] = useState(false);
  
  // Debug location data

  // Handle location selection change
  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const locationId = e.target.value;
    onLocationChange(locationId, aggregateChildren);
  };

  // Handle aggregation toggle
  const handleAggregationToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAggregateState = e.target.checked;
    setAggregateChildren(newAggregateState);
    onLocationChange(selectedLocation, newAggregateState);
  };

  // Prepare location options with hierarchy
  const prepareLocationOptions = () => {
    const options = [{ id: '', name: 'All Locations' }];
    
    
    if (!locations || locations.length === 0) {
      return options;
    }
    
    // Process locations to handle hierarchy
    locations.forEach(location => {
      // Add parent location
      options.push({
        id: location.id.toString(),
        name: location.name
      });
      
      // Add child locations with indentation
      if (location.children && location.children.length > 0) {
        location.children.forEach(child => {
          options.push({
            id: child.id.toString(),
            name: `  └─ ${child.name}`
          });
        });
      }
    });
    
    return options;
  };

  const locationOptions = prepareLocationOptions();
  const selectedLocationData = locations.find(loc => loc.id.toString() === selectedLocation);
  const canShowAggregation = selectedLocationData?.is_parent && showAggregation;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Location Dropdown */}
      <select
        value={selectedLocation}
        onChange={handleLocationChange}
        className="px-2 py-1 bg-neutral-800/50 border border-white/[0.06] rounded text-xs text-neutral-400 focus:border-white/[0.12] focus:outline-none product-text min-w-[180px] relative z-[9999]"
        style={{ zIndex: 9999 }}
      >
        {locationOptions.map((option) => (
          <option key={`location-${option.id}`} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
      
      {/* Aggregation Checkbox */}
      {canShowAggregation && (
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-neutral-500 cursor-pointer hover:text-neutral-400 product-text">
            <input
              type="checkbox"
              checked={aggregateChildren}
              onChange={handleAggregationToggle}
              className="w-3.5 h-3.5 rounded border border-white/20 bg-neutral-800/50 text-white focus:ring-2 focus:ring-white/20"
            />
            <span>Include child locations</span>
          </label>
        </div>
      )}
    </div>
  );
}