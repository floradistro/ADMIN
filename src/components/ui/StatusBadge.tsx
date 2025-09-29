import React from 'react';

interface StatusBadgeProps {
  status: 'fresh' | 'warning' | 'expired';
  label: string;
  className?: string;
}

const statusStyles = {
  fresh: {
    dot: 'bg-green-500',
    text: 'text-green-400'
  },
  warning: {
    dot: 'bg-yellow-500',
    text: 'text-yellow-400'
  },
  expired: {
    dot: 'bg-red-500',
    text: 'text-red-400'
  }
};

export function StatusBadge({ status, label, className = '' }: StatusBadgeProps) {
  const styles = statusStyles[status];
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${styles.dot}`}></div>
      <span className={`text-[10px] ${styles.text}`}>{label}</span>
    </div>
  );
}