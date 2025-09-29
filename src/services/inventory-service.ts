/**
 * Flora Inventory Filter API Service
 * Handles all inventory-related API calls using the Flora Filter API
 */

import { FloraApiClient } from './api/flora-api-client';

export interface FloraProduct {
  id: number;
  name: string;
  sku: string;
  type: string;
  status: string;
  image?: string;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  inventory: Array<{
    location_id: string;
    location_name: string;
    stock: number;
    manage_stock: boolean;
  }>;
  total_stock: number;
  price?: number;
  regular_price?: number;
  sale_price?: string;
  blueprint_fields?: Array<{
    field_id: number;
    field_name: string;
    field_label: string;
    field_type: string;
    field_value: any;
    blueprint_id: number;
    blueprint_name: string;
  }>;
  meta_data?: Array<{
    id?: number;
    key: string;
    value: any;
  }>;
}

export interface FloraLocation {
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
  is_parent: boolean;
  children?: FloraLocation[];
}

export interface FloraInventoryOverview {
  total_products: string;
  total_stock_value: number;
  total_stock_quantity: number;
  low_stock_products: number;
  out_of_stock_products: number;
  locations_count: number;
  categories_breakdown: Array<{
    id: string;
    name: string;
    product_count: number;
    total_stock: number;
  }>;
  locations_breakdown: Array<{
    id: string;
    name: string;
    product_count: number;
    total_stock: number;
  }>;
}

export interface FloraFilterParams {
  location_id?: number;
  category_id?: number;
  search?: string;
  stock_status?: 'in_stock' | 'out_of_stock' | 'low_stock';
  min_stock?: number;
  max_stock?: number;
  product_type?: 'simple' | 'variable' | 'grouped' | 'external';
  sku?: string;
  price_min?: number;
  price_max?: number;
  orderby?: 'name' | 'sku' | 'price' | 'stock' | 'modified';
  order?: 'ASC' | 'DESC';
  per_page?: number;
  page?: number;
  aggregate_by_parent?: boolean;
}

export interface FloraApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total: number;
    page: number;
    per_page: number;
    pages: number;
    filters_applied?: Record<string, any>;
  };
  timestamp?: string;
}

export class InventoryService {
  private baseUrl = 'https://api.floradistro.com/wp-json/flora-im/v1';  // Flora IM plugin API
  private wpBaseUrl = 'https://api.floradistro.com/wp-json/wp/v2';
  private wcBaseUrl = 'https://api.floradistro.com/wp-json/wc/v3';
  private consumerKey = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
  private consumerSecret = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';
  
