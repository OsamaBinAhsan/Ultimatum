import { NextRequest, NextResponse } from 'next/server';
import { queryMySQL } from '@/lib/db/mysql';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('post_id') || searchParams.get('contentId');
    const userId = searchParams.get('userId');

    if (userId) {
      const rows = await queryMySQL(
        `SELECT c.*, p.username, p.avatar_url 
         FROM \`user_comments\` c
         LEFT JOIN \`profiles\` p ON c.user_id = p.id
         WHERE c.user_id = ? AND c.is_flagged = 0
         ORDER BY c.created_at DESC LIMIT 50`,
        [userId]
      );
      return NextResponse.json({ success: true, data: rows || [] });
    }

    if (postId) {
      const rows = await queryMySQL(
        `SELECT c.*, p.username, p.avatar_url 
         FROM \`user_comments\` c
         LEFT JOIN \`profiles\` p ON c.user_id = p.id
         WHERE (c.content_id = ? OR c.content_slug = ?) AND c.is_flagged = 0
         ORDER BY c.created_at DESC LIMIT 50`,
        [postId, postId]
      );
      return NextResponse.json({ success: true, data: rows || [] });
    }

    return NextResponse.json(
      { success: false, error: 'post_id or userId parameter is required' },
      { status: 400 }
    );
  } catch (err: unknown) {
    const e = err as Error;
    console.error('Error fetching comments:', e);
    return NextResponse.json(
      { success: false, error: e.message || 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const postId = body.post_id || body.content_id;
    const userId = body.user_id || body.userId;
    const content = body.content || body.body;
    const contentType = body.content_type || body.contentType || 'article';
    const contentSlug = body.content_slug || body.contentSlug || postId || '';

    // Validation
    if (!postId || typeof postId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid post_id' },
        { status: 400 }
      );
    }
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid user_id' },
        { status: 400 }
      );
    }
    if (!content || typeof content !== 'string' || content.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Content must be at least 2 characters long' },
        { status: 400 }
      );
    }
    if (content.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Content cannot exceed 1000 characters' },
        { status: 400 }
      );
    }

    const trimmedContent = content.trim();

    // Execute raw MySQL parameterized insert
    const insertRes = (await queryMySQL(
      `INSERT INTO \`user_comments\` (\`user_id\`, \`content_type\`, \`content_id\`, \`content_slug\`, \`body\`)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, contentType, postId, contentSlug, trimmedContent]
    )) as any;

    const insertedId = insertRes?.insertId || Date.now();

    return NextResponse.json(
      {
        success: true,
        message: 'Comment posted successfully',
        comment: {
          id: insertedId,
          user_id: userId,
          content_type: contentType,
          content_id: postId,
          content_slug: contentSlug,
          body: trimmedContent,
          created_at: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const e = err as Error;
    console.error('Error inserting comment into database:', e);
    return NextResponse.json(
      { success: false, error: e.message || 'Database insert failed' },
      { status: 500 }
    );
  }
}
