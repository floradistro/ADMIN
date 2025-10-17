'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../../ui';
import { productAPI } from '../../../services/product-api';

interface CategoryFieldAssignment {
  category_id: number;
  category_name: string;
  assigned_fields: Record<string, FieldConfig>;
  field_count: number;
}

interface FieldConfig {
  label: string;
  type: string;
  group?: string;
  required: boolean;
  order: number;
  config?: any;
}

interface PricingTemplate {
  category_name: string;
  tiers: Array<{
    qty?: number;
    weight?: string;
    price: number;
  }>;
}

const PRICING_TEMPLATES: Record<string, PricingTemplate> = {
  flower: {
    category_name: 'Flower',
    tiers: [
      { weight: '1g', qty: 1, price: 14.99 },
      { weight: '3.5g', qty: 3.5, price: 39.99 },
      { weight: '7g', qty: 7, price: 69.99 },
      { weight: '14g', qty: 14, price: 109.99 },
      { weight: '28g', qty: 28, price: 199.99 }
    ]
  },
  edibles: {
    category_name: 'Edibles',
    tiers: [
      { qty: 1, price: 29.99 },
      { qty: 2, price: 49.99 },
      { qty: 3, price: 74.99 },
      { qty: 4, price: 89.99 }
    ]
  },
  concentrate: {
    category_name: 'Concentrate',
    tiers: [
      { weight: '1g', qty: 1, price: 34.99 },
      { weight: '2g', qty: 2, price: 59.99 },
      { weight: '3g', qty: 3, price: 79.99 },
      { weight: '4g', qty: 4, price: 99.99 }
    ]
  },
  vape: {
    category_name: 'Vape',
    tiers: [
      { qty: 1, price: 34.99 },
      { qty: 2, price: 59.99 },
      { qty: 3, price: 74.99 }
    ]
  }
};

