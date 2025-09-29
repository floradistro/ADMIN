import React, { useState, useEffect } from 'react';
import { Button, IconButton, Card, JsonPopout, JsonIcon, Modal } from '../../ui';
import { ToggleSwitch } from '../../ui/ToggleSwitch';
import { DeleteConfirmDialog } from '../../ui/DeleteConfirmDialog';
import { DuplicateConfirmDialog } from '../../ui/DuplicateConfirmDialog';
import { FieldLibraryPicker } from './FieldLibraryPicker';
import { PricingRulesPicker } from './PricingRulesPicker';
import { floraFieldsAPI, FieldBlueprint, CreateBlueprintData, BlueprintField, CreateBlueprintFieldData, BlueprintAssignment, CreateBlueprintAssignmentData, StandaloneField, FieldTemplate, CreateStandaloneFieldData } from '../../../services/flora-fields-api';
import { pricingAPI } from '../../../services/pricing-api';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'select', label: 'Select' },
  { value: 'multiselect', label: 'Multi-Select' },
  { value: 'date', label: 'Date' },
  { value: 'datetime', label: 'Date & Time' },
  { value: 'url', label: 'URL' },
  { value: 'email', label: 'Email' }
];

// Blueprint tab configuration
const BLUEPRINT_TAB_CONFIGS = [
  {
    id: 'preview',
    title: 'Preview',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    )
  },
  {
    id: 'details',
    title: 'Details',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  {
    id: 'fields',
    title: 'Fields',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  },
  {
    id: 'pricing',
    title: 'Pricing Rules',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    )
  },
  {
    id: 'assignments',
    title: 'Assignments',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  }
];

// Simplified blueprint creation interface
interface SimpleBlueprintData {
  name: string;
  label: string;
  description: string;
}

// Field data for blueprint creation
interface BlueprintFieldData {
  field_name: string;
  field_type: string;
  field_label: string;
  field_description: string;
  is_required: boolean;
  is_searchable: boolean;
  sort_order: number;
}

