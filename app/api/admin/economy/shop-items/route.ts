import { NextRequest, NextResponse } from 'next/server';
import { querySQLServer } from '@/lib/db/sqlserver';
import { platformStore } from '@/lib/data/store';
import type { ShopItem } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const items = platformStore.getShopItems();
    const enriched = items.map((item) => {
      const serials = platformStore.getSerialsCount(item.id);
      return {
        ...item,
        serials_count: serials.available,
        total_serials: serials.total,
      };
    });
    return NextResponse.json({ success: true, items: enriched });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { item, serialCodes } = body;

    if (!item || !item.name || !item.slug) {
      return NextResponse.json({ success: false, error: 'Name and slug are required' }, { status: 400 });
    }

    const newItem: ShopItem = {
      id: item.id || `item-${Date.now()}`,
      name: item.name,
      slug: item.slug,
      description: item.description || 'Premium Ultimatum Reward item.',
      category: item.category || 'GAME_LOADOUT',
      target_game_id: item.target_game_id || item.game_id || null,
      game_id: item.target_game_id || item.game_id || null,
      slot_type: item.slot_type || null,
      tier: item.tier || 'COMMON',
      price_coins: parseInt(item.price_coins, 10) || 100,
      metadata_json: typeof item.metadata_json === 'string' ? item.metadata_json : JSON.stringify(item.metadata_json || {}),
      stock_remaining: parseInt(item.stock_remaining, 10) ?? -1,
      is_active: item.is_active ?? true,
      is_public: item.is_public ?? true,
      asset_url: item.asset_url || null,
      created_at: new Date().toISOString(),
    };

    platformStore.createShopItem(newItem);

    if (serialCodes && Array.isArray(serialCodes) && serialCodes.length > 0) {
      platformStore.addSerialsPool(newItem.id, serialCodes);
    }

    return NextResponse.json({ success: true, item: newItem });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { item, serialCodes } = body;

    if (!item || !item.id) {
      return NextResponse.json({ success: false, error: 'Item ID is required' }, { status: 400 });
    }

    const updatedItem: ShopItem = {
      ...item,
      metadata_json: typeof item.metadata_json === 'string' ? item.metadata_json : JSON.stringify(item.metadata_json || {}),
      price_coins: parseInt(item.price_coins, 10) || 100,
      stock_remaining: parseInt(item.stock_remaining, 10) ?? -1,
    };

    platformStore.updateShopItem(updatedItem);

    if (serialCodes && Array.isArray(serialCodes) && serialCodes.length > 0) {
      platformStore.addSerialsPool(updatedItem.id, serialCodes);
    }

    return NextResponse.json({ success: true, item: updatedItem });
  } catch (err: any) {
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

    platformStore.deleteShopItem(id);
    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
