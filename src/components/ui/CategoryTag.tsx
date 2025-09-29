import React from 'react';

interface CategoryTagProps {
  category: string;
  className?: string;
}

export function CategoryTag({ category, className = '' }: CategoryTagProps) {
  return (
    <span className={`px-2 py-0.5 bg-neutral-900/40 text-neutral-500 rounded-md text-[10px] font-medium ${className}`}>
      {category}
    </span>
  );
}