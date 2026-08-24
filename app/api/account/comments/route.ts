import { NextResponse } from 'next/server';
import { queryMySQL } from '@/lib/db/mysql';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const contentType = searchParams.get('contentType');
    const contentId = searchParams.get('contentId');

    if (userId) {
      const rows = await queryMySQL(
        `SELECT * FROM \`user_comments\` WHERE \`user_id\` = ? AND \`is_flagged\` = 0 ORDER BY \`created_at\` DESC LIMIT 50`,
        [userId]
      );
      return NextResponse.json({ success: true, data: rows || [] });
    }

    if (contentType && contentId) {
      const rows = await queryMySQL(
        `SELECT c.*, p.username, p.avatar_url FROM \`user_comments\` c
         LEFT JOIN \`profiles\` p ON c.user_id = p.id
         WHERE c.content_type = ? AND c.content_id = ? AND c.is_flagged = 0
         ORDER BY c.created_at DESC LIMIT 50`,
        [contentType, contentId]
      );
      return NextResponse.json({ success: true, data: rows || [] });
    }

    return NextResponse.json(
      { success: false, error: 'userId or contentType+contentId required' },
      { status: 400 }
    );
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message, data: [] }, { status: 500 });
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

    await queryMySQL(
      `INSERT INTO \`user_comments\` (\`user_id\`, \`content_type\`, \`content_id\`, \`content_slug\`, \`body\`)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, content_type, content_id, content_slug || '', body.trim()]
    );
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');
    const userId = searchParams.get('userId');
    if (!commentId || !userId) {
      return NextResponse.json({ success: false, error: 'commentId and userId required' }, { status: 400 });
    }

    await queryMySQL(
      `DELETE FROM \`user_comments\` WHERE \`id\` = ? AND \`user_id\` = ?`,
      [commentId, userId]
    );
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
