import { NextRequest, NextResponse } from 'next/server';
import { getMySQLPool } from '@/lib/db/mysql';
import mysql from 'mysql2/promise';

interface ShiftPayoutRequestBody {
  roomCode: string;
  playerId: string;
  ordersServed: number;
  ordersBurned: number;
  ordersFailed: number;
  starRating: number;
  tipsEarned: number;
  isDoubled?: boolean;
  customerReview?: string;
}

export async function POST(req: NextRequest) {
  let connection: mysql.PoolConnection | null = null;

  try {
    const body = (await req.json()) as ShiftPayoutRequestBody;
    const {
      roomCode = 'SOLO',
      playerId,
      ordersServed = 0,
      ordersBurned = 0,
      ordersFailed = 0,
      starRating = 5.0,
      tipsEarned = 0,
      isDoubled = false,
      customerReview = '',
    } = body;

    if (!playerId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: playerId' },
        { status: 400 }
      );
    }

    const finalPayout = isDoubled ? tipsEarned * 2 : tipsEarned;

    const pool = getMySQLPool();
    if (!pool) {
      return NextResponse.json({
        success: true,
        message: 'Shift payout calculated (Simulated Offline Mode)',
        payout: finalPayout,
        newBalance: finalPayout + 250,
      });
    }

    try {
      connection = await pool.getConnection();
    } catch (connErr) {
      console.warn('MySQL connection unavailable, falling back to simulated mode:', connErr);
      return NextResponse.json({
        success: true,
        message: 'Shift payout calculated (Simulated Offline Mode - MySQL Service Offline)',
        payout: finalPayout,
        newBalance: finalPayout + 250,
        starRating,
        isDoubled,
      });
    }

    await connection.beginTransaction();

    // 1. Ensure Player Profile Exists
    await connection.execute(
      `INSERT INTO player_profiles (id, username, display_name)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE updated_at = NOW()`,
      [playerId, playerId, playerId]
    );

    // 2. Ensure Wallet Exists & Fetch current balance
    await connection.execute(
      `INSERT INTO wallets (player_id, coin_balance, total_earned)
       VALUES (?, 250, 250)
       ON DUPLICATE KEY UPDATE updated_at = NOW()`,
      [playerId]
    );

    // 3. Lock Wallet for atomic update
    const [walletRows] = await connection.execute<mysql.RowDataPacket[]>(
      'SELECT coin_balance, total_earned FROM wallets WHERE player_id = ? FOR UPDATE',
      [playerId]
    );

    const currentBalance = walletRows && walletRows.length > 0 ? walletRows[0].coin_balance : 250;
    const currentEarned = walletRows && walletRows.length > 0 ? walletRows[0].total_earned : 250;

    const newBalance = currentBalance + finalPayout;
    const newEarned = currentEarned + finalPayout;

    // 4. Update Wallet Balance
    await connection.execute(
      'UPDATE wallets SET coin_balance = ?, total_earned = ?, updated_at = NOW() WHERE player_id = ?',
      [newBalance, newEarned, playerId]
    );

    // 5. Insert Shift Record
    await connection.execute(
      `INSERT INTO kitchen_shifts (room_code, player_id, orders_served, orders_burned, orders_failed, star_rating, tips_earned, is_doubled, customer_review)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        roomCode,
        playerId,
        ordersServed,
        ordersBurned,
        ordersFailed,
        starRating,
        finalPayout,
        isDoubled ? 1 : 0,
        customerReview,
      ]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: `Shift payout of ${finalPayout} coins processed successfully!`,
      payout: finalPayout,
      newBalance,
      starRating,
      isDoubled,
    });
  } catch (error: any) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rbErr) {
        console.error('Error rolling back payout transaction:', rbErr);
      }
    }
    console.error('Shift payout failure:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database error processing payout' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
