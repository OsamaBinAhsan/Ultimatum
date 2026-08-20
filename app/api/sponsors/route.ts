import { NextResponse } from 'next/server';
import { platformStore } from '@/lib/data/store';
import { queryMySQL } from '@/lib/db/mysql';

export async function GET() {
  try {
    const mysqlRes = await queryMySQL('SELECT * FROM sponsors WHERE is_active = 1 ORDER BY created_at DESC');
    if (mysqlRes && Array.isArray(mysqlRes) && mysqlRes.length > 0) {
      return NextResponse.json({ success: true, count: mysqlRes.length, data: mysqlRes });
    }
  } catch (err) {
    console.warn('MySQL sponsors query skipped:', err);
  }

  const sponsors = platformStore.getSponsors();
  return NextResponse.json({ success: true, count: sponsors.length, data: sponsors });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, sponsor_id } = body;

    if (action === 'impression' && sponsor_id) {
      try {
        await queryMySQL('UPDATE sponsors SET impressions_tracked = impressions_tracked + 1 WHERE id = ?', [sponsor_id]);
      } catch {}
      platformStore.trackImpression(sponsor_id);
      return NextResponse.json({ success: true, message: 'Impression tracked' });
    }

    if (action === 'click' && sponsor_id) {
      try {
        await queryMySQL('UPDATE sponsors SET clicks_tracked = clicks_tracked + 1 WHERE id = ?', [sponsor_id]);
      } catch {}
      platformStore.trackClick(sponsor_id);
      return NextResponse.json({ success: true, message: 'Click tracked' });
    }

    const saved = platformStore.saveSponsor(body);
    return NextResponse.json({ success: true, data: saved });
  } catch (err: unknown) {
    const errorObj = err as Error;
    return NextResponse.json({ success: false, error: errorObj.message || 'Failed to process sponsor action' }, { status: 500 });
  }
}
