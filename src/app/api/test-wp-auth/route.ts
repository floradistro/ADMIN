import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Simple test to verify environment variables are loaded
  const wpConsumerKey = process.env.WP_CONSUMER_KEY;
  const wpConsumerSecret = process.env.WP_CONSUMER_SECRET;
  const wpApiUrl = process.env.WP_API_URL;
  
  return NextResponse.json({
    hasWpConsumerKey: !!wpConsumerKey,
    hasWpConsumerSecret: !!wpConsumerSecret,
    hasWpApiUrl: !!wpApiUrl,
    wpConsumerKeyLength: wpConsumerKey?.length || 0,
    wpConsumerSecretLength: wpConsumerSecret?.length || 0,
    wpApiUrl: wpApiUrl || 'MISSING',
    environment: {
      nodeEnv: process.env.NODE_ENV,
      vercel: !!process.env.VERCEL,
      vercelEnv: process.env.VERCEL_ENV
    }
  });
}
