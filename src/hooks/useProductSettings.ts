import { useState, useCallback } from 'react';

export interface CategoryFilterSettings {
  enableCategoryFiltering: boolean;
  showEmptyCategories: boolean;
}

export interface DisplaySettings {
  showPrices: boolean;
  showInventory: boolean;
  showCategories: boolean;
  showImages: boolean;
  viewMode: 'grid' | 'table';
  productsPerPage: number;
  showProductImages: boolean;
}

export interface InventorySettings {
  autoInitialize: boolean;
  trackVariances: boolean;
  enableBulkUpdates: boolean;
  lowStockThreshold: number;
  autoRefreshInventory: boolean;
  showStockLevels: boolean;
}

export interface ProductSettings {
  display: DisplaySettings;
  inventory: InventorySettings;
  categoryFilters: CategoryFilterSettings;
}

const defaultSettings: ProductSettings = {
  display: {
    showPrices: true,
    showInventory: true,
    showCategories: true,
    showImages: true,
    viewMode: 'grid',
    productsPerPage: 20,
    showProductImages: true,
  },
  inventory: {
    autoInitialize: false,
    trackVariances: true,
    enableBulkUpdates: true,
    lowStockThreshold: 10,
    autoRefreshInventory: true,
    showStockLevels: true,
  },
  categoryFilters: {
    enableCategoryFiltering: true,
    showEmptyCategories: false,
  },
};

export function useProductSettings() {
  const [settings, setSettings] = useState<ProductSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);

  const updateDisplaySettings = useCallback((updates: Partial<DisplaySettings>) => {
    setSettings(prev => ({
      ...prev,
      display: { ...prev.display, ...updates }
    }));
  }, []);

  const updateInventorySettings = useCallback((updates: Partial<InventorySettings>) => {
    setSettings(prev => ({
      ...prev,
      inventory: { ...prev.inventory, ...updates }
    }));
  }, []);

  const updateCategoryFilterSettings = useCallback((updates: Partial<CategoryFilterSettings>) => {
    setSettings(prev => ({
      ...prev,
      categoryFilters: { ...prev.categoryFilters, ...updates }
    }));
  }, []);

  return {
    settings,
    isLoading,
    updateDisplaySettings,
    updateInventorySettings,
    updateCategoryFilterSettings,
  };
}
