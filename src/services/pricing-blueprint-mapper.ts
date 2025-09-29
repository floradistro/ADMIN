/**
 * Pricing Blueprint Mapper
 * Maps pricing rules to blueprints based on rule names and types
 * This is a workaround until the database is properly updated
 */

export const PRICING_BLUEPRINT_MAPPINGS: Record<number, string[]> = {
  // Flower Blueprint (ID: 41)
  41: ['flower pricing', 'flower tier'],
  
  // Concentrate Blueprint (ID: 42)
  42: ['concentrate pricing', 'concentrate tier'],
  
  // Edible Blueprint (ID: 43)
  43: ['edible', 'day drinker', 'golden hour', 'darkside', 'riptide'],
  
  // Preroll Blueprint (ID: 44)
  44: ['pre-roll', 'preroll'],
  
  // Vape Blueprint (ID: 45)
  45: ['vape pricing', 'vape tier']
};

/**
 * Determines the blueprint ID for a pricing rule based on its name and filters
 */
export function getBlueprintIdForPricingRule(rule: any): number | null {
  // First check if blueprint_id is already set
  if (rule.blueprint_id && rule.blueprint_id > 0) {
    return rule.blueprint_id;
  }
  
  // Check by rule name
  const ruleName = (rule.rule_name || '').toLowerCase();
  
  for (const [blueprintId, patterns] of Object.entries(PRICING_BLUEPRINT_MAPPINGS)) {
    for (const pattern of patterns) {
      if (ruleName.includes(pattern.toLowerCase())) {
        return parseInt(blueprintId);
      }
    }
  }
  
  // Check by product type in filters
  if (rule.filters?.product_type) {
    const productType = rule.filters.product_type.toLowerCase();
    if (productType.includes('flower')) return 41;
    if (productType.includes('concentrate')) return 42;
    if (productType.includes('edible')) return 43;
    if (productType.includes('preroll') || productType.includes('pre-roll')) return 44;
    if (productType.includes('vape')) return 45;
  }
  
  // Check by conditions if they exist
  if (rule.conditions?.product_type) {
    const productType = rule.conditions.product_type.toLowerCase();
    if (productType.includes('flower')) return 41;
    if (productType.includes('concentrate')) return 42;
    if (productType.includes('edible')) return 43;
    if (productType.includes('preroll') || productType.includes('pre-roll')) return 44;
    if (productType.includes('vape')) return 45;
  }
  
  return null;
}

/**
 * Filters pricing rules by blueprint ID using smart matching
 */
export function filterPricingRulesByBlueprint(rules: any[], blueprintId: number): any[] {
  return rules.filter(rule => {
    const ruleBlueprintId = getBlueprintIdForPricingRule(rule);
    return ruleBlueprintId === blueprintId;
  });
}