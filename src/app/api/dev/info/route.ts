import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
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

    console.log('=== DEVELOPER SYSTEM INFO ===');
    console.log('Requested by user:', session.user?.email);

    const systemInfo = {
      server: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: Math.floor(process.uptime()),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
        }
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isVercel: !!process.env.VERCEL,
        vercelUrl: process.env.VERCEL_URL,
        nextauthUrl: process.env.NEXTAUTH_URL ? '[SET]' : '[NOT SET]',
        wpApiUrl: process.env.WP_API_URL ? '[SET]' : '[NOT SET]',
        wpConsumerKey: process.env.WP_CONSUMER_KEY ? '[SET]' : '[NOT SET]',
        removeBgApiKey: process.env.REMOVE_BG_API_KEY ? '[SET]' : '[NOT SET]',
        clipdropApiKey: process.env.CLIPDROP_API_KEY ? '[SET]' : '[NOT SET]'
      },
      deployment: {
        timestamp: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: Intl.DateTimeFormat().resolvedOptions().locale
      },
      request: {
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        host: request.headers.get('host'),
        protocol: request.headers.get('x-forwarded-proto') || 'http'
      }
    };

    return NextResponse.json({
      success: true,
      data: systemInfo
    });

  } catch (error) {
    console.error('Developer system info error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'System info failed' 
      },
      { status: 500 }
    );
  }
}
