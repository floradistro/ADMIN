import React from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function TextArea({ 
  label, 
  error, 
  helperText, 
  className = '', 
  ...props 
}: TextAreaProps) {
  const baseClasses = `
    w-full px-3 py-2 
    bg-neutral-950/40 
    border border-neutral-800/40 
    rounded 
    text-neutral-400 
    placeholder-neutral-600
    focus:border-neutral-700 
    focus:outline-none 
    resize-vertical
    smooth-hover
  `;

  const errorClasses = error ? 'border-red-500/50 focus:border-red-500' : '';

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-neutral-300">
          {label}
        </label>
      )}
      <textarea
        className={`${baseClasses} ${errorClasses} ${className}`.trim()}
        {...props}
      />
      {error && (
        <div className="text-red-400 text-sm">{error}</div>
      )}
      {helperText && !error && (
        <div className="text-neutral-500 text-sm">{helperText}</div>
      )}
    </div>
  );
}