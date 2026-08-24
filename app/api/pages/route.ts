import { NextResponse } from 'next/server';
import { platformStore } from '@/lib/data/store';
import { querySQLServer } from '@/lib/db/sqlserver';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  // 1. SQL Server Database
  try {
    if (slug) {
      const dbRes = await querySQLServer('SELECT TOP 1 * FROM [pages] WHERE [slug] = ?', [slug]);
      if (dbRes && Array.isArray(dbRes) && dbRes.length > 0) {
        return NextResponse.json({ success: true, data: dbRes[0] });
      }
    } else {
      const dbRes = await querySQLServer('SELECT * FROM [pages] ORDER BY [created_at] DESC');
      if (dbRes && Array.isArray(dbRes)) {
        return NextResponse.json({ success: true, count: dbRes.length, data: dbRes });
      }
    }
  } catch (err) {
    console.warn('SQL Server pages query skipped:', err);
  }

  // 2. Isomorphic Store Fallback
  if (slug) {
    const page = platformStore.getPageBySlug(slug);
    if (!page) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: page });
  }
  const pages = platformStore.getPages();
  return NextResponse.json({ success: true, count: pages.length, data: pages });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const pageId = body.id || `pg-${Date.now()}`;

    // 1. SQL Server Database Save
    try {
      await querySQLServer(
        `IF EXISTS (SELECT 1 FROM [pages] WHERE [id] = ? OR [slug] = ?)
         BEGIN
           UPDATE [pages]
           SET [slug] = ?, [title] = ?, [content] = ?, [updated_at] = GETUTCDATE()
           WHERE [id] = ? OR [slug] = ?
         END
         ELSE
         BEGIN
           INSERT INTO [pages] ([id], [slug], [title], [content], [created_at], [updated_at])
           VALUES (?, ?, ?, ?, GETUTCDATE(), GETUTCDATE())
         END`,
        [
          pageId, body.slug,
          body.slug, body.title, body.content,
          pageId, body.slug,
          pageId, body.slug, body.title, body.content
        ]
      );
    } catch (dbErr) {
      console.warn('SQL Server page save skipped:', dbErr);
    }

    const saved = platformStore.savePage({ ...body, id: pageId });
    return NextResponse.json({ success: true, data: saved });
  } catch (err: unknown) {
    const errorObj = err as Error;
    return NextResponse.json({ success: false, error: errorObj.message || 'Failed to save custom page' }, { status: 500 });
  }
}

