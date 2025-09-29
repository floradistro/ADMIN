import React, { useState, useRef, useEffect } from 'react';

interface BulkAction {
  id: 'update' | 'transfer' | 'convert' | 'delete' | 'edit';
  label: string;
  icon: React.ReactNode;
  description: string;
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
    description: 'Put all selected products in edit mode',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    )
  },
  {
    id: 'update',
    label: 'Update Stock',
    description: 'Bulk update inventory quantities',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    )
  },
  {
    id: 'transfer',
    label: 'Transfer Stock',
    description: 'Move inventory between locations',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    )
  },
  {
    id: 'convert',
    label: 'Convert Stock',
    description: 'Convert between product variants',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    )
  },
  {
    id: 'delete',
    label: 'Delete Products',
    description: 'Permanently remove selected products',
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

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
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bulk actions dropdown trigger */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.05] text-neutral-300 rounded-lg hover:bg-white/[0.08] transition text-xs border border-white/[0.08]"
          title="Bulk Tools"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Tools
          <svg 
            className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Clear selection button */}
        <button
          onClick={handleClearSelection}
          className="flex items-center justify-center w-8 h-8 text-neutral-400 hover:text-neutral-300 hover:bg-white/[0.05] rounded-lg transition"
          title="Clear Selection"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-neutral-900/95 border border-white/[0.08] rounded-lg shadow-2xl backdrop-blur-sm z-50 overflow-hidden">
          <div className="p-2">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h2 className="text-sm font-normal text-neutral-400">Bulk Tools</h2>
            </div>
            
            <div className="space-y-1">
              {BULK_ACTIONS.map((action) => (
                <div 
                  key={action.id}
                  className="group transition-all cursor-pointer border border-white/[0.04] rounded-lg bg-neutral-900/40 hover:bg-neutral-900/60"
                >
                  <button
                    onClick={() => handleActionClick(action.id)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-left"
                  >
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-neutral-600 hover:text-neutral-400">
                      {action.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-neutral-400 text-xs">{action.label}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">{action.description}</div>
                    </div>
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-white/[0.08] mt-2 pt-2">
              <div className="group transition-all cursor-pointer border border-white/[0.04] rounded-lg bg-neutral-900/40 hover:bg-neutral-900/60">
                <button
                  onClick={handleClearSelection}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left"
                >
                  <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-neutral-600 hover:text-neutral-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-neutral-400 text-xs">Clear Selection</div>
                    <div className="text-xs text-neutral-500 mt-0.5">Remove all selected products</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
