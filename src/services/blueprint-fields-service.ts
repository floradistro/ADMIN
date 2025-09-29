/**
 * Blueprint Fields Service
 * Handles blueprint field operations separately from WooCommerce products
 */

export interface BlueprintFieldValue {
  field_name: string;
  field_label: string;
  field_value: string;
  field_type: string;
}

export interface BlueprintFieldsData {
  [field_name: string]: string;
}

class BlueprintFieldsService {
  private baseUrl = '/api/blueprint-fields';

  /**
   * Get blueprint fields for a product
   */
  async getBlueprintFields(productId: number): Promise<BlueprintFieldsData> {
    try {
      const response = await fetch(`${this.baseUrl}/${productId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include session cookie for authentication
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.warn('Authentication required for blueprint fields');
          return {};
        }
        throw new Error(`Failed to fetch blueprint fields: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Convert array of fields to object format
        const fieldsData: BlueprintFieldsData = {};
        if (Array.isArray(result.fields)) {
          result.fields.forEach((field: any) => {
            fieldsData[field.field_name] = field.field_value || '';
          });
        }
        
        return fieldsData;
      } else {
        return {};
      }
    } catch (error) {
      console.error('Blueprint fields service error:', error);
      return {};
    }
  }

  /**
   * Update blueprint fields for a product
   */
  async updateBlueprintFields(productId: number, fields: BlueprintFieldsData): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include session cookie for authentication
        body: JSON.stringify({
          fields: fields
        })
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.warn('Authentication required for updating blueprint fields');
          return false;
        }
        throw new Error(`Failed to update blueprint fields: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        return true;
      } else {
        throw new Error(result.error || 'Failed to update blueprint fields');
      }
    } catch (error) {
      console.error('Blueprint fields update error:', error);
      return false;
    }
  }

  /**
   * Bulk update blueprint fields for multiple products
   */
  async bulkUpdateBlueprintFields(updates: Array<{productId: number, fields: BlueprintFieldsData}>): Promise<{success: number, failed: number}> {
    let successCount = 0;
    let failedCount = 0;
    
    
    for (const update of updates) {
      const success = await this.updateBlueprintFields(update.productId, update.fields);
      if (success) {
        successCount++;
      } else {
        failedCount++;
      }
      
      // Add small delay to prevent overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return { success: successCount, failed: failedCount };
  }
}

// Export singleton instance
export const blueprintFieldsService = new BlueprintFieldsService();
