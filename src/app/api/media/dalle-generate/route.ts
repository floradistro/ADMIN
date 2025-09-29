import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface DalleGenerateRequest {
  prompt: string;
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  n?: number;
}

interface DalleResponse {
  created: number;
  data: Array<{
    url: string;
    revised_prompt?: string;
  }>;
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const body: DalleGenerateRequest = await request.json();
    const { prompt, size = '1024x1024', quality = 'standard', style = 'vivid', n = 1 } = body;

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (prompt.trim().length > 4000) {
      return NextResponse.json(
        { success: false, error: 'Prompt must be 4000 characters or less' },
        { status: 400 }
      );
    }

    // Call OpenAI DALL-E API
    const openaiResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt.trim(),
        size,
        quality,
        style,
        n,
        response_format: 'url'
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));
      console.error('OpenAI API Error:', errorData);
      
      let errorMessage = 'Failed to generate image';
      if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      } else if (openaiResponse.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (openaiResponse.status === 400) {
        errorMessage = 'Invalid prompt or parameters';
      }

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: openaiResponse.status }
      );
    }

    const dalleData: DalleResponse = await openaiResponse.json();

    if (!dalleData.data || dalleData.data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No images generated' },
        { status: 500 }
      );
    }

    // Return the generated image URLs and metadata
    return NextResponse.json({
      success: true,
      images: dalleData.data.map((item, index) => ({
        url: item.url,
        revised_prompt: item.revised_prompt || prompt,
        original_prompt: prompt,
        size,
        quality,
        style,
        generated_at: new Date().toISOString(),
        index
      }))
    });

  } catch (error) {
    console.error('DALL-E generation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
