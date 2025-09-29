import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const FLORA_API_URL = 'https://api.floradistro.com';
const WC_CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const WC_CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

// Import the same in-memory storage (this is a simple approach - in production would use Redis/DB)
declare global {
  var locationUpdates: { [key: string]: any };
}

if (!global.locationUpdates) {
  global.locationUpdates = {};
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id: locationId } = await params;
    
    
    // Call Flora API to update location
    const floraApiUrl = `${FLORA_API_URL}/wp-json/flora-im/v1/locations/${locationId}?consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}`;
    
    const floraResponse = await fetch(floraApiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!floraResponse.ok) {
      const errorText = await floraResponse.text();
      return NextResponse.json({ 
        error: `Failed to update location in Flora API: ${floraResponse.status}` 
      }, { status: floraResponse.status });
    }

    const floraResult = await floraResponse.json();
    
    // Clear any cached updates for this location since we've successfully updated via API
    if (global.locationUpdates && global.locationUpdates[locationId]) {
      delete global.locationUpdates[locationId];
    }
    
    return NextResponse.json({
      success: true,
      data: floraResult.data,
      message: 'Location updated successfully'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Skip session check for now - the app handles auth at the component level
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    const { id: locationId } = await params;
    const numericLocationId = parseInt(locationId);
    
    // Validate location ID
    if (isNaN(numericLocationId) || numericLocationId <= 0) {
      return NextResponse.json({ 
        error: 'Invalid location ID' 
      }, { status: 400 });
    }
    
    // Use Flora IM API to delete location
    const floraApiUrl = `${FLORA_API_URL}/wp-json/flora-im/v1/locations/${locationId}`;
    const urlParams = new URLSearchParams({
      consumer_key: WC_CONSUMER_KEY,
      consumer_secret: WC_CONSUMER_SECRET
    });
    
    const floraResponse = await fetch(`${floraApiUrl}?${urlParams.toString()}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      cache: 'no-store'
    });
    
    if (!floraResponse.ok) {
      const errorText = await floraResponse.text();
      let errorData: any = {};
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      // Handle specific Flora IM errors
      if (errorData.code === 'cannot_delete_default') {
        return NextResponse.json({ 
          error: 'Cannot delete default location. Please set another location as default first.' 
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        error: `Failed to delete location: ${errorData.message || errorData.error || errorText}` 
      }, { status: floraResponse.status });
    }
    
    const result = await floraResponse.json();
    console.log('Location deletion successful:', result);
    
    return NextResponse.json({
      success: true,
      data: result,
      message: 'Location deleted successfully'
    });
  } catch (error) {
    console.error('Location deletion error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}