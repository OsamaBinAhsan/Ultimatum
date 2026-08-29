import { NextRequest, NextResponse } from 'next/server';
import { querySQLServer } from '@/lib/db/sqlserver';
import { platformStore } from '@/lib/data/store';
import type { ShopItem } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gameId = searchParams.get('gameId');
    const slotType = searchParams.get('slotType');
    const category = searchParams.get('category');

    const poolRows = await querySQLServer(
      `SELECT [id], [name], [slug], [description], [category], [target_game_id], [slot_type], [tier], [price_coins], [metadata_json], [stock_remaining], [is_active], [is_public], [created_at] 
       FROM [dbo].[shop_items] 
       WHERE [is_active] = 1 AND [is_public] = 1
       ${gameId && gameId !== 'all' ? 'AND ([target_game_id] = ? OR [target_game_id] IS NULL)' : ''} 
       ${slotType && slotType !== 'all' ? 'AND [slot_type] = ?' : ''} 
       ${category && category !== 'all' ? 'AND [category] = ?' : ''} 
       ORDER BY [price_coins] ASC`,
      [
        ...(gameId && gameId !== 'all' ? [gameId] : []),
        ...(slotType && slotType !== 'all' ? [slotType] : []),
        ...(category && category !== 'all' ? [category] : [])
      ]
    );

    if (poolRows && poolRows.length > 0) {
      return NextResponse.json({ success: true, items: poolRows });
    }

    // Fallback to in-memory store
    const fallbackItems = platformStore.getShopItems({
      gameId,
      slotType,
      category,
      isPublicOnly: true,
    });

    return NextResponse.json({ success: true, items: fallbackItems, source: 'memory_store' });
  } catch (err: any) {
    const fallbackItems = platformStore.getShopItems();
    return NextResponse.json({ success: true, items: fallbackItems, source: 'memory_store_fallback' });
  }
}
