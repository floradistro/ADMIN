import { NextRequest, NextResponse } from 'next/server';

const API_BASE = 'https://api.floradistro.com';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

function buildUrl(endpoint: string, params: URLSearchParams = new URLSearchParams()) {
  const url = new URL(`${API_BASE}/wp-json${endpoint}`);
  
  // Add WooCommerce authentication
  url.searchParams.append('consumer_key', CONSUMER_KEY);
  url.searchParams.append('consumer_secret', CONSUMER_SECRET);
  
  // Add any additional params
  params.forEach((value, key) => {
    url.searchParams.append(key, value);
  });
  
  return url.toString();
}

// GET /api/products/[id]/variations - Get all variations for a variable product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
    // Optional filters
    const per_page = searchParams.get('per_page') || '100';
    const page = searchParams.get('page') || '1';
    const search = searchParams.get('search') || '';
    
    const queryParams = new URLSearchParams({
      per_page,
      page,
      ...(search && { search })
    });
    
    // Get variations from WooCommerce API
    const wcUrl = buildUrl(`/wc/v3/products/${id}/variations`, queryParams);
    
    const response = await fetch(wcUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('WooCommerce variations API error:', errorText);
      
      // Check if it's a PHP error or if product has no variations
      if (response.status === 500) {
        // Could be PHP error or product is not variable
        return NextResponse.json(
          { 
            success: true, 
            data: [], 
            meta: { total: 0, total_pages: 0 },
            message: 'Unable to fetch variations. Product may not be a variable product, or there is a backend error.'
          },
          { status: 200 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch variations', details: errorText },
        { status: response.status }
      );
    }
    
    const variations = await response.json();
    
    // If response is an error object instead of array
    if (!Array.isArray(variations)) {
      console.error('Variations response is not an array:', variations);
      return NextResponse.json({
        success: true,
        data: [],
        meta: { total: 0, total_pages: 0 },
        message: 'Product has no variations or is not a variable product.'
      });
    }
    
    // Format variations for consistency with products API
    const formattedVariations = variations.map((variation: any) => ({
      id: variation.id,
      parent_id: variation.parent_id || parseInt(id),
      name: variation.name || `${variation.attributes?.map((attr: any) => attr.option).join(', ')}`,
      sku: variation.sku || '',
      price: variation.price,
      regular_price: variation.regular_price,
      sale_price: variation.sale_price,
      stock_quantity: variation.stock_quantity,
      stock_status: variation.stock_status,
      manage_stock: variation.manage_stock,
      attributes: variation.attributes || [],
      image: variation.image?.src || null,
      description: variation.description || '',
      variation: true, // Flag to indicate this is a variation
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedVariations,
      meta: {
        total: parseInt(response.headers.get('X-WP-Total') || '0'),
        total_pages: parseInt(response.headers.get('X-WP-TotalPages') || '1')
      }
    });
    
  } catch (error) {
    console.error('Variations API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

