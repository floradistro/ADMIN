import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getWordPressCredentials } from '@/lib/api-keys';


// DELETE /api/flora/locations/[id]/employees/[employeeId] - Remove employee from location
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; employeeId: string }> }
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
    const { id, employeeId } = await params;
    const locationId = parseInt(id);
    const userId = parseInt(employeeId);

    if (!locationId || isNaN(locationId)) {
      return NextResponse.json(
        { error: 'Invalid location ID' },
        { status: 400 }
      );
    }

    if (!userId || isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid employee ID' },
        { status: 400 }
      );
    }

    // First, find the assignment ID from Flora IM
    const { apiBase } = getWordPressCredentials();
    const ADMIN_USERNAME = 'Master';
    const APP_PASSWORD = '0YPN eKpU k0NI cRmo JSgb 4lEt';
    const auth = Buffer.from(`${ADMIN_USERNAME}:${APP_PASSWORD}`).toString('base64');

    // Get the assignment to find the assignment ID
    const getResponse = await fetch(`${apiBase}/flora-im/v1/employees?location_id=${locationId}&user_id=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      }
    });

    if (!getResponse.ok) {
      throw new Error(`Flora IM API error: ${getResponse.status} ${getResponse.statusText}`);
    }

    const data = await getResponse.json();
    const employees = data.employees || [];
    const assignment = employees.find((emp: any) => 
      parseInt(emp.user_id) === userId && parseInt(emp.location_id) === locationId
    );

    if (!assignment) {
      return NextResponse.json(
        { error: 'Employee assignment not found' },
        { status: 404 }
      );
    }

    // Delete the assignment using Flora IM API
    const deleteResponse = await fetch(`${apiBase}/flora-im/v1/employees/${assignment.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      }
    });

    if (!deleteResponse.ok) {
      throw new Error(`Flora IM API error: ${deleteResponse.status} ${deleteResponse.statusText}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Employee removed from location successfully'
    });
  } catch (error) {
    console.error('Error removing employee from location:', error);
    return NextResponse.json(
      { error: 'Failed to remove employee from location' },
      { status: 500 }
    );
  }
}

// PUT /api/flora/locations/[id]/employees/[employeeId] - Update employee role at location
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; employeeId: string }> }
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
    const { id, employeeId } = await params;
    const locationId = parseInt(id);
    const userId = parseInt(employeeId);
    const body = await request.json();
    const { is_manager = false } = body;

    if (!locationId || isNaN(locationId)) {
      return NextResponse.json(
        { error: 'Invalid location ID' },
        { status: 400 }
      );
    }

    if (!userId || isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid employee ID' },
        { status: 400 }
      );
    }

    // First, find the assignment ID from Flora IM
    const { apiBase } = getWordPressCredentials();
    const ADMIN_USERNAME = 'Master';
    const APP_PASSWORD = '0YPN eKpU k0NI cRmo JSgb 4lEt';
    const auth = Buffer.from(`${ADMIN_USERNAME}:${APP_PASSWORD}`).toString('base64');

    // Get the assignment to find the assignment ID
    const getResponse = await fetch(`${apiBase}/flora-im/v1/employees?location_id=${locationId}&user_id=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      }
    });

    if (!getResponse.ok) {
      throw new Error(`Flora IM API error: ${getResponse.status} ${getResponse.statusText}`);
    }

    const data = await getResponse.json();
    const employees = data.employees || [];
    const assignment = employees.find((emp: any) => 
      parseInt(emp.user_id) === userId && parseInt(emp.location_id) === locationId
    );

    if (!assignment) {
      return NextResponse.json(
        { error: 'Employee assignment not found' },
        { status: 404 }
      );
    }

    // Update the assignment using Flora IM API
    const updateResponse = await fetch(`${apiBase}/flora-im/v1/employees/${assignment.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        role: is_manager ? 'manager' : 'employee'
      })
    });

    if (!updateResponse.ok) {
      throw new Error(`Flora IM API error: ${updateResponse.status} ${updateResponse.statusText}`);
    }

    const updatedAssignment = await updateResponse.json();
    
    return NextResponse.json({
      success: true,
      assignment: updatedAssignment,
      message: 'Employee role updated successfully'
    });
  } catch (error) {
    console.error('Error updating employee role:', error);
    return NextResponse.json(
      { error: 'Failed to update employee role' },
      { status: 500 }
    );
  }
}
