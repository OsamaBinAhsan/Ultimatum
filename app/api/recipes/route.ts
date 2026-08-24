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
      const rows = (await queryMySQL('SELECT * FROM `recipes` WHERE `slug` = ? LIMIT 1', [slug])) as any[];
      if (rows && rows.length > 0) {
        return NextResponse.json({ success: true, data: rows[0] });
      }
    } else if (status === 'all') {
      const rows = (await queryMySQL('SELECT * FROM `recipes` ORDER BY `created_at` DESC')) as any[];
      if (rows && rows.length > 0) {
        return NextResponse.json({ success: true, count: rows.length, data: rows });
      }
    } else if (status) {
      const rows = (await queryMySQL(
        'SELECT * FROM `recipes` WHERE `status` = ? ORDER BY `created_at` DESC',
        [status]
      )) as any[];
      if (rows && rows.length > 0) {
        return NextResponse.json({ success: true, count: rows.length, data: rows });
      }
    } else {
      // Public view: only published or due scheduled
      const rows = (await queryMySQL(
        "SELECT * FROM `recipes` WHERE `status` = 'published' OR `status` IS NULL OR (`status` = 'scheduled' AND `scheduled_for` <= NOW()) ORDER BY `created_at` DESC"
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
    const recipe = platformStore.getRecipeBySlug(slug, status === 'all');
    if (!recipe) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: recipe });
  }

  const recipes = platformStore.getRecipes((status as any) || 'published');
  return NextResponse.json({ success: true, count: recipes.length, data: recipes });
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
      if (body.id && body.slug && body.title) {
        await queryMySQL(
          `INSERT INTO \`recipes\` (\`id\`, \`slug\`, \`title\`, \`description\`, \`hero_image_url\`, \`prep_time\`, \`cook_time\`, \`servings\`, \`calories\`, \`category\`, \`ingredients\`, \`instructions\`, \`author\`, \`status\`, \`scheduled_for\`)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             \`title\` = VALUES(\`title\`),
             \`description\` = VALUES(\`description\`),
             \`hero_image_url\` = VALUES(\`hero_image_url\`),
             \`prep_time\` = VALUES(\`prep_time\`),
             \`cook_time\` = VALUES(\`cook_time\`),
             \`servings\` = VALUES(\`servings\`),
             \`calories\` = VALUES(\`calories\`),
             \`category\` = VALUES(\`category\`),
             \`ingredients\` = VALUES(\`ingredients\`),
             \`instructions\` = VALUES(\`instructions\`),
             \`status\` = VALUES(\`status\`),
             \`scheduled_for\` = VALUES(\`scheduled_for\`)`,
          [
            body.id,
            body.slug,
            body.title,
            body.description || '',
            body.hero_image_url || '',
            body.prep_time || 15,
            body.cook_time || 20,
            body.servings || 4,
            body.calories || 400,
            body.category || 'Entree',
            JSON.stringify(body.ingredients || []),
            JSON.stringify(body.instructions || []),
            body.author || 'Chef Marco',
            status,
            scheduled_for,
          ]
        );
      }
    } catch (dbErr) {
      console.warn('MySQL save recipe skipped:', dbErr);
    }

    const saved = platformStore.saveRecipe({ ...body, status, scheduled_for });
    return NextResponse.json({ success: true, data: saved });
  } catch (err: unknown) {
    const errorObj = err as Error;
    return NextResponse.json({ success: false, error: errorObj.message || 'Failed to save recipe' }, { status: 500 });
  }
}

