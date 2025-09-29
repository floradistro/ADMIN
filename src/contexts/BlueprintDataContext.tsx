'use client';

import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { blueprintFieldsService } from '@/services/blueprint-fields-service';

interface BlueprintField {
  field_name: string;
  field_label: string;
  field_type: string;
  field_value?: any;
  is_required?: boolean;
  choices?: any[];
}

interface BlueprintSchema {
  blueprintId: number;
  categoryId: number;
  fields: BlueprintField[];
  lastFetched: number;
}

interface ProductFieldValues {
  productId: number;
  values: Record<string, any>;
  lastFetched: number;
}

interface BlueprintDataContextType {
  // Schema management (shared across products in same category)
  getSchemaForCategory: (categoryId: number) => Promise<BlueprintSchema | null>;
  
  // Product values management
  getProductFieldValues: (productId: number, categoryId: number) => Promise<ProductFieldValues>;
  updateProductFieldValue: (productId: number, fieldName: string, value: any) => void;
  
  // Batch operations
  batchLoadProductFields: (productIds: number[], categoryId: number) => Promise<void>;
  
  // Cache management
  clearCache: () => void;
  getCacheStats: () => { schemas: number; products: number; apiCalls: number };
  
  // Loading states
  isLoading: (productId: number) => boolean;
}

const BlueprintDataContext = createContext<BlueprintDataContextType | undefined>(undefined);

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

