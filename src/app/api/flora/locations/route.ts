import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const FLORA_API_URL = 'https://api.floradistro.com';
const WC_CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const WC_CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';


export async function GET(request: NextRequest) {
  try {
    // TODO: Re-enable authentication in production
    // For development, bypass auth to allow locations to load
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Call the Flora IM plugin API with cache busting always enabled
    const url = `${FLORA_API_URL}/wp-json/flora-im/v1/locations?consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}&_t=${Date.now()}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      // Always use no-store to avoid any caching
      cache: 'no-store',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `Failed to fetch locations: ${response.status}` }, { status: response.status });
    }

    let floraLocations = await response.json();
    
    // Also fetch custom locations created via WordPress
    try {
      const customLocations = await getCustomLocations();
      
      // Combine Flora locations with custom locations
      const allLocations = [...floraLocations, ...customLocations];
      
      return NextResponse.json({
        success: true,
        data: allLocations
      }, {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    } catch (customError) {
      console.log('Error fetching custom locations:', customError);
      // Return just Flora locations if custom locations fail
      return NextResponse.json({
        success: true,
        data: floraLocations
      }, {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }
  } catch (error) {
    console.error('Error fetching locations from Flora API:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch locations from Flora API',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Creating location via Flora IM API:', body);

    // Use the proper Flora IM API to create locations
    return await createFloraIMLocation(body);
  } catch (error) {
    console.error('Error creating location:', error);
    return NextResponse.json({ 
      error: 'Failed to create location',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Get custom locations created via WordPress
async function getCustomLocations() {
  try {
    const customLocations = [];
    
    // REMOVED: Legacy WooCommerce shipping zones that created invalid location IDs
    // These fake locations with IDs like 'wc_zone_3' were causing tax API failures
    // All locations should now be real Flora IM locations with proper numeric IDs
    console.log('Legacy WooCommerce shipping zones removed - using only real Flora IM locations');
    
    // Also try to get locations from WordPress posts with flora_location_type meta
    try {
      const postsResponse = await fetch('https://api.floradistro.com/wp-json/wp/v2/posts?meta_key=flora_location_type&meta_value=location', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString('base64')}`
        }
      });
      
      if (postsResponse.ok) {
        const posts = await postsResponse.json();
        console.log('Found WordPress location posts:', posts.length);
        
        // Transform posts to location format
        for (const post of posts) {
          customLocations.push({
            id: `wp_post_${post.id}`,
            name: post.title?.rendered || 'Unnamed Location',
            phone: post.meta?.flora_location_phone || '',
            email: post.meta?.flora_location_email || '',
            description: post.content?.rendered || post.meta?.flora_location_description || '',
            address_line_1: post.meta?.flora_location_address_1 || '',
            address_line_2: post.meta?.flora_location_address_2 || '',
            city: post.meta?.flora_location_city || '',
            state: post.meta?.flora_location_state || '',
            postal_code: post.meta?.flora_location_postal_code || '',
            country: post.meta?.flora_location_country || 'US',
            is_active: post.meta?.flora_location_is_active || '1',
            is_default: post.meta?.flora_location_is_default || '0',
            priority: parseInt(post.meta?.flora_location_priority || '0'),
            status: post.meta?.flora_location_status || 'active',
            created_at: post.date,
            updated_at: post.modified,
            source: 'wp_post'
          });
        }
      }
    } catch (error) {
      console.log('Failed to fetch WordPress location posts:', error);
    }
    
    console.log(`Found ${customLocations.length} custom locations total`);
    return customLocations;
  } catch (error) {
    console.error('Error fetching custom locations:', error);
    return [];
  }
}

// Create location using proper Flora IM API
async function createFloraIMLocation(locationData: any) {
  try {
    console.log('Creating location via Flora IM API:', locationData);
    
    // Use the proper Flora IM location creation API
    const floraUrl = 'https://api.floradistro.com/wp-json/flora-im/v1/locations';
    const urlParams = new URLSearchParams({
      consumer_key: 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5',
      consumer_secret: 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678'
    });

    const floraResponse = await fetch(`${floraUrl}?${urlParams.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: JSON.stringify({
        name: locationData.name,
        description: locationData.description || '',
        address_line_1: locationData.address_line_1 || '',
        address_line_2: locationData.address_line_2 || '',
        city: locationData.city || '',
        state: locationData.state || '',
        postal_code: locationData.postal_code || '',
        country: locationData.country || 'US',
        phone: locationData.phone || '',
        email: locationData.email || '',
        is_active: locationData.is_active || '1',
        is_default: locationData.is_default || '0',
        priority: locationData.priority || 0,
        status: locationData.status || 'active'
      }),
      cache: 'no-store'
    });

    if (!floraResponse.ok) {
      const errorText = await floraResponse.text();
      console.error('Flora IM API error:', floraResponse.status, errorText);
      throw new Error(`Flora IM API error: ${floraResponse.status} - ${errorText}`);
    }

    const floraData = await floraResponse.json();
    console.log('Flora IM location creation successful:', floraData);

    return NextResponse.json({
      success: true,
      data: floraData,
      message: 'Location created successfully via Flora IM API'
    }, { 
      status: 201,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Flora IM location creation failed:', error);
    throw error;
  }
}