// Flora Fields Pricing API Client
// Integrates with BluePrints Plugin Stage 4 - Pricing Engine via Portal2 API

const API_BASE = '/api/pricing';

// Pricing Types
export interface PricingRule {
  id?: number;
  product_id: number;
  rule_name: string;
  rule_type: 'quantity_break' | 'customer_tier' | 'channel' | 'store' | 'time_window';
  priority: number;
  conditions: Record<string, any>;
  formula: string;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PriceContext {
  quantity: number;
  customer_tier?: string;
  channel?: string;
  store_id?: number;
  customer_id?: number;
  date?: string;
}

export interface PriceEvaluation {
  product_id: number;
  base_price: number;
  final_price: number;
  context: PriceContext;
  applied_rules: Array<{
    rule_id: number;
    rule_name: string;
    rule_type: string;
    original_price: number;
    new_price: number;
  }>;
}

export interface PriceListEntry {
  product_id: number;
  quantity: number;
  customer_tier: string;
  channel: string;
  store_id: number;
  price: number;
  base_price: number;
  rules_applied: string;
  created_at: string;
  updated_at: string;
}

export interface PriceQuote {
  products: Array<{
    product_id: number;
    quantity: number;
    unit_price: number;
    base_unit_price: number;
    line_total: number;
    base_line_total: number;
    savings: number;
    applied_rules: any[];
  }>;
  totals: {
    subtotal: number;
    total_base_price: number;
    total_savings: number;
    item_count: number;
  };
  context: PriceContext;
  generated_at: string;
}

class PricingAPI {
  private buildUrl(endpoint: string): string {
    return `${API_BASE}${endpoint}`;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = this.buildUrl(endpoint);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      cache: 'no-store',
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  // Get product price with context
  async getProductPrice(productId: number, context: Partial<PriceContext> = {}): Promise<PriceEvaluation> {
    const params = new URLSearchParams();
    if (context.quantity) params.append('quantity', context.quantity.toString());
    if (context.customer_tier) params.append('customer_tier', context.customer_tier);
    if (context.channel) params.append('channel', context.channel);
    if (context.store_id) params.append('store_id', context.store_id.toString());
    if (context.customer_id) params.append('customer_id', context.customer_id.toString());

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.makeRequest<PriceEvaluation>(`/price/product/${productId}${queryString}`);
  }

  // Get price quote for multiple products
  async getPriceQuote(
    products: number[], 
    quantities?: number[], 
    context: Partial<PriceContext> = {}
  ): Promise<PriceQuote> {
    const params = new URLSearchParams();
    params.append('products', JSON.stringify(products));
    if (quantities) params.append('quantities', JSON.stringify(quantities));
    if (context.customer_tier) params.append('customer_tier', context.customer_tier);
    if (context.channel) params.append('channel', context.channel);
    if (context.store_id) params.append('store_id', context.store_id.toString());
    if (context.customer_id) params.append('customer_id', context.customer_id.toString());

    return this.makeRequest<PriceQuote>(`/price/quote?${params.toString()}`);
  }

  // Get price matrix for product
  async getPriceMatrix(
    productId: number, 
    filters: { customer_tier?: string; channel?: string; store_id?: number } = {}
  ): Promise<{ product_id: number; filters: any; matrix: PriceListEntry[]; count: number }> {
    const params = new URLSearchParams();
    if (filters.customer_tier) params.append('customer_tier', filters.customer_tier);
    if (filters.channel) params.append('channel', filters.channel);
    if (filters.store_id) params.append('store_id', filters.store_id.toString());

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.makeRequest(`/price/product/${productId}/matrix${queryString}`);
  }

  // Create pricing rule
  async createPricingRule(rule: Omit<PricingRule, 'id' | 'created_at' | 'updated_at'>): Promise<{ id: number; message: string }> {
    return this.makeRequest('/rules', {
      method: 'POST',
      body: JSON.stringify(rule),
    });
  }

  // Get pricing rules
  async getPricingRules(productId?: number, activeOnly = true): Promise<{ rules: PricingRule[]; count: number }> {
    const params = new URLSearchParams();
    if (productId !== undefined) params.append('product_id', productId.toString());
    params.append('active_only', activeOnly.toString());

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.makeRequest(`/rules${queryString}`);
  }

  // Update pricing rule
  async updatePricingRule(ruleId: number, updates: Partial<PricingRule>): Promise<{ message: string }> {
    return this.makeRequest(`/rules/${ruleId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Delete pricing rule
  async deletePricingRule(ruleId: number): Promise<{ message: string }> {
    return this.makeRequest(`/rules/${ruleId}`, {
      method: 'DELETE',
    });
  }

  // Deactivate pricing rule (remove from blueprint but keep in system)
  async deactivatePricingRule(ruleId: number): Promise<{ message: string }> {
    return this.updatePricingRule(ruleId, { is_active: false });
  }

  // Regenerate price lists
  async regeneratePriceLists(productIds?: number[]): Promise<{ message: string; products_updated: number }> {
    return this.makeRequest('/regenerate', {
      method: 'POST',
      body: JSON.stringify({ product_ids: productIds }),
    });
  }
}

export const pricingAPI = new PricingAPI();