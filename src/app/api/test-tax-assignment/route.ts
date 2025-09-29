import { NextRequest, NextResponse } from 'next/server';

const API_BASE = 'https://api.floradistro.com';

// GET /api/test-tax-assignment - Test tax assignment functionality
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('location_id');
    const taxRateId = searchParams.get('tax_rate_id');
    
    if (!locationId) {
      return NextResponse.json({ error: 'location_id parameter required' }, { status: 400 });
    }

    const tests = [];

    // Test 1: Check Magic2 API connectivity
    try {
      const connectivityUrl = `${API_BASE}/wp-json/flora-im/v1/locations`;
      const connectivityParams = new URLSearchParams({
        consumer_key: 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5',
        consumer_secret: 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678'
      });

      const connectivityResponse = await fetch(`${connectivityUrl}?${connectivityParams.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });

      tests.push({
        test: 'Magic2 API Connectivity',
        status: connectivityResponse.ok ? 'PASS' : 'FAIL',
        details: connectivityResponse.ok 
          ? `Connected successfully (${connectivityResponse.status})` 
          : `Failed to connect (${connectivityResponse.status} ${connectivityResponse.statusText})`
      });
    } catch (error) {
      tests.push({
        test: 'Magic2 API Connectivity',
        status: 'FAIL',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 2: Check location exists
    try {
      const locationUrl = `${API_BASE}/wp-json/flora-im/v1/locations/${locationId}`;
      const locationParams = new URLSearchParams({
        consumer_key: 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5',
        consumer_secret: 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678'
      });

      const locationResponse = await fetch(`${locationUrl}?${locationParams.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });

      tests.push({
        test: `Location ${locationId} Exists`,
        status: locationResponse.ok ? 'PASS' : 'FAIL',
        details: locationResponse.ok 
          ? 'Location found' 
          : `Location not found (${locationResponse.status} ${locationResponse.statusText})`
      });
    } catch (error) {
      tests.push({
        test: `Location ${locationId} Exists`,
        status: 'FAIL',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 3: Get current tax assignments for location
    try {
      const taxUrl = `${API_BASE}/wp-json/flora-im/v1/locations/${locationId}/taxes`;
      const taxParams = new URLSearchParams({
        consumer_key: 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5',
        consumer_secret: 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678'
      });

      const taxResponse = await fetch(`${taxUrl}?${taxParams.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });

      const taxData = taxResponse.ok ? await taxResponse.json() : null;

      tests.push({
        test: 'Get Location Tax Assignments',
        status: taxResponse.ok ? 'PASS' : 'FAIL',
        details: taxResponse.ok 
          ? `Found ${Array.isArray(taxData) ? taxData.length : 0} tax assignments`
          : `Failed to get tax assignments (${taxResponse.status} ${taxResponse.statusText})`,
        data: taxData
      });
    } catch (error) {
      tests.push({
        test: 'Get Location Tax Assignments',
        status: 'FAIL',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 4: Test tax assignment if taxRateId provided
    if (taxRateId) {
      try {
        const assignUrl = `${API_BASE}/wp-json/flora-im/v1/locations/${locationId}/taxes`;
        const assignParams = new URLSearchParams({
          consumer_key: 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5',
          consumer_secret: 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678'
        });

        const assignResponse = await fetch(`${assignUrl}?${assignParams.toString()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tax_rate_id: parseInt(taxRateId),
            is_default: true
          }),
          cache: 'no-store'
        });

        const assignData = assignResponse.ok ? await assignResponse.json() : await assignResponse.text();

        tests.push({
          test: `Assign Tax Rate ${taxRateId}`,
          status: assignResponse.ok ? 'PASS' : 'FAIL',
          details: assignResponse.ok 
            ? 'Tax assignment successful'
            : `Tax assignment failed (${assignResponse.status} ${assignResponse.statusText})`,
          data: assignData
        });

        // Test 5: Test tax unassignment if assignment was successful
        if (assignResponse.ok) {
          try {
            const unassignUrl = `${API_BASE}/wp-json/flora-im/v1/locations/${locationId}/taxes/${taxRateId}`;
            const unassignParams = new URLSearchParams({
              consumer_key: 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5',
              consumer_secret: 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678'
            });

            const unassignResponse = await fetch(`${unassignUrl}?${unassignParams.toString()}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              cache: 'no-store'
            });

            const unassignData = unassignResponse.ok ? await unassignResponse.json() : await unassignResponse.text();

            tests.push({
              test: `Unassign Tax Rate ${taxRateId}`,
              status: unassignResponse.ok ? 'PASS' : 'FAIL',
              details: unassignResponse.ok 
                ? 'Tax unassignment successful'
                : `Tax unassignment failed (${unassignResponse.status} ${unassignResponse.statusText})`,
              data: unassignData
            });
          } catch (error) {
            tests.push({
              test: `Unassign Tax Rate ${taxRateId}`,
              status: 'FAIL',
              details: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      } catch (error) {
        tests.push({
          test: `Assign Tax Rate ${taxRateId}`,
          status: 'FAIL',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      locationId: parseInt(locationId),
      taxRateId: taxRateId ? parseInt(taxRateId) : null,
      tests,
      summary: {
        total: tests.length,
        passed: tests.filter(t => t.status === 'PASS').length,
        failed: tests.filter(t => t.status === 'FAIL').length
      }
    });

  } catch (error) {
    console.error('Test tax assignment error:', error);
    return NextResponse.json(
      { 
        error: 'Test failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
