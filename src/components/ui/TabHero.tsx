import React from 'react';

interface TabHeroProps {
  title: string;
  description: string;
  showGrid?: boolean;
}

export function TabHero({ title, description, showGrid = false }: TabHeroProps) {
  return (
    <div className="relative text-center py-6 px-8">
      {/* Grid Background extending beyond hero - only show if requested */}
      {showGrid && (
        <div 
          className="absolute -inset-16 opacity-[0.12]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(115, 115, 115, 0.2) 1px, transparent 1px),
              linear-gradient(90deg, rgba(115, 115, 115, 0.2) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px'
          }}
        />
      )}
      
      <div className="relative z-10">
        <h1 className="text-xl font-light text-neutral-300 mb-2 tracking-tight">
          {title}
        </h1>
        <p className="text-sm text-neutral-500 font-light max-w-xl mx-auto leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}