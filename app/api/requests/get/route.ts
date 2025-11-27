import { NextRequest, NextResponse } from 'next/server';
import { queryOne, queryMany } from '@/src/lib/db';
import { readSession } from '@/src/lib/session';

export async function GET(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const reqRow = await queryOne<any>('SELECT * FROM requests WHERE id = ?', id);
  if (!reqRow) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!session.isAdmin && reqRow.user_id !== session.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const assets = await queryMany<any>('SELECT * FROM assets WHERE request_id = ? ORDER BY created_at DESC', id);
  return NextResponse.json({ item: reqRow, assets });
}


