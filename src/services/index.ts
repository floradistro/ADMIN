/**
 * Services Index
 * Centralized export for all services, queries, and mutations
 */

// API Client
export { apiClient } from './api/client';
export { ENDPOINTS } from './api/endpoints';

// Query Hooks
export * from './queries';

// Mutation Hooks  
export * from './mutations';

// Service exports for backward compatibility
export { inventoryService } from './inventory-service';
export { FloraApiClient } from './api/flora-api-client';
export { fieldsService } from './fields-service';
export { bulkApiService } from './bulk-api-service';

// Query Client
export { queryClient } from '../lib/query-client';

// Types
export type { ApiConfig } from './api/client';
export type {
  FloraProduct,
  FloraLocation,
  FloraInventoryOverview,
  FloraFilterParams,
  FloraApiResponse
} from './inventory-service';
export type {
  FloraField,
  ProductFieldsResponse,
  PricingRule,
  ProductForm
} from './fields-service';
export type {
  BulkProduct,
  BulkOrder,
  BulkCustomer,
  BulkProductsParams,
  BulkOrdersParams,
  BulkCustomersParams,
  BulkResponse
} from './bulk-api-service';
