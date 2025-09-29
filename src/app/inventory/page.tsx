'use client';

import { useState } from 'react';
import { useInventoryData } from '@/hooks/useInventoryData';
import { InventoryPageHeader } from '@/components/features/InventoryPageHeader';
import { InventoryTable } from '@/components/features/InventoryTable';

export default function InventoryPage() {
  const [hideZeroQuantity, setHideZeroQuantity] = useState(false);
  
  const {
    locations,
    groupedInventory,
    loading,
    error,
    refresh,
    updateQuantity
  } = useInventoryData({ autoLoad: true, groupByProduct: true });

  // Filter inventory based on zero quantity setting
  const filteredGroupedInventory = hideZeroQuantity 
    ? groupedInventory.filter(group => 
        group.locations.some(item => parseFloat(item.quantity.toString()) > 0)
      ).map(group => ({
        ...group,
        locations: group.locations.filter(item => parseFloat(item.quantity.toString()) > 0)
      }))
    : groupedInventory;

  const handleAddInventory = () => {
  };

  const handleUpdateQuantity = async (itemId: number, newQuantity: string) => {
    // In a real implementation, this would call updateQuantity from the hook
    // await updateQuantity(itemId, parseFloat(newQuantity));
  };

  const handleDeleteItem = async (itemId: number) => {
    // After deletion, refresh the data
    // await refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold">Error Loading Inventory</h2>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={refresh}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate total inventory items
  const totalItems = filteredGroupedInventory.reduce(
    (sum, group) => sum + group.locations.length, 
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <InventoryPageHeader
        itemCount={totalItems}
        locationCount={locations.length}
        onAddInventory={handleAddInventory}
        onRefresh={refresh}
        hideZeroQuantity={hideZeroQuantity}
        onHideZeroQuantityChange={setHideZeroQuantity}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <InventoryTable
            groupedInventory={filteredGroupedInventory}
            onEditQuantity={handleUpdateQuantity}
            onDeleteItem={handleDeleteItem}
            onAddInventory={handleAddInventory}
          />
        </div>
      </div>
    </div>
  );
}