/**
 * Auto Inventory Initializer Service
 * 
 * Handles automatic initialization of inventory records for new products
 * across all locations in the Magic2 system.
 */

export interface Location {
  id: number;
  name: string;
  slug: string;
  is_active: number;
}

export interface InventoryInitResult {
  success: boolean;
  message: string;
  initialized_locations: number[];
  errors?: string[];
}

export class AutoInventoryInitializer {
  private static instance: AutoInventoryInitializer;
  private baseUrl = 'https://api.floradistro.com/wp-json/flora-im/v1';
  private consumerKey = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
  private consumerSecret = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

  public static getInstance(): AutoInventoryInitializer {
    if (!AutoInventoryInitializer.instance) {
      AutoInventoryInitializer.instance = new AutoInventoryInitializer();
    }
    return AutoInventoryInitializer.instance;
  }

  /**
   * Initialize inventory for a new product across all active locations
   */
  public async initializeInventoryForProduct(productId: number, initialQuantity: number = 0): Promise<InventoryInitResult> {
    
    try {
      // Step 1: Get all active locations
      const locations = await this.getAllActiveLocations();
      
      if (!locations || locations.length === 0) {
        return {
          success: false,
          message: 'No active locations found',
          initialized_locations: []
        };
      }


      // Step 2: Initialize inventory for each location
      const initializedLocations: number[] = [];
      const errors: string[] = [];

      for (const location of locations) {
        try {
          const result = await this.initializeInventoryForLocation(productId, location.id, initialQuantity);
          
          if (result.success) {
            initializedLocations.push(location.id);
          } else {
            errors.push(`Failed to initialize at ${location.name}: ${result.error || 'Unknown error'}`);
          }
        } catch (error) {
          const errorMsg = `Error initializing at ${location.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
        }
      }

      const success = initializedLocations.length > 0;
      const message = success 
        ? `Successfully initialized inventory at ${initializedLocations.length}/${locations.length} locations`
        : 'Failed to initialize inventory at any location';

      return {
        success,
        message,
        initialized_locations: initializedLocations,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      return {
        success: false,
        message: `Failed to initialize inventory: ${error instanceof Error ? error.message : 'Unknown error'}`,
        initialized_locations: []
      };
    }
  }

  /**
   * Get all active locations from Magic2
   */
  private async getAllActiveLocations(): Promise<Location[]> {
    try {
      const response = await fetch(`${this.baseUrl}/locations?consumer_key=${this.consumerKey}&consumer_secret=${this.consumerSecret}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch locations: ${response.status} ${response.statusText}`);
      }

      const locations = await response.json();
      
      // Filter only active locations (is_active is a string "1" not number 1)
      return Array.isArray(locations) ? locations.filter(loc => loc.is_active === "1" || loc.is_active === 1) : [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Initialize inventory for a specific product at a specific location
   */
  private async initializeInventoryForLocation(
    productId: number, 
    locationId: number, 
    quantity: number = 0
  ): Promise<{success: boolean; error?: string}> {
    try {
      // Use Magic2's inventory update endpoint with URL parameters
      const url = `${this.baseUrl}/inventory?consumer_key=${this.consumerKey}&consumer_secret=${this.consumerSecret}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          location_id: locationId,
          quantity: quantity
        })
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${responseText.substring(0, 200)}...`
        };
      }

      // Check if response is HTML (error page) or JSON
      if (responseText.trim().startsWith('<')) {
        return {
          success: false,
          error: `Server returned HTML instead of JSON. Response: ${responseText.substring(0, 200)}...`
        };
      }

      try {
        const result = JSON.parse(responseText);
        
        if (result.success === false) {
          return {
            success: false,
            error: result.message || 'API returned success: false'
          };
        }

        return { success: true };
      } catch (parseError) {
        return {
          success: false,
          error: `Failed to parse JSON response: ${responseText.substring(0, 200)}...`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if a product has inventory initialized at all locations
   */
  public async checkInventoryStatus(productId: number): Promise<{
    has_inventory: boolean;
    missing_locations: number[];
    total_locations: number;
  }> {
    try {
      const locations = await this.getAllActiveLocations();
      const missingLocations: number[] = [];

      for (const location of locations) {
        const hasInventory = await this.hasInventoryAtLocation(productId, location.id);
        if (!hasInventory) {
          missingLocations.push(location.id);
        }
      }

      return {
        has_inventory: missingLocations.length === 0,
        missing_locations: missingLocations,
        total_locations: locations.length
      };
    } catch (error) {
      return {
        has_inventory: false,
        missing_locations: [],
        total_locations: 0
      };
    }
  }

  /**
   * Check if a product has inventory at a specific location
   */
  private async hasInventoryAtLocation(productId: number, locationId: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/inventory?product_id=${productId}&location_id=${locationId}&consumer_key=${this.consumerKey}&consumer_secret=${this.consumerSecret}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      return Array.isArray(result) && result.length > 0;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const autoInventoryInitializer = AutoInventoryInitializer.getInstance();