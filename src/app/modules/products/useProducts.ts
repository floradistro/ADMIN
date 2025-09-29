import { useState, useCallback, useRef, useMemo } from 'react';
import { Product, Location, FilterState } from '../../../types';
import { inventoryService, FloraProduct, FloraLocation } from '../../../services/inventory-service';
import { categoriesService } from '../../../services/categories-service';
import { useColumnManager } from '../../../hooks/useColumnManager';
import { usePagination } from '../../../hooks/usePagination';
import { useBulkActions } from '../../../hooks/useBulkActions';

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

  // Filter products based on zero quantity setting and selected products
  const getFilteredProducts = useCallback((
    filterState: FilterState, 
    allProducts: Product[] = products
  ) => {
    let filtered = allProducts;
    
    // Apply selected products filter first
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
            inv => inv.location_id === filterState.selectedLocationId
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

  // Fetch products from Flora API
  const fetchProducts = useCallback(async (page = 1, reset = false, filterState?: FilterState) => {
    try {
      pagination.setIsLoading(true);
      setIsLoading(true);
      setError(null);

      const filters = {
        page,
        per_page: pagination.itemsPerPage,
        ...(filterState?.selectedLocationId && { location_id: parseInt(filterState.selectedLocationId) }),
        ...(filterState?.selectedCategory && { category_id: parseInt(filterState.selectedCategory) }),
        ...(filterState?.searchQuery && { search: filterState.searchQuery }),
        ...(aggregateChildren && { aggregate_by_parent: true }),
      };

      const response = await inventoryService.getFilteredProducts(filters, false);

      if (response.success) {
        const convertedProducts = response.data.map(convertFloraProduct);
        
        if (reset || page === 1) {
          setProducts(convertedProducts);
        } else {
          setProducts(prev => [...prev, ...convertedProducts]);
        }

        // Update pagination state
        if (response.meta) {
          pagination.updatePagination({
            total: response.meta.total,
            pages: response.meta.pages,
            current_page: page,
            per_page: response.meta.per_page,
          });
        }
      } else {
        throw new Error('Failed to fetch products');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
      // console.error('Error fetching products:', err);
    } finally {
      setIsLoading(false);
      pagination.setIsLoading(false);
    }
  }, [aggregateChildren, convertFloraProduct, pagination]);

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

      const response = await inventoryService.getFilteredProducts(filters, true);

      if (response.success) {
        const convertedProducts = response.data.map(convertFloraProduct);
        setProducts(convertedProducts);
        
        // Also refresh enriched products if they were loaded
        if (hasLoadedFieldValues) {
          const productsWithFieldValues = await loadFieldValuesForProducts(convertedProducts);
          setEnrichedProducts(productsWithFieldValues);
        }
        
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
      alert('No products selected for deletion');
      return;
    }

    const confirmed = confirm(`Are you sure you want to delete ${selectedProductsList.length} product(s)? This action cannot be undone.`);
    if (!confirmed) return;

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
            // console.error(`❌ Delete API error for product ${product.name}:`, {
            //   status: response.status,
            //   statusText: response.statusText,
            //   error: errorText
            // });
            errors.push(`${product.name}: ${response.status} ${response.statusText}`);
          } else {
            results.push(product.id);
          }
        } catch (error) {
          // console.error(`❌ Network error deleting product ${product.name}:`, error);
          errors.push(`${product.name}: Network error`);
        }
      }
      
      // Refresh the product list
      await fetchProducts(1, true);
      
      // Report results
      if (errors.length > 0) {
        // console.error('Some products failed to delete:', errors);
        alert(`Deleted ${results.length} products successfully. Failed to delete ${errors.length} products:\n${errors.join('\n')}`);
      } else {
        alert(`Successfully deleted ${results.length} product(s)`);
      }
    } catch (error) {
      // console.error('Error deleting products:', error);
      alert(`Error deleting products: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [fetchProducts]);

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
        per_page: -1,
      };

      const response = await inventoryService.getFilteredProducts(filters, false);

      if (response.success) {
        const convertedProducts = response.data.map(convertFloraProduct);
        setProducts(convertedProducts);
        
        // Update pagination state
        pagination.goToPage(1);
        if (response.meta) {
          pagination.updatePagination({
            total: response.meta.total,
            pages: response.meta.pages,
            current_page: 1,
            per_page: response.meta.per_page || -1,
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
    fetchLocations,
    fetchCategories,
    handleLoadMore,
    refreshProducts,
    handleLoadFieldValues,
    handleSyncProducts,
    handleBulkDelete,
    initializeProducts,
    

    setSelectedProducts: bulkActions.setSelectedProducts,
  };
}
