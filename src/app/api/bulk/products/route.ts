import { NextRequest, NextResponse } from 'next/server';

const FLORA_API_BASE = 'https://api.floradistro.com/wp-json';
const FLORA_CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const FLORA_CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

/**
 * Bulk Products API - V2 Optimized
 * Proxies to flora-im/v1/products/bulk
 * Gets products with inventory, pricing, and fields in 1 query instead of 300+
 * 
 * @route GET /api/bulk/products
 * @query location_id - Filter by location ID
 * @query category - Filter by category ID
 * @query per_page - Items per page (default: 100)
 * @query page - Page number (default: 1)
 * @query restock_mode - Include ALL products including out of stock (default: false)
 * @query audit_mode - Audit mode flag (default: false)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Build Flora IM bulk API URL
    const url = new URL(`${FLORA_API_BASE}/flora-im/v1/products/bulk`);
    url.searchParams.append('consumer_key', FLORA_CONSUMER_KEY);
    url.searchParams.append('consumer_secret', FLORA_CONSUMER_SECRET);
    
    // Forward query params
    searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });
    
    // Add cache busting
    url.searchParams.append('_t', Date.now().toString());
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Flora IM Bulk API error: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Add timestamp to each product to force React re-render when fields change
    if (data.success && data.data) {
      data._fetched_at = Date.now();
    }
    
    // Flora-IM bulk endpoint ALREADY includes blueprint_fields - just pass through!
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error: any) {
    console.error('Bulk products API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bulk products' },
      { status: 500 }
    );
  }
}

