'use client';

import React from 'react';

interface StreamingProgressProps {
  isStreaming: boolean;
  progress: {
    total: number;
    processed: number;
    current?: string;
    results: Map<number, { success: boolean; data?: any; error?: string; confidence?: number; }>;
  };
  onClose?: () => void;
}

export function StreamingProgress({ isStreaming, progress, onClose }: StreamingProgressProps) {
  if (!isStreaming && progress.processed === 0) return null;

  const percentage = progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0;
  const isComplete = progress.processed >= progress.total;
  const successCount = Array.from(progress.results.values()).filter(r => r.success).length;
  const errorCount = Array.from(progress.results.values()).filter(r => !r.success).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-blue-400 animate-pulse' : 'bg-green-400'}`} />
            <h3 className="text-neutral-200 font-medium">
              {isStreaming ? 'Processing Products with AI' : 'Processing Complete'}
            </h3>
          </div>
          {isComplete && onClose && (
            <button
              onClick={onClose}
              className="text-neutral-500 hover:text-neutral-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-neutral-400 mb-2">
            <span>{progress.processed} of {progress.total} products</span>
            <span>{percentage}%</span>
          </div>
          <div className="w-full bg-neutral-800 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                isComplete 
                  ? (errorCount > 0 ? 'bg-yellow-500' : 'bg-green-500')
                  : 'bg-blue-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Current Status */}
        {isStreaming && progress.current && (
          <div className="mb-4 p-3 bg-neutral-800/50 rounded-lg">
            <div className="text-xs text-neutral-400 mb-1">Currently processing:</div>
            <div className="text-sm text-neutral-200 truncate">{progress.current}</div>
          </div>
        )}

        {/* Results Summary */}
        {progress.processed > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-neutral-400">Results:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {successCount > 0 && (
                <div className="flex items-center gap-2 text-green-400">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {successCount} successful
                </div>
              )}
              {errorCount > 0 && (
                <div className="flex items-center gap-2 text-red-400">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {errorCount} errors
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading Animation */}
        {isStreaming && (
          <div className="flex items-center justify-center mt-4">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}

        {/* Complete Message */}
        {isComplete && (
          <div className="mt-4 text-center">
            <div className={`text-sm ${errorCount > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
              {errorCount > 0 
                ? `Processing completed with ${errorCount} error${errorCount !== 1 ? 's' : ''}`
                : 'All products processed successfully!'
              }
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              Page will refresh automatically to show updated data
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
