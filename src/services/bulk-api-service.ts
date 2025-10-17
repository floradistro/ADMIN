/**
 * Bulk API Service - V2 Optimized
 * Uses flora-inventory-matrix bulk endpoints
 * Reduces 300+ API calls to 1 per resource type
 */

export interface BulkProductsParams {
  location_id?: number;
  category?: number;
  per_page?: number;
  page?: number;
  restock_mode?: boolean;
  audit_mode?: boolean;
}

export interface BulkOrdersParams {
  status?: string;
  location_id?: number;
  customer_id?: number;
  date_from?: string; // YYYY-MM-DD
  date_to?: string; // YYYY-MM-DD
  per_page?: number;
  page?: number;
}

export interface BulkCustomersParams {
  role?: string;
  search?: string;
  per_page?: number;
  page?: number;
  include_stats?: boolean;
}

export interface BulkResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    load_time_ms: number;
    queries_executed: number;
    optimization: string;
  };
}

export interface BulkProduct {
  id: number;
  name: string;
  sku: string;
  type: string;
  status: string;
  description?: string;
  short_description?: string;
  regular_price: string;
  sale_price: string | null;
  image: string | null;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  inventory: Array<{
    location_id: number;
    location_name: string;
    stock: number;
    quantity: number;
    manage_stock: boolean;
  }>;
  total_stock: number;
  fields: Array<{
    id: number;
    name: string;
    label: string;
    type: string;
    value: any;
    has_value: boolean;
    is_required: boolean;
    config: any;
  }>;
  meta_data: Array<{
    key: string;
    value: string;
  }>;
}

export interface BulkOrder {
  id: number;
  pos_order_id: number;
  date_created: string;
  status: string;
  total: number;
  subtotal: number;
  tax_total: number;
  payment_method: string;
  is_split_payment: boolean;
  cash_received: number | null;
  change_given: number | null;
  location_id: number;
  employee_id: number;
  customer_id: number;
  customer_name: string;
  customer_email: string;
  line_items: Array<{
    id: number;
    name: string;
    product_id: number;
    variation_id: number;
    sku: string;
    quantity: number;
    price: number;
    total: number;
    category: string;
  }>;
}

export interface BulkCustomer {
  id: number;
  username: string;
  email: string;
  display_name: string;
  first_name: string;
  last_name: string;
  phone: string;
  billing: {
    email: string;
    phone: string;
    address_1: string;
    city: string;
    state: string;
    postcode: string;
  };
  stats: {
    total_orders: number;
    total_spent: number;
    last_order_date: string | null;
    points_balance?: number;
  };
  role: string;
}

class BulkApiService {
  private buildQueryString(params: Record<string, any>): string {
    const urlParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        urlParams.append(key, String(value));
      }
    });
    return urlParams.toString();
  }

  /**
   * Get products in bulk with inventory, pricing, and fields
   * Replaces 300+ individual API calls with 1 optimized query
   */
  async getProducts(params: BulkProductsParams = {}): Promise<BulkResponse<BulkProduct>> {
    const queryString = this.buildQueryString(params);
    const url = `/api/bulk/products${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch bulk products');
    }

    return response.json();
  }

  /**
   * Get orders in bulk with line items and customer data
   */
  async getOrders(params: BulkOrdersParams = {}): Promise<BulkResponse<BulkOrder>> {
    const queryString = this.buildQueryString(params);
    const url = `/api/bulk/orders${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch bulk orders');
    }

    return response.json();
  }

  /**
   * Get customers in bulk with stats and meta
   */
  async getCustomers(params: BulkCustomersParams = {}): Promise<BulkResponse<BulkCustomer>> {
    const queryString = this.buildQueryString(params);
    const url = `/api/bulk/customers${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch bulk customers');
    }

    return response.json();
  }
}

export const bulkApiService = new BulkApiService();

