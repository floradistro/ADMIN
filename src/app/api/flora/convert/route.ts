import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const FLORA_API_URL = 'https://api.floradistro.com';
const WC_CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const WC_CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

export async function POST(request: NextRequest) {
  
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      from_product_id, 
      to_product_id, 
      location_id, 
      from_quantity, 
      to_quantity, 
      notes 
    } = body;

    // Validate required fields
    if (!from_product_id || !to_product_id || !location_id || !from_quantity || !to_quantity) {
      return NextResponse.json({ 
        error: 'Missing required fields: from_product_id, to_product_id, location_id, from_quantity, to_quantity' 
      }, { status: 400 });
    }

    const fromQuantity = parseFloat(from_quantity);
    const toQuantity = parseFloat(to_quantity);

    if (isNaN(fromQuantity) || isNaN(toQuantity) || fromQuantity <= 0 || toQuantity <= 0) {
      return NextResponse.json({ 
        error: 'Quantities must be positive numbers' 
      }, { status: 400 });
    }

    // Conversion data: {
    //   from_product_id,
    //   to_product_id,
    //   location_id,
    //   from_quantity: fromQuantity,
    //   to_quantity: toQuantity,
    //   notes,
    //   consumer_key: WC_CONSUMER_KEY,
    //   consumer_secret: WC_CONSUMER_SECRET
    // }

    const response = await fetch(`${FLORA_API_URL}/wp-json/flora-im/v1/convert?consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from_product_id,
        to_product_id,
        location_id,
        from_quantity: fromQuantity,
        to_quantity: toQuantity,
        notes,
        consumer_key: WC_CONSUMER_KEY,
        consumer_secret: WC_CONSUMER_SECRET
      })
    });


    const responseText = await response.text();

    if (!response.ok) {
      
      // Try to parse as JSON first (WordPress might return JSON error)
      try {
        const errorData = JSON.parse(responseText);
        return NextResponse.json({ 
          error: errorData.message || errorData.code || `Conversion failed: ${response.status}`,
          details: errorData
        }, { status: response.status });
      } catch (parseError) {
        // If not JSON, return the raw text
        return NextResponse.json({ 
          error: `Conversion failed: ${response.status} - ${responseText}` 
        }, { status: response.status });
      }
    }

    // Try to parse successful response as JSON
    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data);
    } catch (parseError) {
      return NextResponse.json({ 
        error: 'Invalid response from conversion service' 
      }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}