export function BlueprintDataProvider({ children }: { children: ReactNode }) {
  // Schema cache - one per category
  const schemaCache = useRef<Map<number, BlueprintSchema>>(new Map());
  
  // Product field values cache
  const productValuesCache = useRef<Map<number, ProductFieldValues>>(new Map());
  
  // Loading states
  const [loadingProducts, setLoadingProducts] = useState<Set<number>>(new Set());
  
  // Track API calls for debugging
  const apiCallCount = useRef(0);
  
  // Pending requests to prevent duplicate calls
  const pendingRequests = useRef<Map<string, Promise<any>>>(new Map());

  // Get schema for a category (cached)
  const getSchemaForCategory = useCallback(async (categoryId: number): Promise<BlueprintSchema | null> => {
    const cacheKey = `schema-${categoryId}`;
    
    // Check cache first
    const cached = schemaCache.current.get(categoryId);
    if (cached && Date.now() - cached.lastFetched < CACHE_TTL) {
      return cached;
    }
    
    // Check if request is already pending
    const pending = pendingRequests.current.get(cacheKey);
    if (pending) {
      return pending;
    }
    
    // Make new request
    const request = (async () => {
      try {
        apiCallCount.current++;
        
        // Get blueprint assignments for this category
        const response = await fetch(`/api/flora/blueprint-assignments?category_id=${categoryId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch blueprint assignments: ${response.status}`);
        }
        
        const assignments = await response.json();
        if (!assignments || assignments.length === 0) {
          return null;
        }
        
        // Get the first assignment's blueprint fields (typically there's one blueprint per category)
        const blueprintId = assignments[0].blueprint_id;
        const fieldsResponse = await fetch(`/api/blueprint-fields/${blueprintId}`);
        
        if (!fieldsResponse.ok) {
          throw new Error(`Failed to fetch blueprint fields: ${fieldsResponse.status}`);
        }
        
        const fieldsData = await fieldsResponse.json();
        
        const schema: BlueprintSchema = {
          blueprintId,
          categoryId,
          fields: fieldsData.fields || [],
          lastFetched: Date.now()
        };
        
        // Cache the schema
        schemaCache.current.set(categoryId, schema);
        
        return schema;
      } catch (error) {
        return null;
      } finally {
        pendingRequests.current.delete(cacheKey);
      }
    })();
    
    pendingRequests.current.set(cacheKey, request);
    return request;
  }, []);

  // Get product field values (with schema)
  const getProductFieldValues = useCallback(async (productId: number, categoryId: number): Promise<ProductFieldValues> => {
    const cacheKey = `product-${productId}`;
    
    // Check cache first
    const cached = productValuesCache.current.get(productId);
    if (cached && Date.now() - cached.lastFetched < CACHE_TTL) {
      return cached;
    }
    
    // Check if request is already pending
    const pending = pendingRequests.current.get(cacheKey);
    if (pending) {
      return pending;
    }
    
    // Make new request
    const request = (async () => {
      try {
        setLoadingProducts(prev => new Set(prev).add(productId));
        apiCallCount.current++;
        
        // Get product-specific field values
        const response = await fetch(`/api/products/${productId}/blueprint-fields`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch product field values: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Extract values into a map
        const values: Record<string, any> = {};
        if (data.success && data.fields) {
          data.fields.forEach((field: any) => {
            values[field.field_name] = field.field_value;
          });
        }
        
        const productValues: ProductFieldValues = {
          productId,
          values,
          lastFetched: Date.now()
        };
        
        // Cache the values
        productValuesCache.current.set(productId, productValues);
        
        return productValues;
      } catch (error) {
        return { productId, values: {}, lastFetched: Date.now() };
      } finally {
        setLoadingProducts(prev => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
        pendingRequests.current.delete(cacheKey);
      }
    })();
    
    pendingRequests.current.set(cacheKey, request);
    return request;
  }, []);

  // Batch load product fields - optimized for multiple products
  const batchLoadProductFields = useCallback(async (productIds: number[], categoryId: number) => {
    
    // First, ensure we have the schema for this category (single call)
    await getSchemaForCategory(categoryId);
    
    // Filter out products that are already cached
    const uncachedProducts = productIds.filter(id => {
      const cached = productValuesCache.current.get(id);
      return !cached || Date.now() - cached.lastFetched >= CACHE_TTL;
    });
    
    if (uncachedProducts.length === 0) {
      return;
    }
    
    
    try {
      // Make a batch API call for all uncached products
      apiCallCount.current++;
      const response = await fetch('/api/products/blueprint-fields/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: uncachedProducts })
      });
      
      if (!response.ok) {
        throw new Error(`Batch load failed: ${response.status}`);
      }
      
      const batchData = await response.json();
      
      // Cache all the results
      if (batchData.products) {
        batchData.products.forEach((productData: any) => {
          const values: Record<string, any> = {};
          if (productData.fields) {
            productData.fields.forEach((field: any) => {
              values[field.field_name] = field.field_value;
            });
          }
          
          productValuesCache.current.set(productData.productId, {
            productId: productData.productId,
            values,
            lastFetched: Date.now()
          });
        });
        
      }
    } catch (error) {
      // Fall back to individual loads
      await Promise.all(uncachedProducts.map(id => getProductFieldValues(id, categoryId)));
    }
  }, [getSchemaForCategory, getProductFieldValues]);

  // Update a single field value (local cache only)
  const updateProductFieldValue = useCallback((productId: number, fieldName: string, value: any) => {
    const cached = productValuesCache.current.get(productId);
    if (cached) {
      cached.values[fieldName] = value;
      productValuesCache.current.set(productId, { ...cached });
    }
  }, []);

  // Clear all caches
  const clearCache = useCallback(() => {
    schemaCache.current.clear();
    productValuesCache.current.clear();
    apiCallCount.current = 0;
  }, []);

  // Get cache statistics
  const getCacheStats = useCallback(() => ({
    schemas: schemaCache.current.size,
    products: productValuesCache.current.size,
    apiCalls: apiCallCount.current
  }), []);

  // Check if a product is loading
  const isLoading = useCallback((productId: number) => {
    return loadingProducts.has(productId);
  }, [loadingProducts]);

  const value: BlueprintDataContextType = {
    getSchemaForCategory,
    getProductFieldValues,
    updateProductFieldValue,
    batchLoadProductFields,
    clearCache,
    getCacheStats,
    isLoading
  };

  return (
    <BlueprintDataContext.Provider value={value}>
      {children}
    </BlueprintDataContext.Provider>
  );
}

export function useBlueprintData() {
  const context = useContext(BlueprintDataContext);
  if (!context) {
    throw new Error('useBlueprintData must be used within BlueprintDataProvider');
  }
  return context;
}
