export interface Recipe {
  id: number;
  name: string;
  slug: string;
  description?: string;
  conversion_type: 'simple' | 'compound';
  input_category_ids: number[];
  output_category_id?: number;
  base_ratio: number;
  ratio_unit: string;
  allow_override: boolean;
  expected_yield_ratio?: number;
  typical_yield_ratio?: number;
  acceptable_variance: number;
  track_variance: boolean;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface CategoryRecipeAssociation {
  id: number;
  recipe_id: number;
  category_id: number;
  mapping_type: 'input' | 'output';
  is_primary: boolean;
  priority: number;
}

export interface RecipeComponent {
  id: number;
  recipe_blueprint_id: number;
  component_category_id: number;
  quantity_ratio: number;
  unit: string;
  component_role: 'base' | 'additive' | 'modifier';
  is_optional: boolean;
  sort_order: number;
}

class RecipeService {
  private baseUrl = 'https://api.floradistro.com/wp-json/fd/v1';
  private consumerKey = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
  private consumerSecret = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

  // Helper to add auth to URLs
  private withAuth(url: string) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}consumer_key=${this.consumerKey}&consumer_secret=${this.consumerSecret}`;
  }

  async getRecipes(): Promise<Recipe[]> {
    try {
      // Explicitly pass status=active to work around backend issue
      const url = this.withAuth(`${this.baseUrl}/recipes?status=active`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return this.transformToRecipes(data);
    } catch (error) {
      throw error;
    }
  }

  async getRecipe(id: number): Promise<Recipe | null> {
    try {
      const url = this.withAuth(`${this.baseUrl}/recipes/${id}`);
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return this.transformToRecipe(data);
    } catch (error) {
      throw error;
    }
  }

  async createRecipe(recipe: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>): Promise<Recipe> {
    try {
      const url = this.withAuth(`${this.baseUrl}/recipes`);
      const transformedData = this.transformFromRecipe(recipe);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transformedData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      // The API returns { message, recipe_id, recipe }
      const recipeData = data.recipe || data;
      return this.transformToRecipe(recipeData);
    } catch (error) {
      throw error;
    }
  }

  async updateRecipe(id: number, updates: Partial<Recipe>): Promise<Recipe> {
    try {
      const url = this.withAuth(`${this.baseUrl}/recipes/${id}`);
      const transformedData = this.transformFromRecipe(updates as any);
      
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transformedData),
      });
      
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      return this.transformToRecipe(data);
    } catch (error) {
      
      // If it's a fetch error, the endpoint might not exist
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Failed to fetch: The recipe update endpoint may not be available on the server.');
      }
      
      throw error;
    }
  }

  async deleteRecipe(id: number): Promise<void> {
    try {
      const url = this.withAuth(`${this.baseUrl}/recipes/${id}`);
      const response = await fetch(url, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      throw error;
    }
  }

  async getCategoryAssociations(): Promise<CategoryRecipeAssociation[]> {
    try {
      // Since the recipe-category-mappings endpoint doesn't exist,
      // we'll extract the relationships from the recipes themselves
      const recipes = await this.getRecipes();
      const associations: CategoryRecipeAssociation[] = [];
      
      recipes.forEach(recipe => {
        // Add input category associations
        recipe.input_category_ids.forEach((categoryId, index) => {
          associations.push({
            id: parseInt(`${recipe.id}${categoryId}1`), // Generate unique ID
            recipe_id: recipe.id,
            category_id: categoryId,
            mapping_type: 'input',
            is_primary: index === 0,
            priority: index
          });
        });
        
        // Add output category association
        if (recipe.output_category_id) {
          associations.push({
            id: parseInt(`${recipe.id}${recipe.output_category_id}2`), // Generate unique ID
            recipe_id: recipe.id,
            category_id: recipe.output_category_id,
            mapping_type: 'output',
            is_primary: true,
            priority: 0
          });
        }
      });
      
      return associations;
    } catch (error) {
      throw error;
    }
  }

  async updateCategoryAssociations(recipeId: number, associations: Omit<CategoryRecipeAssociation, 'id'>[]): Promise<void> {
    try {
      const url = this.withAuth(`${this.baseUrl}/recipes/${recipeId}/categories`);
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(associations),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      throw error;
    }
  }

  async getRecipeComponents(recipeId: number): Promise<RecipeComponent[]> {
    try {
      const url = this.withAuth(`${this.baseUrl}/recipes/${recipeId}/components`);
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Transform BluePrints API data to Recipe format
  private transformToRecipes(data: any[]): Recipe[] {
    return data.map(item => this.transformToRecipe(item));
  }

  private transformToRecipe(data: any): Recipe {
    return {
      id: typeof data.id === 'number' ? data.id : parseInt(data.id),
      name: data.name || '',
      slug: data.slug || '',
      description: data.description || '',
      conversion_type: data.conversion_type || 'simple',
      input_category_ids: Array.isArray(data.input_category_ids) 
        ? data.input_category_ids.map((id: any) => typeof id === 'number' ? id : parseInt(id))
        : (typeof data.input_category_ids === 'string' 
          ? (data.input_category_ids ? JSON.parse(data.input_category_ids) : [])
          : []),
      output_category_id: data.output_category_id ? 
        (typeof data.output_category_id === 'number' ? data.output_category_id : parseInt(data.output_category_id)) : 
        undefined,
      base_ratio: parseFloat(data.base_ratio || '1.0'),
      ratio_unit: data.ratio_unit || 'g:g',
      allow_override: data.allow_override === true || data.allow_override === '1' || data.allow_override === 1,
      expected_yield_ratio: data.expected_yield_ratio ? parseFloat(data.expected_yield_ratio) : undefined,
      typical_yield_ratio: data.typical_yield_ratio ? parseFloat(data.typical_yield_ratio) : undefined,
      acceptable_variance: parseFloat(data.acceptable_variance || '0.05'),
      track_variance: data.track_variance === true || data.track_variance === '1' || data.track_variance === 1,
      status: data.status || 'active',
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString(),
    };
  }

  private transformFromRecipe(recipe: Partial<Recipe>): any {
    const transformed: any = {};
    
    if (recipe.name !== undefined) transformed.name = recipe.name;
    if (recipe.slug !== undefined) transformed.slug = recipe.slug;
    if (recipe.description !== undefined) transformed.description = recipe.description;
    if (recipe.conversion_type !== undefined) transformed.conversion_type = recipe.conversion_type;
    if (recipe.input_category_ids !== undefined) transformed.input_category_ids = JSON.stringify(recipe.input_category_ids);
    if (recipe.output_category_id !== undefined) transformed.output_category_id = recipe.output_category_id;
    if (recipe.base_ratio !== undefined) transformed.base_ratio = recipe.base_ratio;
    if (recipe.ratio_unit !== undefined) transformed.ratio_unit = recipe.ratio_unit;
    if (recipe.allow_override !== undefined) transformed.allow_override = recipe.allow_override ? 1 : 0;
    if (recipe.expected_yield_ratio !== undefined) transformed.expected_yield_ratio = recipe.expected_yield_ratio;
    if (recipe.typical_yield_ratio !== undefined) transformed.typical_yield_ratio = recipe.typical_yield_ratio;
    if (recipe.acceptable_variance !== undefined) transformed.acceptable_variance = recipe.acceptable_variance;
    if (recipe.track_variance !== undefined) transformed.track_variance = recipe.track_variance ? 1 : 0;
    if (recipe.status !== undefined) transformed.status = recipe.status;
    
    return transformed;
  }


}

export const recipeService = new RecipeService();