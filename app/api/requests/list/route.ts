import { NextResponse } from 'next/server';
import { queryMany } from '@/src/lib/db';
import { readSession } from '@/src/lib/session';

export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const rows = await queryMany<any>(`
    SELECT r.*, u.email, u.name
    FROM requests r
    JOIN users u ON u.id = r.user_id
    ORDER BY r.created_at DESC
  `);
  const assets = await queryMany<any>(`SELECT * FROM assets`);
  return NextResponse.json({ items: rows, assets });
}


