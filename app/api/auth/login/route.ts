import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/src/lib/db';
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
  if (id.includes('@')) {
    user = await queryOne<any>('SELECT * FROM users WHERE lower(email) = ?', id);
  } else {
    user = await queryOne<any>('SELECT * FROM users WHERE lower(username) = ?', id);
    if (!user) user = await queryOne<any>('SELECT * FROM users WHERE lower(email) = ?', id);
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


