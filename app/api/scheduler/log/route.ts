import { NextResponse } from 'next/server';
import { querySQLServer } from '@/lib/db/sqlserver';

export async function GET() {
  try {
    const rows = await querySQLServer(
      `SELECT TOP 50 * FROM [scheduler_log] ORDER BY [executed_at] DESC`
    );
    return NextResponse.json({ success: true, data: rows || [] });
  } catch (err: unknown) {
    const e = err as Error;
    return NextResponse.json({ success: false, error: e.message, data: [] }, { status: 500 });
  }
}

