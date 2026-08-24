import { NextResponse } from 'next/server';
import { queryMySQL } from '@/lib/db/mysql';
import { platformStore } from '@/lib/data/store';

async function publishScheduledPosts() {
  const start = Date.now();

  try {
    const localPublished = platformStore.autoPublishScheduled();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    let recipesPublished = 0;
    let reviewsPublished = 0;
    let articlesPublished = 0;

    try {
      // 1. Update scheduled recipes due for publishing
      const recipeRes = (await queryMySQL(
        `UPDATE \`recipes\`
         SET \`status\` = 'published', \`published_at\` = NOW()
         WHERE \`status\` = 'scheduled' AND \`scheduled_for\` <= ?`,
        [now]
      )) as any;

      // 2. Update scheduled reviews due for publishing
      const reviewRes = (await queryMySQL(
        `UPDATE \`reviews\`
         SET \`status\` = 'published', \`published_at\` = NOW()
         WHERE \`status\` = 'scheduled' AND \`scheduled_for\` <= ?`,
        [now]
      )) as any;

      // 3. Update scheduled articles due for publishing
      const articleRes = (await queryMySQL(
        `UPDATE \`articles\`
         SET \`status\` = 'published', \`published_at\` = NOW()
         WHERE \`status\` = 'scheduled' AND \`scheduled_for\` <= ?`,
        [now]
      )) as any;

      recipesPublished = recipeRes?.affectedRows ?? 0;
      reviewsPublished = reviewRes?.affectedRows ?? 0;
      articlesPublished = articleRes?.affectedRows ?? 0;
    } catch (mysqlErr) {
      console.warn('MySQL cron update skipped:', mysqlErr);
    }

    const totalPublished = Math.max(recipesPublished + reviewsPublished + articlesPublished, localPublished);
    const durationMs = Date.now() - start;


    // 4. Record execution log into scheduler_log table
    try {
      await queryMySQL(
        `INSERT INTO \`scheduler_log\` (
           \`recipes_published\`, \`reviews_published\`, \`articles_published\`, \`total_published\`, \`duration_ms\`, \`notes\`
         ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          recipesPublished,
          reviewsPublished,
          articlesPublished,
          totalPublished,
          durationMs,
          totalPublished > 0
            ? `Auto-published ${totalPublished} post(s) via cron`
            : 'Cron tick: No scheduled posts due',
        ]
      );
    } catch {
      // Non-critical if scheduler_log table not initialized yet
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      published: {
        recipes: recipesPublished,
        reviews: reviewsPublished,
        articles: articlesPublished,
        total: totalPublished,
      },
      duration_ms: durationMs,
    });
  } catch (err: unknown) {
    const e = err as Error;
    console.error('Error during scheduled posts publishing cron:', e);
    return NextResponse.json(
      { success: false, error: e.message || 'Cron publishing execution failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return publishScheduledPosts();
}

export async function POST() {
  return publishScheduledPosts();
}
