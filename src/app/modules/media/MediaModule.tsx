'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Search, 
  Loader2, 
  Image as ImageIcon, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Trash2, 
  Upload, 
  Download, 
  Filter,
  FolderOpen,
  FileX,
  CheckSquare,
  Square,
  RefreshCw,
  X,
  Plus,
  Edit3,
  Link,
  Eye,
  Sparkles
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { IconButton, BackgroundRemovalDropdown, AIToolsDropdown } from '../../../components/ui';
import { DalleGeneratorDropdown } from '../../../components/ui/DalleGeneratorDropdown';
import Image from 'next/image';

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

interface MediaModuleProps {
  onClose: () => void;
}

export interface MediaModuleRef {
  handleRefresh: () => void;
}

type SortField = 'title' | 'date' | 'filesize';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

interface FilterOptions {
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
  sizeRange: 'all' | 'small' | 'medium' | 'large';
  mediaType: 'all' | 'image' | 'video' | 'audio' | 'document';
  searchTerm: string;
}

interface BulkAssignmentState {
  isOpen: boolean;
  selectedProducts: number[];
  searchTerm: string;
  isLoading: boolean;
}

export const MediaModule = React.forwardRef<MediaModuleRef, MediaModuleProps>(
  ({ onClose }, ref) => {
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [pagination, setPagination] = useState({
      page: 1,
      per_page: 32,
      total: 0,
      total_pages: 1
    });
    const [bulkAssignment, setBulkAssignment] = useState<BulkAssignmentState>({
      isOpen: false,
      selectedProducts: [],
      searchTerm: '',
      isLoading: false
    });
    const [isRemovingBg, setIsRemovingBg] = useState(false);
    const [bgRemovalProgress, setBgRemovalProgress] = useState(0);
    const [aiProcessing, setAiProcessing] = useState<Set<number>>(new Set());
    const [aiProcessingType, setAiProcessingType] = useState<Record<number, string>>({});
    
    const [filters, setFilters] = useState<FilterOptions>({
      dateRange: 'all',
      sizeRange: 'all',
      mediaType: 'all',
      searchTerm: ''
    });

    const itemsPerPage = viewMode === 'grid' ? 32 : 50;
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch media items from WordPress
    const fetchMediaItems = useCallback(async (page: number = 1, search: string = '') => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching media items from WordPress...');
        
        const params = new URLSearchParams({
          page: page.toString(),
          per_page: itemsPerPage.toString(),
          media_type: filters.mediaType === 'all' ? 'image' : filters.mediaType
        });
        
        if (search.trim()) {
          params.append('search', search.trim());
        }

        const response = await fetch(`/api/media/library?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch media library');
        }

        const data = await response.json();
        
        if (data.success) {
          setMediaItems(data.media);
          setPagination(data.pagination);
          setCurrentPage(page);
        } else {
          throw new Error('Invalid response format');
        }
        
      } catch (error) {
        console.error('Error fetching media items:', error);
        setError(error instanceof Error ? error.message : 'Failed to load media items');
      } finally {
        setLoading(false);
      }
    }, [itemsPerPage, filters.mediaType]);

    // Apply filters and sorting
    const filteredAndSortedItems = useMemo(() => {
      let filtered = [...mediaItems];

      // Apply search filter
      if (filters.searchTerm.trim()) {
        const searchTerm = filters.searchTerm.toLowerCase();
        filtered = filtered.filter(item => 
          item.title.toLowerCase().includes(searchTerm) ||
          item.alt_text.toLowerCase().includes(searchTerm)
        );
      }

      // Apply date filter
      if (filters.dateRange !== 'all') {
        const now = new Date();
        const filterDate = new Date();
        
        switch (filters.dateRange) {
          case 'today':
            filterDate.setDate(now.getDate() - 1);
            break;
          case 'week':
            filterDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            filterDate.setMonth(now.getMonth() - 1);
            break;
          case 'year':
            filterDate.setFullYear(now.getFullYear() - 1);
            break;
        }
        
        filtered = filtered.filter(item => 
          new Date(item.date) >= filterDate
        );
      }

      // Apply size filter
      if (filters.sizeRange !== 'all') {
        filtered = filtered.filter(item => {
          const size = item.media_details?.filesize || 0;
          switch (filters.sizeRange) {
            case 'small': return size < 1024 * 1024; // < 1MB
            case 'medium': return size >= 1024 * 1024 && size < 10 * 1024 * 1024; // 1-10MB
            case 'large': return size >= 10 * 1024 * 1024; // > 10MB
            default: return true;
          }
        });
      }

      // Apply sorting
      filtered.sort((a, b) => {
        let aVal: any, bVal: any;
        
        switch (sortField) {
          case 'title':
            aVal = a.title.toLowerCase();
            bVal = b.title.toLowerCase();
            break;
          case 'date':
            aVal = new Date(a.date);
            bVal = new Date(b.date);
            break;
          case 'filesize':
            aVal = a.media_details?.filesize || 0;
            bVal = b.media_details?.filesize || 0;
            break;
          default:
            return 0;
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });

      return filtered;
    }, [mediaItems, filters, sortField, sortDirection]);

    // Handle item selection
    const handleItemSelect = useCallback((itemId: number, isSelected: boolean) => {
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        if (isSelected) {
          newSet.add(itemId);
        } else {
          newSet.delete(itemId);
        }
        return newSet;
      });
    }, []);

    // Handle select all
    const handleSelectAll = useCallback(() => {
      if (selectedItems.size === filteredAndSortedItems.length) {
        setSelectedItems(new Set());
      } else {
        setSelectedItems(new Set(filteredAndSortedItems.map(item => item.id)));
      }
    }, [selectedItems.size, filteredAndSortedItems]);

    // Handle item preview
    const handleItemPreview = useCallback((item: MediaItem) => {
      setSelectedItem(item);
    }, []);

    // Handle file upload
    const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      setIsUploading(true);
      setUploadProgress(0);
      setError(null);

      try {
        console.log('Starting media upload process...', files.length, 'files');
        
        const uploadPromises = Array.from(files).map(async (file, index) => {
          console.log(`Processing file ${index + 1}:`, file.name, file.type, file.size);
          
          // Validate file type
          if (!file.type.startsWith('image/')) {
            throw new Error(`${file.name} is not a valid image file`);
          }

          const formData = new FormData();
          formData.append('file', file);
          
          console.log(`Uploading ${file.name} via API route...`);
          
          const response = await fetch('/api/media/upload', {
            method: 'POST',
            body: formData
          });
          
          const result = await response.json();
          
          if (!result.success) {
            throw new Error(`Upload failed for ${file.name}: ${result.error}`);
          }
          
          console.log(`Upload successful for ${file.name}:`, result);
          setUploadProgress(((index + 1) / files.length) * 100);
          return result.data;
        });

        const results = await Promise.all(uploadPromises);
        console.log('All uploads completed:', results);
        
        await fetchMediaItems(currentPage, filters.searchTerm); // Refresh the media list
        console.log('Media list refreshed');
        
      } catch (error) {
        console.error('Upload error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        
        // Provide user-friendly error message for authentication issues
        if (errorMessage.includes('401') || errorMessage.includes('Authentication failed')) {
          setError(
            'Media upload requires WordPress admin authentication. ' +
            'Please contact your administrator to set up WordPress Application Passwords ' +
            'or configure the media upload endpoint.'
          );
        } else {
          setError(errorMessage);
        }
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        // Reset file input
        if (event.target) {
          event.target.value = '';
        }
      }
    }, [fetchMediaItems, currentPage, filters.searchTerm]);

    // Handle single item delete
    const handleSingleItemDelete = useCallback(async (itemId: number) => {
      const item = mediaItems.find(m => m.id === itemId);
      if (!confirm(`Are you sure you want to delete "${item?.title}"? This action cannot be undone.`)) {
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        console.log('Deleting media item:', itemId);
        
        const response = await fetch('/api/media/delete', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ mediaIds: [itemId] })
        });
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(`Delete failed: ${result.error}`);
        }
        
        console.log('Media item successfully deleted');

        // Remove from selected items if it was selected
        setSelectedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
        
        await fetchMediaItems(currentPage, filters.searchTerm); // Refresh the media list
        
      } catch (error) {
        console.error('Delete error:', error);
        setError(error instanceof Error ? error.message : 'Delete failed');
      } finally {
        setLoading(false);
      }
    }, [mediaItems, fetchMediaItems, currentPage, filters.searchTerm]);

    // Handle bulk delete
    const handleBulkDelete = useCallback(async () => {
      if (selectedItems.size === 0) return;
      
      if (!confirm(`Are you sure you want to delete ${selectedItems.size} items? This action cannot be undone.`)) {
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const itemIds = Array.from(selectedItems);
        console.log('Bulk deleting media items:', itemIds);
        
        const response = await fetch('/api/media/delete', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ mediaIds: itemIds })
        });
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(`Bulk delete failed: ${result.error}`);
        }
        
        console.log(`Successfully deleted ${result.data?.deletedCount || itemIds.length} media items`);

        setSelectedItems(new Set());
        await fetchMediaItems(currentPage, filters.searchTerm); // Refresh the media list
        
      } catch (error) {
        console.error('Bulk delete error:', error);
        setError(error instanceof Error ? error.message : 'Delete failed');
      } finally {
        setLoading(false);
      }
    }, [selectedItems, fetchMediaItems, currentPage, filters.searchTerm]);

    // Handle background removal
    const handleRemoveBackground = useCallback(async (useAdvanced = false) => {
      if (selectedItems.size === 0) return;
      
      const selectedMediaItems = filteredAndSortedItems.filter(item => selectedItems.has(item.id));
      const imageItems = selectedMediaItems.filter(item => item.mime_type.startsWith('image/'));
      
      if (imageItems.length === 0) {
        setError('Please select at least one image to remove background from');
        return;
      }
      
      const mode = useAdvanced ? 'advanced (higher quality)' : 'standard';
      const suffix = useAdvanced ? '_no_bg_hq' : '_no_bg';
      
      if (!confirm(`Remove background from ${imageItems.length} selected image(s) using ${mode} mode? This will create new images with "${suffix}" suffix.`)) {
        return;
      }

      setIsRemovingBg(true);
      setBgRemovalProgress(0);
      setError(null);
      
      try {
        console.log('Starting background removal for', imageItems.length, 'images');
        
        const imageUrls = imageItems.map(item => item.source_url);
        
        // Use the proper API endpoint with correct multipart handling
        const quality = useAdvanced ? 'full' : 'auto';
        
        const response = await fetch('/api/media/remove-bg-proper', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageUrls, quality })
        });
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(`Background removal failed: ${result.error}`);
        }
        
        console.log('Background removal completed:', result.data);
        
        // Upload processed images back to media library
        const uploadPromises = result.data.processed.map(async (processedImage: any, index: number) => {
          try {
            // Convert data URL to blob
            const response = await fetch(processedImage.processedDataUrl);
            const blob = await response.blob();
            
            // Create form data for upload
            const formData = new FormData();
            formData.append('file', new File([blob], processedImage.processedFilename, { type: 'image/png' }));
            
            // Upload to media library
            const uploadResponse = await fetch('/api/media/upload', {
              method: 'POST',
              body: formData
            });
            
            const uploadResult = await uploadResponse.json();
            
            if (!uploadResult.success) {
              throw new Error(`Upload failed for ${processedImage.processedFilename}: ${uploadResult.error}`);
            }
            
            setBgRemovalProgress(((index + 1) / result.data.processed.length) * 100);
            return uploadResult.data;
            
          } catch (error) {
            console.error(`Failed to upload processed image ${processedImage.processedFilename}:`, error);
            throw error;
          }
        });

        await Promise.all(uploadPromises);
        
        console.log('All processed images uploaded successfully');
        
        // Show success message
        if (result.data.errors.length > 0) {
          setError(`Background removal completed with ${result.data.errors.length} errors. Check console for details.`);
        }
        
        // Refresh media list
        await fetchMediaItems(currentPage, filters.searchTerm);
        
        // Clear selection
        setSelectedItems(new Set());
        
      } catch (error) {
        console.error('Background removal error:', error);
        setError(error instanceof Error ? error.message : 'Background removal failed');
      } finally {
        setIsRemovingBg(false);
        setBgRemovalProgress(0);
      }
    }, [selectedItems, filteredAndSortedItems, fetchMediaItems, currentPage, filters.searchTerm]);

    // Handle AI processing for individual items
    const handleAIProcess = useCallback(async (item: MediaItem, processType: 'upscale' | 'relight' | 'reimagine', options?: any) => {
      const processingSet = new Set(aiProcessing);
      processingSet.add(item.id);
      setAiProcessing(processingSet);
      setAiProcessingType(prev => ({ ...prev, [item.id]: processType }));
      
      try {
        console.log(`Starting AI ${processType} for:`, item.source_url);
        
        let endpoint = '';
        let body: any = { imageUrl: item.source_url };
        
        switch (processType) {
          case 'upscale':
            endpoint = '/api/media/ai-upscale';
            body = { ...body, targetWidth: 2048, targetHeight: 2048 };
            break;
          case 'relight':
            endpoint = '/api/media/ai-relight';
            body = { ...body, lightPosition: options?.lightPosition || 'top' };
            break;
          case 'reimagine':
            endpoint = '/api/media/ai-reimagine';
            break;
        }
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body)
        });
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(`AI ${processType} failed: ${result.error}`);
        }
        
        console.log(`AI ${processType} completed:`, result.data);
        
        // Convert data URL to blob and upload
        const dataUrlResponse = await fetch(result.data.processedDataUrl);
        const blob = await dataUrlResponse.blob();
        
        const formData = new FormData();
        formData.append('file', new File([blob], result.data.processedFilename, { type: 'image/png' }));
        
        const uploadResponse = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData
        });
        
        const uploadResult = await uploadResponse.json();
        
        if (!uploadResult.success) {
          throw new Error(`Upload failed: ${uploadResult.error}`);
        }
        
        console.log(`AI processed image uploaded successfully:`, uploadResult.data);
        
        // Refresh media list to show new processed image
        await fetchMediaItems(currentPage, filters.searchTerm);
        
      } catch (error) {
        console.error(`AI ${processType} error:`, error);
        setError(error instanceof Error ? error.message : `AI ${processType} failed`);
      } finally {
        const processingSet = new Set(aiProcessing);
        processingSet.delete(item.id);
        setAiProcessing(processingSet);
        setAiProcessingType(prev => {
          const updated = { ...prev };
          delete updated[item.id];
          return updated;
        });
      }
    }, [aiProcessing, fetchMediaItems, currentPage, filters.searchTerm]);

    // Format file size
    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Handle page change
    const handlePageChange = useCallback((page: number) => {
      fetchMediaItems(page, filters.searchTerm);
    }, [fetchMediaItems, filters.searchTerm]);

    // Handle search
    const handleSearch = useCallback((term: string) => {
      setFilters(prev => ({ ...prev, searchTerm: term }));
      setCurrentPage(1);
      fetchMediaItems(1, term);
    }, [fetchMediaItems]);

    // Expose refresh method via ref
    React.useImperativeHandle(ref, () => ({
      handleRefresh: () => fetchMediaItems(currentPage, filters.searchTerm)
    }));

    // Load initial data
    useEffect(() => {
      fetchMediaItems(1);
    }, [fetchMediaItems]);

    // Handle escape key
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (selectedItem) {
            setSelectedItem(null);
          } else if (bulkAssignment.isOpen) {
            setBulkAssignment(prev => ({ ...prev, isOpen: false }));
          }
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }, [selectedItem, bulkAssignment.isOpen]);

    // Media Preview Mode
    if (selectedItem) {
      return (
        <div className="flex-1 bg-neutral-900 flex flex-col">
          {/* Preview Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/[0.04] bg-neutral-800/30">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 text-neutral-400 hover:text-white transition-colors rounded hover:bg-neutral-700"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h3 className="text-sm font-medium text-white">{selectedItem.title}</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  {selectedItem.media_details?.width}×{selectedItem.media_details?.height} • 
                  {selectedItem.media_details?.filesize && ` ${formatFileSize(selectedItem.media_details.filesize)} • `}
                  {new Date(selectedItem.date).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedItem(null)}
              className="p-2 text-neutral-400 hover:text-white transition-colors rounded hover:bg-neutral-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Preview Content */}
          <div className="flex-1 p-4 min-h-0 flex items-center justify-center">
            <div className="max-w-full max-h-full">
              <Image
                src={selectedItem.source_url}
                alt={selectedItem.alt_text || selectedItem.title}
                width={selectedItem.media_details?.width || 800}
                height={selectedItem.media_details?.height || 600}
                className="max-w-full max-h-full object-contain rounded border border-white/[0.04]"
                style={{ maxHeight: 'calc(100vh - 200px)' }}
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 bg-neutral-900 flex flex-col">
        {/* Header - Match ProductGridHeader */}
        <div className="px-4 py-1 border-b border-white/[0.04] bg-neutral-900 flex-shrink-0">
          <div className="flex items-center justify-between w-full relative">
            {/* Left section - Media Stats */}
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-white/[0.05] text-neutral-400 text-xs rounded product-text">
                {filteredAndSortedItems.length} total
              </span>
              {selectedItems.size > 0 && (
                <span className="px-2 py-1 bg-white/[0.08] text-neutral-300 text-xs rounded product-text">
                  {selectedItems.size} selected
                </span>
              )}
            </div>

            {/* Center section - View Mode Toggle */}
            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-3 z-50">
              <div className="flex border border-white/[0.04] rounded overflow-hidden bg-neutral-800/50">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 text-xs transition-colors font-tiempos ${
                    viewMode === 'grid' 
                      ? 'bg-white/[0.08] text-neutral-300' 
                      : 'text-neutral-500 hover:text-neutral-400 hover:bg-white/[0.04]'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 text-xs transition-colors font-tiempos ${
                    viewMode === 'list' 
                      ? 'bg-white/[0.08] text-neutral-300' 
                      : 'text-neutral-500 hover:text-neutral-400 hover:bg-white/[0.04]'
                  }`}
                >
                  List
                </button>
              </div>
            </div>

            {/* Right section - Actions */}
            <div className="flex items-center gap-2">
              <IconButton
                onClick={() => setShowFilters(!showFilters)}
                variant={showFilters ? 'active' : 'default'}
                title="Filters"
              >
                <Filter className="w-4 h-4" />
              </IconButton>
            </div>
          </div>
        </div>

        {/* Toolbar - Match product grid toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.04] bg-neutral-800/20">
          <div className="flex items-center gap-2">
            {/* Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
            <IconButton
              onClick={() => fileInputRef.current?.click()}
              variant="default"
              title={isUploading ? `Uploading... ${Math.round(uploadProgress)}%` : 'Upload Media'}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
            </IconButton>

            {/* Background Removal Dropdown */}
            <BackgroundRemovalDropdown
              selectedImages={Array.from(selectedItems).map(id => {
                const item = filteredAndSortedItems.find(item => item.id === id);
                return item?.source_url || '';
              }).filter(url => url)}
              onRemoveBackground={async (imageUrls: string[], quality: 'auto' | 'full') => {
                await handleRemoveBackground(quality === 'full');
              }}
            />

            {/* DALL-E Generator */}
            <DalleGeneratorDropdown
              onImageGenerated={(mediaItem) => {
                // Add the new generated image to the current media items
                setMediaItems(prev => [mediaItem, ...prev]);
                // Update pagination total
                setPagination(prev => ({
                  ...prev,
                  total: prev.total + 1
                }));
              }}
            />

            {/* AI Tools Dropdown */}
            <AIToolsDropdown
              selectedImages={Array.from(selectedItems).map(id => {
                const item = filteredAndSortedItems.find(item => item.id === id);
                return item?.source_url || '';
              }).filter(url => url)}
              onAIProcess={async (imageUrls: string[], tool: 'upscale' | 'relight' | 'reimagine', options?: any) => {
                // Process each selected image
                const selectedMediaItems = filteredAndSortedItems.filter(item => selectedItems.has(item.id));
                const imageItems = selectedMediaItems.filter(item => item.mime_type.startsWith('image/'));
                
                for (const item of imageItems) {
                  await handleAIProcess(item, tool, options);
                }
              }}
              isProcessing={aiProcessing.size > 0}
              processingProgress={0} // TODO: Add progress tracking for bulk AI processing
            />

            {/* Bulk Actions */}
            {selectedItems.size > 0 && (
              <IconButton
                onClick={handleBulkDelete}
                variant="default"
                title={`Delete ${selectedItems.size} items`}
              >
                <Trash2 className="w-4 h-4" />
              </IconButton>
            )}

            {/* Refresh */}
            <IconButton
              onClick={() => fetchMediaItems(currentPage, filters.searchTerm)}
              variant="default"
              title="Refresh"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </IconButton>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
              <input
                type="text"
                placeholder="Search media..."
                value={filters.searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-neutral-800/30 border border-white/[0.06] rounded text-xs text-neutral-400 placeholder-neutral-600 focus:outline-none focus:border-white/[0.12] focus:bg-neutral-800/50 transition-all w-48 font-tiempos"
              />
            </div>
          </div>
        </div>

        {/* Filters Panel - Match product grid filters */}
        {showFilters && (
          <div className="px-4 py-3 border-b border-white/[0.04] bg-neutral-800/20">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <label className="text-xs text-neutral-500 product-text">Date:</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                  className="bg-neutral-800/50 border border-white/[0.06] rounded px-2 py-1 text-xs text-neutral-400 focus:border-white/[0.12] focus:outline-none product-text"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-neutral-500 product-text">Size:</label>
                <select
                  value={filters.sizeRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, sizeRange: e.target.value as any }))}
                  className="bg-neutral-800/50 border border-white/[0.06] rounded px-2 py-1 text-xs text-neutral-400 focus:border-white/[0.12] focus:outline-none product-text"
                >
                  <option value="all">All Sizes</option>
                  <option value="small">Small (&lt; 1MB)</option>
                  <option value="medium">Medium (1-10MB)</option>
                  <option value="large">Large (&gt; 10MB)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-neutral-500 product-text">Type:</label>
                <select
                  value={filters.mediaType}
                  onChange={(e) => setFilters(prev => ({ ...prev, mediaType: e.target.value as any }))}
                  className="bg-neutral-800/50 border border-white/[0.06] rounded px-2 py-1 text-xs text-neutral-400 focus:border-white/[0.12] focus:outline-none product-text"
                >
                  <option value="all">All Types</option>
                  <option value="image">Images</option>
                  <option value="video">Videos</option>
                  <option value="audio">Audio</option>
                  <option value="document">Documents</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-neutral-500 product-text">Sort:</label>
                <select
                  value={`${sortField}_${sortDirection}`}
                  onChange={(e) => {
                    const [field, direction] = e.target.value.split('_');
                    setSortField(field as SortField);
                    setSortDirection(direction as SortDirection);
                  }}
                  className="bg-neutral-800/50 border border-white/[0.06] rounded px-2 py-1 text-xs text-neutral-400 focus:border-white/[0.12] focus:outline-none product-text"
                >
                  <option value="date_desc">Newest First</option>
                  <option value="date_asc">Oldest First</option>
                  <option value="title_asc">Title A-Z</option>
                  <option value="title_desc">Title Z-A</option>
                  <option value="filesize_desc">Largest First</option>
                  <option value="filesize_asc">Smallest First</option>
                </select>
              </div>

              <IconButton
                onClick={() => setFilters({ dateRange: 'all', sizeRange: 'all', mediaType: 'all', searchTerm: '' })}
                variant="default"
                title="Clear Filters"
              >
                <X className="w-3.5 h-3.5" />
              </IconButton>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-neutral-500 animate-spin mr-3" />
              <span className="text-neutral-500 product-text">Loading media...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileX className="w-12 h-12 text-neutral-600 mb-4" />
              <p className="text-red-400 mb-2 product-text">Error loading media</p>
              <p className="text-neutral-600 text-sm mb-4 product-text">{error}</p>
              <Button onClick={() => fetchMediaItems(currentPage, filters.searchTerm)} variant="secondary" size="sm">
                Try Again
              </Button>
            </div>
          ) : filteredAndSortedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ImageIcon className="w-12 h-12 text-neutral-600 mb-4" />
              <p className="text-neutral-500 mb-2 product-text">No media items found</p>
              <p className="text-neutral-600 text-sm mb-4 product-text">
                {filters.searchTerm || filters.dateRange !== 'all' || filters.sizeRange !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Upload some media files to get started'
                }
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="secondary"
                size="sm"
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Media
              </Button>
            </div>
          ) : (
            <>
              {/* Select All Header */}
              <div className="flex items-center gap-3 mb-4 pb-2 border-b border-white/[0.04]">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-400 product-text"
                >
                  {selectedItems.size === filteredAndSortedItems.length ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  Select All ({filteredAndSortedItems.length})
                </button>
              </div>

              {/* Media Grid/List */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                  {filteredAndSortedItems.map((item) => {
                    const isSelected = selectedItems.has(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`relative group cursor-pointer rounded-lg border transition-all ${
                          isSelected
                            ? 'border-blue-500/50 bg-blue-500/10'
                            : 'border-white/[0.04] hover:border-white/[0.08] hover:bg-neutral-800/20'
                        }`}
                      >
                        {/* Selection Checkbox */}
                        <div className="absolute top-2 left-2 z-10">
                          <button
                            onClick={() => handleItemSelect(item.id, !isSelected)}
                            className={`p-1 rounded transition-all ${
                              isSelected
                                ? 'bg-blue-500 text-white'
                                : 'bg-neutral-800/80 text-neutral-400 hover:text-white'
                            }`}
                          >
                            {isSelected ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <div className="w-3 h-3" />
                            )}
                          </button>
                        </div>

                        {/* Delete Button */}
                        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSingleItemDelete(item.id);
                            }}
                            className="p-1 rounded bg-red-500/80 text-white hover:bg-red-500 transition-all"
                            title="Delete item"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Remove Background Button */}

                        {/* Preview Button */}
                        <div className="absolute top-2 right-8 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleItemPreview(item);
                            }}
                            className="p-1 rounded bg-neutral-800/80 text-white hover:bg-neutral-700 transition-all"
                            title="Preview item"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                        </div>

                        {/* AI Features Row */}

                        {/* Media Content */}
                        <div className="p-2 pt-8">
                          <div className="aspect-square relative rounded overflow-hidden mb-3">
                            <Image
                              src={item.thumbnail || item.source_url}
                              alt={item.alt_text || item.title}
                              fill
                              sizes="150px"
                              className="object-cover transition-all duration-300 group-hover:scale-105"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-xs text-neutral-400 truncate font-normal product-text" title={item.title}>
                              {item.title || 'Untitled'}
                            </p>
                            <p className="text-xs text-neutral-600 product-text">
                              {new Date(item.date).toLocaleDateString()}
                            </p>
                            {item.media_details?.filesize && (
                              <p className="text-xs text-neutral-600 product-text">
                                {formatFileSize(item.media_details.filesize)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-0">
                  {/* Table Header */}
                  <div className="sticky top-0 z-10 bg-neutral-800/80 backdrop-blur border-b border-white/[0.08]">
                    <div className="flex items-center gap-3 px-4 py-3 text-xs font-medium text-neutral-400 uppercase tracking-wider product-text">
                      {/* Select All */}
                      <div className="w-6 flex items-center justify-center">
                        <button
                          onClick={handleSelectAll}
                          className="w-4 h-4 flex items-center justify-center"
                        >
                          {selectedItems.size === filteredAndSortedItems.length ? (
                            <div className="w-4 h-4 bg-blue-500 rounded border-2 border-blue-500 flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                          ) : (
                            <div className="w-4 h-4 border-2 border-neutral-600 rounded hover:border-neutral-400 transition-colors" />
                          )}
                        </button>
                      </div>
                      
                      {/* Preview */}
                      <div className="w-12"></div>
                      
                      {/* Title */}
                      <div className="flex-1 product-text">Title</div>
                      
                      {/* Date */}
                      <div className="w-24 text-right product-text">Date</div>
                      
                      {/* Size */}
                      <div className="w-20 text-right product-text">Size</div>
                      
                      {/* Dimensions */}
                      <div className="w-24 text-right product-text">Dimensions</div>
                    </div>
                  </div>
                  
                  {filteredAndSortedItems.map((item) => {
                    const isSelected = selectedItems.has(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`group transition-all mb-2 rounded-lg border-b border-white/[0.02] product-card cursor-pointer ${
                          isSelected
                            ? 'bg-neutral-800/50 border-l-4 border-l-blue-400 border border-blue-500/20'
                            : 'border border-white/[0.04] hover:border-white/[0.08] hover:bg-neutral-800/20'
                        }`}
                        onClick={() => handleItemPreview(item)}
                      >
                        <div className="flex items-center gap-3 px-4 py-3">
                          {/* Selection Checkbox */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleItemSelect(item.id, !isSelected);
                            }}
                            className="flex-shrink-0 w-6 h-6 flex items-center justify-center"
                          >
                            {isSelected ? (
                              <div className="w-4 h-4 bg-blue-500 rounded border-2 border-blue-500 flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 text-white" />
                              </div>
                            ) : (
                              <div className="w-4 h-4 border-2 border-neutral-600 rounded hover:border-neutral-400 transition-colors" />
                            )}
                          </button>

                          {/* Preview Thumbnail */}
                          <div className="flex-shrink-0 w-12 h-12 relative rounded overflow-hidden bg-neutral-800">
                            <Image
                              src={item.thumbnail || item.source_url}
                              alt={item.alt_text || item.title}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </div>

                          {/* Title - Main Column */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-neutral-400 truncate font-normal product-text" title={item.title}>
                              {item.title || 'Untitled'}
                            </p>
                            {item.alt_text && (
                              <p className="text-xs text-neutral-600 truncate product-text" title={item.alt_text}>
                                {item.alt_text}
                              </p>
                            )}
                          </div>

                          {/* Date */}
                          <div className="w-24 text-xs text-neutral-600 text-right product-text">
                            {new Date(item.date).toLocaleDateString()}
                          </div>

                          {/* File Size */}
                          <div className="w-20 text-xs text-neutral-600 text-right product-text">
                            {item.media_details?.filesize ? formatFileSize(item.media_details.filesize) : '-'}
                          </div>

                          {/* Dimensions */}
                          <div className="w-24 text-xs text-neutral-600 text-right product-text">
                            {item.media_details?.width && item.media_details?.height 
                              ? `${item.media_details.width}×${item.media_details.height}`
                              : '-'
                            }
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSingleItemDelete(item.id);
                              }}
                              className="p-1.5 text-red-400 hover:text-red-300 transition-colors rounded hover:bg-red-500/20"
                              title="Delete item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && pagination.total_pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/[0.04] text-sm bg-neutral-800/20">
            <div className="text-neutral-600 product-text">
              Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, pagination.total)} of {pagination.total} items
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-2 text-neutral-500 hover:text-neutral-400 disabled:opacity-50 disabled:cursor-not-allowed rounded hover:bg-neutral-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="text-neutral-500 px-3 product-text">
                {currentPage} / {pagination.total_pages}
              </span>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= pagination.total_pages}
                className="p-2 text-neutral-500 hover:text-neutral-400 disabled:opacity-50 disabled:cursor-not-allowed rounded hover:bg-neutral-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

MediaModule.displayName = 'MediaModule';
