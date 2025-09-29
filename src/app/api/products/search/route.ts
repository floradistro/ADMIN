import { NextRequest, NextResponse } from 'next/server';

const API_BASE = 'https://api.floradistro.com';
const WC_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const WC_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = searchParams.get('limit') || '10';

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }


    const authHeader = `Basic ${Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString('base64')}`;
    
    // Search products using WooCommerce API
    const response = await fetch(
      `${API_BASE}/wp-json/wc/v3/products?search=${encodeURIComponent(query)}&per_page=${limit}&status=publish`,
      {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'Search failed' }, { status: response.status });
    }

    const products = await response.json();
    
    // Format products for the search component
    const formattedProducts = products.map((product: any) => ({
      id: product.id,
      name: product.name,
      sku: product.sku || null
    }));

    
    return NextResponse.json(formattedProducts);

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}