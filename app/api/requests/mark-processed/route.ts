import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { readSession } from '@/src/lib/session';

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await req.json();
  const reqRow = db.prepare('SELECT * FROM requests WHERE id = ?').get(Number(id));
  if (!reqRow) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (reqRow.user_id !== session.userId && !session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  db.prepare(`UPDATE requests SET status = 'processed' WHERE id = ?`).run(Number(id));
  return NextResponse.json({ ok: true });
}


