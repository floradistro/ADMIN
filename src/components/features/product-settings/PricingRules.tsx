import React, { useState, useEffect } from 'react';
import { Button, IconButton, Modal, Card } from '../../ui';
import { pricingAPI, PricingRule } from '../../../services/pricing-api';
import { PricingRuleForm } from './PricingRuleForm';
import { PricingRuleCard } from './PricingRuleCard';

interface PricingRulesProps {
  productId?: number;
}

export function PricingRules({ productId }: PricingRulesProps) {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const loadRules = async () => {
    try {
      setLoading(true);
      const response = await pricingAPI.getPricingRules(productId, true);
      setRules(response.rules);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pricing rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, [productId]);

  const handleCreateRule = async (ruleData: Omit<PricingRule, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await pricingAPI.createPricingRule(ruleData);
      setShowCreateForm(false);
      await loadRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pricing rule');
    }
  };

  const handleEditRule = async (ruleId: number, updates: Partial<PricingRule>) => {
    try {
      await pricingAPI.updatePricingRule(ruleId, updates);
      setEditingRule(null);
      await loadRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update pricing rule');
    }
  };

  const handleRemoveRule = async (ruleId: number) => {
    try {
      setDeleting(ruleId);
      await pricingAPI.deactivatePricingRule(ruleId);
      await loadRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove pricing rule');
    } finally {
      setDeleting(null);
    }
  };

  const handleRegeneratePriceLists = async () => {
    try {
      const productIds = productId ? [productId] : undefined;
      await pricingAPI.regeneratePriceLists(productIds);
      // Show success message or refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate price lists');
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="text-neutral-400">Loading pricing rules...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-100 mb-1">
            Pricing Rules
          </h2>
          <p className="text-sm text-neutral-400">
            Configure dynamic pricing rules for {productId ? 'this product' : 'all products'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRegeneratePriceLists}
          >
            Regenerate Price Lists
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateForm(true)}
          >
            Create Rule
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-500/20 bg-red-500/5">
          <div className="p-4">
            <div className="text-red-400 text-sm">{error}</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="mt-2"
            >
              Dismiss
            </Button>
          </div>
        </Card>
      )}

      {/* Rules List */}
      {rules.length === 0 ? (
        <Card>
          <div className="p-8 text-center">
            <div className="text-neutral-400 mb-4">
              No pricing rules configured
            </div>
            <Button
              variant="primary"
              onClick={() => setShowCreateForm(true)}
            >
              Create First Rule
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <PricingRuleCard
              key={rule.id}
              rule={rule}
              onEdit={(rule) => setEditingRule(rule)}
              onDelete={(ruleId) => handleRemoveRule(ruleId)}
              deleting={deleting === rule.id}
            />
          ))}
        </div>
      )}

      {/* Create Rule Modal */}
      {showCreateForm && (
        <Modal
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          title="Create Pricing Rule"
          size="large"
        >
          <PricingRuleForm
            productId={productId}
            onSubmit={handleCreateRule}
            onCancel={() => setShowCreateForm(false)}
          />
        </Modal>
      )}

      {/* Edit Rule Modal */}
      {editingRule && (
        <Modal
          isOpen={!!editingRule}
          onClose={() => setEditingRule(null)}
          title="Edit Pricing Rule"
          size="large"
        >
          <PricingRuleForm
            rule={editingRule}
            productId={productId}
            onSubmit={(updates) => handleEditRule(editingRule.id!, updates)}
            onCancel={() => setEditingRule(null)}
          />
        </Modal>
      )}
    </div>
  );
}