import React from 'react';
import { ChatInterface } from '../../../components/features/ChatInterface';

interface DashboardViewProps {
  onOpenProducts: () => void;
  onOpenSettings: () => void;
  onOpenCustomers: () => void;
  onOpenOrders: () => void;
  onOpenAudit: () => void;
  onOpenCoa: () => void;
  onOpenMedia: () => void;
  onOpenReports: () => void;
}

export function DashboardView({ 
  onOpenProducts, 
  onOpenSettings, 
  onOpenCustomers, 
  onOpenOrders, 
  onOpenAudit,
  onOpenCoa,
  onOpenMedia,
  onOpenReports
}: DashboardViewProps) {
  return (
    <div className="flex-1">
      <ChatInterface />
    </div>
  );
}
