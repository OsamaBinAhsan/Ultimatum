import { NextResponse } from 'next/server';
import { platformStore } from '@/lib/data/store';
import { queryMySQL } from '@/lib/db/mysql';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const status = searchParams.get('status');

  // Trigger local scheduler checks
  platformStore.autoPublishScheduled();

  // 1. Check MySQL
  try {
    if (slug) {
      const rows = (await queryMySQL('SELECT * FROM `reviews` WHERE `slug` = ? LIMIT 1', [slug])) as any[];
      if (rows && rows.length > 0) {
        return NextResponse.json({ success: true, data: rows[0] });
      }
    } else if (status === 'all') {
      const rows = (await queryMySQL('SELECT * FROM `reviews` ORDER BY `created_at` DESC')) as any[];
      if (rows && rows.length > 0) {
        return NextResponse.json({ success: true, count: rows.length, data: rows });
      }
    } else if (status) {
      const rows = (await queryMySQL(
        'SELECT * FROM `reviews` WHERE `status` = ? ORDER BY `created_at` DESC',
        [status]
      )) as any[];
      if (rows && rows.length > 0) {
        return NextResponse.json({ success: true, count: rows.length, data: rows });
      }
    } else {
      // Public feed: only published or past due scheduled
      const rows = (await queryMySQL(
        "SELECT * FROM `reviews` WHERE `status` = 'published' OR `status` IS NULL OR (`status` = 'scheduled' AND `scheduled_for` <= NOW()) ORDER BY `created_at` DESC"
      )) as any[];
      if (rows && rows.length > 0) {
        return NextResponse.json({ success: true, count: rows.length, data: rows });
      }
    }
  } catch (e) {
    // MySQL query fallback
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

    if (status === 'scheduled' && scheduled_for) {
      if (new Date(scheduled_for).getTime() <= Date.now()) {
        status = 'published';
      }
    }

    // MySQL upsert attempt
    try {
      if (body.id && body.slug && body.product_name) {
        await queryMySQL(
          `INSERT INTO \`reviews\` (\`id\`, \`slug\`, \`product_name\`, \`category\`, \`rating\`, \`summary\`, \`verdict\`, \`pros\`, \`cons\`, \`specifications\`, \`affiliate_link\`, \`affiliate_retailer\`, \`hero_image_url\`, \`author\`, \`status\`, \`scheduled_for\`)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             \`product_name\` = VALUES(\`product_name\`),
             \`category\` = VALUES(\`category\`),
             \`rating\` = VALUES(\`rating\`),
             \`summary\` = VALUES(\`summary\`),
             \`verdict\` = VALUES(\`verdict\`),
             \`pros\` = VALUES(\`pros\`),
             \`cons\` = VALUES(\`cons\`),
             \`specifications\` = VALUES(\`specifications\`),
             \`affiliate_link\` = VALUES(\`affiliate_link\`),
             \`affiliate_retailer\` = VALUES(\`affiliate_retailer\`),
             \`hero_image_url\` = VALUES(\`hero_image_url\`),
             \`status\` = VALUES(\`status\`),
             \`scheduled_for\` = VALUES(\`scheduled_for\`)`,
          [
            body.id,
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
      console.warn('MySQL save review skipped:', dbErr);
    }

    const saved = platformStore.saveReview({ ...body, status, scheduled_for });
    return NextResponse.json({ success: true, data: saved });
  } catch (err: unknown) {
    const errorObj = err as Error;
    return NextResponse.json({ success: false, error: errorObj.message || 'Failed to save review' }, { status: 500 });
  }
}

