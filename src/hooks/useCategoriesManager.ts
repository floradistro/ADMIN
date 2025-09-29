'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { categoriesService, WooCategory, CategoryCreateRequest } from '../services/categories-service';

export interface CategoryFormData {
  name: string;
  slug: string;
  parent: number;
  description: string;
  display: 'default' | 'products' | 'subcategories' | 'both';
  image: { id: number; src: string; name: string; alt: string } | null;
  unit: string; // Unit of measurement for products in this category
}

const INITIAL_FORM_DATA: CategoryFormData = {
  name: '',
  slug: '',
  parent: 0,
  description: '',
  display: 'default',
  image: null,
  unit: 'units', // Default unit
};

export function useCategoriesManager() {
  const [categories, setCategories] = useState<WooCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<CategoryFormData>(INITIAL_FORM_DATA);
  const [editingCategory, setEditingCategory] = useState<WooCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCategories = useCallback(async (force = false) => {
    // Don't fetch if we already have categories and it's not forced
    if (!force && categories.length > 0 && !searchTerm) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await categoriesService.getCategories({
        per_page: 100,
        orderby: 'name',
        order: 'asc',
        search: searchTerm || undefined
      });
      
      setCategories(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, categories.length]);

  const createCategory = useCallback(async (data: CategoryCreateRequest) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const result = await categoriesService.createCategory(data);
      
      if (result.success) {
        await fetchCategories(true); // Force refresh after creating
        resetForm();
        return { success: true, data: result.data };
      }
      
      throw new Error(result.error || 'Failed to create category');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create category';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  }, [fetchCategories]);

  const updateCategory = useCallback(async (id: number, data: CategoryCreateRequest) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const result = await categoriesService.updateCategory(id, data);
      
      if (result.success) {
        await fetchCategories(true); // Force refresh after updating
        resetForm();
        return { success: true, data: result.data };
      }
      
      throw new Error(result.error || 'Failed to update category');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update category';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  }, [fetchCategories]);

  const deleteCategory = useCallback(async (id: number, force: boolean = false) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const result = await categoriesService.deleteCategory(id, force);
      
      if (result.success) {
        await fetchCategories(true); // Force refresh after deleting
        return { success: true };
      }
      
      throw new Error(result.error || 'Failed to delete category');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete category';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  }, [fetchCategories]);

  const bulkDeleteCategories = useCallback(async (categoryIds: number[]) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const result = await categoriesService.bulkDeleteCategories(categoryIds);
      
      if (result.success) {
        setSelectedCategories(new Set());
        await fetchCategories();
        return { success: true };
      }
      
      throw new Error('Failed to delete categories');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete categories';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  }, [fetchCategories]);

  const selectCategory = useCallback((id: number) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAllCategories = useCallback(() => {
    if (selectedCategories.size === categories.length) {
      setSelectedCategories(new Set());
    } else {
      setSelectedCategories(new Set(categories.map(cat => cat.id)));
    }
  }, [categories, selectedCategories.size]);

  const startEditCategory = useCallback((category: WooCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      parent: category.parent,
      description: category.description,
      display: category.display,
      image: category.image,
      unit: category.unit || 'units'
    });
  }, []);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setEditingCategory(null);
  }, []);

  const updateFormData = useCallback((updates: Partial<CategoryFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const debouncedSetSearchTerm = useCallback((term: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setSearchTerm(term);
    }, 300); // 300ms debounce
  }, []);

  return {
    // State
    categories,
    loading,
    error,
    selectedCategories,
    searchTerm,
    formData,
    editingCategory,
    isSubmitting,
    
    // Actions
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    bulkDeleteCategories,
    selectCategory,
    selectAllCategories,
    startEditCategory,
    resetForm,
    updateFormData,
    setSearchTerm: debouncedSetSearchTerm,
    setError,
  };
}