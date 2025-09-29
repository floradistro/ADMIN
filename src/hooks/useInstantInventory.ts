'use client';

import { useState, useCallback } from 'react';
import { liveInventoryService } from '@/services/live-inventory-service';

export interface InventoryState {
  [key: string]: number; // key format: "productId-locationId"
}

export interface UpdateResult {
  success: boolean;
  error?: string;
}

/**
 * Hook for instant inventory updates
 */
export function useInstantInventory(initialInventory: InventoryState = {}) {
  const [inventory, setInventory] = useState<InventoryState>(initialInventory);
  const [isUpdating, setIsUpdating] = useState<Set<string>>(new Set());

  const getInventoryKey = (productId: number, locationId: number) => `${productId}-${locationId}`;

  const updateInventory = useCallback(async (
    productId: number, 
    locationId: number, 
    newQuantity: number
  ): Promise<UpdateResult> => {
    const key = getInventoryKey(productId, locationId);
    
    // Immediately update the UI
    setInventory(prev => ({
      ...prev,
      [key]: newQuantity
    }));

    // Set updating state
    setIsUpdating(prev => new Set([...prev, key]));

    try {
      // Update backend
      const result = await liveInventoryService.updateInventory(productId, locationId, newQuantity);
      
      if (result.success) {
        // Confirm the update in UI (already set above)
        return { success: true };
      } else {
        // Rollback on failure
        const currentValue = await liveInventoryService.getCurrentInventory(productId, locationId);
        if (currentValue !== null) {
          setInventory(prev => ({
            ...prev,
            [key]: currentValue
          }));
        }
        return { success: false, error: result.error };
      }
    } catch (error) {
      // Rollback on error
      const currentValue = await liveInventoryService.getCurrentInventory(productId, locationId);
      if (currentValue !== null) {
        setInventory(prev => ({
          ...prev,
          [key]: currentValue
        }));
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Update failed' 
      };
    } finally {
      // Remove updating state
      setIsUpdating(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  }, []);

  const getQuantity = useCallback((productId: number, locationId: number): number => {
    const key = getInventoryKey(productId, locationId);
    return inventory[key] || 0;
  }, [inventory]);

  const isUpdatingItem = useCallback((productId: number, locationId: number): boolean => {
    const key = getInventoryKey(productId, locationId);
    return isUpdating.has(key);
  }, [isUpdating]);

  const setInitialInventory = useCallback((newInventory: InventoryState) => {
    setInventory(newInventory);
  }, []);

  return {
    inventory,
    updateInventory,
    getQuantity,
    isUpdatingItem,
    setInitialInventory
  };
}