import React, { useState, useEffect } from 'react';
import { Button, JsonPopout, Card } from '../../ui';
import { floraFieldsAPI } from '../../../services/flora-fields-api';
import { pricingAPI } from '../../../services/pricing-api';
import { categoriesService } from '../../../services/categories-service';
import { PricingRuleGenerator } from './PricingRuleGenerator';

const JSON_TEMPLATES = {
  pricing_rules: {
    name: 'Pricing Rules Template',
    description: 'Template for creating multiple pricing rules',
    template: [
      {
        rule_name: 'FLOWER - 1g',
        rule_type: 'quantity_break',
        formula: '14.99',
        conditions: {
          product_type: 'flower',
          min_quantity: 1,
          unit_type: 'grams'
        },
        priority: 10,
        is_active: true
      },
      {
        rule_name: 'FLOWER - 3.5g',
        rule_type: 'quantity_break',
        formula: '39.99',
        conditions: {
          product_type: 'flower',
          min_quantity: 3.5,
          unit_type: 'grams'
        },
        priority: 20,
        is_active: true
      },
      {
        rule_name: 'FLOWER - 7g',
        rule_type: 'quantity_break',
        formula: '69.99',
        conditions: {
          product_type: 'flower',
          min_quantity: 7,
          unit_type: 'grams'
        },
        priority: 30,
        is_active: true
      }
    ]
  },
  blueprint_fields: {
    name: 'Blueprint Fields Template',
    description: 'Template for creating blueprint fields',
    template: [
      {
        field_name: 'strain_type',
        field_type: 'select',
        field_label: 'Strain Type',
        field_description: 'Type of cannabis strain',
        field_default_value: '',
        validation_rules: {
          options: ['indica', 'sativa', 'hybrid']
        },
        display_options: {},
        is_required: true,
        is_searchable: true,
        sort_order: 0
      },
      {
        field_name: 'thc_percentage',
        field_type: 'number',
        field_label: 'THC %',
        field_description: 'THC percentage',
        field_default_value: '',
        validation_rules: {
          min: 0,
          max: 100
        },
        display_options: {
          suffix: '%'
        },
        is_required: false,
        is_searchable: true,
        sort_order: 1
      }
    ]
  },
  blueprint_assignments: {
    name: 'Blueprint Assignments Template',
    description: 'Template for creating blueprint assignments',
    template: [
      {
        blueprint_id: 34,
        entity_type: 'product',
        scope_type: 'category',
        category_id: 25,
        include_descendants: true,
        assignment_mode: 'include',
        priority: 0,
        sort_order: 0,
        is_active: true
      }
    ]
  },
  categories: {
    name: 'Categories Template',
    description: 'Template for creating and managing WooCommerce categories',
    template: [
      {
        name: 'Cannabis Flower',
        slug: 'cannabis-flower',
        parent: 0,
        description: 'Premium cannabis flower products',
        display: 'default',
        image: null,
        menu_order: 0,
        unit: 'grams'
      },
      {
        name: 'Indica',
        slug: 'indica',
        parent: 0, // Will be updated to parent category ID after creation
        description: 'Relaxing indica strains',
        display: 'default',
        image: null,
        menu_order: 1,
        unit: 'grams'
      },
      {
        name: 'Sativa',
        slug: 'sativa',
        parent: 0, // Will be updated to parent category ID after creation
        description: 'Energizing sativa strains',
        display: 'default',
        image: null,
        menu_order: 2,
        unit: 'grams'
      },
      {
        name: 'Edibles',
        slug: 'edibles',
        parent: 0,
        description: 'Cannabis-infused edible products',
        display: 'default',
        image: null,
        menu_order: 3,
        unit: 'pieces'
      },
      {
        name: 'Concentrates',
        slug: 'concentrates',
        parent: 0,
        description: 'Cannabis concentrates and extracts',
        display: 'default',
        image: null,
        menu_order: 4,
        unit: 'grams'
      }
    ]
  }
};

