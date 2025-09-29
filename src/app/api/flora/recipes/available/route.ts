import { NextRequest, NextResponse } from 'next/server';

const BLUEPRINTS_API_URL = 'https://api.floradistro.com/wp-json/fd/v1';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

function addAuthToUrl(url: string) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }
    
    // Call BluePrints API to get available recipes for this product (now uses blueprint assignments)
    const response = await fetch(addAuthToUrl(`${BLUEPRINTS_API_URL}/recipes/available?product_id=${productId}`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `BluePrints API error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch available recipes' },
      { status: 500 }
    );
  }
}