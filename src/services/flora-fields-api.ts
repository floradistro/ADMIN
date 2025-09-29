/**
 * Flora Fields API Service
 * Handles communication with the Flora Fields WordPress plugin API
 */

interface FieldBlueprint {
  id: number;
  name: string;
  type: string;
  label: string;
  description: string;
  default_value?: string;
  validation_rules?: Record<string, any>;
  display_options?: Record<string, any>;
  is_required: boolean;
  is_searchable: boolean;
  sort_order: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface CreateBlueprintData {
  name: string;
  type: string;
  label: string;
  description?: string;
  default_value?: string;
  validation_rules?: Record<string, any>;
  display_options?: Record<string, any>;
  is_required?: boolean;
  is_searchable?: boolean;
  sort_order?: number;
}

// Stage 3 interfaces
interface BlueprintField {
  id: number;
  blueprint_id: number;
  field_name: string;
  field_type: string;
  field_label: string;
  field_description: string;
  field_default_value?: string;
  validation_rules?: Record<string, any>;
  display_options?: Record<string, any>;
  is_required: boolean;
  is_searchable: boolean;
  sort_order: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface CreateBlueprintFieldData {
  field_name: string;
  field_type: string;
  field_label: string;
  field_description?: string;
  field_default_value?: string;
  validation_rules?: Record<string, any>;
  display_options?: Record<string, any>;
  is_required?: boolean;
  is_searchable?: boolean;
  sort_order?: number;
}

interface BlueprintAssignment {
  id: number;
  blueprint_id: number;
  blueprint_name: string;
  blueprint_label: string;
  entity_type: 'product' | 'category';
  entity_id?: number;
  category_id?: number;
  scope_type: 'specific' | 'category' | 'global';
  include_descendants: boolean;
  assignment_mode: 'include' | 'exclude';
  priority: number;
  conditions?: Record<string, any>;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateBlueprintAssignmentData {
  blueprint_id: number;
  entity_type: 'product' | 'category';
  entity_id?: number;
  category_id?: number;
  scope_type?: 'specific' | 'category' | 'global';
  include_descendants?: boolean;
  assignment_mode?: 'include' | 'exclude';
  priority?: number;
  conditions?: Record<string, any>;
  sort_order?: number;
  is_active?: boolean;
}

// Standalone Field interfaces
interface StandaloneField {
  id: number;
  field_name: string;
  field_type: string;
  field_label: string;
  field_description: string;
  field_default_value?: string;
  validation_rules?: Record<string, any>;
  display_options?: Record<string, any>;
  is_required: boolean;
  is_searchable: boolean;
  sort_order: number;
  status: string;
  created_at: string;
  updated_at: string;
  usage_count?: number; // How many blueprints use this field
}

interface CreateStandaloneFieldData {
  field_name: string;
  field_type: string;
  field_label: string;
  field_description?: string;
  field_default_value?: string;
  validation_rules?: Record<string, any>;
  display_options?: Record<string, any>;
  is_required?: boolean;
  is_searchable?: boolean;
  sort_order?: number;
}

interface FieldTemplate {
  id: number;
  name: string;
  label: string;
  description: string;
  fields: StandaloneField[];
  category: string;
  created_at: string;
  updated_at: string;
}

class FloraFieldsAPI {
  private baseUrl = '/api/flora'; // Use Next.js API routes instead of direct external calls
  private consumerKey = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
  private consumerSecret = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';
  private namespace = 'fd/v1';

