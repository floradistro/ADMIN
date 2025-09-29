'use client';

import { useState, useCallback } from 'react';
import { SalesByDayData } from './useReports';

export interface ReportSelectionState {
  selectedRows: Set<number>;
  isSelectAllChecked: boolean;
  isIndeterminate: boolean;
}

export function useReportSelection(data: SalesByDayData[] = []) {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const isSelectAllChecked = selectedRows.size === data.length && data.length > 0;
  const isIndeterminate = selectedRows.size > 0 && selectedRows.size < data.length;

  const toggleRowSelection = useCallback((rowIndex: number) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowIndex)) {
        newSet.delete(rowIndex);
      } else {
        newSet.add(rowIndex);
      }
      return newSet;
    });
  }, []);

  const selectAllRows = useCallback(() => {
    if (isSelectAllChecked) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(data.map((_, index) => index)));
    }
  }, [data, isSelectAllChecked]);

  const clearSelection = useCallback(() => {
    setSelectedRows(new Set());
  }, []);

  const getSelectedData = useCallback(() => {
    return data.filter((_, index) => selectedRows.has(index));
  }, [data, selectedRows]);

  const calculateSelectionTotals = useCallback(() => {
    const selectedData = getSelectedData();
    if (selectedData.length === 0) return null;
    
    const totals = selectedData.reduce((acc, day) => {
      return {
        'Gross Sales': acc['Gross Sales'] + (day['Gross Sales'] || 0),
        'Gross Profit': acc['Gross Profit'] + (day['Gross Profit'] || 0),
        'Invoices Sold': acc['Invoices Sold'] + (day['Invoices Sold'] || 0),
        'Transaction Average': 0, // Will calculate after
        'Total Item Count': acc['Total Item Count'] + (day['Total Item Count'] || 0),
        'Gross Margin': 0, // Will calculate after
        'Total Invoiced': acc['Total Invoiced'] + (day['Total Invoiced'] || 0),
        'Subtotal': acc['Subtotal'] + (day['Subtotal'] || 0),
        'Cash': acc['Cash'] + (day['Cash'] || 0),
        'CARD': acc['CARD'] + (day['CARD'] || 0),
        'Integrated Card Payment (US)': acc['Integrated Card Payment (US)'] + (day['Integrated Card Payment (US)'] || 0)
      };
    }, {
      'Gross Sales': 0,
      'Gross Profit': 0,
      'Invoices Sold': 0,
      'Transaction Average': 0,
      'Total Item Count': 0,
      'Gross Margin': 0,
      'Total Invoiced': 0,
      'Subtotal': 0,
      'Cash': 0,
      'CARD': 0,
      'Integrated Card Payment (US)': 0
    });

    // Calculate derived values
    if (totals['Invoices Sold'] > 0) {
      totals['Transaction Average'] = totals['Gross Sales'] / totals['Invoices Sold'];
    }
    if (totals['Subtotal'] > 0) {
      totals['Gross Margin'] = (totals['Gross Profit'] / totals['Subtotal']) * 100;
    }

    return totals;
  }, [getSelectedData]);

  return {
    selectedRows,
    isSelectAllChecked,
    isIndeterminate,
    toggleRowSelection,
    selectAllRows,
    clearSelection,
    getSelectedData,
    calculateSelectionTotals
  };
}
