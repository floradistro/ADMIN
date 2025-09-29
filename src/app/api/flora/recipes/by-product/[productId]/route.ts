import { NextRequest, NextResponse } from 'next/server';

const FLORA_API_URL = 'https://api.floradistro.com/wp-json/fd/v1';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

function addAuthToUrl(url: string) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    
    // First, get the product to find its categories
    const productResponse = await fetch(addAuthToUrl(`https://api.floradistro.com/wp-json/wc/v3/products/${productId}`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!productResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch product: ${productResponse.statusText}` },
        { status: productResponse.status }
      );
    }

    const productData = await productResponse.json();
    
    if (!productData.categories || productData.categories.length === 0) {
      return NextResponse.json({ recipes: [] });
    }

    // Get recipes for each category
    const allRecipes = [];
    for (const category of productData.categories) {
      try {
        const recipesResponse = await fetch(addAuthToUrl(`${FLORA_API_URL}/recipes/by-category/${category.id}`), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (recipesResponse.ok) {
          const categoryRecipes = await recipesResponse.json();
          const recipes = categoryRecipes.recipes || categoryRecipes || [];
          allRecipes.push(...recipes);
        }
      } catch (categoryError) {
      }
    }
    
    // Remove duplicates by recipe ID
    const uniqueRecipes = allRecipes.filter((recipe, index, self) => 
      index === self.findIndex(r => r.id === recipe.id)
    );
    
    return NextResponse.json({ recipes: uniqueRecipes });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch recipes for product' },
      { status: 500 }
    );
  }
}