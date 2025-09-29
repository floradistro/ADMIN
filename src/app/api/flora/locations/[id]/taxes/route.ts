import { NextRequest, NextResponse } from 'next/server';
import { SimpleWPAuth } from '../../../../../../lib/wp-auth-simple';

const API_BASE = 'https://api.floradistro.com';

// GET /api/flora/locations/[id]/taxes - Get tax mappings for a specific location
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const locationId = parseInt(id);

    // Validate location ID - must be a valid number
    if (isNaN(locationId) || locationId <= 0) {
      console.log(`Invalid location ID received: ${id}`);
      return NextResponse.json(
        { error: 'Invalid location ID', details: `Location ID must be a positive number, received: ${id}` },
        { status: 400 }
      );
    }

    // Use Magic2 API to get tax rates for location
    const url = `${API_BASE}/wp-json/flora-im/v1/locations/${locationId}/taxes`;
    const urlParams = new URLSearchParams({
      consumer_key: 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5',
      consumer_secret: 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678',
      '_cachebust': Date.now().toString(),
      '_t': Math.random().toString()
    });

    const response = await fetch(`${url}?${urlParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Magic2 API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Tax mapping fetch error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch location tax mappings', details: errorMessage },
      { status: 500 }
    );
  }
}

// POST /api/flora/locations/[id]/taxes - Assign tax rate to location
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const locationId = parseInt(id);

    // Validate location ID - must be a valid number
    if (isNaN(locationId) || locationId <= 0) {
      console.log(`Invalid location ID received: ${id}`);
      return NextResponse.json(
        { error: 'Invalid location ID', details: `Location ID must be a positive number, received: ${id}` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { tax_rate_id, is_default = false } = body;

    if (!tax_rate_id) {
      return NextResponse.json(
        { error: 'tax_rate_id is required' },
        { status: 400 }
      );
    }

    // Use Magic2 API to assign tax to location
    const url = `${API_BASE}/wp-json/flora-im/v1/locations/${locationId}/taxes`;
    const urlParams = new URLSearchParams({
      consumer_key: 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5',
      consumer_secret: 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678',
      '_cachebust': Date.now().toString(),
      '_t': Math.random().toString()
    });

    const response = await fetch(`${url}?${urlParams.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: JSON.stringify({
        tax_rate_id: parseInt(tax_rate_id),
        is_default: Boolean(is_default)
      }),
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Magic2 API error: ${response.status} ${response.statusText}`, errorText);
      
      let errorData: any = {};
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      throw new Error(`Magic2 API error: ${response.status} ${response.statusText} - ${errorData.message || errorData.error || errorText}`);
    }

    const data = await response.json();
    console.log('Magic2 API tax assignment response:', data);

    return NextResponse.json(data, { 
      status: 201,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Tax assignment error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Extract params again for error response
    const { id } = await params;
    const locationId = parseInt(id);
    
    return NextResponse.json(
      { 
        error: 'Failed to assign tax to location', 
        details: errorMessage,
        locationId,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}