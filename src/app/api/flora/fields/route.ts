import { NextRequest, NextResponse } from 'next/server';

const FLORA_API_BASE = 'https://api.floradistro.com/wp-json';
const FLORA_CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const FLORA_CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

function buildFloraUrl(path: string, params?: URLSearchParams): string {
  const url = new URL(`${FLORA_API_BASE}${path}`);
  url.searchParams.append('consumer_key', FLORA_CONSUMER_KEY);
  url.searchParams.append('consumer_secret', FLORA_CONSUMER_SECRET);
  
  if (params) {
    params.forEach((value, key) => {
      url.searchParams.append(key, value);
    });
  }
  
  return url.toString();
}

// GET /api/flora/fields - List all fields
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const url = buildFloraUrl('/fd/v2/fields', searchParams);
    
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
    console.error('Fields API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch fields' },
      { status: 500 }
    );
  }
}

// POST /api/flora/fields - Create new field
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const url = buildFloraUrl('/fd/v2/fields');
    
    const response = await fetch(url, {
      method: 'POST',
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
    console.error('Create field error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create field' },
      { status: 500 }
    );
  }
}

