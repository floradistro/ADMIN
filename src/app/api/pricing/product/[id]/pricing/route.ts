import { NextRequest, NextResponse } from 'next/server';

const FLORA_API_BASE = 'https://api.floradistro.com/wp-json';
const FLORA_CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const FLORA_CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

/**
 * Get Product Pricing from Flora Fields V2
 * Uses fd/v2/pricing/forms endpoint
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(`${FLORA_API_BASE}/fd/v2/pricing/forms/${id}`);
    url.searchParams.append('consumer_key', FLORA_CONSUMER_KEY);
    url.searchParams.append('consumer_secret', FLORA_CONSUMER_SECRET);
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Flora Pricing API error: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error('Get product pricing error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product pricing' },
      { status: 500 }
    );
  }
}

