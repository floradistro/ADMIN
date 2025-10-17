import { NextRequest, NextResponse } from 'next/server';

const FLORA_API_BASE = 'https://api.floradistro.com/wp-json';
const FLORA_CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const FLORA_CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

/**
 * Bulk Products API - V2 Optimized
 * Proxies to flora-im/v1/products/bulk
 * Gets products with inventory, pricing, and fields in 1 query instead of 300+
 * 
 * @route GET /api/bulk/products
 * @query location_id - Filter by location ID
 * @query category - Filter by category ID
 * @query per_page - Items per page (default: 100)
 * @query page - Page number (default: 1)
 * @query restock_mode - Include ALL products including out of stock (default: false)
 * @query audit_mode - Audit mode flag (default: false)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Build Flora IM bulk API URL
    const url = new URL(`${FLORA_API_BASE}/flora-im/v1/products/bulk`);
    url.searchParams.append('consumer_key', FLORA_CONSUMER_KEY);
    url.searchParams.append('consumer_secret', FLORA_CONSUMER_SECRET);
    
    // Forward query params
    searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Flora IM Bulk API error: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // STRICT CLIENT-SIDE FILTERING: Remove duplicate and fake fields
    if (data.success && data.data) {
      const allowedMetaKeys = new Set(['strain_type', 'lineage', 'nose', 'effects', 'thc_percentage', 'thca_percentage']);
      
      data.data = data.data.map((product: any) => {
        // Filter meta_data to only allowed keys
        if (product.meta_data && Array.isArray(product.meta_data)) {
          // Remove duplicates - prefer 'effects' over 'effect', etc.
          const seen = new Set();
          product.meta_data = product.meta_data.filter((meta: any) => {
            // Only allow whitelisted fields
            if (!allowedMetaKeys.has(meta.key)) {
              return false;
            }
            
            // Skip duplicates (e.g., skip 'effect' if we already have 'effects')
            const baseKey = meta.key.replace(/s$/, ''); // Remove trailing 's'
            if (seen.has(baseKey) || seen.has(meta.key + 's')) {
              return false;
            }
            seen.add(meta.key);
            seen.add(baseKey);
            
            return true;
          });
        }
        
        return product;
      });
    }
    
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error('Bulk products API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bulk products' },
      { status: 500 }
    );
  }
}

