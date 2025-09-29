import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check all environment variables
    const envCheck = {
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: !!process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV,
        VERCEL_URL: process.env.VERCEL_URL
      },
      wordpress: {
        hasConsumerKey: !!process.env.WP_CONSUMER_KEY,
        hasConsumerSecret: !!process.env.WP_CONSUMER_SECRET,
        consumerKeyLength: process.env.WP_CONSUMER_KEY?.length || 0,
        consumerSecretLength: process.env.WP_CONSUMER_SECRET?.length || 0,
        consumerKeyPrefix: process.env.WP_CONSUMER_KEY?.substring(0, 10) || 'MISSING',
        hasFloraApiBase: !!process.env.FLORA_API_BASE,
        floraApiBase: process.env.FLORA_API_BASE || 'MISSING'
      },
      aiServices: {
        hasRemoveBgKey: !!process.env.REMOVE_BG_API_KEY,
        removeBgKeyLength: process.env.REMOVE_BG_API_KEY?.length || 0,
        removeBgKeyPrefix: process.env.REMOVE_BG_API_KEY?.substring(0, 10) || 'MISSING',
        hasClipdropKey: !!process.env.CLIPDROP_API_KEY,
        clipdropKeyLength: process.env.CLIPDROP_API_KEY?.length || 0,
        clipdropKeyPrefix: process.env.CLIPDROP_API_KEY?.substring(0, 10) || 'MISSING'
      },
      nextauth: {
        hasUrl: !!process.env.NEXTAUTH_URL,
        hasSecret: !!process.env.NEXTAUTH_SECRET,
        url: process.env.NEXTAUTH_URL || 'MISSING'
      }
    };

    return NextResponse.json({
      success: true,
      message: 'Environment variables check',
      data: envCheck
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Environment check failed' 
      },
      { status: 500 }
    );
  }
}
