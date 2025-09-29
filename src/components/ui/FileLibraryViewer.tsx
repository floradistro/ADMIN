'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, Loader2, Image as ImageIcon, FileText, ChevronLeft, ChevronRight, Eye, Check } from 'lucide-react';
import Image from 'next/image';
import { Button } from './Button';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://elhsobjvwmjfminxxcwy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsaHNvYmp2d21qZm1pbnh4Y3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDQzMzAsImV4cCI6MjA2NjI4MDMzMH0.sK5ggW0XxE_Y9x5dXQvq2IPbxo0WoQs3OcfXNhEbTyQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface MediaItem {
  id: number;
  title: string;
  alt_text: string;
  source_url: string;
  mime_type: string;
  date: string;
  media_details: {
    width: number;
    height: number;
    filesize: number;
    sizes: Record<string, any>;
  };
  thumbnail: string;
  medium: string;
  large: string;
}

interface CoaFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at?: string;
  metadata?: {
    size: number;
    mimetype: string;
  };
}

interface MediaLibraryResponse {
  success: boolean;
  media: MediaItem[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

interface FileLibraryViewerProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'media' | 'coa';
  onSelect?: (media: MediaItem) => void;
  selectedMediaId?: number;
  productId?: number;
  productName?: string;
}

export function FileLibraryViewer({ 
  isOpen, 
  onClose, 
  mode,
  onSelect,
  selectedMediaId,
  productId,
  productName
}: FileLibraryViewerProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [coaFiles, setCoaFiles] = useState<CoaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 32,
    total: 0,
    total_pages: 1
  });
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<CoaFile | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const fetchMediaLibrary = useCallback(async (page: number = 1, search: string = '') => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '32',
        media_type: 'image'
      });
      
      if (search.trim()) {
        params.append('search', search.trim());
      }

      const response = await fetch(`/api/media/library?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch media library');
      }

      const data: MediaLibraryResponse = await response.json();
      
      if (data.success) {
        setMedia(data.media);
        setPagination(data.pagination);
        setCurrentPage(page);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching media:', error);
      setError(error instanceof Error ? error.message : 'Failed to load media');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCoaFiles = useCallback(async (search: string = '') => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.storage
        .from('coas')
        .list('pdfs', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        throw new Error(`Failed to fetch COA files: ${error.message}`);
      }

      let filteredFiles = data || [];
      
      // Filter by search term if provided
      if (search.trim()) {
        filteredFiles = filteredFiles.filter(file => 
          file.name.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Filter PDF files only and transform to CoaFile format
      const pdfFiles = filteredFiles
        .filter(file => file.name.toLowerCase().endsWith('.pdf'))
        .map(file => ({
          name: file.name,
          id: file.id,
          updated_at: file.updated_at,
          created_at: file.created_at,
          last_accessed_at: file.last_accessed_at,
          metadata: file.metadata ? {
            size: file.metadata.size || 0,
            mimetype: file.metadata.mimetype || 'application/pdf',
            eTag: file.metadata.eTag,
            cacheControl: file.metadata.cacheControl
          } : undefined
        } as CoaFile));

      setCoaFiles(pdfFiles);
    } catch (error) {
      console.error('Error fetching COA files:', error);
      setError(error instanceof Error ? error.message : 'Failed to load COA files');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
    if (mode === 'media') {
      fetchMediaLibrary(1, term);
    } else {
      fetchCoaFiles(term);
    }
  }, [mode, fetchMediaLibrary, fetchCoaFiles]);

  const handlePageChange = useCallback((page: number) => {
    if (mode === 'media') {
      fetchMediaLibrary(page, searchTerm);
    }
  }, [mode, fetchMediaLibrary, searchTerm]);

  const handleMediaSelect = useCallback((mediaItem: MediaItem) => {
    onSelect?.(mediaItem);
    onClose();
  }, [onSelect, onClose]);

  const handleFileSelect = useCallback(async (file: CoaFile) => {
    try {
      const { data } = await supabase.storage
        .from('coas')
        .createSignedUrl(`pdfs/${file.name}`, 3600); // 1 hour expiry

      if (data?.signedUrl) {
        setPdfUrl(data.signedUrl);
        setSelectedFile(file);
      }
    } catch (error) {
      console.error('Error creating signed URL:', error);
      setError('Failed to load PDF');
    }
  }, []);

  const closePdfViewer = useCallback(() => {
    setPdfUrl(null);
    setSelectedFile(null);
  }, []);

  // Load initial data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (mode === 'media' && media.length === 0) {
        fetchMediaLibrary(1);
      } else if (mode === 'coa' && coaFiles.length === 0) {
        fetchCoaFiles();
      }
    }
  }, [isOpen, mode, fetchMediaLibrary, fetchCoaFiles, media.length, coaFiles.length]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (mode === 'coa' && pdfUrl) {
          closePdfViewer();
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, mode, pdfUrl, closePdfViewer]);

  if (!isOpen) return null;

  // PDF Viewer Mode (COA only)
  if (mode === 'coa' && pdfUrl && selectedFile) {
    return (
      <div className="bg-neutral-900/95 backdrop-blur-sm rounded-lg border border-white/[0.04] w-full h-full flex flex-col shadow-2xl product-card">
        {/* PDF Header */}
        <div className="flex items-center justify-between p-3 border-b border-white/[0.04]">
          <div className="flex items-center gap-2">
            <button
              onClick={closePdfViewer}
              className="p-1 text-neutral-400 hover:text-white transition-colors rounded hover:bg-neutral-800"
              title="Back to file list"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-medium text-white truncate">{selectedFile.name}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // Call onSelect with the file data
                onSelect?.(selectedFile as any);
                onClose();
              }}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-medium rounded transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Attach COA
            </button>
            <button
              onClick={onClose}
              className="p-1 text-neutral-400 hover:text-white transition-colors rounded hover:bg-neutral-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 p-3 min-h-0">
          <iframe
            src={pdfUrl}
            className="w-full h-full rounded border border-white/[0.04]"
            title={`COA: ${selectedFile.name}`}
            style={{ minHeight: '500px', maxHeight: '70vh' }}
          />
        </div>
      </div>
    );
  }

  const isMediaMode = mode === 'media';
  const itemsPerPage = isMediaMode ? 32 : 6; // 2 rows × 3 columns for COA
  const displayItems = isMediaMode ? media : coaFiles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = isMediaMode ? pagination.total_pages : Math.ceil(coaFiles.length / itemsPerPage);

  return (
    <div className="bg-neutral-900/95 backdrop-blur-sm rounded-lg border border-white/[0.04] w-full h-full flex flex-col shadow-2xl product-card">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/[0.04]">
        <h3 className="text-sm font-medium text-white">
          {isMediaMode ? 'Media Library' : `COA Library - ${productName}`}
        </h3>
        <button
          onClick={onClose}
          className="p-1 text-neutral-400 hover:text-white transition-colors rounded hover:bg-neutral-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-white/[0.04]">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-neutral-400" />
          <input
            type="text"
            placeholder={isMediaMode ? "Search images..." : "Search COA files..."}
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-7 pr-3 py-1.5 bg-neutral-800/50 border border-white/[0.04] rounded text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-white/[0.08] focus:ring-1 focus:ring-white/20"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-neutral-400 animate-spin" />
            <span className="ml-2 text-neutral-400 text-xs">Loading...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            {isMediaMode ? (
              <ImageIcon className="w-8 h-8 text-neutral-600 mb-2" />
            ) : (
              <FileText className="w-8 h-8 text-neutral-600 mb-2" />
            )}
            <p className="text-red-400 text-xs mb-1">
              Error loading {isMediaMode ? 'media' : 'COA files'}
            </p>
            <p className="text-neutral-500 text-xs mb-2">{error}</p>
            <Button
              onClick={() => isMediaMode ? fetchMediaLibrary(currentPage, searchTerm) : fetchCoaFiles(searchTerm)}
              className="text-xs"
              variant="secondary"
              size="sm"
            >
              Try Again
            </Button>
          </div>
        ) : displayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            {isMediaMode ? (
              <ImageIcon className="w-8 h-8 text-neutral-600 mb-2" />
            ) : (
              <FileText className="w-8 h-8 text-neutral-600 mb-2" />
            )}
            <p className="text-neutral-400 text-xs">
              No {isMediaMode ? 'images' : 'COA files'} found
            </p>
            {searchTerm && (
              <p className="text-neutral-500 text-xs mt-1">
                Try different search terms
              </p>
            )}
          </div>
        ) : (
          <div className={`gap-3 ${isMediaMode ? 'grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8' : 'grid grid-cols-4 grid-rows-2 overflow-hidden'}`}>
            {displayItems.map((item) => {
              if (isMediaMode) {
                const mediaItem = item as MediaItem;
                return (
                  <div
                    key={mediaItem.id}
                    className={`relative group cursor-pointer rounded overflow-hidden border transition-all ${
                      selectedMediaId === mediaItem.id
                        ? 'border-white/[0.12] ring-1 ring-white/10'
                        : 'border-white/[0.04] hover:border-white/[0.08]'
                    }`}
                    onClick={() => handleMediaSelect(mediaItem)}
                  >
                    <div className="aspect-square relative bg-neutral-800">
                      <Image
                        src={mediaItem.thumbnail}
                        alt={mediaItem.alt_text || mediaItem.title}
                        fill
                        sizes="120px"
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                      
                      {/* Selection indicator */}
                      {selectedMediaId === mediaItem.id && (
                        <div className="absolute inset-0 bg-white/10 flex items-center justify-center">
                          <div className="w-5 h-5 bg-white/90 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Image info */}
                    <div className="p-1 bg-neutral-800">
                      <p className="text-xs text-neutral-300 truncate text-center" title={mediaItem.title}>
                        {mediaItem.title || 'Untitled'}
                      </p>
                    </div>
                  </div>
                );
              } else {
                const coaFile = item as CoaFile;
                return (
                  <div
                    key={coaFile.name}
                    className="relative group cursor-pointer rounded overflow-hidden border border-white/[0.04] hover:border-white/[0.08] transition-all"
                    onClick={() => handleFileSelect(coaFile)}
                  >
                    <div className="aspect-square relative bg-neutral-800 flex items-center justify-center">
                      <FileText className="w-12 h-12 text-neutral-500" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                      
                      {/* View overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-white/90 rounded-full p-2">
                          <Eye className="w-4 h-4 text-neutral-800" />
                        </div>
                      </div>
                    </div>
                    
                    {/* File info */}
                    <div className="p-2 bg-neutral-800">
                      <p className="text-xs text-neutral-300 truncate text-center" title={coaFile.name}>
                        {coaFile.name.replace('.pdf', '')}
                      </p>
                      <p className="text-xs text-neutral-500 text-center mt-1">
                        {new Date(coaFile.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        )}
      </div>

      {/* Pagination - Only for media library */}
      {isMediaMode && !loading && !error && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between p-3 border-t border-white/[0.04] text-xs">
          <div className="text-neutral-500">
            {((currentPage - 1) * pagination.per_page) + 1}-{Math.min(currentPage * pagination.per_page, pagination.total)} of {pagination.total}
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1 text-neutral-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            
            <span className="text-neutral-400 px-2">
              {currentPage}/{pagination.total_pages}
            </span>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= pagination.total_pages}
              className="p-1 text-neutral-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* COA Files Pagination */}
      {!isMediaMode && !loading && !error && Math.ceil(coaFiles.length / 32) > 1 && (
        <div className="flex items-center justify-between p-3 border-t border-white/[0.04] text-xs">
          <div className="text-neutral-500">
            {((currentPage - 1) * 32) + 1}-{Math.min(currentPage * 32, coaFiles.length)} of {coaFiles.length}
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1 text-neutral-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            
            <span className="text-neutral-400 px-2">
              {currentPage}/{Math.ceil(coaFiles.length / 32)}
            </span>
            
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= Math.ceil(coaFiles.length / 32)}
              className="p-1 text-neutral-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
