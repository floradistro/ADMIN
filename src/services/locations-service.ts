/**
 * Direct Location Management Service
 * Uses Magic2 Flora IM plugin API directly with no caching layers
 */

export interface Location {
  id: number;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  zip?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  email?: string;
  manager_user_id?: number;
  is_active: string | number;
  is_default: string | number;
  priority?: string | number;
  settings?: any;
  created_at?: string;
  updated_at?: string;
  status?: string;
  parent_id?: number;
}

export interface LocationUpdateData {
  name?: string;
  description?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  email?: string;
  is_active?: string;
  is_default?: string;
  manager_user_id?: number;
  parent_id?: number;
  priority?: number;
  status?: string;
  settings?: string; // JSON string
}

class LocationsService {
  /**
   * Get all locations via Portal API with enhanced caching control
   */
  async getLocations(bustCache = false): Promise<{ success: boolean; data: Location[] }> {
    try {
      // Enhanced cache busting with multiple parameters
      const cacheBust = bustCache ? `&_cachebust=${Date.now()}&_rand=${Math.random()}` : '';
      const url = `/api/flora/locations?_t=${Date.now()}${cacheBust}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Requested-With': 'XMLHttpRequest'
        },
        cache: 'no-store', // Always use no-store to avoid any caching
      });

      if (!response.ok) {
        throw new Error(`Portal API error: ${response.status}`);
      }

      const result = await response.json();
      
      // Check if result has success property
      if (result.success !== undefined) {
        return result;
      }
      
      // If it's just an array, wrap it in success format
      const locations = Array.isArray(result) ? result : [];
      return {
        success: true,
        data: locations
          .filter((loc: any) => {
            // Filter out invalid locations - must have valid numeric ID and name
            // Accept both string and numeric IDs as long as they convert to valid numbers
            const numericId = parseInt(loc.id);
            const hasValidId = loc.id && !isNaN(numericId) && numericId > 0;
            const hasValidName = loc.name && typeof loc.name === 'string' && loc.name.trim().length > 0;
            
            if (!hasValidId || !hasValidName) {
              console.log('LocationsService: Filtering out invalid location:', { id: loc.id, name: loc.name, numericId });
              return false;
            }
            
            return true;
          })
          .map((loc: any) => ({
            id: parseInt(loc.id),
            name: loc.name,
            slug: loc.slug,
            description: loc.description,
            address: loc.address,
            address_line_1: loc.address_line_1,
            address_line_2: loc.address_line_2,
            city: loc.city,
            state: loc.state,
            zip: loc.zip,
            postal_code: loc.postal_code,
            country: loc.country,
            phone: loc.phone,
            email: loc.email,
            manager_user_id: loc.manager_user_id ? parseInt(loc.manager_user_id) : undefined,
            is_active: loc.is_active,
            is_default: loc.is_default,
            priority: loc.priority,
            settings: loc.settings,
            created_at: loc.created_at,
            updated_at: loc.updated_at,
            status: loc.status,
            parent_id: loc.parent_id,
          }))
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update a location via Portal API
   */
  async updateLocation(locationId: number, data: LocationUpdateData): Promise<{ success: boolean; data: Location }> {
    try {
      const url = `/api/flora/locations/${locationId}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update location: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Update failed');
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a specific location by ID
   */
  async getLocation(locationId: number, bustCache = false): Promise<Location | null> {
    try {
      // Always bust cache to get real data
      const locationsResult = await this.getLocations(true);
      return locationsResult.data.find(loc => loc.id === locationId) || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new location via Portal API
   */
  async createLocation(locationData: Partial<LocationUpdateData>): Promise<{ success: boolean; data: Location }> {
    try {
      console.log('=== LOCATIONS SERVICE: createLocation called ===');
      console.log('Input data:', locationData);
      
      const url = '/api/flora/locations';
      console.log('Calling URL:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
        cache: 'no-cache',
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error text:', errorText);
        throw new Error(`Portal API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Response JSON:', result);

      if (!result.success || !result.data) {
        console.error('Invalid response format:', result);
        throw new Error('Invalid response format from Portal API');
      }

      console.log('=== LOCATIONS SERVICE: createLocation success ===');
      return result;
    } catch (error) {
      console.error('=== LOCATIONS SERVICE: createLocation error ===', error);
      throw error;
    }
  }

  /**
   * Delete a location
   */
  async deleteLocation(locationId: number): Promise<void> {
    try {
      const url = `/api/flora/locations/${locationId}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-cache',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Flora API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to delete location');
      }
    } catch (error) {
      throw error;
    }
  }
}

// Export singleton instance
export const locationsService = new LocationsService();