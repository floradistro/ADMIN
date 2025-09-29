/**
 * Pricing Blueprint Integration Service
 * 
 * This service handles the automatic formatting of pricing rules based on
 * blueprint category units of measure. It bridges the gap between the
 * category management system and the pricing rule system.
 */

import { WooCategory } from './categories-service';
import { PricingRule } from './pricing-api';

export interface BlueprintPricingRule {
  id?: number;
  blueprint_id: number;
  rule_name: string;
  rule_type: 'quantity_break' | 'tier_pricing' | 'bulk_discount' | 'fixed_price';
  priority: number;
  filters: {
    product_type?: string;
    channels?: string[];
    stores?: string[];
    customer_tiers?: string[];
  };
  unit: string;
  currency: string;
  breaks: Array<{
    min: number;
    max?: number | null;
    price_cents: number;
  }>;
  valid_from?: string | null;
  valid_to?: string | null;
  active: boolean;
  created_at?: string;
  updated_at?: string;
  // Legacy support for existing system
  conditions?: Record<string, any>;
  formula?: string;
}

export interface PricingTemplate {
  name: string;
  description: string;
  unitType: string;
  productType: string;
  breaks: Array<{
    min: number;
    max?: number | null;
    price: number;
    label: string;
  }>;
}

export class PricingBlueprintIntegration {
  
  private static readonly UNIT_TO_PRODUCT_TYPE_MAP: Record<string, string> = {
    'grams': 'flower',
    'ounces': 'flower',
    'pounds': 'flower',
    'kilograms': 'flower',
    'eighths': 'flower',
    'quarters': 'flower',
    'halves': 'flower',
    'pieces': 'preroll',
    'milligrams': 'edible',
    'milliliters': 'concentrate',
    'liters': 'concentrate',
    'units': 'general'
  };

  private static readonly PRICING_TEMPLATES: Record<string, PricingTemplate> = {
    grams: {
      name: 'Cannabis Flower (Grams)',
      description: 'Standard cannabis flower pricing by weight',
      unitType: 'grams',
      productType: 'flower',
      breaks: [
        { min: 1, max: 1, price: 14.99, label: '1g' },
        { min: 3.5, max: 3.5, price: 39.99, label: '3.5g (Eighth)' },
        { min: 7, max: 7, price: 69.99, label: '7g (Quarter)' },
        { min: 14, max: 14, price: 124.99, label: '14g (Half Oz)' },
        { min: 28, max: null, price: 199.99, label: '28g (Full Oz)' }
      ]
    },
    ounces: {
      name: 'Cannabis Flower (Ounces)',
      description: 'Cannabis flower pricing by ounces',
      unitType: 'ounces',
      productType: 'flower',
      breaks: [
        { min: 0.035, max: 0.035, price: 14.99, label: '1/32 oz' },
        { min: 0.125, max: 0.125, price: 39.99, label: '1/8 oz' },
        { min: 0.25, max: 0.25, price: 69.99, label: '1/4 oz' },
        { min: 0.5, max: 0.5, price: 124.99, label: '1/2 oz' },
        { min: 1, max: null, price: 199.99, label: '1 oz+' }
      ]
    },
    pieces: {
      name: 'Pre-Rolls (Pieces)',
      description: 'Pre-roll pricing by quantity',
      unitType: 'pieces',
      productType: 'preroll',
      breaks: [
        { min: 1, max: 1, price: 6.99, label: '1 Pre-Roll' },
        { min: 3, max: 3, price: 18.99, label: '3-Pack' },
        { min: 5, max: 5, price: 29.99, label: '5-Pack' },
        { min: 10, max: null, price: 54.99, label: '10-Pack+' }
      ]
    },
    milligrams: {
      name: 'Edibles (Milligrams)',
      description: 'Edible pricing by THC content',
      unitType: 'milligrams',
      productType: 'edible',
      breaks: [
        { min: 5, max: 5, price: 8.99, label: '5mg' },
        { min: 10, max: 10, price: 12.99, label: '10mg' },
        { min: 25, max: 25, price: 24.99, label: '25mg' },
        { min: 50, max: 50, price: 39.99, label: '50mg' },
        { min: 100, max: null, price: 69.99, label: '100mg+' }
      ]
    },
    milliliters: {
      name: 'Concentrates (Milliliters)',
      description: 'Concentrate/vape cartridge pricing by volume',
      unitType: 'milliliters',
      productType: 'concentrate',
      breaks: [
        { min: 0.5, max: 0.5, price: 29.99, label: '0.5ml Cart' },
        { min: 1, max: 1, price: 49.99, label: '1ml Cart' },
        { min: 2, max: null, price: 89.99, label: '2ml+ Cart' }
      ]
    },
    liters: {
      name: 'Concentrates (Liters)',
      description: 'Large volume concentrate pricing',
      unitType: 'liters',
      productType: 'concentrate',
      breaks: [
        { min: 0.001, max: 0.001, price: 49.99, label: '1ml' },
        { min: 0.01, max: 0.01, price: 399.99, label: '10ml' },
        { min: 0.1, max: null, price: 2999.99, label: '100ml+' }
      ]
    },
    units: {
      name: 'General Products (Units)',
      description: 'Generic unit-based pricing',
      unitType: 'units',
      productType: 'general',
      breaks: [
        { min: 1, max: 1, price: 19.99, label: '1 Unit' },
        { min: 3, max: 5, price: 49.99, label: '3-5 Units' },
        { min: 6, max: null, price: 89.99, label: '6+ Units' }
      ]
    }
  };

