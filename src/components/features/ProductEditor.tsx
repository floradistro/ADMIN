'use client';

import React, { useState, useEffect } from 'react';
import { Product, TabType, TabConfig, BlueprintFieldValue } from '../../types';
import { Input } from '../ui';
import { EditableFields } from '../ui/EditableFields';
import { InventoryInitializer } from './InventoryInitializer';
import { inventoryService } from '../../services/inventory-service';

interface ProductEditorProps {
  product: Product;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabConfigs: TabConfig[] = [
  { 
    id: 'basic', 
    title: 'Basic Info',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    )
  },
  { 
    id: 'blueprints', 
    title: 'Blueprint Fields',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  { 
    id: 'pricing', 
    title: 'Pricing',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>
    )
  },
  { 
    id: 'locations', 
    title: 'Locations',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  }
];

export function ProductEditor({ product, activeTab, onTabChange }: ProductEditorProps) {
  const [blueprintFields, setBlueprintFields] = useState<BlueprintFieldValue[]>([]);
  const [productWithBlueprints, setProductWithBlueprints] = useState<any>(null);
  const [isLoadingBlueprints, setIsLoadingBlueprints] = useState(false);

  // Fetch blueprint data when product changes or blueprints tab is selected
  useEffect(() => {
    if (activeTab === 'blueprints' && product.id) {
      // Always fetch when switching to blueprints tab or product changes
      fetchBlueprintData();
    }
  }, [activeTab, product.id]);

  const fetchBlueprintData = async (forceRefresh = false) => {
    // Skip if already loading, unless it's a force refresh
    if (isLoadingBlueprints && !forceRefresh) return;
    
    setIsLoadingBlueprints(true);
    try {
      // Get product with blueprint fields from Flora Fields API
      const productData = await inventoryService.getProductWithBlueprintFields(product.id);
      setProductWithBlueprints(productData);

      // Set blueprint fields
      if (productData.blueprint_fields) {
        setBlueprintFields(productData.blueprint_fields);
      } else {
        setBlueprintFields([]);
      }
    } catch (error) {
      // Fallback to product.blueprint_fields if available
      if (product.blueprint_fields) {
        setBlueprintFields(product.blueprint_fields);
      }
    } finally {
      setIsLoadingBlueprints(false);
    }
  };



  return (
    <div className="product-card">
      {/* Icon-based Tabs */}
      <div className="flex border-b border-white/[0.1] bg-neutral-900/30">
        {tabConfigs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-3 border-r border-white/[0.1] smooth-hover flex items-center justify-center ${
              activeTab === tab.id
                ? 'bg-black text-neutral-400 border-b-2 border-neutral-600 shadow-lg'
                : 'text-neutral-500 hover:text-neutral-400 hover:bg-white/[0.05]'
            }`}
            title={tab.title}
          >
            {tab.icon}
          </button>
        ))}
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-auto p-2">
        {activeTab === 'basic' && (
          <div className="space-y-4 font-mono text-sm">
            <Input
              label="Name:"
              type="text"
              value={product.name || ''}
              readOnly
            />
            
            <Input
              label="SKU:"
              type="text"
              value={product.sku || ''}
              readOnly
            />

            <div>
              <label className="block text-neutral-500 mb-1">Categories:</label>
              <div className="w-full bg-neutral-950/40 border border-neutral-800/40 rounded px-3 py-2 text-neutral-400">
                {product.categories?.map(cat => cat.name).join(', ') || 'No categories'}
              </div>
            </div>

            <div>
              <label className="block text-neutral-500 mb-1">Description:</label>
              <textarea
                value={product.description || ''}
                readOnly
                rows={4}
                className="w-full bg-neutral-950/40 border border-neutral-800/40 rounded px-3 py-2 text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-neutral-500 mb-1">Short Description:</label>
              <textarea
                value={product.short_description || ''}
                readOnly
                rows={2}
                className="w-full bg-neutral-950/40 border border-neutral-800/40 rounded px-3 py-2 text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Total Stock:"
                type="number"
                value={product.total_stock?.toString() || '0'}
                readOnly
              />
              <Input
                label="Product Type:"
                type="text"
                value={product.type || ''}
                readOnly
              />
            </div>
          </div>
        )}

        {activeTab === 'blueprints' && (
          <div className="space-y-4 font-mono text-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="text-neutral-500">
                Blueprint Fields {blueprintFields.length > 0 && `(${blueprintFields.length} fields)`}
              </div>
              {isLoadingBlueprints && (
                <div className="text-xs text-neutral-600">Loading blueprint data...</div>
              )}
            </div>
            
            {isLoadingBlueprints ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-neutral-500">Loading blueprint fields...</div>
              </div>
            ) : blueprintFields.length > 0 ? (
              <div className="text-center py-8">
                <div className="text-neutral-500 mb-2">Blueprint fields - Coming Soon</div>
                <p className="text-xs text-neutral-600">Blueprint fields functionality will be available soon</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-neutral-500 mb-2">No blueprint fields found</div>
                <div className="text-xs text-neutral-600">
                  This product may not have blueprint fields assigned, or they may not be accessible via the Flora Fields API.
                </div>
                <div className="text-xs text-neutral-600 mt-2">
                  Categories: {product.categories?.map(cat => cat.name).join(', ') || 'None'}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="space-y-3 font-mono text-xs">
            <div className="text-neutral-500 mb-3 text-xs">Pricing Information</div>
            <Input
              label="Regular Price:"
              type="text"
              value={product.regular_price || ''}
              readOnly
              className="text-xs"
            />
          </div>
        )}

        {activeTab === 'locations' && (
          <div className="space-y-4 font-mono text-xs">
            <div className="text-neutral-500 mb-3 text-xs">Location Inventory</div>
            <div className="space-y-2">
              {product.inventory?.map((location, index) => (
                <div key={index} className="p-2 bg-neutral-950/40 border border-neutral-800/40 rounded">
                  <div className="text-neutral-400 text-xs">
                    {location.location_name}: {location.stock} units
                    {!location.manage_stock && <span className="text-neutral-500"> (not managed)</span>}
                  </div>
                </div>
              )) || (
                <div className="text-center py-4 text-neutral-500 text-xs">
                  No location inventory data available
                </div>
              )}
            </div>
            
            {/* Auto Inventory Initializer */}
            <div className="border-t border-neutral-800/40 pt-4 mt-4">
              <div className="text-neutral-500 mb-3 text-xs">Auto Inventory Setup</div>
              <InventoryInitializer
                productId={product.id}
                productName={product.name}
                onSuccess={() => {
                  // You could add a callback here to refresh product data
                }}
                className="bg-neutral-900/20 p-3 rounded border border-neutral-800/20"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}