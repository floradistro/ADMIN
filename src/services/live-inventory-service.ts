'use client';

/**
 * Live Inventory Service - Instant updates with real-time sync
 */
export class LiveInventoryService {
  private baseUrl = 'https://api.floradistro.com/wp-json/flora-im/v1';
  private consumerKey = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
  private consumerSecret = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

  /**
   * Update inventory with instant response
   */
  async updateInventory(productId: number, locationId: number, quantity: number): Promise<{
    success: boolean;
    newQuantity?: number;
    error?: string;
  }> {
    try {
      const response = await fetch('/api/flora/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          product_id: productId,
          location_id: locationId,
          quantity: quantity
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          newQuantity: quantity
        };
      } else {
        return {
          success: false,
          error: result.error || 'Update failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Get current inventory for a product/location
   */
  async getCurrentInventory(productId: number, locationId: number): Promise<number | null> {
    try {
      const response = await fetch(`/api/flora/inventory?product_id=${productId}&location_id=${locationId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) return null;

      const data = await response.json();
      if (data && data.length > 0) {
        return parseFloat(data[0].quantity);
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}

export const liveInventoryService = new LiveInventoryService();