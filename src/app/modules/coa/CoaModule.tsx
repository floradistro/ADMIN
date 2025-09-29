'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Search, 
  Loader2, 
  FileText, 
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
  Link
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { IconButton } from '../../../components/ui';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://elhsobjvwmjfminxxcwy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsaHNvYmp2d21qZm1pbnh4Y3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDQzMzAsImV4cCI6MjA2NjI4MDMzMH0.sK5ggW0XxE_Y9x5dXQvq2IPbxo0WoQs3OcfXNhEbTyQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface CoaFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at?: string;
  metadata?: {
    size: number;
    mimetype: string;
    eTag?: string;
    cacheControl?: string;
  };
}

interface CoaModuleProps {
  onClose: () => void;
}

export interface CoaModuleRef {
  handleRefresh: () => void;
}

type SortField = 'name' | 'created_at' | 'size';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

interface FilterOptions {
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
  sizeRange: 'all' | 'small' | 'medium' | 'large';
  searchTerm: string;
}

interface BulkAssignmentState {
  isOpen: boolean;
  selectedProducts: number[];
  searchTerm: string;
  isLoading: boolean;
}

export const CoaModule = React.forwardRef<CoaModuleRef, CoaModuleProps>(
  ({ onClose }, ref) => {
    const [coaFiles, setCoaFiles] = useState<CoaFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [sortField, setSortField] = useState<SortField>('created_at');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedFile, setSelectedFile] = useState<CoaFile | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [bulkAssignment, setBulkAssignment] = useState<BulkAssignmentState>({
      isOpen: false,
      selectedProducts: [],
      searchTerm: '',
      isLoading: false
    });
    
    const [filters, setFilters] = useState<FilterOptions>({
      dateRange: 'all',
      sizeRange: 'all',
      searchTerm: ''
    });

    const itemsPerPage = viewMode === 'grid' ? 24 : 50;
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Test Supabase connection
    const testSupabaseConnection = useCallback(async () => {
      try {
        console.log('Testing Supabase connection...');
        console.log('Supabase URL:', supabaseUrl);
        console.log('Supabase Key (first 20 chars):', supabaseAnonKey.substring(0, 20) + '...');
        
        // Test via API route first (server-side)
        try {
          const response = await fetch('/api/coa/test-connection');
          const result = await response.json();
          
          if (result.success) {
            console.log('Server-side connection test successful:', result);
            return true;
          } else {
            console.log('Server-side connection test failed, trying client-side:', result);
          }
        } catch (apiError) {
          console.log('API connection test failed, trying direct client connection:', apiError);
        }
        
        // Test basic connection (client-side)
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        
        if (bucketsError) {
          console.error('Failed to list buckets:', bucketsError);
          setError(`Connection failed: ${bucketsError.message}`);
          return false;
        }
        
        console.log('Available buckets:', buckets);
        
        // Check if 'coas' bucket exists
        const coaBucket = buckets.find(bucket => bucket.name === 'coas');
        if (!coaBucket) {
          console.error('COAs bucket not found');
          setError('COAs bucket not found in Supabase storage');
          return false;
        }
        
        console.log('COAs bucket found:', coaBucket);
        
        // Test bucket access
        const { data: bucketFiles, error: listError } = await supabase.storage
          .from('coas')
          .list('', { limit: 1 });
          
        if (listError) {
          console.error('Failed to access COAs bucket:', listError);
          setError(`Bucket access failed: ${listError.message}`);
          return false;
        }
        
        console.log('Bucket access successful, sample files:', bucketFiles);
        return true;
        
      } catch (error) {
        console.error('Connection test error:', error);
        setError(error instanceof Error ? error.message : 'Connection test failed');
        return false;
      }
    }, []);

    // Fetch COA files from Supabase
    const fetchCoaFiles = useCallback(async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching COA files from Supabase...');
        
        const { data, error } = await supabase.storage
          .from('coas')
          .list('pdfs', {
            limit: 1000,
            offset: 0,
            sortBy: { column: 'created_at', order: 'desc' }
          });

        if (error) {
          console.error('Supabase list error:', error);
          throw new Error(`Failed to fetch COA files: ${error.message}`);
        }

        console.log('Raw files from Supabase:', data);

        // Filter PDF files only and transform to CoaFile format
        const pdfFiles = (data || [])
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

        console.log('Filtered PDF files:', pdfFiles.length, 'files');
        setCoaFiles(pdfFiles);
        
      } catch (error) {
        console.error('Error fetching COA files:', error);
        setError(error instanceof Error ? error.message : 'Failed to load COA files');
      } finally {
        setLoading(false);
      }
    }, []);

    // Apply filters and sorting
    const filteredAndSortedFiles = useMemo(() => {
      let filtered = [...coaFiles];

      // Apply search filter
      if (filters.searchTerm.trim()) {
        const searchTerm = filters.searchTerm.toLowerCase();
        filtered = filtered.filter(file => 
          file.name.toLowerCase().includes(searchTerm)
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
        
        filtered = filtered.filter(file => 
          new Date(file.created_at) >= filterDate
        );
      }

      // Apply size filter
      if (filters.sizeRange !== 'all') {
        filtered = filtered.filter(file => {
          const size = file.metadata?.size || 0;
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
          case 'name':
            aVal = a.name.toLowerCase();
            bVal = b.name.toLowerCase();
            break;
          case 'created_at':
            aVal = new Date(a.created_at);
            bVal = new Date(b.created_at);
            break;
          case 'size':
            aVal = a.metadata?.size || 0;
            bVal = b.metadata?.size || 0;
            break;
          default:
            return 0;
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });

      return filtered;
    }, [coaFiles, filters, sortField, sortDirection]);

    // Paginated files
    const paginatedFiles = useMemo(() => {
      const startIndex = (currentPage - 1) * itemsPerPage;
      return filteredAndSortedFiles.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredAndSortedFiles, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredAndSortedFiles.length / itemsPerPage);

    // Handle file selection
    const handleFileSelect = useCallback((fileName: string, isSelected: boolean) => {
      setSelectedFiles(prev => {
        const newSet = new Set(prev);
        if (isSelected) {
          newSet.add(fileName);
        } else {
          newSet.delete(fileName);
        }
        return newSet;
      });
    }, []);

    // Handle select all
    const handleSelectAll = useCallback(() => {
      if (selectedFiles.size === paginatedFiles.length) {
        setSelectedFiles(new Set());
      } else {
        setSelectedFiles(new Set(paginatedFiles.map(f => f.name)));
      }
    }, [selectedFiles.size, paginatedFiles]);

    // Handle file preview
    const handleFilePreview = useCallback(async (file: CoaFile) => {
      try {
        const { data } = await supabase.storage
          .from('coas')
          .createSignedUrl(`pdfs/${file.name}`, 3600);

        if (data?.signedUrl) {
          setPdfUrl(data.signedUrl);
          setSelectedFile(file);
        }
      } catch (error) {
        console.error('Error creating signed URL:', error);
        setError('Failed to load PDF preview');
      }
    }, []);

    // Handle file upload
    const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      setIsUploading(true);
      setUploadProgress(0);
      setError(null);

      try {
        console.log('Starting file upload process...', files.length, 'files');
        
        // Use API route for uploads (bypasses RLS with service role)
        const uploadPromises = Array.from(files).map(async (file, index) => {
          console.log(`Processing file ${index + 1}:`, file.name, file.type, file.size);
          
          // Validate file type
          if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
            throw new Error(`${file.name} is not a PDF file`);
          }

          // Use API route (server-side with service role)
          const formData = new FormData();
          formData.append('file', file);
          
          console.log(`Uploading ${file.name} via API route...`);
          
          const response = await fetch('/api/coa/upload', {
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
        console.log('All uploads completed via API route:', results);
        
        await fetchCoaFiles(); // Refresh the file list
        console.log('File list refreshed');
        
      } catch (error) {
        console.error('Upload error:', error);
        setError(error instanceof Error ? error.message : 'Upload failed');
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        // Reset file input
        if (event.target) {
          event.target.value = '';
        }
      }
    }, [fetchCoaFiles]);

    // Handle single file delete
    const handleSingleFileDelete = useCallback(async (fileName: string) => {
      if (!confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        console.log('=== SINGLE FILE DELETE DEBUG ===');
        console.log('Attempting to delete single file:', fileName);
        console.log('Full file path will be:', `pdfs/${fileName}`);
        
        // First, verify the file exists
        const { data: existingFiles, error: listError } = await supabase.storage
          .from('coas')
          .list('pdfs', { limit: 1000 });
          
        if (listError) {
          console.error('Failed to list files for verification:', listError);
          throw new Error(`Cannot verify file exists: ${listError.message}`);
        }
        
        const fileExists = existingFiles?.find(f => f.name === fileName);
        console.log('File exists check:', fileExists ? 'YES' : 'NO');
        console.log('Available files:', existingFiles?.map(f => f.name));
        
        if (!fileExists) {
          throw new Error(`File "${fileName}" not found in storage`);
        }
        
        // Use API route (server-side with service role) for reliable deletion
        console.log('Using API route for delete operation...');
        
        const response = await fetch('/api/coa/delete', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fileNames: [fileName] })
        });
        
        const result = await response.json();
        console.log('API delete result:', result);
        
        if (!result.success) {
          throw new Error(`Delete failed: ${result.error}`);
        }
        
        console.log('File successfully deleted via API route');

        // Remove from selected files if it was selected
        setSelectedFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(fileName);
          return newSet;
        });
        
        await fetchCoaFiles(); // Refresh the file list
        console.log('Single file deleted and list refreshed');
        
      } catch (error) {
        console.error('Single file delete error:', error);
        setError(error instanceof Error ? error.message : 'Delete failed');
      } finally {
        setLoading(false);
      }
    }, [fetchCoaFiles]);

    // Handle bulk delete
    const handleBulkDelete = useCallback(async () => {
      if (selectedFiles.size === 0) return;
      
      if (!confirm(`Are you sure you want to delete ${selectedFiles.size} files? This action cannot be undone.`)) {
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const fileNames = Array.from(selectedFiles);
        console.log('=== BULK DELETE DEBUG ===');
        console.log('Attempting to delete files:', fileNames);
        console.log('Full file paths will be:', fileNames.map(name => `pdfs/${name}`));
        
        // First, verify files exist
        const { data: existingFiles, error: listError } = await supabase.storage
          .from('coas')
          .list('pdfs', { limit: 1000 });
          
        if (listError) {
          console.error('Failed to list files for verification:', listError);
          throw new Error(`Cannot verify files exist: ${listError.message}`);
        }
        
        const existingFileNames = existingFiles?.map(f => f.name) || [];
        const filesToDelete = fileNames.filter(name => existingFileNames.includes(name));
        const missingFiles = fileNames.filter(name => !existingFileNames.includes(name));
        
        console.log('Files that exist:', filesToDelete);
        console.log('Files that don\'t exist:', missingFiles);
        
        if (filesToDelete.length === 0) {
          throw new Error('None of the selected files exist in storage');
        }
        
        // Use API route (server-side with service role) for reliable bulk deletion
        console.log('Using API route for bulk delete operation...');
        
        const response = await fetch('/api/coa/delete', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fileNames: filesToDelete })
        });
        
        const result = await response.json();
        console.log('API bulk delete result:', result);
        
        if (!result.success) {
          throw new Error(`Bulk delete failed: ${result.error}`);
        }
        
        console.log(`Successfully deleted ${result.data?.deletedCount || filesToDelete.length} files via API route`);
        
        if (missingFiles.length > 0) {
          setError(`Deleted ${filesToDelete.length} files. ${missingFiles.length} files were already missing.`);
        }

        setSelectedFiles(new Set());
        await fetchCoaFiles(); // Refresh the file list
        console.log('Bulk delete completed and list refreshed');
        
      } catch (error) {
        console.error('Bulk delete error:', error);
        setError(error instanceof Error ? error.message : 'Delete failed');
      } finally {
        setLoading(false);
      }
    }, [selectedFiles, fetchCoaFiles]);

    // Handle bulk download
    const handleBulkDownload = useCallback(async () => {
      if (selectedFiles.size === 0) return;

      try {
        const downloadPromises = Array.from(selectedFiles).map(async (fileName) => {
          const { data } = await supabase.storage
            .from('coas')
            .createSignedUrl(`pdfs/${fileName}`, 3600);
          
          if (data?.signedUrl) {
            const link = document.createElement('a');
            link.href = data.signedUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        });

        await Promise.all(downloadPromises);
      } catch (error) {
        console.error('Download error:', error);
        setError('Failed to download files');
      }
    }, [selectedFiles]);

    // Handle bulk assignment to products
    const handleBulkAssignment = useCallback(() => {
      if (selectedFiles.size === 0) return;
      setBulkAssignment(prev => ({ ...prev, isOpen: true }));
    }, [selectedFiles]);

    // Format file size
    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Expose refresh method via ref
    React.useImperativeHandle(ref, () => ({
      handleRefresh: fetchCoaFiles
    }));

    // Load initial data
    useEffect(() => {
      const initializeData = async () => {
        const connectionOk = await testSupabaseConnection();
        if (connectionOk) {
          await fetchCoaFiles();
        }
      };
      
      initializeData();
    }, [fetchCoaFiles, testSupabaseConnection]);

    // Handle escape key
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (pdfUrl) {
            setPdfUrl(null);
            setSelectedFile(null);
          } else if (bulkAssignment.isOpen) {
            setBulkAssignment(prev => ({ ...prev, isOpen: false }));
          }
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }, [pdfUrl, bulkAssignment.isOpen]);

    // PDF Preview Mode
    if (pdfUrl && selectedFile) {
      return (
        <div className="flex-1 bg-neutral-900 flex flex-col">
          {/* PDF Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/[0.04] bg-neutral-800/30">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setPdfUrl(null);
                  setSelectedFile(null);
                }}
                className="p-2 text-neutral-400 hover:text-white transition-colors rounded hover:bg-neutral-700"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h3 className="text-sm font-medium text-white">{selectedFile.name}</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Created: {new Date(selectedFile.created_at).toLocaleString()}
                  {selectedFile.metadata?.size && ` • ${formatFileSize(selectedFile.metadata.size)}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setPdfUrl(null);
                setSelectedFile(null);
              }}
              className="p-2 text-neutral-400 hover:text-white transition-colors rounded hover:bg-neutral-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* PDF Content */}
          <div className="flex-1 p-4 min-h-0">
            <iframe
              src={pdfUrl}
              className="w-full h-full rounded border border-white/[0.04]"
              title={`COA: ${selectedFile.name}`}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 bg-neutral-900 flex flex-col">
        {/* Header - Match ProductGridHeader */}
        <div className="px-4 py-1 border-b border-white/[0.04] bg-neutral-900 flex-shrink-0">
          <div className="flex items-center justify-between w-full relative">
            {/* Left section - COA Icon and Stats */}
            <div className="flex items-center gap-2">
              <IconButton
                variant="active"
                title="COA Manager"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </IconButton>
              
              <span className="px-2 py-1 bg-white/[0.05] text-neutral-400 text-xs rounded product-text">
                {filteredAndSortedFiles.length} total
              </span>
              {selectedFiles.size > 0 && (
                <span className="px-2 py-1 bg-white/[0.08] text-neutral-300 text-xs rounded product-text">
                  {selectedFiles.size} selected
                </span>
              )}
            </div>

            {/* Center section - View Mode Toggle */}
            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-3 z-50">
              <div className="flex border border-white/[0.04] rounded overflow-hidden bg-neutral-800/50">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 text-xs transition-colors product-text ${
                    viewMode === 'grid' 
                      ? 'bg-white/[0.08] text-neutral-300' 
                      : 'text-neutral-500 hover:text-neutral-400 hover:bg-white/[0.04]'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 text-xs transition-colors product-text ${
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
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
            <IconButton
              onClick={() => fileInputRef.current?.click()}
              variant="default"
              title={isUploading ? `Uploading... ${Math.round(uploadProgress)}%` : 'Upload Files'}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
            </IconButton>

            {/* Bulk Actions */}
            {selectedFiles.size > 0 && (
              <>
                <IconButton
                  onClick={handleBulkDownload}
                  variant="default"
                  title={`Download ${selectedFiles.size} files`}
                >
                  <Download className="w-4 h-4" />
                </IconButton>
                <IconButton
                  onClick={handleBulkDelete}
                  variant="default"
                  title={`Delete ${selectedFiles.size} files`}
                >
                  <Trash2 className="w-4 h-4" />
                </IconButton>
              </>
            )}

            {/* Test Permissions */}
            <IconButton
              onClick={async () => {
                setLoading(true);
                try {
                  const response = await fetch('/api/coa/test-permissions');
                  const result = await response.json();
                  console.log('=== PERMISSION TEST RESULT ===');
                  console.log(result);
                  
                  if (result.success) {
                    setError(null);
                    alert('✅ All permissions working correctly! Upload, read, and delete are functional.');
                  } else {
                    setError(`Permission issue at step: ${result.step} - ${result.error}`);
                    alert(`❌ Permission issue: ${result.message || result.error}`);
                  }
                } catch (error) {
                  console.error('Permission test failed:', error);
                  setError('Permission test failed');
                  alert('❌ Permission test failed - check console for details');
                } finally {
                  setLoading(false);
                }
              }}
              variant="default"
              title="Test Upload/Delete Permissions"
              disabled={loading}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5-6a9 9 0 11-9 9m9-9a9 9 0 00-9 9" />
              </svg>
            </IconButton>

            {/* Test Connection */}
            <IconButton
              onClick={testSupabaseConnection}
              variant="default"
              title="Test Supabase Connection"
              disabled={loading}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 717.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
            </IconButton>

            {/* Refresh */}
            <IconButton
              onClick={fetchCoaFiles}
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
                placeholder="Search files..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="pl-9 pr-3 py-1.5 bg-neutral-800/30 border border-white/[0.06] rounded text-xs text-neutral-400 placeholder-neutral-600 focus:outline-none focus:border-white/[0.12] focus:bg-neutral-800/50 transition-all w-48 product-text"
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
                  <option value="created_at_desc">Newest First</option>
                  <option value="created_at_asc">Oldest First</option>
                  <option value="name_asc">Name A-Z</option>
                  <option value="name_desc">Name Z-A</option>
                  <option value="size_desc">Largest First</option>
                  <option value="size_asc">Smallest First</option>
                </select>
              </div>

              <IconButton
                onClick={() => setFilters({ dateRange: 'all', sizeRange: 'all', searchTerm: '' })}
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
              <span className="text-neutral-500 product-text">Loading files...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileX className="w-12 h-12 text-neutral-600 mb-4" />
              <p className="text-red-400 mb-2 product-text">Error loading files</p>
              <p className="text-neutral-600 text-sm mb-4 product-text">{error}</p>
              <Button onClick={fetchCoaFiles} variant="secondary" size="sm">
                Try Again
              </Button>
            </div>
          ) : filteredAndSortedFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-12 h-12 text-neutral-600 mb-4" />
              <p className="text-neutral-500 mb-2 product-text">No COA files found</p>
              <p className="text-neutral-600 text-sm mb-4 product-text">
                {filters.searchTerm || filters.dateRange !== 'all' || filters.sizeRange !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Upload some PDF files to get started'
                }
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="secondary"
                size="sm"
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Files
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
                  {selectedFiles.size === paginatedFiles.length ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  Select All ({paginatedFiles.length})
                </button>
              </div>

              {/* File Grid/List */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {paginatedFiles.map((file) => {
                    const isSelected = selectedFiles.has(file.name);
                    return (
                      <div
                        key={file.name}
                        className={`relative group cursor-pointer rounded-lg border transition-all ${
                          isSelected
                            ? 'border-blue-500/50 bg-blue-500/10'
                            : 'border-white/[0.04] hover:border-white/[0.08] hover:bg-neutral-800/20'
                        }`}
                      >
                        {/* Selection Checkbox */}
                        <div className="absolute top-2 left-2 z-10">
                          <button
                            onClick={() => handleFileSelect(file.name, !isSelected)}
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
                              handleSingleFileDelete(file.name);
                            }}
                            className="p-1 rounded bg-red-500/80 text-white hover:bg-red-500 transition-all"
                            title="Delete file"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {/* File Content */}
                        <div
                          onClick={() => handleFilePreview(file)}
                          className="p-4 pt-8"
                        >
                          <div className="aspect-square relative rounded flex items-center justify-center mb-3">
                            <img 
                              src="/logonew.png" 
                              alt="COA File" 
                              className="w-24 h-24 object-contain opacity-60 transition-all duration-300 group-hover:opacity-80 group-hover:scale-105"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                // Fallback to FileText icon
                                const parent = target.parentElement;
                                if (parent) {
                                  const fallback = document.createElement('div');
                                  fallback.innerHTML = '<svg class="w-12 h-12 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>';
                                  parent.appendChild(fallback);
                                }
                              }}
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-xs text-neutral-400 truncate font-normal product-text" title={file.name}>
                              {file.name.replace('.pdf', '')}
                            </p>
                            <p className="text-xs text-neutral-600 product-text">
                              {new Date(file.created_at).toLocaleDateString()}
                            </p>
                            {file.metadata?.size && (
                              <p className="text-xs text-neutral-600 product-text">
                                {formatFileSize(file.metadata.size)}
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
                  {/* Table Header - Match DataGrid header */}
                  <div className="sticky top-0 z-10 bg-neutral-800/80 backdrop-blur border-b border-white/[0.08]">
                    <div className="flex items-center gap-3 px-4 py-3 text-xs font-medium text-neutral-400 uppercase tracking-wider product-text">
                      {/* Select All */}
                      <div className="w-6 flex items-center justify-center">
                        <button
                          onClick={handleSelectAll}
                          className="w-4 h-4 flex items-center justify-center"
                        >
                          {selectedFiles.size === paginatedFiles.length ? (
                            <div className="w-4 h-4 bg-blue-500 rounded border-2 border-blue-500 flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                          ) : (
                            <div className="w-4 h-4 border-2 border-neutral-600 rounded hover:border-neutral-400 transition-colors" />
                          )}
                        </button>
                      </div>
                      
                      {/* File Type */}
                      <div className="w-6"></div>
                      
                      {/* File Name */}
                      <div className="flex-1 product-text">Name</div>
                      
                      {/* Created Date */}
                      <div className="w-32 text-right product-text">Created</div>
                      
                      {/* File Size */}
                      <div className="w-20 text-right product-text">Size</div>
                      
                      {/* Type */}
                      <div className="w-16 text-right product-text">Type</div>
                    </div>
                  </div>
                  
                  {paginatedFiles.map((file) => {
                    const isSelected = selectedFiles.has(file.name);
                    return (
                      <div
                        key={file.name}
                        className={`group transition-all mb-2 rounded-lg border-b border-white/[0.02] product-card cursor-pointer ${
                          isSelected
                            ? 'bg-neutral-800/50 border-l-4 border-l-blue-400 border border-blue-500/20'
                            : 'border border-white/[0.04] hover:border-white/[0.08] hover:bg-neutral-800/20'
                        }`}
                        onClick={() => handleFilePreview(file)}
                      >
                        <div className="flex items-center gap-3 px-4 py-3">
                          {/* Selection Checkbox */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFileSelect(file.name, !isSelected);
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

                          {/* File Type Icon */}
                          <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-neutral-500" />
                          </div>

                          {/* File Name - Main Column */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-neutral-400 truncate font-normal product-text" title={file.name}>
                              {file.name}
                            </p>
                          </div>

                          {/* Created Date */}
                          <div className="w-32 text-xs text-neutral-600 text-right product-text">
                            {new Date(file.created_at).toLocaleDateString()}
                          </div>

                          {/* File Size */}
                          <div className="w-20 text-xs text-neutral-600 text-right product-text">
                            {file.metadata?.size ? formatFileSize(file.metadata.size) : '-'}
                          </div>

                          {/* Status/Type */}
                          <div className="w-16 text-xs text-neutral-600 text-right product-text">
                            PDF
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSingleFileDelete(file.name);
                              }}
                              className="p-1.5 text-red-400 hover:text-red-300 transition-colors rounded hover:bg-red-500/20"
                              title="Delete file"
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
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/[0.04] text-sm bg-neutral-800/20">
            <div className="text-neutral-600 product-text">
              Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredAndSortedFiles.length)} of {filteredAndSortedFiles.length} files
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-2 text-neutral-500 hover:text-neutral-400 disabled:opacity-50 disabled:cursor-not-allowed rounded hover:bg-neutral-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="text-neutral-500 px-3 product-text">
                {currentPage} / {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
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

CoaModule.displayName = 'CoaModule';
