'use client';

import React, { useState, useEffect } from 'react';
import { BlueprintFieldValue } from '../../types';
import { Button } from './Button';

interface EditableBlueprintFieldsProps {
  blueprintFields: BlueprintFieldValue[];
  productId: number;
  isLoading?: boolean;
  onSave?: (fields: BlueprintFieldValue[]) => void;
}

export function EditableBlueprintFields({ 
  blueprintFields, 
  productId, 
  isLoading = false,
  onSave 
}: EditableBlueprintFieldsProps) {
  const [fields, setFields] = useState<BlueprintFieldValue[]>(blueprintFields);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setFields(blueprintFields);
    setHasChanges(false);
  }, [blueprintFields]);

  const handleFieldChange = (fieldId: number, newValue: any) => {
    const updatedFields = fields.map(field => 
      field.field_id === fieldId 
        ? { ...field, field_value: newValue }
        : field
    );
    setFields(updatedFields);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!hasChanges) return;
    
    setSaving(true);
    try {
      // Prepare field values for API
      const fieldValues: Record<string, any> = {};
      fields.forEach(field => {
        fieldValues[field.field_name] = field.field_value;
      });

      // Call the Portal2 API to save blueprint fields
      const response = await fetch(`/api/flora/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blueprint_fields: fieldValues
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to save: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Exit edit mode immediately
      setHasChanges(false);
      setEditMode(false);
      
      // Trigger parent to refresh with real data from server
      if (onSave) {
        await onSave(fields);
      }
      
    } catch (error) {
      alert('Failed to save fields. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFields(blueprintFields);
    setHasChanges(false);
    setEditMode(false);
  };

  const renderFieldInput = (field: BlueprintFieldValue) => {
    const baseClasses = "w-full bg-neutral-950/40 border border-neutral-800/40 rounded px-3 py-2 text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none";

    switch (field.field_type) {
      case 'textarea':
        return (
          <textarea
            value={field.field_value || ''}
            onChange={(e) => handleFieldChange(field.field_id, e.target.value)}
            rows={3}
            className={`${baseClasses} resize-none`}
            disabled={!editMode}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={field.field_value || ''}
            onChange={(e) => handleFieldChange(field.field_id, e.target.value)}
            className={baseClasses}
            disabled={!editMode}
          />
        );

      case 'select':
        const options = field.validation_rules?.options || [];
        return (
          <select
            value={field.field_value || ''}
            onChange={(e) => handleFieldChange(field.field_id, e.target.value)}
            className={baseClasses}
            disabled={!editMode}
          >
            <option value="">Select...</option>
            {options.map((option: any, index: number) => (
              <option key={index} value={option.value || option}>
                {option.label || option}
              </option>
            ))}
          </select>
        );

      case 'boolean':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!field.field_value}
              onChange={(e) => handleFieldChange(field.field_id, e.target.checked)}
              className="rounded border-neutral-700 text-neutral-400 focus:ring-neutral-600"
              disabled={!editMode}
            />
            <span className="text-neutral-500 text-sm">
              {field.field_value ? 'Yes' : 'No'}
            </span>
          </label>
        );

      case 'date':
        return (
          <input
            type="date"
            value={field.field_value || ''}
            onChange={(e) => handleFieldChange(field.field_id, e.target.value)}
            className={baseClasses}
            disabled={!editMode}
          />
        );

      default:
        return (
          <input
            type="text"
            value={field.field_value || ''}
            onChange={(e) => handleFieldChange(field.field_id, e.target.value)}
            className={baseClasses}
            disabled={!editMode}
          />
        );
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-neutral-800 rounded w-32"></div>
        <div className="space-y-2">
          <div className="h-3 bg-neutral-800 rounded w-20"></div>
          <div className="h-8 bg-neutral-800 rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-neutral-800 rounded w-24"></div>
          <div className="h-8 bg-neutral-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (!fields || fields.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-neutral-600 text-sm mb-2">
          No blueprint fields assigned
        </div>
        <div className="text-neutral-700 text-xs">
          This product doesn't have any blueprint fields assigned to its categories yet.
        </div>
      </div>
    );
  }

  // Group fields by blueprint for better organization
  const fieldsByBlueprint = fields.reduce((acc, field) => {
    const key = field.blueprint_id;
    if (!acc[key]) {
      acc[key] = {
        blueprint_name: field.blueprint_name,
        fields: []
      };
    }
    acc[key].fields.push(field);
    return acc;
  }, {} as Record<number, { blueprint_name: string; fields: BlueprintFieldValue[] }>);

  return (
    <div className="flex flex-col space-y-4 h-full">
      {/* Header with edit controls - Fixed at top */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-neutral-800 flex-shrink-0">
        <div className="text-neutral-500 text-sm">
          Blueprint Fields ({fields.length} fields)
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {editMode ? (
            <>
              <Button
                onClick={handleCancel}
                variant="secondary"
                size="sm"
                disabled={saving}
                className="flex-1 sm:flex-initial"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                variant="primary"
                size="sm"
                disabled={!hasChanges || saving}
                className="flex-1 sm:flex-initial"
              >
                {saving ? (
                  <>
                    <span className="hidden sm:inline">Saving...</span>
                    <span className="sm:hidden">Save...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Save Changes</span>
                    <span className="sm:hidden">Save</span>
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setEditMode(true)}
              variant="secondary"
              size="sm"
              className="w-full sm:w-auto"
            >
              <span className="hidden sm:inline">Edit Fields</span>
              <span className="sm:hidden">Edit</span>
            </Button>
          )}
        </div>
      </div>

      {/* Field groups - Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
        {Object.entries(fieldsByBlueprint).map(([blueprintId, { blueprint_name, fields: blueprintFields }]) => (
          <div key={blueprintId} className="space-y-3">
            {/* Blueprint name header if multiple blueprints */}
            {Object.keys(fieldsByBlueprint).length > 1 && (
              <div className="text-neutral-400 text-xs font-medium border-b border-neutral-800 pb-1 sticky top-0 bg-neutral-900/95 -mx-1 px-1">
                {blueprint_name}
              </div>
            )}
            
            {/* Fields */}
            {blueprintFields.map((field) => (
              <div key={field.field_id} className="space-y-2">
                <label className="flex flex-wrap items-center gap-2 text-neutral-600 text-sm">
                  <span className="capitalize">{field.field_label}</span>
                  {field.is_required && (
                    <span className="text-red-400 text-xs">*</span>
                  )}
                  <span className="text-neutral-700 text-xs">({field.field_type})</span>
                </label>
                
                {field.field_description && (
                  <div className="text-neutral-700 text-xs italic mb-1">
                    {field.field_description}
                  </div>
                )}
                
                {renderFieldInput(field)}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Status indicator - Fixed at bottom */}
      {hasChanges && (
        <div className="text-amber-400 text-xs py-2 border-t border-neutral-800 flex-shrink-0 bg-neutral-900/95">
          You have unsaved changes
        </div>
      )}
    </div>
  );
}