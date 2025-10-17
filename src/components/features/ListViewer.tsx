'use client';

import React from 'react';
import { X, Download, Mail } from 'lucide-react';
import { ProductList } from '../../types/lists';
import { Button } from '../ui/Button';

interface ListViewerProps {
  isOpen: boolean;
  onClose: () => void;
  list: ProductList | null;
  onExport: (format: 'pdf' | 'csv') => void;
  onEmail: () => void;
}

export function ListViewer({
  isOpen,
  onClose,
  list,
  onExport,
  onEmail
}: ListViewerProps) {
  if (!isOpen || !list) return null;

  const getValue = (product: any, field: string) => {
    const value = product.snapshot[field] || product.productData[field];
    
    if (Array.isArray(value)) {
      if (field === 'categories') {
        return value.map((cat: any) => cat.name).join(', ');
      }
      if (field === 'inventory') {
        return value.reduce((sum: number, inv: any) => sum + (inv.stock || 0), 0);
      }
      return value.join(', ');
    }
    
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    
    return value ?? '-';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-7xl max-h-[90vh] bg-neutral-900 rounded-lg shadow-2xl border border-white/10 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
            <h2 className="text-xl font-medium text-white">{list.name}</h2>
            {list.description && (
              <p className="text-xs text-white/50 mt-1">{list.description}</p>
            )}
            <p className="text-[10px] text-white/40 mt-1.5">
              {list.products.length} products · {list.columns.length} columns
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onExport('csv')}
              className="px-3 py-1.5 text-xs text-neutral-400 border border-white/[0.08] rounded hover:border-white/[0.12] hover:text-neutral-300 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3 h-3" />
              CSV
            </button>
            <button
              onClick={() => onExport('pdf')}
              className="px-3 py-1.5 text-xs text-neutral-400 border border-white/[0.08] rounded hover:border-white/[0.12] hover:text-neutral-300 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3 h-3" />
              PDF
            </button>
            <button
              onClick={onEmail}
              className="px-3 py-1.5 text-xs text-neutral-400 border border-white/[0.08] rounded hover:border-white/[0.12] hover:text-neutral-300 transition-colors flex items-center gap-1.5"
            >
              <Mail className="w-3 h-3" />
              Email
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/5 rounded transition-colors ml-2"
            >
              <X className="w-5 h-5 text-neutral-500 hover:text-neutral-300" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-neutral-800/95 backdrop-blur-sm border-b border-white/10">
              <tr>
                {list.columns.map((column) => (
                  <th
                    key={column.id}
                    className="px-3 py-2 text-left text-[10px] font-medium text-white/50 uppercase tracking-wider whitespace-nowrap"
                    style={{ width: column.width }}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {list.products.map((product, idx) => (
                <tr
                  key={product.productId}
                  className="hover:bg-white/5 transition-colors"
                >
                  {list.columns.map((column) => (
                    <td
                      key={column.id}
                      className="px-3 py-2 text-xs text-white/70 whitespace-nowrap"
                    >
                      {column.field === 'image' && product.productData.image ? (
                        <img
                          src={product.productData.image}
                          alt={product.productData.name}
                          className="w-8 h-8 object-cover rounded"
                        />
                      ) : (
                        getValue(product, column.field)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

