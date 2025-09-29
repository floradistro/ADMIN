import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { JsonPopout } from '../ui/JsonPopout';
import { BulkFieldSelector, FieldOption } from './BulkFieldSelector';
import { useBulkEditFieldContext } from '../../contexts/BulkEditFieldContext';

interface BulkJsonEditorProps {
  isOpen: boolean;
  onClose: () => void;
  productIds: number[];
}

interface ProductEditData {
  id: number;
  name: string;
  sku: string;
  description: string;
  short_description: string;
  blueprint_fields: Record<string, any>;
}

export function BulkJsonEditor({ isOpen, onClose, productIds }: BulkJsonEditorProps) {
  const [products, setProducts] = useState<ProductEditData[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  // Use bulk edit field context
  const {
    availableFields,
    setAvailableFields,
    selectedFields,
    setSelectedFields
  } = useBulkEditFieldContext();

  // Fetch product data when component opens
  const fetchProductData = useCallback(async () => {
    if (!isOpen || productIds.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const productData: ProductEditData[] = [];
      
      // Fetch blueprint fields for all products using the same API as the field selector
      let allBlueprintFields: Record<number, Record<string, any>> = {};
      try {
        const fieldsResponse = await fetch('/api/flora/available-for-products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_ids: productIds })
        });
        
        if (fieldsResponse.ok) {
          const fieldsResult = await fieldsResponse.json();
          // We'll need to fetch individual product blueprint field values since this API only gives us field definitions
        }
      } catch (fieldsError) {
        console.warn('Failed to fetch bulk blueprint fields:', fieldsError);
      }
      
      for (const productId of productIds) {
        try {
          // Fetch basic product data using our API endpoint which returns WooCommerce data
          const productResponse = await fetch(`/api/flora/products/${productId}`);
          if (!productResponse.ok) {
            throw new Error(`Failed to fetch product ${productId}`);
          }
          
          const productResult = await productResponse.json();
          const product = productResult.data;
          
          // Fetch blueprint field values for this specific product
          let blueprintFields = {};
          try {
            const fieldsResponse = await fetch(`/api/blueprint-fields/${productId}`);
            if (fieldsResponse.ok) {
              const fieldsData = await fieldsResponse.json();
              if (fieldsData.success && fieldsData.fields) {
                // Convert blueprint fields array to object for easier editing
                blueprintFields = fieldsData.fields.reduce((acc: Record<string, any>, field: any) => {
                  acc[field.field_name] = field.field_value || field.field_default_value || '';
                  return acc;
                }, {});
              }
            }
          } catch (fieldsError) {
            // Blueprint fields are optional, continue without them
            console.warn(`Failed to fetch blueprint fields for product ${productId}:`, fieldsError);
          }
          
          productData.push({
            id: productId,
            name: product.name || '',
            sku: product.sku || '',
            description: product.description || '',
            short_description: product.short_description || '',
            blueprint_fields: blueprintFields
          });
        } catch (productError) {
          console.error(`Failed to fetch product ${productId}:`, productError);
          // Add placeholder data for failed products
          productData.push({
            id: productId,
            name: `Product ${productId} (Failed to load)`,
            sku: '',
            description: '',
            short_description: '',
            blueprint_fields: {}
          });
        }
      }
      
      setProducts(productData);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product data');
    } finally {
      setLoading(false);
    }
  }, [isOpen, productIds]);

  // Fetch data when component opens
  useEffect(() => {
    fetchProductData();
  }, [fetchProductData]);

  // Filter products data based on selected fields
  const filteredProducts = useMemo(() => {
    if (selectedFields.size === 0) return [];
    
    return products.map(product => {
      const filteredProduct: any = {};
      
      // Always include ID
      filteredProduct.id = product.id;
      
      // Include selected standard fields
      if (selectedFields.has('name')) filteredProduct.name = product.name;
      if (selectedFields.has('sku')) filteredProduct.sku = product.sku;
      if (selectedFields.has('description')) filteredProduct.description = product.description;
      if (selectedFields.has('short_description')) filteredProduct.short_description = product.short_description;
      
      // Include selected blueprint fields directly in the main object (flattened structure)
      Object.entries(product.blueprint_fields).forEach(([fieldName, fieldValue]) => {
        if (selectedFields.has(fieldName)) {
          filteredProduct[fieldName] = fieldValue;
        }
      });
      
      return filteredProduct;
    });
  }, [products, selectedFields]);

  // Handle JSON changes and apply them to the actual form fields
  const handleJsonSave = useCallback(async (jsonData: any) => {
    if (!Array.isArray(jsonData)) {
      setError('JSON data must be an array of products');
      return;
    }

    setSaving(true);
    setError(null);
    
    try {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];
      
      for (const productData of jsonData) {
        if (!productData.id) {
          errors.push('Product missing ID');
          errorCount++;
          continue;
        }
        
        try {
          // Separate standard fields from blueprint fields
          const standardFields = ['id', 'name', 'sku', 'description', 'short_description'];
          const updateData: any = {};
          const blueprintFields: Record<string, any> = {};
          
          // Process all fields from the flattened JSON structure
          Object.entries(productData).forEach(([key, value]) => {
            if (standardFields.includes(key)) {
              // Standard WooCommerce fields
              if (key !== 'id' && value !== undefined) {
                updateData[key] = value;
              }
            } else {
              // Blueprint fields
              blueprintFields[key] = value;
            }
          });
          
          // Include blueprint fields in the main update if any exist
          if (Object.keys(blueprintFields).length > 0) {
            updateData.blueprint_fields = blueprintFields;
          }
          
          // Don't save to database - just update UI for preview
          
          successCount++;
          
          // Dispatch a custom event to trigger field updates in the UI
          const eventFieldData: Record<string, any> = {};
          Object.entries(productData).forEach(([key, value]) => {
            if (key !== 'id') {
              eventFieldData[key] = value;
            }
          });
          
          // Dispatch event to update UI with preview data
          const event = new CustomEvent('bulkJsonFieldUpdate', {
            detail: { 
              productId: productData.id, 
              fieldData: eventFieldData
            }
          });
          window.dispatchEvent(event);
          
        } catch (productError) {
          errors.push(`Product ${productData.id}: ${productError instanceof Error ? productError.message : 'Update failed'}`);
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        setSuccessMessage(`Applied preview changes to ${successCount} products! Use "Save All" to commit changes.`);
        
        // Dispatch a global refresh event to ensure all components update
        const globalRefreshEvent = new CustomEvent('bulkJsonUpdateComplete', {
          detail: { 
            updatedProductIds: jsonData.map((p: any) => p.id),
            successCount,
            timestamp: new Date().toISOString()
          }
        });
        window.dispatchEvent(globalRefreshEvent);
        
        // No need for force refresh in preview mode
        
        // Auto-close after preview applied
        setTimeout(() => {
          onClose();
          setSuccessMessage('');
        }, 3000); // Give user more time to see the preview message
      }
      
      if (errorCount > 0) {
        setError(`${errorCount} products failed to update: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update products');
    } finally {
      setSaving(false);
    }
  }, [onClose]);

  const handleClose = useCallback(() => {
    setProducts([]);
    setError(null);
    setSuccessMessage('');
    onClose();
  }, [onClose]);

  return (
    <>
      {/* Field Selector Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50">
          <div className="bg-neutral-800 border border-white/[0.08] rounded-lg shadow-lg w-full max-w-6xl h-[90vh] flex flex-col">
            {/* Header with Field Selector */}
            <div className="flex items-center justify-between p-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-medium text-neutral-300">
                  Bulk Edit JSON ({productIds.length} products)
                </h2>
                <BulkFieldSelector
                  availableFields={availableFields}
                  selectedFields={selectedFields}
                  onFieldSelectionChange={setSelectedFields}
                />
              </div>
              <button
                onClick={handleClose}
                className="text-neutral-400 hover:text-neutral-300 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* JSON Editor Content */}
            <div className="flex-1 overflow-hidden">
              <JsonPopout
                isOpen={true}
                onClose={handleClose}
                value={filteredProducts}
                onChange={handleJsonSave}
                title=""
                placeholder={`Edit your products in JSON format, then click "Preview Changes" to see updates in the product cards. Use "Save All" to commit all changes.

Example:
[
  {
    "id": 123,
    "name": "Updated Product Name",
    "sku": "NEW-SKU",
    "description": "Updated description",
    "short_description": "Updated short description",
    "thca_percent": "25.5",
    "effect": "Relaxing",
    "lineage": "Indica Hybrid",
    "nose": "Sweet, Earthy",
    "terpene": "Myrcene, Limonene",
    "type": "Flower"
  }
]`}
                size="xlarge"
                loading={loading || saving}
                successMessage={successMessage}
                viewMode={false}
                style="dashboard"
                className={`h-full ${error ? 'border-red-500/50' : ''}`}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
