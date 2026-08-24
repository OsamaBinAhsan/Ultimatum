import { NextResponse } from 'next/server';
import { platformStore } from '@/lib/data/store';
import { querySQLServer } from '@/lib/db/sqlserver';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const status = searchParams.get('status');

  // Trigger local scheduler checks
  platformStore.autoPublishScheduled();

  // 1. Check SQL Server
  try {
    if (slug) {
      const rows = (await querySQLServer('SELECT TOP 1 * FROM [reviews] WHERE [slug] = ?', [slug])) as any[];
      if (rows && rows.length > 0) {
        return NextResponse.json({ success: true, data: rows[0] });
      }
    } else if (status === 'all') {
      const rows = (await querySQLServer('SELECT * FROM [reviews] ORDER BY [created_at] DESC')) as any[];
      if (rows && rows.length > 0) {
        return NextResponse.json({ success: true, count: rows.length, data: rows });
      }
    } else if (status) {
      const rows = (await querySQLServer(
        'SELECT * FROM [reviews] WHERE [status] = ? ORDER BY [created_at] DESC',
        [status]
      )) as any[];
      if (rows && rows.length > 0) {
        return NextResponse.json({ success: true, count: rows.length, data: rows });
      }
    } else {
      // Public feed: only published or past due scheduled
      const rows = (await querySQLServer(
        "SELECT * FROM [reviews] WHERE [status] = 'published' OR [status] IS NULL OR ([status] = 'scheduled' AND [scheduled_for] <= GETUTCDATE()) ORDER BY [created_at] DESC"
      )) as any[];
      if (rows && rows.length > 0) {
        return NextResponse.json({ success: true, count: rows.length, data: rows });
      }
    }
  } catch (e) {
    // SQL Server query fallback
  }

  // 2. Fallback to PlatformStore
  if (slug) {
    const review = platformStore.getReviewBySlug(slug, status === 'all');
    if (!review) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: review });
  }

  const reviews = platformStore.getReviews(undefined, (status as any) || 'published');
  return NextResponse.json({ success: true, count: reviews.length, data: reviews });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let status = body.status || 'published';
    let scheduled_for = body.scheduled_for || null;
    const reviewId = body.id || `rev-${Date.now()}`;

    if (status === 'scheduled' && scheduled_for) {
      if (new Date(scheduled_for).getTime() <= Date.now()) {
        status = 'published';
      }
    }

    // SQL Server upsert attempt
    try {
      if (body.slug && body.product_name) {
        await querySQLServer(
          `IF EXISTS (SELECT 1 FROM [reviews] WHERE [id] = ? OR [slug] = ?)
           BEGIN
             UPDATE [reviews]
             SET [product_name] = ?, [category] = ?, [rating] = ?, [summary] = ?,
                 [verdict] = ?, [pros] = ?, [cons] = ?, [specifications] = ?,
                 [affiliate_link] = ?, [affiliate_retailer] = ?, [hero_image_url] = ?,
                 [status] = ?, [scheduled_for] = ?, [updated_at] = GETUTCDATE()
             WHERE [id] = ? OR [slug] = ?
           END
           ELSE
           BEGIN
             INSERT INTO [reviews] ([id], [slug], [product_name], [category], [rating], [summary], [verdict], [pros], [cons], [specifications], [affiliate_link], [affiliate_retailer], [hero_image_url], [author], [status], [scheduled_for], [created_at], [updated_at])
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, GETUTCDATE(), GETUTCDATE())
           END`,
          [
            // IF EXISTS check
            reviewId, body.slug,
            // UPDATE
            body.product_name,
            body.category || 'tech_hardware',
            body.rating || 4.5,
            body.summary || '',
            body.verdict || '',
            JSON.stringify(body.pros || []),
            JSON.stringify(body.cons || []),
            JSON.stringify(body.specifications || {}),
            body.affiliate_link || null,
            body.affiliate_retailer || null,
            body.hero_image_url || '',
            status,
            scheduled_for,
            reviewId, body.slug,
            // INSERT
            reviewId,
            body.slug,
            body.product_name,
            body.category || 'tech_hardware',
            body.rating || 4.5,
            body.summary || '',
            body.verdict || '',
            JSON.stringify(body.pros || []),
            JSON.stringify(body.cons || []),
            JSON.stringify(body.specifications || {}),
            body.affiliate_link || null,
            body.affiliate_retailer || null,
            body.hero_image_url || '',
            body.author || 'Ultimatum Lab',
            status,
            scheduled_for,
          ]
        );
      }
    } catch (dbErr) {
      console.warn('SQL Server save review skipped:', dbErr);
    }

    const saved = platformStore.saveReview({ ...body, id: reviewId, status, scheduled_for });
    return NextResponse.json({ success: true, data: saved });
  } catch (err: unknown) {
    const errorObj = err as Error;
    return NextResponse.json({ success: false, error: errorObj.message || 'Failed to save review' }, { status: 500 });
  }
}


