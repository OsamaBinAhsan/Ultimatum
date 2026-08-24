import { NextResponse } from 'next/server';
import { querySQLServer } from '@/lib/db/sqlserver';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId required' }, { status: 400 });
    }

    const rows = await querySQLServer(
      `SELECT * FROM [game_stats] WHERE [user_id] = ? ORDER BY [last_played_at] DESC`,
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

    const userScore = score || 0;

    await querySQLServer(
      `IF EXISTS (SELECT 1 FROM [game_stats] WHERE [user_id] = ? AND [game_id] = ?)
       BEGIN
         UPDATE [game_stats]
         SET [high_score] = CASE WHEN ? > [high_score] THEN ? ELSE [high_score] END,
             [total_plays] = [total_plays] + 1,
             [last_played_at] = GETUTCDATE()
         WHERE [user_id] = ? AND [game_id] = ?
       END
       ELSE
       BEGIN
         INSERT INTO [game_stats] ([user_id], [game_id], [game_slug], [game_title], [high_score], [total_plays], [last_played_at])
         VALUES (?, ?, ?, ?, ?, 1, GETUTCDATE())
       END`,
      [
        userId, game_id,
        userScore, userScore,
        userId, game_id,
        userId, game_id, game_slug || '', game_title || '', userScore
      ]
    );
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

