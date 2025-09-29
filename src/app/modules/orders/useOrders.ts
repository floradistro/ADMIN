import { useState, useCallback } from 'react';

export interface OrdersState {
  ordersStatusFilter: string;
  selectedOrders: Set<number>;
  totalOrders: number;
  ordersLocationId: string;
  ordersEmployee: string;
  ordersDateFrom: string;
  ordersDateTo: string;
  ordersShowSelectedOnly: boolean;
}

export function useOrders() {
  const [ordersStatusFilter, setOrdersStatusFilter] = useState<string>('any');
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [ordersLocationId, setOrdersLocationId] = useState<string>('');
  const [ordersEmployee, setOrdersEmployee] = useState<string>('');
  const [ordersDateFrom, setOrdersDateFrom] = useState<string>('');
  const [ordersDateTo, setOrdersDateTo] = useState<string>('');
  const [ordersShowSelectedOnly, setOrdersShowSelectedOnly] = useState<boolean>(false);

  const clearSelection = useCallback(() => {
    setSelectedOrders(new Set());
  }, []);

  return {
    // State
    ordersStatusFilter,
    selectedOrders,
    totalOrders,
    ordersLocationId,
    ordersEmployee,
    ordersDateFrom,
    ordersDateTo,
    ordersShowSelectedOnly,
    
    // Actions
    setOrdersStatusFilter,
    setSelectedOrders,
    setTotalOrders,
    setOrdersLocationId,
    setOrdersEmployee,
    setOrdersDateFrom,
    setOrdersDateTo,
    setOrdersShowSelectedOnly,
    clearSelection,
  };
}
