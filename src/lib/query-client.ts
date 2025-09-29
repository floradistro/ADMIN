/**
 * TanStack Query Client Configuration
 * Centralized configuration for React Query with optimized defaults
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time - how long data is considered fresh
      staleTime: 5 * 60 * 1000, // 5 minutes

      // Garbage collection time - how long inactive data stays in cache
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)

      // Retry configuration
      retry: (failureCount, error) => {
        // Don't retry for 4xx errors (client errors)
        if (error instanceof Error) {
          const message = error.message.toLowerCase();
          if (message.includes('404') || message.includes('400') || message.includes('401') || message.includes('403')) {
            return false;
          }
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },

      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Background refetching
      refetchOnWindowFocus: false, // Disable refetch on window focus (can be annoying)
      refetchOnMount: true,        // Refetch when component mounts
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});
