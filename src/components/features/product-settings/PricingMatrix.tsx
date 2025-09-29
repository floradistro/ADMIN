import React, { useState, useEffect } from 'react';
import { Button, Select, Card, Input } from '../../ui';
import { pricingAPI, PriceListEntry, PriceContext } from '../../../services/pricing-api';

interface PricingMatrixProps {
  productId?: number;
}

export function PricingMatrix({ productId }: PricingMatrixProps) {
  const [matrix, setMatrix] = useState<PriceListEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    customer_tier: '',
    channel: '',
    store_id: undefined as number | undefined,
  });

  // Price calculator state
  const [calculator, setCalculator] = useState({
    quantity: 1,
    customer_tier: '',
    channel: '',
    store_id: 0,
    customer_id: 0,
  });
  const [calculatedPrice, setCalculatedPrice] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);

  const loadMatrix = async () => {
    if (!productId) return;

    try {
      setLoading(true);
      const response = await pricingAPI.getPriceMatrix(productId, filters);
      setMatrix(response.matrix);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load price matrix');
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = async () => {
    if (!productId) return;

    try {
      setCalculating(true);
      const result = await pricingAPI.getProductPrice(productId, calculator);
      setCalculatedPrice(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate price');
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    loadMatrix();
  }, [productId, filters]);

  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const updateCalculator = (key: string, value: any) => {
    setCalculator(prev => ({ ...prev, [key]: value }));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatSavings = (basePrice: number, finalPrice: number) => {
    const savings = basePrice - finalPrice;
    if (savings <= 0) return null;
    
    const percentage = ((savings / basePrice) * 100).toFixed(1);
    return `${formatPrice(savings)} (${percentage}%)`;
  };

  if (!productId) {
    return (
      <div className="p-8 text-center">
        <div className="text-neutral-400">Select a product to view pricing matrix</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-100 mb-1">
            Price Matrix
          </h2>
          <p className="text-sm text-neutral-400">
            View denormalized price lists and calculate prices in real-time
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={loadMatrix}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh Matrix'}
        </Button>
      </div>

      {/* Price Calculator */}
      <Card>
        <div className="p-4">
          <h3 className="text-neutral-100 font-medium mb-4">Price Calculator</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Quantity</label>
              <Input
                type="number"
                value={calculator.quantity}
                onChange={(e) => updateCalculator('quantity', parseInt(e.target.value) || 1)}
                min="1"
                className="text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Customer Tier</label>
              <Select
                value={calculator.customer_tier}
                onChange={(e) => updateCalculator('customer_tier', e.target.value)}
                options={[
                  { value: '', label: 'None' },
                  { value: 'retail', label: 'Retail' },
                  { value: 'wholesale', label: 'Wholesale' },
                  { value: 'premium', label: 'Premium' },
                ]}
                className="text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Channel</label>
              <Select
                value={calculator.channel}
                onChange={(e) => updateCalculator('channel', e.target.value)}
                options={[
                  { value: '', label: 'None' },
                  { value: 'online', label: 'Online' },
                  { value: 'retail', label: 'Retail' },
                  { value: 'wholesale', label: 'Wholesale' },
                ]}
                className="text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Store ID</label>
              <Input
                type="number"
                value={calculator.store_id}
                onChange={(e) => updateCalculator('store_id', parseInt(e.target.value) || 0)}
                min="0"
                className="text-sm"
              />
            </div>
            
            <div className="flex items-end">
              <Button
                variant="primary"
                size="sm"
                onClick={calculatePrice}
                disabled={calculating}
                className="w-full"
              >
                {calculating ? 'Calculating...' : 'Calculate'}
              </Button>
            </div>
          </div>

          {/* Calculated Price Result */}
          {calculatedPrice && (
            <div className="bg-neutral-800/50 rounded-lg p-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-neutral-400">Base Price</div>
                  <div className="text-neutral-100 font-medium">
                    {formatPrice(calculatedPrice.base_price)}
                  </div>
                </div>
                <div>
                  <div className="text-neutral-400">Final Price</div>
                  <div className="text-green-400 font-medium text-lg">
                    {formatPrice(calculatedPrice.final_price)}
                  </div>
                </div>
                <div>
                  <div className="text-neutral-400">Line Total</div>
                  <div className="text-neutral-100 font-medium">
                    {formatPrice(calculatedPrice.final_price * calculator.quantity)}
                  </div>
                </div>
                <div>
                  <div className="text-neutral-400">Savings</div>
                  <div className="text-green-400">
                    {formatSavings(calculatedPrice.base_price, calculatedPrice.final_price) || 'None'}
                  </div>
                </div>
              </div>
              
              {calculatedPrice.applied_rules?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-neutral-700">
                  <div className="text-neutral-400 text-xs mb-2">Applied Rules:</div>
                  <div className="space-y-1">
                    {calculatedPrice.applied_rules.map((rule: any, index: number) => (
                      <div key={index} className="text-xs text-neutral-300">
                        • {rule.rule_name} ({rule.rule_type})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Filters */}
      <Card>
        <div className="p-4">
          <h3 className="text-neutral-100 font-medium mb-4">Matrix Filters</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Customer Tier</label>
              <Select
                value={filters.customer_tier}
                onChange={(e) => updateFilter('customer_tier', e.target.value)}
                options={[
                  { value: '', label: 'All Tiers' },
                  { value: 'retail', label: 'Retail' },
                  { value: 'wholesale', label: 'Wholesale' },
                  { value: 'premium', label: 'Premium' },
                ]}
              />
            </div>
            
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Channel</label>
              <Select
                value={filters.channel}
                onChange={(e) => updateFilter('channel', e.target.value)}
                options={[
                  { value: '', label: 'All Channels' },
                  { value: 'online', label: 'Online' },
                  { value: 'retail', label: 'Retail' },
                  { value: 'wholesale', label: 'Wholesale' },
                ]}
              />
            </div>
            
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Store ID</label>
              <Input
                type="number"
                value={filters.store_id || ''}
                onChange={(e) => updateFilter('store_id', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="All Stores"
                min="0"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-500/20 bg-red-500/5">
          <div className="p-4">
            <div className="text-red-400 text-sm">{error}</div>
          </div>
        </Card>
      )}

      {/* Price Matrix Table */}
      <Card>
        <div className="p-4">
          <h3 className="text-neutral-100 font-medium mb-4">
            Price Matrix ({matrix.length} entries)
          </h3>
          
          {loading ? (
            <div className="text-center py-8 text-neutral-400">
              Loading price matrix...
            </div>
          ) : matrix.length === 0 ? (
            <div className="text-center py-8 text-neutral-400">
              No price matrix entries found. Create pricing rules to generate price lists.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-800">
                    <th className="text-left py-2 px-3 text-neutral-400">Qty</th>
                    <th className="text-left py-2 px-3 text-neutral-400">Tier</th>
                    <th className="text-left py-2 px-3 text-neutral-400">Channel</th>
                    <th className="text-left py-2 px-3 text-neutral-400">Store</th>
                    <th className="text-right py-2 px-3 text-neutral-400">Base Price</th>
                    <th className="text-right py-2 px-3 text-neutral-400">Final Price</th>
                    <th className="text-right py-2 px-3 text-neutral-400">Savings</th>
                    <th className="text-left py-2 px-3 text-neutral-400">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {matrix.map((entry, index) => (
                    <tr key={index} className="border-b border-neutral-800/50 hover:bg-neutral-900/30">
                      <td className="py-2 px-3 text-neutral-300">{entry.quantity}</td>
                      <td className="py-2 px-3 text-neutral-300">{entry.customer_tier || '-'}</td>
                      <td className="py-2 px-3 text-neutral-300">{entry.channel || '-'}</td>
                      <td className="py-2 px-3 text-neutral-300">{entry.store_id || '-'}</td>
                      <td className="py-2 px-3 text-right text-neutral-400">
                        {formatPrice(entry.base_price)}
                      </td>
                      <td className="py-2 px-3 text-right text-green-400 font-medium">
                        {formatPrice(entry.price)}
                      </td>
                      <td className="py-2 px-3 text-right text-green-400">
                        {formatSavings(entry.base_price, entry.price) || '-'}
                      </td>
                      <td className="py-2 px-3 text-neutral-500 text-xs">
                        {new Date(entry.updated_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}