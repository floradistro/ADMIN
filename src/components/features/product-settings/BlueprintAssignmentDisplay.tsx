import React, { useState, useEffect } from 'react';
import { floraFieldsAPI } from '@/services/flora-fields-api';
import { pricingAPI } from '@/services/pricing-api';
import { filterPricingRulesByBlueprint } from '@/services/pricing-blueprint-mapper';

interface BlueprintAssignment {
  id: number;
  blueprint_id: number;
  blueprint_name: string;
  blueprint_label: string;
  entity_type: 'product' | 'category';
  entity_id?: number;
  category_id?: number;
  scope_type: 'specific' | 'category' | 'global';
  include_descendants: boolean;
  assignment_mode: 'include' | 'exclude';
  priority: number;
  conditions?: Record<string, any>;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface BlueprintField {
  id: number;
  blueprint_id: number;
  field_name: string;
  field_type: string;
  field_label: string;
  field_description: string;
  field_default_value?: any;
  validation_rules?: Record<string, any>;
  display_options?: Record<string, any>;
  is_required: boolean;
  is_searchable: boolean;
  sort_order: number;
  status: string;
}

interface PricingRule {
  id: number;
  blueprint_id?: number;
  product_id?: number;
  rule_name: string;
  rule_type: string;
  priority: number;
  unit?: string;
  currency?: string;
  conditions?: any;
  formula?: string;
  filters?: {
    product_type?: string;
    channels?: string[];
    stores?: string[];
    customer_tiers?: string[];
  };
  breaks?: Array<{
    min_quantity?: number;
    max_quantity?: number;
    min?: number;
    max?: number;
    price?: number;
    price_cents?: number;
    discount?: number;
  }>;
  active?: boolean;
  is_active?: boolean;
}

interface BlueprintAssignmentDisplayProps {
  categoryId: number;
  className?: string;
}

export function BlueprintAssignmentDisplay({ categoryId, className = '' }: BlueprintAssignmentDisplayProps) {
  const [assignments, setAssignments] = useState<BlueprintAssignment[]>([]);
  const [blueprintDetails, setBlueprintDetails] = useState<Record<number, {
    fields: BlueprintField[];
    pricingRules: PricingRule[];
    blueprint?: any;
  }>>({});
  const [expandedBlueprints, setExpandedBlueprints] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategoryAssignments();
  }, [categoryId]);

  const fetchCategoryAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      
      let categoryAssignments: BlueprintAssignment[] = [];
      
      try {
        // Try the category-specific endpoint first
        categoryAssignments = await floraFieldsAPI.getCategoryBlueprintAssignments(categoryId);
      } catch (apiError) {
        
        // Fallback: Get all assignments and filter client-side
        try {
          const allAssignments = await floraFieldsAPI.getBlueprintAssignments();
          categoryAssignments = allAssignments.filter(assignment => 
            assignment.entity_type === 'category' && 
            assignment.category_id === categoryId
          );
        } catch (fallbackError) {
          throw fallbackError;
        }
      }
      
      // Additional client-side filtering to ensure we only get assignments for this specific category
      const filteredAssignments = categoryAssignments.filter(assignment => 
        assignment.entity_type === 'category' && 
        assignment.category_id === categoryId
      );
      
      setAssignments(filteredAssignments);
      
      // Fetch details for each assigned blueprint
      const details: Record<number, { fields: BlueprintField[]; pricingRules: PricingRule[]; blueprint?: any }> = {};
      
      for (const assignment of filteredAssignments) {
        try {
          
          // Fetch blueprint fields
          let fields: BlueprintField[] = [];
          try {
            fields = await floraFieldsAPI.getBlueprintFields(assignment.blueprint_id);
          } catch (fieldsError) {
          }
          
          // Fetch blueprint pricing rules using the same method as BlueprintDesigner
          let pricingRules: any[] = [];
          try {
            // Get all pricing rules and filter by blueprint_id (same as BlueprintDesigner)
            const pricingResponse = await pricingAPI.getPricingRules(0, true);
            
            // Debug: Show conditions for each rule (removed)
            
            // Filter rules for this specific blueprint
            const allRules = pricingResponse.rules || [];
            pricingRules = allRules.filter((rule: any) => {
              // Check if blueprint_id is in the conditions field
              if (rule.conditions) {
                let conditions = rule.conditions;
                // Parse if it's a string
                if (typeof conditions === 'string') {
                  try {
                    conditions = JSON.parse(conditions);
                  } catch (e) {
                    return false;
                  }
                }
                // Check if this rule is associated with the current blueprint
                if (conditions.blueprint_id === assignment.blueprint_id) {
                  return true;
                }
              }
              // Also check direct blueprint_id field as fallback
              if (rule.blueprint_id === assignment.blueprint_id) {
                return true;
              }
              return false;
            });
            
          } catch (pricingError) {
          }
          
          // Try to get blueprint details from the main blueprint endpoint
          let blueprintDetails: any = null;
          try {
            blueprintDetails = await floraFieldsAPI.getBlueprint(assignment.blueprint_id);
          } catch (blueprintError) {
          }
          
          details[assignment.blueprint_id] = {
            fields: fields || [],
            pricingRules: pricingRules || [],
            blueprint: blueprintDetails
          };
        } catch (err) {
          details[assignment.blueprint_id] = { fields: [], pricingRules: [], blueprint: null };
        }
      }
      
      setBlueprintDetails(details);
    } catch (err) {
      setError('Failed to load blueprint assignments');
    } finally {
      setLoading(false);
    }
  };

  const toggleBlueprintExpansion = (blueprintId: number) => {
    setExpandedBlueprints(prev => {
      const next = new Set(prev);
      if (next.has(blueprintId)) {
        next.delete(blueprintId);
      } else {
        next.add(blueprintId);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <div className="w-3 h-3 border border-neutral-600 border-t-transparent rounded-full animate-spin"></div>
          Loading blueprints...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="text-xs text-red-400">
          {error}
        </div>
      </div>
    );
  }

  if (assignments.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
        <div className="text-xs font-medium text-neutral-300">
          Blueprint Assignments ({assignments.length})
        </div>
      </div>

      <div className="space-y-1">
        {assignments.map((assignment) => {
          const isExpanded = expandedBlueprints.has(assignment.blueprint_id);
          const details = blueprintDetails[assignment.blueprint_id];
          
          // Details loaded and expanded
          
          return (
            <div key={assignment.id} className="bg-neutral-900/30 rounded border border-white/[0.04]">
              {/* Blueprint Header */}
              <button
                onClick={() => toggleBlueprintExpansion(assignment.blueprint_id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-neutral-800/30 smooth-hover"
              >
                <svg
                  className={`w-3 h-3 text-neutral-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-medium text-blue-400 truncate">
                      {assignment.blueprint_label || assignment.blueprint_name}
                    </div>
                    <div className="flex items-center gap-1">
                      {assignment.include_descendants && (
                        <div className="text-xs px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
                          +children
                        </div>
                      )}
                      <div className={`text-xs px-1.5 py-0.5 rounded ${
                        assignment.assignment_mode === 'include' 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {assignment.assignment_mode}
                      </div>
                    </div>
                  </div>
                  
                  {details && (
                    <div className="text-xs text-neutral-500 mt-0.5">
                      {details.fields.length} fields • {details.pricingRules.length} pricing rules
                    </div>
                  )}
                </div>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-white/[0.04] px-3 py-3 space-y-4">
                  
                  {/* Blueprint Info Section */}
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-neutral-300 mb-2">Blueprint Information</div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="text-neutral-500">Name:</div>
                        <div className="text-neutral-300">{assignment.blueprint_name}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-neutral-500">Label:</div>
                        <div className="text-neutral-300">{assignment.blueprint_label || 'N/A'}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-neutral-500">Priority:</div>
                        <div className="text-neutral-300">{assignment.priority}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-neutral-500">Scope:</div>
                        <div className="text-neutral-300">{assignment.scope_type}</div>
                      </div>
                    </div>
                  </div>

                  {/* Fields Section */}
                  <div>
                    <div className="text-xs font-medium text-neutral-300 mb-2 flex items-center justify-between">
                      <span>Fields & Traits</span>
                      <span className="text-neutral-500">({details?.fields?.length || 0} fields)</span>
                    </div>
                    
                    {details?.fields && details.fields.length > 0 ? (
                      <div className="space-y-2">
                        {details.fields.map((field) => (
                          <div key={field.id} className="bg-neutral-800/30 rounded-lg p-3 border border-white/[0.04]">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-medium text-neutral-200">{field.field_label}</div>
                                  {field.is_required && (
                                    <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">Required</span>
                                  )}
                                  {field.is_searchable && (
                                    <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">Searchable</span>
                                  )}
                                </div>
                                <div className="text-xs text-neutral-400 mt-1">{field.field_name}</div>
                              </div>
                              <div className="text-xs bg-neutral-700/50 text-neutral-300 px-2 py-1 rounded">
                                {field.field_type}
                              </div>
                            </div>
                            
                            {field.field_description && (
                              <div className="text-xs text-neutral-400 mb-2">{field.field_description}</div>
                            )}
                            
                            {field.field_default_value && (
                              <div className="text-xs text-neutral-500">
                                <span className="text-neutral-400">Default:</span> {field.field_default_value}
                              </div>
                            )}
                            
                            {field.validation_rules && Object.keys(field.validation_rules).length > 0 && (
                              <div className="text-xs text-neutral-500 mt-1">
                                <span className="text-neutral-400">Validation:</span> {JSON.stringify(field.validation_rules)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-neutral-500 italic py-2">No fields defined for this blueprint</div>
                    )}
                  </div>

                  {/* Pricing Rules Section */}
                  <div>
                    <div className="text-xs font-medium text-neutral-300 mb-2 flex items-center justify-between">
                      <span>Pricing Rules</span>
                      <span className="text-neutral-500">({details?.pricingRules?.length || 0} rules)</span>
                    </div>
                    
                    {details?.pricingRules && details.pricingRules.length > 0 ? (
                      <div className="space-y-2">
                        {details.pricingRules.map((rule) => (
                          <div key={rule.id} className="bg-neutral-800/30 rounded-lg p-3 border border-white/[0.04]">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-sm font-medium text-neutral-200">{rule.rule_name}</div>
                              <div className="flex items-center gap-2">
                                <div className="text-xs bg-neutral-700/50 text-neutral-300 px-2 py-1 rounded">
                                  {rule.rule_type}
                                </div>
                                <div className={`w-2 h-2 rounded-full ${(rule.active || rule.is_active) ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 text-xs mb-2">
                              <div>
                                <span className="text-neutral-400">Unit:</span> 
                                <span className="text-neutral-300 ml-1">{rule.unit || 'units'}</span>
                              </div>
                              <div>
                                <span className="text-neutral-400">Currency:</span> 
                                <span className="text-neutral-300 ml-1">{rule.currency || 'USD'}</span>
                              </div>
                              <div>
                                <span className="text-neutral-400">Priority:</span> 
                                <span className="text-neutral-300 ml-1">{rule.priority || 0}</span>
                              </div>
                              <div>
                                <span className="text-neutral-400">Status:</span> 
                                <span className={`ml-1 ${(rule.active || rule.is_active) ? 'text-green-400' : 'text-red-400'}`}>
                                  {(rule.active || rule.is_active) ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </div>
                            
                            {/* Filters Section */}
                            {rule.filters && (
                              <div className="mb-2">
                                <div className="text-xs text-neutral-400 mb-1">Filters:</div>
                                <div className="flex flex-wrap gap-1">
                                  {rule.filters.product_type && (
                                    <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
                                      {rule.filters.product_type}
                                    </span>
                                  )}
                                  {rule.filters.channels && rule.filters.channels.map((channel: string) => (
                                    <span key={channel} className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
                                      {channel}
                                    </span>
                                  ))}
                                  {rule.filters.customer_tiers && rule.filters.customer_tiers.map((tier: string) => (
                                    <span key={tier} className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">
                                      {tier}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {rule.breaks && rule.breaks.length > 0 && (
                              <div className="mt-2">
                                <div className="text-xs text-neutral-400 mb-1">Price Breaks:</div>
                                <div className="space-y-1">
                                  {rule.breaks.map((priceBreak: any, index: number) => (
                                    <div key={index} className="flex items-center justify-between text-xs bg-neutral-900/50 px-2 py-1 rounded">
                                      <div className="text-neutral-300">
                                        {priceBreak.min || priceBreak.min_quantity}
                                        {(priceBreak.max || priceBreak.max_quantity) ? `-${priceBreak.max || priceBreak.max_quantity}` : '+'} {rule.unit || 'units'}
                                      </div>
                                      <div className="text-neutral-200 font-medium">
                                        ${priceBreak.price_cents ? (priceBreak.price_cents / 100).toFixed(2) : (priceBreak.price || '0.00')}
                                        {priceBreak.discount && (
                                          <span className="text-green-400 ml-1">(-{priceBreak.discount}%)</span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {rule.formula && (
                              <div className="mt-2 text-xs">
                                <span className="text-neutral-400">Formula:</span>
                                <div className="bg-neutral-900/50 px-2 py-1 rounded mt-1 text-neutral-300 font-mono">
                                  {rule.formula}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-neutral-500 italic py-2">No pricing rules defined for this blueprint</div>
                    )}
                  </div>

                  {/* Assignment Conditions */}
                  {assignment.conditions && Object.keys(assignment.conditions).length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-neutral-300 mb-2">Assignment Conditions</div>
                      <div className="bg-neutral-800/30 rounded-lg p-3 border border-white/[0.04]">
                        <pre className="text-xs text-neutral-300 font-mono">
                          {JSON.stringify(assignment.conditions, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Assignment Metadata */}
                  <div className="pt-2 border-t border-white/[0.04]">
                    <div className="text-xs text-neutral-500 space-y-1">
                      <div>
                        <span className="text-neutral-400">Assignment Mode:</span> 
                        <span className={`ml-1 ${assignment.assignment_mode === 'include' ? 'text-green-400' : 'text-red-400'}`}>
                          {assignment.assignment_mode}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-400">Include Descendants:</span> 
                        <span className={`ml-1 ${assignment.include_descendants ? 'text-green-400' : 'text-neutral-300'}`}>
                          {assignment.include_descendants ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-400">Created:</span> 
                        <span className="text-neutral-300 ml-1">
                          {new Date(assignment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-400">Updated:</span> 
                        <span className="text-neutral-300 ml-1">
                          {new Date(assignment.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}