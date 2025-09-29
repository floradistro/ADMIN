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

export async function DELETE(request: NextRequest) {
  try {
    console.log('Server: Starting COA file deletion...');
    
    const { fileNames } = await request.json();
    
    if (!fileNames || !Array.isArray(fileNames) || fileNames.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No file names provided' 
      }, { status: 400 });
    }
    
    console.log('Server: Deleting files:', fileNames);
    
    // Prepare file paths for deletion
    const filesToDelete = fileNames.map(fileName => `pdfs/${fileName}`);
    
    const { data, error } = await supabase.storage
      .from('coas')
      .remove(filesToDelete);
    
    if (error) {
      console.error('Server: Delete error:', error);
      return NextResponse.json({ 
        success: false, 
        error: `Failed to delete files: ${error.message}`,
        details: error
      }, { status: 500 });
    }
    
    console.log('Server: Delete operation result:', data);
    
    // Check if any files failed to delete
    const results = data || [];
    // Supabase storage.remove() returns FileObject[] which may have error property
    const failedDeletes = results.filter((result: any) => result.error);
    const successfulDeletes = results.filter((result: any) => !result.error);
    
    if (failedDeletes.length > 0) {
      console.error('Server: Some files failed to delete:', failedDeletes);
      return NextResponse.json({ 
        success: false, 
        error: `Failed to delete ${failedDeletes.length} out of ${fileNames.length} files`,
        details: {
          successful: successfulDeletes.length,
          failed: failedDeletes.length,
          failures: failedDeletes
        }
      }, { status: 207 }); // 207 Multi-Status
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully deleted ${successfulDeletes.length} files`,
      data: {
        deletedCount: successfulDeletes.length,
        deletedFiles: successfulDeletes.map((result: any) => result.name)
      }
    });
    
  } catch (error) {
    console.error('Server: Delete error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Delete failed',
      details: error
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use DELETE method for file deletion' }, { status: 405 });
}
