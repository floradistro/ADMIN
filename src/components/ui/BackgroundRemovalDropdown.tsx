import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Scissors, Loader2 } from 'lucide-react';

interface BackgroundRemovalAction {
  id: 'standard' | 'high-quality';
  label: string;
  description: string;
  quality: 'auto' | 'full';
}

interface BackgroundRemovalDropdownProps {
  selectedImages: string[]; // Array of image URLs
  onRemoveBackground: (imageUrls: string[], quality: 'auto' | 'full') => Promise<void>;
  className?: string;
}

const REMOVAL_ACTIONS: BackgroundRemovalAction[] = [
  {
    id: 'standard',
    label: 'Standard Quality',
    description: 'Fast processing for most images',
    quality: 'auto'
  },
  {
    id: 'high-quality',
    label: 'High Quality',
    description: 'Better results for complex images',
    quality: 'full'
  }
];

export function BackgroundRemovalDropdown({ 
  selectedImages, 
  onRemoveBackground,
  className = '' 
}: BackgroundRemovalDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState<'left' | 'right'>('left');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown when no images selected
  useEffect(() => {
    if (selectedImages.length === 0) {
      setIsOpen(false);
    }
  }, [selectedImages]);

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const dropdownWidth = 256; // w-64 = 16rem = 256px
      
      // Check if there's enough space on the right
      const spaceOnRight = viewportWidth - buttonRect.right;
      
      if (spaceOnRight >= dropdownWidth) {
        setDropdownPosition('left'); // Dropdown opens to the right of button
      } else {
        setDropdownPosition('right'); // Dropdown opens to the left of button
      }
    }
  }, [isOpen]);

  const handleRemovalClick = useCallback(async (quality: 'auto' | 'full') => {
    if (selectedImages.length === 0 || isProcessing) return;

    setIsProcessing(true);
    setProgress(0);
    setIsOpen(false);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      await onRemoveBackground(selectedImages, quality);

      clearInterval(progressInterval);
      setProgress(100);
      
      // Reset after a short delay
      setTimeout(() => {
        setProgress(0);
        setIsProcessing(false);
      }, 1000);
    } catch (error) {
      console.error('Background removal failed:', error);
      setProgress(0);
      setIsProcessing(false);
    }
  }, [selectedImages, onRemoveBackground, isProcessing]);

  if (selectedImages.length === 0) {
    return null;
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Background removal dropdown trigger */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isProcessing}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.05] text-neutral-300 rounded-lg hover:bg-white/[0.08] transition text-xs border border-white/[0.08] disabled:opacity-50 font-tiempos"
        title={isProcessing ? `Removing background... ${Math.round(progress)}%` : `Remove background from ${selectedImages.length} images`}
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Scissors className="w-4 h-4" />
        )}
        {isProcessing ? `${Math.round(progress)}%` : 'Remove BG'}
        {!isProcessing && (
          <svg 
            className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && !isProcessing && (
        <div 
          className={`absolute ${dropdownPosition === 'left' ? 'left-0' : 'right-0'} top-full mt-1 w-64 bg-neutral-900/95 border border-white/[0.08] rounded-lg shadow-2xl backdrop-blur-sm z-50 overflow-hidden`}
        >
          <div className="p-2">
            <div className="flex items-center gap-3 mb-2">
              <Scissors className="w-5 h-5 text-neutral-400" />
              <h2 className="text-sm font-normal text-neutral-400 font-tiempos">Remove Background</h2>
            </div>
            
            <div className="text-xs text-neutral-500 mb-3 px-1 font-tiempos">
              Processing {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''}
            </div>
            
            <div className="space-y-1">
              {REMOVAL_ACTIONS.map((action) => (
                <div 
                  key={action.id}
                  className="group transition-all cursor-pointer border border-white/[0.04] rounded-lg bg-neutral-900/40 hover:bg-neutral-900/60"
                >
                  <button
                    onClick={() => handleRemovalClick(action.quality)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-left font-tiempos"
                  >
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-neutral-600 hover:text-neutral-400">
                      <Scissors className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-neutral-400 text-xs font-tiempos">{action.label}</div>
                      <div className="text-xs text-neutral-500 mt-0.5 font-tiempos">{action.description}</div>
                    </div>
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-white/[0.08] mt-2 pt-2">
              <div className="text-xs text-neutral-500 px-1 font-tiempos">
                💡 Select images from the media library first
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
