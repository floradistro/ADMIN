/**
 * Inventory Duplicate Prevention System
 * Ensures inventory operations never create duplicates
 */

export class InventoryDuplicatePrevention {
  // Standard meta key for location - MUST be consistent
  static readonly LOCATION_META_KEY = 'in_location';
  
  /**
   * Safely get or create inventory at location
   * Uses database locking to prevent race conditions
   */
  static async ensureInventoryAtLocation(
    productId: number,
    locationId: number,
    locationName?: string
  ): Promise<{ inventoryId: number; isNew: boolean }> {
    // This should be called server-side with proper locking
    const apiUrl = `${process.env.NEXT_PUBLIC_WP_URL}/wp-json/flora/v1/inventory/ensure`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Lock-Key': `inventory_${productId}_${locationId}`, // Request exclusive lock
      },
      body: JSON.stringify({
        product_id: productId,
        location_id: locationId,
        location_name: locationName,
        meta_key: this.LOCATION_META_KEY, // Always use consistent key
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to ensure inventory: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  /**
   * Validate inventory uniqueness before operations
   */
  static validateUniqueInventory(inventories: any[]): boolean {
    const locationMap = new Map<string, number>();
    
    for (const inv of inventories) {
      const locationId = inv.location_id || inv.in_location || inv.mli_location;
      if (locationMap.has(locationId)) {
        return false;
      }
      locationMap.set(locationId, inv.id);
    }
    
    return true;
  }
  
  /**
   * Fix meta key inconsistencies in existing data
   */
  static async fixMetaKeyInconsistencies(productId: number): Promise<void> {
    const apiUrl = `${process.env.NEXT_PUBLIC_WP_URL}/wp-json/flora/v1/inventory/fix-meta`;
    
    await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: productId,
        correct_meta_key: this.LOCATION_META_KEY,
      }),
    });
  }
}

/**
 * Transfer Request Wrapper with Duplicate Prevention
 */
export class SafeTransferService {
  static async transferWithDuplicatePrevention(
    productId: number,
    fromLocationId: number,
    toLocationId: number,
    quantity: number
  ): Promise<any> {
    // DISABLED - Stock transfers now handled by Magic2 plugin
    throw new Error('Stock transfers are now handled by the Magic2 plugin');
  }
}

/**
 * Inventory Cleanup Utilities
 */
export class InventoryCleanup {
  /**
   * Detect and merge duplicate inventories
   */
  static async detectAndMergeDuplicates(productId: number): Promise<{
    duplicatesFound: number;
    merged: number;
  }> {
    const apiUrl = `${process.env.NEXT_PUBLIC_WP_URL}/wp-json/flora/v1/inventory/merge-duplicates`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId }),
    });
    
    return response.json();
  }
  
  /**
   * Audit inventory for inconsistencies
   */
  static async auditInventory(productId: number): Promise<{
    issues: string[];
    recommendations: string[];
  }> {
    const apiUrl = `${process.env.NEXT_PUBLIC_WP_URL}/wp-json/flora/v1/inventory/audit`;
    
    const response = await fetch(`${apiUrl}?product_id=${productId}`);
    const data = await response.json();
    
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check for duplicate locations
    const locationCounts = new Map<string, number>();
    for (const inv of data.inventories) {
      const loc = inv.location_id;
      locationCounts.set(loc, (locationCounts.get(loc) || 0) + 1);
    }
    
    locationCounts.forEach((count, location) => {
      if (count > 1) {
        issues.push(`Location ${location} has ${count} inventory records (should be 1)`);
        recommendations.push(`Merge duplicate inventories for location ${location}`);
      }
    });
    
    // Check for inconsistent meta keys
    const metaKeys = new Set(data.inventories.map((inv: any) => inv.location_meta_key));
    if (metaKeys.size > 1) {
      issues.push(`Inconsistent meta keys found: ${Array.from(metaKeys).join(', ')}`);
      recommendations.push('Standardize all inventory records to use "in_location" meta key');
    }
    
    return { issues, recommendations };
  }
}