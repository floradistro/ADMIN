import { NextRequest, NextResponse } from 'next/server';

const WP_API = 'https://api.floradistro.com/wp-json';
const KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

function buildUrl(path: string, params?: URLSearchParams): string {
  const url = new URL(`${WP_API}${path}`);
  url.searchParams.append('consumer_key', KEY);
  url.searchParams.append('consumer_secret', SECRET);
  
  if (params) {
    params.forEach((value, key) => {
      url.searchParams.append(key, value);
    });
  }
  
  return url.toString();
}

// GET /api/flora/categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const url = buildUrl('/wc/v3/products/categories', searchParams);
    
    const response = await fetch(url, { cache: 'no-store' });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: response.status });
    }
    
    const data = await response.json();
    
    // Wrap in success format that categoriesService expects
    return NextResponse.json({
      success: true,
      data: data
    });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

