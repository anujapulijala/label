import { NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { readSession } from '@/src/lib/session';

export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const rows = db.prepare(`
    SELECT r.*
    FROM requests r
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC
  `).all(session.userId);
  const ids = rows.map((r: any) => r.id);
  let assets: any[] = [];
  if (ids.length > 0) {
    const placeholders = ids.map(() => '?').join(',');
    assets = db.prepare(`SELECT * FROM assets WHERE request_id IN (${placeholders})`).all(...ids);
  }
  return NextResponse.json({ items: rows, assets });
}


