import { useState, useCallback, useEffect } from 'react';
import { ProductList, ListColumn, ListProduct } from '../types/lists';
import { Product } from '../types';

export function useProductLists() {
  const [lists, setLists] = useState<ProductList[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load lists from localStorage on mount
  useEffect(() => {
    const loadLists = () => {
      try {
        const stored = localStorage.getItem('product_lists');
        if (stored) {
          const parsed = JSON.parse(stored);
          setLists(parsed);
        }
      } catch (err) {
        console.error('Error loading lists:', err);
        setError('Failed to load saved lists');
      }
    };
    loadLists();
  }, []);

  // Save lists to localStorage whenever they change
  const saveLists = useCallback((updatedLists: ProductList[]) => {
    try {
      localStorage.setItem('product_lists', JSON.stringify(updatedLists));
      setLists(updatedLists);
    } catch (err) {
      console.error('Error saving lists:', err);
      setError('Failed to save lists');
    }
  }, []);

  const createList = useCallback((
    name: string,
    description: string,
    products: Product[],
    columns: ListColumn[],
    settings: ProductList['settings']
  ): ProductList => {
    const newList: ProductList = {
      id: `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      products: products.map(p => ({
        productId: p.id,
        productData: p,
        snapshot: extractProductSnapshot(p, columns)
      })),
      columns,
      settings,
      metadata: {
        totalProducts: products.length,
        exportCount: 0
      }
    };

    const updatedLists = [...lists, newList];
    saveLists(updatedLists);
    return newList;
  }, [lists, saveLists]);

  const updateList = useCallback((listId: string, updates: Partial<ProductList>) => {
    const updatedLists = lists.map(list => 
      list.id === listId 
        ? { ...list, ...updates, updatedAt: new Date().toISOString() }
        : list
    );
    saveLists(updatedLists);
  }, [lists, saveLists]);

  const deleteList = useCallback((listId: string) => {
    const updatedLists = lists.filter(list => list.id !== listId);
    saveLists(updatedLists);
  }, [lists, saveLists]);

  const duplicateList = useCallback((listId: string) => {
    const listToDuplicate = lists.find(l => l.id === listId);
    if (!listToDuplicate) return;

    const newList: ProductList = {
      ...listToDuplicate,
      id: `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${listToDuplicate.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        ...listToDuplicate.metadata,
        exportCount: 0,
        lastExported: undefined
      }
    };

    const updatedLists = [...lists, newList];
    saveLists(updatedLists);
    return newList;
  }, [lists, saveLists]);

  const getList = useCallback((listId: string) => {
    return lists.find(l => l.id === listId);
  }, [lists]);

  const recordExport = useCallback((listId: string) => {
    const updatedLists = lists.map(list => 
      list.id === listId 
        ? { 
            ...list, 
            metadata: {
              ...list.metadata!,
              lastExported: new Date().toISOString(),
              exportCount: (list.metadata?.exportCount || 0) + 1
            }
          }
        : list
    );
    saveLists(updatedLists);
  }, [lists, saveLists]);

  return {
    lists,
    loading,
    error,
    createList,
    updateList,
    deleteList,
    duplicateList,
    getList,
    recordExport
  };
}

function extractProductSnapshot(product: Product, columns: ListColumn[]): Record<string, any> {
  const snapshot: Record<string, any> = {};
  
  columns.forEach(column => {
    if (column.accessor) {
      const keys = column.accessor.split('.');
      let value: any = product;
      for (const key of keys) {
        value = value?.[key];
      }
      snapshot[column.field] = value;
    } else {
      snapshot[column.field] = (product as any)[column.field];
    }
  });

  return snapshot;
}

