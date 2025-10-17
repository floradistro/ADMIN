/**
 * Editable Fields Component - V2
 * Edit Flora Fields with proper validation
 */

import React from 'react';
import { FloraField } from '../../services/fields-service';

interface EditableFieldsProps {
  fields: FloraField[];
  values: Record<string, any>;
  onChange: (fieldName: string, value: any) => void;
  disabled?: boolean;
}

export function EditableFields({
  fields,
  values,
  onChange,
  disabled = false,
}: EditableFieldsProps) {
  if (!fields || fields.length === 0) {
    return (
      <div className="text-center py-4 text-neutral-700 text-xs">
        No fields assigned to this product
      </div>
    );
  }

  // Group fields by group_label
  const groupedFields = fields.reduce((acc, field) => {
    const group = field.group_label || 'General';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(field);
    return acc;
  }, {} as Record<string, FloraField[]>);

  const renderField = (field: FloraField) => {
    const currentValue = values[field.name] ?? field.value ?? field.config.default_value ?? '';

    const baseClasses = `w-full bg-neutral-900 border border-white/[0.08] rounded px-3 py-2 text-sm text-neutral-300 focus:border-blue-500 focus:outline-none ${
      disabled ? 'opacity-50 cursor-not-allowed' : ''
    }`;

    switch (field.type) {
      case 'text':
      case 'email':
      case 'url':
        return (
          <input
            type={field.type}
            value={currentValue}
            onChange={(e) => onChange(field.name, e.target.value)}
            disabled={disabled}
            placeholder={field.config.placeholder || field.label}
            className={baseClasses}
            required={field.is_required}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={currentValue}
            onChange={(e) => onChange(field.name, parseFloat(e.target.value) || 0)}
            disabled={disabled}
            placeholder={field.config.placeholder || field.label}
            min={field.config.min}
            max={field.config.max}
            className={baseClasses}
            required={field.is_required}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={currentValue}
            onChange={(e) => onChange(field.name, e.target.value)}
            disabled={disabled}
            placeholder={field.config.placeholder || field.label}
            className={baseClasses}
            required={field.is_required}
            rows={4}
          />
        );

      case 'select':
        return (
          <select
            value={currentValue}
            onChange={(e) => onChange(field.name, e.target.value)}
            disabled={disabled}
            className={baseClasses}
            required={field.is_required}
          >
            <option value="">Select {field.label}</option>
            {field.config.options?.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!currentValue}
              onChange={(e) => onChange(field.name, e.target.checked)}
              disabled={disabled}
              className="rounded border-white/[0.08] bg-neutral-900 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-sm text-neutral-400">
              {field.config.placeholder || 'Enable'}
            </span>
          </label>
        );

      case 'date':
        return (
          <input
            type="date"
            value={currentValue}
            onChange={(e) => onChange(field.name, e.target.value)}
            disabled={disabled}
            className={baseClasses}
            required={field.is_required}
          />
        );

      default:
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => onChange(field.name, e.target.value)}
            disabled={disabled}
            placeholder={field.config.placeholder || field.label}
            className={baseClasses}
            required={field.is_required}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedFields).map(([group, groupFields]) => (
        <div key={group}>
          <div className="text-neutral-500 text-sm font-medium mb-3 border-b border-white/[0.08] pb-2">
            {group}
          </div>
          <div className="space-y-4">
            {groupFields.map((field) => (
              <div key={field.id}>
                <label className="block mb-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-neutral-600 text-xs font-medium">
                      {field.label}
                      {field.is_required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </span>
                    <span className="text-neutral-700 text-xs">{field.type}</span>
                  </div>
                  {field.description && (
                    <div className="text-neutral-700 text-xs mb-2">
                      {field.description}
                    </div>
                  )}
                  {renderField(field)}
                </label>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

