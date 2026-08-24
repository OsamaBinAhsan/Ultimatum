import { NextResponse } from 'next/server';
import { queryMySQL } from '@/lib/db/mysql';

export async function GET() {
  try {
    const rows = await queryMySQL(
      `SELECT * FROM \`scheduler_log\` ORDER BY \`run_at\` DESC LIMIT 50`
    );
    return NextResponse.json({ success: true, data: rows || [] });
  } catch (err: unknown) {
    const e = err as Error;
    return NextResponse.json({ success: false, error: e.message, data: [] }, { status: 500 });
  }
}
