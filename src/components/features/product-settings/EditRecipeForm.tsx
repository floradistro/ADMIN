import React, { useState, useEffect } from 'react';
import { Button, Modal } from '../../ui';
import { recipeService, Recipe } from '../../../services/recipe-service';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface EditRecipeFormProps {
  recipe: Recipe;
  categories: Category[];
  onRecipeUpdated: (recipe: Recipe) => void;
  onCancel: () => void;
}

export function EditRecipeForm({ recipe, categories, onRecipeUpdated, onCancel }: EditRecipeFormProps) {
  const [formData, setFormData] = useState({
    name: recipe.name,
    slug: recipe.slug,
    description: recipe.description || '',
    conversion_type: recipe.conversion_type as 'simple' | 'compound',
    input_category_ids: recipe.input_category_ids,
    output_category_id: recipe.output_category_id,
    base_ratio: recipe.base_ratio,
    ratio_unit: recipe.ratio_unit,
    allow_override: recipe.allow_override,
    expected_yield_ratio: recipe.expected_yield_ratio,
    typical_yield_ratio: recipe.typical_yield_ratio,
    acceptable_variance: recipe.acceptable_variance,
    track_variance: recipe.track_variance,
    status: recipe.status as 'active' | 'inactive',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-generate slug from name
    if (field === 'name' && typeof value === 'string') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updatedRecipe = await recipeService.updateRecipe(recipe.id, formData);
      onRecipeUpdated(updatedRecipe);
    } catch (error) {
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Provide more specific error messages
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error: Unable to connect to the server. Please check your connection and try again.';
        } else if (error.message.includes('404')) {
          errorMessage = 'Recipe update endpoint not found. The API may not support recipe updates yet.';
        } else if (error.message.includes('500')) {
          errorMessage = 'Server error: Please try again later.';
        }
      }
      
      alert(`Failed to update recipe: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title="Edit Recipe"

    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h4 className="text-sm text-neutral-400">Basic Information</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-neutral-900/40 rounded p-2">
              <div className="text-neutral-600 text-xs mb-1">Recipe Name *</div>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                className="w-full px-2 py-1 bg-black border border-white/[0.04] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
                placeholder="Enter recipe name..."
              />
            </div>

            <div className="bg-neutral-900/40 rounded p-2">
              <div className="text-neutral-600 text-xs mb-1">Slug</div>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                className="w-full px-2 py-1 bg-black border border-white/[0.04] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
                placeholder="recipe-slug"
              />
            </div>
          </div>

          <div className="bg-neutral-900/40 rounded p-2">
            <div className="text-neutral-600 text-xs mb-1">Description</div>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-2 py-1 bg-black border border-white/[0.04] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs resize-none"
              placeholder="Optional description..."
            />
          </div>

          <div className="bg-neutral-900/40 rounded p-2">
            <div className="text-neutral-600 text-xs mb-1">Conversion Type</div>
            <select
              value={formData.conversion_type}
              onChange={(e) => handleInputChange('conversion_type', e.target.value)}
              className="w-full px-2 py-1 bg-black border border-white/[0.04] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
            >
              <option value="simple">Simple</option>
              <option value="compound">Compound</option>
            </select>
          </div>
        </div>

        {/* Category Configuration */}
        <div className="space-y-4">
          <h4 className="text-sm text-neutral-400">Category Configuration</h4>
          
          {/* Input Category */}
          <div className="bg-neutral-900/40 rounded p-2">
            <div className="text-neutral-600 text-xs mb-1">Input Category *</div>
            <select
              value={formData.input_category_ids[0] || ''}
              onChange={(e) => {
                const selectedId = e.target.value ? parseInt(e.target.value) : undefined;
                setFormData(prev => ({ 
                  ...prev, 
                  input_category_ids: selectedId ? [selectedId] : [] 
                }));
              }}
              className="w-full px-2 py-1 bg-black border border-white/[0.04] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
            >
              <option value="">Select input category...</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Output Category */}
          <div className="bg-neutral-900/40 rounded p-2">
            <div className="text-neutral-600 text-xs mb-1">Output Category</div>
            <select
              value={formData.output_category_id || ''}
              onChange={(e) => handleInputChange('output_category_id', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-2 py-1 bg-black border border-white/[0.04] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
            >
              <option value="">Select output category...</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Conversion Settings */}
        <div className="space-y-4">
          <h4 className="text-sm text-neutral-400">Conversion Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-neutral-900/40 rounded p-2">
              <div className="text-neutral-600 text-xs mb-1">Base Conversion Ratio *</div>
              <input
                type="number"
                step="0.0001"
                value={formData.base_ratio}
                onChange={(e) => handleInputChange('base_ratio', parseFloat(e.target.value))}
                required
                className="w-full px-2 py-1 bg-black border border-white/[0.04] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
                placeholder="1.0000"
              />
            </div>

            <div className="bg-neutral-900/40 rounded p-2">
              <div className="text-neutral-600 text-xs mb-1">Ratio Unit</div>
              <input
                type="text"
                value={formData.ratio_unit}
                onChange={(e) => handleInputChange('ratio_unit', e.target.value)}
                className="w-full px-2 py-1 bg-black border border-white/[0.04] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
                placeholder="g:g"
              />
            </div>
          </div>
        </div>

        {/* Yield Settings */}
        <div className="space-y-4">
          <h4 className="text-sm text-neutral-400">Yield Configuration</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-neutral-900/40 rounded p-2">
              <div className="text-neutral-600 text-xs mb-1">Expected Yield %</div>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={formData.expected_yield_ratio || ''}
                onChange={(e) => handleInputChange('expected_yield_ratio', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full px-2 py-1 bg-black border border-white/[0.04] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
                placeholder="0.95"
              />
            </div>

            <div className="bg-neutral-900/40 rounded p-2">
              <div className="text-neutral-600 text-xs mb-1">Typical Yield %</div>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={formData.typical_yield_ratio || ''}
                onChange={(e) => handleInputChange('typical_yield_ratio', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full px-2 py-1 bg-black border border-white/[0.04] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
                placeholder="0.92"
              />
            </div>

            <div className="bg-neutral-900/40 rounded p-2">
              <div className="text-neutral-600 text-xs mb-1">Acceptable Variance %</div>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={formData.acceptable_variance}
                onChange={(e) => handleInputChange('acceptable_variance', parseFloat(e.target.value))}
                className="w-full px-2 py-1 bg-black border border-white/[0.04] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
                placeholder="0.05"
              />
            </div>
          </div>
        </div>

        {/* Recipe Options */}
        <div className="space-y-4">
          <h4 className="text-sm text-neutral-400">Recipe Options</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => handleInputChange('allow_override', !formData.allow_override)}
              className={`cursor-pointer transition-all border rounded-lg p-3 ${
                formData.allow_override
                  ? 'bg-neutral-900/60 border-white/[0.3] shadow-lg'
                  : 'bg-neutral-900/40 border-white/[0.04] hover:bg-neutral-900/60 hover:border-white/[0.1]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-neutral-300 text-sm font-medium">Allow Ratio Override</div>
                  <div className="text-neutral-500 text-xs mt-1">Users can modify conversion ratio</div>
                </div>
                <div className={`w-2 h-2 rounded-full ${
                  formData.allow_override ? 'bg-neutral-300' : 'bg-neutral-600'
                }`} />
              </div>
            </div>
            <div
              onClick={() => handleInputChange('track_variance', !formData.track_variance)}
              className={`cursor-pointer transition-all border rounded-lg p-3 ${
                formData.track_variance
                  ? 'bg-neutral-900/60 border-white/[0.3] shadow-lg'
                  : 'bg-neutral-900/40 border-white/[0.04] hover:bg-neutral-900/60 hover:border-white/[0.1]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-neutral-300 text-sm font-medium">Track Variance</div>
                  <div className="text-neutral-500 text-xs mt-1">Monitor yield differences</div>
                </div>
                <div className={`w-2 h-2 rounded-full ${
                  formData.track_variance ? 'bg-neutral-300' : 'bg-neutral-600'
                }`} />
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="space-y-4">
          <h4 className="text-sm text-neutral-400">Recipe Status</h4>
          <div className="bg-neutral-900/40 rounded p-2">
            <div className="text-neutral-600 text-xs mb-1">Status</div>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full px-2 py-1 bg-black border border-white/[0.04] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.04]">
          <Button
            type="button"
            onClick={onCancel}
            variant="secondary"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !formData.name || formData.input_category_ids.length === 0}
            className="bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-300"
          >
            {isSubmitting ? 'Updating Recipe...' : 'Update Recipe'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}