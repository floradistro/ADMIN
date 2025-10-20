import React, { useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { OrdersView, OrdersViewRef } from '../../../components/features/OrdersView';
import { OrderTools } from '../../../components/features/OrderTools';
import { FloraLocation } from '../../../services/inventory-service';
import { useOrders } from './useOrders';

interface OrdersModuleProps {
  floraLocations: FloraLocation[];
  onClose: () => void;
}

export interface OrdersModuleRef {
  handleRefresh: () => void;
}

export const OrdersModule = forwardRef<OrdersModuleRef, OrdersModuleProps>(function OrdersModule({ floraLocations, onClose }, ref) {
  const ordersViewRef = useRef<OrdersViewRef>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const {
    ordersStatusFilter,
    selectedOrders,
    totalOrders,
    ordersLocationId,
    ordersEmployee,
    ordersDateFrom,
    ordersDateTo,
    ordersShowSelectedOnly,
    setOrdersStatusFilter,
    setSelectedOrders,
    setTotalOrders,
    setOrdersLocationId,
    setOrdersEmployee,
    setOrdersDateFrom,
    setOrdersDateTo,
    setOrdersShowSelectedOnly,
    clearSelection,
  } = useOrders();

  // Convert location ID to location name for filtering
  const getLocationNameById = (locationId: string): string => {
    if (!locationId) return '';
    const location = floraLocations.find(loc => loc.id.toString() === locationId);
    return location ? location.name : '';
  };

  useImperativeHandle(ref, () => ({
    handleRefresh: () => {
      ordersViewRef.current?.handleRefresh();
    }
  }));

  // Hide header during initial load when totalOrders is 0 and no data yet
  const isInitialLoading = totalOrders === 0;

  return (
    <div className="flex-1 bg-neutral-900 flex flex-col min-h-0">
      {/* Only show toolbar after initial data load */}
      {!isInitialLoading && (
        <OrderTools
          totalOrders={totalOrders}
          selectedCount={selectedOrders.size}
          statusFilter={ordersStatusFilter}
          onStatusFilterChange={setOrdersStatusFilter}
          selectedLocationId={ordersLocationId}
          onLocationChange={setOrdersLocationId}
          locations={floraLocations}
          dateFrom={ordersDateFrom}
          dateTo={ordersDateTo}
          onDateFromChange={setOrdersDateFrom}
          onDateToChange={setOrdersDateTo}
          selectedEmployee={ordersEmployee}
          onEmployeeChange={setOrdersEmployee}
          employeeOptions={[]}
          showSelectedOnly={ordersShowSelectedOnly}
          onShowSelectedOnlyChange={setOrdersShowSelectedOnly}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClearSelection={clearSelection}
          onRefresh={() => ordersViewRef.current?.handleRefresh()}
        />
      )}
      
      <OrdersView 
        ref={ordersViewRef}
        onClose={onClose}
        statusFilter={ordersStatusFilter}
        onStatusFilterChange={setOrdersStatusFilter}
        onClearSelection={clearSelection}
        onSelectedOrdersChange={setSelectedOrders}
        onTotalOrdersChange={setTotalOrders}
        locationId={getLocationNameById(ordersLocationId)}
        employee={ordersEmployee}
        dateFrom={ordersDateFrom}
        dateTo={ordersDateTo}
        showSelectedOnly={ordersShowSelectedOnly}
      />
    </div>
  );
});
