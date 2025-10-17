/**
 * Field Display Component - V2
 * Displays Flora Fields from the V2 API
 */

import React from 'react';
import { FloraField } from '../../services/fields-service';

interface FieldDisplayProps {
  fields: FloraField[];
  compact?: boolean;
}

export function FieldDisplay({ fields, compact = false }: FieldDisplayProps) {
  if (!fields || fields.length === 0) {
    return (
      <div className="text-neutral-700 text-xs">
        No fields assigned
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

  if (compact) {
    return (
      <div className="space-y-1">
        {fields.slice(0, 3).map((field) => (
          <div key={field.id} className="text-xs">
            <span className="text-neutral-600">{field.label}:</span>{' '}
            <span className="text-neutral-400">
              {field.value || field.config.default_value || '-'}
            </span>
          </div>
        ))}
        {fields.length > 3 && (
          <div className="text-neutral-700 text-xs">
            +{fields.length - 3} more fields
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupedFields).map(([group, groupFields]) => (
        <div key={group}>
          <div className="text-neutral-500 text-xs font-medium mb-2">
            {group}
          </div>
          <div className="space-y-2">
            {groupFields.map((field) => (
              <div
                key={field.id}
                className="border border-white/[0.08] rounded p-2"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-neutral-600 text-xs font-medium">
                    {field.label}
                    {field.is_required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </span>
                  <span className="text-neutral-700 text-xs">
                    {field.type}
                  </span>
                </div>
                <div className="text-neutral-400 text-sm">
                  {field.has_value
                    ? String(field.value)
                    : field.config.default_value
                    ? String(field.config.default_value)
                    : '-'}
                </div>
                {field.description && (
                  <div className="text-neutral-700 text-xs mt-1">
                    {field.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

