'use client';

import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { ErrorBoundary } from '../../../components/ui/ErrorBoundary';
import { SalesByDayReport } from '../../../components/features/SalesByDayReport';

export interface ReportsModuleRef {
  handleRefresh?: () => Promise<void>;
}

interface ReportsModuleProps {
  onClose: () => void;
}

export const ReportsModule = forwardRef<ReportsModuleRef, ReportsModuleProps>(
  ({ onClose }, ref) => {
    const [activeReport, setActiveReport] = useState<'sales-by-day' | 'sales-by-product' | 'inventory-report'>('sales-by-day');
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
      setRefreshing(true);
      try {
        // Refresh logic will be handled by individual report components
        await new Promise(resolve => setTimeout(resolve, 300));
      } finally {
        setRefreshing(false);
      }
    };

    useImperativeHandle(ref, () => ({
      handleRefresh
    }));

    const reportTabs = [
      { id: 'sales-by-day', label: 'Sales by Day' },
      { id: 'sales-by-product', label: 'Sales by Product' },
      { id: 'inventory-report', label: 'Inventory Report' }
    ];

    return (
      <div className="flex-1 flex flex-col bg-neutral-900 overflow-hidden">
        {/* Report Navigation */}
        <div className="flex border-b border-white/[0.04]">
          {reportTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium product-text transition-all duration-200 ${
                activeReport === tab.id
                  ? 'text-white border-b-2 border-neutral-300 bg-white/[0.02]'
                  : 'text-neutral-400 hover:text-neutral-300 hover:bg-white/[0.01]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Report Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ErrorBoundary 
            fallback={
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-md">
                  <p className="text-red-400 mb-2">Failed to load report</p>
                  <p className="text-neutral-500 text-sm mb-4">An error occurred while loading the reports module</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded transition-colors"
                  >
                    Reload Page
                  </button>
                </div>
              </div>
            }
          >
            {activeReport === 'sales-by-day' && <SalesByDayReport refreshing={refreshing} />}
            
            {activeReport === 'sales-by-product' && (
              <div className="flex-1 flex items-center justify-center fade-in">
                <div className="text-center text-neutral-400 glass-effect rounded-lg p-8 border border-white/[0.04]">
                  <h3 className="text-lg font-medium mb-2 product-text">Sales by Product Report</h3>
                  <p className="text-sm product-text">Coming soon...</p>
                </div>
              </div>
            )}
            
            {activeReport === 'inventory-report' && (
              <div className="flex-1 flex items-center justify-center fade-in">
                <div className="text-center text-neutral-400 glass-effect rounded-lg p-8 border border-white/[0.04]">
                  <h3 className="text-lg font-medium mb-2 product-text">Inventory Report</h3>
                  <p className="text-sm product-text">Coming soon...</p>
                </div>
              </div>
            )}
          </ErrorBoundary>
        </div>
      </div>
    );
  }
);

ReportsModule.displayName = 'ReportsModule';
