// Inventory-specific types for better organization

export interface InventoryItem {
  id: number;
  product_id: number;
  product_name: string;
  location_id: number | string;
  location_name: string;
  quantity: number;
  reserved_quantity?: number;
}

export interface GroupedInventoryItem {
  product_id: number;
  product_name: string;
  locations: InventoryItem[];
  total_quantity: number;
}

export interface InventoryFilters {
  search?: string;
  locationId?: string;
  categoryId?: string;
  page?: number;
  per_page?: number;
}

export interface InventoryTableColumn<T = any> {
  key: string;
  header: string | React.ReactNode;
  accessor?: (item: T) => any;
  render?: (item: T, value: any) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
  width?: string;
}

export interface DataTableProps<T = any> {
  data: T[];
  columns: InventoryTableColumn<T>[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
}