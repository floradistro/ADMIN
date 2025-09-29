import { NextRequest, NextResponse } from 'next/server';

const API_BASE = 'https://api.floradistro.com';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';
const NAMESPACE = 'fd/v1';

// Helper to build authenticated URL
function buildUrl(endpoint: string, params: URLSearchParams = new URLSearchParams()) {
  const url = new URL(`/wp-json/${NAMESPACE}${endpoint}`, API_BASE);
  
  // Add authentication
  url.searchParams.append('consumer_key', CONSUMER_KEY);
  url.searchParams.append('consumer_secret', CONSUMER_SECRET);
  
  // Add other params
  params.forEach((value, key) => {
    url.searchParams.append(key, value);
  });
  
  // Cache busting
  url.searchParams.append('_t', Date.now().toString());
  
  return url.toString();
}

// GET /api/pricing/rules - Get pricing rules
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Forward all query parameters to the BluePrints API
    const apiParams = new URLSearchParams();
    searchParams.forEach((value, key) => {
      apiParams.append(key, value);
    });
    
    const url = buildUrl('/pricing-rules', apiParams);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      
      return NextResponse.json(
        { error: 'Failed to get pricing rules', details: errorText },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/pricing/rules - Create pricing rule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const url = buildUrl('/pricing-rules');
    
    // Request details: {
    //   url,
    //   body,
    //   bodyString: JSON.stringify(body),
    //   conditionsType: typeof body.conditions,
    //   conditions: body.conditions,
    //   timestamp: new Date().toISOString()
    // }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': CONSUMER_KEY,
      },
      body: JSON.stringify(body),
    });
    
    const responseText = await response.text();
    // Response details: {
    //   status: response.status,
    //   headers: Object.fromEntries(response.headers.entries()),
    //   body: responseText
    // }
    
    if (!response.ok) {
      
      // If it's a 404, the plugin might not be active or routes not registered
      if (response.status === 404) {
        return NextResponse.json(
          { 
            error: 'BluePrints API not available', 
            details: 'The Flora Fields plugin API endpoints are not accessible. Please check if the plugin is active and properly configured.',
            debug: {
              url,
              status: response.status,
              response: responseText
            }
          },
          { status: 503 } // Service Unavailable
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create pricing rule', details: responseText },
        { status: response.status }
      );
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid response from BluePrints API', details: responseText },
        { status: 502 }
      );
    }
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}