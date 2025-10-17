import { NextRequest, NextResponse } from 'next/server';

const FLORA_API_BASE = 'https://api.floradistro.com/wp-json';
const FLORA_CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const FLORA_CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

/**
 * Bulk Orders API - V2 Optimized
 * Proxies to flora-im/v1/orders/bulk
 * Gets POS orders with line items and customer data in optimized queries
 * 
 * @route GET /api/bulk/orders
 * @query status - Filter by order status (default: any)
 * @query location_id - Filter by location ID
 * @query customer_id - Filter by customer ID
 * @query date_from - Filter from date (YYYY-MM-DD)
 * @query date_to - Filter to date (YYYY-MM-DD)
 * @query per_page - Items per page (default: 50)
 * @query page - Page number (default: 1)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Build Flora IM bulk API URL
    const url = new URL(`${FLORA_API_BASE}/flora-im/v1/orders/bulk`);
    url.searchParams.append('consumer_key', FLORA_CONSUMER_KEY);
    url.searchParams.append('consumer_secret', FLORA_CONSUMER_SECRET);
    
    // Forward query params
    searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Flora IM Bulk API error: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error('Bulk orders API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bulk orders' },
      { status: 500 }
    );
  }
}

