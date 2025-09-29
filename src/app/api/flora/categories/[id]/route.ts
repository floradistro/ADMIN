import { NextRequest, NextResponse } from 'next/server';

const FLORA_API_BASE = 'https://api.floradistro.com/wp-json';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

interface CategoryUpdateRequest {
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

// GET - Fetch single category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = `${FLORA_API_BASE}/wc/v3/products/categories/${id}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;


    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`WooCommerce API error: ${response.status} ${response.statusText}`);
    }

    const category = await response.json();
    

    return NextResponse.json({
      success: true,
      data: category,
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch category',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: CategoryUpdateRequest = await request.json();


    const url = `${FLORA_API_BASE}/wc/v3/products/categories/${id}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;

    // WooCommerce API will handle the unit field through our BluePrints plugin
    // The plugin's REST field registration makes 'unit' a valid field
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      let errorMessage = `WooCommerce API error: ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = `${errorMessage} - ${errorData.message || response.statusText}`;
      } catch {
        errorMessage = `${errorMessage} - ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }

    const updatedCategory = await response.json();

    return NextResponse.json({
      success: true,
      data: updatedCategory,
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update category',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    const url = `${FLORA_API_BASE}/wc/v3/products/categories/${id}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}&force=${force}`;


    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`WooCommerce API error: ${response.status} - ${errorData.message || response.statusText}`);
    }

    const deletedCategory = await response.json();
    

    return NextResponse.json({
      success: true,
      data: deletedCategory,
      message: `Category "${deletedCategory.name}" ${force ? 'permanently deleted' : 'moved to trash'}`,
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete category',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}