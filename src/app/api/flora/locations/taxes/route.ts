import { NextRequest, NextResponse } from 'next/server';
import { SimpleWPAuth } from '../../../../../lib/wp-auth-simple';

const API_BASE = 'https://api.floradistro.com';

// GET /api/flora/locations/taxes - Get all location tax mappings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('location_id');
    
    // Build Magic2 API URL
    let url = `${API_BASE}/wp-json/flora-im/v1/locations/taxes`;
    const params = new URLSearchParams({
      consumer_key: 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5',
      consumer_secret: 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678'
    });
    
    if (locationId) {
      params.append('location_id', locationId);
    }
    
    url += '?' + params.toString();

    const response = await fetch(url, {
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
    return NextResponse.json(
      { error: 'Failed to fetch location tax mappings' },
      { status: 500 }
    );
  }
}

// POST /api/flora/locations/taxes - Create location tax mapping
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { location_id, tax_rate_id, is_default = false } = body;

    if (!location_id || !tax_rate_id) {
      return NextResponse.json(
        { error: 'location_id and tax_rate_id are required' },
        { status: 400 }
      );
    }

    // Use Magic2 API to assign tax to location
    const url = `${API_BASE}/wp-json/flora-im/v1/locations/${location_id}/taxes`;
    const params = new URLSearchParams({
      consumer_key: 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5',
      consumer_secret: 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678'
    });

    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tax_rate_id: parseInt(tax_rate_id),
        is_default: Boolean(is_default)
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Magic2 API error: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown error'}`);
    }

    const data = await response.json();

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create location tax mapping' },
      { status: 500 }
    );
  }
}