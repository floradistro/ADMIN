import React, { useState, useRef, useEffect } from 'react';
import { ColumnConfig } from '../../types';

interface ColumnSelectorProps {
  columnConfigs: ColumnConfig[];
  onToggleColumn: (columnId: string) => void;
  onToggleAllBlueprints: (visible: boolean) => void;
  onLoadFieldValues?: () => void;
  isLoadingBlueprintFields?: boolean;
  className?: string;
}

export function ColumnSelector({ 
  columnConfigs, 
  onToggleColumn, 
  onToggleAllBlueprints,
  onLoadFieldValues,
  isLoadingBlueprintFields = false,
  className = '' 
}: ColumnSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const defaultColumns = columnConfigs.filter(col => col.type === 'default');
  const blueprintColumns = columnConfigs.filter(col => col.type === 'blueprint');
  const visibleBlueprintCount = blueprintColumns.filter(col => col.visible).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 bg-white/[0.05] text-neutral-300 rounded-lg hover:bg-white/[0.08] transition text-xs relative"
        title="Configure table columns"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-96 max-h-[600px] bg-neutral-900/95 border border-white/[0.08] rounded-lg shadow-2xl backdrop-blur-sm z-50 overflow-hidden">
          <div className="p-0 h-full max-h-[600px] overflow-y-auto scrollable-container">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/[0.08] bg-neutral-900/60">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <h2 className="text-sm font-normal text-neutral-400">
                  Configure Table Columns
                  {blueprintColumns.length > 0 && (
                    <span className="ml-2 text-xs">({visibleBlueprintCount} of {blueprintColumns.length} visible)</span>
                  )}
                </h2>
              </div>
            </div>
            
            <div className="p-4">
            
            {/* Default Columns */}
            <div className="mb-4">
              <div className="text-xs font-medium text-neutral-400 mb-2">Default Columns</div>
              <div className="space-y-2">
                {defaultColumns.map(column => (
                  <label key={column.id} className="flex items-center gap-2 text-xs text-neutral-300">
                    <input
                      type="checkbox"
                      checked={column.visible}
                      onChange={() => onToggleColumn(column.id)}
                      disabled={column.id === 'product'} // Keep essential columns always visible
                      className="rounded text-white bg-neutral-700 border-neutral-600 focus:ring-white/20 focus:ring-1"
                    />
                    <span className={column.id === 'product' ? 'text-neutral-500' : ''}>
                      {column.label}
                    </span>
                    {column.id === 'product' && (
                      <span className="text-neutral-500 text-xs">(required)</span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Blueprint Columns */}
            {blueprintColumns.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-medium text-neutral-400">Blueprint Fields</div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onToggleAllBlueprints(true)}
                      className="text-xs text-neutral-400 hover:text-neutral-300 px-2 py-1 rounded hover:bg-white/[0.05] font-tiempos"
                    >
                      Show All
                    </button>
                    <button
                      onClick={() => onToggleAllBlueprints(false)}
                      className="text-xs text-neutral-400 hover:text-neutral-300 px-2 py-1 rounded hover:bg-white/[0.05]"
                    >
                      Hide All
                    </button>
                  </div>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {blueprintColumns.map(column => (
                    <label key={column.id} className="flex items-center gap-2 text-xs text-neutral-300">
                      <input
                        type="checkbox"
                        checked={column.visible}
                        onChange={() => onToggleColumn(column.id)}
                        className="rounded text-white bg-neutral-700 border-neutral-600 focus:ring-white/20 focus:ring-1"
                      />
                      <span>{column.label}</span>
                      <span className="text-neutral-500 text-xs">({column.blueprint_field_type})</span>
                    </label>
                  ))}
                </div>
                
                {/* Load Field Values Button */}
                {onLoadFieldValues && (
                  <div className="mt-3 pt-2 border-t border-white/[0.04]">
                    <button
                      onClick={() => {
                        onLoadFieldValues();
                        setIsOpen(false);
                      }}
                      disabled={isLoadingBlueprintFields}
                      className="w-full px-3 py-1.5 bg-neutral-800/50 hover:bg-neutral-800/70 disabled:bg-neutral-800/30 text-neutral-300 hover:text-neutral-200 disabled:text-neutral-500 text-xs rounded-lg smooth-hover border-b border-white/[0.02] disabled:border-white/[0.01]"
                    >
                      {isLoadingBlueprintFields ? 'Loading...' : 'Load Field Values'}
                    </button>
                    <div className="text-xs text-neutral-500 mt-1 text-center">
                      Fetch blueprint field values for all products
                    </div>
                  </div>
                )}
              </div>
            )}

              {blueprintColumns.length === 0 && (
                <div className="text-xs text-neutral-500 text-center py-4">
                  {isLoadingBlueprintFields ? 'Loading blueprint fields...' : 'No blueprint fields available.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
