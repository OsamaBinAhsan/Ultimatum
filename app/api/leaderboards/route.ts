import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { platformStore } from '@/lib/data/store';
import { queryMySQL, getMySQLPool } from '@/lib/db/mysql';
import { LeaderboardEntry } from '@/lib/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get('game_id');

  // 1. MySQL database connection (HostGator / phpMyAdmin / cPanel)
  try {
    const pool = getMySQLPool();
    if (pool) {
      const sql = gameId
        ? `SELECT 
             l.id, 
             l.user_id, 
             l.game_id, 
             l.score, 
             l.created_at,
             COALESCE(p.username, 'Player') AS player_name,
             COALESCE(p.avatar_url, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80') AS avatar_url,
             p.badges
           FROM leaderboards l
           LEFT JOIN profiles p ON l.user_id = p.id
           WHERE l.game_id = ?
           ORDER BY l.score DESC
           LIMIT 50`
        : `SELECT 
             l.id, 
             l.user_id, 
             l.game_id, 
             l.score, 
             l.created_at,
             COALESCE(p.username, 'Player') AS player_name,
             COALESCE(p.avatar_url, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80') AS avatar_url,
             p.badges
           FROM leaderboards l
           LEFT JOIN profiles p ON l.user_id = p.id
           ORDER BY l.score DESC
           LIMIT 50`;

      const params = gameId ? [gameId] : [];
      const mysqlRes = await queryMySQL(sql, params);

      if (mysqlRes && Array.isArray(mysqlRes) && mysqlRes.length > 0) {
        const formatted: LeaderboardEntry[] = (mysqlRes as any[]).map((row, idx) => ({
          id: row.id,
          user_id: row.user_id,
          game_id: row.game_id,
          score: Number(row.score),
          player_name: row.player_name,
          avatar_url: row.avatar_url,
          created_at: row.created_at,
          rank: idx + 1,
        }));
        return NextResponse.json({ success: true, count: formatted.length, data: formatted, source: 'mysql' });
      }
    }
  } catch (dbErr) {
    console.warn('MySQL leaderboard fetch skipped:', dbErr);
  }

  // 2. In-Memory / Platform Store fallback
  const list = platformStore.getLeaderboard(gameId || undefined);
  return NextResponse.json({ success: true, count: list.length, data: list, source: 'store' });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { game_id, score, user_id, username } = body;

    if (!game_id || typeof score !== 'number') {
      return NextResponse.json({ success: false, error: 'Invalid game_id or score' }, { status: 400 });
    }

    const activeUser = platformStore.getCurrentUser();
    const targetUserId = user_id || activeUser?.id || `anon-${Date.now()}`;
    const targetUsername = username || activeUser?.username || 'Player';
    const entryId = `lb-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const pointsAwarded = Math.floor(score / 100);

    // 1. MySQL database insert (HostGator / phpMyAdmin / cPanel)
    try {
      const pool = getMySQLPool();
      if (pool) {
        // Ensure user profile exists or create placeholder
        await queryMySQL(
          `INSERT INTO profiles (id, username, email, points, daily_streak, role, avatar_url)
           VALUES (?, ?, ?, ?, 1, 'user', ?)
           ON DUPLICATE KEY UPDATE points = points + ?`,
          [
            targetUserId,
            targetUsername,
            `${targetUsername.toLowerCase()}@player.local`,
            pointsAwarded,
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
            pointsAwarded,
          ]
        );

        // Insert new score entry
        await queryMySQL(
          `INSERT INTO leaderboards (id, user_id, game_id, score, week_timestamp, created_at)
           VALUES (?, ?, ?, ?, NOW(), NOW())`,
          [entryId, targetUserId, game_id, score]
        );

        // Update games play_count
        await queryMySQL(
          `UPDATE games SET play_count = play_count + 1 WHERE id = ?`,
          [game_id]
        );

        const entry: LeaderboardEntry = {
          id: entryId,
          user_id: targetUserId,
          game_id,
          score,
          player_name: targetUsername,
          avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
          created_at: new Date().toISOString(),
          rank: 1,
        };

        platformStore.submitScore(game_id, score);
        return NextResponse.json({ success: true, data: entry, source: 'mysql' });
      }
    } catch (dbErr) {
      console.warn('MySQL score insert skipped:', dbErr);
    }

    // 2. In-Memory / Platform Store fallback
    const entry = platformStore.submitScore(game_id, score);
    return NextResponse.json({ success: true, data: entry, source: 'store' });
  } catch (err: unknown) {
    const errorObj = err as Error;
    return NextResponse.json({ success: false, error: errorObj.message || 'Failed to submit score' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scoreId = searchParams.get('id');
    if (!scoreId) {
      return NextResponse.json({ success: false, error: 'Score ID required' }, { status: 400 });
    }

    // 1. MySQL Delete
    try {
      const pool = getMySQLPool();
      if (pool) {
        await queryMySQL('DELETE FROM leaderboards WHERE id = ?', [scoreId]);
      }
    } catch (dbErr) {
      console.warn('MySQL delete score error:', dbErr);
    }

    // 2. Store Delete
    platformStore.deleteLeaderboardScore(scoreId);
    return NextResponse.json({ success: true, message: 'Score deleted' });
  } catch (err: unknown) {
    const errorObj = err as Error;
    return NextResponse.json({ success: false, error: errorObj.message || 'Failed to delete score' }, { status: 500 });
  }
}

