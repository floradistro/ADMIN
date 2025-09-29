'use client';

import React from 'react';
import { Check, X } from 'lucide-react';

interface ReportStatusBarProps {
  selectedCount: number;
  totalCount: number;
  totals: Record<string, number> | null;
  onClearSelection: () => void;
}

export function ReportStatusBar({ 
  selectedCount, 
  totalCount, 
  totals, 
  onClearSelection 
}: ReportStatusBarProps) {
  if (selectedCount === 0) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-neutral-800 border-t border-white/[0.08] px-4 py-3 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Selection Info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded border-2 border-blue-500 flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-white" />
              </div>
              <span className="text-sm font-medium text-white">
                {selectedCount} of {totalCount} rows selected
              </span>
            </div>
            <button
              onClick={onClearSelection}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-neutral-700 hover:bg-neutral-600 rounded transition-colors text-neutral-300"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          </div>

          {/* Key Totals */}
          {totals && (
            <div className="flex items-center gap-6 text-sm">
              <div className="flex flex-col">
                <span className="text-xs text-neutral-400">Gross Sales</span>
                <span className="font-semibold text-green-400">
                  {formatCurrency(totals['Gross Sales'])}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-neutral-400">Gross Profit</span>
                <span className="font-semibold text-blue-400">
                  {formatCurrency(totals['Gross Profit'])}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-neutral-400">Invoices</span>
                <span className="font-semibold text-white">
                  {totals['Invoices Sold']}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-neutral-400">Avg Transaction</span>
                <span className="font-semibold text-white">
                  {formatCurrency(totals['Transaction Average'])}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-neutral-400">Margin</span>
                <span className="font-semibold text-yellow-400">
                  {formatPercent(totals['Gross Margin'])}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Additional Actions */}
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">
            Export Selected
          </button>
          <button className="px-3 py-1.5 text-xs bg-neutral-700 hover:bg-neutral-600 text-neutral-300 rounded transition-colors">
            More Actions
          </button>
        </div>
      </div>
    </div>
  );
}
