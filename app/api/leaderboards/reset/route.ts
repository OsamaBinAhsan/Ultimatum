import { NextResponse } from 'next/server';
import { platformStore } from '@/lib/data/store';

export async function POST() {
  try {
    const result = platformStore.triggerWeeklyReset();
    return NextResponse.json({
      success: true,
      message: 'Weekly leaderboard reset triggered successfully',
      data: result,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Failed to reset leaderboards' }, { status: 500 });
  }
}
