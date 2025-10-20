import React, { useState, useEffect } from 'react';

interface BulkAction {
  id: 'update' | 'transfer' | 'convert' | 'delete' | 'edit';
  label: string;
  icon: React.ReactNode;
}

interface BulkActionsDropdownProps {
  selectedCount: number;
  onAction: (action: 'update' | 'transfer' | 'convert' | 'delete' | 'edit') => void;
  onClearSelection: () => void;
  className?: string;
}

const BULK_ACTIONS: BulkAction[] = [
  {
    id: 'edit',
    label: 'Edit All',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    )
  },
  {
    id: 'update',
    label: 'Update Stock',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    )
  },
  {
    id: 'transfer',
    label: 'Transfer',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    )
  },
  {
    id: 'convert',
    label: 'Convert',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    )
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    )
  }
];

export function BulkActionsDropdown({ 
  selectedCount, 
  onAction, 
  onClearSelection,
  className = '' 
}: BulkActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Close dropdown when selectedCount changes to 0
  useEffect(() => {
    if (selectedCount === 0) {
      setIsOpen(false);
    }
  }, [selectedCount]);

  const handleActionClick = (actionId: 'update' | 'transfer' | 'convert' | 'delete' | 'edit') => {
    onAction(actionId);
    setIsOpen(false);
  };

  const handleClearSelection = () => {
    onClearSelection();
    setIsOpen(false);
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Bulk actions dropdown trigger */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        className={`flex items-center justify-center w-7 h-7 rounded-md transition-all ${
          isOpen 
            ? 'bg-white/[0.08] text-neutral-300' 
            : 'bg-transparent text-neutral-600 hover:text-neutral-400 hover:bg-white/[0.03]'
        }`}
        title="Tools"
      >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
      </button>

      {/* Dropdown menu - Mobile Optimized */}
      {isOpen && (
        <>
          {/* Mobile: Bottom sheet style */}
          <div className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999] flex items-end" onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}>
            <div className="w-full bg-neutral-900/98 border-t border-white/[0.08] rounded-t-2xl shadow-2xl max-h-[70vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-4">
                {/* Actions */}
                <div className="space-y-0.5">
                  {BULK_ACTIONS.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleActionClick(action.id)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left rounded-md transition-all hover:bg-white/[0.08] active:bg-white/[0.12] group touch-manipulation"
                    >
                      <div className="flex-shrink-0 text-neutral-500 group-hover:text-neutral-400 transition-colors">
                        {action.icon}
                      </div>
                      <div className="text-neutral-400 text-xs product-text group-hover:text-neutral-300">
                        {action.label}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Clear */}
                <div className="border-t border-white/[0.04] mt-1.5 pt-1.5">
                  <button
                    onClick={handleClearSelection}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left rounded-md transition-all hover:bg-white/[0.08] active:bg-white/[0.12] group touch-manipulation"
                  >
                    <div className="flex-shrink-0 text-neutral-500 group-hover:text-neutral-400 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <div className="text-neutral-400 text-xs product-text group-hover:text-neutral-300">
                      Clear Selection
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop: Normal dropdown */}
          <div className="hidden md:block absolute right-2 top-full mt-1 w-44 bg-neutral-900/98 border border-white/[0.08] rounded-lg shadow-2xl backdrop-blur-sm z-[9999] overflow-hidden">
            <div className="p-2">
              {/* Actions */}
              <div className="space-y-0.5">
                {BULK_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleActionClick(action.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-md transition-all hover:bg-white/[0.08] active:bg-white/[0.12] group"
                  >
                    <div className="flex-shrink-0 text-neutral-500 group-hover:text-neutral-400 transition-colors">
                      {action.icon}
                    </div>
                    <div className="text-neutral-400 text-xs product-text group-hover:text-neutral-300">
                      {action.label}
                    </div>
                  </button>
                ))}
              </div>

              {/* Clear */}
              <div className="border-t border-white/[0.04] mt-1.5 pt-1.5">
                <button
                  onClick={handleClearSelection}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-md transition-all hover:bg-white/[0.08] active:bg-white/[0.12] group"
                >
                  <div className="flex-shrink-0 text-neutral-500 group-hover:text-neutral-400 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div className="text-neutral-400 text-xs product-text group-hover:text-neutral-300">
                    Clear Selection
                  </div>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
