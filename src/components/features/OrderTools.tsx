'use client';

import React from 'react';
import { TableToolbar } from './TableToolbar';
import { FloraLocation } from '../../services/inventory-service';

interface OrderToolsProps {
  totalOrders: number;
  selectedCount: number;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  selectedLocationId: string;
  onLocationChange: (locationId: string) => void;
  locations: FloraLocation[];
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  selectedEmployee: string;
  onEmployeeChange: (employee: string) => void;
  employeeOptions: Array<{ value: string; label: string }>;
  showSelectedOnly: boolean;
  onShowSelectedOnlyChange: (show: boolean) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSelection: () => void;
  onExport?: () => void;
  onRefresh?: () => void;
}

export function OrderTools({
  totalOrders,
  selectedCount,
  statusFilter,
  onStatusFilterChange,
  selectedLocationId,
  onLocationChange,
  locations,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  selectedEmployee,
  onEmployeeChange,
  employeeOptions,
  showSelectedOnly,
  onShowSelectedOnlyChange,
  searchQuery,
  onSearchChange,
  onClearSelection,
  onExport,
  onRefresh
}: OrderToolsProps) {
  const stats = [
    { label: '', value: totalOrders, variant: 'default' as const },
    ...(selectedCount > 0 ? [{ label: 'sel', value: selectedCount, variant: 'primary' as const }] : [])
  ];

  const filters = [
    {
      id: 'search',
      type: 'search' as const,
      value: searchQuery,
      onChange: onSearchChange,
      placeholder: 'Search orders...'
    },
    {
      id: 'status',
      type: 'select' as const,
      label: 'Status',
      value: statusFilter,
      onChange: onStatusFilterChange,
      options: [
        { value: 'any', label: 'All Status' },
        { value: 'pending', label: 'Pending' },
        { value: 'processing', label: 'Processing' },
        { value: 'on-hold', label: 'On Hold' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'refunded', label: 'Refunded' },
        { value: 'failed', label: 'Failed' }
      ]
    },
    {
      id: 'location',
      type: 'location' as const,
      label: 'Location',
      value: selectedLocationId,
      onChange: onLocationChange,
      locations
    },
    {
      id: 'employee',
      type: 'select' as const,
      label: 'Employee',
      value: selectedEmployee,
      onChange: onEmployeeChange,
      options: employeeOptions,
      hidden: employeeOptions.length === 0
    },
    {
      id: 'dateFrom',
      type: 'date' as const,
      label: 'From',
      value: dateFrom,
      onChange: onDateFromChange
    },
    {
      id: 'dateTo',
      type: 'date' as const,
      label: 'To',
      value: dateTo,
      onChange: onDateToChange
    },
    {
      id: 'selectedOnly',
      type: 'toggle' as const,
      label: showSelectedOnly ? 'Show all' : 'Selected only',
      value: showSelectedOnly,
      onChange: onShowSelectedOnlyChange,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      )
    }
  ];

  const actions = [
    ...(selectedCount > 0 ? [
      {
        id: 'clearSelection',
        label: 'Clear Selection',
        onClick: onClearSelection,
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ),
        variant: 'default' as const
      }
    ] : []),
    ...(onExport ? [{
      id: 'export',
      label: 'Export',
      onClick: onExport,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      ),
      variant: 'default' as const
    }] : []),
    ...(onRefresh ? [{
      id: 'refresh',
      label: 'Refresh',
      onClick: onRefresh,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      variant: 'default' as const
    }] : [])
  ];

  return <TableToolbar stats={stats} filters={filters} actions={actions} />;
}


