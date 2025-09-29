import { useState, useCallback } from 'react';
import { Product } from '../types';

export interface BulkActionsState {
  selectedProducts: Set<number>;
  isSelectAllChecked: boolean;
  isIndeterminate: boolean;
}

export function useBulkActions(products: Product[] = []) {
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());

  const isSelectAllChecked = selectedProducts.size === products.length && products.length > 0;
  const isIndeterminate = selectedProducts.size > 0 && selectedProducts.size < products.length;

  const toggleProductSelection = useCallback((productId: number) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  }, []);

  const selectAllProducts = useCallback(() => {
    if (isSelectAllChecked) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)));
    }
  }, [products, isSelectAllChecked]);

  const clearSelection = useCallback(() => {
    setSelectedProducts(new Set());
  }, []);

  const selectProducts = useCallback((productIds: number[]) => {
    setSelectedProducts(new Set(productIds));
  }, []);

  const getSelectedProducts = useCallback(() => {
    return products.filter(product => selectedProducts.has(product.id));
  }, [products, selectedProducts]);

  const bulkExpandCollapse = useCallback((
    expand: boolean,
    onBulkExpandCollapse: (ids: number[], expand: boolean) => void
  ) => {
    const selectedProductIds = Array.from(selectedProducts);
    if (selectedProductIds.length > 0) {
      onBulkExpandCollapse(selectedProductIds, expand);
    }
  }, [selectedProducts]);

  const executeBulkAction = useCallback((
    action: string,
    onBulkAction: (action: string, products: Product[]) => void
  ) => {
    const selectedProductsList = getSelectedProducts();
    if (selectedProductsList.length > 0) {
      onBulkAction(action, selectedProductsList);
    }
  }, [getSelectedProducts]);

  return {
    selectedProducts,
    isSelectAllChecked,
    isIndeterminate,
    toggleProductSelection,
    selectAllProducts,
    clearSelection,
    selectProducts,
    getSelectedProducts,
    bulkExpandCollapse,
    executeBulkAction,
    setSelectedProducts,
  };
}
