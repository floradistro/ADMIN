import React, { useEffect, useState, useRef } from 'react';
import { Button, Modal } from '../../ui';
import { pricingAPI, PricingRule } from '../../../services/pricing-api';

interface PricingRulesPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (rules: PricingRule[]) => void;
  selectedRuleIds?: number[];
  title?: string;
}

export function PricingRulesPicker({ 
  isOpen, 
  onClose, 
  onSelect, 
  selectedRuleIds = [],
  title = "Select Pricing Rules"
}: PricingRulesPickerProps) {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [localSelectedIds, setLocalSelectedIds] = useState<number[]>(selectedRuleIds);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setLocalSelectedIds(selectedRuleIds);
      setSearchTerm(''); // Reset search when opening
      
      // Only fetch once when modal opens and we haven't fetched yet
      if (!hasFetchedRef.current && !loading) {
        hasFetchedRef.current = true;
        fetchRules();
      }
    }
  }, [isOpen]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await pricingAPI.getPricingRules();
      
      setRules(response.rules || []);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pricing rules');
      hasFetchedRef.current = false; // Allow retry
    } finally {
      setLoading(false);
    }
  };

  const handleRuleToggle = (ruleId: number) => {
    setLocalSelectedIds(prev => 
      prev.includes(ruleId) 
        ? prev.filter(id => id !== ruleId)
        : [...prev, ruleId]
    );
  };

  const handleSelectAll = () => {
    const filteredRuleIds = filteredRules.map(rule => rule.id!).filter(id => id);
    setLocalSelectedIds(filteredRuleIds);
  };

  const handleClearAll = () => {
    setLocalSelectedIds([]);
  };

  const handleConfirm = () => {
    try {
      const selectedRules = rules.filter(rule => rule.id && localSelectedIds.includes(rule.id));
      
      if (selectedRules.length === 0) {
        return;
      }
      
      onSelect(selectedRules);
      
      // Reset local state
      setLocalSelectedIds([]);
      setSearchTerm('');
      
    } catch (err) {
    }
  };

  const filteredRules = rules.filter(rule =>
    rule.rule_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.rule_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.formula.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="xlarge"
    >
      <div className="space-y-4">

        {/* Search and Actions */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search pricing rules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-2 py-1 bg-black border border-white/[0.04] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSelectAll}
              variant="ghost"
              size="sm"
              className="text-xs"
            >
              Select All
            </Button>
            <Button
              onClick={handleClearAll}
              variant="ghost"
              size="sm"
              className="text-xs"
            >
              Clear All
            </Button>
          </div>
        </div>
        
        {localSelectedIds.length > 0 && (
          <div className="text-xs text-neutral-500">
            {localSelectedIds.length} rule{localSelectedIds.length !== 1 ? 's' : ''} selected
          </div>
        )}

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-pulse text-neutral-400">Loading pricing rules...</div>
            </div>
          ) : error ? (
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
              <Button
                onClick={fetchRules}
                variant="ghost"
                size="sm"
                className="mt-2 text-xs text-neutral-400 hover:text-neutral-300 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.04] rounded"
              >
                Retry
              </Button>
            </div>
          ) : filteredRules.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-neutral-400 mb-4">
                {searchTerm ? 'No rules match your search' : 'No pricing rules found'}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {(() => {
                // Group rules by product_type (from conditions) or rule_type as fallback
                const groupedRules: Record<string, PricingRule[]> = {};
                
                filteredRules.forEach((rule, index) => {
                  try {
                    const conditions = typeof rule.conditions === 'string' 
                      ? JSON.parse(rule.conditions) 
                      : rule.conditions;
                    
                    let groupName = 'General';
                    
                    // Debug logging
                    
                    // First try to group by product_type from conditions
                    if (conditions.product_type) {
                      groupName = conditions.product_type.charAt(0).toUpperCase() + conditions.product_type.slice(1);
                    }
                    // Then try to detect product type from rule name
                    else if (rule.rule_name.toLowerCase().includes('flower') || rule.rule_name.toLowerCase().includes('cannabis') || rule.rule_name.toLowerCase().includes('strain')) {
                      groupName = 'Flower Rules';
                    }
                    else if (rule.rule_name.toLowerCase().includes('edible')) {
                      groupName = 'Edible Rules';
                    }
                    else if (rule.rule_name.toLowerCase().includes('preroll') || rule.rule_name.toLowerCase().includes('pre-roll')) {
                      groupName = 'Preroll Rules';
                    }
                    else if (rule.rule_name.toLowerCase().includes('concentrate')) {
                      groupName = 'Concentrate Rules';
                    }
                    // Group by quantity ranges for quantity breaks
                    else if (rule.rule_type === 'quantity_break') {
                      if (conditions.min_quantity) {
                        const minQty = parseInt(conditions.min_quantity);
                        if (minQty === 1) {
                          groupName = 'Single Unit Pricing';
                        } else if (minQty >= 2 && minQty <= 5) {
                          groupName = 'Small Quantity (2-5)';
                        } else if (minQty >= 6 && minQty <= 15) {
                          groupName = 'Medium Quantity (6-15)';
                        } else if (minQty > 15) {
                          groupName = 'Bulk Quantity (15+)';
                        } else {
                          groupName = 'Quantity Breaks';
                        }
                      } else {
                        groupName = 'Quantity Breaks';
                      }
                    }
                    // Fallback to rule type
                    else {
                      groupName = rule.rule_type.charAt(0).toUpperCase() + rule.rule_type.slice(1).replace('_', ' ');
                    }
                    
                    if (!groupedRules[groupName]) {
                      groupedRules[groupName] = [];
                    }
                    groupedRules[groupName].push(rule);
                    
                  } catch (err) {
                    // Fallback grouping
                    let groupName = 'General';
                    if (rule.rule_name.toLowerCase().includes('flower') || rule.rule_name.toLowerCase().includes('cannabis')) {
                      groupName = 'Flower Rules';
                    } else if (rule.rule_name.toLowerCase().includes('edible')) {
                      groupName = 'Edible Rules';
                    } else {
                      groupName = rule.rule_type.charAt(0).toUpperCase() + rule.rule_type.slice(1).replace('_', ' ');
                    }
                    
                    if (!groupedRules[groupName]) {
                      groupedRules[groupName] = [];
                    }
                    groupedRules[groupName].push(rule);
                  }
                });

                
                return Object.entries(groupedRules).map(([groupName, groupRules]) => (
                  <div key={groupName} className="border border-white/[0.04] rounded-lg bg-neutral-900/40">
                    {/* Group Header */}
                    <div className="px-4 py-3 border-b border-white/[0.04] bg-neutral-900/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xs text-neutral-400">{groupName} Rules</h3>
                          <span className="px-2 py-0.5 bg-neutral-800 text-neutral-400 text-xs rounded">
                            {groupRules.length} rule{groupRules.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-500">
                          {groupRules.filter(r => localSelectedIds.includes(r.id!)).length} selected
                        </div>
                      </div>
                    </div>

                    {/* Group Rules */}
                    <div className="p-2">
                      <div className="space-y-1">
                        {groupRules.map((rule) => (
                          <div
                            key={rule.id}
                            className={`group transition-all cursor-pointer mb-2 border border-white/[0.04] rounded-lg ${
                              localSelectedIds.includes(rule.id!) 
                                ? 'bg-neutral-900/60 hover:bg-neutral-900/80 border-l-2 border-l-white/[0.3]' 
                                : 'bg-neutral-900/40 hover:bg-neutral-900/60'
                            }`}
                            onClick={() => handleRuleToggle(rule.id!)}
                          >
                            <div className="flex items-center gap-3 px-4 py-3">
                              {/* Rule Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="text-neutral-300 text-xs font-medium truncate">{rule.rule_name}</div>
                                  <span className="px-2 py-0.5 bg-neutral-800/40 text-neutral-400 text-xs rounded">
                                    {rule.rule_type.replace('_', ' ')}
                                  </span>
                                  <span className={`px-2 py-0.5 text-xs rounded ${
                                    rule.is_active 
                                      ? 'bg-green-600/20 text-green-400' 
                                      : 'bg-neutral-600/20 text-neutral-400'
                                  }`}>
                                    {rule.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                                
                                <div className="text-xs text-neutral-400">
                                  <div className="flex items-center gap-4">
                                    <span>Priority: {rule.priority}</span>
                                    <span>Product ID: {rule.product_id === 0 ? 'Global' : rule.product_id}</span>
                                  </div>
                                  <div className="flex items-center mt-0.5">
                                    <span className="text-neutral-500">Formula:</span>
                                    <code className="ml-2 bg-neutral-800 px-1 py-0.5 rounded text-xs text-neutral-400 max-w-xs truncate">
                                      {rule.formula}
                                    </code>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t border-white/[0.04]">
          <Button
            onClick={onClose}
            variant="secondary"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={localSelectedIds.length === 0}
            className="bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-300"
          >
            Add {localSelectedIds.length} Rule{localSelectedIds.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </Modal>
  );
}