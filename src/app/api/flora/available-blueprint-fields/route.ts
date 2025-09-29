import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.FLORA_API_BASE || 'https://api.floradistro.com';
const CONSUMER_KEY = process.env.FLORA_API_CONSUMER_KEY || 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = process.env.FLORA_API_CONSUMER_SECRET || 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

function addAuthToUrl(url: string) {
  return `${url}&consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
}

export async function GET(request: NextRequest) {
  try {
    
    // Step 1: Get all blueprints using the working local endpoint
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    
    const blueprintsResponse = await fetch(`${baseUrl}/api/flora/blueprints?per_page=100`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!blueprintsResponse.ok) {
      const errorText = await blueprintsResponse.text();
      return NextResponse.json(
        { error: 'Failed to get blueprints', details: errorText },
        { status: blueprintsResponse.status }
      );
    }
    
    const blueprints = await blueprintsResponse.json();
    
    // Step 2: Get all fields from all blueprints
    const allFields: any[] = [];
    const fieldMap = new Map(); // To avoid duplicates
    
    for (const blueprint of blueprints) {
      try {
        const fieldsResponse = await fetch(`${baseUrl}/api/flora/blueprint-fields?blueprint_id=${blueprint.id}&per_page=100`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (fieldsResponse.ok) {
          const fields = await fieldsResponse.json();
          
          for (const field of fields) {
            // Use field_name as the key to avoid duplicates across blueprints
            const fieldKey = field.field_name;
            
            if (!fieldMap.has(fieldKey)) {
              fieldMap.set(fieldKey, {
                field_id: field.id,
                field_name: field.field_name,
                field_label: field.field_label || field.field_name,
                field_type: field.field_type,
                field_description: field.field_description,
                blueprint_id: blueprint.id,
                blueprint_name: blueprint.name,
                validation_rules: field.validation_rules,
                display_options: field.display_options,
                is_required: field.is_required,
                is_searchable: field.is_searchable,
                sort_order: field.sort_order || 0
              });
            }
          }
        } else {
        }
      } catch (error) {
      }
    }
    
    // Convert map to array and sort by field label
    const uniqueFields = Array.from(fieldMap.values()).sort((a, b) => 
      a.field_label.localeCompare(b.field_label)
    );
    
    
    return NextResponse.json({
      success: true,
      data: uniqueFields,
      meta: {
        total_blueprints: blueprints.length,
        total_fields: uniqueFields.length
      }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
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
