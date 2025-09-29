import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Supabase configuration
const supabaseUrl = 'https://elhsobjvwmjfminxxcwy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsaHNvYmp2d21qZm1pbnh4Y3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDQzMzAsImV4cCI6MjA2NjI4MDMzMH0.sK5ggW0XxE_Y9x5dXQvq2IPbxo0WoQs3OcfXNhEbTyQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET() {
  try {
    console.log('Testing Supabase connection from server...');
    
    // Test basic connection
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Server: Failed to list buckets:', bucketsError);
      return NextResponse.json({ 
        success: false, 
        error: `Connection failed: ${bucketsError.message}`,
        details: bucketsError
      }, { status: 500 });
    }
    
    console.log('Server: Available buckets:', buckets);
    
    // Check if 'coas' bucket exists
    const coaBucket = buckets.find(bucket => bucket.name === 'coas');
    if (!coaBucket) {
      console.error('Server: COAs bucket not found');
      return NextResponse.json({ 
        success: false, 
        error: 'COAs bucket not found in Supabase storage',
        buckets: buckets.map(b => b.name)
      }, { status: 404 });
    }
    
    console.log('Server: COAs bucket found:', coaBucket);
    
    // Test bucket access
    const { data: bucketFiles, error: listError } = await supabase.storage
      .from('coas')
      .list('', { limit: 5 });
      
    if (listError) {
      console.error('Server: Failed to access COAs bucket:', listError);
      return NextResponse.json({ 
        success: false, 
        error: `Bucket access failed: ${listError.message}`,
        details: listError
      }, { status: 500 });
    }
    
    console.log('Server: Bucket access successful, sample files:', bucketFiles);
    
    // Test listing pdfs folder specifically
    const { data: pdfFiles, error: pdfError } = await supabase.storage
      .from('coas')
      .list('pdfs', { limit: 5 });
      
    if (pdfError) {
      console.error('Server: Failed to access pdfs folder:', pdfError);
      return NextResponse.json({ 
        success: false, 
        error: `PDFs folder access failed: ${pdfError.message}`,
        details: pdfError
      }, { status: 500 });
    }
    
    console.log('Server: PDFs folder access successful:', pdfFiles);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Supabase connection successful',
      data: {
        bucketsFound: buckets.length,
        coaBucketExists: true,
        rootFiles: bucketFiles?.length || 0,
        pdfFiles: pdfFiles?.length || 0,
        samplePdfFiles: pdfFiles?.slice(0, 3).map(f => ({
          name: f.name,
          size: f.metadata?.size,
          created: f.created_at
        }))
      }
    });
    
  } catch (error) {
    console.error('Server: Connection test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Connection test failed',
      details: error
    }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ message: 'Use GET method for connection test' }, { status: 405 });
}
