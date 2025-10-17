'use client';

import React, { useState, useEffect } from 'react';
import { productAPI } from '../../services/product-api';

interface PriceTier {
  qty?: number;
  weight?: string;
  quantity?: number;
  price: number;
  min_qty?: number;
  max_qty?: number | null;
  discount_percent?: number;
}

interface ProductPricingTiersProps {
  productId: number;
  compact?: boolean;
}

export function ProductPricingTiers({ productId, compact = false }: ProductPricingTiersProps) {
  const [pricing, setPricing] = useState<{
    base_price: number;
    quantity_tiers: PriceTier[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    loadPricing();
  }, [productId]);

  const loadPricing = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productAPI.getPricing(productId);
      if (data) {
        setPricing({
          base_price: data.base_price,
          quantity_tiers: data.quantity_tiers
        });
      }
    } catch (err) {
      console.error('Failed to load pricing:', err);
      setError('Failed to load pricing');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-neutral-800 rounded w-24 mb-2"></div>
        <div className="h-3 bg-neutral-800 rounded w-32"></div>
      </div>
    );
  }

  if (error || !pricing) {
    return null;
  }

  // Calculate actual prices from discount percentages
  const calculatePrice = (basePrice: number, discountPercent: number) => {
    return basePrice * (1 - discountPercent / 100);
  };

  if (!pricing.quantity_tiers || pricing.quantity_tiers.length === 0) {
    return (
      <div className="text-neutral-600 text-xs">
        Price: ${pricing.base_price?.toFixed(2) || '0.00'}
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-1">
        <div className="text-neutral-500 text-xs font-medium">Pricing Tiers</div>
        <div className="grid grid-cols-2 gap-1">
          {pricing.quantity_tiers.slice(0, 4).map((tier, index) => {
            const price = tier.price ?? calculatePrice(pricing.base_price, tier.discount_percent || 0);
            const label = tier.weight || (tier.qty ? `${tier.qty}x` : (tier.min_qty ? `${tier.min_qty}+` : 'Tier'));
            return (
              <div key={index} className="text-xs text-neutral-600">
                {label}: ${price.toFixed(2)}
              </div>
            );
          })}
        </div>
        {pricing.quantity_tiers.length > 4 && (
          <div className="text-neutral-700 text-xs">
            +{pricing.quantity_tiers.length - 4} more
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-neutral-500 font-medium text-xs">Pricing Tiers</div>
      <div className="space-y-1">
        {pricing.quantity_tiers.map((tier, index) => {
          // Handle both formats: actual prices OR discount percentages
          const price = tier.price ?? calculatePrice(pricing.base_price, tier.discount_percent || 0);
          
          // Determine label
          let label = '';
          if (tier.weight) {
            label = tier.weight;
          } else if (tier.qty) {
            label = `${tier.qty} unit${tier.qty > 1 ? 's' : ''}`;
          } else if (tier.min_qty) {
            label = `${tier.min_qty}${tier.max_qty ? `-${tier.max_qty}` : '+'} units`;
          } else {
            label = `Tier ${index + 1}`;
          }
          
          return (
            <div 
              key={index} 
              className="flex justify-between items-center text-xs border border-white/[0.04] rounded p-2"
            >
              <div className="text-neutral-600 font-medium">{label}</div>
              <div className="flex items-center gap-2">
                {(tier.discount_percent || 0) > 0 && (
                  <span className="text-green-500 text-xs">-{tier.discount_percent}%</span>
                )}
                <span className="text-neutral-400 font-medium">${price.toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

