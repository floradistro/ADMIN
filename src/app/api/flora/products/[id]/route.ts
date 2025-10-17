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

// GET /api/flora/products/[id] - Get single product with fields & pricing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get product from WooCommerce
    const productUrl = buildUrl(`/wc/v3/products/${id}`);
    const productRes = await fetch(productUrl, { cache: 'no-store' });
    
    if (!productRes.ok) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    const product = await productRes.json();
    
    // Get fields from V3 API
    const fieldsUrl = buildUrl(`/fd/v3/products/${id}/fields`);
    const fieldsRes = await fetch(fieldsUrl, { cache: 'no-store' });
    
    if (fieldsRes.ok) {
      const fieldsData = await fieldsRes.json();
      product.blueprint_fields = fieldsData.fields || [];
    }
    
    // Get pricing from V3 API
    const pricingUrl = buildUrl(`/fd/v3/products/${id}/pricing`);
    const pricingRes = await fetch(pricingUrl, { cache: 'no-store' });
    
    if (pricingRes.ok) {
      const pricingData = await pricingRes.json();
      product.pricing = pricingData;
    }
    
    return NextResponse.json({ success: true, data: product });
    
  } catch (error: any) {
    console.error('Product API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
