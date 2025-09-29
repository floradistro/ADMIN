import { useState, useCallback } from 'react';

export interface PaginationState {
  currentPage: number;
  hasMore: boolean;
  totalItems: number;
  itemsPerPage: number;
  isLoading: boolean;
}

export function usePagination(initialItemsPerPage: number = 20) {
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  const [isLoading, setIsLoading] = useState(false);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const nextPage = useCallback(() => {
    if (hasMore && !isLoading) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasMore, isLoading]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const reset = useCallback(() => {
    setCurrentPage(1);
    setHasMore(true);
    setTotalItems(0);
  }, []);

  const updatePagination = useCallback((meta: {
    total?: number;
    pages?: number;
    current_page?: number;
    per_page?: number;
  }) => {
    if (meta.total !== undefined) {
      setTotalItems(meta.total);
    }
    if (meta.pages !== undefined && meta.current_page !== undefined) {
      setHasMore(meta.current_page < meta.pages);
    }
    if (meta.per_page !== undefined) {
      setItemsPerPage(meta.per_page);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      nextPage();
    }
  }, [hasMore, isLoading, nextPage]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return {
    // State
    currentPage,
    hasMore,
    totalItems,
    itemsPerPage,
    isLoading,
    totalPages,
    
    // Actions
    goToPage,
    nextPage,
    prevPage,
    reset,
    loadMore,
    setIsLoading,
    setHasMore,
    setTotalItems,
    setItemsPerPage,
    updatePagination,
  };
}
