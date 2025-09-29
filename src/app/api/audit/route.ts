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
    // Fetch more entries to ensure we get user activities mixed with system activities
    const fetchLimit = Math.max(parseInt(limit) * 5, 500);
    const location_id = searchParams.get('location_id');

    // Build Magic2 audit API URL
    const params = new URLSearchParams({
      limit: fetchLimit.toString(),
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

    // Fetch both audit data and sales orders in parallel
    const auditUrl = `${FLORA_API_URL}/wp-json/flora-im/v1/audit?${params}`;
    const ordersUrl = `${FLORA_API_URL}/wp-json/flora-im/v1/orders?consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}&limit=50&orderby=date_created&order=DESC`;

    const [auditResponse, ordersResponse] = await Promise.all([
      fetch(auditUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        cache: 'no-store',
      }),
      fetch(ordersUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        cache: 'no-store',
      })
    ]);

    if (!auditResponse.ok) {
      return NextResponse.json({
        success: false,
        data: [],
        error: `Magic2 API error: ${auditResponse.status}`
      });
    }

    const rawData = await auditResponse.json();
    let salesData: any[] = [];

    // Add sales data if available
    if (ordersResponse.ok) {
      try {
        const ordersResult = await ordersResponse.json();
        if (ordersResult.data && Array.isArray(ordersResult.data)) {
          salesData = ordersResult.data;
        }
      } catch (ordersError) {
        console.warn('Failed to fetch sales orders:', ordersError);
      }
    }
    
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

    // Transform sales orders to audit format
    const transformedSales = salesData.map((order: any) => {
      const employeeName = order.employee_name || 'Unknown Staff';
      const employeeId = order.employee_id || 0;
      const locationName = order.meta_data?.find((meta: any) => meta.key === '_pos_location_name')?.value || 'Unknown Location';
      const paymentMethod = order.payment_method_title || order.payment_method || 'Unknown';
      const customerName = `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.trim() || 'POS Customer';
      
      // Calculate total items sold
      const totalItems = order.line_items?.reduce((sum: number, item: any) => {
        const actualQuantity = item.meta_data?.find((meta: any) => meta.key === '_actual_quantity')?.value || 0;
        return sum + parseFloat(actualQuantity);
      }, 0) || 0;

      return {
        id: parseInt(order.id),
        product_id: 0,
        location_id: parseInt(order.meta_data?.find((meta: any) => meta.key === '_flora_location_id')?.value || '0'),
        product_name: order.line_items?.length === 1 
          ? order.line_items[0].name 
          : `${order.line_items?.length || 0} items`,
        product_image: null,
        location_name: locationName,
        old_quantity: 0,
        new_quantity: 0,
        change_amount: -totalItems, // Negative because items were sold
        operation: 'sale',
        action: 'sale',
        reference_id: parseInt(order.id),
        reference_type: 'order',
        notes: `${paymentMethod} sale to ${customerName}`,
        user_id: parseInt(employeeId),
        user_name: employeeName,
        ip_address: null,
        user_agent: 'POS System',
        metadata: JSON.stringify({
          order_number: order.number,
          total: order.total,
          subtotal: order.subtotal,
          tax_total: order.tax_total,
          payment_method: paymentMethod,
          customer_name: customerName,
          items_count: order.line_items?.length || 0,
          total_quantity: totalItems
        }),
        batch_id: null,
        timestamp: order.date_created,
        created_at: order.date_created,
        details: {
          order_id: order.id,
          order_number: order.number,
          customer_name: customerName,
          employee_name: employeeName,
          location_name: locationName,
          total: order.total,
          payment_method: paymentMethod,
          items: order.line_items?.map((item: any) => ({
            name: item.name,
            quantity: item.meta_data?.find((meta: any) => meta.key === '_actual_quantity')?.value || 0,
            price: item.meta_data?.find((meta: any) => meta.key === '_actual_price')?.value || 0
          })) || []
        }
      };
    });

    // Transform the audit data to match our frontend interface
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
        action: entry.action || 'inventory_update',
        reference_id: parseInt(entry.reference_id) || null,
        reference_type: entry.reference_type || null,
        notes: details.reason || entry.reason || null,
        user_id: parseInt(entry.user_id) || 0,
        user_name: (details.user_name && details.user_name !== false) ? details.user_name : 
                  (entry.user_name && entry.user_name !== false) ? entry.user_name : 'System',
        ip_address: entry.ip_address || details.ip_address || null,
        user_agent: entry.user_agent || details.user_agent || null,
        metadata: entry.metadata || null,
        batch_id: entry.batch_id || null,
        timestamp: entry.created_at,
        created_at: entry.created_at,
        // Include raw details for additional context
        details: details
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

    // Combine sales data with audit data
    const allEntries = [...transformedSales, ...transformedData];

    // Filter out entries with no quantity changes, but include sales, transfers and conversions
    const filteredData = allEntries.filter((entry: any) => 
      entry.operation === 'sale' ||
      Math.abs(entry.change_amount) > 0 || 
      entry.operation === 'stock_transfer' || 
      entry.operation === 'stock_conversion' ||
      entry.action === 'stock_conversion' ||
      entry.action === 'stock_conversion_to' ||
      entry.action === 'cost_updated' ||
      entry.action === 'assign_tax' ||
      entry.action === 'remove_tax'
    );

    // Separate sales, user entries, and system entries
    const salesEntries = filteredData.filter((entry: any) => entry.operation === 'sale');
    const userEntries = filteredData.filter((entry: any) => 
      entry.operation !== 'sale' && entry.user_name && entry.user_name !== 'System' && entry.user_name !== false
    );
    const systemEntries = filteredData.filter((entry: any) => 
      entry.operation !== 'sale' && (!entry.user_name || entry.user_name === 'System' || entry.user_name === false)
    );

    // Sort each group by timestamp
    salesEntries.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    userEntries.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    systemEntries.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Mix the entries to show sales, user activities, and some system activities
    const requestedLimit = parseInt(limit);
    const salesLimit = Math.min(salesEntries.length, Math.ceil(requestedLimit * 0.4)); // 40% sales
    const userLimit = Math.min(userEntries.length, Math.ceil(requestedLimit * 0.4)); // 40% user activities
    const systemLimit = Math.max(0, requestedLimit - salesLimit - userLimit); // 20% system

    const mixedData = [
      ...salesEntries.slice(0, salesLimit),
      ...userEntries.slice(0, userLimit),
      ...systemEntries.slice(0, systemLimit)
    ].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    

    const jsonResponse = NextResponse.json({
      success: true,
      data: mixedData,
      total: mixedData.length
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