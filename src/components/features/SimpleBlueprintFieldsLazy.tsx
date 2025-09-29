'use client';

import React, { useState, useEffect, useRef } from 'react';
// Direct API calls without caching to avoid dev cache issues

interface BlueprintField {
  name: string;
  label: string;
  value: string;
  type: 'text' | 'number' | 'select';
}

interface SimpleBlueprintFieldsLazyProps {
  productId: number;
  productName: string;
  isEditMode?: boolean;
  isAIMode?: boolean;
  selectedAIFields?: Set<string>;
  onFieldToggle?: (fieldName: string) => void;
  onFieldChange?: (fieldName: string, value: string) => void;
  refreshTrigger?: number;
  isVisible?: boolean; // Only load when visible
  previewValues?: Record<string, any>; // Preview values from JSON editor
}

interface FieldAssignment {
  field_name: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  current_value?: any;
}

// Direct API call function using authenticated client
const fetchBlueprintFields = async (productId: number) => {
  try {
    if (!productId || productId <= 0) {
      console.warn('Invalid product ID for blueprint fields:', productId);
      return { success: false, fields: [] };
    }
    
    // Use authenticated fetch with session credentials
    const response = await fetch(`/api/blueprint-fields/${productId}?_t=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include session cookie
    });
    
    if (!response.ok) {
      // Don't throw error for 404s, just return empty fields
      if (response.status === 404) {
        return { success: true, fields: [] };
      }
      
      // Handle 401 specifically
      if (response.status === 401) {
        console.warn('Authentication required for blueprint fields');
        return { success: false, error: 'Authentication required', needsAuth: true };
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    return { success: true, fields: data.fields || [] };
  } catch (error) {
    console.error('Blueprint fields API error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export function SimpleBlueprintFieldsLazy({
  productId,
  productName,
  isEditMode = false,
  isAIMode = false,
  selectedAIFields,
  onFieldToggle,
  onFieldChange,
  refreshTrigger,
  isVisible = true,
  previewValues = {}
}: SimpleBlueprintFieldsLazyProps) {
  const [fields, setFields] = useState<BlueprintField[]>([]);
  const [fieldAssignments, setFieldAssignments] = useState<FieldAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);
  const [selectedFieldsFromContext, setSelectedFieldsFromContext] = useState<Set<string>>(new Set());

  // Load blueprint fields for this product
  const loadFields = async () => {
    try {
      setLoading(true);
      
      // Direct API call without caching
      const fieldsResult = await fetchBlueprintFields(productId);
      
      if (fieldsResult.success && fieldsResult.fields) {
        // Convert the API response to our expected format
        const fieldAssignments = fieldsResult.fields.map((field: any) => ({
          field_name: field.field_name,
          field_label: field.field_label,
          field_type: field.field_type,
          current_value: field.field_value || '',
          is_required: field.is_required || false
        }));
        
        setFieldAssignments(fieldAssignments);
        
        // Create fields array with current values
        const loadedFields: BlueprintField[] = fieldsResult.fields.map((field: any) => ({
          name: field.field_name,
          label: field.field_label,
          type: field.field_type as 'text' | 'number' | 'select',
          value: field.field_value || ''
        }));
        
        setFields(loadedFields);
        setError(null);
        hasLoadedRef.current = true;
      } else {
        setFieldAssignments([]);
        setFields([]);
        setError(null);
      }
    } catch (err) {
      // Only log errors, don't display them in UI for expected cases
      console.warn('Blueprint fields load issue:', err);
      setError(null); // Don't show errors in UI
      setFieldAssignments([]);
      setFields([]);
    } finally {
      setLoading(false);
    }
  };

  // Only load when visible and not already loaded
  useEffect(() => {
    if (isVisible && !hasLoadedRef.current) {
      loadFields();
    }
  }, [isVisible, productId, refreshTrigger]);

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

  // Refresh fields when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0 && hasLoadedRef.current) {
      hasLoadedRef.current = false;
      loadFields();
    }
  }, [refreshTrigger]);

  // Update field value locally and notify parent
  const updateField = (fieldName: string, value: string) => {
    setFields(prev => prev.map(field => 
      field.name === fieldName ? { ...field, value } : field
    ));
    onFieldChange?.(fieldName, value);
  };

  if (loading && !hasLoadedRef.current) {
    return (
      <div className="space-y-3 product-card">
        <div className="text-neutral-600 text-sm">Loading blueprint fields...</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse border border-white/[0.04] h-10 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-sm product-card">{error}</div>
    );
  }

  if (!fieldAssignments || fieldAssignments.length === 0) {
    return (
      <div className="text-neutral-600 text-sm product-card">No blueprint fields configured</div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 product-card">
      {fieldAssignments
        .filter(assignment => {
          // If no fields are selected in context, show all fields (default behavior)
          if (selectedFieldsFromContext.size === 0) return true;
          // Otherwise, only show fields that are selected
          return selectedFieldsFromContext.has(assignment.field_name);
        })
        .map((assignment) => {
        const field = fields.find(f => f.name === assignment.field_name);
        // Use preview value if available, otherwise use field value
        const value = previewValues[assignment.field_name] !== undefined 
          ? previewValues[assignment.field_name] 
          : field?.value || '';
        
        const isComplexField = assignment.field_type === 'textarea' || 
                               (typeof value === 'string' && value.length > 50);
        
        return (
          <div 
            key={assignment.field_name} 
            className={`
              flex items-start gap-3 p-3 rounded-lg border transition-all
              ${isComplexField ? 'col-span-full' : ''}
              ${isAIMode && selectedAIFields?.has(assignment.field_name) 
                ? 'border-blue-500/50 bg-blue-500/5' 
                : 'border-white/[0.04]'
              }
            `}
          >
            {/* AI Mode Checkbox */}
            {isAIMode && (
              <div className="pt-1">
                <input
                  type="checkbox"
                  checked={selectedAIFields?.has(assignment.field_name) || false}
                  onChange={() => onFieldToggle?.(assignment.field_name)}
                  className="w-4 h-4 rounded border-neutral-700 bg-neutral-800 text-blue-500 focus:ring-blue-500/30"
                />
              </div>
            )}

            {/* Field Content - Match standard field styling */}
            <div 
              className={`border border-white/[0.04] rounded p-2 transition-all duration-200 ${
                isEditMode ? 'border-white/[0.08]' : ''
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <div className="text-neutral-600 text-xs font-medium">{assignment.field_label}</div>
              </div>
              
              {isEditMode ? (
                assignment.field_type === 'textarea' ? (
                  <textarea
                    value={value}
                    onChange={(e) => updateField(assignment.field_name, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-transparent text-neutral-500 text-xs border-none outline-none focus:text-neutral-300 w-full resize-none"
                    placeholder={`Enter ${assignment.field_label.toLowerCase()}`}
                    rows={3}
                  />
                ) : (
                  <input
                    type={assignment.field_type === 'number' ? 'number' : 'text'}
                    step={assignment.field_type === 'number' ? '0.1' : undefined}
                    value={value}
                    onChange={(e) => updateField(assignment.field_name, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-transparent text-neutral-500 text-xs border-none outline-none focus:text-neutral-300 w-full"
                    placeholder={`Enter ${assignment.field_label.toLowerCase()}`}
                  />
                )
              ) : (
                <div className="text-neutral-500 text-xs">
                  {value || <span className="text-neutral-600 italic">Not set</span>}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
