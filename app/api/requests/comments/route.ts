import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { readSession } from '@/src/lib/session';

export async function GET(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const reqRow = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
  if (!reqRow) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!session.isAdmin && reqRow.user_id !== session.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const rows = db.prepare(`
    SELECT c.*, u.name, u.username
    FROM comments c
    JOIN users u ON u.id = c.user_id
    WHERE c.request_id = ?
    ORDER BY c.created_at ASC
  `).all(id);
  return NextResponse.json({ items: rows });
}

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { requestId, text } = await req.json();
  if (!requestId || !text) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const reqRow = db.prepare('SELECT * FROM requests WHERE id = ?').get(Number(requestId));
  if (!reqRow) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!session.isAdmin && reqRow.user_id !== session.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  db.prepare('INSERT INTO comments (request_id, user_id, text) VALUES (?, ?, ?)').run(Number(requestId), session.userId, String(text));
  return NextResponse.json({ ok: true });
}


