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

export async function GET() {
  try {
    console.log('=== TESTING SUPABASE PERMISSIONS ===');
    
    // 1. Test bucket listing
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    console.log('1. List buckets result:', { buckets, error: bucketsError });
    
    if (bucketsError) {
      return NextResponse.json({ 
        success: false, 
        step: 'list_buckets',
        error: bucketsError.message,
        details: bucketsError
      });
    }
    
    // 2. Test COA bucket access
    const { data: coaFiles, error: listError } = await supabase.storage
      .from('coas')
      .list('pdfs', { limit: 5 });
    console.log('2. List COA files result:', { files: coaFiles, error: listError });
    
    if (listError) {
      return NextResponse.json({ 
        success: false, 
        step: 'list_coa_files',
        error: listError.message,
        details: listError
      });
    }
    
    // 3. Test creating a small test file
    const testContent = 'test file content';
    const testFileName = `test_${Date.now()}.txt`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('coas')
      .upload(`pdfs/${testFileName}`, testContent, {
        contentType: 'text/plain'
      });
    console.log('3. Test upload result:', { data: uploadData, error: uploadError });
    
    if (uploadError) {
      return NextResponse.json({ 
        success: false, 
        step: 'test_upload',
        error: uploadError.message,
        details: uploadError,
        message: 'Upload permission denied - this indicates RLS policy issues'
      });
    }
    
    // 4. Test deleting the test file
    const { data: deleteData, error: deleteError } = await supabase.storage
      .from('coas')
      .remove([`pdfs/${testFileName}`]);
    console.log('4. Test delete result:', { data: deleteData, error: deleteError });
    
    if (deleteError) {
      return NextResponse.json({ 
        success: false, 
        step: 'test_delete',
        error: deleteError.message,
        details: deleteError,
        message: 'Delete permission denied - this indicates RLS policy issues'
      });
    }
    
    // 5. Verify file was actually deleted
    const { data: verifyFiles, error: verifyError } = await supabase.storage
      .from('coas')
      .list('pdfs', { limit: 1000 });
    console.log('5. Verify delete result:', { files: verifyFiles, error: verifyError });
    
    const fileStillExists = verifyFiles?.find(f => f.name === testFileName);
    
    if (fileStillExists) {
      return NextResponse.json({ 
        success: false, 
        step: 'verify_delete',
        error: 'File still exists after delete operation',
        message: 'Delete operation returned success but file was not actually deleted - RLS policy issue'
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'All permissions working correctly',
      data: {
        bucketsCount: buckets.length,
        coaFilesCount: coaFiles?.length || 0,
        testFileCreated: !!uploadData,
        testFileDeleted: true,
        permissions: {
          read: true,
          write: true,
          delete: true
        }
      }
    });
    
  } catch (error) {
    console.error('Permission test error:', error);
    return NextResponse.json({ 
      success: false, 
      step: 'general_error',
      error: error instanceof Error ? error.message : 'Permission test failed',
      details: error
    }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ message: 'Use GET method for permission test' }, { status: 405 });
}
