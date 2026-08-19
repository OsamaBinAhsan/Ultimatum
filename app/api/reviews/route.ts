import { NextResponse } from 'next/server';
import { platformStore } from '@/lib/data/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (isSupabaseConfigured()) {
    if (slug) {
      const { data, error } = await supabase.from('reviews').select('*').eq('slug', slug).single();
      if (!error && data) return NextResponse.json({ success: true, data });
    } else {
      const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
      if (!error && data) return NextResponse.json({ success: true, count: data.length, data });
    }
  }

  if (slug) {
    const review = platformStore.getReviewBySlug(slug);
    if (!review) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: review });
  }
  const reviews = platformStore.getReviews();
  return NextResponse.json({ success: true, count: reviews.length, data: reviews });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('reviews').upsert([body]).select().single();
      if (!error && data) {
        platformStore.saveReview(data);
        return NextResponse.json({ success: true, data });
      }
    }

    const saved = platformStore.saveReview(body);
    return NextResponse.json({ success: true, data: saved });
  } catch (err: unknown) {
    const errorObj = err as Error;
    return NextResponse.json({ success: false, error: errorObj.message || 'Failed to save review' }, { status: 500 });
  }
}
