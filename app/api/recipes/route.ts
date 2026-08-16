import { NextResponse } from 'next/server';
import { platformStore } from '@/lib/data/store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  if (slug) {
    const recipe = platformStore.getRecipeBySlug(slug);
    if (!recipe) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: recipe });
  }
  const recipes = platformStore.getRecipes();
  return NextResponse.json({ success: true, count: recipes.length, data: recipes });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const saved = platformStore.saveRecipe(body);
    return NextResponse.json({ success: true, data: saved });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Failed to save recipe' }, { status: 500 });
  }
}
