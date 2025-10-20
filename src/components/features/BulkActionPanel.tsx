'use client';

import React, { useState } from 'react';
import { Product } from '../../types';
import { Button, Select, Input, IconButton, ProductSearch } from '../ui';
import { FloraLocation } from '../../services/inventory-service';
import { inventoryService } from '../../services/inventory-service';

interface BulkActionPanelProps {
  selectedProducts: Product[];
  action: 'update' | 'transfer' | 'convert' | null;
  locations?: FloraLocation[];
  onClose: () => void;
  onSuccess?: () => void;
}

interface ProductQuantity {
  productId: number;
  quantity: string;
  quantityUnit: 'g' | 'units';
  conversionRate: string;
  targetQuantity: string;
  targetUnit: 'g' | 'units';
  targetProductId: string;
}

export function BulkActionPanel({ selectedProducts, action, locations = [], onClose, onSuccess }: BulkActionPanelProps) {
  // Create a list of common products for search fallback
  const commonProducts = [
    { id: 13842, name: 'Chanel Candy Pre-rolls', sku: 'FLW-786-PR' },
    { id: 6914, name: 'Riptide - Berry Blast', sku: 'SKU-6914' },
    { id: 6862, name: 'Darkside - Lemon Ginger', sku: 'SKU-6862' },
    { id: 6861, name: 'Darkside - Fizzy Punch', sku: 'SKU-6861' },
    { id: 6860, name: 'Darkside - Fizzy Lemonade', sku: 'SKU-6860' },
    { id: 786, name: 'Chanel Candy', sku: 'FLW-786' }
  ];
  const [formData, setFormData] = useState({
    locationId: '',
    quantity: '',
    operation: 'set',
    fromLocationId: '',
    toLocationId: '',
    targetProductId: '', // For many-to-one conversions
    notes: ''
  });
  const [productQuantities, setProductQuantities] = useState<ProductQuantity[]>(
    selectedProducts.map(product => ({ 
      productId: product.id, 
      quantity: '', 
      quantityUnit: 'g' as const,
      conversionRate: '90', 
      targetQuantity: '',
      targetUnit: 'g' as const,
      targetProductId: ''
    }))
  );
  const [conversionMode, setConversionMode] = useState<'one-to-one' | 'many-to-one'>('one-to-one');
  const [batchTargetQuantity, setBatchTargetQuantity] = useState('');
  const [batchTargetUnit, setBatchTargetUnit] = useState<'g' | 'units'>('g');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  // Remove duplicates by ID in case the API returns duplicates
  const uniqueLocations = React.useMemo(() => {
    const seen = new Set<number>();
    return locations.filter(location => {
      if (seen.has(location.id)) {
        return false;
      }
      seen.add(location.id);
      return true;
    });
  }, [locations]);

  if (!action) return null;

  const updateProductQuantity = (productId: number, quantity: string) => {
    setProductQuantities(prev => 
      prev.map(pq => pq.productId === productId ? { ...pq, quantity } : pq)
    );
  };

  const updateProductConversionRate = (productId: number, conversionRate: string) => {
    setProductQuantities(prev => 
      prev.map(pq => pq.productId === productId ? { ...pq, conversionRate } : pq)
    );
  };

  const updateProductTargetQuantity = (productId: number, targetQuantity: string) => {
    setProductQuantities(prev => 
      prev.map(pq => pq.productId === productId ? { ...pq, targetQuantity } : pq)
    );
  };

  const updateProductQuantityUnit = (productId: number, quantityUnit: 'g' | 'units') => {
    setProductQuantities(prev => 
      prev.map(pq => pq.productId === productId ? { ...pq, quantityUnit } : pq)
    );
  };

  const updateProductTargetUnit = (productId: number, targetUnit: 'g' | 'units') => {
    setProductQuantities(prev => 
      prev.map(pq => pq.productId === productId ? { ...pq, targetUnit } : pq)
    );
  };

  const updateProductTargetProductId = (productId: number, targetProductId: string) => {
    setProductQuantities(prev => 
      prev.map(pq => pq.productId === productId ? { ...pq, targetProductId } : pq)
    );
  };

  const updateProductTargetProduct = (productId: number, targetProduct: Product | null) => {
    setProductQuantities(prev => 
      prev.map(pq => pq.productId === productId ? { 
        ...pq, 
        targetProductId: targetProduct ? targetProduct.id.toString() : '' 
      } : pq)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      if (action === 'transfer') {
        // Validate transfer form
        if (!formData.fromLocationId || !formData.toLocationId) {
          setMessage({ 
            type: 'error', 
            text: 'Please select both source and destination locations' 
          });
          setIsLoading(false);
          return;
        }

        // Check if any products have quantities set
        const productsWithQuantities = productQuantities.filter(pq => 
          pq.quantity && parseFloat(pq.quantity) > 0
        );

        if (productsWithQuantities.length === 0) {
          setMessage({ 
            type: 'error', 
            text: 'Please enter quantities for at least one product' 
          });
          setIsLoading(false);
          return;
        }

        // Disabled - bulk transfers now handled by Magic2 plugin
        throw new Error('Bulk transfers are now handled by the Magic2 plugin');

      } else if (action === 'update') {
        // Validate update form
        if (!formData.locationId || !formData.quantity) {
          setMessage({ 
            type: 'error', 
            text: 'Please select location and enter quantity' 
          });
          setIsLoading(false);
          return;
        }

        // Validate location ID before processing
        const locationId = parseInt(formData.locationId);
        if (isNaN(locationId) || locationId <= 0) {
          setMessage({ 
            type: 'error', 
            text: `Invalid location ID: ${formData.locationId}. Please refresh the page and select a valid location.` 
          });
          setIsLoading(false);
          return;
        }

        // Disabled - bulk updates now handled by Magic2 plugin
        throw new Error('Bulk updates are now handled by the Magic2 plugin');

      } else if (action === 'convert') {
        // Disabled - product conversion now handled by Magic2 plugin
        setMessage({ 
          type: 'error', 
          text: 'Product conversions are now handled by the Magic2 plugin' 
        });
        setIsLoading(false);
        return;
      }
      
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : `Failed to ${action} products. Please try again.`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const locationOptions = uniqueLocations.map(loc => ({
    value: loc.id.toString(),
    label: loc.name
  }));

  const getTitle = () => {
    switch (action) {
      case 'update': return 'Bulk Update Stock';
      case 'transfer': return 'Bulk Transfer Stock';
      case 'convert': return 'Bulk Convert Products';
      default: return 'Bulk Action';
    }
  };

  const renderActionForm = () => {
    switch (action) {
      case 'update':
        return (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Location
                </label>
                <Select
                  value={formData.locationId}
                  onChange={(e) => setFormData(prev => ({ ...prev, locationId: e.target.value }))}
                  options={[
                    { value: '', label: 'Select Location' },
                    ...locationOptions
                  ]}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Operation
                </label>
                <Select
                  value={formData.operation}
                  onChange={(e) => setFormData(prev => ({ ...prev, operation: e.target.value }))}
                  options={[
                    { value: 'set', label: 'Set Quantity' },
                    { value: 'add', label: 'Add to Current' },
                    { value: 'subtract', label: 'Subtract from Current' }
                  ]}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Quantity
                </label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="Enter quantity"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </>
        );

      case 'transfer':
        return (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  From Location
                </label>
                <Select
                  value={formData.fromLocationId}
                  onChange={(e) => setFormData(prev => ({ ...prev, fromLocationId: e.target.value }))}
                  options={[
                    { value: '', label: 'Select Source Location' },
                    ...locationOptions
                  ]}
                  keyPrefix="bulk-from"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  To Location
                </label>
                <Select
                  value={formData.toLocationId}
                  onChange={(e) => setFormData(prev => ({ ...prev, toLocationId: e.target.value }))}
                  options={[
                    { value: '', label: 'Select Destination Location' },
                    ...locationOptions.filter(loc => loc.value !== formData.fromLocationId)
                  ]}
                  keyPrefix="bulk-to"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Quantity to Transfer per Product
                </label>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedProducts.map(product => {
                    const currentQuantity = productQuantities.find(pq => pq.productId === product.id)?.quantity || '';
                    return (
                      <div key={product.id} className="flex items-center gap-3 p-3 bg-neutral-900/40 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-normal text-neutral-300 truncate">
                              {product.name}
                            </span>
                            {product.categories && product.categories.length > 0 && (
                              <span className="text-neutral-600 text-xs bg-neutral-800/50 px-1.5 py-0.5 rounded flex-shrink-0">
                                {product.categories[0].name}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-neutral-400">
                            SKU: {product.sku || 'N/A'}
                          </div>
                        </div>
                        <div className="w-24">
                          <Input
                            type="number"
                            value={currentQuantity}
                            onChange={(e) => updateProductQuantity(product.id, e.target.value)}
                            placeholder="Qty"
                            min="0"
                            step="0.01"
                            className="text-sm"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        );

      case 'convert':
        return (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Processing Location
                </label>
                <Select
                  value={formData.fromLocationId}
                  onChange={(e) => setFormData(prev => ({ ...prev, fromLocationId: e.target.value }))}
                  options={[
                    { value: '', label: 'Select Processing Location' },
                    ...locationOptions
                  ]}
                  keyPrefix="convert-location"
                />
              </div>
              
              {conversionMode === 'many-to-one' && (
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Target Product
                  </label>
                  <ProductSearch
                    value={formData.targetProductId ? 
                      commonProducts.find(p => p.id.toString() === formData.targetProductId)?.name || 
                      `Product ID: ${formData.targetProductId}` : 
                      ''
                    }
                    onProductSelect={(targetProduct) => 
                      setFormData(prev => ({ ...prev, targetProductId: targetProduct ? targetProduct.id.toString() : '' }))
                    }
                    placeholder="Search for target product..."
                    availableProducts={commonProducts}
                  />
                  <div className="text-xs text-neutral-500 mt-1">
                    Product you are converting all ingredients into (e.g., pre-rolls, concentrate)
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Conversion Mode
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConversionMode('one-to-one')}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg border smooth-hover ${
                      conversionMode === 'one-to-one'
                        ? 'bg-neutral-900/60 border-white/[0.2] text-neutral-200'
                        : 'bg-neutral-900/30 border-neutral-800/40 text-neutral-500 hover:bg-neutral-900/50 hover:text-neutral-400'
                    }`}
                  >
                    One-to-One
                  </button>
                  <button
                    type="button"
                    onClick={() => setConversionMode('many-to-one')}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg border smooth-hover ${
                      conversionMode === 'many-to-one'
                        ? 'bg-neutral-900/60 border-white/[0.2] text-neutral-200'
                        : 'bg-neutral-900/30 border-neutral-800/40 text-neutral-500 hover:bg-neutral-900/50 hover:text-neutral-400'
                    }`}
                  >
                    Many-to-One
                  </button>
                </div>
                <div className="text-xs text-neutral-500 mt-1">
                  {conversionMode === 'one-to-one' 
                    ? 'Each product converts to individual targets (e.g., Blue Dream → Blue Dream Pre-rolls)'
                    : 'All products combine into single target (e.g., Concentrate + Terpenes + Hardware → Vapes)'
                  }
                </div>
              </div>
              
              
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  {conversionMode === 'one-to-one' ? 'Individual Product Conversions' : 'Recipe Ingredients'}
                </label>
                {conversionMode === 'many-to-one' && (
                  <div className="mb-3 p-3 bg-neutral-900/40 border border-white/[0.08] rounded-lg">
                    <div className="text-sm text-neutral-300 font-medium">
                      Recipe Ingredients
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">
                      All ingredients combine into Product ID: {formData.toLocationId || 'Not Set'}
                    </div>
                  </div>
                )}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedProducts.map(product => {
                    const productData = productQuantities.find(pq => pq.productId === product.id);
                    const currentQuantity = productData?.quantity || '';
                    const currentRate = productData?.conversionRate || '90';
                    const currentTarget = productData?.targetQuantity || '';
                    
                    // Calculate suggested target if not manually set
                    const suggestedTarget = currentQuantity && currentRate ? 
                      (parseFloat(currentQuantity) * parseFloat(currentRate) / 100).toFixed(2) : '';
                    
                    return (
                      <div key={product.id} className="p-3 bg-neutral-900/40 rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-normal text-neutral-300 truncate">
                                {product.name}
                              </span>
                              {product.categories && product.categories.length > 0 && (
                                <span className="text-neutral-600 text-xs bg-neutral-800/50 px-1.5 py-0.5 rounded flex-shrink-0">
                                  {product.categories[0].name}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-neutral-400">
                              SKU: {product.sku || 'N/A'}
                            </div>
                          </div>
                        </div>
                        
                        {conversionMode === 'one-to-one' ? (
                          // One-to-one: Source input, target product ID, and final output with units
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <div className="text-xs text-neutral-500 mb-1">Source</div>
                                <Input
                                  type="number"
                                  value={currentQuantity}
                                  onChange={(e) => updateProductQuantity(product.id, e.target.value)}
                                  placeholder="0"
                                  min="0"
                                  step="0.01"
                                  className="text-sm"
                                />
                              </div>
                              <div>
                                <div className="text-xs text-neutral-500 mb-1">Target Product</div>
                                <ProductSearch
                                  value={productData?.targetProductId ? 
                                    commonProducts.find(p => p.id.toString() === productData.targetProductId)?.name || 
                                    `Product ID: ${productData.targetProductId}` : 
                                    ''
                                  }
                                  onProductSelect={(targetProduct) => updateProductTargetProduct(product.id, targetProduct as any)}
                                  placeholder="Search for target product..."
                                  className="text-sm"
                                  availableProducts={commonProducts}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-neutral-500 mb-1">Final Output</div>
                              <div className="relative">
                                <Input
                                  type="number"
                                  value={currentTarget}
                                  onChange={(e) => updateProductTargetQuantity(product.id, e.target.value)}
                                  placeholder={suggestedTarget}
                                  min="0"
                                  step="0.01"
                                  className="text-sm pr-20"
                                />
                                <select
                                  value={productData?.targetUnit || 'g'}
                                  onChange={(e) => updateProductTargetUnit(product.id, e.target.value as 'g' | 'units')}
                                  className="absolute right-1 top-1/2 -translate-y-1/2 bg-black border border-neutral-800/60 rounded px-2 py-1 text-xs text-neutral-400 focus:outline-none focus:border-neutral-700"
                                >
                                  <option value="g">grams</option>
                                  <option value="units">units</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Many-to-one: Just input quantity, no individual output indicators
                          <div>
                            <div className="text-xs text-neutral-500 mb-1">Input</div>
                            <Input
                              type="number"
                              value={currentQuantity}
                              onChange={(e) => updateProductQuantity(product.id, e.target.value)}
                              placeholder="0"
                              min="0"
                              step="0.01"
                              className="text-sm"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {conversionMode === 'many-to-one' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Total Batch Target Quantity
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={batchTargetQuantity}
                      onChange={(e) => setBatchTargetQuantity(e.target.value)}
                      placeholder="Enter quantity"
                      min="0"
                      step="0.01"
                      className="pr-20"
                    />
                    <select
                      value={batchTargetUnit}
                      onChange={(e) => setBatchTargetUnit(e.target.value as 'g' | 'units')}
                      className="absolute right-1 top-1/2 -translate-y-1/2 bg-black border border-neutral-800/60 rounded px-2 py-1 text-xs text-neutral-400 focus:outline-none focus:border-neutral-700"
                    >
                      <option value="g">grams</option>
                      <option value="units">units</option>
                    </select>
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">
                    Total amount of final product this recipe will create
                  </div>
                </div>
              )}
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/[0.08]">
        <h2 className="text-lg font-semibold text-neutral-200">{getTitle()}</h2>
        <IconButton
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="hover:bg-red-500/[0.1] hover:text-red-400"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </IconButton>
      </div>

        {/* Selected Products Summary */}
        <div className="p-4 border-b border-white/[0.08] bg-neutral-800/30">
          <div className="text-sm text-neutral-400 mb-2">
            {selectedProducts.length} products selected:
          </div>
          <div className="max-h-24 overflow-y-auto space-y-1">
            {selectedProducts.slice(0, 5).map(product => (
              <div key={product.id} className="text-xs text-neutral-500 truncate">
                • {product.name}
              </div>
            ))}
            {selectedProducts.length > 5 && (
              <div className="text-xs text-neutral-600">
                +{selectedProducts.length - 5} more...
              </div>
            )}
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {renderActionForm()}
            
            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any notes..."
                rows={3}
                className="w-full px-3 py-2 bg-neutral-800/50 border border-white/[0.1] rounded-lg text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/[0.2] focus:border-transparent resize-none"
              />
            </div>

            {/* Message */}
            {message && (
              <div className={`p-3 rounded-lg text-sm ${
                message.type === 'success' 
                  ? 'bg-green-500/[0.1] text-green-400 border border-green-500/[0.2]' 
                  : message.type === 'info'
                  ? 'bg-blue-500/[0.1] text-blue-400 border border-blue-500/[0.2]'
                  : 'bg-red-500/[0.1] text-red-400 border border-red-500/[0.2]'
              }`}>
                {message.text}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-white/[0.08]">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Processing...' : `${getTitle().split(' ')[1]} Products`}
              </Button>
            </div>
          </form>
        </div>
    </div>
  );
}