import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const WORDPRESS_API_BASE = 'https://api.floradistro.com/wp-json/wp/v2';
const ADMIN_USERNAME = 'Master'; // Your admin username
const APP_PASSWORD = '0YPN eKpU k0NI cRmo JSgb 4lEt';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    // In production, check for auth cookies if session is missing
    if (!session && process.env.NODE_ENV === 'production') {
      const cookies = request.headers.get('cookie');
      const hasAuthCookie = cookies?.includes('next-auth.session-token') || 
                            cookies?.includes('__Secure-next-auth.session-token');
      
      if (!hasAuthCookie) {
        console.log('[Users API] No auth cookie found in production');
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      // Continue if we have an auth cookie
      console.log('[Users API] Auth cookie found, continuing despite no session');
    } else if (!session && process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Fetch all users with pagination to handle large datasets
    let allUsers: any[] = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const url = new URL(`${WORDPRESS_API_BASE}/users`);
      url.searchParams.append('context', 'edit'); // Get full user data including username/email
      url.searchParams.append('per_page', '100'); // Max per page
      url.searchParams.append('page', page.toString());
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${ADMIN_USERNAME}:${APP_PASSWORD}`).toString('base64')}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('WordPress API error:', response.status, errorText);
        return NextResponse.json({ error: 'Failed to fetch users', details: errorText }, { status: response.status });
      }

      const data = await response.json();
      allUsers.push(...data);
      
      // Check if there are more pages
      const totalPages = response.headers.get('X-WP-TotalPages');
      hasMore = totalPages ? page < parseInt(totalPages) : data.length === 100;
      page++;
    }

    return NextResponse.json(allUsers, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    // In production, check for auth cookies if session is missing
    if (!session && process.env.NODE_ENV === 'production') {
      const cookies = request.headers.get('cookie');
      const hasAuthCookie = cookies?.includes('next-auth.session-token') || 
                            cookies?.includes('__Secure-next-auth.session-token');
      
      if (!hasAuthCookie) {
        console.log('[Users API] No auth cookie found in production');
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      // Continue if we have an auth cookie
      console.log('[Users API] Auth cookie found, continuing despite no session');
    } else if (!session && process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    const url = new URL(`${WORDPRESS_API_BASE}/users`);
    
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
        { error: 'Failed to create user', details: errorData }, 
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, { status: 201 });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}