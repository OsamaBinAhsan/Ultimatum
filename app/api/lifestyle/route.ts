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

    // 1. MySQL Database Save
    try {
      await queryMySQL(
        `INSERT INTO articles (id, slug, title, subtitle, category, hero_image_url, gallery_images, content, tags, author, read_time, is_breaking, shoppable_items, published_at, created_at)
         VALUES (?, ?, ?, ?, 'beauty_fashion', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           slug = VALUES(slug),
           title = VALUES(title),
           subtitle = VALUES(subtitle),
           category = 'beauty_fashion',
           hero_image_url = VALUES(hero_image_url),
           gallery_images = VALUES(gallery_images),
           content = VALUES(content),
           tags = VALUES(tags),
           author = VALUES(author),
           read_time = VALUES(read_time),
           is_breaking = VALUES(is_breaking),
           shoppable_items = VALUES(shoppable_items),
           updated_at = NOW()`,
        [
          body.id || `art-${Date.now()}`,
          body.slug,
          body.title,
          body.subtitle || '',
          body.hero_image_url || '',
          JSON.stringify(body.gallery_images || []),
          body.content || '',
          JSON.stringify(body.tags || []),
          body.author || 'Ultimatum Beauty & Style Lab',
          body.read_time || 5,
          body.is_breaking ? 1 : 0,
          JSON.stringify(body.shoppable_items || []),
          body.published_at || new Date().toISOString(),
          body.created_at || new Date().toISOString(),
        ]
      );
    } catch (mysqlErr) {
      console.warn('MySQL lifestyle article save skipped:', mysqlErr);
    }

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('articles').upsert({ ...body, category: 'beauty_fashion' }).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, data });
    }

    const saved = platformStore.saveArticle({ ...body, category: 'beauty_fashion' });
    return NextResponse.json({ success: true, data: saved });
  } catch (err: unknown) {
    const errorObj = err as Error;
    return NextResponse.json({ error: errorObj?.message || 'Server error' }, { status: 500 });
  }
}
