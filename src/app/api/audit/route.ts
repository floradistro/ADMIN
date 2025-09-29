import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const FLORA_API_URL = 'https://api.floradistro.com';
const WC_CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const WC_CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

export async function GET(request: NextRequest) {
  try {
    // Check authentication with more lenient handling
    const session = await getServerSession(authOptions);
    
    // In production, check for auth cookies if session is missing
    if (!session && process.env.NODE_ENV === 'production') {
      const cookies = request.headers.get('cookie');
      const hasAuthCookie = cookies?.includes('next-auth.session-token') || 
                            cookies?.includes('__Secure-next-auth.session-token');
      
      if (!hasAuthCookie) {
        console.log('[Audit API] No auth cookie found in production');
        return NextResponse.json({ 
          success: false,
          data: [],
          error: 'Authentication required. Please log in.'
        }, { status: 401 });
      }
      // Continue if we have an auth cookie
      console.log('[Audit API] Auth cookie found, continuing despite no session');
    } else if (!session && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ 
        success: false,
        data: [],
        error: 'Authentication required. Please log in.'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';
    const location_id = searchParams.get('location_id');

    // Build Magic2 audit API URL
    const params = new URLSearchParams({
      limit,
      offset,
      consumer_key: WC_CONSUMER_KEY,
      consumer_secret: WC_CONSUMER_SECRET,
      orderby: 'created_at',
      order: 'DESC',
      _timestamp: Date.now().toString() // Prevent caching
    });

    if (location_id) {
      params.append('location_id', location_id);
    }

    const auditUrl = `${FLORA_API_URL}/wp-json/flora-im/v1/audit?${params}`;

    const fetchResponse = await fetch(auditUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      cache: 'no-store',
    });

    if (!fetchResponse.ok) {
      return NextResponse.json({
        success: false,
        data: [],
        error: `Magic2 API error: ${fetchResponse.status}`
      });
    }

    const rawData = await fetchResponse.json();
    
    // Debug: Log the first record to see what we're getting
    if (rawData.length > 0) {
      // Timestamp analysis: {
      //   created_at: rawData[0].created_at,
      //   created_at_type: typeof rawData[0].created_at,
      //   current_time: new Date().toISOString(),
      //   parsed_date: rawData[0].created_at ? new Date(rawData[0].created_at).toISOString() : 'null'
      // }
    }

    // Extract unique product IDs for batch product name resolution
    const productIds = new Set<number>();
    rawData.forEach((entry: any) => {
      const productId = parseInt(entry.product_id) || parseInt(entry.object_id) || 0;
      if (productId > 0) {
        productIds.add(productId);
      }
      
      // Also check details for additional product IDs
      try {
        const details = JSON.parse(entry.details || '{}');
        if (details.product_id) productIds.add(parseInt(details.product_id));
        if (details.from_product_id) productIds.add(parseInt(details.from_product_id));
        if (details.to_product_id) productIds.add(parseInt(details.to_product_id));
      } catch (e) {
        // Ignore parse errors
      }
    });

    // Fetch product names from WooCommerce API
    const productNames: Record<number, string> = {};
    if (productIds.size > 0) {
      try {
        const productIdArray = Array.from(productIds);
        
        // Batch fetch products from WooCommerce
        const wcUrl = `${FLORA_API_URL}/wp-json/wc/v3/products?include=${productIdArray.join(',')}&per_page=100&consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}`;
        const wcResponse = await fetch(wcUrl);
        
        if (wcResponse.ok) {
          const products = await wcResponse.json();
          products.forEach((product: any) => {
            if (product.id && product.name) {
              productNames[product.id] = product.name;
            }
          });
        } else {
        }
      } catch (error) {
      }
    }

    // Transform the data to match our frontend interface
    const transformedData = rawData.map((entry: any) => {
      let details: any = {};
      try {
        details = JSON.parse(entry.details || '{}');
      } catch (e) {
      }

      // Use main fields first, then fallback to details, then defaults
      const productId = parseInt(entry.product_id) || details.product_id || parseInt(entry.object_id) || 0;
      const locationId = parseInt(entry.location_id) || details.location_id || 0;
      
      // Handle old quantity - if null/undefined, try to calculate from change amount
      let oldQty = null;
      if (entry.old_quantity !== null && entry.old_quantity !== undefined) {
        oldQty = parseFloat(entry.old_quantity);
      } else if (details.old_quantity !== null && details.old_quantity !== undefined) {
        oldQty = parseFloat(details.old_quantity);
      }
      
      const newQty = parseFloat(entry.new_quantity) || parseFloat(details.new_quantity) || 0;
      const changeAmount = parseFloat(entry.quantity_change) || parseFloat(details.quantity_change) || 0;
      
      // If we don't have old quantity but have new quantity and change, calculate it
      if (oldQty === null && changeAmount !== 0) {
        oldQty = newQty - changeAmount;
      }
      
      // Default to 0 if we still can't determine old quantity
      if (oldQty === null || isNaN(oldQty)) {
        oldQty = 0;
      }

      const result: any = {
        id: parseInt(entry.id),
        product_id: productId,
        location_id: locationId,
        product_name: productNames[productId] || details.product_name || `Product ${productId}`,
        product_image: details.product_image || null,
        location_name: details.location_name || `Location ${locationId}`,
        old_quantity: oldQty,
        new_quantity: newQty,
        change_amount: changeAmount,
        operation: entry.action || 'inventory_update',
        reference_id: parseInt(entry.reference_id) || null,
        notes: entry.reason || null,
        user_id: parseInt(entry.user_id) || 0,
        user_name: entry.user_name || details.user_name || 'System',
        timestamp: entry.created_at,
        created_at: entry.created_at
      };

      // Add transfer-specific fields for stock transfers
      if (entry.action === 'stock_transfer') {
        result.from_location_id = details.from_location_id || null;
        result.from_location_name = details.from_location_name || null;
        result.to_location_id = details.to_location_id || null;
        result.to_location_name = details.to_location_name || null;
        result.transfer_quantity = details.quantity || 0;
      }

      // Add conversion-specific fields for stock conversions
      if (entry.action === 'stock_conversion' || entry.action === 'stock_conversion_to') {
        result.from_product_id = details.from_product_id || null;
        result.from_product_name = (details.from_product_id && productNames[details.from_product_id]) || details.from_product_name || null;
        result.from_product_image = details.from_product_image || null;
        result.to_product_id = details.to_product_id || null;
        result.to_product_name = (details.to_product_id && productNames[details.to_product_id]) || details.to_product_name || null;
        result.to_product_image = details.to_product_image || null;
        result.from_quantity = details.from_quantity || 0;
        result.to_quantity = details.to_quantity || 0;
        result.conversion_ratio = details.conversion_ratio || 0;
        result.location_name = details.location_name || null;
        
        // Override operation for both conversion types
        result.operation = 'stock_conversion';
        result.action = entry.action; // Preserve the original action type
        
        // For conversion entries, use the conversion product names instead of generic names
        if (entry.action === 'stock_conversion') {
          // This is the source product entry - use from_product_name
          result.product_name = details.from_product_name || result.product_name;
          result.product_image = details.from_product_image || result.product_image;
        } else if (entry.action === 'stock_conversion_to') {
          // This is the destination product entry - use to_product_name  
          result.product_name = details.to_product_name || result.product_name;
          result.product_image = details.to_product_image || result.product_image;
        }
      }

      return result;
    });

    // Debug: Log transformed data
    if (transformedData.length > 0) {
    }

    // Filter out entries with no quantity changes, but include transfers and conversions
    const filteredData = transformedData.filter((entry: any) => 
      Math.abs(entry.change_amount) > 0 || 
      entry.operation === 'stock_transfer' || 
      entry.operation === 'stock_conversion' ||
      entry.action === 'stock_conversion' ||
      entry.action === 'stock_conversion_to'
    );
    

    const jsonResponse = NextResponse.json({
      success: true,
      data: filteredData,
      total: filteredData.length
    });

    // Disable caching for real-time audit data
    jsonResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    jsonResponse.headers.set('Pragma', 'no-cache');
    jsonResponse.headers.set('Expires', '0');

    return jsonResponse;

  } catch (error) {
    return NextResponse.json({
      success: false,
      data: [],
      error: 'Failed to fetch audit data'
    });
  }
}