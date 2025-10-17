'use client';

import React, { createContext, useContext, ReactNode, useState } from 'react';
import { ProductList, ListColumn } from '../types/lists';
import { Product } from '../types';
import { useProductLists } from '../hooks/useProductLists';

interface ListContextType {
  // State
  lists: ProductList[];
  selectedList: ProductList | null;
  isCreatingList: boolean;
  isViewingLists: boolean;
  loading: boolean;
  error: string | null;

  // Actions
  createList: (
    name: string,
    description: string,
    products: Product[],
    columns: ListColumn[],
    settings: ProductList['settings']
  ) => ProductList;
  updateList: (listId: string, updates: Partial<ProductList>) => void;
  deleteList: (listId: string) => void;
  duplicateList: (listId: string) => ProductList | undefined;
  selectList: (listId: string | null) => void;
  setIsCreatingList: (value: boolean) => void;
  setIsViewingLists: (value: boolean) => void;
  getList: (listId: string) => ProductList | undefined;
  recordExport: (listId: string) => void;
}

const ListContext = createContext<ListContextType | undefined>(undefined);

interface ListProviderProps {
  children: ReactNode;
}

export function ListProvider({ children }: ListProviderProps) {
  const listHook = useProductLists();
  const [selectedList, setSelectedList] = useState<ProductList | null>(null);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [isViewingLists, setIsViewingLists] = useState(false);

  const selectList = (listId: string | null) => {
    if (listId) {
      const list = listHook.getList(listId);
      setSelectedList(list || null);
    } else {
      setSelectedList(null);
    }
  };

  return (
    <ListContext.Provider
      value={{
        ...listHook,
        selectedList,
        isCreatingList,
        isViewingLists,
        selectList,
        setIsCreatingList,
        setIsViewingLists,
      }}
    >
      {children}
    </ListContext.Provider>
  );
}

export function useListContext() {
  const context = useContext(ListContext);
  if (context === undefined) {
    throw new Error('useListContext must be used within a ListProvider');
  }
  return context;
}

