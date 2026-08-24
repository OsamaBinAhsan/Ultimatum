import { NextResponse } from 'next/server';
import { querySQLServer } from '@/lib/db/sqlserver';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId required' }, { status: 400 });
    }

    const rows = await querySQLServer(
      `SELECT * FROM [saved_recipes] WHERE [user_id] = ? ORDER BY [saved_at] DESC`,
      [userId]
    );
    return NextResponse.json({ success: true, data: rows || [] });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message, data: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, recipe_id, recipe_slug, recipe_title } = await request.json();
    if (!userId || !recipe_id) {
      return NextResponse.json(
        { success: false, error: 'userId and recipe_id required' },
        { status: 400 }
      );
    }

    await querySQLServer(
      `IF NOT EXISTS (SELECT 1 FROM [saved_recipes] WHERE [user_id] = ? AND [recipe_id] = ?)
       BEGIN
         INSERT INTO [saved_recipes] ([user_id], [recipe_id], [recipe_slug], [recipe_title], [saved_at])
         VALUES (?, ?, ?, ?, GETUTCDATE())
       END`,
      [userId, recipe_id, userId, recipe_id, recipe_slug || '', recipe_title || '']
    );
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const recipeId = searchParams.get('recipeId');
    if (!userId || !recipeId) {
      return NextResponse.json(
        { success: false, error: 'userId and recipeId required' },
        { status: 400 }
      );
    }

    await querySQLServer(
      `DELETE FROM [saved_recipes] WHERE [user_id] = ? AND [recipe_id] = ?`,
      [userId, recipeId]
    );
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

