'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface CategoryFields {
  category_id: number;
  category_name: string;
  assigned_fields: Record<string, any>;
  field_count: number;
}

interface FieldsContextValue {
  categoryFields: Map<number, CategoryFields>;
  loadCategoryFields: (categoryId: number) => Promise<void>;
  updateCategoryFields: (categoryId: number, fields: Record<string, any>) => Promise<void>;
  getCategoryFields: (categoryId: number) => CategoryFields | null;
}

const FieldsContext = createContext<FieldsContextValue | undefined>(undefined);

export function FieldsProvider({ children }: { children: ReactNode }) {
  const [categoryFields, setCategoryFields] = useState<Map<number, CategoryFields>>(new Map());

  const loadCategoryFields = useCallback(async (categoryId: number) => {
    try {
      const res = await fetch(`/api/flora/categories/${categoryId}/fields?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (res.ok) {
        const data = await res.json();
        setCategoryFields(prev => {
          const newMap = new Map(prev);
          newMap.set(categoryId, {
            category_id: parseInt(data.category_id),
            category_name: data.category_name,
            assigned_fields: data.assigned_fields || {},
            field_count: data.field_count || 0
          });
          return newMap;
        });
      }
    } catch (error) {
      console.error('Failed to load category fields:', error);
    }
  }, []);

  const updateCategoryFields = useCallback(async (categoryId: number, fields: Record<string, any>) => {
    try {
      const res = await fetch(`/api/flora/categories/${categoryId}/fields?_update=${Date.now()}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ assigned_fields: fields })
      });

      if (res.ok) {
        // Immediately reload this category's fields
        await loadCategoryFields(categoryId);
        
        // Trigger global refresh for products
        window.dispatchEvent(new CustomEvent('categoryFieldsUpdated', {
          detail: { categoryId }
        }));
      }
    } catch (error) {
      console.error('Failed to update category fields:', error);
      throw error;
    }
  }, [loadCategoryFields]);

  const getCategoryFields = useCallback((categoryId: number) => {
    return categoryFields.get(categoryId) || null;
  }, [categoryFields]);

  return (
    <FieldsContext.Provider value={{
      categoryFields,
      loadCategoryFields,
      updateCategoryFields,
      getCategoryFields
    }}>
      {children}
    </FieldsContext.Provider>
  );
}

export function useFields() {
  const context = useContext(FieldsContext);
  if (!context) {
    throw new Error('useFields must be used within FieldsProvider');
  }
  return context;
}

