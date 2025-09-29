import { NextRequest, NextResponse } from 'next/server';

const API_BASE = 'https://api.floradistro.com';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

function addAuthToUrl(url: string) {
  return `${url}&consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
}

// PUT /api/flora/blueprint-fields/[id] - Update blueprint field definition
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    console.log('🔧 Updating blueprint field:', id, body);
    
    const url = addAuthToUrl(`${API_BASE}/wp-json/fd/v1/blueprint-fields/${id}?`);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    console.log('📡 Field update response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Field update error:', errorText);
      
      return NextResponse.json(
        { error: 'Failed to update blueprint field', details: errorText },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('✅ Field updated successfully:', data);
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
    
  } catch (error) {
    console.error('❌ Error updating blueprint field:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE /api/flora/blueprint-fields/[id] - Delete blueprint field
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log('🗑️ Deleting blueprint field:', id);
    
    const url = addAuthToUrl(`${API_BASE}/wp-json/fd/v1/blueprint-fields/${id}?`);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📡 Field delete response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Field delete error:', errorText);
      
      return NextResponse.json(
        { error: 'Failed to delete blueprint field', details: errorText },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('✅ Field deleted successfully:', data);
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
    
  } catch (error) {
    console.error('❌ Error deleting blueprint field:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
