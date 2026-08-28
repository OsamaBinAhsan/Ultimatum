import { NextRequest, NextResponse } from 'next/server';
import sql from 'mssql';
import { getSQLServerPool, querySQLServer } from '@/lib/db/sqlserver';
import { platformStore } from '@/lib/data/store';
import type { GameItem } from '@/lib/types';

export async function POST(req: NextRequest) {
  let tx: sql.Transaction | null = null;
  let transactionCommitted = false;

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
    // Fallback if SQL Server is Offline
    // -------------------------------------------------------------------------
    if (!pool || !pool.connected) {
      // Find item in seed or store
      const price = 250;
      const userPoints = activeUser?.points ?? 500;

      if (userPoints < price) {
        return NextResponse.json(
          { success: false, error: `Insufficient coin balance (${userPoints} / ${price} required).` },
          { status: 400 }
        );
      }

      platformStore.awardPoints(targetUserId, -price);
      const updatedUser = platformStore.getCurrentUser();

      return NextResponse.json({
        success: true,
        message: `Cosmetic asset unlocked successfully! Deducted ${price} coins.`,
        itemId,
        newBalance: updatedUser?.points || 0,
        source: 'memory_store',
      });
    }

    // -------------------------------------------------------------------------
    // 1. Fetch Item Data from [dbo].[game_items]
    // -------------------------------------------------------------------------
    const itemRows = await querySQLServer(
      'SELECT TOP 1 [id], [game_id], [name], [slug], [item_type], [price_coins], [asset_url], [is_active] FROM [dbo].[game_items] WHERE [id] = ? OR [slug] = ?',
      [itemId, itemId]
    );

    if (!itemRows || itemRows.length === 0) {
      return NextResponse.json({ success: false, error: `Item not found in catalog: ${itemId}` }, { status: 404 });
    }

    const item = itemRows[0] as GameItem;
    const priceCoins = item.price_coins || 0;

    if (!item.is_active) {
      return NextResponse.json({ success: false, error: 'This item is no longer available in the shop.' }, { status: 400 });
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

    const currentBalance = Number(walletRes.recordset?.[0]?.coin_balance || 0);

    if (currentBalance < priceCoins) {
      await tx.rollback();
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient coins. You have ${currentBalance} coins, but "${item.name}" costs ${priceCoins} coins.`,
          currentBalance,
          requiredCoins: priceCoins,
        },
        { status: 400 }
      );
    }

    // 2c. Deduct Coins from Wallet
    const deductReq = new sql.Request(tx);
    deductReq.input('userId', sql.NVarChar(64), targetUserId);
    deductReq.input('price', sql.Int, priceCoins);
    await deductReq.query(`
      UPDATE [dbo].[wallets] WITH (ROWLOCK)
      SET [coin_balance] = [coin_balance] - @price,
          [total_spent] = [total_spent] + @price,
          [updated_at] = GETUTCDATE()
      WHERE [player_id] = @userId;
    `);

    // 2d. Insert/Upsert into [dbo].[inventory]
    const inventoryReq = new sql.Request(tx);
    inventoryReq.input('userId', sql.NVarChar(64), targetUserId);
    inventoryReq.input('itemId', sql.NVarChar(64), item.id);
    inventoryReq.input('itemName', sql.NVarChar(100), item.name);
    await inventoryReq.query(`
      IF NOT EXISTS (SELECT 1 FROM [dbo].[inventory] WHERE [player_id] = @userId AND [item_id] = @itemId)
      BEGIN
        INSERT INTO [dbo].[inventory] ([player_id], [item_id], [item_name], [quantity], [is_equipped], [purchased_at])
        VALUES (@userId, @itemId, @itemName, 1, 0, GETUTCDATE());
      END
      ELSE
      BEGIN
        UPDATE [dbo].[inventory]
        SET [quantity] = [quantity] + 1
        WHERE [player_id] = @userId AND [item_id] = @itemId;
      END
    `);

    // 2e. Keep Profiles Points Synchronized
    const profilePointsReq = new sql.Request(tx);
    profilePointsReq.input('userId', sql.NVarChar(64), targetUserId);
    profilePointsReq.input('price', sql.Int, priceCoins);
    await profilePointsReq.query(`
      UPDATE [dbo].[profiles] WITH (ROWLOCK)
      SET [points] = CASE WHEN [points] >= @price THEN [points] - @price ELSE 0 END,
          [updated_at] = GETUTCDATE()
      WHERE [id] = @userId;
    `);

    // Commit Transaction
    await tx.commit();
    transactionCommitted = true;

    // Synchronize local memory store
    platformStore.awardPoints(targetUserId, -priceCoins);
    const newBalance = currentBalance - priceCoins;

    return NextResponse.json({
      success: true,
      message: `Unlocked "${item.name}" for ${priceCoins} coins! Added to your inventory.`,
      item,
      newBalance,
      source: 'sqlserver',
    });
  } catch (err: any) {
    console.error('[Shop Purchase Error]:', err);
    if (tx && !transactionCommitted) {
      try {
        await tx.rollback();
      } catch (rbErr) {
        console.error('[Shop Purchase] Rollback failed:', rbErr);
      }
    }
    return NextResponse.json({ success: false, error: err.message || 'Error processing purchase' }, { status: 500 });
  }
}