export function FieldsManager() {
  const [categories, setCategories] = useState<CategoryFieldAssignment[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      
      // Get all categories
      const categoriesRes = await fetch('/api/flora/categories?per_page=100');
      const allCategories = await categoriesRes.json();
      
      if (!allCategories.success) {
        console.error('Failed to load categories');
        return;
      }

      // Load field assignments for each category
      const categoryData = await Promise.all(
        allCategories.data
          .filter((cat: any) => cat.count > 0) // Only categories with products
          .map(async (cat: any) => {
            try {
              const fieldsRes = await fetch(`/api/flora/categories/${cat.id}/fields`, {
                cache: 'no-store'
              });
              
              if (!fieldsRes.ok) {
                throw new Error('Failed to fetch');
              }
              
              const fieldsData = await fieldsRes.json();
              
              console.log(`Category ${cat.name} (${cat.id}):`, {
                field_count: fieldsData.field_count,
                assigned_fields_keys: Object.keys(fieldsData.assigned_fields || {})
              });
              
              return {
                category_id: parseInt(fieldsData.category_id),
                category_name: fieldsData.category_name,
                assigned_fields: fieldsData.assigned_fields || {},
                field_count: fieldsData.field_count || 0
              };
            } catch (error) {
              console.error(`Failed to load fields for category ${cat.name}:`, error);
              return {
                category_id: cat.id,
                category_name: cat.name,
                assigned_fields: {},
                field_count: 0
              };
            }
          })
      );

      console.log('✅ Loaded category data:', categoryData.map(c => `${c.category_name}: ${c.field_count} fields`));
      setCategories(categoryData);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedCategoryData = categories.find(c => c.category_id === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-100"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-100">Fields & Pricing Manager</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Manage field assignments and pricing tiers by category (Native WooCommerce)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Categories List */}
        <div className="col-span-1">
          <div className="bg-neutral-900 rounded-lg border border-white/[0.08] p-4">
            <h3 className="text-sm font-medium text-neutral-300 mb-4">Categories</h3>
            <div className="space-y-2">
              {categories.map((cat) => (
                <button
                  key={cat.category_id}
                  onClick={() => setSelectedCategory(cat.category_id)}
                  className={`
                    w-full text-left px-3 py-2 rounded transition-all
                    ${selectedCategory === cat.category_id 
                      ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300' 
                      : 'bg-neutral-800 border border-white/[0.04] text-neutral-400 hover:bg-neutral-750'
                    }
                  `}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{cat.category_name}</span>
                    <span className="text-xs text-neutral-600">
                      {cat.field_count} fields
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Category Details */}
        <div className="col-span-2">
          {selectedCategoryData ? (
            <div className="space-y-6">
              {/* Fields Section */}
              <div className="bg-neutral-900 rounded-lg border border-white/[0.08] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-neutral-100">
                    {selectedCategoryData.category_name} Fields
                  </h3>
                  <div className="text-sm text-neutral-500">
                    {selectedCategoryData.field_count} assigned fields
                  </div>
                </div>

                {selectedCategoryData.field_count > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(selectedCategoryData.assigned_fields).map(([fieldName, config]) => (
                      <div 
                        key={fieldName}
                        className="bg-neutral-800 border border-white/[0.04] rounded p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="text-neutral-300 font-medium">
                              {config.label}
                            </div>
                            <div className="text-xs text-neutral-600 mt-1">
                              {fieldName} • {config.type}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {config.required && (
                              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                                Required
                              </span>
                            )}
                            <span className="text-xs bg-neutral-700 text-neutral-400 px-2 py-1 rounded">
                              Order: {config.order}
                            </span>
                          </div>
                        </div>
                        
                        {config.config && config.config.options && (
                          <div className="mt-2 text-xs text-neutral-500">
                            Options: {config.config.options.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-neutral-600">
                    No fields assigned to this category
                  </div>
                )}
              </div>

              {/* Pricing Template Section */}
              <div className="bg-neutral-900 rounded-lg border border-white/[0.08] p-6">
                <h3 className="text-lg font-medium text-neutral-100 mb-4">
                  Pricing Template
                </h3>

                {(() => {
                  const templateKey = selectedCategoryData.category_name.toLowerCase();
                  const template = PRICING_TEMPLATES[templateKey];
                  
                  if (!template) {
                    return (
                      <div className="text-center py-8 text-neutral-600">
                        No pricing template for this category
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      <div className="text-sm text-neutral-500 mb-4">
                        Default pricing structure for {template.category_name} products
                      </div>
                      {template.tiers.map((tier, index) => (
                        <div 
                          key={index}
                          className="flex justify-between items-center bg-neutral-800 border border-white/[0.04] rounded px-4 py-3"
                        >
                          <div className="text-neutral-400">
                            {tier.weight || `${tier.qty || 0} unit${(tier.qty || 0) > 1 ? 's' : ''}`}
                          </div>
                          <div className="text-neutral-300 font-medium">
                            ${tier.price.toFixed(2)}
                          </div>
                        </div>
                      ))}
                      
                      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-400">
                        ℹ️ This pricing is automatically applied to all products in this category
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Storage Info */}
              <div className="bg-neutral-900 rounded-lg border border-white/[0.08] p-6">
                <h3 className="text-lg font-medium text-neutral-100 mb-4">
                  Storage Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Field Assignments:</span>
                    <span className="text-neutral-300 font-mono">wp_termmeta</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Field Values:</span>
                    <span className="text-neutral-300 font-mono">wp_postmeta (_field_*)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Pricing Tiers:</span>
                    <span className="text-neutral-300 font-mono">wp_postmeta (_product_price_tiers)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Base Prices:</span>
                    <span className="text-neutral-300 font-mono">wp_postmeta (_price, _regular_price)</span>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/[0.04]">
                    <div className="flex items-center gap-2 text-green-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-xs font-medium">100% Native WordPress Storage</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-neutral-900 rounded-lg border border-white/[0.08] p-12">
              <div className="text-center text-neutral-600">
                <svg className="w-16 h-16 mx-auto mb-4 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                <p className="text-lg">Select a category to manage fields and pricing</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="bg-neutral-900 rounded-lg border border-white/[0.08] p-6">
        <h3 className="text-lg font-medium text-neutral-100 mb-4">System Status</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-neutral-800 rounded p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">
              {categories.length}
            </div>
            <div className="text-xs text-neutral-500 mt-1">Categories</div>
          </div>
          <div className="bg-neutral-800 rounded p-4 text-center">
            <div className="text-2xl font-bold text-green-400">
              {categories.reduce((sum, cat) => sum + cat.field_count, 0)}
            </div>
            <div className="text-xs text-neutral-500 mt-1">Total Fields</div>
          </div>
          <div className="bg-neutral-800 rounded p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">
              131
            </div>
            <div className="text-xs text-neutral-500 mt-1">Products</div>
          </div>
          <div className="bg-neutral-800 rounded p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">
              V3
            </div>
            <div className="text-xs text-neutral-500 mt-1">Native API</div>
          </div>
        </div>
      </div>
    </div>
  );
}

