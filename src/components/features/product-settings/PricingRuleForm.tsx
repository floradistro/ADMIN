import React, { useState } from 'react';
import { Button, Input, Select, TextArea } from '../../ui';
import { PricingRule } from '../../../services/pricing-api';

interface PricingRuleFormProps {
  rule?: PricingRule;
  productId?: number;
  onSubmit: (rule: Omit<PricingRule, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
}

const RULE_TYPES = [
  { value: 'quantity_break', label: 'Quantity Break' },
  { value: 'customer_tier', label: 'Customer Tier' },
  { value: 'channel', label: 'Sales Channel' },
  { value: 'store', label: 'Store Location' },
  { value: 'time_window', label: 'Time Window' },
];

const CUSTOMER_TIERS = ['wholesale', 'retail', 'premium'];
const CHANNELS = ['online', 'retail', 'wholesale'];

export function PricingRuleForm({ rule, productId, onSubmit, onCancel }: PricingRuleFormProps) {
  const [formData, setFormData] = useState({
    product_id: rule?.product_id || productId || 0,
    rule_name: rule?.rule_name || '',
    rule_type: rule?.rule_type || 'quantity_break',
    priority: rule?.priority || 10,
    formula: rule?.formula || '',
    start_date: rule?.start_date || '',
    end_date: rule?.end_date || '',
    is_active: rule?.is_active ?? true,
    conditions: rule?.conditions || {},
  });

  const [conditionsJson, setConditionsJson] = useState(
    JSON.stringify(formData.conditions, null, 2)
  );

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleConditionsChange = (value: string) => {
    setConditionsJson(value);
    try {
      const parsed = JSON.parse(value);
      updateField('conditions', parsed);
    } catch (err) {
      // Invalid JSON, don't update conditions
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate conditions JSON
      JSON.parse(conditionsJson);
      onSubmit({
        ...formData,
        conditions: JSON.parse(conditionsJson),
      } as Omit<PricingRule, 'id' | 'created_at' | 'updated_at'>);
    } catch (err) {
      alert('Invalid JSON in conditions field');
    }
  };

  const generateConditionsTemplate = () => {
    const templates = {
      quantity_break: { min_quantity: 10 },
      customer_tier: { tier: 'wholesale' },
      channel: { channel: 'online' },
      store: { store_id: 1 },
      time_window: { 
        start_time: '09:00', 
        end_time: '17:00', 
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] 
      },
    };

    const template = templates[formData.rule_type as keyof typeof templates] || {};
    setConditionsJson(JSON.stringify(template, null, 2));
    updateField('conditions', template);
  };

  const generateFormulaTemplate = () => {
    const templates = {
      quantity_break: '{base_price} * 0.9', // 10% discount
      customer_tier: '{base_price} * 0.85', // 15% discount
      channel: '{base_price} * 0.95', // 5% discount
      store: '{base_price} * 0.92', // 8% discount
      time_window: '{base_price} * 0.88', // 12% discount
    };

    const template = templates[formData.rule_type as keyof typeof templates] || '{base_price}';
    updateField('formula', template);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rule Name */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-300 mb-1">
            Rule Name
          </label>
          <Input
            value={formData.rule_name}
            onChange={(e) => updateField('rule_name', e.target.value)}
            placeholder="e.g., Wholesale Quantity Discount"
            required
          />
        </div>

        {/* Product ID */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1">
            Product ID (0 for global)
          </label>
          <Input
            type="number"
            value={formData.product_id}
            onChange={(e) => updateField('product_id', parseInt(e.target.value) || 0)}
            min="0"
          />
        </div>

        {/* Rule Type */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1">
            Rule Type
          </label>
          <Select
            value={formData.rule_type}
            onChange={(e) => updateField('rule_type', e.target.value)}
            options={RULE_TYPES}
          />
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1">
            Priority (lower = higher priority)
          </label>
          <Input
            type="number"
            value={formData.priority}
            onChange={(e) => updateField('priority', parseInt(e.target.value) || 10)}
            min="1"
            max="100"
          />
        </div>

        {/* Active Status */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => updateField('is_active', e.target.checked)}
            className="rounded border-neutral-600 bg-neutral-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-neutral-900"
          />
          <label htmlFor="is_active" className="text-sm text-neutral-300">
            Active
          </label>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1">
            Start Date (optional)
          </label>
          <Input
            type="datetime-local"
            value={formData.start_date}
            onChange={(e) => updateField('start_date', e.target.value)}
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1">
            End Date (optional)
          </label>
          <Input
            type="datetime-local"
            value={formData.end_date}
            onChange={(e) => updateField('end_date', e.target.value)}
          />
        </div>
      </div>

      {/* Formula */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-neutral-300">
            Pricing Formula
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={generateFormulaTemplate}
          >
            Generate Template
          </Button>
        </div>
        <Input
          value={formData.formula}
          onChange={(e) => updateField('formula', e.target.value)}
          placeholder="e.g., {base_price} * 0.9 for 10% discount"
          required
        />
        <div className="text-xs text-neutral-500 mt-1">
          Available variables: {'{base_price}'}, {'{quantity}'}, {'{min_quantity}'}, {'{tier}'}, etc.
        </div>
      </div>

      {/* Conditions */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-neutral-300">
            Conditions (JSON)
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={generateConditionsTemplate}
          >
            Generate Template
          </Button>
        </div>
        <TextArea
          value={conditionsJson}
          onChange={(e) => handleConditionsChange(e.target.value)}
          rows={6}
          placeholder='{"min_quantity": 10}'
          className="font-mono text-xs"
        />
        <div className="text-xs text-neutral-500 mt-1">
          Define rule conditions as JSON. Templates available for each rule type.
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-800">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
        >
          {rule ? 'Update Rule' : 'Create Rule'}
        </Button>
      </div>
    </form>
  );
}