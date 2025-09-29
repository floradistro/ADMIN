import React, { useState, useEffect } from 'react';
import { Button, Card, Select, Input } from '../../ui';

import { categoriesService, WooCategory } from '../../../services/categories-service';
import { floraFieldsAPI } from '../../../services/flora-fields-api';
import { pricingAPI } from '../../../services/pricing-api';
import { PricingBlueprintIntegration, BlueprintPricingRule, PricingTemplate } from '../../../services/pricing-blueprint-integration';

interface PricingRuleGenerator {
  onRulesGenerated?: (rules: any[]) => void;
}

interface CategoryUnitMapping {
  categoryId: number;
  categoryName: string;
  unit: string;
  blueprintId?: number;
}

// Use the centralized pricing templates from the integration service
const PRICING_TEMPLATES = PricingBlueprintIntegration.getAllTemplates();

export function PricingRuleGenerator({ onRulesGenerated }: PricingRuleGenerator) {
  const [categories, setCategories] = useState<WooCategory[]>([]);
  const [categoryUnits, setCategoryUnits] = useState<CategoryUnitMapping[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [customTemplate, setCustomTemplate] = useState<PricingTemplate | null>(null);
  const [generatedRules, setGeneratedRules] = useState<BlueprintPricingRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await categoriesService.getCategories({ per_page: 100 });
      if (response.success) {
        setCategories(response.data);
        
        // Map categories with their units
        const unitMappings: CategoryUnitMapping[] = response.data.map(cat => ({
          categoryId: cat.id,
          categoryName: cat.name,
          unit: cat.unit || 'units'
        }));
        
        setCategoryUnits(unitMappings);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const generatePricingRules = () => {
    if (selectedCategories.length === 0) {
      setError('Please select at least one category');
      return;
    }

    try {
      const selectedCategoryObjects = categories.filter(cat => 
        selectedCategories.includes(cat.id)
      );

      const rules = PricingBlueprintIntegration.generatePricingRulesForCategories(
        selectedCategoryObjects,
        34 // Default blueprint ID
      );

      // Validate all generated rules
      const validationErrors: string[] = [];
      rules.forEach((rule, index) => {
        const validation = PricingBlueprintIntegration.validateBlueprintPricingRule(rule);
        if (!validation.valid) {
          validationErrors.push(`Rule ${index + 1} (${rule.rule_name}): ${validation.errors.join(', ')}`);
        }
      });

      if (validationErrors.length > 0) {
        setError(`Validation errors: ${validationErrors.join('; ')}`);
        return;
      }

      setGeneratedRules(rules);
      setShowPreview(true);
      setError(null);
      setSuccess(`Generated ${rules.length} pricing rules`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate pricing rules');
    }
  };

  const saveGeneratedRules = async () => {
    try {
      setLoading(true);
      setError(null);

      // Save each rule via the pricing API
      for (const rule of generatedRules) {
        await pricingAPI.createPricingRule({
          product_id: 0, // Global rule
          rule_name: rule.rule_name,
          rule_type: 'quantity_break', // Map to valid enum value
          priority: rule.priority,
          conditions: rule.conditions || {}, // Ensure it's an object
          formula: rule.formula || '0', // Ensure it's a string
          is_active: rule.active
        });
      }

      setSuccess(`Successfully saved ${generatedRules.length} pricing rules!`);
      
      if (onRulesGenerated) {
        onRulesGenerated(generatedRules);
      }

      // Reset form
      setSelectedCategories([]);
      setGeneratedRules([]);
      setShowPreview(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save pricing rules');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = (categoryId: number) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const exportRules = () => {
    const dataStr = PricingBlueprintIntegration.exportBlueprintPricingRules(generatedRules);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `blueprint-pricing-rules-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border-b border-white/[0.02] p-4 bg-neutral-900/20">
        <h3 className="text-sm font-medium text-neutral-300 mb-2">
          Pricing Rule Generator
        </h3>
        <p className="text-xs text-neutral-500 mb-4">
          Generate pricing rules automatically based on category units of measure from your blueprint system.
        </p>

        {error && (
          <div className="p-3 bg-red-900/20 border border-red-500/20 rounded text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-900/20 border border-green-500/20 rounded text-green-400 text-sm mb-4">
            {success}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-2">
              Select Categories
            </label>
            <div className="space-y-2">
              {categories.map(category => {
                const unitMapping = categoryUnits.find(c => c.categoryId === category.id);
                const template = PRICING_TEMPLATES[unitMapping?.unit || 'units'];
                const isSelected = selectedCategories.includes(category.id);
                
                return (
                  <div 
                    key={category.id} 
                    className={`group transition-all cursor-pointer rounded-lg border-b border-white/[0.02] ${
                      isSelected 
                        ? 'bg-neutral-800/50 hover:bg-neutral-800/70 border-l-2 border-l-white/[0.3]' 
                        : 'bg-neutral-900/40 hover:bg-neutral-800/50'
                    }`}
                    onClick={() => handleCategoryToggle(category.id)}
                  >
                    <div className="flex items-center gap-3 px-4 py-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-neutral-300 text-sm truncate">{category.name}</div>
                        <div className="text-xs text-neutral-500 truncate mt-0.5">
                          Unit: {unitMapping?.unit || 'units'} • Template: {template.name}
                        </div>
                      </div>
                      <div className="w-24 text-right">
                        <div className="text-xs text-neutral-400">{category.count} products</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={generatePricingRules}
              disabled={loading || selectedCategories.length === 0}
              variant="primary"
            >
              {loading ? 'Generating...' : 'Generate Pricing Rules'}
            </Button>
            
            {selectedCategories.length > 0 && (
              <div className="text-xs text-neutral-500 flex items-center">
                {selectedCategories.length} categories selected
              </div>
            )}
          </div>
        </div>
      </div>

      {showPreview && generatedRules.length > 0 && (
        <div className="rounded-lg border-b border-white/[0.02] p-4 bg-neutral-900/20">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-neutral-300">
              Generated Pricing Rules Preview
            </h4>
            <div className="flex space-x-2">
              <Button
                onClick={exportRules}
                variant="secondary"
                size="sm"
              >
                Export JSON
              </Button>
              <Button
                onClick={saveGeneratedRules}
                disabled={loading}
                variant="primary"
                size="sm"
              >
                {loading ? 'Saving...' : 'Save Rules'}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {generatedRules.map((rule, index) => (
              <div key={index} className="rounded-lg border-b border-white/[0.02] p-4 bg-neutral-900/40 hover:bg-neutral-800/50 smooth-hover">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-neutral-300">{rule.rule_name}</h5>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-neutral-500">Unit: {rule.unit}</span>
                    <span className="text-neutral-500">•</span>
                    <span className="text-neutral-500">{rule.breaks.length} breaks</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  {rule.breaks.map((breakItem: any, breakIndex: number) => (
                    <div key={breakIndex} className="bg-neutral-800/60 rounded p-2 border border-white/[0.04]">
                      <div className="text-neutral-300">
                        {breakItem.min}{breakItem.max && breakItem.max !== breakItem.min ? `-${breakItem.max}` : ''} {rule.unit}
                      </div>
                      <div className="text-green-400">
                        ${(breakItem.price_cents / 100).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <div className="bg-neutral-900/40 border border-neutral-800/40 rounded p-3">
              <div className="text-neutral-500 mb-3 text-xs">Generated Rules Preview</div>
              <pre className="text-xs text-neutral-400 overflow-x-auto max-h-96 overflow-y-auto">
                {JSON.stringify(generatedRules, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Template Information */}
      <div className="rounded-lg border-b border-white/[0.02] p-4 bg-neutral-900/20">
        <h4 className="text-sm font-medium text-neutral-300 mb-4">
          Available Pricing Templates
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(PRICING_TEMPLATES).map(([key, template]) => (
            <div key={key} className="rounded-lg border-b border-white/[0.02] p-4 bg-neutral-900/40 hover:bg-neutral-800/50 smooth-hover">
              <h5 className="font-medium text-neutral-300 mb-2">{template.name}</h5>
              <p className="text-neutral-500 text-xs mb-3">{template.description}</p>
              <div className="space-y-1">
                {template.breaks.map((breakItem, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="text-neutral-400">{breakItem.label}</span>
                    <span className="text-green-400">${breakItem.price}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}