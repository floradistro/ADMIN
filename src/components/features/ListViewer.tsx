'use client';

import React, { useState, useMemo } from 'react';
import { X, Download, Mail, Eye, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { ProductList } from '../../types/lists';
import { Button } from '../ui/Button';
import { PDFPreview } from './PDFPreview';

interface ListViewerProps {
  isOpen: boolean;
  onClose: () => void;
  list: ProductList | null;
  onExport: (format: 'pdf' | 'csv') => void;
  onEmail: () => void;
}

export function ListViewer({
  isOpen,
  onClose,
  list,
  onExport,
  onEmail
}: ListViewerProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Filter and paginate products
  const filteredProducts = useMemo(() => {
    if (!list) return [];
    if (!searchQuery.trim()) return list.products;
    
    return list.products.filter((product) => {
      const searchLower = searchQuery.toLowerCase();
      const nameMatch = product.productData.name?.toLowerCase().includes(searchLower);
      const skuMatch = product.productData.sku?.toLowerCase().includes(searchLower);
      const categoryMatch = product.productData.categories?.some(
        (cat: any) => cat.name.toLowerCase().includes(searchLower)
      );
      
      return nameMatch || skuMatch || categoryMatch;
    });
  }, [list, searchQuery]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Calculate total value if price column exists
  const totalValue = useMemo(() => {
    if (!list) return null;
    const priceColumn = list.columns.find(col => col.field === 'price' || col.field === 'regular_price');
    if (!priceColumn) return null;
    
    return filteredProducts.reduce((sum, product) => {
      const price = parseFloat(product.snapshot['price'] || product.snapshot['regular_price'] || '0');
      return sum + price;
    }, 0);
  }, [filteredProducts, list]);

  const getValue = (product: any, field: string, column: any) => {
    // First try snapshot (pre-extracted value)
    let value = product.snapshot[field];
    
    // If not in snapshot and it's a blueprint field, try to get from blueprint_fields
    if (value === undefined && column.type === 'blueprint') {
      const blueprintField = product.productData?.blueprint_fields?.find(
        (bf: any) => bf.field_name === field
      );
      value = blueprintField?.field_value;
    }
    
    // Fallback to direct property access
    if (value === undefined) {
      value = product.productData[field];
    }
    
    if (Array.isArray(value)) {
      if (field === 'categories') {
        return value.map((cat: any) => cat.name).join(', ');
      }
      if (field === 'inventory') {
        return value.reduce((sum: number, inv: any) => sum + (inv.stock || 0), 0);
      }
      return value.join(', ');
    }
    
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    
    return value ?? '-';
  };

  if (!isOpen || !list) return null;

  return (
    <>
      <PDFPreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        list={list}
        onPrint={() => {
          setShowPreview(false);
          onExport('pdf');
        }}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-[95vw] max-h-[92vh] bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden">
          
          {/* Gradient Accent */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-purple-600/5 pointer-events-none" />
          
          {/* Header Section */}
          <div className="relative border-b border-white/10 bg-neutral-900/50 backdrop-blur-xl">
            <div className="p-6 pb-4">
              {/* Title Row */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold text-white mb-1.5">{list.name}</h2>
                  {list.description && (
                    <p className="text-sm text-neutral-400">{list.description}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-lg transition-all hover:scale-105 active:scale-95"
                >
                  <X className="w-5 h-5 text-neutral-400 hover:text-neutral-200" />
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-gradient-to-br from-blue-600/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-3">
                  <div className="text-blue-400 text-xs font-medium mb-1">Total Products</div>
                  <div className="text-2xl font-bold text-white">{filteredProducts.length}</div>
                  {filteredProducts.length !== list.products.length && (
                    <div className="text-xs text-blue-400/60 mt-1">of {list.products.length}</div>
                  )}
                </div>
                <div className="bg-gradient-to-br from-purple-600/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-3">
                  <div className="text-purple-400 text-xs font-medium mb-1">Columns</div>
                  <div className="text-2xl font-bold text-white">{list.columns.length}</div>
                </div>
                {totalValue !== null && (
                  <div className="bg-gradient-to-br from-green-600/10 to-green-600/5 border border-green-500/20 rounded-xl p-3">
                    <div className="text-green-400 text-xs font-medium mb-1">Total Value</div>
                    <div className="text-2xl font-bold text-white">${totalValue.toFixed(2)}</div>
                  </div>
                )}
                <div className="bg-gradient-to-br from-orange-600/10 to-orange-600/5 border border-orange-500/20 rounded-xl p-3">
                  <div className="text-orange-400 text-xs font-medium mb-1">Page</div>
                  <div className="text-2xl font-bold text-white">{currentPage}/{totalPages}</div>
                </div>
              </div>

              {/* Search and Actions Bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Search products, SKU, categories..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-800/50 border border-white/10 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setShowPreview(true)}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all flex items-center gap-2 text-sm font-medium shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 hover:scale-105 active:scale-95"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">Preview</span>
                  </button>
                  <button
                    onClick={() => onExport('csv')}
                    className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-white/10 text-neutral-300 rounded-xl transition-all flex items-center gap-2 text-sm font-medium hover:scale-105 active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    CSV
                  </button>
                  <button
                    onClick={() => onExport('pdf')}
                    className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-white/10 text-neutral-300 rounded-xl transition-all flex items-center gap-2 text-sm font-medium hover:scale-105 active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    PDF
                  </button>
                  <button
                    onClick={onEmail}
                    className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-white/10 text-neutral-300 rounded-xl transition-all flex items-center gap-2 text-sm font-medium hover:scale-105 active:scale-95"
                  >
                    <Mail className="w-4 h-4" />
                    <span className="hidden sm:inline">Email</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-auto relative">
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className="bg-neutral-900/95 backdrop-blur-xl border-b border-white/10">
                  {list.columns.map((column) => (
                    <th
                      key={column.id}
                      className="px-4 py-3.5 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider whitespace-nowrap"
                      style={{ width: column.width }}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={list.columns.length} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center">
                          <Search className="w-8 h-8 text-neutral-600" />
                        </div>
                        <div>
                          <div className="text-neutral-400 font-medium mb-1">No products found</div>
                          <div className="text-sm text-neutral-600">Try adjusting your search query</div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((product, idx) => (
                    <tr
                      key={product.productId}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                    >
                      {list.columns.map((column) => (
                        <td
                          key={column.id}
                          className="px-4 py-3.5 text-sm text-neutral-300 whitespace-nowrap"
                        >
                          {column.field === 'image' && product.productData.image ? (
                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 shadow-lg group-hover:scale-105 transition-transform">
                              <Image
                                src={product.productData.image}
                                alt={product.productData.name || 'Product'}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : column.field === 'name' ? (
                            <div className="font-medium text-white max-w-xs truncate">
                              {getValue(product, column.field, column)}
                            </div>
                          ) : column.field === 'price' || column.field === 'regular_price' ? (
                            <div className="font-semibold text-green-400">
                              ${parseFloat(getValue(product, column.field, column) || '0').toFixed(2)}
                            </div>
                          ) : column.field === 'categories' ? (
                            <div className="flex gap-1 flex-wrap max-w-xs">
                              {product.productData.categories?.map((cat: any, i: number) => (
                                <span key={i} className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs border border-blue-500/30">
                                  {cat.name}
                                </span>
                              ))}
                            </div>
                          ) : column.field === 'stock' || column.field === 'stock_quantity' ? (
                            <div className={`font-medium ${
                              parseInt(getValue(product, column.field, column) || '0') === 0 
                                ? 'text-red-400' 
                                : parseInt(getValue(product, column.field, column) || '0') < 10 
                                  ? 'text-yellow-400' 
                                  : 'text-green-400'
                            }`}>
                              {getValue(product, column.field, column)}
                            </div>
                          ) : (
                            <div className="text-neutral-400 max-w-xs truncate">
                              {getValue(product, column.field, column)}
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="border-t border-white/10 bg-neutral-900/50 backdrop-blur-xl p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-neutral-400">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4 text-neutral-300" />
                  </button>
                  <div className="px-4 py-2 bg-neutral-800 rounded-lg text-sm text-neutral-300 font-medium">
                    {currentPage} / {totalPages}
                  </div>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                  >
                    <ChevronRight className="w-4 h-4 text-neutral-300" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

