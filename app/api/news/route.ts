import { NextResponse } from 'next/server';
import { platformStore } from '@/lib/data/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { queryMySQL } from '@/lib/db/mysql';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const category = searchParams.get('category');
  const status = searchParams.get('status');

  // 1. HostGator MySQL Database
  try {
    if (slug) {
      const mysqlRes = await queryMySQL('SELECT * FROM articles WHERE slug = ? LIMIT 1', [slug]);
      if (mysqlRes && Array.isArray(mysqlRes) && mysqlRes.length > 0) {
        return NextResponse.json({ success: true, data: mysqlRes[0] });
      }
    } else {
      let query = 'SELECT * FROM articles WHERE 1=1';
      const params: any[] = [];
      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }
      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }
      query += ' ORDER BY published_at DESC, created_at DESC';
      const mysqlRes = await queryMySQL(query, params);
      if (mysqlRes && Array.isArray(mysqlRes)) {
        return NextResponse.json({ success: true, count: mysqlRes.length, data: mysqlRes });
      }
    }
  } catch (err) {
    console.warn('MySQL news query skipped:', err);
  }

  // 2. Supabase Database
  if (isSupabaseConfigured()) {
    let query = supabase.from('articles').select('*');
    if (category) query = query.eq('category', category);
    if (status) query = query.eq('status', status);
    if (slug) query = query.eq('slug', slug);
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data: slug ? data[0] : data });
  }

  // 3. Isomorphic Fallback Store
  if (slug) {
    const art = platformStore.getArticleBySlug(slug);
    if (!art) return NextResponse.json({ error: 'News story not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: art });
  }

  let articles = platformStore.getArticles();
  if (category) {
    articles = articles.filter((a) => a.category === category);
  }
  if (status) {
    articles = articles.filter((a) => (a.status || 'published') === status);
  }
  return NextResponse.json({ success: true, count: articles.length, data: articles });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.title || !body.slug) {
      return NextResponse.json({ error: 'Headline and slug required' }, { status: 400 });
    }

    const category = body.category || 'gaming_news';
    const status = body.status || 'published';
    const scheduled_for = body.scheduled_for || null;

    // 1. MySQL Database Save
    try {
      await queryMySQL(
        `INSERT INTO articles (id, slug, title, subtitle, category, hero_image_url, gallery_images, content, tags, author, read_time, is_breaking, shoppable_items, published_at, created_at, status, scheduled_for)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           slug = VALUES(slug),
           title = VALUES(title),
           subtitle = VALUES(subtitle),
           category = VALUES(category),
           hero_image_url = VALUES(hero_image_url),
           gallery_images = VALUES(gallery_images),
           content = VALUES(content),
           tags = VALUES(tags),
           author = VALUES(author),
           read_time = VALUES(read_time),
           is_breaking = VALUES(is_breaking),
           shoppable_items = VALUES(shoppable_items),
           status = VALUES(status),
           scheduled_for = VALUES(scheduled_for),
           updated_at = NOW()`,
        [
          body.id || `art-${Date.now()}`,
          body.slug,
          body.title,
          body.subtitle || '',
          category,
          body.hero_image_url || '',
          JSON.stringify(body.gallery_images || []),
          body.content || '',
          JSON.stringify(body.tags || []),
          body.author || 'Ultimatum Dispatch',
          body.read_time || 5,
          body.is_breaking ? 1 : 0,
          JSON.stringify(body.shoppable_items || []),
          body.published_at || new Date().toISOString(),
          body.created_at || new Date().toISOString(),
          status,
          scheduled_for,
        ]
      );
    } catch (mysqlErr) {
      console.warn('MySQL news article save skipped:', mysqlErr);
    }

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('articles')
        .upsert({ ...body, category, status, scheduled_for })
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, data });
    }

    const saved = platformStore.saveArticle({ ...body, category, status, scheduled_for });
    return NextResponse.json({ success: true, data: saved });
  } catch (err: unknown) {
    const errorObj = err as Error;
    return NextResponse.json({ error: errorObj?.message || 'Server error' }, { status: 500 });
  }
}
