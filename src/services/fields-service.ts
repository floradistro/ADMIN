/**
 * Flora Fields Service - V2 API
 * Connects to flora-fields plugin V2 endpoints
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

  async getFields(params?: {
    status?: 'active' | 'inactive';
    type?: string;
    group?: string;
    search?: string;
    page?: number;
    per_page?: number;
  }): Promise<{ fields: FloraField[]; total: number; page: number; per_page: number }> {
    const path = '/fd/v2/fields';
    const url = new URL(this.buildUrl(path));
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Failed to fetch fields: ${response.statusText}`);
    }

    return response.json();
  }

  async getField(fieldId: number): Promise<FloraField> {
    return this.request<FloraField>(`/fd/v2/fields/${fieldId}`);
  }

  async createField(data: {
    name: string;
    label: string;
    type: string;
    group_label?: string;
    description?: string;
    config?: any;
    sort_order?: number;
    status?: 'active' | 'inactive';
  }): Promise<{ message: string; field: FloraField }> {
    return this.request(`/fd/v2/fields`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateField(fieldId: number, data: Partial<FloraField>): Promise<{ message: string; field: FloraField }> {
    return this.request(`/fd/v2/fields/${fieldId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteField(fieldId: number): Promise<{ message: string; deleted: boolean }> {
    return this.request(`/fd/v2/fields/${fieldId}`, {
      method: 'DELETE',
    });
  }

  async bulkAssignFields(fieldId: number, assignments: Array<{
    type: 'global' | 'category' | 'product';
    target_id?: number;
    options?: {
      is_required?: boolean;
      sort_order?: number;
    };
  }>): Promise<{ message: string; count: number }> {
    return this.request(`/fd/v2/fields/bulk-assign`, {
      method: 'POST',
      body: JSON.stringify({ field_id: fieldId, assignments }),
    });
  }

  // ========================================
  // PRODUCTS API
  // ========================================

  async getProductFields(productId: number): Promise<ProductFieldsResponse> {
    return this.request<ProductFieldsResponse>(`/fd/v2/products/${productId}/fields`);
  }

  async updateProductFields(productId: number, fields: Record<string, any>): Promise<{
    message: string;
    updated: string[];
    count: number;
  }> {
    return this.request(`/fd/v2/products/${productId}/fields`, {
      method: 'PUT',
      body: JSON.stringify({ fields }),
    });
  }

  // ========================================
  // CATEGORIES API
  // ========================================

  async getCategoryFields(categoryId: number): Promise<{ category_id: number; fields: FloraField[] }> {
    return this.request(`/fd/v2/categories/${categoryId}/fields`);
  }

  // ========================================
  // PRICING API
  // ========================================

  async getPricingRules(): Promise<{ rules: PricingRule[]; count: number }> {
    return this.request(`/fd/v2/pricing/rules`);
  }

  async getProductForms(productId: number): Promise<{ product_id: number; forms: ProductForm[] }> {
    return this.request(`/fd/v2/pricing/forms/${productId}`);
  }

  async createProductForm(data: {
    product_id: number;
    form_name: string;
    form_label?: string;
    unit_type?: string;
    base_quantity?: number;
    base_unit?: string;
    base_price_cents?: number;
    cost_cents?: number;
    is_primary?: boolean;
    sort_order?: number;
  }): Promise<{ message: string; form_id: number }> {
    return this.request(`/fd/v2/pricing/forms`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async calculatePrice(data: {
    product_id: number;
    form_id?: number;
    quantity?: number;
    customer_tier?: string;
    channel?: string;
  }): Promise<{
    price_cents: number;
    base_price_cents: number;
    rules_applied: any[];
  }> {
    return this.request(`/fd/v2/pricing/calculate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const fieldsService = new FieldsService();

