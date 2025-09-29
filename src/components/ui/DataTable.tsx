'use client';

import React from 'react';
import { DataTableProps, InventoryTableColumn } from '@/types/inventory';

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  error = null,
  emptyMessage = 'No data found',
  onRowClick,
  className = '',
  headerClassName = '',
  bodyClassName = ''
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-white/[0.08] rounded w-1/4 mb-8"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-white/[0.05] rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h2 className="text-red-800 font-semibold">Error Loading Data</h2>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <table className={`min-w-full divide-y divide-white/[0.08] ${className}`}>
      <thead className={`bg-white/[0.02] ${headerClassName}`}>
        <tr>
          {columns.map((column) => (
            <th
              key={column.key}
              className={`px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider ${column.headerClassName || ''}`}
              style={{ width: column.width }}
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className={`bg-white/[0.01] divide-y divide-white/[0.08] ${bodyClassName}`}>
        {data.map((item, index) => (
          <tr
            key={item.id || index}
            onClick={() => onRowClick?.(item)}
            className={onRowClick ? 'cursor-pointer hover:bg-white/[0.04]' : ''}
          >
            {columns.map((column) => {
              const value = column.accessor ? column.accessor(item) : item[column.key];
              return (
                <td
                  key={column.key}
                  className={`px-6 py-4 whitespace-nowrap ${column.className || ''}`}
                >
                  {column.render ? column.render(item, value) : value}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}