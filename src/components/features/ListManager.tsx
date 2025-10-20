'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Download,
  Mail,
  Trash2,
  Copy,
  FileText,
  Calendar,
  Package,
  Search,
  Eye,
  Columns,
  ChevronRight
} from 'lucide-react';
import { ProductList } from '../../types/lists';
import { formatDistanceToNow } from 'date-fns';

interface ListManagerProps {
  isOpen: boolean;
  onClose: () => void;
  lists: ProductList[];
  onExport: (listId: string, format: 'pdf' | 'csv') => void;
  onEmail: (listId: string) => void;
  onDelete: (listId: string) => void;
  onDuplicate: (listId: string) => void;
  onView: (listId: string) => void;
}

export function ListManager({
  isOpen,
  onClose,
  lists,
  onExport,
  onEmail,
  onDelete,
  onDuplicate,
  onView
}: ListManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'productCount'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const filteredAndSortedLists = useMemo(() => {
    let filtered = lists.filter(list =>
      list.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      list.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'productCount') {
        comparison = a.products.length - b.products.length;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [lists, searchQuery, sortBy, sortDirection]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal - Full screen on mobile, centered on desktop */}
      <div className="absolute inset-0 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-4xl md:max-h-[90vh] bg-neutral-900 md:rounded-xl shadow-2xl border-0 md:border md:border-white/10 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-white/5 bg-neutral-900/95 backdrop-blur-xl">
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-white">Product Lists</h2>
            <p className="text-xs text-white/50 mt-0.5">
              {lists.length} list{lists.length !== 1 ? 's' : ''} saved
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors active:scale-95"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 md:p-4 border-b border-white/5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lists..."
              className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/[0.08] rounded-lg text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
            />
          </div>

          {/* Sort - Desktop Only */}
          <div className="hidden md:flex items-center gap-3 text-xs mt-3">
            <span className="text-neutral-600">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 py-1 bg-white/5 border border-white/[0.08] rounded text-neutral-400 focus:outline-none focus:border-white/20"
            >
              <option value="createdAt">Created Date</option>
              <option value="name">Name</option>
              <option value="productCount">Product Count</option>
            </select>

            <button
              onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="px-2 py-1 border border-white/[0.08] rounded text-neutral-400 hover:border-white/[0.12] transition-colors"
            >
              {sortDirection === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto">
          {filteredAndSortedLists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <FileText className="w-12 h-12 md:w-16 md:h-16 text-white/20 mb-3" />
              <p className="text-white/60 text-base md:text-lg font-medium">
                {searchQuery ? 'No lists found' : 'No lists yet'}
              </p>
              <p className="text-white/40 text-sm mt-1 text-center">
                {searchQuery ? 'Try a different search' : 'Select products and create your first list'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredAndSortedLists.map((list) => (
                <div
                  key={list.id}
                  onClick={() => onView(list.id)}
                  className="p-4 md:p-5 hover:bg-white/[0.02] active:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  {/* Desktop Layout */}
                  <div className="hidden md:flex items-start justify-between">
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="text-base font-medium text-white mb-1">
                        {list.name}
                      </h3>
                      {list.description && (
                        <p className="text-xs text-white/50 mb-2 line-clamp-1">
                          {list.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-white/40">
                        <div className="flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5" />
                          <span>{list.products.length} items</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Columns className="w-3.5 h-3.5" />
                          <span>{list.columns.length} fields</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDistanceToNow(new Date(list.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onExport(list.id, 'pdf');
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Export PDF"
                      >
                        <Download className="w-4 h-4 text-white/60" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicate(list.id);
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4 text-white/60" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this list?')) {
                            onDelete(list.id);
                          }
                        }}
                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-400/60" />
                      </button>
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="md:hidden flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-white mb-1">
                        {list.name}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-white/50">
                        <span className="flex items-center gap-1">
                          <Package className="w-3.5 h-3.5" />
                          {list.products.length}
                        </span>
                        <span className="flex items-center gap-1">
                          <Columns className="w-3.5 h-3.5" />
                          {list.columns.length}
                        </span>
                        <span className="text-white/40">
                          {formatDistanceToNow(new Date(list.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/30 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
