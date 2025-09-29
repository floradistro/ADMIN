import { useState, useCallback } from 'react';
import { FilterState } from '../types';

export function useFilters(initialState?: Partial<FilterState>) {
  const [filterState, setFilterState] = useState<FilterState>({
    selectedLocationId: '',
    searchQuery: '',
    selectedCategory: '',
    hideZeroQuantity: false,
    showSelectedOnly: false,
    ...initialState,
  });

  const updateFilter = useCallback((updates: Partial<FilterState>) => {
    setFilterState(prev => ({ ...prev, ...updates }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilterState({
      selectedLocationId: '',
      searchQuery: '',
      selectedCategory: '',
      hideZeroQuantity: false,
      showSelectedOnly: false,
    });
  }, []);

  const setSelectedLocationId = useCallback((locationId: string) => {
    updateFilter({ selectedLocationId: locationId });
  }, [updateFilter]);

  const setSearchQuery = useCallback((query: string) => {
    updateFilter({ searchQuery: query });
  }, [updateFilter]);

  const setSelectedCategory = useCallback((category: string) => {
    updateFilter({ selectedCategory: category });
  }, [updateFilter]);

  const toggleHideZeroQuantity = useCallback(() => {
    setFilterState(prev => ({ ...prev, hideZeroQuantity: !prev.hideZeroQuantity }));
  }, []);

  const toggleShowSelectedOnly = useCallback(() => {
    setFilterState(prev => ({ ...prev, showSelectedOnly: !prev.showSelectedOnly }));
  }, []);

  return {
    filterState,
    updateFilter,
    resetFilters,
    setSelectedLocationId,
    setSearchQuery,
    setSelectedCategory,
    toggleHideZeroQuantity,
    toggleShowSelectedOnly,
  };
}
