import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { OrdersView, OrdersViewRef } from '../../../components/features/OrdersView';
import { OrdersGridHeader } from '../../../components/features/OrdersGridHeader';
import { FloraLocation } from '../../../services/inventory-service';
import { useOrders } from './useOrders';

interface OrdersModuleProps {
  floraLocations: FloraLocation[];
  onClose: () => void;
}

export interface OrdersModuleRef {
  handleRefresh: () => void;
}

export const OrdersModule = forwardRef<OrdersModuleRef, OrdersModuleProps>(({ floraLocations, onClose }, ref) => {
  const ordersViewRef = useRef<OrdersViewRef>(null);
  
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
      {/* Only show header after initial data load */}
      {!isInitialLoading && (
        <OrdersGridHeader
          statusFilter={ordersStatusFilter}
          onStatusFilterChange={setOrdersStatusFilter}
          totalOrders={totalOrders}
          selectedOrdersCount={selectedOrders.size}
          onClearSelection={clearSelection}
          selectedLocationId={ordersLocationId}
          onLocationChange={setOrdersLocationId}
          locations={floraLocations}
          selectedEmployee={ordersEmployee}
          onEmployeeChange={setOrdersEmployee}
          employeeOptions={[]} // Employee options loaded from user management
          dateFrom={ordersDateFrom}
          dateTo={ordersDateTo}
          onDateFromChange={setOrdersDateFrom}
          onDateToChange={setOrdersDateTo}
          showSelectedOnly={ordersShowSelectedOnly}
          onShowSelectedOnlyChange={setOrdersShowSelectedOnly}
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