  /**
   * Generate a pricing rule for a category based on its unit of measure
   */
  static generatePricingRuleForCategory(
    category: WooCategory,
    blueprintId: number = 34,
    customTemplate?: Partial<PricingTemplate>
  ): BlueprintPricingRule {
    const unit = category.unit || 'units';
    const template = customTemplate ? 
      { ...this.PRICING_TEMPLATES[unit], ...customTemplate } : 
      this.PRICING_TEMPLATES[unit] || this.PRICING_TEMPLATES.units;

    const productType = this.UNIT_TO_PRODUCT_TYPE_MAP[unit] || 'general';

    return {
      blueprint_id: blueprintId,
      rule_name: `${category.name} - ${template.name}`,
      rule_type: 'quantity_break',
      priority: 10,
      filters: {
        product_type: productType,
        channels: ['pos', 'online'],
        stores: ['charlotte'], // Default store, should be configurable
        customer_tiers: ['retail']
      },
      unit: unit,
      currency: 'USD',
      breaks: template.breaks.map(breakItem => ({
        min: breakItem.min,
        max: breakItem.max,
        price_cents: Math.round(breakItem.price * 100)
      })),
      valid_from: null,
      valid_to: null,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Legacy support
      conditions: {
        category_id: category.id,
        unit_type: unit,
        min_quantity: template.breaks[0]?.min || 1
      },
      formula: template.breaks[0]?.price.toString() || '19.99'
    };
  }

  /**
   * Generate pricing rules for multiple categories
   */
  static generatePricingRulesForCategories(
    categories: WooCategory[],
    blueprintId: number = 34,
    customTemplates?: Record<string, Partial<PricingTemplate>>
  ): BlueprintPricingRule[] {
    return categories.map(category => {
      const unit = category.unit || 'units';
      const customTemplate = customTemplates?.[unit];
      return this.generatePricingRuleForCategory(category, blueprintId, customTemplate);
    });
  }

  /**
   * Get available pricing template for a unit
   */
  static getTemplateForUnit(unit: string): PricingTemplate | null {
    return this.PRICING_TEMPLATES[unit] || null;
  }

  /**
   * Get all available pricing templates
   */
  static getAllTemplates(): Record<string, PricingTemplate> {
    return { ...this.PRICING_TEMPLATES };
  }

  /**
   * Get product type for a unit
   */
  static getProductTypeForUnit(unit: string): string {
    return this.UNIT_TO_PRODUCT_TYPE_MAP[unit] || 'general';
  }

