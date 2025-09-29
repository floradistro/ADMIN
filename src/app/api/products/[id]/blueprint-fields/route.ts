import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const API_BASE = process.env.FLORA_API_BASE || 'https://api.floradistro.com';
const CONSUMER_KEY = process.env.FLORA_API_CONSUMER_KEY!;
const CONSUMER_SECRET = process.env.FLORA_API_CONSUMER_SECRET!;

function addAuthToUrl(url: string) {
  return `${url}&consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
}

// PATCH /api/products/[id]/blueprint-fields - Update blueprint field values for a product
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const productId = parseInt(id);
  
  try {
    // TEMPORARY: Bypass authentication for development
    const session = await getServerSession(authOptions);
    if (!session && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { blueprint_fields } = await request.json();
    
    
    if (!blueprint_fields || Object.keys(blueprint_fields).length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No blueprint fields provided' 
      }, { status: 400 });
    }

    // Method 1: Try updating via WooCommerce meta_data
    try {
      const wcUrl = `${API_BASE}/wp-json/wc/v3/products/${productId}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
      
      // Prepare meta_data array for WooCommerce
      const metaData = Object.entries(blueprint_fields).map(([key, value]) => ({
        key: key,
        value: value
      }));
      
      
      const wcResponse = await fetch(wcUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meta_data: metaData
        })
      });

      if (wcResponse.ok) {
        const wcResult = await wcResponse.json();
        
        return NextResponse.json({
          success: true,
          method: 'woocommerce',
          data: wcResult,
          updated_fields: Object.keys(blueprint_fields)
        });
      } else {
        const errorText = await wcResponse.text();
      }
    } catch (wcError) {
    }

    // Method 2: Try Flora Fields API if available
    try {
      const floraUrl = addAuthToUrl(`${API_BASE}/wp-json/flora-fields/v1/product-fields/${productId}?per_page=100`);
      
      
      const floraResponse = await fetch(floraUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          fields: blueprint_fields
        })
      });

      if (floraResponse.ok) {
        const floraResult = await floraResponse.json();
        
        return NextResponse.json({
          success: true,
          method: 'flora-fields',
          data: floraResult,
          updated_fields: Object.keys(blueprint_fields)
        });
      } else {
        const errorText = await floraResponse.text();
      }
    } catch (floraError) {
    }

    // Method 3: Try BluePrints API as fallback
    try {
      const blueprintUrl = `${API_BASE}/wp-json/blueprints/v1/products/${productId}/fields?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
      
      
      const blueprintResponse = await fetch(blueprintUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(blueprint_fields)
      });

      if (blueprintResponse.ok) {
        const blueprintResult = await blueprintResponse.json();
        
        return NextResponse.json({
          success: true,
          method: 'blueprints',
          data: blueprintResult,
          updated_fields: Object.keys(blueprint_fields)
        });
      } else {
        const errorText = await blueprintResponse.text();
      }
    } catch (blueprintError) {
    }

    // If all methods failed
    return NextResponse.json({
      success: false,
      error: 'Failed to update blueprint fields using any available method',
      attempted_methods: ['woocommerce', 'flora-fields', 'blueprints'],
      product_id: productId,
      fields: Object.keys(blueprint_fields)
    }, { status: 500 });

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
