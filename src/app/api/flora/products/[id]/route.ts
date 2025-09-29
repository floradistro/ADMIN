import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const FLORA_API_BASE = 'https://api.floradistro.com/wp-json';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TEMPORARY: Bypass authentication for development
    const session = await getServerSession(authOptions);
    if (!session && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const productId = parseInt(id);
    const updateData = await request.json();
    
    console.log(`Product update request for ${productId}:`, updateData);

    // Try WooCommerce API for basic product fields
    try {
      const wcUrl = `${FLORA_API_BASE}/wc/v3/products/${productId}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;

      // Prepare WooCommerce compatible data
      const wcData: any = {};
      if (updateData.name) wcData.name = updateData.name;
      if (updateData.sku) wcData.sku = updateData.sku;
      if (updateData.description) wcData.description = updateData.description;
      if (updateData.short_description) wcData.short_description = updateData.short_description;
      
      // Handle image update - only if it's not a localhost URL (for development)
      if (updateData.image && !updateData.image.includes('localhost')) {
        wcData.images = [
          {
            src: updateData.image,
            name: updateData.name || 'Product Image',
            alt: `${updateData.name || 'Product'} image`
          }
        ];
      }
      
      // Handle meta_data updates (for COA attachments, etc.)
      if (updateData.meta_data) {
        wcData.meta_data = updateData.meta_data;
      }
      
      // Try to include blueprint fields in the main WooCommerce call
      if (updateData.blueprint_fields) {
        if (!wcData.meta_data) {
          wcData.meta_data = [];
        }
        Object.entries(updateData.blueprint_fields).forEach(([key, value]) => {
          wcData.meta_data.push({
            key: key,
            value: value
          });
        });
      }

      const wcResponse = await fetch(wcUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wcData)
      });

      if (!wcResponse.ok) {
        const errorText = await wcResponse.text();
        console.error(`WooCommerce API error for product ${productId}:`, {
          status: wcResponse.status,
          error: errorText,
          requestData: wcData
        });
        throw new Error(`WooCommerce API error: ${wcResponse.status} - ${errorText}`);
      }

      const wcResult = await wcResponse.json();

      // Handle blueprint fields separately using the Flora Fields API
      if (updateData.blueprint_fields) {
        console.log(`Updating blueprint fields for product ${productId}:`, updateData.blueprint_fields);
        try {
          const floraUrl = `${FLORA_API_BASE}/flora-fields/v1/product-fields/${productId}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
          
          const floraResponse = await fetch(floraUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              product_id: productId,
              field_values: updateData.blueprint_fields
            })
          });

          if (!floraResponse.ok) {
            const floraErrorText = await floraResponse.text();
            console.warn(`Flora Fields API error: ${floraResponse.status} - ${floraErrorText}`);
            
            // Try alternative method using BluePrints API
            try {
              const blueprintUrl = `${FLORA_API_BASE}/blueprints/v1/products/${productId}/fields?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
              
              const blueprintResponse = await fetch(blueprintUrl, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData.blueprint_fields)
              });

              if (!blueprintResponse.ok) {
                const blueprintErrorText = await blueprintResponse.text();
                console.warn(`BluePrints API also failed: ${blueprintResponse.status} - ${blueprintErrorText}`);
              } else {
                console.log('Blueprint fields updated successfully via BluePrints API');
              }
            } catch (blueprintError) {
              console.warn('BluePrints API fallback failed:', blueprintError);
            }
          } else {
            console.log('Blueprint fields updated successfully via Flora Fields API');
          }
        } catch (floraError) {
          console.warn('Failed to update blueprint fields:', floraError);
          // Don't fail the entire request if blueprint fields fail
        }
      }

      return NextResponse.json({
        success: true,
        data: wcResult
      });

    } catch (wcError) {

      throw wcError;
    }

  } catch (error) {

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update product',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TEMPORARY: Bypass authentication for development
    const session = await getServerSession(authOptions);
    if (!session && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const productId = parseInt(id);

    const wcUrl = `${FLORA_API_BASE}/wc/v3/products/${productId}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
    
    const wcResponse = await fetch(wcUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!wcResponse.ok) {
      const errorText = await wcResponse.text();

      throw new Error(`WooCommerce API error: ${wcResponse.status} - ${errorText}`);
    }

    const wcResult = await wcResponse.json();
    
    // Try to get blueprint fields
    try {
      const blueprintUrl = `${FLORA_API_BASE}/flora-fields/v1/product-fields/${productId}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
      const blueprintResponse = await fetch(blueprintUrl);
      
      if (blueprintResponse.ok) {
        const blueprintResult = await blueprintResponse.json();
        wcResult.blueprint_fields = blueprintResult;
      }
    } catch (blueprintError) {

      // Don't fail if blueprint fields can't be loaded
    }

    return NextResponse.json({
      success: true,
      data: wcResult
    });

  } catch (error) {

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get product',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}