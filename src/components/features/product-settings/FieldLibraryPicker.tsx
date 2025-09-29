import React, { useState, useEffect } from 'react';
import { Button, Modal } from '../../ui';
import { floraFieldsAPI, StandaloneField, FieldTemplate } from '../../../services/flora-fields-api';

interface FieldLibraryPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFields: (fields: StandaloneField[]) => void;
  onSelectTemplate: (template: FieldTemplate) => void;
  blueprintId?: number; // If provided, can add fields directly to blueprint
}

export function FieldLibraryPicker({
  isOpen,
  onClose,
  onSelectFields,
  onSelectTemplate,
  blueprintId
}: FieldLibraryPickerProps) {
  const [fields, setFields] = useState<StandaloneField[]>([]);
  const [templates, setTemplates] = useState<FieldTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'fields' | 'templates'>('fields');
  
  // Selection state
  const [selectedFields, setSelectedFields] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');

  // Load data
  const loadData = async () => {
    if (!isOpen) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [fieldsData, templatesData] = await Promise.all([
        floraFieldsAPI.getStandaloneFields(),
        floraFieldsAPI.getFieldTemplates()
      ]);
      
      setFields(fieldsData);
      setTemplates(templatesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load field library');
    } finally {
      setLoading(false);
    }
  };

  // Handle field selection
  const toggleFieldSelection = (fieldId: number) => {
    setSelectedFields(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldId)) {
        newSet.delete(fieldId);
      } else {
        newSet.add(fieldId);
      }
      return newSet;
    });
  };

  const selectAllFields = () => {
    const filteredFieldIds = filteredFields.map(f => f.id);
    setSelectedFields(new Set(filteredFieldIds));
  };

  const clearSelection = () => {
    setSelectedFields(new Set());
  };

  // Handle adding selected fields
  const handleAddFields = () => {
    const selectedFieldsArray = fields.filter(f => selectedFields.has(f.id));
    onSelectFields(selectedFieldsArray);
    handleClose();
  };

  // Handle template selection
  const handleSelectTemplate = (template: FieldTemplate) => {
    onSelectTemplate(template);
    handleClose();
  };

  const handleClose = () => {
    setSelectedFields(new Set());
    setSearchTerm('');
    setSelectedType('');
    setActiveTab('fields');
    onClose();
  };

  // Filter fields
  const filteredFields = fields.filter(field => {
    const matchesSearch = !searchTerm || 
      field.field_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.field_label.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !selectedType || field.field_type === selectedType;
    
    return matchesSearch && matchesType;
  });

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    return !searchTerm || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
  });

  useEffect(() => {
    loadData();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Field Library"
      size="large"
    >
      <div className="flex flex-col h-full space-y-4">
        {/* Tab Navigation */}
        <div className="flex border-b border-white/[0.04] flex-shrink-0">
          <button
            onClick={() => setActiveTab('fields')}
            className={`px-3 sm:px-4 py-2 text-sm font-medium border-b-2 smooth-hover ${
              activeTab === 'fields'
                ? 'border-white/[0.3] text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-300'
            }`}
          >
            <span className="hidden sm:inline">Individual Fields</span>
            <span className="sm:hidden">Fields</span>
            <span className="ml-1">({fields.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3 sm:px-4 py-2 text-sm font-medium border-b-2 smooth-hover ${
              activeTab === 'templates'
                ? 'border-white/[0.3] text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-300'
            }`}
          >
            <span className="hidden sm:inline">Field Templates</span>
            <span className="sm:hidden">Templates</span>
            <span className="ml-1">({templates.length})</span>
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="border border-red-500/30 rounded-lg p-3 bg-red-900/20 flex-shrink-0">
            <div className="text-red-400 text-sm">{error}</div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Loading State */}
          {loading ? (
            <div className="text-center py-8">
              <div className="text-neutral-400">Loading field library...</div>
            </div>
          ) : (
            <>
              {/* Search and Filters */}
              <div className="flex gap-2 sm:gap-3 mb-4 flex-shrink-0">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-2 py-1 bg-black border border-white/[0.04] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
                  />
                </div>
                {activeTab === 'fields' && (
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="px-2 py-1 bg-black border border-white/[0.04] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
                  >
                    <option value="">All Types</option>
                    <option value="text">Text</option>
                    <option value="textarea">Textarea</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="select">Select</option>
                    <option value="multiselect">Multi-Select</option>
                    <option value="date">Date</option>
                    <option value="datetime">Date & Time</option>
                    <option value="url">URL</option>
                    <option value="email">Email</option>
                  </select>
                )}
              </div>

              {activeTab === 'fields' ? (
                <>
                  {/* Field Selection Controls */}
                  {filteredFields.length > 0 && (
                    <div className="flex items-center justify-between mb-4 flex-shrink-0">
                      <div className="text-xs text-neutral-500">
                        {selectedFields.size} of {filteredFields.length} fields selected
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={selectAllFields}
                          size="sm"
                          variant="ghost"
                          className="text-xs"
                        >
                          Select All
                        </Button>
                        <Button
                          onClick={clearSelection}
                          size="sm"
                          variant="ghost"
                          className="text-xs"
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Fields List */}
                  <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
                    {filteredFields.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-neutral-400">
                          {fields.length === 0 ? 'No standalone fields available' : 'No fields match your search'}
                        </div>
                      </div>
                    ) : (
                      filteredFields.map((field) => (
                        <div
                          key={field.id}
                          onClick={() => toggleFieldSelection(field.id)}
                          className={`group transition-all cursor-pointer mb-2 border border-white/[0.04] rounded-lg ${
                            selectedFields.has(field.id)
                              ? 'bg-neutral-900/60 hover:bg-neutral-900/80 border-l-2 border-l-white/[0.3]'
                              : 'bg-neutral-900/40 hover:bg-neutral-900/60'
                          }`}
                        >
                          <div className="flex items-center gap-3 px-3 sm:px-4 py-3">
                            <div className="flex-1 min-w-0">
                              <div className="text-neutral-300 text-xs font-medium">{field.field_label}</div>
                              <div className="text-xs text-neutral-400 mt-0.5">
                                {field.field_name} • {field.field_type}
                                {field.is_required && ' • Required'}
                                {field.is_searchable && ' • Searchable'}
                              </div>
                              {field.field_description && (
                                <div className="text-xs text-neutral-500 mt-1">{field.field_description}</div>
                              )}
                            </div>
                            {field.usage_count !== undefined && (
                              <div className="text-xs text-neutral-400 flex-shrink-0">
                                Used {field.usage_count}x
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                /* Templates List */
                <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
                  {filteredTemplates.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-neutral-400">
                        {templates.length === 0 ? 'No field templates available' : 'No templates match your search'}
                      </div>
                    </div>
                  ) : (
                    filteredTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="group transition-all cursor-pointer mb-2 border border-white/[0.04] rounded-lg bg-neutral-900/40 hover:bg-neutral-900/60"
                        onClick={() => handleSelectTemplate(template)}
                      >
                        <div className="flex items-center justify-between px-3 sm:px-4 py-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-neutral-300 text-xs font-medium">{template.label}</div>
                            <div className="text-xs text-neutral-400 mt-0.5">
                              {template.name} • {template.fields.length} fields • {template.category}
                            </div>
                            {template.description && (
                              <div className="text-xs text-neutral-500 mt-1">{template.description}</div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs text-neutral-400 hover:text-neutral-300 flex-shrink-0"
                          >
                            <span className="hidden sm:inline">Use Template</span>
                            <span className="sm:hidden">Use</span>
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions - Fixed at bottom */}
        <div className="flex flex-col sm:flex-row sm:justify-between gap-3 pt-4 border-t border-white/[0.04] flex-shrink-0 bg-neutral-900/95 -mx-3 sm:-mx-4 px-3 sm:px-4 pb-1">
          <Button
            onClick={handleClose}
            variant="ghost"
            className="order-2 sm:order-1"
          >
            Cancel
          </Button>
          {activeTab === 'fields' && (
            <Button
              onClick={handleAddFields}
              disabled={selectedFields.size === 0}
              className="bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-300 order-1 sm:order-2"
            >
              <span className="hidden sm:inline">
                Add {selectedFields.size} Field{selectedFields.size !== 1 ? 's' : ''}
              </span>
              <span className="sm:hidden">
                Add ({selectedFields.size})
              </span>
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}