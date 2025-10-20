'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Check, X, Loader2, ExternalLink, Edit2, Paperclip } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { FileLibraryViewer } from './FileLibraryViewer';

// Correct Supabase configuration
const SUPABASE_URL = 'https://elhsobjvwmjfminxxcwy.supabase.co';

interface CoaManagerProps {
  productId: number;
  productName: string;
  currentCoa?: string;
  currentCoaFilename?: string;
  onCoaChange?: (coaUrl: string | null, filename: string | null) => void;
}

export function CoaManager({ 
  productId, 
  productName, 
  currentCoa, 
  currentCoaFilename,
  onCoaChange 
}: CoaManagerProps) {
  const [showCoaViewer, setShowCoaViewer] = useState(false);
  const [attachedCoa, setAttachedCoa] = useState<string | null>(currentCoa || null);
  const [attachedCoaFilename, setAttachedCoaFilename] = useState<string | null>(currentCoaFilename || null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pdfLoadError, setPdfLoadError] = useState(false);
  
  // Generate Quantix Analytics URL from filename
  const getQuantixUrl = (filename: string | null) => {
    if (!filename) return null;
    // Remove .pdf extension if present
    const nameWithoutExtension = filename.replace(/\.pdf$/i, '');
    return `https://www.quantixanalytics.com/coa/${nameWithoutExtension}`;
  };

  const openCoaViewer = useCallback(() => {
    setShowCoaViewer(true);
    setSaveError(null);
  }, []);

  // Handle COA file selection
  const handleCoaSelect = useCallback(async (file: any) => {
    setIsSaving(true);
    setSaveError(null);
    
    try {
      // Construct the public URL for the COA PDF
      // Ensure the URL is properly formatted for Supabase public access
      const fileName = file.name || file;
      const coaUrl = `${SUPABASE_URL}/storage/v1/object/public/coas/pdfs/${encodeURIComponent(fileName)}`;
      const quantixUrl = getQuantixUrl(fileName);
      
      console.log('Attaching COA:', {
        fileName,
        pdfUrl: coaUrl,
        quantixUrl: quantixUrl,
        fileObject: file
      });
      
      // Update product meta_data with COA attachment
      const response = await fetch(`/api/flora/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meta_data: [
            {
              key: '_coa_attachment',
              value: coaUrl
            },
            {
              key: '_coa_filename',
              value: fileName
            },
            {
              key: '_coa_attached_at',
              value: new Date().toISOString()
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to save COA:', errorText);
        throw new Error('Failed to save COA attachment');
      }

      setAttachedCoa(coaUrl);
      setAttachedCoaFilename(fileName);
      onCoaChange?.(coaUrl, fileName);
      setShowCoaViewer(false);
      
    } catch (error) {
      console.error('Error saving COA:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save COA');
    } finally {
      setIsSaving(false);
    }
  }, [productId, onCoaChange]);

  // Handle COA removal
  const handleRemoveCoa = useCallback(async () => {
    if (!confirm('Are you sure you want to remove the attached COA?')) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    
    try {
      // Update product to remove COA meta_data
      const response = await fetch(`/api/flora/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meta_data: [
            {
              key: '_coa_attachment',
              value: ''
            },
            {
              key: '_coa_filename',
              value: ''
            },
            {
              key: '_coa_attached_at',
              value: ''
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to remove COA attachment');
      }

      setAttachedCoa(null);
      setAttachedCoaFilename(null);
      onCoaChange?.(null, null);
      
    } catch (error) {
      console.error('Error removing COA:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to remove COA');
    } finally {
      setIsSaving(false);
    }
  }, [productId, onCoaChange]);

  // Open COA in new tab - opens Quantix Analytics page
  const openCoaInNewTab = useCallback(() => {
    const quantixUrl = getQuantixUrl(attachedCoaFilename);
    if (quantixUrl) {
      console.log('Opening Quantix URL:', quantixUrl);
      window.open(quantixUrl, '_blank', 'noopener,noreferrer');
    }
  }, [attachedCoaFilename]);
  
  // Initialize COA from props
  useEffect(() => {
    setAttachedCoa(currentCoa || null);
    setAttachedCoaFilename(currentCoaFilename || null);
    const quantixUrl = getQuantixUrl(currentCoaFilename || null);
    // Removed console.log to prevent spam in console
  }, [currentCoa, currentCoaFilename]);

  // Handle body scroll lock when COA viewer is open
  useEffect(() => {
    if (showCoaViewer) {
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
  }, [showCoaViewer]);

  return (
    <>
      {/* Lab Testing Section - Minimal QR Code Display */}
      <div className="border border-white/[0.04] rounded p-3 relative">
        {/* Header with title and edit icon */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-neutral-600 text-xs font-medium">Lab Testing</div>
          <button
            onClick={openCoaViewer}
            disabled={isSaving}
            className="p-1 hover:bg-white/5 rounded transition-colors text-neutral-600 hover:text-neutral-400 disabled:opacity-50"
            title={attachedCoa ? "Edit COA" : "Attach COA"}
          >
            {isSaving ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : attachedCoa ? (
              <Edit2 className="w-3 h-3" />
            ) : (
              <Paperclip className="w-3 h-3" />
            )}
          </button>
        </div>
        
        {/* QR Code Only Display - Centered */}
        <div className="flex items-center justify-center py-6">
          {attachedCoaFilename ? (
            <div 
              className="cursor-pointer group relative flex items-center justify-center"
              onClick={openCoaInNewTab}
              title="Scan QR to verify on Quantix Analytics"
            >
              {/* Dark themed QR Code with subtle logo */}
              <div className="relative bg-neutral-900 p-4 rounded border border-white/[0.06]">
                <div className="rounded overflow-hidden">
                  <QRCodeSVG 
                    value={getQuantixUrl(attachedCoaFilename) || ''}
                    size={160}
                    level="H"
                    fgColor="#d4d4d4"
                    bgColor="#171717"
                    includeMargin={false}
                  />
                </div>
                
                {/* Prominent logo overlay in center */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <img 
                    src="/logo.png" 
                    alt="Flora Logo" 
                    className="w-20 h-20 object-contain transition-all duration-500"
                  />
                </div>
              </div>
              
              {/* Subtle hover effect */}
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 rounded-lg transition-all" />
            </div>
          ) : (
            /* Empty state - centered placeholder */
            <div className="w-[192px] h-[192px] bg-neutral-900/50 rounded border border-white/[0.04] flex items-center justify-center">
              <div className="text-center">
                <div className="mb-2">
                  <img 
                    src="/logo.png" 
                    alt="Flora Logo" 
                    className="w-14 h-14 object-contain transition-all duration-500 mx-auto"
                  />
                </div>
                <p className="text-xs text-neutral-600">No COA</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Debug: Show Quantix URL in development */}
        {process.env.NODE_ENV === 'development' && attachedCoaFilename && (
          <div className="mt-2 p-2 bg-neutral-900 rounded border border-white/[0.02]">
            <p className="text-xs text-neutral-600 mb-1">Quantix URL:</p>
            <p className="text-xs text-neutral-500 break-all font-mono">
              {getQuantixUrl(attachedCoaFilename)}
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

      {/* COA Viewer Modal */}
      {showCoaViewer && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowCoaViewer(false)}
        >
           <div 
             className="w-full max-w-2xl max-h-[70vh] animate-in zoom-in-95 duration-200"
             onClick={(e) => e.stopPropagation()}
           >
             <FileLibraryViewer
               isOpen={showCoaViewer}
               onClose={() => setShowCoaViewer(false)}
               mode="coa"
               onSelect={handleCoaSelect}
               productId={productId}
               productName={productName}
             />
          </div>
        </div>
      )}
    </>
  );
}