/**
 * WordPress Media API Client
 * Handles authentication and media operations with WordPress
 */

import { getWordPressCredentials } from './api-keys';

export interface MediaUploadResult {
  success: boolean;
  data?: any;
  error?: string;
  method?: string;
}

export interface MediaDeleteResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Uploads media to WordPress via Flora IM Media API
 * Uses WooCommerce consumer keys for authentication
 */
export async function uploadToWordPress(
  file: Buffer,
  filename: string,
  mimeType: string
): Promise<MediaUploadResult> {
  const { consumerKey, consumerSecret, apiBase } = getWordPressCredentials();
  
  if (!consumerKey || !consumerSecret) {
    return {
      success: false,
      error: 'WooCommerce consumer keys not configured. Please set WP_CONSUMER_KEY and WP_CONSUMER_SECRET environment variables.'
    };
  }

  // Create FormData for Flora IM Media API upload
  const formData = new FormData();
  formData.append('file', new Blob([new Uint8Array(file)], { type: mimeType }), filename);
  formData.append('title', filename.replace(/\.[^/.]+$/, ''));
  formData.append('alt_text', filename.replace(/\.[^/.]+$/, ''));

  // Use Flora IM Media Upload API endpoint
  const uploadUrl = `${apiBase.replace('/wp-json', '')}/wp-json/flora-im/v1/media/upload`;
  const urlWithAuth = `${uploadUrl}?consumer_key=${encodeURIComponent(consumerKey)}&consumer_secret=${encodeURIComponent(consumerSecret)}`;

  try {
    console.log('Uploading to Flora IM Media API:', uploadUrl);
    
    const response = await fetch(urlWithAuth, {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Flora IM Media API upload successful:', result);
      
      if (result.success && result.attachment) {
        // Transform Flora IM response to match expected WordPress format
        const attachment = result.attachment;
        return {
          success: true,
          data: {
            id: attachment.id,
            title: { rendered: attachment.title },
            source_url: attachment.url,
            mime_type: attachment.mime_type,
            date: attachment.date,
            alt_text: attachment.alt_text,
            media_details: {
              width: attachment.width || 0,
              height: attachment.height || 0,
              filesize: attachment.file_size || 0,
              sizes: attachment.sizes || {}
            }
          },
          method: 'Flora IM Media API'
        };
      } else {
        return {
          success: false,
          error: `Flora IM upload failed: ${result.message || 'Unknown error'}`
        };
      }
    } else {
      const errorText = await response.text();
      console.error('Flora IM Media API upload failed:', response.status, errorText);
      return {
        success: false,
        error: `Flora IM Media API error: ${response.status} - ${errorText}`
      };
    }
  } catch (error) {
    console.error('Flora IM Media API upload error:', error);
    return {
      success: false,
      error: `Flora IM Media API error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Deletes media from WordPress via Flora IM Media API
 * Uses WooCommerce consumer keys for authentication
 */
export async function deleteFromWordPress(mediaId: number): Promise<MediaDeleteResult> {
  const { consumerKey, consumerSecret, apiBase } = getWordPressCredentials();
  
  if (!consumerKey || !consumerSecret) {
    return {
      success: false,
      error: 'WooCommerce consumer keys not configured for media deletion.'
    };
  }

  try {
    // Use Flora IM Media Delete API endpoint
    const deleteUrl = `${apiBase.replace('/wp-json', '')}/wp-json/flora-im/v1/media/${mediaId}`;
    const urlWithAuth = `${deleteUrl}?consumer_key=${encodeURIComponent(consumerKey)}&consumer_secret=${encodeURIComponent(consumerSecret)}&force=true`;

    console.log('Deleting from Flora IM Media API:', deleteUrl);
    
    const response = await fetch(urlWithAuth, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PORTAL-Admin/1.0'
      }
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Flora IM Media API delete successful:', result);
      
      if (result.success) {
        return {
          success: true,
          data: result
        };
      } else {
        return {
          success: false,
          error: `Flora IM delete failed: ${result.message || 'Unknown error'}`
        };
      }
    } else {
      const errorText = await response.text();
      console.error('Flora IM Media API delete failed:', response.status, errorText);
      
      // Fallback: Try direct WordPress API delete
      console.log('Trying direct WordPress API delete as fallback...');
      
      const directUrl = `${apiBase}/wp/v2/media/${mediaId}?force=true&consumer_key=${encodeURIComponent(consumerKey)}&consumer_secret=${encodeURIComponent(consumerSecret)}`;
      
      const directResponse = await fetch(directUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (directResponse.ok) {
        const directData = await directResponse.json();
        console.log('Direct WordPress API delete successful:', directData);
        return {
          success: true,
          data: directData
        };
      } else {
        const directErrorText = await directResponse.text();
        console.error('Direct WordPress API delete also failed:', directResponse.status, directErrorText);
        
        return {
          success: false,
          error: `Both Flora IM and direct WordPress API delete failed. Flora IM: ${response.status} - ${errorText}. Direct: ${directResponse.status} - ${directErrorText}`
        };
      }
    }
  } catch (error) {
    console.error('Flora IM Media API delete error:', error);
    return {
      success: false,
      error: `Flora IM Media API delete error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Fetches media from WordPress with authentication
 */
export async function fetchWordPressMedia(params: {
  page?: number;
  perPage?: number;
  search?: string;
  mediaType?: string;
}) {
  const { consumerKey, consumerSecret, apiBase } = getWordPressCredentials();
  
  if (!consumerKey || !consumerSecret) {
    console.error('WordPress credentials not configured for media fetch');
    return [];
  }

  const queryParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    per_page: (params.perPage || 20).toString(),
    media_type: params.mediaType || 'image',
    orderby: 'date',
    order: 'desc'
  });

  if (params.search) {
    queryParams.append('search', params.search);
  }

  // Add authentication to query params
  queryParams.append('consumer_key', consumerKey);
  queryParams.append('consumer_secret', consumerSecret);

  try {
    // Use Flora IM Media API endpoint
    const baseUrl = apiBase.endsWith('/wp-json') ? apiBase : `${apiBase}/wp-json`;
    const mediaUrl = `${baseUrl}/flora-im/v1/media`;
    const url = `${mediaUrl}?${queryParams.toString()}`;
    console.log('Fetching media from Flora IM API:', mediaUrl);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PORTAL-Admin/1.0'
      }
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Flora IM Media API fetch successful:', result);
      
      if (result.success && result.media) {
        // Transform Flora IM response to match WordPress format
        return result.media.map((item: any) => ({
          id: item.id,
          title: { rendered: item.title },
          source_url: item.url,
          mime_type: item.mime_type,
          date: item.date,
          alt_text: item.alt_text,
          media_details: {
            width: item.width || 0,
            height: item.height || 0,
            filesize: item.file_size || 0,
            sizes: item.sizes || {}
          }
        }));
      } else {
        console.warn('Flora IM Media API returned no media:', result);
        return [];
      }
    } else {
      const errorText = await response.text();
      console.error('Flora IM Media API fetch failed:', response.status, errorText);
      return [];
    }
  } catch (error) {
    console.error('WordPress media fetch error:', error);
    return [];
  }
}
