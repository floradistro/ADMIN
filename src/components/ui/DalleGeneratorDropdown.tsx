import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Wand2, Loader2, Download, Settings, Image as ImageIcon } from 'lucide-react';
import { Button } from './Button';

interface DalleGeneratorDropdownProps {
  onImageGenerated: (mediaItem: any) => void;
  className?: string;
}

interface GenerationSettings {
  size: '1024x1024' | '1792x1024' | '1024x1792';
  quality: 'standard' | 'hd';
  style: 'vivid' | 'natural';
}

interface GeneratedImage {
  url: string;
  revised_prompt?: string;
  original_prompt: string;
  size: string;
  quality: string;
  style: string;
  generated_at: string;
  index: number;
}

export function DalleGeneratorDropdown({ 
  onImageGenerated,
  className = '' 
}: DalleGeneratorDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<GenerationSettings>({
    size: '1024x1024',
    quality: 'standard',
    style: 'vivid'
  });
  const [error, setError] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<'left' | 'right'>('left');
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowSettings(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const dropdownWidth = 400; // w-96 = 24rem = 384px
      
      const spaceOnRight = viewportWidth - buttonRect.right;
      
      if (spaceOnRight >= dropdownWidth) {
        setDropdownPosition('left');
      } else {
        setDropdownPosition('right');
      }
    }
  }, [isOpen]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);

    try {
      const response = await fetch('/api/media/dalle-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          ...settings
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate image');
      }

      setGeneratedImages(data.images);
    } catch (error) {
      console.error('Generation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, settings, isGenerating]);

  const handleSaveToLibrary = useCallback(async (image: GeneratedImage) => {
    if (isSaving) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/media/save-dalle-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: image.url,
          prompt: image.original_prompt,
          revisedPrompt: image.revised_prompt,
          size: image.size,
          quality: image.quality,
          style: image.style
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to save image');
      }

      // Notify parent component of new media item
      onImageGenerated(data.media);

      // Reset state
      setGeneratedImages([]);
      setPrompt('');
      setIsOpen(false);

    } catch (error) {
      console.error('Save error:', error);
      setError(error instanceof Error ? error.message : 'Failed to save image to library');
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, onImageGenerated]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* DALL-E Generator trigger */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 rounded-lg hover:from-purple-500/30 hover:to-pink-500/30 transition text-xs border border-purple-500/20 hover:border-purple-400/30 font-tiempos"
        title="Generate images with DALL-E"
      >
        <Wand2 className="w-4 h-4" />
        DALL-E Generate
        <svg 
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div 
          className={`absolute ${dropdownPosition === 'left' ? 'left-0' : 'right-0'} top-full mt-1 w-96 bg-neutral-900/95 border border-white/[0.08] rounded-lg shadow-2xl backdrop-blur-sm z-50 overflow-hidden`}
        >
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Wand2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white font-tiempos">DALL-E Generator</h3>
                  <p className="text-xs text-neutral-400 font-tiempos">Create AI-generated images</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/[0.08] rounded-lg transition"
                title="Generation settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="mb-4 p-3 bg-neutral-800/50 rounded-lg border border-white/[0.05]">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1 font-tiempos">Size</label>
                    <select
                      value={settings.size}
                      onChange={(e) => setSettings(prev => ({ ...prev, size: e.target.value as any }))}
                      className="w-full bg-neutral-800 border border-white/[0.08] rounded px-2 py-1 text-xs text-white font-tiempos"
                    >
                      <option value="1024x1024">Square (1024x1024)</option>
                      <option value="1792x1024">Landscape (1792x1024)</option>
                      <option value="1024x1792">Portrait (1024x1792)</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1 font-tiempos">Quality</label>
                      <select
                        value={settings.quality}
                        onChange={(e) => setSettings(prev => ({ ...prev, quality: e.target.value as any }))}
                        className="w-full bg-neutral-800 border border-white/[0.08] rounded px-2 py-1 text-xs text-white font-tiempos"
                      >
                        <option value="standard">Standard</option>
                        <option value="hd">HD</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1 font-tiempos">Style</label>
                      <select
                        value={settings.style}
                        onChange={(e) => setSettings(prev => ({ ...prev, style: e.target.value as any }))}
                        className="w-full bg-neutral-800 border border-white/[0.08] rounded px-2 py-1 text-xs text-white font-tiempos"
                      >
                        <option value="vivid">Vivid</option>
                        <option value="natural">Natural</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Prompt Input */}
            <div className="mb-4">
              <label className="block text-xs text-neutral-400 mb-2 font-tiempos">Describe your image</label>
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="A majestic mountain landscape at sunset with vibrant colors..."
                className="w-full bg-neutral-800 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 resize-none min-h-[80px] max-h-[120px] focus:outline-none focus:border-purple-500/50 font-tiempos"
                maxLength={4000}
                disabled={isGenerating}
              />
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-neutral-500 font-tiempos">
                  {prompt.length}/4000 characters
                </span>
                <span className="text-xs text-neutral-500 font-tiempos">
                  ⌘+Enter to generate
                </span>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-xs text-red-400 font-tiempos">{error}</p>
              </div>
            )}

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="w-full mb-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white disabled:opacity-50 font-tiempos"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Image
                </>
              )}
            </Button>

            {/* Generated Images */}
            {generatedImages.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400 font-tiempos">Generated Images</span>
                </div>
                
                {generatedImages.map((image, index) => (
                  <div key={index} className="border border-white/[0.08] rounded-lg overflow-hidden bg-neutral-800/30">
                    <div className="aspect-square relative">
                      <img
                        src={image.url}
                        alt={image.revised_prompt || image.original_prompt}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      {image.revised_prompt && image.revised_prompt !== image.original_prompt && (
                        <p className="text-xs text-neutral-400 mb-2 font-tiempos">
                          <span className="text-neutral-500">Revised:</span> {image.revised_prompt}
                        </p>
                      )}
                      <Button
                        onClick={() => handleSaveToLibrary(image)}
                        disabled={isSaving}
                        className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-tiempos"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin mr-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Download className="w-3 h-3 mr-2" />
                            Save to Media Library
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
