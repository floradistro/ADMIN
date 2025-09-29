export interface Product {
  id: number;
  name: string;
  sku: string;
  type: string;
  status: string;
  description?: string;
  short_description?: string;
  regular_price?: string | number;
  price?: number;
  sale_price?: string;
  weight?: string;
  image?: string;
  categories?: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  inventory?: Array<{
    id?: number; // Inventory record ID for updates
    location_id: string | number;
    location_name: string;
    stock: number;
    quantity?: number; // Alternative name for stock
    manage_stock: boolean;
  }>;
  total_stock: number;
  blueprint_fields?: BlueprintFieldValue[];
  meta_data?: Array<{
    id?: number;
    key: string;
    value: any;
  }>;
}

export interface BlueprintFieldValue {
  field_id: number;
  field_name: string;
  field_label: string;
  field_type: string;
  field_value: any;
  blueprint_id: number;
  blueprint_name: string;
  field_description?: string;
  validation_rules?: Record<string, any>;
  display_options?: Record<string, any>;
  is_required?: boolean;
  is_searchable?: boolean;
}

export interface LocationInventory {
  location_id: string;
  location_name: string;
  stock: number;
  manage_stock: boolean;
}



export interface Location {
  id: number;
  name: string;
  slug: string;
  parent_id?: number;
  is_parent: boolean;
  address?: string;
}

export type TabType = 'basic' | 'blueprints' | 'pricing' | 'locations' | 'json';

export interface TabConfig {
  id: TabType;
  title: string;
  icon: React.ReactNode;
}

export interface FilterState {
  selectedLocationId: string;
  searchQuery: string;
  selectedCategory: string;
  hideZeroQuantity: boolean;
  showSelectedOnly: boolean;
}

export interface ColumnConfig {
  id: string;
  label: string;
  width?: string;
  visible: boolean;
  type: 'default' | 'blueprint';
  blueprint_field_name?: string;
  blueprint_field_type?: string;
}

export interface TableViewState {
  visibleColumns: string[];
  columnConfigs: ColumnConfig[];
}

export interface ViewState {
  isMenuOpen: boolean;
  isCustomerViewOpen: boolean;
  showOverview: boolean;
  isOrdersViewOpen: boolean;
  isSettingsOpen: boolean;
  isCoaViewOpen: boolean;
  isMediaViewOpen: boolean;
  isReportsViewOpen: boolean;
  expandedItems: Set<number>;
  editingProduct: Product | null;
  activeTab: TabType;
}