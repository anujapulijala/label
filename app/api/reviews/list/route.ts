import { NextResponse } from 'next/server';
import { db } from '@/src/lib/db';

export async function GET() {
  const items = db.prepare(`
    SELECT r.*, u.name, u.username
    FROM reviews r
    LEFT JOIN users u ON u.id = r.user_id
    ORDER BY r.created_at DESC
  `).all();
  return NextResponse.json({ items });
}


