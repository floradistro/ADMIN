/**
 * Utility functions for URL construction and handling
 */

/**
 * Constructs a full URL from a potentially relative image URL
 * Handles various deployment environments (localhost, Vercel, custom domains)
 */
export function constructImageUrl(imageUrl: string): string {
  // If it's already a full URL, return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // Determine base URL based on environment
  const baseUrl = getBaseUrl();
  
  // Handle relative URLs
  if (imageUrl.startsWith('/')) {
    return `${baseUrl}${imageUrl}`;
  } else {
    return `${baseUrl}/${imageUrl}`;
  }
}

/**
 * Gets the base URL for the current environment
 */
export function getBaseUrl(): string {
  // Priority order for environment variables
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // Fallback to localhost for development
  return 'http://localhost:3000';
}

/**
 * Logs environment information for debugging
 */
export function logEnvironmentInfo(): void {
  console.log('Environment debug:');
  console.log('- NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
  console.log('- VERCEL_URL:', process.env.VERCEL_URL);
  console.log('- NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- Base URL:', getBaseUrl());
}
