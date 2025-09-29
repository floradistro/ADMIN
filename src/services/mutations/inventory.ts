/**
 * Inventory Mutation Hooks using TanStack Query
 * Provides optimistic updates and cache invalidation for inventory operations
 */

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { PRODUCT_QUERY_KEYS } from '../queries/products';
import { LOCATION_QUERY_KEYS } from '../queries/locations';

// Mutation Types
export interface InventoryUpdateParams {
  product_id: number;
  location_id: number;
  quantity: number;
  reason?: string;
}

export interface BulkInventoryUpdateParams {
  updates: Array<{
    product_id: number;
    location_id: number;
    quantity: number;
  }>;
}

export interface StockTransferParams {
  product_id: number;
  from_location: number;
  to_location: number;
  quantity: number;
  notes?: string;
}

export interface StockConversionParams {
  from_product_id: number;
  to_product_id: number;
  location_id: number;
  from_quantity: number;
  to_quantity: number;
  notes?: string;
}

// API Service Functions
const inventoryMutationService = {
  updateInventory: async (params: InventoryUpdateParams): Promise<any> => {
    const response = await apiClient.post(ENDPOINTS.INVENTORY.UPDATE, params);
    return response.data;
  },

  bulkUpdateInventory: async (params: BulkInventoryUpdateParams): Promise<any> => {
    // Use Portal API endpoint for bulk updates
    const response = await fetch('/api/flora/inventory/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Bulk update failed');
    }

    return response.json();
  },

  transferStock: async (params: StockTransferParams): Promise<any> => {
    const response = await fetch('/api/flora/transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Transfer failed');
    }

    return response.json();
  },

  convertStock: async (params: StockConversionParams): Promise<any> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const response = await fetch('/api/flora/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(params),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Conversion failed');
      }

      // Handle potentially malformed JSON responses
      const responseText = await response.text();
      
      try {
        const data = JSON.parse(responseText);
        return { success: true, ...data };
      } catch (parseError) {
        // Handle malformed JSON response (HTML error + JSON)
        const jsonStart = responseText.indexOf('{"');
        if (jsonStart > 0) {
          const cleanJson = responseText.substring(jsonStart);
          const data = JSON.parse(cleanJson);
          return { success: true, ...data };
        }
        throw new Error('Invalid response format from server');
      }
    } finally {
      clearTimeout(timeoutId);
    }
  },
};

// Mutation Hooks
export const useUpdateInventoryMutation = (
  options?: UseMutationOptions<any, Error, InventoryUpdateParams>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inventoryMutationService.updateInventory,
    // @ts-ignore - Complex generic type inference issue with TanStack Query
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: PRODUCT_QUERY_KEYS.all });

      // Snapshot previous values for rollback
      const previousProducts = queryClient.getQueriesData({ queryKey: PRODUCT_QUERY_KEYS.all });

      // Optimistically update the cache
      queryClient.setQueriesData({ queryKey: PRODUCT_QUERY_KEYS.all }, (old: any) => {
        if (!old?.data) return old;

        return {
          ...old,
          data: old.data.map((product: any) => {
            if (product.id === variables.product_id) {
              const updatedInventory = product.inventory?.map((inv: any) => 
                inv.location_id === variables.location_id.toString() 
                  ? { ...inv, stock: variables.quantity }
                  : inv
              ) || [];
              
              const total_stock = updatedInventory.reduce((sum: number, inv: any) => sum + (inv.stock || 0), 0);
              
              return {
                ...product,
                inventory: updatedInventory,
                total_stock,
                stock_quantity: total_stock,
                stock_status: total_stock > 0 ? 'instock' : 'outofstock',
              };
            }
            return product;
          })
        };
      });

      return { previousProducts };
    },
    onError: (err, variables, context) => {
      // Rollback optimistic updates on error
      if (context?.previousProducts) {
        context.previousProducts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Always refetch after mutation settles
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
    },
    ...options,
  });
};

export const useBulkUpdateInventoryMutation = (
  options?: UseMutationOptions<any, Error, BulkInventoryUpdateParams>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inventoryMutationService.bulkUpdateInventory,
    onSuccess: () => {
      // Invalidate all product queries after successful bulk update
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
    },
    ...options,
  });
};

export const useTransferStockMutation = (
  options?: UseMutationOptions<any, Error, StockTransferParams>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inventoryMutationService.transferStock,
    onSuccess: () => {
      // Invalidate product and location queries after successful transfer
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: LOCATION_QUERY_KEYS.all });
    },
    ...options,
  });
};

export const useConvertStockMutation = (
  options?: UseMutationOptions<any, Error, StockConversionParams>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inventoryMutationService.convertStock,
    onSuccess: () => {
      // Invalidate product queries for both products involved in conversion
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
    },
    ...options,
  });
};
