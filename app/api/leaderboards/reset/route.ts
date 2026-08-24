import { NextResponse } from 'next/server';
import { platformStore } from '@/lib/data/store';
import { querySQLServer } from '@/lib/db/sqlserver';

export async function POST() {
  try {
    // 1. SQL Server Reset
    try {
      await querySQLServer('DELETE FROM [leaderboards]');
    } catch (dbErr) {
      console.warn('SQL Server weekly leaderboard reset error:', dbErr);
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

