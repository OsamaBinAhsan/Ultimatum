import { NextResponse } from 'next/server';
import { platformStore } from '@/lib/data/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const category = searchParams.get('category');

  if (isSupabaseConfigured()) {
    let query = supabase.from('articles').select('*').neq('category', 'beauty_fashion');
    if (category) query = query.eq('category', category);
    if (slug) query = query.eq('slug', slug);
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(slug ? data[0] : data);
  }

  if (slug) {
    const art = platformStore.getArticleBySlug(slug);
    if (!art) return NextResponse.json({ error: 'News story not found' }, { status: 404 });
    return NextResponse.json(art);
  }

  let articles = platformStore.getArticles().filter((a) => a.category !== 'beauty_fashion');
  if (category) {
    articles = articles.filter((a) => a.category === category);
  }
  return NextResponse.json(articles);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.title || !body.slug) {
      return NextResponse.json({ error: 'Headline and slug required' }, { status: 400 });
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
