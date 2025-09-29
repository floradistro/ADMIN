import React from 'react';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function Divider({ orientation = 'vertical', className = '' }: DividerProps) {
  const baseClasses = 'bg-white/10';
  const orientationClasses = orientation === 'vertical' ? 'w-px h-4' : 'h-px w-full';
  
  return (
    <div className={`${baseClasses} ${orientationClasses} ${className}`} />
  );
}