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

// GET /api/flora/categories/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = buildUrl(`/wc/v3/products/categories/${id}`);
    
    const response = await fetch(url, { cache: 'no-store' });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Category not found' }, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

