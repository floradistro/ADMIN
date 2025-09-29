import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, ZoomIn, Sun, Wand2, Loader2 } from 'lucide-react';

interface AITool {
  id: 'upscale' | 'relight' | 'reimagine';
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

interface AIToolsDropdownProps {
  selectedImages: string[]; // Array of image URLs
  onAIProcess: (imageUrls: string[], tool: 'upscale' | 'relight' | 'reimagine', options?: any) => Promise<void>;
  isProcessing?: boolean;
  processingProgress?: number;
  className?: string;
}

const AI_TOOLS: AITool[] = [
  {
    id: 'upscale',
    label: 'AI Upscale',
    description: 'Enhance image resolution and quality',
    icon: <ZoomIn className="w-4 h-4" />,
    color: 'purple'
  },
  {
    id: 'relight',
    label: 'AI Relight',
    description: 'Adjust lighting and shadows',
    icon: <Sun className="w-4 h-4" />,
    color: 'yellow'
  },
  {
    id: 'reimagine',
    label: 'AI Reimagine',
    description: 'Transform image style and appearance',
    icon: <Wand2 className="w-4 h-4" />,
    color: 'pink'
  }
];

export function AIToolsDropdown({ 
  selectedImages, 
  onAIProcess,
  isProcessing = false,
  processingProgress = 0,
  className = '' 
}: AIToolsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  const handleToolClick = useCallback(async (tool: 'upscale' | 'relight' | 'reimagine') => {
    if (selectedImages.length === 0 || isProcessing) return;

    setIsOpen(false);

    const options = tool === 'relight' ? { lightPosition: 'top' } : undefined;
    await onAIProcess(selectedImages, tool, options);
  }, [selectedImages, onAIProcess, isProcessing]);

  const getToolColorClasses = (color: string) => {
    switch (color) {
      case 'purple':
        return 'hover:bg-purple-500/20 text-purple-400 hover:text-purple-300';
      case 'yellow':
        return 'hover:bg-yellow-500/20 text-yellow-400 hover:text-yellow-300';
      case 'pink':
        return 'hover:bg-pink-500/20 text-pink-400 hover:text-pink-300';
      default:
        return 'hover:bg-neutral-700 text-neutral-400 hover:text-neutral-300';
    }
  };

  if (selectedImages.length === 0) {
    return null;
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* AI Tools dropdown trigger */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isProcessing}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.05] text-neutral-300 rounded-lg hover:bg-white/[0.08] transition text-xs border border-white/[0.08] disabled:opacity-50 font-tiempos"
        title={isProcessing ? `Processing... ${Math.round(processingProgress)}%` : `AI tools for ${selectedImages.length} images`}
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        {isProcessing ? `${Math.round(processingProgress)}%` : 'AI Tools'}
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
              <Sparkles className="w-5 h-5 text-neutral-400" />
              <h2 className="text-sm font-normal text-neutral-400 font-tiempos">AI Tools</h2>
            </div>
            
            <div className="text-xs text-neutral-500 mb-3 px-1 font-tiempos">
              Enhance {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''}
            </div>
            
            <div className="space-y-1">
              {AI_TOOLS.map((tool) => (
                <div 
                  key={tool.id}
                  className="group transition-all cursor-pointer border border-white/[0.04] rounded-lg bg-neutral-900/40 hover:bg-neutral-900/60"
                >
                  <button
                    onClick={() => handleToolClick(tool.id)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-left font-tiempos"
                  >
                    <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center transition-colors ${getToolColorClasses(tool.color)}`}>
                      {tool.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-neutral-400 text-xs font-tiempos">{tool.label}</div>
                    </div>
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-white/[0.08] mt-2 pt-2">
              <div className="text-xs text-neutral-500 px-1 font-tiempos">
                ✨ Select images from the media library first
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