  // Cache invalidation to prevent stale data
  private lastSyncTime: number = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  /**
   * Helper method to add authentication to URLs
   */
  private withAuth(url: string): string {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}consumer_key=${this.consumerKey}&consumer_secret=${this.consumerSecret}`;
  }

  /**
   * Get filtered products using Magic2 API
   * Strategy: Use Magic2 for products and WooCommerce for detailed product data
   */
  async getFilteredProducts(filters: FloraFilterParams = {}, includeBlueprintFields = false): Promise<FloraApiResponse<FloraProduct[]>> {
    try {
      // Step 1: Get products from Magic2 API
      const params = new URLSearchParams();
      
      // Map filters to Magic2 API parameters
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.per_page) params.append('per_page', filters.per_page.toString());
      if (filters.search) params.append('search', filters.search);
      // NOTE: Flora IM API category filtering is broken - we'll filter client-side
      // if (filters.category_id) params.append('category', filters.category_id.toString());
      if (filters.location_id) params.append('location_id', filters.location_id.toString());
      if (filters.stock_status) params.append('stock_status', filters.stock_status);
      if (filters.product_type) params.append('product_type', filters.product_type);
      if (filters.sku) params.append('sku', filters.sku);
      if (filters.orderby) params.append('orderby', filters.orderby);
      if (filters.order) params.append('order', filters.order);
      if (filters.aggregate_by_parent) params.append('aggregate_by_parent', 'true');
      
      // Add cache-busting parameter to ensure fresh data
      params.append('_t', Date.now().toString());

      let productsResponse;
      try {
        const productsUrl = this.withAuth(`${this.baseUrl}/products?${params}`);
        productsResponse = await fetch(productsUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (networkError) {
        return {
          success: false,
          data: [],
          meta: { total: 0, pages: 0, page: 1, per_page: filters.per_page || -1 }
        };
      }

      if (!productsResponse.ok) {
        throw new Error(`Magic2 API error: ${productsResponse.status} ${productsResponse.statusText}`);
      }

      const productsData = await productsResponse.json();

      if (!productsData.success || !productsData.data) {
        return {
          success: false,
          data: [],
          meta: { total: 0, pages: 0, page: 1, per_page: filters.per_page || -1 }
        };
      }

      // The products endpoint already includes inventory data, no need to fetch separately
      // Just ensure the data format is correct and optionally enrich with blueprint fields
      const enrichedProducts = await Promise.all(productsData.data.map(async (product: any) => {
        // Inventory is already included in the product from the API
        // Just ensure location_id is a string (as expected by ProductItem)
        const inventory = product.inventory || [];
        
        // Calculate total stock from inventory
        const total_stock = inventory.reduce((sum: number, inv: any) => sum + (inv.stock || 0), 0);

        let blueprint_fields = product.blueprint_fields || [];
        
        // Fetch blueprint fields if requested and product has categories
        if (includeBlueprintFields && product.categories && product.categories.length > 0) {
          try {
            const blueprintFieldsData = await this.getBlueprintFieldsForProduct(product.id, product.categories);
            if (blueprintFieldsData && blueprintFieldsData.length > 0) {
              blueprint_fields = blueprintFieldsData;
            } else {
            }
          } catch (error) {
            // Continue with empty blueprint fields
          }
        }

        return {
          ...product,
          inventory,
          total_stock,
          stock_quantity: total_stock,
          stock_status: total_stock > 0 ? 'instock' : 'outofstock',
          blueprint_fields
        };
      }));

      // WORKAROUND: Flora IM API category filtering is broken, so filter client-side
      let finalProducts = enrichedProducts;
      if (filters.category_id) {
        finalProducts = enrichedProducts.filter((product: any) => {
          const hasCategory = product.categories?.some((cat: any) => cat.id === filters.category_id);
          if (!hasCategory) {
          }
          return hasCategory;
        });
      }

      // Always enrich with meta_data to get COA attachments and other WooCommerce metadata
      finalProducts = await this.enrichProductsWithMetaData(finalProducts);

      return {
        success: true,
        data: finalProducts,
        meta: {
          total: finalProducts.length,
          page: 1, // Reset to page 1 since we're filtering client-side
          per_page: filters.per_page || -1,
          pages: Math.ceil(finalProducts.length / (filters.per_page && filters.per_page > 0 ? filters.per_page : finalProducts.length))
        }
      };
    } catch (error) {
      throw error;
    }
  }







  /**
   * BULLETPROOF: Validate and normalize stock quantity
   */
  private validateStock(quantity: any): number {
    const parsed = parseFloat(quantity);
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  }

  /**
   * BULLETPROOF: Validate and normalize location ID for Flora compatibility
   */
  private validateLocationId(locationId: any): number {
    const parsed = parseInt(locationId);
    if (isNaN(parsed) || parsed <= 0) {
      return 0;
    }
    return parsed;
  }

  /**
   * BULLETPROOF: Calculate total stock with validation
   */
  private calculateTotalStock(inventory: any[]): number {
    if (!Array.isArray(inventory)) return 0;
    
    return inventory.reduce((sum: number, inv: any) => {
      return sum + this.validateStock(inv.stock);
    }, 0);
  }

  /**
   * Get inventory overview/dashboard data from Magic2 API
   */
  async getInventoryOverview(): Promise<FloraApiResponse<FloraInventoryOverview>> {
    try {
      // Magic2 doesn't have an overview endpoint yet, so we'll create a basic one
      // by getting products and locations data
      const [productsResult, locationsResult] = await Promise.all([
        this.getFilteredProducts({ per_page: 1 }), // Just get count
        this.getLocations()
      ]);

      const overview: FloraInventoryOverview = {
        total_products: productsResult.meta?.total?.toString() || '0',
        total_stock_value: 0,
        total_stock_quantity: 0,
        low_stock_products: 0,
        out_of_stock_products: 0,
        locations_count: locationsResult.data?.length || 0,
        categories_breakdown: [],
        locations_breakdown: []
      };

      return {
        success: true,
        data: overview
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all locations using Magic2 API
   */
  async getLocations(hierarchical = false, bustCache = false): Promise<FloraApiResponse<FloraLocation[]>> {
    try {
      // Use Portal API instead of direct Flora API to ensure proper cache busting
      let url = '/api/flora/locations';
      
      // Add cache busting parameter if requested
      if (bustCache) {
        url += `?_t=${Date.now()}`;
      } else {
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      

      if (!response.ok) {
        // Return default location if API not available
        return {
          success: true,
          data: [{
            id: 1,
            name: 'Main Location',
            slug: 'main-location',
            is_parent: false,
            is_active: '1',
            is_default: '1',
            children: []
          }]
        };
      }

      const data = await response.json();
      
      // Handle both array response and success/data format
      const locations = Array.isArray(data) ? data : (data.data || []);
      
      const transformedLocations = locations
        .filter((loc: any) => {
          // Filter out invalid locations - must have valid numeric ID and name  
          // Accept both string and numeric IDs as long as they convert to valid numbers
          const numericId = parseInt(loc.id);
          const hasValidId = loc.id && !isNaN(numericId) && numericId > 0;
          const hasValidName = loc.name && typeof loc.name === 'string' && loc.name.trim().length > 0;
          
          if (!hasValidId || !hasValidName) {
            console.log('InventoryService: Filtering out invalid location:', { id: loc.id, name: loc.name, numericId });
            return false;
          }
          
          return true;
        })
        .map((loc: any) => ({
          id: parseInt(loc.id),
          name: loc.name,
          slug: loc.slug || loc.name.toLowerCase().replace(/\s+/g, '-'),
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
          is_parent: loc.is_parent || false,
          parent_id: loc.parent_id,
          children: loc.children || []
        }));

      return {
        success: true,
        data: transformedLocations
      };
    } catch (error) {
      // Return default location on error
      return {
        success: true,
        data: [{
          id: 1,
          name: 'Main Location',
          slug: 'main-location',
          is_parent: false,
          is_active: '1',
          is_default: '1',
          children: []
        }]
      };
    }
  }

  /**
   * Get products for a specific location with aggregation support
   */
  async getLocationInventory(locationId: number, aggregateChildren = false): Promise<FloraApiResponse<FloraProduct[]>> {
    try {
      const params = new URLSearchParams({
        location_id: locationId.toString(),
        ...(aggregateChildren && { aggregate_by_parent: 'true' })
      });

      const response = await fetch(`${this.baseUrl}/inventory/filter?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Flora API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get location hierarchy with parent-child relationships
   */
  async getLocationHierarchy(): Promise<FloraApiResponse<FloraLocation[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/locations?hierarchical=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Flora API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get Flora locations using Magic2 API
   */
  async getFloraLocations(bustCache = false): Promise<FloraApiResponse<FloraLocation[]>> {
    try {
      // Use the same locations endpoint as Magic2 doesn't have a separate flora endpoint
      return await this.getLocations(true, bustCache);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get inventory alerts (low stock, out of stock, etc.)
   */
  async getInventoryAlerts(): Promise<FloraApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/inventory/alerts`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Flora API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get analytics data
   */
  async getAnalytics(endpoint: 'categories' | 'locations' | 'low-stock', params: Record<string, any> = {}): Promise<FloraApiResponse<any>> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const queryString = queryParams.toString() ? `?${queryParams}` : '';
      const response = await fetch(`${this.baseUrl}/analytics/${endpoint}${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Flora API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }



  /**
   * Get product images from WooCommerce API (just images, lightweight)
   */
  private async getProductImages(productIds: number[]): Promise<Record<number, string>> {
    try {
      if (productIds.length === 0) return {};

      // WooCommerce API supports filtering by multiple IDs
      const idsParam = productIds.join(',');
      const wcUrl = `${this.wcBaseUrl}/products?include=${idsParam}&per_page=100&_fields=id,images`;
      
      const response = await fetch(wcUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64')}`
        },
      });

      if (!response.ok) {
        return {};
      }

      const wcProducts = await response.json();
      const imagesMap: Record<number, string> = {};

      if (Array.isArray(wcProducts)) {
        wcProducts.forEach(product => {
          if (product.images && product.images.length > 0) {
            imagesMap[product.id] = product.images[0].src;
          }
        });
      }

      return imagesMap;
    } catch (error) {
      return {};
    }
  }

  /**
   * Update inventory stock quantity
   */
  async updateInventoryStock(inventoryId: number, quantity: number, reason?: string): Promise<any> {
    // This method is deprecated for Flora IM API - it expects product_id/location_id, not inventory record ID
    throw new Error('updateInventoryStock is not supported by Flora IM API. Use the fallback method in ProductItem instead.');
  }

  /**
   * Update inventory by product_id and location_id (Flora IM API compatible)
   */
  async updateInventoryByProductLocation(product_id: number, location_id: number, quantity: number, reason?: string): Promise<any> {
    try {
      const url = this.withAuth(`${this.baseUrl}/inventory`);
      
      const payload = {
        product_id,
        location_id,
        quantity,
        ...(reason && { reason })
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Stock update failed: ${response.status} ${response.statusText} - ${errorData.message || ''}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Bulk update inventory stock quantities
   * Uses Magic2 plugin bulk endpoint
   */
  async bulkUpdateInventoryStock(updates: Array<{product_id: number, location_id: number, quantity: number}>): Promise<any> {
    try {
      const response = await fetch('/api/flora/inventory/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ updates })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Bulk update failed');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Transfer stock between locations
   */
  async transferStock(productId: number, fromLocationId: number, toLocationId: number, quantity: number, reason?: string): Promise<any> {
    try {
      const response = await fetch('/api/flora/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          product_id: productId,
          from_location: fromLocationId,
          to_location: toLocationId,
          quantity,
          notes: reason
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Transfer failed');
      }

      const data = await response.json();
      return { success: true, ...data };

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Transfer failed' 
      };
    }
  }

  /**
   * Convert stock from one product to another (location-locked)
   */
  async convertStock(
    fromProductId: number, 
    toProductId: number, 
    locationId: number, 
    fromQuantity: number, 
    toQuantity: number, 
    notes?: string
  ): Promise<any> {
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch('/api/flora/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          from_product_id: fromProductId,
          to_product_id: toProductId,
          location_id: locationId,
          from_quantity: fromQuantity,
          to_quantity: toQuantity,
          notes
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        try {
          const errorData = await response.json();
          return { 
            success: false, 
            error: errorData.error || errorData.message || 'Conversion failed' 
          };
        } catch (parseError) {
          return { 
            success: false, 
            error: `Conversion failed: ${response.status}` 
          };
        }
      }

      // Get response as text first to handle malformed responses
      const responseText = await response.text();
      
      try {
        const data = JSON.parse(responseText);
        return { success: true, ...data };
      } catch (parseError) {
        // Handle malformed JSON response (HTML error + JSON)
        const jsonStart = responseText.indexOf('{"');
        if (jsonStart > 0) {
          try {
            const cleanJson = responseText.substring(jsonStart);
            const data = JSON.parse(cleanJson);
            return { success: true, ...data };
          } catch (cleanParseError) {
            return { 
              success: false, 
              error: 'Invalid response format from server' 
            };
          }
        }
        return { 
          success: false, 
          error: 'Invalid response format from server' 
        };
      }

    } catch (error) {
      
      // Handle timeout/abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        return { 
          success: false, 
          error: 'Request timed out. The server took too long to respond. Please try again.' 
        };
      }
      
      // More detailed error messages for common issues
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return { 
          success: false, 
          error: 'Network connection error. Please check your internet connection and try again.' 
        };
      }
      
      if (error instanceof Error && error.message.includes('NetworkError')) {
        return { 
          success: false, 
          error: 'Network error: Unable to reach the server. Please try again.' 
        };
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? `Conversion failed: ${error.message}` : 'Conversion failed: Unknown error' 
      };
    }
  }

  /**
   * Get product with blueprint fields from Flora Fields API
   */
  async getProductWithBlueprintFields(productId: number): Promise<any> {
    try {
      // Use Next.js API route to avoid CORS issues
      const response = await fetch(`/api/flora/products/${productId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const apiResponse = await response.json();
      
      // Check if the API response has the expected format
      if (!apiResponse.success) {
        throw new Error(apiResponse.error || 'Failed to fetch product');
      }
      
      const productData = apiResponse.data;
      
      // Blueprint fields are already included in the API response
      if (!productData.blueprint_fields) {
        // Fallback: Get blueprint fields if not included
        try {
          const blueprintFields = await this.getBlueprintFieldsForProduct(productId, productData.categories || []);
          productData.blueprint_fields = blueprintFields;
        } catch (blueprintError) {
          productData.blueprint_fields = [];
        }
      }
      
      return productData;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get blueprint fields for a product based on assignments
   */
  private async getBlueprintFieldsForProduct(productId: number, categories: Array<{id: number, name: string}>): Promise<any[]> {
    try {
      // Use our new API endpoint that properly fetches blueprint fields with values
      const response = await fetch(`/api/blueprint-fields/${productId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        return [];
      }
      
      const result = await response.json();
      
      if (result.success && result.fields) {
        return result.fields;
      } else {
        return [];
      }
    } catch (error) {
      return [];
    }
  }

  /**
   * @deprecated Legacy method - use blueprint fields instead
   */
  private parseMetaDataToACF(metaData: Array<{id: number, key: string, value: any}>): Record<string, any> {
    const acf: Record<string, any> = {};
    const inventoryData: Record<string, any> = {};
    const healthData: Record<string, any> = {};
    const pricingData: Record<string, any> = {};

    metaData.forEach(meta => {
      const key = meta.key;
      const value = meta.value;

      // Cannabis-specific ACF fields (from your field groups)
      if (['nose', 'effects', 'terpene', 'strain_type', 'lineage'].includes(key)) {
        acf[key] = value;
      }
      // Parse inventory data
      else if (key.startsWith('af_mli_inventory_')) {
        const match = key.match(/af_mli_inventory_(\d+)_(.+)/);
        if (match) {
          const [, index, field] = match;
          if (!inventoryData[index]) inventoryData[index] = {};
          inventoryData[index][field] = value;
        }
      }
      // Parse health data
      else if (key.startsWith('af_mli_health_')) {
        const match = key.match(/af_mli_health_(\d+)_(.+)/);
        if (match) {
          const [, index, field] = match;
          if (!healthData[index]) healthData[index] = {};
          healthData[index][field] = value;
        }
      }
      // Skip individual pricing fields - we only want the JSON structure
      // else if (key.startsWith('_price_per_gram_')) {
      //   const weight = key.replace('_price_per_gram_', '');
      //   pricingData[weight] = value;
      // }
      // Parse other important product fields
      else if (key.startsWith('_') && !key.startsWith('_af_mli_')) {
        const cleanKey = key.substring(1);
        // Include important product fields
        if (['weight_based_pricing', 'bulk_inventory_grams', 'deli_style_product'].includes(cleanKey)) {
          acf[cleanKey] = value;
        }
      }
      // Parse other cannabis/product fields
      else if ([
        'available_weights', 'mli_product_type', 'mli_weight_options', 
        'mli_preroll_conversion', 'bulk_inventory_grams',
        'weight_based_pricing'
      ].includes(key)) {
        acf[key] = value;
      }
      // Parse JSON pricing tiers
      else if (key === 'mli_pricing_tiers') {
        try {
          const parsedValue = typeof value === 'string' ? JSON.parse(value) : value;
          acf[key] = parsedValue;
        } catch (e) {
          acf[key] = value;
        }
      }
      // Parse other Magic2 fields
      else if (key.startsWith('af_mli_') && !key.includes('inventory_') && !key.includes('health_') && !key.includes('location_')) {
        acf[key] = value;
      }
    });

    // Structure inventory data as arrays (filter out empty entries)
    if (Object.keys(inventoryData).length > 0) {
      acf.inventory_locations = Object.values(inventoryData).filter(inv => inv.name && inv.name.trim());
    }

    // Structure health data as arrays (filter out empty entries)
    if (Object.keys(healthData).length > 0) {
      acf.health_data = Object.values(healthData).filter(health => health.location && health.location.trim());
    }

    // Remove hardcoded pricing fallbacks - only use actual JSON data
    // if (Object.keys(pricingData).length > 0 && !acf.mli_pricing_tiers) {
    //   acf.weight_pricing = pricingData;
    // }

    return acf;
  }

  /**
   * @deprecated Legacy method - use blueprint fields instead
   */
  async getCategoriesWithACF(): Promise<any[]> {
    try {
      const response = await fetch(`${this.wcBaseUrl}/products/categories?per_page=100`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from('ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5:cs_38194e74c7ddc5d72b6c32c70485728e7e529678').toString('base64')}`
        },
      });

      if (!response.ok) {
        throw new Error(`WooCommerce API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * @deprecated Legacy method - use blueprint fields instead
   */
  async getACFFieldGroups(context: { post_type?: string; category_id?: number } = {}): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (context.post_type) params.append('post_type', context.post_type);
      if (context.category_id) params.append('category_id', context.category_id.toString());

      const queryString = params.toString() ? `?${params}` : '';
      const response = await fetch(`${this.wpBaseUrl}/acf/v3/field-groups${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Fallback: try to get field groups from a different endpoint
        const fallbackResponse = await fetch(`${this.wpBaseUrl}/field-groups`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (fallbackResponse.ok) {
          return await fallbackResponse.json();
        }
        
        return [];
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get all available blueprint fields that can be used as table columns
   */
  async getAvailableBlueprintFields(): Promise<any[]> {
    try {
      
      const response = await fetch('/api/flora/available-blueprint-fields', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch available blueprint fields: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to fetch available blueprint fields');
      }
    } catch (error) {
      return [];
    }
  }

  /**
   * Enrich products with WooCommerce meta data for blueprint field values
   */
  async enrichProductsWithMetaData(products: FloraProduct[]): Promise<FloraProduct[]> {
    
    const enrichedProducts = await Promise.all(
      products.map(async (product) => {
        try {
          // Fetch full WooCommerce product data to get meta_data
          const wcUrl = `${this.baseUrl.replace('/flora-im/v1', '')}/wc/v3/products/${product.id}?consumer_key=${this.consumerKey}&consumer_secret=${this.consumerSecret}`;
          
          const response = await fetch(wcUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const wcProduct = await response.json();
            return {
              ...product,
              meta_data: wcProduct.meta_data || []
            };
          } else {
            return product;
          }
        } catch (error) {
          return product;
        }
      })
    );
    
    return enrichedProducts;
  }

  /**
   * Load blueprint fields for existing products
   */
  async loadBlueprintFieldsForProducts(products: FloraProduct[]): Promise<FloraProduct[]> {
    
    const enrichedProducts = await Promise.all(
      products.map(async (product) => {
        if (product.categories && product.categories.length > 0) {
          try {
            const blueprintFieldsData = await this.getBlueprintFieldsForProduct(product.id, product.categories);
            if (blueprintFieldsData && blueprintFieldsData.length > 0) {
              return {
                ...product,
                blueprint_fields: blueprintFieldsData
              };
            }
          } catch (error) {
          }
        }
        return product;
      })
    );
    
    return enrichedProducts;
  }
}

// Export singleton instance
export const inventoryService = new InventoryService();