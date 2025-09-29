import React, { useEffect, useState } from 'react';
import { Button } from '../../ui/Button';
import { Select } from '../../ui/Select';
import { TabHero } from '../../ui/TabHero';

import { ImageUpload } from '../../ui/ImageUpload';
import { DeleteConfirmDialog } from '../../ui/DeleteConfirmDialog';
import { ToggleSwitch } from '../../ui/ToggleSwitch';
import { JsonPopout } from '../../ui/JsonPopout';
import { BlueprintAssignmentDisplay } from './BlueprintAssignmentDisplay';
import { useCategoriesManager, CategoryFormData } from '../../../hooks/useCategoriesManager';
import { CategoryFilterSettings } from '../../../hooks/useProductSettings';
import { CategoryCreateRequest, WooCategory, categoriesService } from '../../../services/categories-service';

interface CategoryManagementProps {
  categoryFilterSettings: CategoryFilterSettings;
  onCategoryFilterSettingsChange: (updates: Partial<CategoryFilterSettings>) => void;
}

export function CategoryManagement({
  categoryFilterSettings,
  onCategoryFilterSettingsChange
}: CategoryManagementProps) {
  const {
    categories,
    loading,
    error,
    selectedCategories,
    searchTerm,
    formData,
    editingCategory,
    isSubmitting,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    bulkDeleteCategories,
    selectCategory,
    selectAllCategories,
    startEditCategory,
    resetForm,
    updateFormData,
    setSearchTerm,
    setError,
  } = useCategoriesManager();

  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    type: 'single' | 'bulk';
    target?: WooCategory;
    count?: number;
  }>({ show: false, type: 'single' });
  const [showBulkUnitAssign, setShowBulkUnitAssign] = useState(false);
  const [bulkUnitData, setBulkUnitData] = useState<{
    unit: string;
    applyToProducts: boolean;
  }>({ unit: 'units', applyToProducts: false });
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [jsonEditorMode, setJsonEditorMode] = useState<'import' | 'export'>('import');
  const [jsonData, setJsonData] = useState<any>([]);
  const [jsonLoading, setJsonLoading] = useState(false);
  const [jsonSuccess, setJsonSuccess] = useState<string>('');
  const [jsonError, setJsonError] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  useEffect(() => {
    let isMounted = true;
    
    if (categories.length === 0) {
      fetchCategories().catch(err => {
        if (isMounted) {
        }
      });
    }
    
    return () => {
      isMounted = false;
    };
  }, []); // Load categories on mount

  // Separate effect for search term changes
  useEffect(() => {
    let isMounted = true;
    
    if (searchTerm !== '') {
      fetchCategories(true).catch(err => {
        if (isMounted) {
        }
      });
    }
    
    return () => {
      isMounted = false;
    };
  }, [searchTerm]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    const categoryData: CategoryCreateRequest = {
      name: formData.name,
      slug: formData.slug || undefined,
      parent: formData.parent || undefined,
      description: formData.description || undefined,
      display: formData.display,
      image: formData.image ? { id: formData.image.id } : undefined,
      unit: formData.unit || 'units',
    };


    const result = editingCategory
      ? await updateCategory(editingCategory.id, categoryData)
      : await createCategory(categoryData);


    if (result.success) {
      setShowAddForm(false);
      resetForm();
    } else {
    }
  };

  const handleDeleteCategory = (category: WooCategory) => {
    setDeleteConfirm({
      show: true,
      type: 'single',
      target: category
    });
  };

  const handleBulkDelete = () => {
    setDeleteConfirm({
      show: true,
      type: 'bulk',
      count: selectedCategories.size
    });
  };

  const confirmDelete = async () => {
    
    try {
      if (deleteConfirm.type === 'single' && deleteConfirm.target) {
        const isSystemCat = deleteConfirm.target.slug === 'uncategorized' || 
                         deleteConfirm.target.name.toLowerCase().includes('uncategorized') || 
                         deleteConfirm.target.id === 15;
        if (isSystemCat) {
          setError('Cannot delete system categories like "Uncategorized"');
          return;
        }
        const result = await deleteCategory(deleteConfirm.target.id, true);
      } else if (deleteConfirm.type === 'bulk') {
        // Filter out system categories
        const validCategoryIds = Array.from(selectedCategories).filter(id => {
          const category = categories.find(cat => cat.id === id);
          if (!category) return true;
          return !(category.slug === 'uncategorized' || 
                   category.name.toLowerCase().includes('uncategorized') || 
                   category.id === 15);
        });
        
        if (validCategoryIds.length === 0) {
          setError('Cannot delete system categories. Please select regular categories.');
          return;
        }
        
        if (validCategoryIds.length < selectedCategories.size) {
        }
        
        const result = await bulkDeleteCategories(validCategoryIds);
      }
    } catch (error) {
    }
    
    setDeleteConfirm({ show: false, type: 'single' });
  };

  const handleBulkAssignUnit = async () => {
    if (!bulkUnitData.unit || selectedCategories.size === 0) {
      return;
    }

    try {

      // Update each category individually using WooCommerce API
      const updatePromises = Array.from(selectedCategories).map(async (categoryId) => {
        const response = await fetch(`/api/flora/categories/${categoryId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            unit: bulkUnitData.unit,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          return { categoryId, success: false, error: errorText };
        }

        const result = await response.json();
        return { categoryId, success: true, data: result };
      });

      const results = await Promise.all(updatePromises);
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);


      if (successful.length > 0) {
        
        // Refresh categories to show updated units
        await fetchCategories(true);
        selectAllCategories(); // Clear all selections
        setShowBulkUnitAssign(false);
        setBulkUnitData({ unit: 'units', applyToProducts: false });

        if (failed.length > 0) {
        }
      } else {
      }
    } catch (error) {
    }
  };

  // JSON Editor Functions
  const handleJsonExport = async () => {
    try {
      setJsonLoading(true);
      setJsonError('');
      setJsonSuccess('');
      
      const result = await categoriesService.exportCategories();
      
      if (result.success) {
        // Remove read-only fields and format for import
        const exportData = result.data.map(cat => ({
          name: cat.name,
          slug: cat.slug,
          parent: cat.parent,
          description: cat.description,
          display: cat.display,
          image: cat.image,
          menu_order: cat.menu_order,
          unit: cat.unit
        }));
        
        setJsonData(exportData);
        setJsonEditorMode('export');
        setShowJsonEditor(true);
        setJsonSuccess(`Exported ${result.data.length} categories`);
      }
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setJsonLoading(false);
    }
  };

  const handleJsonImport = () => {
    setJsonData([
      {
        name: 'New Category',
        slug: 'new-category',
        parent: 0,
        description: 'Category description',
        display: 'default',
        image: null,
        menu_order: 0,
        unit: 'units'
      }
    ]);
    setJsonEditorMode('import');
    setShowJsonEditor(true);
    setJsonError('');
    setJsonSuccess('');
  };

  const handleJsonSave = async (data: any) => {
    if (jsonEditorMode === 'export') {
      // For export mode, just copy to clipboard
      return;
    }

    try {
      setJsonLoading(true);
      setJsonError('');
      setJsonSuccess('');
      
      if (!Array.isArray(data)) {
        throw new Error('JSON data must be an array of categories');
      }

      const result = await categoriesService.bulkCreateCategories(data);
      
      if (result.success) {
        setJsonSuccess(`Successfully created ${result.data.created} categories!`);
        if (result.data.errors.length > 0) {
          setJsonError(`Some categories failed: ${result.data.errors.join(', ')}`);
        }
        
        // Refresh categories list
        await fetchCategories(true);
        
        // Auto-close after 2 seconds on success
        setTimeout(() => {
          setShowJsonEditor(false);
          setJsonSuccess('');
        }, 2000);
      }
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setJsonLoading(false);
    }
  };

  const toggleCategoryExpansion = (categoryId: number) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const parentOptions = [
    { value: '0', label: 'None' },
    ...categories
      .filter(cat => cat.parent === 0)
      .map(cat => ({ value: cat.id.toString(), label: cat.name }))
  ];

  return (
    <>
      <div className="p-4 bg-neutral-800/30 hover:bg-neutral-800/50 row-hover border-t border-white/[0.02] rounded h-full">
        <div className="space-y-6 h-full overflow-y-auto scrollable-container">
          {/* Hero Section */}
          <TabHero 
            title="Categories"
            description="Organize your products with precision. Create hierarchies that make sense, assign units that matter."
          />

          <div className="space-y-2">
          <div className="bg-neutral-900/40 rounded p-2">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-neutral-500 text-xs">Enable Category Filtering:</div>
                <div className="text-neutral-500 text-xs">Allow users to filter products by category</div>
              </div>
              <ToggleSwitch
                checked={categoryFilterSettings.enableCategoryFiltering}
                onChange={(checked: boolean) => onCategoryFilterSettingsChange({ enableCategoryFiltering: checked })}
              />
            </div>
          </div>

          <div className="bg-neutral-900/40 rounded p-2">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-neutral-500 text-xs">Show Empty Categories:</div>
                <div className="text-neutral-500 text-xs">Display categories with no products</div>
              </div>
              <ToggleSwitch
                checked={categoryFilterSettings.showEmptyCategories}
                onChange={(checked: boolean) => onCategoryFilterSettingsChange({ showEmptyCategories: checked })}
              />
            </div>
          </div>

          {/* Categories Management - Always Expanded */}
          <div className="mt-2">
            <CategoryManagementPanel
              categories={categories}
              loading={loading}
              error={error}
              selectedCategories={selectedCategories}
              searchTerm={searchTerm}
              parentOptions={parentOptions}
              onSelectCategory={selectCategory}
              onSelectAll={selectAllCategories}
              onEditCategory={(category) => {
                startEditCategory(category);
              }}
              onDeleteCategory={handleDeleteCategory}
              onBulkDelete={handleBulkDelete}
              onBulkAssignUnit={() => setShowBulkUnitAssign(!showBulkUnitAssign)}
              showBulkUnitAssign={showBulkUnitAssign}
              bulkUnitData={bulkUnitData}
              setBulkUnitData={setBulkUnitData}
              setShowBulkUnitAssign={setShowBulkUnitAssign}
              handleBulkAssignUnit={handleBulkAssignUnit}
              onRefresh={() => fetchCategories(true)}
              onSearchChange={setSearchTerm}
              onJsonExport={handleJsonExport}
              onJsonImport={handleJsonImport}
              jsonLoading={jsonLoading}
              expandedCategories={expandedCategories}
              onToggleExpand={toggleCategoryExpansion}
              onUpdateCategory={updateCategory}
            />
          </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.show && (
        <DeleteConfirmDialog
          isOpen={deleteConfirm.show}
          onClose={() => setDeleteConfirm({ show: false, type: 'single' })}
          onConfirm={confirmDelete}
          title={deleteConfirm.type === 'single' ? 'Delete Category' : 'Delete Categories'}
          message={
            deleteConfirm.type === 'single' && deleteConfirm.target
              ? `Are you sure you want to delete "${deleteConfirm.target.name}"? Products in this category will be moved to "Uncategorized".`
              : `Are you sure you want to delete ${deleteConfirm.count} categories? Products in these categories will be moved to "Uncategorized".`
          }
          confirmText="Delete"
          isDestructive
        />
      )}

      {/* JSON Editor Modal */}
      <JsonPopout
        isOpen={showJsonEditor}
        onClose={() => {
          setShowJsonEditor(false);
          setJsonError('');
          setJsonSuccess('');
        }}
        value={jsonData}
        onChange={handleJsonSave}
        title={jsonEditorMode === 'export' ? 'Export Categories JSON' : 'Import Categories JSON'}
        placeholder={jsonEditorMode === 'export' ? 'Categories exported...' : 'Enter categories JSON...'}
        size="xlarge"
        loading={jsonLoading}
        successMessage={jsonSuccess}
        viewMode={jsonEditorMode === 'export'}
        style="dashboard"
      />

      {/* JSON Error Display */}
      {jsonError && (
        <div className="fixed bottom-4 right-4 max-w-md p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm z-50">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {jsonError}
          </div>
        </div>
      )}
    </>
  );
}

// Category Management Panel Component
interface CategoryManagementPanelProps {
  categories: WooCategory[];
  loading: boolean;
  error: string | null;
  selectedCategories: Set<number>;
  searchTerm: string;

  parentOptions: { value: string; label: string }[];

  onSelectCategory: (id: number) => void;
  onSelectAll: () => void;
  onEditCategory: (category: WooCategory) => void;
  onDeleteCategory: (category: WooCategory) => void;
  onBulkDelete: () => void;
  onBulkAssignUnit: () => void;
  showBulkUnitAssign: boolean;
  bulkUnitData: { unit: string; applyToProducts: boolean };
  setBulkUnitData: (data: { unit: string; applyToProducts: boolean } | ((prev: { unit: string; applyToProducts: boolean }) => { unit: string; applyToProducts: boolean })) => void;
  setShowBulkUnitAssign: (show: boolean) => void;
  handleBulkAssignUnit: () => void;
  onRefresh: () => void;
  onSearchChange: (term: string) => void;

  onJsonExport: () => void;
  onJsonImport: () => void;
  jsonLoading: boolean;
  expandedCategories: Set<number>;
  onToggleExpand: (id: number) => void;
  onUpdateCategory: (id: number, data: any) => Promise<any>;
}

function CategoryManagementPanel({
  categories,
  loading,
  error,
  selectedCategories,
  searchTerm,
  parentOptions,
  onSelectCategory,
  onSelectAll,
  onEditCategory,
  onDeleteCategory,
  onBulkDelete,
  onBulkAssignUnit,
  showBulkUnitAssign,
  bulkUnitData,
  setBulkUnitData,
  setShowBulkUnitAssign,
  handleBulkAssignUnit,
  onRefresh,
  onSearchChange,
  onJsonExport,
  onJsonImport,
  jsonLoading,
  expandedCategories,
  onToggleExpand,
  onUpdateCategory
}: CategoryManagementPanelProps) {
  return (
            <div className="mt-6 bg-neutral-900/40 rounded p-4">
      {/* Add/Edit Form - Now handled inline in expandable cards */}

      {/* Controls */}
      <CategoryControls
        selectedCount={selectedCategories.size}
        totalCount={categories.length}
        searchTerm={searchTerm}
        loading={loading}

        onSelectAll={onSelectAll}
        onAddNew={() => {
          resetForm();
          setShowAddForm(true);
        }}
        onBulkDelete={onBulkDelete}
        onBulkAssignUnit={onBulkAssignUnit}
        onRefresh={onRefresh}
        onSearchChange={onSearchChange}
        onJsonExport={onJsonExport}
        onJsonImport={onJsonImport}
        jsonLoading={jsonLoading}
      />

      {/* Add New Category Form */}
      {showAddForm && (
        <CategoryCreateForm
          formData={formData}
          parentOptions={parentOptions}
          isSubmitting={isSubmitting}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowAddForm(false);
            resetForm();
          }}
          onUpdateFormData={updateFormData}
        />
      )}

      {/* Bulk Unit Assignment - Appears after controls */}
      {selectedCategories.size > 0 && showBulkUnitAssign && (
        <div className="mb-4 bg-neutral-900/40 rounded p-4">
          <h3 className="text-sm font-medium text-neutral-300 mb-3">
            Assign Unit to {selectedCategories.size} Selected Categories
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-400 text-xs mb-2">Unit of Measurement</label>
              <Select
                value={bulkUnitData.unit}
                onChange={(e) => setBulkUnitData(prev => ({ ...prev, unit: e.target.value }))}
                options={[
                  { value: 'units', label: 'Units' },
                  { value: 'grams', label: 'Grams (g)' },
                  { value: 'ounces', label: 'Ounces (oz)' },
                  { value: 'pounds', label: 'Pounds (lb)' },
                  { value: 'kilograms', label: 'Kilograms (kg)' },
                  { value: 'eighths', label: 'Eighths (1/8 oz)' },
                  { value: 'quarters', label: 'Quarters (1/4 oz)' },
                  { value: 'halves', label: 'Halves (1/2 oz)' },
                  { value: 'pieces', label: 'Pieces' },
                  { value: 'milligrams', label: 'Milligrams (mg)' },
                  { value: 'milliliters', label: 'Milliliters (mL)' },
                  { value: 'liters', label: 'Liters (L)' },
                ]}
              />
            </div>

            <div className="flex items-end">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="bulkApplyToProducts"
                  checked={bulkUnitData.applyToProducts}
                  onChange={(e) => setBulkUnitData(prev => ({ ...prev, applyToProducts: e.target.checked }))}
                  className="rounded border-white/[0.04] bg-neutral-800 text-blue-500 focus:ring-blue-500"
                />
                <label htmlFor="bulkApplyToProducts" className="text-neutral-300 text-xs">
                  Apply to all products in these categories
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant="primary"
              size="sm"
              onClick={handleBulkAssignUnit}

            >
              Assign Unit
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowBulkUnitAssign(false);
                setBulkUnitData({ unit: 'units', applyToProducts: false });
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/20 rounded text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Categories List */}
      <CategoryList
        categories={categories}
        selectedCategories={selectedCategories}
        loading={loading}
        expandedCategories={expandedCategories}
        parentOptions={parentOptions}
        onSelectCategory={onSelectCategory}
        onEditCategory={onEditCategory}
        onDeleteCategory={onDeleteCategory}
        onToggleExpand={onToggleExpand}
        onUpdateCategory={onUpdateCategory}
      />

      {/* Footer Note */}
      <div className="mt-3 p-2 bg-neutral-900/40 border border-white/[0.04] rounded text-neutral-400 text-xs">
        <strong>Note:</strong> Deleting a category does not delete the products in that category. Products are moved to "Uncategorized".
      </div>
    </div>
  );
}



// Category Controls Component
interface CategoryControlsProps {
  selectedCount: number;
  totalCount: number;
  searchTerm: string;
  loading: boolean;
  onSelectAll: () => void;
  onAddNew: () => void;
  onBulkDelete: () => void;
  onBulkAssignUnit: () => void;
  onRefresh: () => void;
  onSearchChange: (term: string) => void;
  onJsonExport: () => void;
  onJsonImport: () => void;
  jsonLoading: boolean;
}

function CategoryControls({
  selectedCount,
  totalCount,
  searchTerm,
  loading,
  onSelectAll,
  onAddNew,
  onBulkDelete,
  onBulkAssignUnit,
  onRefresh,
  onSearchChange,
  onJsonExport,
  onJsonImport,
  jsonLoading
}: CategoryControlsProps) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        {selectedCount > 0 && (
          <span className="text-xs text-neutral-400 px-2">{selectedCount} selected</span>
        )}

        <button
          onClick={onSelectAll}
          className={`p-1.5 rounded smooth-hover ${
            selectedCount === totalCount
              ? 'bg-blue-500/20 text-blue-400' 
              : 'bg-neutral-800/50 text-neutral-400 hover:text-white hover:bg-neutral-700/50'
          }`}
          title={selectedCount === totalCount ? "Deselect All" : "Select All"}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        <button
          onClick={() => {
            onAddNew();
          }}

          className="p-1.5 rounded bg-neutral-800/50 text-neutral-400 hover:text-white hover:bg-neutral-700/50 smooth-hover disabled:opacity-50"
          title="Add New Category"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>

        {selectedCount > 0 && (
          <>
            <button
              onClick={onBulkAssignUnit}

              className="p-1.5 rounded bg-neutral-800/50 text-neutral-400 hover:text-white hover:bg-neutral-700/50 smooth-hover disabled:opacity-50"
              title="Assign Unit to Selected Categories"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </button>
            <button
              onClick={onBulkDelete}

              className="p-1.5 rounded bg-neutral-800/50 text-neutral-400 hover:text-white hover:bg-neutral-700/50 smooth-hover disabled:opacity-50"
              title="Delete Selected Categories"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </>
        )}

        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-1.5 rounded bg-neutral-800/50 text-neutral-400 hover:text-white hover:bg-neutral-700/50 smooth-hover disabled:opacity-50"
          title="Refresh Categories"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <div className="w-px h-6 bg-white/[0.08]" />

        <button
          onClick={onJsonExport}
          disabled={jsonLoading || loading}
          className="p-1.5 rounded bg-neutral-800/50 text-neutral-400 hover:text-white hover:bg-neutral-700/50 smooth-hover disabled:opacity-50"
          title="Export Categories as JSON"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>

        <button
          onClick={onJsonImport}
          disabled={jsonLoading || loading}
          className="p-1.5 rounded bg-neutral-800/50 text-neutral-400 hover:text-white hover:bg-neutral-700/50 smooth-hover disabled:opacity-50"
          title="Import Categories from JSON"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 4v6m0 0l-3-3m3 3l3-3M7 20h10a2 2 0 002-2V8a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search categories..."
          className="px-2 py-1 bg-neutral-900/40 rounded-lg border-b border-white/[0.02] text-neutral-300 focus:bg-neutral-800/50 focus:outline-none text-xs"
        />
      </div>
    </div>
  );
}

// Category List Component
interface CategoryListProps {
  categories: WooCategory[];
  selectedCategories: Set<number>;
  loading: boolean;
  expandedCategories: Set<number>;
  parentOptions: { value: string; label: string }[];
  onSelectCategory: (id: number) => void;
  onEditCategory: (category: WooCategory) => void;
  onDeleteCategory: (category: WooCategory) => void;
  onToggleExpand: (id: number) => void;
  onUpdateCategory: (id: number, data: any) => Promise<any>;
}

function CategoryList({
  categories,
  selectedCategories,
  loading,
  expandedCategories,
  parentOptions,
  onSelectCategory,
  onEditCategory,
  onDeleteCategory,
  onToggleExpand,
  onUpdateCategory
}: CategoryListProps) {
  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="text-neutral-400 text-sm">Loading categories...</div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-neutral-400 text-sm">No categories found</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {categories.map((category) => (
        <CategoryItem
          key={category.id}
          category={category}
          isSelected={selectedCategories.has(category.id)}
          isExpanded={expandedCategories.has(category.id)}
          parentOptions={parentOptions}
          onSelect={() => onSelectCategory(category.id)}
          onEdit={() => onEditCategory(category)}
          onDelete={() => onDeleteCategory(category)}
          onToggleExpand={() => onToggleExpand(category.id)}
          onUpdateCategory={onUpdateCategory}
        />
      ))}
    </div>
  );
}

// Category Item Component
interface CategoryItemProps {
  category: WooCategory;
  isSelected: boolean;
  isExpanded: boolean;
  parentOptions: { value: string; label: string }[];
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleExpand: () => void;
  onUpdateCategory: (id: number, data: any) => Promise<any>;
}

function BlueprintIndicator({ categoryId }: { categoryId: number }) {
  const [hasBlueprints, setHasBlueprints] = useState<boolean | null>(null);

  useEffect(() => {
    const checkBlueprints = async () => {
      try {
        const { floraFieldsAPI } = await import('../../../services/flora-fields-api');
        
        let assignments: any[] = [];
        
        try {
          // Try category-specific endpoint first
          assignments = await floraFieldsAPI.getCategoryBlueprintAssignments(categoryId);
        } catch (apiError) {
          
          // Fallback: Get all assignments and filter client-side
          try {
            const allAssignments = await floraFieldsAPI.getBlueprintAssignments();
            assignments = allAssignments.filter((assignment: any) => 
              assignment.entity_type === 'category' && 
              assignment.category_id === categoryId
            );
          } catch (fallbackError) {
            setHasBlueprints(false);
            return;
          }
        }
        
        // Filter to ensure we only count assignments for this specific category
        const filteredAssignments = assignments.filter((assignment: any) => 
          assignment.entity_type === 'category' && 
          assignment.category_id === categoryId
        );
        
        setHasBlueprints(filteredAssignments.length > 0);
      } catch (error) {
        setHasBlueprints(false);
      }
    };

    checkBlueprints();
  }, [categoryId]);

  if (hasBlueprints === null) return null;

  if (!hasBlueprints) return null;

  return (
    <div className="flex items-center gap-1 text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
      Blueprint
    </div>
  );
}

const CategoryItem = React.memo(function CategoryItem({
  category,
  isSelected,
  isExpanded,
  parentOptions,
  onSelect,
  onEdit,
  onDelete,
  onToggleExpand,
  onUpdateCategory
}: CategoryItemProps) {
  const [editData, setEditData] = useState({
    name: category.name,
    slug: category.slug,
    parent: category.parent,
    description: category.description,
    display: category.display,
    unit: category.unit || 'units',
    menu_order: category.menu_order,
    image: category.image
  });
  const [isSaving, setIsSaving] = useState(false);

  // Check for system categories by slug or common IDs
  const isSystemCategory = category.slug === 'uncategorized' || 
                          category.name.toLowerCase().includes('uncategorized') || 
                          category.id === 15;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateCategory(category.id, editData);
    } catch (error) {
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      name: category.name,
      slug: category.slug,
      parent: category.parent,
      description: category.description,
      display: category.display,
      unit: category.unit || 'units',
      menu_order: category.menu_order,
      image: category.image
    });
    onToggleExpand();
  };

  return (
    <div 
      className={`group transition-all cursor-pointer mb-2 rounded-lg border-b border-white/[0.02] ${
        isSelected 
          ? 'bg-neutral-800/50 hover:bg-neutral-800/70 border-l-2 border-l-white/[0.3]' 
          : 'bg-neutral-900/40 hover:bg-neutral-800/50'
      } ${isSystemCategory ? 'opacity-75' : ''}`}
      onClick={isSystemCategory ? undefined : onSelect}
    >
      {/* Main Row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Expand/Collapse Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-neutral-500 hover:text-neutral-400 smooth-hover"
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

        <div className="w-8 h-8 bg-neutral-800 rounded border border-white/[0.04] flex items-center justify-center flex-shrink-0">
          {category.image ? (
            <img 
              src={category.image.src} 
              alt={category.image.alt} 
              className="w-full h-full object-cover rounded"
            />
          ) : (
            <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-neutral-300 text-sm font-medium">
              {category.parent > 0 && <span className="text-neutral-500">— </span>}
              {category.name}
            </div>
            <div className="text-xs text-neutral-500 bg-neutral-800/50 px-2 py-0.5 rounded">
              {category.count} products
            </div>
            <BlueprintIndicator categoryId={category.id} />
          </div>
          <div className="text-xs text-neutral-400 mt-1">
            <span className="text-neutral-500">Slug:</span> {category.slug}
            {category.unit && category.unit !== 'units' && (
              <span className="ml-3">
                <span className="text-neutral-500">Unit:</span> {category.unit}
              </span>
            )}
            {category.description && (
              <span className="ml-3">
                <span className="text-neutral-500">•</span> {category.description}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1.5 text-neutral-400 hover:text-blue-400 hover:bg-blue-500/10 rounded smooth-hover"
            title="Edit category"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isSystemCategory) return;
              onDelete();
            }}
            disabled={isSystemCategory}
            className={`p-1.5 rounded smooth-hover ${
              isSystemCategory 
                ? 'text-neutral-500 cursor-not-allowed opacity-50' 
                : 'text-neutral-400 hover:text-red-400 hover:bg-red-500/10'
            }`}
            title={isSystemCategory ? "Cannot delete system category" : "Delete category"}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Edit Section */}
      {isExpanded && (
        <div className="border-t border-white/[0.04] px-4 py-4 bg-neutral-800/30">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Column 1: Basic Details */}
            <div className="space-y-3">
              <div className="text-neutral-500 font-medium text-xs mb-3">Basic Details</div>
              
              <div className="bg-neutral-900/40 rounded p-2">
                <label className="block text-neutral-500 text-xs mb-1">Name *</label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none text-xs"
                  placeholder="Category name"
                />
              </div>

              <div className="bg-neutral-900/40 rounded p-2">
                <label className="block text-neutral-500 text-xs mb-1">Slug</label>
                <input
                  type="text"
                  value={editData.slug}
                  onChange={(e) => setEditData(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3 py-2 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none text-xs"
                  placeholder="category-slug"
                />
              </div>

              <div className="bg-neutral-900/40 rounded p-2">
                <label className="block text-neutral-500 text-xs mb-1">Parent</label>
                <select
                  value={editData.parent.toString()}
                  onChange={(e) => setEditData(prev => ({ ...prev, parent: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 focus:border-neutral-700 focus:outline-none text-xs"
                >
                  {parentOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-neutral-900/40 rounded p-2">
                <label className="block text-neutral-500 text-xs mb-1">Category Image</label>
                <ImageUpload
                  currentImage={editData.image?.src}
                  onImageUploaded={(imageUrl: string, mediaId: number) => {
                    setEditData(prev => ({ 
                      ...prev, 
                      image: { 
                        id: mediaId, 
                        src: imageUrl, 
                        name: `category-${mediaId}`, 
                        alt: editData.name || 'Category image' 
                      } 
                    }));
                  }}
                  onRemove={() => setEditData(prev => ({ ...prev, image: null }))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Column 2: Display Settings */}
            <div className="space-y-3">
              <div className="text-neutral-500 font-medium text-xs mb-3">Display Settings</div>

              <div className="bg-neutral-900/40 rounded p-2">
                <label className="block text-neutral-500 text-xs mb-1">Display Type</label>
                <select
                  value={editData.display}
                  onChange={(e) => setEditData(prev => ({ ...prev, display: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 focus:border-neutral-700 focus:outline-none text-xs"
                >
                  <option value="default">Default</option>
                  <option value="products">Products</option>
                  <option value="subcategories">Subcategories</option>
                  <option value="both">Both</option>
                </select>
              </div>

              <div className="bg-neutral-900/40 rounded p-2">
                <label className="block text-neutral-500 text-xs mb-1">Unit of Measurement</label>
                <select
                  value={editData.unit}
                  onChange={(e) => setEditData(prev => ({ ...prev, unit: e.target.value }))}
                  className="w-full px-3 py-2 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 focus:border-neutral-700 focus:outline-none text-xs"
                >
                  <option value="units">Units</option>
                  <option value="grams">Grams (g)</option>
                  <option value="ounces">Ounces (oz)</option>
                  <option value="pounds">Pounds (lb)</option>
                  <option value="kilograms">Kilograms (kg)</option>
                  <option value="eighths">Eighths (1/8 oz)</option>
                  <option value="quarters">Quarters (1/4 oz)</option>
                  <option value="halves">Halves (1/2 oz)</option>
                  <option value="pieces">Pieces</option>
                  <option value="milligrams">Milligrams (mg)</option>
                  <option value="milliliters">Milliliters (mL)</option>
                  <option value="liters">Liters (L)</option>
                </select>
              </div>

              <div className="bg-neutral-900/40 rounded p-2">
                <label className="block text-neutral-500 text-xs mb-1">Menu Order</label>
                <input
                  type="number"
                  value={editData.menu_order}
                  onChange={(e) => setEditData(prev => ({ ...prev, menu_order: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none text-xs"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Column 3: Description */}
            <div className="space-y-3">
              <div className="text-neutral-500 font-medium text-xs mb-3">Description</div>
              
              <div className="bg-neutral-900/40 rounded p-2">
                <label className="block text-neutral-500 text-xs mb-1">Description</label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none text-xs resize-vertical"
                  rows={4}
                  placeholder="Category description..."
                />
              </div>
            </div>
          </div>

          {/* Blueprint Assignments Section */}
          <div className="mt-4">
            <BlueprintAssignmentDisplay 
              categoryId={category.id} 
              className="w-full"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4 pt-3 border-t border-white/[0.04]">
            <Button
              onClick={handleSave}
              variant="primary"
              size="sm"
              disabled={isSaving || !editData.name.trim()}
              className="text-xs"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              onClick={handleCancel}
              variant="secondary"
              size="sm"
              disabled={isSaving}
              className="text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

// Category Create Form Component
interface CategoryCreateFormProps {
  formData: CategoryFormData;
  parentOptions: { value: string; label: string }[];
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onUpdateFormData: (updates: Partial<CategoryFormData>) => void;
}

function CategoryCreateForm({
  formData,
  parentOptions,
  isSubmitting,
  onSubmit,
  onCancel,
  onUpdateFormData
}: CategoryCreateFormProps) {
  return (
    <div className="mb-4 bg-neutral-800/30 border border-white/[0.04] rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-neutral-300">Create New Category</h3>
        <button
          onClick={onCancel}
          className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-700/50 rounded smooth-hover"
          title="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Column 1: Basic Details */}
          <div className="space-y-3">
            <div className="text-neutral-500 font-medium text-xs mb-3">Basic Details</div>
            
            <div>
              <label className="block text-neutral-400 text-xs mb-2">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => onUpdateFormData({ name: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-900/40 border border-neutral-800/40 rounded text-neutral-300 placeholder-neutral-500 focus:border-neutral-700 focus:outline-none text-sm"
                placeholder="Category name"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-neutral-400 text-xs mb-2">Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => onUpdateFormData({ slug: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-900/40 border border-neutral-800/40 rounded text-neutral-300 placeholder-neutral-500 focus:border-neutral-700 focus:outline-none text-sm"
                placeholder="category-slug (auto-generated if empty)"
              />
            </div>

            <div>
              <label className="block text-neutral-400 text-xs mb-2">Parent Category</label>
              <select
                value={formData.parent.toString()}
                onChange={(e) => onUpdateFormData({ parent: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-neutral-900/40 border border-neutral-800/40 rounded text-neutral-300 focus:border-neutral-700 focus:outline-none text-sm"
              >
                {parentOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Column 2: Display Settings */}
          <div className="space-y-3">
            <div className="text-neutral-500 font-medium text-xs mb-3">Display Settings</div>

            <div>
              <label className="block text-neutral-400 text-xs mb-2">Display Type</label>
              <select
                value={formData.display}
                onChange={(e) => onUpdateFormData({ display: e.target.value as any })}
                className="w-full px-3 py-2 bg-neutral-900/40 border border-neutral-800/40 rounded text-neutral-300 focus:border-neutral-700 focus:outline-none text-sm"
              >
                <option value="default">Default</option>
                <option value="products">Products</option>
                <option value="subcategories">Subcategories</option>
                <option value="both">Both</option>
              </select>
            </div>

            <div>
              <label className="block text-neutral-400 text-xs mb-2">Unit of Measurement</label>
              <select
                value={formData.unit}
                onChange={(e) => onUpdateFormData({ unit: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-900/40 border border-neutral-800/40 rounded text-neutral-300 focus:border-neutral-700 focus:outline-none text-sm"
              >
                <option value="units">Units</option>
                <option value="grams">Grams (g)</option>
                <option value="ounces">Ounces (oz)</option>
                <option value="pounds">Pounds (lb)</option>
                <option value="kilograms">Kilograms (kg)</option>
                <option value="eighths">Eighths (1/8 oz)</option>
                <option value="quarters">Quarters (1/4 oz)</option>
                <option value="halves">Halves (1/2 oz)</option>
                <option value="pieces">Pieces</option>
                <option value="milligrams">Milligrams (mg)</option>
                <option value="milliliters">Milliliters (mL)</option>
                <option value="liters">Liters (L)</option>
              </select>
            </div>

            <div>
              <label className="block text-neutral-400 text-xs mb-2">Category Image</label>
              <ImageUpload
                currentImage={formData.image?.src}
                onImageUploaded={(imageUrl: string, mediaId: number) => {
                  onUpdateFormData({ 
                    image: { 
                      id: mediaId, 
                      src: imageUrl, 
                      name: `category-${mediaId}`, 
                      alt: formData.name || 'Category image' 
                    } 
                  });
                }}
                onRemove={() => onUpdateFormData({ image: null })}
                className="w-full"
              />
            </div>
          </div>

          {/* Column 3: Description */}
          <div className="space-y-3">
            <div className="text-neutral-500 font-medium text-xs mb-3">Description</div>
            
            <div>
              <label className="block text-neutral-400 text-xs mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => onUpdateFormData({ description: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-900/40 border border-neutral-800/40 rounded text-neutral-300 placeholder-neutral-500 focus:border-neutral-700 focus:outline-none text-sm resize-vertical"
                rows={6}
                placeholder="Category description..."
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3 border-t border-white/[0.04]">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSubmitting || !formData.name.trim()}
            className="text-xs"
          >
            {isSubmitting ? 'Creating...' : 'Create Category'}
          </Button>
          <Button
            type="button"
            onClick={onCancel}
            variant="secondary"
            size="sm"
            disabled={isSubmitting}
            className="text-xs"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

