/**
 * Product Mutation Hooks using TanStack Query
 * Provides optimistic updates and cache invalidation for product operations
 */

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { PRODUCT_QUERY_KEYS } from '../queries/products';
import type { FloraProduct } from '../inventory-service';

// Mutation Types
export interface ProductCreateParams {
  name: string;
  sku?: string;
  type?: string;
  status?: string;
  description?: string;
  short_description?: string;
  categories?: Array<{ id: number }>;
  price?: number;
  regular_price?: number;
  sale_price?: string;
  manage_stock?: boolean;
  stock_quantity?: number;
  meta_data?: Array<{ key: string; value: any }>;
}

export interface ProductUpdateParams {
  id: number;
  name?: string;
  sku?: string;
  type?: string;
  status?: string;
  description?: string;
  short_description?: string;
  categories?: Array<{ id: number }>;
  price?: number;
  regular_price?: number;
  sale_price?: string;
  manage_stock?: boolean;
  stock_quantity?: number;
  meta_data?: Array<{ key: string; value: any }>;
}

// API Service Functions
export const productMutationService = {
  createProduct: async (params: ProductCreateParams): Promise<FloraProduct> => {
    // Use WooCommerce API for product creation
    const response = await apiClient.post<FloraProduct>(ENDPOINTS.PRODUCTS.CREATE, params, 'wc');
    return response.data;
  },

  updateProduct: async (params: ProductUpdateParams): Promise<FloraProduct> => {
    const { id, ...updateData } = params;
    // Use WooCommerce API for product updates
    const response = await apiClient.put<FloraProduct>(ENDPOINTS.PRODUCTS.UPDATE(id), updateData, 'wc');
    return response.data;
  },

  updateProductBlueprintFields: async (productId: number, fields: Record<string, any>): Promise<any> => {
    // Use Portal API endpoint for blueprint field updates
    const response = await fetch(`/api/blueprint-fields/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ fields })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update blueprint fields');
    }

    return response.json();
  },
};

// Mutation Hooks
export const useCreateProductMutation = (
  options?: UseMutationOptions<FloraProduct, Error, ProductCreateParams>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productMutationService.createProduct,
    onSuccess: (data) => {
      // Add the new product to existing queries
      queryClient.setQueriesData({ queryKey: PRODUCT_QUERY_KEYS.lists() }, (old: any) => {
        if (!old?.data) return old;
        
        return {
          ...old,
          data: [data, ...old.data],
          meta: old.meta ? {
            ...old.meta,
            total: old.meta.total + 1
          } : undefined
        };
      });

      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
    },
    ...options,
  });
};

export const useUpdateProductMutation = (
  options?: UseMutationOptions<FloraProduct, Error, ProductUpdateParams>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productMutationService.updateProduct,
    // @ts-ignore - Complex generic type inference issue with TanStack Query
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: PRODUCT_QUERY_KEYS.detail(variables.id) });
      await queryClient.cancelQueries({ queryKey: PRODUCT_QUERY_KEYS.lists() });

      // Snapshot previous values for rollback
      const previousProduct = queryClient.getQueryData(PRODUCT_QUERY_KEYS.detail(variables.id));
      const previousLists = queryClient.getQueriesData({ queryKey: PRODUCT_QUERY_KEYS.lists() });

      // Optimistically update the individual product
      queryClient.setQueryData(PRODUCT_QUERY_KEYS.detail(variables.id), (old: FloraProduct | undefined) => {
        if (!old) return old;
        return { ...old, ...variables };
      });

      // Optimistically update product in lists
      queryClient.setQueriesData({ queryKey: PRODUCT_QUERY_KEYS.lists() }, (old: any) => {
        if (!old?.data) return old;

        return {
          ...old,
          data: old.data.map((product: FloraProduct) => 
            product.id === variables.id 
              ? { ...product, ...variables }
              : product
          )
        };
      });

      return { previousProduct, previousLists };
    },
    onError: (err, variables, context) => {
      // Rollback optimistic updates on error
      if (context?.previousProduct) {
        queryClient.setQueryData(PRODUCT_QUERY_KEYS.detail(variables.id), context.previousProduct);
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch after mutation settles
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.lists() });
    },
    ...options,
  });
};

export const useUpdateProductBlueprintFieldsMutation = (
  options?: UseMutationOptions<any, Error, { productId: number; fields: Record<string, any> }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, fields }) => productMutationService.updateProductBlueprintFields(productId, fields),
    onSuccess: (data, variables) => {
      // Update the product with new blueprint fields
      queryClient.setQueryData(PRODUCT_QUERY_KEYS.detail(variables.productId), (old: FloraProduct | undefined) => {
        if (!old) return old;
        return {
          ...old,
          blueprint_fields: data.fields || old.blueprint_fields
        };
      });

      // Update product in lists
      queryClient.setQueriesData({ queryKey: PRODUCT_QUERY_KEYS.lists() }, (old: any) => {
        if (!old?.data) return old;

        return {
          ...old,
          data: old.data.map((product: FloraProduct) => 
            product.id === variables.productId 
              ? { ...product, blueprint_fields: data.fields || product.blueprint_fields }
              : product
          )
        };
      });

      // Invalidate blueprint-specific queries
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.withBlueprints() });
    },
    ...options,
  });
};
