import { NextResponse } from 'next/server';
import { platformStore } from '@/lib/data/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (isSupabaseConfigured()) {
    if (slug) {
      const { data, error } = await supabase.from('recipes').select('*').eq('slug', slug).single();
      if (!error && data) return NextResponse.json({ success: true, data });
    } else {
      const { data, error } = await supabase.from('recipes').select('*').order('created_at', { ascending: false });
      if (!error && data) return NextResponse.json({ success: true, count: data.length, data });
    }
  }

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
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('recipes').upsert([body]).select().single();
      if (!error && data) {
        platformStore.saveRecipe(data);
        return NextResponse.json({ success: true, data });
      }
    }

    const saved = platformStore.saveRecipe(body);
    return NextResponse.json({ success: true, data: saved });
  } catch (err: unknown) {
    const errorObj = err as Error;
    return NextResponse.json({ success: false, error: errorObj.message || 'Failed to save recipe' }, { status: 500 });
  }
}
