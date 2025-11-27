import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { readSession } from '@/src/lib/session';

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { event, color, look, material } = body || {};
  if (!event || !look) {
    return NextResponse.json({ error: 'Event and look are required' }, { status: 400 });
  }
  const stmt = db.prepare(`INSERT INTO requests (user_id, event, colors, look, material, status) VALUES (?, ?, ?, ?, ?, 'pending')`);
  const info = stmt.run(session.userId, event || null, color || null, look || null, material || null);
  return NextResponse.json({ ok: true, id: Number(info.lastInsertRowid) });
}


