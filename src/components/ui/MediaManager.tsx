'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Image as ImageIcon, Check, X, Loader2, ExternalLink, Edit2, Paperclip, Scissors, Sparkles, Sun, Wand2, ZoomIn } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { FileLibraryViewer } from './FileLibraryViewer';

interface MediaManagerProps {
  productId: number;
  productName: string;
  currentMedia?: string;
  currentMediaFilename?: string;
  onMediaChange?: (mediaUrl: string | null, filename: string | null) => void;
}

export function MediaManager({ 
  productId, 
  productName, 
  currentMedia, 
  currentMediaFilename,
  onMediaChange 
}: MediaManagerProps) {
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [attachedMedia, setAttachedMedia] = useState<string | null>(currentMedia || null);
  const [attachedMediaFilename, setAttachedMediaFilename] = useState<string | null>(currentMediaFilename || null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [showAIMenu, setShowAIMenu] = useState(false);
  
  const openMediaViewer = useCallback(() => {
    setShowMediaViewer(true);
    setSaveError(null);
  }, []);

  // Handle media file selection
  const handleMediaSelect = useCallback(async (media: any) => {
    setIsSaving(true);
    setSaveError(null);
    
    try {
      const mediaUrl = media.source_url || media.url;
      const mediaFilename = media.title || media.filename;
      
      console.log('Attaching Media:', {
        mediaFilename,
        mediaUrl: mediaUrl,
        mediaObject: media
      });
      
      // Update product meta_data with media attachment
      const response = await fetch(`/api/flora/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meta_data: [
            {
              key: '_product_media_attachment',
              value: mediaUrl
            },
            {
              key: '_product_media_filename',
              value: mediaFilename
            },
            {
              key: '_product_media_attached_at',
              value: new Date().toISOString()
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to save media:', errorText);
        throw new Error('Failed to save media attachment');
      }

      setAttachedMedia(mediaUrl);
      setAttachedMediaFilename(mediaFilename);
      onMediaChange?.(mediaUrl, mediaFilename);
      setShowMediaViewer(false);
      
    } catch (error) {
      console.error('Error saving media:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save media');
    } finally {
      setIsSaving(false);
    }
  }, [productId, onMediaChange]);

  // Handle media removal
  const handleRemoveMedia = useCallback(async () => {
    if (!confirm('Are you sure you want to remove the attached media?')) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    
    try {
      // Update product to remove media meta_data
      const response = await fetch(`/api/flora/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meta_data: [
            {
              key: '_product_media_attachment',
              value: ''
            },
            {
              key: '_product_media_filename',
              value: ''
            },
            {
              key: '_product_media_attached_at',
              value: ''
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to remove media attachment');
      }

      setAttachedMedia(null);
      setAttachedMediaFilename(null);
      onMediaChange?.(null, null);
      
    } catch (error) {
      console.error('Error removing media:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to remove media');
    } finally {
      setIsSaving(false);
    }
  }, [productId, onMediaChange]);

  // Open media in new tab
  const openMediaInNewTab = useCallback(() => {
    if (attachedMedia) {
      console.log('Opening media URL:', attachedMedia);
      window.open(attachedMedia, '_blank', 'noopener,noreferrer');
    }
  }, [attachedMedia]);

  // Handle AI Upscale
  const handleAIUpscale = useCallback(async () => {
    if (!attachedMedia) return;
    
    if (!confirm('Upscale the attached image to 4K resolution? This will replace the current image.')) {
      return;
    }

    setIsUpscaling(true);
    setSaveError(null);
    setShowAIMenu(false);
    
    try {
      console.log('Starting AI upscale for attached media:', attachedMedia);
      
      const response = await fetch('/api/media/ai-upscale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          imageUrl: attachedMedia,
          targetWidth: 2048,
          targetHeight: 2048
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(`AI upscale failed: ${result.error}`);
      }
      
      console.log('AI upscale completed:', result.data);
      
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
      
      // Update product with new media
      const newMediaUrl = uploadResult.data.source_url || uploadResult.data.url;
      const updateResponse = await fetch(`/api/flora/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meta_data: [
            { key: '_product_media_attachment', value: newMediaUrl },
            { key: '_product_media_filename', value: result.data.processedFilename },
            { key: '_product_media_attached_at', value: new Date().toISOString() }
          ]
        })
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update product with upscaled media');
      }

      setAttachedMedia(newMediaUrl);
      setAttachedMediaFilename(result.data.processedFilename);
      onMediaChange?.(newMediaUrl, result.data.processedFilename);
      
    } catch (error) {
      console.error('AI upscale error:', error);
      setSaveError(error instanceof Error ? error.message : 'AI upscale failed');
    } finally {
      setIsUpscaling(false);
    }
  }, [attachedMedia, productId, onMediaChange]);
  
  // Initialize media from props
  useEffect(() => {
    setAttachedMedia(currentMedia || null);
    setAttachedMediaFilename(currentMediaFilename || null);
    console.log('Media initialized/updated:', { 
      mediaUrl: currentMedia, 
      filename: currentMediaFilename
    });
  }, [currentMedia, currentMediaFilename]);

  // Handle body scroll lock when media viewer is open
  useEffect(() => {
    if (showMediaViewer) {
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
  }, [showMediaViewer]);

  return (
    <>
      {/* Product Media Section - Image Display */}
      <div className="border border-white/[0.04] rounded p-3 relative">
        {/* Header with title and edit icon */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-neutral-600 text-xs font-medium">Product Media</div>
          <div className="flex items-center gap-2">
            {attachedMedia && (
              <>
                <button
                  onClick={handleAIUpscale}
                  disabled={isSaving || isUpscaling}
                  className="p-1 hover:bg-purple-500/20 rounded transition-colors text-purple-400 hover:text-purple-300 disabled:opacity-50"
                  title={isUpscaling ? "Upscaling..." : "AI Upscale to 4K"}
                >
                  {isUpscaling ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <ZoomIn className="w-3 h-3" />
                  )}
                </button>
                <button
                  onClick={handleRemoveMedia}
                  disabled={isSaving || isUpscaling}
                  className="p-1 hover:bg-red-500/20 rounded transition-colors text-red-400 hover:text-red-300 disabled:opacity-50"
                  title="Remove Media"
                >
                  <X className="w-3 h-3" />
                </button>
              </>
            )}
            <button
              onClick={openMediaViewer}
              disabled={isSaving}
              className="p-1 hover:bg-white/5 rounded transition-colors text-neutral-600 hover:text-neutral-400 disabled:opacity-50"
              title={attachedMedia ? "Change Media" : "Attach Media"}
            >
              {isSaving ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : attachedMedia ? (
                <Edit2 className="w-3 h-3" />
              ) : (
                <Paperclip className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>
        
        {/* Media Display - Centered */}
        <div className="flex items-center justify-center py-6">
          {attachedMedia ? (
            <div 
              className="cursor-pointer group relative flex items-center justify-center"
              onClick={openMediaInNewTab}
              title="Click to view full size"
            >
              {/* Media Image with dark theme */}
              <div className="relative bg-neutral-900 p-4 rounded border border-white/[0.06]">
                <div className="rounded overflow-hidden">
                  <img
                    src={attachedMedia}
                    alt={attachedMediaFilename || 'Product Media'}
                    className="w-40 h-40 object-cover rounded transition-all duration-300 group-hover:scale-105"
                    onError={() => setImageLoadError(true)}
                    onLoad={() => setImageLoadError(false)}
                    style={{ display: imageLoadError ? 'none' : 'block' }}
                  />
                  {imageLoadError && (
                    <div className="w-40 h-40 flex items-center justify-center bg-neutral-800 rounded">
                      <ImageIcon className="w-16 h-16 text-neutral-600" />
                    </div>
                  )}
                </div>
                
                {/* Subtle hover effect */}
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 rounded-lg transition-all" />
              </div>
            </div>
          ) : (
            /* Empty state - centered placeholder */
            <div className="w-[192px] h-[192px] bg-neutral-900/50 rounded border border-white/[0.04] flex items-center justify-center">
              <div className="text-center">
                <div className="mb-2">
                  <ImageIcon className="w-14 h-14 text-neutral-600 mx-auto" />
                </div>
                <p className="text-xs text-neutral-600">No Media</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Media filename display */}
        {attachedMediaFilename && (
          <div className="mt-2 p-2 bg-neutral-900 rounded border border-white/[0.02]">
            <p className="text-xs text-neutral-600 mb-1">Filename:</p>
            <p className="text-xs text-neutral-500 break-all">
              {attachedMediaFilename}
            </p>
          </div>
        )}

        {/* Error message */}
        {saveError && (
          <div className="mt-2 p-2 bg-red-900/20 border border-red-800/30 rounded">
            <p className="text-xs text-red-400">{saveError}</p>
          </div>
        )}
      </div>

      {/* Media Viewer Modal */}
      {showMediaViewer && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowMediaViewer(false)}
        >
           <div 
             className="w-full max-w-2xl max-h-[70vh] animate-in zoom-in-95 duration-200"
             onClick={(e) => e.stopPropagation()}
           >
             <FileLibraryViewer
               isOpen={showMediaViewer}
               onClose={() => setShowMediaViewer(false)}
               mode="media"
               onSelect={handleMediaSelect}
               productId={productId}
               productName={productName}
             />
          </div>
        </div>
      )}
    </>
  );
}
