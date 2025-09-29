/**
 * Centralized API Endpoints Configuration
 * Single source of truth for all API endpoint paths
 */

export const ENDPOINTS = {
  // Products
  PRODUCTS: {
    LIST: '/products',
    GET: (id: number) => `/products/${id}`,
    UPDATE: (id: number) => `/products/${id}`,
    CREATE: '/products',
  },

  // Inventory
  INVENTORY: {
    LIST: '/inventory',
    UPDATE: '/inventory',
    BULK_UPDATE: '/inventory/bulk-update',
    TRANSFER: '/transfer',
    CONVERT: '/convert',
  },

  // Locations
  LOCATIONS: {
    LIST: '/locations',
    GET: (id: number) => `/locations/${id}`,
    CREATE: '/locations',
    UPDATE: (id: number) => `/locations/${id}`,
  },

  // Categories
  CATEGORIES: {
    LIST: '/categories',
    GET: (id: number) => `/categories/${id}`,
  },

  // Users
  USERS: {
    LIST: '/users',
    GET: (id: number) => `/users/${id}`,
    CREATE: '/users',
    UPDATE: (id: number) => `/users/${id}`,
    DELETE: (id: number) => `/users/${id}`,
  },

  // Audit
  AUDIT: {
    RECENT: '/audit/recent',
  },

  // Blueprint Fields
  BLUEPRINT_FIELDS: {
    FOR_PRODUCT: (productId: number) => `/blueprint-fields/${productId}`,
    AVAILABLE: '/flora/available-blueprint-fields',
  },

  // Analytics
  ANALYTICS: {
    CATEGORIES: '/analytics/categories',
    LOCATIONS: '/analytics/locations',
    LOW_STOCK: '/analytics/low-stock',
  },
} as const;

export type EndpointFunction = (...args: any[]) => string;
export type EndpointValue = string | EndpointFunction;
