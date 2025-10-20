'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Product, ColumnConfig } from '../../types';
import { useBulkEditFieldContext } from '../../contexts/BulkEditFieldContext';
import { Button, CategoryTag, ImageUpload, CoaManager } from '../ui';
import { inventoryService, InventoryService } from '../../services/inventory-service';
import { varianceHistoryService } from '../../services/variance-history-service';
import { recipeService, Recipe } from '../../services/recipe-service';
import { ProductPricingTiers } from './ProductPricingTiers';

// Editable Blueprint Fields Component
interface EditableBlueprintFieldsProps {
  blueprintFields: any[];
  editValues: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  isLoading?: boolean;

}

function EditableBlueprintFields({ blueprintFields, editValues, onChange, isLoading }: EditableBlueprintFieldsProps) {
  const [selectedFieldsFromContext, setSelectedFieldsFromContext] = useState<Set<string>>(new Set());
  
  // Listen for field selection changes from bulk edit context
  useEffect(() => {
    const handleFieldSelectionChange = (event: CustomEvent) => {
      const { selectedFields } = event.detail;
      setSelectedFieldsFromContext(new Set(selectedFields));
    };

    window.addEventListener('bulkFieldSelectionChanged', handleFieldSelectionChange as EventListener);
    return () => {
      window.removeEventListener('bulkFieldSelectionChanged', handleFieldSelectionChange as EventListener);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-3 bg-neutral-800 rounded w-20"></div>
        <div className="h-2 bg-neutral-800 rounded w-32"></div>
        <div className="h-2 bg-neutral-800 rounded w-24"></div>
      </div>
    );
  }

  if (!blueprintFields || blueprintFields.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="text-neutral-600 text-xs mb-2">
          No blueprint fields assigned
        </div>
        <div className="text-neutral-700 text-xs">
          This product doesn't have any blueprint fields assigned to its categories yet.
        </div>
      </div>
    );
  }

  // Filter fields based on selection from bulk edit context
  const visibleFields = blueprintFields.filter(field => {
    // If no fields are selected in context, show all fields (default behavior)
    if (selectedFieldsFromContext.size === 0) return true;
    // Otherwise, only show fields that are selected
    return selectedFieldsFromContext.has(field.field_name);
  });

  const handleFieldChange = (fieldName: string, value: any) => {
    onChange({
      ...editValues,
      [fieldName]: value
    });
  };

  const renderEditableField = (field: any) => {
    const { field_name, field_type, field_label, field_value, is_required, display_options } = field;
    // Use field_value from API as default, only override if user has edited
    const currentValue = editValues[field_name] !== undefined ? editValues[field_name] : (field_value ?? '');

    const baseClasses = `border border-white/[0.08] rounded p-2 transition-all duration-200`;

    switch (field_type) {
      case 'text':
      case 'email':
      case 'url':
        return (
          <div 
            key={field_name} 
            className={baseClasses}

          >
            <div className="flex justify-between items-center mb-1">
              <div className="text-neutral-600 text-xs font-medium">{field_label}</div>
            </div>
            <input
              type={field_type}
              value={currentValue}
              onChange={(e) => handleFieldChange(field_name, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="bg-transparent text-neutral-500 text-xs border-none outline-none focus:text-neutral-300 w-full"
              placeholder={
                field_label === 'Thca %' ? '%' : 
                field_label === 'Effect' ? 'Enter effect' :
                field_label === 'Lineage' ? 'Enter lineage' :
                field_label === 'Nose' ? 'Enter nose' :
                field_label === 'Terpene' ? 'Enter terpene' :
                field_label === 'Type' ? 'Enter type' :
                `Enter ${field_label.toLowerCase()}`
              }
            />
          </div>
        );

      case 'textarea':
        return (
          <div 
            key={field_name} 
            className={baseClasses}

          >
            <div className="flex justify-between items-center mb-1">
              <div className="text-neutral-600 text-xs font-medium">{field_label}</div>
            </div>
            <textarea
              value={currentValue}
              onChange={(e) => handleFieldChange(field_name, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="bg-transparent text-neutral-500 text-xs leading-relaxed border-none outline-none focus:text-neutral-300 w-full resize-none"
              placeholder={
                field_label === 'Thca %' ? '%' : 
                field_label === 'Effect' ? 'Enter effect' :
                field_label === 'Lineage' ? 'Enter lineage' :
                field_label === 'Nose' ? 'Enter nose' :
                field_label === 'Terpene' ? 'Enter terpene' :
                field_label === 'Type' ? 'Enter type' :
                `Enter ${field_label.toLowerCase()}`
              }
              rows={3}
            />
          </div>
        );

      case 'number':
        return (
          <div 
            key={field_name} 
            className={baseClasses}

          >
            <div className="flex justify-between items-center mb-1">
              <div className="text-neutral-600 text-xs font-medium">{field_label}</div>
            </div>
            <input
              type="number"
              step="0.1"
              value={currentValue}
              onChange={(e) => handleFieldChange(field_name, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="bg-transparent text-neutral-500 text-xs border-none outline-none focus:text-neutral-300 w-full"
              placeholder={field_label === 'Thca %' ? '%' : '0'}
            />
          </div>
        );

      case 'select':
      case 'radio':
        const options = display_options?.options || display_options?.choices || [];
        return (
          <div 
            key={field_name} 
            className={baseClasses}

          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-neutral-600 text-xs font-medium">
                {field_label}
                {is_required && <span className="text-red-400 ml-1">*</span>}
              </span>

            </div>
            <select
              value={currentValue}
              onChange={(e) => handleFieldChange(field_name, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-800 text-neutral-500 text-xs border border-white/[0.04] rounded w-full p-1 focus:text-neutral-300 focus:border-blue-500/50"
            >
              <option value="">Select {field_label.toLowerCase()}</option>
              {Array.isArray(options) && options.map((option: any, index: number) => (
                <option key={index} value={typeof option === 'object' ? option.value : option}>
                  {typeof option === 'object' ? option.label : option}
                </option>
              ))}
            </select>
          </div>
        );

      case 'checkbox':
        const checkboxOptions = display_options?.options || display_options?.choices || [];
        const selectedValues = Array.isArray(currentValue) ? currentValue : [];
        
        return (
          <div 
            key={field_name} 
            className={baseClasses}

          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-neutral-600 text-xs font-medium">
                {field_label}
                {is_required && <span className="text-red-400 ml-1">*</span>}
              </span>

            </div>
            <div className="space-y-1">
              {Array.isArray(checkboxOptions) && checkboxOptions.map((option: any, index: number) => {
                const optionValue = typeof option === 'object' ? option.value : option;
                const optionLabel = typeof option === 'object' ? option.label : option;
                const isChecked = selectedValues.includes(optionValue);
                
                return (
                  <label key={index} className="flex items-center gap-2 text-xs text-neutral-500">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const newValues = e.target.checked
                          ? [...selectedValues, optionValue]
                          : selectedValues.filter((v: any) => v !== optionValue);
                        handleFieldChange(field_name, newValues);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded border-neutral-600 bg-neutral-800 text-white focus:ring-white/20/50"
                    />
                    {optionLabel}
                  </label>
                );
              })}
            </div>
          </div>
        );

      default:
        return (
          <div 
            key={field_name} 
            className={baseClasses}

          >
            <div className="flex justify-between items-center mb-1">
              <div className="text-neutral-600 text-xs font-medium">{field_label}</div>
            </div>
            <input
              type="text"
              value={currentValue}
              onChange={(e) => handleFieldChange(field_name, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="bg-transparent text-neutral-500 text-xs border-none outline-none focus:text-neutral-300 w-full"
              placeholder={
                field_label === 'Thca %' ? '%' : 
                field_label === 'Effect' ? 'Enter effect' :
                field_label === 'Lineage' ? 'Enter lineage' :
                field_label === 'Nose' ? 'Enter nose' :
                field_label === 'Terpene' ? 'Enter terpene' :
                field_label === 'Type' ? 'Enter type' :
                `Enter ${field_label.toLowerCase()}`
              }
            />
          </div>
        );
    }
  };

  return (
    <div className="space-y-2">
      {visibleFields.map(renderEditableField)}
    </div>
  );
}

interface ProductTableRowProps {
  product: Product;
  selectedLocationId?: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onManageInventory?: () => void;
  onRefresh?: () => void;
  isSelected?: boolean;
  onSelect?: () => void;
  visibleColumns?: ColumnConfig[];
  getBlueprintFieldValue?: (product: Product, fieldName: string) => any;
  formatBlueprintFieldValue?: (value: any, fieldType: string) => string;
  isBulkEditMode?: boolean;
}

type StockViewMode = 'details' | 'update' | 'transfer' | 'convert';

export const ProductTableRow = React.memo(function ProductTableRow({ 
  product, 
  selectedLocationId, 
  isExpanded, 
  onToggleExpand, 
  onEdit, 
  onManageInventory, 
  onRefresh, 
  isSelected = false, 
  onSelect,
  visibleColumns = [],
  getBlueprintFieldValue,
  formatBlueprintFieldValue,
  isBulkEditMode = false
}: ProductTableRowProps) {
  
  const [stockViewMode, setStockViewMode] = useState<StockViewMode>('details');
  
  // Edit mode state - automatically enter edit mode when in bulk edit mode
  const [isEditMode, setIsEditMode] = useState(isBulkEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning', text: string } | null>(null);
  const [blueprintRefreshTrigger, setBlueprintRefreshTrigger] = useState(0);
  const [selectedFieldsFromContext, setSelectedFieldsFromContext] = useState<Set<string>>(new Set());
  

  

  const [editData, setEditData] = useState(() => {
    // Initialize with uploaded image if it exists in localStorage
    const storedImage = typeof window !== 'undefined' 
      ? localStorage.getItem(`uploaded-image-${product.id}`) 
      : null;
    
    return {
      name: product.name || '',
      sku: product.sku || '',
      description: '',
      short_description: '',
      image: storedImage || product.image || ''
    };
  });
  const [editBlueprintFields, setEditBlueprintFields] = useState<Record<string, any>>({});
  
  // Separate state for uploaded images that persists across refreshes
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(() => {
    // Initialize from localStorage on component mount
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`uploaded-image-${product.id}`);
      return stored || null;
    }
    return null;
  });

  // Save uploaded image URL to localStorage whenever it changes
  useEffect(() => {
    if (uploadedImageUrl) {
      localStorage.setItem(`uploaded-image-${product.id}`, uploadedImageUrl);
    }
  }, [uploadedImageUrl, product.id]);

  // Sync uploaded image with edit data when entering edit mode
  useEffect(() => {
    if (isEditMode && uploadedImageUrl) {
      setEditData(prev => ({
        ...prev,
        image: uploadedImageUrl
      }));
    }
  }, [isEditMode, uploadedImageUrl]);
  
  // Stock update state (UI only)
  const [stockUpdates, setStockUpdates] = useState<Record<string, string>>({});
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});
  const [updateMessages, setUpdateMessages] = useState<Record<string, { type: 'success' | 'error', text: string }>>({});
  
  // Convert product state
  const [convertData, setConvertData] = useState({
    fromLocationId: '',
    targetLocationId: '',
    sourceQuantity: '',
    targetQuantity: '',
    conversionRatio: '',
    targetProductSearch: '',
    selectedTargetProduct: null as any,
    notes: '',
    recipeId: '',
    expectedOutput: 0,
    actualOutput: '',
    varianceReasons: [] as string[],
    conversionId: null as number | null,
    conversionStatus: 'pending' as 'pending' | 'yield_recording' | 'completed',
    outputProductSearch: '',
    selectedOutputProduct: null as any
  });
  const [isRatioMode, setIsRatioMode] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [outputSearchResults, setOutputSearchResults] = useState<any[]>([]);
  const [isOutputSearching, setIsOutputSearching] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [convertMessage, setConvertMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Recipe state
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Function to render column content
  const renderColumnContent = (column: ColumnConfig) => {
    switch (column.id) {
      case 'product':
                  return (
            <div className={`${column.width || 'flex-[2]'} min-w-0 transition-all duration-200 ${
              isEditMode ? 'border border-white/[0.08] rounded px-2 py-1' : ''
            }`}>
            <div className="flex items-center gap-1.5 md:gap-0 min-w-0">
              <div className="truncate flex-1 min-w-0">
                {isEditMode && isFieldVisible('name') ? (
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => {
                      // Prevent auto-selection of text when input is focused
                      e.target.setSelectionRange(e.target.value.length, e.target.value.length);
                    }}
                    onMouseDown={(e) => {
                      // Prevent text selection when clicking
                      e.stopPropagation();
                    }}
                    className="bg-transparent text-neutral-400 text-sm md:text-sm font-normal border-none outline-none focus:text-neutral-300 w-full"
                    placeholder="Product name"
                  />
                ) : isEditMode && !isFieldVisible('name') ? (
                  <span className="text-neutral-600 text-sm md:text-sm font-normal italic">Name field hidden</span>
                ) : (
                  <div className="truncate">
                    <span className={`text-xs md:text-sm font-normal truncate select-none product-name ${
                      isEditMode ? 'text-yellow-400 bg-yellow-900/20 px-1 rounded' : 'text-neutral-300'
                    }`}>
                      {isEditMode ? `${editData.name} (PREVIEW)` : product.name}
                    </span>
                    {/* Inline category badge on mobile */}
                    {product.categories && product.categories.length > 0 && (
                      <span className="md:hidden ml-1 text-neutral-600 text-[8px] bg-neutral-800/50 px-1 py-px rounded inline-block">
                        {product.categories[0].name}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'category':
        return (
          <div className={`${column.width || 'w-24 md:w-32'} hidden md:block`}>
            {product.categories && product.categories.length > 0 ? (
              <span className="text-neutral-600 text-xs bg-neutral-800/50 px-2 py-0.5 rounded truncate block">
                {product.categories[0].name}
              </span>
            ) : (
              <span className="text-neutral-700 text-xs">-</span>
            )}
          </div>
        );

      case 'stock':
        return (
          <div className={`${column.width || 'w-auto md:w-24'} flex-shrink-0`}>
            <div className="text-[10px] md:text-xs text-neutral-400 font-mono text-right whitespace-nowrap">{stockValue} units</div>
          </div>
        );



      default:
        // Handle blueprint fields - hide on mobile
        if (column.type === 'blueprint' && column.blueprint_field_name && getBlueprintFieldValue && formatBlueprintFieldValue) {
          const value = getBlueprintFieldValue(product, column.blueprint_field_name);
          const formattedValue = formatBlueprintFieldValue(value, column.blueprint_field_type || 'text');
          
          return (
            <div className={`${column.width || 'w-32'} hidden md:block`}>
              <span className="text-neutral-500 text-xs truncate block" title={formattedValue}>
                {formattedValue}
              </span>
            </div>
          );
        }
        return null;
    }
  };
  
  // Transfer stock state
  const [transferData, setTransferData] = useState({
    fromLocationId: '',
    toLocationId: '',
    quantity: '',
    notes: ''
  });
  const [transferMessage, setTransferMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);

  // Load recipes when convert mode is activated
  useEffect(() => {
    if (stockViewMode === 'convert') {
      loadRecipes();
    }
  }, [stockViewMode]);

  // Load recipes for this product
  const loadRecipes = async () => {
    setLoadingRecipes(true);
    try {
      const availableRecipes = await varianceHistoryService.getAvailableRecipes(product.id);
      if (availableRecipes.length > 0) {
        const activeRecipes = availableRecipes.filter(r => r.status === 'active');
        setRecipes(activeRecipes);
      } else {
        // Fallback to all recipes
        const fetchedRecipes = await recipeService.getRecipes();
        const activeRecipes = fetchedRecipes.filter(r => r.status === 'active');
        setRecipes(activeRecipes);
      }
    } catch (error) {
      setRecipes([]);
    } finally {
      setLoadingRecipes(false);
    }
  };

  // Handle recipe selection
  useEffect(() => {
    const recipe = recipes.find(r => r.id.toString() === convertData.recipeId);
    setSelectedRecipe(recipe || null);
    
    if (recipe && convertData.sourceQuantity) {
      const expectedOutput = parseFloat(convertData.sourceQuantity) * recipe.base_ratio;
      setConvertData(prev => ({
        ...prev,
        expectedOutput
      }));
    }
  }, [convertData.recipeId, convertData.sourceQuantity, recipes]);

  // Handle collapse cleanup in a separate useEffect to avoid dependency loop
  useEffect(() => {
    if (!isExpanded) {
      // Reset stock view mode when card collapses
      setStockViewMode('details');
      // Deactivate edit mode when card collapses
      setIsEditMode(false);
    }
  }, [isExpanded]);

  // NO LAZY LOADING - All data comes from bulk API

  // Sync edit mode with bulk edit mode
  useEffect(() => {
    if (isBulkEditMode && !isEditMode) {
      setIsEditMode(true);
    } else if (!isBulkEditMode && isEditMode && !isExpanded) {
      // Only exit edit mode if not expanded (user didn't manually enter edit mode)
      setIsEditMode(false);
    }
  }, [isBulkEditMode, isEditMode, isExpanded]);

  // Listen for bulk save events (will be set up after handleSaveEdits is defined)

  // Initialize edit data from bulk API product data
  useEffect(() => {
    if (isEditMode) {
      setEditData({
        name: product.name || '',
        sku: product.sku || '',
        description: product.description || '',
        short_description: product.short_description || '',
        image: product.image || ''
      });
    }
  }, [isEditMode, product]);

  // Handle save product edits
  const handleSaveEdits = async () => {
    console.log('=== SAVE BUTTON CLICKED ===');
    console.log('Product ID:', product.id);
    console.log('Current editData state:', editData);
    console.log('Current editBlueprintFields state:', editBlueprintFields);
    console.log('Original product data:', product);
    
    setIsSaving(true);
    try {
      // Prepare blueprint fields for API
      const blueprintFieldsData = Object.keys(editBlueprintFields).length > 0 ? editBlueprintFields : undefined;
      
      const requestData = {
        name: editData.name,
        sku: editData.sku,
        description: editData.description,
        short_description: editData.short_description,
        ...(editData.image && editData.image !== product.image && { image: editData.image }),
        blueprint_fields: blueprintFieldsData,
      };
      
      console.log('Request being sent to API:', requestData);
      
      const response = await fetch(`/api/flora/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update product: ${response.status} - ${errorText}`);
      }

      const updatedProduct = await response.json();

      
      // Show success message to user
      if (updatedProduct.success) {
        setMessage({ type: 'success', text: 'Saved' });
        
        // Clear success message after 2 seconds (more subtle)
        setTimeout(() => setMessage(null), 2000);
      }
      
      // Exit edit mode
      setIsEditMode(false);
      
      // Small delay to ensure server has processed the update
      await new Promise(resolve => setTimeout(resolve, 100));
      // await fetchFullProductData(); // TODO: Implement fetchFullProductData
      
      // Also trigger parent refresh if needed
      if (onRefresh) {
        onRefresh();
      }
      
    } catch (error) {
      alert('Failed to update product. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    // Reset edit data to original values
    setEditData({
      name: product.name || '',
      sku: product.sku || '',
      description: product.description || '',
      short_description: product.short_description || '',
      image: product.image || ''
    });
    
    // Reset blueprint fields to original values
    // TODO: Implement blueprintFields
    // if (blueprintFields && blueprintFields.length > 0) {
    //   const fieldValues: Record<string, any> = {};
    //   blueprintFields.forEach(field => {
    //     fieldValues[field.field_name] = field.field_value || '';
    //   });
    //   setEditBlueprintFields(fieldValues);
    // }
    setEditBlueprintFields({});
    
    setIsEditMode(false);
  };

  // Listen for bulk save events
  useEffect(() => {
    const handleBulkSave = (event: CustomEvent) => {
      const { productIds } = event.detail;
      if (productIds.includes(product.id) && isEditMode) {
        // Save this product as part of bulk save
        handleSaveEdits();
      }
    };

    window.addEventListener('bulkSaveRequested', handleBulkSave as EventListener);
    return () => {
      window.removeEventListener('bulkSaveRequested', handleBulkSave as EventListener);
    };
  }, [product.id, isEditMode, handleSaveEdits]);

  // Define the JSON field update handler at component level
  const handleJsonFieldUpdate = useCallback((event: CustomEvent) => {
    const { productId, fieldData } = event.detail;
    if (productId == product.id) { // Use loose equality to handle string/number mismatch
      
      // Enable edit mode to show the changes
      if (!isEditMode) {
        setIsEditMode(true);
      }
      
      // Force expand the product card to show the preview changes
      if (!isExpanded && onToggleExpand) {
        onToggleExpand();
      }
      
      // Update the edit fields with preview data
      // Update basic product fields
      if (fieldData.name !== undefined || fieldData.sku !== undefined || 
          fieldData.description !== undefined || fieldData.short_description !== undefined) {
        setEditData(prev => ({
          ...prev,
          ...(fieldData.name !== undefined && { name: fieldData.name }),
          ...(fieldData.sku !== undefined && { sku: fieldData.sku }),
          ...(fieldData.description !== undefined && { description: fieldData.description }),
          ...(fieldData.short_description !== undefined && { short_description: fieldData.short_description })
        }));
      }

      // Update blueprint fields
      const blueprintFieldUpdates: Record<string, any> = {};
      let hasBlueprintUpdates = false;
      
      Object.keys(fieldData).forEach(key => {
        // Skip basic product fields
        if (!['name', 'sku', 'description', 'short_description', 'id'].includes(key)) {
          blueprintFieldUpdates[key] = fieldData[key];
          hasBlueprintUpdates = true;
        }
      });

      if (hasBlueprintUpdates) {
        setEditBlueprintFields(prev => ({
          ...prev,
          ...blueprintFieldUpdates
        }));
      }
      
      // Preview changes applied to UI
    }
  }, [product.id, isEditMode, isExpanded, onToggleExpand, setIsEditMode, setEditData, setEditBlueprintFields]);

  // Listen for bulk JSON field updates
  useEffect(() => {

    window.addEventListener('bulkJsonFieldUpdate', handleJsonFieldUpdate as EventListener);
    return () => {
      window.removeEventListener('bulkJsonFieldUpdate', handleJsonFieldUpdate as EventListener);
    };
  }, [product.id, handleJsonFieldUpdate]); // Include handler in dependencies

  // Listen for field selection changes from bulk edit context
  useEffect(() => {
    const handleFieldSelectionChange = (event: CustomEvent) => {
      const { selectedFields } = event.detail;
      setSelectedFieldsFromContext(new Set(selectedFields));
    };

    window.addEventListener('bulkFieldSelectionChanged', handleFieldSelectionChange as EventListener);
    return () => {
      window.removeEventListener('bulkFieldSelectionChanged', handleFieldSelectionChange as EventListener);
    };
  }, []);






  // Helper function to check if a field should be visible based on selection
  const isFieldVisible = useCallback((fieldName: string) => {
    // If no fields are selected in context, show all fields (default behavior)
    if (selectedFieldsFromContext.size === 0) return true;
    // Otherwise, only show fields that are selected
    return selectedFieldsFromContext.has(fieldName);
  }, [selectedFieldsFromContext]);

  // Handle image upload success
  const handleImageUploaded = useCallback((imageUrl: string, mediaId: number) => {
    // Store in both edit data and persistent uploaded image state
    setEditData(prev => ({
      ...prev,
      image: imageUrl
    }));
    setUploadedImageUrl(imageUrl);
    
    setMessage({
      type: 'success',
      text: 'Image uploaded successfully!'
    });
    
    // Auto-clear message after 3 seconds
    setTimeout(() => setMessage(null), 3000);
  }, []);

  // Handle image upload error
  const handleImageUploadError = useCallback((error: string) => {
    setMessage({
      type: 'error',
      text: `Image upload failed: ${error}`
    });
    
    // Auto-clear message after 5 seconds
    setTimeout(() => setMessage(null), 5000);
  }, []);

  // Clear uploaded image
  const clearUploadedImage = useCallback(() => {
    setUploadedImageUrl(null);
    setEditData(prev => ({
      ...prev,
      image: product.image || ''
    }));
    localStorage.removeItem(`uploaded-image-${product.id}`);
  }, [product.id, product.image]);

  // Handle stock update for a specific location
  const handleStockUpdate = async (locationId: string, locationName: string) => {
    const newQuantity = stockUpdates[locationId];
    
    // Validate input exists
    if (!newQuantity || newQuantity.trim() === '') {
      setUpdateMessages(prev => ({
        ...prev,
        [locationId]: { type: 'error', text: 'Please enter a quantity' }
      }));
      return;
    }

    // Validate quantity is a valid number
    const quantity = parseFloat(newQuantity.trim());
    if (isNaN(quantity)) {
      setUpdateMessages(prev => ({
        ...prev,
        [locationId]: { type: 'error', text: 'Please enter a valid number' }
      }));
      return;
    }

    if (quantity < 0) {
      setUpdateMessages(prev => ({
        ...prev,
        [locationId]: { type: 'error', text: 'Quantity cannot be negative' }
      }));
      return;
    }

    // Validate location ID
    const parsedLocationId = parseInt(locationId);
    if (isNaN(parsedLocationId) || parsedLocationId <= 0) {
      setUpdateMessages(prev => ({
        ...prev,
        [locationId]: { type: 'error', text: `Invalid location ID: ${locationId}. Please refresh the page.` }
      }));
      return;
    }

    setIsUpdating(prev => ({ ...prev, [locationId]: true }));
    setUpdateMessages(prev => ({ ...prev, [locationId]: { type: 'success', text: 'Updating...' } }));

    try {
      (`Updating inventory: Product ${product.id}, Location ${parsedLocationId}, Quantity ${quantity}`);
      
      // Find the inventory record for this product and location
      const inventoryRecord = product.inventory?.find(inv => 
        inv.location_id.toString() === locationId.toString()
      );

      if (!inventoryRecord) {
        throw new Error('Inventory record not found for this location');
      }

      // Use Flora IM API directly with product_id and location_id
      const response = await fetch('/api/flora/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: product.id,
          location_id: parsedLocationId,
          quantity: quantity
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();

      if (result.success) {
        setUpdateMessages(prev => ({
          ...prev,
          [locationId]: { type: 'success', text: `Updated ${locationName} to ${quantity} units` }
        }));
        setStockUpdates(prev => ({ ...prev, [locationId]: '' }));
        
        // Refresh the product data to show updated inventory
        if (onRefresh) {
          setTimeout(() => {
            onRefresh();
          }, 1000); // Delay to ensure Magic2 update is processed
        }
        
        // Clear message after 3 seconds
        setTimeout(() => {
          setUpdateMessages(prev => {
            const newMessages = { ...prev };
            delete newMessages[locationId];
            return newMessages;
          });
        }, 3000);
      } else {
        const errorMessage = result.error || 'Update failed';
        setUpdateMessages(prev => ({
          ...prev,
          [locationId]: { type: 'error', text: errorMessage }
        }));
      }
    } catch (error) {
      setUpdateMessages(prev => ({
        ...prev,
        [locationId]: { type: 'error', text: 'Update failed: Network error' }
      }));
    } finally {
      setIsUpdating(prev => ({ ...prev, [locationId]: false }));
    }
  };

  // Handle transfer stock
  const handleTransfer = async () => {
    if (!transferData.fromLocationId || !transferData.toLocationId || !transferData.quantity) {
      setTransferMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    if (transferData.fromLocationId === transferData.toLocationId) {
      setTransferMessage({ type: 'error', text: 'Source and destination locations must be different' });
      return;
    }

    const quantity = parseFloat(transferData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      setTransferMessage({ type: 'error', text: 'Please enter a valid quantity' });
      return;
    }

    setIsTransferring(true);
    setTransferMessage({ type: 'success', text: 'Transferring stock...' });

    try {
      const result = await inventoryService.transferStock(
        product.id,
        parseInt(transferData.fromLocationId),
        parseInt(transferData.toLocationId),
        quantity,
        transferData.notes || `Transfer via Update Stock tab for ${product.name}`
      );

      if (result.success) {
        setTransferMessage({ type: 'success', text: `Successfully transferred ${quantity} units` });
        setTransferData({
          fromLocationId: '',
          toLocationId: '',
          quantity: '',
          notes: ''
        });

        // Refresh product data
        if (onRefresh) {
          onRefresh();
        }

        // Clear message after 5 seconds
        setTimeout(() => setTransferMessage(null), 5000);
      } else {
        setTransferMessage({ type: 'error', text: result.error || 'Transfer failed' });
      }
    } catch (error) {
      setTransferMessage({ type: 'error', text: 'Transfer failed: Network error' });
    } finally {
      setIsTransferring(false);
    }
  };

  // Handle product search for convert functionality
  const handleProductSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await inventoryService.getFilteredProducts({
        search: searchTerm,
        per_page: 10
      });

      if (response.success) {
        // Filter out the current product from search results
        const filteredResults = response.data.filter(p => p.id !== product.id);
        setSearchResults(filteredResults);
      }
    } catch (error) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle output product search for convert functionality
  const handleOutputProductSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setOutputSearchResults([]);
      return;
    }

    setIsOutputSearching(true);
    try {
      const response = await inventoryService.getFilteredProducts({
        search: searchTerm,
        per_page: 10
      });

      if (response.success) {
        // Filter out the current product from search results
        const filteredResults = response.data.filter(p => p.id !== product.id);
        setOutputSearchResults(filteredResults);
      }
    } catch (error) {
      setOutputSearchResults([]);
    } finally {
      setIsOutputSearching(false);
    }
  };

  // Handle convert product (simplified version for table view)
  const handleConvertProduct = async () => {
    // Handle different conversion stages
    if (convertData.conversionStatus === 'yield_recording') {
      await handleCompleteConversion();
      return;
    }

    // Validate required fields
    if (!convertData.fromLocationId || !convertData.sourceQuantity) {
      setConvertMessage({ type: 'error', text: 'Please fill in location and quantity' });
      return;
    }

    const sourceQuantity = parseFloat(convertData.sourceQuantity);
    if (isNaN(sourceQuantity) || sourceQuantity <= 0) {
      setConvertMessage({ type: 'error', text: 'Please enter valid source quantity' });
      return;
    }

    setIsConverting(true);
    setConvertMessage(null);

    try {
      // If using a recipe, initiate recipe-based conversion
      if (selectedRecipe) {
        const validationResult = await varianceHistoryService.validateConversion({
          recipe_id: selectedRecipe.id,
          input_product_id: product.id,
          location_id: parseInt(convertData.fromLocationId),
          input_quantity: sourceQuantity,
          notes: convertData.notes
        });

        if (!validationResult.valid) {
          setConvertMessage({ 
            type: 'error', 
            text: validationResult.errors?.join(', ') || 'Conversion validation failed' 
          });
          setIsConverting(false);
          return;
        }

        // Initiate the conversion
        const conversionParams: any = {
          recipe_id: selectedRecipe.id,
          input_product_id: product.id,
          location_id: parseInt(convertData.fromLocationId),
          input_quantity: sourceQuantity,
          notes: convertData.notes
        };

        // Add output product if selected
        if (convertData.selectedOutputProduct) {
          conversionParams.output_product_id = convertData.selectedOutputProduct.id;
        }

        const conversion = await varianceHistoryService.initiateConversion(conversionParams);

        // Move to yield recording stage
        setConvertData(prev => ({
          ...prev,
          conversionId: conversion.id,
          conversionStatus: 'yield_recording',
          expectedOutput: conversion.expected_output
        }));

        setConvertMessage({ 
          type: 'success', 
          text: `Conversion initiated. Input deducted. Please record actual output.` 
        });
      } else {
        // Fallback to direct conversion without recipe
        if (!convertData.selectedTargetProduct || !convertData.targetQuantity) {
          setConvertMessage({ type: 'error', text: 'Please select target product and quantity or use a recipe' });
          setIsConverting(false);
          return;
        }

        const targetQuantity = parseFloat(convertData.targetQuantity);
        if (isNaN(targetQuantity) || targetQuantity <= 0) {
          setConvertMessage({ type: 'error', text: 'Please enter valid target quantity' });
          setIsConverting(false);
          return;
        }

        const inventoryService = new InventoryService();
        const result = await inventoryService.convertStock(
          product.id,
          convertData.selectedTargetProduct.id,
          parseInt(convertData.fromLocationId),
          sourceQuantity,
          targetQuantity,
          convertData.notes
        );

        if (result.success) {
          setConvertMessage({ 
            type: 'success', 
            text: `Successfully converted ${sourceQuantity} units to ${targetQuantity} units` 
          });
          resetConvertForm();
          
          if (onRefresh) {
            onRefresh();
          }
        } else {
          setConvertMessage({ type: 'error', text: result.error || 'Conversion failed' });
        }
      }
    } catch (error) {
      setConvertMessage({ type: 'error', text: 'Conversion failed: Network error' });
    } finally {
      setIsConverting(false);
    }
  };

  const handleCompleteConversion = async () => {
    if (!convertData.conversionId || !convertData.actualOutput) {
      setConvertMessage({ type: 'error', text: 'Please enter actual output quantity' });
      return;
    }

    setIsConverting(true);
    setConvertMessage(null);

    try {
      const completion = await varianceHistoryService.completeConversion({
        conversion_id: convertData.conversionId,
        actual_output: parseFloat(convertData.actualOutput),
        variance_reasons: convertData.varianceReasons,
        notes: convertData.notes
      });

      const variance = completion.variance_percentage || 0;
      const varianceText = variance > 0 ? `+${variance}%` : `${variance}%`;

      setConvertMessage({ 
        type: 'success', 
        text: `Conversion completed. Actual output: ${convertData.actualOutput} units (${varianceText} variance)` 
      });
      
      resetConvertForm();
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      setConvertMessage({ type: 'error', text: 'Failed to complete conversion' });
    } finally {
      setIsConverting(false);
    }
  };

  const resetConvertForm = () => {
    setConvertData({
      fromLocationId: '',
      targetLocationId: '',
      sourceQuantity: '',
      targetQuantity: '',
      conversionRatio: '',
      targetProductSearch: '',
      selectedTargetProduct: null,
      notes: '',
      recipeId: '',
      expectedOutput: 0,
      actualOutput: '',
      varianceReasons: [],
      conversionId: null,
      conversionStatus: 'pending',
      outputProductSearch: '',
      selectedOutputProduct: null
    });
  };

  // Helper function to strip HTML tags
  const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  };



  // BULLETPROOF: Get stock for display with validation (matching ProductItem logic)
  const getDisplayStock = () => {
    try {
      if (!selectedLocationId) {
        // No location selected - show total stock
        return product.total_stock || 0;
      }
      
      // Location selected - show only that location's stock
      if (!product.inventory || !Array.isArray(product.inventory)) {
        return 0;
      }
      
      const locationInventory = product.inventory.filter(inv => {
        const locationId = parseInt(selectedLocationId);
        const invLocationId = parseInt(String(inv.location_id));
        return !isNaN(locationId) && !isNaN(invLocationId) && invLocationId === locationId;
      });
      
      return locationInventory.reduce((sum, inv) => {
        const stock = parseFloat(inv.stock.toString());
        return sum + (isNaN(stock) ? 0 : stock);
      }, 0);
    } catch (error) {
      return 0;
    }
  };

  const stockValue = getDisplayStock();
  const stockStatus = stockValue <= 5 ? 'low' : stockValue <= 20 ? 'medium' : 'high';

  return (
        <div 
      className={`group mb-0 md:mb-2 rounded-none md:rounded-lg border-b border-white/[0.02] product-card ${
        isSelected ? 'selected bg-neutral-800/50 md:border-l-4 md:border-l-neutral-400' : 'border-x-0 md:border-x border border-white/[0.04]'
      } ${
        isExpanded ? 'expanded' : ''
      }`}
    >
      {/* Row 1: Main product info */}
      <div 
        className="flex items-center gap-1 md:gap-3 px-2 md:px-4 py-2 md:py-2 cursor-pointer select-none product-card-row"
        onClick={(e) => {
          // Only trigger selection if clicking on the main row area, not on interactive elements
          const target = e.target as HTMLElement;
          const isInteractiveElement = target.tagName === 'INPUT' || 
                                     target.tagName === 'BUTTON' || 
                                     target.tagName === 'SELECT' ||
                                     target.tagName === 'TEXTAREA' ||
                                     target.closest('button') ||
                                     target.closest('input') ||
                                     target.closest('select') ||
                                     target.closest('textarea');
          
          if (!isInteractiveElement && onSelect) {
            onSelect();
          }
        }}
        onDoubleClick={(e) => {
          // Only trigger expand/contract on double-click in the main row area, not on interactive elements
          const target = e.target as HTMLElement;
          const isInteractiveElement = target.tagName === 'INPUT' || 
                                     target.tagName === 'BUTTON' || 
                                     target.tagName === 'SELECT' ||
                                     target.tagName === 'TEXTAREA' ||
                                     target.closest('button') ||
                                     target.closest('input') ||
                                     target.closest('select') ||
                                     target.closest('textarea');
          
          if (!isInteractiveElement) {
            e.stopPropagation();
            onToggleExpand();
          }
        }}
      >
        {/* Expand/Collapse Icon */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
          className="flex-shrink-0 w-8 h-8 md:w-6 md:h-6 flex items-center justify-center text-neutral-700 hover:text-neutral-500 rounded-md expand-button transition-colors"
        >
          <svg
            className={`w-2.5 h-2.5 md:w-2.5 md:h-2.5 expand-icon ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>


        {/* Dynamic Columns */}
        {visibleColumns.map(column => (
          <React.Fragment key={column.id}>
            {renderColumnContent(column)}
          </React.Fragment>
        ))}
      </div>



       {/* Expanded View with Optimized Animation */}
       <div 
         className={`overflow-hidden expand-animation smooth-expand ${
           isExpanded ? 'max-h-[1200px] opacity-100 expanded' : 'max-h-0 opacity-0 collapsed'
         }`}
       >
         <div className="mx-2 md:mx-4 mb-0 md:mb-2 rounded-none md:rounded p-3 md:p-4 border-t md:border border-white/[0.04]">
           <div className={`product-expanded-content ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
          
          {/* Edit Mode Controls */}
          {isEditMode && (
            <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-white/[0.04]">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <div className="text-neutral-300 text-sm font-medium">
                    Edit Mode
                  </div>
                </div>
                <div className="text-neutral-500 text-xs">
                  Click on fields to edit them
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleCancelEdit}
                  size="sm"
                  variant="ghost"
                  className="text-xs text-neutral-500"
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdits}
                  size="sm"
                  variant="primary"
                  className="text-xs"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </div>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* AI Processing Message */}
          {message && (
            <div className={`mb-3 px-3 py-2 rounded-lg text-xs border transition-all duration-200 ${
              message.type === 'success' 
                ? 'bg-green-900/10 border-green-500/20 text-green-400' 
                : message.type === 'warning'
                ? 'bg-yellow-900/10 border-yellow-500/20 text-yellow-400'
                : 'bg-red-900/10 border-red-500/20 text-red-400'
            }`}>
              <div className="flex items-center gap-2">
                {message.type === 'success' && (
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {message.type === 'warning' && (
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                )}
                {message.type === 'error' && (
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span>{message.text}</span>
              </div>
            </div>
          )}

          {/* Stock Action Buttons */}
          <div className="flex items-center gap-2 mb-4 pb-3 overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent hover:scrollbar-thumb-neutral-600">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setStockViewMode('details');
              }}
              size="sm"
              variant={stockViewMode === 'details' ? 'primary' : 'ghost'}
              className="text-xs select-none product-card-button flex-shrink-0"
            >
              Details
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setStockViewMode('update');
              }}
              size="sm"
              variant={stockViewMode === 'update' ? 'primary' : 'ghost'}
              className="text-xs flex items-center gap-1 select-none product-card-button flex-shrink-0"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Update Stock
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setStockViewMode('transfer');
              }}
              size="sm"
              variant={stockViewMode === 'transfer' ? 'primary' : 'ghost'}
              className="text-xs flex items-center gap-1 select-none product-card-button flex-shrink-0"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              Transfer
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setStockViewMode('convert');
              }}
              size="sm"
              variant={stockViewMode === 'convert' ? 'primary' : 'ghost'}
              className="text-xs flex items-center gap-1 select-none product-card-button flex-shrink-0"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Convert
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsEditMode(!isEditMode);

              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              size="sm"
              variant={isEditMode ? 'primary' : 'ghost'}
              className="text-xs flex items-center gap-1 select-none product-card-button flex-shrink-0"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {isEditMode ? 'Editing' : 'Edit'}
            </Button>
            

          </div>

          {/* Details View */}
          {stockViewMode === 'details' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              
              {/* Column 1: Product Details & Descriptions */}
              <div className="space-y-2">
                <div className="text-neutral-500 font-medium text-xs mb-2">
                  Product Details & Descriptions
                </div>

                {/* Product Image */}
                <div className="border border-white/[0.04] rounded p-2">
                  <div className="text-neutral-600 text-xs font-medium mb-2">Product Image</div>
                  <div className="flex justify-center">
                    {isEditMode ? (
                      <ImageUpload
                        productId={product.id}
                        currentImage={uploadedImageUrl || editData.image}
                        onImageUploaded={handleImageUploaded}
                        onError={handleImageUploadError}
                        onRemove={clearUploadedImage}
                        disabled={isSaving}
                      />
                    ) : (
                       <div className="w-64 h-64 rounded-lg overflow-hidden flex items-center justify-center shadow-lg shadow-black/20 transition-all duration-300">
                         {(uploadedImageUrl || editData.image || product.image) ? (
                           <Image
                              src={uploadedImageUrl || editData.image || product.image || '/logo.png'}
                             alt={product.name}
                             width={256}
                             height={256}
                             sizes="256px"
                             className="object-cover w-full h-full drop-shadow-sm transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="text-neutral-500 text-xs text-center">
                            No image
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Product Info - Single Row Items */}
                <div className={`border border-white/[0.04] rounded p-2 edit-mode-field ${
                  isEditMode ? 'border-white/[0.08]' : ''
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600 text-xs">SKU:</span>
                    {isEditMode && isFieldVisible('sku') ? (
                      <input
                        type="text"
                        value={editData.sku}
                        onChange={(e) => setEditData(prev => ({ ...prev, sku: e.target.value }))}
                        className="bg-transparent text-neutral-500 text-xs text-right border-none outline-none focus:text-neutral-300 w-20"
                        placeholder="N/A"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : isEditMode && !isFieldVisible('sku') ? (
                      <span className="text-neutral-600 text-xs italic">SKU hidden</span>
                    ) : (
                      <span className="text-neutral-500 text-xs">{product.sku || 'N/A'}</span>
                    )}
                  </div>
                </div>

                <div className="border border-white/[0.04] rounded p-2">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600 text-xs">
                      {selectedLocationId ? 'Location Stock:' : 'Total Stock:'}
                    </span>
                    <span className="text-neutral-500 text-xs flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full stock-indicator ${
                        stockValue <= 5 ? 'bg-red-400' : stockValue <= 20 ? 'bg-yellow-400' : 'bg-green-400'
                      }`}></span>
                      {getDisplayStock()} units
                    </span>
                  </div>
                </div>



                {/* Descriptions Section */}
                <>
                    {/* Description */}
                    {isFieldVisible('description') && (
                      <div 
                        className={`border border-white/[0.04] rounded p-2 edit-mode-field ${
                          isEditMode ? 'border-white/[0.08]' : ''
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-neutral-600 text-xs font-medium">Description</div>

                        </div>
                        {isEditMode ? (
                          <textarea
                            value={editData.description}
                            onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-transparent text-neutral-500 text-xs leading-relaxed border-none outline-none focus:text-neutral-300 w-full resize-none"
                            placeholder="No description available"
                            rows={3}
                          />
                        ) : (
                          <div className="text-neutral-500 text-xs leading-relaxed">
                            {product.description ? stripHtml(product.description) : 
                             product.description ? stripHtml(product.description) : 
                             'No description available'}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Short Description */}
                    {isFieldVisible('short_description') && (
                      <div 
                        className={`border border-white/[0.04] rounded p-2 edit-mode-field ${
                          isEditMode ? 'border-white/[0.08]' : ''
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-neutral-600 text-xs font-medium">Short Description</div>

                        </div>
                        {isEditMode ? (
                          <textarea
                            value={editData.short_description}
                            onChange={(e) => setEditData(prev => ({ ...prev, short_description: e.target.value }))}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-transparent text-neutral-500 text-xs leading-relaxed border-none outline-none focus:text-neutral-300 w-full resize-none"
                            placeholder="No short description available"
                            rows={2}
                          />
                        ) : (
                          <div className="text-neutral-500 text-xs leading-relaxed">
                            {product.short_description ? stripHtml(product.short_description) : 
                             product.short_description ? stripHtml(product.short_description) : 
                             'No short description available'}
                          </div>
                        )}
                      </div>
                    )}
                  </>
              </div>

              {/* Column 2: Native Fields & Pricing */}
              <div className="space-y-2">
                <div className="text-neutral-500 font-medium text-xs mb-2">
                  Product Fields
                </div>
                
                {/* Native Blueprint Fields */}
                {product.blueprint_fields && product.blueprint_fields.length > 0 ? (
                  <div className="border border-white/[0.04] rounded p-2 mb-4">
                    <EditableBlueprintFields
                      blueprintFields={product.blueprint_fields}
                      editValues={editBlueprintFields}
                      onChange={setEditBlueprintFields}
                      isLoading={false}
                    />
                  </div>
                ) : (
                  <div className="border border-white/[0.04] rounded p-2 mb-4 text-neutral-600 text-xs">
                    No fields assigned to this product's categories
                  </div>
                )}
                
                {/* Pricing Tiers */}
                <div className="mb-4">
                  <ProductPricingTiers productId={product.id} />
                </div>
              </div>

              {/* Column 3: Location Inventory */}
              <div className="space-y-2">
                <div className="text-neutral-500 font-medium text-xs mb-2">
                  Location Inventory
                </div>
                
                {product.inventory && product.inventory.length > 0 && (() => {
                  // Filter inventory by selected location if one is selected
                  const displayInventory = selectedLocationId 
                    ? product.inventory.filter(inv => parseInt(String(inv.location_id)) === parseInt(selectedLocationId))
                    : product.inventory;
                  
                  return displayInventory.length > 0 ? (
                    <div className="border border-white/[0.04] rounded p-2">
                      <div className="text-neutral-600 text-xs font-medium mb-1">
                        {selectedLocationId ? 'Selected Location Inventory' : 'All Location Inventory'}
                      </div>
                      <div className="space-y-1">
                        {displayInventory.map((inv, index) => (
                          <div key={`inv-${inv.location_id}-${index}`} className="flex justify-between items-center text-xs location-inventory-item p-1 rounded">
                            <span className="text-neutral-600">{inv.location_name}:</span>
                            <span className="text-neutral-500">{inv.stock} units</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="border border-white/[0.04] rounded p-2">
                      <div className="text-neutral-600 text-xs">No inventory data available</div>
                    </div>
                  );
                })()}

                 {/* Lab Testing Section - COA Viewer */}
                 <CoaManager
                   productId={product.id}
                   productName={product.name}
                   currentCoa={product.meta_data?.find((m: any) => m.key === '_coa_attachment')?.value}
                   currentCoaFilename={product.meta_data?.find((m: any) => m.key === '_coa_filename')?.value}
                   onCoaChange={(coaUrl, filename) => {
                     // Update the local product data to reflect the change
                     if (product.meta_data) {
                       const coaAttachmentIndex = product.meta_data.findIndex((m: any) => m.key === '_coa_attachment');
                       const coaFilenameIndex = product.meta_data.findIndex((m: any) => m.key === '_coa_filename');
                       
                       if (coaUrl) {
                         // Update or add COA metadata
                         if (coaAttachmentIndex >= 0) {
                           product.meta_data[coaAttachmentIndex].value = coaUrl;
                         } else {
                           product.meta_data.push({ key: '_coa_attachment', value: coaUrl });
                         }
                         
                         if (coaFilenameIndex >= 0) {
                           product.meta_data[coaFilenameIndex].value = filename;
                         } else {
                           product.meta_data.push({ key: '_coa_filename', value: filename });
                         }
                       } else {
                         // Remove COA metadata
                         if (coaAttachmentIndex >= 0) {
                           product.meta_data[coaAttachmentIndex].value = '';
                         }
                         if (coaFilenameIndex >= 0) {
                           product.meta_data[coaFilenameIndex].value = '';
                         }
                       }
                     }
                   }}
                 />

              </div>
          </div>
          )}

          {/* Update Stock View */}
          {stockViewMode === 'update' && (
            <div className="space-y-4">
              <div className="text-neutral-400 text-sm font-medium">Update Stock Quantities</div>
              <div className="border border-white/[0.04] rounded p-4">
                <div className="text-neutral-500 text-xs mb-3">Current Stock by Location:</div>
                <div className="space-y-3">
                  {product.inventory && product.inventory.length > 0 ? (
                    product.inventory
                      .filter((inv) => inv.location_id && !isNaN(parseInt(String(inv.location_id))))
                      .map((inv, index) => {
                      // Use the validated location_id (already filtered above)
                      const locationId = inv.location_id.toString();
                      const isLoading = isUpdating[locationId];
                      const message = updateMessages[locationId];
                      
                      return (
                        <div key={`update-${inv.location_id}-${index}`} className="space-y-2">
                          <div className="flex items-center justify-between p-3 border border-white/[0.04] rounded">
                            <div className="flex flex-col">
                              <span className="text-neutral-400 text-xs">{inv.location_name}</span>
                              <span className="text-neutral-600 text-[10px]">Current: {inv.stock} units</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                placeholder="Qty"
                                value={stockUpdates[locationId] || ''}
                                onChange={(e) => setStockUpdates(prev => ({ ...prev, [locationId]: e.target.value }))}
                                className="w-24 px-3 py-1.5 border border-white/[0.04] rounded text-sm text-neutral-400 placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-white/20"
                                min="0"
                                step="0.01"
                                disabled={isLoading}
                              />
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();

                                  handleStockUpdate(locationId, inv.location_name);
                                }}
                                disabled={isLoading}
                                title={isLoading ? 'Updating...' : 'Update quantity'}
                                className="p-1 transition-opacity disabled:opacity-50"
                              >
                                {isLoading ? (
                                  <svg className="w-5 h-5 animate-spin text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>
                          {message && (
                            <div className={`text-xs px-2 py-1 rounded ${
                              message.type === 'success' 
                                ? 'text-green-400 bg-green-500/10' 
                                : 'text-red-400 bg-red-500/10'
                            }`}>
                              {message.text}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-neutral-600 text-xs">No location inventory found</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Transfer Stock View */}
          {stockViewMode === 'transfer' && (
            <div className="space-y-4">
              <div className="text-neutral-400 text-sm font-medium">Transfer Stock Between Locations</div>
              <div className="border border-white/[0.04] rounded p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-neutral-500 text-xs mb-2 block">From Location</label>
                    <select 
                      className="w-full px-3 py-1.5 border border-white/[0.04] rounded text-sm text-neutral-400 focus:outline-none focus:ring-1 focus:ring-white/20"
                      value={transferData.fromLocationId}
                      onChange={(e) => setTransferData(prev => ({ ...prev, fromLocationId: e.target.value }))}
                    >
                      <option value="">Select source location</option>
                      {product.inventory?.filter(inv => inv.stock > 0).map((inv, index) => (
                        <option key={index} value={inv.location_id}>
                          {inv.location_name} ({inv.stock} units)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-neutral-500 text-xs mb-2 block">To Location</label>
                    <select 
                      className="w-full px-3 py-1.5 border border-white/[0.04] rounded text-sm text-neutral-400 focus:outline-none focus:ring-1 focus:ring-white/20"
                      value={transferData.toLocationId}
                      onChange={(e) => setTransferData(prev => ({ ...prev, toLocationId: e.target.value }))}
                    >
                      <option value="">Select destination location</option>
                      {product.inventory?.map((inv, index) => (
                        <option key={index} value={inv.location_id}>
                          {inv.location_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-neutral-500 text-xs mb-2 block">Quantity</label>
                    <input
                      type="number"
                      placeholder="Amount to transfer"
                      value={transferData.quantity}
                      onChange={(e) => setTransferData(prev => ({ ...prev, quantity: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-white/[0.04] rounded text-sm text-neutral-400 placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-white/20"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-500 text-xs mb-2 block">Notes (optional)</label>
                    <input
                      type="text"
                      placeholder="Transfer notes"
                      value={transferData.notes}
                      onChange={(e) => setTransferData(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-white/[0.04] rounded text-sm text-neutral-400 placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                  </div>
                </div>
                
                {transferMessage && (
                  <div className={`mt-4 text-sm ${
                    transferMessage.type === 'success' 
                      ? 'text-green-400' 
                      : 'text-neutral-400'
                  }`}>
                    {transferMessage.text}
                  </div>
                )}
                
                <div className="flex justify-end mt-4">
                  <Button 
                    variant="primary" 
                    size="md" 
                    className="text-xs"
                    onClick={handleTransfer}
                    disabled={isTransferring}
                  >
                    {isTransferring ? 'Transferring...' : 'Transfer Stock'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Convert Product View */}
          {stockViewMode === 'convert' && (
            <div className="space-y-4">
              <div className="text-neutral-400 text-sm font-medium">Convert Product</div>
              <div className="border border-white/[0.04] rounded p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Recipe Selection */}
                  <div className="md:col-span-2">
                    <label className="text-neutral-500 text-xs mb-2 block">Recipe (Optional)</label>
                    <select
                      className="w-full px-3 py-1.5 border border-white/[0.04] rounded text-sm text-neutral-400 focus:outline-none focus:ring-1 focus:ring-white/20"
                      value={convertData.recipeId}
                      onChange={(e) => setConvertData(prev => ({ ...prev, recipeId: e.target.value }))}
                    >
                      <option value="">Select Recipe or Convert Directly</option>
                      {loadingRecipes ? (
                        <option disabled>Loading recipes...</option>
                      ) : (
                        recipes.map(recipe => (
                          <option key={recipe.id} value={recipe.id.toString()}>
                            {recipe.name} (Ratio: 1:{recipe.base_ratio})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-neutral-500 text-xs mb-2 block">From Location</label>
                    <select 
                      className="w-full px-3 py-1.5 border border-white/[0.04] rounded text-sm text-neutral-400 focus:outline-none focus:ring-1 focus:ring-white/20"
                      value={convertData.fromLocationId || ''}
                      onChange={(e) => setConvertData(prev => ({ ...prev, fromLocationId: e.target.value }))}
                    >
                      <option value="">Select source location</option>
                      {product.inventory?.filter(inv => inv.stock > 0).map((inv, index) => (
                        <option key={index} value={inv.location_id}>
                          {inv.location_name} ({inv.stock} units)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-neutral-500 text-xs mb-2 block">Source Quantity</label>
                    <input
                      type="number"
                      placeholder="Amount to convert"
                      value={convertData.sourceQuantity || ''}
                      onChange={(e) => setConvertData(prev => ({ ...prev, sourceQuantity: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-white/[0.04] rounded text-sm text-neutral-400 placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-white/20"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  {/* Show expected output if recipe is selected */}
                  {selectedRecipe && convertData.expectedOutput > 0 && (
                    <div className="md:col-span-2">
                      <div className="text-neutral-500 text-xs mb-1">Expected Output</div>
                      <div className="text-green-400 text-sm font-medium">
                        {convertData.expectedOutput.toFixed(2)} units
                      </div>
                    </div>
                  )}

                  {/* Output Product Selection (when using recipe) */}
                  {selectedRecipe && (
                    <div className="relative md:col-span-2">
                      <label className="text-neutral-500 text-xs mb-2 block">Output Product (Optional)</label>
                      <input
                        type="text"
                        placeholder="Search for output product or leave empty for automatic selection..."
                        value={convertData.outputProductSearch || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setConvertData(prev => ({ ...prev, outputProductSearch: value, selectedOutputProduct: null }));
                          handleOutputProductSearch(value);
                        }}
                        className="w-full px-3 py-1.5 border border-white/[0.04] rounded text-sm text-neutral-400 placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-white/20"
                      />
                      {outputSearchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-black/90 rounded max-h-40 overflow-y-auto z-10">
                          {outputSearchResults.map((result) => (
                            <div
                              key={result.id}
                              className="px-3 py-2 cursor-pointer text-sm text-neutral-400 "
                              onClick={() => {
                                setConvertData(prev => ({
                                  ...prev,
                                  outputProductSearch: result.name,
                                  selectedOutputProduct: result
                                }));
                                setOutputSearchResults([]);
                              }}
                            >
                              <div className="font-medium">{result.name}</div>
                              <div className="text-xs text-neutral-500">ID: {result.id}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      {convertData.selectedOutputProduct && (
                        <div className="mt-2 p-2 bg-green-900/20 border border-green-500/20 rounded text-xs text-green-400">
                          Selected: {convertData.selectedOutputProduct.name}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Show target product selection only if no recipe is selected */}
                  {!selectedRecipe && (
                    <div className="relative md:col-span-2">
                      <label className="text-neutral-500 text-xs mb-2 block">Target Product</label>
                      <input
                        type="text"
                        placeholder="Search for target product..."
                        value={convertData.targetProductSearch || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setConvertData(prev => ({ ...prev, targetProductSearch: value, selectedTargetProduct: null }));
                          handleProductSearch(value);
                        }}
                        className="w-full px-3 py-1.5 border border-white/[0.04] rounded text-sm text-neutral-400 placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-white/20"
                      />
                      {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-black/90 rounded max-h-40 overflow-y-auto z-10">
                          {searchResults.map((result) => (
                            <div
                              key={result.id}
                              className="px-3 py-2 cursor-pointer text-sm text-neutral-400 "
                              onClick={() => {
                                setConvertData(prev => ({
                                  ...prev,
                                  targetProductSearch: result.name,
                                  selectedTargetProduct: result
                                }));
                                setSearchResults([]);
                              }}
                            >
                              <div className="font-medium">{result.name}</div>
                              <div className="text-xs text-neutral-600">SKU: {result.sku}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      {convertData.selectedTargetProduct && (
                        <div className="mt-1 text-xs text-green-400">
                          Selected: {convertData.selectedTargetProduct.name}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Show target quantity input only if no recipe is selected */}
                  {!selectedRecipe && (
                    <div>
                      <label className="text-neutral-500 text-xs mb-2 block">Target Quantity</label>
                      <input
                        type="number"
                        placeholder="Amount to produce"
                        value={convertData.targetQuantity}
                        onChange={(e) => setConvertData(prev => ({ ...prev, targetQuantity: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-white/[0.04] rounded text-sm text-neutral-400 placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-white/20"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  )}

                  {/* Yield Recording Phase - only show if conversion is pending yield recording */}
                  {convertData.conversionStatus === 'yield_recording' && (
                    <>
                      <div className="md:col-span-2">
                        <div className="text-neutral-500 text-xs mb-1">Expected Output</div>
                        <div className="text-blue-400 text-sm font-medium mb-2">
                          {convertData.expectedOutput.toFixed(2)} units
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-neutral-500 text-xs mb-2 block">Actual Output</label>
                        <input
                          type="number"
                          placeholder="Actual amount produced"
                          value={convertData.actualOutput}
                          onChange={(e) => setConvertData(prev => ({ ...prev, actualOutput: e.target.value }))}
                          className="w-full px-3 py-1.5 border border-white/[0.04] rounded text-sm text-neutral-400 placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-white/20"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="text-neutral-500 text-xs mb-2 block">Notes (optional)</label>
                    <input
                      type="text"
                      placeholder="Conversion notes"
                      value={convertData.notes || ''}
                      onChange={(e) => setConvertData(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-white/[0.04] rounded text-sm text-neutral-400 placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                  </div>
                </div>
                
                {convertMessage && (
                  <div className={`mt-4 text-sm ${
                    convertMessage.type === 'success' 
                      ? 'text-green-400' 
                      : 'text-neutral-400'
                  }`}>
                    {convertMessage.text}
                  </div>
                )}
                
                <div className="flex justify-end gap-2 mt-4">
                  {convertData.conversionStatus === 'yield_recording' && (
                    <Button 
                      variant="ghost" 
                      size="md" 
                      className="text-xs"
                      onClick={resetConvertForm}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button 
                    variant="primary" 
                    size="md" 
                    className="text-xs"
                    onClick={handleConvertProduct}
                    disabled={isConverting}
                  >
                    {isConverting 
                      ? 'Processing...' 
                      : convertData.conversionStatus === 'yield_recording'
                        ? 'Complete Conversion'
                        : 'Start Conversion'
                    }
                  </Button>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
});