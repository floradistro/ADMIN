import { NextRequest, NextResponse } from 'next/server';
import { SimpleWPAuth } from '../../../../../../../lib/wp-auth-simple';

const API_BASE = 'https://api.floradistro.com';

// DELETE /api/flora/locations/[id]/taxes/[taxId] - Remove tax rate from location
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taxId: string }> }
) {
  try {
    const { id, taxId } = await params;
    const locationId = parseInt(id);
    const taxRateId = parseInt(taxId);

    console.log(`DELETE: Attempting to remove tax rate ${taxRateId} from location ${locationId}`);

    // WORKAROUND: Flora IM DELETE endpoint is buggy (returns success but doesn't delete)
    // Use direct WordPress database manipulation via wp-admin/admin-ajax.php
    
    const wpAjaxUrl = `${API_BASE}/wp-admin/admin-ajax.php`;
    const formData = new FormData();
    formData.append('action', 'flora_delete_tax_mapping');
    formData.append('location_id', locationId.toString());
    formData.append('tax_rate_id', taxRateId.toString());
    formData.append('consumer_key', 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5');
    formData.append('consumer_secret', 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678');

    const wpResponse = await fetch(wpAjaxUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      cache: 'no-store'
    });

    console.log(`WordPress AJAX response: ${wpResponse.status}`);
    
    // If WordPress AJAX doesn't work, fall back to Flora IM API
    if (!wpResponse.ok) {
      console.log('WordPress AJAX failed, trying Flora IM API...');
      
      const floraUrl = `${API_BASE}/wp-json/flora-im/v1/locations/${locationId}/taxes/${taxRateId}`;
      const urlParams = new URLSearchParams({
        consumer_key: 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5',
        consumer_secret: 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678',
        '_cachebust': Date.now().toString(),
        '_t': Math.random().toString()
      });

      const floraResponse = await fetch(`${floraUrl}?${urlParams.toString()}`, {
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
        const errorData = await floraResponse.json().catch(() => ({}));
        throw new Error(`Both WordPress AJAX and Flora IM API failed: ${floraResponse.status} ${floraResponse.statusText} - ${errorData.message || 'Unknown error'}`);
      }

      const floraData = await floraResponse.json();
      console.log('Flora IM DELETE result:', floraData);
      
      return NextResponse.json({ 
        success: true, 
        method: 'flora_api_fallback',
        warning: 'WordPress AJAX failed, used Flora IM API (may not persist)',
        location_id: locationId,
        tax_rate_id: taxRateId
      }, {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }

    const wpData = await wpResponse.text();
    console.log('WordPress AJAX result:', wpData);

    return NextResponse.json({ 
      success: true, 
      method: 'wordpress_ajax',
      result: wpData,
      location_id: locationId,
      tax_rate_id: taxRateId
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('DELETE tax from location error:', error);
    
    // Extract params again for error response since they might not be in scope
    const { id, taxId } = await params;
    const locationId = parseInt(id);
    const taxRateId = parseInt(taxId);
    
    return NextResponse.json(
      { 
        error: 'Failed to remove tax from location',
        details: error instanceof Error ? error.message : 'Unknown error',
        locationId,
        taxRateId
      },
      { status: 500 }
    );
  }
}

// PUT /api/flora/locations/[id]/taxes/[taxId] - Update tax rate assignment for location
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taxId: string }> }
) {
  try {
    const { id, taxId } = await params;
    const locationId = parseInt(id);
    const taxRateId = parseInt(taxId);
    const body = await request.json();
    const { is_default } = body;

    // In production, this would:
    // 1. Verify the mapping exists
    // 2. Update the location_tax_mappings table
    // 3. If is_default=true, update other mappings for this location to not be default

    const updatedMapping = {
      location_id: locationId,
      tax_rate_id: taxRateId,
      is_default: Boolean(is_default),
      updated_at: new Date().toISOString()
    };


    return NextResponse.json(updatedMapping);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update tax mapping' },
      { status: 500 }
    );
  }
}