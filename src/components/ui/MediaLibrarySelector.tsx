'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, Loader2, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { Button } from './Button';

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

interface MediaLibrarySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: MediaItem) => void;
  selectedMediaId?: number;
}

export function MediaLibrarySelector({ 
  isOpen, 
  onClose, 
  onSelect,
  selectedMediaId 
}: MediaLibrarySelectorProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
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

  const fetchMedia = useCallback(async (page: number = 1, search: string = '') => {
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

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
    fetchMedia(1, term);
  }, [fetchMedia]);

  const handlePageChange = useCallback((page: number) => {
    fetchMedia(page, searchTerm);
  }, [fetchMedia, searchTerm]);

  const handleMediaSelect = useCallback((mediaItem: MediaItem) => {
    onSelect(mediaItem);
    onClose();
  }, [onSelect, onClose]);

  // Load initial media when modal opens
  useEffect(() => {
    if (isOpen && media.length === 0) {
      fetchMedia(1);
    }
  }, [isOpen, fetchMedia, media.length]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="bg-neutral-900/95 backdrop-blur-sm rounded-lg border border-white/[0.04] w-full h-full flex flex-col shadow-2xl product-card">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/[0.04]">
        <h3 className="text-sm font-medium text-white">Media Library</h3>
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
            placeholder="Search images..."
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
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            <span className="ml-2 text-neutral-400 text-xs">Loading...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ImageIcon className="w-8 h-8 text-neutral-600 mb-2" />
            <p className="text-red-400 text-xs mb-1">Error loading media</p>
            <p className="text-neutral-500 text-xs mb-2">{error}</p>
            <Button
              onClick={() => fetchMedia(currentPage, searchTerm)}
              className="text-xs"
              variant="secondary"
              size="sm"
            >
              Try Again
            </Button>
          </div>
        ) : media.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ImageIcon className="w-8 h-8 text-neutral-600 mb-2" />
            <p className="text-neutral-400 text-xs">No images found</p>
            {searchTerm && (
              <p className="text-neutral-500 text-xs mt-1">
                Try different search terms
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {media.map((item) => (
              <div
                key={item.id}
                className={`relative group cursor-pointer rounded overflow-hidden border transition-all ${
                  selectedMediaId === item.id
                    ? 'border-white/[0.12] ring-1 ring-white/10'
                    : 'border-white/[0.04] hover:border-white/[0.08]'
                }`}
                onClick={() => handleMediaSelect(item)}
              >
                <div className="aspect-square relative bg-neutral-800">
                  <Image
                    src={item.thumbnail}
                    alt={item.alt_text || item.title}
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
                  {selectedMediaId === item.id && (
                    <div className="absolute inset-0 bg-white/10 flex items-center justify-center">
                      <div className="w-5 h-5 bg-white/90 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Image info - compact */}
                <div className="p-1 bg-neutral-800">
                  <p className="text-xs text-neutral-300 truncate text-center" title={item.title}>
                    {item.title || 'Untitled'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>

      {/* Pagination */}
      {!loading && !error && pagination.total_pages > 1 && (
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
    </div>
  );
}
