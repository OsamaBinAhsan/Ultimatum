import { NextResponse } from 'next/server';
import { querySQLServer } from '@/lib/db/sqlserver';
import { platformStore } from '@/lib/data/store';

export async function POST(request: Request) {
  const secret = request.headers.get('x-scheduler-secret');
  const expectedSecret = process.env.SCHEDULER_SECRET || '';

  // If a secret is configured in env, require it to match
  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();

  try {
    const localPublished = platformStore.autoPublishScheduled();

    let recipes = 0;
    let reviews = 0;
    let articles = 0;

    try {
      const recipeRes = (await querySQLServer(
        `UPDATE [recipes] SET [status] = 'published', [published_at] = GETUTCDATE()
         WHERE [status] = 'scheduled' AND [scheduled_for] <= GETUTCDATE()`
      )) as any;

      const reviewRes = (await querySQLServer(
        `UPDATE [reviews] SET [status] = 'published', [published_at] = GETUTCDATE()
         WHERE [status] = 'scheduled' AND [scheduled_for] <= GETUTCDATE()`
      )) as any;

      const articleRes = (await querySQLServer(
        `UPDATE [articles] SET [status] = 'published', [published_at] = GETUTCDATE()
         WHERE [status] = 'scheduled' AND [scheduled_for] <= GETUTCDATE()`
      )) as any;

      recipes = recipeRes?.affectedRows ?? 0;
      reviews = reviewRes?.affectedRows ?? 0;
      articles = articleRes?.affectedRows ?? 0;
    } catch (dbErr) {
      console.warn('[Scheduler] SQL Server update skipped:', dbErr);
    }

    const total = Math.max(recipes + reviews + articles, localPublished);
    const duration = Date.now() - start;

    try {
      await querySQLServer(
        `INSERT INTO [scheduler_log] ([recipes_published], [reviews_published], [articles_published], [total_published], [duration_ms], [notes], [executed_at])
         VALUES (?, ?, ?, ?, ?, ?, GETUTCDATE())`,
        [recipes, reviews, articles, total, duration, total > 0 ? `Published ${total} post(s)` : 'No posts due']
      );
    } catch (logErr) {
      console.warn('[Scheduler] Log insert skipped:', logErr);
    }

    return NextResponse.json({
      success: true,
      published: { recipes, reviews, articles },
      total,
      duration_ms: duration,
    });
  } catch (err: unknown) {
    const e = err as Error;
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}


