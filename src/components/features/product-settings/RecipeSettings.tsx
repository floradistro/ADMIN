import React, { useState, useEffect } from 'react';
import { Button, IconButton, ToggleSwitch, JsonPopout, TabHero } from '../../ui';
import { DeleteConfirmDialog } from '../../ui/DeleteConfirmDialog';
import { recipeService, Recipe, CategoryRecipeAssociation } from '../../../services/recipe-service';
import { CreateRecipeForm } from './CreateRecipeForm';
import { EditRecipeForm } from './EditRecipeForm';

interface Category {
  id: number;
  name: string;
  slug: string;
}

export function RecipeSettings() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [associations, setAssociations] = useState<CategoryRecipeAssociation[]>([]);
  const [expandedRecipes, setExpandedRecipes] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // JSON Editor state
  const [showJsonEditor, setShowJsonEditor] = useState<Record<string, boolean>>({});
  const [jsonEditorData, setJsonEditorData] = useState<Record<string, any>>({});
  const [jsonSuccessMessage, setJsonSuccessMessage] = useState('');
  
  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    recipe: Recipe | null;
  }>({ show: false, recipe: null });
  
  // Edit recipe state
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    loadRecipes();
    loadCategories();
    loadAssociations();
  }, []);

  const loadRecipes = async () => {
    try {
      const data = await recipeService.getRecipes();
      setRecipes(data);
    } catch (error) {
      setError('Failed to load recipes. Please check your API connection.');
      setRecipes([]);
    }
  };

  const loadCategories = async () => {
    try {
      // Load mock categories for development
      const mockCategories = [
        { id: 15, name: 'Flower', slug: 'flower' },
        { id: 16, name: 'Pre-Rolls', slug: 'pre-rolls' },
        { id: 17, name: 'Concentrates', slug: 'concentrates' },
        { id: 18, name: 'Edibles', slug: 'edibles' },
        { id: 19, name: 'Vape Cartridges', slug: 'vape-cartridges' },
        { id: 20, name: 'Topicals', slug: 'topicals' },
      ];
      setCategories(mockCategories);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const loadAssociations = async () => {
    try {
      const data = await recipeService.getCategoryAssociations();
      setAssociations(data);
    } catch (error) {
      setAssociations([]);
    }
  };

  const toggleExpanded = (recipeId: number) => {
    const newExpanded = new Set(expandedRecipes);
    if (newExpanded.has(recipeId)) {
      newExpanded.delete(recipeId);
    } else {
      newExpanded.add(recipeId);
    }
    setExpandedRecipes(newExpanded);
  };

  const getAssociationsForRecipe = (recipeId: number) => {
    return associations.filter(assoc => assoc.recipe_id === recipeId);
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Unknown Category';
  };

  const updateConversionRatio = async (recipeId: number, newRatio: number) => {
    try {
      const updatedRecipe = await recipeService.updateRecipe(recipeId, { base_ratio: newRatio });
      setRecipes(prev => prev.map(recipe => 
        recipe.id === recipeId ? updatedRecipe : recipe
      ));
    } catch (error) {
    }
  };

  const handleRecipeCreated = (newRecipe: Recipe) => {
    setRecipes(prev => [...prev, newRecipe]);
    setShowCreateForm(false);
    loadAssociations(); // Reload associations to include the new recipe
  };

  // JSON Editor handlers
  const openJsonEditor = (recipe: Recipe) => {
    const key = `recipe-${recipe.id}`;
    setJsonEditorData(prev => ({
      ...prev,
      [key]: recipe
    }));
    setShowJsonEditor(prev => ({
      ...prev,
      [key]: true
    }));
  };

  const closeJsonEditor = (key: string) => {
    setShowJsonEditor(prev => ({
      ...prev,
      [key]: false
    }));
    setJsonSuccessMessage('');
  };

  const handleJsonEditorSave = async (key: string, data: any) => {
    try {
      const recipeId = parseInt(key.replace('recipe-', ''));
      await recipeService.updateRecipe(recipeId, data);
      
      // Update local state
      setRecipes(prev => prev.map(recipe => 
        recipe.id === recipeId ? { ...recipe, ...data } : recipe
      ));
      
      setJsonSuccessMessage('Recipe updated successfully!');
      setTimeout(() => {
        closeJsonEditor(key);
      }, 1500);
    } catch (error) {
      // Error handling is done by JsonEditor component
    }
  };

  // Delete handlers
  const openDeleteConfirm = (recipe: Recipe) => {
    setDeleteConfirm({ show: true, recipe });
  };

  const handleDeleteRecipe = async () => {
    if (!deleteConfirm.recipe) return;
    
    try {
      await recipeService.deleteRecipe(deleteConfirm.recipe.id);
      setRecipes(prev => prev.filter(recipe => recipe.id !== deleteConfirm.recipe!.id));
      setDeleteConfirm({ show: false, recipe: null });
      loadAssociations(); // Reload associations
    } catch (error) {
      alert('Failed to delete recipe. Please try again.');
    }
  };

  // Edit handlers
  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setShowEditForm(true);
  };

  const handleEditRecipeComplete = (updatedRecipe: Recipe) => {
    setRecipes(prev => prev.map(recipe => 
      recipe.id === updatedRecipe.id ? updatedRecipe : recipe
    ));
    setShowEditForm(false);
    setEditingRecipe(null);
    loadAssociations(); // Reload associations in case categories changed
  };

  const handleEditRecipeCancel = () => {
    setShowEditForm(false);
    setEditingRecipe(null);
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="text-neutral-400">Loading recipe settings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-400 mb-4">{error}</div>
        <Button
          onClick={() => {
            setError(null);
            setLoading(true);
            loadRecipes();
            loadCategories();
            loadAssociations();
          }}
          className="bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-300"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-neutral-800/30 hover:bg-neutral-800/50 row-hover border-t border-white/[0.02] rounded h-full">
      <div className="space-y-6 h-full overflow-y-auto scrollable-container">
        {/* Hero Section */}
        <TabHero 
          title="Recipes"
          description="Transform products with precision. Define conversion ratios that turn raw materials into finished goods."
        />

        {/* Actions */}
        <div className="flex justify-center">
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-300 border border-white/[0.04]"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Recipe
          </Button>
        </div>

      {/* Recipe List - Expandable Cards matching BlueprintDesigner style */}
      <div className="space-y-2">
        {recipes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-neutral-400 mb-4">No recipes configured yet</div>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-300"
            >
              Create Your First Recipe
            </Button>
          </div>
        ) : (
          recipes.map((recipe) => {
            const isExpanded = expandedRecipes.has(recipe.id);
            const recipeAssociations = getAssociationsForRecipe(recipe.id);
            
            return (
              <div
                key={recipe.id}
                className="group transition-all cursor-pointer mb-2 rounded bg-neutral-900/40 hover:bg-neutral-800/60"
              >
                {/* Main Recipe Row */}
                <div className="flex items-center gap-3 px-4 py-2">
                  {/* Expand/Collapse Icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded(recipe.id);
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

                  {/* Recipe Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-neutral-400 text-sm">{recipe.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-neutral-900/40 text-neutral-500 border border-neutral-500/20">
                        {recipe.conversion_type}
                      </span>
                    </div>
                    {recipe.description && (
                      <div className="text-xs text-neutral-500 truncate mt-0.5">
                        {recipe.description}
                      </div>
                    )}
                  </div>

                  {/* Conversion Ratio */}
                  <div className="text-right">
                    <div className="text-sm text-neutral-500">{recipe.base_ratio}:1</div>
                    <div className="text-xs text-neutral-600">{recipe.ratio_unit}</div>
                  </div>



                  {/* Actions - Show on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        openJsonEditor(recipe);
                      }}
                      variant="ghost"
                      size="sm"
                      title="Edit Recipe JSON"
                      className="text-neutral-500 hover:text-neutral-300"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </IconButton>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditRecipe(recipe);
                      }}
                      variant="ghost"
                      size="sm"
                      title="Edit Recipe"
                      className="text-neutral-500 hover:text-neutral-300"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </IconButton>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteConfirm(recipe);
                      }}
                      variant="ghost"
                      size="sm"
                      title="Delete Recipe"
                      className="text-red-400 hover:text-red-300"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </IconButton>
                  </div>
                </div>

                {/* Expanded Content - Product Card Style */}
                {isExpanded && (
                  <div className="mx-4 mb-2 rounded p-4 bg-neutral-800/30 hover:bg-neutral-800/50 row-hover border-t border-white/[0.02]">
                      {/* Summary Stats */}
                      <div className="grid grid-cols-3 gap-3 p-3 border-b border-white/[0.04]">
                        <div className="text-center p-2 bg-neutral-900/40 rounded">
                          <span className="block text-lg font-bold text-neutral-500">
                            {recipe.input_category_ids.length}
                          </span>
                          <div className="text-xs text-neutral-600 mt-1">
                            Input Categories
                          </div>
                        </div>
                        <div className="text-center p-2 bg-neutral-900/40 rounded">
                          <span className="block text-lg font-bold text-neutral-500">
                            {recipe.base_ratio}:1
                          </span>
                          <div className="text-xs text-neutral-600 mt-1">
                            Conversion Ratio
                          </div>
                        </div>
                        <div className="text-center p-2 bg-neutral-900/40 rounded">
                          <span className="block text-lg font-bold text-neutral-500">
                            {recipe.expected_yield_ratio ? `${recipe.expected_yield_ratio}%` : 'Not Set'}
                          </span>
                          <div className="text-xs text-neutral-600 mt-1">
                            Expected Yield
                          </div>
                        </div>
                      </div>

                      {/* Recipe Details */}
                      <div className="p-3">
                        <div className="space-y-3">
                          {/* Category Associations */}
                          <div className="bg-neutral-900/40 rounded p-2">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-neutral-600 text-xs font-medium">Category Associations</span>
                            </div>
                            
                            {/* Conversion Flow */}
                            <div className="flex items-center gap-2 text-xs">
                              {/* Input Categories */}
                              <div className="flex items-center gap-1">
                                {recipe.input_category_ids.length > 0 ? (
                                  recipe.input_category_ids.map((categoryId, index) => (
                                    <span key={categoryId}>
                                      <span className="px-2 py-0.5 bg-neutral-900/40 text-neutral-500 border border-neutral-500/20 rounded font-medium">
                                        {getCategoryName(categoryId)}
                                      </span>
                                      {index < recipe.input_category_ids.length - 1 && (
                                        <span className="text-neutral-600 mx-1">+</span>
                                      )}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-neutral-500">No input</span>
                                )}
                              </div>
                              
                              {/* Conversion Arrow */}
                              <span className="text-neutral-600 mx-2">→</span>
                              
                              {/* Output Category */}
                              <div>
                                {recipe.output_category_id ? (
                                  <span className="px-2 py-0.5 bg-neutral-900/40 text-neutral-500 border border-neutral-500/20 rounded font-medium">
                                    {getCategoryName(recipe.output_category_id)}
                                  </span>
                                ) : (
                                  <span className="text-neutral-500">No output</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Conversion Settings */}
                          <div className="bg-neutral-900/40 rounded p-2">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-neutral-600 text-xs font-medium">Conversion Settings</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600">Base Ratio:</span>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    step="0.0001"
                                    value={recipe.base_ratio}
                                    onChange={(e) => updateConversionRatio(recipe.id, parseFloat(e.target.value))}
                                    className="w-16 px-1 py-0.5 text-xs bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none"
                                  />
                                  <span className="text-neutral-600">: 1 {recipe.ratio_unit}</span>
                                </div>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600">Typical Yield:</span>
                                <span className="text-neutral-600">{recipe.typical_yield_ratio ? `${recipe.typical_yield_ratio}%` : 'Not set'}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600">Expected Yield:</span>
                                <span className="text-neutral-600">{recipe.expected_yield_ratio ? `${recipe.expected_yield_ratio}%` : 'Not set'}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600">Variance:</span>
                                <span className="text-neutral-600">±{(recipe.acceptable_variance * 100).toFixed(2)}%</span>
                              </div>
                            </div>
                          </div>

                          {/* Recipe Options */}
                          <div className="bg-neutral-900/40 rounded p-2">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-neutral-600 text-xs font-medium">Recipe Options</span>
                            </div>
                            
                            <div className="flex items-center gap-6">
                              <div className="flex items-center gap-2 text-xs">
                                <ToggleSwitch
                                  checked={recipe.allow_override}
                                  onChange={(checked) => {
                                    // TODO: Update allow_override setting
                                  }}
                                />
                                <span className="text-neutral-500">Allow ratio override</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <ToggleSwitch
                                  checked={recipe.track_variance}
                                  onChange={(checked) => {
                                    // TODO: Update track_variance setting
                                  }}
                                />
                                <span className="text-neutral-500">Track variance</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create Recipe Form Modal */}
      {showCreateForm && (
        <CreateRecipeForm
          categories={categories}
          onRecipeCreated={handleRecipeCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Edit Recipe Form Modal */}
      {showEditForm && editingRecipe && (
        <EditRecipeForm
          recipe={editingRecipe}
          categories={categories}
          onRecipeUpdated={handleEditRecipeComplete}
          onCancel={handleEditRecipeCancel}
        />
      )}

      {/* JSON Editor Modals */}
      {Object.entries(showJsonEditor).map(([key, show]) => {
        if (!show) return null;
        
        const recipeId = parseInt(key.replace('recipe-', ''));
        const recipe = recipes.find(r => r.id === recipeId);
        if (!recipe) return null;

        return (
          <JsonPopout
            key={key}
            isOpen={show}
            onClose={() => closeJsonEditor(key)}
            value={jsonEditorData[key] || recipe}
            onChange={(data) => handleJsonEditorSave(key, data)}
            title={`Edit Recipe: ${recipe.name}`}
            placeholder="Recipe JSON data..."
            size="xlarge"
            successMessage={jsonSuccessMessage}
            style="dashboard"
          />
        );
      })}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.show && deleteConfirm.recipe && (
        <DeleteConfirmDialog
          isOpen={deleteConfirm.show}
          onClose={() => setDeleteConfirm({ show: false, recipe: null })}
          onConfirm={handleDeleteRecipe}
          title="Delete Recipe"
          message={`Are you sure you want to delete "${deleteConfirm.recipe.name}"? This action cannot be undone and will remove all associated conversion data.`}
          confirmText="Delete Recipe"
          isDestructive
        />
      )}
      </div>
    </div>
  );
}