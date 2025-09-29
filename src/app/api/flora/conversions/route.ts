import { NextRequest, NextResponse } from 'next/server';

const FLORA_API_URL = 'https://api.floradistro.com/wp-json/flora-im/v1';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

function addAuthToUrl(url: string) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');
    const conversionId = searchParams.get('conversion_id');
    
    let apiUrl = `${FLORA_API_URL}/conversions`;
    
    if (conversionId) {
      apiUrl = `${apiUrl}/${conversionId}`;
    } else if (productId) {
      apiUrl = `${apiUrl}?product_id=${productId}`;
    }
    
    const response = await fetch(addAuthToUrl(apiUrl), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Flora API error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch conversions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(addAuthToUrl(`${FLORA_API_URL}/conversions`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    // Get response as text first to handle mixed HTML/JSON responses
    const responseText = await response.text();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Flora API error: ${responseText}` },
        { status: response.status }
      );
    }

    // Handle mixed HTML error + JSON response format from WordPress
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      // If JSON parsing fails, look for JSON content after HTML
      const jsonStart = responseText.indexOf('{"');
      if (jsonStart > 0) {
        try {
          const jsonPart = responseText.substring(jsonStart);
          data = JSON.parse(jsonPart);
        } catch (cleanParseError) {
          return NextResponse.json(
            { error: 'Invalid response format from server' },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Invalid response format from server' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to initiate conversion' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversionId = searchParams.get('id');
    const action = searchParams.get('action');
    
    if (!conversionId) {
      return NextResponse.json(
        { error: 'Conversion ID is required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    let apiUrl = `${FLORA_API_URL}/conversions/${conversionId}`;
    if (action === 'complete') {
      apiUrl = `${apiUrl}/complete`;
    } else if (action === 'cancel') {
      apiUrl = `${apiUrl}/cancel`;
    }
    
    const response = await fetch(addAuthToUrl(apiUrl), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    // Get response as text first to handle mixed HTML/JSON responses
    const responseText = await response.text();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Flora API error: ${responseText}` },
        { status: response.status }
      );
    }

    // Handle mixed HTML error + JSON response format from WordPress
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      // If JSON parsing fails, look for JSON content after HTML
      const jsonStart = responseText.indexOf('{"');
      if (jsonStart > 0) {
        try {
          const jsonPart = responseText.substring(jsonStart);
          data = JSON.parse(jsonPart);
        } catch (cleanParseError) {
          return NextResponse.json(
            { error: 'Invalid response format from server' },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Invalid response format from server' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update conversion' },
      { status: 500 }
    );
  }
}