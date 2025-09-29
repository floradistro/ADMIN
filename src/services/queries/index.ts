/**
 * Query Hooks Index
 * Centralized export for all query hooks
 */

// Product Queries
export {
  useProductsQuery,
  useProductQuery,
  useProductsWithBlueprintsQuery,
  PRODUCT_QUERY_KEYS
} from './products';

// Location Queries
export {
  useLocationsQuery,
  useLocationQuery,
  useLocationHierarchyQuery,
  LOCATION_QUERY_KEYS
} from './locations';

// Category Queries
export {
  useCategoriesQuery,
  useCategoryQuery,

  CATEGORY_QUERY_KEYS
} from './categories';

// Types
export type { Category, CategoryResponse } from './categories';
