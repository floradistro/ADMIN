import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { constructImageUrl, logEnvironmentInfo } from '@/lib/url-utils';
import { getRemoveBgApiKey, debugEnvironment } from '@/lib/api-keys';

const REMOVE_BG_API_URL = 'https://api.remove.bg/v1.0/removebg';

export async function POST(request: NextRequest) {
  try {
    // TEMPORARY: Skip session check for development (matching disabled middleware)
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('No session found for remove.bg API request - bypassing for development');
      // Continue without session for development
    } else {
      console.log('Remove.bg API request authenticated for user:', session.user?.email);
    }

    const body = await request.json();
    const { imageUrls, quality = 'auto' } = body;
    
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No image URLs provided' },
        { status: 400 }
      );
    }

    console.log('=== REMOVE.BG PROPER API ===');
    console.log('Processing', imageUrls.length, 'images with quality:', quality);
    debugEnvironment();
    logEnvironmentInfo();
    
    const REMOVE_BG_API_KEY = getRemoveBgApiKey();
    if (REMOVE_BG_API_KEY === 'MISSING_API_KEY') {
      return NextResponse.json(
        { success: false, error: 'Remove.bg API key is not configured. Please check environment variables.' },
        { status: 500 }
      );
    }

    const results = [];
    const errors = [];

    for (const imageUrl of imageUrls) {
      try {
        console.log('Processing image:', imageUrl);

        // Construct full URL for the image
        const fullImageUrl = constructImageUrl(imageUrl);
        console.log('Processing image:', imageUrl, '->', fullImageUrl);
        
        const imageResponse = await fetch(fullImageUrl);

        if (!imageResponse.ok) {
          console.error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
          console.error(`Original URL: ${imageUrl}`);
          console.error(`Full URL: ${fullImageUrl}`);
          console.error(`Response headers:`, Object.fromEntries(imageResponse.headers.entries()));
          throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText} - ${fullImageUrl}`);
        }

        const imageBlob = await imageResponse.blob();
        console.log('Image fetched, size:', imageBlob.size, 'bytes, type:', imageBlob.type);

        // Create FormData for multipart/form-data request
        const formData = new FormData();
        
        // Add the image file
        formData.append('image_file', imageBlob, 'image.jpg');
        
        // Set parameters for best results with product/cannabis images
        formData.append('size', quality); // 'auto', 'preview', 'full', or '50MP'
        formData.append('type', 'product'); // Specifically for product images
        formData.append('type_level', '2'); // More specific classification
        formData.append('format', 'png'); // PNG with transparency
        formData.append('channels', 'rgba'); // Full RGBA channels
        formData.append('semitransparency', 'true'); // Keep semi-transparent regions
        formData.append('crop', 'false'); // Don't crop
        
        // Optional: Add a subtle shadow for products
        formData.append('shadow_type', 'drop');
        formData.append('shadow_opacity', '30');

        // Call remove.bg API with proper multipart/form-data
        const removeBgResponse = await fetch(REMOVE_BG_API_URL, {
          method: 'POST',
          headers: {
            'X-Api-Key': REMOVE_BG_API_KEY,
            // Don't set Content-Type - let fetch set it with boundary
          },
          body: formData,
        });

        // Log response headers for debugging
        const responseHeaders = {
          'x-type': removeBgResponse.headers.get('x-type'),
          'x-credits-charged': removeBgResponse.headers.get('x-credits-charged'),
          'x-width': removeBgResponse.headers.get('x-width'),
          'x-height': removeBgResponse.headers.get('x-height'),
          'x-foreground-top': removeBgResponse.headers.get('x-foreground-top'),
          'x-foreground-left': removeBgResponse.headers.get('x-foreground-left'),
          'x-foreground-width': removeBgResponse.headers.get('x-foreground-width'),
          'x-foreground-height': removeBgResponse.headers.get('x-foreground-height'),
        };
        
        console.log('Remove.bg response headers:', responseHeaders);

        if (!removeBgResponse.ok) {
          const errorText = await removeBgResponse.text();
          console.error('Remove.bg API error:', errorText);
          throw new Error(`Remove.bg API error: ${removeBgResponse.status} - ${errorText}`);
        }

        // Get the processed image
        const processedImageBuffer = await removeBgResponse.arrayBuffer();
        console.log('Processed image size:', processedImageBuffer.byteLength, 'bytes');
        
        // Convert to base64 for easy handling
        const base64Image = Buffer.from(processedImageBuffer).toString('base64');
        const dataUrl = `data:image/png;base64,${base64Image}`;

        // Extract filename from URL for the processed version
        const originalFilename = imageUrl.split('/').pop() || 'image';
        const nameWithoutExt = originalFilename.split('.')[0];
        const processedFilename = `${nameWithoutExt}_no_bg.png`;

        results.push({
          originalUrl: imageUrl,
          processedDataUrl: dataUrl,
          processedFilename: processedFilename,
          success: true,
          detectedType: responseHeaders['x-type'],
          creditsCharged: responseHeaders['x-credits-charged'],
          dimensions: {
            width: responseHeaders['x-width'],
            height: responseHeaders['x-height'],
            foreground: {
              top: responseHeaders['x-foreground-top'],
              left: responseHeaders['x-foreground-left'],
              width: responseHeaders['x-foreground-width'],
              height: responseHeaders['x-foreground-height'],
            }
          }
        });

        console.log(`Successfully processed: ${originalFilename} -> ${processedFilename}`);
        console.log(`Detected type: ${responseHeaders['x-type']}, Credits charged: ${responseHeaders['x-credits-charged']}`);

      } catch (error) {
        console.error(`Error processing ${imageUrl}:`, error);
        errors.push({
          imageUrl,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`Background removal completed. Success: ${results.length}, Errors: ${errors.length}`);

    // Check remaining credits
    try {
      const accountResponse = await fetch('https://api.remove.bg/v1.0/account', {
        headers: {
          'X-Api-Key': REMOVE_BG_API_KEY,
        }
      });
      
      if (accountResponse.ok) {
        const accountData = await accountResponse.json();
        console.log('Remaining credits:', accountData.data?.attributes?.credits);
      }
    } catch (error) {
      console.error('Failed to check account balance:', error);
    }

    return NextResponse.json({
      success: true,
      data: {
        processed: results,
        errors: errors,
        total: imageUrls.length,
        successCount: results.length,
        errorCount: errors.length
      }
    });

  } catch (error) {
    console.error('Remove background API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process background removal'
      },
      { status: 500 }
    );
  }
}
