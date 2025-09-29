// Flora Inventory Matrix - Magic2 Plugin API Integration
// Successfully connected to Magic2 plugin via WooCommerce API authentication

const API_BASE = 'https://api.floradistro.com/wp-json/flora-im/v1';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

// Helper to add auth to URLs
const withAuth = (url: string) => {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
};

// Generic fetch wrapper with error handling
async function apiCall<T = any>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = withAuth(`${API_BASE}${endpoint}`);
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Product Types
export interface Product {
  id: string;
  name: string;
  sku: string | null;
}

// Location Types
export interface Location {
  id: string;
  name: string;
  slug: string;
  address?: string;
  status: string;
}

// Inventory Types
export interface InventoryItem {
  id: string;
  product_id: string;
  location_id: string;
  quantity: string;
  reserved_quantity: string;
  product_name?: string;
  location_name?: string;
  location_slug?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

// API Methods
export const floraAPI = {
  // Products (from WooCommerce via Magic2 plugin)
  products: {
    list: (params?: { search?: string; page?: number; per_page?: number }) => 
      apiCall<PaginatedResponse<Product>>(`/products${params ? '?' + new URLSearchParams(params as any).toString() : ''}`),
  },

  // Locations
  locations: {
    list: () => apiCall<{ success: boolean; data: Location[] }>('/locations'),
    
    create: (data: { name: string; slug?: string; address?: string }) =>
      apiCall('/locations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Inventory
  inventory: {
    list: (params?: { product_id?: string; location_id?: string; page?: number; per_page?: number }) =>
      apiCall<PaginatedResponse<InventoryItem>>(`/inventory${params ? '?' + new URLSearchParams(params as any).toString() : ''}`),
    
    create: (data: { product_id: string; location_id: string; quantity: number }) =>
      apiCall('/inventory', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    update: (id: string, data: { quantity?: number; reserved_quantity?: number }) =>
      apiCall(`/inventory/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    delete: (id: string) =>
      apiCall(`/inventory/${id}`, {
        method: 'DELETE',
      }),
    
    bulkUpdate: (updates: Array<{ product_id: string; location_id: string; quantity: number }>) =>
      apiCall('/inventory/bulk-update', {
        method: 'POST',
        body: JSON.stringify({ updates }),
      }),
  },
};

// Helper function to group inventory by product
export function groupInventoryByProduct(items: InventoryItem[]) {
  const grouped = new Map<string, {
    product_id: string;
    product_name: string;
    locations: InventoryItem[];
    total_quantity: number;
  }>();

  items.forEach(item => {
    const key = item.product_id;
    if (!grouped.has(key)) {
      grouped.set(key, {
        product_id: item.product_id,
        product_name: item.product_name || `Product #${item.product_id}`,
        locations: [],
        total_quantity: 0,
      });
    }
    
    const group = grouped.get(key)!;
    group.locations.push(item);
    group.total_quantity += parseFloat(item.quantity);
  });

  return Array.from(grouped.values());
}