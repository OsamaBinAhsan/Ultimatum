import { NextRequest, NextResponse } from 'next/server';
import { querySQLServer } from '@/lib/db/sqlserver';
import { platformStore } from '@/lib/data/store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || platformStore.getCurrentUser()?.id || 'user-001';

    const poolRows = await querySQLServer(
      `SELECT r.[id], r.[player_id], r.[item_id], r.[coins_spent], r.[delivered_content], r.[redeemed_at],
              s.[name] as item_name, s.[category] as item_category, s.[tier] as item_tier, s.[metadata_json]
       FROM [dbo].[player_redemptions] r
       INNER JOIN [dbo].[shop_items] s ON r.[item_id] = s.[id]
       WHERE r.[player_id] = ?
       ORDER BY r.[redeemed_at] DESC`,
      [userId]
    );

    if (poolRows && poolRows.length > 0) {
      return NextResponse.json({ success: true, redemptions: poolRows });
    }

    const memoryRedemptions = platformStore.getRedemptions(userId);
    return NextResponse.json({ success: true, redemptions: memoryRedemptions, source: 'memory_store' });
  } catch (err: any) {
    const memoryRedemptions = platformStore.getRedemptions('user-001');
    return NextResponse.json({ success: true, redemptions: memoryRedemptions, source: 'memory_store' });
  }
}
