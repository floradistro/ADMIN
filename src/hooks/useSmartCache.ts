/**
 * Smart Caching Hook
 * Provides advanced caching features like prefetching, background refresh, and stale-while-revalidate
 */

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { PRODUCT_QUERY_KEYS, LOCATION_QUERY_KEYS, CATEGORY_QUERY_KEYS } from '@/services/queries';
import type { FloraFilterParams } from '@/services';

export const useSmartCache = () => {
  const queryClient = useQueryClient();

  // Prefetch products based on likely user navigation
  const prefetchProducts = useCallback(async (filters?: FloraFilterParams) => {
    await queryClient.prefetchQuery({
      queryKey: PRODUCT_QUERY_KEYS.list(filters),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  }, [queryClient]);

  // Prefetch locations (usually needed after products)
  const prefetchLocations = useCallback(async () => {
    await queryClient.prefetchQuery({
      queryKey: LOCATION_QUERY_KEYS.list(),
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  }, [queryClient]);

  // Prefetch categories
  const prefetchCategories = useCallback(async () => {
    await queryClient.prefetchQuery({
      queryKey: CATEGORY_QUERY_KEYS.list(),
      staleTime: 15 * 60 * 1000, // 15 minutes
    });
  }, [queryClient]);

  // Background refresh - silently update data without showing loading states
  const backgroundRefresh = useCallback(async (queryKeys: string[][]) => {
    const promises = queryKeys.map(queryKey => 
      queryClient.refetchQueries({ 
        queryKey,
        type: 'active' // Only refetch active queries
      })
    );
    
    await Promise.all(promises);
  }, [queryClient]);

  // Invalidate related queries when data changes
  const invalidateRelatedQueries = useCallback((type: 'products' | 'locations' | 'categories') => {
    switch (type) {
      case 'products':
        queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
        break;
      case 'locations':
        queryClient.invalidateQueries({ queryKey: LOCATION_QUERY_KEYS.all });
        break;
      case 'categories':
        queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEYS.all });
        break;
    }
  }, [queryClient]);

  // Smart prefetching based on user behavior
  const smartPrefetch = useCallback(async (context: {
    currentPage?: string;
    userRole?: string;
    recentlyViewed?: string[];
  }) => {
    const { currentPage, userRole, recentlyViewed } = context;

    // Prefetch based on current page
    if (currentPage === 'inventory') {
      await Promise.all([
        prefetchProducts(),
        prefetchLocations(),
        prefetchCategories()
      ]);
    } else if (currentPage === 'products') {
      await prefetchProducts();
      // If user frequently views categories, prefetch them too
      if (recentlyViewed?.includes('categories')) {
        await prefetchCategories();
      }
    }

    // Role-based prefetching
    if (userRole === 'admin' || userRole === 'manager') {
      // Admins often need location data
      await prefetchLocations();
    }
  }, [prefetchProducts, prefetchLocations, prefetchCategories]);

  // Cache warming - populate cache with essential data
  const warmCache = useCallback(async () => {
    await Promise.all([
      prefetchLocations(), // Locations are needed everywhere
      prefetchCategories(), // Categories are used for filtering
      prefetchProducts({ per_page: -1 }) // Load all products
    ]);
  }, [prefetchProducts, prefetchLocations, prefetchCategories]);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    const stats = {
      totalQueries: queries.length,
      freshQueries: queries.filter(q => q.state.dataUpdatedAt > Date.now() - 5 * 60 * 1000).length,
      staleQueries: queries.filter(q => q.isStale()).length,
      errorQueries: queries.filter(q => q.state.error).length,
      cacheSize: JSON.stringify(cache).length, // Rough estimate
    };

    return stats;
  }, [queryClient]);

  // Clear specific cache entries
  const clearCache = useCallback((type?: 'products' | 'locations' | 'categories' | 'all') => {
    if (!type || type === 'all') {
      queryClient.clear();
      return;
    }

    switch (type) {
      case 'products':
        queryClient.removeQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
        break;
      case 'locations':
        queryClient.removeQueries({ queryKey: LOCATION_QUERY_KEYS.all });
        break;
      case 'categories':
        queryClient.removeQueries({ queryKey: CATEGORY_QUERY_KEYS.all });
        break;
    }
  }, [queryClient]);

  // Optimistic cache updates
  const optimisticUpdate = useCallback(<T>(
    queryKey: string[],
    updateFn: (oldData: T) => T
  ) => {
    queryClient.setQueryData(queryKey, updateFn);
  }, [queryClient]);

  return {
    prefetchProducts,
    prefetchLocations,
    prefetchCategories,
    backgroundRefresh,
    invalidateRelatedQueries,
    smartPrefetch,
    warmCache,
    getCacheStats,
    clearCache,
    optimisticUpdate,
  };
};
