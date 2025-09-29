import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  className?: string;
  keyPrefix?: string;
}

export function Select({ label, options, className = '', keyPrefix, ...props }: SelectProps) {
  const baseClasses = 'px-2 py-1 bg-neutral-800/50 border border-white/[0.06] rounded text-xs text-neutral-400 focus:border-white/[0.12] focus:outline-none product-text relative z-[9999]';
  
  return (
    <div>
      {label && (
        <label className="block text-neutral-500 mb-1 text-xs product-text">
          {label}
        </label>
      )}
      <select className={`${baseClasses} ${className}`} style={{ zIndex: 9999 }} {...props}>
        {options.map((option, index) => (
          <option key={keyPrefix ? `${keyPrefix}-${option.value}-${index}` : `${option.value}-${index}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}