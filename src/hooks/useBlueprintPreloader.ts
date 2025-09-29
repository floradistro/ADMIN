import { useEffect, useRef } from 'react';
import { useBlueprintData } from '@/contexts/BlueprintDataContext';

interface Product {
  id: number;
  categories?: Array<{ id: number; name: string }>;
}

/**
 * Hook to preload blueprint data for visible products
 * This dramatically reduces API calls by batch loading all visible products at once
 */
export function useBlueprintPreloader(
  products: Product[],
  isExpanded: boolean = false,
  debounceMs: number = 300
) {
  const { batchLoadProductFields, getCacheStats } = useBlueprintData();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastLoadedRef = useRef<string>('');

  useEffect(() => {
    // Only preload if we have expanded view (blueprint fields are visible)
    if (!isExpanded || !products || products.length === 0) {
      return;
    }

    // Create a unique key for this set of products
    const loadKey = products.map(p => p.id).sort().join(',');
    
    // Skip if we already loaded this exact set
    if (loadKey === lastLoadedRef.current) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce the load to avoid rapid successive calls
    timeoutRef.current = setTimeout(async () => {
      
      // Group products by category for efficient loading
      const productsByCategory = new Map<number, number[]>();
      
      products.forEach(product => {
        const categoryId = product.categories?.[0]?.id;
        if (categoryId) {
          const existing = productsByCategory.get(categoryId) || [];
          existing.push(product.id);
          productsByCategory.set(categoryId, existing);
        }
      });

      // Load each category's products in parallel
      const loadPromises = Array.from(productsByCategory.entries()).map(
        ([categoryId, productIds]) => batchLoadProductFields(productIds, categoryId)
      );

      await Promise.all(loadPromises);
      
      // Update last loaded key
      lastLoadedRef.current = loadKey;
      
      // Log cache statistics
      const stats = getCacheStats();
    }, debounceMs);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [products, isExpanded, batchLoadProductFields, getCacheStats, debounceMs]);
}
