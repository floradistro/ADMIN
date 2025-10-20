import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Product, Location, FilterState } from '../../../types';
import { inventoryService, FloraProduct, FloraLocation } from '../../../services/inventory-service';
import { bulkApiService } from '../../../services/bulk-api-service';
import { categoriesService } from '../../../services/categories-service';
import { useColumnManager } from '../../../hooks/useColumnManager';
import { usePagination } from '../../../hooks/usePagination';
import { useBulkActions } from '../../../hooks/useBulkActions';
import { useDialogs } from '../../../hooks/useDialogs';

export type ProductGridTab = 'products' | 'settings' | 'general' | 'categories' | 'blueprints' | 'fields' | 'pricing' | 'recipes';

export interface ProductsState {
  products: Product[];
  locations: Location[];
  floraLocations: FloraLocation[];
  categories: Array<{id: number, name: string}>;
  isLoading: boolean;
  error: string | null;
  aggregateChildren: boolean;
  productGridTab: ProductGridTab;
  syncLoading: boolean;
  enrichedProducts: Product[];
  hasLoadedFieldValues: boolean;
}

export function useProducts() {
  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [floraLocations, setFloraLocations] = useState<FloraLocation[]>([]);
  const [categories, setCategories] = useState<Array<{id: number, name: string}>>([]);
  
  // Dialog management
  const dialogs = useDialogs();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aggregateChildren, setAggregateChildren] = useState(false);
  const [productGridTab, setProductGridTab] = useState<ProductGridTab>('products');
  const [syncLoading, setSyncLoading] = useState(false);
  const [enrichedProducts, setEnrichedProducts] = useState<Product[]>([]);
  const [hasLoadedFieldValues, setHasLoadedFieldValues] = useState(false);

  // Use pagination hook - Set to -1 to load all products  
  const pagination = usePagination(-1);
  
  // Use bulk actions hook
  const bulkActions = useBulkActions(products);

  const initialLoadRef = useRef(true);
  const isFilteringRef = useRef(false);

  // Filter products based on all filter criteria - CLIENT SIDE for instant results
  const getFilteredProducts = useCallback((
    filterState: FilterState, 
    allProducts: Product[] = products
  ) => {
    let filtered = allProducts;
    
    // Apply category filter - INSTANT CLIENT-SIDE
    if (filterState.selectedCategory) {
      filtered = filtered.filter(product => {
        if (!product.categories || product.categories.length === 0) return false;
        return product.categories.some(cat => cat.id?.toString() === filterState.selectedCategory);
      });
    }
    
    // Apply location filter - INSTANT CLIENT-SIDE
    if (filterState.selectedLocationId) {
      filtered = filtered.filter(product => {
        if (!product.inventory || product.inventory.length === 0) return false;
        return product.inventory.some(inv => inv.location_id?.toString() === filterState.selectedLocationId);
      });
    }
    
    // Apply selected products filter
    if (filterState.showSelectedOnly) {
      filtered = filtered.filter(product => bulkActions.selectedProducts.has(product.id));
    }
    
    // Apply zero quantity filter
    if (filterState.hideZeroQuantity) {
      filtered = filtered.filter(product => {
        // Check if product has any inventory with quantity > 0
        if (!product.inventory || product.inventory.length === 0) {
          return false; // Hide products with no inventory data
        }
        
        // If a specific location is selected, only check that location
        if (filterState.selectedLocationId) {
          const locationInventory = product.inventory.find(
            inv => inv.location_id?.toString() === filterState.selectedLocationId
          );
          return locationInventory ? locationInventory.stock > 0 : false;
        }
        
        // Otherwise, check if any location has stock > 0
        return product.inventory.some(inv => inv.stock > 0);
      });
    }
    
    return filtered;
  }, [products, bulkActions.selectedProducts]);

  // Column management for products table
  const {
    columnConfigs,
    visibleColumns,
    toggleColumn,
    toggleAllBlueprintColumns,
    getBlueprintFieldValue,
    formatBlueprintFieldValue,
    loadFieldValuesForProducts,
    isLoadingBlueprintFields,
  } = useColumnManager({ products: products });

  // Convert Flora API product to our Product interface
  const convertFloraProduct = useCallback((floraProduct: FloraProduct): Product => ({
    id: floraProduct.id,
    name: floraProduct.name,
    sku: floraProduct.sku,
    type: floraProduct.type,
    status: floraProduct.status,
    description: '',
    short_description: '',
    regular_price: floraProduct.regular_price?.toString() || floraProduct.price?.toString() || '0',
    price: floraProduct.price,
    sale_price: floraProduct.sale_price,
    image: floraProduct.image,
    categories: floraProduct.categories,
    inventory: floraProduct.inventory,
    total_stock: floraProduct.total_stock,
    blueprint_fields: floraProduct.blueprint_fields,
    meta_data: floraProduct.meta_data || [],
  }), []);

  // Fetch products using BULK API (100x faster than old method)
  const fetchProducts = useCallback(async (page = 1, reset = false, filterState?: FilterState) => {
    try {
      pagination.setIsLoading(true);
      setIsLoading(true);
      setError(null);

      const filters = {
        page,
        per_page: pagination.itemsPerPage,
        ...(filterState?.selectedLocationId && { location_id: parseInt(filterState.selectedLocationId) }),
        ...(filterState?.selectedCategory && { category: parseInt(filterState.selectedCategory) }),
      };

      // Use BULK API - gets products with inventory, fields, and meta in 1 optimized call
      const response = await bulkApiService.getProducts(filters);

      if (response.success) {
        // Bulk API returns data in the correct format already
        const convertedProducts = response.data.map((product: any) => ({
          id: product.id,
          name: product.name,
          sku: product.sku || '',
          type: product.type,
          status: product.status,
          description: product.description || '',
          short_description: product.short_description || '',
          regular_price: product.regular_price,
          sale_price: product.sale_price,
          image: product.image,
          blueprint_fields: product.blueprint_fields || [],
          categories: product.categories,
          inventory: product.inventory,
          total_stock: product.total_stock,
          fields: product.fields,
          meta_data: product.meta_data,
        }));
        
        if (reset || page === 1) {
          setProducts(convertedProducts);
        } else {
          setProducts(prev => [...prev, ...convertedProducts]);
        }

        // Update pagination state
        if (response.meta) {
          // If we're loading all products (per_page >= total), there's only 1 page
          const totalPages = pagination.itemsPerPage === -1 || response.meta.per_page >= response.meta.total 
            ? 1 
            : Math.ceil(response.meta.total / response.meta.per_page);
          
          pagination.updatePagination({
            total: response.meta.total,
            pages: totalPages,
            current_page: page,
            per_page: response.meta.per_page,
          });
        }
      } else {
        throw new Error('Failed to fetch products');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
      console.error('Error fetching products:', err);
    } finally {
      setIsLoading(false);
      pagination.setIsLoading(false);
    }
  }, [aggregateChildren, pagination]);

  // Fetch locations from Flora API
  const fetchLocations = useCallback(async (forceRefresh = false) => {
    try {
      // Fetch locations from both inventory services
      const [locationsResponse, floraResponse] = await Promise.all([
        inventoryService.getLocations(false, forceRefresh),
        inventoryService.getFloraLocations(forceRefresh)
      ]);
      
      if (locationsResponse.success) {
        setLocations(locationsResponse.data);
      }
      
      if (floraResponse.success) {
        setFloraLocations(floraResponse.data);
      }
    } catch (err) {
      // console.error('Error fetching locations:', err);
    }
  }, []);

  // Fetch categories from Flora API
  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoriesService.getCategories({
        per_page: 100,
        orderby: 'name',
        order: 'asc'
      });
      
      if (response.success) {
        const categoryOptions = response.data.map(cat => ({
          id: cat.id,
          name: cat.name
        }));
        setCategories(categoryOptions);
      }
    } catch (err) {
      // console.error('Error fetching categories:', err);
    }
  }, []);

  // Listen for field updates from Settings
  useEffect(() => {
    const handleFieldsUpdate = async () => {
      // Force complete refresh
      await fetchProducts(1, true);
    };

    window.addEventListener('categoryFieldsUpdated', handleFieldsUpdate);
    return () => window.removeEventListener('categoryFieldsUpdated', handleFieldsUpdate);
  }, [fetchProducts]);
  
  // Expose fetch products with filters for external use
  const fetchProductsWithFilters = useCallback(async (filterState?: FilterState) => {
    await fetchProducts(1, true, filterState);
  }, [fetchProducts]);

  // Load more products
  const handleLoadMore = useCallback(() => {
    if (!pagination.isLoading && pagination.hasMore) {
      fetchProducts(pagination.currentPage + 1, false);
    }
  }, [fetchProducts, pagination.currentPage, pagination.isLoading, pagination.hasMore]);

  // Refresh products function
  const refreshProducts = useCallback(async () => {
    try {
      const filters = {
        page: 1,
        per_page: 100,
      };

      // Use BULK API for refresh
      const response = await bulkApiService.getProducts(filters);

      if (response.success) {
        const convertedProducts = response.data.map((product: any) => ({
          id: product.id,
          name: product.name,
          sku: product.sku || '',
          type: product.type,
          status: product.status,
          description: product.description || '',
          short_description: product.short_description || '',
          regular_price: product.regular_price,
          sale_price: product.sale_price,
          image: product.image,
          categories: product.categories,
          inventory: product.inventory,
          total_stock: product.total_stock,
          fields: product.fields,
          meta_data: product.meta_data,
        }));
        setProducts(convertedProducts);
        
        // Force a small delay to ensure state updates have propagated
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        // console.error('❌ Failed to refresh products:', response);
        throw new Error(`API Error: Failed to refresh products`);
      }
    } catch (err) {
      // console.error('❌ Error refreshing products:', err);
      throw err;
    }
  }, [convertFloraProduct, hasLoadedFieldValues, loadFieldValuesForProducts]);

  // Handle loading field values for products
  const handleLoadFieldValues = useCallback(async () => {
    try {
      const productsWithFieldValues = await loadFieldValuesForProducts(products);
      setEnrichedProducts(productsWithFieldValues);
      setHasLoadedFieldValues(true);
    } catch (error) {
      // console.error('Failed to load field values:', error);
    }
  }, [loadFieldValuesForProducts, products]);

  // Handle manual sync of selected products with locations
  const handleSyncProducts = useCallback(async () => {
    try {
      setSyncLoading(true);
      
      // Get selected product IDs
      const selectedProductIds = Array.from(bulkActions.selectedProducts);
      
      if (selectedProductIds.length === 0) {
        setError('Please select products to sync with locations');
        return;
      }
      
      const response = await fetch('/api/flora/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_ids: selectedProductIds
        })
      });
      
      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Refresh both products and locations after sync
        await Promise.all([
          fetchProducts(1, true),
          fetchLocations(true)
        ]);
        
        // Clear selection after successful sync
        bulkActions.clearSelection();
        setError(null);
      } else {
        throw new Error(result.error || 'Sync failed');
      }
    } catch (error) {
      // console.error('❌ Sync failed:', error);
      setError(error instanceof Error ? error.message : 'Sync failed');
    } finally {
      setSyncLoading(false);
    }
  }, [bulkActions.selectedProducts, bulkActions.clearSelection, fetchProducts, fetchLocations]);

  // Handle bulk delete
  const handleBulkDelete = useCallback(async (selectedProductsList: Product[]) => {
    if (selectedProductsList.length === 0) {
      dialogs.showError('No Selection', 'No products selected for deletion');
      return;
    }

    const productNames = selectedProductsList.map(p => p.name).join(', ');
    const message = `Are you sure you want to delete ${selectedProductsList.length} product(s)?\n\nProducts to delete:\n${productNames}\n\nThis action cannot be undone.`;
    
    dialogs.showDangerConfirm(
      'Delete Products',
      message,
      async () => {
        try {
          setIsLoading(true);
          
          const results = [];
          const errors = [];
          
          for (const product of selectedProductsList) {
            try {
              const response = await fetch(`/api/products/${product.id}`, {
                method: 'DELETE',
              });
              
              if (!response.ok) {
                const errorText = await response.text();
                errors.push(`${product.name}: ${response.status} ${response.statusText}`);
              } else {
                results.push(product.id);
              }
            } catch (error) {
              errors.push(`${product.name}: Network error`);
            }
          }
          
          // Refresh the product list
          await fetchProducts(1, true);
          
          // Report results
          if (errors.length > 0) {
            dialogs.showWarning(
              'Partial Success',
              `Deleted ${results.length} products successfully. Failed to delete ${errors.length} products:\n${errors.join('\n')}`
            );
          } else {
            dialogs.showSuccess(
              'Success',
              `Successfully deleted ${results.length} product(s)`
            );
          }
        } catch (error) {
          dialogs.showError(
            'Error',
            `Error deleting products: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        } finally {
          setIsLoading(false);
        }
      },
      'Delete',
      'Cancel'
    );
  }, [fetchProducts, dialogs]);

  // Generate category options from loaded categories
  const categoryOptions = useMemo(() => {
    return [
      { value: '', label: 'All Categories' },
      ...categories.map(cat => ({ value: cat.id.toString(), label: cat.name }))
    ];
  }, [categories]);

  // Initial data load
  const initializeProducts = useCallback(async () => {
    try {
      // Load categories
      const categoriesResponse = await categoriesService.getCategories({
        per_page: 100,
        orderby: 'name',
        order: 'asc'
      });
      
      if (categoriesResponse.success) {
        const categoryOptions = categoriesResponse.data.map(cat => ({
          id: cat.id,
          name: cat.name
        }));
        setCategories(categoryOptions);
      }

      // Load locations
      const locationsResponse = await fetch('/api/flora/locations');
      const locationsResult = await locationsResponse.json();
      
      if (locationsResult.success) {
        setFloraLocations(locationsResult.data);
      }

      // Load products
      setIsLoading(true);
      setError(null);

      const filters = {
        page: 1,
        per_page: 500,
      };

      const response = await bulkApiService.getProducts(filters);

      if (response.success) {
        const convertedProducts = response.data.map((product: any) => ({
          id: product.id,
          name: product.name,
          sku: product.sku || '',
          type: product.type,
          status: product.status,
          description: product.description || '',
          short_description: product.short_description || '',
          regular_price: product.regular_price,
          sale_price: product.sale_price,
          image: product.image,
          blueprint_fields: product.blueprint_fields || [],
          categories: product.categories,
          inventory: product.inventory,
          total_stock: product.total_stock,
          fields: product.fields,
          meta_data: product.meta_data,
        }));
        
        setProducts(convertedProducts);
        
        // Update pagination state
        pagination.goToPage(1);
        if (response.meta) {
          // If we're loading all products (per_page >= total), there's only 1 page
          const totalPages = response.meta.per_page >= response.meta.total ? 1 : Math.ceil(response.meta.total / response.meta.per_page);
          
          pagination.updatePagination({
            total: response.meta.total,
            pages: totalPages,
            current_page: 1,
            per_page: response.meta.per_page,
          });
        }
      } else {
        throw new Error('Failed to fetch products');
      }

      initialLoadRef.current = false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
      // console.error('Error loading initial products:', err);
    } finally {
      setIsLoading(false);
    }
  }, [convertFloraProduct]);

  return {
    // State
    products,
    locations,
    floraLocations,
    categories,
    isLoading,
    error,
    aggregateChildren,
    productGridTab,
    syncLoading,
    enrichedProducts,
    hasLoadedFieldValues,
    
    // Pagination
    currentPage: pagination.currentPage,
    hasMore: pagination.hasMore,
    totalProducts: pagination.totalItems,
    pagination,
    
    // Bulk Actions
    selectedProducts: bulkActions.selectedProducts,
    bulkActions,
    
    // Column management
    columnConfigs,
    visibleColumns,
    toggleColumn,
    toggleAllBlueprintColumns,
    getBlueprintFieldValue,
    formatBlueprintFieldValue,
    isLoadingBlueprintFields,
    
    // Computed
    categoryOptions,
    getFilteredProducts,
    
    // Actions
    setProducts,
    setProductGridTab,
    setAggregateChildren,
    setError,
    fetchProducts,
    fetchProductsWithFilters,
    fetchLocations,
    fetchCategories,
    handleLoadMore,
    refreshProducts,
    handleLoadFieldValues,
    handleSyncProducts,
    handleBulkDelete,
    initializeProducts,
    
    // Dialog components and state
    dialogs,

    setSelectedProducts: bulkActions.setSelectedProducts,
  };
}
