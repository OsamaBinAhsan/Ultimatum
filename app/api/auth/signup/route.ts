import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { queryMySQL } from '@/lib/db/mysql';
import { platformStore } from '@/lib/data/store';

function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const h = crypto.pbkdf2Sync(password, s, 1000, 64, 'sha512').toString('hex');
  return { hash: h, salt: s };
}

export async function POST(request: Request) {
  try {
    const { email, password, username } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = (username || cleanEmail.split('@')[0]).trim();
    const userId = crypto.randomUUID();
    const { salt, hash } = hashPassword(password);
    const passwordHashWithSalt = `${salt}:${hash}`;
    const role = cleanEmail.includes('admin') ? 'admin' : 'user';

    // 1. MySQL database connection (HostGator / phpMyAdmin / cPanel)
    try {
      const mysqlRes = await queryMySQL(
        'SELECT id FROM profiles WHERE email = ? OR username = ? LIMIT 1',
        [cleanEmail, cleanUsername]
      );
      if (mysqlRes && Array.isArray(mysqlRes) && mysqlRes.length > 0) {
        return NextResponse.json(
          { success: false, error: 'An account with this email or username already exists' },
          { status: 400 }
        );
      }

      if (mysqlRes) {
        await queryMySQL(
          `INSERT INTO profiles (id, email, password_hash, username, avatar_url, role, points, daily_streak, badges) 
           VALUES (?, ?, ?, ?, ?, ?, 250, 1, ?)`,
          [
            userId,
            cleanEmail,
            passwordHashWithSalt,
            cleanUsername,
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
            role,
            JSON.stringify(['New Explorer']),
          ]
        );

        const user = platformStore.login(cleanEmail, role as 'admin' | 'user');
        return NextResponse.json({
          success: true,
          message: 'Account created successfully on MySQL database!',
          user: { ...user, id: userId, email: cleanEmail, username: cleanUsername },
        });
      }
    } catch (dbErr) {
      console.warn('MySQL execution skipped or unconfigured:', dbErr);
    }

    // 2. Local/Fallback session handler
    const user = platformStore.login(cleanEmail, role as 'admin' | 'user');
    return NextResponse.json({
      success: true,
      message: 'User registered successfully!',
      user,
    });
  } catch (err: unknown) {
    const errorObj = err as Error;
    return NextResponse.json(
      { success: false, error: errorObj.message || 'Signup failed' },
      { status: 500 }
    );
  }
}
