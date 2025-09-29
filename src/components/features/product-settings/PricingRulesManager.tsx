import React, { useEffect, useState } from 'react';
import { Button, IconButton, Card, JsonPopout, JsonIcon, TabHero } from '../../ui';
import { DeleteConfirmDialog } from '../../ui/DeleteConfirmDialog';
import { pricingAPI, PricingRule } from '../../../services/pricing-api';

interface PricingRulesManagerProps {
  onRuleSelect?: (rule: PricingRule) => void;
  selectedRuleIds?: number[];
  selectionMode?: boolean;
}

interface CreatePricingRuleData {
  product_id: number;
  rule_name: string;
  rule_type: 'quantity_break' | 'customer_tier' | 'channel' | 'store' | 'time_window';
  priority: number;
  conditions: Record<string, any>;
  formula: string;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
}

const RULE_TYPE_OPTIONS = [
  { value: 'quantity_break', label: 'Quantity Break' },
  { value: 'customer_tier', label: 'Customer Tier' },
  { value: 'channel', label: 'Sales Channel' },
  { value: 'store', label: 'Store Location' },
  { value: 'time_window', label: 'Time Window' }
];

const DEFAULT_CONDITIONS = {
  quantity_break: { min_quantity: 10, discount_percent: 10 },
  customer_tier: { tier: 'wholesale', discount_percent: 15 },
  channel: { channel: 'online', markup_percent: 0 },
  store: { store_id: 1, discount_percent: 5 },
  time_window: { start_time: '09:00', end_time: '17:00', discount_percent: 10 }
};

const DEFAULT_FORMULAS = {
  quantity_break: 'base_price * (1 - discount_percent / 100)',
  customer_tier: 'base_price * (1 - discount_percent / 100)',
  channel: 'base_price * (1 + markup_percent / 100)',
  store: 'base_price * (1 - discount_percent / 100)',
  time_window: 'base_price * (1 - discount_percent / 100)'
};

// Helper function to create consistent hash codes for group names
declare global {
  interface String {
    hashCode(): number;
  }
}

