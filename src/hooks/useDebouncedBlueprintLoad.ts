import { useEffect, useRef } from 'react';

/**
 * Hook to debounce blueprint field loading
 * Prevents rapid successive API calls when multiple products are expanded quickly
 */
export function useDebouncedBlueprintLoad(
  loadFunction: () => Promise<void>,
  dependencies: any[],
  delay: number = 100
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        loadFunction();
      }
    }, delay);

    // Cleanup
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, dependencies);
}
