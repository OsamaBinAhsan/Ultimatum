import { NextResponse } from 'next/server';
import { queryMySQL } from '@/lib/db/mysql';

export async function POST(request: Request) {
  const secret = request.headers.get('x-scheduler-secret');
  const expectedSecret = process.env.SCHEDULER_SECRET || '';

  // If a secret is configured in env, require it to match
  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();

  try {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const recipeRes = (await queryMySQL(
      `UPDATE \`recipes\` SET \`status\` = 'published', \`published_at\` = NOW()
       WHERE \`status\` = 'scheduled' AND \`scheduled_for\` <= ?`,
      [now]
    )) as any;

    const reviewRes = (await queryMySQL(
      `UPDATE \`reviews\` SET \`status\` = 'published', \`published_at\` = NOW()
       WHERE \`status\` = 'scheduled' AND \`scheduled_for\` <= ?`,
      [now]
    )) as any;

    const articleRes = (await queryMySQL(
      `UPDATE \`articles\` SET \`status\` = 'published', \`published_at\` = NOW()
       WHERE \`status\` = 'scheduled' AND \`scheduled_for\` <= ?`,
      [now]
    )) as any;

    const recipes = recipeRes?.affectedRows ?? 0;
    const reviews = reviewRes?.affectedRows ?? 0;
    const articles = articleRes?.affectedRows ?? 0;
    const total = recipes + reviews + articles;
    const duration = Date.now() - start;

    try {
      await queryMySQL(
        `INSERT INTO \`scheduler_log\` (\`recipes_published\`, \`reviews_published\`, \`articles_published\`, \`total_published\`, \`duration_ms\`, \`notes\`)
         VALUES (?, ?, ?, ?, ?, ?)`,
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
