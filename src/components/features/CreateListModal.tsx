'use client';

import React, { useState, useMemo } from 'react';
import { X, Plus, Minus, GripVertical, Check } from 'lucide-react';
import { Product, ColumnConfig } from '../../types';
import { ListColumn } from '../../types/lists';
import { Button } from '../ui/Button';

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProducts: Product[];
  availableColumns: ColumnConfig[];
  onCreateList: (
    name: string,
    description: string,
    columns: ListColumn[],
    settings: any
  ) => void;
}

export function CreateListModal({
  isOpen,
  onClose,
  selectedProducts,
  availableColumns,
  onCreateList
}: CreateListModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'name',
    'sku',
    'categories',
    'total_stock',
    'regular_price'
  ]);
  const [includeImages, setIncludeImages] = useState(true);
  const [includeCOA, setIncludeCOA] = useState(false);
  const [includePricing, setIncludePricing] = useState(true);
  const [includeInventory, setIncludeInventory] = useState(true);

  const toggleColumn = (columnId: string) => {
    setSelectedColumns(prev =>
      prev.includes(columnId)
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  const handleCreate = () => {
    if (!name.trim()) return;

    const columns: ListColumn[] = selectedColumns.map(colId => {
      const config = availableColumns.find(c => c.id === colId);
      return {
        id: colId,
        label: config?.label || colId,
        field: colId,
        type: config?.type || 'default',
        visible: true,
        width: config?.width
      };
    });

    const settings = {
      theme: 'dark' as const,
      includeImages,
      includeCOA,
      includePricing,
      includeInventory,
      customFields: []
    };

    onCreateList(name, description, columns, settings);
    handleClose();
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setSelectedColumns(['name', 'sku', 'categories', 'total_stock', 'regular_price']);
    setIncludeImages(true);
    setIncludeCOA(false);
    setIncludePricing(true);
    setIncludeInventory(true);
    onClose();
  };

  if (!isOpen) return null;

  const standardColumns = availableColumns.filter(c => c.type === 'default');
  const blueprintColumns = availableColumns.filter(c => c.type === 'blueprint');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-neutral-900 rounded-lg shadow-2xl border border-white/10 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
            <h2 className="text-xl font-medium text-white">Create Product List</h2>
            <p className="text-xs text-white/50 mt-1">
              {selectedProducts.length} products selected
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-white/5 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-white/40 hover:text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Basic Info */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1.5">
                List Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Q4 2025 Product Catalog"
                className="w-full px-3 py-2 bg-transparent border border-white/[0.08] rounded text-sm text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1.5">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description..."
                rows={2}
                className="w-full px-3 py-2 bg-transparent border border-white/[0.08] rounded text-sm text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-white/20 resize-none transition-colors"
              />
            </div>
          </div>

          {/* Column Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-neutral-400">Select Columns</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedColumns(availableColumns.map(c => c.id))}
                  className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  Select All
                </button>
                <span className="text-white/10">•</span>
                <button
                  onClick={() => setSelectedColumns([])}
                  className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Standard Columns */}
            <div>
              <h4 className="text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">Standard Fields</h4>
              <div className="grid grid-cols-2 gap-2">
                {standardColumns.map(column => (
                  <label
                    key={column.id}
                    className="flex items-center gap-2 p-2 border border-white/[0.08] rounded hover:border-white/[0.12] cursor-pointer transition-all group"
                  >
                    <div className={`
                      w-4 h-4 rounded border flex items-center justify-center transition-all
                      ${selectedColumns.includes(column.id)
                        ? 'bg-white/90 border-white/90'
                        : 'border-white/20 group-hover:border-white/30'
                      }
                    `}>
                      {selectedColumns.includes(column.id) && (
                        <Check className="w-3 h-3 text-black" strokeWidth={2.5} />
                      )}
                    </div>
                    <span className="text-xs text-neutral-400 group-hover:text-neutral-300">{column.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Blueprint Columns */}
            {blueprintColumns.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">Blueprint Fields</h4>
                <div className="grid grid-cols-2 gap-2">
                  {blueprintColumns.map(column => (
                    <label
                      key={column.id}
                      className="flex items-center gap-2 p-2 border border-white/[0.08] rounded hover:border-white/[0.12] cursor-pointer transition-all group"
                    >
                      <div className={`
                        w-4 h-4 rounded border flex items-center justify-center transition-all
                        ${selectedColumns.includes(column.id)
                          ? 'bg-white/90 border-white/90'
                          : 'border-white/20 group-hover:border-white/30'
                        }
                      `}>
                        {selectedColumns.includes(column.id) && (
                          <Check className="w-3 h-3 text-black" strokeWidth={2.5} />
                        )}
                      </div>
                      <span className="text-xs text-neutral-400 group-hover:text-neutral-300">{column.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Export Settings */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-neutral-500">Export Settings</h3>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 p-2 border border-white/[0.08] rounded hover:border-white/[0.12] cursor-pointer transition-all group">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${includeImages ? 'bg-white/90 border-white/90' : 'border-white/20 group-hover:border-white/30'}`}>
                  {includeImages && <Check className="w-3 h-3 text-black" strokeWidth={2.5} />}
                </div>
                <input
                  type="checkbox"
                  checked={includeImages}
                  onChange={(e) => setIncludeImages(e.target.checked)}
                  className="hidden"
                />
                <span className="text-xs text-neutral-400 group-hover:text-neutral-300">Product Images</span>
              </label>

              <label className="flex items-center gap-2 p-2 border border-white/[0.08] rounded hover:border-white/[0.12] cursor-pointer transition-all group">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${includeCOA ? 'bg-white/90 border-white/90' : 'border-white/20 group-hover:border-white/30'}`}>
                  {includeCOA && <Check className="w-3 h-3 text-black" strokeWidth={2.5} />}
                </div>
                <input
                  type="checkbox"
                  checked={includeCOA}
                  onChange={(e) => setIncludeCOA(e.target.checked)}
                  className="hidden"
                />
                <span className="text-xs text-neutral-400 group-hover:text-neutral-300">COA Links</span>
              </label>

              <label className="flex items-center gap-2 p-2 border border-white/[0.08] rounded hover:border-white/[0.12] cursor-pointer transition-all group">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${includePricing ? 'bg-white/90 border-white/90' : 'border-white/20 group-hover:border-white/30'}`}>
                  {includePricing && <Check className="w-3 h-3 text-black" strokeWidth={2.5} />}
                </div>
                <input
                  type="checkbox"
                  checked={includePricing}
                  onChange={(e) => setIncludePricing(e.target.checked)}
                  className="hidden"
                />
                <span className="text-xs text-neutral-400 group-hover:text-neutral-300">Pricing</span>
              </label>

              <label className="flex items-center gap-2 p-2 border border-white/[0.08] rounded hover:border-white/[0.12] cursor-pointer transition-all group">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${includeInventory ? 'bg-white/90 border-white/90' : 'border-white/20 group-hover:border-white/30'}`}>
                  {includeInventory && <Check className="w-3 h-3 text-black" strokeWidth={2.5} />}
                </div>
                <input
                  type="checkbox"
                  checked={includeInventory}
                  onChange={(e) => setIncludeInventory(e.target.checked)}
                  className="hidden"
                />
                <span className="text-xs text-neutral-400 group-hover:text-neutral-300">Inventory</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-white/[0.08]">
          <div className="text-xs text-neutral-600">
            {selectedColumns.length} column{selectedColumns.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-1.5 text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!name.trim() || selectedColumns.length === 0}
              className="px-4 py-1.5 text-sm bg-white/90 hover:bg-white disabled:bg-white/30 disabled:cursor-not-allowed text-black rounded transition-colors font-medium"
            >
              Create List
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

