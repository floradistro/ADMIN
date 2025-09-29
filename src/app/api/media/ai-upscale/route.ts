import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getClipdropApiKey, debugEnvironment } from '@/lib/api-keys';

const CLIPDROP_UPSCALE_URL = 'https://clipdrop-api.co/image-upscaling/v1/upscale';

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
        console.log('[AI Upscale API] No auth cookie found in production');
        return NextResponse.json({
          success: false,
          error: 'Authentication required. Please log in.'
        }, { status: 401 });
      }
      // Continue if we have an auth cookie
      console.log('[AI Upscale API] Auth cookie found, continuing despite no session');
    } else if (!session && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({
        success: false,
        error: 'Authentication required. Please log in.'
      }, { status: 401 });
    }

    const body = await request.json();
    const { imageUrl, targetWidth = 2048, targetHeight = 2048 } = body;
    
    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: 'No image URL provided' },
        { status: 400 }
      );
    }

    console.log('=== CLIPDROP AI UPSCALE ===');
    console.log('Processing image:', imageUrl);
    console.log('Target dimensions:', targetWidth, 'x', targetHeight);
    debugEnvironment();
    
    const CLIPDROP_API_KEY = getClipdropApiKey();
    if (CLIPDROP_API_KEY === 'MISSING_API_KEY') {
      return NextResponse.json(
        { success: false, error: 'Clipdrop API key is not configured. Please check environment variables.' },
        { status: 500 }
      );
    }

    try {
      // Handle both local Portal URLs and external URLs
      let imageResponse;
      let fullImageUrl = imageUrl;
      
      if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('/')) {
        // Local Portal image - construct full URL
        const baseUrl = process.env.NEXTAUTH_URL || 
                       (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
                       process.env.NEXT_PUBLIC_APP_URL ||
                       'http://localhost:3000';
        fullImageUrl = `${baseUrl}${imageUrl}`;
        console.log('Fetching local Portal image:', fullImageUrl);
      } else if (!imageUrl.startsWith('http')) {
        // Relative URL without leading slash
        const baseUrl = process.env.NEXTAUTH_URL || 
                       (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
                       process.env.NEXT_PUBLIC_APP_URL ||
                       'http://localhost:3000';
        fullImageUrl = `${baseUrl}/${imageUrl}`;
        console.log('Fetching relative image:', fullImageUrl);
      } else {
        // External URL (WordPress or other)
        console.log('Fetching external image:', fullImageUrl);
      }
      
      imageResponse = await fetch(fullImageUrl);

      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`);
      }

      const imageBlob = await imageResponse.blob();
      console.log('Image fetched, size:', imageBlob.size, 'bytes');

      // Create FormData for Clipdrop API
      const formData = new FormData();
      formData.append('image_file', imageBlob, 'image.jpg');
      formData.append('target_width', targetWidth.toString());
      formData.append('target_height', targetHeight.toString());

      // Call Clipdrop Upscale API
      const clipdropResponse = await fetch(CLIPDROP_UPSCALE_URL, {
        method: 'POST',
        headers: {
          'x-api-key': CLIPDROP_API_KEY,
        },
        body: formData,
      });

      if (!clipdropResponse.ok) {
        const errorText = await clipdropResponse.text();
        console.error('Clipdrop API error:', errorText);
        
        // Provide user-friendly error messages
        if (errorText.includes('image exceeds the maximum height') || errorText.includes('image exceeds the maximum width')) {
          throw new Error('Image is too large for AI Upscale. Please use an image smaller than the maximum allowed size.');
        } else if (errorText.includes('image_file')) {
          throw new Error('Invalid image format. Please use a standard image file (JPG, PNG).');
        } else {
          throw new Error(`AI Upscale failed: ${errorText}`);
        }
      }

      // Get the upscaled image
      const upscaledImageBuffer = await clipdropResponse.arrayBuffer();
      console.log('Upscaled image size:', upscaledImageBuffer.byteLength, 'bytes');
      
      // Convert to base64 for easy handling
      const base64Image = Buffer.from(upscaledImageBuffer).toString('base64');
      const dataUrl = `data:image/png;base64,${base64Image}`;

      // Extract filename from URL for the processed version
      const originalFilename = imageUrl.split('/').pop() || 'image';
      const nameWithoutExt = originalFilename.split('.')[0];
      const processedFilename = `${nameWithoutExt}_upscaled.png`;

      return NextResponse.json({
        success: true,
        data: {
          originalUrl: imageUrl,
          processedDataUrl: dataUrl,
          processedFilename: processedFilename,
          dimensions: {
            width: targetWidth,
            height: targetHeight
          }
        }
      });

    } catch (error) {
      console.error(`Error processing ${imageUrl}:`, error);
      throw error;
    }

  } catch (error) {
    console.error('AI Upscale error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upscale image'
      },
      { status: 500 }
    );
  }
}
