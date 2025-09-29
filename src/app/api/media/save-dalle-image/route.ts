import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadToWordPress } from '@/lib/wp-media-client';

interface SaveDalleImageRequest {
  imageUrl: string;
  prompt: string;
  revisedPrompt?: string;
  size: string;
  quality: string;
  style: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication (allow in development)
    if (process.env.NODE_ENV !== 'development') {
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    const body: SaveDalleImageRequest = await request.json();
    const { imageUrl, prompt, revisedPrompt, size, quality, style } = body;

    if (!imageUrl || !prompt) {
      return NextResponse.json(
        { success: false, error: 'Image URL and prompt are required' },
        { status: 400 }
      );
    }

    // Download the image from DALL-E URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to download generated image');
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBlob = new Blob([imageBuffer], { type: 'image/png' });

    // Create a filename based on the prompt
    const sanitizedPrompt = prompt
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
    const timestamp = Date.now();
    const filename = `dalle_${sanitizedPrompt}_${timestamp}.png`;

    // Convert blob to buffer for WordPress upload (same as existing upload system)
    const buffer = Buffer.from(imageBuffer);

    console.log('Uploading DALL-E generated image to WordPress Media Library...');
    
    // Use the same upload system as the existing media upload
    const uploadResult = await uploadToWordPress(buffer, filename, 'image/png');
    
    if (!uploadResult.success) {
      console.error('WordPress upload failed:', uploadResult.error);
      throw new Error(uploadResult.error || 'WordPress upload failed');
    }

    const wpMediaData = uploadResult.data;
    console.log('DALL-E WordPress upload successful:', wpMediaData.id, wpMediaData.source_url);
    console.log('Authentication method used:', uploadResult.method);

    // Return WordPress media data in the same format as existing upload
    const mediaData = {
      id: wpMediaData.id,
      title: wpMediaData.title?.rendered || wpMediaData.title,
      source_url: wpMediaData.source_url,
      mime_type: wpMediaData.mime_type,
      date: wpMediaData.date,
      alt_text: wpMediaData.alt_text,
      media_details: wpMediaData.media_details,
      thumbnail: wpMediaData.media_details?.sizes?.thumbnail?.source_url || wpMediaData.source_url,
      medium: wpMediaData.media_details?.sizes?.medium?.source_url || wpMediaData.source_url,
      large: wpMediaData.media_details?.sizes?.large?.source_url || wpMediaData.source_url
    };

    return NextResponse.json({
      success: true,
      media: {
        ...mediaData,
        dalle_metadata: {
          original_prompt: prompt,
          revised_prompt: revisedPrompt,
          size,
          quality,
          style,
          generated_at: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Save DALL-E image error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save generated image' 
      },
      { status: 500 }
    );
  }
}
