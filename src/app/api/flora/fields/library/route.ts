import { NextRequest, NextResponse } from 'next/server';

const WP_API = 'https://api.floradistro.com/wp-json';
const KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

function buildUrl(path: string): string {
  const url = new URL(`${WP_API}${path}`);
  url.searchParams.append('consumer_key', KEY);
  url.searchParams.append('consumer_secret', SECRET);
  return url.toString();
}

// GET /api/flora/fields/library
export async function GET(request: NextRequest) {
  try {
    const url = buildUrl('/fd/v3/fields/library');
    const response = await fetch(url, { cache: 'no-store' });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch field library' }, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/flora/fields/library
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = buildUrl('/fd/v3/fields/library');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to add field' }, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

