/**
 * Mutation Hooks Index
 * Centralized export for all mutation hooks
 */

// Inventory Mutations
export {
  useUpdateInventoryMutation,
  useBulkUpdateInventoryMutation,
  useTransferStockMutation,
  useConvertStockMutation
} from './inventory';

// Product Mutations
export {
  useCreateProductMutation,
  useUpdateProductMutation,
  useUpdateProductBlueprintFieldsMutation
} from './products';

// Types
export type {
  InventoryUpdateParams,
  BulkInventoryUpdateParams,
  StockTransferParams,
  StockConversionParams
} from './inventory';

export type {
  ProductCreateParams,
  ProductUpdateParams
} from './products';
