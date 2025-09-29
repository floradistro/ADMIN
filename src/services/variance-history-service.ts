export interface ConversionRecord {
  id: number;
  recipe_blueprint_id: number;
  recipe_name?: string;
  input_product_id: number;
  input_product_name?: string;
  output_product_id?: number;
  output_product_name?: string;
  location_id: number;
  location_name?: string;
  input_quantity: number;
  expected_output: number;
  actual_output?: number;
  variance_percentage?: number;
  variance_reasons?: string[];
  conversion_status: 'pending' | 'completed' | 'cancelled';
  conversion_notes?: string;
  created_by?: number;
  created_at: string;
  completed_at?: string;
}

export interface VarianceReason {
  code: string;
  name: string;
  description?: string;
  category: string;
  impact_type: 'positive' | 'negative' | 'neutral';
  typical_variance: number;
  is_active: boolean;
}

export interface ConversionInitiateData {
  recipe_id: number;
  input_product_id: number;
  location_id: number;
  input_quantity: number;
  notes?: string;
}

export interface ConversionCompleteData {
  conversion_id: number;
  actual_output: number;
  variance_reasons?: string[];
  notes?: string;
}

class VarianceHistoryService {
  private baseUrl = '/api/flora';

  /**
   * Initiate a recipe conversion
   */
  async initiateConversion(data: ConversionInitiateData): Promise<ConversionRecord> {
    try {
      const response = await fetch(`${this.baseUrl}/conversions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      // Get response as text first to handle mixed HTML/JSON responses
      const responseText = await response.text();
      
      if (!response.ok) {
        throw new Error(`Failed to initiate conversion: ${response.status}`);
      }

      // Handle mixed HTML error + JSON response format from WordPress
      let result;
      try {
        // Try to parse as JSON first
        result = JSON.parse(responseText);
      } catch (parseError) {
        // If JSON parsing fails, look for JSON content after HTML
        const jsonStart = responseText.indexOf('{"');
        if (jsonStart > 0) {
          try {
            const jsonPart = responseText.substring(jsonStart);
            result = JSON.parse(jsonPart);
          } catch (cleanParseError) {
            throw new Error('Invalid response format from server');
          }
        } else {
          throw new Error('Invalid response format from server');
        }
      }

      // Check if the conversion was successful despite HTML errors
      if (result.success && result.conversion_id) {
        return {
          id: result.conversion_id,
          recipe_blueprint_id: result.recipe_id || 0,
          recipe_name: result.recipe_name || '',
          input_product_id: result.input_product_id || 0,
          input_product_name: '',
          output_product_id: result.output_product_id,
          output_product_name: '',
          location_id: result.location_id || 0,
          location_name: '',
          input_quantity: result.input_quantity || 0,
          expected_output: result.expected_output || 0,
          actual_output: result.actual_output,
          variance_percentage: result.variance_percentage,
          variance_reasons: result.variance_reasons || [],
          conversion_status: result.status as 'pending' | 'completed' | 'cancelled',
          conversion_notes: result.notes || '',
          created_by: result.created_by,
          created_at: result.created_at || new Date().toISOString(),
          completed_at: result.completed_at
        };
      }

      return result.conversion || result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Complete a conversion with actual output
   */
  async completeConversion(data: ConversionCompleteData): Promise<ConversionRecord> {
    try {
      const response = await fetch(`${this.baseUrl}/conversions?id=${data.conversion_id}&action=complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actual_output: data.actual_output,
          variance_reasons: data.variance_reasons || [],
          notes: data.notes || '',
        }),
      });

      // Get response as text first to handle mixed HTML/JSON responses
      const responseText = await response.text();
      
      if (!response.ok) {
        throw new Error(`Failed to complete conversion: ${response.status}`);
      }

      // Handle mixed HTML error + JSON response format from WordPress
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        const jsonStart = responseText.indexOf('{"');
        if (jsonStart > 0) {
          try {
            const jsonPart = responseText.substring(jsonStart);
            result = JSON.parse(jsonPart);
          } catch (cleanParseError) {
            throw new Error('Invalid response format from server');
          }
        } else {
          throw new Error('Invalid response format from server');
        }
      }

      return result.conversion || result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get conversion history for a product
   */
  async getProductConversionHistory(productId: number): Promise<ConversionRecord[]> {
    try {
      const response = await fetch(`${this.baseUrl}/conversions?product_id=${productId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch conversion history: ${response.status}`);
      }

      const data = await response.json();
      return data.conversions || data || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get a specific conversion by ID
   */
  async getConversion(conversionId: number): Promise<ConversionRecord | null> {
    try {
      const response = await fetch(`${this.baseUrl}/conversions?conversion_id=${conversionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch conversion: ${response.status}`);
      }

      const data = await response.json();
      return data.conversion || data || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get available variance reasons
   */
  async getVarianceReasons(): Promise<VarianceReason[]> {
    try {
      const response = await fetch(`${this.baseUrl}/variance-reasons`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch variance reasons: ${response.status}`);
      }

      const data = await response.json();
      return data.reasons || data || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Cancel a pending conversion
   */
  async cancelConversion(conversionId: number, reason?: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/conversions?id=${conversionId}&action=cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel conversion: ${response.status}`);
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get conversion statistics for a product
   */
  async getProductConversionStats(productId: number): Promise<{
    total_conversions: number;
    average_variance: number;
    total_input: number;
    total_output: number;
    efficiency_rate: number;
  }> {
    try {
      const history = await this.getProductConversionHistory(productId);
      
      if (history.length === 0) {
        return {
          total_conversions: 0,
          average_variance: 0,
          total_input: 0,
          total_output: 0,
          efficiency_rate: 100,
        };
      }

      const completedConversions = history.filter(c => c.conversion_status === 'completed');
      
      const stats = completedConversions.reduce((acc, conv) => ({
        total_input: acc.total_input + conv.input_quantity,
        total_output: acc.total_output + (conv.actual_output || 0),
        variance_sum: acc.variance_sum + (conv.variance_percentage || 0),
      }), { total_input: 0, total_output: 0, variance_sum: 0 });

      const avgVariance = completedConversions.length > 0 
        ? stats.variance_sum / completedConversions.length 
        : 0;

      const efficiencyRate = stats.total_input > 0 
        ? (stats.total_output / stats.total_input) * 100 
        : 100;

      return {
        total_conversions: history.length,
        average_variance: avgVariance,
        total_input: stats.total_input,
        total_output: stats.total_output,
        efficiency_rate: efficiencyRate,
      };
    } catch (error) {
      return {
        total_conversions: 0,
        average_variance: 0,
        total_input: 0,
        total_output: 0,
        efficiency_rate: 100,
      };
    }
  }

  /**
   * Get available recipes for a specific product
   */
  async getAvailableRecipes(productId: number): Promise<any[]> {
    try {
      // First try the BluePrints API to get recipes by product category
      const response = await fetch(`${this.baseUrl}/recipes/by-product/${productId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Fallback: try to get product categories and then recipes by category
        const productResponse = await fetch(`/api/flora/products/${productId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (productResponse.ok) {
          const productData = await productResponse.json();
          if (productData.categories && productData.categories.length > 0) {
            // Get recipes for each category
            const allRecipes = [];
            for (const category of productData.categories) {
              try {
                const categoryRecipesResponse = await fetch(`${this.baseUrl}/recipes/by-category/${category.id}`, {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                });
                
                if (categoryRecipesResponse.ok) {
                  const categoryRecipes = await categoryRecipesResponse.json();
                  allRecipes.push(...(categoryRecipes.recipes || categoryRecipes || []));
                }
              } catch (categoryError) {
              }
            }
            
            // Remove duplicates by recipe ID
            const uniqueRecipes = allRecipes.filter((recipe, index, self) => 
              index === self.findIndex(r => r.id === recipe.id)
            );
            
            return uniqueRecipes;
          }
        }

        return [];
      }

      const data = await response.json();
      return data.recipes || data || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Validate if a conversion can be performed
   */
  async validateConversion(data: ConversionInitiateData): Promise<{
    valid: boolean;
    errors?: string[];
    warnings?: string[];
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/conversions/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          valid: false,
          errors: [`Validation failed: ${errorText}`],
        };
      }

      const result = await response.json();
      return {
        valid: result.valid !== false,
        errors: result.errors || [],
        warnings: result.warnings || [],
      };
    } catch (error) {
      return {
        valid: false,
        errors: ['Failed to validate conversion'],
      };
    }
  }
}

export const varianceHistoryService = new VarianceHistoryService();