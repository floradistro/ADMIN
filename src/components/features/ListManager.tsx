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
  MoreVertical,
  Eye,
  Edit,
  Columns
} from 'lucide-react';
import { ProductList } from '../../types/lists';
import { Button } from '../ui/Button';
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
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-6xl max-h-[90vh] bg-neutral-900 rounded-lg shadow-2xl border border-white/10 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
            <h2 className="text-xl font-medium text-white">Product Lists</h2>
            <p className="text-xs text-white/50 mt-1">
              {lists.length} list{lists.length !== 1 ? 's' : ''} saved
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/5 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-white/40 hover:text-white/60" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b border-white/5 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lists..."
              className="w-full pl-10 pr-3 py-2 bg-transparent border border-white/[0.08] rounded text-sm text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-neutral-600">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 py-1 bg-transparent border border-white/[0.08] rounded text-neutral-400 focus:outline-none focus:border-white/20"
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
        <div className="flex-1 overflow-y-auto p-4">
          {filteredAndSortedLists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="w-16 h-16 text-white/20 mb-4" />
              <p className="text-white/60 text-lg">
                {searchQuery ? 'No lists found' : 'No lists created yet'}
              </p>
              <p className="text-white/40 text-sm mt-2">
                {searchQuery ? 'Try a different search term' : 'Select products and create your first list'}
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredAndSortedLists.map((list) => (
                <div
                  key={list.id}
                  className="border border-white/[0.08] rounded p-4 hover:border-white/[0.12] transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-medium text-white truncate">
                        {list.name}
                      </h3>
                      {list.description && (
                        <p className="text-xs text-white/50 mt-1 line-clamp-1">
                          {list.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                        <div className="flex items-center gap-1.5">
                          <Package className="w-4 h-4" />
                          <span>{list.products.length} products</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Columns className="w-4 h-4" />
                          <span>{list.columns.length} columns</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          <span>Created {formatDistanceToNow(new Date(list.createdAt), { addSuffix: true })}</span>
                        </div>
                        {list.metadata?.lastExported && (
                          <div className="flex items-center gap-1.5">
                            <Download className="w-4 h-4" />
                            <span>Exported {list.metadata.exportCount} times</span>
                          </div>
                        )}
                      </div>

                      {/* Quick Stats */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {list.settings.includeImages && (
                          <span className="px-1.5 py-0.5 bg-white/5 text-neutral-500 text-[10px] rounded border border-white/[0.08]">
                            Images
                          </span>
                        )}
                        {list.settings.includeCOA && (
                          <span className="px-1.5 py-0.5 bg-white/5 text-neutral-500 text-[10px] rounded border border-white/[0.08]">
                            COA
                          </span>
                        )}
                        {list.settings.includePricing && (
                          <span className="px-1.5 py-0.5 bg-white/5 text-neutral-500 text-[10px] rounded border border-white/[0.08]">
                            Pricing
                          </span>
                        )}
                        {list.settings.includeInventory && (
                          <span className="px-1.5 py-0.5 bg-white/5 text-neutral-500 text-[10px] rounded border border-white/[0.08]">
                            Inventory
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 ml-3">
                      <button
                        onClick={() => onView(list.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded transition-all"
                        title="View"
                      >
                        <Eye className="w-4 h-4 text-white/60" />
                      </button>

                      <button
                        onClick={() => onExport(list.id, 'pdf')}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded transition-all"
                        title="Export"
                      >
                        <Download className="w-4 h-4 text-white/60" />
                      </button>

                      <button
                        onClick={() => onEmail(list.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded transition-all"
                        title="Email"
                      >
                        <Mail className="w-4 h-4 text-white/60" />
                      </button>

                      <div className="relative">
                        <button
                          onClick={() => setActiveMenu(activeMenu === list.id ? null : list.id)}
                          className="p-1.5 hover:bg-white/10 rounded transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-white/40" />
                        </button>

                        {activeMenu === list.id && (
                          <div className="absolute right-0 top-full mt-1 w-40 bg-neutral-800 border border-white/10 rounded-md shadow-xl z-10 py-1">
                            <button
                              onClick={() => {
                                onDuplicate(list.id);
                                setActiveMenu(null);
                              }}
                              className="w-full px-3 py-1.5 text-left text-xs text-white/70 hover:bg-white/10 transition-colors flex items-center gap-2"
                            >
                              <Copy className="w-3 h-3" />
                              Duplicate
                            </button>
                            <button
                              onClick={() => {
                                onDelete(list.id);
                                setActiveMenu(null);
                              }}
                              className="w-full px-3 py-1.5 text-left text-xs text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
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

