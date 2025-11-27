import { NextResponse } from 'next/server';
import { queryMany } from '@/src/lib/db';
import { readSession } from '@/src/lib/session';

export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const rows = await queryMany<any>(`
    SELECT r.*
    FROM requests r
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC
  `, session.userId);
  const ids = rows.map((r: any) => r.id);
  let assets: any[] = [];
  if (ids.length > 0) {
    // Use ANY for Postgres; SQLite wrapper will still accept the IN constructed on the fly
    // For compatibility, run one query per id
    const all: any[] = [];
    for (const id of ids) {
      const part = await queryMany<any>('SELECT * FROM assets WHERE request_id = ?', id);
      all.push(...part);
    }
    assets = all;
  }
  return NextResponse.json({ items: rows, assets });
}


