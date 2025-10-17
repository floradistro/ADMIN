'use client';

import React, { useState, useEffect } from 'react';
import { productAPI } from '../../services/product-api';

interface ProductField {
  name: string;
  label: string;
  type: string;
  value: any;
  required: boolean;
  config?: any;
  group?: string;
}

interface ProductFieldsProps {
  productId: number;
  isEditMode?: boolean;
  editValues?: Record<string, any>;
  onChange?: (values: Record<string, any>) => void;
}

export function ProductFields({ 
  productId, 
  isEditMode = false,
  editValues = {},
  onChange 
}: ProductFieldsProps) {
  const [fields, setFields] = useState<ProductField[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFields();
  }, [productId]);

  const loadFields = async () => {
    try {
      setLoading(true);
      const fields = await productAPI.getFields(productId);
      setFields(fields);
    } catch (error) {
      console.error('Failed to load fields:', error);
      setFields([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    if (onChange) {
      onChange({
        ...editValues,
        [fieldName]: value
      });
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-neutral-800 rounded w-32"></div>
        <div className="h-3 bg-neutral-800 rounded w-full"></div>
        <div className="h-3 bg-neutral-800 rounded w-3/4"></div>
      </div>
    );
  }

  if (!fields || fields.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="text-neutral-600 text-xs mb-2">
          No fields assigned
        </div>
        <div className="text-neutral-700 text-xs">
          This product doesn't have any fields assigned to its categories.
        </div>
      </div>
    );
  }

  const renderField = (field: ProductField) => {
    const currentValue = editValues[field.name] ?? field.value ?? '';
    const baseClasses = 'border border-white/[0.08] rounded p-2 transition-all duration-200';

    if (!isEditMode) {
      // Read-only view
      return (
        <div key={field.name} className={baseClasses}>
          <div className="text-neutral-600 text-xs font-medium mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </div>
          <div className="text-neutral-400 text-xs">
            {currentValue || '-'}
          </div>
        </div>
      );
    }

    // Edit mode
    switch (field.type) {
      case 'text':
      case 'email':
      case 'url':
        return (
          <div key={field.name} className={baseClasses}>
            <div className="text-neutral-600 text-xs font-medium mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </div>
            <input
              type={field.type}
              value={currentValue}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="bg-transparent text-neutral-400 text-xs border-none outline-none focus:text-neutral-300 w-full"
              placeholder={`Enter ${field.label.toLowerCase()}`}
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={field.name} className={baseClasses}>
            <div className="text-neutral-600 text-xs font-medium mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </div>
            <textarea
              value={currentValue}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="bg-transparent text-neutral-400 text-xs border-none outline-none focus:text-neutral-300 w-full resize-none"
              placeholder={`Enter ${field.label.toLowerCase()}`}
              rows={3}
            />
          </div>
        );

      case 'number':
        return (
          <div key={field.name} className={baseClasses}>
            <div className="text-neutral-600 text-xs font-medium mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </div>
            <input
              type="number"
              step={field.config?.step || 0.1}
              min={field.config?.min}
              max={field.config?.max}
              value={currentValue}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="bg-transparent text-neutral-400 text-xs border-none outline-none focus:text-neutral-300 w-full"
              placeholder="0"
            />
          </div>
        );

      case 'select':
        const options = field.config?.options || [];
        return (
          <div key={field.name} className={baseClasses}>
            <div className="text-neutral-600 text-xs font-medium mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </div>
            <select
              value={currentValue}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-900 text-neutral-400 text-xs border-none outline-none focus:text-neutral-300 w-full"
            >
              <option value="">Select...</option>
              {options.map((opt: string) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.name} className={baseClasses}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={currentValue === true || currentValue === 'true' || currentValue === '1'}
                onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                className="rounded border-neutral-700"
              />
              <span className="text-neutral-600 text-xs font-medium">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </span>
            </label>
          </div>
        );

      case 'date':
        return (
          <div key={field.name} className={baseClasses}>
            <div className="text-neutral-600 text-xs font-medium mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </div>
            <input
              type="date"
              value={currentValue}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-900 text-neutral-400 text-xs border-none outline-none focus:text-neutral-300 w-full"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      {fields.map(renderField)}
    </div>
  );
}

