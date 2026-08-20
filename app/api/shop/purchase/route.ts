import { NextRequest, NextResponse } from 'next/server';
import { getMySQLPool } from '@/lib/db/mysql';
import mysql from 'mysql2/promise';

interface PurchaseRequestBody {
  playerId: string;
  itemId: string;
}

export async function POST(req: NextRequest) {
  let connection: mysql.PoolConnection | null = null;

  try {
    const body = (await req.json()) as PurchaseRequestBody;
    const { playerId, itemId } = body;

    if (!playerId || !itemId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: playerId and itemId' },
        { status: 400 }
      );
    }

    const pool = getMySQLPool();
    if (!pool) {
      return NextResponse.json({
        success: true,
        message: 'Item purchased (Simulated Offline Mode)',
        itemId,
        newBalance: 750,
      });
    }

    // Acquire dedicated connection from pool for transaction isolation
    try {
      connection = await pool.getConnection();
    } catch (connErr) {
      console.warn('MySQL connection unavailable, falling back to simulated mode:', connErr);
      return NextResponse.json({
        success: true,
        message: 'Item purchased (Simulated Offline Mode - MySQL Service Offline)',
        itemId,
        newBalance: 750,
      });
    }

    // 1. START ATOMIC TRANSACTION
    await connection.beginTransaction();

    // 2. Query Item Price & Metadata
    const [itemRows] = await connection.execute<mysql.RowDataPacket[]>(
      'SELECT id, name, price FROM shop_items WHERE id = ? FOR UPDATE',
      [itemId]
    );

    if (!itemRows || itemRows.length === 0) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, error: `Shop item '${itemId}' does not exist.` },
        { status: 404 }
      );
    }

    const item = itemRows[0];
    const itemPrice: number = item.price;
    const itemName: string = item.name;

    // 3. Lock & Inspect Player Wallet (SELECT ... FOR UPDATE prevents race conditions)
    const [walletRows] = await connection.execute<mysql.RowDataPacket[]>(
      'SELECT id, coin_balance, total_spent FROM wallets WHERE player_id = ? FOR UPDATE',
      [playerId]
    );

    if (!walletRows || walletRows.length === 0) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, error: `Wallet for player '${playerId}' not found.` },
        { status: 404 }
      );
    }

    const wallet = walletRows[0];
    const currentBalance: number = wallet.coin_balance;
    const currentSpent: number = wallet.total_spent;

    if (currentBalance < itemPrice) {
      await connection.rollback();
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient coin balance. Required: ${itemPrice}, Available: ${currentBalance}`,
          currentBalance,
          required: itemPrice,
        },
        { status: 400 }
      );
    }

    const newBalance = currentBalance - itemPrice;
    const newSpent = currentSpent + itemPrice;

    // 4. Deduct coins from wallet
    await connection.execute(
      'UPDATE wallets SET coin_balance = ?, total_spent = ?, updated_at = NOW() WHERE player_id = ?',
      [newBalance, newSpent, playerId]
    );

    // 5. Add or update item in player inventory
    await connection.execute(
      `INSERT INTO inventory (player_id, item_id, item_name, quantity, is_equipped, purchased_at)
       VALUES (?, ?, ?, 1, TRUE, NOW())
       ON DUPLICATE KEY UPDATE quantity = quantity + 1, purchased_at = NOW()`,
      [playerId, itemId, itemName]
    );

    // 6. COMMIT TRANSACTION
    await connection.commit();

    return NextResponse.json({
      success: true,
      message: `Successfully purchased ${itemName}!`,
      itemId,
      itemName,
      pricePaid: itemPrice,
      newBalance,
    });
  } catch (error: any) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rbErr) {
        console.error('Error rolling back MySQL transaction:', rbErr);
      }
    }
    console.error('Purchase transaction failure:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal database transaction error' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
