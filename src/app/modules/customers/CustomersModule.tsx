import React, { useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { CustomersView, CustomersViewRef } from '../../../components/features/CustomersView';
import { CustomerTools } from '../../../components/features/CustomerTools';
import { FloraLocation } from '../../../services/inventory-service';
import { useCustomers } from './useCustomers';

interface CustomersModuleProps {
  floraLocations: FloraLocation[];
  onClose: () => void;
}

export interface CustomersModuleRef {
  handleRefresh: () => void;
}

export const CustomersModule = forwardRef<CustomersModuleRef, CustomersModuleProps>(function CustomersModule({ floraLocations, onClose }, ref) {
  const customersViewRef = useRef<CustomersViewRef>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
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

  // Hide header during initial load when totalCustomers is 0 and no data yet
  const isInitialLoading = totalCustomers === 0;

  return (
    <div className="flex-1 bg-neutral-900 flex flex-col min-h-0">
      {/* Only show toolbar after initial data load */}
      {!isInitialLoading && (
        <CustomerTools
          totalCustomers={totalCustomers}
          selectedCount={selectedCustomers.size}
          selectedLocationId={customersLocationId}
          onLocationChange={setCustomersLocationId}
          locations={floraLocations}
          showSelectedOnly={customersShowSelectedOnly}
          onShowSelectedOnlyChange={setCustomersShowSelectedOnly}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddCustomer={() => customersViewRef.current?.handleAddNew()}
          onClearSelection={clearSelection}
          onRefresh={() => customersViewRef.current?.handleRefresh()}
        />
      )}
      
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
