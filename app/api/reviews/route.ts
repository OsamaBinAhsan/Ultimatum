import { NextResponse } from 'next/server';
import { platformStore } from '@/lib/data/store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
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
    const saved = platformStore.saveReview(body);
    return NextResponse.json({ success: true, data: saved });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Failed to save review' }, { status: 500 });
  }
}
