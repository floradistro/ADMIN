'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export interface SalesByDayData {
  Date: string;
  'Invoices Sold': number;
  'Invoices Ref': number;
  'Net Sold': number;
  'Gift Card Sales': number;
  'Gross Sales': number;
  'Subtotal': number;
  'Total Tax': number;
  'Total Invoiced': number;
  'Total Cost': number;
  'Gross Profit': number;
  'Gross Margin': number;
  'Total Discount': number;
  'Items Per Transaction': number;
  'Total Item Count': number;
  'Qty Per Transaction': number;
  'Total Quantity': number;
  'Transaction Average': number;
  'CARD': number;
  'Cash': number;
  'Integrated Card Payment (US)': number;
  'Blowing Rock Tax Rate': number;
  'Elizabethton county tax': number;
  'Sales Tax': number;
  'Salisbury Tax Rate': number;
  'Tennessee hemp tax': number;
  'Tennessee state tax': number;
  'Tips': number;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export function useReports() {
  const { data: session, status } = useSession();
  const [salesByDayData, setSalesByDayData] = useState<SalesByDayData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    return {
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    };
  });

  const fetchSalesByDay = useCallback(async (customDateRange?: DateRange) => {
    // Don't fetch if still loading session, but allow unauthenticated for development
    if (status === 'loading') {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const range = customDateRange || dateRange;
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`/api/reports/sales-by-day?startDate=${range.startDate}&endDate=${range.endDate}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in.');
        }
        if (response.status === 404) {
          throw new Error('Reports API endpoint not available.');
        }
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `Failed to fetch sales data: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (Array.isArray(data)) {
        setSalesByDayData(data);
      } else {
        throw new Error('Invalid data format received from server');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.warn('Sales data fetch was aborted (timeout)');
        setError('Request timed out. Please try again.');
      } else if (err instanceof TypeError && err.message === 'Failed to fetch') {
        console.warn('Network error fetching sales data');
        setError('Network error. Please check your connection and try again.');
      } else {
        console.error('Error fetching sales by day data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch sales data');
      }
      setSalesByDayData([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange, status]);

  const updateDateRange = useCallback((newRange: DateRange) => {
    setDateRange(newRange);
  }, []);

  const refreshData = useCallback(() => {
    return fetchSalesByDay();
  }, [fetchSalesByDay]);

  // Initial load - when session is ready (authenticated or unauthenticated for dev)
  useEffect(() => {
    if (status !== 'loading') {
      fetchSalesByDay();
    }
  }, [fetchSalesByDay, status]);

  return {
    salesByDayData,
    loading,
    error,
    dateRange,
    updateDateRange,
    fetchSalesByDay,
    refreshData
  };
}
