import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { queryMySQL } from '@/lib/db/mysql';
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

    // 1. MySQL database connection (HostGator / phpMyAdmin)
    try {
      const mysqlRes = await queryMySQL(
        'SELECT * FROM profiles WHERE email = ? OR username = ? LIMIT 1',
        [cleanEmail, cleanEmail]
      );

      if (mysqlRes && Array.isArray(mysqlRes) && mysqlRes.length > 0) {
        const userRow = mysqlRes[0] as any;
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
          message: 'Signed in successfully via MySQL database!',
          user: { ...user, ...userRow },
        });
      }
    } catch (dbErr) {
      console.warn('MySQL login check skipped:', dbErr);
    }

    // 2. Supabase connection fallback
    if (isSupabaseConfigured()) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`email.eq.${cleanEmail},username.eq.${cleanEmail}`)
        .single();

      if (error || !profile) {
        return NextResponse.json(
          { success: false, error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      if (profile.password_hash) {
        const isValid = verifyPassword(password, profile.password_hash);
        if (!isValid) {
          return NextResponse.json(
            { success: false, error: 'Invalid email or password' },
            { status: 401 }
          );
        }
      }

      platformStore.login(cleanEmail, profile.role);
      return NextResponse.json({
        success: true,
        message: 'Signed in successfully!',
        user: profile,
      });
    }

    // 3. Local/Fallback session handler
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
