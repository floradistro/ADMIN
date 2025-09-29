'use client';

import React from 'react';
import { BlueprintFieldValue } from '../../types';

interface BlueprintFieldDisplayProps {
  blueprintFields: BlueprintFieldValue[];
  isLoading?: boolean;
}

export function BlueprintFieldDisplay({ blueprintFields, isLoading }: BlueprintFieldDisplayProps) {
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

  const renderFieldValue = (field: BlueprintFieldValue) => {
    const { field_type, field_value } = field;

    if (!field_value && field_value !== 0 && field_value !== false) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-neutral-600 text-xs italic">Empty</span>
          {field.is_required && (
            <span className="text-red-400 text-xs">*</span>
          )}
        </div>
      );
    }

    switch (field_type) {
      case 'select':
      case 'radio':
        return (
          <span className="px-2 py-1 bg-neutral-900/40 text-neutral-500 rounded text-xs font-medium">
            {field_value}
          </span>
        );

      case 'checkbox':
        if (Array.isArray(field_value)) {
          return (
            <div className="flex flex-wrap gap-1">
              {field_value.map((value, index) => (
                <span key={index} className="px-2 py-1 bg-neutral-900/40 text-neutral-500 rounded text-xs">
                  {value}
                </span>
              ))}
            </div>
          );
        }
        return (
          <span className="px-2 py-1 bg-neutral-900/40 text-neutral-500 rounded text-xs">
            {field_value ? 'Yes' : 'No'}
          </span>
        );

      case 'number':
        return (
          <span className="text-neutral-500 text-xs font-mono">
            {field_value}
          </span>
        );

      case 'textarea':
        return (
          <span className="text-neutral-500 text-xs">
            {String(field_value).length > 50 
              ? `${String(field_value).substring(0, 50)}...` 
              : String(field_value)
            }
          </span>
        );

      case 'url':
      case 'email':
        return (
          <span className="text-neutral-500 text-xs font-mono">
            {field_value}
          </span>
        );

      case 'date':
        return (
          <span className="text-neutral-500 text-xs">
            {new Date(field_value).toLocaleDateString()}
          </span>
        );

      case 'image':
        if (typeof field_value === 'object' && field_value.url) {
          return (
            <div className="flex items-center gap-2">
              <img 
                src={field_value.url} 
                alt={field_value.alt || field.field_label}
                className="w-8 h-8 object-cover rounded"
              />
              <span className="text-neutral-500 text-xs">
                {field_value.filename || 'Image'}
              </span>
            </div>
          );
        }
        return <span className="text-neutral-500 text-xs">{field_value}</span>;

      case 'repeater':
        if (Array.isArray(field_value) && field_value.length > 0) {
          return (
            <div className="space-y-1">
              {field_value.slice(0, 3).map((item, index) => (
                <div key={index} className="text-neutral-500 text-xs">
                  {typeof item === 'object' 
                    ? Object.values(item).slice(0, 2).join(', ')
                    : String(item)
                  }
                </div>
              ))}
              {field_value.length > 3 && (
                <div className="text-neutral-600 text-xs">
                  +{field_value.length - 3} more...
                </div>
              )}
            </div>
          );
        }
        return <span className="text-neutral-500 text-xs">No entries</span>;

      default:
        return (
          <span className="text-neutral-500 text-xs">
            {String(field_value)}
          </span>
        );
    }
  };

  // Group fields by blueprint for better organization
  const fieldsByBlueprint = blueprintFields.reduce((acc, field) => {
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
    <div className="space-y-3 product-card">
      {Object.entries(fieldsByBlueprint).map(([blueprintId, { blueprint_name, fields }]) => (
        <div key={blueprintId} className="space-y-2">
          {/* Blueprint name header if multiple blueprints */}
          {Object.keys(fieldsByBlueprint).length > 1 && (
            <div className="text-neutral-400 text-xs font-medium border-b border-neutral-800 pb-1">
              {blueprint_name}
            </div>
          )}
          
          {/* Field display - 2 column grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {fields.map((field) => {
            // Determine if this should be a single row or multi-line display
            const isComplexField = ['repeater', 'textarea'].includes(field.field_type) || 
                                   (typeof field.field_value === 'string' && field.field_value.length > 50);

            if (isComplexField) {
              return (
                <div key={field.field_id} className="col-span-full border border-white/[0.04] rounded p-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-neutral-600 text-xs font-medium capitalize">
                      {field.field_label}
                    </span>
                    {field.is_required && (
                      <span className="text-red-400 text-xs">*</span>
                    )}
                    <span className="text-neutral-700 text-xs">({field.field_type})</span>
                  </div>
                  {field.field_description && (
                    <div className="text-neutral-700 text-xs mb-2 italic">
                      {field.field_description}
                    </div>
                  )}
                  <div>{renderFieldValue(field)}</div>
                </div>
              );
            }

            return (
              <div key={field.field_id} className="border border-white/[0.04] rounded p-2">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-600 text-xs capitalize">
                        {field.field_label}
                      </span>
                      {field.is_required && (
                        <span className="text-red-400 text-xs">*</span>
                      )}
                      <span className="text-neutral-700 text-xs">({field.field_type})</span>
                    </div>
                    {field.field_description && (
                      <div className="text-neutral-700 text-xs mt-1 italic">
                        {field.field_description}
                      </div>
                    )}
                  </div>
                  <div className="ml-2 flex-shrink-0">{renderFieldValue(field)}</div>
                </div>
              </div>
            );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}