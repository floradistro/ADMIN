import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const FLORA_API_URL = 'https://api.floradistro.com';
const WC_CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const WC_CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session && process.env.NODE_ENV === 'production') {
      const cookies = request.headers.get('cookie');
      const hasAuthCookie = cookies?.includes('next-auth.session-token') || 
                            cookies?.includes('__Secure-next-auth.session-token');
      
      if (!hasAuthCookie) {
        return NextResponse.json({ 
          success: false,
          data: [],
          error: 'Authentication required. Please log in.'
        }, { status: 401 });
      }
    } else if (!session && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ 
        success: false,
        data: [],
        error: 'Authentication required. Please log in.'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '30';
    const location_id = searchParams.get('location_id');

    // Build Flora IM orders API URL
    const params = new URLSearchParams({
      limit,
      consumer_key: WC_CONSUMER_KEY,
      consumer_secret: WC_CONSUMER_SECRET,
      orderby: 'date_created',
      order: 'DESC',
      _timestamp: Date.now().toString() // Prevent caching
    });

    if (location_id) {
      params.append('location_id', location_id);
    }

    const ordersUrl = `${FLORA_API_URL}/wp-json/flora-im/v1/orders?${params}`;

    const fetchResponse = await fetch(ordersUrl, {
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
        error: `Flora IM Orders API error: ${fetchResponse.status}`
      });
    }

    const rawOrders = await fetchResponse.json();
    
    // Transform orders into audit-compatible format
    const transformedOrders = rawOrders.data?.map((order: any) => {
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
        id: `order-${order.id}`,
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
    }) || [];

    const jsonResponse = NextResponse.json({
      success: true,
      data: transformedOrders,
      total: transformedOrders.length
    });

    // Disable caching for real-time data
    jsonResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    jsonResponse.headers.set('Pragma', 'no-cache');
    jsonResponse.headers.set('Expires', '0');

    return jsonResponse;

  } catch (error) {
    return NextResponse.json({
      success: false,
      data: [],
      error: 'Failed to fetch orders data'
    });
  }
}
