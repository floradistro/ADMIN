import { NextRequest, NextResponse } from 'next/server';

const WORDPRESS_API_BASE = 'https://api.floradistro.com/wp-json/wp/v2';
const ADMIN_USERNAME = 'Master';
const APP_PASSWORD = '0YPN eKpU k0NI cRmo JSgb 4lEt';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Get user data first to validate user exists
    const userResponse = await fetch(`${WORDPRESS_API_BASE}/users/${id}?context=edit`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${ADMIN_USERNAME}:${APP_PASSWORD}`).toString('base64')}`,
      },
    });

    if (!userResponse.ok) {
      return NextResponse.json(
        { error: 'User not found', user_id: id }, 
        { status: 404 }
      );
    }

    const user = await userResponse.json();
    
    // Generate a new random password
    const newPassword = Array.from({length: 12}, () => 
      'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'[Math.floor(Math.random() * 55)]
    ).join('');
    
    // Update user with new password
    const updateResponse = await fetch(`${WORDPRESS_API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${ADMIN_USERNAME}:${APP_PASSWORD}`).toString('base64')}`,
      },
      body: JSON.stringify({
        password: newPassword
      }),
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.text();
      return NextResponse.json(
        { error: 'Failed to reset password', details: errorData }, 
        { status: updateResponse.status }
      );
    }


    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully',
      user_id: id,
      username: user.username,
      new_password: newPassword, // In production, this should be emailed instead
      note: 'Please save this password and change it after first login'
    }, { status: 200 });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}