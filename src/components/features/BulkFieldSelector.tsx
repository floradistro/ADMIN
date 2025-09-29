import React, { useState, useEffect, useRef } from 'react';

export interface FieldOption {
  field_name: string;
  field_label: string;
  field_type: string;
  is_blueprint_field: boolean;
  blueprint_name?: string;
  count?: number;
}

interface BulkFieldSelectorProps {
  availableFields: FieldOption[];
  selectedFields: Set<string>;
  onFieldSelectionChange: (selectedFields: Set<string>) => void;
  className?: string;
}

export function BulkFieldSelector({
  availableFields,
  selectedFields,
  onFieldSelectionChange,
  className = ''
}: BulkFieldSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFieldToggle = (fieldName: string) => {
    const newSelection = new Set(selectedFields);
    if (newSelection.has(fieldName)) {
      newSelection.delete(fieldName);
    } else {
      newSelection.add(fieldName);
    }
    onFieldSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    const allFieldNames = availableFields.map(field => field.field_name);
    onFieldSelectionChange(new Set(allFieldNames));
  };

  const handleSelectNone = () => {
    onFieldSelectionChange(new Set());
  };

  const handleSelectStandardFields = () => {
    const standardFields = availableFields
      .filter(field => !field.is_blueprint_field)
      .map(field => field.field_name);
    onFieldSelectionChange(new Set(standardFields));
  };

  const handleSelectBlueprintFields = () => {
    const blueprintFields = availableFields
      .filter(field => field.is_blueprint_field)
      .map(field => field.field_name);
    onFieldSelectionChange(new Set(blueprintFields));
  };

  // Group fields by type
  const standardFields = availableFields.filter(field => !field.is_blueprint_field);
  const blueprintFields = availableFields.filter(field => field.is_blueprint_field);

  // Group blueprint fields by blueprint name
  const blueprintGroups = blueprintFields.reduce((groups, field) => {
    const groupName = field.blueprint_name || 'Other';
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(field);
    return groups;
  }, {} as Record<string, FieldOption[]>);

  const selectedCount = selectedFields.size;
  const totalCount = availableFields.length;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 bg-white/[0.05] text-neutral-300 rounded-lg hover:bg-white/[0.08] transition text-xs relative"
        title="Select fields to edit"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        <span className="text-xs">
          Fields ({selectedCount}/{totalCount})
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-neutral-800 border border-white/[0.08] rounded-lg shadow-lg z-[9999] max-h-96 overflow-y-auto">
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-medium text-neutral-300">Select Fields to Edit</div>
              <div className="text-xs text-neutral-500">
                {selectedCount} of {totalCount} selected
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={handleSelectAll}
                className="px-2 py-1 text-xs bg-blue-900/30 text-blue-400 rounded hover:bg-blue-900/50 transition"
              >
                All
              </button>
              <button
                onClick={handleSelectNone}
                className="px-2 py-1 text-xs bg-neutral-700 text-neutral-300 rounded hover:bg-neutral-600 transition"
              >
                None
              </button>
              <button
                onClick={handleSelectStandardFields}
                className="px-2 py-1 text-xs bg-green-900/30 text-green-400 rounded hover:bg-green-900/50 transition"
              >
                Standard
              </button>
              <button
                onClick={handleSelectBlueprintFields}
                className="px-2 py-1 text-xs bg-purple-900/30 text-purple-400 rounded hover:bg-purple-900/50 transition"
              >
                Blueprint
              </button>
            </div>

            {/* Standard Fields */}
            {standardFields.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-medium text-neutral-400 mb-2 flex items-center gap-2">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Standard Fields
                </div>
                <div className="space-y-1">
                  {standardFields.map(field => (
                    <label
                      key={field.field_name}
                      className="flex items-center gap-2 p-2 rounded hover:bg-white/[0.02] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFields.has(field.field_name)}
                        onChange={() => handleFieldToggle(field.field_name)}
                        className="rounded border-neutral-600 bg-neutral-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                      />
                      <div className="flex-1">
                        <div className="text-xs font-medium text-neutral-300">
                          {field.field_label}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {field.field_type} • {field.field_name}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Blueprint Fields */}
            {Object.keys(blueprintGroups).length > 0 && (
              <div>
                <div className="text-xs font-medium text-neutral-400 mb-2 flex items-center gap-2">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Blueprint Fields
                </div>
                <div className="space-y-3">
                  {Object.entries(blueprintGroups).map(([blueprintName, fields]) => (
                    <div key={blueprintName}>
                      <div className="text-xs font-medium text-neutral-500 mb-1 px-2">
                        {blueprintName}
                      </div>
                      <div className="space-y-1">
                        {fields.map(field => (
                          <label
                            key={field.field_name}
                            className="flex items-center gap-2 p-2 rounded hover:bg-white/[0.02] cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedFields.has(field.field_name)}
                              onChange={() => handleFieldToggle(field.field_name)}
                              className="rounded border-neutral-600 bg-neutral-700 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
                            />
                            <div className="flex-1">
                              <div className="text-xs font-medium text-neutral-300">
                                {field.field_label}
                              </div>
                              <div className="text-xs text-neutral-500">
                                {field.field_type} • {field.field_name}
                                {field.count && field.count > 1 && (
                                  <span className="ml-1 text-neutral-600">({field.count} products)</span>
                                )}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {availableFields.length === 0 && (
              <div className="text-center py-4 text-neutral-500 text-xs">
                No fields available for editing
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
