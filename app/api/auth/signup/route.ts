import { NextRequest, NextResponse } from 'next/server';
import { queryOne, run } from '@/src/lib/db';
import bcrypt from 'bcryptjs';
import { createSession } from '@/src/lib/session';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, name, username, password } = body || {};
  if (!email || !name || !username || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const row = await queryOne<{ c: number }>('SELECT COUNT(*) as c FROM users');
    const isFirst = ((row?.c) ?? 0) === 0;
    const info = await run('INSERT INTO users (email, username, name, password_hash, is_admin) VALUES (?, ?, ?, ?, ?)', email.toLowerCase(), username.toLowerCase(), name, passwordHash, isFirst ? 1 : 0);
    await createSession({ userId: Number(info.lastInsertRowid), email, username, name, isAdmin: isFirst });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (String(e.message).includes('UNIQUE')) {
      return NextResponse.json({ error: 'Email or username already registered' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 });
  }
}


