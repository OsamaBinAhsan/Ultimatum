import { NextResponse } from 'next/server';
import { queryMySQL } from '@/lib/db/mysql';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId required' }, { status: 400 });
    }

    const rows = await queryMySQL(
      `SELECT * FROM \`game_stats\` WHERE \`user_id\` = ? ORDER BY \`last_played_at\` DESC`,
      [userId]
    );
    return NextResponse.json({ success: true, data: rows || [] });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message, data: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, game_id, game_slug, game_title, score } = await request.json();
    if (!userId || !game_id) {
      return NextResponse.json(
        { success: false, error: 'userId and game_id required' },
        { status: 400 }
      );
    }

    await queryMySQL(
      `INSERT INTO \`game_stats\` (\`user_id\`, \`game_id\`, \`game_slug\`, \`game_title\`, \`high_score\`, \`total_plays\`)
       VALUES (?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
         \`high_score\` = GREATEST(\`high_score\`, VALUES(\`high_score\`)),
         \`total_plays\` = \`total_plays\` + 1,
         \`last_played_at\` = NOW()`,
      [userId, game_id, game_slug || '', game_title || '', score || 0]
    );
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
