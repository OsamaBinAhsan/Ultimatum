import { NextResponse } from 'next/server';
import { platformStore } from '@/lib/data/store';
import { querySQLServer } from '@/lib/db/sqlserver';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const category = searchParams.get('category');
  const status = searchParams.get('status');

  // Trigger any due scheduled articles to auto-publish
  platformStore.autoPublishScheduled();

  // 1. SQL Server Database
  try {
    if (slug) {
      const dbRes = (await querySQLServer('SELECT TOP 1 * FROM [articles] WHERE [slug] = ?', [slug])) as any[];
      if (dbRes && Array.isArray(dbRes) && dbRes.length > 0) {
        return NextResponse.json({ success: true, data: dbRes[0] });
      }
    } else {
      let query = 'SELECT * FROM [articles] WHERE 1=1';
      const params: any[] = [];
      if (category) {
        query += ' AND [category] = ?';
        params.push(category);
      }
      if (status === 'all') {
        // no status filter
      } else if (status) {
        query += ' AND [status] = ?';
        params.push(status);
      } else {
        // Public feed: only published or past scheduled
        query += " AND ([status] = 'published' OR [status] IS NULL OR ([status] = 'scheduled' AND [scheduled_for] <= GETUTCDATE()))";
      }
      query += ' ORDER BY [published_at] DESC, [created_at] DESC';
      const dbRes = (await querySQLServer(query, params)) as any[];
      if (dbRes && Array.isArray(dbRes) && dbRes.length > 0) {
        return NextResponse.json({ success: true, count: dbRes.length, data: dbRes });
      }
    }
  } catch (err) {
    console.warn('SQL Server news query skipped:', err);
  }

  // 2. Isomorphic Fallback Store
  if (slug) {
    const art = platformStore.getArticleBySlug(slug, status === 'all');
    if (!art) return NextResponse.json({ error: 'News story not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: art });
  }

  const articles = platformStore.getArticles(category || undefined, (status as any) || 'published');
  return NextResponse.json({ success: true, count: articles.length, data: articles });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.title || !body.slug) {
      return NextResponse.json({ error: 'Headline and slug required' }, { status: 400 });
    }

    const category = body.category || 'gaming_news';
    let status = body.status || 'published';
    let scheduled_for = body.scheduled_for || null;
    const postId = body.id || `art-${Date.now()}`;

    if (status === 'scheduled' && scheduled_for) {
      if (new Date(scheduled_for).getTime() <= Date.now()) {
        status = 'published';
      }
    }

    // 1. SQL Server Database Save
    try {
      await querySQLServer(
        `IF EXISTS (SELECT 1 FROM [articles] WHERE [id] = ? OR [slug] = ?)
         BEGIN
           UPDATE [articles]
           SET [slug] = ?, [title] = ?, [subtitle] = ?, [category] = ?, [hero_image_url] = ?,
               [gallery_images] = ?, [content] = ?, [tags] = ?, [author] = ?, [read_time] = ?,
               [is_breaking] = ?, [shoppable_items] = ?, [status] = ?, [scheduled_for] = ?, [updated_at] = GETUTCDATE()
           WHERE [id] = ? OR [slug] = ?
         END
         ELSE
         BEGIN
           INSERT INTO [articles] ([id], [slug], [title], [subtitle], [category], [hero_image_url], [gallery_images], [content], [tags], [author], [read_time], [is_breaking], [shoppable_items], [published_at], [created_at], [status], [scheduled_for], [updated_at])
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, GETUTCDATE())
         END`,
        [
          // IF EXISTS check
          postId, body.slug,
          // UPDATE
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
          status,
          scheduled_for,
          postId, body.slug,
          // INSERT
          postId,
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
    } catch (dbErr) {
      console.warn('SQL Server news article save skipped:', dbErr);
    }

    const saved = platformStore.saveArticle({ ...body, id: postId, category, status, scheduled_for });
    return NextResponse.json({ success: true, data: saved });
  } catch (err: unknown) {
    const errorObj = err as Error;
    return NextResponse.json({ error: errorObj?.message || 'Server error' }, { status: 500 });
  }
}
