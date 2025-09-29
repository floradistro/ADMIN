/**
 * Location Query Hooks using TanStack Query
 * Provides cached, optimized data fetching for locations
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import type { FloraLocation, FloraApiResponse } from '../inventory-service';

// Query Keys
export const LOCATION_QUERY_KEYS = {
  all: ['locations'] as const,
  lists: () => [...LOCATION_QUERY_KEYS.all, 'list'] as const,
  list: (hierarchical?: boolean) => [...LOCATION_QUERY_KEYS.lists(), { hierarchical }] as const,
  details: () => [...LOCATION_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...LOCATION_QUERY_KEYS.details(), id] as const,
  hierarchy: () => [...LOCATION_QUERY_KEYS.all, 'hierarchy'] as const,
};

// API Service Functions
const locationService = {
  getLocations: async (hierarchical = false): Promise<FloraApiResponse<FloraLocation[]>> => {
    // Use Portal API endpoint for locations to ensure proper cache handling
    const endpoint = `/api/flora/locations${hierarchical ? '?hierarchical=true' : ''}`;
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch locations: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Handle both array response and success/data format
    const locations = Array.isArray(data) ? data : (data.data || []);
    
    const transformedLocations = locations
      .filter((loc: any) => {
        // Filter out invalid locations - must have valid numeric ID and name
        // Accept both string and numeric IDs as long as they convert to valid numbers
        const numericId = parseInt(loc.id);
        const hasValidId = loc.id && !isNaN(numericId) && numericId > 0;
        const hasValidName = loc.name && typeof loc.name === 'string' && loc.name.trim().length > 0;
        
        if (!hasValidId || !hasValidName) {
          console.log('Filtering out invalid location:', { id: loc.id, name: loc.name, numericId });
          return false;
        }
        
        return true;
      })
      .map((loc: any) => ({
        id: parseInt(loc.id),
        name: loc.name,
        slug: loc.slug || loc.name.toLowerCase().replace(/\s+/g, '-'),
        description: loc.description,
        address: loc.address,
        address_line_1: loc.address_line_1,
        address_line_2: loc.address_line_2,
        city: loc.city,
        state: loc.state,
        zip: loc.zip,
        postal_code: loc.postal_code,
        country: loc.country,
        phone: loc.phone,
        email: loc.email,
        manager_user_id: loc.manager_user_id ? parseInt(loc.manager_user_id) : undefined,
        is_active: loc.is_active,
        is_default: loc.is_default,
        priority: loc.priority,
        settings: loc.settings,
        created_at: loc.created_at,
        updated_at: loc.updated_at,
        status: loc.status,
        is_parent: loc.is_parent || false,
        parent_id: loc.parent_id,
        children: loc.children || []
      }));

    return {
      success: true,
      data: transformedLocations
    };
  },

  getLocation: async (id: number): Promise<FloraLocation> => {
    const response = await apiClient.get<FloraLocation>(ENDPOINTS.LOCATIONS.GET(id));
    return response.data;
  },

  getLocationHierarchy: async (): Promise<FloraApiResponse<FloraLocation[]>> => {
    return locationService.getLocations(true);
  },
};

// Query Hooks
export const useLocationsQuery = (
  hierarchical = false,
  options?: Omit<UseQueryOptions<FloraApiResponse<FloraLocation[]>, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: LOCATION_QUERY_KEYS.list(hierarchical),
    queryFn: () => locationService.getLocations(hierarchical),
    staleTime: 10 * 60 * 1000, // 10 minutes (locations change less frequently)
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    ...options,
  });
};

export const useLocationQuery = (
  id: number,
  options?: Omit<UseQueryOptions<FloraLocation, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: LOCATION_QUERY_KEYS.detail(id),
    queryFn: () => locationService.getLocation(id),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    enabled: !!id,
    ...options,
  });
};

export const useLocationHierarchyQuery = (
  options?: Omit<UseQueryOptions<FloraApiResponse<FloraLocation[]>, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: LOCATION_QUERY_KEYS.hierarchy(),
    queryFn: () => locationService.getLocationHierarchy(),
    staleTime: 15 * 60 * 1000, // 15 minutes (hierarchy changes even less frequently)
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    retry: 2,
    ...options,
  });
};
