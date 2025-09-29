'use client';

import React, { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { FieldOption } from '../components/features/BulkFieldSelector';

interface BulkEditFieldContextType {
  // Available fields
  availableFields: FieldOption[];
  setAvailableFields: (fields: FieldOption[]) => void;
  
  // Selected fields
  selectedFields: Set<string>;
  setSelectedFields: (fields: Set<string>) => void;
  
  // Field selector UI state
  isFieldSelectorOpen: boolean;
  setFieldSelectorOpen: (open: boolean) => void;
  
  // Helper functions
  selectAllFields: () => void;
  selectNoFields: () => void;
  selectStandardFields: () => void;
  selectBlueprintFields: () => void;
  toggleField: (fieldName: string) => void;
  
  // Fetch available fields for product IDs
  fetchAvailableFields: (productIds: number[]) => Promise<void>;
  isLoadingFields: boolean;
}

const BulkEditFieldContext = createContext<BulkEditFieldContextType | undefined>(undefined);

interface BulkEditFieldProviderProps {
  children: ReactNode;
}

export function BulkEditFieldProvider({ children }: BulkEditFieldProviderProps) {
  const [availableFields, setAvailableFields] = useState<FieldOption[]>([]);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [isFieldSelectorOpen, setIsFieldSelectorOpen] = useState(false);
  const [isLoadingFields, setIsLoadingFields] = useState(false);

  // Load persisted field selection from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('bulk-edit-selected-fields');
    if (stored) {
      try {
        const fieldNames = JSON.parse(stored);
        if (Array.isArray(fieldNames)) {
          setSelectedFields(new Set(fieldNames));
        }
      } catch (error) {
        console.warn('Failed to load persisted field selection:', error);
      }
    }
  }, []);

  // Persist field selection to localStorage and dispatch events
  useEffect(() => {
    if (selectedFields.size > 0) {
      localStorage.setItem('bulk-edit-selected-fields', JSON.stringify(Array.from(selectedFields)));
    }
    
    // Dispatch event to notify components about field selection changes
    const event = new CustomEvent('bulkFieldSelectionChanged', {
      detail: { selectedFields: Array.from(selectedFields) }
    });
    window.dispatchEvent(event);
  }, [selectedFields]);

  const selectAllFields = useCallback(() => {
    const allFieldNames = availableFields.map(field => field.field_name);
    setSelectedFields(new Set(allFieldNames));
  }, [availableFields]);

  const selectNoFields = useCallback(() => {
    setSelectedFields(new Set());
  }, []);

  const selectStandardFields = useCallback(() => {
    const standardFields = availableFields
      .filter(field => !field.is_blueprint_field)
      .map(field => field.field_name);
    setSelectedFields(new Set(standardFields));
  }, [availableFields]);

  const selectBlueprintFields = useCallback(() => {
    const blueprintFields = availableFields
      .filter(field => field.is_blueprint_field)
      .map(field => field.field_name);
    setSelectedFields(new Set(blueprintFields));
  }, [availableFields]);

  const toggleField = useCallback((fieldName: string) => {
    setSelectedFields(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(fieldName)) {
        newSelection.delete(fieldName);
      } else {
        newSelection.add(fieldName);
      }
      return newSelection;
    });
  }, []);

  const setFieldSelectorOpen = useCallback((open: boolean) => {
    setIsFieldSelectorOpen(open);
  }, []);

  // Fetch available fields for the given product IDs
  const fetchAvailableFields = useCallback(async (productIds: number[]) => {
    if (productIds.length === 0) {
      setAvailableFields([]);
      return;
    }

    setIsLoadingFields(true);
    
    try {
      // Collect available fields from all products
      const fieldsMap = new Map<string, FieldOption>();
      
      // Add standard WooCommerce fields
      fieldsMap.set('name', {
        field_name: 'name',
        field_label: 'Product Name',
        field_type: 'text',
        is_blueprint_field: false,
        count: productIds.length
      });
      fieldsMap.set('sku', {
        field_name: 'sku',
        field_label: 'SKU',
        field_type: 'text',
        is_blueprint_field: false,
        count: productIds.length
      });
      fieldsMap.set('description', {
        field_name: 'description',
        field_label: 'Description',
        field_type: 'textarea',
        is_blueprint_field: false,
        count: productIds.length
      });
      fieldsMap.set('short_description', {
        field_name: 'short_description',
        field_label: 'Short Description',
        field_type: 'textarea',
        is_blueprint_field: false,
        count: productIds.length
      });
      
      // Fetch blueprint fields for each product individually (more reliable)
      const blueprintFieldCounts = new Map<string, { count: number; field: any }>();
      
      for (const productId of productIds) {
        try {
          const fieldsResponse = await fetch(`/api/blueprint-fields/${productId}`);
          if (fieldsResponse.ok) {
            const fieldsData = await fieldsResponse.json();
            if (fieldsData.success && fieldsData.fields) {
              fieldsData.fields.forEach((field: any) => {
                const fieldName = field.field_name;
                if (blueprintFieldCounts.has(fieldName)) {
                  blueprintFieldCounts.get(fieldName)!.count++;
                } else {
                  blueprintFieldCounts.set(fieldName, {
                    count: 1,
                    field: {
                      field_name: fieldName,
                      field_label: field.field_label || fieldName.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                      field_type: field.field_type || 'text',
                      blueprint_name: field.blueprint_name || 'Blueprint Fields'
                    }
                  });
                }
              });
            }
          }
        } catch (fieldError) {
          console.warn(`Failed to fetch blueprint fields for product ${productId}:`, fieldError);
        }
      }
      
      // Add blueprint fields to available fields
      blueprintFieldCounts.forEach(({ count, field }) => {
        fieldsMap.set(field.field_name, {
          field_name: field.field_name,
          field_label: field.field_label,
          field_type: field.field_type,
          is_blueprint_field: true,
          blueprint_name: field.blueprint_name,
          count
        });
      });
      
      const availableFieldsList = Array.from(fieldsMap.values());
      setAvailableFields(availableFieldsList);
      
      // Initialize selected fields with all available fields if none are selected
      if (selectedFields.size === 0) {
        const allFieldNames = availableFieldsList.map(field => field.field_name);
        setSelectedFields(new Set(allFieldNames));
      }
      
    } catch (error) {
      console.error('Failed to fetch available fields:', error);
      // Fallback to just standard fields if blueprint fields fail
      const standardFields: FieldOption[] = [
        { field_name: 'name', field_label: 'Product Name', field_type: 'text', is_blueprint_field: false, count: productIds.length },
        { field_name: 'sku', field_label: 'SKU', field_type: 'text', is_blueprint_field: false, count: productIds.length },
        { field_name: 'description', field_label: 'Description', field_type: 'textarea', is_blueprint_field: false, count: productIds.length },
        { field_name: 'short_description', field_label: 'Short Description', field_type: 'textarea', is_blueprint_field: false, count: productIds.length }
      ];
      setAvailableFields(standardFields);
      
      if (selectedFields.size === 0) {
        setSelectedFields(new Set(['name', 'sku', 'description', 'short_description']));
      }
    } finally {
      setIsLoadingFields(false);
    }
  }, [selectedFields.size]);

  const contextValue: BulkEditFieldContextType = {
    availableFields,
    setAvailableFields,
    selectedFields,
    setSelectedFields,
    isFieldSelectorOpen,
    setFieldSelectorOpen,
    selectAllFields,
    selectNoFields,
    selectStandardFields,
    selectBlueprintFields,
    toggleField,
    fetchAvailableFields,
    isLoadingFields,
  };

  return (
    <BulkEditFieldContext.Provider value={contextValue}>
      {children}
    </BulkEditFieldContext.Provider>
  );
}

export function useBulkEditFieldContext() {
  const context = useContext(BulkEditFieldContext);
  if (context === undefined) {
    throw new Error('useBulkEditFieldContext must be used within a BulkEditFieldProvider');
  }
  return context;
}
