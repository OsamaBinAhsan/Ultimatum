import { NextResponse } from 'next/server';
import { platformStore } from '@/lib/data/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { queryMySQL } from '@/lib/db/mysql';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  // 1. HostGator MySQL Database
  try {
    if (slug) {
      const mysqlRes = await queryMySQL('SELECT * FROM articles WHERE category = "beauty_fashion" AND slug = ? LIMIT 1', [slug]);
      if (mysqlRes && Array.isArray(mysqlRes) && mysqlRes.length > 0) {
        return NextResponse.json({ success: true, data: mysqlRes[0] });
      }
    } else {
      const mysqlRes = await queryMySQL('SELECT * FROM articles WHERE category = "beauty_fashion" ORDER BY published_at DESC');
      if (mysqlRes && Array.isArray(mysqlRes)) {
        return NextResponse.json({ success: true, count: mysqlRes.length, data: mysqlRes });
      }
    }
  } catch (err) {
    console.warn('MySQL lifestyle query skipped:', err);
  }

  // 2. Supabase Database
  if (isSupabaseConfigured()) {
    let query = supabase.from('articles').select('*').eq('category', 'beauty_fashion');
    if (slug) query = query.eq('slug', slug);
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data: slug ? data[0] : data });
  }

  // 3. Isomorphic Fallback Store
  if (slug) {
    const art = platformStore.getArticleBySlug(slug);
    if (!art) return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: art });
  }

  const articles = platformStore.getArticles('beauty_fashion');
  return NextResponse.json({ success: true, count: articles.length, data: articles });
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
      return NextResponse.json({ success: true, data });
    }

    const saved = platformStore.saveArticle(body);
    return NextResponse.json({ success: true, data: saved });
  } catch (err: unknown) {
    const errorObj = err as Error;
    return NextResponse.json({ error: errorObj?.message || 'Server error' }, { status: 500 });
  }
}
