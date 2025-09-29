import { NextRequest, NextResponse } from 'next/server';

const WOO_API_URL = process.env.NEXT_PUBLIC_WOO_API_URL || 'https://portal.cannabisclubsa.co.za';
const CONSUMER_KEY = process.env.WOO_CONSUMER_KEY || 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = process.env.WOO_CONSUMER_SECRET || 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

const FLORA_API_BASE = process.env.NEXT_PUBLIC_FLORA_API_BASE || 'https://portal.cannabisclubsa.co.za/wp-json';

interface BatchProductFieldsRequest {
  productIds: number[];
}

interface ProductFieldData {
  productId: number;
  fields: Array<{
    field_name: string;
    field_label: string;
    field_type: string;
    field_value: any;
  }>;
}

/**
 * Batch endpoint to fetch blueprint field values for multiple products
 * This significantly reduces API calls when loading multiple products
 */
export async function POST(request: NextRequest) {
  try {
    const body: BatchProductFieldsRequest = await request.json();
    const { productIds } = body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid product IDs' },
        { status: 400 }
      );
    }

    // Limit batch size to prevent timeout
    const MAX_BATCH_SIZE = 50;
    if (productIds.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { error: `Batch size exceeds maximum of ${MAX_BATCH_SIZE}` },
        { status: 400 }
      );
    }


    // Fetch all products in parallel
    const productPromises = productIds.map(async (productId) => {
      try {
        // Get product meta data from WooCommerce
        const productUrl = `${WOO_API_URL}/wp-json/wc/v3/products/${productId}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
        const productResponse = await fetch(productUrl);

        if (!productResponse.ok) {
          return null;
        }

        const productData = await productResponse.json();

        // Extract blueprint field values from meta_data
        const fields: ProductFieldData['fields'] = [];
        
        if (productData.meta_data && Array.isArray(productData.meta_data)) {
          // Get product categories to determine which blueprint applies
          const categoryId = productData.categories?.[0]?.id;
          
          if (categoryId) {
            // Get blueprint assignment for this category
            const assignmentUrl = `${FLORA_API_BASE}/fd/v1/blueprint-assignments?category_id=${categoryId}&consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
            const assignmentResponse = await fetch(assignmentUrl);
            
            if (assignmentResponse.ok) {
              const assignments = await assignmentResponse.json();
              
              if (assignments && assignments.length > 0) {
                const blueprintId = assignments[0].blueprint_id;
                
                // Get blueprint field definitions
                const fieldsUrl = `${FLORA_API_BASE}/fd/v1/blueprints/${blueprintId}/fields?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
                const fieldsResponse = await fetch(fieldsUrl);
                
                if (fieldsResponse.ok) {
                  const blueprintFields = await fieldsResponse.json();
                  
                  // Map field definitions with product values
                  blueprintFields.forEach((fieldDef: any) => {
                    const metaField = productData.meta_data.find(
                      (meta: any) => meta.key === fieldDef.field_name
                    );
                    
                    fields.push({
                      field_name: fieldDef.field_name,
                      field_label: fieldDef.field_label,
                      field_type: fieldDef.field_type,
                      field_value: metaField?.value || fieldDef.default_value || ''
                    });
                  });
                }
              }
            }
          }
        }

        return {
          productId,
          fields
        };
      } catch (error) {
        return null;
      }
    });

    const results = await Promise.all(productPromises);
    
    // Filter out failed products
    const successfulProducts = results.filter((result): result is ProductFieldData => result !== null);


    return NextResponse.json({
      success: true,
      products: successfulProducts,
      failed: productIds.length - successfulProducts.length
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to batch load product fields' },
      { status: 500 }
    );
  }
}
