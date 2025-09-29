/**
 * API Keys Management
 * Centralized handling of API keys with runtime loading for Vercel
 */

export function getRemoveBgApiKey(): string {
  // Runtime loading for Vercel deployment
  const key = process.env.REMOVE_BG_API_KEY || '';
  
  if (!key || key === 'MISSING_API_KEY') {
    console.error('REMOVE_BG_API_KEY is not set in environment variables');
    // Return a placeholder that will fail gracefully
    return 'MISSING_API_KEY';
  }
  
  return key;
}

export function getClipdropApiKey(): string {
  // Runtime loading for Vercel deployment
  const key = process.env.CLIPDROP_API_KEY || '';
  
  if (!key || key === 'MISSING_API_KEY') {
    console.error('CLIPDROP_API_KEY is not set in environment variables');
    // Return a placeholder that will fail gracefully
    return 'MISSING_API_KEY';
  }
  
  return key;
}

export function getWordPressCredentials() {
  const baseUrl = process.env.FLORA_API_BASE || process.env.WP_API_URL || 'https://api.floradistro.com';
  const credentials = {
    consumerKey: process.env.WP_CONSUMER_KEY || '',
    consumerSecret: process.env.WP_CONSUMER_SECRET || '',
    apiBase: baseUrl.endsWith('/wp-json') ? baseUrl : baseUrl.replace(/\/$/, '') + '/wp-json'
  };
  
  // Log for debugging (only in development or with debug flag)
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_API_KEYS) {
    console.log('WordPress Credentials:', {
      hasConsumerKey: !!credentials.consumerKey,
      hasConsumerSecret: !!credentials.consumerSecret,
      consumerKeyLength: credentials.consumerKey.length,
      consumerSecretLength: credentials.consumerSecret.length,
      apiBase: credentials.apiBase
    });
  }
  
  return credentials;
}

export function getFloraApiBase(): string {
  return process.env.FLORA_API_BASE || 'https://api.floradistro.com';
}

export function debugEnvironment() {
  console.log('=== ENVIRONMENT DEBUG ===');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('VERCEL:', !!process.env.VERCEL);
  console.log('VERCEL_ENV:', process.env.VERCEL_ENV);
  console.log('Has REMOVE_BG_API_KEY:', !!process.env.REMOVE_BG_API_KEY);
  console.log('Has CLIPDROP_API_KEY:', !!process.env.CLIPDROP_API_KEY);
  console.log('Has WP_CONSUMER_KEY:', !!process.env.WP_CONSUMER_KEY);
  console.log('Has WP_CONSUMER_SECRET:', !!process.env.WP_CONSUMER_SECRET);
}
