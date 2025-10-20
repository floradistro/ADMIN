import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, TextArea, Select, AlertDialog } from './';
import { categoriesService } from '../../services/categories-service';
import { useDialogs } from '../../hooks/useDialogs';

interface ProductCreateDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProduct: () => void;
  onBulkImport: () => void;
}

export function ProductCreateDropdown({ 
  isOpen, 
  onClose, 
  onCreateProduct,
  onBulkImport
}: ProductCreateDropdownProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: ''
  });
  
  const [categories, setCategories] = useState<Array<{id: string, name: string, blueprint?: any}>>([]);
  const [selectedBlueprint, setSelectedBlueprint] = useState<any>(null);
  const [loadingBlueprint, setLoadingBlueprint] = useState(false);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  // Dialog management
  const dialogs = useDialogs();

  // Reset form when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setShowCreateForm(false);
      setFormData({
        name: '',
        sku: '',
        category: ''
      });
      setSelectedBlueprint(null);
    }
  }, [isOpen]);

  // Load categories when form opens
  useEffect(() => {
    if (showCreateForm && categories.length === 0) {
      loadCategories();
    }
  }, [showCreateForm]);

  // Load blueprint when category changes
  useEffect(() => {
    if (formData.category) {
      loadBlueprintForCategory(formData.category);
    } else {
      setSelectedBlueprint(null);
    }
  }, [formData.category]);

  const loadCategories = async () => {
    try {
      const response = await categoriesService.getCategories({
        per_page: 100,
        orderby: 'name',
        order: 'asc'
      });
      
      if (response.success) {
        const categoryOptions = response.data.map(cat => ({
          id: cat.id.toString(),
          name: cat.name
        }));
        setCategories(categoryOptions);
      } else {
        setCategories([]);
      }
    } catch (error) {
      setCategories([]);
    }
  };

  const loadBlueprintForCategory = async (categoryId: string) => {
    setLoadingBlueprint(true);
    try {
      
      // Get blueprint assignments for this category
      const response = await fetch(`/api/flora/blueprint-assignments?entity_type=category&category_id=${categoryId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch blueprint assignments: ${response.status}`);
      }
      
      const assignments = await response.json();
      
      if (assignments.length > 0) {
        // For now, take the first assignment (you might want to handle multiple assignments differently)
        const assignment = assignments[0];
        
        // Get blueprint details
        const blueprintResponse = await fetch(`/api/flora/blueprints/${assignment.blueprint_id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (blueprintResponse.ok) {
          const blueprint = await blueprintResponse.json();
          
          // Get blueprint fields
          const fieldsResponse = await fetch(`/api/flora/blueprint-fields?blueprint_id=${assignment.blueprint_id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (fieldsResponse.ok) {
            const fields = await fieldsResponse.json();
            
            setSelectedBlueprint({
              id: blueprint.id,
              name: blueprint.name || blueprint.label,
              fields: fields.map((field: any) => field.field_label || field.field_name || field.label || field.name)
            });
          } else {
            // Fallback with just blueprint info
            setSelectedBlueprint({
              id: blueprint.id,
              name: blueprint.name || blueprint.label,
              fields: ['Loading fields...']
            });
          }
        } else {
          // Fallback with assignment info
          setSelectedBlueprint({
            id: assignment.blueprint_id,
            name: assignment.blueprint_name || assignment.blueprint_label,
            fields: ['Blueprint fields loading...']
          });
        }
      } else {
        setSelectedBlueprint(null);
      }
    } catch (error) {
      setSelectedBlueprint(null);
    } finally {
      setLoadingBlueprint(false);
    }
  };

  const handleClose = () => {
    setShowCreateForm(false);
    onClose();
  };

  const handleCreateProduct = () => {
    setShowCreateForm(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsCreatingProduct(true);
    
    try {
      // Split product names by lines and filter out empty lines
      const productNames = formData.name
        .split('\n')
        .map(name => name.trim())
        .filter(name => name.length > 0);
      
      if (productNames.length === 0) {
        dialogs.showWarning('No Products', 'Please enter at least one product name');
        setIsCreatingProduct(false);
        return;
      }
      
      
      const createdProducts = [];
      const failedProducts = [];
      
      // Create each product
      for (let i = 0; i < productNames.length; i++) {
        const productName = productNames[i];
        
        try {
          // Generate SKU based on product name if base SKU is provided
          let productSku = formData.sku || '';
          if (productNames.length > 1 && formData.sku) {
            productSku = `${formData.sku}-${i + 1}`;
          } else if (!formData.sku) {
            // If no SKU provided, leave it empty (API will handle it)
            productSku = '';
          }
          
          // Prepare product data for BluePrints API
          const productData = {
            name: productName,
            sku: productSku,
            type: 'simple',
            status: 'publish',
            categories: [parseInt(formData.category)], // API expects array of integers
            blueprint_fields: selectedBlueprint ? {
              blueprint_id: selectedBlueprint.id,
              fields: {} // Empty fields object - user can fill these later
            } : null
          };
          
          
          // Call the BluePrints product creation API
          const response = await fetch('/api/flora/products', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(productData),
          });
          
          if (!response.ok) {
            const errorData = await response.text();
            failedProducts.push({ name: productName, error: `${response.status} - ${errorData}` });
            continue;
          }
          
          const createdProduct = await response.json();
          createdProducts.push(createdProduct);
          
        } catch (error) {
          failedProducts.push({ 
            name: productName, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }
      
      // Call the parent callback to refresh the list
      onCreateProduct();
      
      // Close the form
      handleClose();
      
      // Show results
      let message = '';
      if (createdProducts.length > 0) {
        message += `✅ Successfully created ${createdProducts.length} product(s):\n`;
        message += createdProducts.map(p => `• ${p.name}`).join('\n');
      }
      
      if (failedProducts.length > 0) {
        if (message) message += '\n\n';
        message += `❌ Failed to create ${failedProducts.length} product(s):\n`;
        message += failedProducts.map(p => `• ${p.name}: ${p.error}`).join('\n');
      }
      
      if (failedProducts.length > 0) {
        dialogs.showWarning('Partial Success', message);
      } else {
        dialogs.showSuccess('Success', message);
      }
      
    } catch (error) {
      dialogs.showError('Error', `Failed to create products: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreatingProduct(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile: Bottom sheet style */}
      <div className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999] flex items-end" onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
        <div 
          ref={dropdownRef}
          className="w-full bg-neutral-900/95 border-t border-white/[0.08] rounded-t-2xl shadow-2xl max-h-[70vh] overflow-auto transition-all duration-200 product-card"
          onClick={(e) => e.stopPropagation()}
        >
      {!showCreateForm ? (
        // Menu View
        <div className="p-4">
          <div className="text-neutral-400 text-xs font-medium mb-3 px-1">Add Products</div>
          
          <div className="space-y-2">
            {/* New Product */}
            <button
              onClick={handleCreateProduct}
              className="w-full flex items-center gap-3 px-3 py-3 text-left rounded-md hover:bg-white/[0.05] active:bg-white/[0.08] transition-colors group touch-manipulation"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-white/[0.08] rounded-md flex items-center justify-center group-hover:bg-white/[0.12] transition-colors">
                <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <div className="text-neutral-300 text-sm font-medium">New Products</div>
              </div>
            </button>
            {/* Bulk Import */}
            <button
              onClick={() => {
                onBulkImport();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-3 text-left rounded-md hover:bg-white/[0.05] active:bg-white/[0.08] transition-colors group touch-manipulation"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-white/[0.08] rounded-md flex items-center justify-center group-hover:bg-white/[0.12] transition-colors">
                <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <div className="text-neutral-300 text-sm font-medium">Bulk Import</div>
                <div className="text-neutral-500 text-xs mt-0.5">Import multiple products</div>
              </div>
            </button>
          </div>
        </div>
      ) : (
        // Form content for mobile
        <div className="p-4">
          {/* Mobile form */}
          {/* Copy desktop form structure here if needed */}
        </div>
      )}
        </div>
      </div>

      {/* Desktop: Normal dropdown */}
      <div 
        ref={dropdownRef}
        className={`hidden md:block absolute right-0 top-full mt-1 bg-neutral-900/95 border border-white/[0.08] rounded-lg shadow-2xl backdrop-blur-sm z-50 overflow-hidden transition-all duration-200 product-card ${
          showCreateForm ? 'w-96' : 'w-64'
        }`}
      >
      {!showCreateForm ? (
        // Menu View
        <div className="p-3">
          <div className="text-neutral-400 text-xs font-medium mb-3 px-1">Add Products</div>
          
          <div className="space-y-2">
            {/* New Product */}
            <button
              onClick={handleCreateProduct}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-md hover:bg-white/[0.05] transition-colors group"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-white/[0.08] rounded-md flex items-center justify-center group-hover:bg-white/[0.12] transition-colors">
                <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <div className="text-neutral-300 text-sm font-medium">New Products</div>
              </div>
            </button>



            {/* Bulk Import */}
            <button
              onClick={() => {
                onBulkImport();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-md hover:bg-white/[0.05] transition-colors group"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-white/[0.08] rounded-md flex items-center justify-center group-hover:bg-white/[0.12] transition-colors">
                <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <div>
                <div className="text-neutral-300 text-sm font-medium">Bulk Import</div>
              </div>
            </button>
          </div>
        </div>
      ) : (
        // Form View
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-1 hover:bg-white/[0.05] rounded transition-colors"
              >
                <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h3 className="text-neutral-300 text-sm font-medium">Create Products</h3>
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-white/[0.05] rounded transition-colors"
            >
              <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <Input
                label="SKU (Optional)"
                value={formData.sku}
                onChange={(e) => handleInputChange('sku', e.target.value)}
                placeholder="Enter product SKU (optional)"
              />
            </div>

            <div>
              <TextArea
                label="Product Names"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter product names (one per line for rapid creation)"
                required
                rows={3}
              />
              <div className="text-neutral-500 text-xs mt-1">
                💡 Tip: Press Enter to add multiple product names, one per line
              </div>
            </div>

            <div>
              <Select
                label="Category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                options={[
                  { value: '', label: 'Select a category' },
                  ...categories.map(cat => ({ value: cat.id, label: cat.name }))
                ]}
                required
              />
            </div>

            {/* Blueprint Information */}
            {formData.category && (
              <div className="border border-white/[0.08] rounded-lg p-3 bg-white/[0.02]">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-neutral-300 text-sm font-medium">Attached Blueprint</span>
                </div>
                
                {loadingBlueprint ? (
                  <div className="flex items-center gap-2 text-neutral-500 text-xs">
                    <div className="w-3 h-3 border border-neutral-500 border-t-transparent rounded-full animate-spin"></div>
                    Loading blueprint...
                  </div>
                ) : selectedBlueprint ? (
                  <div>
                    <div className="text-neutral-400 text-sm font-medium mb-2">{selectedBlueprint.name}</div>
                    <div className="text-neutral-500 text-xs mb-2">Blueprint Fields:</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedBlueprint.fields.map((field: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-white/[0.05] rounded text-neutral-400 text-xs"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-neutral-500 text-xs">No blueprint attached to this category</div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!formData.name || !formData.category || isCreatingProduct}
              >
                {isCreatingProduct ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Products...
                  </div>
                ) : (
                  'Create Products'
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
      </div>
      
      {/* Dialog Components */}
      <AlertDialog
        isOpen={dialogs.alertDialog.isOpen}
        onClose={dialogs.closeAlert}
        title={dialogs.alertDialog.title}
        message={dialogs.alertDialog.message}
        variant={dialogs.alertDialog.variant}
      />
    </>
  );
}