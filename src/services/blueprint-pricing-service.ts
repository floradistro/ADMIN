/**
 * Blueprint Pricing Service - Clean Rewrite
 * 
 * Simple logic: Product → Category → Blueprint Assignment → Blueprint Pricing Rules
 */

import { floraFieldsAPI } from './flora-fields-api';
import { pricingAPI } from './pricing-api';

export interface BlueprintPricingTier {
  min: number;
  max?: number | null;
  price: number;
  unit: string;
  label: string;
  ruleName?: string; // Added to track which rule this tier comes from
}

export interface BlueprintPricingRuleGroup {
  ruleName: string;
  ruleId: string;
  productType?: string;
  tiers: BlueprintPricingTier[];
}

export interface BlueprintPricingData {
  productId: number;
  blueprintId: number;
  blueprintName: string;
  rules: any[];
  ruleGroups: BlueprintPricingRuleGroup[]; // Grouped by rule instead of flat tiers
  tiers: BlueprintPricingTier[]; // Keep for backward compatibility
  currency: string;
  unit: string;
  productType?: string;
}

export class BlueprintPricingService {
  
  /**
   * Get Blueprint pricing data for a product - CLEAN IMPLEMENTATION
   */
  static async getBlueprintPricingForProduct(productId: number, productData?: any): Promise<BlueprintPricingData | null> {
    try {
      
      // STEP 1: Get the blueprint assigned to this product's category
      const blueprintAssignment = await this.findBlueprintAssignmentForProduct(productId, productData);
      
      if (!blueprintAssignment) {
        return null;
      }
      
      
      // STEP 2: Get ONLY the pricing rules for this specific blueprint
      const blueprintRules = await this.getPricingRulesForBlueprint(blueprintAssignment.blueprint_id);
      
      if (!blueprintRules || blueprintRules.length === 0) {
        return null;
      }
      
      
      // STEP 3: Convert rules to grouped tiers
      const ruleGroups = this.convertRulesToGroupedTiers(blueprintRules);
      
      if (ruleGroups.length === 0) {
        return null;
      }
      
      // Also create flat tiers array for backward compatibility
      const allTiers = ruleGroups.flatMap(group => group.tiers);
      
      
      return {
        productId,
        blueprintId: blueprintAssignment.blueprint_id,
        blueprintName: blueprintAssignment.blueprint_name,
        rules: blueprintRules,
        ruleGroups,
        tiers: allTiers,
        currency: 'USD',
        unit: allTiers[0]?.unit || 'units',
        productType: this.extractProductTypeFromRules(blueprintRules)
      };
      
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Find the blueprint assignment for a product
   */
  private static async findBlueprintAssignmentForProduct(productId: number, productData?: any): Promise<any | null> {
    try {
      // Get all blueprint assignments
      const assignments = await floraFieldsAPI.getBlueprintAssignments();
      
      // Check for direct product assignment first
      const directAssignment = assignments.find(assignment => 
        assignment.entity_type === 'product' && assignment.entity_id === productId
      );
      
      if (directAssignment) {
        return directAssignment;
      }
      
      // Check for category-based assignment
      if (!productData?.categories || productData.categories.length === 0) {
        return null;
      }
      

      
      // Find category assignments
      const categoryAssignments = assignments.filter(assignment => assignment.entity_type === 'category');
      
      for (const category of productData.categories) {
        const categoryId = parseInt(category.id);
        const assignment = categoryAssignments.find(assignment => assignment.category_id === categoryId);
        
        if (assignment) {
          return assignment;
        }
      }
      
      return null;
      
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Get pricing rules for a specific blueprint ONLY
   */
  private static async getPricingRulesForBlueprint(blueprintId: number): Promise<any[]> {
    try {
      // Get all pricing rules
      const response = await pricingAPI.getPricingRules();
      
      let allRules = [];
      if (Array.isArray(response)) {
        allRules = response;
      } else if (response && Array.isArray(response.rules)) {
        allRules = response.rules;
      } else {
        return [];
      }
      
      
      // Filter rules that belong to this specific blueprint
      const blueprintRules = allRules.filter(rule => {
        try {
          // Parse conditions to get blueprint_id
          let conditions = rule.conditions;
          if (typeof conditions === 'string') {
            conditions = JSON.parse(conditions);
          }
          
          const ruleBlueprintId = conditions.blueprint_id;
          const matches = ruleBlueprintId == blueprintId;
          
          if (matches) {
          }
          
          return matches;
          
        } catch (error) {
          return false;
        }
      });
      
      
      return blueprintRules;
      
    } catch (error) {
      return [];
    }
  }
  
  /**
   * Convert pricing rules to grouped tiers (organized by rule)
   */
  private static convertRulesToGroupedTiers(rules: any[]): BlueprintPricingRuleGroup[] {
    const ruleGroups: BlueprintPricingRuleGroup[] = [];
    
    
    for (const rule of rules) {
      
      const ruleTiers: BlueprintPricingTier[] = [];
      let productType = 'general';
      
      try {
        // Parse conditions
        let conditions = rule.conditions;
        if (typeof conditions === 'string') {
          conditions = JSON.parse(conditions);
        }
        
        // Extract unit type and product type
        const unit = conditions.unit_type || 'units';
        productType = conditions.product_type || 'general';
        
        // Check if tiers exist in conditions
        if (conditions.tiers && Array.isArray(conditions.tiers)) {
          
          for (const tier of conditions.tiers) {
            const price = parseFloat(tier.price || '0');
            const min = tier.min_quantity || 1;
            const max = tier.max_quantity;
            const label = tier.name || `${min}${max ? `-${max}` : '+'} ${unit}`;
            
            ruleTiers.push({
              min,
              max,
              price,
              unit,
              label,
              ruleName: rule.rule_name
            });
            
          }
        } 
        // Check if pricing is in the formula field (JSON format)
        else if (rule.formula && rule.formula.startsWith('{')) {
          
          try {
            const formulaObj = JSON.parse(rule.formula);
            
            for (const [quantity, price] of Object.entries(formulaObj)) {
              const min = parseInt(quantity);
              const priceNum = parseFloat(price as string);
              const label = `${min} ${unit}`;
              
              ruleTiers.push({
                min,
                max: min, // For exact quantities
                price: priceNum,
                unit,
                label,
                ruleName: rule.rule_name
              });
              
            }
          } catch (e) {
          }
        } 
        else {
        }
        
      } catch (error) {
      }
      
      // Only add rule group if it has tiers
      if (ruleTiers.length > 0) {
        // Sort tiers within this rule by minimum quantity
        ruleTiers.sort((a, b) => a.min - b.min);
        
        ruleGroups.push({
          ruleName: rule.rule_name,
          ruleId: rule.id.toString(),
          productType,
          tiers: ruleTiers
        });
        
      }
    }
    
    
    return ruleGroups;
  }
  
  /**
   * Extract product type from rules
   */
  private static extractProductTypeFromRules(rules: any[]): string {
    for (const rule of rules) {
      try {
        let conditions = rule.conditions;
        if (typeof conditions === 'string') {
          conditions = JSON.parse(conditions);
        }
        
        if (conditions.product_type) {
          return conditions.product_type;
        }
      } catch (error) {
        // Ignore parse errors
      }
    }
    
    return 'general';
  }
}