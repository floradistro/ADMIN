import { NextRequest, NextResponse } from 'next/server';
import { autoInventoryInitializer } from '../../../../services/auto-inventory-initializer';
import { logger } from '@/lib/logger';

/**
 * Initialize inventory for a product across all locations
 * 
 * POST /api/products/initialize-inventory
 * Body: { product_id: number, initial_quantity?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { product_id, initial_quantity = 0 } = body;

    if (!product_id) {
      return NextResponse.json(
        { success: false, error: 'product_id is required' },
        { status: 400 }
      );
    }

    console.log(`🚀 Initializing inventory for product ${product_id} with quantity ${initial_quantity}`);

    const result = await autoInventoryInitializer.initializeInventoryForProduct(
      parseInt(product_id),
      parseFloat(initial_quantity)
    );

    if (result.success) {
      console.log(`✅ Successfully initialized inventory for product ${product_id}`);
      return NextResponse.json({
        success: true,
        message: result.message,
        data: {
          product_id: parseInt(product_id),
          initialized_locations: result.initialized_locations,
          total_initialized: result.initialized_locations.length,
          errors: result.errors
        }
      });
    } else {
      console.error(`❌ Failed to initialize inventory for product ${product_id}:`, result.message);
      return NextResponse.json(
        { 
          success: false, 
          error: result.message,
          errors: result.errors 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in initialize-inventory API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Check inventory status for a product
 * 
 * GET /api/products/initialize-inventory?product_id=123
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'product_id parameter is required' },
        { status: 400 }
      );
    }

    const status = await autoInventoryInitializer.checkInventoryStatus(parseInt(productId));

    return NextResponse.json({
      success: true,
      data: {
        product_id: parseInt(productId),
        has_complete_inventory: status.has_inventory,
        missing_locations: status.missing_locations,
        total_locations: status.total_locations,
        missing_count: status.missing_locations.length
      }
    });
  } catch (error) {
    console.error('Error checking inventory status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}