  /**
   * Validate a blueprint pricing rule
   */
  static validateBlueprintPricingRule(rule: BlueprintPricingRule): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!rule.rule_name?.trim()) {
      errors.push('Rule name is required');
    }

    if (!rule.unit?.trim()) {
      errors.push('Unit is required');
    }

    if (!rule.breaks || rule.breaks.length === 0) {
      errors.push('At least one pricing break is required');
    }

    if (rule.breaks) {
      rule.breaks.forEach((breakItem, index) => {
        if (breakItem.min < 0) {
          errors.push(`Break ${index + 1}: Minimum quantity cannot be negative`);
        }
        if (breakItem.max !== null && breakItem.max !== undefined && breakItem.max < breakItem.min) {
          errors.push(`Break ${index + 1}: Maximum quantity cannot be less than minimum`);
        }
        if (breakItem.price_cents < 0) {
          errors.push(`Break ${index + 1}: Price cannot be negative`);
        }
      });
    }

    if (rule.priority < 1 || rule.priority > 100) {
      errors.push('Priority must be between 1 and 100');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert legacy pricing rule to blueprint format
   */
  static convertLegacyToBlueprintFormat(
    legacyRule: PricingRule,
    category: WooCategory,
    blueprintId: number = 34
  ): BlueprintPricingRule {
    const unit = category.unit || 'units';
    const productType = this.UNIT_TO_PRODUCT_TYPE_MAP[unit] || 'general';

    // Try to parse conditions to get quantity breaks
    let breaks: BlueprintPricingRule['breaks'] = [];
    if (legacyRule.conditions && typeof legacyRule.conditions === 'object') {
      const minQty = legacyRule.conditions.min_quantity || 1;
      const maxQty = legacyRule.conditions.max_quantity;
      const price = parseFloat(legacyRule.formula) || 0;

      breaks = [{
        min: minQty,
        max: maxQty || null,
        price_cents: Math.round(price * 100)
      }];
    } else {
      // Default single break
      const price = parseFloat(legacyRule.formula) || 0;
      breaks = [{
        min: 1,
        max: null,
        price_cents: Math.round(price * 100)
      }];
    }

    return {
      id: legacyRule.id,
      blueprint_id: blueprintId,
      rule_name: legacyRule.rule_name,
      rule_type: legacyRule.rule_type === 'quantity_break' ? 'quantity_break' : 'fixed_price',
      priority: legacyRule.priority,
      filters: {
        product_type: productType,
        channels: ['pos', 'online'],
        stores: ['charlotte'],
        customer_tiers: ['retail']
      },
      unit: unit,
      currency: 'USD',
      breaks: breaks,
      valid_from: legacyRule.start_date || null,
      valid_to: legacyRule.end_date || null,
      active: legacyRule.is_active,
      created_at: legacyRule.created_at,
      updated_at: legacyRule.updated_at,
      // Keep legacy fields for backward compatibility
      conditions: legacyRule.conditions,
      formula: legacyRule.formula
    };
  }

  /**
   * Export pricing rules in the correct blueprint format
   */
  static exportBlueprintPricingRules(rules: BlueprintPricingRule[]): string {
    return JSON.stringify(rules, null, 2);
  }

  /**
   * Import and validate pricing rules from JSON
   */
  static importBlueprintPricingRules(jsonString: string): { 
    rules: BlueprintPricingRule[]; 
    errors: string[] 
  } {
    const errors: string[] = [];
    let rules: BlueprintPricingRule[] = [];

    try {
      const parsed = JSON.parse(jsonString);
      
      if (!Array.isArray(parsed)) {
        errors.push('JSON must be an array of pricing rules');
        return { rules: [], errors };
      }

      rules = parsed;
      
      // Validate each rule
      rules.forEach((rule, index) => {
        const validation = this.validateBlueprintPricingRule(rule);
        if (!validation.valid) {
          errors.push(`Rule ${index + 1}: ${validation.errors.join(', ')}`);
        }
      });

    } catch (err) {
      errors.push('Invalid JSON format');
    }

    return { rules, errors };
  }
}