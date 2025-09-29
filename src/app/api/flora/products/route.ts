import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const FLORA_API_URL = 'https://api.floradistro.com';
const WC_CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const WC_CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

export async function GET(request: NextRequest) {
  try {
    // TEMPORARY: Bypass authentication for development
    const session = await getServerSession(authOptions);
    if (!session && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams();
    params.append('consumer_key', WC_CONSUMER_KEY);
    params.append('consumer_secret', WC_CONSUMER_SECRET);
    
    // Forward all query parameters
    searchParams.forEach((value, key) => {
      if (key !== 'consumer_key' && key !== 'consumer_secret') {
        params.append(key, value);
      }
    });

    const url = `${FLORA_API_URL}/wp-json/flora-im/v1/products?${params.toString()}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {

      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch products',
        data: [],
        meta: { total: 0, page: 1, per_page: 10000, pages: 0 }
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {

    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      data: [],
      meta: { total: 0, page: 1, per_page: 10000, pages: 0 }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // TEMPORARY: Bypass authentication for development
    const session = await getServerSession(authOptions);
    if (!session && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productData = await request.json();

    // Use the BluePrints API for unified product creation with blueprint support
    const url = `${FLORA_API_URL}/wp-json/fd/v1/products?consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const errorText = await response.text();

      return NextResponse.json({ 
        error: 'Failed to create product',
        details: errorText 
      }, { status: response.status });
    }

    const createdProduct = await response.json();

    return NextResponse.json(createdProduct);
  } catch (error) {

    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}