  private async makeRequest(endpoint: string, options: RequestInit = {}, namespace?: string) {
    // Use Next.js API routes to avoid CORS issues
    const url = `${this.baseUrl}${endpoint}`;

    // Add cache-busting timestamp for GET requests
    const urlObj = new URL(url, window.location.origin);
    if (!options.method || options.method === 'GET') {
      urlObj.searchParams.append('_t', Date.now().toString());
    }

    const response = await fetch(urlObj.toString(), {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      cache: 'no-store', // Disable browser caching
      ...options,
    });


      if (!response.ok) {
    let errorData;
    let responseText = '';
    
    try {
      // Try to get the raw response text first
      responseText = await response.text();
      
      // Try to parse as JSON
      if (responseText) {
        errorData = JSON.parse(responseText);
      } else {
        errorData = { message: `Empty response body` };
      }
    } catch (parseError) {
      errorData = { 
        message: responseText || `HTTP ${response.status}: ${response.statusText}`,
        raw_response: responseText
      };
    }
    
    // Log comprehensive error details
    // Error details: {
    //   status: response.status,
    //   statusText: response.statusText,
    //   url: response.url,
    //   headers: Object.fromEntries(response.headers.entries()),
    //   errorData,
    //   responseText,
    //   endpoint: endpoint,
    //   method: options.method || 'GET'
    // }
    
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  // Blueprint CRUD operations
  async getBlueprints(): Promise<FieldBlueprint[]> {
    return this.makeRequest('/blueprints');
  }

  async getBlueprint(id: number): Promise<FieldBlueprint> {
    return this.makeRequest(`/blueprints/${id}`);
  }

  async createBlueprint(data: CreateBlueprintData): Promise<{ success?: boolean; id?: number; blueprint?: FieldBlueprint; message?: string; code?: string }> {
    return this.makeRequest('/blueprints', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBlueprint(id: number, data: Partial<CreateBlueprintData>): Promise<{ success?: boolean; blueprint?: FieldBlueprint }> {
    return this.makeRequest(`/blueprints/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBlueprint(id: number): Promise<{ deleted: boolean; id: number }> {
    return this.makeRequest(`/blueprints/${id}`, {
      method: 'DELETE',
    });
  }

  async duplicateBlueprint(id: number, newName: string, newLabel?: string): Promise<{ success?: boolean; id?: number; blueprint?: FieldBlueprint; message?: string; code?: string }> {
    // Get the original blueprint
    const originalBlueprint = await this.getBlueprint(id);
    
    // Create duplicate blueprint data
    const duplicateData: CreateBlueprintData = {
      name: newName,
      type: originalBlueprint.type,
      label: newLabel || `${originalBlueprint.label} (Copy)`,
      description: originalBlueprint.description ? `${originalBlueprint.description} (Duplicated)` : undefined,
      default_value: originalBlueprint.default_value,
      validation_rules: originalBlueprint.validation_rules,
      display_options: originalBlueprint.display_options,
      is_required: originalBlueprint.is_required,
      is_searchable: originalBlueprint.is_searchable,
      sort_order: 0
    };

    // Create the new blueprint
    const createResponse = await this.createBlueprint(duplicateData);
    
    if (createResponse.success && createResponse.id) {
      // Get original blueprint fields and assignments
      const [originalFields, originalAssignments] = await Promise.all([
        this.getBlueprintFields(id),
        this.getBlueprintAssignments(id)
      ]);

      // Duplicate fields
      for (const field of originalFields) {
        const fieldData: CreateBlueprintFieldData = {
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
        
        await this.createBlueprintField(createResponse.id, fieldData);
      }

      // Duplicate assignments
      for (const assignment of originalAssignments) {
        const assignmentData: CreateBlueprintAssignmentData = {
          blueprint_id: createResponse.id,
          entity_type: assignment.entity_type,
          entity_id: assignment.entity_id,
          category_id: assignment.category_id,
          scope_type: assignment.scope_type,
          include_descendants: assignment.include_descendants,
          assignment_mode: assignment.assignment_mode,
          priority: assignment.priority,
          sort_order: assignment.sort_order,
          is_active: assignment.is_active
        };
        
        await this.createBlueprintAssignment(assignmentData);
      }
    }

    return createResponse;
  }

  // Test connectivity
  async testConnection(): Promise<{ status: string; message: string; version: string }> {
    return this.makeRequest('/test');
  }

  // ===== STAGE 3 METHODS =====

  // Blueprint fields operations
  async getBlueprintFields(blueprintId: number): Promise<BlueprintField[]> {
    return this.makeRequest(`/blueprints/${blueprintId}/fields`);
  }

  async createBlueprintField(blueprintId: number, data: CreateBlueprintFieldData): Promise<{ id: number; blueprint_id: number; message: string }> {
    return this.makeRequest(`/blueprints/${blueprintId}/fields`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBlueprintField(fieldId: number, data: Partial<CreateBlueprintFieldData>): Promise<{ message: string }> {
    return this.makeRequest(`/blueprint-fields/${fieldId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBlueprintField(fieldId: number): Promise<{ message: string }> {
    return this.makeRequest(`/blueprint-fields/${fieldId}`, {
      method: 'DELETE',
    });
  }

  // Blueprint pricing rules operations
  async getBlueprintPricingRules(blueprintId: number): Promise<any[]> {
    try {
      const result = await this.makeRequest(`/pricing-rules?blueprint_id=${blueprintId}`);
      // The API returns {rules: [...], count: n} format
      return result.rules || result || [];
    } catch (error) {
      return [];
    }
  }

  // Blueprint assignments operations
  async getBlueprintAssignments(blueprintId?: number): Promise<BlueprintAssignment[]> {
    const endpoint = blueprintId ? `/blueprint-assignments?blueprint_id=${blueprintId}` : '/blueprint-assignments';
    return this.makeRequest(endpoint);
  }

  async createBlueprintAssignment(data: CreateBlueprintAssignmentData): Promise<{ id: number; message: string }> {
    return this.makeRequest('/blueprint-assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteBlueprintAssignment(assignmentId: number): Promise<{ message: string }> {
    return this.makeRequest(`/blueprint-assignments/${assignmentId}`, {
      method: 'DELETE',
    });
  }

  async getCategoryBlueprintAssignments(categoryId: number): Promise<BlueprintAssignment[]> {
    return this.makeRequest(`/blueprint-assignments?entity_type=category&category_id=${categoryId}`);
  }

  // ===== STANDALONE FIELDS METHODS =====

  // Get all standalone fields
  async getStandaloneFields(): Promise<StandaloneField[]> {
    return this.makeRequest('/fields');
  }

  // Get single standalone field
  async getStandaloneField(id: number): Promise<StandaloneField> {
    return this.makeRequest(`/fields/${id}`);
  }

  // Create standalone field
  async createStandaloneField(data: CreateStandaloneFieldData): Promise<{ id: number; message: string; field?: StandaloneField }> {
    return this.makeRequest('/fields', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update standalone field
  async updateStandaloneField(id: number, data: Partial<CreateStandaloneFieldData>): Promise<{ message: string; field?: StandaloneField }> {
    return this.makeRequest(`/fields/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Delete standalone field
  async deleteStandaloneField(id: number): Promise<{ message: string }> {
    return this.makeRequest(`/fields/${id}`, {
      method: 'DELETE',
    });
  }

  // Duplicate standalone field
  async duplicateStandaloneField(id: number, newName: string, newLabel?: string): Promise<{ success?: boolean; id?: number; field?: StandaloneField; message?: string }> {
    const originalField = await this.getStandaloneField(id);
    
    const duplicateData: CreateStandaloneFieldData = {
      field_name: newName,
      field_type: originalField.field_type,
      field_label: newLabel || `${originalField.field_label} (Copy)`,
      field_description: originalField.field_description ? `${originalField.field_description} (Duplicated)` : undefined,
      field_default_value: originalField.field_default_value,
      validation_rules: originalField.validation_rules,
      display_options: originalField.display_options,
      is_required: originalField.is_required,
      is_searchable: originalField.is_searchable,
      sort_order: originalField.sort_order
    };

    return this.createStandaloneField(duplicateData);
  }

  // Add standalone field to blueprint
  async addFieldToBlueprint(blueprintId: number, standaloneFieldId: number, overrides?: Partial<CreateBlueprintFieldData>): Promise<{ id: number; blueprint_id: number; message: string }> {
    // Get the standalone field
    const standaloneField = await this.getStandaloneField(standaloneFieldId);
    
    // Create blueprint field data from standalone field
    const fieldData: CreateBlueprintFieldData = {
      field_name: overrides?.field_name || standaloneField.field_name,
      field_type: overrides?.field_type || standaloneField.field_type,
      field_label: overrides?.field_label || standaloneField.field_label,
      field_description: overrides?.field_description || standaloneField.field_description,
      field_default_value: overrides?.field_default_value || standaloneField.field_default_value,
      validation_rules: overrides?.validation_rules || standaloneField.validation_rules,
      display_options: overrides?.display_options || standaloneField.display_options,
      is_required: overrides?.is_required !== undefined ? overrides.is_required : standaloneField.is_required,
      is_searchable: overrides?.is_searchable !== undefined ? overrides.is_searchable : standaloneField.is_searchable,
      sort_order: overrides?.sort_order || standaloneField.sort_order
    };

    return this.createBlueprintField(blueprintId, fieldData);
  }

  // Get field usage statistics
  async getFieldUsage(fieldId: number): Promise<{ usage_count: number; blueprints: Array<{ id: number; name: string; label: string }> }> {
    return this.makeRequest(`/fields/${fieldId}/usage`);
  }

  // ===== FIELD TEMPLATES METHODS =====

  // Get all field templates
  async getFieldTemplates(): Promise<FieldTemplate[]> {
    return this.makeRequest('/field-templates');
  }

  // Create field template
  async createFieldTemplate(data: { name: string; label: string; description: string; category: string; field_ids: number[] }): Promise<{ id: number; message: string }> {
    return this.makeRequest('/field-templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Apply field template to blueprint
  async applyTemplateToBlueprint(blueprintId: number, templateId: number): Promise<{ message: string; fields_added: number }> {
    return this.makeRequest(`/blueprints/${blueprintId}/apply-template/${templateId}`, {
      method: 'POST',
    });
  }
}

// Export singleton instance
export const floraFieldsAPI = new FloraFieldsAPI();

// Export types
export type { 
  FieldBlueprint, 
  CreateBlueprintData,
  BlueprintField,
  CreateBlueprintFieldData,
  BlueprintAssignment,
  CreateBlueprintAssignmentData,
  StandaloneField,
  CreateStandaloneFieldData,
  FieldTemplate
};