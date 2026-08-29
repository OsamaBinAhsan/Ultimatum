import { NextRequest, NextResponse } from 'next/server';
import sql from 'mssql';
import { getSQLServerPool, querySQLServer } from '@/lib/db/sqlserver';
import { platformStore } from '@/lib/data/store';
import type { ShopItem } from '@/lib/types';

export async function POST(req: NextRequest) {
  let tx: sql.Transaction | null = null;

  try {
    const body = await req.json();
    const { itemId, userId } = body;

    if (!itemId) {
      return NextResponse.json({ success: false, error: 'Missing required parameter: itemId' }, { status: 400 });
    }

    const activeUser = platformStore.getCurrentUser();
    const targetUserId = userId || activeUser?.id || 'user-001';
    const targetUsername = activeUser?.username || 'Player';

    const pool = await getSQLServerPool();

    // -------------------------------------------------------------------------
    // Fallback: In-Memory / Local Storage Store
    // -------------------------------------------------------------------------
    if (!pool || !pool.connected) {
      const res = platformStore.redeemItem(targetUserId, itemId);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: `${res.item?.name || 'Reward'} successfully unlocked!`,
        itemId,
        item: res.item,
        deliveredContent: res.deliveredContent,
        redemption: res.redemption,
        newBalance: res.newBalance,
        source: 'memory_store',
      });
    }

    // -------------------------------------------------------------------------
    // 1. Fetch Item Data from [dbo].[shop_items]
    // -------------------------------------------------------------------------
    const itemRows = await querySQLServer(
      'SELECT TOP 1 [id], [name], [slug], [description], [category], [target_game_id], [slot_type], [tier], [price_coins], [metadata_json], [stock_remaining], [is_active], [is_public] FROM [dbo].[shop_items] WHERE [id] = ? OR [slug] = ?',
      [itemId, itemId]
    );

    if (!itemRows || itemRows.length === 0) {
      return NextResponse.json({ success: false, error: `Item not found in catalog: ${itemId}` }, { status: 404 });
    }

    const item = itemRows[0] as ShopItem;
    const priceCoins = item.price_coins || 0;

    if (!item.is_active || !item.is_public) {
      return NextResponse.json({ success: false, error: 'This item is currently unavailable in the shop.' }, { status: 400 });
    }

    if (item.stock_remaining === 0) {
      return NextResponse.json({ success: false, error: 'This reward item is sold out!' }, { status: 400 });
    }

    // -------------------------------------------------------------------------
    // 2. Start Atomic Transaction with Lock Hints
    // -------------------------------------------------------------------------
    tx = new sql.Transaction(pool);
    await tx.begin();

    // 2a. Ensure player profile exists
    const profileReq = new sql.Request(tx);
    profileReq.input('userId', sql.NVarChar(64), targetUserId);
    profileReq.input('username', sql.NVarChar(64), targetUsername);
    await profileReq.query(`
      IF NOT EXISTS (SELECT 1 FROM [dbo].[player_profiles] WITH (UPDLOCK, ROWLOCK) WHERE [id] = @userId)
      BEGIN
        INSERT INTO [dbo].[player_profiles] ([id], [username], [display_name], [created_at], [updated_at])
        VALUES (@userId, @username, @username, GETUTCDATE(), GETUTCDATE());
      END
    `);

    // 2b. Check Wallet Balance with UPDLOCK & ROWLOCK
    const walletCheckReq = new sql.Request(tx);
    walletCheckReq.input('userId', sql.NVarChar(64), targetUserId);
    const walletRes = await walletCheckReq.query(`
      IF NOT EXISTS (SELECT 1 FROM [dbo].[wallets] WITH (UPDLOCK, ROWLOCK) WHERE [player_id] = @userId)
      BEGIN
        INSERT INTO [dbo].[wallets] ([player_id], [coin_balance], [total_earned], [total_spent], [updated_at])
        VALUES (@userId, 500, 500, 0, GETUTCDATE());
      END

      SELECT [coin_balance] FROM [dbo].[wallets] WITH (UPDLOCK, ROWLOCK) WHERE [player_id] = @userId;
    `);

    const currentCoins = walletRes.recordset[0]?.coin_balance ?? 0;

    if (currentCoins < priceCoins) {
      await tx.rollback();
      return NextResponse.json(
        { success: false, error: `Insufficient coin balance (${currentCoins} / ${priceCoins} required).` },
        { status: 400 }
      );
    }

    // 2c. Check & Claim Unique Serial Code from Pool if voucher or sponsored perk
    let deliveredContent = 'REDEEMED_SUCCESSFULLY';
    let meta: any = {};
    try {
      meta = typeof item.metadata_json === 'string' ? JSON.parse(item.metadata_json) : item.metadata_json;
    } catch {}

    if (item.category === 'SPONSORED_PERK' || item.category === 'AFFILIATE_VOUCHER') {
      const serialReq = new sql.Request(tx);
      serialReq.input('itemId', sql.NVarChar(64), item.id);
      serialReq.input('userId', sql.NVarChar(64), targetUserId);
      const serialRes = await serialReq.query(`
        WITH AvailableSerial AS (
          SELECT TOP 1 [id], [serial_code]
          FROM [dbo].[reward_serials_pool] WITH (UPDLOCK, ROWLOCK)
          WHERE [item_id] = @itemId AND [is_redeemed] = 0
          ORDER BY [id] ASC
        )
        UPDATE AvailableSerial
        SET [is_redeemed] = 1,
            [redeemed_by_user_id] = @userId,
            [redeemed_at] = GETUTCDATE()
        OUTPUT inserted.[serial_code];
      `);

      if (serialRes.recordset && serialRes.recordset.length > 0) {
        deliveredContent = serialRes.recordset[0].serial_code;
      } else {
        deliveredContent = `${item.slug.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
      }
    } else if (item.category === 'DIGITAL_DOWNLOAD') {
      deliveredContent = meta.downloadUrl || '/downloads/reward_package.zip';
    } else {
      deliveredContent = `Equipped ${item.name} into Player Loadout.`;
    }

    // 2d. Deduct Balance
    const deductReq = new sql.Request(tx);
    deductReq.input('userId', sql.NVarChar(64), targetUserId);
    deductReq.input('price', sql.Int, priceCoins);
    await deductReq.query(`
      UPDATE [dbo].[wallets]
      SET [coin_balance] = [coin_balance] - @price,
          [total_spent] = [total_spent] + @price,
          [updated_at] = GETUTCDATE()
      WHERE [player_id] = @userId;
    `);

    // 2e. Update Stock if not unlimited
    if (item.stock_remaining > 0) {
      const stockReq = new sql.Request(tx);
      stockReq.input('itemId', sql.NVarChar(64), item.id);
      await stockReq.query(`
        UPDATE [dbo].[shop_items]
        SET [stock_remaining] = [stock_remaining] - 1
        WHERE [id] = @itemId AND [stock_remaining] > 0;
      `);
    }

    // 2f. Insert into [dbo].[player_inventory] if not exists
    const invReq = new sql.Request(tx);
    invReq.input('userId', sql.NVarChar(64), targetUserId);
    invReq.input('itemId', sql.NVarChar(64), item.id);
    invReq.input('isEquipped', sql.Bit, item.category === 'GAME_LOADOUT' || item.category === 'PROFILE_COSMETIC' ? 1 : 0);
    await invReq.query(`
      IF NOT EXISTS (SELECT 1 FROM [dbo].[player_inventory] WHERE [player_id] = @userId AND [item_id] = @itemId)
      BEGIN
        INSERT INTO [dbo].[player_inventory] ([player_id], [item_id], [is_equipped], [purchased_at])
        VALUES (@userId, @itemId, @isEquipped, GETUTCDATE());
      END
    `);

    // 2g. Insert into [dbo].[player_redemptions]
    const redemptionId = `rdm-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const rdmReq = new sql.Request(tx);
    rdmReq.input('id', sql.NVarChar(64), redemptionId);
    rdmReq.input('userId', sql.NVarChar(64), targetUserId);
    rdmReq.input('itemId', sql.NVarChar(64), item.id);
    rdmReq.input('coins', sql.Int, priceCoins);
    rdmReq.input('delivered', sql.NVarChar(sql.MAX), deliveredContent);
    await rdmReq.query(`
      INSERT INTO [dbo].[player_redemptions] ([id], [player_id], [item_id], [coins_spent], [delivered_content], [redeemed_at])
      VALUES (@id, @userId, @itemId, @coins, @delivered, GETUTCDATE());
    `);

    await tx.commit();

    // Sync memory store
    platformStore.redeemItem(targetUserId, item.id);

    return NextResponse.json({
      success: true,
      message: `${item.name} unlocked successfully!`,
      itemId: item.id,
      item,
      deliveredContent,
      redemption: {
        id: redemptionId,
        player_id: targetUserId,
        item_id: item.id,
        coins_spent: priceCoins,
        delivered_content: deliveredContent,
        redeemed_at: new Date().toISOString(),
      },
      newBalance: currentCoins - priceCoins,
    });
  } catch (error: any) {
    if (tx) {
      try { await tx.rollback(); } catch {}
    }
    console.error('[Shop Purchase API Error]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Transaction failed' }, { status: 500 });
  }
}
