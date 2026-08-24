import { NextResponse } from 'next/server';
import { platformStore } from '@/lib/data/store';
import { queryMySQL } from '@/lib/db/mysql';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  // 1. MySQL Database
  try {
    if (slug) {
      const mysqlRes = await queryMySQL('SELECT * FROM pages WHERE slug = ? LIMIT 1', [slug]);
      if (mysqlRes && Array.isArray(mysqlRes) && mysqlRes.length > 0) {
        return NextResponse.json({ success: true, data: mysqlRes[0] });
      }
    } else {
      const mysqlRes = await queryMySQL('SELECT * FROM pages ORDER BY created_at DESC');
      if (mysqlRes && Array.isArray(mysqlRes)) {
        return NextResponse.json({ success: true, count: mysqlRes.length, data: mysqlRes });
      }
    }
  } catch (err) {
    console.warn('MySQL pages query skipped:', err);
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

    // 1. MySQL Database Save
    try {
      await queryMySQL(
        `INSERT INTO pages (id, slug, title, content, is_published, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
           slug = VALUES(slug),
           title = VALUES(title),
           content = VALUES(content),
           is_published = VALUES(is_published),
           updated_at = NOW()`,
        [
          body.id || `pg-${Date.now()}`,
          body.slug,
          body.title,
          body.content,
          body.is_published ? 1 : 0,
        ]
      );
    } catch (mysqlErr) {
      console.warn('MySQL page save skipped:', mysqlErr);
    }

    const saved = platformStore.savePage(body);
    return NextResponse.json({ success: true, data: saved });
  } catch (err: unknown) {
    const errorObj = err as Error;
    return NextResponse.json({ success: false, error: errorObj.message || 'Failed to save custom page' }, { status: 500 });
  }
}
