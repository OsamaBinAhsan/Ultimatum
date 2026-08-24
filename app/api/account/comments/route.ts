import { NextResponse } from 'next/server';
import { querySQLServer } from '@/lib/db/sqlserver';
import { platformStore } from '@/lib/data/store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const contentType = searchParams.get('contentType');
    const contentId = searchParams.get('contentId');

    if (userId) {
      const rows = (await querySQLServer(
        `SELECT TOP 50 * FROM [user_comments] WHERE [user_id] = ? AND [is_flagged] = 0 ORDER BY [created_at] DESC`,
        [userId]
      )) as any[];
      if (rows && rows.length > 0) {
        return NextResponse.json({ success: true, data: rows });
      }
      const local = platformStore.getComments(undefined, undefined, userId);
      return NextResponse.json({ success: true, data: local });
    }

    if (contentType && contentId) {
      const rows = (await querySQLServer(
        `SELECT TOP 50 c.*, p.username, p.avatar_url FROM [user_comments] c
         LEFT JOIN [profiles] p ON c.user_id = p.id
         WHERE c.content_type = ? AND c.content_id = ? AND c.is_flagged = 0
         ORDER BY c.created_at DESC`,
        [contentType, contentId]
      )) as any[];
      if (rows && rows.length > 0) {
        return NextResponse.json({ success: true, data: rows });
      }
      const local = platformStore.getComments(contentId, contentType);
      return NextResponse.json({ success: true, data: local });
    }

    const all = platformStore.getComments();
    return NextResponse.json({ success: true, data: all });
  } catch (err: unknown) {
    const local = platformStore.getComments();
    return NextResponse.json({ success: true, data: local });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, content_type, content_id, content_slug, body } = await request.json();
    if (!userId || !content_type || !content_id || !body) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    if (body.length < 2 || body.length > 1000) {
      return NextResponse.json({ success: false, error: 'Comment must be 2-1000 characters' }, { status: 400 });
    }

    const saved = platformStore.addComment({
      user_id: userId,
      content_type,
      content_id,
      content_slug,
      body,
    });

    try {
      await querySQLServer(
        `INSERT INTO [user_comments] ([user_id], [content_type], [content_id], [content_slug], [body])
         VALUES (?, ?, ?, ?, ?)`,
        [userId, content_type, content_id, content_slug || '', body.trim()]
      );
    } catch {}

    return NextResponse.json({ success: true, comment: saved });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId') || searchParams.get('id');
    const userId = searchParams.get('userId');
    if (!commentId) {
      return NextResponse.json({ success: false, error: 'commentId required' }, { status: 400 });
    }

    platformStore.deleteComment(commentId, userId || undefined);

    try {
      await querySQLServer(
        `DELETE FROM [user_comments] WHERE [id] = ?`,
        [commentId]
      );
    } catch {}

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}


