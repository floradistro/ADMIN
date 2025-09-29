export interface WooCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description: string;
  display: 'default' | 'products' | 'subcategories' | 'both';
  image: {
    id: number;
    src: string;
    name: string;
    alt: string;
  } | null;
  menu_order: number;
  count: number;
  unit?: string; // Unit of measurement for products in this category
}

export interface CategoryCreateRequest {
  name: string;
  slug?: string;
  parent?: number;
  description?: string;
  display?: 'default' | 'products' | 'subcategories' | 'both';
  image?: {
    id: number;
  };
  menu_order?: number;
  unit?: string; // Unit of measurement for products in this category
}

export interface CategoryUpdateRequest {
  name?: string;
  slug?: string;
  parent?: number;
  description?: string;
  display?: 'default' | 'products' | 'subcategories' | 'both';
  image?: {
    id: number;
  } | null;
  menu_order?: number;
  unit?: string; // Unit of measurement for products in this category
}

export interface CategoriesResponse {
  success: boolean;
  data: WooCategory[];
  total: number;
  totalPages: number;
  error?: string;
}

export interface CategoryResponse {
  success: boolean;
  data: WooCategory;
  error?: string;
  message?: string;
}

class CategoriesService {
  private baseUrl = '/api/flora/categories';
  // REMOVED: All caching mechanisms to ensure real data only

  async getCategories(params?: {
    page?: number;
    per_page?: number;
    parent?: number | null;
    search?: string;
    orderby?: string;
    order?: 'asc' | 'desc';
  }): Promise<CategoriesResponse> {
    try {
      // Always fetch fresh data - no caching allowed

      const searchParams = new URLSearchParams();
      
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.per_page) searchParams.append('per_page', params.per_page.toString());
      if (params?.parent !== undefined) searchParams.append('parent', params.parent?.toString() || '0');
      if (params?.search) searchParams.append('search', params.search);
      if (params?.orderby) searchParams.append('orderby', params.orderby);
      if (params?.order) searchParams.append('order', params.order);

      const url = `${this.baseUrl}?${searchParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch categories');
      }

      // No caching - always use fresh data

      return result;
    } catch (error) {
      throw error;
    }
  }

  async getCategory(id: number): Promise<CategoryResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch category');
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  async createCategory(data: CategoryCreateRequest): Promise<CategoryResponse> {
    try {
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });


      const result = await response.json();
      
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create category');
      }

      // No cache to clear - using real data only

      return result;
    } catch (error) {
      throw error;
    }
  }

  async updateCategory(id: number, data: CategoryUpdateRequest): Promise<CategoryResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update category');
      }

      // No cache to clear - using real data only

      return result;
    } catch (error) {
      throw error;
    }
  }

  async deleteCategory(id: number, force: boolean = false): Promise<CategoryResponse> {
    try {
      const url = `${this.baseUrl}/${id}${force ? '?force=true' : ''}`;
      
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      
      const result = await response.json();
      
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete category');
      }

      // No cache to clear - using real data only

      return result;
    } catch (error) {
      throw error;
    }
  }

  async bulkDeleteCategories(categoryIds: number[]): Promise<{ success: boolean; data: { deletedIds: number[] }; message: string }> {
    try {
      
      const response = await fetch(this.baseUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          categoryIds,
        }),
      });

      
      const result = await response.json();
      
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete categories');
      }

      // No cache to clear - using real data only

      return result;
    } catch (error) {
      throw error;
    }
  }

  // Helper method to build category hierarchy
  buildCategoryTree(categories: WooCategory[]): WooCategory[] {
    const categoryMap = new Map<number, WooCategory & { children?: WooCategory[] }>();
    const rootCategories: (WooCategory & { children?: WooCategory[] })[] = [];

    // First pass: create map of all categories
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // Second pass: build hierarchy
    categories.forEach(category => {
      const categoryWithChildren = categoryMap.get(category.id)!;
      
      if (category.parent === 0) {
        // Root category
        rootCategories.push(categoryWithChildren);
      } else {
        // Child category
        const parent = categoryMap.get(category.parent);
        if (parent) {
          parent.children!.push(categoryWithChildren);
        } else {
          // Parent not found, treat as root
          rootCategories.push(categoryWithChildren);
        }
      }
    });

    return rootCategories;
  }

  // Helper method to flatten category tree
  flattenCategoryTree(categories: (WooCategory & { children?: WooCategory[] })[]): WooCategory[] {
    const flattened: WooCategory[] = [];

    const flatten = (cats: (WooCategory & { children?: WooCategory[] })[], level: number = 0) => {
      cats.forEach(cat => {
        const { children, ...category } = cat;
        flattened.push({
          ...category,
          name: '—'.repeat(level) + (level > 0 ? ' ' : '') + category.name
        });
        
        if (children && children.length > 0) {
          flatten(children, level + 1);
        }
      });
    };

    flatten(categories);
    return flattened;
  }

  // Bulk import categories from JSON
  async bulkCreateCategories(categories: CategoryCreateRequest[]): Promise<{ success: boolean; data: { created: number; errors: string[] }; message: string }> {
    try {
      
      const response = await fetch(this.baseUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'bulk_create',
          categories,
        }),
      });

      
      const result = await response.json();
      
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create categories');
      }

      // No cache to clear - using real data only

      return result;
    } catch (error) {
      throw error;
    }
  }

  // Export all categories as JSON
  async exportCategories(): Promise<{ success: boolean; data: WooCategory[]; message: string }> {
    try {
      
      // Use a reasonable limit that WooCommerce API accepts
      const result = await this.getCategories({ per_page: 100 }); 
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to export categories');
      }


      return {
        success: true,
        data: result.data,
        message: `Successfully exported ${result.data.length} categories`
      };
    } catch (error) {
      throw error;
    }
  }
}

export const categoriesService = new CategoriesService();