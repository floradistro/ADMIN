import { NextRequest, NextResponse } from 'next/server';

const FLORA_API_BASE = 'https://api.floradistro.com/wp-json';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

interface WooCategory {
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
}

interface CategoryCreateRequest {
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

// GET - Fetch all categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const per_page = searchParams.get('per_page') || '100';
    const parent = searchParams.get('parent');
    const search = searchParams.get('search');
    const orderby = searchParams.get('orderby') || 'name';
    const order = searchParams.get('order') || 'asc';

    let url = `${FLORA_API_BASE}/wc/v3/products/categories?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}&page=${page}&per_page=${per_page}&orderby=${orderby}&order=${order}`;
    
    if (parent !== null) {
      url += `&parent=${parent}`;
    }
    
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }


    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`WooCommerce API error: ${response.status} ${response.statusText}`);
    }

    const categories: WooCategory[] = await response.json();
    

    // Transform the data to match our UI needs
    // WooCommerce API now includes 'unit' field from our BluePrints plugin
    const transformedCategories = categories.map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      parent: category.parent,
      description: category.description,
      display: category.display,
      image: category.image,
      menu_order: category.menu_order,
      count: category.count,
      unit: (category as any).unit || 'units', // Unit field comes from term meta via BluePrints plugin
    }));

    return NextResponse.json({
      success: true,
      data: transformedCategories,
      total: response.headers.get('X-WP-Total') || categories.length,
      totalPages: response.headers.get('X-WP-TotalPages') || 1,
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch categories',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Create new category
export async function POST(request: NextRequest) {
  try {
    const body: CategoryCreateRequest = await request.json();

    const url = `${FLORA_API_BASE}/wc/v3/products/categories?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;


    // WooCommerce API will handle the unit field through our BluePrints plugin
    // The plugin's REST field registration makes 'unit' a valid field
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`WooCommerce API error: ${response.status} - ${errorData.message || response.statusText}`);
    }

    const newCategory: any = await response.json();
    

    return NextResponse.json({
      success: true,
      data: newCategory,
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create category',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Bulk operations
export async function PUT(request: NextRequest) {
  try {
    const { action, categoryIds, categories, data } = await request.json();

    if (action === 'bulk_create' && categories) {
      
      const createPromises = categories.map(async (category: CategoryCreateRequest) => {
        try {
          const url = `${FLORA_API_BASE}/wc/v3/products/categories?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
          
          
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(category),
          });

          if (!response.ok) {
            const errorData = await response.json();
            return { success: false, error: errorData.message || 'Failed to create category', name: category.name };
          }

          const newCategory = await response.json();
          
          return { success: true, data: newCategory };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : 'Unknown error', name: category.name };
        }
      });

      const results = await Promise.all(createPromises);
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      

      return NextResponse.json({
        success: true,
        data: { 
          created: successful.length,
          errors: failed.map(f => f.error || f.name || 'Unknown error')
        },
        message: `Successfully created ${successful.length} categories${failed.length > 0 ? `, ${failed.length} failed` : ''}`,
      });
    } else if (action === 'delete') {
      
      // Get category details to check for system categories
      const categoryDetailsPromises = categoryIds.map(async (id: number) => {
        const detailUrl = `${FLORA_API_BASE}/wc/v3/products/categories/${id}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
        const response = await fetch(detailUrl);
        if (response.ok) {
          return await response.json();
        }
        return { id, slug: '', name: '' };
      });
      
      const categoryDetails = await Promise.all(categoryDetailsPromises);
      
      // Filter out system categories (Uncategorized variations)
      const validCategoryIds = categoryIds.filter((id: number) => {
        const category = categoryDetails.find(cat => cat.id === id);
        if (!category) return true;
        return !(category.slug === 'uncategorized' || 
                 category.name.toLowerCase().includes('uncategorized') || 
                 id === 15);
      });
      
      if (validCategoryIds.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Cannot delete system categories',
        }, { status: 400 });
      }
      
      // Bulk delete categories
      const deletePromises = validCategoryIds.map(async (id: number) => {
        const url = `${FLORA_API_BASE}/wc/v3/products/categories/${id}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}&force=true`;
        
        
        const response = await fetch(url, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to delete category ${id}: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        
        return id;
      });

      const deletedIds = await Promise.all(deletePromises);
      

      return NextResponse.json({
        success: true,
        data: { deletedIds },
        message: `Successfully deleted ${deletedIds.length} categories`,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Unsupported bulk action' },
      { status: 400 }
    );

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Bulk operation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}