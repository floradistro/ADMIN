import React, { useRef, useEffect } from 'react';

interface ViewsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onProductsToggle?: () => void;
  onCustomersToggle?: () => void;
  onOrdersToggle?: () => void;
  onReportsToggle?: () => void;
  isOrdersViewOpen?: boolean;
  isReportsViewOpen?: boolean;
}

export function ViewsDropdown({ 
  isOpen, 
  onClose, 
  onProductsToggle, 
  onCustomersToggle, 
  onOrdersToggle,
  onReportsToggle,
  isOrdersViewOpen = false,
  isReportsViewOpen = false
}: ViewsDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const viewItems = [
    {
      id: 'products',
      label: 'Products & Inventory',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      onClick: onProductsToggle,
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      onClick: onCustomersToggle,
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      onClick: onOrdersToggle,
      isActive: isOrdersViewOpen
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      onClick: onReportsToggle,
      isActive: isReportsViewOpen
    }
  ];

  return (
    <>
      {/* Mobile: Bottom sheet style */}
      <div className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999] flex items-end" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="w-full bg-neutral-900/95 border-t border-white/[0.08] rounded-t-2xl shadow-2xl max-h-[70vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
          <div className="p-4">
            <div className="text-xs font-medium text-white/60 px-2 py-1 mb-1 font-tiempos">
              Views
            </div>
            
            {viewItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  item.onClick?.();
                  onClose();
                }}
                className={`
                  w-full flex items-center gap-3 px-2 py-2.5 rounded text-xs transition-all duration-150 font-tiempos touch-manipulation
                  ${item.isActive 
                    ? 'bg-white/[0.08] text-white border border-white/[0.12]' 
                    : 'text-neutral-400 hover:bg-white/[0.05] active:bg-white/[0.08] hover:text-neutral-300'
                  }
                `}
              >
                <div className={`
                  flex-shrink-0 transition-colors
                  ${item.isActive ? 'text-white' : 'text-neutral-400'}
                `}>
                  {item.icon}
                </div>
                
                <div className="flex-1 text-left">
                  <div className={`
                    font-medium
                    ${item.isActive ? 'text-white' : 'text-neutral-400'}
                  `}>
                    {item.label}
                  </div>
                </div>
                
                {item.isActive && (
                  <div className="flex-shrink-0 w-2 h-2 bg-white rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop: Normal dropdown */}
      <div className="hidden md:block absolute right-0 top-full mt-1 w-64 bg-neutral-900/95 border border-white/[0.08] rounded-lg shadow-2xl backdrop-blur-sm z-50 overflow-hidden">
        <div className="p-2">
          <div className="text-xs font-medium text-white/60 px-2 py-1 mb-1 font-tiempos">
            Views
          </div>
          
          {viewItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                item.onClick?.();
                onClose();
              }}
              className={`
                w-full flex items-center gap-3 px-2 py-2 rounded text-xs transition-all duration-150 font-tiempos
                ${item.isActive 
                  ? 'bg-white/[0.08] text-white border border-white/[0.12]' 
                  : 'text-neutral-400 hover:bg-white/[0.05] hover:text-neutral-300'
                }
              `}
            >
              <div className={`
                flex-shrink-0 transition-colors
                ${item.isActive ? 'text-white' : 'text-neutral-400'}
              `}>
                {item.icon}
              </div>
              
              <div className="flex-1 text-left">
                <div className={`
                  font-medium
                  ${item.isActive ? 'text-white' : 'text-neutral-400'}
                `}>
                  {item.label}
                </div>
              </div>
              
              {item.isActive && (
                <div className="flex-shrink-0 w-2 h-2 bg-white rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
