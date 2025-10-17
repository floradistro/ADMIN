'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../../ui';

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

export function FieldsManagerFull() {
  const [categories, setCategories] = useState<CategoryFieldAssignment[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [showAddField, setShowAddField] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [savingField, setSavingField] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, [refreshKey]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      
      const categoriesRes = await fetch('/api/flora/categories?per_page=100');
      const allCategories = await categoriesRes.json();
      
      if (!allCategories.success) return;

      const categoryData = await Promise.all(
        allCategories.data
          .filter((cat: any) => cat.count > 0)
          .map(async (cat: any) => {
            try {
              const fieldsRes = await fetch(`/api/flora/categories/${cat.id}/fields?_t=${Date.now()}`, {
                cache: 'no-store',
                headers: {
                  'Cache-Control': 'no-cache'
                }
              });
              
              const fieldsData = await fieldsRes.json();
              
              return {
                category_id: parseInt(fieldsData.category_id),
                category_name: fieldsData.category_name,
                assigned_fields: fieldsData.assigned_fields || {},
                field_count: fieldsData.field_count || 0
              };
            } catch (error) {
              return {
                category_id: cat.id,
                category_name: cat.name,
                assigned_fields: {},
                field_count: 0
              };
            }
          })
      );

      setCategories(categoryData);
      
      // Auto-select first category
      if (categoryData.length > 0 && !selectedCategory) {
        setSelectedCategory(categoryData[0].category_id);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  // Force recompute on every render
  const selectedCategoryData = React.useMemo(() => {
    return categories.find(c => c.category_id === selectedCategory);
  }, [categories, selectedCategory, refreshKey]);
  
  const editingFieldData = editingField && selectedCategoryData 
    ? selectedCategoryData.assigned_fields[editingField] 
    : null;

  const handleAddField = async (fieldData: any) => {
    if (!selectedCategory) {
      alert('❌ No category selected');
      return;
    }
    
    const category = categories.find(c => c.category_id === selectedCategory);
    if (!category) {
      alert('❌ Category not found');
      return;
    }
    
    if (!fieldData.name || !fieldData.label) {
      alert('❌ Field name and label are required');
      return;
    }
    
    // Check if field already exists
    if (category.assigned_fields[fieldData.name]) {
      alert(`❌ Field "${fieldData.name}" already exists in this category`);
      return;
    }

    const updatedFields = {
      ...category.assigned_fields,
      [fieldData.name]: {
        label: fieldData.label,
        type: fieldData.type,
        group: category.category_name.toLowerCase(),
        required: fieldData.required || false,
        order: Object.keys(category.assigned_fields).length,
        config: fieldData.config || {}
      }
    };

    try {
      const res = await fetch(`/api/flora/categories/${selectedCategory}/fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_fields: updatedFields })
      });

      if (res.ok) {
        setShowAddField(false);
        
        // Get REAL fresh data from server
        await loadCategories();
        setRefreshKey(prev => prev + 1);
        
        // Trigger global refresh
        window.dispatchEvent(new CustomEvent('categoryFieldsUpdated', {
          detail: { categoryId: selectedCategory }
        }));
      }
    } catch (error) {
      console.error('Failed to add field:', error);
      alert('❌ Failed to add field');
    }
  };

  const handleUpdateField = async (fieldName: string, updates: Partial<FieldConfig>) => {
    if (!selectedCategory) return;
    
    const category = categories.find(c => c.category_id === selectedCategory);
    if (!category) return;

    // IMPORTANT: Merge with ALL existing fields, only update the one being edited
    const updatedFields = {
      ...category.assigned_fields,
      [fieldName]: {
        ...category.assigned_fields[fieldName],
        ...updates
      }
    };


    try {
      setSavingField(fieldName);
      setEditingField(null);
      
      // Save to server with cache bypass
      const res = await fetch(`/api/flora/categories/${selectedCategory}/fields?_update=${Date.now()}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({ assigned_fields: updatedFields })
      });

      const result = await res.json();

      if (res.ok && result.success) {
        // Get REAL fresh data from server
        const freshRes = await fetch(`/api/flora/categories/${selectedCategory}/fields?_t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        });
        
        if (freshRes.ok) {
          const freshData = await freshRes.json();
          
          // Update with REAL server data
          setCategories(prev => prev.map(cat => {
            if (cat.category_id === selectedCategory) {
              return {
                ...cat,
                assigned_fields: freshData.assigned_fields,
                field_count: freshData.field_count
              };
            }
            return cat;
          }));
          
          setRefreshKey(prev => prev + 1);
          setSavingField(null);
          
          // Trigger global refresh event for product cards
          console.log('📢 Firing categoryFieldsUpdated event');
          window.dispatchEvent(new Event('categoryFieldsUpdated'));
        }
      } else {
        setSavingField(null);
        alert(`❌ Failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to update field:', error);
      setSavingField(null);
      alert('❌ Network error updating field');
    }
  };

  const handleDeleteField = async (fieldName: string) => {
    if (!selectedCategory) return;
    
    const category = categories.find(c => c.category_id === selectedCategory);
    if (!category) return;

    const fieldLabel = category.assigned_fields[fieldName]?.label || fieldName;
    
    if (!confirm(`Delete field "${fieldLabel}"? This will remove it from all products in ${category.category_name}.`)) {
      return;
    }

    const updatedFields = { ...category.assigned_fields };
    delete updatedFields[fieldName];


    try {
      const res = await fetch(`/api/flora/categories/${selectedCategory}/fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_fields: updatedFields })
      });

      const result = await res.json();

      if (res.ok && result.success) {
        // Get REAL fresh data
        await loadCategories();
        setRefreshKey(prev => prev + 1);
        
        // Trigger global refresh
        window.dispatchEvent(new CustomEvent('categoryFieldsUpdated', {
          detail: { categoryId: selectedCategory }
        }));
      } else {
        alert(`❌ Failed to delete field: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to delete field:', error);
      alert('❌ Network error deleting field');
    }
  };

  const handleUpdatePricing = async (categoryId: number, tiers: any[]) => {
    // Get all products in category
    const productsRes = await fetch(`https://api.floradistro.com/wp-json/wc/v3/products?category=${categoryId}&per_page=100&consumer_key=ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5&consumer_secret=cs_38194e74c7ddc5d72b6c32c70485728e7e529678`);
    const products = await productsRes.json();

    // Update pricing for each product
    for (const product of products) {
      await fetch(`/api/flora/products/${product.id}/pricing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base_price: tiers[0].price,
          quantity_tiers: tiers
        })
      });
    }
  };

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
            Native WooCommerce - Category field assignments stored in wp_termmeta
          </p>
        </div>
        <Button onClick={loadCategories} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Categories Sidebar */}
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
                    <span className="text-xs bg-neutral-700 px-2 py-0.5 rounded">
                      {cat.field_count}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div className="bg-neutral-900 rounded-lg border border-white/[0.08] p-4 mt-4">
            <h3 className="text-xs font-medium text-neutral-500 mb-3">System</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-600">Categories:</span>
                <span className="text-neutral-400 font-medium">{categories.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Total Fields:</span>
                <span className="text-neutral-400 font-medium">
                  {categories.reduce((sum, cat) => sum + cat.field_count, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Storage:</span>
                <span className="text-green-400 font-medium">Native</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-3 space-y-6">
          {selectedCategoryData ? (
            <>
              {/* Fields Section */}
              <div className="bg-neutral-900 rounded-lg border border-white/[0.08] p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-neutral-100">
                      {selectedCategoryData.category_name} Fields
                    </h3>
                    <p className="text-sm text-neutral-500 mt-1">
                      {selectedCategoryData.field_count} fields assigned • Auto-inherited by all products in this category
                    </p>
                    <div className="text-xs text-neutral-700 mt-1">
                      Refresh Key: {refreshKey} • Fields: {Object.keys(selectedCategoryData.assigned_fields).length}
                    </div>
                  </div>
                  <Button onClick={() => setShowAddField(true)} size="sm">
                    Add Field
                  </Button>
                </div>

                {selectedCategoryData.field_count > 0 ? (
                  <div className="space-y-3" key={refreshKey}>
                    {Object.entries(selectedCategoryData.assigned_fields)
                      .filter(([_, config]) => config.type !== 'blueprint') // Hide blueprint marker fields
                      .sort((a, b) => a[1].order - b[1].order)
                      .map(([fieldName, config]) => (
                        <div 
                          key={`${fieldName}-${config.label}-${refreshKey}`}
                          className={`
                            bg-neutral-800 border border-white/[0.04] rounded-lg p-4 
                            hover:border-white/[0.08] transition-all duration-300
                            ${savingField === fieldName ? 'ring-2 ring-green-500/50 animate-pulse' : ''}
                          `}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-neutral-200 font-medium">{config.label}</h4>
                                <span className="text-xs bg-neutral-700 text-neutral-400 px-2 py-1 rounded">
                                  {config.type}
                                </span>
                                {config.required && (
                                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                                    Required
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-neutral-500 space-y-1">
                                <div>Field name: <span className="font-mono text-neutral-400">{fieldName}</span></div>
                                {config.group && <div>Group: <span className="text-neutral-400">{config.group}</span></div>}
                                {config.config && config.config.options && (
                                  <div className="mt-2">
                                    Options: <span className="text-neutral-400">{config.config.options.join(', ')}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setEditingField(fieldName)}
                                className="text-neutral-500 hover:text-blue-400 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteField(fieldName)}
                                className="text-neutral-500 hover:text-red-400 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-neutral-600">
                    <svg className="w-12 h-12 mx-auto mb-3 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>No fields assigned to this category</p>
                    <Button onClick={() => setShowAddField(true)} size="sm" className="mt-4">
                      Add First Field
                    </Button>
                  </div>
                )}
              </div>

              {/* Pricing Template */}
              <div className="bg-neutral-900 rounded-lg border border-white/[0.08] p-6">
                <h3 className="text-lg font-medium text-neutral-100 mb-4">
                  Pricing Structure
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-neutral-500 mb-3">Current Pricing Tiers</div>
                    <div className="space-y-2">
                      {getPricingForCategory(selectedCategoryData.category_name).map((tier, i) => (
                        <div key={i} className="flex justify-between bg-neutral-800 rounded px-3 py-2 text-sm">
                          <span className="text-neutral-400">{tier.weight || `${tier.qty} units`}</span>
                          <span className="text-neutral-300">${tier.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-neutral-500 mb-3">Storage</div>
                    <div className="space-y-2 text-xs">
                      <div className="bg-neutral-800 rounded p-3">
                        <div className="text-neutral-600 mb-1">Meta Key</div>
                        <div className="font-mono text-neutral-400">_product_price_tiers</div>
                      </div>
                      <div className="bg-neutral-800 rounded p-3">
                        <div className="text-neutral-600 mb-1">Table</div>
                        <div className="font-mono text-neutral-400">wp_postmeta</div>
                      </div>
                      <div className="bg-green-500/10 border border-green-500/20 rounded p-3 text-green-400">
                        ✓ Native WooCommerce
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-neutral-900 rounded-lg border border-white/[0.08] p-12 text-center text-neutral-600">
              <svg className="w-16 h-16 mx-auto mb-4 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              <p className="text-lg">Select a category</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Field Modal */}
      {editingField && editingFieldData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditingField(null)}>
          <div className="bg-neutral-900 rounded-lg border border-white/[0.08] p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-neutral-100 mb-4">
              Edit Field: {editingFieldData.label}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Label</label>
                <input
                  type="text"
                  defaultValue={editingFieldData.label}
                  className="w-full bg-neutral-800 border border-white/[0.04] rounded px-3 py-2 text-neutral-300"
                  id="edit-label"
                />
              </div>
              
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Type</label>
                <select
                  defaultValue={editingFieldData.type}
                  className="w-full bg-neutral-800 border border-white/[0.04] rounded px-3 py-2 text-neutral-300"
                  id="edit-type"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="select">Select</option>
                  <option value="textarea">Textarea</option>
                  <option value="date">Date</option>
                  <option value="checkbox">Checkbox</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  defaultChecked={editingFieldData.required}
                  className="rounded border-neutral-700"
                  id="edit-required"
                />
                <label className="text-sm text-neutral-400">Required</label>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button
                onClick={() => {
                  const label = (document.getElementById('edit-label') as HTMLInputElement)?.value;
                  const type = (document.getElementById('edit-type') as HTMLSelectElement)?.value;
                  const required = (document.getElementById('edit-required') as HTMLInputElement)?.checked;
                  
                  if (!label || !type) {
                    alert('Label and type are required!');
                    return;
                  }
                  
                  handleUpdateField(editingField, { label, type, required });
                }}
                className="flex-1"
              >
                Save Changes
              </Button>
              <Button onClick={() => setEditingField(null)} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Field Modal */}
      {showAddField && selectedCategoryData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddField(false)}>
          <div className="bg-neutral-900 rounded-lg border border-white/[0.08] p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-neutral-100 mb-4">
              Add Field to {selectedCategoryData.category_name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Field Name (slug)</label>
                <input
                  type="text"
                  placeholder="e.g., harvest_date"
                  className="w-full bg-neutral-800 border border-white/[0.04] rounded px-3 py-2 text-neutral-300"
                  id="new-name"
                />
              </div>
              
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Label</label>
                <input
                  type="text"
                  placeholder="e.g., Harvest Date"
                  className="w-full bg-neutral-800 border border-white/[0.04] rounded px-3 py-2 text-neutral-300"
                  id="new-label"
                />
              </div>
              
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Type</label>
                <select
                  className="w-full bg-neutral-800 border border-white/[0.04] rounded px-3 py-2 text-neutral-300"
                  id="new-type"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="select">Select (Dropdown)</option>
                  <option value="textarea">Textarea</option>
                  <option value="date">Date</option>
                  <option value="checkbox">Checkbox</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-neutral-700"
                  id="new-required"
                />
                <label className="text-sm text-neutral-400">Required</label>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button
                onClick={() => {
                  const name = (document.getElementById('new-name') as HTMLInputElement).value;
                  const label = (document.getElementById('new-label') as HTMLInputElement).value;
                  const type = (document.getElementById('new-type') as HTMLSelectElement).value;
                  const required = (document.getElementById('new-required') as HTMLInputElement).checked;
                  
                  if (name && label) {
                    handleAddField({ name, label, type, required });
                  }
                }}
                className="flex-1"
              >
                Add Field
              </Button>
              <Button onClick={() => setShowAddField(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getPricingForCategory(categoryName: string): any[] {
  const templates: Record<string, any[]> = {
    'Flower': [
      { weight: '1g', price: 14.99 },
      { weight: '3.5g', price: 39.99 },
      { weight: '7g', price: 69.99 },
      { weight: '14g', price: 109.99 },
      { weight: '28g', price: 199.99 }
    ],
    'Edibles': [
      { qty: 1, price: 29.99 },
      { qty: 2, price: 49.99 },
      { qty: 3, price: 74.99 },
      { qty: 4, price: 89.99 }
    ],
    'Concentrate': [
      { weight: '1g', price: 34.99 },
      { weight: '2g', price: 59.99 },
      { weight: '3g', price: 79.99 },
      { weight: '4g', price: 99.99 }
    ],
    'Vape': [
      { qty: 1, price: 34.99 },
      { qty: 2, price: 59.99 },
      { qty: 3, price: 74.99 }
    ],
    'Moonwater': [
      { qty: 1, price: 6.99 },
      { qty: 4, price: 24.99 }
    ]
  };

  return templates[categoryName] || [];
}

