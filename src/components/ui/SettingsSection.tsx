import React from 'react';

interface SettingsSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function SettingsSection({
  children,
  className = ''
}: SettingsSectionProps) {
  return (
    <div className={`bg-neutral-900 rounded-lg p-4 border-b border-white/[0.02] ${className}`}>
      {children}
    </div>
  );
}