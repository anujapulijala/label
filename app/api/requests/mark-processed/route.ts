import { NextRequest, NextResponse } from 'next/server';
import { queryOne, run } from '@/src/lib/db';
import { readSession } from '@/src/lib/session';

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await req.json();
  const reqRow = await queryOne<any>('SELECT * FROM requests WHERE id = ?', Number(id));
  if (!reqRow) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (reqRow.user_id !== session.userId && !session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  await run(`UPDATE requests SET status = 'processed' WHERE id = ?`, Number(id));
  return NextResponse.json({ ok: true });
}


