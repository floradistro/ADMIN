/**
 * Category Query Hooks using TanStack Query
 * Provides cached, optimized data fetching for categories
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

// Category Types
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  count?: number;
  parent?: number;
  image?: {
    id: number;
    src: string;
    alt: string;
  };
}

export interface CategoryResponse {
  success: boolean;
  data: Category[];
}

// Query Keys
export const CATEGORY_QUERY_KEYS = {
  all: ['categories'] as const,
  lists: () => [...CATEGORY_QUERY_KEYS.all, 'list'] as const,
  list: (params?: Record<string, any>) => [...CATEGORY_QUERY_KEYS.lists(), params] as const,
  details: () => [...CATEGORY_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...CATEGORY_QUERY_KEYS.details(), id] as const,
};

// API Service Functions
const categoryService = {
  getCategories: async (): Promise<CategoryResponse> => {
    try {
      // Try Flora IM API first
      const response = await apiClient.get<CategoryResponse>(ENDPOINTS.CATEGORIES.LIST);
      return response.data;
    } catch (error) {
      // Fallback to WooCommerce API
      try {
        const response = await apiClient.get<Category[]>('/products/categories?per_page=100', {}, 'wc');
        return {
          success: true,
          data: response.data
        };
      } catch (wcError) {
        return {
          success: true,
          data: []
        };
      }
    }
  },

  getCategory: async (id: number): Promise<Category> => {
    try {
      const response = await apiClient.get<Category>(ENDPOINTS.CATEGORIES.GET(id));
      return response.data;
    } catch (error) {
      // Fallback to WooCommerce API
      const response = await apiClient.get<Category>(`/products/categories/${id}`, {}, 'wc');
      return response.data;
    }
  },


};

// Query Hooks
export const useCategoriesQuery = (
  options?: Omit<UseQueryOptions<CategoryResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: CATEGORY_QUERY_KEYS.list(),
    queryFn: () => categoryService.getCategories(),
    staleTime: 15 * 60 * 1000, // 15 minutes (categories change infrequently)
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    retry: 2,
    ...options,
  });
};

export const useCategoryQuery = (
  id: number,
  options?: Omit<UseQueryOptions<Category, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: CATEGORY_QUERY_KEYS.detail(id),
    queryFn: () => categoryService.getCategory(id),
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    retry: 2,
    enabled: !!id,
    ...options,
  });
};


