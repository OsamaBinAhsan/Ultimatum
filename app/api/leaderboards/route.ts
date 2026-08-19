import { NextResponse } from 'next/server';
import { platformStore } from '@/lib/data/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get('game_id');

  if (isSupabaseConfigured()) {
    let query = supabase.from('leaderboards').select('*, profile:profiles(username, avatar_url, badges)').order('score', { ascending: false });
    if (gameId) {
      query = query.eq('game_id', gameId);
    }
    const { data, error } = await query;
    if (!error && data) {
      return NextResponse.json({ success: true, count: data.length, data });
    }
  }

  const list = platformStore.getLeaderboard(gameId || undefined);
  return NextResponse.json({ success: true, count: list.length, data: list });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { game_id, score, user_id } = body;

    if (!game_id || typeof score !== 'number') {
      return NextResponse.json({ success: false, error: 'Invalid game_id or score' }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      const activeUser = platformStore.getCurrentUser();
      const targetUserId = user_id || activeUser?.id;

      if (targetUserId) {
        const { data, error } = await supabase.from('leaderboards').insert([
          {
            user_id: targetUserId,
            game_id,
            score,
            week_timestamp: new Date().toISOString(),
          },
        ]).select().single();

        if (!error && data) {
          platformStore.submitScore(game_id, score);
          return NextResponse.json({ success: true, data });
        }
      }
    }

    const entry = platformStore.submitScore(game_id, score);
    return NextResponse.json({ success: true, data: entry });
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

    if (isSupabaseConfigured()) {
      await supabase.from('leaderboards').delete().eq('id', scoreId);
    }

    platformStore.deleteLeaderboardScore(scoreId);
    return NextResponse.json({ success: true, message: 'Score deleted' });
  } catch (err: unknown) {
    const errorObj = err as Error;
    return NextResponse.json({ success: false, error: errorObj.message || 'Failed to delete score' }, { status: 500 });
  }
}
