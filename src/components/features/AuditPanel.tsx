'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { UnifiedAuditCard } from './UnifiedAuditCard';
import { BatchAuditCard } from './BatchAuditCard';
import { varianceHistoryService } from '../../services/variance-history-service';

interface AuditLogEntry {
  id: number;
  product_id: number;
  location_id: number;
  product_name: string;
  product_image?: string;
  location_name: string;
  old_quantity: number;
  new_quantity: number;
  change_amount: number;
  operation: string;
  action?: string;
  user_name: string;
  timestamp: string;
  created_at: string;
  notes?: string;
  batch_id?: string;
  
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
  
  // Recipe conversion fields
  recipe_name?: string;
  input_quantity?: number;
  actual_output?: number;
  expected_output?: number;
  variance_percentage?: number;
  variance_reasons?: string[];
  conversion_status?: string;
  conversion_notes?: string;
  completed_at?: string;
}

interface AuditPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isDropdown?: boolean;
}

export function AuditPanel({ isOpen, onClose, isDropdown = false }: AuditPanelProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  // Group logs by batch_id for display
  const groupLogsByBatch = (logs: AuditLogEntry[]) => {
    const grouped: { batched: Map<string, AuditLogEntry[]>, unbatched: AuditLogEntry[] } = {
      batched: new Map(),
      unbatched: []
    };
    
    logs.forEach(log => {
      // Type assertion to access batch_id
      const batchId = (log as any).batch_id;
      if (batchId) {
        if (!grouped.batched.has(batchId)) {
          grouped.batched.set(batchId, []);
        }
        grouped.batched.get(batchId)!.push(log);
      } else {
        grouped.unbatched.push(log);
      }
    });
    
    return grouped;
  };

  // Fetch unified audit logs (general audit + conversion history)
  const fetchAuditLogs = async () => {
    if (loading) return;
    
    setLoading(true);
    setError(null);

    try {
      // Fetch audit logs and conversion history in parallel
      const [auditResponse, conversionResponse] = await Promise.all([
        fetch(`/api/audit?limit=100&_t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        }),
        fetch(`/api/flora/conversions?limit=20&_t=${Date.now()}`)
      ]);
      
      if (!auditResponse.ok) {
        throw new Error(`Audit API error: ${auditResponse.status}`);
      }

      const auditData = await auditResponse.json();
      let allLogs: AuditLogEntry[] = [];

      // Add general audit logs
      if (auditData.success && auditData.data) {
        allLogs = [...auditData.data];
      }

      // Add conversion history if available
      if (conversionResponse.ok) {
        try {
          const conversionData = await conversionResponse.json();
          const conversions = Array.isArray(conversionData) ? conversionData : (conversionData.conversions || []);
          
          // Transform conversion records to audit log format
          const conversionLogs = conversions.map((conv: any) => ({
            id: `conv_${conv.id}`,
            product_id: conv.input_product_id,
            location_id: conv.location_id,
            product_name: conv.input_product_name || conv.product_name || `Product ID ${conv.input_product_id}`,
            location_name: conv.location_name || 'Unknown Location',
            old_quantity: conv.input_quantity,
            new_quantity: conv.actual_output || 0,
            change_amount: (conv.actual_output || 0) - conv.input_quantity,
            operation: 'recipe_conversion',
            action: 'recipe_conversion',
            user_name: 'System',
            timestamp: conv.created_at,
            created_at: conv.created_at,
            recipe_name: conv.recipe_name,
            input_quantity: conv.input_quantity,
            actual_output: conv.actual_output,
            expected_output: conv.expected_output,
            variance_percentage: conv.variance_percentage,
            variance_reasons: conv.variance_reasons ? JSON.parse(conv.variance_reasons) : [],
            conversion_status: conv.conversion_status,
            conversion_notes: conv.conversion_notes,
            completed_at: conv.completed_at
          }));

          // Add conversions at the end, not the beginning, to preserve API order
          allLogs = [...allLogs, ...conversionLogs];
        } catch (convError) {
        }
      }

      // The API already sorts and prioritizes user activities, so we don't need to re-sort
      // Just set the logs as they come from the API
      setAuditLogs(allLogs);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  // Fetch when panel opens
  useEffect(() => {
    if (isOpen) {
      fetchAuditLogs();
    }
  }, [isOpen]);

  // Auto-refresh every 10 seconds when panel is open
  useEffect(() => {
    if (!isOpen) return;

    const intervalId = setInterval(fetchAuditLogs, 10000);
    return () => clearInterval(intervalId);
  }, [isOpen]);

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get relative time
  const getRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Get change color
  const getChangeColor = (changeAmount: number) => {
    if (changeAmount > 0) return 'text-green-400';
    if (changeAmount < 0) return 'text-red-400';
    return 'text-yellow-400';
  };

  if (!isOpen) return null;

  return (
    <div className={isDropdown ? "flex flex-col h-full w-full" : "w-96 bg-black border-r border-white/[0.08] flex flex-col h-full"}>
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b border-white/[0.08] ${isDropdown ? 'bg-neutral-900/60' : 'bg-neutral-900/50'}`}>
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h2 className="text-sm font-normal text-neutral-400">
            Audit History
            {auditLogs.length > 0 && (
              <span className="ml-2 text-xs">({auditLogs.length} entries)</span>
            )}
          </h2>
          {lastRefresh && (
            <div className="ml-3 text-xs text-neutral-500">
              {lastRefresh.toLocaleTimeString()}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAuditLogs}
            disabled={loading}
            className="flex-shrink-0 p-1 text-neutral-400 hover:text-white hover:bg-white/10 rounded smooth-hover disabled:opacity-50"
            title="Refresh"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 text-neutral-400 hover:text-white hover:bg-white/10 rounded smooth-hover"
            title="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading && auditLogs.length === 0 ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-3"></div>
            <p className="text-sm text-neutral-400">Loading audit history...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-sm text-red-400 mb-2">Failed to load audit history</p>
            <p className="text-xs text-neutral-500 mb-3">{error}</p>
            <button
              onClick={fetchAuditLogs}
              className="text-xs text-blue-400 hover:text-blue-300 smooth-hover"
            >
              Try Again
            </button>
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="p-6 text-center">
            <svg className="w-12 h-12 text-neutral-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm text-neutral-400">No audit history found</p>
            <p className="text-xs text-neutral-500 mt-1">Activity will appear here as inventory changes are made</p>
          </div>
        ) : (
          <div className={`space-y-2 ${isDropdown ? 'p-4' : 'p-2'}`}>
            {(() => {
              // Track which entries have been processed as part of batches
              const processedIds = new Set<number | string>();
              const elements: React.ReactNode[] = [];
              
              // First pass: identify all batch entries
              const batchMap = new Map<string, AuditLogEntry[]>();
              auditLogs.forEach(log => {
                const batchId = (log as any).batch_id;
                if (batchId) {
                  if (!batchMap.has(batchId)) {
                    batchMap.set(batchId, []);
                  }
                  batchMap.get(batchId)!.push(log);
                }
              });
              
              // Second pass: render in original order, but group batches
              auditLogs.forEach(log => {
                // Skip if already processed as part of a batch
                if (processedIds.has(log.id)) {
                  return;
                }
                
                const batchId = (log as any).batch_id;
                if (batchId && batchMap.has(batchId)) {
                  const batchEntries = batchMap.get(batchId)!;
                  // Only create batch card if there are multiple entries
                  if (batchEntries.length > 1) {
                    // Mark all batch entries as processed
                    batchEntries.forEach(entry => processedIds.add(entry.id));
                    // Add the batch card
                    elements.push(
                      <BatchAuditCard key={`batch-${batchId}`} batchId={batchId} entries={batchEntries} />
                    );
                    // Remove from map so we don't process again
                    batchMap.delete(batchId);
                  } else {
                    // Single entry batch - show as regular card
                    elements.push(<UnifiedAuditCard key={log.id} log={log as any} />);
                    processedIds.add(log.id);
                  }
                } else {
                  // No batch - show as regular card
                  elements.push(<UnifiedAuditCard key={log.id} log={log as any} />);
                  processedIds.add(log.id);
                }
              });
              
              return elements;
            })()}
          </div>
        )}
      </div>

      {/* Footer */}
      {auditLogs.length > 0 && (
        <div className="p-4 border-t border-white/[0.08] bg-neutral-900/30">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>
              {(() => {
                // Count unique batches and unbatched entries
                const batchIds = new Set<string>();
                let unbatchedCount = 0;
                auditLogs.forEach(log => {
                  const batchId = (log as any).batch_id;
                  if (batchId) {
                    batchIds.add(batchId);
                  } else {
                    unbatchedCount++;
                  }
                });
                const totalItems = batchIds.size + unbatchedCount;
                return `${totalItems} items (${auditLogs.length} total entries)`;
              })()}
            </span>
            <span>Auto-refresh: 10s</span>
          </div>
        </div>
      )}
    </div>
  );
}