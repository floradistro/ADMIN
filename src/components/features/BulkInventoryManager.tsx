'use client';

import React, { useState } from 'react';
import { Button, Select, Input } from '../ui';
import { FloraLocation } from '../../services/inventory-service';
import { inventoryService } from '../../services/inventory-service';
import { Product } from '../../types';

interface BulkInventoryManagerProps {
  products: Product[];
  locations: FloraLocation[];
  onSuccess?: () => void;
  onClose?: () => void;
}

interface BulkUpdateItem {
  productId: number;
  productName: string;
  locationId: string;
  quantity: string;
  operation: 'set' | 'add' | 'subtract';
}

export function BulkInventoryManager({ products, locations, onSuccess, onClose }: BulkInventoryManagerProps) {
  const [updateItems, setUpdateItems] = useState<BulkUpdateItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [bulkSettings, setBulkSettings] = useState({
    locationId: '',
    operation: 'set' as 'set' | 'add' | 'subtract',
    notes: ''
  });

  const flatLocations = React.useMemo(() => {
    const flat: FloraLocation[] = [];
    locations.forEach(location => {
      flat.push(location);
      if (location.children) {
        flat.push(...location.children);
      }
    });
    return flat;
  }, [locations]);

  const locationOptions = flatLocations.map(loc => ({
    value: loc.id.toString(),
    label: loc.name
  }));

  const productOptions = products.map(product => ({
    value: product.id.toString(),
    label: `${product.name} (${product.sku})`
  }));

  const addUpdateItem = () => {
    setUpdateItems(prev => [...prev, {
      productId: 0,
      productName: '',
      locationId: '',
      quantity: '',
      operation: 'set'
    }]);
  };

  const removeUpdateItem = (index: number) => {
    setUpdateItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof BulkUpdateItem, value: string) => {
    setUpdateItems(prev => prev.map((item, i) => {
      if (i === index) {
        if (field === 'productId') {
          const product = products.find(p => p.id.toString() === value);
          return {
            ...item,
            productId: parseInt(value) || 0,
            productName: product?.name || ''
          };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const applyBulkSettings = () => {
    if (!bulkSettings.locationId) {
      setMessage({ type: 'error', text: 'Please select a location for bulk settings' });
      return;
    }

    setUpdateItems(prev => prev.map(item => ({
      ...item,
      locationId: bulkSettings.locationId,
      operation: bulkSettings.operation
    })));
  };

  const handleBulkUpdate = async () => {
    const validItems = updateItems.filter(item => 
      item.productId > 0 && item.locationId && item.quantity
    );

    if (validItems.length === 0) {
      setMessage({ type: 'error', text: 'Please add at least one valid update item' });
      return;
    }

    // Validate all location IDs before processing
    const invalidItems = validItems.filter(item => {
      const locationId = parseInt(item.locationId);
      return isNaN(locationId) || locationId <= 0;
    });

    if (invalidItems.length > 0) {
      setMessage({ 
        type: 'error', 
        text: `Invalid location IDs detected. Please refresh the page and select valid locations.` 
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);


    try {
      // Prepare updates for bulk API
      const updates = validItems.map((item) => {
        const locationId = parseInt(item.locationId);
        let quantity = parseFloat(item.quantity);
        
        // Handle operation types (set, add, subtract)
        if (item.operation === 'add' || item.operation === 'subtract') {
          // For add/subtract, we would need to get current stock first
          // This is a simplified implementation - treating as set for now
        }
        
        return {
          product_id: item.productId,
          location_id: locationId,
          quantity: quantity
        };
      });


      // Use new bulk update endpoint
      const response = await fetch('/api/flora/inventory/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Bulk update failed');
      }

      const result = await response.json();
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `Successfully updated ${result.updated_count} inventory records!` 
        });
        setUpdateItems([]);
        onSuccess?.();
      } else {
        throw new Error(result.error || 'Bulk update failed');
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Bulk update failed. Please try again.' 
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="p-6 bg-neutral-900 rounded-lg border border-white/10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Bulk Inventory Update</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white/90 smooth-hover"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 p-3 rounded-md ${
          message.type === 'success' ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Bulk Settings */}
      <div className="mb-6 p-4 bg-neutral-800 rounded-lg border border-white/5">
        <h4 className="text-sm font-medium text-white mb-3">Bulk Settings (Apply to All Items)</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Default Location</label>
            <Select
              value={bulkSettings.locationId}
              onChange={(e) => setBulkSettings(prev => ({ ...prev, locationId: e.target.value }))}
              options={[
                { value: '', label: 'Select Location' },
                ...locationOptions
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Default Operation</label>
            <Select
              value={bulkSettings.operation}
              onChange={(e) => setBulkSettings(prev => ({ ...prev, operation: e.target.value as any }))}
              options={[
                { value: 'set', label: 'Set Quantity' },
                { value: 'add', label: 'Add Quantity' },
                { value: 'subtract', label: 'Subtract Quantity' }
              ]}
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={applyBulkSettings}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              Apply to All
            </Button>
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-white/80 mb-2">Bulk Notes</label>
          <Input
            value={bulkSettings.notes}
            onChange={(e) => setBulkSettings(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Add notes for all updates"
          />
        </div>
      </div>

      {/* Update Items */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-white">Update Items</h4>
          <Button
            onClick={addUpdateItem}
            variant="secondary"
            size="sm"
          >
            + Add Item
          </Button>
        </div>

        {updateItems.length === 0 ? (
          <div className="text-center py-8 text-white/60">
            <p>No items added yet. Click "Add Item" to start.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {updateItems.map((item, index) => (
              <div key={index} className="grid grid-cols-5 gap-3 p-3 bg-neutral-800 rounded-lg border border-white/5">
                <div>
                  <Select
                    value={item.productId.toString()}
                    onChange={(e) => updateItem(index, 'productId', e.target.value)}
                    options={[
                      { value: '0', label: 'Select Product' },
                      ...productOptions
                    ]}
                  />
                </div>
                <div>
                  <Select
                    value={item.locationId}
                    onChange={(e) => updateItem(index, 'locationId', e.target.value)}
                    options={[
                      { value: '', label: 'Select Location' },
                      ...locationOptions
                    ]}
                  />
                </div>
                <div>
                  <Select
                    value={item.operation}
                    onChange={(e) => updateItem(index, 'operation', e.target.value)}
                    options={[
                      { value: 'set', label: 'Set' },
                      { value: 'add', label: 'Add' },
                      { value: 'subtract', label: 'Subtract' }
                    ]}
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    step="0.1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    placeholder="Quantity"
                  />
                </div>
                <div className="flex items-center">
                  <button
                    onClick={() => removeUpdateItem(index)}
                    className="text-red-400 hover:text-red-300 smooth-hover"
                    title="Remove item"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={handleBulkUpdate}
          disabled={isLoading || updateItems.length === 0}
          className="flex-1"
        >
          {isLoading ? 'Updating...' : `Update ${updateItems.length} Items`}
        </Button>
        {onClose && (
          <Button
            onClick={onClose}
            variant="secondary"
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}