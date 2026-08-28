import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { platformStore } from '@/lib/data/store';
import { querySQLServer } from '@/lib/db/sqlserver';
import { LeaderboardEntry } from '@/lib/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawGameId = searchParams.get('game_id');

  const game = rawGameId
    ? platformStore.getGames().find((g) => g.id === rawGameId || g.slug === rawGameId)
    : null;
  const gameId1 = game ? game.id : rawGameId;
  const gameId2 = game ? game.slug : rawGameId;

  // 1. SQL Server database connection with strict ROW_NUMBER single-entry partition
  try {
    const sql = rawGameId
      ? `WITH RankedScores AS (
           SELECT 
             l.id, 
             l.user_id, 
             l.game_id, 
             l.score, 
             l.created_at,
             COALESCE(p.username, 'Player') AS player_name,
             COALESCE(p.avatar_url, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80') AS avatar_url,
             p.badges,
             ROW_NUMBER() OVER (PARTITION BY l.user_id ORDER BY l.score DESC) as rn
           FROM [dbo].[leaderboards] l
           LEFT JOIN [dbo].[profiles] p ON l.user_id = p.id
           WHERE (l.game_id = ? OR l.game_id = ?)
         )
         SELECT TOP 50 id, user_id, game_id, score, created_at, player_name, avatar_url, badges
         FROM RankedScores
         WHERE rn = 1
         ORDER BY score DESC`
      : `WITH RankedScores AS (
           SELECT 
             l.id, 
             l.user_id, 
             l.game_id, 
             l.score, 
             l.created_at,
             COALESCE(p.username, 'Player') AS player_name,
             COALESCE(p.avatar_url, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80') AS avatar_url,
             p.badges,
             ROW_NUMBER() OVER (PARTITION BY l.user_id, l.game_id ORDER BY l.score DESC) as rn
           FROM [dbo].[leaderboards] l
           LEFT JOIN [dbo].[profiles] p ON l.user_id = p.id
         )
         SELECT TOP 50 id, user_id, game_id, score, created_at, player_name, avatar_url, badges
         FROM RankedScores
         WHERE rn = 1
         ORDER BY score DESC`;

    const params = rawGameId ? [gameId1, gameId2] : [];
    const dbRes = await querySQLServer(sql, params);

    if (dbRes && Array.isArray(dbRes) && dbRes.length > 0) {
      const formatted: LeaderboardEntry[] = (dbRes as any[]).map((row, idx) => ({
        id: row.id,
        user_id: row.user_id,
        game_id: row.game_id,
        score: Number(row.score),
        player_name: row.player_name,
        avatar_url: row.avatar_url,
        created_at: row.created_at,
        rank: idx + 1,
      }));
      return NextResponse.json({ success: true, count: formatted.length, data: formatted, source: 'sqlserver' });
    }
  } catch (dbErr) {
    console.warn('SQL Server leaderboard fetch skipped:', dbErr);
  }

  // 2. In-Memory / Platform Store fallback
  const list = platformStore.getLeaderboard(rawGameId || undefined);
  return NextResponse.json({ success: true, count: list.length, data: list, source: 'store' });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { game_id, score, user_id, username } = body;

    if (!game_id || typeof score !== 'number') {
      return NextResponse.json({ success: false, error: 'Invalid game_id or score' }, { status: 400 });
    }

    const game = platformStore.getGames().find((g) => g.id === game_id || g.slug === game_id);
    const targetGameId = game ? game.id : game_id;
    const targetGameSlug = game ? game.slug : game_id;

    const activeUser = platformStore.getCurrentUser();
    const targetUserId = user_id || activeUser?.id || `user-anon`;
    const targetUsername = username || activeUser?.username || 'Player';
    const entryId = `lb-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const pointsAwarded = Math.floor(score / 100);

    // 1. SQL Server database insert with atomic conditional UPSERT
    try {
      // Ensure user profile exists or update points
      await querySQLServer(
        `IF EXISTS (SELECT 1 FROM [dbo].[profiles] WHERE [id] = ?)
         BEGIN
           UPDATE [dbo].[profiles] SET [points] = [points] + ? WHERE [id] = ?
         END
         ELSE
         BEGIN
           INSERT INTO [dbo].[profiles] ([id], [username], [email], [points], [daily_streak], [role], [avatar_url])
           VALUES (?, ?, ?, ?, 1, 'user', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80')
         END`,
        [
          targetUserId,
          pointsAwarded, targetUserId,
          targetUserId, targetUsername, `${targetUsername.toLowerCase()}@player.local`, pointsAwarded
        ]
      );

      // Atomic conditional UPSERT for Leaderboard (Preserve high scores, 1 entry per user per game)
      await querySQLServer(
        `IF EXISTS (SELECT 1 FROM [dbo].[leaderboards] WITH (UPDLOCK, ROWLOCK) WHERE [user_id] = ? AND ([game_id] = ? OR [game_id] = ?))
         BEGIN
           UPDATE [dbo].[leaderboards]
           SET [score] = CASE WHEN ? > [score] THEN ? ELSE [score] END,
               [game_id] = ?,
               [week_timestamp] = GETUTCDATE()
           WHERE [user_id] = ? AND ([game_id] = ? OR [game_id] = ?);
         END
         ELSE
         BEGIN
           INSERT INTO [dbo].[leaderboards] ([id], [user_id], [game_id], [score], [week_timestamp], [created_at])
           VALUES (?, ?, ?, ?, GETUTCDATE(), GETUTCDATE());
         END`,
        [
          targetUserId, targetGameId, targetGameSlug,
          score, score, targetGameId,
          targetUserId, targetGameId, targetGameSlug,
          entryId, targetUserId, targetGameId, score
        ]
      );

      // Update games play_count
      await querySQLServer(
        `UPDATE [dbo].[games] SET [play_count] = [play_count] + 1 WHERE [id] = ? OR [slug] = ?`,
        [targetGameId, targetGameSlug]
      );

      // Retrieve user's current high score and computed rank
      const scoreRows = await querySQLServer(
        `SELECT MAX([score]) as max_score FROM [dbo].[leaderboards] WHERE [user_id] = ? AND ([game_id] = ? OR [game_id] = ?)`,
        [targetUserId, targetGameId, targetGameSlug]
      );
      const currentHighScore = scoreRows && scoreRows.length > 0 && scoreRows[0].max_score !== null ? Number(scoreRows[0].max_score) : score;

      const rankRows = await querySQLServer(
        `SELECT COUNT(DISTINCT [user_id]) + 1 AS [rank] FROM [dbo].[leaderboards] WHERE ([game_id] = ? OR [game_id] = ?) AND [score] > ?`,
        [targetGameId, targetGameSlug, currentHighScore]
      );
      const rank = rankRows && rankRows.length > 0 ? Number(rankRows[0].rank) : 1;

      const entry: LeaderboardEntry = {
        id: entryId,
        user_id: targetUserId,
        game_id: targetGameId,
        score: currentHighScore,
        player_name: targetUsername,
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        created_at: new Date().toISOString(),
        rank,
      };

      platformStore.submitScore(targetGameId, score);
      return NextResponse.json({
        success: true,
        data: entry,
        isNewHighScore: score >= currentHighScore,
        source: 'sqlserver',
      });
    } catch (dbErr) {
      console.warn('SQL Server score upsert skipped:', dbErr);
    }

    // 2. In-Memory / Platform Store fallback
    const entry = platformStore.submitScore(targetGameId, score);
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

    // 1. SQL Server Delete
    try {
      await querySQLServer('DELETE FROM [leaderboards] WHERE [id] = ?', [scoreId]);
    } catch (dbErr) {
      console.warn('SQL Server delete score error:', dbErr);
    }

    // 2. Store Delete
    platformStore.deleteLeaderboardScore(scoreId);
    return NextResponse.json({ success: true, message: 'Score deleted' });
  } catch (err: unknown) {
    const errorObj = err as Error;
    return NextResponse.json({ success: false, error: errorObj.message || 'Failed to delete score' }, { status: 500 });
  }
}