export function JsonEditorTab() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [jsonData, setJsonData] = useState<any>({});
  const [showEditor, setShowEditor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'generator' | 'manual'>('generator');

  const handleTemplateSelect = (templateKey: string) => {
    const template = JSON_TEMPLATES[templateKey as keyof typeof JSON_TEMPLATES];
    if (template) {
      setJsonData(template.template);
      setSelectedTemplate(templateKey);
      setShowEditor(true);
    }
  };

  const handleSave = async (data: any) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (selectedTemplate === 'pricing_rules') {
        // Save pricing rules
        if (Array.isArray(data)) {
          for (const rule of data) {
            await pricingAPI.createPricingRule({
              product_id: rule.product_id || 0,
              rule_name: rule.rule_name,
              rule_type: rule.rule_type,
              priority: rule.priority || 10,
              conditions: rule.conditions,
              formula: rule.formula,
              is_active: rule.is_active !== false
            });
          }
          setSuccess(`Successfully created ${data.length} pricing rules!`);
        }
      } else if (selectedTemplate === 'blueprint_fields') {
        // Save blueprint fields
        if (Array.isArray(data)) {
          for (const field of data) {
            await floraFieldsAPI.createBlueprintField(field.blueprint_id || 34, field);
          }
          setSuccess(`Successfully created ${data.length} blueprint fields!`);
        }
      } else if (selectedTemplate === 'blueprint_assignments') {
        // Save blueprint assignments
        if (Array.isArray(data)) {
          for (const assignment of data) {
            await floraFieldsAPI.createBlueprintAssignment(assignment);
          }
          setSuccess(`Successfully created ${data.length} blueprint assignments!`);
        }
      } else if (selectedTemplate === 'categories') {
        // Save categories
        if (Array.isArray(data)) {
          const result = await categoriesService.bulkCreateCategories(data);
          setSuccess(`Successfully created ${result.data.created} categories!`);
          if (result.data.errors.length > 0) {
            setError(`Some categories failed: ${result.data.errors.join(', ')}`);
          }
        }
      }
      
      // Auto-close after 2 seconds on success
      setTimeout(() => {
        setShowEditor(false);
        setSelectedTemplate('');
        setSuccess(null);
      }, 2000);
    } catch (err) {
      
      // Check if it's a 404 error (plugin not active)
      if (err instanceof Error && err.message.includes('404')) {
        setError('BluePrints plugin API not available. Please ensure the Flora Fields plugin is active on your WordPress site.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to save data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowEditor(false);
    setSelectedTemplate('');
    setJsonData({});
  };

  return (
    <div className="p-4 bg-neutral-800/30 hover:bg-neutral-800/50 row-hover border-t border-white/[0.02] rounded h-full">
      <div className="space-y-6 h-full flex flex-col">
        {/* Tab Navigation */}
        <div className="border border-white/[0.04] rounded-lg p-4 bg-neutral-900/20 flex-shrink-0">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('generator')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium smooth-hover ${
              activeTab === 'generator'
                ? 'bg-neutral-900/60 text-neutral-200 border border-white/[0.1]'
                : 'text-neutral-400 hover:text-neutral-300 hover:bg-neutral-900/40'
            }`}
          >
            Smart Pricing Generator
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium smooth-hover ${
              activeTab === 'manual'
                ? 'bg-neutral-900/60 text-neutral-200 border border-white/[0.1]'
                : 'text-neutral-400 hover:text-neutral-300 hover:bg-neutral-900/40'
            }`}
          >
            Manual JSON Editor
          </button>
        </div>
      </div>

        {/* Content based on active tab */}
        <div className="flex-1 min-h-0">
          {activeTab === 'generator' ? (
            <div className="h-full">
              <PricingRuleGenerator 
                onRulesGenerated={(rules) => {
                  setSuccess(`Generated ${rules.length} pricing rules successfully!`);
                }}
              />
            </div>
          ) : (
            <div className="space-y-6 h-full overflow-y-auto scrollable-container">
          <div className="border border-white/[0.04] rounded-lg p-4 bg-neutral-900/20">
            <h3 className="text-sm font-medium text-neutral-300 mb-2">JSON Template Editor</h3>
            <p className="text-xs text-neutral-500 mb-4">
              Create and import data using JSON templates. Perfect for bulk operations and quick setup.
            </p>
        
            {/* Plugin Status Warning */}
            <div className="p-3 border border-red-500/20 rounded text-neutral-400 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <div className="font-medium">Backend Plugin Required</div>
                  <div className="text-xs text-neutral-500 mt-1">
                    The Flora Fields BluePrints plugin must be active on your WordPress site for saving to work. 
                    You can still use this editor to generate and copy JSON for manual import.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-500/20 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-900/20 border border-green-500/20 rounded text-green-400 text-sm">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(JSON_TEMPLATES).map(([key, template]) => (
              <div 
                key={key} 
                className="rounded-lg bg-neutral-900/40 hover:bg-neutral-800/50 transition-all cursor-pointer p-4 border-b border-white/[0.02]"
                onClick={() => handleTemplateSelect(key)}
              >
                <div className="mb-3">
                  <h3 className="text-neutral-400 font-medium text-sm">{template.name}</h3>
                </div>
                <p className="text-neutral-600 text-xs mb-4">{template.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600 text-xs">
                    {Array.isArray(template.template) ? `${template.template.length} items` : 'Object'}
                  </span>
                  <Button size="sm" variant="ghost" className="text-xs text-neutral-500 hover:text-neutral-400">
                    Edit JSON
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="border border-white/[0.04] rounded-lg p-4 bg-neutral-900/20">
            <h3 className="text-sm font-medium text-neutral-300 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg bg-neutral-900/40 hover:bg-neutral-800/50 border-b border-white/[0.02] transition-all p-4">
                <h4 className="text-neutral-300 font-medium text-sm mb-2">Import FLOWER Pricing</h4>
                <p className="text-neutral-500 text-xs mb-4">
                  Quickly import the standard flower pricing structure (1g, 3.5g, 7g, 14g, 28g)
                </p>
                <Button
                  onClick={() => handleTemplateSelect('pricing_rules')}
                  size="sm"
                  variant="primary"
                  className="text-xs"
                >
                  Generate Flower JSON
                </Button>
              </div>
              
              <div className="rounded-lg bg-neutral-900/40 hover:bg-neutral-800/50 border-b border-white/[0.02] transition-all p-4">
                <h4 className="text-neutral-300 font-medium text-sm mb-2">Custom JSON</h4>
                <p className="text-neutral-500 text-xs mb-4">
                  Start with a blank JSON editor for custom data structures
                </p>
                <Button
                  onClick={() => {
                    setJsonData({});
                    setSelectedTemplate('custom');
                    setShowEditor(true);
                  }}
                  size="sm"
                  variant="secondary"
                  className="text-xs"
                >
                  Open Editor
                </Button>
              </div>
            </div>
          </div>

              {/* JSON Editor Modal */}
              <JsonPopout
                isOpen={showEditor}
                onClose={handleClose}
                value={jsonData}
                onChange={handleSave}
                title={selectedTemplate === 'custom' ? 'Custom JSON Editor' : JSON_TEMPLATES[selectedTemplate as keyof typeof JSON_TEMPLATES]?.name || 'JSON Editor'}
                placeholder="Enter your JSON data..."
                size="xlarge"
                loading={loading}
                successMessage={success || ''}
                viewMode={true} // Enable view mode since backend API isn't available
                style="dashboard"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}