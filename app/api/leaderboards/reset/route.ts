import { NextResponse } from 'next/server';
import { platformStore } from '@/lib/data/store';
import { queryMySQL, getMySQLPool } from '@/lib/db/mysql';

export async function POST() {
  try {
    // 1. MySQL Reset
    try {
      const pool = getMySQLPool();
      if (pool) {
        await queryMySQL('DELETE FROM leaderboards');
      }
    } catch (dbErr) {
      console.warn('MySQL weekly leaderboard reset error:', dbErr);
    }

    // 2. Platform Store Reset
    const result = platformStore.triggerWeeklyReset();
    return NextResponse.json({
      success: true,
      message: 'Weekly leaderboard reset triggered successfully across database and memory store!',
      data: result,
    });
  } catch (err: unknown) {
    const errorObj = err as Error;
    return NextResponse.json({ success: false, error: errorObj.message || 'Failed to reset leaderboards' }, { status: 500 });
  }
}
