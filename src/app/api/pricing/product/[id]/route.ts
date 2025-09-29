import { NextRequest, NextResponse } from 'next/server';

const API_BASE = 'https://api.floradistro.com';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';
const NAMESPACE = 'fd/v1';

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
  
  // Cache busting
  url.searchParams.append('_t', Date.now().toString());
  
  return url.toString();
}

// GET /api/pricing/product/[id] - Get product price with context
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
    // Forward all query parameters to the BluePrints API
    const apiParams = new URLSearchParams();
    searchParams.forEach((value, key) => {
      apiParams.append(key, value);
    });
    
    const url = buildUrl(`/price/product/${id}`, apiParams);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      
      return NextResponse.json(
        { error: 'Failed to get product price', details: errorText },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}