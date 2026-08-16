import { NextResponse } from 'next/server';
import { platformStore } from '@/lib/data/store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  if (slug) {
    const page = platformStore.getPageBySlug(slug);
    if (!page) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: page });
  }
  const pages = platformStore.getPages();
  return NextResponse.json({ success: true, count: pages.length, data: pages });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const saved = platformStore.savePage(body);
    return NextResponse.json({ success: true, data: saved });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Failed to save sub-page' }, { status: 500 });
  }
}
