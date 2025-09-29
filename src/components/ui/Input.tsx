import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  className?: string;
}

export function Input({ label, className = '', ...props }: InputProps) {
  const baseClasses = 'w-full bg-neutral-800/30 border border-white/[0.06] rounded px-3 py-1.5 text-xs text-neutral-400 placeholder-neutral-600 focus:border-white/[0.12] focus:bg-neutral-800/50 focus:outline-none transition-all product-text';
  
  return (
    <div>
      {label && (
        <label className="block text-neutral-500 mb-1 text-xs product-text">
          {label}
        </label>
      )}
      <input 
        className={`${baseClasses} ${className}`}
        {...props}
      />
    </div>
  );
}