'use client';

import React from 'react';
import { Product } from '../../types';
import { InstantProductItem } from './InstantProductItem';

interface InstantProductListProps {
  products: Product[];
  selectedLocationId?: string;
  expandedItems: Set<number>;
  onToggleExpand: (productId: number) => void;
  onEditProduct: (product: Product) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function InstantProductList({
  products,
  selectedLocationId,
  expandedItems,
  onToggleExpand,
  onEditProduct,
  onRefresh,
  isLoading = false
}: InstantProductListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="animate-pulse">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-white/[0.08] rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-white/[0.08] rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-white/[0.08] rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-white/[0.08] rounded w-1/4"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-neutral-500 mb-4">
          <svg className="mx-auto h-12 w-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-4.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No products found</h3>
        <p className="text-neutral-500">Try adjusting your search or filter criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {products.map((product) => (
        <InstantProductItem
          key={product.id}
          product={product}
          selectedLocationId={selectedLocationId}
          isExpanded={expandedItems.has(product.id)}
          onToggleExpand={() => onToggleExpand(product.id)}
          onEdit={() => onEditProduct(product)}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}