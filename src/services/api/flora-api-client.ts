/**
 * Consolidated Flora API Client
 * Single source of truth for all Flora API interactions
 */

export interface ApiConfig {
  baseUrl: string;
  wpBaseUrl: string;
  wcBaseUrl: string;
  consumerKey: string;
  consumerSecret: string;
}

export class FloraApiClient {
  private static instance: FloraApiClient;
  private config: ApiConfig;
  
  private constructor() {
    this.config = {
      baseUrl: 'https://api.floradistro.com/wp-json/flora-im/v1',
      wpBaseUrl: 'https://api.floradistro.com/wp-json/wp/v2',
      wcBaseUrl: 'https://api.floradistro.com/wp-json/wc/v3',
      consumerKey: 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5',
      consumerSecret: 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678'
    };
  }
  
  public static getInstance(): FloraApiClient {
    if (!FloraApiClient.instance) {
      FloraApiClient.instance = new FloraApiClient();
    }
    return FloraApiClient.instance;
  }
  
  /**
   * Add authentication to URLs
   */
  private withAuth(url: string): string {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}consumer_key=${this.config.consumerKey}&consumer_secret=${this.config.consumerSecret}`;
  }
  
  /**
   * Generic fetch wrapper with error handling
   */
  private async fetchWithAuth<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = this.withAuth(`${this.config.baseUrl}${endpoint}`);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Products API
   */
  public products = {
    list: (params?: Record<string, any>) => {
      const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
      return this.fetchWithAuth(`/products${queryString}`);
    },
    
    get: (id: number) => {
      return this.fetchWithAuth(`/products/${id}`);
    },
    
    update: (id: number, data: any) => {
      return this.fetchWithAuth(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    }
  };
  
  /**
   * Inventory API
   */
  public inventory = {
    list: (params?: Record<string, any>) => {
      const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
      return this.fetchWithAuth(`/inventory${queryString}`);
    },
    
    update: (productId: number, locationId: number, quantity: number) => {
      return this.fetchWithAuth('/inventory', {
        method: 'POST',
        body: JSON.stringify({
          product_id: productId,
          location_id: locationId,
          quantity: quantity
        })
      });
    },
    
    bulkUpdate: (updates: Array<{ product_id: number; location_id: number; quantity: number }>) => {
      return this.fetchWithAuth('/inventory/bulk', {
        method: 'POST',
        body: JSON.stringify({ updates })
      });
    }
  };
  
  /**
   * Locations API
   */
  public locations = {
    list: () => {
      return this.fetchWithAuth('/locations');
    },
    
    get: (id: number) => {
      return this.fetchWithAuth(`/locations/${id}`);
    },
    
    create: (data: { name: string; slug?: string; address?: string }) => {
      return this.fetchWithAuth('/locations', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    
    update: (id: number, data: any) => {
      return this.fetchWithAuth(`/locations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    }
  };
  
  /**
   * Categories API
   */
  public categories = {
    list: () => {
      return this.fetchWithAuth('/categories');
    }
  };
  
  /**
   * Users API
   */
  public users = {
    list: (includeAppPasswords = false) => {
      const params = includeAppPasswords ? '?include_app_passwords=true' : '';
      return this.fetchWithAuth(`/users${params}`);
    },
    
    get: (id: number) => {
      return this.fetchWithAuth(`/users/${id}`);
    },
    
    create: (data: any) => {
      return this.fetchWithAuth('/users', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    
    update: (id: number, data: any) => {
      return this.fetchWithAuth(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    
    delete: (id: number) => {
      return this.fetchWithAuth(`/users/${id}`, {
        method: 'DELETE'
      });
    }
  };
  
  /**
   * Audit API
   */
  public audit = {
    recent: (limit = 50) => {
      return this.fetchWithAuth(`/audit/recent?limit=${limit}`);
    }
  };
}