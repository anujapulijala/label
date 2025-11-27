import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import bcrypt from 'bcryptjs';
import { createSession } from '@/src/lib/session';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { identifier, email, password } = body || {};
  const id = (identifier || email || '').toLowerCase();
  if (!id || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  let user: any = null;
  // Detect if 'username' column exists to avoid runtime errors during hot-reload before migration
  let hasUsernameCol = false;
  try {
    const cols = db.prepare(`PRAGMA table_info('users')`).all() as Array<{ name: string }>;
    hasUsernameCol = cols.some(c => c.name === 'username');
  } catch {
    hasUsernameCol = false;
  }
  if (id.includes('@')) {
    user = db.prepare('SELECT * FROM users WHERE lower(email) = ?').get(id);
  } else {
    if (hasUsernameCol) {
      user = db.prepare('SELECT * FROM users WHERE lower(username) = ?').get(id);
    }
    if (!user) {
      user = db.prepare('SELECT * FROM users WHERE lower(email) = ?').get(id);
    }
  }
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  await createSession({ userId: user.id, email: user.email, username: user.username ?? undefined, name: user.name, isAdmin: !!user.is_admin });
  return NextResponse.json({ ok: true });
}


