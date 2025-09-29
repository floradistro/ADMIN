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
    const { product_id, from_location, to_location, quantity, notes } = body;

    if (!product_id || !from_location || !to_location || !quantity) {
      return NextResponse.json({ 
        error: 'Missing required fields: product_id, from_location, to_location, quantity' 
      }, { status: 400 });
    }

    if (from_location === to_location) {
      return NextResponse.json({ 
        error: 'Source and destination locations must be different' 
      }, { status: 400 });
    }

    const transferQuantity = parseFloat(quantity);
    if (isNaN(transferQuantity) || transferQuantity <= 0) {
      return NextResponse.json({ 
        error: 'Quantity must be a positive number' 
      }, { status: 400 });
    }

    // Transfer data: {
    //   product_id,
    //   from_location,
    //   to_location,
    //   quantity: transferQuantity,
    //   notes,
    //   consumer_key: WC_CONSUMER_KEY,
    //   consumer_secret: WC_CONSUMER_SECRET
    // }

    const response = await fetch(`${FLORA_API_URL}/wp-json/flora-im/v1/transfer?consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id,
        from_location,
        to_location,
        quantity: transferQuantity,
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
        let errorMessage = errorData.message || errorData.code || `Transfer failed: ${response.status}`;
        
        // Provide more helpful error messages
        if (errorData.code === 'transfer_failed' || errorMessage.includes('Stock transfer failed')) {
          errorMessage = 'Transfer failed: Insufficient stock at source location or database error. Please check that the source location has enough inventory.';
        }
        
        return NextResponse.json({ 
          error: errorMessage,
          details: errorData
        }, { status: response.status });
      } catch (parseError) {
        // If not JSON, return the raw text
        return NextResponse.json({ 
          error: `Transfer failed: ${response.status} - ${responseText}` 
        }, { status: response.status });
      }
    }

    // Try to parse successful response as JSON
    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data);
    } catch (parseError) {
      return NextResponse.json({ 
        error: 'Invalid response from transfer service' 
      }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}