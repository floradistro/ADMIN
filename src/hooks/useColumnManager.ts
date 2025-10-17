import { useState, useEffect, useMemo } from 'react';
import { ColumnConfig, Product } from '../types';
import { inventoryService } from '../services/inventory-service';

interface UseColumnManagerOptions {
  products?: Product[];
}

export function useColumnManager({ products = [] }: UseColumnManagerOptions = {}) {
  const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>([]);
  const [availableBlueprintFields, setAvailableBlueprintFields] = useState<ColumnConfig[]>([]);
  const [isLoadingBlueprintFields, setIsLoadingBlueprintFields] = useState(false);

  // Default columns that are always available
  const defaultColumns: ColumnConfig[] = [
    { id: 'product', label: 'Product', width: 'flex-1', visible: true, type: 'default' },
    { id: 'category', label: 'Category', width: 'w-32', visible: true, type: 'default' },
    { id: 'stock', label: 'Stock', width: 'w-24', visible: true, type: 'default' },
  ];

  // Load available blueprint fields from API
  const loadAvailableBlueprintFields = async () => {
    if (isLoadingBlueprintFields) return;
    
    setIsLoadingBlueprintFields(true);
    try {
      const fields = await inventoryService.getAvailableBlueprintFields();
      
      // Map Flora Fields V2 structure (name, label, type)
      const blueprintColumns = fields.map(field => ({
        id: `blueprint_${field.name}`,
        label: field.label || field.name,
        width: 'w-32',
        visible: false, // Hide blueprint fields by default
        type: 'blueprint' as const,
        blueprint_field_name: field.name,
        blueprint_field_type: field.type,
      }));
      
      setAvailableBlueprintFields(blueprintColumns);
    } catch (error) {
    } finally {
      setIsLoadingBlueprintFields(false);
    }
  };

  // Auto-load blueprint fields on mount
  useEffect(() => {
    loadAvailableBlueprintFields();
  }, []);

  // Initialize column configs with default columns
  useEffect(() => {
    const allColumns = [...defaultColumns, ...availableBlueprintFields];
    setColumnConfigs(allColumns);
  }, [availableBlueprintFields]);

  // Get visible columns in order
  const visibleColumns = useMemo(() => {
    return columnConfigs.filter(col => col.visible);
  }, [columnConfigs]);

  // Toggle column visibility
  const toggleColumn = (columnId: string) => {
    setColumnConfigs(prev => 
      prev.map(col => 
        col.id === columnId 
          ? { ...col, visible: !col.visible }
          : col
      )
    );
  };

  // Show/hide all blueprint columns
  const toggleAllBlueprintColumns = (visible: boolean) => {
    setColumnConfigs(prev => 
      prev.map(col => 
        col.type === 'blueprint' 
          ? { ...col, visible }
          : col
      )
    );
  };

  // Get blueprint field value for a product
  const getBlueprintFieldValue = (product: Product, fieldName: string) => {
    // First, try to get from existing blueprint_fields
    if (product.blueprint_fields) {
      const field = product.blueprint_fields.find(f => f.field_name === fieldName);
      if (field && field.field_value !== undefined && field.field_value !== null && field.field_value !== '') {
        return field.field_value;
      }
    }

    // If not found in blueprint_fields, try to get from product meta_data
    if (product.meta_data && Array.isArray(product.meta_data)) {
      const metaField = product.meta_data.find((meta: any) => meta.key === fieldName);
      if (metaField && metaField.value !== undefined && metaField.value !== null && metaField.value !== '') {
        return metaField.value;
      }
    }

    // Also check for common field name variations
    const fieldVariations = [
      fieldName,
      `_${fieldName}`,
      `blueprint_${fieldName}`,
      `field_${fieldName}`
    ];

    if (product.meta_data && Array.isArray(product.meta_data)) {
      for (const variation of fieldVariations) {
        const metaField = product.meta_data.find((meta: any) => meta.key === variation);
        if (metaField && metaField.value !== undefined && metaField.value !== null && metaField.value !== '') {
          return metaField.value;
        }
      }
    }

    // Return null if no value found
    return null;
  };

  // Format blueprint field value for display
  const formatBlueprintFieldValue = (value: any, fieldType: string) => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    switch (fieldType) {
      case 'number':
        return typeof value === 'number' ? value.toString() : value;
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'select':
      case 'radio':
        return value;
      case 'date':
        try {
          return new Date(value).toLocaleDateString();
        } catch {
          return value;
        }
      default:
        return value.toString();
    }
  };

  // Load field values for products
  const loadFieldValuesForProducts = async (products: Product[]): Promise<Product[]> => {
    if (isLoadingBlueprintFields) return products;
    
    setIsLoadingBlueprintFields(true);
    try {
      const enrichedProducts = await inventoryService.enrichProductsWithMetaData(products as any);
      return enrichedProducts;
    } catch (error) {
      return products;
    } finally {
      setIsLoadingBlueprintFields(false);
    }
  };

  return {
    columnConfigs,
    visibleColumns,
    availableBlueprintFields,
    toggleColumn,
    toggleAllBlueprintColumns,
    getBlueprintFieldValue,
    formatBlueprintFieldValue,
    loadAvailableBlueprintFields,
    loadFieldValuesForProducts,
    isLoadingBlueprintFields,
  };
}
