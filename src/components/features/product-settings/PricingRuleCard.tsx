import React, { useState } from 'react';
import { Button, Card, Badge } from '../../ui';
import { PricingRule } from '../../../services/pricing-api';

interface PricingRuleCardProps {
  rule: PricingRule;
  onEdit: (rule: PricingRule) => void;
  onDelete: (ruleId: number) => void;
  deleting?: boolean;
}

const RULE_TYPE_COLORS = {
  quantity_break: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  customer_tier: 'bg-green-500/10 text-green-400 border-green-500/20',
  channel: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  store: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  time_window: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
};

const RULE_TYPE_LABELS = {
  quantity_break: 'Quantity Break',
  customer_tier: 'Customer Tier',
  channel: 'Sales Channel',
  store: 'Store Location',
  time_window: 'Time Window',
};

export function PricingRuleCard({ rule, onEdit, onDelete, deleting }: PricingRuleCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    if (rule.id) {
      onDelete(rule.id);
      setShowDeleteConfirm(false);
    }
  };

  const formatConditions = () => {
    if (!rule.conditions || Object.keys(rule.conditions).length === 0) {
      return 'No conditions';
    }

    return Object.entries(rule.conditions)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join(', ');
  };

  const formatDateRange = () => {
    if (!rule.start_date && !rule.end_date) return null;
    
    const start = rule.start_date ? new Date(rule.start_date).toLocaleDateString() : 'No start';
    const end = rule.end_date ? new Date(rule.end_date).toLocaleDateString() : 'No end';
    
    return `${start} - ${end}`;
  };

  return (
    <Card className="hover:bg-neutral-900/60 smooth-hover">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-neutral-100 font-medium">{rule.rule_name}</h3>
              <Badge 
                variant="secondary" 
                className={RULE_TYPE_COLORS[rule.rule_type]}
              >
                {RULE_TYPE_LABELS[rule.rule_type]}
              </Badge>
              {!rule.is_active && (
                <Badge variant="secondary" className="bg-neutral-500/10 text-neutral-400 border-neutral-500/20">
                  Inactive
                </Badge>
              )}
            </div>
            
            <div className="text-sm text-neutral-400 space-y-1">
              <div>Priority: {rule.priority}</div>
              <div>Formula: <code className="text-neutral-300 bg-neutral-800 px-1 rounded text-xs">{rule.formula}</code></div>
              {formatDateRange() && (
                <div>Active: {formatDateRange()}</div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide' : 'Details'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(rule)}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>

        {/* Conditions Summary */}
        <div className="text-sm text-neutral-500">
          Conditions: {formatConditions()}
        </div>

        {/* Expanded Details */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-neutral-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-neutral-400 mb-1">Product ID:</div>
                <div className="text-neutral-300">
                  {rule.product_id === 0 ? 'Global rule' : rule.product_id}
                </div>
              </div>
              
              <div>
                <div className="text-neutral-400 mb-1">Created:</div>
                <div className="text-neutral-300">
                  {rule.created_at ? new Date(rule.created_at).toLocaleString() : 'Unknown'}
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="text-neutral-400 mb-1">Full Conditions:</div>
                <pre className="text-neutral-300 bg-neutral-800 p-2 rounded text-xs overflow-x-auto">
                  {JSON.stringify(rule.conditions, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="mt-4 pt-4 border-t border-neutral-800">
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
              <div className="text-orange-400 text-sm mb-3">
                Remove this pricing rule from the blueprint? The rule will remain in your system and can be reactivated later.
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleDelete}
                  className="bg-orange-600 hover:bg-orange-700"
                  disabled={deleting}
                >
                  {deleting ? 'Removing...' : 'Remove Rule'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}