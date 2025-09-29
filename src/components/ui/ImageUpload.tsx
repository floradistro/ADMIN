'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Edit2, FolderOpen } from 'lucide-react';
import Image from 'next/image';
import { Button } from './Button';
import { FileLibraryViewer } from './FileLibraryViewer';

interface ImageUploadProps {
  productId?: number;
  currentImage?: string;
  onImageUploaded?: (imageUrl: string, mediaId: number) => void;
  onError?: (error: string) => void;
  onRemove?: () => void;
  className?: string;
  disabled?: boolean;
}

export function ImageUpload({ 
  productId, 
  currentImage, 
  onImageUploaded, 
  onError, 
  onRemove,
  className = '',
  disabled = false 
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const [isHovered, setIsHovered] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [currentMediaId, setCurrentMediaId] = useState<number | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file || disabled) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      onError?.('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      onError?.('File too large. Maximum size is 10MB.');
      return;
    }

    setIsUploading(true);

    try {
      // Create preview URL
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      const formData = new FormData();
      formData.append('file', file);
      if (productId) {
        formData.append('productId', productId.toString());
      }

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      
      if (result.success && result.media) {
        setPreviewUrl(result.media.url);
        onImageUploaded?.(result.media.url, result.media.id);
      } else {
        throw new Error('Upload failed - no media data received');
      }
    } catch (error) {
      console.error('Upload error:', error);
      onError?.(error instanceof Error ? error.message : 'Upload failed');
      // Reset preview on error
      setPreviewUrl(currentImage || null);
    } finally {
      setIsUploading(false);
    }
  }, [productId, onImageUploaded, onError, disabled, currentImage]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, [disabled]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload, disabled]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  }, [handleFileUpload, disabled]);

  const openFileDialog = useCallback(() => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  }, [disabled, isUploading]);

  const removeImage = useCallback(() => {
    if (disabled || isUploading) return;
    setPreviewUrl(null);
    setCurrentMediaId(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onRemove?.();
  }, [disabled, isUploading, onRemove]);

  const handleMediaLibrarySelect = useCallback((media: any) => {
    setPreviewUrl(media.source_url);
    setCurrentMediaId(media.id);
    onImageUploaded?.(media.source_url, media.id);
    setShowMediaLibrary(false);
  }, [onImageUploaded]);

  const openMediaLibrary = useCallback(() => {
    if (disabled || isUploading) return;
    setShowMediaLibrary(true);
  }, [disabled, isUploading]);

  // Handle body scroll lock when media library is open
  useEffect(() => {
    if (showMediaLibrary) {
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      // Prevent scroll events
      const preventScroll = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      };

      // Add event listeners to prevent all forms of scrolling
      document.addEventListener('wheel', preventScroll, { passive: false });
      document.addEventListener('touchmove', preventScroll, { passive: false });
      document.addEventListener('scroll', preventScroll, { passive: false });

      return () => {
        // Restore body scroll
        document.body.style.overflow = 'unset';
        document.documentElement.style.overflow = 'unset';
        
        // Remove event listeners
        document.removeEventListener('wheel', preventScroll);
        document.removeEventListener('touchmove', preventScroll);
        document.removeEventListener('scroll', preventScroll);
      };
    }
  }, [showMediaLibrary]);

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
      
      {previewUrl ? (
        <div 
          className="relative group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
           <div className="relative w-64 h-64 rounded-lg overflow-hidden shadow-lg shadow-black/20">
             <Image
               src={previewUrl}
               alt="Product image"
               fill
               sizes="256px"
               className="object-cover drop-shadow-sm"
              onError={() => {
                setPreviewUrl(null);
                onError?.('Failed to load image');
              }}
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>
          
          {/* Action buttons - only visible on hover */}
          {!disabled && !isUploading && isHovered && (
            <div className="absolute -top-2 -right-2 flex gap-1 animate-in fade-in-0 duration-200">
              <button
                onClick={openFileDialog}
                className="p-1.5 bg-neutral-800/90 backdrop-blur-sm rounded-full text-neutral-400 hover:text-blue-400 hover:bg-neutral-700/90 transition-all shadow-lg"
                title="Upload new image"
              >
                <Upload className="w-4 h-4" />
              </button>
              <button
                onClick={openMediaLibrary}
                className="p-1.5 bg-neutral-800/90 backdrop-blur-sm rounded-full text-neutral-400 hover:text-green-400 hover:bg-neutral-700/90 transition-all shadow-lg"
                title="Browse media library"
              >
                <FolderOpen className="w-4 h-4" />
              </button>
              <button
                onClick={removeImage}
                className="p-1.5 bg-neutral-800/90 backdrop-blur-sm rounded-full text-neutral-400 hover:text-red-400 hover:bg-neutral-700/90 transition-all shadow-lg"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          <div
            className={`
              w-64 h-64 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all
              ${dragActive ? 'border-blue-400 bg-blue-900/20' : 'border-neutral-600 hover:border-neutral-500'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              ${isUploading ? 'border-blue-400 bg-blue-900/20' : ''}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={openFileDialog}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin mb-2" />
                <span className="text-xs text-neutral-400">Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-6 h-6 text-neutral-400 mb-2" />
                <span className="text-xs text-neutral-400 text-center">
                  Upload Image
                </span>
                <span className="text-xs text-neutral-500 text-center mt-1">
                  Drag & drop or click
                </span>
              </>
            )}
          </div>
          
          {/* Media Library Button - Top Right Corner */}
          {!disabled && !isUploading && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openMediaLibrary();
              }}
              className="absolute -top-2 -right-2 p-1.5 bg-neutral-800/90 backdrop-blur-sm rounded-full text-neutral-400 hover:text-green-400 hover:bg-neutral-700/90 transition-all shadow-lg"
              title="Browse media library"
            >
              <FolderOpen className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
      
      {/* Media Library Selector - Modal Overlay */}
      {showMediaLibrary && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowMediaLibrary(false)}
        >
          <div 
            className="w-full max-w-4xl max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <FileLibraryViewer
              isOpen={showMediaLibrary}
              onClose={() => setShowMediaLibrary(false)}
              mode="media"
              onSelect={handleMediaLibrarySelect}
              selectedMediaId={currentMediaId}
            />
          </div>
        </div>
      )}
    </div>
  );
}