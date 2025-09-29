import React, { useState, useCallback } from 'react';
import { getTimestampInfo } from '@/lib/timestamp-utils';
import { UnifiedAuditCard } from './UnifiedAuditCard';

interface BatchAuditCardProps {
  batchId: string;
  entries: any[];
}

export const BatchAuditCard = React.memo(function BatchAuditCard({ batchId, entries }: BatchAuditCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  // Calculate summary statistics
  const totalProducts = entries.length;
  const totalChangeAmount = entries.reduce((sum, entry) => sum + (entry.change_amount || 0), 0);
  const firstEntry = entries[0];
  const timestampInfo = getTimestampInfo(firstEntry.created_at || firstEntry.timestamp);
  
  // Get operation type from first entry
  const getOperationType = () => {
    if (firstEntry.notes) {
      const notes = firstEntry.notes.toLowerCase();
      if (notes.includes('audit')) return 'Batch Audit';
      if (notes.includes('restock')) return 'Batch Restock';
      if (notes.includes('adjustment')) return 'Batch Adjustment';
    }
    return 'Batch Update';
  };

  const operationType = getOperationType();

  return (
    <div className="mb-2">
      {/* Batch Summary Card */}
      <div className={`border rounded-lg transition-all duration-200 relative ${
        isExpanded 
          ? 'bg-neutral-700/40 border-neutral-500/40 shadow-xl ring-2 ring-neutral-600/30 scale-[1.01]' 
          : 'bg-neutral-900/40 hover:bg-neutral-800/40 border-white/[0.04]'
      }`}>
        {/* Active Indicator Bar */}
        {isExpanded && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-neutral-400 rounded-l-lg" />
        )}
        <div className="flex items-center gap-3 p-3">
          {/* Expand Button */}
          <button
            onClick={handleToggleExpand}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            <svg
              className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Batch Icon */}
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-neutral-800/50 rounded">
            <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>

          {/* Batch Info */}
          <div className="flex-1 min-w-0">
            <div className="text-neutral-300 text-sm font-medium">
              {operationType} - {totalProducts} items
            </div>
            <div className="text-xs text-neutral-500 mt-0.5">
              <span className={timestampInfo.isValid ? '' : 'text-red-400'}>
                {timestampInfo.relative}
              </span>
              {firstEntry.location_name && ` • ${firstEntry.location_name}`}
              {firstEntry.user_name && firstEntry.user_name !== 'System' && (
                <span className="font-medium"> • {firstEntry.user_name}</span>
              )}
              <span className="text-neutral-600"> • Batch #{batchId}</span>
            </div>
          </div>

          {/* Operation Type Badge */}
          <div className="px-2 py-1 rounded border text-xs font-medium text-neutral-400 border-neutral-700/50">
            {operationType}
          </div>

          {/* Total Change Amount */}
          {totalChangeAmount !== 0 && (
            <div className={`px-2 py-1 rounded text-xs font-bold bg-neutral-800/30 ${
              totalChangeAmount > 0 
                ? 'text-green-400' 
                : 'text-red-400'
            }`}>
              {totalChangeAmount > 0 ? '+' : ''}{totalChangeAmount} total
            </div>
          )}

          {/* Item Count Badge */}
          <div className="px-2 py-1 bg-neutral-800/30 text-neutral-400 rounded text-xs font-medium">
            {totalProducts} items
          </div>
        </div>

        {/* Batch Notes */}
        {firstEntry.notes && (
          <div className="px-3 pb-2">
            <div className="text-xs text-neutral-500 pl-9">
              {firstEntry.notes}
            </div>
          </div>
        )}
      </div>

      {/* Expanded Individual Entries */}
      {isExpanded && (
        <div className="ml-8 mt-3 space-y-1 animate-in slide-in-from-top-1 duration-200 pl-4 border-l-4 border-neutral-600/30">
          {entries.map((entry) => (
            <div key={entry.id} className="opacity-95 scale-[0.97] hover:scale-[0.99] transition-transform">
              <UnifiedAuditCard log={entry} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
