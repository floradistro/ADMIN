'use client';

import React, { useState } from 'react';
import { GroupedInventoryItem, InventoryItem } from '@/types/inventory';

interface InventoryTableProps {
  groupedInventory: GroupedInventoryItem[];
  onEditQuantity: (itemId: number, newQuantity: string) => void;
  onDeleteItem: (itemId: number) => void;
  onAddInventory: () => void;
}

export const InventoryTable = React.memo(function InventoryTable({
  groupedInventory,
  onEditQuantity,
  onDeleteItem,
  onAddInventory
}: InventoryTableProps) {
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const handleUpdateQuantity = (itemId: number, newQuantity: string) => {
    onEditQuantity(itemId, newQuantity);
    setEditingItem(null);
  };

  const handleStartEdit = (item: InventoryItem) => {
    setEditingItem(item.id);
    setEditValue(item.quantity.toString());
  };

  const handleDeleteClick = (itemId: number) => {
    if (confirm('Delete this inventory record?')) {
      onDeleteItem(itemId);
    }
  };

  if (groupedInventory.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">No inventory records found</p>
        <button
          onClick={onAddInventory}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Add First Item
        </button>
      </div>
    );
  }

  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
            Product / Location
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
            Quantity
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
            Reserved
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
            Available
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {groupedInventory.map((group) => (
          <React.Fragment key={`product-${group.product_id}`}>
            {/* Product Header Row */}
            <tr className="bg-blue-50">
              <td colSpan={5} className="px-6 py-4">
                <div className="flex items-center">
                  <span className="text-lg mr-2"></span>
                  <div>
                    <div className="text-sm font-medium text-white">
                      {group.product_name}
                    </div>
                    <div className="text-xs text-neutral-500">
                      ID: {group.product_id} • {group.locations.length} locations • Total: {group.total_quantity.toFixed(2)}
                    </div>
                  </div>
                </div>
              </td>
            </tr>
            
            {/* Location Sub-rows */}
            {group.locations.map((item: InventoryItem) => (
              <tr key={item.id} className="hover:bg-white/[0.04]">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center ml-8">
                    <span className="text-blue-500 mr-2"></span>
                    <span className="text-sm text-white">
                      {item.location_name || `Location #${item.location_id}`}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingItem === item.id ? (
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleUpdateQuantity(item.id, editValue)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdateQuantity(item.id, editValue);
                        } else if (e.key === 'Escape') {
                          setEditingItem(null);
                        }
                      }}
                      className="w-24 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  ) : (
                    <span 
                      className={`text-sm font-medium cursor-pointer hover:bg-white/[0.05] px-2 py-1 rounded ${
                        parseFloat(item.quantity.toString()) > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                      onClick={() => handleStartEdit(item)}
                    >
                      {parseFloat(item.quantity.toString()).toFixed(2)}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-neutral-500">
                    {parseFloat((item.reserved_quantity || 0).toString()).toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-white">
                    {(parseFloat(item.quantity.toString()) - parseFloat((item.reserved_quantity || 0).toString())).toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleStartEdit(item)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(item.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
});