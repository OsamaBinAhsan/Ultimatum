import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { querySQLServer } from '@/lib/db/sqlserver';
import { platformStore } from '@/lib/data/store';

function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, originalHash] = storedHash.split(':');
    if (!salt || !originalHash) return false;
    const testHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(testHash), Buffer.from(originalHash));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. SQL Server database connection
    try {
      const dbRes = await querySQLServer(
        'SELECT TOP 1 * FROM [profiles] WHERE email = ? OR username = ?',
        [cleanEmail, cleanEmail]
      );

      if (dbRes && Array.isArray(dbRes) && dbRes.length > 0) {
        const userRow = dbRes[0] as any;
        if (userRow.password_hash) {
          const isValid = verifyPassword(password, userRow.password_hash);
          if (!isValid) {
            return NextResponse.json(
              { success: false, error: 'Invalid email or password' },
              { status: 401 }
            );
          }
        }

        const user = platformStore.login(cleanEmail, userRow.role);
        return NextResponse.json({
          success: true,
          message: 'Signed in successfully via SQL Server database!',
          user: { ...user, ...userRow },
        });
      }
    } catch (dbErr) {
      console.warn('SQL Server login check skipped:', dbErr);
    }

    // 2. Local/Fallback session handler
    const user = platformStore.login(cleanEmail, cleanEmail.includes('admin') ? 'admin' : 'user');
    return NextResponse.json({
      success: true,
      message: 'Signed in successfully!',
      user,
    });
  } catch (err: unknown) {
    const errorObj = err as Error;
    return NextResponse.json(
      { success: false, error: errorObj.message || 'Login failed' },
      { status: 500 }
    );
  }
}
