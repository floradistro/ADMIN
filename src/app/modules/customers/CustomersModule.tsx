import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { CustomersView, CustomersViewRef } from '../../../components/features/CustomersView';
import { CustomersGridHeader } from '../../../components/features/CustomersGridHeader';
import { FloraLocation } from '../../../services/inventory-service';
import { useCustomers } from './useCustomers';

interface CustomersModuleProps {
  floraLocations: FloraLocation[];
  onClose: () => void;
}

export interface CustomersModuleRef {
  handleRefresh: () => void;
}

export const CustomersModule = forwardRef<CustomersModuleRef, CustomersModuleProps>(({ floraLocations, onClose }, ref) => {
  const customersViewRef = useRef<CustomersViewRef>(null);
  
  const {
    selectedCustomers,
    totalCustomers,
    customersLocationId,
    customersShowSelectedOnly,
    setSelectedCustomers,
    setTotalCustomers,
    setCustomersLocationId,
    setCustomersShowSelectedOnly,
    clearSelection,
  } = useCustomers();

  useImperativeHandle(ref, () => ({
    handleRefresh: () => {
      customersViewRef.current?.handleRefresh();
    }
  }));

  return (
    <div className="flex-1 bg-neutral-900 flex flex-col overflow-hidden">
      {/* Customers Header */}
      <CustomersGridHeader
        totalCustomers={totalCustomers}
        selectedCustomersCount={selectedCustomers.size}
        onClearSelection={clearSelection}
        selectedLocationId={customersLocationId}
        onLocationChange={setCustomersLocationId}
        locations={floraLocations}
        showSelectedOnly={customersShowSelectedOnly}
        onShowSelectedOnlyChange={setCustomersShowSelectedOnly}
        onAddCustomer={() => customersViewRef.current?.handleAddNew()}
        onRefresh={() => customersViewRef.current?.handleRefresh()}
      />
      
      <CustomersView 
        ref={customersViewRef}
        onClose={onClose}
        selectedLocationId={customersLocationId}
        onLocationChange={setCustomersLocationId}
        showSelectedOnly={customersShowSelectedOnly}
        onShowSelectedOnlyChange={setCustomersShowSelectedOnly}
        onSelectedCustomersChange={setSelectedCustomers}
        onTotalCustomersChange={setTotalCustomers}
        onAddCustomer={() => customersViewRef.current?.handleAddNew()}
      />
    </div>
  );
});
