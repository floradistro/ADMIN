/**
 * Flora Fields Service - V3 Native API
 * Connects to flora-fields plugin V3 native endpoints
 * Uses native WooCommerce storage (no custom tables)
 */

const FLORA_API_BASE = 'https://api.floradistro.com/wp-json';
const FLORA_CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const FLORA_CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

export interface FloraField {
  id: number;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'date' | 'url' | 'email';
  group_label?: string;
  description?: string;
  config: {
    default_value?: any;
    options?: string[];
    placeholder?: string;
    min?: number;
    max?: number;
    required?: boolean;
    validation?: any;
  };
  sort_order: number;
  status: 'active' | 'inactive';
  is_required?: boolean;
  value?: any;
  has_value?: boolean;
}

export interface ProductFieldsResponse {
  product_id: number;
  fields: FloraField[];
  raw_values: Record<string, any>;
}

export interface PricingRule {
  id: number;
  rule_name: string;
  rule_type: string;
  priority: number;
  conditions: any;
  actions: any;
  is_active: boolean;
}

export interface ProductForm {
  id: number;
  product_id: number;
  form_name: string;
  form_label: string;
  unit_type: string;
  base_quantity: number;
  base_unit: string;
  base_price_cents: number;
  cost_cents: number;
  is_active: boolean;
  is_primary: boolean;
  sort_order: number;
}

class FieldsService {
  private buildUrl(path: string): string {
    const url = new URL(`${FLORA_API_BASE}${path}`);
    url.searchParams.append('consumer_key', FLORA_CONSUMER_KEY);
    url.searchParams.append('consumer_secret', FLORA_CONSUMER_SECRET);
    return url.toString();
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = this.buildUrl(path);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Fields API error: ${response.statusText} - ${error}`);
    }

    return response.json();
  }

  // ========================================
  // FIELDS API
  // ========================================

  async getFieldLibrary(): Promise<{ fields: FloraField[]; count: number }> {
    return this.request<{ fields: FloraField[]; count: number }>(`/fd/v3/fields/library`);
  }

  async addFieldToLibrary(data: {
    name: string;
    label: string;
    type: string;
    group?: string;
    config?: any;
  }): Promise<{ success: boolean; message: string; field: FloraField }> {
    return this.request(`/fd/v3/fields/library`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFieldInLibrary(fieldName: string, data: Partial<FloraField>): Promise<{ success: boolean; message: string; field: FloraField }> {
    return this.request(`/fd/v3/fields/library/${fieldName}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFieldFromLibrary(fieldName: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/fd/v3/fields/library/${fieldName}`, {
      method: 'DELETE',
    });
  }

  async getGlobalFields(): Promise<{ global_fields: Record<string, any>; field_count: number }> {
    return this.request<{ global_fields: Record<string, any>; field_count: number }>(`/fd/v3/fields/global`);
  }

  async updateGlobalFields(globalFields: Record<string, any>): Promise<{ success: boolean; message: string }> {
    return this.request(`/fd/v3/fields/global`, {
      method: 'POST',
      body: JSON.stringify({ global_fields: globalFields }),
    });
  }

  // ========================================
  // PRODUCTS API
  // ========================================

  async getProductFields(productId: number): Promise<{ product_id: number; fields: FloraField[] }> {
    return this.request<{ product_id: number; fields: FloraField[] }>(`/fd/v3/products/${productId}/fields`);
  }

  async updateProductFields(productId: number, fields: Record<string, any>): Promise<{
    success: boolean;
    message: string;
    updated_fields: string[];
    count: number;
  }> {
    return this.request(`/fd/v3/products/${productId}/fields`, {
      method: 'PUT',
      body: JSON.stringify({ fields }),
    });
  }

  // ========================================
  // CATEGORIES API
  // ========================================

  async getCategoryFields(categoryId: number): Promise<{ 
    category_id: string;
    category_name: string;
    assigned_fields: Record<string, any>;
    field_count: number;
  }> {
    return this.request(`/fd/v3/categories/${categoryId}/fields`);
  }

  async updateCategoryFields(categoryId: number, assignedFields: Record<string, any>): Promise<{
    success: boolean;
    message: string;
    category_id: string;
    field_count: number;
  }> {
    return this.request(`/fd/v3/categories/${categoryId}/fields`, {
      method: 'POST',
      body: JSON.stringify({ assigned_fields: assignedFields }),
    });
  }

  // ========================================
  // PRICING API (V3 Native)
  // ========================================

  async getProductPricing(productId: number): Promise<{
    product_id: string;
    base_price: number;
    current_price: number;
    quantity_tiers: Array<{
      min_qty?: number;
      max_qty?: number | null;
      qty?: number;
      weight?: string;
      quantity?: number;
      price: number;
      discount_percent?: number;
    }>;
    role_pricing: Record<string, { discount_percent: number }>;
    channel_pricing: any[];
  }> {
    return this.request(`/fd/v3/products/${productId}/pricing`);
  }

  async updateProductPricing(productId: number, data: {
    base_price?: number;
    quantity_tiers?: any[];
    role_pricing?: Record<string, any>;
    channel_pricing?: any[];
  }): Promise<{
    success: boolean;
    message: string;
    product_id: string;
    updated: string[];
  }> {
    return this.request(`/fd/v3/products/${productId}/pricing`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

export const fieldsService = new FieldsService();

