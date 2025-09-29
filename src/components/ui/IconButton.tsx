import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'active' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const iconButtonVariants = {
  default: 'text-neutral-500 hover:text-neutral-400 bg-transparent hover:bg-neutral-800/50 border border-transparent hover:border-white/10 hover:shadow-sm hover:shadow-black/10',
  active: 'text-neutral-400 bg-white/15 shadow-lg shadow-white/10 border border-white/30',
  ghost: 'text-neutral-500 hover:text-neutral-400 bg-transparent hover:bg-white/[0.1] border border-transparent'
};

const iconButtonSizes = {
  sm: 'p-1',
  md: 'p-2',
  lg: 'p-3'
};

export function IconButton({ 
  children, 
  variant = 'default', 
  size = 'md', 
  className = '', 
  ...props 
}: IconButtonProps) {
  const baseClasses = 'rounded-xl button-hover';
  const variantClasses = iconButtonVariants[variant];
  const sizeClasses = iconButtonSizes[size];
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
      style={{
        // Hardware acceleration for ultra-smooth interactions
        willChange: 'background-color, color, border-color, transform',
        backfaceVisibility: 'hidden',
        transform: 'translateZ(0)',
      }}
      {...props}
    >
      {children}
    </button>
  );
}