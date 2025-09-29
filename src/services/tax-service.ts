import { SimpleWPAuth } from '../lib/wp-auth-simple';

export interface TaxRate {
  id: number;
  country: string;
  state: string;
  postcode: string;
  city: string;
  rate: string;
  name: string;
  priority: number;
  compound: boolean;
  shipping: boolean;
  order: number;
  class: string;
  postcodes?: string[];
  cities?: string[];
  // Add additional fields for Magic2 API compatibility
  tax_rate_id?: number;
}

export interface TaxClass {
  slug: string;
  name: string;
}

export interface CreateTaxRateData {
  country?: string;
  state?: string;
  postcode?: string;
  city?: string;
  rate: string;
  name: string;
  priority?: number;
  compound?: boolean;
  shipping?: boolean;
  order?: number;
  class?: string;
  postcodes?: string[];
  cities?: string[];
}

export interface UpdateTaxRateData extends Partial<CreateTaxRateData> {
  id: number;
}

export interface LocationTaxMapping {
  location_id: number;
  tax_rate_id: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

class TaxService {
  private baseUrl: string;
  private auth: SimpleWPAuth;
  private consumerKey: string;
  private consumerSecret: string;

  constructor() {
    this.baseUrl = 'https://api.floradistro.com';
    this.auth = new SimpleWPAuth();
    this.consumerKey = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
    this.consumerSecret = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';
  }

  /**
   * Get all tax rates from WooCommerce
   */
  async getTaxRates(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    class?: string;
  }): Promise<TaxRate[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.class) queryParams.append('class', params.class);

