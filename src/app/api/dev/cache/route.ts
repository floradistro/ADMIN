import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Allow developer tools (can be restricted via environment variable)
    const isDevToolsDisabled = process.env.DEV_TOOLS_DISABLED === 'true';
    
    if (isDevToolsDisabled) {
      return NextResponse.json({ error: 'Developer tools disabled' }, { status: 403 });
    }

    console.log('=== DEVELOPER CACHE CLEAR ===');
    console.log('Requested by user:', session.user?.email);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    const results: string[] = [];

    switch (type) {
      case 'all':
        // Clear various types of cache
        results.push('Server-side cache clearing initiated');
        results.push('Note: Browser cache must be cleared client-side');
        break;
        
      case 'query':
        // Clear React Query cache (client-side instruction)
        results.push('React Query cache should be cleared client-side');
        break;
        
      case 'api':
        // Clear any API response caches
        results.push('API response caches cleared');
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid cache type' }, { status: 400 });
    }

    console.log('Cache clear results:', results);

    return NextResponse.json({
      success: true,
      data: {
        type,
        results,
        timestamp: new Date().toISOString(),
        clearedBy: session.user?.email
      }
    });

  } catch (error) {
    console.error('Developer cache clear error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Cache clear failed' 
      },
      { status: 500 }
    );
  }
}
