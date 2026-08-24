import { NextRequest, NextResponse } from 'next/server';
import { getSQLServerPool, querySQLServer } from '@/lib/db/sqlserver';

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

    const pool = await getSQLServerPool();
    if (!pool || !pool.connected) {
      return NextResponse.json({
        success: true,
        message: 'Shift payout calculated (Simulated Offline Mode)',
        payout: finalPayout,
        newBalance: finalPayout + 250,
      });
    }

    // 1. Ensure Player Profile Exists
    await querySQLServer(
      `IF NOT EXISTS (SELECT 1 FROM [player_profiles] WHERE [id] = ?)
       BEGIN
         INSERT INTO [player_profiles] ([id], [username], [display_name], [created_at], [updated_at])
         VALUES (?, ?, ?, GETUTCDATE(), GETUTCDATE())
       END
       ELSE
       BEGIN
         UPDATE [player_profiles] SET [updated_at] = GETUTCDATE() WHERE [id] = ?
       END`,
      [playerId, playerId, playerId, playerId, playerId]
    );

    // 2. Ensure Wallet Exists
    await querySQLServer(
      `IF NOT EXISTS (SELECT 1 FROM [wallets] WHERE [player_id] = ?)
       BEGIN
         INSERT INTO [wallets] ([player_id], [coin_balance], [total_earned], [total_spent], [updated_at])
         VALUES (?, 250, 250, 0, GETUTCDATE())
       END`,
      [playerId, playerId]
    );

    // 3. Update Wallet Balance
    await querySQLServer(
      `UPDATE [wallets]
       SET [coin_balance] = [coin_balance] + ?,
           [total_earned] = [total_earned] + ?,
           [updated_at] = GETUTCDATE()
       WHERE [player_id] = ?`,
      [finalPayout, finalPayout, playerId]
    );

    // Fetch updated balance
    const walletRows = await querySQLServer(
      'SELECT TOP 1 [coin_balance], [total_earned] FROM [wallets] WHERE [player_id] = ?',
      [playerId]
    );
    const newBalance = walletRows && walletRows.length > 0 ? walletRows[0].coin_balance : finalPayout + 250;

    // 4. Insert Shift Record
    await querySQLServer(
      `INSERT INTO [kitchen_shifts] ([room_code], [player_id], [orders_served], [orders_burned], [orders_failed], [star_rating], [tips_earned], [is_doubled], [customer_review], [created_at])
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, GETUTCDATE())`,
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

    return NextResponse.json({
      success: true,
      message: `Shift payout of ${finalPayout} coins processed successfully!`,
      payout: finalPayout,
      newBalance,
      starRating,
      isDoubled,
    });
  } catch (error: any) {
    console.error('Shift payout failure:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database error processing payout' },
      { status: 500 }
    );
  }
}

