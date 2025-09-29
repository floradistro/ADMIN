import React, { useState, useCallback } from 'react';
import { getTimestampInfo, debugTimestamp } from '@/lib/timestamp-utils';

interface UnifiedAuditCardProps {
  log: {
    id: number | string;
    // Common fields
    product_name: string;
    product_image?: string;
    location_name?: string;
    operation: string;
    action?: string;
    user_name?: string;
    timestamp: string;
    created_at: string;
    notes?: string;
    
    // Inventory update fields
    old_quantity?: number;
    new_quantity?: number;
    change_amount?: number;
    
    // Transfer fields
    from_location_name?: string;
    to_location_name?: string;
    transfer_quantity?: number;
    
    // Conversion fields
    from_product_name?: string;
    to_product_name?: string;
    from_product_image?: string;
    to_product_image?: string;
    from_quantity?: number;
    to_quantity?: number;
    conversion_ratio?: number;
    
    // Recipe conversion fields (if available)
    recipe_name?: string;
    input_quantity?: number;
    actual_output?: number;
    expected_output?: number;
    variance_percentage?: number;
    variance_reasons?: string[];
    conversion_status?: string;
    conversion_notes?: string;
    completed_at?: string;
  };
}

export const UnifiedAuditCard = React.memo(function UnifiedAuditCard({ log }: UnifiedAuditCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  const getOperationIcon = () => {
    switch (log.operation) {
      case 'stock_transfer':
        return '';
      case 'stock_conversion':
        return '';
      case 'inventory_update':
        return '';
      default:
        return '';
    }
  };

  const getOperationColor = () => {
    switch (log.operation) {
      case 'stock_transfer':
        return 'text-neutral-400';
      case 'stock_conversion':
        return 'text-neutral-400';
      case 'inventory_update':
        return (log.change_amount || 0) > 0 ? 'text-neutral-400' : 'text-neutral-400';
      default:
        return 'text-neutral-500';
    }
  };

  const getVarianceColor = (variance?: number) => {
    if (variance === undefined) return 'text-neutral-500';
    const absVariance = Math.abs(variance);
    if (absVariance > 10) return 'text-neutral-400';
    if (absVariance > 5) return 'text-neutral-400';
    return 'text-neutral-400';
  };

  // Get timestamp information using the new utility
  const timestampInfo = getTimestampInfo(log.created_at || log.timestamp);
  const completedTimestampInfo = log.completed_at ? getTimestampInfo(log.completed_at) : null;

  // Debug logging removed

  const getDisplayProductName = (productName: string) => {
    // Check if this is a fallback name pattern like "Product 123" or "Product ID 123"
    if (productName.match(/^Product( ID)? \d+$/)) {
      return productName.replace('Product ID ', '#').replace('Product ', '#');
    }
    return productName;
  };

  const getMainDescription = (showGenericTypes: boolean = false) => {
    switch (log.operation) {
      case 'stock_transfer':
        return `${log.from_location_name || 'Unknown'} → ${log.to_location_name || 'Unknown'}`;
      
      case 'stock_conversion':
        if (log.action === 'stock_conversion') {
          return `→ ${log.to_product_name}`;
        } else {
          return `← ${log.from_product_name}`;
        }
      
      case 'inventory_update':
        return `Stock adjustment`;
      
      default:
        return showGenericTypes ? 'General update' : '';
    }
  };



  return (
    <div className="group transition-all cursor-pointer mb-2 border border-white/[0.04] rounded-lg bg-neutral-900/40 hover:bg-neutral-900/60 product-card">
      {/* Main Audit Row - Compact (3 lines max) */}
      <div className="flex items-center gap-3 px-4 py-2">
        {/* Expand/Collapse Icon */}
        <button
          onClick={handleToggleExpand}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-neutral-600 hover:text-neutral-400 smooth-hover"
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

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="text-neutral-400 text-xs truncate flex items-center gap-2 product-name">
            {getDisplayProductName(log.product_name)}
            {log.recipe_name && (
              <span className="text-xs text-neutral-500 bg-neutral-800/30 px-1.5 py-0.5 rounded">
                {log.recipe_name}
              </span>
            )}
          </div>
          <div className="text-xs text-neutral-500 mt-0.5" title={timestampInfo.isValid ? timestampInfo.absolute : 'Invalid timestamp'}>
            <span className={timestampInfo.isValid ? 'text-neutral-500' : 'text-red-400'}>
              {timestampInfo.relative}
            </span>
            {log.location_name && ` • ${log.location_name}`}
            {log.user_name && log.user_name.toLowerCase() !== 'system' && ` • ${log.user_name}`}
          </div>
        </div>

        {/* Status & Alerts */}
        <div className="flex items-center gap-2">
          {log.conversion_status && (
            <div className={`flex items-center justify-center w-5 h-5 rounded ${
              log.conversion_status === 'completed'
                ? 'text-neutral-400'
                : log.conversion_status === 'cancelled' || log.conversion_status === 'failed'
                ? 'text-neutral-400'
                : 'text-neutral-500'
            }`} title={log.conversion_status}>
              {log.conversion_status === 'completed' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : log.conversion_status === 'cancelled' || log.conversion_status === 'failed' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-white/[0.04] mt-2 bg-neutral-900/20">
          <div className="px-4 py-4 space-y-4">
            
            {/* Operation-specific details */}
            {log.operation === 'stock_transfer' && (
              <div className="bg-neutral-900/40 rounded-lg p-4">
                <h5 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3">Transfer Details</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-xs text-neutral-400">
                      <span className="text-neutral-600">From:</span> {log.from_location_name || 'Unknown'}
                    </div>
                    <div className="text-xs text-neutral-400">
                      <span className="text-neutral-600">To:</span> {log.to_location_name || 'Unknown'}
                    </div>
                    <div className="text-xs text-neutral-400">
                      <span className="text-neutral-600">Quantity:</span> {log.transfer_quantity || 0} units
                    </div>
                  </div>
                </div>
              </div>
            )}

            {log.operation === 'stock_conversion' && (
              <div className="bg-neutral-900/40 rounded-lg p-4">
                <h5 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3">Conversion Details</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-xs text-neutral-400 product-name">
                      <span className="text-neutral-600">From:</span> {log.from_product_name ? getDisplayProductName(log.from_product_name) : 'Unknown'}
                    </div>
                    <div className="text-xs text-neutral-400 product-name">
                      <span className="text-neutral-600">To:</span> {log.to_product_name ? getDisplayProductName(log.to_product_name) : 'Unknown'}
                    </div>
                    <div className="text-xs text-neutral-400">
                      <span className="text-neutral-600">Ratio:</span> {log.from_quantity} → {log.to_quantity}
                    </div>
                    {log.conversion_ratio && (
                      <div className="text-xs text-neutral-400">
                        <span className="text-neutral-600">Rate:</span> 1:{log.conversion_ratio}
                      </div>
                    )}
                  </div>
                  
                  {/* Recipe conversion details */}
                  {(log.recipe_name || log.variance_percentage !== undefined) && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Recipe Analysis</h5>
                      <div className="space-y-1">
                        {log.recipe_name && (
                          <div className="text-xs text-neutral-400">
                            <span className="text-neutral-600">Recipe:</span> {log.recipe_name}
                          </div>
                        )}
                        {log.expected_output && (
                          <div className="text-xs text-neutral-400">
                            <span className="text-neutral-600">Expected:</span> {log.expected_output} units
                          </div>
                        )}
                        {log.actual_output && (
                          <div className="text-xs text-neutral-400">
                            <span className="text-neutral-600">Actual:</span> {log.actual_output} units
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {log.operation === 'inventory_update' && (
              <div className="bg-neutral-900/40 rounded-lg p-4">
                <h5 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3">Inventory Change</h5>
                <div className="space-y-2">
                  <div className="text-xs text-neutral-400">
                    <span className="text-neutral-600">Previous:</span> {log.old_quantity || 0} units
                  </div>
                  <div className="text-xs text-neutral-400">
                    <span className="text-neutral-600">New:</span> {log.new_quantity || 0} units
                  </div>
                  <div className="text-xs text-neutral-400">
                    <span className="text-neutral-600">Change:</span> {(log.change_amount || 0) > 0 ? '+' : ''}{log.change_amount || 0} units
                  </div>
                </div>
              </div>
            )}

            {/* Variance Analysis (for conversions) */}
            {log.variance_percentage !== undefined && (
              <div className="bg-neutral-900/40 rounded-lg p-4">
                <h5 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3">Variance Analysis</h5>
                <div className="p-3 rounded bg-neutral-800/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-neutral-400">Variance:</span>
                    <span className={`text-lg font-medium ${getVarianceColor(Number(log.variance_percentage))}`}>
                      {Number(log.variance_percentage) > 0 ? '+' : ''}{Number(log.variance_percentage).toFixed(2)}%
                    </span>
                  </div>
                  
                  {log.variance_reasons && log.variance_reasons.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-xs text-neutral-500">Reasons:</span>
                      <div className="flex flex-wrap gap-1">
                        {log.variance_reasons.map((reason, index) => (
                          <span key={index} className="px-2 py-1 bg-neutral-800/30 rounded-lg text-xs text-neutral-500">
                            {reason.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Operation Details */}
            <div className="bg-neutral-900/40 rounded-lg p-4">
              <h5 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3">Operation Details</h5>
              <div className="space-y-1">
                <div className="text-xs text-neutral-400">
                  <span className="text-neutral-600">Type:</span> {getMainDescription(true) || (log.operation as string).replace('_', ' ')}
                </div>
                <div className="text-xs text-neutral-400">
                  <span className="text-neutral-600">Created:</span> 
                  <span className={timestampInfo.isValid ? '' : 'text-red-400'} title={timestampInfo.isValid ? timestampInfo.absolute : 'Invalid timestamp'}>
                    {timestampInfo.relative}
                  </span>
                </div>
                {log.completed_at && (
                  <div className="text-xs text-neutral-400">
                    <span className="text-neutral-600">Completed:</span> 
                    <span className={completedTimestampInfo?.isValid ? '' : 'text-red-400'} title={completedTimestampInfo?.isValid ? completedTimestampInfo.absolute : 'Invalid timestamp'}>
                      {completedTimestampInfo?.relative || 'unknown'}
                    </span>
                  </div>
                )}
                {log.user_name && (
                  <div className="text-xs text-neutral-400">
                    <span className="text-neutral-600">By:</span> {log.user_name}
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {(log.notes || log.conversion_notes) && (
              <div className="bg-neutral-900/40 rounded-lg p-4">
                <h5 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3">Notes</h5>
                <div className="text-xs text-neutral-500 bg-neutral-800/30 rounded-lg p-3">
                  {log.notes || log.conversion_notes}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});