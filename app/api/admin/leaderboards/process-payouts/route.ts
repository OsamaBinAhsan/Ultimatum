import { NextRequest, NextResponse } from 'next/server';
import sql from 'mssql';
import { getSQLServerPool } from '@/lib/db/sqlserver';
import { platformStore } from '@/lib/data/store';
import type { PayoutProcessResult, PayoutWinnerDetail } from '@/lib/types';

/**
 * Weekly Leaderboard Tiered Coin Rewards
 * 1st: 1000, 2nd: 600, 3rd: 400, 4th: 300, 5th: 200,
 * 6th: 150,  7th: 100, 8th: 75,  9th: 50,  10th: 25
 */
const PAYOUT_TIERS: Record<number, number> = {
  1: 1000,
  2: 600,
  3: 400,
  4: 300,
  5: 200,
  6: 150,
  7: 100,
  8: 75,
  9: 50,
  10: 25,
};

/**
 * Calculates current ISO week identifier (e.g. '2026-W35')
 */
function getISOWeekIdentifier(targetDate: Date = new Date()): string {
  const d = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

interface RankedWinnerRow {
  id: string;
  user_id: string;
  game_id: string;
  score: number;
  username: string;
  rank_position: number;
}

/**
 * GET: Preview pending weekly payout distributions without executing the reset
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customWeek = searchParams.get('week_identifier');
    const weekIdentifier = customWeek || getISOWeekIdentifier();

    const pool = await getSQLServerPool();

    if (!pool || !pool.connected) {
      // Fallback preview from platform memory store
      const memoryScores = platformStore.getLeaderboard();
      const grouped: Record<string, typeof memoryScores> = {};

      for (const s of memoryScores) {
        if (!grouped[s.game_id]) grouped[s.game_id] = [];
        grouped[s.game_id].push(s);
      }

      const payoutsByGame: Record<string, PayoutWinnerDetail[]> = {};
      let totalCoins = 0;
      let totalWinners = 0;

      for (const [gameId, gameScores] of Object.entries(grouped)) {
        const sorted = [...gameScores].sort((a, b) => b.score - a.score).slice(0, 10);
        payoutsByGame[gameId] = sorted.map((s, idx) => {
          const rank = idx + 1;
          const coins = PAYOUT_TIERS[rank] || 0;
          totalCoins += coins;
          totalWinners += 1;

          return {
            user_id: s.user_id,
            username: s.profile?.username || s.player_name || 'Player',
            game_id: gameId,
            rank_position: rank,
            score: s.score,
            coins_awarded: coins,
          };
        });
      }

      return NextResponse.json({
        success: true,
        mode: 'preview_memory_store',
        week_identifier: weekIdentifier,
        total_games: Object.keys(payoutsByGame).length,
        total_winners: totalWinners,
        total_coins_to_distribute: totalCoins,
        payouts_by_game: payoutsByGame,
      });
    }

    // Query SQL Server with ROW_NUMBER window function
    const query = `
      WITH RankedScores AS (
        SELECT 
          l.id,
          l.user_id,
          l.game_id,
          l.score,
          COALESCE(p.username, 'Player') AS username,
          ROW_NUMBER() OVER (PARTITION BY l.game_id ORDER BY l.score DESC, l.created_at ASC) AS rank_position
        FROM [dbo].[leaderboards] l
        LEFT JOIN [dbo].[profiles] p ON l.user_id = p.id
      )
      SELECT 
        id,
        user_id,
        game_id,
        score,
        username,
        rank_position
      FROM RankedScores
      WHERE rank_position <= 10
      ORDER BY game_id ASC, rank_position ASC;
    `;

    const request = pool.request();
    const result = await request.query(query);
    const rows = (result.recordset || []) as RankedWinnerRow[];

    const payoutsByGame: Record<string, PayoutWinnerDetail[]> = {};
    let totalCoins = 0;

    for (const row of rows) {
      const coins = PAYOUT_TIERS[row.rank_position] || 0;
      totalCoins += coins;

      if (!payoutsByGame[row.game_id]) {
        payoutsByGame[row.game_id] = [];
      }

      payoutsByGame[row.game_id].push({
        user_id: row.user_id,
        username: row.username,
        game_id: row.game_id,
        rank_position: row.rank_position,
        score: row.score,
        coins_awarded: coins,
      });
    }

    return NextResponse.json({
      success: true,
      mode: 'preview_sql_server',
      week_identifier: weekIdentifier,
      total_games: Object.keys(payoutsByGame).length,
      total_winners: rows.length,
      total_coins_to_distribute: totalCoins,
      payouts_by_game: payoutsByGame,
    });
  } catch (error: any) {
    console.error('[Payout Preview Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to preview leaderboard payouts' },
      { status: 500 }
    );
  }
}

/**
 * POST: Execute atomic weekly payouts, insert audit logs, and reset tournament leaderboards
 */
export async function POST(req: NextRequest) {
  let tx: sql.Transaction | null = null;
  let transactionCommitted = false;

  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is acceptable; defaults to current ISO week
    }

    const weekIdentifier = body?.week_identifier || getISOWeekIdentifier();
    const pool = await getSQLServerPool();

    // -------------------------------------------------------------------------
    // Fallback if SQL Server is not connected (Standalone In-Memory Execution)
    // -------------------------------------------------------------------------
    if (!pool || !pool.connected) {
      const memoryScores = platformStore.getLeaderboard();
      const grouped: Record<string, typeof memoryScores> = {};

      for (const s of memoryScores) {
        if (!grouped[s.game_id]) grouped[s.game_id] = [];
        grouped[s.game_id].push(s);
      }

      const payoutsByGame: Record<string, PayoutWinnerDetail[]> = {};
      let totalCoins = 0;
      let totalWinners = 0;

      for (const [gameId, gameScores] of Object.entries(grouped)) {
        const sorted = [...gameScores].sort((a, b) => b.score - a.score).slice(0, 10);
        payoutsByGame[gameId] = sorted.map((s, idx) => {
          const rank = idx + 1;
          const coins = PAYOUT_TIERS[rank] || 0;
          totalCoins += coins;
          totalWinners += 1;

          // Award points to memory store
          platformStore.awardPoints(s.user_id, coins);

          return {
            user_id: s.user_id,
            username: s.profile?.username || s.player_name || 'Player',
            game_id: gameId,
            rank_position: rank,
            score: s.score,
            coins_awarded: coins,
          };
        });
      }

      // Reset memory store
      platformStore.triggerWeeklyReset();

      const responsePayload: PayoutProcessResult = {
        success: true,
        message: `Processed weekly payout for ${weekIdentifier} (Offline Memory Mode). Distributed ${totalCoins} coins across ${totalWinners} players. Leaderboard reset complete.`,
        week_identifier: weekIdentifier,
        total_games_processed: Object.keys(payoutsByGame).length,
        total_winners_awarded: totalWinners,
        total_coins_distributed: totalCoins,
        payouts_by_game: payoutsByGame,
        reset_timestamp: new Date().toISOString(),
      };

      return NextResponse.json(responsePayload);
    }

    // -------------------------------------------------------------------------
    // 1. Fetch Top 10 Ranked Players per Game
    // -------------------------------------------------------------------------
    const fetchTopPlayersQuery = `
      WITH RankedScores AS (
        SELECT 
          l.id,
          l.user_id,
          l.game_id,
          l.score,
          COALESCE(p.username, 'Player') AS username,
          ROW_NUMBER() OVER (PARTITION BY l.game_id ORDER BY l.score DESC, l.created_at ASC) AS rank_position
        FROM [dbo].[leaderboards] l
        LEFT JOIN [dbo].[profiles] p ON l.user_id = p.id
      )
      SELECT 
        id,
        user_id,
        game_id,
        score,
        username,
        rank_position
      FROM RankedScores
      WHERE rank_position <= 10
      ORDER BY game_id ASC, rank_position ASC;
    `;

    const rankingRequest = pool.request();
    const rankingResult = await rankingRequest.query(fetchTopPlayersQuery);
    const topWinners = (rankingResult.recordset || []) as RankedWinnerRow[];

    // -------------------------------------------------------------------------
    // 2. Start Atomic T-SQL Transaction
    // -------------------------------------------------------------------------
    tx = new sql.Transaction(pool);
    await tx.begin();

    const payoutsByGame: Record<string, PayoutWinnerDetail[]> = {};
    let totalCoinsDistributed = 0;

    for (const winner of topWinners) {
      const coinsAwarded = PAYOUT_TIERS[winner.rank_position] || 0;
      if (coinsAwarded <= 0) continue;

      totalCoinsDistributed += coinsAwarded;

      // 2a. Ensure [player_profiles] record exists (FK constraint on wallets)
      const playerProfileReq = new sql.Request(tx);
      playerProfileReq.input('userId', sql.NVarChar(64), winner.user_id);
      playerProfileReq.input('username', sql.NVarChar(64), winner.username);
      await playerProfileReq.query(`
        IF NOT EXISTS (SELECT 1 FROM [dbo].[player_profiles] WITH (UPDLOCK, ROWLOCK) WHERE [id] = @userId)
        BEGIN
          INSERT INTO [dbo].[player_profiles] ([id], [username], [display_name], [created_at], [updated_at])
          VALUES (@userId, @username, @username, GETUTCDATE(), GETUTCDATE());
        END
      `);

      // 2b. Atomic Wallet Upsert with UPDLOCK & ROWLOCK hints to prevent race conditions
      const walletReq = new sql.Request(tx);
      walletReq.input('userId', sql.NVarChar(64), winner.user_id);
      walletReq.input('coins', sql.Int, coinsAwarded);
      const walletRes = await walletReq.query(`
        IF EXISTS (SELECT 1 FROM [dbo].[wallets] WITH (UPDLOCK, ROWLOCK) WHERE [player_id] = @userId)
        BEGIN
          UPDATE [dbo].[wallets] WITH (ROWLOCK)
          SET [coin_balance] = [coin_balance] + @coins,
              [total_earned] = [total_earned] + @coins,
              [updated_at] = GETUTCDATE()
          WHERE [player_id] = @userId;

          SELECT [coin_balance] FROM [dbo].[wallets] WITH (ROWLOCK) WHERE [player_id] = @userId;
        END
        ELSE
        BEGIN
          INSERT INTO [dbo].[wallets] ([player_id], [coin_balance], [total_earned], [total_spent], [updated_at])
          VALUES (@userId, 250 + @coins, 250 + @coins, 0, GETUTCDATE());

          SELECT (250 + @coins) AS [coin_balance];
        END
      `);

      const newBalance =
        walletRes.recordset && walletRes.recordset.length > 0
          ? Number(walletRes.recordset[0].coin_balance)
          : undefined;

      // 2c. Synchronize profile points
      const profileReq = new sql.Request(tx);
      profileReq.input('userId', sql.NVarChar(64), winner.user_id);
      profileReq.input('coins', sql.Int, coinsAwarded);
      await profileReq.query(`
        UPDATE [dbo].[profiles] WITH (ROWLOCK)
        SET [points] = [points] + @coins,
            [updated_at] = GETUTCDATE()
        WHERE [id] = @userId;
      `);

      // 2d. Insert audit record into [leaderboard_payout_logs]
      const auditLogReq = new sql.Request(tx);
      auditLogReq.input('weekId', sql.NVarChar(64), weekIdentifier);
      auditLogReq.input('gameId', sql.NVarChar(64), winner.game_id);
      auditLogReq.input('userId', sql.NVarChar(64), winner.user_id);
      auditLogReq.input('rankPos', sql.Int, winner.rank_position);
      auditLogReq.input('score', sql.Int, winner.score);
      auditLogReq.input('coins', sql.Int, coinsAwarded);
      await auditLogReq.query(`
        INSERT INTO [dbo].[leaderboard_payout_logs] 
          ([week_identifier], [game_id], [user_id], [rank_position], [score], [coins_awarded], [created_at])
        VALUES 
          (@weekId, @gameId, @userId, @rankPos, @score, @coins, GETUTCDATE());
      `);

      // Group for response payload
      if (!payoutsByGame[winner.game_id]) {
        payoutsByGame[winner.game_id] = [];
      }

      payoutsByGame[winner.game_id].push({
        user_id: winner.user_id,
        username: winner.username,
        game_id: winner.game_id,
        rank_position: winner.rank_position,
        score: winner.score,
        coins_awarded: coinsAwarded,
        new_balance: newBalance,
      });
    }

    // -------------------------------------------------------------------------
    // 3. Reset Leaderboard: TRUNCATE TABLE [dbo].[leaderboards]
    // -------------------------------------------------------------------------
    const truncateReq = new sql.Request(tx);
    await truncateReq.query(`TRUNCATE TABLE [dbo].[leaderboards];`);

    // -------------------------------------------------------------------------
    // 4. Commit T-SQL Transaction
    // -------------------------------------------------------------------------
    await tx.commit();
    transactionCommitted = true;

    // Synchronize platform in-memory store so UI remains consistent
    platformStore.triggerWeeklyReset();

    const responsePayload: PayoutProcessResult = {
      success: true,
      message: `Weekly payout for cycle ${weekIdentifier} executed successfully. Awarded ${totalCoinsDistributed} coins across ${topWinners.length} placements. Leaderboards reset.`,
      week_identifier: weekIdentifier,
      total_games_processed: Object.keys(payoutsByGame).length,
      total_winners_awarded: topWinners.length,
      total_coins_distributed: totalCoinsDistributed,
      payouts_by_game: payoutsByGame,
      reset_timestamp: new Date().toISOString(),
    };

    return NextResponse.json(responsePayload);
  } catch (err: any) {
    console.error('[Leaderboard Payout Failure]:', err);

    // Rollback transaction if active
    if (tx && !transactionCommitted) {
      try {
        await tx.rollback();
        console.warn('[Leaderboard Payout] Transaction rolled back safely.');
      } catch (rbErr) {
        console.error('[Leaderboard Payout] Rollback error:', rbErr);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: err.message || 'An unexpected database error occurred during leaderboard payout execution.',
      },
      { status: 500 }
    );
  }
}
