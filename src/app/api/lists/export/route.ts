import { NextRequest, NextResponse } from 'next/server';
import { ProductList } from '@/types/lists';

export async function POST(request: NextRequest) {
  try {
    const { list, format } = await request.json();

    if (!list || !format) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Export is handled client-side using the ListExportService
    // This endpoint is for any server-side export needs
    
    return NextResponse.json({ 
      success: true,
      message: 'Export prepared'
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export list' },
      { status: 500 }
    );
  }
}

