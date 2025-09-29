import { NextRequest, NextResponse } from 'next/server';

const API_BASE = 'https://api.floradistro.com';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

export async function POST(request: NextRequest) {
  try {
    const { product_id, fields } = await request.json();
    
    
    if (!product_id || !fields) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing product_id or fields' 
      }, { status: 400 });
    }

    // Update WooCommerce product meta_data
    const wcUrl = `${API_BASE}/wp-json/wc/v3/products/${product_id}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
    
    // Convert fields to meta_data format
    const metaData = Object.entries(fields).map(([key, value]) => ({
      key: key,
      value: String(value)
    }));
    
    
    const response = await fetch(wcUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        meta_data: metaData
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        success: false,
        error: `WooCommerce API error: ${response.status}`,
        details: errorText
      }, { status: response.status });
    }

    const result = await response.json();
    
    // Extract the updated blueprint fields from meta_data
    const updatedFields: Record<string, any> = {};
    if (result.meta_data) {
      result.meta_data.forEach((meta: any) => {
        if (fields[meta.key] !== undefined) {
          updatedFields[meta.key] = meta.value;
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      product_id: product_id,
      updated_fields: updatedFields
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
