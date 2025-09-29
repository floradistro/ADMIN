import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.FLORA_API_BASE || 'https://api.floradistro.com';
const CONSUMER_KEY = process.env.FLORA_API_CONSUMER_KEY || 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = process.env.FLORA_API_CONSUMER_SECRET || 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

function addAuth(url: string) {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
}

export async function POST(request: NextRequest) {
  try {
    const { product_ids } = await request.json();
    if (!Array.isArray(product_ids) || product_ids.length === 0) {
      return NextResponse.json({ blueprints: [], fields: [] });
    }

    // 1) Fetch products from WooCommerce to get categories
    const idsParam = product_ids.join(',');
    const wcUrl = `${API_BASE}/wp-json/wc/v3/products?include=${idsParam}&per_page=100&_fields=id,categories`;
    const wcResp = await fetch(wcUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64')}`
      }
    });
    if (!wcResp.ok) {
      const text = await wcResp.text();
      return NextResponse.json({ blueprints: [], fields: [] });
    }
    const wcProducts = await wcResp.json();
    const categoryIds = new Set<number>();
    wcProducts.forEach((p: any) => (p.categories || []).forEach((c: any) => categoryIds.add(c.id)));

    // 2) Get blueprint assignments for these categories
    const assignments: Array<{ blueprint_id: number; blueprint_name?: string }> = [];
    for (const catId of categoryIds) {
      try {
        const url = addAuth(`${API_BASE}/wp-json/fd/v1/blueprint-assignments?entity_type=category&category_id=${catId}`);
        const resp = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
        if (resp.ok) {
          const data = await resp.json();
          data.forEach((a: any) => assignments.push({ blueprint_id: a.blueprint_id, blueprint_name: a.blueprint_name || a.blueprint_label }));
        }
      } catch (e) {
      }
    }

    const uniqueBlueprintsMap = new Map<number, { id: number; name: string }>();
    assignments.forEach(a => {
      uniqueBlueprintsMap.set(a.blueprint_id, { id: a.blueprint_id, name: a.blueprint_name || `Blueprint ${a.blueprint_id}` });
    });

    // 3) For each blueprint, fetch fields
    const fieldsMap = new Map<number, any>();
    for (const blueprintId of uniqueBlueprintsMap.keys()) {
      try {
        const url = addAuth(`${API_BASE}/wp-json/fd/v1/blueprints/${blueprintId}/fields?per_page=100`);
        const resp = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
        if (resp.ok) {
          const fields = await resp.json();
          fields.forEach((f: any) => {
            if (!fieldsMap.has(f.id)) {
              fieldsMap.set(f.id, {
                field_id: f.id,
                field_name: f.field_name,
                field_label: f.field_label || f.field_name,
                field_type: f.field_type,
                blueprint_id: blueprintId,
                blueprint_name: uniqueBlueprintsMap.get(blueprintId)?.name || ''
              });
            }
          });
        }
      } catch (e) {
      }
    }

    const blueprints = Array.from(uniqueBlueprintsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    const fields = Array.from(fieldsMap.values()).sort((a, b) => (a.field_label || '').localeCompare(b.field_label || ''));

    return NextResponse.json({ blueprints, fields }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ blueprints: [], fields: [], error: 'Internal error' }, { status: 500 });
  }
}


