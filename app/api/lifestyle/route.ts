import { NextResponse } from 'next/server';
import { platformStore } from '@/lib/data/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (isSupabaseConfigured()) {
    let query = supabase.from('articles').select('*').eq('category', 'beauty_fashion');
    if (slug) query = query.eq('slug', slug);
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(slug ? data[0] : data);
  }

  if (slug) {
    const art = platformStore.getArticleBySlug(slug);
    if (!art) return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    return NextResponse.json(art);
  }

  const articles = platformStore.getArticles('beauty_fashion');
  return NextResponse.json(articles);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.title || !body.slug) {
      return NextResponse.json({ error: 'Title and slug required' }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('articles').upsert(body).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data);
    }

    const saved = platformStore.saveArticle(body);
    return NextResponse.json(saved);
  } catch (err: unknown) {
    const errorObj = err as Error;
    return NextResponse.json({ error: errorObj?.message || 'Server error' }, { status: 500 });
  }
}
