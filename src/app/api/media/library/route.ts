import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getWordPressCredentials } from '@/lib/api-keys';
import { fetchWordPressMedia } from '@/lib/wp-media-client';

interface WooCommerceMedia {
  id: number;
  date: string;
  date_gmt: string;
  guid: {
    rendered: string;
  };
  modified: string;
  modified_gmt: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  author: number;
  comment_status: string;
  ping_status: string;
  template: string;
  meta: any[];
  description: {
    rendered: string;
  };
  caption: {
    rendered: string;
  };
  alt_text: string;
  media_type: string;
  mime_type: string;
  media_details: {
    width: number;
    height: number;
    file: string;
    filesize: number;
    sizes: {
      [key: string]: {
        file: string;
        width: number;
        height: number;
        filesize: number;
        mime_type: string;
        source_url: string;
      };
    };
  };
  post: number | null;
  source_url: string;
}

// NO LOCAL MEDIA - WordPress only!

export async function GET(request: NextRequest) {
  try {
    // Check authentication with more lenient handling
    const session = await getServerSession(authOptions);
    
    // In production, check for auth cookies if session is missing
    if (!session && process.env.NODE_ENV === 'production') {
      const cookies = request.headers.get('cookie');
      const hasAuthCookie = cookies?.includes('next-auth.session-token') || 
                            cookies?.includes('__Secure-next-auth.session-token');
      
      if (!hasAuthCookie) {
        console.log('[Media Library API] No auth cookie found in production');
        return NextResponse.json({
          success: false,
          media: [],
          pagination: {
            page: 1,
            per_page: 20,
            total: 0,
            total_pages: 0
          },
          error: 'Authentication required. Please log in.'
        }, { status: 401 });
      }
      // Continue if we have an auth cookie
      console.log('[Media Library API] Auth cookie found, continuing despite no session');
    } else if (!session && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({
        success: false,
        media: [],
        pagination: {
          page: 1,
          per_page: 20,
          total: 0,
          total_pages: 0
        },
        error: 'Authentication required. Please log in.'
      }, { status: 401 });
    }

    console.log('=== MEDIA LIBRARY FETCH ===');
    console.log('Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: !!process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      hasSession: !!session,
      requestUrl: request.url
    });

    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const perPage = searchParams.get('per_page') || '20';
    const search = searchParams.get('search') || '';
    const mediaType = searchParams.get('media_type') || 'image';

    // Get WordPress credentials from environment
    const { consumerKey: CONSUMER_KEY, consumerSecret: CONSUMER_SECRET, apiBase: FLORA_API_BASE } = getWordPressCredentials();
    
    console.log('WordPress Auth Check:', {
      hasConsumerKey: !!CONSUMER_KEY,
      hasConsumerSecret: !!CONSUMER_SECRET,
      apiBase: FLORA_API_BASE
    });

    if (!CONSUMER_KEY || !CONSUMER_SECRET) {
      console.error('Missing WordPress credentials in media library!');
      return NextResponse.json({
        success: false,
        media: [],
        pagination: {
          page: 1,
          per_page: parseInt(perPage),
          total: 0,
          total_pages: 0
        },
        error: 'WordPress credentials not configured'
      });
    }

    // Build query parameters
    const queryParams = new URLSearchParams({
      consumer_key: CONSUMER_KEY,
      consumer_secret: CONSUMER_SECRET,
      page,
      per_page: perPage,
      media_type: mediaType,
      orderby: 'date',
      order: 'desc'
    });

    if (search) {
      queryParams.append('search', search);
    }

    // Get WordPress media using the new client
    // Fetch ONLY WordPress media - NO LOCAL MEDIA
    let wpMedia: WooCommerceMedia[] = [];
    
    try {
      wpMedia = await fetchWordPressMedia({
        page: parseInt(page),
        perPage: parseInt(perPage),
        search,
        mediaType
      }) as WooCommerceMedia[];
      
      console.log('WordPress media fetched:', wpMedia.length, 'items');
    } catch (error) {
      console.error('WordPress media fetch error:', error);
      return NextResponse.json({
        success: false,
        media: [],
        pagination: {
          page: parseInt(page),
          per_page: parseInt(perPage),
          total: 0,
          total_pages: 0
        },
        error: 'Failed to fetch WordPress media'
      });
    }

    // Use ONLY WordPress media
    let filteredMedia = wpMedia;
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredMedia = wpMedia.filter(item => {
        const titleValue = item.title?.rendered || item.title || '';
        const title = (typeof titleValue === 'string' ? titleValue : '').toLowerCase();
        const altText = (item.alt_text || '').toLowerCase();
        return title.includes(searchTerm) || altText.includes(searchTerm);
      });
    }

    // Sort by date (newest first)
    filteredMedia.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // WordPress handles pagination, so use the full filtered media
    const paginatedMedia = filteredMedia;

    // Transform the media data to a more usable format
    const transformedMedia = paginatedMedia.map(item => ({
      id: item.id,
      title: item.title?.rendered || item.title || (item as any).slug || 'Untitled',
      alt_text: item.alt_text || '',
      source_url: item.source_url,
      mime_type: item.mime_type,
      date: item.date,
      media_details: {
        width: item.media_details?.width || 0,
        height: item.media_details?.height || 0,
        filesize: item.media_details?.filesize || 0,
        sizes: item.media_details?.sizes || {}
      },
      thumbnail: item.media_details?.sizes?.thumbnail?.source_url || item.source_url,
      medium: item.media_details?.sizes?.medium?.source_url || item.source_url,
      large: item.media_details?.sizes?.large?.source_url || item.source_url
    }));

    // Calculate pagination for combined media
    const totalCount = filteredMedia.length;
    const totalPages = Math.ceil(totalCount / parseInt(perPage));

    return NextResponse.json({
      success: true,
      media: transformedMedia,
      pagination: {
        page: parseInt(page),
        per_page: parseInt(perPage),
        total: totalCount,
        total_pages: totalPages
      },
      source: 'wordpress-only'
    });

  } catch (error) {
    console.error('Media library fetch error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
