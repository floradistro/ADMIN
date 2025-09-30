import { NextRequest, NextResponse } from 'next/server';

const DB_HOST = 'api.floradistro.com';
const DB_NAME = 'customer_floradistrodb'; // You may need to verify this
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

// Field name to ID mapping (standalone fields)
const FIELD_IDS: Record<string, number> = {
  'effect': 4,
  'lineage': 5,
  'nose': 6,
  'terpene': 7,
  'strain_type': 8,
  'strength_mg': 9,
  'thca_percentage': 10
};

export async function POST(request: NextRequest) {
  try {
    const { product_id, fields } = await request.json();
    
    if (!product_id || !fields) {
      return NextResponse.json({ 
        success: false, 
        error: 'Product ID and fields required' 
      }, { status: 400 });
    }

    // For now, just save to WooCommerce meta_data as the BluePrints system has database issues
    // This will at least preserve the data even if Blueprint Fields UI doesn't show it
    
    const wcUrl = `https://api.floradistro.com/wp-json/wc/v3/products/${product_id}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
    
    // Get current product
    const getResponse = await fetch(wcUrl);
    if (!getResponse.ok) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    const product = await getResponse.json();
    const existingMeta = product.meta_data || [];
    
    // Build meta map
    const metaMap = new Map();
    existingMeta.forEach((m: any) => metaMap.set(m.key, m.value));
    
    // Add new fields with blueprint_ prefix so they're identifiable
    Object.entries(fields).forEach(([key, value]) => {
      metaMap.set(`_${key}`, value); // Prefix with underscore for custom meta
    });
    
    const updatedMeta = Array.from(metaMap.entries()).map(([key, value]) => ({ key, value }));
    
    // Update product
    const updateResponse = await fetch(wcUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meta_data: updatedMeta })
    });
    
    if (!updateResponse.ok) {
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
    
    const result = await updateResponse.json();
    
    return NextResponse.json({
      success: true,
      message: `Saved ${Object.keys(fields).length} fields to WooCommerce`,
      product_id,
      updated_fields: Object.keys(fields),
      note: 'Saved to WooCommerce meta_data with _ prefix'
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
