import React, { useState } from 'react';
import { Button, Modal } from '../../ui';
import { recipeService, Recipe } from '../../../services/recipe-service';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface CreateRecipeFormProps {
  categories: Category[];
  onRecipeCreated: (recipe: Recipe) => void;
  onCancel: () => void;
}

export function CreateRecipeForm({ categories, onRecipeCreated, onCancel }: CreateRecipeFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    conversion_type: 'simple' as 'simple' | 'compound',
    input_category_ids: [] as number[],
    output_category_id: undefined as number | undefined,
    base_ratio: 1.0,
    ratio_unit: 'g:g',
    allow_override: true,
    expected_yield_ratio: undefined as number | undefined,
    typical_yield_ratio: undefined as number | undefined,
    acceptable_variance: 0.05,
    track_variance: true,
    status: 'active' as 'active' | 'inactive',
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
      const newRecipe = await recipeService.createRecipe(formData);
      onRecipeCreated(newRecipe);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to create recipe: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title="Create Recipe"
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
            {/* Recipe Information */}
            <div className="space-y-4">
              <h4 className="text-sm text-neutral-400">Recipe Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Recipe Name */}
                <div className="bg-neutral-900/40 rounded p-2">
                  <div className="text-neutral-600 text-xs mb-1">Recipe Name *</div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-2 py-1 bg-black border border-white/[0.04] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
                    placeholder="e.g., Flower to Pre-Roll"
                    required
                  />
                </div>

                {/* Recipe Slug */}
                <div className="bg-neutral-900/40 rounded p-2">
                  <div className="text-neutral-600 text-xs mb-1">Slug</div>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    className="w-full px-2 py-1 bg-black border border-white/[0.04] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
                    placeholder="Auto-generated from name"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Unique identifier (auto-generated from name)
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="bg-neutral-900/40 rounded p-2">
                <div className="text-neutral-600 text-xs mb-1">Description</div>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-2 py-1 bg-black border border-white/[0.04] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
                  rows={3}
                  placeholder="Describe what this recipe does..."
                />
              </div>
            </div>



            {/* Conversion Type */}
            <div className="space-y-4">
              <h4 className="text-sm text-neutral-400">Conversion Type</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => handleInputChange('conversion_type', 'simple')}
                  className={`cursor-pointer transition-all border rounded-lg p-3 ${
                    formData.conversion_type === 'simple'
                      ? 'bg-neutral-900/60 border-white/[0.3] shadow-lg'
                      : 'bg-neutral-900/40 border-white/[0.04] hover:bg-neutral-900/60 hover:border-white/[0.1]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-neutral-300 text-sm font-medium">Simple Conversion</div>
                      <div className="text-neutral-500 text-xs mt-1">Single input to single output</div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      formData.conversion_type === 'simple' ? 'bg-blue-500' : 'bg-neutral-600'
                    }`} />
                  </div>
                </div>
                <div
                  onClick={() => handleInputChange('conversion_type', 'compound')}
                  className={`cursor-pointer transition-all border rounded-lg p-3 ${
                    formData.conversion_type === 'compound'
                      ? 'bg-neutral-900/60 border-white/[0.3] shadow-lg'
                      : 'bg-neutral-900/40 border-white/[0.04] hover:bg-neutral-900/60 hover:border-white/[0.1]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-neutral-300 text-sm font-medium">Compound Conversion</div>
                      <div className="text-neutral-500 text-xs mt-1">Multiple inputs to single output</div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      formData.conversion_type === 'compound' ? 'bg-blue-500' : 'bg-neutral-600'
                    }`} />
                  </div>
                </div>
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
                      formData.allow_override ? 'bg-green-500' : 'bg-neutral-600'
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
                      formData.track_variance ? 'bg-green-500' : 'bg-neutral-600'
                    }`} />
                  </div>
                </div>
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
                {isSubmitting ? 'Creating Recipe...' : 'Create Recipe'}
              </Button>
            </div>
          </form>
    </Modal>
  );
}