import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Supabase configuration - Use service role for admin operations
const supabaseUrl = 'https://elhsobjvwmjfminxxcwy.supabase.co';
// Service role key bypasses RLS - use for admin operations only
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsaHNvYmp2d21qZm1pbnh4Y3d5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDcwNDMzMCwiZXhwIjoyMDY2MjgwMzMwfQ.zGT1vOuLQZVjPG-KsjHXIQ80L7LmxKFaFeRRHo5X3y4';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(request: NextRequest) {
  try {
    console.log('Server: Starting COA file upload...');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: 'No file provided' 
      }, { status: 400 });
    }
    
    console.log('Server: Processing file:', file.name, file.type, file.size);
    
    // Validate file type
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ 
        success: false, 
        error: `${file.name} is not a PDF file` 
      }, { status: 400 });
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;
    const filePath = `pdfs/${fileName}`;
    
    console.log('Server: Uploading to path:', filePath);
    
    // Convert File to ArrayBuffer
    const fileBuffer = await file.arrayBuffer();
    
    const { data, error } = await supabase.storage
      .from('coas')
      .upload(filePath, fileBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'application/pdf'
      });
    
    if (error) {
      console.error('Server: Upload error:', error);
      return NextResponse.json({ 
        success: false, 
        error: `Failed to upload ${file.name}: ${error.message}`,
        details: error
      }, { status: 500 });
    }
    
    console.log('Server: Upload successful:', data);
    
    return NextResponse.json({ 
      success: true, 
      message: 'File uploaded successfully',
      data: {
        path: data.path,
        fileName: fileName,
        originalName: file.name,
        size: file.size
      }
    });
    
  } catch (error) {
    console.error('Server: Upload error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed',
      details: error
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST method for file upload' }, { status: 405 });
}
