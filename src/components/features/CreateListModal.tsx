'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { X, Plus, Minus, GripVertical, Check } from 'lucide-react';
import { Product, ColumnConfig } from '../../types';
import { ListColumn } from '../../types/lists';
import { Button } from '../ui/Button';
import { FieldsCache } from '../../services/fields-cache';
import { inventoryService } from '../../services/inventory-service';

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProducts: Product[];
  availableColumns: ColumnConfig[];
  onCreateList: (
    name: string,
    description: string,
    columns: ListColumn[],
    settings: any
  ) => void;
}

interface FieldOption {
  id: string;
  label: string;
  type: 'standard' | 'blueprint';
  fieldName?: string;
}

export function CreateListModal({
  isOpen,
  onClose,
  selectedProducts,
  availableColumns,
  onCreateList
}: CreateListModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'name',
    'categories',
    'regular_price'
  ]);
  const [blueprintFields, setBlueprintFields] = useState<FieldOption[]>([]);
  const [isLoadingFields, setIsLoadingFields] = useState(false);
  const [locations, setLocations] = useState<Array<{ id: number; name: string }>>([]);
  const [pricingTierOptions, setPricingTierOptions] = useState<Array<{ value: string; label: string }>>([
    { value: 'base', label: 'Base Price Only' },
    { value: 'all', label: 'All Price Tiers' }
  ]);
  
  // Pricing and Stock Options
  const [priceTier, setPriceTier] = useState<'base' | 'all' | string>('base');
  const [includeStock, setIncludeStock] = useState(false);
  const [stockLocation, setStockLocation] = useState<'all' | string>('all');

  // Load blueprint fields and locations from API
  useEffect(() => {
    if (isOpen) {
      loadBlueprintFields();
      loadLocations();
      loadPricingTierOptions();
    }
  }, [isOpen]);

  const loadBlueprintFields = async () => {
    setIsLoadingFields(true);
    try {
      const fieldsData = await FieldsCache.getFieldLibrary();
      const fields: FieldOption[] = fieldsData
        .filter(f => f.status === 'active')
        .map(f => ({
          id: `blueprint_${f.name}`,
          label: f.label,
          type: 'blueprint' as const,
          fieldName: f.name
        }));
      setBlueprintFields(fields);
    } catch (error) {
      console.error('Failed to load fields:', error);
    } finally {
      setIsLoadingFields(false);
    }
  };

  const loadLocations = async () => {
    try {
      const response = await inventoryService.getLocations();
      if (response.success) {
        setLocations(response.data.map(loc => ({ id: loc.id, name: loc.name })));
      }
    } catch (error) {
      console.error('Failed to load locations:', error);
    }
  };

  const loadPricingTierOptions = async () => {
    try {
      console.log('🔍 Loading pricing tiers from', selectedProducts.length, 'products');
      
      const tierMap = new Map<string, { label: string; index: number }>();
      
      // Import productAPI dynamically
      const { productAPI } = await import('../../services/product-api');
      
      for (const product of selectedProducts) {
        console.log('📦 Product:', product.name, 'ID:', product.id);
        
        try {
          // Fetch pricing data from API (same as ProductPricingTiers component)
          const pricingData = await productAPI.getPricing(product.id);
          
          console.log('  💰 Pricing data:', pricingData);
          
          if (pricingData && pricingData.quantity_tiers && pricingData.quantity_tiers.length > 0) {
            pricingData.quantity_tiers.forEach((tier, idx) => {
              // Extract tier label (matches ProductPricingTiers logic)
              let label = '';
              if (tier.weight) {
                label = tier.weight;
              } else if (tier.qty) {
                label = `${tier.qty} unit${tier.qty > 1 ? 's' : ''}`;
              } else if (tier.min_qty) {
                label = `${tier.min_qty}${tier.max_qty ? `-${tier.max_qty}` : '+'} units`;
              } else {
                label = `Tier ${idx + 1}`;
              }
              
              const tierKey = `tier_${idx}`;
              
              if (!tierMap.has(tierKey)) {
                tierMap.set(tierKey, {
                  label: label,
                  index: idx
                });
                console.log('    ✓ Added tier:', label, 'from product', product.name);
              }
            });
          } else {
            console.log('  ⚠️  No quantity_tiers for', product.name);
          }
        } catch (err) {
          console.error('  ❌ Failed to load pricing for', product.name, err);
        }
      }
      
      // Build tier options
      const tiers = Array.from(tierMap.entries())
        .sort((a, b) => a[1].index - b[1].index)
        .map(([key, value]) => ({
          value: key,
          label: value.label
        }));
      
      console.log('✅ Final tier options:', tiers);
      
      if (tiers.length > 0) {
        setPricingTierOptions([
          { value: 'base', label: 'Base Price Only' },
          { value: 'all', label: 'All Price Tiers' },
          ...tiers
        ]);
        console.log('✅ Set', tiers.length, 'pricing tier options');
      } else {
        console.log('⚠️  No pricing tiers found in products');
      }
    } catch (error) {
      console.error('❌ Failed to load pricing tiers:', error);
    }
  };

  const toggleColumn = (columnId: string) => {
    setSelectedColumns(prev =>
      prev.includes(columnId)
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  const handleCreate = () => {
    if (!name.trim()) return;

    const columns: ListColumn[] = selectedColumns.map(colId => {
      // Check standard fields
      const standardField = standardFields.find(f => f.id === colId);
      if (standardField) {
        return {
          id: colId,
          label: standardField.label,
          field: colId,
          type: 'default',
          visible: true
        };
      }

      // Check blueprint fields
      const blueprintField = blueprintFields.find(f => f.id === colId);
      if (blueprintField) {
        return {
          id: colId,
          label: blueprintField.label,
          field: blueprintField.fieldName || colId,
          type: 'blueprint',
          visible: true
        };
      }

      return {
        id: colId,
        label: colId,
        field: colId,
        type: 'default',
        visible: true
      };
    });

    const settings = {
      theme: 'light' as const,
      includeImages: false,
      includeCOA: false,
      includePricing: true,
      includeInventory: includeStock,
      customFields: [],
      priceTier,
      stockLocation: includeStock ? stockLocation : undefined
    };

    onCreateList(name, description, columns, settings);
    handleClose();
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setSelectedColumns(['name', 'categories', 'regular_price']);
    setPriceTier('base');
    setIncludeStock(false);
    setStockLocation('all');
    onClose();
  };

  if (!isOpen) return null;

  // Standard product fields
  const standardFields: FieldOption[] = [
    { id: 'name', label: 'Product Name', type: 'standard' },
    { id: 'sku', label: 'SKU', type: 'standard' },
    { id: 'categories', label: 'Categories', type: 'standard' },
    { id: 'stock', label: 'Stock', type: 'standard' },
    { id: 'regular_price', label: 'Price', type: 'standard' },
    { id: 'description', label: 'Description', type: 'standard' },
    { id: 'status', label: 'Status', type: 'standard' },
  ];

  const allFields = [...standardFields, ...blueprintFields];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-neutral-900 rounded-lg shadow-2xl border border-white/10 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
            <h2 className="text-xl font-medium text-white">Create Product List</h2>
            <p className="text-xs text-white/50 mt-1">
              {selectedProducts.length} products selected
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-white/5 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-white/40 hover:text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Basic Info */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1.5">
                List Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Q4 2025 Product Catalog"
                className="w-full px-3 py-2 bg-transparent border border-white/[0.08] rounded text-sm text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1.5">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description..."
                rows={2}
                className="w-full px-3 py-2 bg-transparent border border-white/[0.08] rounded text-sm text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-white/20 resize-none transition-colors"
              />
            </div>
          </div>

          {/* Field Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-neutral-400">Select Fields</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedColumns(allFields.map(f => f.id))}
                  className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  Select All
                </button>
                <span className="text-white/10">•</span>
                <button
                  onClick={() => setSelectedColumns([])}
                  className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Standard Fields */}
            <div>
              <h4 className="text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">Product Fields</h4>
              <div className="grid grid-cols-2 gap-2">
                {standardFields.map(field => (
                  <label
                    key={field.id}
                    onClick={() => toggleColumn(field.id)}
                    className="flex items-center gap-2 p-2 border border-white/[0.08] rounded hover:border-white/[0.12] cursor-pointer transition-all group"
                  >
                    <div className={`
                      w-4 h-4 rounded border flex items-center justify-center transition-all
                      ${selectedColumns.includes(field.id)
                        ? 'bg-white/90 border-white/90'
                        : 'border-white/20 group-hover:border-white/30'
                      }
                    `}>
                      {selectedColumns.includes(field.id) && (
                        <Check className="w-3 h-3 text-black" strokeWidth={2.5} />
                      )}
                    </div>
                    <span className="text-xs text-neutral-400 group-hover:text-neutral-300">{field.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Custom Fields from Library */}
            {isLoadingFields ? (
              <div className="text-xs text-neutral-600 text-center py-4">Loading custom fields...</div>
            ) : blueprintFields.length > 0 ? (
              <div>
                <h4 className="text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">Custom Fields</h4>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {blueprintFields.map(field => (
                    <label
                      key={field.id}
                      onClick={() => toggleColumn(field.id)}
                      className="flex items-center gap-2 p-2 border border-white/[0.08] rounded hover:border-white/[0.12] cursor-pointer transition-all group"
                    >
                      <div className={`
                        w-4 h-4 rounded border flex items-center justify-center transition-all
                        ${selectedColumns.includes(field.id)
                          ? 'bg-white/90 border-white/90'
                          : 'border-white/20 group-hover:border-white/30'
                        }
                      `}>
                        {selectedColumns.includes(field.id) && (
                          <Check className="w-3 h-3 text-black" strokeWidth={2.5} />
                        )}
                      </div>
                      <span className="text-xs text-neutral-400 group-hover:text-neutral-300">{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-xs text-neutral-600 text-center py-4">No custom fields available</div>
            )}
          </div>

          {/* Pricing & Stock Options */}
          <div className="space-y-3 pt-3 border-t border-white/[0.08]">
            <h3 className="text-sm font-medium text-neutral-400">Display Options</h3>
            
            {/* Price Tier Selection */}
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-2">
                Price Tier
              </label>
              <select
                value={priceTier}
                onChange={(e) => setPriceTier(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/[0.08] rounded text-sm text-neutral-300 focus:outline-none focus:border-white/20 transition-colors"
              >
                {pricingTierOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {pricingTierOptions.length > 2 && (
                <p className="text-[10px] text-neutral-600 mt-1">
                  {pricingTierOptions.length - 2} pricing tier{pricingTierOptions.length > 3 ? 's' : ''} found from product data
                </p>
              )}
            </div>

            {/* Stock Options */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${includeStock ? 'bg-white/90 border-white/90' : 'border-white/20'}`}>
                  {includeStock && <Check className="w-3 h-3 text-black" strokeWidth={2.5} />}
                </div>
                <input
                  type="checkbox"
                  checked={includeStock}
                  onChange={(e) => setIncludeStock(e.target.checked)}
                  className="hidden"
                />
                <span className="text-xs text-neutral-400">Include Stock Information</span>
              </label>
              
              {includeStock && (
                <div className="mt-2 ml-6">
                  <select
                    value={stockLocation}
                    onChange={(e) => setStockLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/[0.08] rounded text-sm text-neutral-300 focus:outline-none focus:border-white/20 transition-colors"
                  >
                    <option value="all">All Locations (Total Stock)</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-neutral-600 mt-1">
                    {stockLocation === 'all' ? 'Shows total stock across all locations' : 'Shows stock for selected location only'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-white/[0.08]">
          <div className="text-xs text-neutral-600">
            {selectedColumns.length} column{selectedColumns.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-1.5 text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!name.trim() || selectedColumns.length === 0}
              className="px-4 py-1.5 text-sm bg-white/90 hover:bg-white disabled:bg-white/30 disabled:cursor-not-allowed text-black rounded transition-colors font-medium"
            >
              Create List
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

