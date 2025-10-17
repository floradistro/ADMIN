import { Product } from './index';

export interface ListColumn {
  id: string;
  label: string;
  field: string;
  type: 'default' | 'blueprint' | 'custom';
  visible: boolean;
  width?: string;
  accessor?: string;
}

export interface ListProduct {
  productId: number;
  productData: Partial<Product>;
  snapshot: Record<string, any>;
}

export interface ProductList {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  products: ListProduct[];
  columns: ListColumn[];
  settings: {
    theme: 'dark' | 'light';
    includeImages: boolean;
    includeCOA: boolean;
    includePricing: boolean;
    includeInventory: boolean;
    customFields: string[];
  };
  metadata?: {
    totalProducts: number;
    lastExported?: string;
    exportCount: number;
  };
}

export interface ListExportOptions {
  format: 'pdf' | 'csv' | 'excel';
  includeHeader: boolean;
  includeFooter: boolean;
  pageOrientation: 'portrait' | 'landscape';
  paperSize: 'a4' | 'letter' | 'legal';
}

export interface ListEmailOptions {
  to: string[];
  cc?: string[];
  subject: string;
  message?: string;
  attachFormat: 'pdf' | 'csv' | 'excel';
  includeLink: boolean;
}

export interface ListFilter {
  search?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'productCount';
  sortDirection?: 'asc' | 'desc';
}

