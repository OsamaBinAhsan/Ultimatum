import { NextResponse } from 'next/server';
import { platformStore } from '@/lib/data/store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get('game_id') || undefined;
  const list = platformStore.getLeaderboard(gameId);
  return NextResponse.json({ success: true, count: list.length, data: list });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { game_id, score } = body;

    if (!game_id || typeof score !== 'number') {
      return NextResponse.json({ success: false, error: 'Invalid game_id or score' }, { status: 400 });
    }

    const entry = platformStore.submitScore(game_id, score);
    return NextResponse.json({ success: true, data: entry });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Failed to submit score' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scoreId = searchParams.get('id');
    if (!scoreId) {
      return NextResponse.json({ success: false, error: 'Score ID required' }, { status: 400 });
    }
    platformStore.deleteLeaderboardScore(scoreId);
    return NextResponse.json({ success: true, message: 'Score deleted' });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Failed to delete score' }, { status: 500 });
  }
}
