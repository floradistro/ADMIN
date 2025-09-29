import { NextRequest, NextResponse } from 'next/server';

const API_BASE = 'https://api.floradistro.com';

interface DebugTest {
  test: string;
  status: 'PASS' | 'FAIL' | 'ERROR';
  details: string;
  data?: any;
  count?: number;
}

// GET /api/debug/tax-mappings - Debug tax mappings and assignments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('location_id');
    
    if (!locationId) {
      return NextResponse.json({ error: 'location_id parameter required' }, { status: 400 });
    }

    const debug = {
      locationId: parseInt(locationId),
      timestamp: new Date().toISOString(),
      tests: [] as DebugTest[]
    };

    // Test 1: Get assigned tax rates via Portal API
    try {
      const portalResponse = await fetch(`${request.url.split('/api/')[0]}/api/flora/locations/${locationId}/taxes`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });

      const portalData = portalResponse.ok ? await portalResponse.json() : null;
      
      debug.tests.push({
        test: 'Portal API - Get Location Tax Rates',
        status: portalResponse.ok ? 'PASS' : 'FAIL',
        details: `Status: ${portalResponse.status}`,
        data: portalData,
        count: Array.isArray(portalData) ? portalData.length : 0
      });
    } catch (error) {
      debug.tests.push({
        test: 'Portal API - Get Location Tax Rates',
        status: 'ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 2: Get tax assignments directly from Magic2 API
    try {
      const magic2Url = `${API_BASE}/wp-json/flora-im/v1/locations/${locationId}/taxes`;
      const magic2Params = new URLSearchParams({
        consumer_key: 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5',
        consumer_secret: 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678'
      });

      const magic2Response = await fetch(`${magic2Url}?${magic2Params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });

      const magic2Data = magic2Response.ok ? await magic2Response.json() : await magic2Response.text();
      
      debug.tests.push({
        test: 'Magic2 API - Direct Tax Assignments',
        status: magic2Response.ok ? 'PASS' : 'FAIL',
        details: `Status: ${magic2Response.status}`,
        data: magic2Data,
        count: Array.isArray(magic2Data) ? magic2Data.length : 0
      });
    } catch (error) {
      debug.tests.push({
        test: 'Magic2 API - Direct Tax Assignments',
        status: 'ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 3: Get all tax rates from WooCommerce
    try {
      const wcUrl = `${API_BASE}/wp-json/wc/v3/taxes`;
      const wcParams = new URLSearchParams({
        consumer_key: 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5',
        consumer_secret: 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678',
        per_page: '100'
      });

      const wcResponse = await fetch(`${wcUrl}?${wcParams.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });

      const wcData = wcResponse.ok ? await wcResponse.json() : null;
      
      debug.tests.push({
        test: 'WooCommerce API - All Tax Rates',
        status: wcResponse.ok ? 'PASS' : 'FAIL',
        details: `Status: ${wcResponse.status}`,
        data: wcData ? wcData.slice(0, 5) : null, // Only show first 5 for brevity
        count: Array.isArray(wcData) ? wcData.length : 0
      });
    } catch (error) {
      debug.tests.push({
        test: 'WooCommerce API - All Tax Rates',
        status: 'ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 4: Get location tax mappings via Magic2 API
    try {
      const mappingsUrl = `${API_BASE}/wp-json/flora-im/v1/locations/taxes`;
      const mappingsParams = new URLSearchParams({
        consumer_key: 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5',
        consumer_secret: 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678',
        location_id: locationId
      });

      const mappingsResponse = await fetch(`${mappingsUrl}?${mappingsParams.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });

      const mappingsData = mappingsResponse.ok ? await mappingsResponse.json() : await mappingsResponse.text();
      
      debug.tests.push({
        test: 'Magic2 API - Location Tax Mappings',
        status: mappingsResponse.ok ? 'PASS' : 'FAIL',
        details: `Status: ${mappingsResponse.status}`,
        data: mappingsData,
        count: Array.isArray(mappingsData) ? mappingsData.length : 0
      });
    } catch (error) {
      debug.tests.push({
        test: 'Magic2 API - Location Tax Mappings',
        status: 'ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return NextResponse.json(debug);

  } catch (error) {
    console.error('Debug tax mappings error:', error);
    return NextResponse.json(
      { 
        error: 'Debug failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
