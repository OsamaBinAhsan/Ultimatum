import { NextResponse } from 'next/server';
import { platformStore } from '@/lib/data/store';

export async function GET() {
  const sponsors = platformStore.getSponsors();
  return NextResponse.json({ success: true, count: sponsors.length, data: sponsors });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, sponsor_id } = body;

    if (action === 'impression' && sponsor_id) {
      platformStore.trackImpression(sponsor_id);
      return NextResponse.json({ success: true, message: 'Impression tracked' });
    }

    if (action === 'click' && sponsor_id) {
      platformStore.trackClick(sponsor_id);
      return NextResponse.json({ success: true, message: 'Click tracked' });
    }

    const saved = platformStore.saveSponsor(body);
    return NextResponse.json({ success: true, data: saved });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Failed to process sponsor action' }, { status: 500 });
  }
}
