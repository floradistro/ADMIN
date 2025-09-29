import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getWordPressCredentials } from '@/lib/api-keys';
import { deleteFromWordPress } from '@/lib/wp-media-client';

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication with more lenient handling
    const session = await getServerSession(authOptions);
    
    // In production, check for auth cookies if session is missing
    if (!session && process.env.NODE_ENV === 'production') {
      const cookies = request.headers.get('cookie');
      const hasAuthCookie = cookies?.includes('next-auth.session-token') || 
                            cookies?.includes('__Secure-next-auth.session-token');
      
      if (!hasAuthCookie) {
        console.log('[Media Delete API] No auth cookie found in production');
        return NextResponse.json({
          success: false,
          error: 'Authentication required. Please log in.'
        }, { status: 401 });
      }
      // Continue if we have an auth cookie
      console.log('[Media Delete API] Auth cookie found, continuing despite no session');
    } else if (!session && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({
        success: false,
        error: 'Authentication required. Please log in.'
      }, { status: 401 });
    }

    const { mediaIds } = await request.json();
    
    if (!mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No media IDs provided' },
        { status: 400 }
      );
    }

    console.log('=== MEDIA DELETE DEBUG ===');
    console.log('Attempting to delete WordPress media items:', mediaIds);
    
    const { consumerKey: CONSUMER_KEY, consumerSecret: CONSUMER_SECRET, apiBase: FLORA_API_BASE } = getWordPressCredentials();

    // Delete ONLY WordPress media - NO LOCAL FILES
    const results: any[] = [];
    
    const wpDeletePromises = mediaIds.map(async (mediaId: number) => {
      console.log(`Deleting WordPress media item: ${mediaId}`);
      
      try {
        const deleteResult = await deleteFromWordPress(mediaId);
        
        if (deleteResult.success) {
          console.log(`Successfully deleted WordPress media ${mediaId}`);
          return { id: mediaId, deleted: true, ...deleteResult.data };
        } else {
          throw new Error(deleteResult.error || 'Delete failed');
        }
      } catch (error) {
        console.error(`Error deleting WordPress media ${mediaId}:`, error);
        return { id: mediaId, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    const wpResults = await Promise.all(wpDeletePromises);
    results.push(...wpResults);

    const successfulDeletes = results.filter(r => !r.error);
    console.log(`Successfully deleted ${successfulDeletes.length} of ${results.length} WordPress media items`);

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: successfulDeletes.length,
        totalRequested: results.length,
        deletedItems: results
      }
    });

  } catch (error) {
    console.error('Media delete error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Delete failed' 
      },
      { status: 500 }
    );
  }
}
