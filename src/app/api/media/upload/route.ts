import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getWordPressCredentials } from '@/lib/api-keys';
import { uploadToWordPress } from '@/lib/wp-media-client';

export async function POST(request: NextRequest) {
  try {
    // Check authentication with more lenient handling
    const session = await getServerSession(authOptions);
    
    // In production, check for auth cookies if session is missing
    if (!session && process.env.NODE_ENV === 'production') {
      const cookies = request.headers.get('cookie');
      const hasAuthCookie = cookies?.includes('next-auth.session-token') || 
                            cookies?.includes('__Secure-next-auth.session-token');
      
      if (!hasAuthCookie) {
        console.log('[Media Upload API] No auth cookie found in production');
        return NextResponse.json({
          success: false,
          error: 'Authentication required. Please log in.'
        }, { status: 401 });
      }
      // Continue if we have an auth cookie
      console.log('[Media Upload API] Auth cookie found, continuing despite no session');
    } else if (!session && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({
        success: false,
        error: 'Authentication required. Please log in.'
      }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    console.log('=== MEDIA UPLOAD DEBUG ===');
    console.log('Uploading file:', file.name, file.type, file.size);
    console.log('Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: !!process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV
    });
    
    const { consumerKey: CONSUMER_KEY, consumerSecret: CONSUMER_SECRET, apiBase: FLORA_API_BASE } = getWordPressCredentials();
    
    console.log('WordPress Auth Check:', {
      hasConsumerKey: !!CONSUMER_KEY,
      hasConsumerSecret: !!CONSUMER_SECRET,
      consumerKeyLength: CONSUMER_KEY?.length || 0,
      consumerSecretLength: CONSUMER_SECRET?.length || 0,
      apiBase: FLORA_API_BASE
    });
    
    if (!CONSUMER_KEY || !CONSUMER_SECRET) {
      console.error('Missing WordPress credentials!');
      console.error('CONSUMER_KEY length:', CONSUMER_KEY?.length || 0);
      console.error('CONSUMER_SECRET length:', CONSUMER_SECRET?.length || 0);
      console.error('Raw env check:', {
        WP_CONSUMER_KEY: process.env.WP_CONSUMER_KEY?.length || 0,
        WP_CONSUMER_SECRET: process.env.WP_CONSUMER_SECRET?.length || 0
      });
      return NextResponse.json(
        { 
          success: false, 
          error: 'WordPress credentials not configured. Please check environment variables.',
          debug: {
            hasConsumerKey: !!CONSUMER_KEY,
            hasConsumerSecret: !!CONSUMER_SECRET,
            consumerKeyLength: CONSUMER_KEY?.length || 0,
            consumerSecretLength: CONSUMER_SECRET?.length || 0
          }
        },
        { status: 500 }
      );
    }

    // Convert file to buffer for WordPress upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload ONLY to WordPress Media Library - NO LOCAL STORAGE
    console.log('Uploading to WordPress Media Library...');
    
    try {
      // Try Flora IM API first
      const uploadResult = await uploadToWordPress(buffer, file.name, file.type);
      
      if (uploadResult.success) {
        const wpMediaData = uploadResult.data;
        console.log('WordPress upload successful:', wpMediaData.id, wpMediaData.source_url);
        console.log('Authentication method used:', uploadResult.method);

        // Return WordPress media data
        const mediaData = {
          id: wpMediaData.id,
          title: wpMediaData.title.rendered || wpMediaData.title,
          source_url: wpMediaData.source_url,
          mime_type: wpMediaData.mime_type,
          date: wpMediaData.date,
          alt_text: wpMediaData.alt_text,
          media_details: wpMediaData.media_details
        };

        console.log('Upload successful: WordPress ONLY', mediaData);

        return NextResponse.json({
          success: true,
          data: {
            id: mediaData.id,
            title: mediaData.title,
            url: mediaData.source_url,
            source_url: mediaData.source_url,
            mime_type: mediaData.mime_type,
            date: mediaData.date,
            media_details: mediaData.media_details,
            uploadedTo: 'wordpress'
          }
        });
      } else {
        console.error('Flora IM upload failed, trying direct WordPress API...');
        
        // Fallback: Try direct WordPress API with consumer keys
        const formData = new FormData();
        formData.append('file', new Blob([buffer], { type: file.type }), file.name);
        formData.append('title', file.name.replace(/\.[^/.]+$/, ''));
        formData.append('alt_text', file.name.replace(/\.[^/.]+$/, ''));
        
        const directUrl = `${FLORA_API_BASE}/wp/v2/media?consumer_key=${encodeURIComponent(CONSUMER_KEY)}&consumer_secret=${encodeURIComponent(CONSUMER_SECRET)}`;
        
        const directResponse = await fetch(directUrl, {
          method: 'POST',
          body: formData
        });
        
        if (directResponse.ok) {
          const directData = await directResponse.json();
          console.log('Direct WordPress API upload successful:', directData);
          
          return NextResponse.json({
            success: true,
            data: {
              id: directData.id,
              title: directData.title?.rendered || directData.title,
              url: directData.source_url,
              source_url: directData.source_url,
              mime_type: directData.mime_type,
              date: directData.date,
              media_details: directData.media_details,
              uploadedTo: 'wordpress-direct'
            }
          });
        } else {
          const errorText = await directResponse.text();
          console.error('Direct WordPress API also failed:', directResponse.status, errorText);
          
          return NextResponse.json({
            success: false,
            error: `All upload methods failed. Flora IM: ${uploadResult.error}. Direct API: ${directResponse.status} - ${errorText}`,
            debug: {
              hasConsumerKey: !!CONSUMER_KEY,
              hasConsumerSecret: !!CONSUMER_SECRET,
              apiBase: FLORA_API_BASE,
              floraImError: uploadResult.error
            }
          }, { status: 500 });
        }
      }
    } catch (error) {
      console.error('WordPress upload error:', error);
      return NextResponse.json({
        success: false,
        error: `WordPress upload error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        debug: {
          hasConsumerKey: !!CONSUMER_KEY,
          hasConsumerSecret: !!CONSUMER_SECRET,
          apiBase: FLORA_API_BASE,
          error: error instanceof Error ? error.message : String(error)
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Media upload error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      },
      { status: 500 }
    );
  }
}