/**
 * Product API Service - V3 Native Clean
 * Uses ONLY V3 endpoints, no legacy code
 */

export interface ProductField {
  name: string;
  label: string;
  type: string;
  value: any;
  required: boolean;
  config?: any;
  group?: string;
}

export interface PriceTier {
  qty?: number;
  weight?: string;
  price: number;
  discount_percent?: number;
}

export interface ProductPricing {
  product_id: string;
  base_price: number;
  current_price: number;
  quantity_tiers: PriceTier[];
}

class ProductAPI {
  
  // Get product fields
  async getFields(productId: number): Promise<ProductField[]> {
    const res = await fetch(`/api/flora/products/${productId}/fields`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.fields || [];
  }
  
  // Update product fields
  async updateFields(productId: number, fields: Record<string, any>): Promise<boolean> {
    const res = await fetch(`/api/flora/products/${productId}/fields`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    return res.ok;
  }
  
  // Get product pricing
  async getPricing(productId: number): Promise<ProductPricing | null> {
    const res = await fetch(`/api/flora/products/${productId}/pricing`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  }
  
  // Update product pricing
  async updatePricing(productId: number, pricing: Partial<ProductPricing>): Promise<boolean> {
    const res = await fetch(`/api/flora/products/${productId}/pricing`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pricing)
    });
    return res.ok;
  }
}

export const productAPI = new ProductAPI();

