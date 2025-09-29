import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'lift' | 'glow';
}

export function Card({ children, className = '', onClick, variant = 'default' }: CardProps) {
  // Pre-compute classes for maximum performance
  const baseClasses = "bg-neutral-900 rounded-lg";
  const interactiveClasses = onClick ? "cursor-pointer card-hover" : "";
  const variantClasses = {
    default: onClick ? "hover:bg-neutral-800/60" : "",
    lift: onClick ? "hover-lift hover:bg-neutral-800/60" : "",
    glow: onClick ? "hover-glow hover:bg-neutral-800/60" : ""
  };

  return (
    <div 
      className={`${baseClasses} ${interactiveClasses} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
      style={{
        // Hardware acceleration for smooth animations
        willChange: onClick ? 'background-color, transform, box-shadow' : 'auto',
        backfaceVisibility: 'hidden',
        transform: 'translateZ(0)',
      }}
    >
      {children}
    </div>
  );
}

export default Card;