'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Product } from '../../types';
import { Button, StatusBadge, CategoryTag } from '../ui';
import { useInstantInventory } from '@/hooks/useInstantInventory';
import { BlueprintPricingService, BlueprintPricingData } from '../../services/blueprint-pricing-service';

interface InstantProductItemProps {
  product: Product;
  selectedLocationId?: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onRefresh?: () => void;
}

export const InstantProductItem = React.memo(function InstantProductItem({ 
  product, 
  selectedLocationId, 
  isExpanded, 
  onToggleExpand, 
  onEdit,
  onRefresh 
}: InstantProductItemProps) {
  const [stockUpdates, setStockUpdates] = useState<Record<string, string>>({});
  const [updateMessages, setUpdateMessages] = useState<Record<string, { type: 'success' | 'error', text: string }>>({});
  const [blueprintPricing, setBlueprintPricing] = useState<BlueprintPricingData | null>(null);

  // Initialize inventory state from product data
  const initialInventory = React.useMemo(() => {
    const inventory: Record<string, number> = {};
    if (product.inventory) {
      product.inventory.forEach(inv => {
        const key = `${product.id}-${inv.location_id}`;
        inventory[key] = parseFloat(inv.quantity?.toString() || '0');
      });
    }
    return inventory;
  }, [product.id, product.inventory]);

  const { updateInventory, getQuantity, isUpdatingItem } = useInstantInventory(initialInventory);

  const handleStockUpdate = async (locationId: string, locationName: string) => {
    // Disabled - stock updates now handled by Magic2 plugin

    setUpdateMessages(prev => ({
      ...prev,
      [locationId]: { type: 'error', text: 'Stock updates handled by Magic2 plugin' }
    }));
  };

  const getStockForLocation = (locationId: string): number => {
    return getQuantity(product.id, parseInt(locationId));
  };

  const isLocationUpdating = (locationId: string): boolean => {
    return isUpdatingItem(product.id, parseInt(locationId));
  };

  // Load Blueprint pricing when expanded with delay for smooth animation
  useEffect(() => {
    if (isExpanded && !blueprintPricing) {
      const timeoutId = setTimeout(() => {
        loadBlueprintPricing();
      }, 150); // Allow animation to start before loading data
      
      return () => clearTimeout(timeoutId);
    }
  }, [isExpanded, product.id, blueprintPricing]);

  const loadBlueprintPricing = async () => {
    try {
      const pricingData = await BlueprintPricingService.getBlueprintPricingForProduct(product.id, product);
      setBlueprintPricing(pricingData);
    } catch (error) {

    }
  };

  // Filter inventory for selected location or show all
  const displayInventory = product.inventory?.filter(inv => 
    !selectedLocationId || inv.location_id.toString() === selectedLocationId
  ) || [];

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm duration-200 product-card ${
      isExpanded ? 'ring-2 ring-white/20' : ''
    }`}>
      {/* Product Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            {/* Product Image */}
             <div className="w-32 h-32 flex-shrink-0 shadow-md shadow-black/15">
               {product.image ? (
                 <Image
                   src={product.image}
                   alt={product.name}
                   width={128}
                   height={128}
                   className="w-full h-full object-cover rounded-lg drop-shadow-sm"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-product.png';
                  }}
                />
              ) : (
                <div className="w-full h-full rounded-lg flex items-center justify-center">
                  <span className="text-neutral-400 text-xs">No Image</span>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-base font-normal text-neutral-300 truncate product-name">
                      {product.name}
                    </h3>
                    {product.categories && product.categories.length > 0 && (
                      <span className="text-neutral-600 text-xs bg-neutral-800/50 px-2 py-1 rounded flex-shrink-0">
                        {product.categories[0].name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-sm text-neutral-500 product-text">ID: {product.id}</span>
                    {product.sku && (
                      <span className="text-sm text-neutral-500 product-text">SKU: {product.sku}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <StatusBadge status={product.status as 'fresh' | 'warning' | 'expired'} label={product.status} />
                    {product.categories && product.categories.length > 1 && 
                      product.categories.slice(1).map(cat => (
                        <CategoryTag key={cat.id} category={cat.name} />
                      ))
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpand}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
      </div>

      {/* Inventory Section */}
      {displayInventory.length > 0 && (
        <div className="p-4">
          <h4 className="text-sm font-medium text-white mb-3">Stock Levels</h4>
          <div className="space-y-3">
            {displayInventory.map((inv) => {
              const locationId = inv.location_id.toString();
              const currentStock = getStockForLocation(locationId);
              const isUpdating = isLocationUpdating(locationId);
              const updateMessage = updateMessages[locationId];
              
              return (
                <div key={locationId} className="flex items-center justify-between p-3 border border-white/[0.04] rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <div className="font-medium text-white">
                        {inv.location_name || `Location ${locationId}`}
                      </div>
                      <div className="text-sm text-neutral-500">
                        Current: {currentStock} units
                        {isUpdating && <span className="ml-2 text-blue-600">Updating...</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={stockUpdates[locationId] || ''}
                      onChange={(e) => setStockUpdates(prev => ({
                        ...prev,
                        [locationId]: e.target.value
                      }))}
                      placeholder="New quantity"
                      className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-white/20 focus:border-white/40"
                      disabled={isUpdating}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleStockUpdate(locationId, inv.location_name)}
                      disabled={!stockUpdates[locationId] || isUpdating}
                      className="min-w-[60px]"
                    >
                      {isUpdating ? 'Updating...' : 'Update'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Update Messages */}
          {Object.entries(updateMessages).map(([locationId, message]) => (
            <div
              key={locationId}
              className={`mt-2 p-2 rounded text-sm ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-800' 
                  : 'bg-red-50 text-red-800'
              }`}
            >
              {message.text}
            </div>
          ))}
        </div>
      )}

      {/* Blueprint Fields & Pricing Section - Buttery Smooth Animation */}
      <div 
        className={`overflow-hidden expand-animation smooth-expand ${
          isExpanded && blueprintPricing && blueprintPricing.ruleGroups && blueprintPricing.ruleGroups.length > 0 
            ? 'max-h-[1000px] opacity-100 expanded' 
            : 'max-h-0 opacity-0 collapsed'
        }`}
      >
        <div className="p-4 border-t border-neutral-800/50">
          <div className={`transition-opacity duration-200 ease-out ${
            isExpanded && blueprintPricing ? 'opacity-100 delay-150' : 'opacity-0'
          }`}>
          <h4 className="text-sm font-medium text-neutral-500 mb-3">
            Blueprint Fields & Pricing
          </h4>
          
          {/* Display each pricing rule group */}
          <div className="space-y-3">
            {blueprintPricing?.ruleGroups?.map((ruleGroup, groupIndex) => (
              <div key={groupIndex} className="border border-white/[0.04] rounded p-3">
                <div className="text-neutral-500 text-sm mb-2 flex items-center gap-2">
                  <span>{ruleGroup.ruleName}</span>
                  {ruleGroup.productType && (
                    <span className="text-neutral-600 text-xs">
                      ({ruleGroup.productType})
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {ruleGroup.tiers.map((tier, tierIndex) => (
                    <div key={tierIndex} className="flex justify-between border border-white/[0.04] px-3 py-2 rounded">
                      <span className="text-neutral-500">
                        {tier.label}:
                      </span>
                      <span className="text-neutral-400">${tier.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
});