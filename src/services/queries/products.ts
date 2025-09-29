/**
 * Product Query Hooks using TanStack Query
 * Provides cached, optimized data fetching for products
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import type { FloraProduct, FloraFilterParams, FloraApiResponse } from '../inventory-service';

// Query Keys
export const PRODUCT_QUERY_KEYS = {
  all: ['products'] as const,
  lists: () => [...PRODUCT_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: FloraFilterParams) => [...PRODUCT_QUERY_KEYS.lists(), filters] as const,
  details: () => [...PRODUCT_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...PRODUCT_QUERY_KEYS.details(), id] as const,
  withBlueprints: (filters?: FloraFilterParams) => [...PRODUCT_QUERY_KEYS.lists(), 'blueprints', filters] as const,
};

// API Service Functions
export const productService = {
  getProducts: async (filters: FloraFilterParams = {}): Promise<FloraApiResponse<FloraProduct[]>> => {
    const params = new URLSearchParams();
    
    // Map filters to API parameters
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.per_page) params.append('per_page', filters.per_page.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.location_id) params.append('location_id', filters.location_id.toString());
    if (filters.stock_status) params.append('stock_status', filters.stock_status);
    if (filters.product_type) params.append('product_type', filters.product_type);
    if (filters.sku) params.append('sku', filters.sku);
    if (filters.orderby) params.append('orderby', filters.orderby);
    if (filters.order) params.append('order', filters.order);
    if (filters.aggregate_by_parent) params.append('aggregate_by_parent', 'true');
    
    // Add cache-busting parameter
    params.append('_t', Date.now().toString());

    const endpoint = `${ENDPOINTS.PRODUCTS.LIST}?${params}`;
    const response = await apiClient.get<FloraApiResponse<FloraProduct[]>>(endpoint);
    return response.data;
  },

  getProduct: async (id: number): Promise<FloraProduct> => {
    const response = await apiClient.get<FloraProduct>(ENDPOINTS.PRODUCTS.GET(id));
    return response.data;
  },

  getProductsWithBlueprints: async (filters: FloraFilterParams = {}): Promise<FloraApiResponse<FloraProduct[]>> => {
    const params = new URLSearchParams();
    
    // Map filters to API parameters
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.per_page) params.append('per_page', filters.per_page.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.location_id) params.append('location_id', filters.location_id.toString());
    if (filters.stock_status) params.append('stock_status', filters.stock_status);
    if (filters.product_type) params.append('product_type', filters.product_type);
    if (filters.sku) params.append('sku', filters.sku);
    if (filters.orderby) params.append('orderby', filters.orderby);
    if (filters.order) params.append('order', filters.order);
    if (filters.aggregate_by_parent) params.append('aggregate_by_parent', 'true');
    
    // Include blueprint fields
    params.append('include_blueprint_fields', 'true');
    params.append('_t', Date.now().toString());

    const endpoint = `${ENDPOINTS.PRODUCTS.LIST}?${params}`;
    const response = await apiClient.get<FloraApiResponse<FloraProduct[]>>(endpoint);
    return response.data;
  },
};

// Query Hooks
export const useProductsQuery = (
  filters?: FloraFilterParams,
  options?: Omit<UseQueryOptions<FloraApiResponse<FloraProduct[]>, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.list(filters),
    queryFn: () => productService.getProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    retry: 2,
    ...options,
  });
};

export const useProductQuery = (
  id: number,
  options?: Omit<UseQueryOptions<FloraProduct, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.detail(id),
    queryFn: () => productService.getProduct(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    enabled: !!id,
    ...options,
  });
};

export const useProductsWithBlueprintsQuery = (
  filters?: FloraFilterParams,
  options?: Omit<UseQueryOptions<FloraApiResponse<FloraProduct[]>, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.withBlueprints(filters),
    queryFn: () => productService.getProductsWithBlueprints(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    ...options,
  });
};
