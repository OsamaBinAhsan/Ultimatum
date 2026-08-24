import { NextResponse } from 'next/server';
import { platformStore } from '@/lib/data/store';
import { querySQLServer } from '@/lib/db/sqlserver';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  // 1. SQL Server Database
  try {
    if (slug) {
      const dbRes = await querySQLServer("SELECT TOP 1 * FROM [articles] WHERE [category] = 'beauty_fashion' AND [slug] = ?", [slug]);
      if (dbRes && Array.isArray(dbRes) && dbRes.length > 0) {
        return NextResponse.json({ success: true, data: dbRes[0] });
      }
    } else {
      const dbRes = await querySQLServer("SELECT * FROM [articles] WHERE [category] = 'beauty_fashion' ORDER BY [published_at] DESC");
      if (dbRes && Array.isArray(dbRes)) {
        return NextResponse.json({ success: true, count: dbRes.length, data: dbRes });
      }
    }
  } catch (err) {
    console.warn('SQL Server lifestyle query skipped:', err);
  }

  // 2. Isomorphic Fallback Store
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

    const postId = body.id || `art-${Date.now()}`;

    // 1. SQL Server Database Save
    try {
      await querySQLServer(
        `IF EXISTS (SELECT 1 FROM [articles] WHERE [id] = ? OR [slug] = ?)
         BEGIN
           UPDATE [articles]
           SET [slug] = ?, [title] = ?, [subtitle] = ?, [category] = 'beauty_fashion',
               [hero_image_url] = ?, [gallery_images] = ?, [content] = ?, [tags] = ?,
               [author] = ?, [read_time] = ?, [is_breaking] = ?, [shoppable_items] = ?,
               [updated_at] = GETUTCDATE()
           WHERE [id] = ? OR [slug] = ?
         END
         ELSE
         BEGIN
           INSERT INTO [articles] ([id], [slug], [title], [subtitle], [category], [hero_image_url], [gallery_images], [content], [tags], [author], [read_time], [is_breaking], [shoppable_items], [published_at], [created_at], [updated_at])
           VALUES (?, ?, ?, ?, 'beauty_fashion', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, GETUTCDATE())
         END`,
        [
          postId, body.slug,
          body.slug, body.title, body.subtitle || '', body.hero_image_url || '',
          JSON.stringify(body.gallery_images || []), body.content || '', JSON.stringify(body.tags || []),
          body.author || 'Ultimatum Beauty & Style Lab', body.read_time || 5, body.is_breaking ? 1 : 0,
          JSON.stringify(body.shoppable_items || []),
          postId, body.slug,
          postId, body.slug, body.title, body.subtitle || '', body.hero_image_url || '',
          JSON.stringify(body.gallery_images || []), body.content || '', JSON.stringify(body.tags || []),
          body.author || 'Ultimatum Beauty & Style Lab', body.read_time || 5, body.is_breaking ? 1 : 0,
          JSON.stringify(body.shoppable_items || []),
          body.published_at || new Date().toISOString(),
          body.created_at || new Date().toISOString()
        ]
      );
    } catch (dbErr) {
      console.warn('SQL Server lifestyle article save skipped:', dbErr);
    }

    const saved = platformStore.saveArticle({ ...body, id: postId, category: 'beauty_fashion' });
    return NextResponse.json({ success: true, data: saved });
  } catch (err: unknown) {
    const errorObj = err as Error;
    return NextResponse.json({ error: errorObj?.message || 'Server error' }, { status: 500 });
  }
}
