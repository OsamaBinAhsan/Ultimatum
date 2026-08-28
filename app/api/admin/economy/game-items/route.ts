import { NextRequest, NextResponse } from 'next/server';
import { getSQLServerPool, querySQLServer } from '@/lib/db/sqlserver';
import type { GameItem, GameItemType } from '@/lib/types';

const SEED_GAME_ITEMS: GameItem[] = [
  {
    id: 'item-001',
    game_id: 'neon-asteroid-blitz',
    name: 'Hyperdrive Cyan Hull',
    slug: 'neon-ship-hyperdrive',
    item_type: 'skin',
    price_coins: 350,
    asset_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    is_active: true,
  },
  {
    id: 'item-002',
    game_id: 'neon-asteroid-blitz',
    name: 'Plasma Overcharge Shield',
    slug: 'blitz-plasma-shield',
    item_type: 'powerup',
    price_coins: 150,
    asset_url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=400&q=80',
    is_active: true,
  },
  {
    id: 'item-003',
    game_id: 'pixel-kitchen-rush',
    name: '24K Golden Spatula',
    slug: 'flame-grill-spatula-gold',
    item_type: 'skin',
    price_coins: 750,
    asset_url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=400&q=80',
    is_active: true,
  },
  {
    id: 'item-004',
    game_id: 'cyber-slicer',
    name: 'Katana Crimson Plasma Blade',
    slug: 'cyber-katana-crimson',
    item_type: 'cosmetic',
    price_coins: 500,
    asset_url: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=400&q=80',
    is_active: true,
  },
];

let inMemoryGameItems = [...SEED_GAME_ITEMS];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gameId = searchParams.get('game_id');
    const pool = await getSQLServerPool();

    if (!pool || !pool.connected) {
      const filtered = gameId
        ? inMemoryGameItems.filter((i) => i.game_id === gameId)
        : inMemoryGameItems;
      return NextResponse.json({ success: true, count: filtered.length, items: filtered, source: 'memory' });
    }

    const query = gameId
      ? `SELECT [id], [game_id], [name], [slug], [item_type], [price_coins], [asset_url], [is_active], [created_at], [updated_at] 
         FROM [dbo].[game_items] 
         WHERE [game_id] = ? 
         ORDER BY [created_at] DESC`
      : `SELECT [id], [game_id], [name], [slug], [item_type], [price_coins], [asset_url], [is_active], [created_at], [updated_at] 
         FROM [dbo].[game_items] 
         ORDER BY [created_at] DESC`;

    const rows = await querySQLServer(query, gameId ? [gameId] : []);
    const items = (rows || []) as GameItem[];

    return NextResponse.json({
      success: true,
      count: items.length,
      items: items.length > 0 ? items : inMemoryGameItems,
      source: items.length > 0 ? 'sqlserver' : 'fallback_seed',
    });
  } catch (err: any) {
    console.error('[Game Items GET Error]:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      game_id,
      name,
      slug,
      item_type = 'skin',
      price_coins = 0,
      asset_url,
      is_active = true,
    } = body;

    if (!name || !slug) {
      return NextResponse.json({ success: false, error: 'Name and slug are required' }, { status: 400 });
    }

    const itemId = id || `item-${Date.now()}`;
    const pool = await getSQLServerPool();

    if (!pool || !pool.connected) {
      const existingIdx = inMemoryGameItems.findIndex((i) => i.id === itemId || i.slug === slug);
      const item: GameItem = {
        id: itemId,
        game_id: game_id || null,
        name,
        slug,
        item_type: item_type as GameItemType,
        price_coins: Number(price_coins),
        asset_url: asset_url || null,
        is_active: Boolean(is_active),
        updated_at: new Date().toISOString(),
      };

      if (existingIdx >= 0) {
        inMemoryGameItems[existingIdx] = item;
      } else {
        inMemoryGameItems.unshift(item);
      }

      return NextResponse.json({ success: true, item, source: 'memory' });
    }

    await querySQLServer(
      `IF EXISTS (SELECT 1 FROM [dbo].[game_items] WHERE [id] = ? OR [slug] = ?)
       BEGIN
         UPDATE [dbo].[game_items]
         SET [game_id] = ?, [name] = ?, [slug] = ?, [item_type] = ?,
             [price_coins] = ?, [asset_url] = ?, [is_active] = ?, [updated_at] = GETUTCDATE()
         WHERE [id] = ? OR [slug] = ?
       END
       ELSE
       BEGIN
         INSERT INTO [dbo].[game_items] ([id], [game_id], [name], [slug], [item_type], [price_coins], [asset_url], [is_active], [created_at], [updated_at])
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, GETUTCDATE(), GETUTCDATE())
       END`,
      [
        // IF EXISTS
        itemId, slug,
        // UPDATE
        game_id || null, name, slug, item_type, Number(price_coins), asset_url || null, is_active ? 1 : 0, itemId, slug,
        // INSERT
        itemId, game_id || null, name, slug, item_type, Number(price_coins), asset_url || null, is_active ? 1 : 0
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Game item saved successfully in SQL Server [dbo].[game_items]',
      item: { id: itemId, game_id, name, slug, item_type, price_coins, asset_url, is_active },
      source: 'sqlserver',
    });
  } catch (err: any) {
    console.error('[Game Items POST Error]:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Item ID is required' }, { status: 400 });
    }

    inMemoryGameItems = inMemoryGameItems.filter((i) => i.id !== id);

    const pool = await getSQLServerPool();
    if (pool && pool.connected) {
      await querySQLServer('DELETE FROM [dbo].[game_items] WHERE [id] = ?', [id]);
    }

    return NextResponse.json({ success: true, message: `Item ${id} deleted successfully` });
  } catch (err: any) {
    console.error('[Game Items DELETE Error]:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
