import { NextRequest, NextResponse } from 'next/server';

const WOOCOMMERCE_API_URL = 'https://api.floradistro.com/wp-json/wc/v3';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const per_page = searchParams.get('per_page') || '50';
    const status = searchParams.get('status') || 'any';
    const search = searchParams.get('search') || '';
    const customer = searchParams.get('customer') || '';
    const orderby = searchParams.get('orderby') || 'date';
    const order = searchParams.get('order') || 'desc';
    const location = searchParams.get('location') || '';
    const employee = searchParams.get('employee') || '';
    const date_from = searchParams.get('date_from') || '';
    const date_to = searchParams.get('date_to') || '';

    // Build query parameters
    const params = new URLSearchParams({
      consumer_key: CONSUMER_KEY,
      consumer_secret: CONSUMER_SECRET,
      page,
      per_page,
      orderby,
      order,
    });

    if (status !== 'any') {
      params.append('status', status);
    }

    if (search) {
      params.append('search', search);
    }

    if (customer) {
      params.append('customer', customer);
    }

    if (date_from) {
      params.append('after', date_from + 'T00:00:00');
    }

    if (date_to) {
      params.append('before', date_to + 'T23:59:59');
    }

    const apiUrl = `${WOOCOMMERCE_API_URL}/orders?${params.toString()}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `WooCommerce API error: ${response.status}` },
        { status: response.status }
      );
    }

    let orders = await response.json();
    
    // Filter by location if specified
    if (location) {
      orders = orders.filter((order: any) => {
        // Check various location-related meta fields
        const locationMetas = order.meta_data?.filter((meta: any) => 
          meta.key === 'source_name' || 
          meta.key === '_wc_order_attribution_utm_source' ||
          meta.key === '_order_source_system' ||
          meta.key === '_order_source'
        );
        
        if (locationMetas && locationMetas.length > 0) {
          // Check if any of the location metadata contains our search term
          const searchLocation = location.toLowerCase();
          return locationMetas.some((meta: any) => {
            const locationValue = meta.value.toString().toLowerCase();
            return locationValue.includes(searchLocation);
          });
        }
        
        // Also check created_via field
        if (order.created_via) {
          return order.created_via.toLowerCase().includes(location.toLowerCase());
        }
        
        return false;
      });
    }
    
    // Get pagination headers (note: these will be for the original unfiltered results)
    const totalOrders = response.headers.get('X-WP-Total');
    const totalPages = response.headers.get('X-WP-TotalPages');

    return NextResponse.json({
      success: true,
      data: orders,
      meta: {
        total: location ? orders.length : (totalOrders ? parseInt(totalOrders) : orders.length),
        pages: location ? Math.ceil(orders.length / parseInt(per_page)) : (totalPages ? parseInt(totalPages) : 1),
        current_page: parseInt(page),
        per_page: parseInt(per_page),
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Update order status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      consumer_key: CONSUMER_KEY,
      consumer_secret: CONSUMER_SECRET,
    });

    const apiUrl = `${WOOCOMMERCE_API_URL}/orders/${orderId}?${params.toString()}`;

    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `WooCommerce API error: ${response.status}` },
        { status: response.status }
      );
    }

    const updatedOrder = await response.json();

    return NextResponse.json({
      success: true,
      data: updatedOrder,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update order', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Delete order
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      consumer_key: CONSUMER_KEY,
      consumer_secret: CONSUMER_SECRET,
      force: 'true', // Permanently delete instead of moving to trash
    });

    const apiUrl = `${WOOCOMMERCE_API_URL}/orders/${orderId}?${params.toString()}`;

    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `WooCommerce API error: ${response.status}` },
        { status: response.status }
      );
    }


    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete order', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
