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
      const rows = (await querySQLServer('SELECT TOP 1 * FROM [recipes] WHERE [slug] = ?', [slug])) as any[];
      if (rows && rows.length > 0) {
        return NextResponse.json({ success: true, data: rows[0] });
      }
    } else if (status === 'all') {
      const rows = (await querySQLServer('SELECT * FROM [recipes] ORDER BY [created_at] DESC')) as any[];
      if (rows && rows.length > 0) {
        return NextResponse.json({ success: true, count: rows.length, data: rows });
      }
    } else if (status) {
      const rows = (await querySQLServer(
        'SELECT * FROM [recipes] WHERE [status] = ? ORDER BY [created_at] DESC',
        [status]
      )) as any[];
      if (rows && rows.length > 0) {
        return NextResponse.json({ success: true, count: rows.length, data: rows });
      }
    } else {
      // Public view: only published or due scheduled
      const rows = (await querySQLServer(
        "SELECT * FROM [recipes] WHERE [status] = 'published' OR [status] IS NULL OR ([status] = 'scheduled' AND [scheduled_for] <= GETUTCDATE()) ORDER BY [created_at] DESC"
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
    const recipeId = body.id || `rec-${Date.now()}`;

    if (status === 'scheduled' && scheduled_for) {
      if (new Date(scheduled_for).getTime() <= Date.now()) {
        status = 'published';
      }
    }

    // SQL Server upsert attempt
    try {
      if (body.slug && body.title) {
        await querySQLServer(
          `IF EXISTS (SELECT 1 FROM [recipes] WHERE [id] = ? OR [slug] = ?)
           BEGIN
             UPDATE [recipes]
             SET [title] = ?, [description] = ?, [hero_image_url] = ?, [prep_time] = ?,
                 [cook_time] = ?, [servings] = ?, [calories] = ?, [category] = ?, [ingredients] = ?,
                 [instructions] = ?, [status] = ?, [scheduled_for] = ?, [updated_at] = GETUTCDATE()
             WHERE [id] = ? OR [slug] = ?
           END
           ELSE
           BEGIN
             INSERT INTO [recipes] ([id], [slug], [title], [description], [hero_image_url], [prep_time], [cook_time], [servings], [calories], [category], [ingredients], [instructions], [author], [status], [scheduled_for], [created_at], [updated_at])
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, GETUTCDATE(), GETUTCDATE())
           END`,
          [
            // IF EXISTS check
            recipeId, body.slug,
            // UPDATE
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
            status,
            scheduled_for,
            recipeId, body.slug,
            // INSERT
            recipeId,
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
      console.warn('SQL Server save recipe skipped:', dbErr);
    }

    const saved = platformStore.saveRecipe({ ...body, id: recipeId, status, scheduled_for });
    return NextResponse.json({ success: true, data: saved });
  } catch (err: unknown) {
    const errorObj = err as Error;
    return NextResponse.json({ success: false, error: errorObj.message || 'Failed to save recipe' }, { status: 500 });
  }
}


