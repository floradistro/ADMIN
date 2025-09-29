import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { Modal } from './Modal';

interface JsonPopoutProps {
  isOpen: boolean;
  onClose: () => void;
  value: any;
  onChange: (value: any) => void;
  title?: string;
  placeholder?: string;
  className?: string;
  loading?: boolean;
  successMessage?: string;
  viewMode?: boolean;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  style?: 'dashboard' | 'terminal';
}

export const JsonPopout: React.FC<JsonPopoutProps> = ({
  isOpen,
  onClose,
  value,
  onChange,
  title = 'JSON Editor',
  placeholder = 'Enter JSON...',
  className = '',
  loading = false,
  successMessage = '',
  viewMode = false,
  size = 'large',
  style = 'dashboard'
}) => {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      if (value && (Array.isArray(value) || Object.keys(value).length > 0)) {
        setJsonText(JSON.stringify(value, null, 2));
      } else {
        setJsonText('');
      }
      setError(null);
      setIsValid(true);
    } catch (err) {
      setJsonText('');
      setError('Invalid JSON input');
      setIsValid(false);
    }
  }, [value]);

  const updateCursorPosition = () => {
    if (textareaRef.current && style === 'terminal') {
      const textarea = textareaRef.current;
      const text = textarea.value;
      const cursorIndex = textarea.selectionStart;
      
      const lines = text.substring(0, cursorIndex).split('\n');
      const line = lines.length;
      const col = lines[lines.length - 1].length + 1;
      
      setCursorPosition({ line, col });
    }
  };

  const handleTextChange = (text: string) => {
    setJsonText(text);
    
    if (!text.trim()) {
      setError(null);
      setIsValid(true);
      return;
    }
    
    try {
      const parsed = JSON.parse(text);
      setError(null);
      setIsValid(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON');
      setIsValid(false);
    }
  };

  const handleSave = () => {
    if (!isValid) return;
    
    try {
      if (!jsonText.trim()) {
        onChange([]);
        if (!viewMode) {
          onClose();
        }
        return;
      }
      
      const parsed = JSON.parse(jsonText);
      onChange(parsed);
      if (!viewMode) {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  };

  const handleCopyToClipboard = async () => {
    if (!isValid) return;
    
    try {
      const textToCopy = jsonText.trim() || '[]';
      await navigator.clipboard.writeText(textToCopy);
    } catch (err) {
    }
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonText(formatted);
      setError(null);
      setIsValid(true);
    } catch (err) {
      // Keep current text if parsing fails
    }
  };

  const handleMinify = () => {
    if (style === 'terminal') {
      try {
        const parsed = JSON.parse(jsonText);
        const minified = JSON.stringify(parsed);
        setJsonText(minified);
        setError(null);
        setIsValid(true);
      } catch (err) {
        // Keep current text if parsing fails
      }
    }
  };

  const getLineNumbers = () => {
    const lines = jsonText.split('\n');
    return lines.map((_, index) => index + 1);
  };

  // Dashboard Style Content
  const renderDashboardContent = () => (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Editor Container */}
      <div className="relative flex-1 min-h-0">
        <textarea
          ref={textareaRef}
          value={jsonText}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={jsonText ? '' : placeholder}
          className={`
            w-full h-80 sm:h-96 px-3 py-2 bg-neutral-900/50 border rounded-md text-neutral-300 text-sm
            font-mono leading-relaxed resize-none focus:outline-none focus:ring-1 pl-10
            scrollable-container
            ${isValid 
              ? 'border-white/[0.08] focus:border-emerald-500/50 focus:ring-emerald-500/20' 
              : 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
            }
          `}
          spellCheck={false}
        />
        
        {/* Line numbers overlay */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-neutral-900/70 border-r border-white/[0.04] pointer-events-none rounded-l-md">
          <div className="pt-2 px-1 text-neutral-600 text-xs font-mono leading-relaxed">
            {jsonText.split('\n').map((_, index) => (
              <div key={index} className="text-right">
                {index + 1}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Messages Container - Scrollable */}
      <div className="flex-shrink-0">
        {/* Error Display */}
        {error && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Success Display */}
        {successMessage && (
          <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {successMessage}
            </div>
          </div>
        )}
      </div>

      {/* Status and Actions - Fixed at bottom */}
      <div className="flex-shrink-0 mt-4 pt-4 border-t border-white/[0.04] bg-neutral-900/95 -mx-3 sm:-mx-4 px-3 sm:px-4 sticky bottom-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Validation Status */}
            <div className="flex items-center gap-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${isValid ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
              <span className={isValid ? 'text-emerald-400' : 'text-red-400'}>
                {isValid ? 'Valid JSON' : 'Invalid JSON'}
              </span>
            </div>
            
            {/* Character Count */}
            <div className="text-xs text-neutral-500">
              {jsonText.length} characters
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={handleFormat}
              size="sm"
              variant="ghost"
              className="text-xs text-neutral-400 hover:text-neutral-300"
            >
              Format
            </Button>
            
            <Button
              onClick={onClose}
              size="sm"
              variant="secondary"
              className="text-xs"
            >
              {viewMode ? 'Close' : 'Cancel'}
            </Button>
            
            {viewMode ? (
              <Button
                onClick={handleCopyToClipboard}
                size="sm"
                variant="primary"
                disabled={!isValid}
                className="text-xs"
              >
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="hidden sm:inline">Copy JSON</span>
                  <span className="sm:hidden">Copy</span>
                </div>
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                size="sm"
                variant="primary"
                disabled={!isValid || loading}
                className="text-xs"
              >
                {loading ? (
                  <div className="flex items-center gap-1">
                    <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="hidden sm:inline">Saving...</span>
                    <span className="sm:hidden">Save...</span>
                  </div>
                ) : successMessage ? (
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="hidden sm:inline">Previewed!</span>
                    <span className="sm:hidden">Done!</span>
                  </div>
                ) : (
                  <>
                    <span className="hidden sm:inline">Preview Changes</span>
                    <span className="sm:hidden">Preview</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Terminal Style Content
  const renderTerminalContent = () => (
    <div className={`bg-black border border-green-500/30 rounded-lg overflow-hidden shadow-2xl shadow-green-500/10 flex flex-col h-full ${className}`}>
      {/* Terminal Header */}
      <div className="bg-neutral-900 border-b border-green-500/30 px-3 sm:px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Terminal Traffic Lights */}
            <div className="flex gap-1.5 flex-shrink-0">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500/80"></div>
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500/80"></div>
            </div>
            
            {/* Terminal Title */}
            <div className="flex items-center gap-1 sm:gap-2 text-green-400 font-mono text-xs sm:text-sm min-w-0">
              <span className="text-green-500">●</span>
              <span className="hidden sm:inline">portal2@flora-api:~$</span>
              <span className="sm:hidden">$</span>
              <span className="text-neutral-400 truncate">{title}</span>
            </div>
          </div>

          {/* Terminal Controls */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Button
              onClick={handleFormat}
              size="sm"
              variant="ghost"
              className="text-xs text-green-400 hover:text-green-300 hover:bg-green-500/10 px-1 sm:px-2 py-1 font-mono"
            >
              format
            </Button>
            <Button
              onClick={handleMinify}
              size="sm"
              variant="ghost"
              className="text-xs text-green-400 hover:text-green-300 hover:bg-green-500/10 px-1 sm:px-2 py-1 font-mono"
            >
              minify
            </Button>
          </div>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="bg-black relative flex-1 min-h-0">
        <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-12 bg-neutral-950 border-r border-green-500/20 pointer-events-none z-10">
          <div className="pt-3 px-1 sm:px-2 text-green-600/60 text-xs font-mono leading-6">
            {getLineNumbers().map((lineNum) => (
              <div key={lineNum} className="text-right">
                {lineNum}
              </div>
            ))}
          </div>
        </div>
        
        <textarea
          ref={textareaRef}
          value={jsonText}
          onChange={(e) => {
            handleTextChange(e.target.value);
            updateCursorPosition();
          }}
          onKeyUp={updateCursorPosition}
          onMouseUp={updateCursorPosition}
          placeholder={jsonText ? '' : placeholder}
          className={`
            w-full h-full resize-none bg-transparent text-green-400 font-mono text-sm
            leading-6 focus:outline-none border-none pl-10 sm:pl-14 pr-2 sm:pr-4 py-3
            placeholder-green-600/40 scrollable-container
            ${!isValid ? 'text-red-400' : ''}
          `}
          style={{
            caretColor: '#22c55e',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
          }}
          spellCheck={false}
        />
      </div>

      {/* Terminal Footer - Fixed at bottom */}
      <div className="bg-neutral-900 border-t border-green-500/30 px-3 sm:px-4 py-2 flex-shrink-0">
        {/* Error Display */}
        {error && (
          <div className="mb-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-red-500">✗</span>
              <span className="break-all">{error}</span>
            </div>
          </div>
        )}

        {/* Success Display */}
        {successMessage && (
          <div className="mb-2 p-2 bg-green-500/10 border border-green-500/30 rounded text-green-400 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>{successMessage}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          {/* Status Line */}
          <div className="flex items-center gap-2 sm:gap-4 text-xs font-mono flex-wrap">
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isValid ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={isValid ? 'text-green-400' : 'text-red-400'}>
                {isValid ? 'JSON_VALID' : 'JSON_ERROR'}
              </span>
            </div>
            <div className="text-neutral-500">
              Ln {cursorPosition.line}, Col {cursorPosition.col}
            </div>
            <div className="text-neutral-600">
              {jsonText.length} chars
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={onClose}
              size="sm"
              variant="ghost"
              className="text-xs font-mono text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800"
            >
              {viewMode ? 'exit' : 'cancel'}
            </Button>
            
            {viewMode ? (
              <Button
                onClick={handleCopyToClipboard}
                size="sm"
                variant="ghost"
                disabled={!isValid}
                className="text-xs font-mono text-green-400 hover:text-green-300 hover:bg-green-500/10"
              >
                <div className="flex items-center gap-1">
                  <span>copy</span>
                </div>
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                size="sm"
                variant="ghost"
                disabled={!isValid || loading}
                className="text-xs font-mono text-green-400 hover:text-green-300 hover:bg-green-500/10"
              >
                {loading ? (
                  <div className="flex items-center gap-1">
                    <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>saving...</span>
                  </div>
                ) : successMessage ? (
                  <div className="flex items-center gap-1">
                    <span className="text-green-500">✓</span>
                    <span>saved</span>
                  </div>
                ) : (
                  'save'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
    >
      {style === 'terminal' ? renderTerminalContent() : renderDashboardContent()}
    </Modal>
  );
};

// Code icon component for triggering JSON popouts
export const JsonIcon: React.FC<{ 
  onClick: () => void;
  className?: string;
  title?: string;
  style?: 'dashboard' | 'terminal';
}> = ({ onClick, className = '', title = 'Edit JSON', style = 'dashboard' }) => {
  const colorClasses = style === 'terminal' 
    ? 'text-green-600/60 hover:text-green-400 hover:bg-green-500/10'
    : 'text-neutral-600 hover:text-neutral-400 hover:bg-white/[0.04]';

  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        inline-flex items-center justify-center w-4 h-4 ml-2 rounded 
        ${colorClasses}
        smooth-hover opacity-60 hover:opacity-100
        ${className}
      `}
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" 
        />
      </svg>
    </button>
  );
};

export default JsonPopout;