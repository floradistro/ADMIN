'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { FilterState } from '../types';
import { useFilters } from '../hooks/useFilters';

interface FilterContextType {
  filterState: FilterState;
  updateFilter: (updates: Partial<FilterState>) => void;
  resetFilters: () => void;
  setSelectedLocationId: (locationId: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  toggleHideZeroQuantity: () => void;
  toggleShowSelectedOnly: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

interface FilterProviderProps {
  children: ReactNode;
  initialFilters?: Partial<FilterState>;
}

export function FilterProvider({ children, initialFilters }: FilterProviderProps) {
  const filterHook = useFilters(initialFilters);

  return (
    <FilterContext.Provider value={filterHook}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilterContext() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilterContext must be used within a FilterProvider');
  }
  return context;
}
