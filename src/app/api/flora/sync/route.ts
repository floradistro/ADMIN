import { NextRequest, NextResponse } from 'next/server';

/**
 * Sync Selected Products with Locations API
 * Creates inventory records for selected products across all locations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { product_ids } = body;
    
    if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'product_ids array is required'
      }, { status: 400 });
    }
    
    const consumerKey = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
    const consumerSecret = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';
    const floraBaseUrl = 'https://api.floradistro.com/wp-json/flora-im/v1';
    
    
    // Step 1: Get all active locations
    const locationsUrl = `${floraBaseUrl}/locations?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
    
    const locationsResponse = await fetch(locationsUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!locationsResponse.ok) {
      throw new Error(`Failed to fetch locations: ${locationsResponse.status}`);
    }
    
    const locations = await locationsResponse.json();
    const activeLocations = Array.isArray(locations) ? 
      locations.filter(loc => loc.is_active === "1" || loc.is_active === 1) : [];
    
    
    if (activeLocations.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No active locations found'
      }, { status: 400 });
    }
    
    // Step 2: Initialize inventory for each selected product at each location
    const results = [];
    let totalInitialized = 0;
    let totalErrors = 0;
    
    for (const productId of product_ids) {
      
      const productResults = {
        product_id: productId,
        initialized_locations: [] as { location_id: any; location_name: any }[],
        errors: [] as string[]
      };
      
      for (const location of activeLocations) {
        try {
          // Check if inventory record already exists
          const checkUrl = `${floraBaseUrl}/inventory?product_id=${productId}&location_id=${location.id}&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
          
          const checkResponse = await fetch(checkUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (checkResponse.ok) {
            const existingInventory = await checkResponse.json();
            
            // If inventory record doesn't exist, create it
            if (!Array.isArray(existingInventory) || existingInventory.length === 0) {
              const createUrl = `${floraBaseUrl}/inventory?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
              
              const createResponse = await fetch(createUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  product_id: productId,
                  location_id: location.id,
                  quantity: 0 // Initialize with 0 quantity
                })
              });
              
              if (createResponse.ok) {
                productResults.initialized_locations.push({
                  location_id: location.id,
                  location_name: location.name
                });
                totalInitialized++;
              } else {
                const errorText = await createResponse.text();
                const error = `Failed to create inventory at ${location.name}: ${errorText.substring(0, 100)}`;
                productResults.errors.push(error);
                totalErrors++;
              }
            } else {
            }
          } else {
            const error = `Failed to check inventory at ${location.name}: ${checkResponse.status}`;
            productResults.errors.push(error);
            totalErrors++;
          }
        } catch (error) {
          const errorMsg = `Error processing ${location.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          productResults.errors.push(errorMsg);
          totalErrors++;
        }
      }
      
      results.push(productResults);
    }
    
    // Step 3: Return comprehensive results
    const syncStats = {
      total_products: product_ids.length,
      total_locations: activeLocations.length,
      total_initialized: totalInitialized,
      total_errors: totalErrors,
      success_rate: totalInitialized / (product_ids.length * activeLocations.length) * 100,
      results,
      timestamp: new Date().toISOString()
    };
    
    
    return NextResponse.json({
      success: totalInitialized > 0,
      message: `Sync completed: ${totalInitialized} inventory records created, ${totalErrors} errors`,
      data: syncStats
    });
    
  } catch (error) {
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Sync failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * Get sync status and last sync information
 */
export async function GET(request: NextRequest) {
  try {
    // Return basic sync status information
    return NextResponse.json({
      success: true,
      data: {
        sync_available: true,
        last_sync: null, // Could be stored in database/cache if needed
        endpoints: {
          locations: 'https://api.floradistro.com/wp-json/flora-im/v1/locations',
          products: 'https://api.floradistro.com/wp-json/flora-im/v1/products'
        }
      }
    });
    
  } catch (error) {
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get sync status'
    }, { status: 500 });
  }
}
