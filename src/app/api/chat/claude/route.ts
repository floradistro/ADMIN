import { NextRequest, NextResponse } from 'next/server';

const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const WC_CONSUMER_KEY = process.env.WC_CONSUMER_KEY || '';
const WC_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET || '';

async function callFloraAPI(endpoint: string) {
  try {
    // Handle endpoints that already have query params
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `https://api.floradistro.com/wp-json/flora-im/v1${endpoint}${separator}consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
}

async function callBluePrintsAPI(endpoint: string) {
  try {
    // Handle endpoints that already have query params
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `https://api.floradistro.com/wp-json/fd/v1${endpoint}${separator}consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
}

async function executeToolCall(toolName: string, input: any) {
  console.log(`Executing tool: ${toolName}`, input);
  
  switch (toolName) {
    case 'get_products':
      const searchParams = new URLSearchParams();
      if (input?.search) searchParams.append('search', input.search);
      const endpoint = searchParams.toString() ? `/products?${searchParams}` : '/products';
      const productsData = await callFloraAPI(endpoint);
      
      // Simplify response - just return ID, name, category for Claude
      if (productsData?.data) {
        return {
          success: true,
          count: productsData.data.length,
          products: productsData.data.slice(0, 20).map((p: any) => ({
            id: p.id,
            name: p.name,
            category: p.categories?.[0]?.name || 'Unknown',
            sku: p.sku || '',
            total_stock: p.total_stock || 0
          }))
        };
      }
      return productsData;
    
    case 'get_inventory':
      return await callFloraAPI('/inventory');
    
    case 'get_locations':
      const locations = await callFloraAPI('/locations');
      // Simplify location data
      if (Array.isArray(locations)) {
        return locations.map((l: any) => ({
          id: l.id,
          name: l.name,
          city: l.city,
          state: l.state
        }));
      }
      return locations;
    
    case 'get_blueprints':
      return await callBluePrintsAPI('/blueprints');
    
    case 'get_all_fields':
      const fields = await callBluePrintsAPI('/fields');
      // Simplify to just field names and IDs
      if (Array.isArray(fields)) {
        return fields.map((f: any) => ({
          id: f.id,
          field_name: f.field_name,
          field_label: f.field_label,
          field_type: f.field_type
        }));
      }
      return fields;
    
    case 'update_product_fields':
      if (input?.product_id && input?.fields) {
        try {
          // Use BluePrints product update endpoint - send all fields at once
          const updateUrl = `https://api.floradistro.com/wp-json/fd/v1/products/${input.product_id}?consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}`;
          
          const response = await fetch(updateUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              blueprint_fields: input.fields  // Send all fields at once - backend will group by blueprint
            })
          });

          const result = await response.json();
          
          if (response.ok && result.success) {
            return { 
              success: true,
              message: `Successfully updated ${Object.keys(input.fields).length} blueprint fields`,
              product_id: input.product_id,
              fields: Object.keys(input.fields),
              data: result.data
            };
          } else {
            return { 
              success: false,
              error: result.message || 'Update failed',
              details: result
            };
          }
        } catch (error) {
          return { 
            success: false,
            error: error instanceof Error ? error.message : 'Update failed' 
          };
        }
      }
      return { error: 'Product ID and fields required' };
    
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { message, conversation } = await request.json();

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'thinking', text: 'Connecting to MCP...' })}\n\n`));

        const inventoryData = await callFloraAPI('/products');
        const locationsData = await callFloraAPI('/locations');
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'system', text: `System ready - ${inventoryData?.data?.length || 0} products available` })}\n\n`));

        const systemPrompt = `You are an autonomous AI analyst for Flora Distribution. You EXECUTE tasks immediately without asking for permission.

CRITICAL AUTONOMOUS BEHAVIOR:
- When user says "auto-fill X", you IMMEDIATELY search, find, generate data, and update
- If product not found, pick the FIRST available product and auto-fill it without asking
- NEVER ask "which product" or "should I" - just DO IT
- If user says "update Green Crack" and it doesn't exist, update something else that's similar
- Generate realistic cannabis strain data based on naming patterns
- Execute ALL updates without confirmation

TOOLS:
- get_products: Returns {products: [{id, name, category}]} 
- update_product_fields: Update blueprint fields for products
- get_all_fields: Get field definitions

CRITICAL BLUEPRINT ASSIGNMENT:
Products MUST have correct blueprint assigned BEFORE updating fields:
- Flower products (category 25) → blueprint 39
- Concentrate products (category 22) → blueprint 42  
- Vape products (category 19) → blueprint 41
- Edible products (category 21) → blueprint 43

FIELD SYSTEM ARCHITECTURE:
- The fd_field_values table stores ALL fields for a blueprint as a single JSON object
- Fields are grouped by blueprint_id and saved together
- When updating fields, all fields for the same blueprint are batched together
- The system automatically handles the grouping and JSON encoding

INSTANT WORKFLOW:
1. Search for product → get ID and category
2. Generate appropriate field data for that product type
3. Call update_product_fields with all fields at once
4. The backend will automatically:
   - Find the correct blueprint assignment
   - Group fields by blueprint
   - Save as JSON in the database
   - Update catalog metadata
5. Report what you did

NO ASKING. JUST EXECUTE. The backend handles blueprint validation automatically.`;

        const messages = [
          ...conversation.filter((m: any) => m.type === 'message' || !m.type).map((msg: any) => ({
            role: msg.isUser ? 'user' : 'assistant',
            content: msg.content
          })),
          { role: 'user', content: message }
        ];

        const tools = [
          {
            name: 'get_products',
            description: 'Search and retrieve products. Use search parameter to find by name.',
            input_schema: {
              type: 'object',
              properties: {
                search: { type: 'string', description: 'Product name to search for' }
              }
            }
          },
          {
            name: 'get_all_fields',
            description: 'Get all available blueprint field names',
            input_schema: { type: 'object', properties: {} }
          },
          {
            name: 'update_product_fields',
            description: 'Update blueprint fields for a product. Saves to WooCommerce meta_data.',
            input_schema: {
              type: 'object',
              properties: {
                product_id: { type: 'string', description: 'Numeric product ID' },
                fields: { 
                  type: 'object', 
                  description: 'Field values as object. Example: {"strain_type": "Indica", "thca_percentage": "22", "effect": "Relaxing"}' 
                }
              },
              required: ['product_id', 'fields']
            }
          },
          {
            name: 'get_inventory',
            description: 'Get inventory levels across locations',
            input_schema: { type: 'object', properties: {} }
          },
          {
            name: 'get_locations',
            description: 'Get all dispensary locations',
            input_schema: { type: 'object', properties: {} }
          },
          {
            name: 'get_blueprints',
            description: 'Get blueprint templates',
            input_schema: { type: 'object', properties: {} }
          }
        ];

        let iteration = 0;
        const MAX_ITERATIONS = 8;

        while (iteration < MAX_ITERATIONS) {
          iteration++;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'thinking', text: `Step ${iteration}/${MAX_ITERATIONS}...` })}\n\n`));

          const claudeResponse = await fetch(CLAUDE_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': CLAUDE_API_KEY,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: 'claude-3-5-sonnet-20241022',
              max_tokens: 2000,
              system: systemPrompt,
              messages,
              tools
            })
          });

          if (!claudeResponse.ok) {
            throw new Error(`Claude API error: ${claudeResponse.status}`);
          }

          const data = await claudeResponse.json();
          const toolUses = data.content?.filter((c: any) => c.type === 'tool_use') || [];
          
          // If no tools, return final response
          if (toolUses.length === 0) {
            const textContent = data.content?.find((c: any) => c.type === 'text')?.text || data.content?.[0]?.text || '';
            if (textContent) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'response', text: textContent })}\n\n`));
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
            return;
          }

          // Execute all tools in parallel
          const toolResults = await Promise.all(
            toolUses.map(async (toolUse: any) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: 'tool_call', 
                text: `🔧 ${toolUse.name}` 
              })}\n\n`));

              const result = await executeToolCall(toolUse.name, toolUse.input);
              const summary = result?.data ? `${result.data.length} items` : result?.success ? 'success' : 'completed';
              
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: 'tool_result', 
                text: `✓ ${summary}` 
              })}\n\n`));

              return {
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: JSON.stringify(result)
              };
            })
          );

          // Add assistant response with tool uses
          messages.push({
            role: 'assistant',
            content: data.content
          });

          // Add tool results
          messages.push({
            role: 'user',
            content: toolResults
          });

          // Break if getting stuck
          if (iteration >= MAX_ITERATIONS - 1) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'response', text: 'Reached maximum iterations. Task may be incomplete.' })}\n\n`));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
            return;
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();

      } catch (error) {
        console.error('Streaming error:', error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', text: 'Error occurred' })}\n\n`));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}