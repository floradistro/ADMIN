import { useState, useCallback } from 'react';
import { FloraLocation } from '../../../services/inventory-service';

export interface CustomersState {
  selectedCustomers: Set<number>;
  totalCustomers: number;
  customersLocationId: string;
  customersShowSelectedOnly: boolean;
}

export function useCustomers() {
  const [selectedCustomers, setSelectedCustomers] = useState<Set<number>>(new Set());
  const [totalCustomers, setTotalCustomers] = useState<number>(0);
  const [customersLocationId, setCustomersLocationId] = useState<string>('');
  const [customersShowSelectedOnly, setCustomersShowSelectedOnly] = useState<boolean>(false);

  const clearSelection = useCallback(() => {
    setSelectedCustomers(new Set());
  }, []);

  return {
    // State
    selectedCustomers,
    totalCustomers,
    customersLocationId,
    customersShowSelectedOnly,
    
    // Actions
    setSelectedCustomers,
    setTotalCustomers,
    setCustomersLocationId,
    setCustomersShowSelectedOnly,
    clearSelection,
  };
}
