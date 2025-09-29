import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getWordPressCredentials } from '@/lib/api-keys';

// GET /api/flora/locations/[id]/employees - Get employees assigned to location
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const { id } = await params;
    const locationId = parseInt(id);

    if (!locationId || isNaN(locationId)) {
      return NextResponse.json(
        { error: 'Invalid location ID' },
        { status: 400 }
      );
    }

    // Use Flora IM employees API to get actual assignments
    const { apiBase } = getWordPressCredentials();
    const ADMIN_USERNAME = 'Master';
    const APP_PASSWORD = '0YPN eKpU k0NI cRmo JSgb 4lEt';
    const auth = Buffer.from(`${ADMIN_USERNAME}:${APP_PASSWORD}`).toString('base64');

    const response = await fetch(`${apiBase}/flora-im/v1/employees?location_id=${locationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      }
    });

    if (!response.ok) {
      throw new Error(`Flora IM API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const employees = data.employees || [];
    
    // Transform Flora IM employee data to match our frontend interface
    const assignedStaff = employees.map((emp: any) => ({
      id: parseInt(emp.user_id),
      username: emp.user_name || '',
      email: emp.user_email || '',
      display_name: emp.user_name || '',
      roles: emp.role === 'manager' ? ['shop_manager'] : ['employee'],
      is_manager: emp.role === 'manager',
      assignment_id: emp.id,
      location_id: emp.location_id,
      assigned_at: emp.assigned_at,
      is_primary: emp.is_primary === '1'
    }));

    console.log(`Found ${assignedStaff.length} staff assigned to location ${locationId} via Flora IM`);
    return NextResponse.json(assignedStaff);
    
  } catch (error) {
    console.error('Error fetching location employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch location employees' },
      { status: 500 }
    );
  }
}

// POST /api/flora/locations/[id]/employees - Assign employee to location
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const { id } = await params;
    const locationId = parseInt(id);
    const body = await request.json();
    const { user_id, is_manager = false } = body;

    if (!locationId || isNaN(locationId)) {
      return NextResponse.json(
        { error: 'Invalid location ID' },
        { status: 400 }
      );
    }

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    // Use Flora IM employees API to create assignment
    const { apiBase } = getWordPressCredentials();
    const ADMIN_USERNAME = 'Master';
    const APP_PASSWORD = '0YPN eKpU k0NI cRmo JSgb 4lEt';
    const auth = Buffer.from(`${ADMIN_USERNAME}:${APP_PASSWORD}`).toString('base64');

    const response = await fetch(`${apiBase}/flora-im/v1/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        user_id: user_id,
        location_id: locationId,
        role: is_manager ? 'manager' : 'employee',
        is_primary: '0', // Default to not primary
        status: 'active'
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Flora IM API error: ${response.status} ${response.statusText} - ${errorData}`);
    }

    const result = await response.json();
    console.log(`Assigned user ${user_id} to location ${locationId} as ${is_manager ? 'manager' : 'employee'} via Flora IM`);

    return NextResponse.json({
      success: true,
      message: 'Employee assigned to location successfully',
      assignment: result
    });
  } catch (error) {
    console.error('Error assigning employee to location:', error);
    return NextResponse.json(
      { error: 'Failed to assign employee to location' },
      { status: 500 }
    );
  }
}