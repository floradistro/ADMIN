import React, { useState, useEffect } from 'react';
import { Button, IconButton, Card, JsonPopout, JsonIcon, TabHero } from '../../ui';
import { DeleteConfirmDialog } from '../../ui/DeleteConfirmDialog';
import { DuplicateConfirmDialog } from '../../ui/DuplicateConfirmDialog';
import { floraFieldsAPI, StandaloneField, CreateStandaloneFieldData, FieldTemplate } from '../../../services/flora-fields-api';

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

export function StandaloneFieldsManager() {
  const [fields, setFields] = useState<StandaloneField[]>([]);
  const [templates, setTemplates] = useState<FieldTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOperating, setIsOperating] = useState(false);
  
  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingField, setEditingField] = useState<StandaloneField | null>(null);
  const [formData, setFormData] = useState<CreateStandaloneFieldData>({
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

  // Expandable cards state (matching BlueprintDesigner)
  const [expandedFields, setExpandedFields] = useState<Set<number>>(new Set());
  
  // Tab state for each field
  const [fieldActiveTabs, setFieldActiveTabs] = useState<Record<number, string>>({});

  // Confirmation dialogs
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    field: StandaloneField | null;
  }>({ show: false, field: null });
  
  const [duplicateConfirm, setDuplicateConfirm] = useState<{
    show: boolean;
    field: StandaloneField | null;
  }>({ show: false, field: null });

  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [showUsageStats, setShowUsageStats] = useState<Record<number, boolean>>({});

  // Load data
  const loadFields = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await floraFieldsAPI.getStandaloneFields();
      setFields(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load standalone fields');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await floraFieldsAPI.getFieldTemplates();
      setTemplates(data);
    } catch (err) {
    }
  };

  // CRUD operations
  const createField = async () => {
    try {
      setIsOperating(true);
      const response = await floraFieldsAPI.createStandaloneField(formData);
      
      if (response.field) {
        setFields(prev => [...prev, response.field!]);
      } else {
        // Reload to get the new field
        await loadFields();
      }
      
      resetForm();
      setShowCreateForm(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create field');
    } finally {
      setIsOperating(false);
    }
  };

  const updateField = async () => {
    if (!editingField) return;

    try {
      setIsOperating(true);
      const response = await floraFieldsAPI.updateStandaloneField(editingField.id, formData);
      
      if (response.field) {
        setFields(prev => prev.map(f => f.id === editingField.id ? response.field! : f));
      } else {
        // Reload to get updated data
        await loadFields();
      }
      
      resetForm();
      setEditingField(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update field');
    } finally {
      setIsOperating(false);
    }
  };

  const deleteField = async () => {
    if (!deleteConfirm.field) return;

    try {
      setIsOperating(true);
      await floraFieldsAPI.deleteStandaloneField(deleteConfirm.field.id);
      
      setFields(prev => prev.filter(f => f.id !== deleteConfirm.field!.id));
      setDeleteConfirm({ show: false, field: null });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete field');
    } finally {
      setIsOperating(false);
    }
  };

  const duplicateField = async (newName: string, newLabel: string) => {
    if (!duplicateConfirm.field) return;

    try {
      setIsOperating(true);
      const response = await floraFieldsAPI.duplicateStandaloneField(
        duplicateConfirm.field.id,
        newName,
        newLabel
      );
      
      if (response.field) {
        setFields(prev => [...prev, response.field!]);
      } else {
        await loadFields();
      }
      
      setDuplicateConfirm({ show: false, field: null });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate field');
    } finally {
      setIsOperating(false);
    }
  };

  // Helper functions
  const resetForm = () => {
    setFormData({
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
  };

  const startEdit = (field: StandaloneField) => {
    setFormData({
      field_name: field.field_name,
      field_type: field.field_type,
      field_label: field.field_label,
      field_description: field.field_description,
      field_default_value: field.field_default_value || '',
      validation_rules: field.validation_rules || {},
      display_options: field.display_options || {},
      is_required: field.is_required,
      is_searchable: field.is_searchable,
      sort_order: field.sort_order
    });
    setEditingField(field);
    setShowCreateForm(true);
  };

  const cancelEdit = () => {
    setEditingField(null);
    setShowCreateForm(false);
    resetForm();
  };

  const toggleUsageStats = async (fieldId: number) => {
    setShowUsageStats(prev => ({ ...prev, [fieldId]: !prev[fieldId] }));
  };

  // Toggle field expansion
  const toggleFieldExpansion = (fieldId: number) => {
    setExpandedFields(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldId)) {
        newSet.delete(fieldId);
      } else {
        newSet.add(fieldId);
      }
      return newSet;
    });
  };

  // Get active tab for a field (default to 'details')
  const getFieldActiveTab = (fieldId: number): string => {
    return fieldActiveTabs[fieldId] || 'details';
  };

  // Set active tab for a field
  const setFieldActiveTab = (fieldId: number, tab: string) => {
    setFieldActiveTabs(prev => ({ ...prev, [fieldId]: tab }));
  };

  // Filter fields
  const filteredFields = fields.filter(field => {
    const matchesSearch = !searchTerm || 
      field.field_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.field_label.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !selectedType || field.field_type === selectedType;
    
    return matchesSearch && matchesType;
  });

  useEffect(() => {
    loadFields();
    loadTemplates();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="text-neutral-400">Loading standalone fields...</div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-neutral-800/30 hover:bg-neutral-800/50 row-hover border-t border-white/[0.02] rounded h-full">
      <div className="space-y-6 h-full overflow-y-auto scrollable-container">
        {/* Hero Section */}
        <TabHero 
          title="Fields"
          description="Build once, use everywhere. Create field components that adapt to any blueprint, any product."
        />

        {/* Actions */}
        <div className="flex justify-center">
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-300"
          >
            Create Field
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-neutral-900/40 rounded p-2">
            <div className="flex justify-between items-center">
              <div className="text-red-400 text-xs">{error}</div>
              <button 
                onClick={() => setError(null)}
                className="text-neutral-500 hover:text-neutral-300 text-sm"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Operating Status */}
        {isOperating && (
          <div className="bg-neutral-900/40 rounded p-2">
            <div className="text-neutral-400 text-xs">Processing...</div>
          </div>
        )}

        {/* Global Import Section */}
        <div className="bg-neutral-900/40 rounded p-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-neutral-300">Field Templates</h3>
            <p className="text-xs text-neutral-500 mt-1">Import reusable field templates</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={loadFields}
              size="sm"
              variant="ghost"
              className="text-xs text-neutral-400 hover:text-neutral-300"
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search fields..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none text-sm smooth-hover"
          />
        </div>
        <div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-neutral-900/40 rounded-lg text-neutral-300 focus:bg-neutral-800/50 focus:outline-none text-sm border-b border-white/[0.02] smooth-hover"
          >
            <option value="">All Types</option>
            {FIELD_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              {editingField ? 'Edit Field' : 'Create Field'}
            </h3>
            <Button
              onClick={cancelEdit}
              variant="ghost"
              size="sm"
              className="text-neutral-400 hover:text-neutral-300"
            >
              ×
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Field Name */}
            <div>
              <label className="block text-neutral-400 text-sm mb-1">Field Name *</label>
              <input
                type="text"
                value={formData.field_name}
                onChange={(e) => setFormData(prev => ({ ...prev, field_name: e.target.value }))}
                className="w-full px-3 py-2 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none text-sm"
                placeholder="field_name"
                pattern="^[a-zA-Z_][a-zA-Z0-9_]*$"
                required
              />
              <p className="text-xs text-neutral-500 mt-1">
                Unique identifier (letters, numbers, underscores only)
              </p>
            </div>

            {/* Field Type */}
            <div>
              <label className="block text-neutral-400 text-sm mb-1">Field Type *</label>
              <select
                value={formData.field_type}
                onChange={(e) => setFormData(prev => ({ ...prev, field_type: e.target.value }))}
                className="w-full px-3 py-2 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none text-sm"
                required
              >
                {FIELD_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Field Label */}
            <div>
              <label className="block text-neutral-400 text-sm mb-1">Display Label *</label>
              <input
                type="text"
                value={formData.field_label}
                onChange={(e) => setFormData(prev => ({ ...prev, field_label: e.target.value }))}
                className="w-full px-3 py-2 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none text-sm"
                placeholder="Field Label"
                required
              />
            </div>

            {/* Default Value */}
            <div>
              <label className="block text-neutral-400 text-sm mb-1">Default Value</label>
              <input
                type="text"
                value={formData.field_default_value}
                onChange={(e) => setFormData(prev => ({ ...prev, field_default_value: e.target.value }))}
                className="w-full px-3 py-2 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none text-sm"
                placeholder="Default value"
              />
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-neutral-400 text-sm mb-1">Description</label>
            <textarea
              value={formData.field_description}
              onChange={(e) => setFormData(prev => ({ ...prev, field_description: e.target.value }))}
              className="w-full px-3 py-2 bg-neutral-900/40 rounded-lg border-b border-white/[0.02] text-neutral-300 focus:bg-neutral-800/50 focus:outline-none text-sm"
              rows={3}
              placeholder="Field description..."
            />
          </div>

          {/* Options */}
          <div className="flex gap-4 mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_required}
                onChange={(e) => setFormData(prev => ({ ...prev, is_required: e.target.checked }))}
                className="mr-2"
              />
              <span className="text-neutral-400 text-sm">Required</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_searchable}
                onChange={(e) => setFormData(prev => ({ ...prev, is_searchable: e.target.checked }))}
                className="mr-2"
              />
              <span className="text-neutral-400 text-sm">Searchable</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              onClick={cancelEdit}
              variant="ghost"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              onClick={editingField ? updateField : createField}
              size="sm"
              className="bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-300"
              disabled={!formData.field_name || !formData.field_label}
            >
              {editingField ? 'Update Field' : 'Create Field'}
            </Button>
          </div>
        </Card>
      )}

      {/* Individual Fields Cards - Exact BlueprintDesigner Structure */}
      <div className="space-y-2">
        {filteredFields.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-neutral-400 mb-4">
              {fields.length === 0 ? 'No standalone fields created yet' : 'No fields match your search'}
            </div>
            {fields.length === 0 && (
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-300"
              >
                Create Your First Field
              </Button>
            )}
          </div>
        ) : (
          filteredFields.map((field) => {
            const isExpanded = expandedFields.has(field.id);
            
            return (
              <div
                key={field.id}
                className="group transition-all cursor-pointer mb-2 border border-white/[0.04] rounded-lg bg-neutral-900/40 hover:bg-neutral-800/50"
              >
                {/* Main Field Row - Exact BlueprintDesigner styling */}
                <div className="flex items-center gap-3 px-4 py-2">
                  {/* Expand/Collapse Icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFieldExpansion(field.id);
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

                  {/* Field Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-neutral-300 text-sm truncate">{field.field_label}</div>
                    <div className="text-xs text-neutral-500 truncate mt-0.5">
                      {field.field_name} • {field.field_type}
                      {field.is_required && ' • Required'}
                      {field.is_searchable && ' • Searchable'}
                    </div>
                  </div>

                  {/* Usage Count */}
                  <div className="w-24 text-right">
                    <div className="text-xs text-neutral-500">
                      {field.usage_count !== undefined ? `${field.usage_count} uses` : 'Unused'}
                    </div>
                  </div>

                  {/* Actions - Exact BlueprintDesigner pattern */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Export field as JSON
                        const exportData = {
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
                        
                        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${field.field_name}-field.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                      size="sm"
                      variant="ghost"
                      className="px-2 py-1 text-xs bg-neutral-900/40 hover:bg-neutral-800/50 rounded-lg border-b border-white/[0.02] text-neutral-400 hover:text-neutral-300"
                      title="View/Export Field JSON"
                    >
                      JSON
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDuplicateConfirm({ show: true, field });
                      }}
                      size="sm"
                      variant="ghost"
                      className="px-2 py-1 text-xs bg-neutral-900/40 hover:bg-neutral-800/50 rounded-lg border-b border-white/[0.02] text-neutral-400 hover:text-neutral-300"
                      title="Duplicate Field"
                    >
                      Duplicate
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm({ show: true, field });
                      }}
                      size="sm"
                      variant="ghost"
                      className="px-2 py-1 text-xs bg-neutral-900/40 hover:bg-neutral-800/50 rounded-lg border-b border-white/[0.02] text-red-400 hover:text-red-300"
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Expanded Content - Exact BlueprintDesigner structure */}
                {isExpanded && (
                  <div className="mx-4 mb-2 rounded p-4 bg-neutral-800/30 hover:bg-neutral-800/50 row-hover border-t border-white/[0.02]">
                    
                    {/* Tab Navigation */}
                    <div className="flex items-center gap-2 border-b border-white/[0.1] bg-neutral-900/30 p-2">
                      <button 
                        onClick={() => setFieldActiveTab(field.id, 'details')}
                        className={`p-2 rounded-xl row-hover ease-out  flex items-center justify-center ${
                          getFieldActiveTab(field.id) === 'details'
                            ? 'text-neutral-400 bg-white/15 shadow-lg shadow-white/10 border border-white/30'
                            : 'text-neutral-500 hover:text-neutral-400 bg-transparent hover:bg-neutral-800/50 border border-transparent hover:border-white/10 hover:shadow-sm hover:shadow-black/10'
                        }`}
                        title="Field Details"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => setFieldActiveTab(field.id, 'settings')}
                        className={`p-2 rounded-xl row-hover ease-out  flex items-center justify-center ${
                          getFieldActiveTab(field.id) === 'settings'
                            ? 'text-neutral-400 bg-white/15 shadow-lg shadow-white/10 border border-white/30'
                            : 'text-neutral-500 hover:text-neutral-400 bg-transparent hover:bg-neutral-800/50 border border-transparent hover:border-white/10 hover:shadow-sm hover:shadow-black/10'
                        }`}
                        title="Field Settings"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => setFieldActiveTab(field.id, 'json')}
                        className={`p-2 rounded-xl row-hover ease-out  flex items-center justify-center ${
                          getFieldActiveTab(field.id) === 'json'
                            ? 'text-neutral-400 bg-white/15 shadow-lg shadow-white/10 border border-white/30'
                            : 'text-neutral-500 hover:text-neutral-400 bg-transparent hover:bg-neutral-800/50 border border-transparent hover:border-white/10 hover:shadow-sm hover:shadow-black/10'
                        }`}
                        title="JSON Editor"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                      </button>
                    </div>

                    {/* Tab Content */}
                    <div className="p-4">
                      {getFieldActiveTab(field.id) === 'details' && (
                        /* Field Details */
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center text-neutral-500 font-medium text-xs">
                              Field Details
                            </div>
                            <Button
                              onClick={() => startEdit(field)}
                              size="sm"
                              variant="ghost"
                              className="text-xs text-neutral-400 hover:text-neutral-300"
                            >
                              Edit Field
                            </Button>
                          </div>
                      
                          <div className="space-y-2">
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 text-xs">Name:</span>
                                <span className="text-neutral-500 text-xs font-mono">{field.field_name}</span>
                              </div>
                            </div>
                            
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 text-xs">Type:</span>
                                <span className="text-neutral-500 text-xs">{field.field_type}</span>
                              </div>
                            </div>
                            
                            {field.field_default_value && (
                              <div className="bg-neutral-900/40 rounded p-2">
                                <div className="text-neutral-600 text-xs font-medium mb-1">Default Value</div>
                                <div className="text-neutral-500 text-xs">{field.field_default_value}</div>
                              </div>
                            )}
                            
                            {field.field_description && (
                              <div className="bg-neutral-900/40 rounded p-2">
                                <div className="text-neutral-600 text-xs font-medium mb-1">Description</div>
                                <div className="text-neutral-500 text-xs leading-relaxed">{field.field_description}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {getFieldActiveTab(field.id) === 'settings' && (
                        /* Field Settings */
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center text-neutral-500 font-medium text-xs">
                              Field Settings
                            </div>
                          </div>
                      
                          <div className="space-y-2">
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 text-xs">Required:</span>
                                <span className="text-neutral-500 text-xs">
                                  {field.is_required ? 'Yes' : 'No'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 text-xs">Searchable:</span>
                                <span className="text-neutral-500 text-xs">
                                  {field.is_searchable ? 'Yes' : 'No'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 text-xs">Sort Order:</span>
                                <span className="text-neutral-500 text-xs">{field.sort_order}</span>
                              </div>
                            </div>
                            
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 text-xs">Field ID:</span>
                                <span className="text-neutral-500 text-xs font-mono">{field.id}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {getFieldActiveTab(field.id) === 'json' && (
                        /* JSON Editor */
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center text-neutral-500 font-medium text-xs">
                              JSON Editor
                            </div>
                            <Button
                              onClick={() => startEdit(field)}
                              size="sm"
                              variant="ghost"
                              className="text-xs text-neutral-400 hover:text-neutral-300"
                            >
                              Edit JSON
                            </Button>
                          </div>
                      
                          <div className="bg-neutral-900/40 rounded p-3">
                            <pre className="text-xs text-neutral-400 overflow-x-auto">
                              {JSON.stringify({
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
                              }, null, 2)}
                            </pre>
                          </div>
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

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.show && deleteConfirm.field && (
        <DeleteConfirmDialog
          isOpen={deleteConfirm.show}
          onClose={() => setDeleteConfirm({ show: false, field: null })}
          onConfirm={deleteField}
          title="Delete Standalone Field"
          message={`Are you sure you want to delete the "${deleteConfirm.field.field_label}" field? This action cannot be undone and may affect blueprints using this field.`}
          confirmText="Delete Field"
          isDestructive
        />
      )}

      {/* Duplicate Confirmation Dialog */}
      {duplicateConfirm.show && duplicateConfirm.field && (
        <DuplicateConfirmDialog
          isOpen={duplicateConfirm.show}
          onClose={() => setDuplicateConfirm({ show: false, field: null })}
          onConfirm={duplicateField}
          title="Duplicate Standalone Field"
          message={`Create a copy of the "${duplicateConfirm.field.field_label}" field with all its settings.`}
          originalName={duplicateConfirm.field.field_name}
          originalLabel={duplicateConfirm.field.field_label}
          confirmText="Duplicate Field"
        />
      )}
      </div>
    </div>
  );
}