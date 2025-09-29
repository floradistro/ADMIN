import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const API_BASE = 'https://api.floradistro.com';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';
const NAMESPACE = 'flora-fields/v1';

// Helper to build authenticated URL
function buildUrl(endpoint: string, params: URLSearchParams = new URLSearchParams()) {
  const url = new URL(`/wp-json/${NAMESPACE}${endpoint}`, API_BASE);
  
  // Add authentication
  url.searchParams.append('consumer_key', CONSUMER_KEY);
  url.searchParams.append('consumer_secret', CONSUMER_SECRET);
  
  // Add other params
  params.forEach((value, key) => {
    url.searchParams.append(key, value);
  });
  
  return url.toString();
}

// GET /api/products/[id] - Get single product with blueprint fields
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TEMPORARY: Bypass authentication for development
    const session = await getServerSession(authOptions);
    if (!session && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    // Use WooCommerce API instead of Flora Fields API
    const wcUrl = `${API_BASE}/wp-json/wc/v3/products/${id}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
    
    const response = await fetch(wcUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch product', details: errorText },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      data: data
    });
    
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Update product with blueprint fields
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TEMPORARY: Bypass authentication for development
    const session = await getServerSession(authOptions);
    if (!session && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    
    const url = buildUrl(`/products/${id}`);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      
      return NextResponse.json(
        { success: false, error: 'Failed to update product', details: errorText },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    return NextResponse.json(data);
    
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PATCH /api/products/[id] - Partial update product with blueprint fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TEMPORARY: Bypass authentication for development
    const session = await getServerSession(authOptions);
    if (!session && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    
    
    const url = buildUrl(`/products/${id}`);
    
    const response = await fetch(url, {
      method: 'PUT', // BluePrints API uses PUT for updates
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      
      return NextResponse.json(
        { success: false, error: 'Failed to update product', details: errorText },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      data: data
    });
    
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Delete product (try WooCommerce first, then BluePrints)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TEMPORARY: Bypass authentication for development
    const session = await getServerSession(authOptions);
    if (!session && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    
    // Try WooCommerce API first (for products like the ones in the error)
    try {
      const wooUrl = `https://api.floradistro.com/wp-json/wc/v3/products/${id}?consumer_key=ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5&consumer_secret=cs_38194e74c7ddc5d72b6c32c70485728e7e529678&force=true`;
      
      
      const wooResponse = await fetch(wooUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (wooResponse.ok) {
        const wooData = await wooResponse.json();
        return NextResponse.json({
          success: true,
          data: wooData,
          source: 'woocommerce'
        });
      } else {
        const wooError = await wooResponse.text();
      }
    } catch (wooError) {
    }
    
    // Fallback to BluePrints API
    try {
      const blueprintsUrl = buildUrl(`/products/${id}`);
      
      const blueprintsResponse = await fetch(blueprintsUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (blueprintsResponse.ok) {
        const blueprintsData = await blueprintsResponse.json();
        return NextResponse.json({
          success: true,
          data: blueprintsData,
          source: 'blueprints'
        });
      } else {
        const blueprintsError = await blueprintsResponse.text();
      }
    } catch (blueprintsError) {
    }
    
    // If both APIs fail
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete product from both WooCommerce and BluePrints APIs',
        details: `Product ${id} not found in either system`
      },
      { status: 404 }
    );
    
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}