'use client';

import { useState, useEffect, useCallback } from 'react';
import { InventoryService } from '@/services/inventory-service';
import { Product, Location } from '@/types';
import { InventoryItem, GroupedInventoryItem } from '@/types/inventory';

interface UseInventoryDataOptions {
  autoLoad?: boolean;
  groupByProduct?: boolean;
}

interface UseInventoryDataReturn {
  products: Product[];
  locations: Location[];
  inventory: InventoryItem[];
  groupedInventory: GroupedInventoryItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateQuantity: (itemId: number, newQuantity: number) => Promise<void>;
}

export function useInventoryData(options: UseInventoryDataOptions = {}): UseInventoryDataReturn {
  const { autoLoad = true, groupByProduct = true } = options;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const inventoryService = new InventoryService();

  // Helper function to group inventory by product
  const groupInventoryByProduct = useCallback((inventoryItems: InventoryItem[]): GroupedInventoryItem[] => {
    const grouped = inventoryItems.reduce((acc, item) => {
      const key = item.product_id;
      if (!acc[key]) {
        acc[key] = {
          product_id: item.product_id,
          product_name: item.product_name,
          locations: [],
          total_quantity: 0
        };
      }
      acc[key].locations.push(item);
      acc[key].total_quantity += parseFloat(item.quantity.toString());
      return acc;
    }, {} as Record<number, GroupedInventoryItem>);
    
    return Object.values(grouped);
  }, []);

  // Create inventory items from products
  const inventory: InventoryItem[] = products.flatMap(product => 
    product.inventory?.map(inv => ({
      id: parseInt(`${product.id}${inv.location_id}`),
      product_id: product.id,
      product_name: product.name,
      location_id: inv.location_id,
      location_name: inv.location_name,
      quantity: inv.stock,
      reserved_quantity: 0
    })) || []
  );

  const groupedInventory = groupByProduct ? groupInventoryByProduct(inventory) : [];

  const loadData = useCallback(async () => {
    let isCancelled = false;
    
    try {
      setLoading(true);
      setError(null);
      
      const [productsResponse, locationsResponse] = await Promise.all([
        inventoryService.getFilteredProducts({ page: 1, per_page: 100, search: '' }, false), // Load blueprint fields separately for performance
        inventoryService.getLocations()
      ]);
      
      // Check if component is still mounted
      if (isCancelled) return;
      
      if (productsResponse.success) {
        // Map FloraProduct to Product format
        const mappedProducts = productsResponse.data.map(product => ({
          ...product,
          inventory: product.inventory?.map(inv => ({
            location_id: parseInt(inv.location_id),
            location_name: inv.location_name,
            stock: inv.stock,
            manage_stock: true
          })) || []
        }));
        setProducts(mappedProducts);
      }
      
      if (locationsResponse.success) {
        setLocations(locationsResponse.data);
      }
    } catch (err) {
      if (!isCancelled) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      }
    } finally {
      if (!isCancelled) {
        setLoading(false);
      }
    }
    
    // Cleanup handled by useEffect
    return;
  }, []);

  const updateQuantity = useCallback(async (itemId: number, newQuantity: number) => {
    // This is a placeholder - actual implementation would call the API
    // After update, refresh data
    await loadData();
  }, [loadData]);

  useEffect(() => {
    if (autoLoad) {
      loadData();
    }
  }, [autoLoad, loadData]);

  return {
    products,
    locations,
    inventory,
    groupedInventory,
    loading,
    error,
    refresh: loadData,
    updateQuantity
  };
}