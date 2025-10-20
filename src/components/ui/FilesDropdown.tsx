import React from 'react';

interface FilesDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onMediaToggle?: () => void;
  onCoaToggle?: () => void;
}

export function FilesDropdown({ 
  isOpen, 
  onClose, 
  onMediaToggle, 
  onCoaToggle
}: FilesDropdownProps) {
  if (!isOpen) return null;

  const fileItems = [
    {
      id: 'media',
      label: 'Media Manager',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      onClick: onMediaToggle,
    },
    {
      id: 'coa',
      label: 'COA Manager',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
      onClick: onCoaToggle,
    }
  ];

  return (
    <>
      {/* Mobile: Bottom sheet style */}
      <div className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999] flex items-end" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="w-full bg-neutral-900/95 border-t border-white/[0.08] rounded-t-2xl shadow-2xl max-h-[70vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
          <div className="p-4">
            <div className="text-xs font-medium text-white/60 px-2 py-1 mb-1">
              Files
            </div>
            
            {fileItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  item.onClick?.();
                  onClose();
                }}
                className="
                  w-full flex items-center gap-3 px-2 py-2.5 rounded-md text-sm transition-all duration-150 touch-manipulation
                  text-white/80 hover:bg-white/[0.05] active:bg-white/[0.08] hover:text-white
                "
              >
                <div className="flex-shrink-0 text-white/60 transition-colors">
                  {item.icon}
                </div>
                
                <div className="flex-1 text-left">
                  <div className="font-medium text-white/90">
                    {item.label}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop: Normal dropdown */}
      <div className="hidden md:block absolute right-0 top-full mt-1 w-64 bg-neutral-900/95 border border-white/[0.08] rounded-lg shadow-2xl backdrop-blur-sm z-50 overflow-hidden">
        <div className="p-2">
          <div className="text-xs font-medium text-white/60 px-2 py-1 mb-1">
            Files
          </div>
          
          {fileItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                item.onClick?.();
                onClose();
              }}
              className="
                w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-all duration-150
                text-white/80 hover:bg-white/[0.05] hover:text-white
              "
            >
              <div className="flex-shrink-0 text-white/60 transition-colors">
                {item.icon}
              </div>
              
              <div className="flex-1 text-left">
                <div className="font-medium text-white/90">
                  {item.label}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
