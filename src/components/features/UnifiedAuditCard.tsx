import React, { useState, useCallback } from 'react';
import { getTimestampInfo } from '@/lib/timestamp-utils';

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

  // Get movement type and color
  const getMovementInfo = () => {
    // Check reason first for specific operation types
    if (log.notes) {
      const reason = log.notes.toLowerCase();
      if (reason.includes('restock via po')) {
        const poMatch = log.notes.match(/PO-(\d+)/i);
        return {
          type: poMatch ? `Restock (PO-${poMatch[1]})` : 'Restock',
          color: 'text-neutral-400 border-neutral-700/50',
          icon: '📦'
        };
      }
      if (reason.includes('audit')) {
        return {
          type: 'Audit',
          color: 'text-neutral-400 border-neutral-700/50',
          icon: '📋'
        };
      }
      if (reason.includes('sale')) {
        return {
          type: 'Sale',
          color: 'text-neutral-400 border-neutral-700/50',
          icon: '💰'
        };
      }
    }

    // Fallback to action-based determination
    const action = log.operation || log.action;
    switch (action) {
      case 'sale':
        return {
          type: 'Sale',
          color: 'text-neutral-400 border-neutral-700/50',
          icon: '💰'
        };
      case 'stock_transfer':
        return {
          type: 'Transfer',
          color: 'text-neutral-400 border-neutral-700/50',
          icon: '🔄'
        };
      case 'stock_conversion':
        return {
          type: 'Conversion',
          color: 'text-neutral-400 border-neutral-700/50',
          icon: '⚡'
        };
      case 'inventory_update':
        return {
          type: 'Adjustment',
          color: 'text-neutral-400 border-neutral-700/50',
          icon: '⚖️'
        };
      case 'assign_tax':
      case 'remove_tax':
        return {
          type: 'Tax Update',
          color: 'text-neutral-400 border-neutral-700/50',
          icon: '🏷️'
        };
      case 'cost_updated':
        return {
          type: 'Cost Update',
          color: 'text-neutral-400 border-neutral-700/50',
          icon: '💲'
        };
      default:
        return {
          type: 'System',
          color: 'text-neutral-400 border-neutral-700/50',
          icon: '⚙️'
        };
    }
  };

  const movementInfo = getMovementInfo();
  const timestampInfo = getTimestampInfo(log.created_at || log.timestamp);

  // Determine if this is a user operation vs system operation
  const isUserOperation = log.user_name && log.user_name !== 'System';

  return (
    <div className={`mb-2 rounded-lg transition-all border-b border-b-white/[0.02] ${
      isExpanded 
        ? 'bg-black/40 border border-white/[0.08]' 
        : 'border border-white/[0.02] bg-black/20 hover:bg-black/30'
    }`}>
      {/* Main Row */}
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

        {/* Product Name */}
        <div className="flex-1 min-w-0">
          <div className="text-neutral-300 text-sm font-medium truncate">
            {log.product_name}
          </div>
          <div className="text-xs text-neutral-500 mt-0.5">
            <span className={timestampInfo.isValid ? '' : 'text-red-400'}>
              {timestampInfo.relative}
            </span>
            {log.location_name && ` • ${log.location_name}`}
            {log.user_name && log.user_name !== 'System' && (
              <span className="font-medium"> • {log.user_name}</span>
            )}
          </div>
        </div>

        {/* Movement Type Badge */}
        <div className="px-2 py-1 rounded border text-xs font-medium text-white/40 border-white/[0.08]">
          {movementInfo.type}
        </div>

        {/* Change Amount */}
        {log.change_amount !== undefined && log.change_amount !== 0 && (
          <div className={`px-2 py-1 rounded text-xs font-bold bg-white/[0.03] ${
            log.change_amount > 0 
              ? 'text-green-400' 
              : 'text-red-400'
          }`}>
            {log.change_amount > 0 ? '+' : ''}{log.change_amount}
          </div>
        )}

        {/* Batch Indicator */}
        {log.batch_id && (
          <div className="px-2 py-1 bg-white/[0.03] text-white/30 rounded text-xs font-medium">
            Batch #{log.batch_id}
          </div>
        )}
      </div>

      {/* Notes Row */}
      {log.notes && (
        <div className="px-3 pb-2">
          <div className="text-xs text-neutral-400 italic">
            {log.notes}
          </div>
        </div>
      )}

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-white/[0.02] bg-black/30 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 divide-x divide-white/[0.02]">
            
            {/* Basic Information */}
            <div className="space-y-3">
              <h6 className="text-xs font-medium text-white/40 uppercase tracking-wider">Details</h6>
              
              <div className="space-y-2">
                <div className="text-xs">
                  <span className="text-neutral-500">Product:</span>
                  <span className="text-neutral-300 ml-2">{log.product_name}</span>
                </div>
                
                <div className="text-xs">
                  <span className="text-neutral-500">Location:</span>
                  <span className="text-neutral-300 ml-2">{log.location_name || 'Unknown'}</span>
                </div>
                
                <div className="text-xs">
                  <span className="text-neutral-500">Operation:</span>
                  <span className="text-neutral-300 ml-2">{movementInfo.type}</span>
                </div>
                
                <div className="text-xs">
                  <span className="text-neutral-500">Time:</span>
                  <span className="text-neutral-300 ml-2" title={timestampInfo.absolute}>
                    {timestampInfo.relative}
                  </span>
                </div>
              </div>
            </div>

            {/* User & System Information */}
            <div className="space-y-3 pl-4">
              <h6 className="text-xs font-medium text-white/40 uppercase tracking-wider">User Info</h6>
              
              <div className="space-y-2">
                <div className="text-xs">
                  <span className="text-neutral-500">Staff:</span>
                  <span className="ml-2 font-medium text-neutral-300">
                    {log.user_name || 'System'}
                  </span>
                </div>
                
                {log.batch_id && (
                  <div className="text-xs">
                    <span className="text-neutral-500">Batch ID:</span>
                    <span className="text-neutral-300 ml-2">#{log.batch_id}</span>
                  </div>
                )}
                
                {log.reference_type && log.reference_id && (
                  <div className="text-xs">
                    <span className="text-neutral-500">Reference:</span>
                    <span className="text-neutral-300 ml-2">{log.reference_type} #{log.reference_id}</span>
                  </div>
                )}
                
                {log.ip_address && (
                  <div className="text-xs">
                    <span className="text-neutral-500">IP Address:</span>
                    <span className="text-neutral-300 ml-2">{log.ip_address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Inventory Changes */}
          {(log.old_quantity !== undefined || log.new_quantity !== undefined) && (
            <div className="mt-4 p-3 bg-neutral-800/30 rounded border border-white/[0.04]">
              <h6 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">Inventory Changes</h6>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-neutral-500">Previous:</span>
                  <div className="text-neutral-300 font-medium">{log.old_quantity || 0}</div>
                </div>
                <div>
                  <span className="text-neutral-500">New:</span>
                  <div className="text-neutral-300 font-medium">{log.new_quantity || 0}</div>
                </div>
                <div>
                  <span className="text-neutral-500">Change:</span>
                  <div className={`font-bold ${
                    (log.change_amount || 0) > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {(log.change_amount || 0) > 0 ? '+' : ''}{log.change_amount || 0}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sales Information */}
          {log.operation === 'sale' && log.metadata && (
            <div className="mt-4 p-3 bg-green-900/10 rounded border border-green-500/20">
              <h6 className="text-xs font-medium text-green-400 uppercase tracking-wide mb-2">Sale Details</h6>
              {(() => {
                try {
                  const meta = typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata;
                  return (
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-neutral-500">Order #:</span>
                        <div className="text-neutral-300 font-medium">{meta.order_number || log.reference_id}</div>
                      </div>
                      <div>
                        <span className="text-neutral-500">Total:</span>
                        <div className="text-green-400 font-bold">${meta.total}</div>
                      </div>
                      <div>
                        <span className="text-neutral-500">Payment:</span>
                        <div className="text-neutral-300">{meta.payment_method}</div>
                      </div>
                      <div>
                        <span className="text-neutral-500">Customer:</span>
                        <div className="text-neutral-300">{meta.customer_name || 'POS Customer'}</div>
                      </div>
                    </div>
                  );
                } catch (e) {
                  return <div className="text-xs text-neutral-500">Sale transaction</div>;
                }
              })()}
            </div>
          )}

          {/* Purchase Order Information */}
          {log.notes && log.notes.includes('PO-') && (
            <div className="mt-4 p-3 bg-blue-900/10 rounded border border-blue-500/20">
              <h6 className="text-xs font-medium text-blue-400 uppercase tracking-wide mb-2">Purchase Order</h6>
              {(() => {
                const poMatch = log.notes.match(/PO-(\d+)/i);
                return poMatch ? (
                  <div className="text-xs">
                    <span className="text-neutral-500">PO Number:</span>
                    <span className="text-blue-400 font-mono ml-2">PO-{poMatch[1]}</span>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          {/* Transfer Information */}
          {log.operation === 'stock_transfer' && (
            <div className="mt-4 p-3 bg-blue-900/10 rounded border border-blue-500/20">
              <h6 className="text-xs font-medium text-blue-400 uppercase tracking-wide mb-2">Transfer Details</h6>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-neutral-500">From:</span>
                  <div className="text-neutral-300">{log.from_location_name || 'Unknown'}</div>
                </div>
                <div>
                  <span className="text-neutral-500">To:</span>
                  <div className="text-neutral-300">{log.to_location_name || 'Unknown'}</div>
                </div>
                <div className="col-span-2">
                  <span className="text-neutral-500">Quantity:</span>
                  <div className="text-neutral-300">{log.transfer_quantity || 0} units</div>
                </div>
              </div>
            </div>
          )}

          {/* Conversion Information */}
          {log.operation === 'stock_conversion' && (
            <div className="mt-4 p-3 bg-purple-900/10 rounded border border-purple-500/20">
              <h6 className="text-xs font-medium text-purple-400 uppercase tracking-wide mb-2">Conversion Details</h6>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-neutral-500">From Product:</span>
                  <div className="text-neutral-300">{log.from_product_name || 'Unknown'}</div>
                </div>
                <div>
                  <span className="text-neutral-500">To Product:</span>
                  <div className="text-neutral-300">{log.to_product_name || 'Unknown'}</div>
                </div>
                <div>
                  <span className="text-neutral-500">From Qty:</span>
                  <div className="text-neutral-300">{log.from_quantity || 0}</div>
                </div>
                <div>
                  <span className="text-neutral-500">To Qty:</span>
                  <div className="text-neutral-300">{log.to_quantity || 0}</div>
                </div>
              </div>
            </div>
          )}

          {/* Technical Details */}
          {(log.user_agent || log.ip_address || log.metadata) && (
            <div className="mt-4 p-3 bg-neutral-800/30 rounded border border-white/[0.04]">
              <h6 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">Technical Info</h6>
              <div className="space-y-1 text-xs">
                {log.user_agent && (
                  <div>
                    <span className="text-neutral-500">User Agent:</span>
                    <div className="text-neutral-400 font-mono text-xs mt-1 break-all">
                      {log.user_agent}
                    </div>
                  </div>
                )}
                {log.ip_address && (
                  <div>
                    <span className="text-neutral-500">IP:</span>
                    <span className="text-neutral-400 ml-2">{log.ip_address}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});