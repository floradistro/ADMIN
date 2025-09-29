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
    user_id?: number;
    timestamp: string;
    created_at: string;
    notes?: string;
    
    // Enhanced audit fields from Flora API
    ip_address?: string;
    user_agent?: string;
    metadata?: string;
    batch_id?: string;
    reference_type?: string;
    reference_id?: number;
    details?: any;
    
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
    const action = log.operation || log.action;
    switch (action) {
      case 'stock_transfer':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      case 'stock_conversion':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'inventory_update':
        return log.change_amount && log.change_amount > 0 ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
          </svg>
        );
      case 'remove_tax':
      case 'add_tax':
      case 'assign_tax':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        );
      case 'sale':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      case 'purchase':
      case 'restock':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
          </svg>
        );
      case 'adjustment':
      case 'audit':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'cost_updated':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
    }
  };

  const getMovementType = () => {
    // First check if the reason field gives us more specific information
    if (log.notes) {
      const reason = log.notes.toLowerCase();
      if (reason.includes('restock via po')) {
        const poMatch = log.notes.match(/PO-(\d+)/i);
        return poMatch ? `Restock (PO-${poMatch[1]})` : 'Restock';
      }
      if (reason.includes('audit')) return 'Audit';
      if (reason.includes('sale')) return 'Sale';
      if (reason.includes('purchase')) return 'Purchase';
      if (reason.includes('transfer')) return 'Transfer';
      if (reason.includes('conversion')) return 'Conversion';
    }

    // Fallback to action-based determination
    const action = log.operation || log.action;
    switch (action) {
      case 'stock_transfer':
        return 'Transfer';
      case 'stock_conversion':
        return 'Conversion';
      case 'inventory_update':
        return 'Adjustment';
      case 'remove_tax':
        return 'Tax Removal';
      case 'add_tax':
      case 'assign_tax':
        return 'Tax Assignment';
      case 'cost_updated':
        return 'Cost Update';
      case 'sale':
        return 'Sale';
      case 'purchase':
        return 'Purchase';
      case 'restock':
        return 'Restock';
      case 'adjustment':
        return 'Manual Adjustment';
      case 'audit':
        return 'Audit';
      default:
        return action ? action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown';
    }
  };

  const getOperationColor = () => {
    const action = log.operation || log.action;
    switch (action) {
      case 'stock_transfer':
        return 'text-blue-400';
      case 'stock_conversion':
        return 'text-purple-400';
      case 'inventory_update':
        return (log.change_amount || 0) > 0 ? 'text-green-400' : 'text-red-400';
      case 'sale':
        return 'text-green-400';
      case 'purchase':
      case 'restock':
        return 'text-blue-400';
      case 'audit':
      case 'adjustment':
        return 'text-yellow-400';
      case 'cost_updated':
        return 'text-cyan-400';
      case 'remove_tax':
      case 'add_tax':
      case 'assign_tax':
        return 'text-orange-400';
      default:
        return 'text-neutral-400';
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
          <div className="flex items-center gap-2 mb-1">
            <div className="text-neutral-400 text-xs truncate product-name">
              {getDisplayProductName(log.product_name)}
            </div>
            <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${getOperationColor()} bg-current bg-opacity-10`}>
              {getMovementType()}
            </div>
            {log.recipe_name && (
              <span className="text-xs text-neutral-500 bg-neutral-800/30 px-1.5 py-0.5 rounded">
                {log.recipe_name}
              </span>
            )}
          </div>
          
          {/* Staff Member & Details */}
          <div className="text-xs text-neutral-500 mt-0.5" title={timestampInfo.isValid ? timestampInfo.absolute : 'Invalid timestamp'}>
            <span className={timestampInfo.isValid ? 'text-neutral-500' : 'text-red-400'}>
              {timestampInfo.relative}
            </span>
            
            {/* Staff Member - Always show user name prominently */}
            <span className="ml-2 font-medium inline-flex items-center gap-1">
              {log.user_name && log.user_name !== 'System' && log.user_name !== false && log.user_name !== null ? (
                <>
                  <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-neutral-200">{log.user_name}</span>
                </>
              ) : (
                <>
                  <svg className="w-3 h-3 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                  <span className="text-neutral-500">System</span>
                </>
              )}
            </span>
            
            {log.location_name && ` • ${log.location_name}`}
            {log.batch_id && (
              <span className="ml-2 px-1.5 py-0.5 bg-blue-900/30 text-blue-300 rounded text-xs font-medium">
                Batch #{log.batch_id}
              </span>
            )}
            {log.reference_type && log.reference_id && ` • ${log.reference_type} #${log.reference_id}`}
          </div>
          
          {/* Operation-specific summary */}
          <div className="text-xs text-neutral-600 mt-1">
            {/* Show the reason if available, otherwise show generic description */}
            {log.notes ? (
              <span className="text-neutral-400 font-medium">{log.notes}</span>
            ) : (
              getMainDescription()
            )}
            
            {log.change_amount !== undefined && log.change_amount !== 0 && (
              <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-medium ${
                log.change_amount > 0 
                  ? 'bg-green-900/30 text-green-400' 
                  : 'bg-red-900/30 text-red-400'
              }`}>
                {log.change_amount > 0 ? '+' : ''}{log.change_amount}
              </span>
            )}
          </div>
        </div>

        {/* Status & Alerts */}
        <div className="flex items-center gap-2">
          {/* Operation Icon with color coding */}
          <div className={`flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-800/30 ${getOperationColor()}`} title={`${log.operation || log.action} operation`}>
            {getOperationIcon()}
          </div>
          
          {/* Status Indicators */}
          {log.conversion_status && (
            <div className={`flex items-center justify-center w-5 h-5 rounded ${
              log.conversion_status === 'completed'
                ? 'text-green-400'
                : log.conversion_status === 'cancelled' || log.conversion_status === 'failed'
                ? 'text-red-400'
                : 'text-yellow-400'
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
          
          {/* Additional Indicators */}
          {log.batch_id && (
            <div className="flex items-center justify-center w-5 h-5 rounded bg-blue-900/30 text-blue-400 text-xs font-bold" title={`Batch operation #${log.batch_id}`}>
              B
            </div>
          )}
          
          {log.user_agent && log.user_agent !== 'node' && (
            <div className="flex items-center justify-center w-5 h-5 rounded bg-purple-900/30 text-purple-400 text-xs" title="Manual operation (user interface)">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
          
          {/* Expand indicator for entries with detailed information */}
          {(log.notes || log.batch_id || log.ip_address || log.user_agent || log.metadata) && (
            <div className="flex items-center justify-center w-5 h-5 rounded bg-neutral-700/50 text-neutral-400 text-xs" title="Click to expand for more details">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
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

            {(log.operation === 'inventory_update' || log.action === 'inventory_update') && (
              <div className="bg-neutral-900/40 rounded-lg p-4">
                <h5 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3">
                  {log.notes && log.notes.includes('Restock via PO') ? 'Purchase Order Restock' : 'Inventory Change'}
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-xs text-neutral-400">
                      <span className="text-neutral-600">Previous:</span> {log.old_quantity || 0} units
                    </div>
                    <div className="text-xs text-neutral-400">
                      <span className="text-neutral-600">New:</span> {log.new_quantity || 0} units
                    </div>
                    <div className="text-xs text-neutral-400">
                      <span className="text-neutral-600">Change:</span> 
                      <span className={`ml-1 font-medium ${
                        (log.change_amount || 0) > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {(log.change_amount || 0) > 0 ? '+' : ''}{log.change_amount || 0} units
                      </span>
                    </div>
                  </div>
                  
                  {/* Purchase Order Info */}
                  {log.notes && log.notes.includes('PO-') && (
                    <div className="space-y-2">
                      <h6 className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Purchase Order</h6>
                      {(() => {
                        const poMatch = log.notes.match(/PO-(\d+)/i);
                        return poMatch ? (
                          <div className="text-xs text-neutral-400">
                            <span className="text-neutral-600">PO Number:</span> 
                            <span className="ml-1 px-2 py-1 bg-blue-900/30 text-blue-300 rounded font-mono">
                              PO-{poMatch[1]}
                            </span>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cost Update Details */}
            {(log.operation === 'cost_updated' || log.action === 'cost_updated') && (
              <div className="bg-neutral-900/40 rounded-lg p-4">
                <h5 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3">Cost Update</h5>
                <div className="space-y-2">
                  <div className="text-xs text-neutral-400">
                    <span className="text-neutral-600">Product:</span> {getDisplayProductName(log.product_name)}
                  </div>
                  <div className="text-xs text-neutral-400">
                    <span className="text-neutral-600">Location:</span> {log.location_name || 'Unknown'}
                  </div>
                </div>
              </div>
            )}

            {/* Sales Details */}
            {(log.operation === 'sale' || log.action === 'sale') && (
              <div className="bg-neutral-900/40 rounded-lg p-4">
                <h5 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3">Point of Sale Transaction</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-xs text-neutral-400">
                      <span className="text-neutral-600">Order #:</span> {log.reference_id}
                    </div>
                    <div className="text-xs text-neutral-400">
                      <span className="text-neutral-600">Items:</span> {getDisplayProductName(log.product_name)}
                    </div>
                    <div className="text-xs text-neutral-400">
                      <span className="text-neutral-600">Quantity Sold:</span> 
                      <span className="ml-1 font-medium text-red-400">
                        {Math.abs(log.change_amount || 0)} units
                      </span>
                    </div>
                    <div className="text-xs text-neutral-400">
                      <span className="text-neutral-600">Customer:</span> {log.notes?.includes('to ') ? log.notes.split('to ')[1] : 'POS Customer'}
                    </div>
                  </div>
                  
                  {log.metadata && (
                    <div className="space-y-2">
                      {(() => {
                        try {
                          const meta = typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata;
                          return (
                            <>
                              <div className="text-xs text-neutral-400">
                                <span className="text-neutral-600">Total:</span> 
                                <span className="ml-1 font-medium text-green-400">${meta.total}</span>
                              </div>
                              <div className="text-xs text-neutral-400">
                                <span className="text-neutral-600">Payment:</span> {meta.payment_method}
                              </div>
                              {meta.items_count && (
                                <div className="text-xs text-neutral-400">
                                  <span className="text-neutral-600">Items:</span> {meta.items_count} products
                                </div>
                              )}
                            </>
                          );
                        } catch (e) {
                          return null;
                        }
                      })()}
                    </div>
                  )}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-neutral-400">
                    <span className="text-neutral-600">Type:</span> {getMainDescription(true) || (log.operation as string).replace('_', ' ')}
                  </div>
                  <div className="text-xs text-neutral-400">
                    <span className="text-neutral-600">Action:</span> {(log.action || log.operation).replace('_', ' ')}
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
                </div>
                
                <div className="space-y-1">
                  <div className="text-xs text-neutral-400">
                    <span className="text-neutral-600">User:</span> 
                    <span className={`ml-1 font-medium ${
                      log.user_name && log.user_name !== 'System' && log.user_name !== false && log.user_name !== null
                        ? 'text-neutral-200' 
                        : 'text-neutral-500'
                    }`}>
                      {log.user_name && log.user_name !== false && log.user_name !== null ? log.user_name : 'System'}
                    </span>
                    {log.user_id && log.user_id > 0 && <span className="text-neutral-600 ml-1">(#{log.user_id})</span>}
                  </div>
                  {log.batch_id && (
                    <div className="text-xs text-neutral-400">
                      <span className="text-neutral-600">Batch Operation:</span> 
                      <span className="ml-1 px-2 py-1 bg-blue-900/30 text-blue-300 rounded font-mono">
                        #{log.batch_id}
                      </span>
                    </div>
                  )}
                  {log.reference_type && log.reference_id && (
                    <div className="text-xs text-neutral-400">
                      <span className="text-neutral-600">Reference:</span> {log.reference_type} #{log.reference_id}
                    </div>
                  )}
                  {log.ip_address && (
                    <div className="text-xs text-neutral-400">
                      <span className="text-neutral-600">IP:</span> {log.ip_address}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Technical Details */}
            {(log.user_agent || log.metadata) && (
              <div className="bg-neutral-900/40 rounded-lg p-4">
                <h5 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3">Technical Details</h5>
                <div className="space-y-2">
                  {log.user_agent && (
                    <div className="text-xs text-neutral-400">
                      <span className="text-neutral-600">User Agent:</span>
                      <div className="mt-1 p-2 bg-neutral-800/30 rounded text-neutral-500 font-mono break-all">
                        {log.user_agent}
                      </div>
                    </div>
                  )}
                  {log.metadata && (
                    <div className="text-xs text-neutral-400">
                      <span className="text-neutral-600">Metadata:</span>
                      <div className="mt-1 p-2 bg-neutral-800/30 rounded text-neutral-500 font-mono break-all">
                        {typeof log.metadata === 'string' ? log.metadata : JSON.stringify(log.metadata, null, 2)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Raw Details (for debugging) */}
            {log.details && Object.keys(log.details).length > 0 && (
              <details className="bg-neutral-900/40 rounded-lg">
                <summary className="p-4 cursor-pointer text-xs font-medium text-neutral-500 uppercase tracking-wide hover:text-neutral-400">
                  Raw Details (Debug)
                </summary>
                <div className="px-4 pb-4">
                  <pre className="text-xs text-neutral-500 bg-neutral-800/30 rounded p-3 overflow-auto max-h-40">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </div>
              </details>
            )}

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