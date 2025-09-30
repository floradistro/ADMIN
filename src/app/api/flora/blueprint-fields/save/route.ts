import { NextRequest, NextResponse } from 'next/server';

const FLORA_API_BASE = 'https://api.floradistro.com/wp-json';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

// Field name to ID mapping
const FIELD_IDS: Record<string, number> = {
  'effect': 4,
  'lineage': 5,
  'nose': 6,
  'terpene': 7,
  'strain_type': 8,
  'strength_mg': 9,
  'thca_percentage': 10
};

export async function POST(request: NextRequest) {
  try {
    const { product_id, fields } = await request.json();
    
    if (!product_id || !fields) {
      return NextResponse.json({ 
        success: false, 
        error: 'Product ID and fields required' 
      }, { status: 400 });
    }

    const results = [];
    const errors = [];

    // For each field, call the BluePrints save_field_value through the product update endpoint
    for (const [fieldName, fieldValue] of Object.entries(fields)) {
      const fieldId = FIELD_IDS[fieldName];
      
      if (!fieldId) {
        errors.push(`Unknown field: ${fieldName}`);
        continue;
      }

      try {
        // Use the BluePrints product update endpoint with proper structure
        const updateUrl = `${FLORA_API_BASE}/fd/v1/products/${product_id}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
        
        const response = await fetch(updateUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blueprint_fields: {
              [fieldName]: fieldValue
            }
          })
        });

        const result = await response.json();
        
        if (response.ok && result.success) {
          results.push({
            field: fieldName,
            value: fieldValue,
            saved: true
          });
        } else {
          errors.push(`${fieldName}: ${result.message || 'Failed to save'}`);
        }
      } catch (error) {
        errors.push(`${fieldName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Trigger resolver to update catalog meta
    try {
      await fetch(`${FLORA_API_BASE}/fd/v1/debug/resolve?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: 'product',
          entity_id: product_id
        })
      });
    } catch (e) {
      // Non-critical
    }

    return NextResponse.json({
      success: results.length > 0,
      message: `Updated ${results.length} fields`,
      product_id,
      results,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