      const url = `${this.baseUrl}/wp-json/wc/v3/taxes${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${this.consumerKey}:${this.consumerSecret}`)}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tax rates: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a single tax rate by ID
   */
  async getTaxRate(id: number): Promise<TaxRate> {
    try {
      const url = `${this.baseUrl}/wp-json/wc/v3/taxes/${id}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${this.consumerKey}:${this.consumerSecret}`)}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tax rate: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new tax rate
   */
  async createTaxRate(taxData: CreateTaxRateData): Promise<TaxRate> {
    try {
      const url = `${this.baseUrl}/wp-json/wc/v3/taxes`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${this.consumerKey}:${this.consumerSecret}`)}`
        },
        body: JSON.stringify(taxData)
      });

      if (!response.ok) {
        throw new Error(`Failed to create tax rate: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update an existing tax rate
   */
  async updateTaxRate(id: number, taxData: Partial<CreateTaxRateData>): Promise<TaxRate> {
    try {
      const url = `${this.baseUrl}/wp-json/wc/v3/taxes/${id}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${this.consumerKey}:${this.consumerSecret}`)}`
        },
        body: JSON.stringify(taxData)
      });

      if (!response.ok) {
        throw new Error(`Failed to update tax rate: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a tax rate
   */
  async deleteTaxRate(id: number): Promise<TaxRate> {
    try {
      const url = `${this.baseUrl}/wp-json/wc/v3/taxes/${id}?force=true`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${this.consumerKey}:${this.consumerSecret}`)}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete tax rate: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all tax classes
   */
  async getTaxClasses(): Promise<TaxClass[]> {
    try {
      const url = `${this.baseUrl}/wp-json/wc/v3/taxes/classes`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${this.consumerKey}:${this.consumerSecret}`)}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tax classes: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Batch create/update/delete tax rates
   */
  async batchTaxRates(data: {
    create?: CreateTaxRateData[];
    update?: UpdateTaxRateData[];
    delete?: number[];
  }): Promise<{
    create: TaxRate[];
    update: TaxRate[];
    delete: TaxRate[];
  }> {
    try {
      const url = `${this.baseUrl}/wp-json/wc/v3/taxes/batch`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${this.consumerKey}:${this.consumerSecret}`)}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Failed to batch update tax rates: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get location-tax mappings (custom implementation)
   */
  async getLocationTaxMappings(locationId?: number | string): Promise<LocationTaxMapping[]> {
    try {
      // Validate location ID if provided
      if (locationId) {
        const numericLocationId = Number(locationId);
        if (isNaN(numericLocationId) || numericLocationId <= 0) {
          console.log('Invalid location ID provided to getLocationTaxMappings:', locationId);
          return []; // Return empty array for invalid location IDs
        }
      }

      const url = locationId 
        ? `/api/flora/locations/${locationId}/taxes`
        : '/api/flora/locations/taxes';
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch location tax mappings: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Convert string IDs to numbers to match interface
      return data.map((mapping: any) => ({
        ...mapping,
        location_id: parseInt(mapping.location_id),
        tax_rate_id: parseInt(mapping.tax_rate_id),
        is_default: mapping.is_default === '1' || mapping.is_default === 1 || mapping.is_default === true
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Assign tax rate to location with retry logic
   */
  async assignTaxToLocation(locationId: number, taxRateId: number, isDefault: boolean = false): Promise<LocationTaxMapping> {
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Tax assignment attempt ${attempt}/${maxRetries}:`, { locationId, taxRateId, isDefault });
        
        const url = `/api/flora/locations/${locationId}/taxes`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify({
            tax_rate_id: taxRateId,
            is_default: isDefault
          }),
          cache: 'no-store'
        });

        console.log(`Tax assignment response status: ${response.status}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorDetails = errorData.details || errorData.error || errorData.message || response.statusText;
          
          // If it's a client error (400-499), don't retry
          if (response.status >= 400 && response.status < 500) {
            throw new Error(`Failed to assign tax to location: ${errorDetails}`);
          }
          
          // For server errors (500+), store error and try again
          lastError = new Error(`Failed to assign tax to location: ${errorDetails}`);
          console.warn(`Tax assignment attempt ${attempt} failed:`, errorDetails);
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, attempt * 1000)); // Exponential backoff
            continue;
          }
          
          throw lastError;
        }

        const data = await response.json();
        console.log(`Tax assignment successful on attempt ${attempt}:`, data);
        
        // Transform response to match LocationTaxMapping interface
        return {
          id: data.id || Date.now(),
          location_id: locationId,
          tax_rate_id: taxRateId,
          is_default: Boolean(isDefault),
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString()
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.error(`Tax assignment attempt ${attempt} error:`, error);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          continue;
        }
        
        throw lastError;
      }
    }
    
    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Remove tax rate from location with retry logic
   */
  async removeTaxFromLocation(locationId: number, taxRateId: number): Promise<void> {
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Tax removal attempt ${attempt}/${maxRetries}:`, { locationId, taxRateId });
        
        const url = `/api/flora/locations/${locationId}/taxes/${taxRateId}`;
        
        const response = await fetch(url, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Requested-With': 'XMLHttpRequest'
          },
          cache: 'no-store'
        });

        console.log(`Tax removal response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          let errorData: any = {};
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { message: errorText };
          }
          
          // If it's a client error (400-499), don't retry
          if (response.status >= 400 && response.status < 500) {
            throw new Error(`Failed to unassign tax from location: ${errorData.details || errorData.error || errorData.message || response.statusText}`);
          }
          
          // For server errors (500+), store error and try again
          lastError = new Error(`Failed to unassign tax from location: ${errorData.details || errorData.error || errorData.message || response.statusText}`);
          console.warn(`Tax removal attempt ${attempt} failed:`, errorData);
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            continue;
          }
          
          throw lastError;
        }

        const result = await response.json();
        console.log(`Tax removal successful on attempt ${attempt}:`, result);
        return; // Success, exit retry loop
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.error(`Tax removal attempt ${attempt} error:`, error);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          continue;
        }
        
        throw lastError;
      }
    }
    
    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Get tax rates for a specific location
   */
  async getTaxRatesForLocation(locationId: number | string): Promise<TaxRate[]> {
    try {
      // Validate location ID
      const numericLocationId = Number(locationId);
      if (!locationId || isNaN(numericLocationId) || numericLocationId <= 0) {
        console.log('Invalid location ID provided to getTaxRatesForLocation:', locationId);
        return []; // Return empty array for invalid location IDs
      }

      // Get tax assignments directly from Magic2 API which includes tax rate details
      const url = `/api/flora/locations/${locationId}/taxes`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch location tax rates: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform Magic2 API response to match TaxRate interface
      return data.map((item: any) => ({
        id: parseInt(item.tax_rate_id),
        tax_rate_id: parseInt(item.tax_rate_id), // Keep original ID for reference
        name: item.tax_rate_name || 'Unnamed Tax',
        rate: String(item.tax_rate || 0), // Keep as string to match interface
        country: item.tax_rate_country || '',
        state: item.tax_rate_state || '',
        city: item.tax_rate_city || '',
        postcode: item.tax_rate_postcode || '',
        priority: parseInt(item.tax_rate_priority) || 1,
        compound: item.tax_rate_compound === '1' || item.tax_rate_compound === 1,
        shipping: item.tax_rate_shipping === '1' || item.tax_rate_shipping === 1,
        order: parseInt(item.tax_rate_order) || 0,
        class: item.tax_rate_class || 'standard',
        postcodes: [],
        cities: []
      }));
    } catch (error) {
      console.error('Error fetching location tax rates:', error);
      throw error;
    }
  }
}

export const taxService = new TaxService();