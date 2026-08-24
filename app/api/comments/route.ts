import { NextRequest, NextResponse } from 'next/server';
import { querySQLServer } from '@/lib/db/sqlserver';
import { platformStore } from '@/lib/data/store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('post_id') || searchParams.get('contentId') || searchParams.get('content_id');
    const contentSlug = searchParams.get('contentSlug') || searchParams.get('content_slug');
    const contentType = searchParams.get('contentType') || searchParams.get('content_type');
    const userId = searchParams.get('userId') || searchParams.get('user_id');

    if (userId) {
      const rows = (await querySQLServer(
        `SELECT TOP 50 c.*, p.username, p.avatar_url 
         FROM [user_comments] c
         LEFT JOIN [profiles] p ON c.user_id = p.id
         WHERE c.user_id = ? AND c.is_flagged = 0
         ORDER BY c.created_at DESC`,
        [userId]
      )) as any[];
      if (rows && rows.length > 0) {
        return NextResponse.json({ success: true, data: rows, comments: rows });
      }
      const local = platformStore.getComments(undefined, contentType || undefined, userId);
      return NextResponse.json({ success: true, data: local, comments: local });
    }

    if (postId || contentSlug) {
      const idToSearch = postId || contentSlug || '';
      const rows = (await querySQLServer(
        `SELECT TOP 50 c.*, p.username, p.avatar_url 
         FROM [user_comments] c
         LEFT JOIN [profiles] p ON c.user_id = p.id
         WHERE (c.content_id = ? OR c.content_slug = ? OR c.content_slug = ?) AND c.is_flagged = 0
         ORDER BY c.created_at DESC`,
        [idToSearch, idToSearch, contentSlug || idToSearch]
      )) as any[];
      if (rows && rows.length > 0) {
        return NextResponse.json({ success: true, data: rows, comments: rows });
      }
      const local = platformStore.getComments(idToSearch, contentType || undefined);
      return NextResponse.json({ success: true, data: local, comments: local });
    }

    const all = platformStore.getComments(undefined, contentType || undefined);
    return NextResponse.json({ success: true, data: all, comments: all });
  } catch (err: unknown) {
    const e = err as Error;
    console.error('Error fetching comments:', e);
    const local = platformStore.getComments();
    return NextResponse.json({ success: true, data: local, comments: local });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const postId = body.post_id || body.content_id || body.contentId || body.contentSlug || body.content_slug;
    const userId = body.user_id || body.userId || 'user-001';
    const content = body.content || body.body;
    const contentType = body.content_type || body.contentType || 'article';
    const contentSlug = body.content_slug || body.contentSlug || postId || '';
    const username = body.username || body.userName;
    const avatarUrl = body.avatar_url || body.userAvatar;

    // Validation
    if (!postId || typeof postId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid post_id / contentId' },
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

    // 1. Save in Platform Store
    const saved = platformStore.addComment({
      user_id: userId,
      content_type: contentType,
      content_id: postId,
      content_slug: contentSlug,
      body: trimmedContent,
      username,
      avatar_url: avatarUrl,
    });

    // 2. Execute raw SQL Server parameterized insert (optional / best-effort)
    try {
      await querySQLServer(
        `INSERT INTO [user_comments] ([user_id], [content_type], [content_id], [content_slug], [body])
         VALUES (?, ?, ?, ?, ?)`,
        [userId, contentType, postId, contentSlug, trimmedContent]
      );
    } catch (dbErr) {
      console.warn('SQL Server comment insert skipped:', dbErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Comment posted successfully',
        data: saved,
        comment: saved,
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

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get('commentId') || searchParams.get('id');
    const userId = searchParams.get('userId') || searchParams.get('user_id');

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

    return NextResponse.json({ success: true, message: 'Comment deleted' });
  } catch (err: unknown) {
    const e = err as Error;
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}


