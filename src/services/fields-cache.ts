import { fieldsService, FloraField } from './fields-service';

interface CacheEntry {
  data: FloraField[];
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let fieldCache: CacheEntry | null = null;

export const FieldsCache = {
  async getFieldLibrary(): Promise<FloraField[]> {
    // Check cache
    if (fieldCache && Date.now() - fieldCache.timestamp < CACHE_DURATION) {
      return fieldCache.data;
    }

    // Fetch fresh data
    try {
      const response = await fieldsService.getFieldLibrary();
      fieldCache = {
        data: response.fields,
        timestamp: Date.now()
      };
      return response.fields;
    } catch (error) {
      // If fetch fails and we have stale cache, return it
      if (fieldCache) {
        return fieldCache.data;
      }
      throw error;
    }
  },

  invalidate() {
    fieldCache = null;
  }
};

