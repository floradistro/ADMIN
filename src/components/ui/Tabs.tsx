import React, { createContext, useContext, useState } from 'react';

interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

interface TabsProps {
  children: React.ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function Tabs({ children, value, onValueChange, className = '' }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabsList({ children, className = '' }: TabsListProps) {
  return (
    <div className={`
      inline-flex h-10 items-center justify-center rounded-lg 
      bg-neutral-900/50 p-1 text-neutral-400 
      ${className}
    `}>
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

export function TabsTrigger({ children, value, className = '' }: TabsTriggerProps) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('TabsTrigger must be used within Tabs');
  }

  const { value: selectedValue, onValueChange } = context;
  const isSelected = selectedValue === value;

  return (
    <button
      className={`
        inline-flex items-center justify-center whitespace-nowrap 
        rounded-md px-3 py-1.5 text-sm font-medium 
        ring-offset-black transition-all 
        focus-visible:outline-none focus-visible:ring-2 
        focus-visible:ring-neutral-400 focus-visible:ring-offset-2 
        disabled:pointer-events-none disabled:opacity-50
        ${isSelected 
          ? 'bg-black text-white shadow-sm' 
          : 'text-neutral-400 hover:text-white'
        }
        ${className}
      `}
      onClick={() => onValueChange(value)}
      type="button"
      role="tab"
      aria-selected={isSelected}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

export function TabsContent({ children, value, className = '' }: TabsContentProps) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('TabsContent must be used within Tabs');
  }

  const { value: selectedValue } = context;
  
  if (selectedValue !== value) {
    return null;
  }

  return (
    <div 
      className={`
        mt-2 ring-offset-black 
        focus-visible:outline-none focus-visible:ring-2 
        focus-visible:ring-neutral-400 focus-visible:ring-offset-2
        ${className}
      `}
      role="tabpanel"
    >
      {children}
    </div>
  );
}

export default Tabs;