import { NextRequest, NextResponse } from 'next/server';
import sql from 'mssql';
import { getSQLServerPool, querySQLServer } from '@/lib/db/sqlserver';
import { platformStore } from '@/lib/data/store';
import type { ShopItem } from '@/lib/types';

export async function POST(req: NextRequest) {
  let tx: sql.Transaction | null = null;

  try {
    const body = await req.json();
    const { itemId, userId, action = 'equip', gameId } = body;

    if (!itemId) {
      return NextResponse.json({ success: false, error: 'Missing required parameter: itemId' }, { status: 400 });
    }

    const activeUser = platformStore.getCurrentUser();
    const targetUserId = userId || activeUser?.id || 'user-001';

    const pool = await getSQLServerPool();

    // -------------------------------------------------------------------------
    // Fallback: In-Memory / Local Storage Store
    // -------------------------------------------------------------------------
    if (!pool || !pool.connected) {
      if (action === 'unequip') {
        platformStore.unequipItem(targetUserId, itemId);
        return NextResponse.json({
          success: true,
          action: 'unequip',
          itemId,
          loadout: platformStore.getLoadout(targetUserId, gameId),
          source: 'memory_store',
        });
      }

      const res = platformStore.equipItem(targetUserId, itemId);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        action: 'equip',
        itemId,
        loadout: platformStore.getLoadout(targetUserId, gameId),
        source: 'memory_store',
      });
    }

    // -------------------------------------------------------------------------
    // 1. Fetch Item Data from [dbo].[shop_items]
    // -------------------------------------------------------------------------
    const itemRows = await querySQLServer(
      'SELECT TOP 1 [id], [game_id], [slot_type], [name], [slug], [tier], [price_coins], [metadata_json], [is_active] FROM [dbo].[shop_items] WHERE [id] = ? OR [slug] = ?',
      [itemId, itemId]
    );

    if (!itemRows || itemRows.length === 0) {
      return NextResponse.json({ success: false, error: `Item not found: ${itemId}` }, { status: 404 });
    }

    const item = itemRows[0] as ShopItem;

    // -------------------------------------------------------------------------
    // 2. Start Atomic Transaction
    // -------------------------------------------------------------------------
    tx = new sql.Transaction(pool);
    await tx.begin();

    // 2a. Verify ownership in [dbo].[player_inventory]
    const checkOwnReq = new sql.Request(tx);
    checkOwnReq.input('playerId', sql.NVarChar(64), targetUserId);
    checkOwnReq.input('itemId', sql.NVarChar(64), item.id);
    const ownRes = await checkOwnReq.query(
      'SELECT [id], [is_equipped] FROM [dbo].[player_inventory] WITH (UPDLOCK, ROWLOCK) WHERE [player_id] = @playerId AND [item_id] = @itemId'
    );

    if (!ownRes.recordset || ownRes.recordset.length === 0) {
      await tx.rollback();
      return NextResponse.json({ success: false, error: 'You do not own this item.' }, { status: 403 });
    }

    if (action === 'unequip') {
      const unequipReq = new sql.Request(tx);
      unequipReq.input('playerId', sql.NVarChar(64), targetUserId);
      unequipReq.input('itemId', sql.NVarChar(64), item.id);
      await unequipReq.query(
        'UPDATE [dbo].[player_inventory] SET [is_equipped] = 0 WHERE [player_id] = @playerId AND [item_id] = @itemId'
      );
      await tx.commit();

      platformStore.unequipItem(targetUserId, item.id);

      return NextResponse.json({
        success: true,
        action: 'unequip',
        itemId: item.id,
        loadout: platformStore.getLoadout(targetUserId, gameId),
      });
    }

    // 2b. Unequip existing items with matching (slot_type, game_id)
    const unequipOthersReq = new sql.Request(tx);
    unequipOthersReq.input('playerId', sql.NVarChar(64), targetUserId);
    unequipOthersReq.input('slotType', sql.NVarChar(32), item.slot_type);
    unequipOthersReq.input('gameId', sql.NVarChar(64), item.game_id || null);
    await unequipOthersReq.query(`
      UPDATE inv
      SET inv.[is_equipped] = 0
      FROM [dbo].[player_inventory] inv
      INNER JOIN [dbo].[shop_items] si ON inv.[item_id] = si.[id]
      WHERE inv.[player_id] = @playerId
        AND si.[slot_type] = @slotType
        AND (si.[game_id] = @gameId OR (si.[game_id] IS NULL AND @gameId IS NULL));
    `);

    // 2c. Equip target item
    const equipReq = new sql.Request(tx);
    equipReq.input('playerId', sql.NVarChar(64), targetUserId);
    equipReq.input('itemId', sql.NVarChar(64), item.id);
    await equipReq.query(
      'UPDATE [dbo].[player_inventory] SET [is_equipped] = 1 WHERE [player_id] = @playerId AND [item_id] = @itemId'
    );

    await tx.commit();

    platformStore.equipItem(targetUserId, item.id);

    return NextResponse.json({
      success: true,
      action: 'equip',
      itemId: item.id,
      item,
      loadout: platformStore.getLoadout(targetUserId, gameId),
    });
  } catch (error: any) {
    if (tx) {
      try { await tx.rollback(); } catch {}
    }
    console.error('[Shop Equip API Error]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to equip item' }, { status: 500 });
  }
}
