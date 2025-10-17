import { NextRequest, NextResponse } from 'next/server';

const FLORA_API_BASE = 'https://api.floradistro.com/wp-json';
const FLORA_CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const FLORA_CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

function buildFloraUrl(path: string): string {
  const url = new URL(`${FLORA_API_BASE}${path}`);
  url.searchParams.append('consumer_key', FLORA_CONSUMER_KEY);
  url.searchParams.append('consumer_secret', FLORA_CONSUMER_SECRET);
  return url.toString();
}

// GET /api/flora/products/fields/[id] - Get product fields
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = buildFloraUrl(`/fd/v2/products/${id}/fields`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Flora API error: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error('Get product fields error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product fields' },
      { status: 500 }
    );
  }
}

// PUT /api/flora/products/fields/[id] - Update product fields
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const url = buildFloraUrl(`/fd/v2/products/${id}/fields`);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Flora API error: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error('Update product fields error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update product fields' },
      { status: 500 }
    );
  }
}

