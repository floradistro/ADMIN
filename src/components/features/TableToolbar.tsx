'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Location {
  id: number | string;
  name: string;
}

interface ToolAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'danger' | 'active';
  badge?: number | string;
  hidden?: boolean;
  disabled?: boolean;
}

interface ToolFilter {
  id: string;
  type: 'select' | 'location' | 'date' | 'toggle' | 'search';
  label?: string;
  value: any;
  onChange: (value: any) => void;
  options?: Array<{ value: string; label: string }>;
  locations?: Location[];
  placeholder?: string;
  icon?: React.ReactNode;
  hidden?: boolean;
}

interface TableToolbarProps {
  stats?: Array<{ label: string; value: number | string; variant?: 'default' | 'primary' | 'accent' }>;
  filters?: ToolFilter[];
  actions?: ToolAction[];
  mobileCollapse?: boolean;
}

export function TableToolbar({
  stats = [],
  filters = [],
  actions = [],
  mobileCollapse = true
}: TableToolbarProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  useEffect(() => {
    if (isFiltersOpen || isActionsOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFiltersOpen, isActionsOpen]);

  const visibleFilters = filters.filter(f => !f.hidden);
  const visibleActions = actions.filter(a => !a.hidden);
  const hasActiveFilters = filters.some(f => {
    if (f.type === 'toggle') return f.value === true;
    if (f.type === 'search') return f.value !== '';
    return f.value !== '' && f.value !== 'all' && f.value !== 'any';
  });

  const renderFilterMobile = (filter: ToolFilter) => {
    switch (filter.type) {
      case 'search':
        return (
          <div className="relative">
            <input
              type="text"
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              placeholder={filter.placeholder || 'Search...'}
              className="w-full pl-11 pr-4 py-3.5 bg-white/[0.05] border border-white/[0.08] rounded-2xl text-[15px] text-white placeholder:text-neutral-500 focus:border-blue-500/50 focus:bg-white/[0.08] focus:outline-none transition-all"
            />
            <svg className="absolute left-4 top-4 w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        );

      case 'select':
      case 'location':
        const options = filter.type === 'location' 
          ? [{ value: '', label: 'All Locations' }, ...(filter.locations?.map(loc => ({ value: loc.id.toString(), label: loc.name })) || [])]
          : filter.options || [];
        
        return (
          <div className="space-y-2">
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => {
                  filter.onChange(opt.value);
                }}
                className={`w-full px-4 py-3.5 rounded-xl text-left text-[15px] font-medium transition-all ${
                  filter.value === opt.value
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-white/[0.05] text-neutral-300 hover:bg-white/[0.08] active:scale-[0.98]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            className="w-full px-4 py-3.5 bg-white/[0.05] border border-white/[0.08] rounded-2xl text-[15px] text-white focus:border-blue-500/50 focus:bg-white/[0.08] focus:outline-none transition-all"
          />
        );

      case 'toggle':
        return (
          <button
            onClick={() => filter.onChange(!filter.value)}
            className={`w-full px-4 py-4 rounded-2xl text-left text-[15px] font-medium transition-all flex items-center justify-between ${
              filter.value
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                : 'bg-white/[0.05] text-neutral-300 hover:bg-white/[0.08] active:scale-[0.98]'
            }`}
          >
            <span className="flex items-center gap-3">
              {filter.icon}
              <span>{filter.label}</span>
            </span>
            <div className={`w-12 h-7 rounded-full relative transition-all ${
              filter.value ? 'bg-white/20' : 'bg-white/[0.1]'
            }`}>
              <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all ${
                filter.value ? 'left-[22px]' : 'left-0.5'
              }`} />
            </div>
          </button>
        );

      default:
        return null;
    }
  };

  const renderFilterDesktop = (filter: ToolFilter) => {
    switch (filter.type) {
      case 'search':
        return (
          <div className="relative flex-1 min-w-[180px]">
            <input
              type="text"
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              placeholder={filter.placeholder || 'Search...'}
              className="w-full pl-9 pr-3 py-2 bg-neutral-800/50 border border-white/[0.06] rounded-xl text-sm text-neutral-300 placeholder:text-neutral-500 focus:border-blue-500/50 focus:bg-neutral-800 focus:outline-none transition-all"
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        );

      case 'select':
        return (
          <select
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            className="px-3 py-2 bg-neutral-800/50 border border-white/[0.06] rounded-xl text-sm text-neutral-300 focus:border-blue-500/50 focus:bg-neutral-800 focus:outline-none transition-all min-w-[120px] cursor-pointer"
          >
            {filter.options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );

      case 'location':
        return (
          <select
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            className="px-3 py-2 bg-neutral-800/50 border border-white/[0.06] rounded-xl text-sm text-neutral-300 focus:border-blue-500/50 focus:bg-neutral-800 focus:outline-none transition-all min-w-[120px] cursor-pointer"
          >
            <option value="">All Locations</option>
            {filter.locations?.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        );

      case 'date':
        return (
          <input
            type="date"
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            className="px-3 py-2 bg-neutral-800/50 border border-white/[0.06] rounded-xl text-sm text-neutral-300 focus:border-blue-500/50 focus:bg-neutral-800 focus:outline-none transition-all cursor-pointer"
          />
        );

      case 'toggle':
        return (
          <button
            onClick={() => filter.onChange(!filter.value)}
            className={`p-2 rounded-xl transition-all ${
              filter.value 
                ? 'bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/10' 
                : 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800'
            }`}
            title={filter.label}
          >
            {filter.icon}
          </button>
        );

      default:
        return null;
    }
  };

  const renderAction = (action: ToolAction) => {
    const variantStyles = {
      default: 'bg-neutral-800/50 text-neutral-300 hover:bg-neutral-800',
      primary: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 shadow-lg shadow-blue-500/10',
      danger: 'bg-red-500/20 text-red-400 hover:bg-red-500/30 shadow-lg shadow-red-500/10',
      active: 'bg-white/[0.08] text-white'
    };

    return (
      <button
        onClick={action.onClick}
        disabled={action.disabled}
        className={`relative p-2 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 ${variantStyles[action.variant || 'default']}`}
        title={action.label}
      >
        {action.icon}
        {action.badge !== undefined && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-blue-500 text-white text-[10px] font-semibold rounded-full min-w-[18px] text-center shadow-lg">
            {action.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="w-full">
      {/* Desktop View */}
      <div className="hidden md:flex items-center gap-2.5 px-4 py-3 border-b border-white/[0.04] bg-neutral-900/80 backdrop-blur-xl">
        {/* Stats */}
        {stats.length > 0 && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {stats.map((stat, idx) => {
              const variantStyles = {
                default: 'bg-white/[0.04] text-neutral-400 border border-white/[0.04]',
                primary: 'bg-white/[0.06] text-neutral-300 border border-white/[0.06]',
                accent: 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              };
              return (
                <span key={idx} className={`px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap ${variantStyles[stat.variant || 'default']}`}>
                  {stat.value} {stat.label}
                </span>
              );
            })}
          </div>
        )}

        {/* Filters */}
        {visibleFilters.length > 0 && (
          <div className="flex items-center gap-2 flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
            {visibleFilters.map(filter => (
              <div key={filter.id}>
                {renderFilterDesktop(filter)}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {visibleActions.length > 0 && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {visibleActions.map(action => (
              <div key={action.id}>
                {renderAction(action)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile View */}
      {mobileCollapse && (
        <>
          <div className="md:hidden border-b border-white/[0.06] bg-neutral-900/95 backdrop-blur-xl">
            <div className="flex items-center gap-3 px-4 py-3">
              {/* Stats */}
              {stats.length > 0 && (
                <div className="flex items-center gap-2 flex-1 overflow-x-auto scrollbar-none">
                  {stats.map((stat, idx) => {
                    const variantStyles = {
                      default: 'bg-white/[0.04] text-neutral-400',
                      primary: 'bg-white/[0.06] text-neutral-300',
                      accent: 'bg-blue-500/15 text-blue-400'
                    };
                    return (
                      <span key={idx} className={`px-3 py-1.5 rounded-xl text-sm font-semibold whitespace-nowrap ${variantStyles[stat.variant || 'default']}`}>
                        {stat.value} {stat.label}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Mobile Filter Button */}
              {visibleFilters.length > 0 && (
                <button
                  onClick={() => setIsFiltersOpen(true)}
                  className={`p-2.5 rounded-xl transition-all active:scale-95 ${
                    hasActiveFilters
                      ? 'bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/20'
                      : 'bg-white/[0.06] text-neutral-400'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </button>
              )}

              {/* Mobile Actions Button */}
              {visibleActions.length > 0 && (
                <button
                  onClick={() => setIsActionsOpen(true)}
                  className="p-2.5 rounded-xl bg-white/[0.06] text-neutral-400 transition-all active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Filters Bottom Sheet */}
          {isFiltersOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={() => setIsFiltersOpen(false)}
              />
              
              {/* Sheet */}
              <div className="absolute bottom-0 left-0 right-0 bg-neutral-900 rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-hidden flex flex-col">
                {/* Handle */}
                <div className="flex justify-center py-3">
                  <div className="w-10 h-1 bg-white/[0.2] rounded-full" />
                </div>

                {/* Header */}
                <div className="px-6 pb-4 border-b border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-white">Filters</h3>
                    {hasActiveFilters && (
                      <button
                        onClick={() => {
                          visibleFilters.forEach(f => {
                            if (f.type === 'toggle') f.onChange(false);
                            else if (f.type === 'search') f.onChange('');
                            else f.onChange('');
                          });
                        }}
                        className="text-sm font-medium text-blue-400"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                  {visibleFilters.map(filter => (
                    <div key={filter.id}>
                      {filter.label && filter.type !== 'search' && filter.type !== 'toggle' && (
                        <label className="block text-sm font-semibold text-neutral-400 mb-2.5 uppercase tracking-wider">
                          {filter.label}
                        </label>
                      )}
                      {renderFilterMobile(filter)}
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/[0.06] bg-neutral-900/95 backdrop-blur-xl">
                  <button
                    onClick={() => setIsFiltersOpen(false)}
                    className="w-full py-4 bg-blue-500 text-white text-[17px] font-semibold rounded-2xl shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-transform"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Actions Bottom Sheet */}
          {isActionsOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={() => setIsActionsOpen(false)}
              />
              
              {/* Sheet */}
              <div className="absolute bottom-0 left-0 right-0 bg-neutral-900 rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300">
                {/* Handle */}
                <div className="flex justify-center py-3">
                  <div className="w-10 h-1 bg-white/[0.2] rounded-full" />
                </div>

                {/* Header */}
                <div className="px-6 pb-4 border-b border-white/[0.06]">
                  <h3 className="text-xl font-semibold text-white">Actions</h3>
                </div>

                {/* Content */}
                <div className="px-6 py-4 space-y-2.5 pb-safe">
                  {visibleActions.map(action => {
                    const variantStyles = {
                      default: 'bg-white/[0.05] text-neutral-300',
                      primary: 'bg-blue-500 text-white shadow-lg shadow-blue-500/30',
                      danger: 'bg-red-500 text-white shadow-lg shadow-red-500/30',
                      active: 'bg-white/[0.08] text-white'
                    };
                    
                    return (
                      <button
                        key={action.id}
                        onClick={() => {
                          action.onClick();
                          setIsActionsOpen(false);
                        }}
                        disabled={action.disabled}
                        className={`w-full px-5 py-4 rounded-2xl text-left text-[17px] font-semibold transition-all flex items-center gap-4 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] ${variantStyles[action.variant || 'default']}`}
                      >
                        <span className="w-6 h-6 flex items-center justify-center">{action.icon}</span>
                        <span className="flex-1">{action.label}</span>
                        {action.badge !== undefined && (
                          <span className="px-2.5 py-1 bg-black/20 text-white text-sm font-bold rounded-full min-w-[28px] text-center">
                            {action.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
