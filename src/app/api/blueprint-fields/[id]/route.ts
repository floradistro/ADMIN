import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const FLORA_API_BASE = 'https://api.floradistro.com/wp-json';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

interface BlueprintField {
  field_name: string;
  field_label: string;
  field_type: string;
  field_value?: any;
  blueprint_id?: number;
  blueprint_name?: string;
}

interface CategoryBlueprintMapping {
  category_id: number;
  blueprint_id: number;
  blueprint_name: string;
}

// Cache for blueprint assignments (refresh every 5 minutes)
let assignmentCache: { data: CategoryBlueprintMapping[], timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getBlueprintAssignments(): Promise<CategoryBlueprintMapping[]> {
  // Check cache
  if (assignmentCache && Date.now() - assignmentCache.timestamp < CACHE_DURATION) {
    return assignmentCache.data;
  }

  try {
    const url = `${FLORA_API_BASE}/fd/v1/blueprint-assignments?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return assignmentCache?.data || [];
    }

    const assignments = await response.json();
    
    // Map assignments to a simple structure
    const mappings: CategoryBlueprintMapping[] = assignments
      .filter((a: any) => a.entity_type === 'category' && a.is_active)
      .map((a: any) => ({
        category_id: a.category_id,
        blueprint_id: a.blueprint_id,
        blueprint_name: a.blueprint_name
      }));

    // Update cache
    assignmentCache = { data: mappings, timestamp: Date.now() };
    
    return mappings;
  } catch (error) {
    return assignmentCache?.data || [];
  }
}

async function getBlueprintFields(blueprintId: number): Promise<BlueprintField[]> {
  try {
    const url = `${FLORA_API_BASE}/fd/v1/blueprints/${blueprintId}/fields?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return [];
    }

    const fields = await response.json();
    
    return fields.map((f: any) => ({
      field_name: f.field_name,
      field_label: f.field_label,
      field_type: f.field_type,
      blueprint_id: blueprintId
    }));
  } catch (error) {
    return [];
  }
}

// GET /api/blueprint-fields/[id] - Get blueprint fields for a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log(`[Blueprint Fields] Starting GET request for product ID: ${(await params).id}`);
    
    // TEMPORARY: Bypass authentication for development
    const session = await getServerSession(authOptions);
    if (!session && process.env.NODE_ENV !== 'development') {
      console.log(`[Blueprint Fields] No session found - unauthorized`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log(`[Blueprint Fields] Session found for user: ${session?.user?.email || 'unknown'}`);

    const { id } = await params;
    const productId = parseInt(id);
    
    console.log(`[Blueprint Fields] Processing request for product ${productId}`);
    
    
    // Step 1: Get the product from WooCommerce to get its categories and meta_data
    const wcUrl = `${FLORA_API_BASE}/wc/v3/products/${productId}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
    console.log(`[Blueprint Fields] Fetching product from: ${wcUrl}`);
    
    const wcResponse = await fetch(wcUrl);
    console.log(`[Blueprint Fields] WooCommerce response status: ${wcResponse.status}`);
    
    if (!wcResponse.ok) {
      const errorText = await wcResponse.text();
      console.error(`[Blueprint Fields] WooCommerce API error: ${errorText}`);
      return NextResponse.json({ 
        success: false, 
        error: 'Product not found' 
      }, { status: 404 });
    }

    const product = await wcResponse.json();
    console.log(`[Blueprint Fields] Product loaded: ${product.name}, categories: ${product.categories?.map((c: any) => c.id).join(', ')}`);
    
    // Step 2: Get blueprint assignments to find which blueprint applies to this product's category
    const assignments = await getBlueprintAssignments();
    
    // Find the blueprint for this product's primary category
    const productCategoryIds = product.categories?.map((c: any) => c.id) || [];
    const assignment = assignments.find(a => productCategoryIds.includes(a.category_id));
    
    if (!assignment) {
      return NextResponse.json({
        success: true,
        fields: [],
        message: 'No blueprint assigned to product categories'
      });
    }

    
    // Step 3: Get the blueprint field definitions
    const blueprintFields = await getBlueprintFields(assignment.blueprint_id);
    
    // Step 4: Extract field values from WooCommerce meta_data
    const metaData = product.meta_data || [];
    const metaMap = new Map<string, any>();
    
    metaData.forEach((meta: any) => {
      metaMap.set(meta.key, meta.value);
    });
    
    // Step 5: Combine blueprint definitions with actual values
    const fieldsWithValues: BlueprintField[] = blueprintFields.map(field => ({
      ...field,
      field_value: metaMap.get(field.field_name) || '',
      blueprint_name: assignment.blueprint_name
    }));
    
    
    return NextResponse.json({
      success: true,
      fields: fieldsWithValues,
      blueprint: {
        id: assignment.blueprint_id,
        name: assignment.blueprint_name
      },
      product_id: productId,
      category_ids: productCategoryIds
    });

  } catch (error) {
    console.error(`[Blueprint Fields] Error processing GET request:`, error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// PATCH /api/blueprint-fields/[id] - Update blueprint field values for a product
export async function PATCH(
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
    const { fields } = await request.json();
    
    
    if (!fields || typeof fields !== 'object') {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid fields data' 
      }, { status: 400 });
    }

    // Update via WooCommerce meta_data
    const wcUrl = `${FLORA_API_BASE}/wc/v3/products/${productId}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
    
    // First, get existing product to preserve other meta_data
    const getResponse = await fetch(wcUrl);
    if (!getResponse.ok) {
      return NextResponse.json({ 
        success: false, 
        error: 'Product not found' 
      }, { status: 404 });
    }
    
    const product = await getResponse.json();
    const existingMeta = product.meta_data || [];
    
    // Create a map of existing meta
    const metaMap = new Map<string, any>();
    existingMeta.forEach((meta: any) => {
      metaMap.set(meta.key, meta.value);
    });
    
    // Update with new field values
    Object.entries(fields).forEach(([key, value]) => {
      metaMap.set(key, value);
    });
    
    // Convert back to meta_data array
    const updatedMeta = Array.from(metaMap.entries()).map(([key, value]) => ({
      key,
      value
    }));
    
    // Update the product
    const updateResponse = await fetch(wcUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        meta_data: updatedMeta
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update product' 
      }, { status: 500 });
    }

    const updatedProduct = await updateResponse.json();
    
    
    return NextResponse.json({
      success: true,
      message: 'Blueprint fields updated successfully',
      product_id: productId,
      updated_fields: Object.keys(fields)
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