String.prototype.hashCode = function() {
  let hash = 0;
  if (this.length === 0) return hash;
  for (let i = 0; i < this.length; i++) {
    const char = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

export function PricingRulesManager({ 
  onRuleSelect, 
  selectedRuleIds = [], 
  selectionMode = false 
}: PricingRulesManagerProps) {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Expandable cards state (matching BlueprintDesigner)
  const [expandedRules, setExpandedRules] = useState<Set<number>>(new Set());
  
  // Tab state for each rule
  const [ruleActiveTabs, setRuleActiveTabs] = useState<Record<number, string>>({});
  
  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    rule: PricingRule | null;
  }>({ show: false, rule: null });

  // Form state
  const [formData, setFormData] = useState<CreatePricingRuleData>({
    product_id: 0,
    rule_name: '',
    rule_type: 'quantity_break',
    priority: 10,
    conditions: DEFAULT_CONDITIONS.quantity_break,
    formula: DEFAULT_FORMULAS.quantity_break,
    is_active: true
  });

  // Separate state for JSON editing
  const [conditionsText, setConditionsText] = useState<string>('');

  // JSON editor state
  const [showJsonEditor, setShowJsonEditor] = useState<Record<string, boolean>>({});
  const [jsonEditorData, setJsonEditorData] = useState<Record<string, any>>({});
  const [jsonSuccessMessage, setJsonSuccessMessage] = useState<string>('');

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await pricingAPI.getPricingRules();
      setRules(response.rules || []);
    } catch (err) {
      setError('Failed to load pricing rules');
    } finally {
      setLoading(false);
    }
  };

  // Toggle rule expansion
  const toggleRuleExpansion = (ruleId: number) => {
    setExpandedRules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ruleId)) {
        newSet.delete(ruleId);
      } else {
        newSet.add(ruleId);
      }
      return newSet;
    });
  };

  // Get active tab for a rule (default to 'preview')
  const getRuleActiveTab = (ruleId: number): string => {
    return ruleActiveTabs[ruleId] || 'preview';
  };

  // Set active tab for a rule
  const setRuleActiveTab = (ruleId: number, tab: string) => {
    setRuleActiveTabs(prev => ({ ...prev, [ruleId]: tab }));
  };

  // Parse pricing tiers from rule conditions or formula
  const parsePricingTiers = (rule: PricingRule) => {
    try {
      const conditions = typeof rule.conditions === 'string' 
        ? JSON.parse(rule.conditions) 
        : rule.conditions;
      
      // First check if tiers are in conditions
      if (conditions.tiers && Array.isArray(conditions.tiers)) {
        return conditions.tiers.map((tier: any, index: number) => ({
          id: index,
          name: tier.name || `Tier ${index + 1}`,
          minQuantity: tier.min_quantity || 0,
          maxQuantity: tier.max_quantity || null,
          price: tier.price || '0.00',
          unit: conditions.unit_type || 'units'
        }));
      }
      
      // Check if formula contains quantity-price mapping (like our pre-roll pricing)
      if (rule.formula && rule.rule_type === 'quantity_break') {
        try {
          const formula = typeof rule.formula === 'string' ? JSON.parse(rule.formula) : rule.formula;
          if (typeof formula === 'object' && !Array.isArray(formula)) {
            return Object.entries(formula).map(([quantity, price], index) => ({
              id: index,
              name: `${quantity} ${quantity === '1' ? 'unit' : 'units'}`,
              minQuantity: parseInt(quantity),
              maxQuantity: parseInt(quantity),
              price: (price as number | string).toString(),
              unit: 'units'
            }));
          }
        } catch (formulaErr) {
        }
      }
      
      // Fallback for other rule types
      if (rule.rule_type === 'quantity_break' && conditions.min_quantity) {
        return [{
          id: 0,
          name: 'Quantity Break',
          minQuantity: conditions.min_quantity,
          maxQuantity: conditions.max_quantity || null,
          price: conditions.price || '0.00',
          unit: conditions.unit_type || 'units'
        }];
      }
      
      return [];
    } catch (err) {
      return [];
    }
  };

  // Tier editing state
  const [editingTiers, setEditingTiers] = useState<Record<number, any[]>>({});
  const [showTierEditor, setShowTierEditor] = useState<Record<number, boolean>>({});

  // Update tiers for a rule
  const updateRuleTiers = async (ruleId: number, tiers: any[]) => {
    try {
      const rule = rules.find(r => r.id === ruleId);
      if (!rule) return;

      const conditions = typeof rule.conditions === 'string' 
        ? JSON.parse(rule.conditions) 
        : rule.conditions;

      const updatedConditions = {
        ...conditions,
        tiers: tiers.map(tier => ({
          name: tier.name,
          min_quantity: parseFloat(tier.minQuantity) || 0,
          max_quantity: tier.maxQuantity ? parseFloat(tier.maxQuantity) : null,
          price: tier.price
        }))
      };

      // Create updated rule object, explicitly excluding date fields first
      const { start_date, end_date, ...ruleWithoutDates } = rule;
      
      const updatedRule = {
        ...ruleWithoutDates,
        conditions: updatedConditions
      };

      // Only include date fields if they have valid string values
      if (start_date && typeof start_date === 'string' && start_date.trim() !== '') {
        (updatedRule as any).start_date = start_date;
      }
      if (end_date && typeof end_date === 'string' && end_date.trim() !== '') {
        (updatedRule as any).end_date = end_date;
      }

      await pricingAPI.updatePricingRule(ruleId, updatedRule);
      await fetchRules();
      
      // Close editor
      setShowTierEditor(prev => ({ ...prev, [ruleId]: false }));
    } catch (err) {
      setError('Failed to update pricing tiers');
    }
  };

  // Add new tier
  const addTier = (ruleId: number) => {
    const currentTiers = editingTiers[ruleId] || parsePricingTiers(rules.find(r => r.id === ruleId)!);
    const newTier = {
      id: Date.now(),
      name: `Tier ${currentTiers.length + 1}`,
      minQuantity: 0,
      maxQuantity: null,
      price: '0.00',
      unit: 'units'
    };
    
    setEditingTiers(prev => ({
      ...prev,
      [ruleId]: [...currentTiers, newTier]
    }));
  };

  // Remove tier
  const removeTier = (ruleId: number, tierId: number) => {
    const currentTiers = editingTiers[ruleId] || [];
    setEditingTiers(prev => ({
      ...prev,
      [ruleId]: currentTiers.filter(tier => tier.id !== tierId)
    }));
  };

  // Update tier
  const updateTier = (ruleId: number, tierId: number, field: string, value: any) => {
    const currentTiers = editingTiers[ruleId] || [];
    setEditingTiers(prev => ({
      ...prev,
      [ruleId]: currentTiers.map(tier => 
        tier.id === tierId ? { ...tier, [field]: value } : tier
      )
    }));
  };

  // JSON Editor functions (matching BlueprintDesigner pattern)
  const openJsonEditor = (key: string, data: any) => {
    setJsonEditorData(prev => ({ ...prev, [key]: data }));
    setShowJsonEditor(prev => ({ ...prev, [key]: true }));
  };

  const handleJsonSave = async (key: string, data: any) => {
    try {
      setError(null);
      setIsSubmitting(true);
      
      
      if (key.startsWith('rule-')) {
        const ruleId = parseInt(key.split('-')[1]);
        // Update existing rule
        await pricingAPI.updatePricingRule(ruleId, data);
        await fetchRules();
        setJsonSuccessMessage('Pricing rule updated successfully!');
      } else if (key === 'bulk-import' || key === 'global-import') {
        // Handle both single rule and bulk import
        let rulesToImport = [];
        
        if (Array.isArray(data)) {
          // Multiple rules
          rulesToImport = data;
        } else if (data && typeof data === 'object') {
          // Single rule object
          rulesToImport = [data];
        } else {
          throw new Error('Invalid data format. Expected array of rules or single rule object.');
        }
        
        if (rulesToImport.length === 0) {
          throw new Error('No rules to import.');
        }
        
        
        // Import each rule
        let successCount = 0;
        for (const rule of rulesToImport) {
          try {
            await pricingAPI.createPricingRule(rule);
            successCount++;
          } catch (ruleError) {
            // Continue with other rules but log the error
          }
        }
        
        await fetchRules();
        setJsonSuccessMessage(`Successfully imported ${successCount} of ${rulesToImport.length} pricing rule(s)!`);
      } else {
        throw new Error(`Unknown import key: ${key}`);
      }
      
      // Auto-close after success
      setTimeout(() => {
        setShowJsonEditor(prev => ({ ...prev, [key]: false }));
        setJsonSuccessMessage('');
      }, 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save pricing rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveRule = async (rule: PricingRule) => {
    try {
      setError(null);
      await pricingAPI.deactivatePricingRule(rule.id!);
      await fetchRules();
      setDeleteConfirm({ show: false, rule: null });
    } catch (err) {
      setError('Failed to remove pricing rule');
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.rule_name.trim()) {
      setError('Rule name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      await pricingAPI.createPricingRule(formData);
      await fetchRules();
      
      // Reset form
      setFormData({
        product_id: 0,
        rule_name: '',
        rule_type: 'quantity_break',
        priority: 10,
        conditions: DEFAULT_CONDITIONS.quantity_break,
        formula: DEFAULT_FORMULAS.quantity_break,
        is_active: true
      });
      
      setShowCreateForm(false);
    } catch (err) {
      setError('Failed to create pricing rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRuleTypeChange = (ruleType: string) => {
    const type = ruleType as keyof typeof DEFAULT_CONDITIONS;
    setFormData({
      ...formData,
      rule_type: type,
      conditions: DEFAULT_CONDITIONS[type],
      formula: DEFAULT_FORMULAS[type]
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-neutral-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-neutral-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-neutral-800/30 hover:bg-neutral-800/50 row-hover border-t border-white/[0.02] rounded h-full">
      <div className="space-y-6 h-full overflow-y-auto scrollable-container">
        {/* Hero Section */}
        <TabHero 
          title="Pricing"
          description="Smart pricing that scales. Create rules that adapt to quantity, customers, channels, and time."
        />

        {/* Actions */}
        <div className="flex justify-center gap-3">
          <Button
            onClick={() => openJsonEditor('bulk-import', [])}
            variant="secondary"
            size="sm"
          >
            Import JSON
          </Button>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-300"
          >
            Create Rule
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-neutral-900/40 rounded p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Global Import Section */}
        <div className="bg-neutral-900/40 rounded p-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-neutral-300">Global Pricing Rules</h3>
            <p className="text-xs text-neutral-500 mt-1">Import pricing rules from JSON templates</p>
          </div>
          <Button
            onClick={() => openJsonEditor('global-import', [])}
            size="sm"
            className="bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-300 whitespace-nowrap flex items-center min-w-fit"
          >
            <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Import Pricing JSON
          </Button>
        </div>
      </div>

      {/* Individual Pricing Rules Cards - Exact BlueprintDesigner Structure */}
      <div className="space-y-2">
        {rules.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-neutral-400 mb-4">No pricing rules created yet</div>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-300"
            >
              Create Your First Pricing Rule
            </Button>
          </div>
        ) : (
          rules.map((rule) => {
            const isExpanded = expandedRules.has(rule.id!);
            
            return (
              <div
                key={rule.id}
                className="group transition-all cursor-pointer mb-2 rounded-lg border-b border-white/[0.02] bg-neutral-900/40 hover:bg-neutral-800/50"
              >
                {/* Main Rule Row - Exact BlueprintDesigner styling */}
                <div className="flex items-center gap-3 px-4 py-2">
                  {/* Expand/Collapse Icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRuleExpansion(rule.id!);
                    }}
                    className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-neutral-600 hover:text-neutral-400 smooth-hover"
                  >
                    <svg
                      className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Rule Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-neutral-300 text-sm truncate">{rule.rule_name}</div>
                    <div className="text-xs text-neutral-500 truncate mt-0.5">
                      {rule.rule_type.replace('_', ' ')} • Priority: {rule.priority} • {rule.product_id === 0 ? 'Global' : `Product: ${rule.product_id}`}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="w-24 text-right">
                    <div className="text-xs text-neutral-500">
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </div>
                  </div>

                  {/* Actions - Exact BlueprintDesigner pattern */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        
                        // Export rule as JSON
                        const exportData = {
                          rule_name: rule.rule_name,
                          rule_type: rule.rule_type,
                          priority: rule.priority,
                          conditions: rule.conditions,
                          formula: rule.formula,
                          is_active: rule.is_active,
                          product_id: rule.product_id
                        };
                        
                        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${rule.rule_name.toLowerCase().replace(/\s+/g, '-')}-pricing-rule.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                      size="sm"
                      variant="ghost"
                      className="px-2 py-1 text-xs bg-neutral-900/40 hover:bg-neutral-800/50 rounded-lg border-b border-white/[0.02] text-neutral-400 hover:text-neutral-300"
                      title="View/Export Rule JSON"
                    >
                      JSON
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement rule duplication
                      }}
                      size="sm"
                      variant="ghost"
                      className="px-2 py-1 text-xs bg-neutral-900/40 hover:bg-neutral-800/50 rounded-lg border-b border-white/[0.02] text-neutral-400 hover:text-neutral-300"
                      title="Duplicate Rule"
                    >
                      Duplicate
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm({ show: true, rule });
                      }}
                      size="sm"
                      variant="ghost"
                      className="px-2 py-1 text-xs bg-neutral-900/40 hover:bg-neutral-800/50 rounded-lg border-b border-white/[0.02] text-red-400 hover:text-red-300"
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Expanded Content - Product Card Style */}
                {isExpanded && (
                  <div className="mx-4 mb-2 rounded p-4 bg-neutral-800/30 hover:bg-neutral-800/50 row-hover border-t border-white/[0.02]">
                    
                    {/* Tab Navigation */}
                    <div className="flex items-center gap-2 border-b border-white/[0.1] bg-neutral-900/30 p-2">
                      <button 
                        onClick={() => setRuleActiveTab(rule.id!, 'preview')}
                        className={`p-2 rounded-xl row-hover ease-out  flex items-center justify-center ${
                          getRuleActiveTab(rule.id!) === 'preview'
                            ? 'text-neutral-400 bg-white/15 shadow-lg shadow-white/10 border border-white/30'
                            : 'text-neutral-500 hover:text-neutral-400 bg-transparent hover:bg-neutral-800/50 border border-transparent hover:border-white/10 hover:shadow-sm hover:shadow-black/10'
                        }`}
                        title="Pricing Tiers Preview"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => setRuleActiveTab(rule.id!, 'details')}
                        className={`p-2 rounded-xl row-hover ease-out  flex items-center justify-center ${
                          getRuleActiveTab(rule.id!) === 'details'
                            ? 'text-neutral-400 bg-white/15 shadow-lg shadow-white/10 border border-white/30'
                            : 'text-neutral-500 hover:text-neutral-400 bg-transparent hover:bg-neutral-800/50 border border-transparent hover:border-white/10 hover:shadow-sm hover:shadow-black/10'
                        }`}
                        title="Rule Details"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => setRuleActiveTab(rule.id!, 'settings')}
                        className={`p-2 rounded-xl row-hover ease-out  flex items-center justify-center ${
                          getRuleActiveTab(rule.id!) === 'settings'
                            ? 'text-neutral-400 bg-white/15 shadow-lg shadow-white/10 border border-white/30'
                            : 'text-neutral-500 hover:text-neutral-400 bg-transparent hover:bg-neutral-800/50 border border-transparent hover:border-white/10 hover:shadow-sm hover:shadow-black/10'
                        }`}
                        title="Rule Settings"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => setRuleActiveTab(rule.id!, 'json')}
                        className={`p-2 rounded-xl row-hover ease-out  flex items-center justify-center ${
                          getRuleActiveTab(rule.id!) === 'json'
                            ? 'text-neutral-400 bg-white/15 shadow-lg shadow-white/10 border border-white/30'
                            : 'text-neutral-500 hover:text-neutral-400 bg-transparent hover:bg-neutral-800/50 border border-transparent hover:border-white/10 hover:shadow-sm hover:shadow-black/10'
                        }`}
                        title="JSON Editor"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                      </button>
                    </div>

                    {/* Tab Content */}
                    <div className="p-4">
                      {getRuleActiveTab(rule.id!) === 'preview' && (
                        /* Pricing Tiers Preview & Editor */
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center text-neutral-500 font-medium text-xs">
                              Pricing Tiers
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => {
                                  const currentTiers = parsePricingTiers(rule);
                                  setEditingTiers(prev => ({ ...prev, [rule.id!]: currentTiers }));
                                  setShowTierEditor(prev => ({ ...prev, [rule.id!]: true }));
                                }}
                                size="sm"
                                variant="ghost"
                                className="text-xs text-neutral-400 hover:text-neutral-300"
                              >
                                Edit Tiers
                              </Button>
                            </div>
                          </div>
                          
                          {showTierEditor[rule.id!] ? (
                            /* Tier Editor */
                            <div className="space-y-3">
                              <div className="bg-neutral-900/40 rounded p-3">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-sm font-medium text-neutral-300">Edit Pricing Tiers</h4>
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => addTier(rule.id!)}
                                      size="sm"
                                      className="bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-300 text-xs px-2 py-1"
                                    >
                                      + Add Tier
                                    </Button>
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  {(editingTiers[rule.id!] || []).map((tier: any, index: number) => (
                                    <div key={tier.id} className="bg-neutral-900/40 rounded p-2">
                                      <div className="grid grid-cols-12 gap-2 items-center">
                                        <div className="col-span-3">
                                          <input
                                            type="text"
                                            value={tier.name}
                                            onChange={(e) => updateTier(rule.id!, tier.id, 'name', e.target.value)}
                                            placeholder="Tier name"
                                            className="w-full px-2 py-1 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 text-xs focus:border-neutral-700 focus:outline-none"
                                          />
                                        </div>
                                        
                                        <div className="col-span-2">
                                          <input
                                            type="number"
                                            value={tier.minQuantity}
                                            onChange={(e) => updateTier(rule.id!, tier.id, 'minQuantity', e.target.value)}
                                            placeholder="Min"
                                            className="w-full px-2 py-1 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 text-xs focus:border-neutral-700 focus:outline-none"
                                          />
                                        </div>
                                        
                                        <div className="col-span-2">
                                          <input
                                            type="number"
                                            value={tier.maxQuantity || ''}
                                            onChange={(e) => updateTier(rule.id!, tier.id, 'maxQuantity', e.target.value || null)}
                                            placeholder="Max"
                                            className="w-full px-2 py-1 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 text-xs focus:border-neutral-700 focus:outline-none"
                                          />
                                        </div>
                                        
                                        <div className="col-span-3">
                                          <input
                                            type="text"
                                            value={tier.price}
                                            onChange={(e) => updateTier(rule.id!, tier.id, 'price', e.target.value)}
                                            placeholder="Price"
                                            className="w-full px-2 py-1 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 text-xs focus:border-neutral-700 focus:outline-none"
                                          />
                                        </div>
                                        
                                        <div className="col-span-2 flex justify-end">
                                          <Button
                                            onClick={() => removeTier(rule.id!, tier.id)}
                                            size="sm"
                                            variant="ghost"
                                            className="text-xs text-red-400 hover:text-red-300 px-1"
                                          >
                                            ×
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                
                                <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-white/[0.04]">
                                  <Button
                                    onClick={() => setShowTierEditor(prev => ({ ...prev, [rule.id!]: false }))}
                                    size="sm"
                                    variant="ghost"
                                    className="text-xs text-neutral-400"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={() => updateRuleTiers(rule.id!, editingTiers[rule.id!] || [])}
                                    size="sm"
                                    className="bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-300 text-xs"
                                  >
                                    Save Tiers
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Tier Preview */
                            (() => {
                              const tiers = parsePricingTiers(rule);
                              
                              if (tiers.length === 0) {
                                return (
                                  <div className="text-center py-8">
                                    <div className="text-neutral-500 text-sm mb-2">No pricing tiers found</div>
                                    <div className="text-neutral-600 text-xs mb-3">This rule may not have tier-based pricing configured</div>
                                    <Button
                                      onClick={() => {
                                        setEditingTiers(prev => ({ ...prev, [rule.id!]: [] }));
                                        setShowTierEditor(prev => ({ ...prev, [rule.id!]: true }));
                                        addTier(rule.id!);
                                      }}
                                      size="sm"
                                      className="bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-300 text-xs"
                                    >
                                      Add First Tier
                                    </Button>
                                  </div>
                                );
                              }
                              
                              return (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                  {tiers.map((tier: any) => (
                                    <div key={tier.id} className="bg-neutral-900/40 border border-white/[0.04] rounded p-2">
                                      <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-normal text-neutral-400 text-xs truncate pr-1">{tier.name}</h4>
                                        <div className="text-sm font-normal text-neutral-300">${tier.price}</div>
                                      </div>
                                      
                                      <div className="space-y-1">
                                        <div className="flex justify-between items-center text-xs">
                                          <span className="text-neutral-600">Range:</span>
                                          <span className="text-neutral-500 text-xs">
                                            {tier.minQuantity}-{tier.maxQuantity || '∞'}
                                          </span>
                                        </div>
                                        
                                        <div className="flex justify-between items-center text-xs">
                                          <span className="text-neutral-600">Unit:</span>
                                          <span className="text-neutral-500 text-xs">
                                            ${(parseFloat(tier.price) / (tier.maxQuantity || tier.minQuantity)).toFixed(2)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()
                          )}
                        </div>
                      )}
                      
                      {getRuleActiveTab(rule.id!) === 'details' && (
                        /* Rule Details */
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center text-neutral-500 font-medium text-xs">
                              Rule Details
                            </div>
                          </div>
                      
                          <div className="space-y-2">
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 text-xs">Type:</span>
                                <span className="text-neutral-500 text-xs">{rule.rule_type.replace('_', ' ')}</span>
                              </div>
                            </div>
                            
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 text-xs">Priority:</span>
                                <span className="text-neutral-500 text-xs">{rule.priority}</span>
                              </div>
                            </div>
                            
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="text-neutral-600 text-xs font-medium mb-1">Formula</div>
                              <code className="text-neutral-400 text-xs bg-neutral-800 px-2 py-1 rounded block">{rule.formula}</code>
                            </div>
                            
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="text-neutral-600 text-xs font-medium mb-1">Conditions</div>
                              <code className="text-neutral-400 text-xs bg-neutral-800 px-2 py-1 rounded block overflow-x-auto">
                                {typeof rule.conditions === 'string' ? rule.conditions : JSON.stringify(rule.conditions, null, 2)}
                              </code>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {getRuleActiveTab(rule.id!) === 'settings' && (
                        /* Rule Settings */
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center text-neutral-500 font-medium text-xs">
                              Rule Settings
                            </div>
                          </div>
                      
                          <div className="space-y-2">
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 text-xs">Status:</span>
                                <span className="text-neutral-500 text-xs">
                                  {rule.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 text-xs">Product Scope:</span>
                                <span className="text-neutral-500 text-xs">
                                  {rule.product_id === 0 ? 'Global (All Products)' : `Product ID: ${rule.product_id}`}
                                </span>
                              </div>
                            </div>
                            
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 text-xs">Rule ID:</span>
                                <span className="text-neutral-500 text-xs font-mono">{rule.id}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {getRuleActiveTab(rule.id!) === 'json' && (
                        /* JSON Editor */
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center text-neutral-500 font-medium text-xs">
                              JSON Editor
                              <JsonIcon
                                onClick={() => openJsonEditor(`rule-${rule.id}`, rule)}
                                title="Edit rule as JSON"
                              />
                            </div>
                            <Button
                              onClick={() => openJsonEditor(`rule-${rule.id}`, rule)}
                              size="sm"
                              variant="ghost"
                              className="text-xs text-neutral-400 hover:text-neutral-300"
                            >
                              Edit JSON
                            </Button>
                          </div>
                      
                          <div className="bg-neutral-900/40 rounded p-3">
                            <pre className="text-xs text-neutral-400 overflow-x-auto">
                              {JSON.stringify(rule, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* JSON Editor Modals - Exact BlueprintDesigner pattern */}
      {Object.entries(showJsonEditor).map(([key, show]) => {
        if (!show) return null;
        
        let title = 'JSON Editor';
        let placeholder = 'Enter JSON...';
        
        if (key.startsWith('rule-')) {
          title = 'Edit Pricing Rule';
          placeholder = `{
  "product_id": 0,
  "rule_name": "Vape Pricing Tiers",
  "rule_type": "quantity_break",
  "priority": 10,
  "conditions": {
    "product_type": "vape",
    "unit_type": "units",
    "tiers": [
      {
        "name": "Single Unit",
        "min_quantity": 1,
        "max_quantity": 1,
        "price": "49.99"
      }
    ]
  },
  "formula": "case when {quantity} = 1 then 49.99 else {base_price} end",
  "is_active": true
}`;
        } else if (key.startsWith('group-import-') || key.startsWith('bulk-import') || key.startsWith('global-import')) {
          title = 'Import Pricing Rules';
          placeholder = `[
  {
    "product_id": 0,
    "rule_name": "Flower Pricing Tiers",
    "rule_type": "quantity_break",
    "priority": 10,
    "conditions": {
      "product_type": "flower",
      "unit_type": "grams",
      "tiers": [
        {
          "name": "1 Gram",
          "min_quantity": 1,
          "max_quantity": 1,
          "price": "14.99"
        },
        {
          "name": "3.5 Grams",
          "min_quantity": 3.5,
          "max_quantity": 3.5,
          "price": "39.99"
        }
      ]
    },
    "formula": "case when {quantity} = 1 then 14.99 when {quantity} = 3.5 then 39.99 else {base_price} end",
    "is_active": true
  }
]`;
        } else if (key.startsWith('group-')) {
          title = 'Edit Group Rules';
          placeholder = `[
  {
    "rule_name": "Updated Rule Name",
    "rule_type": "quantity_break",
    "priority": 10,
    "conditions": {...},
    "formula": "updated formula",
    "is_active": true
  }
]`;
        }
        
        return (
          <JsonPopout
            key={key}
            isOpen={show}
            onClose={() => {
              setShowJsonEditor(prev => ({ ...prev, [key]: false }));
              setJsonSuccessMessage('');
            }}
            value={jsonEditorData[key] || {}}
            onChange={(data) => {
              handleJsonSave(key, data);
            }}
            title={title}
            placeholder={placeholder}
            size="xlarge"
            loading={isSubmitting}
            successMessage={jsonSuccessMessage}
            style="dashboard"
          />
        );
      })}

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Create Pricing Rule</h3>
            
            <form onSubmit={handleCreateRule} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">
                    Rule Name *
                  </label>
                  <input
                    type="text"
                    value={formData.rule_name}
                    onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                    placeholder="e.g., Bulk Discount 10+"
                    className="w-full px-3 py-2 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">
                    Rule Type *
                  </label>
                  <select
                    value={formData.rule_type}
                    onChange={(e) => handleRuleTypeChange(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none"
                  >
                    {RULE_TYPE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">
                    Product ID (0 for global)
                  </label>
                  <input
                    type="number"
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">
                    Priority
                  </label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 10 })}
                    className="w-full px-3 py-2 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">
                  Formula *
                </label>
                <input
                  type="text"
                  value={formData.formula}
                  onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
                  placeholder="e.g., base_price * (1 - discount_percent / 100)"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-neutral-300 focus:border-neutral-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">
                  Conditions (JSON)
                </label>
                <textarea
                  value={conditionsText || JSON.stringify(formData.conditions, null, 2)}
                  onChange={(e) => {
                    setConditionsText(e.target.value);
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setFormData({ ...formData, conditions: parsed });
                    } catch (err) {
                      // Keep the current conditions if JSON is invalid
                    }
                  }}
                  placeholder="Enter JSON conditions..."
                  className="w-full h-32 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-neutral-300 focus:border-neutral-500 focus:outline-none font-mono text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="is_active" className="text-sm text-neutral-300">Active</label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-300"
                >
                  {isSubmitting ? 'Creating...' : 'Create Rule'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, rule: null })}
                    onConfirm={() => deleteConfirm.rule && handleRemoveRule(deleteConfirm.rule)}
        title="Remove Pricing Rule"
        message={`Remove "${deleteConfirm.rule?.rule_name}" from this blueprint? The rule will remain in your system and can be reactivated later.`}
        confirmText="Remove Rule"
        isDestructive={false}
      />
      </div>
    </div>
  );
}