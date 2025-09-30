'use client';

import React, { useState, useEffect } from 'react';
import { Location, LocationUpdateData, locationsService } from '../../services/locations-service';
import { Badge, Button, IconButton, LoadingSpinner, LocationCreateDropdown, AlertDialog, ConfirmDialog } from '../ui';
import { LocationTable } from './LocationTable';
import { DeveloperTools } from './DeveloperTools';
import { useDialogs } from '../../hooks/useDialogs';

interface SettingsViewProps {
  onClose?: () => void;
  activeTab?: SettingsTab;
  onTabChange?: (tab: SettingsTab) => void;
}

type SettingsTab = 'locations' | 'general' | 'blueprints' | 'categories' | 'developer';

export function SettingsView({ onClose, activeTab = 'locations', onTabChange }: SettingsViewProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog management
  const dialogs = useDialogs();
  
  // Blueprint-related state
  const [blueprints, setBlueprints] = useState<any[]>([]);
  const [availableFields, setAvailableFields] = useState<any[]>([]);
  const [availablePricingRules, setAvailablePricingRules] = useState<any[]>([]);
  const [blueprintsLoading, setBlueprintsLoading] = useState(false);
  const [blueprintsError, setBlueprintsError] = useState<string | null>(null);
  const [selectedBlueprint, setSelectedBlueprint] = useState<any | null>(null);
  
  // Drag and drop state
  const [draggedField, setDraggedField] = useState<any | null>(null);
  const [dragOverZone, setDragOverZone] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [fieldTypeFilter, setFieldTypeFilter] = useState<string>('all');
  const [pricingTypeFilter, setPricingTypeFilter] = useState<string>('all');
  const [blueprintActiveTab, setBlueprintActiveTab] = useState<'fields' | 'pricing'>('fields');
  
  // Pricing rule editor state
  const [editingPricingRule, setEditingPricingRule] = useState<any | null>(null);
  const [showPricingEditor, setShowPricingEditor] = useState(false);
  
  // Field editor state
  const [editingField, setEditingField] = useState<any | null>(null);
  const [showFieldEditor, setShowFieldEditor] = useState(false);
  
  // Categories state
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Set<number>>(new Set());
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [showCategoryEditor, setShowCategoryEditor] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [selectedLocations, setSelectedLocations] = useState<Set<number>>(new Set());
  const [isCreateDropdownOpen, setIsCreateDropdownOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning', text: string } | null>(null);

  // Load locations
  const loadLocations = async (bustCache = true) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Loading locations with bustCache:', bustCache);
      const response = await locationsService.getLocations(bustCache);
      console.log('Locations loaded:', response);
      if (response.success) {
        setLocations(response.data);
      } else {
        setError('Failed to load locations');
      }
    } catch (err) {
      setError('Failed to load locations');
      console.error('Error loading locations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load blueprints
  const loadBlueprints = async () => {
    setBlueprintsLoading(true);
    setBlueprintsError(null);
    try {
      const response = await fetch('/api/flora/blueprints?per_page=100');
      if (response.ok) {
        const data = await response.json();
        setBlueprints(data);
      } else {
        setBlueprintsError('Failed to load blueprints');
      }
    } catch (err) {
      setBlueprintsError('Failed to load blueprints');
      console.error('Error loading blueprints:', err);
    } finally {
      setBlueprintsLoading(false);
    }
  };

  // Load available fields (blueprint fields only)
  const loadAvailableFields = async () => {
    try {
      const response = await fetch('/api/flora/available-blueprint-fields');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAvailableFields(result.data);
        }
      }
    } catch (err) {
      console.error('Error loading available fields:', err);
    }
  };

  // Load available pricing rules (separate from fields)
  const loadAvailablePricingRules = async () => {
    try {
      console.log('🔍 Loading pricing rules from /api/pricing/rules...');
      const response = await fetch('/api/pricing/rules?per_page=100');
      
      console.log('📡 Pricing API Response Status:', response.status);
      console.log('📡 Pricing API Response OK:', response.ok);
      
      if (response.ok) {
        const pricingData = await response.json();
        console.log('📊 Raw pricing response:', pricingData);
        console.log('📊 Response keys:', Object.keys(pricingData || {}));
        
        // Check if response has rules property (correct structure)
        if (pricingData && pricingData.rules && Array.isArray(pricingData.rules)) {
          console.log('✅ Found rules array with', pricingData.rules.length, 'pricing rules');
          
          const formattedRules = pricingData.rules.map((rule: any, index: number) => {
            // Parse the conditions JSON to get more details
            let parsedConditions: any = {};
            try {
              parsedConditions = rule.conditions ? JSON.parse(rule.conditions) : {};
            } catch (e) {
              console.warn('Could not parse conditions for rule', rule.id);
            }
            
            return {
              rule_id: rule.id,
              rule_name: rule.rule_name || rule.name || `Pricing Rule ${rule.id || index + 1}`,
              rule_type: rule.rule_type || 'quantity_break',
              description: `${rule.rule_type || 'Pricing'} rule for ${parsedConditions.product_type || 'products'} - ${parsedConditions.tiers?.length || 0} tiers`,
              unit: parsedConditions.unit_type || rule.unit || 'units',
              currency: rule.currency || 'USD',
              breaks: parsedConditions.tiers || rule.breaks || [],
              filters: rule.filters || parsedConditions,
              active: rule.is_active === '1' || rule.status === 'active',
              priority: parseInt(rule.priority) || 0,
              blueprint_id: parsedConditions.blueprint_id || rule.blueprint_id,
              blueprint_name: parsedConditions.blueprint_name,
              product_type: parsedConditions.product_type,
              created_at: rule.created_at,
              updated_at: rule.updated_at,
              conditions: parsedConditions
            };
          });
          
          console.log('✅ Formatted rules:', formattedRules);
          setAvailablePricingRules(formattedRules);
        } else if (Array.isArray(pricingData)) {
          // Fallback if response is direct array
          console.log('✅ Processing direct array with', pricingData.length, 'pricing rules');
          const formattedRules = pricingData.map((rule, index) => ({
            rule_id: rule.id,
            rule_name: rule.name || rule.rule_name || `Pricing Rule ${rule.id || index + 1}`,
            rule_type: rule.rule_type,
            description: rule.description || `${rule.rule_type || 'Pricing'} rule`,
            unit: rule.unit || 'units',
            currency: rule.currency || 'USD',
            breaks: rule.breaks || [],
            filters: rule.filters,
            active: rule.active,
            priority: rule.priority || 0,
            blueprint_id: rule.blueprint_id,
            created_at: rule.created_at,
            updated_at: rule.updated_at
          }));
          setAvailablePricingRules(formattedRules);
        } else {
          console.warn('⚠️ No valid pricing rules data found in response structure:', pricingData);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Pricing API Error:', response.status, errorText);
      }
    } catch (err) {
      console.error('❌ Error loading pricing rules:', err);
    }
  };

  // Load blueprint fields for a specific blueprint
  const loadBlueprintFields = async (blueprintId: number) => {
    try {
      const response = await fetch(`/api/flora/blueprint-fields?blueprint_id=${blueprintId}&per_page=100`);
      if (response.ok) {
        const fields = await response.json();
        return fields;
      }
    } catch (err) {
      console.error('Error loading blueprint fields:', err);
    }
    return [];
  };

  // Initial load
  useEffect(() => {
    loadLocations();
  }, []);

  // Load categories
  const loadCategories = async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const response = await fetch('/api/flora/categories?per_page=100&orderby=name');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setCategories(result.data);
        } else {
          setCategoriesError('Failed to load categories');
        }
      } else {
        setCategoriesError('Failed to load categories');
      }
    } catch (err) {
      setCategoriesError('Failed to load categories');
      console.error('Error loading categories:', err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Load blueprints when blueprints tab is active
  useEffect(() => {
    if (activeTab === 'blueprints') {
      loadBlueprints();
      loadAvailableFields();
      loadAvailablePricingRules();
    }
  }, [activeTab]);

  // Load categories when categories tab is active
  useEffect(() => {
    if (activeTab === 'categories') {
      loadCategories();
    }
  }, [activeTab]);

  // Handle expand/collapse
  const handleToggleExpand = (locationId: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(locationId)) {
      newExpanded.delete(locationId);
    } else {
      newExpanded.add(locationId);
    }
    setExpandedCards(newExpanded);
  };

  // Handle bulk expand/collapse
  const handleBulkExpandCollapse = (ids: number[], expand: boolean) => {
    const newExpanded = new Set(expandedCards);
    ids.forEach(id => {
      if (expand) {
        newExpanded.add(id);
      } else {
        newExpanded.delete(id);
      }
    });
    setExpandedCards(newExpanded);
  };

  // Handle edit location
  const handleEditLocation = (location: Location) => {
    console.log('Edit location:', location);
    // This will be handled by the LocationCard component internally
  };

  // Handle create location dropdown
  const handleCreateLocation = async () => {
    // Refresh locations list after creation
    await loadLocations(true);
    setIsCreateDropdownOpen(false);
  };

  // Handle delete selected locations
  const handleDeleteSelectedLocations = async () => {
    if (selectedLocations.size === 0) return;
    
    const selectedLocationsList = locations.filter(loc => selectedLocations.has(loc.id));
    const selectedLocationNames = selectedLocationsList.map(loc => loc.name).join(', ');
    
    // Check for default locations
    const defaultLocations = selectedLocationsList.filter(loc => loc.is_default === '1' || loc.is_default === 1);
    if (defaultLocations.length > 0) {
      setMessage({ 
        type: 'error', 
        text: `Cannot delete default location${defaultLocations.length > 1 ? 's' : ''}: ${defaultLocations.map(loc => loc.name).join(', ')}. Please set another location as default first.` 
      });
      setTimeout(() => setMessage(null), 5000);
      return;
    }
    
    const deletingIds = Array.from(selectedLocations);
    
    dialogs.showDangerConfirm(
      'Delete Locations',
      `Are you sure you want to delete ${selectedLocations.size} location${selectedLocations.size > 1 ? 's' : ''}?\n\nLocations to delete:\n${selectedLocationNames}\n\nThis action cannot be undone.`,
      async () => {
        // Optimistic update - remove from UI immediately
        setLocations(prev => prev.filter(loc => !selectedLocations.has(loc.id)));
        setSelectedLocations(new Set());
        setMessage({ type: 'success', text: `Deleting ${deletingIds.length} location${deletingIds.length > 1 ? 's' : ''}...` });
    
    try {
      // Delete each location
      const deletePromises = deletingIds.map(async (locationId) => {
        const response = await fetch(`/api/flora/locations/${locationId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to delete location ${locationId}: ${errorText}`);
        }
        
        return response.json();
      });
      
      await Promise.all(deletePromises);
      
      setMessage({ type: 'success', text: `Successfully deleted ${deletingIds.length} location${deletingIds.length > 1 ? 's' : ''}` });
      setTimeout(() => setMessage(null), 3000);
      
      // Refresh to sync with server
      await loadLocations(true);
    } catch (error) {
      // Rollback on error - reload locations to restore state
      await loadLocations(true);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessage({ type: 'error', text: `Failed to delete locations: ${errorMessage}` });
      setTimeout(() => setMessage(null), 5000);
    }
      },
      'Delete',
      'Cancel'
    );
  };


  // Handle blueprint selection
  const handleBlueprintSelect = async (blueprint: any) => {
    setSelectedBlueprint(blueprint);
    // Load fields and pricing for this blueprint
    const [fields, pricingRules] = await Promise.all([
      loadBlueprintFields(blueprint.id),
      loadBlueprintPricing(blueprint.id)
    ]);
    setSelectedBlueprint({ ...blueprint, fields, pricingRules });
  };

  // Load blueprint pricing rules
  const loadBlueprintPricing = async (blueprintId: number) => {
    try {
      console.log('🔍 Loading pricing rules for blueprint:', blueprintId);
      
      // Get all pricing rules and filter by blueprint
      const allRulesResponse = await fetch('/api/pricing/rules?per_page=100');
      if (allRulesResponse.ok) {
        const pricingData = await allRulesResponse.json();
        console.log('📊 All pricing rules response:', pricingData);
        
        if (pricingData && pricingData.rules && Array.isArray(pricingData.rules)) {
          // Filter rules that are associated with this blueprint
          const blueprintRules = pricingData.rules.filter((rule: any) => {
            // Parse the conditions to check for blueprint association
            let parsedConditions: any = {};
            try {
              parsedConditions = rule.conditions ? JSON.parse(rule.conditions) : {};
            } catch (e) {
              console.warn('Could not parse conditions for rule', rule.id);
            }
            
            // Check if rule is associated with this blueprint
            const isAssociated = 
              rule.blueprint_id == blueprintId || 
              parsedConditions.blueprint_id == blueprintId ||
              (rule.filters && rule.filters.blueprint_id == blueprintId);
            
            if (isAssociated) {
              console.log('✅ Found associated rule:', rule.rule_name, 'for blueprint', blueprintId);
            }
            
            return isAssociated;
          });
          
          // Format the rules similar to how we do in loadAvailablePricingRules
          const formattedRules = blueprintRules.map((rule: any, index: number) => {
            let parsedConditions: any = {};
            try {
              parsedConditions = rule.conditions ? JSON.parse(rule.conditions) : {};
            } catch (e) {
              console.warn('Could not parse conditions for rule', rule.id);
            }
            
            return {
              rule_id: rule.id,
              rule_name: rule.rule_name || rule.name || `Pricing Rule ${rule.id || index + 1}`,
              rule_type: rule.rule_type || 'quantity_break',
              description: `${rule.rule_type || 'Pricing'} rule for ${parsedConditions.product_type || 'products'} - ${parsedConditions.tiers?.length || 0} tiers`,
              unit: parsedConditions.unit_type || rule.unit || 'units',
              currency: rule.currency || 'USD',
              breaks: parsedConditions.tiers || rule.breaks || [],
              filters: rule.filters || parsedConditions,
              active: rule.is_active === '1' || rule.status === 'active',
              priority: parseInt(rule.priority) || 0,
              blueprint_id: parsedConditions.blueprint_id || rule.blueprint_id,
              blueprint_name: parsedConditions.blueprint_name,
              product_type: parsedConditions.product_type,
              created_at: rule.created_at,
              updated_at: rule.updated_at,
              conditions: parsedConditions
            };
          });
          
          console.log('✅ Formatted blueprint rules:', formattedRules);
          return formattedRules;
        }
      }
    } catch (err) {
      console.error('Error loading blueprint pricing:', err);
    }
    return [];
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, field: any) => {
    setDraggedField(field);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', JSON.stringify(field));
  };

  const handleDragOver = (e: React.DragEvent, zone: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverZone(zone);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverZone(null);
  };

  const handleDrop = (e: React.DragEvent, zone: string) => {
    e.preventDefault();
    setDragOverZone(null);
    
    if (!draggedField || !selectedBlueprint) return;
    
    // Add field to blueprint
    const newField = {
      ...draggedField,
      id: `temp_${Date.now()}`,
      sort_order: selectedBlueprint.fields ? selectedBlueprint.fields.length : 0
    };
    
    const updatedFields = selectedBlueprint.fields ? [...selectedBlueprint.fields, newField] : [newField];
    setSelectedBlueprint({ ...selectedBlueprint, fields: updatedFields });
    setDraggedField(null);
  };

  const handleFieldReorder = (fromIndex: number, toIndex: number) => {
    if (!selectedBlueprint?.fields) return;
    
    const fields = [...selectedBlueprint.fields];
    const [movedField] = fields.splice(fromIndex, 1);
    fields.splice(toIndex, 0, movedField);
    
    // Update sort orders
    fields.forEach((field, index) => {
      field.sort_order = index;
    });
    
    setSelectedBlueprint({ ...selectedBlueprint, fields });
  };

  const handleFieldRemove = (fieldId: string) => {
    if (!selectedBlueprint?.fields) return;
    
    const updatedFields = selectedBlueprint.fields.filter((field: any) => field.id !== fieldId);
    setSelectedBlueprint({ ...selectedBlueprint, fields: updatedFields });
  };

  // Pricing rule handlers
  const handleEditPricingRule = (rule: any) => {
    setEditingPricingRule({ ...rule });
    setShowPricingEditor(true);
  };

  const handleSavePricingRule = async (updatedRule: any) => {
    try {
      console.log('💾 Saving pricing rule:', updatedRule.rule_id);
      
      // Prepare the data in the format expected by the API
      const saveData = {
        rule_name: updatedRule.rule_name,
        rule_type: updatedRule.rule_type || 'quantity_break',
        conditions: {
          product_type: updatedRule.product_type,
          unit_type: updatedRule.unit,
          tiers: updatedRule.breaks.map((tier: any) => ({
            name: tier.name,
            min_quantity: parseFloat(tier.min_quantity),
            max_quantity: tier.max_quantity ? parseFloat(tier.max_quantity) : null,
            price: tier.price.toString()
          })),
          blueprint_id: updatedRule.blueprint_id,
          blueprint_name: updatedRule.blueprint_name,
          use_conversion_ratio: updatedRule.conditions?.use_conversion_ratio || false
        },
        priority: updatedRule.priority.toString(),
        is_active: updatedRule.active ? '1' : '0',
        status: updatedRule.active ? 'active' : 'inactive',
        scope: 'product'
      };
      
      console.log('📤 Sending save data:', saveData);

      const response = await fetch(`/api/pricing/rules/${updatedRule.rule_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData),
      });

      console.log('📡 Save response status:', response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Save successful:', responseData);
        
        // Refresh the pricing rules
        await loadAvailablePricingRules();
        
        // Update selected blueprint if it has this rule
        if (selectedBlueprint?.pricingRules) {
          const updatedPricingRules = selectedBlueprint.pricingRules.map((rule: any) =>
            rule.rule_id === updatedRule.rule_id ? updatedRule : rule
          );
          setSelectedBlueprint({ ...selectedBlueprint, pricingRules: updatedPricingRules });
        }
        
        setShowPricingEditor(false);
        setEditingPricingRule(null);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to save pricing rule:', response.status, errorText);
        dialogs.showError('Save Failed', `Failed to save pricing rule: ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Error saving pricing rule:', error);
      dialogs.showError('Error', `Error saving pricing rule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleClosePricingEditor = () => {
    setShowPricingEditor(false);
    setEditingPricingRule(null);
  };

  // Field editing handlers
  const handleEditField = (field: any) => {
    setEditingField({ ...field });
    setShowFieldEditor(true);
  };

  const handleSaveField = async (updatedField: any) => {
    try {
      console.log('💾 Saving blueprint field:', updatedField.field_id);
      
      const saveData = {
        field_name: updatedField.field_name,
        field_label: updatedField.field_label,
        field_type: updatedField.field_type,
        field_description: updatedField.field_description,
        validation_rules: updatedField.validation_rules || {},
        display_options: updatedField.display_options || {},
        is_required: updatedField.is_required,
        is_searchable: updatedField.is_searchable,
        sort_order: updatedField.sort_order || 0
      };
      
      console.log('📤 Sending field save data:', saveData);

      const response = await fetch(`/api/flora/blueprint-fields/${updatedField.field_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData),
      });

      console.log('📡 Field save response status:', response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Field save successful:', responseData);
        
        // Refresh the available fields
        await loadAvailableFields();
        
        // Update selected blueprint if it has this field
        if (selectedBlueprint?.fields) {
          const updatedFields = selectedBlueprint.fields.map((field: any) =>
            field.field_id === updatedField.field_id ? updatedField : field
          );
          setSelectedBlueprint({ ...selectedBlueprint, fields: updatedFields });
        }
        
        setShowFieldEditor(false);
        setEditingField(null);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to save field:', response.status, errorText);
        dialogs.showError('Save Failed', `Failed to save field: ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Error saving field:', error);
      dialogs.showError('Error', `Error saving field: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCloseFieldEditor = () => {
    setShowFieldEditor(false);
    setEditingField(null);
  };

  // Category handlers
  const handleEditCategory = (category: any) => {
    setEditingCategory({ ...category });
    setShowCategoryEditor(true);
  };

  const handleSaveCategory = async (updatedCategory: any) => {
    try {
      const isNewCategory = updatedCategory.id === 0;
      console.log(isNewCategory ? '💾 Creating new category' : '💾 Updating category:', updatedCategory.id);
      
      const saveData = {
        name: updatedCategory.name,
        slug: updatedCategory.slug,
        description: updatedCategory.description,
        parent: updatedCategory.parent,
        display: updatedCategory.display,
        menu_order: updatedCategory.menu_order,
        unit: updatedCategory.unit
      };
      
      console.log('📤 Sending category save data:', saveData);

      // Use POST for new categories, PUT for existing ones
      const url = isNewCategory ? '/api/flora/categories' : `/api/flora/categories/${updatedCategory.id}`;
      const method = isNewCategory ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData),
      });

      console.log('📡 Category save response status:', response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log(isNewCategory ? '✅ Category created successfully:' : '✅ Category updated successfully:', responseData);
        
        // Refresh the categories
        await loadCategories();
        
        setShowCategoryEditor(false);
        setEditingCategory(null);
      } else {
        const errorText = await response.text();
        console.error(`❌ Failed to ${isNewCategory ? 'create' : 'update'} category:`, response.status, errorText);
        dialogs.showError('Save Failed', `Failed to ${isNewCategory ? 'create' : 'update'} category: ${errorText}`);
      }
    } catch (error) {
      console.error(`❌ Error ${updatedCategory.id === 0 ? 'creating' : 'updating'} category:`, error);
      dialogs.showError('Error', `Error ${updatedCategory.id === 0 ? 'creating' : 'updating'} category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCloseCategoryEditor = () => {
    setShowCategoryEditor(false);
    setEditingCategory(null);
  };

  const handleCreateCategory = () => {
    // Create a new empty category object for creation
    const newCategory = {
      id: 0, // 0 indicates this is a new category
      name: '',
      slug: '',
      parent: 0,
      description: '',
      display: 'default',
      image: null,
      menu_order: 0,
      count: 0,
      unit: 'units'
    };
    setEditingCategory(newCategory);
    setShowCategoryEditor(true);
  };

  const handleSelectCategory = (categoryId: number) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleSelectAllCategories = () => {
    if (selectedCategories.size === categories.length) {
      // Deselect all
      setSelectedCategories(new Set());
    } else {
      // Select all
      setSelectedCategories(new Set(categories.map(cat => cat.id)));
    }
  };

  const handleDeleteSelectedCategories = async () => {
    if (selectedCategories.size === 0) return;

    const selectedCategoryList = categories.filter(cat => selectedCategories.has(cat.id));
    const selectedCategoryNames = selectedCategoryList.map(cat => cat.name).join(', ');

    // Check for system categories that can't be deleted
    const systemCategories = selectedCategoryList.filter(cat => 
      cat.slug === 'uncategorized' || 
      cat.name.toLowerCase().includes('uncategorized') || 
      cat.id === 15
    );

    if (systemCategories.length > 0) {
      dialogs.showError('Cannot Delete', 'Cannot delete system categories like "Uncategorized". Please deselect them and try again.');
      return;
    }

    dialogs.showDangerConfirm(
      'Delete Categories',
      `Are you sure you want to delete ${selectedCategories.size} categor${selectedCategories.size === 1 ? 'y' : 'ies'}?\n\n${selectedCategoryNames}\n\nProducts in these categories will be moved to "Uncategorized".`,
      async () => {

    try {
      console.log('🗑️ Deleting categories:', Array.from(selectedCategories));

      const response = await fetch('/api/flora/categories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          categoryIds: Array.from(selectedCategories),
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Categories deleted successfully:', responseData);
        
        // Clear selection and refresh categories
        setSelectedCategories(new Set());
        await loadCategories();
        
        dialogs.showSuccess('Success', `Successfully deleted ${selectedCategories.size} categor${selectedCategories.size === 1 ? 'y' : 'ies'}.`);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to delete categories:', response.status, errorText);
        dialogs.showError('Delete Failed', `Failed to delete categories: ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Error deleting categories:', error);
      dialogs.showError('Error', `Error deleting categories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
      },
      'Delete',
      'Cancel'
    );
  };


  return (
    <div className="flex-1 bg-neutral-900 flex flex-col overflow-hidden">

      {/* Tab Content */}
      {activeTab === 'locations' && (
        <>
          {/* Fixed Header Content */}
          {message && (
            <div className="flex-shrink-0 border-b border-white/[0.08] bg-neutral-800/30 p-4">
              <div className={`px-3 py-2 rounded-lg text-sm border transition-all duration-200 ${
                message.type === 'success' 
                  ? 'bg-green-900/10 border-green-500/20 text-green-400' 
                  : message.type === 'warning'
                  ? 'bg-yellow-900/10 border-yellow-500/20 text-yellow-400'
                  : 'bg-red-900/10 border-red-500/20 text-red-400'
              }`}>
                <div className="flex items-center gap-2">
                  {message.type === 'success' && (
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {message.type === 'warning' && (
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  )}
                  {message.type === 'error' && (
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <span>{message.text}</span>
                </div>
              </div>
            </div>
          )}
          
          
          {/* Locations Toolbar - Icon-only style matching products view */}
          <div className="px-4 py-1 border-b border-white/[0.04] bg-neutral-900 flex-shrink-0">
              <div className="flex items-center justify-between w-full">
                {/* Left section - Location counts */}
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-white/[0.05] text-neutral-400 text-xs rounded">
                    {locations.length} total
                  </span>
                  
                  {selectedLocations.size > 0 && (
                    <>
                      <span className="px-2 py-1 bg-white/[0.08] text-neutral-300 text-xs rounded">
                        {selectedLocations.size} selected
                      </span>
                      <Button
                        onClick={() => setSelectedLocations(new Set())}
                        variant="ghost"
                        size="sm"
                        className="text-xs text-neutral-400 hover:text-neutral-300 px-2 py-1"
                      >
                        Clear
                      </Button>
                    </>
                  )}
                </div>

                {/* Right section - Action Icons */}
                <div className="flex items-center gap-2">
                  {/* Delete selected locations */}
                  {selectedLocations.size > 0 && (
                    <IconButton
                      onClick={handleDeleteSelectedLocations}
                      variant="default"
                      title={`Delete ${selectedLocations.size} selected location${selectedLocations.size > 1 ? 's' : ''}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </IconButton>
                  )}
                  
                  <IconButton
                    onClick={() => loadLocations(true)}
                    variant="default"
                    title="Refresh Locations"
                    disabled={loading}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </IconButton>
                  
                  {/* Add Location Dropdown */}
                  <div className="relative">
                    <IconButton
                      onClick={() => setIsCreateDropdownOpen(!isCreateDropdownOpen)}
                      variant={isCreateDropdownOpen ? 'active' : 'default'}
                      title="Add Location"
                      disabled={loading}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </IconButton>
                    
                    <LocationCreateDropdown
                      isOpen={isCreateDropdownOpen}
                      onClose={() => setIsCreateDropdownOpen(false)}
                      onCreateLocation={handleCreateLocation}
                    />
                  </div>
                </div>
              </div>
            </div>

          {/* Scrollable Locations Table - This needs to take remaining space */}
          {error ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-400 mb-4">{error}</p>
                <Button onClick={() => loadLocations()} variant="secondary" size="md">
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <LocationTable
              locations={locations}
              expandedItems={expandedCards}
              onToggleExpand={handleToggleExpand}
              onBulkExpandCollapse={handleBulkExpandCollapse}
              onEditLocation={handleEditLocation}
              onRefresh={loadLocations}
              selectedLocations={selectedLocations}
              onSelectedLocationsChange={setSelectedLocations}
              isLoading={loading}
            />
          )}
        </>
      )}

      {activeTab === 'general' && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-16 h-16 text-neutral-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              <h3 className="text-neutral-400 text-lg font-medium mb-2">General Settings</h3>
              <p className="text-neutral-500 text-sm">General application settings will be available here</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'blueprints' && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Blueprint Builder Header */}
            <div className="flex-shrink-0 p-6 border-b border-white/[0.08]">
              <div>
                <h2 className="text-xl font-semibold text-neutral-200 mb-2">Blueprint Builder</h2>
                <p className="text-sm text-neutral-400">Create and manage field blueprints for your products</p>
              </div>
            </div>

            {/* Blueprint Content */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Blueprints List */}
                  <div className="lg:col-span-1">
                    <div className="bg-neutral-800/50 rounded-lg border border-white/[0.08] p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-neutral-200">Existing Blueprints</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={loadBlueprints}
                          disabled={blueprintsLoading}
                          className="flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          {blueprintsLoading ? 'Loading...' : 'Refresh'}
                        </Button>
                      </div>
                      
                      {blueprintsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <LoadingSpinner size="md" />
                        </div>
                      ) : blueprintsError ? (
                        <div className="text-center py-8">
                          <div className="text-red-400 text-sm mb-2">{blueprintsError}</div>
                          <Button onClick={loadBlueprints} variant="secondary" size="sm">
                            Try Again
                          </Button>
                        </div>
                      ) : blueprints.length === 0 ? (
                        <div className="text-center py-8">
                          <svg className="w-12 h-12 text-neutral-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-neutral-500 text-sm">No blueprints found</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {blueprints.map((blueprint) => (
                            <div
                              key={blueprint.id}
                              onClick={() => handleBlueprintSelect(blueprint)}
                              className={`p-3 rounded border transition-colors cursor-pointer ${
                                selectedBlueprint?.id === blueprint.id
                                  ? 'bg-neutral-700/70 border-white/[0.15] ring-1 ring-white/[0.1]'
                                  : 'bg-neutral-700/50 border-white/[0.06] hover:border-white/[0.12]'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="text-sm font-medium text-neutral-300">
                                    {blueprint.name || blueprint.label || `Blueprint ${blueprint.id}`}
                                  </h4>
                                  <p className="text-xs text-neutral-500 mt-1">
                                    {blueprint.description || 'No description'}
                                  </p>
                                </div>
                                <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Blueprint Editor */}
                  <div className="lg:col-span-2">
                    <div className="bg-neutral-800/50 rounded-lg border border-white/[0.08] p-6">
                      {selectedBlueprint ? (
                        <div>
                          {/* Blueprint Header */}
                          <div className="flex items-center justify-between mb-6">
                            <div>
                              <h3 className="text-lg font-medium text-neutral-200">
                                {selectedBlueprint.name || selectedBlueprint.label || `Blueprint ${selectedBlueprint.id}`}
                              </h3>
                              <p className="text-sm text-neutral-400 mt-1">
                                {selectedBlueprint.description || 'No description provided'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </Button>
                              <Button variant="ghost" size="sm">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </Button>
                            </div>
                          </div>

                          {/* Blueprint Content Tabs */}
                          <div className="mb-6">
                            <div className="border-b border-white/[0.08]">
                              <nav className="flex space-x-8">
                                <button 
                                  onClick={() => setBlueprintActiveTab('fields')}
                                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    blueprintActiveTab === 'fields'
                                      ? 'border-white/20 text-neutral-300'
                                      : 'border-transparent text-neutral-500 hover:text-neutral-400'
                                  }`}
                                >
                                  Fields ({selectedBlueprint.fields?.length || 0})
                                </button>
                                <button 
                                  onClick={() => setBlueprintActiveTab('pricing')}
                                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    blueprintActiveTab === 'pricing'
                                      ? 'border-white/20 text-neutral-300'
                                      : 'border-transparent text-neutral-500 hover:text-neutral-400'
                                  }`}
                                >
                                  Pricing Rules ({selectedBlueprint.pricingRules?.length || 0})
                                </button>
                              </nav>
                            </div>
                          </div>

                          {/* Blueprint Fields */}
                          {blueprintActiveTab === 'fields' && (
                            <div>
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-md font-medium text-neutral-300">Fields</h4>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant={isEditMode ? "secondary" : "ghost"} 
                                  size="sm" 
                                  onClick={() => setIsEditMode(!isEditMode)}
                                  className="flex items-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  {isEditMode ? 'Done' : 'Edit'}
                                </Button>
                                <Button variant="primary" size="sm" className="flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                  Add Field
                                </Button>
                              </div>
                            </div>

                            {selectedBlueprint.fields && selectedBlueprint.fields.length > 0 ? (
                              <div 
                                className={`min-h-32 rounded-lg border-2 border-dashed transition-colors ${
                                  dragOverZone === 'blueprint-fields' 
                                    ? 'border-white/40 bg-white/[0.02]' 
                                    : 'border-white/[0.08] bg-transparent'
                                }`}
                                onDragOver={(e) => handleDragOver(e, 'blueprint-fields')}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, 'blueprint-fields')}
                              >
                                <div className="p-4 space-y-3">
                                  {selectedBlueprint.fields.map((field: any, index: number) => (
                                    <div 
                                      key={field.id} 
                                      className={`p-4 bg-neutral-700/30 rounded border border-white/[0.04] transition-all ${
                                        isEditMode ? 'cursor-move hover:bg-neutral-700/50' : ''
                                      }`}
                                      draggable={isEditMode}
                                      onDragStart={isEditMode ? (e) => {
                                        e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'reorder', fromIndex: index }));
                                      } : undefined}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                          {isEditMode && (
                                            <div className="cursor-move text-neutral-500">
                                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                              </svg>
                                            </div>
                                          )}
                                          <div className="w-3 h-3 rounded-full bg-neutral-500"></div>
                                          <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                              <h5 className="text-sm font-medium text-neutral-300">
                                                {field.field_label || field.field_name}
                                              </h5>
                                              <span className="px-2 py-1 text-xs bg-neutral-600/50 text-neutral-400 rounded">
                                                {field.field_type}
                                              </span>
                                              {field.is_required && (
                                                <span className="px-2 py-1 text-xs bg-red-900/30 text-red-400 rounded border border-red-500/20">
                                                  Required
                                                </span>
                                              )}
                                            </div>
                                            {field.field_description && (
                                              <p className="text-xs text-neutral-500">
                                                {field.field_description}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <IconButton variant="ghost" size="sm">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                          </IconButton>
                                          {isEditMode && (
                                            <IconButton 
                                              variant="ghost" 
                                              size="sm"
                                              onClick={() => handleFieldRemove(field.id)}
                                            >
                                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                              </svg>
                                            </IconButton>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  
                                  {/* Drop zone indicator */}
                                  {dragOverZone === 'blueprint-fields' && (
                                    <div className="p-4 border-2 border-dashed border-white/40 bg-white/[0.02] rounded text-center">
                                      <p className="text-neutral-300 text-sm">Drop field here to add to blueprint</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div 
                                className={`min-h-32 rounded-lg border-2 border-dashed transition-colors ${
                                  dragOverZone === 'blueprint-fields' 
                                    ? 'border-white/40 bg-white/[0.02]' 
                                    : 'border-white/[0.08] bg-transparent'
                                }`}
                                onDragOver={(e) => handleDragOver(e, 'blueprint-fields')}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, 'blueprint-fields')}
                              >
                                <div className="text-center py-8">
                                  {dragOverZone === 'blueprint-fields' ? (
                                    <div className="text-neutral-300">
                                      <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                      </svg>
                                      <p className="text-sm font-medium">Drop field here to add to blueprint</p>
                                    </div>
                                  ) : (
                                    <div>
                                      <svg className="w-12 h-12 text-neutral-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                      </svg>
                                      <p className="text-neutral-500 text-sm mb-4">No fields in this blueprint</p>
                                      <p className="text-neutral-600 text-xs mb-4">Drag fields from the library below to add them</p>
                                      <Button variant="secondary" size="sm" className="flex items-center gap-2 mx-auto">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add First Field
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          )}

                          {/* Blueprint Pricing Rules */}
                          {blueprintActiveTab === 'pricing' && (
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-md font-medium text-neutral-300">Pricing Rules</h4>
                                <Button variant="primary" size="sm" className="flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                  Add Pricing Rule
                                </Button>
                              </div>

                              {selectedBlueprint.pricingRules && selectedBlueprint.pricingRules.length > 0 ? (
                                <div className="space-y-4">
                                  {selectedBlueprint.pricingRules.map((rule: any) => (
                                    <div key={rule.rule_id || rule.id} className="p-4 bg-neutral-700/30 rounded border border-white/[0.04]">
                                      <div className="flex items-center justify-between mb-3">
                                        <div>
                                          <h5 className="text-sm font-medium text-neutral-300 mb-1">
                                            {rule.rule_name || rule.name || `Pricing Rule ${rule.rule_id || rule.id}`}
                                          </h5>
                                          <div className="flex items-center gap-2">
                                            <span className="px-2 py-1 text-xs bg-neutral-600/50 text-neutral-400 rounded">
                                              {rule.rule_type || 'quantity_break'}
                                            </span>
                                            <span className="text-xs text-neutral-400">
                                              {rule.unit || 'units'}
                                            </span>
                                            {rule.product_type && (
                                              <span className="px-2 py-1 text-xs bg-neutral-600/30 text-neutral-400 rounded">
                                                {rule.product_type}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <IconButton variant="ghost" size="sm">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                          </IconButton>
                                          <IconButton variant="ghost" size="sm">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                          </IconButton>
                                        </div>
                                      </div>
                                      
                                      {rule.breaks && rule.breaks.length > 0 && (
                                        <div>
                                          <h6 className="text-xs font-medium text-neutral-400 mb-2">
                                            Pricing Tiers ({rule.breaks.length})
                                          </h6>
                                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                            {rule.breaks.map((tier: any, index: number) => (
                                              <div key={index} className="p-2 bg-neutral-600/20 rounded text-xs">
                                                <div className="flex items-center justify-between">
                                                  <span className="text-neutral-400">
                                                    {tier.name || `${tier.min_quantity}${tier.max_quantity ? `-${tier.max_quantity}` : '+'}`}
                                                  </span>
                                                  <span className="text-neutral-300 font-medium">
                                                    ${tier.price}
                                                  </span>
                                                </div>
                                                <div className="text-neutral-500 text-xs mt-1">
                                                  {tier.min_quantity} - {tier.max_quantity || '∞'} {rule.unit || 'units'}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-12">
                                  <svg className="w-16 h-16 text-neutral-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                  </svg>
                                  <h3 className="text-neutral-400 text-lg font-medium mb-2">No Pricing Rules</h3>
                                  <p className="text-neutral-500 text-sm mb-6">This blueprint doesn't have any pricing rules assigned</p>
                                  <Button variant="secondary" size="md" className="flex items-center gap-2 mx-auto">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add Pricing Rule
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <svg className="w-16 h-16 text-neutral-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <h3 className="text-neutral-400 text-lg font-medium mb-2">Blueprint Editor</h3>
                          <p className="text-neutral-500 text-sm mb-6">Select a blueprint to edit or create a new one</p>
                          <Button
                            variant="secondary"
                            size="md"
                            className="flex items-center gap-2 mx-auto"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create New Blueprint
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Field Library and Pricing Library */}
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Field Library */}
                  <div className="bg-neutral-800/50 rounded-lg border border-white/[0.08] p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-neutral-200">
                        Field Library ({availableFields.filter(field => 
                          fieldTypeFilter === 'all' || field.field_type === fieldTypeFilter
                        ).length} fields)
                      </h3>
                      <div className="flex items-center gap-2">
                        <select
                          value={fieldTypeFilter}
                          onChange={(e) => setFieldTypeFilter(e.target.value)}
                          className="px-3 py-1 text-xs bg-neutral-700 border border-white/[0.08] rounded text-neutral-300 focus:outline-none focus:ring-1 focus:ring-white/20"
                        >
                          <option value="all">All Types</option>
                          <option value="text">Text</option>
                          <option value="textarea">Textarea</option>
                          <option value="number">Number</option>
                          <option value="select">Select</option>
                          <option value="boolean">Boolean</option>
                          <option value="date">Date</option>
                          <option value="url">URL</option>
                          <option value="email">Email</option>
                        </select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={loadAvailableFields}
                          className="flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Refresh
                        </Button>
                      </div>
                    </div>
                    
                    {availableFields.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                        {availableFields
                          .filter(field => fieldTypeFilter === 'all' || field.field_type === fieldTypeFilter)
                          .map((field) => (
                          <div
                            key={`${field.blueprint_id}-${field.field_id}`}
                            className="p-3 bg-neutral-700/30 rounded border border-white/[0.04] hover:border-white/[0.08] transition-colors cursor-grab active:cursor-grabbing"
                            draggable
                            onDragStart={(e) => handleDragStart(e, field)}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 rounded-full bg-neutral-400"></div>
                              <span className="text-xs font-medium text-neutral-300 truncate">
                                {field.field_label || field.field_name}
                              </span>
                              <div className="ml-auto flex items-center gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditField(field);
                                  }}
                                  className="p-1 hover:bg-neutral-600/30 rounded transition-colors"
                                  title="Edit field"
                                >
                                  <svg className="w-3 h-3 text-neutral-400 hover:text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <div className="w-3 h-3 text-neutral-500">
                                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="px-2 py-1 text-xs bg-neutral-600/50 text-neutral-400 rounded">
                                {field.field_type}
                              </span>
                              {field.is_required && (
                                <span className="text-xs text-red-400">*</span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-500 truncate">
                              {field.field_description || `From ${field.blueprint_name}`}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <svg className="w-12 h-12 text-neutral-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-neutral-500 text-sm mb-4">No fields available</p>
                        <Button variant="secondary" size="sm" onClick={loadAvailableFields}>
                          Load Fields
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Pricing Library */}
                  <div className="bg-neutral-800/50 rounded-lg border border-white/[0.08] p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-neutral-200">
                        Pricing Library ({availablePricingRules.filter(rule => 
                          pricingTypeFilter === 'all' || rule.rule_type === pricingTypeFilter
                        ).length} rules)
                      </h3>
                      <div className="flex items-center gap-2">
                        <select
                          value={pricingTypeFilter}
                          onChange={(e) => setPricingTypeFilter(e.target.value)}
                          className="px-3 py-1 text-xs bg-neutral-700 border border-white/[0.08] rounded text-neutral-300 focus:outline-none focus:ring-1 focus:ring-white/20"
                        >
                          <option value="all">All Types</option>
                          <option value="quantity_break">Quantity Breaks</option>
                          <option value="tier_pricing">Tier Pricing</option>
                          <option value="bulk_discount">Bulk Discount</option>
                          <option value="fixed_price">Fixed Price</option>
                        </select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={loadAvailablePricingRules}
                          className="flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Refresh
                        </Button>
                      </div>
                    </div>
                    
                    {availablePricingRules.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                        {availablePricingRules
                          .filter(rule => pricingTypeFilter === 'all' || rule.rule_type === pricingTypeFilter)
                          .map((rule) => (
                          <div
                            key={`pricing_${rule.rule_id}`}
                            className="p-3 bg-neutral-700/30 rounded border border-white/[0.04] hover:border-white/[0.08] transition-colors cursor-grab active:cursor-grabbing"
                            draggable
                            onDragStart={(e) => handleDragStart(e, { ...rule, field_type: 'pricing_rule' })}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 bg-neutral-400 rounded-full"></div>
                              <span className="text-xs font-medium text-neutral-300 truncate">
                                {rule.rule_name}
                              </span>
                              <div className="ml-auto flex items-center gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditPricingRule(rule);
                                  }}
                                  className="p-1 hover:bg-neutral-600/30 rounded transition-colors"
                                  title="Edit pricing rule"
                                >
                                  <svg className="w-3 h-3 text-neutral-400 hover:text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <div className="w-3 h-3 text-neutral-500">
                                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="px-2 py-1 text-xs bg-neutral-600/50 text-neutral-400 rounded">
                                {rule.rule_type}
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-neutral-400">{rule.unit}</span>
                                {!rule.active && (
                                  <span className="text-xs text-neutral-500">Inactive</span>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-neutral-500 truncate mb-2">
                              {rule.description}
                            </p>
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                {rule.breaks && rule.breaks.length > 0 && (
                                  <span className="text-neutral-400">
                                    {rule.breaks.length} tier{rule.breaks.length !== 1 ? 's' : ''}
                                  </span>
                                )}
                                {rule.product_type && (
                                  <span className="px-1 py-0.5 bg-neutral-600/30 text-neutral-400 rounded text-xs">
                                    {rule.product_type}
                                  </span>
                                )}
                              </div>
                              {rule.blueprint_name && (
                                <span className="text-neutral-500 truncate">
                                  {rule.blueprint_name}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <svg className="w-12 h-12 text-neutral-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        <p className="text-neutral-500 text-sm mb-4">No pricing rules available</p>
                        <Button variant="secondary" size="sm" onClick={loadAvailablePricingRules}>
                          Load Pricing Rules
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Categories Header */}
            <div className="flex-shrink-0 p-6 border-b border-white/[0.08]">
              <div>
                <h2 className="text-xl font-semibold text-neutral-200 mb-2">Categories</h2>
                <p className="text-sm text-neutral-400">Manage product categories and their settings</p>
              </div>
            </div>

            {/* Categories Content */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Categories List */}
                  <div className="lg:col-span-2">
                    <div className="bg-neutral-800/50 rounded-lg border border-white/[0.08] p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-medium text-neutral-200">All Categories</h3>
                          {selectedCategories.size > 0 && (
                            <Badge variant="info" size="sm">
                              {selectedCategories.size} selected
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {categories.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleSelectAllCategories}
                              className="flex items-center gap-2"
                              title={selectedCategories.size === categories.length ? "Deselect All" : "Select All"}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {selectedCategories.size === categories.length ? 'Deselect All' : 'Select All'}
                            </Button>
                          )}
                          {selectedCategories.size > 0 && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={handleDeleteSelectedCategories}
                              className="flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete ({selectedCategories.size})
                            </Button>
                          )}
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleCreateCategory}
                            className="flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Category
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={loadCategories}
                            disabled={categoriesLoading}
                            className="flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {categoriesLoading ? 'Loading...' : 'Refresh'}
                          </Button>
                        </div>
                      </div>
                      
                      {categoriesLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <LoadingSpinner size="md" />
                        </div>
                      ) : categoriesError ? (
                        <div className="text-center py-8">
                          <div className="text-red-400 text-sm mb-2">{categoriesError}</div>
                          <Button onClick={loadCategories} variant="secondary" size="sm">
                            Try Again
                          </Button>
                        </div>
                      ) : categories.length === 0 ? (
                        <div className="text-center py-8">
                          <svg className="w-12 h-12 text-neutral-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          <p className="text-neutral-500 text-sm">No categories found</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                          {categories.map((category) => (
                            <div
                              key={category.id}
                              className={`p-4 rounded-lg border-b border-white/[0.02] transition-colors ${
                                selectedCategories.has(category.id)
                                  ? 'bg-neutral-800/50 border-l-4 border-l-neutral-400'
                                  : selectedCategory?.id === category.id
                                    ? 'bg-neutral-700/70 border border-white/[0.15]'
                                    : 'bg-neutral-700/50 border border-white/[0.06] hover:border-white/[0.12]'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <input
                                    type="checkbox"
                                    checked={selectedCategories.has(category.id)}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handleSelectCategory(category.id);
                                    }}
                                    className="w-4 h-4 rounded border-neutral-600 bg-neutral-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                                  />
                                  <div 
                                    className="flex-1 cursor-pointer"
                                    onClick={() => setSelectedCategory(category)}
                                  >
                                    <div className="flex items-center gap-3 mb-2">
                                      <div className="w-3 h-3 rounded-full bg-neutral-400"></div>
                                      <h4 className="text-sm font-medium text-neutral-300">
                                        {category.name}
                                      </h4>
                                      <span className="px-2 py-1 text-xs bg-neutral-600/50 text-neutral-400 rounded">
                                        {category.unit || 'units'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                                      <span>{category.count || 0} products</span>
                                      {category.parent > 0 && (
                                        <span>• Child category</span>
                                      )}
                                    </div>
                                    {category.description && (
                                      <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                                        {category.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditCategory(category);
                                    }}
                                    className="p-1 hover:bg-neutral-600/30 rounded transition-colors"
                                    title="Edit category"
                                  >
                                    <svg className="w-4 h-4 text-neutral-400 hover:text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Category Details */}
                  <div className="lg:col-span-1">
                    <div className="bg-neutral-800/50 rounded-lg border border-white/[0.08] p-6">
                      {selectedCategory ? (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-neutral-200">
                              {selectedCategory.name}
                            </h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCategory(selectedCategory)}
                              className="flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </Button>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="text-xs font-medium text-neutral-400 block mb-1">Slug</label>
                              <p className="text-sm text-neutral-300">{selectedCategory.slug}</p>
                            </div>
                            
                            <div>
                              <label className="text-xs font-medium text-neutral-400 block mb-1">Unit Type</label>
                              <p className="text-sm text-neutral-300">{selectedCategory.unit || 'units'}</p>
                            </div>
                            
                            <div>
                              <label className="text-xs font-medium text-neutral-400 block mb-1">Product Count</label>
                              <p className="text-sm text-neutral-300">{selectedCategory.count || 0} products</p>
                            </div>
                            
                            {selectedCategory.description && (
                              <div>
                                <label className="text-xs font-medium text-neutral-400 block mb-1">Description</label>
                                <p className="text-sm text-neutral-300">{selectedCategory.description}</p>
                              </div>
                            )}
                            
                            <div>
                              <label className="text-xs font-medium text-neutral-400 block mb-1">Display Type</label>
                              <p className="text-sm text-neutral-300">{selectedCategory.display || 'default'}</p>
                            </div>
                            
                            <div>
                              <label className="text-xs font-medium text-neutral-400 block mb-1">Menu Order</label>
                              <p className="text-sm text-neutral-300">{selectedCategory.menu_order || 0}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <svg className="w-16 h-16 text-neutral-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          <h3 className="text-neutral-400 text-lg font-medium mb-2">Category Details</h3>
                          <p className="text-neutral-500 text-sm">Select a category to view details</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'developer' && (
        <DeveloperTools />
      )}

      {/* Pricing Rule Editor Modal */}
      {showPricingEditor && editingPricingRule && (
        <PricingRuleEditor
          rule={editingPricingRule}
          onSave={handleSavePricingRule}
          onClose={handleClosePricingEditor}
        />
      )}

      {/* Field Editor Modal */}
      {showFieldEditor && editingField && (
        <FieldEditor
          field={editingField}
          onSave={handleSaveField}
          onClose={handleCloseFieldEditor}
        />
      )}

      {/* Category Editor Modal */}
      {showCategoryEditor && editingCategory && (
        <CategoryEditor
          category={editingCategory}
          onSave={handleSaveCategory}
          onClose={handleCloseCategoryEditor}
        />
      )}
    </div>
  );
}

// Pricing Rule Editor Component
interface PricingRuleEditorProps {
  rule: any;
  onSave: (rule: any) => void;
  onClose: () => void;
}

function PricingRuleEditor({ rule, onSave, onClose }: PricingRuleEditorProps) {
  const [editedRule, setEditedRule] = useState({ ...rule });
  const [isSaving, setIsSaving] = useState(false);

  const handleTierChange = (index: number, field: string, value: string | number) => {
    const updatedBreaks = [...editedRule.breaks];
    updatedBreaks[index] = { ...updatedBreaks[index], [field]: value };
    setEditedRule({ ...editedRule, breaks: updatedBreaks });
  };

  const handleAddTier = () => {
    const newTier = {
      name: `Tier ${editedRule.breaks.length + 1}`,
      min_quantity: 1,
      max_quantity: null,
      price: '0.00'
    };
    setEditedRule({ ...editedRule, breaks: [...editedRule.breaks, newTier] });
  };

  const handleRemoveTier = (index: number) => {
    const updatedBreaks = editedRule.breaks.filter((_: any, i: number) => i !== index);
    setEditedRule({ ...editedRule, breaks: updatedBreaks });
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(editedRule);
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-neutral-800 rounded-lg border border-white/[0.08] w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.08]">
          <div>
            <h2 className="text-xl font-semibold text-neutral-200">Edit Pricing Rule</h2>
            <p className="text-sm text-neutral-400 mt-1">{editedRule.rule_name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Rule Name
              </label>
              <input
                type="text"
                value={editedRule.rule_name}
                onChange={(e) => setEditedRule({ ...editedRule, rule_name: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-700 border border-white/[0.08] rounded text-neutral-300 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Product Type
              </label>
              <input
                type="text"
                value={editedRule.product_type || ''}
                onChange={(e) => setEditedRule({ ...editedRule, product_type: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-700 border border-white/[0.08] rounded text-neutral-300 focus:outline-none focus:ring-1 focus:ring-white/20"
                placeholder="e.g., flower, edible, vape"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Unit Type
              </label>
              <input
                type="text"
                value={editedRule.unit || ''}
                onChange={(e) => setEditedRule({ ...editedRule, unit: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-700 border border-white/[0.08] rounded text-neutral-300 focus:outline-none focus:ring-1 focus:ring-white/20"
                placeholder="e.g., grams, pieces, units"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Priority
              </label>
              <input
                type="number"
                value={editedRule.priority || 0}
                onChange={(e) => setEditedRule({ ...editedRule, priority: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-neutral-700 border border-white/[0.08] rounded text-neutral-300 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </div>
          </div>

          {/* Pricing Tiers */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-neutral-300">Pricing Tiers</h3>
              <Button
                onClick={handleAddTier}
                variant="secondary"
                size="sm"
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Tier
              </Button>
            </div>

            <div className="space-y-4">
              {editedRule.breaks.map((tier: any, index: number) => (
                <div key={index} className="p-4 bg-neutral-700/30 rounded border border-white/[0.04]">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-neutral-300">Tier {index + 1}</h4>
                    {editedRule.breaks.length > 1 && (
                      <button
                        onClick={() => handleRemoveTier(index)}
                        className="p-1 hover:bg-neutral-600/30 rounded transition-colors"
                        title="Remove tier"
                      >
                        <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={tier.name || ''}
                        onChange={(e) => handleTierChange(index, 'name', e.target.value)}
                        className="w-full px-2 py-1 bg-neutral-600 border border-white/[0.08] rounded text-xs text-neutral-300 focus:outline-none focus:ring-1 focus:ring-white/20"
                        placeholder="e.g., 1g, Small"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1">
                        Min Quantity
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={tier.min_quantity || ''}
                        onChange={(e) => handleTierChange(index, 'min_quantity', parseFloat(e.target.value))}
                        className="w-full px-2 py-1 bg-neutral-600 border border-white/[0.08] rounded text-xs text-neutral-300 focus:outline-none focus:ring-1 focus:ring-white/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1">
                        Max Quantity
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={tier.max_quantity || ''}
                        onChange={(e) => handleTierChange(index, 'max_quantity', e.target.value ? parseFloat(e.target.value) : '')}
                        className="w-full px-2 py-1 bg-neutral-600 border border-white/[0.08] rounded text-xs text-neutral-300 focus:outline-none focus:ring-1 focus:ring-white/20"
                        placeholder="Leave empty for ∞"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1">
                        Price ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={tier.price || ''}
                        onChange={(e) => handleTierChange(index, 'price', e.target.value)}
                        className="w-full px-2 py-1 bg-neutral-600 border border-white/[0.08] rounded text-xs text-neutral-300 focus:outline-none focus:ring-1 focus:ring-white/20"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/[0.08]">
          <Button
            onClick={onClose}
            variant="ghost"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="primary"
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving && (
              <LoadingSpinner size="sm" />
            )}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
      
      {/* Dialog Components */}
      <AlertDialog
        isOpen={dialogs.alertDialog.isOpen}
        onClose={dialogs.closeAlert}
        title={dialogs.alertDialog.title}
        message={dialogs.alertDialog.message}
        variant={dialogs.alertDialog.variant}
      />
      
      <ConfirmDialog
        isOpen={dialogs.confirmDialog.isOpen}
        onClose={dialogs.closeConfirm}
        onConfirm={dialogs.handleConfirm}
        title={dialogs.confirmDialog.title}
        message={dialogs.confirmDialog.message}
        variant={dialogs.confirmDialog.variant}
        confirmText={dialogs.confirmDialog.confirmText}
        cancelText={dialogs.confirmDialog.cancelText}
      />
    </div>
  );
}

// Field Editor Component
interface FieldEditorProps {
  field: any;
  onSave: (field: any) => void;
  onClose: () => void;
}

function FieldEditor({ field, onSave, onClose }: FieldEditorProps) {
  const [editedField, setEditedField] = useState({ ...field });
  const [isSaving, setIsSaving] = useState(false);

  const fieldTypes = [
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

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(editedField);
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-neutral-800 rounded-lg border border-white/[0.08] w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.08]">
          <div>
            <h2 className="text-xl font-semibold text-neutral-200">Edit Field</h2>
            <p className="text-sm text-neutral-400 mt-1">{editedField.field_label || editedField.field_name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Field Name
                </label>
                <input
                  type="text"
                  value={editedField.field_name}
                  onChange={(e) => setEditedField({ ...editedField, field_name: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-700 border border-white/[0.08] rounded text-neutral-300 focus:outline-none focus:ring-1 focus:ring-white/20"
                  placeholder="e.g., product_weight"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Field Label
                </label>
                <input
                  type="text"
                  value={editedField.field_label}
                  onChange={(e) => setEditedField({ ...editedField, field_label: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-700 border border-white/[0.08] rounded text-neutral-300 focus:outline-none focus:ring-1 focus:ring-white/20"
                  placeholder="e.g., Product Weight"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Field Type
              </label>
              <select
                value={editedField.field_type}
                onChange={(e) => setEditedField({ ...editedField, field_type: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-700 border border-white/[0.08] rounded text-neutral-300 focus:outline-none focus:ring-1 focus:ring-white/20"
              >
                {fieldTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Description
              </label>
              <textarea
                value={editedField.field_description || ''}
                onChange={(e) => setEditedField({ ...editedField, field_description: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-700 border border-white/[0.08] rounded text-neutral-300 focus:outline-none focus:ring-1 focus:ring-white/20 resize-none"
                rows={3}
                placeholder="Describe what this field is used for..."
              />
            </div>

            {/* Field Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={editedField.sort_order || 0}
                  onChange={(e) => setEditedField({ ...editedField, sort_order: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-neutral-700 border border-white/[0.08] rounded text-neutral-300 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>
              <div className="flex items-center space-y-4 pt-8">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editedField.is_required || false}
                    onChange={(e) => setEditedField({ ...editedField, is_required: e.target.checked })}
                    className="rounded border-neutral-600 bg-neutral-700 text-white focus:ring-white/20"
                  />
                  <span className="text-sm text-neutral-300">Required</span>
                </label>
                <label className="flex items-center gap-2 ml-6">
                  <input
                    type="checkbox"
                    checked={editedField.is_searchable || false}
                    onChange={(e) => setEditedField({ ...editedField, is_searchable: e.target.checked })}
                    className="rounded border-neutral-600 bg-neutral-700 text-white focus:ring-white/20"
                  />
                  <span className="text-sm text-neutral-300">Searchable</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/[0.08]">
          <Button
            onClick={onClose}
            variant="ghost"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="primary"
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving && (
              <LoadingSpinner size="sm" />
            )}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
      
      {/* Dialog Components */}
      <AlertDialog
        isOpen={dialogs.alertDialog.isOpen}
        onClose={dialogs.closeAlert}
        title={dialogs.alertDialog.title}
        message={dialogs.alertDialog.message}
        variant={dialogs.alertDialog.variant}
      />
      
      <ConfirmDialog
        isOpen={dialogs.confirmDialog.isOpen}
        onClose={dialogs.closeConfirm}
        onConfirm={dialogs.handleConfirm}
        title={dialogs.confirmDialog.title}
        message={dialogs.confirmDialog.message}
        variant={dialogs.confirmDialog.variant}
        confirmText={dialogs.confirmDialog.confirmText}
        cancelText={dialogs.confirmDialog.cancelText}
      />
    </div>
  );
}

// Category Editor Component
interface CategoryEditorProps {
  category: any;
  onSave: (category: any) => void;
  onClose: () => void;
}

function CategoryEditor({ category, onSave, onClose }: CategoryEditorProps) {
  const [editedCategory, setEditedCategory] = useState({ ...category });
  const [isSaving, setIsSaving] = useState(false);

  const unitTypes = [
    { value: 'units', label: 'Units' },
    { value: 'grams', label: 'Grams' },
    { value: 'ounces', label: 'Ounces' },
    { value: 'pounds', label: 'Pounds' },
    { value: 'pieces', label: 'Pieces' },
    { value: 'milligrams', label: 'Milligrams' },
    { value: 'milliliters', label: 'Milliliters' },
    { value: 'liters', label: 'Liters' }
  ];

  const displayTypes = [
    { value: 'default', label: 'Default' },
    { value: 'products', label: 'Products' },
    { value: 'subcategories', label: 'Subcategories' },
    { value: 'both', label: 'Both' }
  ];

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(editedCategory);
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-neutral-800 rounded-lg border border-white/[0.08] w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.08]">
          <div>
            <h2 className="text-xl font-semibold text-neutral-200">Edit Category</h2>
            <p className="text-sm text-neutral-400 mt-1">{editedCategory.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  value={editedCategory.name}
                  onChange={(e) => setEditedCategory({ ...editedCategory, name: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-700 border border-white/[0.08] rounded text-neutral-300 focus:outline-none focus:ring-1 focus:ring-white/20"
                  placeholder="e.g., Flower, Edibles"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Slug
                </label>
                <input
                  type="text"
                  value={editedCategory.slug}
                  onChange={(e) => setEditedCategory({ ...editedCategory, slug: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-700 border border-white/[0.08] rounded text-neutral-300 focus:outline-none focus:ring-1 focus:ring-white/20"
                  placeholder="e.g., flower, edibles"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Description
              </label>
              <textarea
                value={editedCategory.description || ''}
                onChange={(e) => setEditedCategory({ ...editedCategory, description: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-700 border border-white/[0.08] rounded text-neutral-300 focus:outline-none focus:ring-1 focus:ring-white/20 resize-none"
                rows={3}
                placeholder="Describe this category..."
              />
            </div>

            {/* Category Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Unit Type
                </label>
                <select
                  value={editedCategory.unit || 'units'}
                  onChange={(e) => setEditedCategory({ ...editedCategory, unit: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-700 border border-white/[0.08] rounded text-neutral-300 focus:outline-none focus:ring-1 focus:ring-white/20"
                >
                  {unitTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Display Type
                </label>
                <select
                  value={editedCategory.display || 'default'}
                  onChange={(e) => setEditedCategory({ ...editedCategory, display: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-700 border border-white/[0.08] rounded text-neutral-300 focus:outline-none focus:ring-1 focus:ring-white/20"
                >
                  {displayTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Menu Order
                </label>
                <input
                  type="number"
                  value={editedCategory.menu_order || 0}
                  onChange={(e) => setEditedCategory({ ...editedCategory, menu_order: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-neutral-700 border border-white/[0.08] rounded text-neutral-300 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/[0.08]">
          <Button
            onClick={onClose}
            variant="ghost"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="primary"
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving && (
              <LoadingSpinner size="sm" />
            )}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
      
      {/* Dialog Components */}
      <AlertDialog
        isOpen={dialogs.alertDialog.isOpen}
        onClose={dialogs.closeAlert}
        title={dialogs.alertDialog.title}
        message={dialogs.alertDialog.message}
        variant={dialogs.alertDialog.variant}
      />
      
      <ConfirmDialog
        isOpen={dialogs.confirmDialog.isOpen}
        onClose={dialogs.closeConfirm}
        onConfirm={dialogs.handleConfirm}
        title={dialogs.confirmDialog.title}
        message={dialogs.confirmDialog.message}
        variant={dialogs.confirmDialog.variant}
        confirmText={dialogs.confirmDialog.confirmText}
        cancelText={dialogs.confirmDialog.cancelText}
      />
    </div>
  );
}
