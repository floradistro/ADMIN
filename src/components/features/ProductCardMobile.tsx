'use client';

import React from 'react';
import Image from 'next/image';
import { Product } from '../../types';

interface ProductCardMobileProps {
  product: Product;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  selectedLocationId?: string;
}

export function ProductCardMobile({
  product,
  isSelected,
  onSelect,
  onEdit,
  selectedLocationId
}: ProductCardMobileProps) {
  // Get stock info
  const getStockInfo = () => {
    if (!selectedLocationId || !product.inventory) {
      const totalStock = product.inventory?.reduce((sum, item) => 
        sum + (item.quantity || item.stock || 0), 0) || 0;
      return {
        quantity: totalStock,
        location: `${product.inventory?.length || 0} locations`
      };
    }
    
    const locationItem = product.inventory.find(
      item => item.location_id?.toString() === selectedLocationId
    );
    
    return {
      quantity: locationItem?.quantity || locationItem?.stock || 0,
      location: locationItem?.location_name || 'Unknown'
    };
  };

  const stock = getStockInfo();
  const hasLowStock = stock.quantity > 0 && stock.quantity < 10;
  const isOutOfStock = stock.quantity === 0;

  return (
    <div 
      className={`relative bg-neutral-800/40 rounded-2xl overflow-hidden transition-all active:scale-[0.98] ${
        isSelected ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/20' : ''
      }`}
    >
      {/* Selection Checkbox - Top Left */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        className="absolute top-3 left-3 z-10 w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-95"
        style={{
          background: isSelected ? '#3b82f6' : 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(10px)'
        }}
      >
        {isSelected && (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Main Content */}
      <div onClick={onEdit} className="p-4">
        <div className="flex gap-4">
          {/* Product Image */}
          <div className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-neutral-800/60 border border-white/[0.06]">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-10 h-10 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            {/* Product Name */}
            <h3 className="text-white font-semibold text-[15px] leading-snug mb-1.5 line-clamp-2">
              {product.name}
            </h3>

            {/* Category */}
            {product.categories && product.categories.length > 0 && (
              <div className="flex items-center gap-1.5 mb-2">
                <span className="inline-flex items-center px-2.5 py-1 bg-white/[0.06] rounded-lg text-[12px] text-neutral-400 font-medium">
                  {product.categories[0].name}
                </span>
              </div>
            )}

            {/* Stock Badge */}
            <div className="flex items-center gap-2 mt-auto">
              <div className={`inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-semibold ${
                isOutOfStock 
                  ? 'bg-red-500/15 text-red-400' 
                  : hasLowStock 
                    ? 'bg-yellow-500/15 text-yellow-400'
                    : 'bg-green-500/15 text-green-400'
              }`}>
                <span className="text-[15px]">{Math.floor(stock.quantity)}</span>
                <span className="ml-1.5 text-[12px] opacity-75">units</span>
              </div>
            </div>
          </div>
        </div>

        {/* Location Info - Bottom */}
        <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center justify-between">
          <div className="flex items-center gap-2 text-neutral-500 text-[13px]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-medium">{stock.location}</span>
          </div>

          {/* Price */}
          {product.price && (
            <div className="text-white text-[15px] font-bold">
              ${Number(product.price).toFixed(2)}
            </div>
          )}
        </div>
      </div>

      {/* Action Indicator - Chevron */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2">
        <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}
