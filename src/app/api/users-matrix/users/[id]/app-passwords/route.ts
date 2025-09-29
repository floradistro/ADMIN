import { NextRequest, NextResponse } from 'next/server';

const WORDPRESS_API_BASE = 'https://api.floradistro.com/wp-json/wp/v2';
const ADMIN_USERNAME = 'Master';
const APP_PASSWORD = '0YPN eKpU k0NI cRmo JSgb 4lEt';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const url = new URL(`${WORDPRESS_API_BASE}/users/${id}/application-passwords`);
    
    // Add authentication via Basic Auth
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${ADMIN_USERNAME}:${APP_PASSWORD}`).toString('base64')}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: 'Failed to get application passwords', details: errorData }, 
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, { status: 200 });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const body = await request.json();
    
    const url = new URL(`${WORDPRESS_API_BASE}/users/${id}/application-passwords`);
    
    // Add authentication via Basic Auth
    
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${ADMIN_USERNAME}:${APP_PASSWORD}`).toString('base64')}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: 'Failed to create application password', details: errorData }, 
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, { status: 201 });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}