export function BlueprintDesigner() {
  const [blueprints, setBlueprints] = useState<FieldBlueprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isOperating, setIsOperating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    blueprint: FieldBlueprint | null;
  }>({ show: false, blueprint: null });
  const [duplicateConfirm, setDuplicateConfirm] = useState<{
    show: boolean;
    blueprint: FieldBlueprint | null;
  }>({ show: false, blueprint: null });
  
  // Field remove confirmation state
  const [removeFieldConfirm, setRemoveFieldConfirm] = useState<{
    show: boolean;
    field: BlueprintField | null;
    blueprintId: number | null;
  }>({ show: false, field: null, blueprintId: null });
  
  // Field library picker state
  const [showFieldLibrary, setShowFieldLibrary] = useState(false);
  const [fieldLibraryBlueprintId, setFieldLibraryBlueprintId] = useState<number | null>(null);
  
  // Pricing rules picker state
  const [showPricingRulesPicker, setShowPricingRulesPicker] = useState(false);
  const [pricingRulesPickerBlueprintId, setPricingRulesPickerBlueprintId] = useState<number | null>(null);
  
  // Simplified blueprint form data
  const [blueprintFormData, setBlueprintFormData] = useState<SimpleBlueprintData>({
    name: '',
    label: '',
    description: ''
  });

  // Fields being created with the blueprint
  const [blueprintFieldsInCreation, setBlueprintFieldsInCreation] = useState<BlueprintFieldData[]>([]);
  const [newFieldData, setNewFieldData] = useState<BlueprintFieldData>({
    field_name: '',
    field_type: 'text',
    field_label: '',
    field_description: '',
    is_required: false,
    is_searchable: false,
    sort_order: 0
  });

  // Expandable blueprint cards state
  const [expandedBlueprints, setExpandedBlueprints] = useState<Set<string>>(new Set());
  const [blueprintFields, setBlueprintFields] = useState<Record<number, BlueprintField[]>>({});
  const [blueprintAssignments, setBlueprintAssignments] = useState<Record<number, BlueprintAssignment[]>>({});
  const [blueprintPricingRules, setBlueprintPricingRules] = useState<Record<number, any[]>>({});
  const [editingTiers, setEditingTiers] = useState<Record<string, any[]>>({});
  const [showFieldForm, setShowFieldForm] = useState<Record<number, boolean>>({});
  const [showAssignmentForm, setShowAssignmentForm] = useState<Record<number, boolean>>({});
  const [currentBlueprintId, setCurrentBlueprintId] = useState<number | null>(null);
  
  // Edit modes for each tab
  const [editModes, setEditModes] = useState<Record<string, boolean>>({});
  const [editingData, setEditingData] = useState<Record<string, any>>({});
  
  // Blueprint tab state - each blueprint can have its own active tab
  const [blueprintActiveTabs, setBlueprintActiveTabs] = useState<Record<number, string>>({});
  const [fieldFormData, setFieldFormData] = useState<CreateBlueprintFieldData>({
    field_name: '',
    field_type: 'text',
    field_label: '',
    field_description: '',
    field_default_value: '',
    validation_rules: {},
    display_options: {},
    is_required: false,
    is_searchable: false,
    sort_order: 0
  });
  const [assignmentFormData, setAssignmentFormData] = useState<CreateBlueprintAssignmentData>({
    blueprint_id: 0,
    entity_type: 'product',
    entity_id: undefined,
    category_id: undefined,
    scope_type: 'specific',
    include_descendants: false,
    assignment_mode: 'include',
    priority: 0,
    sort_order: 0,
    is_active: true
  });

  // State for entity selection
  const [categories, setCategories] = useState<Array<{id: number, name: string}>>([]);
  
  // Pricing section state
  const [showPricingForm, setShowPricingForm] = useState<Record<number, boolean>>({});
  const [pricingFormData, setPricingFormData] = useState({
    rule_name: '',
    rule_type: 'quantity_break',
    formula: '',
    conditions: '{}',
    // User-friendly fields
    product_type: '',
    unit_type: 'grams',
    tiers: [
      { name: 'Single', min_quantity: 1, max_quantity: 1 as number | null, price: 0 }
    ]
  });
  const [products, setProducts] = useState<Array<{id: number, name: string}>>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);

  // JSON Editor state
  const [showJsonEditor, setShowJsonEditor] = useState<Record<string, boolean>>({});
  const [jsonEditorData, setJsonEditorData] = useState<Record<string, any>>({});
  const [jsonSuccessMessage, setJsonSuccessMessage] = useState<string>('');

  // Helper function to get active tab for a blueprint
  const getBlueprintActiveTab = (blueprintId: number): string => {
    return blueprintActiveTabs[blueprintId] || 'preview';
  };

  // Helper function to set active tab for a blueprint
  const setBlueprintActiveTab = (blueprintId: number, tab: string) => {
    setBlueprintActiveTabs(prev => ({ ...prev, [blueprintId]: tab }));
  };

  // Helper functions for edit modes
  const getEditModeKey = (blueprintId: number, tab: string) => `${blueprintId}-${tab}`;
  
  const isEditMode = (blueprintId: number, tab: string) => {
    return editModes[getEditModeKey(blueprintId, tab)] || false;
  };
  
  const toggleEditMode = (blueprintId: number, tab: string) => {
    const key = getEditModeKey(blueprintId, tab);
    setEditModes(prev => ({ ...prev, [key]: !prev[key] }));
    
    // Initialize editing data if entering edit mode
    if (!editModes[key]) {
      const blueprint = blueprints.find(b => b.id === blueprintId);
      if (blueprint && tab === 'details') {
        setEditingData(prev => ({
          ...prev,
          [key]: {
            name: blueprint.name,
            label: blueprint.label,
            description: blueprint.description || '',
            type: blueprint.type
          }
        }));
      }
    }
  };
  
  const updateEditingData = (blueprintId: number, tab: string, data: any) => {
    const key = getEditModeKey(blueprintId, tab);
    setEditingData(prev => ({ ...prev, [key]: data }));
  };
  
  const saveEditChanges = async (blueprintId: number, tab: string) => {
    const key = getEditModeKey(blueprintId, tab);
    const data = editingData[key];
    
    try {
      if (tab === 'details' && data) {
        await floraFieldsAPI.updateBlueprint(blueprintId, {
          name: data.name,
          label: data.label,
          description: data.description,
          type: data.type
        });
        await loadBlueprints();
      }
      
      // Exit edit mode
      setEditModes(prev => ({ ...prev, [key]: false }));
      setEditingData(prev => ({ ...prev, [key]: undefined }));
    } catch (err) {
      // console.error('Failed to save changes:', err);
      setError('Failed to save changes');
    }
  };
  
  const cancelEditChanges = (blueprintId: number, tab: string) => {
    const key = getEditModeKey(blueprintId, tab);
    setEditModes(prev => ({ ...prev, [key]: false }));
    setEditingData(prev => ({ ...prev, [key]: undefined }));
  };

  // Load categories
  const loadCategories = async () => {
    try {
      setLoadingEntities(true);
      const response = await fetch('/api/flora/categories?per_page=100');
      const result = await response.json();
      
      
      if (result.success && Array.isArray(result.data)) {
        const processedCategories = result.data.map((cat: any) => ({ id: cat.id, name: cat.name }));
        setCategories(processedCategories);
      } else {
        // console.error('Invalid categories response format:', result);
        setCategories([]);
      }
    } catch (err) {
      // console.error('Failed to load categories:', err);
      setCategories([]);
    } finally {
      setLoadingEntities(false);
    }
  };

  // Load products (basic implementation - you might want to add search/pagination)
  const loadProducts = async () => {
    try {
      setLoadingEntities(true);
      const consumerKey = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
      const consumerSecret = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';
      const response = await fetch(`https://api.floradistro.com/wp-json/wc/v3/products?per_page=50&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setProducts(data.map((product: any) => ({ id: product.id, name: product.name })));
      } else {
        // console.error('Invalid products response format:', data);
        setProducts([]);
      }
    } catch (err) {
      // console.error('Failed to load products:', err);
      setProducts([]);
    } finally {
      setLoadingEntities(false);
    }
  };

  // Load blueprints
  const loadBlueprints = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await floraFieldsAPI.getBlueprints();
      setBlueprints(data);
      
      // Load pricing rules for all blueprints
      try {
        const pricingResponse = await pricingAPI.getPricingRules(0, true); // Get all rules with product_id = 0
        
        // Group rules by blueprint
        const rulesByBlueprint: Record<number, any[]> = {};
        
        for (const rule of pricingResponse.rules) {
          try {
            const conditions = typeof rule.conditions === 'string' 
              ? JSON.parse(rule.conditions) 
              : rule.conditions;
            
            if (conditions.blueprint_id) {
              if (!rulesByBlueprint[conditions.blueprint_id]) {
                rulesByBlueprint[conditions.blueprint_id] = [];
              }
              rulesByBlueprint[conditions.blueprint_id].push(rule);
            }
          } catch (err) {
            // console.error('Failed to parse rule conditions:', rule, err);
          }
        }
        
        setBlueprintPricingRules(rulesByBlueprint);
      } catch (pricingErr) {
        // console.error('Failed to load pricing rules:', pricingErr);
      }
    } catch (err) {
      // console.error('Failed to load blueprints:', err);
      setError(err instanceof Error ? err.message : 'Failed to load blueprints');
    } finally {
      setLoading(false);
    }
  };

  // Create blueprint with fields (comprehensive)
  const createBlueprint = async () => {
    setIsOperating(true);
    try {
      // Step 1: Create the blueprint
      const blueprintData: CreateBlueprintData = {
        name: blueprintFormData.name,
        type: 'text', // Default type, not relevant for Stage 3 blueprints
        label: blueprintFormData.label,
        description: blueprintFormData.description,
        default_value: '',
        validation_rules: {},
        display_options: {},
        is_required: false,
        is_searchable: false,
        sort_order: 0
      };
      
      
      // Prepare fields to create - include any filled field data from the form
      const fieldsToCreate: BlueprintFieldData[] = [...blueprintFieldsInCreation];
      
      // If there's field data in the current form inputs, include it
      if (newFieldData.field_name && newFieldData.field_label) {
        fieldsToCreate.push({ ...newFieldData, sort_order: fieldsToCreate.length });
      }
      
      const response = await floraFieldsAPI.createBlueprint(blueprintData);
      
      // Step 2: Create all fields for the blueprint if we have any
      if (fieldsToCreate.length > 0) {
        
        // Check response structure for blueprint ID
        const blueprintId = response.id || response.blueprint?.id;
        
        if (blueprintId) {
          
          for (const fieldData of fieldsToCreate) {
            try {
              const fieldCreateData: CreateBlueprintFieldData = {
                field_name: fieldData.field_name,
                field_type: fieldData.field_type,
                field_label: fieldData.field_label,
                field_description: fieldData.field_description,
                field_default_value: '',
                validation_rules: {},
                display_options: {},
                is_required: fieldData.is_required,
                is_searchable: fieldData.is_searchable,
                sort_order: fieldData.sort_order
              };
              
              
              // Sync field to library first
              await syncFieldToLibrary(fieldCreateData);
              
              const fieldResponse = await floraFieldsAPI.createBlueprintField(blueprintId, fieldCreateData);
            } catch (fieldErr) {
              // console.error(`Failed to create field ${fieldData.field_label}:`, fieldErr);
              const errorMsg = `Failed to create field ${fieldData.field_label}: ${fieldErr instanceof Error ? fieldErr.message : JSON.stringify(fieldErr)}`;
              setError(errorMsg);
              // Continue creating other fields even if one fails
            }
          }
        } else {
          // console.error('No blueprint ID found in response:', response);
          setError('Blueprint created but no ID returned - cannot create fields');
        }
      } else {
      }
      
      // Reset form and reload
      setShowCreateForm(false);
      resetBlueprintForm();
      
      // Only clear error if no field creation errors occurred
      if (!error) {
        setError(null);
      }
      
      // Reload blueprints
      setTimeout(() => {
        loadBlueprints();
      }, 500);
      
    } catch (err) {
      // console.error('Failed to create blueprint:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create blueprint';
      setError(`Create failed: ${errorMessage}`);
    } finally {
      setIsOperating(false);
    }
  };



  // Show delete confirmation
  const showDeleteConfirm = (blueprint: FieldBlueprint) => {
    setDeleteConfirm({ show: true, blueprint });
  };

  // Delete blueprint
  const deleteBlueprint = async () => {
    if (!deleteConfirm.blueprint) return;
    
    const blueprint = deleteConfirm.blueprint;
    const id = blueprint.id;
    
    setIsOperating(true);
    setDeleteConfirm({ show: false, blueprint: null });
    
    try {
      
      // First, check if the blueprint still exists on the server
      try {
        await floraFieldsAPI.getBlueprint(id);
      } catch (checkErr) {
        if (checkErr instanceof Error && checkErr.message.includes('not found')) {
          // Blueprint already deleted on server, just update local state
          setBlueprints(prev => prev.filter(bp => bp.id !== id));
          setError(null);
          return;
        }
      }
      
      // Blueprint exists on server, proceed with deletion
      await floraFieldsAPI.deleteBlueprint(id);
      
      // Update local state immediately
      setBlueprints(prev => prev.filter(bp => bp.id !== id));
      setError(null); // Clear any previous errors
      
      
      // Force a reload from server to ensure sync
      setTimeout(() => {
        loadBlueprints();
      }, 500);
      
    } catch (err) {
      // console.error('Failed to delete blueprint:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete blueprint';
      
      if (errorMessage.includes('not found')) {
        // Blueprint was already deleted, just update local state
        setBlueprints(prev => prev.filter(bp => bp.id !== id));
        setError(null);
      } else {
        setError(`Delete failed: ${errorMessage}`);
      }
    } finally {
      setIsOperating(false);
    }
  };

  // Show duplicate confirmation
  const showDuplicateConfirm = (blueprint: FieldBlueprint) => {
    setDuplicateConfirm({ show: true, blueprint });
  };

  // Duplicate blueprint
  const duplicateBlueprint = async (newName: string, newLabel: string) => {
    if (!duplicateConfirm.blueprint) return;

    try {
      setIsOperating(true);
      const originalBlueprint = duplicateConfirm.blueprint;
      
      // Call the duplicate API method
      const response = await floraFieldsAPI.duplicateBlueprint(
        originalBlueprint.id, 
        newName, 
        newLabel
      );
      
      if (response.success && response.blueprint) {
        // Add the new blueprint to local state
        setBlueprints(prev => [...prev, response.blueprint!]);
        
        // Also duplicate pricing rules if they exist
        const originalPricingRules = blueprintPricingRules[originalBlueprint.id];
        if (originalPricingRules && originalPricingRules.length > 0) {
          const newBlueprintId = response.blueprint.id;
          
          // Create pricing rules for the new blueprint
          for (const rule of originalPricingRules) {
            try {
              let conditions = typeof rule.conditions === 'string' 
                ? JSON.parse(rule.conditions) 
                : rule.conditions || {};
              
              // Update conditions to reference new blueprint
              conditions.blueprint_id = newBlueprintId;
              conditions.blueprint_name = newName;
              
              const ruleData = {
                product_id: 0,
                rule_name: rule.rule_name.replace(originalBlueprint.name, newName),
                rule_type: rule.rule_type,
                priority: rule.priority || 10,
                conditions: conditions,
                formula: rule.formula,
                is_active: rule.is_active !== false
              };
              
              await pricingAPI.createPricingRule(ruleData);
            } catch (ruleErr) {
              // console.error('Failed to duplicate pricing rule:', ruleErr);
            }
          }
          
          // Update local pricing rules state
          setBlueprintPricingRules(prev => ({
            ...prev,
            [newBlueprintId]: originalPricingRules.map(rule => ({
              ...rule,
              rule_name: rule.rule_name.replace(originalBlueprint.name, newName)
            }))
          }));
        }
      }
      
      setDuplicateConfirm({ show: false, blueprint: null });
      setError(null);
    } catch (err) {
      // console.error('Failed to duplicate blueprint:', err);
      setError(err instanceof Error ? err.message : 'Failed to duplicate blueprint');
    } finally {
      setIsOperating(false);
    }
  };

  // Field library picker functions
  const openFieldLibrary = (blueprintId?: number) => {
    setFieldLibraryBlueprintId(blueprintId || null);
    setShowFieldLibrary(true);
  };

  const handleSelectFields = async (fields: StandaloneField[]) => {
    if (!fieldLibraryBlueprintId) {
      // Add to blueprint creation form
      const newFields = fields.map(field => ({
        field_name: field.field_name,
        field_type: field.field_type,
        field_label: field.field_label,
        field_description: field.field_description,
        is_required: field.is_required,
        is_searchable: field.is_searchable,
        sort_order: field.sort_order
      }));
      setBlueprintFieldsInCreation(prev => [...prev, ...newFields]);
    } else {
      // Add fields directly to existing blueprint
      try {
        setIsOperating(true);
        for (const field of fields) {
          await floraFieldsAPI.addFieldToBlueprint(fieldLibraryBlueprintId, field.id);
        }
        
        // Reload blueprint fields
        const updatedFields = await floraFieldsAPI.getBlueprintFields(fieldLibraryBlueprintId);
        setBlueprintFields(prev => ({ ...prev, [fieldLibraryBlueprintId]: updatedFields }));
        
        setError(null);
      } catch (err) {
        // console.error('Failed to add fields to blueprint:', err);
        setError(err instanceof Error ? err.message : 'Failed to add fields to blueprint');
      } finally {
        setIsOperating(false);
      }
    }
  };

  // Pricing rules picker functions
  const handleSelectPricingRules = async (rules: any[]) => {
    if (!pricingRulesPickerBlueprintId || isOperating) {
      // console.warn('Cannot add pricing rules: operation in progress or no blueprint selected');
      return;
    }
    
    try {
      setIsOperating(true);
      setError(null);
      
      
      // Validate rules array
      if (!Array.isArray(rules) || rules.length === 0) {
        // console.warn('No valid pricing rules to add');
        return;
      }
      
      // Get blueprint info for context
      const blueprint = blueprints.find(b => b.id === pricingRulesPickerBlueprintId);
      const blueprintName = blueprint?.name || `blueprint_${pricingRulesPickerBlueprintId}`;
      
      // Add selected pricing rules to the blueprint
      const currentRules = blueprintPricingRules[pricingRulesPickerBlueprintId] || [];
      const newRules = rules.filter(rule => {
        if (!rule || !rule.id) {
          // console.warn('Invalid rule object:', rule);
          return false;
        }
        return !currentRules.some(existing => existing.id === rule.id);
      });
      
      if (newRules.length === 0) {
        return;
      }
      
      // Save each rule with blueprint assignment to the backend
      const savedRules: any[] = [];
      for (const rule of newRules) {
        try {
          // Parse existing conditions
          let conditions = typeof rule.conditions === 'string' 
            ? JSON.parse(rule.conditions) 
            : (rule.conditions || {});
          
          // Add blueprint context to conditions
          conditions.blueprint_id = pricingRulesPickerBlueprintId;
          conditions.blueprint_name = blueprintName;
          
          // Create updated rule object, explicitly excluding date fields first
          const { start_date, end_date, ...ruleWithoutDates } = rule;
          
          const updatedRuleData = {
            ...ruleWithoutDates,
            conditions: conditions
          };

          // Only include date fields if they have valid string values
          if (start_date && typeof start_date === 'string' && start_date.trim() !== '') {
            updatedRuleData.start_date = start_date;
          }
          if (end_date && typeof end_date === 'string' && end_date.trim() !== '') {
            updatedRuleData.end_date = end_date;
          }

          // Update the existing rule to include blueprint assignment
          const updatedRule = await pricingAPI.updatePricingRule(rule.id, updatedRuleData);
          
          savedRules.push(updatedRule || rule);
          
        } catch (ruleError) {
          // console.error('Failed to assign rule to blueprint:', rule.id, ruleError);
          // Continue with other rules but log the error
          savedRules.push(rule); // Add original rule to UI even if backend failed
        }
      }
      
      // Update UI state
      setBlueprintPricingRules(prev => ({
        ...prev,
        [pricingRulesPickerBlueprintId]: [...currentRules, ...savedRules]
      }));
      
      
    } catch (err) {
      // console.error('Failed to add pricing rules to blueprint:', err);
      setError(err instanceof Error ? err.message : 'Failed to add pricing rules to blueprint');
    } finally {
      setIsOperating(false);
      // Close the picker after operation completes
      setShowPricingRulesPicker(false);
      setPricingRulesPickerBlueprintId(null);
    }
  };

  const handleSelectTemplate = async (template: FieldTemplate) => {
    if (!fieldLibraryBlueprintId) {
      // Add template fields to blueprint creation form
      const newFields = template.fields.map(field => ({
        field_name: field.field_name,
        field_type: field.field_type,
        field_label: field.field_label,
        field_description: field.field_description,
        is_required: field.is_required,
        is_searchable: field.is_searchable,
        sort_order: field.sort_order
      }));
      setBlueprintFieldsInCreation(prev => [...prev, ...newFields]);
    } else {
      // Apply template to existing blueprint
      try {
        setIsOperating(true);
        await floraFieldsAPI.applyTemplateToBlueprint(fieldLibraryBlueprintId, template.id);
        
        // Reload blueprint fields
        const updatedFields = await floraFieldsAPI.getBlueprintFields(fieldLibraryBlueprintId);
        setBlueprintFields(prev => ({ ...prev, [fieldLibraryBlueprintId]: updatedFields }));
        
        setError(null);
      } catch (err) {
        // console.error('Failed to apply template to blueprint:', err);
        setError(err instanceof Error ? err.message : 'Failed to apply template to blueprint');
      } finally {
        setIsOperating(false);
      }
    }
  };

  // Reset blueprint form
  const resetBlueprintForm = () => {
    setBlueprintFormData({
      name: '',
      label: '',
      description: ''
    });
    setBlueprintFieldsInCreation([]);
    resetNewFieldData();
  };

  // Reset new field data
  const resetNewFieldData = () => {
    setNewFieldData({
      field_name: '',
      field_type: 'text',
      field_label: '',
      field_description: '',
      is_required: false,
      is_searchable: false,
      sort_order: blueprintFieldsInCreation.length
    });
  };

  // Add field to blueprint creation
  const addFieldToBlueprintCreation = () => {
    
    if (!newFieldData.field_name || !newFieldData.field_label) {
      // console.error('Cannot add field - missing required data');
      return;
    }
    
    const updatedFields = [...blueprintFieldsInCreation, { ...newFieldData, sort_order: blueprintFieldsInCreation.length }];
    setBlueprintFieldsInCreation(updatedFields);
    resetNewFieldData();
  };

  // Remove field from blueprint creation
  const removeFieldFromBlueprintCreation = (index: number) => {
    setBlueprintFieldsInCreation(prev => prev.filter((_, i) => i !== index));
  };

  // Handle blueprint form submission
  const handleBlueprintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBlueprint();
  };

  // Cancel blueprint form
  const handleBlueprintCancel = () => {
    setShowCreateForm(false);
    resetBlueprintForm();
  };

  // Toggle blueprint expansion
  const toggleBlueprintExpansion = async (blueprintId: number) => {
    const newExpanded = new Set(expandedBlueprints);
    
    if (expandedBlueprints.has(blueprintId.toString())) {
      newExpanded.delete(blueprintId.toString());
    } else {
      newExpanded.add(blueprintId.toString());
      
      // Load blueprint details when expanding
      if (!blueprintFields[blueprintId]) {
        try {
          const [fields, assignments] = await Promise.all([
            floraFieldsAPI.getBlueprintFields(blueprintId),
            floraFieldsAPI.getBlueprintAssignments(blueprintId)
          ]);
          
          setBlueprintFields(prev => ({ ...prev, [blueprintId]: fields }));
          setBlueprintAssignments(prev => ({ ...prev, [blueprintId]: assignments }));
        } catch (err) {
          // console.error('Failed to load blueprint details:', err);
          setError('Failed to load blueprint details');
        }
      }
    }
    
    setExpandedBlueprints(newExpanded);
  };

  // Create blueprint field (with automatic library sync)
  const createBlueprintField = async (blueprintId: number) => {
    try {
      setIsOperating(true);
      
      // Step 1: Sync field to library first
      await syncFieldToLibrary(fieldFormData);
      
      // Step 2: Create blueprint field
      await floraFieldsAPI.createBlueprintField(blueprintId, fieldFormData);
      
      // Reload fields
      const fields = await floraFieldsAPI.getBlueprintFields(blueprintId);
      setBlueprintFields(prev => ({ ...prev, [blueprintId]: fields }));
      
      // Reset form
      setShowFieldForm(prev => ({ ...prev, [blueprintId]: false }));
      setFieldFormData({
        field_name: '',
        field_type: 'text',
        field_label: '',
        field_description: '',
        field_default_value: '',
        validation_rules: {},
        display_options: {},
        is_required: false,
        is_searchable: false,
        sort_order: 0
      });
      setError(null);
    } catch (err) {
      // console.error('Failed to create blueprint field:', err);
      setError(err instanceof Error ? err.message : 'Failed to create blueprint field');
    } finally {
      setIsOperating(false);
    }
  };

  // Remove field from blueprint (set status to inactive)
  const removeBlueprintField = async () => {
    if (!removeFieldConfirm.field || !removeFieldConfirm.blueprintId) return;
    
    try {
      setIsOperating(true);
      
      // Update field status to 'inactive' to remove it from blueprint
      await floraFieldsAPI.updateBlueprintField(removeFieldConfirm.field.id, { status: 'inactive' } as any);
      
      // Reload fields for this blueprint (will exclude inactive fields)
      const fields = await floraFieldsAPI.getBlueprintFields(removeFieldConfirm.blueprintId);
      setBlueprintFields(prev => ({ ...prev, [removeFieldConfirm.blueprintId!]: fields }));
      
      // Close confirmation dialog
      setRemoveFieldConfirm({ show: false, field: null, blueprintId: null });
      setError(null);
    } catch (err) {
      // console.error('Failed to remove blueprint field:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove blueprint field');
    } finally {
      setIsOperating(false);
    }
  };

  // Create pricing rule
  const createPricingRule = async (blueprintId: number) => {
    try {
      setIsOperating(true);
      
      // Parse conditions JSON
      let conditions = {};
      try {
        conditions = JSON.parse(pricingFormData.conditions);
      } catch (err) {
        throw new Error('Invalid JSON in conditions field');
      }
      
      const ruleData = {
        product_id: 0, // Global rule for now
        rule_name: pricingFormData.rule_name,
        rule_type: pricingFormData.rule_type as any,
        formula: pricingFormData.formula,
        conditions,
        priority: 10,
        is_active: true
      };
      
      await pricingAPI.createPricingRule(ruleData);
      
      // Reload pricing rules (for now just update the count)
      const existingRules = blueprintPricingRules[blueprintId] || [];
      setBlueprintPricingRules(prev => ({ 
        ...prev, 
        [blueprintId]: [...existingRules, ruleData] 
      }));
      
      // Reset form
      setShowPricingForm(prev => ({ ...prev, [blueprintId]: false }));
      setPricingFormData({
        rule_name: '',
        rule_type: 'quantity_break',
        formula: '',
        conditions: '{}',
        product_type: '',
        unit_type: 'grams',
        tiers: [{ name: 'Single', min_quantity: 1, max_quantity: 1 as number | null, price: 0 }]
      });
      setError(null);
    } catch (err) {
      // console.error('Failed to create pricing rule:', err);
      setError(err instanceof Error ? err.message : 'Failed to create pricing rule');
    } finally {
      setIsOperating(false);
    }
  };

  // Unified Field Library System
  const syncFieldToLibrary = async (fieldData: CreateBlueprintFieldData) => {
    try {
      // Check if field already exists in standalone library
      const existingFields = await floraFieldsAPI.getStandaloneFields();
      const existingField = existingFields.find(f => f.field_name === fieldData.field_name);
      
      if (existingField) {
        return existingField;
      }

      // Create as standalone field for library
      const standaloneFieldData: CreateStandaloneFieldData = {
        field_name: fieldData.field_name,
        field_type: fieldData.field_type,
        field_label: fieldData.field_label,
        field_description: fieldData.field_description || '',
        field_default_value: fieldData.field_default_value || '',
        validation_rules: fieldData.validation_rules || {},
        display_options: fieldData.display_options || {},
        is_required: fieldData.is_required || false,
        is_searchable: fieldData.is_searchable || false,
        sort_order: fieldData.sort_order || 0
      };

      const response = await floraFieldsAPI.createStandaloneField(standaloneFieldData);
      
      return response.field;
    } catch (err) {
      // console.error(`Failed to sync field ${fieldData.field_name} to library:`, err);
      // Don't throw - field creation should continue even if library sync fails
      return null;
    }
  };

  const migrateLegacyFields = async () => {
    try {
      setIsOperating(true);
      
      // Get all blueprints and their fields
      const allBlueprints = await floraFieldsAPI.getBlueprints();
      let totalFieldsMigrated = 0;
      let alreadyInLibrary = 0;
      
      for (const blueprint of allBlueprints) {
        
        try {
          const blueprintFields = await floraFieldsAPI.getBlueprintFields(blueprint.id);
          
          for (const field of blueprintFields) {
            const fieldData: CreateBlueprintFieldData = {
              field_name: field.field_name,
              field_type: field.field_type,
              field_label: field.field_label,
              field_description: field.field_description,
              field_default_value: field.field_default_value,
              validation_rules: field.validation_rules,
              display_options: field.display_options,
              is_required: field.is_required,
              is_searchable: field.is_searchable,
              sort_order: field.sort_order
            };
            
            const syncResult = await syncFieldToLibrary(fieldData);
            if (syncResult) {
              totalFieldsMigrated++;
            } else {
              alreadyInLibrary++;
            }
          }
        } catch (fieldErr) {
          // console.error(`Failed to migrate fields from blueprint ${blueprint.name}:`, fieldErr);
        }
      }
      
      setError(null);
      
      // Show success message
      alert(`Migration complete!\n${totalFieldsMigrated} fields migrated to library\n${alreadyInLibrary} fields were already in library`);
      
    } catch (err) {
      // console.error('Failed to migrate legacy fields:', err);
      setError('Failed to migrate legacy fields: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsOperating(false);
    }
  };

  // Create user-friendly pricing rule
  const createUserFriendlyPricingRule = async (blueprintId: number) => {
    try {
      setIsOperating(true);
      
      // Build conditions from user-friendly form data
      const conditions = {
        product_type: pricingFormData.product_type,
        unit_type: pricingFormData.unit_type,
        blueprint_id: blueprintId,
        blueprint_name: blueprints.find(b => b.id === blueprintId)?.name || 'unknown',
        tiers: pricingFormData.tiers.map(tier => ({
          name: tier.name,
          min_quantity: tier.min_quantity,
          max_quantity: tier.max_quantity,
          price: tier.price
        }))
      };
      
      // Auto-generate formula based on tiers (simple tiered pricing)
      const formula = '{base_price}'; // Will be overridden by tier pricing
      
      const ruleData = {
        product_id: 0, // Global rule
        rule_name: pricingFormData.rule_name,
        rule_type: pricingFormData.rule_type as any,
        formula: formula,
        conditions: conditions,
        priority: 10,
        is_active: true
      };
      
      
      await pricingAPI.createPricingRule(ruleData);
      
      // Reload blueprints to refresh pricing rules
      await loadBlueprints();
      
      // Reset form and close
      setShowPricingForm(prev => ({ ...prev, [blueprintId]: false }));
      setPricingFormData({
        rule_name: '',
        rule_type: 'quantity_break',
        formula: '',
        conditions: '{}',
        product_type: '',
        unit_type: 'grams',
        tiers: [{ name: 'Single', min_quantity: 1, max_quantity: 1 as number | null, price: 0 }]
      });
      
      setError(null);
    } catch (err) {
      // console.error('Failed to create user-friendly pricing rule:', err);
      setError(err instanceof Error ? err.message : 'Failed to create pricing rule');
    } finally {
      setIsOperating(false);
    }
  };

  // JSON Editor helper functions
  const openJsonEditor = (key: string, data: any) => {
    setJsonEditorData(prev => ({ ...prev, [key]: data }));
    setShowJsonEditor(prev => ({ ...prev, [key]: true }));
  };

  const closeJsonEditor = (key: string) => {
    setShowJsonEditor(prev => ({ ...prev, [key]: false }));
  };

  const handleJsonEditorSave = async (key: string, data: any) => {
    setIsOperating(true);
    setError(null);
    setJsonSuccessMessage('');
    
    try {
      
      // Handle general pricing rules without blueprint context
      if (key === 'pricing-rules' || key === 'pricing') {
        if (Array.isArray(data)) {
          for (const rule of data) {
            const ruleData = {
              product_id: rule.product_id || 0,
              rule_name: rule.rule_name,
              rule_type: rule.rule_type,
              priority: rule.priority || 10,
              conditions: typeof rule.conditions === 'string' 
                ? (() => {
                    try {
                      return JSON.parse(rule.conditions);
                    } catch (parseErr) {
                      // console.error('Failed to parse conditions:', rule.conditions, parseErr);
                      return rule.conditions;
                    }
                  })()
                : rule.conditions,
              formula: rule.formula,
              is_active: rule.is_active !== false
            };
            const result = await pricingAPI.createPricingRule(ruleData);
          }
          setJsonSuccessMessage(`Successfully saved ${data.length} pricing rules!`);
        }
      } else if (key.startsWith('pricing-rules-')) {
        const blueprintId = parseInt(key.replace('pricing-rules-', ''));
        setBlueprintPricingRules(prev => ({ ...prev, [blueprintId]: data }));
        
        // Get the blueprint to add context
        const blueprint = blueprints.find(b => b.id === blueprintId);
        const blueprintName = blueprint?.name || `blueprint_${blueprintId}`;
        
        // Save each pricing rule to the backend
        if (Array.isArray(data)) {
          for (const rule of data) {
            // Parse conditions if string
            let conditions = typeof rule.conditions === 'string' 
              ? (() => {
                  try {
                    return JSON.parse(rule.conditions);
                  } catch (parseErr) {
                    // console.error('Failed to parse conditions:', rule.conditions, parseErr);
                    return {};
                  }
                })()
              : (rule.conditions || {});
            
            // Add blueprint context to conditions
            conditions.blueprint_id = blueprintId;
            conditions.blueprint_name = blueprintName;
            
            const ruleData = {
              product_id: 0, // Set to 0 for blueprint-wide rules
              rule_name: rule.rule_name || `${blueprintName} - Rule`,
              rule_type: rule.rule_type,
              priority: rule.priority || 10,
              conditions: conditions,
              formula: rule.formula,
              is_active: rule.is_active !== false
            };
            const result = await pricingAPI.createPricingRule(ruleData);
          }
          setJsonSuccessMessage(`Successfully saved ${data.length} pricing rules for blueprint "${blueprintName}"!`);
        }
      } else if (key.startsWith('pricing-bulk-')) {
        const blueprintId = parseInt(key.replace('pricing-bulk-', ''));
        if (Array.isArray(data)) {
          setBlueprintPricingRules(prev => ({ ...prev, [blueprintId]: data }));
          
          // Get the blueprint to add context
          const blueprint = blueprints.find(b => b.id === blueprintId);
          const blueprintName = blueprint?.name || `blueprint_${blueprintId}`;
          
          // Save each pricing rule to the backend
          for (const rule of data) {
            // Parse conditions if string
            let conditions = typeof rule.conditions === 'string' 
              ? (() => {
                  try {
                    return JSON.parse(rule.conditions);
                  } catch (parseErr) {
                    // console.error('Failed to parse conditions:', rule.conditions, parseErr);
                    return {};
                  }
                })()
              : (rule.conditions || {});
            
            // Add blueprint context to conditions
            conditions.blueprint_id = blueprintId;
            conditions.blueprint_name = blueprintName;
            
            const ruleData = {
              product_id: 0, // Set to 0 for blueprint-wide rules
              rule_name: rule.rule_name || `${blueprintName} - Rule`,
              rule_type: rule.rule_type,
              priority: rule.priority || 10,
              conditions: conditions,
              formula: rule.formula,
              is_active: rule.is_active !== false
            };
            const result = await pricingAPI.createPricingRule(ruleData);
          }
          setJsonSuccessMessage(`Successfully imported ${data.length} pricing rules for blueprint "${blueprintName}"!`);
        }
      } else if (key.startsWith('fields-bulk-')) {
        // Handle bulk field import
        const blueprintId = parseInt(key.replace('fields-bulk-', ''));
        if (Array.isArray(data)) {
          for (const field of data) {
            const fieldData = {
              blueprint_id: blueprintId,
              field_name: field.field_name,
              field_type: field.field_type || 'text',
              field_label: field.field_label,
              field_description: field.field_description || '',
              field_default_value: field.field_default_value || '',
              validation_rules: field.validation_rules || {},
              display_options: field.display_options || {},
              is_required: field.is_required || false,
              is_searchable: field.is_searchable || false,
              sort_order: field.sort_order || 0
            };
            await floraFieldsAPI.createBlueprintField(blueprintId, fieldData);
          }
          // Reload fields
          const fields = await floraFieldsAPI.getBlueprintFields(blueprintId);
          setBlueprintFields(prev => ({ ...prev, [blueprintId]: fields }));
          setJsonSuccessMessage(`Successfully imported ${data.length} fields!`);
        }
      } else if (key.startsWith('fields-')) {
        // Handle field editing (view only for now)
        const blueprintId = parseInt(key.replace('fields-', ''));
        setJsonSuccessMessage('Field data viewed. Use the Import JSON button to add new fields.');
      } else if (key.startsWith('assignments-bulk-')) {
        // Handle bulk assignment import
        const blueprintId = parseInt(key.replace('assignments-bulk-', ''));
        if (Array.isArray(data)) {
          for (const assignment of data) {
            const assignmentData = {
              blueprint_id: blueprintId,
              entity_type: assignment.entity_type || 'product',
              entity_id: assignment.entity_id,
              category_id: assignment.category_id,
              scope_type: assignment.scope_type || 'specific',
              include_descendants: assignment.include_descendants || false,
              assignment_mode: assignment.assignment_mode || 'include',
              priority: assignment.priority || 0,
              sort_order: assignment.sort_order || 0,
              is_active: assignment.is_active !== false
            };
            await floraFieldsAPI.createBlueprintAssignment(assignmentData);
          }
          // Reload assignments
          const assignments = await floraFieldsAPI.getBlueprintAssignments(blueprintId);
          setBlueprintAssignments(prev => ({ ...prev, [blueprintId]: assignments }));
          setJsonSuccessMessage(`Successfully imported ${data.length} assignments!`);
        }
      } else if (key.startsWith('assignments-')) {
        // Handle assignment editing (view only for now)
        const blueprintId = parseInt(key.replace('assignments-', ''));
        setJsonSuccessMessage('Assignment data viewed. Use the Import JSON button to add new assignments.');
      } else if (key.startsWith('details-bulk-')) {
        // Handle blueprint details import
        const blueprintId = parseInt(key.replace('details-bulk-', ''));
        if (data && typeof data === 'object') {
          // Update blueprint details
          const updateData: any = {};
          if (data.label) updateData.label = data.label;
          if (data.description) updateData.description = data.description;
          if (data.type) updateData.type = data.type;
          
          if (Object.keys(updateData).length > 0) {
            await floraFieldsAPI.updateBlueprint(blueprintId, updateData);
            // Reload blueprints to reflect changes
            loadBlueprints();
            setJsonSuccessMessage('Blueprint details updated successfully!');
          } else {
            setJsonSuccessMessage('No valid blueprint details found to update.');
          }
        }
      } else if (key.startsWith('details-')) {
        // Handle blueprint details viewing (view only for now)
        const blueprintId = parseInt(key.replace('details-', ''));
        setJsonSuccessMessage('Blueprint details viewed. Use the Import JSON button to update details.');
      } else if (key.startsWith('full-blueprint-')) {
        // Handle full blueprint import/export
        const blueprintId = parseInt(key.replace('full-blueprint-', ''));
        if (data && typeof data === 'object') {
          let importCount = 0;
          
          // Import blueprint details if provided
          if (data.blueprint && typeof data.blueprint === 'object') {
            const updateData: any = {};
            if (data.blueprint.slug) updateData.name = data.blueprint.slug;
            if (data.blueprint.label) updateData.label = data.blueprint.label;
            if (data.blueprint.description) updateData.description = data.blueprint.description;
            if (data.blueprint.status) updateData.type = data.blueprint.status;
            
            if (Object.keys(updateData).length > 0) {
              await floraFieldsAPI.updateBlueprint(blueprintId, updateData);
              importCount++;
            }
          }
          
          // Import fields if provided
          if (data.fields && Array.isArray(data.fields)) {
            for (const field of data.fields) {
              const fieldData = {
                blueprint_id: blueprintId,
                field_name: field.name || field.field_name,
                field_type: field.type || field.field_type || 'text',
                field_label: field.label || field.field_label,
                field_description: field.description || field.field_description || '',
                field_default_value: field.default_value || field.field_default_value || '',
                validation_rules: field.validation || field.validation_rules || {},
                display_options: {
                  unit: field.unit,
                  precision: field.precision,
                  choices: field.choices,
                  choice_source: field.choice_source,
                  conditional: field.conditional,
                  help: field.help,
                  ...(field.display_options || {})
                },
                is_required: field.validation?.required || field.is_required || false,
                is_searchable: field.searchable || field.is_searchable || false,
                sort_order: field.sort_order || 0
              };
              await floraFieldsAPI.createBlueprintField(blueprintId, fieldData);
            }
            importCount += data.fields.length;
          }
          
          // Import assignments if provided
          if (data.assignments && Array.isArray(data.assignments)) {
            for (const assignment of data.assignments) {
              const assignmentData = {
                blueprint_id: blueprintId,
                entity_type: assignment.target_type || assignment.entity_type || 'product',
                entity_id: assignment.target_type === 'product' ? assignment.target_id : assignment.entity_id,
                category_id: assignment.target_type === 'category' ? assignment.target_id : assignment.category_id,
                scope_type: (assignment.target_type === 'category' ? 'category' : 'specific') as 'specific' | 'category' | 'global',
                include_descendants: assignment.include_descendants || false,
                assignment_mode: assignment.mode || assignment.assignment_mode || 'include',
                priority: assignment.priority || 0,
                sort_order: assignment.sort_order || 0,
                is_active: assignment.active !== false && assignment.is_active !== false
              };
              await floraFieldsAPI.createBlueprintAssignment(assignmentData);
            }
            importCount += data.assignments.length;
          }
          
          // Import pricing rules if provided
          if (data.pricing_rules && Array.isArray(data.pricing_rules)) {
            const blueprint = blueprints.find(b => b.id === blueprintId);
            const blueprintName = blueprint?.name || `blueprint_${blueprintId}`;
            
            for (const rule of data.pricing_rules) {
              // Handle new normalized structure with breaks
              let conditions: any = {};
              let formula = rule.formula;
              
              if (rule.filters) {
                conditions = { ...rule.filters };
              } else if (rule.conditions) {
                conditions = typeof rule.conditions === 'string' 
                  ? JSON.parse(rule.conditions)
                  : rule.conditions;
              }
              
              conditions.blueprint_id = blueprintId;
              conditions.blueprint_name = blueprintName;
              
              // Convert new breaks format to legacy formula if needed
              if (rule.breaks && Array.isArray(rule.breaks) && !formula) {
                const caseStatements = rule.breaks.map((breakItem: any) => {
                  const price = breakItem.price_cents ? (breakItem.price_cents / 100).toFixed(2) : breakItem.price;
                  if (breakItem.max === null) {
                    return `when {quantity} >= ${breakItem.min} then ${price}`;
                  } else if (breakItem.min === breakItem.max) {
                    return `when {quantity} = ${breakItem.min} then ${price}`;
                  } else {
                    return `when {quantity} >= ${breakItem.min} and {quantity} <= ${breakItem.max} then ${price}`;
                  }
                }).join(' ');
                formula = `case ${caseStatements} else {base_price} end`;
                
                // Store normalized breaks in conditions for reference
                conditions.breaks = rule.breaks;
                conditions.unit = rule.unit || 'units';
                conditions.currency = rule.currency || 'USD';
              }
              
              // Handle new normalized filters structure
              if (rule.filters) {
                if (rule.filters.customer_tiers) {
                  conditions.customer_tiers = rule.filters.customer_tiers;
                  conditions.tiers = rule.filters.customer_tiers; // Legacy compatibility
                }
                if (rule.filters.channels) conditions.channels = rule.filters.channels;
                if (rule.filters.stores) conditions.stores = rule.filters.stores;
              }
              
              const ruleData = {
                product_id: 0,
                rule_name: rule.rule_name || `${blueprintName} - Rule`,
                rule_type: rule.rule_type,
                priority: rule.priority || 10,
                conditions: conditions,
                formula: formula,
                is_active: rule.active !== false && rule.is_active !== false
              };
              await pricingAPI.createPricingRule(ruleData);
            }
            importCount += data.pricing_rules.length;
          }
          
          if (importCount > 0) {
            // Reload all blueprint data
            loadBlueprints(); // Reload main blueprints list
            // Reload specific blueprint data
            const fields = await floraFieldsAPI.getBlueprintFields(blueprintId);
            setBlueprintFields(prev => ({ ...prev, [blueprintId]: fields }));
            const assignments = await floraFieldsAPI.getBlueprintAssignments(blueprintId);
            setBlueprintAssignments(prev => ({ ...prev, [blueprintId]: assignments }));
            setJsonSuccessMessage(`Successfully imported full blueprint data! (${importCount} items processed)`);
          } else {
            setJsonSuccessMessage('Full blueprint data viewed. No import data found.');
          }
        } else {
          setJsonSuccessMessage('Full blueprint data viewed. Use import format to update.');
        }
      } else {
        setError(`Unhandled editor key: ${key}. Please report this issue.`);
      }
      
      // Auto-close after 2 seconds on success
      setTimeout(() => {
        closeJsonEditor(key);
        setJsonSuccessMessage('');
      }, 2000);
      
    } catch (err) {
      // console.error('❌ Failed to save JSON data:', err);
      // console.error('Error details:', {
      //   key,
      //   data,
      //   error: err instanceof Error ? err.message : err
      // });
      
      // Check for specific API errors
      if (err instanceof Error) {
        if (err.message.includes('404') || err.message.includes('BluePrints API not available')) {
          setError('BluePrints plugin API not available. The Flora Fields plugin may not be active or properly configured on your WordPress site. Please check the plugin status and try again.');
        } else if (err.message.includes('503') || err.message.includes('Service Unavailable')) {
          setError('BluePrints plugin API is temporarily unavailable. Please try again in a moment.');
        } else if (err.message.includes('401') || err.message.includes('403')) {
          setError('Authentication failed. Please check your API credentials and try again.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to save pricing data. Please check your connection and try again.');
      }
    } finally {
      setIsOperating(false);
    }
  };

  // Stage 3: Create blueprint assignment
  const createBlueprintAssignment = async (blueprintId: number) => {
    try {
      setIsOperating(true);
      const assignmentData = {
        ...assignmentFormData,
        blueprint_id: blueprintId
      };
      await floraFieldsAPI.createBlueprintAssignment(assignmentData);
      
      // Reload assignments
      const assignments = await floraFieldsAPI.getBlueprintAssignments(blueprintId);
      setBlueprintAssignments(prev => ({ ...prev, [blueprintId]: assignments }));
      
      // Reset form
      setShowAssignmentForm(prev => ({ ...prev, [blueprintId]: false }));
      setAssignmentFormData({
        blueprint_id: blueprintId,
        entity_type: 'product',
        entity_id: undefined,
        category_id: undefined,
        scope_type: 'specific',
        include_descendants: false,
        assignment_mode: 'include',
        priority: 0,
        sort_order: 0,
        is_active: true
      });
      setError(null);
    } catch (err) {
      // console.error('Failed to create blueprint assignment:', err);
      setError(err instanceof Error ? err.message : 'Failed to create blueprint assignment');
    } finally {
      setIsOperating(false);
    }
  };



  // Stage 3: Delete blueprint assignment
  // Tier management functions
  const moveTier = (blueprintId: number, groupName: string, fromIndex: number, toIndex: number) => {
    const key = `${blueprintId}-${groupName}`;
    const currentTiers = editingTiers[key] || [];
    const newTiers = [...currentTiers];
    const [movedTier] = newTiers.splice(fromIndex, 1);
    newTiers.splice(toIndex, 0, movedTier);
    
    setEditingTiers(prev => ({
      ...prev,
      [key]: newTiers
    }));
  };

  const deleteTier = (blueprintId: number, groupName: string, tierIndex: number) => {
    const key = `${blueprintId}-${groupName}`;
    const currentTiers = editingTiers[key] || [];
    const newTiers = currentTiers.filter((_, index) => index !== tierIndex);
    
    setEditingTiers(prev => ({
      ...prev,
      [key]: newTiers
    }));
  };

  const updateTier = (blueprintId: number, groupName: string, tierIndex: number, field: string, value: any) => {
    const key = `${blueprintId}-${groupName}`;
    const currentTiers = editingTiers[key] || [];
    const newTiers = [...currentTiers];
    
    if (newTiers[tierIndex]) {
      newTiers[tierIndex] = {
        ...newTiers[tierIndex],
        [field]: value
      };
      
      setEditingTiers(prev => ({
        ...prev,
        [key]: newTiers
      }));
    }
  };

  const initializeEditingTiers = (blueprintId: number, groupName: string, rules: any[]) => {
    const key = `${blueprintId}-${groupName}`;
    if (!editingTiers[key] && rules.length > 0) {
      const firstRule = rules[0];
      try {
        const conditions = typeof firstRule.conditions === 'string' 
          ? JSON.parse(firstRule.conditions) 
          : firstRule.conditions;
        
        // Ensure conditions is an object before accessing properties
        if (conditions && typeof conditions === 'object') {
          const tiers = conditions.tiers || [];
          
          if (tiers.length > 0) {
            setEditingTiers(prev => ({
              ...prev,
              [key]: tiers
            }));
          }
        }
      } catch (err) {
        // console.error('Failed to initialize editing tiers:', err);
      }
    }
  };

  // Save pricing tiers for a specific group
  const savePricingTiers = async (blueprintId: number, groupName: string) => {
    const key = `${blueprintId}-${groupName}`;
    const tiers = editingTiers[key];
    
    if (!tiers || tiers.length === 0) return;

    try {
      setIsOperating(true);
      
      // Get the pricing rules for this group
      const allBlueprintRules = blueprintPricingRules[blueprintId] || [];
      
      const groupRules = allBlueprintRules.filter(rule => {
        const conditions = typeof rule.conditions === 'string' 
          ? JSON.parse(rule.conditions) 
          : rule.conditions;
        
        // Check multiple possible fields and handle case insensitivity
        const groupNameLower = groupName.toLowerCase();
        return (
          conditions?.category_name === groupName || 
          conditions?.product_form === groupName ||
          conditions?.product_type === groupNameLower ||
          conditions?.category_name?.toLowerCase() === groupNameLower ||
          conditions?.product_form?.toLowerCase() === groupNameLower ||
          conditions?.product_type?.toLowerCase() === groupNameLower
        );
      });

      if (groupRules.length > 0) {
        const rule = groupRules[0]; // Update the first rule in the group
        
        const conditions = typeof rule.conditions === 'string' 
          ? JSON.parse(rule.conditions) 
          : rule.conditions;

        const updatedConditions = {
          ...conditions,
          tiers: tiers.map(tier => ({
            name: tier.name,
            min_quantity: parseFloat(tier.min_quantity) || 0,
            max_quantity: tier.max_quantity ? parseFloat(tier.max_quantity) : null,
            price: parseFloat(tier.price) || 0
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
          updatedRule.start_date = start_date;
        }
        if (end_date && typeof end_date === 'string' && end_date.trim() !== '') {
          updatedRule.end_date = end_date;
        }

        await pricingAPI.updatePricingRule(rule.id, updatedRule);
        
        // Reload blueprints to refresh pricing rules
        await loadBlueprints();
        
        setError(null);
      }
    } catch (err) {
      // console.error('Failed to save pricing tiers:', err);
      setError('Failed to save pricing tiers');
    } finally {
      setIsOperating(false);
    }
  };

  const deleteBlueprintAssignment = async (assignmentId: number, blueprintId: number) => {
    try {
      setIsOperating(true);
      await floraFieldsAPI.deleteBlueprintAssignment(assignmentId);
      
      // Reload assignments
      const assignments = await floraFieldsAPI.getBlueprintAssignments(blueprintId);
      setBlueprintAssignments(prev => ({ ...prev, [blueprintId]: assignments }));
      setError(null);
    } catch (err) {
      // console.error('Failed to delete blueprint assignment:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete blueprint assignment');
    } finally {
      setIsOperating(false);
    }
  };

  useEffect(() => {
    loadBlueprints();
    loadCategories();
  }, []);

  // Listen for external action events
  useEffect(() => {
    const handleBlueprintCreate = () => {
      setShowCreateForm(true);
    };

    const handleBlueprintRefresh = () => {
      loadBlueprints();
    };

    window.addEventListener('blueprintCreate', handleBlueprintCreate);
    window.addEventListener('blueprintRefresh', handleBlueprintRefresh);

    return () => {
      window.removeEventListener('blueprintCreate', handleBlueprintCreate);
      window.removeEventListener('blueprintRefresh', handleBlueprintRefresh);
    };
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="text-neutral-400">Loading field blueprints...</div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-neutral-900 hover:bg-neutral-800/50 row-hover border-t border-white/[0.02] rounded h-full">
      <div className="space-y-6 h-full overflow-y-auto scrollable-container">

        {error && (
          <div className="bg-neutral-900/40 rounded p-2">
            <div className="flex justify-between items-center">
              <div className="text-neutral-400 text-xs">{error}</div>
              <button 
                onClick={() => setError(null)}
                className="text-neutral-500 hover:text-neutral-300 text-sm"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {isOperating && (
          <div className="bg-neutral-900/40 rounded p-2">
            <div className="text-neutral-400 text-xs">Processing...</div>
          </div>
        )}

        {/* Hero Section - Jobs Style */}
        <div className="relative text-center py-6 px-8">
          {/* Grid Background extending beyond hero */}
          <div 
            className="absolute -inset-16 opacity-[0.12]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(115, 115, 115, 0.2) 1px, transparent 1px),
                linear-gradient(90deg, rgba(115, 115, 115, 0.2) 1px, transparent 1px)
              `,
              backgroundSize: '24px 24px'
            }}
          />
          
          <div className="relative z-10">
            <h1 className="text-xl font-light text-neutral-300 mb-2 tracking-tight">
              Blueprints
            </h1>
            <p className="text-sm text-neutral-500 font-light max-w-xl mx-auto leading-relaxed">
              Create reusable field templates that scale across your entire product catalog. 
              Build once, deploy everywhere.
            </p>
          </div>
        </div>

        {/* Create Blueprint Modal */}
        <Modal
          isOpen={showCreateForm}
          onClose={handleBlueprintCancel}
          title="Create Blueprint"
          size="large"
        >
          <form onSubmit={handleBlueprintSubmit} className="space-y-6">
            {/* Blueprint Basic Info */}
            <div className="space-y-4">
              <h4 className="text-sm text-neutral-400">Blueprint Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Blueprint Name */}
                <div className="bg-neutral-900/40 rounded p-2">
                  <div className="text-neutral-600 text-xs mb-1">Blueprint Name *</div>
                  <input
                    type="text"
                    value={blueprintFormData.name}
                    onChange={(e) => setBlueprintFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-2 py-1 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none text-xs"
                    placeholder="product_details"
                    pattern="^[a-zA-Z_][a-zA-Z0-9_]*$"
                    required
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Unique identifier (letters, numbers, underscores only)
                  </p>
                </div>

                {/* Blueprint Label */}
                <div className="bg-neutral-900/40 rounded p-2">
                  <div className="text-neutral-600 text-xs mb-1">Display Label *</div>
                  <input
                    type="text"
                    value={blueprintFormData.label}
                    onChange={(e) => setBlueprintFormData(prev => ({ ...prev, label: e.target.value }))}
                    className="w-full px-2 py-1 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none text-xs"
                    placeholder="Product Details"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="bg-neutral-900/40 rounded p-2">
                <div className="text-neutral-600 text-xs mb-1">Description</div>
                <textarea
                  value={blueprintFormData.description}
                  onChange={(e) => setBlueprintFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-2 py-1 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none text-xs"
                  rows={3}
                  placeholder="Describe what this blueprint is used for..."
                />
              </div>
            </div>

            {/* Blueprint Fields */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm text-neutral-400">Add Field (Optional)</h4>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => openFieldLibrary()}
                    size="sm"
                    variant="ghost"
                    className="text-xs text-neutral-400 hover:text-neutral-300 whitespace-nowrap flex items-center"
                    title="Add fields from library"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                    </svg>
                    Field Library
                  </Button>
                  <span className="text-xs text-neutral-500">
                    {(newFieldData.field_name && newFieldData.field_label) ? 'Field ready' : 'Optional field'}
                  </span>
                </div>
              </div>

              {/* Instructions */}
              <div className="rounded-lg border-b border-white/[0.02] p-2 bg-neutral-900/40 mb-2">
                <div className="text-neutral-500 text-xs">
                  Creates blueprint and any defined field in one step.
                </div>
              </div>

              {/* Field Creation Form - Always Visible */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-neutral-900/40 rounded p-2">
                  <div className="text-neutral-600 text-xs mb-1">Field Name *</div>
                  <input
                    type="text"
                    value={newFieldData.field_name}
                    onChange={(e) => {
                      setNewFieldData(prev => ({ ...prev, field_name: e.target.value }));
                    }}
                    className="w-full px-2 py-1 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none text-xs"
                    placeholder="field_name"
                  />
                </div>
                <div className="bg-neutral-900/40 rounded p-2">
                  <div className="text-neutral-600 text-xs mb-1">Field Type *</div>
                  <select
                    value={newFieldData.field_type}
                    onChange={(e) => setNewFieldData(prev => ({ ...prev, field_type: e.target.value }))}
                    className="w-full px-2 py-1 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none text-xs"
                  >
                    {FIELD_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="bg-neutral-900/40 rounded p-2">
                  <div className="text-neutral-600 text-xs mb-1">Field Label *</div>
                  <input
                    type="text"
                    value={newFieldData.field_label}
                    onChange={(e) => {
                      setNewFieldData(prev => ({ ...prev, field_label: e.target.value }));
                    }}
                    className="w-full px-2 py-1 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none text-xs"
                    placeholder="Field Label"
                  />
                </div>
                <div className="bg-neutral-900/40 rounded p-2">
                  <div className="text-neutral-600 text-xs mb-1">Description</div>
                  <input
                    type="text"
                    value={newFieldData.field_description}
                    onChange={(e) => setNewFieldData(prev => ({ ...prev, field_description: e.target.value }))}
                    className="w-full px-2 py-1 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none text-xs"
                    placeholder="Field description"
                  />
                </div>
              </div>

              {/* Field Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-neutral-900/40 rounded p-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-neutral-600 text-xs">Required Field:</div>
                      <div className="text-neutral-500 text-xs">Field must have a value</div>
                    </div>
                    <ToggleSwitch
                      checked={newFieldData.is_required}
                      onChange={(checked) => setNewFieldData(prev => ({ ...prev, is_required: checked }))}
                    />
                  </div>
                </div>
                <div className="bg-neutral-900/40 rounded p-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-neutral-600 text-xs">Searchable:</div>
                      <div className="text-neutral-500 text-xs">Include in search results</div>
                    </div>
                    <ToggleSwitch
                      checked={newFieldData.is_searchable}
                      onChange={(checked) => setNewFieldData(prev => ({ ...prev, is_searchable: checked }))}
                    />
                  </div>
                </div>
              </div>

              {/* Added Fields List */}
              {blueprintFieldsInCreation.length > 0 && (
                <div className="space-y-2">
                  <div className="text-neutral-500 text-xs">
                    {blueprintFieldsInCreation.length} field{blueprintFieldsInCreation.length !== 1 ? 's' : ''} added:
                  </div>
                  {blueprintFieldsInCreation.map((field, index) => (
                    <div
                      key={index}
                      className="group flex items-center justify-between bg-neutral-900/40 rounded p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 bg-neutral-800/40 text-neutral-400 text-xs rounded-full">
                          {field.field_type}
                        </span>
                        <div>
                          <div className="text-neutral-300 text-sm font-medium">{field.field_label}</div>
                          <div className="text-neutral-500 text-xs">
                            {field.field_name}
                            {field.is_required && <span className="ml-2 text-red-400">• Required</span>}
                            {field.is_searchable && <span className="ml-2 text-green-400">• Searchable</span>}
                          </div>
                        </div>
                      </div>
                      <IconButton
                        onClick={() => removeFieldFromBlueprintCreation(index)}
                        variant="ghost"
                        title="Remove Field"
                        className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </IconButton>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stage 4: Pricing Rules Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0 w-6 h-6 bg-neutral-700 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">4</span>
                </div>
                <h4 className="text-sm text-neutral-400">Pricing Engine</h4>
              </div>
              
              <div className="rounded-lg border-b border-white/[0.02] p-2 bg-neutral-900/40">
                <div className="text-neutral-500 text-xs mb-1">Pricing Rules → Price Lists</div>
                <p className="text-xs text-neutral-400 mb-2">
                  Configure dynamic pricing rules (quantity breaks, customer tiers, channels, stores, time windows) 
                  that automatically generate denormalized price matrices.
                </p>
                <div className="text-xs text-neutral-500">
                  Pricing rules will be available after blueprint creation via API endpoints.
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.04]">
              <Button
                type="button"
                onClick={handleBlueprintCancel}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-300"
                disabled={isOperating}
              >
                {isOperating ? 'Creating Blueprint...' : 
                  `Create Blueprint${(newFieldData.field_name && newFieldData.field_label) ? ' + Field' : ''}`
                }
              </Button>
            </div>
          </form>
        </Modal>

        {/* General Pricing Import Button */}
        <div className="mb-4 p-3 rounded-lg border-b border-white/[0.02] bg-neutral-900/40">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-neutral-300">Global Pricing Rules</h3>
              <p className="text-xs text-neutral-500 mt-1">Import pricing rules that apply to all products</p>
            </div>
            <Button
              onClick={() => openJsonEditor('pricing-rules', [])}
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

        {/* Header with migration button */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm text-neutral-400">Field Blueprints</h3>
            <p className="text-neutral-500 text-xs">All fields are automatically added to the unified field library</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={migrateLegacyFields}
              variant="secondary"
              disabled={isOperating}
              className="text-xs"
            >
              {isOperating ? 'Migrating...' : 'Migrate Legacy Fields'}
            </Button>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-300 text-xs"
              disabled={isOperating}
            >
              Create Blueprint
            </Button>
          </div>
        </div>

        {/* Blueprints List - Expandable Cards */}
        <div className="space-y-2">
          {blueprints.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-neutral-400 mb-4">No blueprints created yet</div>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-300"
              >
                Create Your First Blueprint
              </Button>
            </div>
          ) : (
            blueprints.map((blueprint) => {
              const isExpanded = expandedBlueprints.has(blueprint.id.toString());
              const fields = blueprintFields[blueprint.id] || [];
              const assignments = blueprintAssignments[blueprint.id] || [];
              
              return (
                <div
                  key={blueprint.id}
                  className="group transition-all cursor-pointer mb-2 rounded bg-neutral-900/40 hover:bg-neutral-800/60"
                >
                  {/* Main Blueprint Row */}
                  <div className="flex items-center gap-3 px-4 py-2">
                    {/* Expand/Collapse Icon */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBlueprintExpansion(blueprint.id);
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

                    {/* Blueprint Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-neutral-300 text-sm truncate">{blueprint.label}</div>
                      <div className="text-xs text-neutral-500 truncate mt-0.5">
                        {blueprint.name} • {fields.length} field{fields.length !== 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="w-24 text-right">
                      <div className="text-xs text-neutral-400">{fields.length} fields</div>
                    </div>



                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          
                          // Normalize the export structure
                          const normalizedBlueprint = {
                            id: blueprint.id,
                            slug: blueprint.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
                            label: blueprint.label,
                            description: blueprint.description || '',
                            version: 1,
                            status: blueprint.type === 'inactive' ? 'archived' : 'active',
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                          };
                          
                          const normalizedFields = fields.map(field => ({
                            id: field.id,
                            blueprint_id: field.blueprint_id,
                            name: field.field_name,
                            type: field.field_type,
                            label: field.field_label,
                            description: field.field_description || '',
                            unit: field.display_options?.unit || null,
                            precision: field.display_options?.precision || null,
                            choices: field.display_options?.choices || [],
                            choice_source: field.display_options?.choice_source || null,
                            conditional: field.display_options?.conditional || {},
                            help: field.display_options?.help || null,
                            validation: {
                              required: field.is_required || false,
                              min: field.validation_rules?.min || null,
                              max: field.validation_rules?.max || null,
                              regex: field.validation_rules?.regex || null
                            },
                            searchable: field.is_searchable || false,
                            sort_order: field.sort_order || 0
                          }));
                          
                          const normalizedAssignments = assignments.map(assignment => ({
                            id: assignment.id,
                            blueprint_id: assignment.blueprint_id,
                            target_type: assignment.entity_type,
                            target_id: assignment.entity_type === 'product' ? assignment.entity_id : assignment.category_id,
                            taxonomy: assignment.entity_type === 'category' ? 'product_cat' : null,
                            mode: assignment.assignment_mode,
                            include_descendants: assignment.include_descendants || false,
                            priority: assignment.priority || 0,
                            active: assignment.is_active !== false
                          }));
                          
                          const pricingRules = blueprintPricingRules[blueprint.id] || [];
                          const normalizedPricingRules = pricingRules.map(rule => {
                            let conditions = rule.conditions;
                            if (typeof conditions === 'string') {
                              try {
                                conditions = JSON.parse(conditions);
                              } catch (e) {
                                conditions = {};
                              }
                            }
                            
                            return {
                              id: rule.id,
                              blueprint_id: blueprint.id,
                              rule_name: rule.rule_name,
                              rule_type: rule.rule_type,
                              priority: rule.priority || 10,
                              filters: {
                                product_type: conditions.product_type || null,
                                channels: conditions.channels || [],
                                stores: conditions.stores || [],
                                customer_tiers: conditions.tiers || conditions.customer_tiers || []
                              },
                              unit: conditions.unit || 'units',
                              currency: 'USD',
                              breaks: conditions.breaks || [],
                              formula: rule.formula || null,
                              valid_from: null,
                              valid_to: null,
                              active: rule.is_active !== false,
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString()
                            };
                          });
                          
                          openJsonEditor(`full-blueprint-${blueprint.id}`, {
                            blueprint: normalizedBlueprint,
                            fields: normalizedFields,
                            assignments: normalizedAssignments,
                            pricing_rules: normalizedPricingRules
                          });
                        }}
                        size="sm"
                        variant="ghost"
                        className="px-2 py-1 text-xs bg-neutral-900/40 hover:bg-neutral-800/50 rounded-lg border-b border-white/[0.02] text-neutral-400 hover:text-neutral-300"
                        title="View/Export Full Blueprint JSON"
                      >
                        JSON
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          showDuplicateConfirm(blueprint);
                        }}
                        size="sm"
                        variant="ghost"
                        className="px-2 py-1 text-xs bg-neutral-900/40 hover:bg-neutral-800/50 rounded-lg border-b border-white/[0.02] text-neutral-400 hover:text-neutral-300"
                        title="Duplicate Blueprint"
                      >
                        Duplicate
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          showDeleteConfirm(blueprint);
                        }}
                        size="sm"
                        variant="ghost"
                        className="px-2 py-1 text-xs bg-neutral-900/40 hover:bg-neutral-800/50 rounded-lg border-b border-white/[0.02] text-red-400 hover:text-red-300"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="mx-4 mb-2 rounded p-4 bg-neutral-800/30 hover:bg-neutral-800/50 row-hover border-t border-white/[0.02]">
                      
                      {/* Tab Navigation */}
                      <div className="flex items-center gap-2 border-b border-white/[0.1] bg-neutral-900/30 p-2">
                        {BLUEPRINT_TAB_CONFIGS.map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setBlueprintActiveTab(blueprint.id, tab.id)}
                            className={`p-2 rounded-xl row-hover ease-out  flex items-center justify-center ${
                              getBlueprintActiveTab(blueprint.id) === tab.id
                                ? 'text-neutral-400 bg-white/15 shadow-lg shadow-white/10 border border-white/30'
                                : 'text-neutral-500 hover:text-neutral-400 bg-transparent hover:bg-neutral-800/50 border border-transparent hover:border-white/10 hover:shadow-sm hover:shadow-black/10'
                            }`}
                            title={tab.title}
                          >
                            {tab.icon}
                          </button>
                        ))}
                      </div>

                      {/* Tab Content */}
                      <div className="p-4">
                        {getBlueprintActiveTab(blueprint.id) === 'preview' && (
                          /* Blueprint Preview */
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center text-neutral-500 text-xs">
                                Blueprint Overview
                              </div>
                              <div className="flex items-center gap-2">
                                {isEditMode(blueprint.id, 'preview') ? (
                                  <>
                                    <Button
                                      onClick={() => saveEditChanges(blueprint.id, 'preview')}
                                      size="sm"
                                      variant="ghost"
                                      className="text-xs text-green-400 hover:text-green-300"
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      onClick={() => cancelEditChanges(blueprint.id, 'preview')}
                                      size="sm"
                                      variant="ghost"
                                      className="text-xs text-neutral-400 hover:text-neutral-300"
                                    >
                                      Cancel
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    onClick={() => toggleEditMode(blueprint.id, 'preview')}
                                    size="sm"
                                    variant="ghost"
                                    className="text-xs text-neutral-400 hover:text-neutral-300"
                                  >
                                    Edit
                                  </Button>
                                )}
                              </div>
                            </div>
                            
                            {/* Blueprint Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                              {/* Fields Summary */}
                              <div className="bg-neutral-900/40 rounded p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-neutral-500 text-xs">Fields</h4>
                                  <div className="text-lg font-normal text-neutral-300">{fields.length}</div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-neutral-500">Required:</span>
                                    <span className="text-neutral-400">
                                      {fields.filter(f => f.is_required).length}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-neutral-500">Searchable:</span>
                                    <span className="text-neutral-400">
                                      {fields.filter(f => f.is_searchable).length}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Pricing Rules Summary */}
                              <div className="bg-neutral-900/40 rounded p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-neutral-500 text-xs">Pricing Rules</h4>
                                  <div className="text-lg font-normal text-neutral-300">
                                    {(blueprintPricingRules[blueprint.id] || []).length}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-neutral-500">Active:</span>
                                    <span className="text-neutral-400">
                                      {(blueprintPricingRules[blueprint.id] || []).filter(r => r.is_active).length}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-neutral-500">Types:</span>
                                    <span className="text-neutral-400">
                                      {new Set((blueprintPricingRules[blueprint.id] || []).map(r => r.rule_type)).size}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Assignments Summary */}
                              <div className="bg-neutral-900/40 rounded p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-neutral-500 text-xs">Assignments</h4>
                                  <div className="text-lg font-normal text-neutral-300">{assignments.length}</div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-neutral-500">Products:</span>
                                    <span className="text-neutral-400">
                                      {assignments.filter(a => a.entity_type === 'product').length}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-neutral-500">Categories:</span>
                                    <span className="text-neutral-400">
                                      {assignments.filter(a => a.entity_type === 'category').length}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Detailed Sections */}
                            <div className="space-y-6">
                              {/* Fields Preview */}
                              {fields.length > 0 && (
                                <div className="rounded-lg border-b border-white/[0.02] p-4">
                                  <h5 className="text-xs text-neutral-500 mb-4">Fields ({fields.length})</h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {fields.slice(0, 6).map((field) => (
                                      <div key={field.id} className="bg-neutral-900/40 rounded p-3">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-neutral-400 text-xs">{field.field_label}</span>
                                          <span className="text-neutral-500 text-xs bg-neutral-800/50 px-2 py-1 rounded">{field.field_type}</span>
                                        </div>
                                        <div className="text-neutral-500 text-xs">{field.field_name}</div>
                                        {field.is_required && (
                                          <div className="text-orange-400 text-xs mt-1">Required</div>
                                        )}
                                      </div>
                                    ))}
                                    {fields.length > 6 && (
                                      <div className="bg-neutral-900/40 rounded p-3 flex items-center justify-center">
                                        <span className="text-neutral-500 text-xs">+{fields.length - 6} more</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Pricing Rules Preview */}
                              {(blueprintPricingRules[blueprint.id] || []).length > 0 && (
                                <div className="rounded-lg border-b border-white/[0.02] p-4">
                                  <h5 className="text-xs text-neutral-500 mb-4">
                                    Pricing Rules ({(blueprintPricingRules[blueprint.id] || []).length})
                                  </h5>
                                  <div className="space-y-3">
                                    {(blueprintPricingRules[blueprint.id] || []).slice(0, 3).map((rule) => (
                                      <div key={rule.id} className="bg-neutral-900/40 rounded p-3">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-neutral-400 text-xs">{rule.rule_name}</span>
                                          <span className="text-neutral-500 text-xs bg-neutral-800/50 px-2 py-1 rounded">{rule.rule_type.replace('_', ' ')}</span>
                                        </div>
                                        <div className="text-neutral-500 text-xs">Priority: {rule.priority}</div>
                                        {rule.is_active && (
                                          <div className="text-neutral-500 text-xs mt-1">Active</div>
                                        )}
                                      </div>
                                    ))}
                                    {(blueprintPricingRules[blueprint.id] || []).length > 3 && (
                                      <div className="bg-neutral-900/40 rounded p-3 flex items-center justify-center">
                                        <span className="text-neutral-500 text-xs">
                                          +{(blueprintPricingRules[blueprint.id] || []).length - 3} more
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Assignments Preview */}
                              {assignments.length > 0 && (
                                <div className="rounded-lg border-b border-white/[0.02] p-4">
                                  <h5 className="text-xs text-neutral-500 mb-4">Assignments ({assignments.length})</h5>
                                  <div className="space-y-3">
                                    {assignments.slice(0, 3).map((assignment) => (
                                      <div key={assignment.id} className="bg-neutral-900/40 rounded p-3">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-neutral-400 text-xs">
                                            {assignment.entity_type === 'product' ? 'Product' : 'Category'}
                                          </span>
                                          <span className="text-neutral-500 text-xs bg-neutral-800/50 px-2 py-1 rounded">{assignment.assignment_mode}</span>
                                        </div>
                                        <div className="text-neutral-500 text-xs">
                                          {assignment.entity_type === 'category' 
                                            ? (() => {
                                                if (categories.length === 0) return `Category ID: ${assignment.category_id}`;
                                                const category = categories.find(cat => cat.id == assignment.category_id);
                                                return category?.name || `Category ID: ${assignment.category_id}`;
                                              })()
                                            : `Product ID: ${assignment.entity_id}`
                                          }
                                        </div>
                                        {assignment.is_active && (
                                          <div className="text-neutral-500 text-xs mt-1">Active</div>
                                        )}
                                      </div>
                                    ))}
                                    {assignments.length > 3 && (
                                      <div className="bg-neutral-900/40 rounded p-3 flex items-center justify-center">
                                        <span className="text-neutral-500 text-xs">+{assignments.length - 3} more</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Empty State */}
                              {fields.length === 0 && (blueprintPricingRules[blueprint.id] || []).length === 0 && assignments.length === 0 && (
                                <div className="text-center py-12">
                                  <div className="text-neutral-500 text-xs mb-3">Blueprint is empty</div>
                                  <div className="text-neutral-500 text-xs">Add fields, pricing rules, or assignments to get started</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {getBlueprintActiveTab(blueprint.id) === 'details' && (
                          /* Blueprint Details */
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center text-neutral-500 font-medium text-xs">
                                Blueprint Details
                                <JsonIcon
                                  onClick={() => openJsonEditor(`details-${blueprint.id}`, blueprint)}
                                  title="Edit blueprint details as JSON"
                                />
                              </div>
                              <div className="flex gap-2">
                                {isEditMode(blueprint.id, 'details') ? (
                                  <>
                                    <Button
                                      onClick={() => saveEditChanges(blueprint.id, 'details')}
                                      size="sm"
                                      variant="ghost"
                                      className="text-xs text-green-400 hover:text-green-300"
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      onClick={() => cancelEditChanges(blueprint.id, 'details')}
                                      size="sm"
                                      variant="ghost"
                                      className="text-xs text-neutral-400 hover:text-neutral-300"
                                    >
                                      Cancel
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      onClick={() => toggleEditMode(blueprint.id, 'details')}
                                      size="sm"
                                      variant="ghost"
                                      className="text-xs text-neutral-400 hover:text-neutral-300"
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      onClick={() => openJsonEditor(`details-bulk-${blueprint.id}`, {})}
                                      size="sm"
                                      variant="ghost"
                                      className="text-xs text-neutral-400 hover:text-neutral-300 whitespace-nowrap flex items-center min-w-fit"
                                      title="Import blueprint details from JSON"
                                    >
                                      <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                      </svg>
                                      Import JSON
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                        
                        {isEditMode(blueprint.id, 'details') ? (
                          /* Edit Mode */
                          <div className="space-y-3">
                            <div className="bg-neutral-900/40 rounded p-3">
                              <label className="text-neutral-600 text-xs block mb-1">Name:</label>
                              <input
                                type="text"
                                value={editingData[getEditModeKey(blueprint.id, 'details')]?.name || blueprint.name}
                                onChange={(e) => updateEditingData(blueprint.id, 'details', {
                                  ...editingData[getEditModeKey(blueprint.id, 'details')],
                                  name: e.target.value
                                })}
                                className="w-full px-2 py-1 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none text-xs"
                              />
                            </div>
                            
                            <div className="bg-neutral-900/40 rounded p-3">
                              <label className="text-neutral-600 text-xs block mb-1">Label:</label>
                              <input
                                type="text"
                                value={editingData[getEditModeKey(blueprint.id, 'details')]?.label || blueprint.label}
                                onChange={(e) => updateEditingData(blueprint.id, 'details', {
                                  ...editingData[getEditModeKey(blueprint.id, 'details')],
                                  label: e.target.value
                                })}
                                className="w-full px-2 py-1 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none text-xs"
                              />
                            </div>
                            
                            <div className="bg-neutral-900/40 rounded p-3">
                              <label className="text-neutral-600 text-xs block mb-1">Type:</label>
                              <select
                                value={editingData[getEditModeKey(blueprint.id, 'details')]?.type || blueprint.type}
                                onChange={(e) => updateEditingData(blueprint.id, 'details', {
                                  ...editingData[getEditModeKey(blueprint.id, 'details')],
                                  type: e.target.value
                                })}
                                className="w-full px-2 py-1 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none text-xs"
                              >
                                <option value="product">Product</option>
                                <option value="category">Category</option>
                                <option value="global">Global</option>
                              </select>
                            </div>
                            
                            <div className="bg-neutral-900/40 rounded p-3">
                              <label className="text-neutral-600 text-xs block mb-1">Description:</label>
                              <textarea
                                value={editingData[getEditModeKey(blueprint.id, 'details')]?.description || blueprint.description || ''}
                                onChange={(e) => updateEditingData(blueprint.id, 'details', {
                                  ...editingData[getEditModeKey(blueprint.id, 'details')],
                                  description: e.target.value
                                })}
                                rows={3}
                                className="w-full px-2 py-1 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none text-xs resize-none"
                                placeholder="Optional description..."
                              />
                            </div>
                          </div>
                        ) : (
                          /* View Mode */
                          <div className="space-y-2">
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 text-xs">Name:</span>
                                <span className="text-neutral-500 text-xs">{blueprint.name}</span>
                              </div>
                            </div>
                            
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 text-xs">Label:</span>
                                <span className="text-neutral-500 text-xs">{blueprint.label}</span>
                              </div>
                            </div>
                            
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 text-xs">Type:</span>
                                <span className="text-neutral-500 text-xs">{blueprint.type}</span>
                              </div>
                            </div>
                            
                            {blueprint.description && (
                              <div className="bg-neutral-900/40 rounded p-2">
                                <div className="text-neutral-600 text-xs font-medium mb-1">Description</div>
                                <div className="text-neutral-500 text-xs leading-relaxed">
                                  {blueprint.description}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                          </div>
                        )}

                        {getBlueprintActiveTab(blueprint.id) === 'fields' && (
                          /* Fields Section */
                          <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center text-neutral-500 font-medium text-xs">
                            Fields ({fields.length})
                            <JsonIcon
                              onClick={() => openJsonEditor(`fields-${blueprint.id}`, fields)}
                              title="Edit fields as JSON"
                            />
                          </div>
                          <div className="flex gap-2">
                            {isEditMode(blueprint.id, 'fields') ? (
                              <>
                                <Button
                                  onClick={() => saveEditChanges(blueprint.id, 'fields')}
                                  size="sm"
                                  variant="ghost"
                                  className="text-xs text-green-400 hover:text-green-300"
                                >
                                  Save
                                </Button>
                                <Button
                                  onClick={() => cancelEditChanges(blueprint.id, 'fields')}
                                  size="sm"
                                  variant="ghost"
                                  className="text-xs text-neutral-400 hover:text-neutral-300"
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  onClick={() => toggleEditMode(blueprint.id, 'fields')}
                                  size="sm"
                                  variant="ghost"
                                  className="text-xs text-neutral-400 hover:text-neutral-300"
                                >
                                  Edit
                                </Button>
                                <Button
                                  onClick={() => openJsonEditor(`fields-bulk-${blueprint.id}`, [])}
                                  size="sm"
                                  variant="ghost"
                                  className="text-xs text-neutral-400 hover:text-neutral-300 whitespace-nowrap flex items-center min-w-fit"
                                  title="Import fields from JSON"
                                >
                                  <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                  </svg>
                                  Import JSON
                                </Button>
                                <Button
                                  onClick={() => openFieldLibrary(blueprint.id)}
                              size="sm"
                              variant="ghost"
                              className="text-xs text-neutral-400 hover:text-neutral-300 whitespace-nowrap flex items-center min-w-fit"
                              title="Add fields from library"
                            >
                              <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                              </svg>
                              Field Library
                            </Button>
                                <Button
                                  onClick={() => setShowFieldForm(prev => ({ ...prev, [blueprint.id]: true }))}
                                  size="sm"
                                  variant="ghost"
                                  className="text-xs text-neutral-400 hover:text-neutral-300"
                                >
                                  + Add Field
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Add Field Form */}
                        {showFieldForm[blueprint.id] && (
                          <div className="rounded-lg border-b border-white/[0.02] p-2 bg-neutral-900/40 mb-2">
                            <div className="text-neutral-500 text-xs mb-2">Add New Field</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                              <div>
                                <div className="text-neutral-600 text-xs mb-1">Field Name *</div>
                                <input
                                  type="text"
                                  value={fieldFormData.field_name}
                                  onChange={(e) => setFieldFormData(prev => ({ ...prev, field_name: e.target.value }))}
                                  className="w-full px-2 py-1 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none text-xs"
                                  placeholder="field_name"
                                />
                              </div>
                              <div>
                                <div className="text-neutral-600 text-xs mb-1">Field Label *</div>
                                <input
                                  type="text"
                                  value={fieldFormData.field_label}
                                  onChange={(e) => setFieldFormData(prev => ({ ...prev, field_label: e.target.value }))}
                                  className="w-full px-2 py-1 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none text-xs"
                                  placeholder="Field Label"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => createBlueprintField(blueprint.id)}
                                size="sm"
                                variant="primary"
                                disabled={!fieldFormData.field_name || !fieldFormData.field_label || isOperating}
                                className="text-xs"
                              >
                                Add Field
                              </Button>
                              <Button
                                onClick={() => setShowFieldForm(prev => ({ ...prev, [blueprint.id]: false }))}
                                size="sm"
                                variant="secondary"
                                className="text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {fields.length === 0 ? (
                          <div className="text-neutral-600 text-xs">
                            No fields defined
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {fields.map((field) => (
                              <div key={field.id} className="bg-neutral-900/40 rounded p-2">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-neutral-600 text-xs">Field:</span>
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-neutral-900/40 text-neutral-500 rounded text-xs font-medium">
                                      {field.field_type}
                                    </span>
                                    <IconButton
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setRemoveFieldConfirm({ 
                                        show: true, 
                                        field, 
                                        blueprintId: blueprint.id 
                                      })}
                                      className="h-6 w-6 text-orange-400 hover:text-orange-300 hover:bg-orange-600/10"
                                      title="Remove field from blueprint"
                                    >
                                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                      </svg>
                                    </IconButton>
                                  </div>
                                </div>
                                <div className="text-neutral-600 text-xs font-medium mb-1">{field.field_label}</div>
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-neutral-600">Name:</span>
                                  <span className="text-neutral-500 font-mono">{field.field_name}</span>
                                </div>
                                {field.field_description && (
                                  <div className="mt-1 pt-1 border-t border-white/[0.04]">
                                    <div className="text-neutral-500 text-xs leading-relaxed">
                                      {field.field_description}
                                    </div>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  {field.is_required && (
                                    <span className="px-1 py-0.5 bg-red-600/20 text-red-400 text-xs rounded">
                                      Required
                                    </span>
                                  )}
                                  {field.is_searchable && (
                                    <span className="px-1 py-0.5 bg-green-600/20 text-green-400 text-xs rounded">
                                      Searchable
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                          </div>
                        )}

                        {getBlueprintActiveTab(blueprint.id) === 'pricing' && (
                          /* Pricing Rules Section */
                          <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center text-neutral-500 font-medium text-xs">
                            Pricing Rules ({(blueprintPricingRules[blueprint.id] || []).length})
                            <JsonIcon
                              onClick={() => openJsonEditor(`pricing-rules-${blueprint.id}`, blueprintPricingRules[blueprint.id] || [])}
                              title="Edit pricing rules as JSON"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!isOperating) {
                                  setPricingRulesPickerBlueprintId(blueprint.id);
                                  setShowPricingRulesPicker(true);
                                }
                              }}
                              size="sm"
                              variant="ghost"
                              disabled={isOperating}
                              className="text-xs text-neutral-400 hover:text-neutral-300 whitespace-nowrap flex items-center min-w-fit disabled:opacity-50"
                              title="Add existing pricing rules from library"
                            >
                              <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                              </svg>
                              Add from Library
                            </Button>
                            <Button
                              onClick={() => openJsonEditor(`pricing-bulk-${blueprint.id}`, [])}
                              size="sm"
                              variant="ghost"
                              className="text-xs text-neutral-400 hover:text-neutral-300 whitespace-nowrap flex items-center min-w-fit"
                              title="Import pricing rules from JSON"
                            >
                              <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                              </svg>
                              Import JSON
                            </Button>
                            <Button
                              onClick={() => setShowPricingForm(prev => ({ ...prev, [blueprint.id]: true }))}
                              size="sm"
                              variant="ghost"
                              className="text-xs text-neutral-400 hover:text-neutral-300"
                            >
                              + Add Pricing Rule
                            </Button>
                          </div>
                        </div>

                        {/* Display existing pricing rules - Theme Matched Cards */}
                        {blueprintPricingRules[blueprint.id] && blueprintPricingRules[blueprint.id].length > 0 && (
                          <div className="space-y-3 mb-4">
                            {(() => {
                              // Group rules by product type
                              const groupedRules: Record<string, any[]> = {};
                              
                              blueprintPricingRules[blueprint.id].forEach((rule: any) => {
                                try {
                                  const conditions = typeof rule.conditions === 'string' 
                                    ? JSON.parse(rule.conditions) 
                                    : rule.conditions;
                                  
                                  const productType = conditions.product_type || 'General';
                                  const groupKey = productType.charAt(0).toUpperCase() + productType.slice(1);
                                  
                                  if (!groupedRules[groupKey]) {
                                    groupedRules[groupKey] = [];
                                  }
                                  groupedRules[groupKey].push(rule);
                                } catch (err) {
                                  if (!groupedRules['General']) {
                                    groupedRules['General'] = [];
                                  }
                                  groupedRules['General'].push(rule);
                                }
                              });

                              return Object.entries(groupedRules).map(([groupName, rules]) => {
                                // Create the complete JSON structure for this group
                                const completeJsonStructure = rules.map(rule => {
                                  let conditions;
                                  try {
                                    conditions = typeof rule.conditions === 'string' 
                                      ? JSON.parse(rule.conditions) 
                                      : rule.conditions;
                                  } catch (err) {
                                    conditions = {};
                                  }

                                  return {
                                    rule_name: rule.rule_name,
                                    rule_type: rule.rule_type,
                                    priority: rule.priority || 10,
                                    conditions: conditions,
                                    formula: rule.formula,
                                    is_active: rule.is_active !== false
                                  };
                                });

                                // Calculate summary statistics
                                let totalTiers = 0;
                                let priceRange = { min: Infinity, max: -Infinity };
                                
                                rules.forEach(rule => {
                                  try {
                                    const conditions = typeof rule.conditions === 'string' 
                                      ? JSON.parse(rule.conditions) 
                                      : rule.conditions;
                                    
                                    if (conditions.tiers && Array.isArray(conditions.tiers)) {
                                      totalTiers += conditions.tiers.length;
                                      conditions.tiers.forEach((tier: any) => {
                                        const price = parseFloat(tier.price) || 0;
                                        if (price > 0) {
                                          priceRange.min = Math.min(priceRange.min, price);
                                          priceRange.max = Math.max(priceRange.max, price);
                                        }
                                      });
                                    } else if (rule.formula && rule.rule_type === 'quantity_break') {
                                      // Try to parse formula as JSON quantity-price mapping
                                      try {
                                        const formula = typeof rule.formula === 'string' ? JSON.parse(rule.formula) : rule.formula;
                                        if (typeof formula === 'object' && !Array.isArray(formula)) {
                                          const prices = Object.values(formula).map(p => parseFloat(p as string) || 0);
                                          totalTiers += prices.length;
                                          prices.forEach(price => {
                                            if (price > 0) {
                                              priceRange.min = Math.min(priceRange.min, price);
                                              priceRange.max = Math.max(priceRange.max, price);
                                            }
                                          });
                                        } else {
                                          totalTiers += 1;
                                          const price = parseFloat(rule.formula) || 0;
                                          if (price > 0) {
                                            priceRange.min = Math.min(priceRange.min, price);
                                            priceRange.max = Math.max(priceRange.max, price);
                                          }
                                        }
                                      } catch (formulaErr) {
                                        totalTiers += 1;
                                        const price = parseFloat(rule.formula) || 0;
                                        if (price > 0) {
                                          priceRange.min = Math.min(priceRange.min, price);
                                          priceRange.max = Math.max(priceRange.max, price);
                                        }
                                      }
                                    } else {
                                      totalTiers += 1;
                                      const price = parseFloat(rule.formula) || 0;
                                      if (price > 0) {
                                        priceRange.min = Math.min(priceRange.min, price);
                                        priceRange.max = Math.max(priceRange.max, price);
                                      }
                                    }
                                  } catch (err) {
                                    totalTiers += 1;
                                    const price = parseFloat(rule.formula) || 0;
                                    if (price > 0) {
                                      priceRange.min = Math.min(priceRange.min, price);
                                      priceRange.max = Math.max(priceRange.max, price);
                                    }
                                  }
                                });

                                const displayPriceRange = priceRange.min === Infinity ? 
                                  'No pricing set' : 
                                  `$${priceRange.min.toFixed(2)} - $${priceRange.max.toFixed(2)}`;

                                const isExpanded = expandedBlueprints.has(`pricing-group-${blueprint.id}-${groupName}`);

                                return (
                                  <div key={groupName} className="rounded bg-neutral-900/40 hover:bg-neutral-800/60 smooth-hover ease-in-out">
                                    {/* Header */}
                                    <div 
                                      className="flex items-center justify-between p-3 cursor-pointer"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        const key = `pricing-group-${blueprint.id}-${groupName}`;
                                        setExpandedBlueprints(prev => {
                                          const newSet = new Set(prev);
                                          if (newSet.has(key)) {
                                            newSet.delete(key);
                                          } else {
                                            newSet.add(key);
                                          }
                                          return newSet;
                                        });
                                      }}
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="text-neutral-500 text-sm">
                                          {groupName} Pricing Rules ({rules.length})
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className="text-xs text-neutral-600">
                                          {displayPriceRange}
                                        </span>
                                        <Button
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            try {
                                              for (const rule of rules) {
                                                await pricingAPI.deactivatePricingRule(rule.id);
                                              }
                                              await loadBlueprints();
                                            } catch (err) {
                                              // console.error('Failed to remove pricing rules:', err);
                                            }
                                          }}
                                          size="sm"
                                          variant="ghost"
                                          className="text-xs text-orange-400 hover:text-orange-300"
                                        >
                                          Remove
                                        </Button>
                                        <svg 
                                          className={`w-4 h-4 text-neutral-500 transition-transform ${
                                            isExpanded ? 'rotate-90' : ''
                                          }`}
                                          fill="none" 
                                          stroke="currentColor" 
                                          viewBox="0 0 24 24"
                                        >
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                      </div>
                                    </div>

                                    {/* Expanded Content */}
                                    <div 
                                      className={`overflow-hidden row-hover ease-in-out ${
                                        isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
                                      }`}
                                    >
                                      <div className="border-t border-white/[0.04]">
                                        {/* Summary Stats */}
                                        <div className="grid grid-cols-3 gap-3 p-3 border-b border-white/[0.04]">
                                          <div className="text-center p-2 bg-neutral-900/40 rounded">
                                            <span className="block text-lg font-bold text-neutral-300">
                                              {rules.length}
                                            </span>
                                            <div className="text-xs text-neutral-600 mt-1">
                                              Rules
                                            </div>
                                          </div>
                                          <div className="text-center p-2 bg-neutral-900/40 rounded">
                                            <span className="block text-lg font-bold text-neutral-300">
                                              {totalTiers}
                                            </span>
                                            <div className="text-xs text-neutral-600 mt-1">
                                              Tiers
                                            </div>
                                          </div>
                                          <div className="text-center p-2 bg-neutral-900/40 rounded">
                                            <span className="block text-xs font-bold text-neutral-400">
                                              {displayPriceRange}
                                            </span>
                                            <div className="text-xs text-neutral-600 mt-1">
                                              Range
                                            </div>
                                          </div>
                                        </div>

                                        {/* Tier Management Interface */}
                                        <div className="p-3">
                                          <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                              <h4 className="text-sm text-neutral-400 font-medium">Pricing Management</h4>
                                              {/* View Toggle */}
                                              <div className="flex bg-neutral-800/50 rounded-lg p-1">
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    const key = `view-mode-${blueprint.id}-${groupName}`;
                                                    setExpandedBlueprints(prev => {
                                                      const newSet = new Set(prev);
                                                      newSet.delete(key);
                                                      return newSet;
                                                    });
                                                  }}
                                                  className={`px-2 py-1 text-xs rounded smooth-hover ${
                                                    !expandedBlueprints.has(`view-mode-${blueprint.id}-${groupName}`)
                                                      ? 'bg-neutral-700/60 text-neutral-300'
                                                      : 'text-neutral-500 hover:text-neutral-400'
                                                  }`}
                                                >
                                                  Visual Editor
                                                </button>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    const key = `view-mode-${blueprint.id}-${groupName}`;
                                                    setExpandedBlueprints(prev => {
                                                      const newSet = new Set(prev);
                                                      newSet.add(key);
                                                      return newSet;
                                                    });
                                                  }}
                                                  className={`px-2 py-1 text-xs rounded smooth-hover ${
                                                    expandedBlueprints.has(`view-mode-${blueprint.id}-${groupName}`)
                                                      ? 'bg-neutral-700/60 text-neutral-300'
                                                      : 'text-neutral-500 hover:text-neutral-400'
                                                  }`}
                                                >
                                                  JSON View
                                                </button>
                                              </div>
                                            </div>
                                            <div className="flex gap-2">
                                              <Button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  // Add new tier logic here
                                                }}
                                                size="sm"
                                                variant="ghost"
                                                className="text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 hover:border-emerald-400/40"
                                              >
                                                + Add Tier
                                              </Button>
                                              <Button
                                                onClick={async (e) => {
                                                  e.stopPropagation();
                                                  try {
                                                    await navigator.clipboard.writeText(JSON.stringify(completeJsonStructure, null, 2));
                                                  } catch (err) {
                                                    // console.error('Failed to copy JSON:', err);
                                                  }
                                                }}
                                                size="sm"
                                                variant="ghost"
                                                className="text-xs text-neutral-500 hover:text-neutral-400"
                                              >
                                                Copy JSON
                                              </Button>
                                            </div>
                                          </div>
                                          {/* Conditional View Content */}
                                          {expandedBlueprints.has(`view-mode-${blueprint.id}-${groupName}`) ? (
                                            /* JSON View */
                                            <div className="relative">
                                              <pre className="bg-black/50 border border-white/[0.08] rounded text-xs font-mono leading-relaxed p-3 overflow-x-auto max-h-64 overflow-y-auto">
                                                <code dangerouslySetInnerHTML={{
                                                  __html: JSON.stringify(completeJsonStructure, null, 2)
                                                    .replace(/"([^"]+)":/g, '<span class="text-neutral-300">"$1"</span>:') // Keys - very subtle
                                                    .replace(/: "([^"]+)"/g, ': <span class="text-neutral-200">"$1"</span>') // String values - barely lighter
                                                    .replace(/: (\d+\.?\d*)/g, ': <span class="text-neutral-100">$1</span>') // Numbers - subtle highlight
                                                    .replace(/: (true|false)/g, ': <span class="text-neutral-200">$1</span>') // Booleans - same as strings
                                                    .replace(/(\{|\}|\[|\])/g, '<span class="text-neutral-600">$1</span>') // Brackets
                                                    .replace(/(,)/g, '<span class="text-neutral-700">$1</span>') // Commas
                                                }} />
                                              </pre>
                                            </div>
                                          ) : (
                                            /* Visual Tier Editor */
                                            <div className="space-y-3">
                                              {(() => {
                                                // Initialize editing tiers if needed
                                                initializeEditingTiers(blueprint.id, groupName, rules);
                                                
                                                // Get editable tiers from state
                                                const key = `${blueprint.id}-${groupName}`;
                                                const tiersToEdit = editingTiers[key] || [];

                                                if (tiersToEdit.length > 0) {
                                                  // Show tier-based editor
                                                  return tiersToEdit.map((tier, index) => (
                                                    <div key={index} className="bg-neutral-800/50 rounded-lg border-b border-white/[0.02] p-3 hover:border-white/[0.08] smooth-hover">
                                                      <div className="flex items-center justify-between">
                                                        <div className="flex-1 grid grid-cols-4 gap-3">
                                                          <div>
                                                            <label className="text-xs text-neutral-600 block mb-1">Tier Name</label>
                                                            <input
                                                              type="text"
                                                              value={tier.name}
                                                              onChange={(e) => updateTier(blueprint.id, groupName, index, 'name', e.target.value)}
                                                              className="w-full bg-neutral-950/40 border border-neutral-800/40 rounded px-2 py-1 text-xs text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none smooth-hover"
                                                              onClick={(e) => e.stopPropagation()}
                                                            />
                                                          </div>
                                                          <div>
                                                            <label className="text-xs text-neutral-600 block mb-1">Min Qty</label>
                                                            <input
                                                              type="number"
                                                              step="0.1"
                                                              value={tier.min_quantity}
                                                              onChange={(e) => updateTier(blueprint.id, groupName, index, 'min_quantity', parseFloat(e.target.value))}
                                                              className="w-full bg-neutral-950/40 border border-neutral-800/40 rounded px-2 py-1 text-xs text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none smooth-hover"
                                                              onClick={(e) => e.stopPropagation()}
                                                            />
                                                          </div>
                                                          <div>
                                                            <label className="text-xs text-neutral-600 block mb-1">Max Qty</label>
                                                            <input
                                                              type="number"
                                                              step="0.1"
                                                              value={tier.max_quantity || ''}
                                                              onChange={(e) => updateTier(blueprint.id, groupName, index, 'max_quantity', e.target.value ? parseFloat(e.target.value) : null)}
                                                              placeholder="No limit"
                                                              className="w-full bg-neutral-950/40 border border-neutral-800/40 rounded px-2 py-1 text-xs text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none smooth-hover"
                                                              onClick={(e) => e.stopPropagation()}
                                                            />
                                                          </div>
                                                          <div>
                                                            <label className="text-xs text-neutral-600 block mb-1">Price ($)</label>
                                                            <input
                                                              type="number"
                                                              step="0.01"
                                                              value={tier.price}
                                                              onChange={(e) => updateTier(blueprint.id, groupName, index, 'price', e.target.value)}
                                                              className="w-full bg-neutral-950/40 border border-neutral-800/40 rounded px-2 py-1 text-xs text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none smooth-hover"
                                                              onClick={(e) => e.stopPropagation()}
                                                            />
                                                          </div>
                                                        </div>
                                                        <div className="ml-3 flex items-center gap-1">
                                                          <div className="text-xs text-neutral-600 mr-2">
                                                            #{index + 1}
                                                          </div>
                                                          <button
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              moveTier(blueprint.id, groupName, index, index - 1);
                                                            }}
                                                            disabled={index === 0}
                                                            className="p-1 rounded-xl row-hover ease-out  text-neutral-500 hover:text-neutral-400 bg-transparent hover:bg-neutral-800/50 border border-transparent hover:border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                                          >
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                                            </svg>
                                                          </button>
                                                          <button
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              moveTier(blueprint.id, groupName, index, index + 1);
                                                            }}
                                                            disabled={index === tiersToEdit.length - 1}
                                                            className="p-1 rounded-xl row-hover ease-out  text-neutral-500 hover:text-neutral-400 bg-transparent hover:bg-neutral-800/50 border border-transparent hover:border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                                          >
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                            </svg>
                                                          </button>
                                                          <button
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              deleteTier(blueprint.id, groupName, index);
                                                            }}
                                                            className="p-1 rounded-xl row-hover ease-out  text-red-400 hover:text-red-300 bg-transparent hover:bg-red-500/20 border border-transparent hover:border-red-500/30"
                                                          >
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                            </svg>
                                                          </button>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  ));
                                                } else {
                                                  // Show individual rules editor
                                                  return (
                                                    <div className="text-center py-8 text-neutral-500">
                                                      <div className="text-sm mb-2">No tiers configured</div>
                                                      <div className="text-xs">Switch to JSON view to see the raw data or add tiers above</div>
                                                    </div>
                                                  );
                                                }
                                              })()}
                                              
                                              {/* Save Changes Footer - Responsive */}
                                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 pt-3 border-t border-white/[0.04] sticky bottom-0 bg-neutral-900/95 -mx-4 px-4 pb-2">
                                                <div className="text-xs text-neutral-600 order-2 sm:order-1">
                                                  <span className="hidden sm:inline">Click "Apply Changes" to save</span>
                                                  <span className="sm:hidden">Click to save pricing changes</span>
                                                </div>
                                                <Button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    savePricingTiers(blueprint.id, groupName);
                                                  }}
                                                  size="sm"
                                                  className="bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 order-1 sm:order-2 w-full sm:w-auto"
                                                  disabled={isOperating}
                                                >
                                                  {isOperating ? (
                                                    <>
                                                      <span className="hidden sm:inline">Saving...</span>
                                                      <span className="sm:hidden">Saving...</span>
                                                    </>
                                                  ) : (
                                                    <>
                                                      <span className="hidden sm:inline">Apply Changes</span>
                                                      <span className="sm:hidden">Apply</span>
                                                    </>
                                                  )}
                                                </Button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        )}

                        {/* Add Pricing Rule Form - User Friendly */}
                        {showPricingForm[blueprint.id] && (
                          <div className="rounded-lg border-b border-white/[0.02] p-2 bg-neutral-900/40 mb-2">
                            <div className="text-neutral-500 text-xs mb-2">Add New Pricing Rule</div>
                            
                            {/* Basic Rule Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                              <div>
                                <div className="text-neutral-600 text-xs mb-1">Rule Name *</div>
                                <input
                                  type="text"
                                  value={pricingFormData.rule_name}
                                  onChange={(e) => setPricingFormData(prev => ({ ...prev, rule_name: e.target.value }))}
                                  className="w-full px-2 py-1 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none text-xs"
                                  placeholder="e.g., Flower Pricing"
                                />
                              </div>
                              <div>
                                <div className="text-neutral-600 text-xs mb-1">Product Type *</div>
                                <select
                                  value={pricingFormData.product_type}
                                  onChange={(e) => setPricingFormData(prev => ({ ...prev, product_type: e.target.value }))}
                                  className="w-full px-2 py-1 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none text-xs"
                                >
                                  <option value="">Select Product Type</option>
                                  <option value="flower">Flower</option>
                                  <option value="preroll">Preroll</option>
                                  <option value="concentrate">Concentrate</option>
                                  <option value="edible">Edible</option>
                                  <option value="vape">Vape</option>
                                  <option value="topical">Topical</option>
                                  <option value="tincture">Tincture</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                              <div>
                                <div className="text-neutral-600 text-xs mb-1">Unit Type *</div>
                                <select
                                  value={pricingFormData.unit_type}
                                  onChange={(e) => setPricingFormData(prev => ({ ...prev, unit_type: e.target.value }))}
                                  className="w-full px-2 py-1 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none text-xs"
                                >
                                  <option value="grams">Grams (g)</option>
                                  <option value="pieces">Pieces (each)</option>
                                  <option value="ml">Milliliters (ml)</option>
                                  <option value="mg">Milligrams (mg)</option>
                                </select>
                              </div>
                              <div>
                                <div className="text-neutral-600 text-xs mb-1">Rule Type</div>
                                <select
                                  value={pricingFormData.rule_type}
                                  onChange={(e) => setPricingFormData(prev => ({ ...prev, rule_type: e.target.value }))}
                                  className="w-full px-2 py-1 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none text-xs"
                                >
                                  <option value="quantity_break">Quantity Break</option>
                                  <option value="customer_tier">Customer Tier</option>
                                  <option value="channel">Sales Channel</option>
                                  <option value="store">Store Location</option>
                                </select>
                              </div>
                            </div>

                            {/* Pricing Tiers */}
                            <div className="mb-2">
                              <div className="flex items-center justify-between mb-1">
                                <div className="text-neutral-600 text-xs">Pricing Tiers *</div>
                                <button
                                  onClick={() => {
                                    setPricingFormData(prev => ({
                                      ...prev,
                                      tiers: [...prev.tiers, {
                                        name: `Tier ${prev.tiers.length + 1}`,
                                        min_quantity: (prev.tiers[prev.tiers.length - 1]?.max_quantity || 0) + 1,
                                        max_quantity: null as number | null,
                                        price: 0
                                      }]
                                    }));
                                  }}
                                  className="px-1 py-0.5 text-xs bg-neutral-800/40 text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800/50 rounded border border-neutral-700/40 smooth-hover"
                                >
                                  + Add Tier
                                </button>
                              </div>
                              
                              <div className="space-y-1">
                                {pricingFormData.tiers.map((tier, index) => (
                                  <div key={index} className="bg-neutral-900/40 rounded p-2">
                                    <div className="grid grid-cols-4 gap-2">
                                      <div>
                                        <div className="text-neutral-600 text-xs mb-1">Tier Name</div>
                                        <input
                                          type="text"
                                          value={tier.name}
                                          onChange={(e) => {
                                            const newTiers = [...pricingFormData.tiers];
                                            newTiers[index].name = e.target.value;
                                            setPricingFormData(prev => ({ ...prev, tiers: newTiers }));
                                          }}
                                          className="w-full px-2 py-1 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 text-xs focus:border-neutral-700 focus:outline-none"
                                          placeholder="Single"
                                        />
                                      </div>
                                      <div>
                                        <div className="text-neutral-600 text-xs mb-1">Min Qty</div>
                                        <input
                                          type="number"
                                          step="0.1"
                                          value={tier.min_quantity}
                                          onChange={(e) => {
                                            const newTiers = [...pricingFormData.tiers];
                                            newTiers[index].min_quantity = parseFloat(e.target.value) || 0;
                                            setPricingFormData(prev => ({ ...prev, tiers: newTiers }));
                                          }}
                                          className="w-full px-2 py-1 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 text-xs focus:border-neutral-700 focus:outline-none"
                                        />
                                      </div>
                                      <div>
                                        <div className="text-neutral-600 text-xs mb-1">Max Qty</div>
                                        <input
                                          type="number"
                                          step="0.1"
                                          value={tier.max_quantity || ''}
                                          onChange={(e) => {
                                            const newTiers = [...pricingFormData.tiers];
                                            newTiers[index].max_quantity = e.target.value ? parseFloat(e.target.value) : null as number | null;
                                            setPricingFormData(prev => ({ ...prev, tiers: newTiers }));
                                          }}
                                          className="w-full px-2 py-1 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 text-xs focus:border-neutral-700 focus:outline-none"
                                          placeholder="No limit"
                                        />
                                      </div>
                                      <div className="flex items-end gap-1">
                                        <div className="flex-1">
                                          <div className="text-neutral-600 text-xs mb-1">Price ($)</div>
                                          <input
                                            type="number"
                                            step="0.01"
                                            value={tier.price}
                                            onChange={(e) => {
                                              const newTiers = [...pricingFormData.tiers];
                                              newTiers[index].price = parseFloat(e.target.value) || 0;
                                              setPricingFormData(prev => ({ ...prev, tiers: newTiers }));
                                            }}
                                            className="w-full px-2 py-1 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 text-xs focus:border-neutral-700 focus:outline-none"
                                          />
                                        </div>
                                        {pricingFormData.tiers.length > 1 && (
                                          <button
                                            onClick={() => {
                                              const newTiers = pricingFormData.tiers.filter((_, i) => i !== index);
                                              setPricingFormData(prev => ({ ...prev, tiers: newTiers }));
                                            }}
                                            className="p-1 text-red-400 hover:text-red-300 bg-transparent hover:bg-red-500/20 rounded border border-transparent hover:border-red-500/30 smooth-hover"
                                          >
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              <Button
                                onClick={() => createUserFriendlyPricingRule(blueprint.id)}
                                size="sm"
                                variant="primary"
                                disabled={!pricingFormData.rule_name || !pricingFormData.product_type || isOperating}
                                className="text-xs"
                              >
                                {isOperating ? 'Creating...' : 'Add Rule'}
                              </Button>
                              <Button
                                onClick={() => {
                                  setShowPricingForm(prev => ({ ...prev, [blueprint.id]: false }));
                                  // Reset form
                                  setPricingFormData({
                                    rule_name: '',
                                    rule_type: 'quantity_break',
                                    formula: '',
                                    conditions: '{}',
                                    product_type: '',
                                    unit_type: 'grams',
                                    tiers: [{ name: 'Single', min_quantity: 1, max_quantity: 1 as number | null, price: 0 }]
                                  });
                                }}
                                size="sm"
                                variant="secondary"
                                className="text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                          </div>
                        )}

                        {getBlueprintActiveTab(blueprint.id) === 'assignments' && (
                          /* Assignments Section */
                          <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center text-neutral-500 font-medium text-xs">
                            Assignments ({assignments.length})
                            <JsonIcon
                              onClick={() => openJsonEditor(`assignments-${blueprint.id}`, assignments)}
                              title="Edit assignments as JSON"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => openJsonEditor(`assignments-bulk-${blueprint.id}`, [])}
                              size="sm"
                              variant="ghost"
                              className="text-xs text-neutral-400 hover:text-neutral-300 whitespace-nowrap flex items-center min-w-fit"
                              title="Import assignments from JSON"
                            >
                              <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                              </svg>
                              Import JSON
                            </Button>
                            <Button
                              onClick={async () => {
                                // Initialize form data with correct blueprint_id
                                setAssignmentFormData({
                                  blueprint_id: blueprint.id,
                                  entity_type: 'product',
                                  entity_id: undefined,
                                  category_id: undefined,
                                  scope_type: 'specific',
                                  include_descendants: false,
                                  assignment_mode: 'include',
                                  priority: 0,
                                  sort_order: 0,
                                  is_active: true
                                });
                                
                                // Show form first
                                setShowAssignmentForm(prev => ({ ...prev, [blueprint.id]: true }));
                                
                                // Load entities for selection (async)
                                await Promise.all([loadCategories(), loadProducts()]);
                              }}
                              size="sm"
                              variant="ghost"
                              className="text-xs bg-green-600/20 hover:bg-green-600/30 text-green-400"
                            >
                              + Add Assignment
                            </Button>
                          </div>
                        </div>

                        {/* Add Assignment Form */}
                        {showAssignmentForm[blueprint.id] && (
                          <div className="rounded-lg border-b border-white/[0.02] p-2 bg-neutral-900/40 mb-2">
                            <div className="text-neutral-500 text-xs mb-2">Add New Assignment</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                              <div>
                                <div className="text-neutral-600 text-xs mb-1">Entity Type *</div>
                                <select
                                  value={assignmentFormData.entity_type}
                                  onChange={(e) => {
                                    const entityType = e.target.value as 'product' | 'category';
                                    setAssignmentFormData(prev => ({ 
                                      ...prev, 
                                      entity_type: entityType,
                                      entity_id: undefined,
                                      category_id: undefined 
                                    }));
                                  }}
                                  className="w-full px-2 py-1 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none text-xs"
                                >
                                  <option value="product">Product</option>
                                  <option value="category">Category</option>
                                </select>
                              </div>
                              <div>
                                <div className="text-neutral-600 text-xs mb-1">Scope Type</div>
                                <select
                                  value={assignmentFormData.scope_type}
                                  onChange={(e) => {
                                    const scopeType = e.target.value as 'specific' | 'category' | 'global';
                                    setAssignmentFormData(prev => ({ 
                                      ...prev, 
                                      scope_type: scopeType,
                                      entity_id: undefined,
                                      category_id: undefined 
                                    }));
                                  }}
                                  className="w-full px-2 py-1 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none text-xs"
                                >
                                  <option value="specific">Specific</option>
                                  <option value="category">Category</option>
                                  <option value="global">Global</option>
                                </select>
                              </div>
                              <div>
                                <div className="text-neutral-600 text-xs mb-1">Assignment Mode</div>
                                <select
                                  value={assignmentFormData.assignment_mode}
                                  onChange={(e) => setAssignmentFormData(prev => ({ ...prev, assignment_mode: e.target.value as 'include' | 'exclude' }))}
                                  className="w-full px-2 py-1 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none text-xs"
                                >
                                  <option value="include">Include</option>
                                  <option value="exclude">Exclude</option>
                                </select>
                              </div>
                              <div>
                                <div className="text-neutral-600 text-xs mb-1">Priority</div>
                                <input
                                  type="number"
                                  value={assignmentFormData.priority}
                                  onChange={(e) => setAssignmentFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                                  className="w-full px-2 py-1 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none text-xs"
                                  placeholder="0"
                                />
                              </div>
                            </div>
                            
                            {/* Entity Selection - Show when scope is specific or category */}
                            {(assignmentFormData.scope_type === 'specific' || assignmentFormData.scope_type === 'category') && (
                              <div className="mb-2">
                                <div className="text-neutral-600 text-xs mb-1">
                                  Select {assignmentFormData.entity_type === 'product' ? 'Product' : 'Category'}
                                  {assignmentFormData.scope_type === 'specific' ? ' *' : ''}
                                  <span className="text-neutral-500 ml-2">
                                    ({assignmentFormData.entity_type === 'product' ? products.length : categories.length} available)
                                  </span>
                                </div>
                                {loadingEntities ? (
                                  <div className="text-neutral-500 text-xs">Loading...</div>
                                ) : (
                                  <select
                                    value={
                                      assignmentFormData.entity_type === 'product' 
                                        ? (assignmentFormData.entity_id || '') 
                                        : (assignmentFormData.category_id || '')
                                    }
                                    onChange={(e) => {
                                      const value = e.target.value ? parseInt(e.target.value) : undefined;
                                      if (assignmentFormData.entity_type === 'product') {
                                        setAssignmentFormData(prev => ({ 
                                          ...prev, 
                                          entity_id: value,
                                          category_id: undefined 
                                        }));
                                      } else {
                                        setAssignmentFormData(prev => ({ 
                                          ...prev, 
                                          category_id: value,
                                          entity_id: undefined 
                                        }));
                                      }
                                    }}
                                    className="w-full px-2 py-1 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none text-xs"
                                  >
                                    <option value="">
                                      {assignmentFormData.scope_type === 'specific' 
                                        ? `Select ${assignmentFormData.entity_type}`
                                        : `All ${assignmentFormData.entity_type}s`
                                      }
                                    </option>
                                    {assignmentFormData.entity_type === 'product' 
                                      ? products.map(product => (
                                          <option key={product.id} value={product.id}>
                                            {product.name}
                                          </option>
                                        ))
                                      : categories.map(category => (
                                          <option key={category.id} value={category.id}>
                                            {category.name}
                                          </option>
                                        ))
                                    }
                                  </select>
                                )}
                              </div>
                            )}

                            {/* Include Descendants option for category assignments */}
                            {assignmentFormData.entity_type === 'category' && assignmentFormData.scope_type === 'category' && (
                              <div className="mb-2">
                                <label className="flex items-center gap-2 text-xs">
                                  <input
                                    type="checkbox"
                                    checked={assignmentFormData.include_descendants}
                                    onChange={(e) => setAssignmentFormData(prev => ({ 
                                      ...prev, 
                                      include_descendants: e.target.checked 
                                    }))}
                                    className="rounded border-white/[0.04] bg-black text-neutral-300 focus:ring-neutral-500 focus:ring-1"
                                  />
                                  <span className="text-neutral-400">Include descendant categories</span>
                                </label>
                              </div>
                            )}
                            
                            <div className="flex gap-2">
                              <Button
                                onClick={() => createBlueprintAssignment(blueprint.id)}
                                size="sm"
                                variant="primary"
                                disabled={
                                  isOperating || 
                                  (assignmentFormData.scope_type === 'specific' && 
                                    !assignmentFormData.entity_id && 
                                    !assignmentFormData.category_id)
                                }
                                className="text-xs"
                              >
                                Add Assignment
                              </Button>
                              <Button
                                onClick={() => setShowAssignmentForm(prev => ({ ...prev, [blueprint.id]: false }))}
                                size="sm"
                                variant="secondary"
                                className="text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {assignments.length === 0 ? (
                          <div className="text-neutral-600 text-xs">
                            No assignments configured
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {assignments.map((assignment) => (
                              <div key={assignment.id} className="bg-neutral-900/40 rounded p-2">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-neutral-600 text-xs">Type:</span>
                                  <span className="px-2 py-0.5 bg-neutral-900/40 text-neutral-500 rounded text-xs font-medium">
                                    {assignment.entity_type}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-xs mb-1">
                                  <span className="text-neutral-600">Scope:</span>
                                  <span className="text-neutral-500">{assignment.scope_type}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs mb-1">
                                  <span className="text-neutral-600">Mode:</span>
                                  <span className="text-neutral-500">{assignment.assignment_mode}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-neutral-600">Priority:</span>
                                  <span className="text-neutral-500">{assignment.priority}</span>
                                </div>
                                {(assignment.entity_id || assignment.category_id) && (
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-neutral-600">Target:</span>
                                    <span className="text-neutral-500">
                                      ID: {assignment.entity_id || assignment.category_id}
                                    </span>
                                  </div>
                                )}
                                {assignment.include_descendants && (
                                  <div className="mt-1 pt-1 border-t border-white/[0.04]">
                                    <span className="px-1 py-0.5 bg-neutral-800/40 text-neutral-400 text-xs rounded">
                                      Includes Descendants
                                    </span>
                                  </div>
                                )}
                                <div className="mt-2 flex justify-end">
                                  <button
                                    onClick={() => deleteBlueprintAssignment(assignment.id, blueprint.id)}
                                    className="text-red-400 hover:text-red-300 text-xs opacity-70 hover:opacity-100"
                                    title="Delete Assignment"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
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


        {/* JSON Editors */}
        {Object.entries(showJsonEditor).map(([key, show]) => {
          if (!show) return null;
          
          let title = 'JSON Editor';
          let placeholder = 'Enter JSON...';
          
          if (key.startsWith('pricing-rules-')) {
            title = 'Edit Pricing Rules';
            placeholder = `[
  {
    "rule_name": "FLOWER - 1g",
    "rule_type": "quantity_break",
    "formula": "14.99",
    "conditions": {
      "product_type": "flower",
      "min_quantity": 1,
      "unit_type": "grams"
    }
  }
]`;
          } else if (key.startsWith('pricing-bulk-')) {
            title = 'Import Pricing Rules';
            placeholder = `[
  {
    "rule_name": "FLOWER - 1g",
    "rule_type": "quantity_break", 
    "formula": "14.99",
    "conditions": {
      "product_type": "flower",
      "min_quantity": 1,
      "unit_type": "grams"
    }
  },
  {
    "rule_name": "FLOWER - 3.5g",
    "rule_type": "quantity_break",
    "formula": "39.99", 
    "conditions": {
      "product_type": "flower",
      "min_quantity": 3.5,
      "unit_type": "grams"
    }
  }
]`;
          } else if (key.startsWith('fields-bulk-')) {
            title = 'Import Blueprint Fields';
            placeholder = `[
  {
    "field_name": "strain_type",
    "field_type": "select",
    "field_label": "Strain Type",
    "field_description": "Type of cannabis strain",
    "field_default_value": "",
    "validation_rules": {},
    "display_options": {
      "choices": ["indica", "sativa", "hybrid"]
    },
    "is_required": true,
    "is_searchable": true,
    "sort_order": 1
  },
  {
    "field_name": "thc_percentage",
    "field_type": "number",
    "field_label": "THC Percentage",
    "field_description": "THC content percentage",
    "is_required": false,
    "is_searchable": true,
    "sort_order": 2
  }
]`;
          } else if (key.startsWith('fields-')) {
            title = 'View Blueprint Fields';
            placeholder = 'Current field data (read-only)';
          } else if (key.startsWith('assignments-bulk-')) {
            title = 'Import Blueprint Assignments';
            placeholder = `[
  {
    "entity_type": "product",
    "entity_id": 123,
    "scope_type": "specific",
    "include_descendants": false,
    "assignment_mode": "include",
    "priority": 10,
    "sort_order": 1,
    "is_active": true
  },
  {
    "entity_type": "category",
    "category_id": 456,
    "scope_type": "category",
    "include_descendants": true,
    "assignment_mode": "include",
    "priority": 5,
    "sort_order": 2,
    "is_active": true
  }
]`;
          } else if (key.startsWith('assignments-')) {
            title = 'View Blueprint Assignments';
            placeholder = 'Current assignment data (read-only)';
          } else if (key.startsWith('details-bulk-')) {
            title = 'Import Blueprint Details';
            placeholder = `{
  "label": "Updated Blueprint Label",
  "description": "Updated blueprint description",
  "type": "product"
}`;
          } else if (key.startsWith('details-')) {
            title = 'View Blueprint Details';
            placeholder = 'Current blueprint details (read-only)';
          } else if (key.startsWith('full-blueprint-')) {
            title = 'Full Blueprint JSON v1';
            placeholder = `{
  "blueprint": {
    "slug": "strain-details",
    "label": "Strain Details",
    "description": "Complete blueprint for cannabis strain information",
    "version": 1,
    "status": "active"
  },
  "fields": [
    {
      "name": "thca_pct",
      "type": "number",
      "label": "THCA %",
      "description": "THCA content percentage",
      "unit": "percent",
      "precision": 1,
      "choices": [],
      "choice_source": null,
      "conditional": {},
      "help": "Total THCA content before decarboxylation",
      "validation": {
        "required": false,
        "min": 0,
        "max": 50,
        "regex": null
      },
      "searchable": false,
      "sort_order": 1
    }
  ],
  "assignments": [
    {
      "target_type": "category",
      "target_id": 25,
      "taxonomy": "product_cat",
      "mode": "include",
      "include_descendants": false,
      "priority": 0,
      "active": true
    }
  ],
  "pricing_rules": [
    {
      "rule_name": "FLOWER - Quantity Breaks",
      "rule_type": "quantity_break",
      "priority": 10,
      "filters": {
        "product_type": "flower",
        "channels": ["pos", "online"],
        "stores": [],
        "customer_tiers": ["retail"]
      },
      "unit": "grams",
      "currency": "USD",
      "breaks": [
        { "min": 1, "max": 1, "price_cents": 1499 },
        { "min": 3.5, "max": 3.5, "price_cents": 3999 },
        { "min": 7, "max": 7, "price_cents": 6999 },
        { "min": 14, "max": 14, "price_cents": 12499 },
        { "min": 28, "max": null, "price_cents": 19999 }
      ],
      "valid_from": null,
      "valid_to": null,
      "active": true
    }
  ]
}`;
          }
          
          return (
            <JsonPopout
              key={key}
              isOpen={show}
              onClose={() => closeJsonEditor(key)}
              value={jsonEditorData[key] || []}
              onChange={(data) => {
                handleJsonEditorSave(key, data);
              }}
              title={title}
              placeholder={placeholder}
              size="xlarge"
              loading={isOperating}
              successMessage={jsonSuccessMessage}
              style="dashboard"
            />
          );
        })}

        {/* Delete Confirmation Dialog */}
        {deleteConfirm.show && deleteConfirm.blueprint && (
          <DeleteConfirmDialog
            isOpen={deleteConfirm.show}
            onClose={() => setDeleteConfirm({ show: false, blueprint: null })}
            onConfirm={deleteBlueprint}
            title="Delete Field Blueprint"
            message={`Are you sure you want to delete the "${deleteConfirm.blueprint.label}" blueprint? This action cannot be undone.`}
            confirmText="Delete Blueprint"
            isDestructive
          />
        )}

        {/* Duplicate Confirmation Dialog */}
        {duplicateConfirm.show && duplicateConfirm.blueprint && (
          <DuplicateConfirmDialog
            isOpen={duplicateConfirm.show}
            onClose={() => setDuplicateConfirm({ show: false, blueprint: null })}
            onConfirm={duplicateBlueprint}
            title="Duplicate Field Blueprint"
            message={`Create a copy of the "${duplicateConfirm.blueprint.label}" blueprint with all its fields, assignments, and pricing rules.`}
            originalName={duplicateConfirm.blueprint.name}
            originalLabel={duplicateConfirm.blueprint.label}
            confirmText="Duplicate Blueprint"
          />
        )}

        {/* Remove Field Confirmation Dialog */}
        {removeFieldConfirm.show && removeFieldConfirm.field && (
          <DeleteConfirmDialog
            isOpen={removeFieldConfirm.show}
            onClose={() => setRemoveFieldConfirm({ show: false, field: null, blueprintId: null })}
            onConfirm={removeBlueprintField}
            title="Remove Field from Blueprint"
            message={`Remove the "${removeFieldConfirm.field.field_label}" field from this blueprint? The field will remain in your library and can be added back later.`}
            confirmText="Remove Field"
            isDestructive={false}
          />
        )}

        {/* Field Library Picker */}
        <FieldLibraryPicker
          isOpen={showFieldLibrary}
          onClose={() => setShowFieldLibrary(false)}
          onSelectFields={handleSelectFields}
          onSelectTemplate={handleSelectTemplate}
          blueprintId={fieldLibraryBlueprintId || undefined}
        />

        {/* Pricing Rules Picker */}
        <PricingRulesPicker
          isOpen={showPricingRulesPicker}
          onClose={() => {
            setShowPricingRulesPicker(false);
            setPricingRulesPickerBlueprintId(null);
          }}
          onSelect={handleSelectPricingRules}
          title="Add Pricing Rules to Blueprint"
        />
      </div>
    </div>
  );
}

